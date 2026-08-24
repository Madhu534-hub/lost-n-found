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
  PartyPopper
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export const LandingPage = ({ setActiveTab, onOpenPhotoSearch }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

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

  const innovations = [
    {
      title: 'Multimodal Fusion',
      desc: 'Vision tags + sentence embeddings + GPS + time decay → single weighted confidence score.',
      icon: Brain,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Explainable AI',
      desc: 'Natural language justifications for every match — builds student and staff trust.',
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      title: 'Smart Intake',
      desc: 'AI prompts users for hidden stickers, scratches, and contents to enrich sparse reports.',
      icon: HelpCircle,
      color: 'from-amber-500 to-rose-500'
    },
    {
      title: 'Anti-Fraud Quiz',
      desc: '2 AI-generated ownership questions from finder notes before chat is unlocked.',
      icon: Lock,
      color: 'from-emerald-500 to-teal-500'
    }
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <section className="relative pt-10 pb-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full pointer-events-none -z-10"
          style={{ background: 'radial-gradient(ellipse, rgba(12,143,233,0.12) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)' }} />
        <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full pointer-events-none -z-10"
          style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.08) 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full pointer-events-none -z-10"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 60%)' }} />

        <div className="text-center max-w-4xl mx-auto space-y-8 animate-slideUp">
          {/* Hackathon badge */}
          <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full glass-panel border border-slate-700/60 shadow-lg">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-slate-300">
              Google for Developers × PromptWars • Build with AI Hackathon
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Lost Something? <br />
            <span className="text-gradient-primary animate-floatY inline-block">
              AI's Got Your Back.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            Report what you lost or found, and let AI find the connection in seconds.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setActiveTab('report')}
              className="min-h-[56px] w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-4 rounded-2xl text-base font-extrabold text-white shadow-lg transition-all hover:scale-[1.03] active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #e11d48 0%, #dc2626 100%)', boxShadow: '0 8px 24px -6px rgba(225,29,72,0.35)' }}
            >
              <Search className="w-5 h-5" />
              <span>Report Lost</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className="min-h-[56px] w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-4 rounded-2xl text-base font-extrabold text-white shadow-lg transition-all hover:scale-[1.03] active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)', boxShadow: '0 8px 24px -6px rgba(5,150,105,0.35)' }}
            >
              <PlusCircle className="w-5 h-5" />
              <span>Report Found</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Secondary */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenPhotoSearch}
              className="btn-ghost flex items-center space-x-2 hover:border-cyan-500/40"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300">Search by Photo</span>
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className="btn-ghost flex items-center space-x-2"
            >
              <Compass className="w-4 h-4 text-campus-400" />
              <span>Explore Catalog</span>
            </button>
          </div>
        </div>

        {/* ── AI PIPELINE VISUALIZATION ── */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800/60">
            <div className="flex items-center justify-between overflow-x-auto scrollbar-none gap-1">
              {pipeline.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <React.Fragment key={idx}>
                    <div className="flex flex-col items-center gap-1.5 shrink-0 px-2 group">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-300 whitespace-nowrap">{step.emoji} {step.label}</span>
                    </div>
                    {idx < pipeline.length - 1 && (
                      <div className="w-6 h-px bg-gradient-to-r from-slate-700 to-slate-600 shrink-0 mt-[-12px]" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mt-10 stagger-children">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="glass-card rounded-2xl p-5 border border-slate-800/60 text-center group">
                <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-r ${s.color} flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight">{s.value}</h3>
                <p className="text-xs font-bold text-slate-200 mt-1">{s.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          LIVE MATCH DEMO SHOWCASE
          ============================================================ */}
      <section className="max-w-5xl mx-auto">
        <div className="rounded-3xl overflow-hidden border border-slate-800/60 bg-grid-pattern relative">
          {/* Top gradient bar */}
          <div className="h-1 bg-gradient-to-r from-campus-600 via-ai-purple to-ai-fuchsia" />

          <div className="p-6 sm:p-8">
            {/* Decorative orbs */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-ai-purple/8 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-campus-600/8 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/60 relative">
              <div>
                <div className="flex items-center space-x-2 mb-1.5">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Demo
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-campus-500/15 text-campus-300 border border-campus-500/30">
                    96% Confidence
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Black JanSport Backpack — AI Match Demo
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('my-reports')}
                className="btn-primary flex items-center space-x-2"
              >
                <span>View in Radar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5 relative">
              {/* Lost Card */}
              <div className="rounded-2xl p-5 border border-rose-500/20 bg-gradient-to-br from-rose-950/30 to-slate-900/60 group hover:border-rose-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-rose-400 mb-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Lost by Alex Chen
                  </span>
                  <span className="text-slate-500">08:30 AM</span>
                </div>
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-950 relative">
                  <img
                    src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80"
                    alt="Lost Backpack"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-950/80 text-xs text-slate-200 backdrop-blur-sm border border-slate-800/60">
                    📍 Main Library, 2nd Floor
                  </div>
                </div>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  "Lost my black JanSport backpack near silent study desks. GitHub octocat sticker, orange carabiner."
                </p>
              </div>

              {/* Found Card */}
              <div className="rounded-2xl p-5 border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-slate-900/60 group hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Found by Sarah Connor
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
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  "Found a black JanSport backpack on a desk near 2nd floor stacks. Has stickers on front pocket."
                </p>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="mt-5 p-5 rounded-2xl border border-campus-500/20 bg-gradient-to-r from-campus-950/40 to-slate-900/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ai-purple/5 blur-[40px] rounded-full pointer-events-none" />
              <div className="flex items-center space-x-2 text-xs font-bold text-campus-300 mb-2.5 relative">
                <Sparkles className="w-4 h-4 text-ai-purple" />
                <span>Gemini AI Match Reasoning:</span>
                <span className="ml-auto px-2.5 py-0.5 rounded-full bg-campus-500/15 text-campus-300 border border-campus-500/25 text-[11px] font-extrabold">
                  96% Confidence
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed italic relative">
                "High-confidence visual and spatiotemporal match: Both reports describe a black JanSport backpack with stickers and carabiner. Found on the 2nd floor of Main Library within 25 meters and 45 minutes of the reported loss."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          INNOVATION GRID
          ============================================================ */}
      <section className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Why TraceIt <span className="text-gradient-primary">Stands Out</span>
          </h2>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            Deep AI intelligence, privacy-first challenges, and spatial campus reasoning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
          {innovations.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="glass-card rounded-2xl p-6 border border-slate-800/60 flex flex-col justify-between group">
                <div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-800/60 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active Feature</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS — 3 STEPS
          ============================================================ */}
      <section className="max-w-5xl mx-auto">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-slate-800/60 relative overflow-hidden bg-grid-pattern">
          <div className="absolute inset-0 bg-gradient-to-br from-campus-950/30 via-transparent to-ai-purple/10 pointer-events-none" />

          <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-12 relative">
            How It Works in <span className="text-gradient-primary">3 Quick Steps</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative stagger-children">
            {[
              { num: 1, title: 'Upload & AI Detect', desc: 'Snap a photo. Vision AI auto-detects category, color, brand, and generates smart tags instantly.', color: 'from-campus-600 to-cyan-500', accent: 'text-cyan-400', emoji: '📸' },
              { num: 2, title: 'Multimodal Match', desc: 'AI fuses visual embeddings, semantic text, GPS proximity, and time-decay into a weighted confidence score.', color: 'from-ai-purple to-ai-fuchsia', accent: 'text-purple-400', emoji: '🧠' },
              { num: 3, title: 'Verify & Reunite', desc: 'Pass the anti-fraud quiz, chat securely, arrange campus pickup with QR handover confirmation.', color: 'from-emerald-500 to-teal-500', accent: 'text-emerald-400', emoji: '🔐' }
            ].map((step, idx) => (
              <div key={idx} className="relative p-7 rounded-2xl bg-slate-900/50 border border-slate-800/60 hover:border-slate-700/80 text-center group transition-all hover:-translate-y-1.5 duration-300">
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center text-white text-2xl font-black mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  {step.emoji}
                </div>
                <h4 className={`text-lg font-extrabold mb-2 ${step.accent}`}>{step.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center relative">
            <button
              onClick={() => setActiveTab('report')}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Start Your Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
