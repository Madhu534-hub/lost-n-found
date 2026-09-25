import React from 'react';
import {
  Sparkles,
  Search,
  PlusCircle,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  Brain,
  HelpCircle,
  Building,
  Lock,
  Camera,
  MessageSquare,
  Award,
  QrCode,
  PartyPopper,
  Trophy,
  FolderLock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export const LandingPage = ({ setActiveTab, onOpenPhotoSearch }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  // Core navigation feature cards below primary actions
  const featureCards = [
    {
      id: 'ai-matching',
      title: 'Smart AI Matching',
      subtitle: 'Multimodal Vision & Semantics',
      desc: 'Combines vision analysis, descriptions, campus GPS, and time decay to calculate exact match confidence.',
      icon: Brain,
      iconColor: 'text-purple-400',
      bgGradient: 'from-purple-950/40 via-slate-900 to-slate-950',
      borderColor: 'border-purple-500/30 hover:border-purple-500/50',
      badge: '96% Accuracy',
      badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      actionText: 'Search by Photo',
      action: onOpenPhotoSearch,
      actionIcon: Camera
    },
    {
      id: 'browse',
      title: 'Explore Items',
      subtitle: 'Campus Lost & Found Catalog',
      desc: 'Browse active student reports with filters by category, building, date, or view on the interactive campus map.',
      icon: Compass,
      iconColor: 'text-cyan-400',
      bgGradient: 'from-cyan-950/40 via-slate-900 to-slate-950',
      borderColor: 'border-cyan-500/30 hover:border-cyan-500/50',
      badge: 'Interactive Map',
      badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      actionText: 'Explore Catalog',
      action: () => setActiveTab('browse'),
      actionIcon: ArrowRight
    },
    {
      id: 'my-reports',
      title: 'My Radar',
      subtitle: 'Real-Time Match Alerts',
      desc: 'Your personalized proactive monitoring radar scanning campus report streams for candidate matches 24/7.',
      icon: FolderLock,
      iconColor: 'text-blue-400',
      bgGradient: 'from-blue-950/40 via-slate-900 to-slate-950',
      borderColor: 'border-blue-500/30 hover:border-blue-500/50',
      badge: 'Live Radar',
      badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      actionText: 'Open Radar',
      action: () => setActiveTab('my-reports'),
      actionIcon: ArrowRight
    },
    {
      id: 'leaderboard',
      title: 'Campus Heroes',
      subtitle: 'Karma Points & Rewards',
      desc: 'Recognizing students and staff who keep campus honest. Earn +100 Hero Karma points for verified item returns.',
      icon: Trophy,
      iconColor: 'text-amber-400',
      bgGradient: 'from-amber-950/40 via-slate-900 to-slate-950',
      borderColor: 'border-amber-500/30 hover:border-amber-500/50',
      badge: 'Gamified Karma',
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      actionText: 'View Leaderboard',
      action: () => setActiveTab('leaderboard'),
      actionIcon: ArrowRight
    }
  ];

  // AI Pipeline steps — the core experience flow
  const pipeline = [
    { icon: Camera,       label: 'Upload',   emoji: '📷', color: 'from-blue-500 to-cyan-500' },
    { icon: Sparkles,     label: 'AI Detect', emoji: '🤖', color: 'from-purple-500 to-indigo-500' },
    { icon: Brain,        label: 'AI Match',  emoji: '🧠', color: 'from-ai-purple to-ai-fuchsia' },
    { icon: Zap,          label: 'Score',     emoji: '🎯', color: 'from-amber-500 to-orange-500' },
    { icon: ShieldCheck,  label: 'Verify',    emoji: '🔐', color: 'from-emerald-500 to-teal-500' },
    { icon: MessageSquare,label: 'Chat',      emoji: '💬', color: 'from-blue-600 to-cyan-500' },
    { icon: PartyPopper,  label: 'Reunite',   emoji: '🎉', color: 'from-rose-500 to-pink-500' },
  ];

  const stats = [
    { label: 'Match Rate', value: '96%', sub: 'Multimodal AI Fusion', icon: Zap, color: 'from-blue-500 to-cyan-500' },
    { label: 'Match Speed', value: '1.4h', sub: 'Down from 4.5 days', icon: Clock, color: 'from-purple-500 to-indigo-500' },
    { label: 'Privacy Score', value: '100%', sub: 'Anti-fraud quiz layer', icon: ShieldCheck, color: 'from-emerald-500 to-teal-500' },
    { label: 'Campus Hubs', value: '5', sub: 'Library, CS, Union +', icon: Building, color: 'from-amber-500 to-rose-500' }
  ];

  return (
    <div className="space-y-10 sm:space-y-16 pb-12 sm:pb-20">
      {/* ============================================================
          1. CLEAN HERO HEADER SECTION
          ============================================================ */}
      <section className="relative pt-2 sm:pt-6 pb-6 sm:pb-10 overflow-hidden">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] rounded-full pointer-events-none -z-10"
          style={{ background: 'radial-gradient(ellipse, rgba(12,143,233,0.10) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)' }} />

        <div className="text-center max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-slideUp px-2">
          {/* Tagline Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-lg">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-xs font-extrabold text-cyan-300 tracking-wide uppercase">
              Smart Campus Lost &amp; Found
            </span>
          </div>

          {/* Main Title & Subtitle */}
          <div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
              Trace<span className="text-campus-400">It</span>
            </h1>
            <p className="text-base sm:text-xl md:text-2xl font-extrabold text-slate-300 mt-2 tracking-tight">
              AI-Powered Smart Campus Lost &amp; Found
            </p>
            <p className="text-xs sm:text-base text-slate-400 max-w-xl mx-auto mt-2 leading-relaxed font-medium">
              The intelligent network connecting lost items and finders across campus in seconds using multimodal AI.
            </p>
          </div>

          {/* ============================================================
              2. TWO PROMINENT PRIMARY ACTIONS (Lost vs Found)
              ============================================================ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 max-w-xl mx-auto">
            {/* Action 1: Report Lost Item */}
            <button
              onClick={() => setActiveTab('report')}
              className="min-h-[64px] w-full flex items-center justify-between p-5 rounded-2xl text-left text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-rose-500/40 group relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #be123c 0%, #991b1b 100%)', boxShadow: '0 8px 24px -6px rgba(190,18,60,0.45)' }}
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black leading-tight">REPORT LOST ITEM</p>
                  <p className="text-xs text-rose-100 font-medium mt-0.5 opacity-90">Find your missing belongings</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </button>

            {/* Action 2: Report Found Item */}
            <button
              onClick={() => setActiveTab('report')}
              className="min-h-[64px] w-full flex items-center justify-between p-5 rounded-2xl text-left text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-500/40 group relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)', boxShadow: '0 8px 24px -6px rgba(4,120,87,0.45)' }}
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black leading-tight">REPORT FOUND ITEM</p>
                  <p className="text-xs text-emerald-100 font-medium mt-0.5 opacity-90">Return an item &amp; earn +Karma</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. CLEAN FEATURE CARDS GRID (Cleaner App Navigation Style)
          ============================================================ */}
      <section className="max-w-6xl mx-auto px-2">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Campus Discovery &amp; Tools</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Explore active lost &amp; found features</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {featureCards.map((card) => {
            const Icon = card.icon;
            const ActionIcon = card.actionIcon;
            return (
              <div
                key={card.id}
                className={`rounded-3xl p-5 sm:p-6 bg-gradient-to-b ${card.bgGradient} border ${card.borderColor} flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg group`}
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className={`w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center ${card.iconColor} shadow-inner group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  {/* Title & description */}
                  <h3 className="text-base sm:text-lg font-black text-white">{card.title}</h3>
                  <p className="text-xs font-bold text-slate-300 mt-0.5">{card.subtitle}</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{card.desc}</p>
                </div>

                {/* Card Action Button */}
                <div className="mt-5 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={card.action}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-extrabold bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 flex items-center justify-center space-x-2 transition-all active:scale-95"
                  >
                    <span>{card.actionText}</span>
                    <ActionIcon className="w-3.5 h-3.5 text-campus-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          4. LIVE MATCH DEMO SHOWCASE
          ============================================================ */}
      <section className="max-w-5xl mx-auto px-2">
        <div className="rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative shadow-2xl">
          {/* Top gradient bar */}
          <div className="h-1 bg-gradient-to-r from-campus-600 via-ai-purple to-ai-fuchsia" />

          <div className="p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-5 border-b border-slate-800/80 relative">
              <div>
                <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-1">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live AI Demo
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-campus-500/15 text-campus-300 border border-campus-500/30">
                    96% Match Confidence
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-white">
                  Black JanSport Backpack — AI Multimodal Match
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('my-reports')}
                className="btn-primary min-h-[44px] flex items-center justify-center space-x-2 self-start sm:self-center"
              >
                <span>View in Radar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 relative">
              {/* Lost Card */}
              <div className="rounded-2xl p-4 sm:p-5 border border-rose-500/20 bg-gradient-to-br from-rose-950/30 to-slate-900/60 group hover:border-rose-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-rose-400 mb-2.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Lost Report
                  </span>
                  <span className="text-slate-500">08:30 AM</span>
                </div>
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-950 relative">
                  <img
                    src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80"
                    alt="Lost item"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-950/80 text-xs text-slate-200 backdrop-blur-sm border border-slate-800/60">
                    📍 Main Library, 2nd Floor
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
                  "Lost my black JanSport backpack near silent study desks. GitHub octocat sticker, orange carabiner."
                </p>
              </div>

              {/* Found Card */}
              <div className="rounded-2xl p-4 sm:p-5 border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-slate-900/60 group hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Found Report
                  </span>
                  <span className="text-slate-500">09:15 AM</span>
                </div>
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-950 relative">
                  <img
                    src="https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=600&q=80"
                    alt="Found Backpack"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-950/80 text-xs text-slate-200 backdrop-blur-sm border border-slate-800/60">
                    📍 Main Library, 2nd Floor
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
                  "Found a black JanSport backpack on a desk near 2nd floor stacks. Has stickers on front pocket."
                </p>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="mt-4 sm:mt-5 p-4 sm:p-5 rounded-2xl border border-campus-500/20 bg-gradient-to-r from-campus-950/40 to-slate-900/60 relative overflow-hidden">
              <div className="flex items-center space-x-2 text-xs font-bold text-campus-300 mb-2 relative">
                <Sparkles className="w-4 h-4 text-ai-purple" />
                <span>Gemini AI Match Reasoning:</span>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-campus-500/15 text-campus-300 border border-campus-500/25 text-[10px] sm:text-[11px] font-extrabold">
                  96% Match
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic relative">
                "High-confidence visual and spatiotemporal match: Both reports describe a black JanSport backpack with stickers and carabiner. Found on the 2nd floor of Main Library within 25 meters and 45 minutes of the reported loss."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          5. AI PIPELINE & STATS
          ============================================================ */}
      <section className="max-w-5xl mx-auto px-2">
        <div className="glass-panel rounded-3xl p-5 sm:p-8 border border-slate-800/60 space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h3 className="text-lg sm:text-xl font-black text-white">How AI Multimodal Matching Works</h3>
            <p className="text-xs text-slate-400 mt-1">From initial upload to verified campus handover</p>
          </div>

          <div className="flex items-center justify-between overflow-x-auto scrollbar-none gap-2 py-2">
            {pipeline.map((step, idx) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={idx}>
                  <div className="flex flex-col items-center gap-1 shrink-0 px-2 group">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 whitespace-nowrap">{step.emoji} {step.label}</span>
                  </div>
                  {idx < pipeline.length - 1 && (
                    <div className="w-4 sm:w-6 h-px bg-gradient-to-r from-slate-700 to-slate-600 shrink-0 mt-[-10px]" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
            {stats.map((s, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                <h4 className="text-xl sm:text-2xl font-black text-white">{s.value}</h4>
                <p className="text-[11px] font-bold text-slate-300">{s.label}</p>
                <p className="text-[10px] text-slate-400 truncate">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
