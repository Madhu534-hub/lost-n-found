import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ShieldCheck,
  Eye,
  MessageSquare,
  CheckCircle2,
  Lock,
  MapPin,
  Clock,
  QrCode,
  Languages,
  Loader2,
  Star,
  Award
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Animated SVG confidence ring
const ConfidenceRing = ({ score }) => {
  const radius = 28;
  const stroke = 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-12 h-12 score-ring" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx="32" cy="32" r={radius} fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black text-white leading-none">{score}%</span>
      </div>
    </div>
  );
};

export const MatchCard = ({ match, onStartVerification, onOpenChat, onOpenQR }) => {
  const { currentUser, session } = useAuth();
  const { t, i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState(null);
  const [translating, setTranslating] = useState(false);

  const currentUserId = currentUser?.id || session?.user?.id;

  const lost = match.target_report?.type === 'lost' ? match.target_report : (match.matched_report?.type === 'lost' ? match.matched_report : (match.lost_report || match.target_report));
  const found = match.target_report?.type === 'found' ? match.target_report : (match.matched_report?.type === 'found' ? match.matched_report : (match.found_report || match.matched_report));

  if (!lost || !found) return null;

  const lostUserId = lost?.user_id || match.lost_user_id || match.lost_report?.user_id;
  const foundUserId = found?.user_id || match.found_user_id || match.found_report?.user_id;

  const isFounder = Boolean(currentUserId) && String(currentUserId) === String(foundUserId);
  const isLoser = Boolean(currentUserId) && String(currentUserId) === String(lostUserId);

  const isVerified = match.status === 'verified';
  const isReunited = match.status === 'reunited';
  const isValidAiMatch = Number(match.confidence_score) >= 50;
  const isHighValue = lost.is_high_value || found.is_high_value;
  const isSerialVerified = match.explanation?.toLowerCase().includes('serial') || match.is_serial_match;

  const handleTranslate = async (text) => {
    if (translatedText) { setTranslatedText(null); return; }
    try {
      setTranslating(true);
      const res = await api.translate(text, i18n.language || 'en');
      setTranslatedText(res.translated);
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setTranslating(false);
    }
  };

  const scores = [
    { label: 'Vision',   value: match.visual_score,   emoji: '📸', color: 'from-purple-500/20 to-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/25' },
    { label: 'Text',     value: match.text_score,      emoji: '📝', color: 'from-blue-500/20 to-blue-500/10',    text: 'text-blue-300',   border: 'border-blue-500/25' },
    { label: 'Location', value: match.location_score,  emoji: '📍', color: 'from-emerald-500/20 to-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/25' },
    { label: 'Time',     value: match.time_score,       emoji: '⏱️', color: 'from-amber-500/20 to-amber-500/10',   text: 'text-amber-300',  border: 'border-amber-500/25' },
  ];

  return (
    <div className="glass-card-static rounded-3xl border border-slate-800/60 overflow-hidden transition-all hover:border-campus-500/40 duration-300">
      {/* ── Header with Confidence Ring ── */}
      <div className="p-3 sm:p-4 flex items-start gap-3">
        <ConfidenceRing score={match.confidence_score} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1 mb-0.5">
            <span className="text-xs font-extrabold text-white">
              {t('accessibility.howSure', 'How sure we are:')} {match.confidence_score}%
            </span>

            {isSerialVerified && (
              <span className="px-1.5 py-px rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Serial Verified
              </span>
            )}
            {isHighValue && (
              <span className="px-1.5 py-px rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                Valuable
              </span>
            )}
          </div>

          {/* AI validity and ownership verification are intentionally separate. */}
          {isValidAiMatch && (
            <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold mr-1">
              <CheckCircle2 className="w-3 h-3" />
              AI Match Valid
            </span>
          )}
          {isReunited ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
              <Award className="w-3 h-3 text-amber-400" />
              Verified Handover ✅
            </span>
          ) : isVerified ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              Ownership Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full bg-slate-800/80 text-slate-400 text-[10px] font-semibold">
              <Clock className="w-3 h-3" />
              Verification Pending
            </span>
          )}
        </div>
      </div>

      {/* ── Side-by-Side Comparison ── */}
      <div className="px-3 sm:px-4 pb-2.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {/* Lost */}
          <div className="p-2.5 rounded-2xl border border-rose-500/15 bg-gradient-to-br from-rose-950/25 to-slate-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Lost Report
              </span>
              <span className="text-[10px] text-slate-500">{lost.category}</span>
            </div>
            <div className="flex items-start space-x-2">
              <img
                src={lost.photo_url || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'}
                alt={lost.title}
                className="w-10 h-10 rounded-lg object-cover border border-slate-700/60 bg-slate-950 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-bold text-white truncate leading-tight">{lost.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-px leading-snug">
                  {translatedText || lost.description}
                </p>
                <p className="text-[10px] text-slate-500 mt-px flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {lost.location}
                </p>
              </div>
            </div>
            <div className="pt-1 border-t border-rose-500/10 flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleTranslate(lost.description)}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition-colors"
              >
                {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                <span>{translatedText ? 'Original' : 'Translate'}</span>
              </button>
              <span className="text-[10px] text-slate-500">{lost.user_name || 'Student'}</span>
            </div>
          </div>

          {/* Found */}
          <div className="p-2.5 rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-950/25 to-slate-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Found Report
              </span>
              <span className="text-[10px] text-slate-500">{found.category}</span>
            </div>
            <div className="flex items-start space-x-2">
              <img
                src={found.photo_url || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'}
                alt={found.title}
                className="w-10 h-10 rounded-lg object-cover border border-slate-700/60 bg-slate-950 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-bold text-white truncate leading-tight">{found.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-px leading-snug">{found.description}</p>
                <p className="text-[10px] text-slate-500 mt-px flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {found.location}
                </p>
              </div>
            </div>
            <div className="pt-1 border-t border-emerald-500/10 flex justify-between items-center text-[10px] text-slate-500">
              <span>{found.user_name || 'Finder'}</span>
              <span>📍 {found.building}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4-Signal Score Breakdown ── */}
      <div className="mx-3 sm:mx-4 mb-2.5 p-2.5 rounded-2xl border border-slate-800/60 bg-slate-900/50 space-y-1.5">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">4-Signal AI Score Breakdown</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {scores.map((s, idx) => (
            <div key={idx} className={`px-2 py-1.5 rounded-lg bg-gradient-to-b ${s.color} border ${s.border} flex items-center justify-center gap-1.5`}>
              <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">{s.emoji} {s.label}</span>
              <span className={`text-sm font-black ${s.text}`}>{s.value}%</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-300 leading-snug italic border-t border-slate-800/60 pt-1.5">
          "{match.explanation}"
        </p>
      </div>

      {/* ── Action Buttons ── */}
      <div className="px-3 sm:px-4 pb-3 flex flex-wrap items-center gap-2">
        {isLoser && !isVerified && !isReunited ? (
          <button
            onClick={() => onStartVerification(match)}
            className="match-card-claim flex-1 btn-primary flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{t('accessibility.claimBtn', 'This Is My Item — Verify Claim')}</span>
          </button>
        ) : (isFounder || (isLoser && (isVerified || isReunited))) ? (
          <>
            <button
              onClick={() => onOpenChat(match)}
              className="flex-1 min-h-[48px] px-5 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center space-x-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)', boxShadow: '0 4px 14px -3px rgba(37,99,235,0.3)' }}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Secure Chat</span>
            </button>
            <button
              onClick={() => onOpenQR(match)}
              className="min-h-[48px] px-5 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center space-x-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)', boxShadow: '0 4px 14px -3px rgba(5,150,105,0.3)' }}
            >
              <QrCode className="w-5 h-5" />
              <span>Handover QR</span>
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};
