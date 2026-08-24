import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Compass,
  PlusCircle,
  FolderLock,
  ShieldCheck,
  Trophy,
  Camera,
  Languages,
  HelpCircle,
  ChevronDown,
  MapPin
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Navbar = ({ currentTab, setTab, onOpenPhotoSearch, onOpenTour }) => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLangMenuOpen(false);
  };

  const navItems = [
    { id: 'landing', label: t('nav.home', 'Home'), icon: Sparkles },
    { id: 'browse', label: t('nav.explore', 'Explore'), icon: Compass },
    { id: 'report', label: t('nav.report', 'Report Item'), icon: PlusCircle, isPrimary: true },
    { id: 'my-reports', label: t('nav.myReports', 'My Radar'), icon: FolderLock },
    { id: 'leaderboard', label: t('nav.leaderboard', 'Heroes'), icon: Trophy },
    { id: 'admin', label: t('nav.admin', 'Admin'), icon: ShieldCheck, badge: currentUser?.role === 'admin' ? 'Admin' : null }
  ];

  // On mobile, show: Home, Explore, Report (primary), My Radar, Heroes — 5 max
  const mobileItems = navItems.filter(i => ['landing', 'browse', 'report', 'my-reports', 'leaderboard'].includes(i.id));

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => setTab('landing')}
          className="flex items-center space-x-3 cursor-pointer group shrink-0"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-campus-600 via-ai-purple to-ai-fuchsia flex items-center justify-center text-white shadow-glow-primary group-hover:scale-105 transition-all animate-pulseGlow">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-2xl font-black tracking-tight text-white font-sans">
                Trace<span className="text-campus-400">It</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-campus-500/20 text-campus-300 border border-campus-500/30 shimmer-badge">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">Campus Lost &amp; Found</p>
          </div>
        </div>

        {/* Desktop Navigation Links (>= 48px height) */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`relative min-h-[48px] px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center space-x-2 transition-all ${
                  isActive
                    ? 'bg-campus-600/20 text-campus-300 border border-campus-500/40 shadow-sm'
                    : item.isPrimary
                    ? 'bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-glow-primary hover:opacity-90'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
                {/* Active underline indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-campus-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Tools */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Search by Photo */}
          <button
            onClick={onOpenPhotoSearch}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 flex items-center space-x-1.5 shadow-sm transition-all"
            title="Search catalog by photo"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline">{t('nav.photoSearch', 'Search by Photo')}</span>
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all"
              title="Change Language"
            >
              <Languages className="w-4 h-4 text-purple-400" />
              <span className="uppercase font-black">{(i18n.language || 'en').slice(0, 2)}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 glass-panel rounded-2xl p-2 border border-slate-700/80 shadow-2xl z-50 animate-scaleIn space-y-1">
                {[
                  { code: 'en', label: 'English', flag: '🇺🇸' },
                  { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
                  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' }
                ].map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
                      i18n.language === lang.code ? 'bg-campus-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span>{lang.flag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Help / Walkthrough */}
          <button
            onClick={onOpenTour}
            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 flex items-center justify-center transition-all"
            title="How It Works / Guided Tour"
            aria-label="How it works"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-800">
            <img
              src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
              alt={currentUser?.name}
              className="w-9 h-9 rounded-xl ring-2 ring-campus-500/40 object-cover bg-slate-800"
            />
            <div className="text-left hidden xl:block">
              <p className="text-xs font-bold text-white truncate max-w-[100px]">{currentUser?.name}</p>
              <p className="text-[11px] text-amber-300 font-bold">{currentUser?.points || 140} pts ⚡</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar — 5 items, 48px each */}
      <div className="md:hidden grid grid-cols-5 bg-slate-950/98 border-t border-slate-800">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`min-h-[52px] py-2 flex flex-col items-center justify-center gap-0.5 transition-all relative ${
                item.isPrimary
                  ? isActive
                    ? 'text-white'
                    : 'text-white'
                  : isActive
                  ? 'text-campus-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {/* Primary item gets gradient circle */}
              {item.isPrimary ? (
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isActive
                    ? 'bg-gradient-to-r from-campus-600 to-ai-purple shadow-glow-primary'
                    : 'bg-gradient-to-r from-campus-700 to-ai-purple/80'
                }`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              ) : (
                <>
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <span className="absolute top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-campus-400" />
                  )}
                </>
              )}
              <span className={`text-[10px] font-bold leading-none ${item.isPrimary ? 'text-campus-300' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
