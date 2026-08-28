import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { SmartIntakeModal } from '../components/SmartIntakeModal';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { DuplicateWarningModal } from '../components/DuplicateWarningModal';
import { CameraCapture } from '../components/CameraCapture';
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
  // Start required selects empty so the user must make a real choice.
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isHighValue, setIsHighValue] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [hiddenDetails, setHiddenDetails] = useState('');
  const [building, setBuilding] = useState('');
  const [roomArea, setRoomArea] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoMode, setPhotoMode] = useState('url'); // 'url' or 'camera'

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

  // ─── VALIDATION ERROR STATE ────────────────────────────────────────────────
  // These flags keep validation feedback visible after a blocked navigation attempt.
  const [showStep1Error, setShowStep1Error] = useState(false);
  const [showStep2Error, setShowStep2Error] = useState(false);
  const [showStep3Error, setShowStep3Error] = useState(false);

  // ─── COMPUTED VALIDATION — derived from form state, recalculated every render ──
  // A pasted URL must be an actual HTTP(S) image URL, rather than arbitrary text.
  const isValidImageUrl = (value) => {
    const url = value.trim();
    if (url.startsWith('data:image/')) return true;
    try {
      const parsedUrl = new URL(url);
      const isHttpUrl = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
      const hasImageExtension = /\.(avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(parsedUrl.pathname + parsedUrl.search);
      const isUnsplashImage = parsedUrl.hostname.endsWith('unsplash.com');
      return isHttpUrl && (hasImageExtension || isUnsplashImage);
    } catch {
      return false;
    }
  };

  // Step 1 needs a camera file or a valid image URL (demo photos use URLs).
  const step1Valid = !!photoFile || isValidImageUrl(photoUrl);

  // Step 2 needs every field that is labelled with an asterisk.
  const step2Valid = !!(title.trim() && category.trim() && description.trim());

  // Step 3 is valid if building is selected, room/area is filled, and a timestamp is set.
  const step3Valid = !!(building.trim() && roomArea.trim() && timestamp);

  // ─── GATED STEP NAVIGATION ─────────────────────────────────────────────────
  // Called when the user clicks a step tab directly (e.g. jumping from 1 to 3).
  // Blocks forward navigation if earlier steps are incomplete.
  const handleStepClick = (targetStep) => {
    if (targetStep > 1 && !step1Valid) {
      // User tried to jump past Step 1 without a photo
      setShowStep1Error(true);
      setCurrentStep(1); // force them back to Step 1
      return;
    }
    if (targetStep > 2 && !step2Valid) {
      // User tried to jump past Step 2 without title/description
      setShowStep2Error(true);
      setCurrentStep(2); // force them back to Step 2
      return;
    }
    // All prerequisite steps are valid — allow navigation
    setCurrentStep(targetStep);
  };

  const samplePhotos = [
    { label: 'JanSport Backpack', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', cat: 'Bags & Backpacks', title: 'Black JanSport Backpack with Stickers', highVal: false, serial: '' },
    { label: 'Pacific Blue iPhone', url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80', cat: 'Electronics & Phones', title: 'iPhone 14 Pro in Pacific Blue Case', highVal: true, serial: 'IMEI-8832-9910-PRO' },
    { label: 'White Hydro Flask', url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80', cat: 'Bottles & Containers', title: 'White Hydro Flask 32oz', highVal: false, serial: '' },
    { label: 'Subaru Car Keys', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80', cat: 'Keys & IDs', title: 'Subaru Car Key with Stanford Lanyard', highVal: false, serial: '' }
  ];

  const handlePhotoSelect = (sample) => {
    setPhotoUrl(sample.url);
    setPhotoFile(null); // Reset file if selecting preset
    setShowStep1Error(false);
    setTitle(sample.title);
    setCategory(sample.cat);
    if (sample.highVal) setIsHighValue(true);
    if (sample.serial) setSerialNumber(sample.serial);
    runVisionAnalysis({ customPhotoUrl: sample.url, titleHint: sample.title, catHint: sample.cat });
  };

  const runVisionAnalysis = async (options = {}) => {
    const { fileObj = null, titleHint = '', catHint = '', customPhotoUrl = '' } = options;
    setAnalyzingPhoto(true);
    try {
      let payload;
      const targetPhotoUrl = customPhotoUrl || photoUrl;
      const targetTitle = titleHint || title;
      const targetCategory = catHint || category;

      if (fileObj) {
        // Build FormData for file uploads
        payload = new FormData();
        payload.append('photo', fileObj);
        payload.append('title', targetTitle);
        payload.append('category', targetCategory);
      } else {
        // Use JSON for text URL analysis
        payload = {
          photoUrl: targetPhotoUrl,
          title: targetTitle,
          category: targetCategory
        };
      }

      const res = await api.analyzePhoto(payload);
      
      // If a file was uploaded and returned a saved path, store that as our photo URL
      if (res.photoUrl && fileObj) {
        setPhotoUrl(res.photoUrl);
      }

      if (res.tags) setAutoTags(res.tags);
      if (res.dominantColor) setVisualColor(res.dominantColor);
      if (res.brandGuess) setVisualBrand(res.brandGuess);
      if (res.category?.includes('Phone') || res.category?.includes('Electronic')) {
        setIsHighValue(true);
      }
    } catch (e) {
      console.error('Vision analysis error:', e);
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  // Camera event handlers passed down to CameraCapture component
  const handleCameraPhoto = (dataUrl, file) => {
    setPhotoUrl(dataUrl);
    setPhotoFile(file);
    setShowStep1Error(false);
    runVisionAnalysis({ fileObj: file });
  };

  // A normal file upload is valid only when the browser identifies it as an image.
  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setPhotoUrl(URL.createObjectURL(file)); // Lets the user preview the uploaded image.
    setPhotoFile(file); // Lets the API receive the original image file on submit.
    setShowStep1Error(false);
    runVisionAnalysis({ fileObj: file });
  };

  const handleCameraClear = () => {
    setPhotoUrl('');
    setPhotoFile(null);
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

    // Final validation gate before submission — covers all 3 steps.
    if (!step1Valid) {
      showToast('Please add a photo in Step 1 before submitting.', 'error');
      setShowStep1Error(true);
      setCurrentStep(1);
      return;
    }
    if (!step2Valid) {
      showToast('Please complete every required field in Step 2.', 'error');
      setShowStep2Error(true);
      setCurrentStep(2);
      return;
    }
    if (!step3Valid) {
      showToast('Please complete the location and time in Step 3.', 'error');
      setShowStep3Error(true);
      setCurrentStep(3);
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

      let data;
      if (photoFile) {
        // Submit as FormData for multi-part file uploads
        data = new FormData();
        data.append('user_id', currentUser?.id || 'user-alex');
        data.append('type', type);
        data.append('title', title.trim());
        data.append('description', description.trim());
        data.append('category', category);
        data.append('location', locationString);
        data.append('building', building);
        
        const latVal = building === 'Main Library' ? 37.4275 : building === 'Student Union / Dining Hall' ? 37.4289 : building === 'Computer Science Building' ? 37.4300 : 37.4265;
        const lngVal = building === 'Main Library' ? -122.1697 : building === 'Student Union / Dining Hall' ? -122.1720 : building === 'Computer Science Building' ? -122.1735 : -122.1705;
        
        data.append('lat', latVal);
        data.append('lng', lngVal);
        data.append('timestamp', new Date(timestamp).toISOString());
        data.append('item_details_hidden', hiddenDetails.trim());
        data.append('auto_tags', JSON.stringify(autoTags));
        data.append('visual_color', visualColor);
        data.append('visual_brand', visualBrand);
        data.append('serial_number', serialNumber.trim());
        data.append('is_high_value', isHighValue ? 1 : 0);
        data.append('photo', photoFile); // Append raw image binary
      } else {
        // Fall back to simple JSON payload if a URL is provided
        data = {
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
      }

      const res = await api.createReport(data);

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
    { num: 1, label: '📷 Photo',    icon: Camera,    isValid: step1Valid },
    { num: 2, label: '📝 Details',  icon: FileText,  isValid: step2Valid },
    { num: 3, label: '📍 Location', icon: MapPin,    isValid: step3Valid },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* ── Wizard Progress Bar ── */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800/60">
        <div className="flex items-center gap-2">
          {wizardSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.num;
            // GREEN = the step's fields are actually filled in (real-time check),
            // NOT just "the user has been here before".
            // The checkmark always comes from current form data, never navigation history.
            const isDone = step.isValid;
            return (
              <React.Fragment key={step.num}>
                <button
                  type="button"
                  onClick={() => handleStepClick(step.num)}
                  className={`flex-1 min-h-[48px] px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-bold ${
                    isDone
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : isActive
                      ? 'bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-lg'
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

          {/* Photo Mode Switcher Tabs */}
          <div className="flex border-b border-slate-800/80 mb-4 bg-slate-900/20 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setPhotoMode('url')}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                photoMode === 'url'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🔗 Paste Image URL</span>
            </button>
            <button
              type="button"
              onClick={() => setPhotoMode('camera')}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                photoMode === 'camera'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📷 Take Photo</span>
            </button>
          </div>

          {/* Photo Preview & Input Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Left Column: Visual Viewport (Show preview or the live camera) */}
            <div className="w-full">
              {photoMode === 'camera' ? (
                <CameraCapture 
                  onPhotoCaptured={handleCameraPhoto} 
                  onClear={handleCameraClear} 
                />
              ) : (
                <div className="aspect-video w-full rounded-2xl bg-slate-900/80 border border-slate-800/60 overflow-hidden flex items-center justify-center group shadow-md">
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="text-center text-slate-600 p-4">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-40" />
                      <span className="text-sm font-bold">No photo URL specified</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: URL Input (if URL mode) & AI Visual Tags */}
            <div className="space-y-4">
              {photoMode === 'url' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
                    Photo URL
                  </label>
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => {
                      const url = e.target.value;
                      setPhotoUrl(url);
                      setPhotoFile(null);
                      runVisionAnalysis({ customPhotoUrl: url });
                    }}
                    placeholder="Paste image URL..."
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500"
                  />
                  {photoUrl.trim() && !isValidImageUrl(photoUrl) && (
                    <p className="text-xs text-rose-300">Enter a valid image URL (for example, a .jpg, .png, or Unsplash image URL).</p>
                  )}
                  <label className="block pt-2 text-xs font-black text-slate-300 uppercase tracking-wider">
                    Or upload an image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-campus-600 file:px-3 file:py-2 file:font-bold file:text-white hover:file:bg-campus-500"
                  />
                </div>
              )}

              {/* AI Auto-Detected Tags Panel */}
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 shadow-sm">
                <div className="flex items-center justify-between text-xs font-black mb-3">
                  <span className="text-purple-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-ai-purple animate-pulse" />
                    AI Auto-Detected Tags
                  </span>
                  {analyzingPhoto && (
                    <div className="flex items-center gap-1.5 text-campus-400 font-bold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {autoTags.length > 0 ? (
                    autoTags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 rounded-xl bg-purple-950/45 text-purple-300 text-xs font-bold border border-purple-500/20 shadow-sm"
                      >
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      Upload/capture a photo to detect tags automatically.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step 1 validation error — shown after user attempts to proceed without a photo */}
          {!step1Valid && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-sm font-semibold animate-slideUp">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Please add a photo before continuing — select a demo photo, paste an image URL, or capture one with your camera.
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (!step1Valid) {
                  // Block navigation and reveal the error message
                  setShowStep1Error(true);
                  return;
                }
                // Photo is present — advance to Step 2
                setShowStep1Error(false);
                setCurrentStep(2);
              }}
              disabled={!step1Valid}
              className={`btn-primary flex items-center space-x-2 transition-all ${
                !step1Valid ? 'opacity-60 cursor-not-allowed' : ''
              }`}
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
              {!title.trim() && <p className="mt-1 text-xs text-rose-300">Item Title is required.</p>}
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
                <option value="" disabled>Select a category</option>
                <option value="Bags & Backpacks">Bags & Backpacks</option>
                <option value="Electronics & Phones">Electronics & Phones</option>
                <option value="Bottles & Containers">Bottles & Containers</option>
                <option value="Keys & IDs">Keys & IDs</option>
                <option value="Clothing & Accessories">Clothing & Accessories</option>
                <option value="Books & Stationery">Books & Stationery</option>
              </select>
              {!category.trim() && <p className="mt-1 text-xs text-rose-300">Category is required.</p>}
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
            {!description.trim() && <p className="text-xs text-rose-300">Detailed Description is required.</p>}
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

          {/* Step 2 validation error — shown when title or description are empty */}
          {showStep2Error && !step2Valid && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-sm font-semibold animate-slideUp">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Please fill in every required Details field before continuing.
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-3">
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
              onClick={() => {
                if (!step2Valid) {
                  // Block navigation and reveal specific field errors
                  setShowStep2Error(true);
                  return;
                }
                // Details are filled — advance to Step 3
                setShowStep2Error(false);
                setCurrentStep(3);
              }}
              disabled={!step2Valid}
              className={`btn-primary flex items-center space-x-2 ${
                !step2Valid ? 'opacity-60 cursor-not-allowed' : ''
              }`}
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
                <option value="" disabled>Select a building or facility</option>
                <option value="Main Library">Main Library</option>
                <option value="Student Union / Dining Hall">Student Union / Dining Hall</option>
                <option value="Computer Science Building">Computer Science Building</option>
                <option value="Engineering Quad">Engineering Quad</option>
                <option value="Sports & Recreation Complex">Sports & Recreation Complex</option>
              </select>
              {!building.trim() && <p className="mt-1 text-xs text-rose-300">Building / Facility is required.</p>}
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
              {!roomArea.trim() && <p className="mt-1 text-xs text-rose-300">Room / Floor / Area is required.</p>}
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
            {!timestamp && <p className="mt-1 text-xs text-rose-300">Approximate Date & Time is required.</p>}
          </div>

          {showStep3Error && !step3Valid && (
            <p className="text-sm font-semibold text-rose-300">Please fill in Building, Room / Floor / Area, and Date & Time before submitting.</p>
          )}

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
              disabled={submitting || !step3Valid}
              title={!step3Valid ? 'Please fill in Building, Room/Area, and Date & Time' : ''}
              className={`w-full sm:w-auto min-h-[52px] px-8 py-3.5 rounded-2xl font-extrabold text-base text-white flex items-center justify-center space-x-2 transition-all animate-borderGlow ${
                !step3Valid ? 'opacity-60 cursor-not-allowed' : ''
              }`}
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
