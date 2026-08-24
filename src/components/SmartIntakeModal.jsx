import React, { useState } from 'react';
import { Sparkles, Bot, X, Check, Lightbulb } from 'lucide-react';

export const SmartIntakeModal = ({ isOpen, onClose, questions, suggestion, onApply }) => {
  const [ans1, setAns1] = useState('');
  const [ans2, setAns2] = useState('');

  if (!isOpen) return null;

  const handleApply = () => {
    const enrichedText = [
      ans1 ? `Additional detail: ${ans1}` : '',
      ans2 ? `Inside contents/marks: ${ans2}` : ''
    ].filter(Boolean).join('\n');

    onApply(enrichedText, `${ans1} ${ans2}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-campus-500/40 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-campus-500 to-ai-purple flex items-center justify-center text-white shadow-glow-primary">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">TraceIt Smart Intake Assistant</h3>
              <span className="px-2 py-0.5 text-[10px] bg-ai-purple/20 text-ai-fuchsia border border-ai-fuchsia/30 rounded-full font-semibold">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-slate-400">Enriching your item report for 40%+ higher match accuracy</p>
          </div>
        </div>

        {/* Suggestion alert */}
        <div className="mt-4 p-3 rounded-xl bg-campus-950/60 border border-campus-500/20 flex items-start space-x-2.5">
          <Lightbulb className="w-4 h-4 text-campus-400 shrink-0 mt-0.5" />
          <p className="text-xs text-campus-200 leading-relaxed">
            {suggestion || 'Adding unique micro-details and private identifiers helps our multimodal AI match your item in minutes without exposing your phone number.'}
          </p>
        </div>

        {/* Questions */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              1. {questions?.[0] || 'Were there any specific stickers, badges, or keychains attached?'}
            </label>
            <input
              type="text"
              value={ans1}
              onChange={(e) => setAns1(e.target.value)}
              placeholder="e.g. Bright orange carabiner clip, GitHub sticker on front"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              2. {questions?.[1] || 'What specific notebook, stationery, or items were inside?'}
            </label>
            <input
              type="text"
              value={ans2}
              onChange={(e) => setAns2(e.target.value)}
              placeholder="e.g. Calculus III lecture binder and blue pencil case"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Skip for Now
          </button>
          <button
            onClick={handleApply}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-glow-primary hover:opacity-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Apply AI Enriched Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};
