import React, { useCallback, useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DemoPersonaSwitcher } from './components/DemoPersonaSwitcher';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { BrowseReportsPage } from './pages/BrowseReportsPage';
import { ReportItemPage } from './pages/ReportItemPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReverseImageSearchModal } from './components/ReverseImageSearchModal';
import { OnboardingWalkthrough } from './components/OnboardingWalkthrough';
import { QRHandoverModal } from './components/QRHandoverModal';
import { Sparkles } from 'lucide-react';

import { LoginPage } from './pages/LoginPage';
import { useAuth } from './context/AuthContext';

const PATH_TO_TAB = {
  '/': 'landing',
  '/dashboard': 'browse',
  '/app': 'browse',
  '/reports': 'browse',
  '/report': 'report',
  '/chat': 'my-reports',
  '/profile': 'profile',
  '/leaderboard': 'leaderboard',
  '/admin': 'admin',
  '/my-reports': 'my-reports',
  '/auth': 'auth',
};

const TAB_TO_PATH = {
  landing: '/',
  browse: '/dashboard',
  report: '/report',
  'my-reports': '/my-reports',
  leaderboard: '/leaderboard',
  admin: '/admin',
  profile: '/profile',
  auth: '/auth',
};

const getTabFromLocation = () => PATH_TO_TAB[window.location.pathname] || 'landing';

export function AppContent() {
  const { session, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(getTabFromLocation);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Modals state
  const [photoSearchOpen, setPhotoSearchOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [qrModalMatch, setQrModalMatch] = useState(null);

  const navigateToTab = useCallback((tab, { replace = false } = {}) => {
    const path = TAB_TO_PATH[tab] || '/';
    if (window.location.pathname !== path) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
    }
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    const handlePopState = () => setActiveTab(getTabFromLocation());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!session) {
      navigateToTab('auth', { replace: true });
    } else if (activeTab === 'auth') {
      navigateToTab('landing', { replace: true });
    }
  }, [activeTab, session, loading, navigateToTab]);

  const handleReportCreated = (newReport) => {
    navigateToTab('my-reports');
  };

  const handleSelectReport = (report) => {
    setSelectedReport(report);
    navigateToTab('my-reports');
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  }

  // Every application route, including the landing page, requires a valid Supabase session.
  // This runs before any TraceIt UI renders, preventing protected-content flashes.
  if (!session) {
    return <LoginPage />;
  }
  
  // If they are logged in and on auth tab, redirect to default authenticated view
  if (session && activeTab === 'auth') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-campus-500 selection:text-white">
      {/* 1-Click Demo Persona Bar for Hackathon Presentation */}
      <DemoPersonaSwitcher />

      {/* Campus Navigation Bar */}
      <Navbar
        currentTab={activeTab}
        setTab={navigateToTab}
        onOpenPhotoSearch={() => setPhotoSearchOpen(true)}
        onOpenTour={() => setTourOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'landing' && (
          <LandingPage
            setActiveTab={navigateToTab}
            onOpenPhotoSearch={() => setPhotoSearchOpen(true)}
          />
        )}

        {activeTab === 'browse' && (
          <BrowseReportsPage
            onOpenPhotoSearch={() => setPhotoSearchOpen(true)}
            onSelectReport={handleSelectReport}
          />
        )}

        {activeTab === 'report' && (
          <ReportItemPage
            onReportCreated={handleReportCreated}
            onViewExistingReport={handleSelectReport}
          />
        )}

        {activeTab === 'my-reports' && (
          <MyReportsPage
            onReportNew={() => navigateToTab('report')}
            onOpenQR={(match) => setQrModalMatch(match)}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardPage />
        )}

        {activeTab === 'admin' && (
          <AdminDashboardPage />
        )}

        {activeTab === 'profile' && (
          <ProfilePage />
        )}
      </main>

      {/* Modals */}
      <ReverseImageSearchModal
        isOpen={photoSearchOpen}
        onClose={() => setPhotoSearchOpen(false)}
        onSelectReport={handleSelectReport}
      />

      <OnboardingWalkthrough
        forceOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />

      <QRHandoverModal
        isOpen={!!qrModalMatch}
        onClose={() => setQrModalMatch(null)}
        match={qrModalMatch}
        onHandoverConfirmed={() => {}}
      />

      {/* Premium Branded Footer */}
      <footer className="mt-auto border-t border-slate-800/60 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-campus-600 via-ai-purple to-ai-fuchsia flex items-center justify-center shadow-glow-primary">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-white tracking-tight">
                  Trace<span className="text-campus-400">It</span>
                  <span className="ml-1.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-campus-500/20 text-campus-300 border border-campus-500/30">AI</span>
                </p>
                <p className="text-[11px] text-slate-400">AI-Powered Smart Campus Lost &amp; Found</p>
              </div>
            </div>

            {/* Tech Stack Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: 'Gemini Vision', emoji: '🔭' },
                { label: 'React + Vite', emoji: '⚡' },
                { label: 'Multimodal AI', emoji: '🧠' },
                { label: 'Leaflet Maps', emoji: '🗺️' },
              ].map(t => (
                <span key={t.label} className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-slate-300 border border-slate-800">
                  {t.emoji} {t.label}
                </span>
              ))}
            </div>

            {/* Hackathon Badge */}
            <div className="text-center md:text-right">
              <p className="text-[11px] text-slate-400">Built for</p>
              <p className="text-xs font-extrabold text-white">Google for Developers</p>
              <p className="text-[11px] text-campus-400 font-semibold">HBS × PromptWars × YenTech</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-center">
            <p className="text-[11px] text-slate-500">
              © 2026 TraceIt — Reinventing campus lost &amp; found with AI. All campus data is kept private and secure.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
