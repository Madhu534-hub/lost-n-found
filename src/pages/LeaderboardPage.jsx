import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Trophy, Award, Medal, Sparkles, Star, CheckCircle2, Flame, Heart, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LeaderboardPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('monthly'); // 'monthly' | 'allTime'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.getLeaderboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const usersList = tab === 'monthly' ? (data?.monthly || []) : (data?.allTime || []);
  const top3 = usersList.slice(0, 3);
  const rest = usersList.slice(3);

  const pointsBreakdown = [
    {
      points: '+100 Points',
      label: 'When your found-item report leads to a verified, resolved reunion!',
      color: 'text-emerald-400',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400'
    },
    {
      points: '+20 Points',
      label: 'For submitting detailed reports with photos and auto-tags.',
      color: 'text-purple-400',
      icon: Sparkles,
      iconColor: 'text-purple-400'
    },
    {
      points: 'Badges & Tiers',
      label: 'Unlock Campus Legend, Guardian, and Master Finder profile badges!',
      color: 'text-amber-400',
      icon: Star,
      iconColor: 'text-amber-400'
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3 animate-slideUp">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Campus Gamification &amp; Karma Rewards</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          Campus Heroes Leaderboard
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Recognizing students and staff who keep our campus honest and helpful.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center justify-center">
        <div className="glass-panel p-1.5 rounded-2xl border border-slate-800 flex space-x-2">
          <button
            onClick={() => setTab('monthly')}
            className={`min-h-[48px] px-6 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
              tab === 'monthly'
                ? 'bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-glow-primary'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            🌟 Monthly Heroes
          </button>
          <button
            onClick={() => setTab('allTime')}
            className={`min-h-[48px] px-6 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
              tab === 'allTime'
                ? 'bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-glow-primary'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            🏆 All-Time Legends
          </button>
        </div>
      </div>

      {/* Podium Top 3 — FIX: flex layout instead of grid to control mobile ordering correctly */}
      {top3.length > 0 && (
        <div className="max-w-4xl mx-auto">
          {/* Desktop: 2nd | 1st | 3rd layout using flex + order */}
          <div className="hidden md:flex items-end justify-center gap-5">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="glass-card rounded-3xl p-6 border border-slate-700 text-center flex flex-col items-center w-64 mb-0">
                <div className="w-10 h-10 rounded-full bg-slate-600 text-white font-black flex items-center justify-center mb-3 text-base">
                  🥈
                </div>
                <img
                  src={top3[1].avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[1].id}`}
                  alt={top3[1].name}
                  className="w-20 h-20 rounded-full ring-4 ring-slate-600 object-cover bg-slate-800 mb-3"
                />
                <h4 className="text-base font-extrabold text-white">{top3[1].name}</h4>
                <p className="text-xs text-slate-400 capitalize mb-2">{top3[1].role}</p>
                <div className="px-3 py-1.5 rounded-full bg-slate-800 text-cyan-300 font-black text-sm border border-slate-700">
                  {tab === 'monthly' ? top3[1].monthly_points : top3[1].points} pts
                </div>
              </div>
            )}

            {/* 1st Place Champion — taller */}
            {top3[0] && (
              <div className="glass-card rounded-3xl p-8 border-2 border-amber-500/60 text-center flex flex-col items-center w-72 shadow-2xl bg-gradient-to-b from-amber-950/40 to-slate-900/90 -mb-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black flex items-center justify-center mb-3 text-xl shadow-lg">
                  👑
                </div>
                <img
                  src={top3[0].avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[0].id}`}
                  alt={top3[0].name}
                  className="w-28 h-28 rounded-full ring-4 ring-amber-400 object-cover bg-slate-800 mb-3 shadow-glow-primary"
                />
                <h3 className="text-xl font-black text-white">{top3[0].name}</h3>
                <p className="text-xs text-amber-300 font-bold capitalize mb-3">{top3[0].role} • Campus Champion</p>
                <div className="px-4 py-2 rounded-full bg-amber-500/20 text-amber-300 font-black text-base border border-amber-500/50">
                  {tab === 'monthly' ? top3[0].monthly_points : top3[0].points} Karma pts
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="glass-card rounded-3xl p-6 border border-slate-700 text-center flex flex-col items-center w-64">
                <div className="w-10 h-10 rounded-full bg-amber-800/70 text-amber-200 font-black flex items-center justify-center mb-3 text-base">
                  🥉
                </div>
                <img
                  src={top3[2].avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[2].id}`}
                  alt={top3[2].name}
                  className="w-20 h-20 rounded-full ring-4 ring-amber-700/50 object-cover bg-slate-800 mb-3"
                />
                <h4 className="text-base font-extrabold text-white">{top3[2].name}</h4>
                <p className="text-xs text-slate-400 capitalize mb-2">{top3[2].role}</p>
                <div className="px-3 py-1.5 rounded-full bg-slate-800 text-cyan-300 font-black text-sm border border-slate-700">
                  {tab === 'monthly' ? top3[2].monthly_points : top3[2].points} pts
                </div>
              </div>
            )}
          </div>

          {/* Mobile: natural vertical stack 1st → 2nd → 3rd */}
          <div className="md:hidden space-y-4">
            {top3.map((user, idx) => {
              const medals = ['👑 #1 Champion', '🥈 #2 Runner-Up', '🥉 #3 Third Place'];
              const ringColors = ['ring-amber-400', 'ring-slate-500', 'ring-amber-700/60'];
              return (
                <div key={user.id} className={`glass-card rounded-2xl p-5 border flex items-center space-x-4 ${idx === 0 ? 'border-amber-500/50 bg-gradient-to-r from-amber-950/30 to-slate-900/80' : 'border-slate-800'}`}>
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                    alt={user.name}
                    className={`w-16 h-16 rounded-xl object-cover ring-2 ${ringColors[idx]} bg-slate-800 shrink-0`}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400">{medals[idx]}</p>
                    <h4 className="text-base font-extrabold text-white">{user.name}</h4>
                    <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                  </div>
                  <div className={`text-lg font-black ${idx === 0 ? 'text-amber-300' : 'text-cyan-300'}`}>
                    {tab === 'monthly' ? user.monthly_points : user.points} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Rankings Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-4xl mx-auto space-y-4">
        <h4 className="text-base font-extrabold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <Medal className="w-5 h-5 text-amber-400" />
          <span>Full Campus Hero Rankings</span>
          <span className="ml-auto text-xs font-semibold text-slate-400">{usersList.length} Heroes</span>
        </h4>

        <div className="space-y-2">
          {usersList.map((user, idx) => (
            <div
              key={user.id}
              className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition-all hover:-translate-y-0.5 ${
                idx === 0 ? 'bg-amber-950/20 border-amber-500/30' :
                idx === 1 ? 'bg-slate-800/60 border-slate-700/60' :
                idx === 2 ? 'bg-amber-900/10 border-amber-700/20' :
                'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                  idx === 0 ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950' :
                  idx === 1 ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950' :
                  idx === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {idx < 3 ? ['👑', '🥈', '🥉'][idx] : `#${idx + 1}`}
                </span>
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                  alt={user.name}
                  className="w-11 h-11 rounded-xl object-cover bg-slate-800 shrink-0"
                />
                <div>
                  <h5 className="text-sm font-extrabold text-white">{user.name}</h5>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {(user.badges || []).map((b, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-xl font-black ${idx === 0 ? 'text-amber-300' : 'text-cyan-300'}`}>
                  {tab === 'monthly' ? user.monthly_points : user.points} pts
                </span>
                <div className="text-xs text-slate-400 mt-0.5">{user.reunited_count || 0} items reunited</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to Earn Points — with icons */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-4xl mx-auto">
        <h4 className="text-sm font-extrabold text-white flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>How to Earn Campus Karma Points</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {pointsBreakdown.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${item.iconColor} shrink-0`} />
                  <span className={`font-extrabold text-base ${item.color}`}>{item.points}</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
