import React from 'react';
import { AlertTriangle, Eye, ArrowRight, X, Check } from 'lucide-react';

export const DuplicateWarningModal = ({ isOpen, onClose, duplicateItem, onConfirmSubmit, onViewExisting }) => {
  if (!isOpen || !duplicateItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-amber-500/50 shadow-2xl space-y-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-extrabold text-white">Possible Duplicate Report</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
                {duplicateItem.similarityScore}% Similar
              </span>
            </div>
            <p className="text-xs text-slate-400">A very similar campus report already exists in the system.</p>
          </div>
        </div>

        {/* Existing Duplicate Card Preview */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Existing Item on File:</span>
          <div className="flex items-start space-x-3">
            <img
              src={duplicateItem.photo_url || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'}
              alt={duplicateItem.title}
              className="w-16 h-16 rounded-xl object-cover border border-slate-700 bg-slate-950 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white truncate">{duplicateItem.title}</h4>
              <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{duplicateItem.description}</p>
              <div className="text-[11px] text-slate-500 mt-1">📍 {duplicateItem.location} • Reported by {duplicateItem.user_name || 'Campus Student'}</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Submitting duplicate reports slows down matching for everyone. Would you like to view the existing report instead or proceed with filing your report?
        </p>

        {/* Actions (>= 48px height) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              onClose();
              if (onViewExisting) onViewExisting(duplicateItem);
            }}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>View Existing Report & Cancel</span>
          </button>

          <button
            onClick={() => {
              onClose();
              if (onConfirmSubmit) onConfirmSubmit();
            }}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md hover:opacity-95 flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Continue & Submit Anyway</span>
          </button>
        </div>
      </div>
    </div>
  );
};
