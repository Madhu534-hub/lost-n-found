import React, { useState } from 'react';
import { api } from '../services/api';
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
    <div className="relative w-16 h-16 shrink-0">
      <svg className="w-16 h-16 score-ring" viewBox="0 0 64 64">
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
        <span className="text-lg font-black text-white leading-none">{score}%</span>
      </div>
    </div>
  );
};

export const MatchCard = ({ match, onStartVerification, onOpenChat, onOpenQR }) => {
  const { t, i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState(null);
  const [translating, setTranslating] = useState(false);

  const lost = match.target_report || match.lost_report;
  const found = match.matched_report || match.found_report;

  if (!lost || !found) return null;

  const isVerified = match.status === 'verified';
  const isReunited = match.status === 'reunited';
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
      <div className="p-5 sm:p-6 flex items-start gap-5">
        <ConfidenceRing score={match.confidence_score} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-sm font-extrabold text-white">
              {t('accessibility.howSure', 'How sure we are:')} {match.confidence_score}%
            </span>

            {isSerialVerified && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Serial Verified
              </span>
            )}
            {isHighValue && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                Valuable
              </span>
            )}
          </div>

          {/* Status */}
          {isReunited ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Verified Handover ✅
            </span>
          ) : isVerified ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ownership Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-400 text-xs font-semibold">
              <Clock className="w-3 h-3" />
              Verification Pending
            </span>
          )}
        </div>
      </div>

      {/* ── Side-by-Side Comparison ── */}
      <div className="px-5 sm:px-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lost */}
          <div className="p-4 rounded-2xl border border-rose-500/15 bg-gradient-to-br from-rose-950/25 to-slate-900/50 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Lost Report
              </span>
              <span className="text-[11px] text-slate-500">{lost.category}</span>
            </div>
            <div className="flex items-start space-x-3">
              <img
                src={lost.photo_url || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'}
                alt={lost.title}
                className="w-14 h-14 rounded-xl object-cover border border-slate-700/60 bg-slate-950 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{lost.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                  {translatedText || lost.description}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {lost.location}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-rose-500/10 flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleTranslate(lost.description)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition-colors"
              >
                {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                <span>{translatedText ? 'Original' : 'Translate'}</span>
              </button>
              <span className="text-[11px] text-slate-500">{lost.user_name || 'Student'}</span>
            </div>
          </div>

          {/* Found */}
          <div className="p-4 rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-950/25 to-slate-900/50 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Found Report
              </span>
              <span className="text-[11px] text-slate-500">{found.category}</span>
            </div>
            <div className="flex items-start space-x-3">
              <img
                src={found.photo_url || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'}
                alt={found.title}
                className="w-14 h-14 rounded-xl object-cover border border-slate-700/60 bg-slate-950 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{found.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{found.description}</p>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {found.location}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-500/10 flex justify-between items-center text-[11px] text-slate-500">
              <span>{found.user_name || 'Finder'}</span>
              <span>📍 {found.building}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4-Signal Score Breakdown ── */}
      <div className="mx-5 sm:mx-6 mb-4 p-4 rounded-2xl border border-slate-800/60 bg-slate-900/50 space-y-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">4-Signal AI Score Breakdown</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {scores.map((s, idx) => (
            <div key={idx} className={`px-3 py-2.5 rounded-xl bg-gradient-to-b ${s.color} border ${s.border} text-center`}>
              <span className="text-[11px] font-semibold text-slate-400 block">{s.emoji} {s.label}</span>
              <span className={`text-lg font-black ${s.text}`}>{s.value}%</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-300 leading-relaxed italic border-t border-slate-800/60 pt-3">
          "{match.explanation}"
        </p>
      </div>

      {/* ── Action Buttons ── */}
      <div className="px-5 sm:px-6 pb-5 flex flex-wrap items-center gap-3">
        {!isVerified && !isReunited ? (
          <button
            onClick={() => onStartVerification(match)}
            className="flex-1 btn-primary flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{t('accessibility.claimBtn', 'This Is My Item — Verify Claim')}</span>
          </button>
        ) : (
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
        )}
      </div>
    </div>
  );
};
