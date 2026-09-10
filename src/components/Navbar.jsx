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
  LogOut,
  Menu,
  X,
  User,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Navbar = ({ currentTab, setTab, onOpenPhotoSearch, onOpenTour }) => {
  const { t, i18n } = useTranslation();
  const { currentUser, logout } = useAuth();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLangMenuOpen(false);
  };

  const handleMobileNav = (tabId) => {
    setTab(tabId);
    setMobileMenuOpen(false);
  };

  const allNavItems = [
    { id: 'landing', label: t('nav.home', 'Home'), icon: Sparkles },
    { id: 'browse', label: t('nav.explore', 'Explore'), icon: Compass, protected: true },
    { id: 'report', label: t('nav.report', 'Report Item'), icon: PlusCircle, isPrimary: true, protected: true },
    { id: 'my-reports', label: t('nav.myReports', 'My Radar'), icon: FolderLock, protected: true },
    { id: 'leaderboard', label: t('nav.leaderboard', 'Heroes'), icon: Trophy, protected: true },
    { id: 'admin', label: t('nav.admin', 'Admin'), icon: ShieldCheck, badge: currentUser?.role === 'admin' ? 'Admin' : null, protected: true }
  ];

  const navItems = allNavItems.filter(item => !item.protected || !!currentUser);

  return (
    <>
      {/* ============================================================
          TOP HEADER (DESKTOP & COMPACT MOBILE)
          ============================================================ */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-[72px] flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo */}
          <div
            onClick={() => setTab('landing')}
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-campus-600 via-ai-purple to-ai-fuchsia flex items-center justify-center text-white shadow-glow-primary group-hover:scale-105 transition-all">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
                  Trace<span className="text-campus-400">It</span>
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-campus-500/20 text-campus-300 border border-campus-500/30 shimmer-badge">
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
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-campus-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Tools (Desktop & Mobile Compact) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Search by Photo */}
            <button
              onClick={onOpenPhotoSearch}
              className="min-h-[38px] sm:min-h-[44px] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 flex items-center space-x-1.5 shadow-sm transition-all"
              title="Search catalog by photo"
            >
              <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="hidden lg:inline">{t('nav.photoSearch', 'Search by Photo')}</span>
            </button>

            {/* Language Switcher (Desktop) */}
            <div className="relative hidden sm:block">
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

            {/* Quick Help / Walkthrough (Desktop) */}
            <button
              onClick={onOpenTour}
              className="hidden sm:flex min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 items-center justify-center transition-all"
              title="How It Works / Guided Tour"
              aria-label="How it works"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Logout Button (Desktop) */}
            {currentUser && (
              <button
                onClick={async () => {
                  await logout();
                  setTab('auth', { replace: true });
                }}
                className="hidden sm:flex min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-900/30 border border-slate-800 hover:border-rose-900/50 items-center justify-center transition-all"
                title="Log Out"
                aria-label="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}

            {/* User Profile Pill or Sign In */}
            {currentUser ? (
              <button 
                onClick={() => setTab('profile')}
                className="flex items-center space-x-1.5 sm:space-x-2 pl-1 sm:pl-2 border-l border-slate-800 hover:bg-slate-800/50 p-1 rounded-xl transition-colors text-left"
                title="My Profile"
              >
                <img
                  src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                  alt={currentUser?.name}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl ring-2 ring-campus-500/40 object-cover bg-slate-800 shrink-0"
                />
                <div className="text-left hidden xl:block">
                  <p className="text-xs font-bold text-white truncate max-w-[100px]">{currentUser?.name}</p>
                  <p className="text-[11px] text-amber-300 font-bold">{currentUser?.points || 140} pts ⚡</p>
                </div>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 sm:space-x-2 pl-1 sm:pl-2 border-l border-slate-800">
                <button 
                  onClick={() => setTab('auth')} 
                  className="text-xs sm:text-sm font-bold text-slate-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => setTab('auth')} 
                  className="text-xs sm:text-sm font-bold text-white bg-campus-600 hover:bg-campus-500 px-3 sm:px-4 py-1.5 rounded-lg shadow-md transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile "More" Drawer Button (Top right mobile icon) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden min-h-[38px] min-w-[38px] p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800 flex items-center justify-center transition-all"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================
          FIXED MOBILE BOTTOM NAVIGATION BAR
          ============================================================ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 shadow-[0_-8px_24px_rgba(0,0,0,0.6)] px-2 py-1 pb-safe">
        <div className="grid grid-cols-5 items-center justify-items-center max-w-md mx-auto">
          {/* 1. Home */}
          <button
            onClick={() => setTab('landing')}
            className={`min-h-[50px] w-full flex flex-col items-center justify-center gap-1 transition-all relative ${
              currentTab === 'landing' ? 'text-campus-400 font-extrabold' : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${currentTab === 'landing' ? 'text-campus-400' : ''}`} />
            <span className="text-[10px] leading-none">Home</span>
            {currentTab === 'landing' && (
              <span className="absolute top-0 w-8 h-0.5 rounded-full bg-campus-400" />
            )}
          </button>

          {/* 2. Explore */}
          <button
            onClick={() => setTab('browse')}
            className={`min-h-[50px] w-full flex flex-col items-center justify-center gap-1 transition-all relative ${
              currentTab === 'browse' ? 'text-campus-400 font-extrabold' : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <Compass className={`w-5 h-5 ${currentTab === 'browse' ? 'text-campus-400' : ''}`} />
            <span className="text-[10px] leading-none">Explore</span>
            {currentTab === 'browse' && (
              <span className="absolute top-0 w-8 h-0.5 rounded-full bg-campus-400" />
            )}
          </button>

          {/* 3. Primary Elevated Action: Report */}
          <button
            onClick={() => setTab('report')}
            className="min-h-[50px] w-full flex flex-col items-center justify-center gap-0.5 -mt-3.5 group relative"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-active:scale-95 ${
              currentTab === 'report'
                ? 'bg-gradient-to-tr from-campus-500 via-ai-purple to-ai-fuchsia ring-2 ring-campus-400 shadow-glow-primary'
                : 'bg-gradient-to-tr from-campus-600 to-ai-purple shadow-campus-600/30'
            }`}>
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <span className={`text-[10px] font-black leading-none mt-0.5 ${
              currentTab === 'report' ? 'text-white' : 'text-campus-300'
            }`}>
              Report
            </span>
          </button>

          {/* 4. My Radar */}
          <button
            onClick={() => setTab('my-reports')}
            className={`min-h-[50px] w-full flex flex-col items-center justify-center gap-1 transition-all relative ${
              currentTab === 'my-reports' ? 'text-campus-400 font-extrabold' : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <FolderLock className={`w-5 h-5 ${currentTab === 'my-reports' ? 'text-campus-400' : ''}`} />
            <span className="text-[10px] leading-none">My Radar</span>
            {currentTab === 'my-reports' && (
              <span className="absolute top-0 w-8 h-0.5 rounded-full bg-campus-400" />
            )}
          </button>

          {/* 5. More Menu */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`min-h-[50px] w-full flex flex-col items-center justify-center gap-1 transition-all ${
              ['leaderboard', 'admin', 'profile'].includes(currentTab) ? 'text-campus-400 font-extrabold' : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* ============================================================
          MOBILE "MORE" SLIDE-OVER SHEET / DRAWER
          ============================================================ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setMobileMenuOpen(false)} />

          {/* Modal / Sheet Container */}
          <div className="relative w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-slideUp z-10 max-h-[85vh] overflow-y-auto pb-safe">
            
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto -mt-2 mb-2 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-campus-600 to-ai-purple flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">TraceIt Navigation</h3>
                  <p className="text-[11px] text-slate-400">All features &amp; account settings</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile Summary (if logged in) */}
            {currentUser && (
              <div 
                onClick={() => handleMobileNav('profile')}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-campus-500/40 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                    alt={currentUser?.name}
                    className="w-11 h-11 rounded-xl ring-2 ring-campus-500/40 object-cover bg-slate-800"
                  />
                  <div>
                    <h4 className="text-sm font-extrabold text-white">{currentUser?.name}</h4>
                    <p className="text-xs text-amber-300 font-bold">{currentUser?.points || 140} Hero Points ⚡</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            )}

            {/* Nav Links Grid */}
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleMobileNav('leaderboard')}
                className={`min-h-[48px] px-4 py-3 rounded-2xl text-left text-sm font-bold flex items-center justify-between transition-all ${
                  currentTab === 'leaderboard' ? 'bg-campus-600/20 text-campus-300 border border-campus-500/40' : 'bg-slate-950/40 hover:bg-slate-800 text-slate-200 border border-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <span>Campus Heroes &amp; Leaderboard</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => handleMobileNav('profile')}
                className={`min-h-[48px] px-4 py-3 rounded-2xl text-left text-sm font-bold flex items-center justify-between transition-all ${
                  currentTab === 'profile' ? 'bg-campus-600/20 text-campus-300 border border-campus-500/40' : 'bg-slate-950/40 hover:bg-slate-800 text-slate-200 border border-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-campus-500/20 text-campus-300 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span>My Profile &amp; Stats</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPhotoSearch();
                }}
                className="min-h-[48px] px-4 py-3 rounded-2xl text-left text-sm font-bold flex items-center justify-between bg-slate-950/40 hover:bg-slate-800 text-cyan-300 border border-slate-800/80 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span>Search Catalog by Photo</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTour();
                }}
                className="min-h-[48px] px-4 py-3 rounded-2xl text-left text-sm font-bold flex items-center justify-between bg-slate-950/40 hover:bg-slate-800 text-slate-200 border border-slate-800/80 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <span>How It Works / Guided Tour</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => handleMobileNav('admin')}
                  className={`min-h-[48px] px-4 py-3 rounded-2xl text-left text-sm font-bold flex items-center justify-between transition-all ${
                    currentTab === 'admin' ? 'bg-campus-600/20 text-campus-300 border border-campus-500/40' : 'bg-slate-950/40 hover:bg-slate-800 text-rose-300 border border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span>Admin Security Dashboard</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>

            {/* Language Switcher Section */}
            <div className="pt-3 border-t border-slate-800">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                🌐 Language / भाषा / ಭಾಷೆ
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 'en', label: 'English', flag: '🇺🇸' },
                  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
                  { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' }
                ].map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`min-h-[44px] px-2 py-2 rounded-xl text-center text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${
                      i18n.language === lang.code
                        ? 'bg-campus-600 text-white border-campus-400 shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Logout Button */}
            {currentUser && (
              <div className="pt-2">
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logout();
                    setTab('auth', { replace: true });
                  }}
                  className="w-full min-h-[48px] px-4 py-3 rounded-2xl font-bold text-sm bg-rose-950/40 text-rose-300 border border-rose-800/50 hover:bg-rose-900/40 flex items-center justify-center space-x-2 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of TraceIt</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
