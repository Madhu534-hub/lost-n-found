import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Lock,
  MessageSquare,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const VerificationModal = ({ isOpen, onClose, match, onVerificationSuccess }) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [ans1, setAns1] = useState('');
  const [ans2, setAns2] = useState('');
  const [evalResult, setEvalResult] = useState(null);

  useEffect(() => {
    if (isOpen && match) {
      setEvalResult(null);
      setAns1('');
      setAns2('');
      loadChallenge();
    }
  }, [isOpen, match]);

  const loadChallenge = async () => {
    try {
      setLoading(true);
      const data = await api.getVerificationChallenge(match.id);
      setChallenge(data);
    } catch (err) {
      console.error('Failed to load challenge:', err);
      showToast('Error loading verification challenge.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ans1.trim() || !ans2.trim()) {
      showToast('Please answer both verification questions.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.submitVerification({
        matchId: match.id,
        answer1: ans1.trim(),
        answer2: ans2.trim(),
        userId: currentUser?.id
      });

      setEvalResult(res);

      if (res.passed) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        showToast('🎉 Ownership verified! Chat unlocked.', 'success');
        if (onVerificationSuccess) onVerificationSuccess(match.id);
      } else {
        showToast('Verification failed. Answers did not match.', 'error');
      }
    } catch (err) {
      console.error('Submit error:', err);
      showToast('Verification error.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel w-full max-w-xl rounded-3xl border border-slate-800/60 shadow-2xl relative animate-scaleIn overflow-hidden">
        {/* Top gradient line */}
        <div className="h-1 bg-gradient-to-r from-ai-purple via-campus-500 to-ai-fuchsia" />

        <div className="p-6 sm:p-8">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-3 pb-5 border-b border-slate-800/60">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #0c8fe9 100%)' }}>
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-white">Ownership Verification</h3>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full font-bold">
                  Anti-Fraud
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Answer private questions to prove you own this item</p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-ai-purple to-campus-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-slate-400">Generating AI verification questions...</p>
            </div>
          ) : evalResult ? (
            <div className="mt-6 text-center space-y-5">
              {evalResult.passed ? (
                <div className="p-7 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 to-slate-900/60">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h4 className="text-xl font-black text-emerald-200">Ownership Verified!</h4>
                  <div className="mt-2 inline-flex items-center px-3 py-1 bg-emerald-900/40 rounded-full text-xs font-bold text-emerald-300 border border-emerald-500/25">
                    Score: {evalResult.score}%
                  </div>
                  <p className="text-sm text-slate-300 mt-3 max-w-sm mx-auto leading-relaxed">{evalResult.feedback}</p>
                  <div className="mt-6">
                    <button
                      onClick={() => { onClose(); if (onVerificationSuccess) onVerificationSuccess(match.id, true); }}
                      className="w-full btn-primary flex items-center justify-center space-x-2"
                      style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Proceed to Secure Chat</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-7 rounded-2xl border border-rose-500/30 bg-gradient-to-b from-rose-950/40 to-slate-900/60">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                    <XCircle className="w-9 h-9" />
                  </div>
                  <h4 className="text-xl font-black text-rose-200">Verification Failed</h4>
                  <p className="text-sm text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">{evalResult.feedback}</p>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => setEvalResult(null)}
                      className="flex-1 btn-ghost flex items-center justify-center space-x-2"
                    >
                      <span>Try Again</span>
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #e11d48 0%, #dc2626 100%)' }}
                    >
                      Contact Security
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="p-4 rounded-xl border border-campus-500/20 bg-campus-950/30 text-sm text-campus-200 leading-relaxed flex items-start space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-campus-400 shrink-0 mt-0.5" />
                <span>Answer 2 questions based on details only the true owner would know.</span>
              </div>

              {[
                { num: 1, question: challenge?.question_1 || 'What specific carabiner or keychain is attached to the exterior strap?', value: ans1, setter: setAns1 },
                { num: 2, question: challenge?.question_2 || 'What specific notebook, stationery, or item is in the main compartment?', value: ans2, setter: setAns2 }
              ].map((q) => (
                <div key={q.num}>
                  <label className="block text-sm font-bold text-slate-200 mb-2 flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-r from-campus-600 to-ai-purple text-white flex items-center justify-center text-xs font-black shrink-0">
                      {q.num}
                    </span>
                    <span>{q.question}</span>
                  </label>
                  <input
                    type="text"
                    value={q.value}
                    onChange={(e) => q.setter(e.target.value)}
                    placeholder="Type your answer..."
                    required
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500"
                  />
                </div>
              ))}

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>AI Evaluating...</span></>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /><span>Verify Ownership</span></>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
