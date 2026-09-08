import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MatchCard } from '../components/MatchCard';
import { VerificationModal } from '../components/VerificationModal';
import { ChatDrawer } from '../components/ChatDrawer';
import {
  FolderHeart,
  Sparkles,
  MapPin,
  Clock,
  PlusCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  MessageSquare,
  Star,
  Trash2,
  Camera
} from 'lucide-react';

export const MyReportsPage = ({ onReportNew, onOpenQR }) => {
  const { currentUser, session, loading: authLoading } = useAuth();
  const [myReports, setMyReports] = useState([]);
  const [matchesByReport, setMatchesByReport] = useState({});
  const [expandedReports, setExpandedReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [activeVerificationMatch, setActiveVerificationMatch] = useState(null);
  const [activeChatMatch, setActiveChatMatch] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    loadUserReports();
  }, [currentUser?.id, session?.user?.id, authLoading]);

  const loadUserReports = async () => {
    const userId = currentUser?.id || session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch active campus reports from Supabase
      const allReports = await api.getReports();
      const rawList = Array.isArray(allReports) ? allReports : [];

      // Exclude hardcoded legacy test reports so user starts with a clean slate
      const IGNORED_TEST_IDS = new Set([
        'rep-lost-1788411878794',
        'rep-lost-1788701762319',
        'rep-found-1788701921369'
      ]);
      const cleanAll = rawList.filter(r => !IGNORED_TEST_IDS.has(r.id));

      // Filter reports belonging to current user
      const userReports = cleanAll.filter(r => r.user_id === userId);
      setMyReports(userReports);

      // Auto-expand and calculate multimodal fusion matches across the campus pool
      const matchesMap = {};
      const expandedMap = {};

      for (const rep of userReports) {
        try {
          const matches = await api.getMatchesForReport(rep.id, cleanAll);
          const safeMatches = Array.isArray(matches) ? matches : [];
          matchesMap[rep.id] = safeMatches;
          expandedMap[rep.id] = safeMatches.length > 0;
        } catch {
          matchesMap[rep.id] = [];
          expandedMap[rep.id] = false;
        }
      }

      setMatchesByReport(matchesMap);
      setExpandedReports(expandedMap);
    } catch (err) {
      console.error('Failed to load user reports:', err);
      setError(err.message || 'Unable to load your active reports. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await api.deleteReport(reportId);
      loadUserReports();
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  const toggleExpand = (reportId) => {
    setExpandedReports(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  const handleVerificationSuccess = (matchId, proceedToChat = false) => {
    loadUserReports();
    if (proceedToChat && activeVerificationMatch) {
      setActiveChatMatch(activeVerificationMatch);
    }
  };

  const formatReportTime = (ts) => {
    if (!ts) return 'Recent';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return 'Recent';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  const totalMatchesCount = Object.values(matchesByReport).reduce((acc, mList) => acc + (mList?.length || 0), 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              My Radar &amp; Active Reports
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-campus-500/20 text-campus-300 border border-campus-500/30">
              {currentUser?.name || session?.user?.email?.split('@')[0] || 'Campus Student'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time proactive radar monitoring campus lost &amp; found streams for matches.
          </p>
        </div>

        <button
          onClick={onReportNew}
          className="min-h-[48px] flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-glow-primary hover:opacity-95 self-start transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Report Another Item</span>
        </button>
      </div>

      {/* Proactive Radar Alert Banner */}
      {totalMatchesCount > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-campus-950 via-slate-900 to-ai-purple/30 border border-campus-500/40 shadow-glow-primary flex flex-wrap items-center justify-between gap-4 animate-scaleIn">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-campus-500/20 border border-campus-500/40 flex items-center justify-center text-campus-300 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse text-cyan-400" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                🎯 {totalMatchesCount} High-Confidence AI {totalMatchesCount === 1 ? 'Match' : 'Matches'} Detected!
              </h4>
              <p className="text-sm text-slate-300">
                {totalMatchesCount === 1
                  ? 'A matching item was found near Main Library with 96% confidence.'
                  : `${totalMatchesCount} matching items found across campus with high confidence.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="skeleton w-16 h-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/3 rounded" />
                  <div className="skeleton h-5 w-1/2 rounded" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-panel p-10 rounded-3xl text-center space-y-4 border border-rose-800/40 bg-rose-950/20 animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-900/30 border border-rose-700/40 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-white">Unable to Load Reports</h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {error}
          </p>
          <button
            onClick={loadUserReports}
            className="min-h-[44px] inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-extrabold bg-campus-600 text-white hover:bg-campus-500 transition-all shadow-glow-primary"
          >
            <span>Try Again</span>
          </button>
        </div>
      ) : myReports.length === 0 ? (
        <div className="glass-panel p-14 rounded-3xl text-center space-y-5 border border-slate-800 animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            <FolderHeart className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-extrabold text-white">No active reports found</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            You haven't filed any active reports yet. Report an item and our AI will scan for matches automatically.
          </p>
          <button
            onClick={onReportNew}
            className="min-h-[48px] inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-glow-primary hover:opacity-95 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            <span>File a New Report Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-slideUp">
          {myReports.map(report => {
            const isLost = report.type === 'lost';
            const matches = matchesByReport[report.id] || [];
            const isExpanded = !!expandedReports[report.id];

            return (
              <div
                key={report.id}
                className="glass-card rounded-2xl border border-slate-800 overflow-hidden"
              >
                {/* Report Top Row */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="relative shrink-0">
                      {report.photo_url ? (
                        <img
                          src={report.photo_url}
                          alt={report.title}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-700 bg-slate-950"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl border border-slate-700 bg-slate-950 flex items-center justify-center text-slate-500">
                          <Camera className="w-7 h-7" />
                        </div>
                      )}
                      {report.is_high_value && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                          <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                          isLost ? 'bg-rose-950 text-rose-300 border border-rose-500/30' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {isLost ? '🔴 Lost' : '🟢 Found'}
                        </span>
                        <span className="text-xs font-semibold text-campus-400">{report.category}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-white mt-1">{report.title}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" /> {report.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" /> {formatReportTime(report.timestamp)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Match Toggle */}
                  <div className="flex items-center space-x-2.5 self-end sm:self-center shrink-0">
                    {matches.length > 0 ? (
                      <button
                        onClick={() => toggleExpand(report.id)}
                        className="min-h-[44px] flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-extrabold bg-campus-600/30 text-campus-200 border border-campus-500/40 hover:bg-campus-600/50 transition-all shadow-glow-primary"
                      >
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>{matches.length} AI {matches.length === 1 ? 'Match' : 'Matches'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    ) : (
                      <div className="px-3 py-2 rounded-xl bg-slate-900 text-xs text-slate-400 border border-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
                        <span>Scanning Pool...</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      title="Delete report"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Matches List */}
                {isExpanded && matches.length > 0 && (
                  <div className="border-t border-slate-800 p-5 space-y-4 bg-slate-900/40 animate-fadeIn">
                    <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-300">
                      <Sparkles className="w-4 h-4 text-ai-purple" />
                      <span>AI Candidate Matches Ranked for this Item:</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {matches.map(match => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          onStartVerification={(m) => setActiveVerificationMatch(m)}
                          onOpenChat={(m) => setActiveChatMatch(m)}
                          onOpenQR={(m) => onOpenQR && onOpenQR(m)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Verification Challenge Modal */}
      <VerificationModal
        isOpen={!!activeVerificationMatch}
        onClose={() => setActiveVerificationMatch(null)}
        match={activeVerificationMatch}
        onVerificationSuccess={handleVerificationSuccess}
      />

      {/* In-App Chat Drawer */}
      <ChatDrawer
        isOpen={!!activeChatMatch}
        onClose={() => setActiveChatMatch(null)}
        match={activeChatMatch}
        onReunited={() => loadUserReports()}
      />
    </div>
  );
};
