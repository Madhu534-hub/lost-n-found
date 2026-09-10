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
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isHighValue, setIsHighValue] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [hiddenDetails, setHiddenDetails] = useState('');
  
  // Location States (Predefined + Custom Input options)
  const [building, setBuilding] = useState('');
  const [customBuilding, setCustomBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [customFloor, setCustomFloor] = useState('');
  const [area, setArea] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [locationDetails, setLocationDetails] = useState('');

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

  // Effective values helper
  const effectiveCategory = category === 'Other' ? customCategory.trim() : category.trim();
  const effectiveBuilding = building === 'Other' ? customBuilding.trim() : building.trim();
  const effectiveFloor = floor === 'Other' ? customFloor.trim() : floor.trim();
  const effectiveArea = area === 'Other' ? customArea.trim() : area.trim();
  const effectiveLocationDetails = locationDetails.trim();

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
  const step2Valid = !!(title.trim() && effectiveCategory && description.trim());

  // Step 3 is valid if building is selected/entered, floor/area/details provided, and a timestamp is set.
  const step3Valid = !!(effectiveBuilding && (effectiveFloor || effectiveArea || effectiveLocationDetails) && timestamp);

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
    setCustomCategory('');
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

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    setPhotoFile(file);
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

      const effCategory = category === 'Other' ? customCategory.trim() : category.trim();
      const effBuilding = building === 'Other' ? customBuilding.trim() : building.trim();

      // 1. Optional duplicate check (gracefully fails if backend is offline)
      try {
        const dupCheck = await api.checkDuplicate({
          type,
          title: title.trim(),
          description: description.trim(),
          category: effCategory,
          building: effBuilding,
          lat: effBuilding === 'Main Library' ? 37.4275 : effBuilding === 'Student Union / Dining Hall' ? 37.4289 : effBuilding === 'Computer Science Building' ? 37.4300 : 37.4265,
          lng: effBuilding === 'Main Library' ? -122.1697 : effBuilding === 'Student Union / Dining Hall' ? -122.1720 : effBuilding === 'Computer Science Building' ? -122.1735 : -122.1705,
          visual_color: visualColor,
          visual_brand: visualBrand
        });

        if (dupCheck?.isDuplicate && dupCheck?.duplicateItem) {
          setDetectedDuplicate(dupCheck.duplicateItem);
          setDuplicateModalOpen(true);
          setSubmitting(false);
          return;
        }
      } catch (dupErr) {
        console.warn('Duplicate check warning:', dupErr);
      }

      // 2. Save report to Supabase DB
      await executeSaveReport();
    } catch (err) {
      console.error('Submit error:', err);
      showToast(err.message || 'Failed to submit report. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  const executeSaveReport = async () => {
    try {
      setSubmitting(true);
      const effCategory = category === 'Other' ? customCategory.trim() : category.trim();
      const effBuilding = building === 'Other' ? customBuilding.trim() : building.trim();
      const effFloor = floor === 'Other' ? customFloor.trim() : floor.trim();
      const effArea = area === 'Other' ? customArea.trim() : area.trim();
      const effDetails = locationDetails.trim();

      const locParts = [effBuilding, effFloor, effArea].filter(Boolean);
      let locationString = locParts.join(', ');
      if (effDetails) {
        locationString = locationString ? `${locationString} (${effDetails})` : effDetails;
      }

      let data;
      if (photoFile) {
        // Submit as FormData for multi-part file uploads
        data = new FormData();
        data.append('user_id', currentUser?.id || '');
        data.append('type', type);
        data.append('title', title.trim());
        data.append('description', description.trim());
        data.append('category', effCategory);
        data.append('location', locationString);
        data.append('building', effBuilding);
        
        const latVal = effBuilding === 'Main Library' ? 37.4275 : effBuilding === 'Student Union / Dining Hall' ? 37.4289 : effBuilding === 'Computer Science Building' ? 37.4300 : 37.4265;
        const lngVal = effBuilding === 'Main Library' ? -122.1697 : effBuilding === 'Student Union / Dining Hall' ? -122.1720 : effBuilding === 'Computer Science Building' ? -122.1735 : -122.1705;
        
        data.append('lat', latVal);
        data.append('lng', lngVal);
        data.append('timestamp', new Date(timestamp).toISOString());
        // Ownership details belong only to a Lost report. A Finder must never
        // be asked for, or store, the Loser's private verification detail.
        if (type === 'lost') data.append('item_details_hidden', hiddenDetails.trim());
        data.append('auto_tags', JSON.stringify(autoTags));
        data.append('visual_color', visualColor);
        data.append('visual_brand', visualBrand);
        data.append('serial_number', serialNumber.trim());
        data.append('is_high_value', isHighValue ? 1 : 0);
        data.append('photo', photoFile); // Append raw image binary
        if (photoUrl) data.append('photo_url', photoUrl);
      } else {
        // Fall back to simple JSON payload if a URL is provided
        data = {
          user_id: currentUser?.id || '',
          type,
          title: title.trim(),
          description: description.trim(),
          category: effCategory,
          location: locationString,
          building: effBuilding,
          lat: effBuilding === 'Main Library' ? 37.4275 : effBuilding === 'Student Union / Dining Hall' ? 37.4289 : effBuilding === 'Computer Science Building' ? 37.4300 : 37.4265,
          lng: effBuilding === 'Main Library' ? -122.1697 : effBuilding === 'Student Union / Dining Hall' ? -122.1720 : effBuilding === 'Computer Science Building' ? -122.1735 : -122.1705,
          timestamp: new Date(timestamp).toISOString(),
          photo_url: photoUrl || '',
          ...(type === 'lost' ? { item_details_hidden: hiddenDetails.trim() } : {}),
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
      showToast(err.message || 'Error saving report. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const wizardSteps = [
    { num: 1, label: 'Photo & Type', shortLabel: 'Photo', icon: Camera, isValid: step1Valid },
    { num: 2, label: 'Item Details', shortLabel: 'Details', icon: FileText, isValid: step2Valid },
    { num: 3, label: 'Location & Time', shortLabel: 'Location', icon: MapPin, isValid: step3Valid },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-24 sm:pb-16">
      {/* ── Mobile Step Indicator Header (● ○ ○) ── */}
      <div className="glass-panel p-4 sm:p-4 rounded-2xl border border-slate-800/80 shadow-md">
        {/* Mobile Header: Step X of 3 + Dots */}
        <div className="flex items-center justify-between sm:hidden pb-3 mb-3 border-b border-slate-800/80">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-campus-400">
              Step {currentStep} of 3
            </span>
            <h2 className="text-base font-extrabold text-white">
              {wizardSteps[currentStep - 1]?.label}
            </h2>
          </div>
          {/* Visual Progress Dots */}
          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
            <span className={`w-2.5 h-2.5 rounded-full transition-all ${currentStep >= 1 ? 'bg-campus-400 shadow-glow-primary scale-110' : 'bg-slate-700'}`} />
            <span className={`w-2.5 h-2.5 rounded-full transition-all ${currentStep >= 2 ? 'bg-campus-400 shadow-glow-primary scale-110' : 'bg-slate-700'}`} />
            <span className={`w-2.5 h-2.5 rounded-full transition-all ${currentStep >= 3 ? 'bg-campus-400 shadow-glow-primary scale-110' : 'bg-slate-700'}`} />
          </div>
        </div>

        {/* Desktop & Mobile Interactive Stepper Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {wizardSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.num;
            const isDone = step.isValid;
            return (
              <React.Fragment key={step.num}>
                <button
                  type="button"
                  onClick={() => handleStepClick(step.num)}
                  className={`flex-1 min-h-[44px] sm:min-h-[48px] px-2.5 sm:px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all text-xs sm:text-sm font-extrabold ${
                    isDone
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : isActive
                      ? 'bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-lg'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/40'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Icon className="w-4 h-4 shrink-0" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden font-bold">{step.shortLabel}</span>
                </button>
                {idx < wizardSteps.length - 1 && (
                  <div className={`w-4 sm:w-8 h-0.5 rounded-full shrink-0 ${isDone ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── STEP 1: PHOTO & TYPE ── */}
      {currentStep === 1 && (
        <div className="glass-panel p-4 sm:p-8 rounded-3xl border border-slate-800/60 space-y-5 sm:space-y-6 animate-slideUp">
          <div>
            <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-campus-400 uppercase tracking-wider mb-1">
              <span>Step 1 of 3</span>
              <span>•</span>
              <span>● ○ ○</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">What are you reporting?</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Choose if this item was lost or found, and add a picture.</p>
          </div>

          {/* Type Toggle — Full Width Cards for Single-Hand Tap */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setType('lost')}
              className={`min-h-[64px] p-4 rounded-2xl border-2 flex items-center space-x-3 transition-all ${
                type === 'lost'
                  ? 'bg-gradient-to-r from-rose-950/60 to-rose-900/40 border-rose-500 text-rose-100 shadow-lg shadow-rose-500/15'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-xl shrink-0">
                🔴
              </div>
              <div className="text-left">
                <p className="text-sm sm:text-base font-black">I Lost Something</p>
                <p className="text-xs opacity-75">Help me find my missing item</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('found')}
              className={`min-h-[64px] p-4 rounded-2xl border-2 flex items-center space-x-3 transition-all ${
                type === 'found'
                  ? 'bg-gradient-to-r from-emerald-950/60 to-emerald-900/40 border-emerald-500 text-emerald-100 shadow-lg shadow-emerald-500/15'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                🟢
              </div>
              <div className="text-left">
                <p className="text-sm sm:text-base font-black">I Found Something</p>
                <p className="text-xs opacity-75">Help return it safely (+Karma)</p>
              </div>
            </button>
          </div>

          {/* Photo Source Switcher Tabs */}
          <div className="space-y-3 pt-2 border-t border-slate-800/60">
            <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
              Add Item Image
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => setPhotoMode('camera')}
                className={`min-h-[42px] px-2 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  photoMode === 'camera'
                    ? 'bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5 shrink-0" />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setPhotoMode('upload')}
                className={`min-h-[42px] px-2 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  photoMode === 'upload'
                    ? 'bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Image className="w-3.5 h-3.5 shrink-0" />
                <span>Gallery Upload</span>
              </button>

              <button
                type="button"
                onClick={() => setPhotoMode('presets')}
                className={`min-h-[42px] px-2 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  photoMode === 'presets'
                    ? 'bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Quick Demo</span>
              </button>

              <button
                type="button"
                onClick={() => setPhotoMode('url')}
                className={`min-h-[42px] px-2 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  photoMode === 'url'
                    ? 'bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🔗 Paste URL</span>
              </button>
            </div>
          </div>

          {/* Photo Mode Viewport */}
          <div className="space-y-4">
            {/* Mode 1: Camera Capture */}
            {photoMode === 'camera' && (
              <CameraCapture 
                onPhotoCaptured={handleCameraPhoto} 
                onClear={handleCameraClear} 
              />
            )}

            {/* Mode 2: Gallery Upload */}
            {photoMode === 'upload' && (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-700/80 bg-slate-900/40 text-center flex flex-col items-center justify-center space-y-3 hover:border-campus-500/50 transition-all">
                  <div className="w-12 h-12 rounded-full bg-campus-600/20 text-campus-400 flex items-center justify-center">
                    <Image className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-white">Choose a photo from your device</p>
                    <p className="text-xs text-slate-400 mt-0.5">Supports PNG, JPG, WEBP formats</p>
                  </div>
                  <label className="cursor-pointer min-h-[44px] px-5 py-2.5 rounded-xl font-extrabold text-xs bg-campus-600 hover:bg-campus-500 text-white shadow-glow-primary transition-all flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    <span>Select Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {photoUrl && (
                  <div className="relative aspect-video w-full rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-md">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleCameraClear}
                      className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-slate-950/80 text-xs font-bold text-rose-300 border border-rose-500/30"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mode 3: Quick Demo Photos */}
            {photoMode === 'presets' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">Tap a sample photo below to load demo data:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {samplePhotos.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePhotoSelect(s)}
                      className={`min-h-[50px] p-3 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
                        photoUrl === s.url
                          ? 'bg-campus-600/20 text-white border-campus-500 shadow-sm ring-1 ring-campus-500/50'
                          : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800/60'
                      }`}
                    >
                      <img src={s.url} alt={s.label} className="w-10 h-10 rounded-xl object-cover bg-slate-950 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold truncate">{s.label}</p>
                        <p className="text-[10px] text-campus-300">{s.cat}</p>
                      </div>
                      {photoUrl === s.url && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 4: Paste Image URL */}
            {photoMode === 'url' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                    Image Web Address (URL)
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
                    placeholder="https://example.com/item.jpg"
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500 scroll-mt-keyboard"
                  />
                  {photoUrl.trim() && !isValidImageUrl(photoUrl) && (
                    <p className="mt-1 text-xs text-rose-300">Enter a valid image URL (.jpg, .png, or Unsplash URL).</p>
                  )}
                </div>

                {photoUrl && isValidImageUrl(photoUrl) && (
                  <div className="aspect-video w-full rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-md">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}

            {/* AI Auto-Detected Tags Card */}
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/70 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-ai-purple animate-pulse" />
                  Gemini Vision Auto-Detected Tags
                </span>
                {analyzingPhoto && (
                  <div className="flex items-center gap-1.5 text-campus-400 font-bold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {autoTags.length > 0 ? (
                  autoTags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 rounded-xl bg-purple-950/50 text-purple-300 text-[11px] font-bold border border-purple-500/25 shadow-sm"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">
                    Add or take a photo to detect tags automatically.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Validation Alert */}
          {!step1Valid && showStep1Error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs sm:text-sm font-semibold animate-slideUp">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Please select a demo photo, take a picture, or upload an image before continuing.</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (!step1Valid) {
                  setShowStep1Error(true);
                  return;
                }
                setShowStep1Error(false);
                setCurrentStep(2);
              }}
              disabled={!step1Valid}
              className={`btn-primary min-h-[52px] w-full sm:w-auto flex items-center justify-center space-x-2 transition-all ${
                !step1Valid ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <span>Next: Describe Item</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: DETAILS ── */}
      {currentStep === 2 && (
        <div className="glass-panel p-4 sm:p-8 rounded-3xl border border-slate-800/60 space-y-5 sm:space-y-6 animate-slideUp">
          <div>
            <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-campus-400 uppercase tracking-wider mb-1">
              <span>Step 2 of 3</span>
              <span>•</span>
              <span>● ● ○</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">Describe the Item</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Type or speak your description. Add serial number for high-value items.</p>
          </div>

          {/* One-Column Layout on Mobile, Two-Column on Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                Item Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Black JanSport Backpack"
                required
                className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-sm sm:text-base text-white placeholder-slate-500 scroll-mt-keyboard"
              />
              {!title.trim() && showStep2Error && <p className="mt-1 text-xs text-rose-300">Item Title is required.</p>}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value.includes('Phone') || e.target.value.includes('Electronic')) {
                    setIsHighValue(true);
                  }
                }}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-sm sm:text-base text-white bg-slate-900 border border-slate-800 scroll-mt-keyboard"
              >
                <option value="" disabled>Select a category</option>
                <option value="Bags & Backpacks">Bags &amp; Backpacks</option>
                <option value="Electronics & Phones">Electronics &amp; Phones</option>
                <option value="Bottles & Containers">Bottles &amp; Containers</option>
                <option value="Keys & IDs">Keys &amp; IDs</option>
                <option value="Clothing & Accessories">Clothing &amp; Accessories</option>
                <option value="Books & Stationery">Books &amp; Stationery</option>
                <option value="Other">Other</option>
              </select>
              {category === 'Other' && (
                <div className="mt-2.5 animate-fadeIn">
                  <label className="block text-xs font-semibold text-campus-300 mb-1">Enter category name</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category"
                    required
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500 scroll-mt-keyboard"
                  />
                </div>
              )}
              {!effectiveCategory && showStep2Error && <p className="mt-1 text-xs text-rose-300">Category is required.</p>}
            </div>
          </div>

          {/* Description & Voice / AI Controls */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-200">
                Detailed Description *
              </label>
              <div className="flex items-center space-x-2">
                <VoiceInputButton
                  onTranscript={handleVoiceTranscript}
                  currentLanguage={i18n.language}
                />
                <button
                  type="button"
                  onClick={openSmartIntake}
                  disabled={loadingIntake}
                  className="min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all text-white shadow-sm"
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
              className="w-full p-4 rounded-2xl glass-input text-sm sm:text-base text-white placeholder-slate-500 leading-relaxed scroll-mt-keyboard"
            />
            {!description.trim() && showStep2Error && <p className="text-xs text-rose-300">Detailed Description is required.</p>}
          </div>

          {/* Private Ownership Verification (Lost only) */}
          {type === 'lost' && (
            <div className="p-4 sm:p-5 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/30 to-slate-900/60 space-y-2.5">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-violet-200">
                    🔒 Private Ownership Details <span className="text-slate-400 font-semibold text-xs ml-1">(Optional)</span>
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                    Add details that only the true owner is likely to know. Used for anti-fraud verification and NOT shown publicly.
                  </p>
                </div>
              </div>
              <textarea
                rows={2}
                value={hiddenDetails}
                onChange={(e) => setHiddenDetails(e.target.value)}
                placeholder="e.g. Small red keychain attached to the left strap, or specific student ID inside."
                className="w-full p-3.5 rounded-xl glass-input text-xs sm:text-sm text-white placeholder-slate-500 leading-relaxed scroll-mt-keyboard"
              />
              {hiddenDetails.trim() && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Private detail saved for verification quiz.
                </p>
              )}
            </div>
          )}

          {/* High-Value Item Flag */}
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-950/30 to-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHighValue}
                  onChange={(e) => setIsHighValue(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900"
                />
                <span className="text-xs sm:text-sm font-extrabold text-amber-200 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  High-Value Item (Laptop, Phone, Jewelry, Wallet)
                </span>
              </label>
              <span className="text-[10px] text-amber-300/80 font-bold bg-amber-900/50 px-2 py-0.5 rounded-full border border-amber-500/25 shrink-0 ml-2">
                Extra Security
              </span>
            </div>

            {isHighValue && (
              <div className="pt-2.5 border-t border-amber-500/15 space-y-1.5 animate-fadeIn">
                <label className="block text-xs font-bold text-amber-200">
                  Serial Number / IMEI (exact match guarantees ~100% verification):
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. IMEI-8832-9910-PRO or Serial #C02G..."
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm text-white placeholder-slate-500 scroll-mt-keyboard"
                />
              </div>
            )}
          </div>

          {/* Validation Alert */}
          {showStep2Error && !step2Valid && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs sm:text-sm font-semibold animate-slideUp">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Please fill in the Item Title, Category, and Description before continuing.</span>
            </div>
          )}

          {/* Navigation Buttons: Responsive Stack on Mobile */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="w-full sm:w-auto min-h-[48px] btn-ghost flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!step2Valid) {
                  setShowStep2Error(true);
                  return;
                }
                setShowStep2Error(false);
                setCurrentStep(3);
              }}
              disabled={!step2Valid}
              className={`w-full sm:w-auto min-h-[52px] btn-primary flex items-center justify-center space-x-2 ${
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
        <div className="glass-panel p-4 sm:p-8 rounded-3xl border border-slate-800/60 space-y-5 sm:space-y-6 animate-slideUp">
          <div>
            <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-campus-400 uppercase tracking-wider mb-1">
              <span>Step 3 of 3</span>
              <span>•</span>
              <span>● ● ●</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">Campus Location & Time</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Where and when was the item left or found?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Building Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">Building *</label>
              <select
                value={building}
                onChange={(e) => {
                  setBuilding(e.target.value);
                  if (e.target.value !== 'Other') setCustomBuilding('');
                }}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-sm sm:text-base text-white bg-slate-900 border border-slate-800 scroll-mt-keyboard"
              >
                <option value="" disabled>Select Building</option>
                <option value="Main Library">Main Library</option>
                <option value="College Canteen">College Canteen</option>
                <option value="Block B">Block B</option>
                <option value="Block C - Computer Lab">Block C - Computer Lab</option>
                <option value="Student Union / Dining Hall">Student Union / Dining Hall</option>
                <option value="Computer Science Building">Computer Science Building</option>
                <option value="Engineering Quad">Engineering Quad</option>
                <option value="Sports & Recreation Complex">Sports & Recreation Complex</option>
                <option value="Near Basketball Court">Near Basketball Court</option>
                <option value="Other">Other / Enter manually</option>
              </select>
              {building === 'Other' && (
                <div className="mt-2.5 animate-fadeIn">
                  <label className="block text-xs font-semibold text-campus-300 mb-1">Enter building name</label>
                  <input
                    type="text"
                    value={customBuilding}
                    onChange={(e) => setCustomBuilding(e.target.value)}
                    placeholder="Enter building name"
                    required
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500 scroll-mt-keyboard"
                  />
                </div>
              )}
              {!effectiveBuilding && showStep3Error && <p className="mt-1 text-xs text-rose-300">Building is required.</p>}
            </div>

            {/* Floor Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">Floor</label>
              <select
                value={floor}
                onChange={(e) => {
                  setFloor(e.target.value);
                  if (e.target.value !== 'Other') setCustomFloor('');
                }}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-sm sm:text-base text-white bg-slate-900 border border-slate-800 scroll-mt-keyboard"
              >
                <option value="">Select Floor (Optional)</option>
                <option value="Ground Floor">Ground Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="Basement">Basement</option>
                <option value="Parking Level">Parking Level</option>
                <option value="Outdoor area">Outdoor area</option>
                <option value="Not sure">Not sure</option>
                <option value="Other">Other / Enter manually</option>
              </select>
              {floor === 'Other' && (
                <div className="mt-2.5 animate-fadeIn">
                  <label className="block text-xs font-semibold text-campus-300 mb-1">Enter floor</label>
                  <input
                    type="text"
                    value={customFloor}
                    onChange={(e) => setCustomFloor(e.target.value)}
                    placeholder="Enter floor"
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500 scroll-mt-keyboard"
                  />
                </div>
              )}
            </div>

            {/* Area Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">Area</label>
              <select
                value={area}
                onChange={(e) => {
                  setArea(e.target.value);
                  if (e.target.value !== 'Other') setCustomArea('');
                }}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-sm sm:text-base text-white bg-slate-900 border border-slate-800 scroll-mt-keyboard"
              >
                <option value="">Select Area (Optional)</option>
                <option value="Study Desks / Reading Room">Study Desks / Reading Room</option>
                <option value="Cafeteria / Dining Tables">Cafeteria / Dining Tables</option>
                <option value="Computer Lab / Server Area">Computer Lab / Server Area</option>
                <option value="Locker Room / Gym Floor">Locker Room / Gym Floor</option>
                <option value="Lawn / Open Court">Lawn / Open Court</option>
                <option value="Corridor / Hallway">Corridor / Hallway</option>
                <option value="Restrooms">Restrooms</option>
                <option value="Security / Help Desk">Security / Help Desk</option>
                <option value="Other">Other / Enter manually</option>
              </select>
              {area === 'Other' && (
                <div className="mt-2.5 animate-fadeIn">
                  <label className="block text-xs font-semibold text-campus-300 mb-1">Enter area</label>
                  <input
                    type="text"
                    value={customArea}
                    onChange={(e) => setCustomArea(e.target.value)}
                    placeholder="Enter area"
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500 scroll-mt-keyboard"
                  />
                </div>
              )}
            </div>

            {/* Specific Location Details */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                Location details <span className="text-slate-400 font-semibold text-xs ml-1">(Optional)</span>
              </label>
              <input
                type="text"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="e.g. Beside staircase near Room 204"
                className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-sm sm:text-base text-white placeholder-slate-500 scroll-mt-keyboard"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
              Approximate Date &amp; Time *
            </label>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              required
              className="w-full sm:w-80 min-h-[48px] px-4 py-3 rounded-xl glass-input text-sm sm:text-base text-white bg-slate-900 border border-slate-800 scroll-mt-keyboard"
            />
            {!timestamp && showStep3Error && <p className="mt-1 text-xs text-rose-300">Approximate Date &amp; Time is required.</p>}
          </div>

          {showStep3Error && !step3Valid && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs sm:text-sm font-semibold animate-slideUp">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Please fill in Building, Area/Floor, and Date &amp; Time before submitting.</span>
            </div>
          )}

          {/* Lost Ownership confirmation note */}
          {type === 'lost' && hiddenDetails.trim() && (
            <div className="flex items-start gap-2.5 p-3 sm:p-4 rounded-xl bg-campus-950/40 border border-campus-500/30 text-xs text-campus-200">
              <ShieldCheck className="w-4 h-4 shrink-0 text-campus-400 mt-0.5" />
              <span>
                <strong>Verification Proof Added:</strong> Your private proof will be hidden from public view and used only to confirm your ownership.
              </span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowStep3Error(false);
                setCurrentStep(2);
              }}
              className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white font-medium text-sm flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              disabled={loading || !step3Valid}
              className={`w-full sm:w-auto min-h-[52px] btn-primary flex items-center justify-center space-x-2 px-8 ${
                loading || !step3Valid ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span>Processing AI Match...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Submit &amp; Find Match</span>
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
