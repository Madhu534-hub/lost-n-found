import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Lock,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Info
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
      setChallenge(null);
      loadChallenge();
    }
  }, [isOpen, match]);

  const loadChallenge = async () => {
    try {
      setLoading(true);
      // Pass the entire match object so report details are immediately accessible
      const data = await api.getVerificationChallenge(match);
      setChallenge(data);
    } catch (err) {
      console.error('Failed to load verification challenge:', err);
      showToast('Error loading verification challenge.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Extract questions array safely from challenge
  const questions = (challenge?.questions && Array.isArray(challenge.questions) && challenge.questions.length > 0)
    ? challenge.questions
    : (challenge?.question_1
        ? [
            { id: 'q_1', question: challenge.question_1 },
            challenge?.question_2 ? { id: 'q_2', question: challenge.question_2 } : null
          ].filter(Boolean)
        : []);

  const hasQuestions = questions.length > 0;
  const noPrivateDetails = challenge?.hasPrivateDetails === false || (!loading && !hasQuestions);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ans1.trim()) {
      showToast('Please enter your answer.', 'error');
      return;
    }
    if (questions.length > 1 && !ans2.trim()) {
      showToast('Please answer both verification questions.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.submitVerification({
        matchId: match?.id,
        match,
        answer1: ans1.trim(),
        answer2: ans2.trim(),
        userId: currentUser?.id,
        challenge
      });

      setEvalResult(res);

      if (res.passed) {
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-panel w-full max-w-xl rounded-3xl border border-slate-800/70 shadow-2xl relative animate-scaleIn overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top gradient line */}
        <div className="h-1 bg-gradient-to-r from-ai-purple via-campus-500 to-ai-fuchsia shrink-0" />

        <div className="p-5 sm:p-8 overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-3 pb-5 border-b border-slate-800/60">
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #0c8fe9 100%)' }}
            >
              <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <h3 className="text-base sm:text-lg font-black text-white">Ownership Verification</h3>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full font-bold">
                  Anti-Fraud
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Prove you own this item using private details only you would know</p>
            </div>
          </div>

          {/* Body */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-ai-purple to-campus-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-slate-400">Loading ownership challenge...</p>
            </div>

          ) : evalResult ? (
            <div className="mt-6 text-center space-y-5">
              {evalResult.passed ? (
                <div className="p-6 sm:p-7 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 to-slate-900/60">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-emerald-200">Ownership Verified!</h4>
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
                <div className="p-6 sm:p-7 rounded-2xl border border-rose-500/30 bg-gradient-to-b from-rose-950/40 to-slate-900/60">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                    <XCircle className="w-8 h-8 sm:w-9 sm:h-9" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-rose-200">Verification Failed</h4>
                  <p className="text-sm text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">{evalResult.feedback}</p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
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
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

          ) : noPrivateDetails ? (
            /* ── No Private Details State ── */
            <div className="mt-6 space-y-5">
              <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/30 to-slate-900/60 text-center space-y-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Info className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h4 className="text-base font-black text-amber-200">No Private Verification Details</h4>
                <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                  No private ownership details were provided for this item, so private-question verification is unavailable.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  The original reporter did not add private ownership details when filing this report. Automated question verification cannot safely proceed without real private details.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                {/* Verify button is hidden/disabled when verification cannot safely proceed */}
              </div>
            </div>

          ) : (
            /* ── Questions Form — strictly from real private details ── */
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="p-4 rounded-xl border border-campus-500/20 bg-campus-950/30 text-xs sm:text-sm text-campus-200 leading-relaxed flex items-start space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-campus-400 shrink-0 mt-0.5" />
                <span>
                  Answer {questions.length > 1 ? `${questions.length} questions` : 'the question below'} based on private details only the true owner would know.
                </span>
              </div>

              {/* Dynamic Question Inputs — claimant NEVER sees the private answer or hint */}
              {questions.map((q, idx) => (
                <div key={q.id || idx} className="space-y-2">
                  <label className="block text-sm font-bold text-slate-200 flex items-start space-x-2.5">
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-r from-campus-600 to-ai-purple text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{q.question}</span>
                  </label>
                  <input
                    type="text"
                    value={idx === 0 ? ans1 : ans2}
                    onChange={(e) => idx === 0 ? setAns1(e.target.value) : setAns2(e.target.value)}
                    placeholder="Type your answer..."
                    required
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500"
                  />
                </div>
              ))}

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 min-h-[48px]"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Evaluating...</span></>
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
