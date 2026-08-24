import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { SmartIntakeModal } from '../components/SmartIntakeModal';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { DuplicateWarningModal } from '../components/DuplicateWarningModal';
import {
  Camera,
  Sparkles,
  MapPin,
  Clock,
  Tag,
  ShieldCheck,
  Check,
  Loader2,
  Bot,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Star,
  FileText,
  HelpCircle,
  CheckCircle2,
  Image
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ReportItemPage = ({ onReportCreated, onViewExistingReport }) => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const { showToast } = useNotification();

  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [type, setType] = useState('lost');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Bags & Backpacks');
  const [description, setDescription] = useState('');
  const [isHighValue, setIsHighValue] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [hiddenDetails, setHiddenDetails] = useState('');
  const [building, setBuilding] = useState('Main Library');
  const [roomArea, setRoomArea] = useState('2nd Floor Silent Study Desks');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [photoUrl, setPhotoUrl] = useState('');

  // AI Vision state
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [autoTags, setAutoTags] = useState(['backpack', 'jansport', 'black', 'zipper']);
  const [visualColor, setVisualColor] = useState('Black');
  const [visualBrand, setVisualBrand] = useState('JanSport');

  // Smart Intake Modal state
  const [smartModalOpen, setSmartModalOpen] = useState(false);
  const [smartQuestions, setSmartQuestions] = useState([]);
  const [smartSuggestion, setSmartSuggestion] = useState('');
  const [loadingIntake, setLoadingIntake] = useState(false);

  // Duplicate Check Modal State
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [detectedDuplicate, setDetectedDuplicate] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const samplePhotos = [
    { label: 'JanSport Backpack', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', cat: 'Bags & Backpacks', title: 'Black JanSport Backpack with Stickers', highVal: false, serial: '' },
    { label: 'Pacific Blue iPhone', url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80', cat: 'Electronics & Phones', title: 'iPhone 14 Pro in Pacific Blue Case', highVal: true, serial: 'IMEI-8832-9910-PRO' },
    { label: 'White Hydro Flask', url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80', cat: 'Bottles & Containers', title: 'White Hydro Flask 32oz', highVal: false, serial: '' },
    { label: 'Subaru Car Keys', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80', cat: 'Keys & IDs', title: 'Subaru Car Key with Stanford Lanyard', highVal: false, serial: '' }
  ];

  const handlePhotoSelect = (sample) => {
    setPhotoUrl(sample.url);
    setTitle(sample.title);
    setCategory(sample.cat);
    if (sample.highVal) setIsHighValue(true);
    if (sample.serial) setSerialNumber(sample.serial);
    runVisionAnalysis(sample.title, sample.cat);
  };

  const runVisionAnalysis = async (titleHint, catHint) => {
    setAnalyzingPhoto(true);
    try {
      const res = await api.analyzePhoto({
        photoUrl,
        title: titleHint || title,
        category: catHint || category
      });
      if (res.tags) setAutoTags(res.tags);
      if (res.dominantColor) setVisualColor(res.dominantColor);
      if (res.brandGuess) setVisualBrand(res.brandGuess);
      if (res.category?.includes('Phone') || res.category?.includes('Electronic')) {
        setIsHighValue(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const openSmartIntake = async () => {
    setLoadingIntake(true);
    try {
      const res = await api.getSmartIntake({
        title: title || 'Campus item',
        description: description || 'Lost on campus',
        category
      });
      setSmartQuestions(res.questions || []);
      setSmartSuggestion(res.suggestion || '');
      setSmartModalOpen(true);
    } catch (err) {
      console.error(err);
      setSmartModalOpen(true);
    } finally {
      setLoadingIntake(false);
    }
  };

  const handleVoiceTranscript = (transcriptText) => {
    setDescription(prev => (prev ? `${prev} ${transcriptText}` : transcriptText));
    showToast('🎙️ Voice input transcribed into description!', 'success');
  };

  const handleProceedSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!title.trim() || !description.trim()) {
      showToast('Please fill out the title and description in Step 2.', 'error');
      setCurrentStep(2);
      return;
    }

    try {
      setSubmitting(true);

      const dupCheck = await api.checkDuplicate({
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        building,
        lat: building === 'Main Library' ? 37.4275 : building === 'Student Union / Dining Hall' ? 37.4289 : building === 'Computer Science Building' ? 37.4300 : 37.4265,
        lng: building === 'Main Library' ? -122.1697 : building === 'Student Union / Dining Hall' ? -122.1720 : building === 'Computer Science Building' ? -122.1735 : -122.1705,
        visual_color: visualColor,
        visual_brand: visualBrand
      });

      if (dupCheck.isDuplicate && dupCheck.duplicateItem) {
        setDetectedDuplicate(dupCheck.duplicateItem);
        setDuplicateModalOpen(true);
        setSubmitting(false);
        return;
      }

      await executeSaveReport();
    } catch (err) {
      console.error('Submit error:', err);
      showToast('Failed to check report. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  const executeSaveReport = async () => {
    try {
      setSubmitting(true);
      const locationString = `${building}, ${roomArea}`;

      const payload = {
        user_id: currentUser?.id || 'user-alex',
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        location: locationString,
        building,
        lat: building === 'Main Library' ? 37.4275 : building === 'Student Union / Dining Hall' ? 37.4289 : building === 'Computer Science Building' ? 37.4300 : 37.4265,
        lng: building === 'Main Library' ? -122.1697 : building === 'Student Union / Dining Hall' ? -122.1720 : building === 'Computer Science Building' ? -122.1735 : -122.1705,
        timestamp: new Date(timestamp).toISOString(),
        photo_url: photoUrl || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
        item_details_hidden: hiddenDetails.trim(),
        auto_tags: JSON.stringify(autoTags),
        visual_color: visualColor,
        visual_brand: visualBrand,
        serial_number: serialNumber.trim(),
        is_high_value: isHighValue ? 1 : 0
      };

      const res = await api.createReport(payload);

      showToast(`✨ Report filed! +20 Karma Points. AI found ${res.matchCount} candidate match(es).`, 'success');

      if (onReportCreated) {
        onReportCreated(res.report);
      }
    } catch (err) {
      console.error('Create report error:', err);
      showToast('Error saving report.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const wizardSteps = [
    { num: 1, label: '📷 Photo', icon: Camera },
    { num: 2, label: '📝 Details', icon: FileText },
    { num: 3, label: '📍 Location', icon: MapPin }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* ── Premium Wizard Progress Bar ── */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800/60">
        <div className="flex items-center gap-2">
          {wizardSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.num;
            const isDone = currentStep > step.num;
            return (
              <React.Fragment key={step.num}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.num)}
                  className={`flex-1 min-h-[48px] px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-bold ${
                    isActive
                      ? 'bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-lg'
                      : isDone
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.num}</span>
                </button>
                {idx < wizardSteps.length - 1 && (
                  <div className={`w-8 h-0.5 rounded-full shrink-0 ${isDone ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── STEP 1: PHOTO & TYPE ── */}
      {currentStep === 1 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/60 space-y-6 animate-slideUp">
          <div>
            <span className="text-xs font-bold text-campus-400 uppercase tracking-wider">Step 1 of 3</span>
            <h3 className="text-2xl font-black text-white mt-1">What are you reporting?</h3>
            <p className="text-sm text-slate-400 mt-1">Choose if this item was lost or found, and add a picture.</p>
          </div>

          {/* Type Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('lost')}
              className={`min-h-[64px] p-4 rounded-2xl border-2 flex items-center space-x-3 transition-all ${
                type === 'lost'
                  ? 'bg-gradient-to-r from-rose-950/50 to-rose-900/30 border-rose-500 text-rose-200 shadow-lg shadow-rose-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span className="text-2xl">🔴</span>
              <div className="text-left">
                <p className="text-base font-extrabold">I Lost Something</p>
                <p className="text-xs opacity-70">Help me find my item</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('found')}
              className={`min-h-[64px] p-4 rounded-2xl border-2 flex items-center space-x-3 transition-all ${
                type === 'found'
                  ? 'bg-gradient-to-r from-emerald-950/50 to-emerald-900/30 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span className="text-2xl">🟢</span>
              <div className="text-left">
                <p className="text-base font-extrabold">I Found Something</p>
                <p className="text-xs opacity-70">Help return it safely</p>
              </div>
            </button>
          </div>

          {/* Sample Photos */}
          <div className="space-y-3 pt-3 border-t border-slate-800/60">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Quick Demo Photos:
            </label>
            <div className="flex flex-wrap gap-2">
              {samplePhotos.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePhotoSelect(s)}
                  className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                    photoUrl === s.url
                      ? 'bg-campus-600/20 text-campus-300 border-campus-500/50 shadow-sm'
                      : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Image className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Preview & Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            <div className="aspect-video w-full rounded-2xl bg-slate-900/80 border border-slate-800/60 overflow-hidden flex items-center justify-center group">
              {photoUrl ? (
                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="text-center text-slate-600 p-4">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <span className="text-sm font-semibold">No photo selected</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => {
                  setPhotoUrl(e.target.value);
                  runVisionAnalysis();
                }}
                placeholder="Paste image URL..."
                className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500"
              />
              <div className="p-4 rounded-xl glass-card-static border border-slate-800/60">
                <div className="flex items-center justify-between text-xs font-bold mb-2.5">
                  <span className="text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-ai-purple" />
                    AI Auto-Detected Tags
                  </span>
                  {analyzingPhoto && <Loader2 className="w-3.5 h-3.5 animate-spin text-campus-400" />}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {autoTags.map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-purple-950/50 text-purple-300 text-[11px] font-semibold border border-purple-500/25">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="btn-primary flex items-center space-x-2"
            >
              <span>Next: Add Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: DETAILS ── */}
      {currentStep === 2 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/60 space-y-6 animate-slideUp">
          <div>
            <span className="text-xs font-bold text-campus-400 uppercase tracking-wider">Step 2 of 3</span>
            <h3 className="text-2xl font-black text-white mt-1">Describe the Item</h3>
            <p className="text-sm text-slate-400 mt-1">Type or speak your description. Add serial number for high-value items.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">Item Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Black JanSport Backpack"
                required
                className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-base text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">Category *</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value.includes('Phone') || e.target.value.includes('Electronic')) {
                    setIsHighValue(true);
                  }
                }}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-base text-white bg-slate-900 border border-slate-800"
              >
                <option value="Bags & Backpacks">Bags & Backpacks</option>
                <option value="Electronics & Phones">Electronics & Phones</option>
                <option value="Bottles & Containers">Bottles & Containers</option>
                <option value="Keys & IDs">Keys & IDs</option>
                <option value="Clothing & Accessories">Clothing & Accessories</option>
                <option value="Books & Stationery">Books & Stationery</option>
              </select>
            </div>
          </div>

          {/* Description & Voice */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-bold text-slate-200">Detailed Description *</label>
              <div className="flex items-center space-x-2">
                <VoiceInputButton
                  onTranscript={handleVoiceTranscript}
                  currentLanguage={i18n.language}
                />
                <button
                  type="button"
                  onClick={openSmartIntake}
                  disabled={loadingIntake}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all text-white"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #0170c7 100%)' }}
                >
                  <Bot className="w-4 h-4" />
                  <span>✨ AI Enrich</span>
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe color, brand, stickers, keychains, scratches, or speak using the microphone..."
              required
              className="w-full p-4 rounded-2xl glass-input text-base text-white placeholder-slate-500 leading-relaxed"
            />
          </div>

          {/* High-Value Flag */}
          <div className="p-5 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-950/30 to-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHighValue}
                  onChange={(e) => setIsHighValue(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900"
                />
                <span className="text-sm font-extrabold text-amber-200 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  High-Value Item (Laptop, Phone, Jewelry, Wallet)
                </span>
              </label>
              <span className="text-[10px] text-amber-300/80 font-bold bg-amber-900/50 px-2 py-0.5 rounded-full border border-amber-500/25">
                Extra Security
              </span>
            </div>

            {isHighValue && (
              <div className="pt-3 border-t border-amber-500/15 space-y-2 animate-fadeIn">
                <label className="block text-xs font-bold text-amber-200">
                  Serial Number / IMEI (exact match guarantees ~100% verification):
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. IMEI-8832-9910-PRO or Serial #C02G..."
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500"
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="btn-ghost flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="btn-primary flex items-center space-x-2"
            >
              <span>Next: Location & Time</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: LOCATION & SUBMIT ── */}
      {currentStep === 3 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/60 space-y-6 animate-slideUp">
          <div>
            <span className="text-xs font-bold text-campus-400 uppercase tracking-wider">Step 3 of 3</span>
            <h3 className="text-2xl font-black text-white mt-1">Campus Location & Time</h3>
            <p className="text-sm text-slate-400 mt-1">Where was the item left or found?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">Building / Facility *</label>
              <select
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-base text-white bg-slate-900 border border-slate-800"
              >
                <option value="Main Library">Main Library</option>
                <option value="Student Union / Dining Hall">Student Union / Dining Hall</option>
                <option value="Computer Science Building">Computer Science Building</option>
                <option value="Engineering Quad">Engineering Quad</option>
                <option value="Sports & Recreation Complex">Sports & Recreation Complex</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">Room / Floor / Area *</label>
              <input
                type="text"
                value={roomArea}
                onChange={(e) => setRoomArea(e.target.value)}
                placeholder="e.g. 2nd Floor Study Desks"
                required
                className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-base text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">Approximate Date & Time *</label>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              required
              className="w-full sm:w-80 min-h-[48px] px-4 py-3 rounded-xl glass-input text-base text-white bg-slate-900 border border-slate-800"
            />
          </div>

          {/* Anti-Fraud Details */}
          <div className="p-5 rounded-2xl border border-campus-500/20 bg-gradient-to-r from-campus-950/40 to-slate-900/60 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-campus-300">
              <ShieldCheck className="w-4 h-4 text-campus-400" />
              <span>Hidden Verification Details (Private — Not Shown Publicly)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Secret details only you know (lockscreen wallpaper, inside contents, scratches) to verify ownership.
            </p>
            <input
              type="text"
              value={hiddenDetails}
              onChange={(e) => setHiddenDetails(e.target.value)}
              placeholder="e.g. Orange carabiner on strap, Calculus notes inside..."
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500"
            />
          </div>

          {/* Final Submit */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="w-full sm:w-auto btn-ghost flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleProceedSubmit}
              disabled={submitting}
              className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 rounded-2xl font-extrabold text-base text-white disabled:opacity-50 flex items-center justify-center space-x-2 transition-all animate-borderGlow"
              style={{ background: 'linear-gradient(135deg, #0170c7 0%, #8b5cf6 50%, #d946ef 100%)', boxShadow: '0 8px 24px -6px rgba(139,92,246,0.4)' }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI Scanning for Matches...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Submit & Scan for Matches (+20 pts)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Smart Intake Modal */}
      <SmartIntakeModal
        isOpen={smartModalOpen}
        onClose={() => setSmartModalOpen(false)}
        questions={smartQuestions}
        suggestion={smartSuggestion}
        onApply={(enriched, hints) => {
          setDescription(prev => (prev ? `${prev}\n${enriched}` : enriched));
          if (hints) setHiddenDetails(prev => (prev ? `${prev}, ${hints}` : hints));
        }}
      />

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        duplicateItem={detectedDuplicate}
        onConfirmSubmit={executeSaveReport}
        onViewExisting={(item) => {
          setDuplicateModalOpen(false);
          if (onViewExistingReport) onViewExistingReport(item);
        }}
      />
    </div>
  );
};
