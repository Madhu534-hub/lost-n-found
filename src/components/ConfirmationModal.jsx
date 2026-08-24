import React from 'react';
import { AlertCircle, CheckCircle, X, Trash2 } from 'lucide-react';

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'Please confirm this action to proceed.',
  confirmText = 'Yes, Confirm',
  cancelText = 'Cancel',
  type = 'warning' // 'warning' | 'danger' | 'success'
}) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isSuccess = type === 'success';

  // FIX: Only call onConfirm — let the caller decide whether to close.
  // Previously, both onConfirm() AND onClose() were called, which broke
  // async handlers (e.g., admin executeModerate) that need to run before close.
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 relative text-center animate-scaleIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center pt-2">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md ${
            isDanger
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : isSuccess
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {isDanger ? (
              <Trash2 className="w-8 h-8" />
            ) : isSuccess ? (
              <CheckCircle className="w-8 h-8" />
            ) : (
              <AlertCircle className="w-8 h-8" />
            )}
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            {title}
          </h3>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions (>= 48px height touch targets) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center space-x-2 transition-all"
          >
            <X className="w-4 h-4" />
            <span>{cancelText}</span>
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`w-full min-h-[48px] px-5 py-3 rounded-xl font-extrabold text-sm text-white shadow-md flex items-center justify-center space-x-2 transition-all ${
              isDanger
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-95'
                : isSuccess
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95'
                : 'bg-gradient-to-r from-campus-600 to-ai-purple hover:opacity-95'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
