import React, { useState, useEffect } from 'react';
import { Sparkles, Camera, Brain, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const OnboardingWalkthrough = ({ forceOpen = false, onClose }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem('traceit_onboarding_done');
    if (!hasSeen || forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const steps = [
    {
      icon: Camera,
      badge: 'Step 1 of 3',
      title: 'Report in 3 Simple Steps',
      desc: 'Lost or found something on campus? Upload a quick picture, use voice typing or keyboard to describe it, and choose the campus building.',
      color: 'from-blue-600 to-cyan-500'
    },
    {
      icon: Brain,
      badge: 'Step 2 of 3',
      title: 'AI Matches Items & Explains Why',
      desc: 'Our multimodal AI instantly compares photos, descriptions, and location proximity. It gives you a clear "How sure we are" score with plain-language explanations.',
      color: 'from-purple-600 to-indigo-500'
    },
    {
      icon: ShieldCheck,
      badge: 'Step 3 of 3',
      title: 'Anti-Fraud Quiz & Safe QR Handover',
      desc: 'To protect student privacy and stop fake claims, claimants answer 2 private questions. Once verified, meet at a campus security desk and scan the QR code to finish!',
      color: 'from-emerald-600 to-teal-500'
    }
  ];

  const handleClose = () => {
    localStorage.setItem('traceit_onboarding_done', 'true');
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-campus-500/40 shadow-2xl relative">
        {/* Skip / Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Close walkthrough"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Step Visual */}
        <div className="text-center space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center text-white shadow-glow-primary`}>
            <Icon className="w-8 h-8" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-campus-500/20 text-campus-300 border border-campus-500/30">
            {step.badge}
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            {step.title}
          </h3>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md mx-auto">
            {step.desc}
          </p>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center space-x-2 pt-2">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-8 bg-campus-400' : 'w-2.5 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons (>= 48px height) */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          {currentStep > 0 ? (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="min-h-[48px] px-5 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-2 border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="min-h-[48px] px-4 py-3 rounded-xl font-medium text-sm text-slate-400 hover:text-white"
            >
              Skip Tour
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="min-h-[48px] px-6 py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-glow-primary hover:opacity-95 flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="min-h-[48px] px-6 py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-glow-emerald hover:opacity-95 flex items-center space-x-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Get Started Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
