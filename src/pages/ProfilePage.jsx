import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  User, Mail, Hash, Shield, Calendar, 
  MapPin, AlertCircle, MessageSquare, 
  Search, ShieldCheck, Trophy
} from 'lucide-react';

export function ProfilePage() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    lost: 0,
    found: 0,
    matches: 0,
    chats: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!currentUser?.id) return;
      
      try {
        // Fetch Reports count
        const { data: reports, error: reportsErr } = await supabase
          .from('reports')
          .select('id, type')
          .eq('user_id', currentUser.id);
          
        if (reportsErr) throw reportsErr;
        
        const lost = reports.filter(r => r.type === 'lost').length;
        const found = reports.filter(r => r.type === 'found').length;
        
        // Fetch Matches (where user is either lost or found reporter)
        // We do a simple approximation by getting all reports by this user and finding matches for them
        const reportIds = reports.map(r => r.id);
        
        let matchesCount = 0;
        let chatsCount = 0;
        
        if (reportIds.length > 0) {
          const { data: matches, error: matchErr } = await supabase
            .from('matches')
            .select('id')
            .or(`lost_report_id.in.(${reportIds.join(',')}),found_report_id.in.(${reportIds.join(',')})`);
            
          if (!matchErr && matches) {
            matchesCount = matches.length;
            
            // Fetch Chats (distinct matches where user has sent or received a message)
            const matchIds = matches.map(m => m.id);
            if (matchIds.length > 0) {
              const { data: messages, error: msgErr } = await supabase
                .from('messages')
                .select('match_id')
                .in('match_id', matchIds);
                
              if (!msgErr && messages) {
                // Count unique matches with messages
                const uniqueMatchIds = new Set(messages.map(m => m.match_id));
                chatsCount = uniqueMatchIds.size;
              }
            }
          }
        }
        
        setStats({ lost, found, matches: matchesCount, chats: chatsCount });
      } catch (err) {
        console.error('Error fetching profile stats:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, [currentUser]);

  if (!currentUser) return null;

  const joinDate = currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 fade-in">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Column: User Card */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-campus-600/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <div className="relative flex flex-col items-center text-center">
              <div className="relative">
                <img 
                  src={currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.name)}`} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full border-4 border-slate-800 bg-slate-800 shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 bg-campus-600 rounded-full p-1.5 shadow-lg border-2 border-slate-900">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <h2 className="mt-4 text-2xl font-black text-white">{currentUser.name}</h2>
              <div className="flex items-center space-x-1.5 mt-1 text-slate-400">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{currentUser.email}</span>
              </div>
              
              <div className="w-full mt-6 space-y-3">
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Hash className="w-4 h-4 text-ai-purple" />
                    <span className="text-xs font-bold uppercase">TraceIt ID</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-white bg-slate-800 px-2 py-1 rounded">
                    {currentUser.traceit_id || 'Generating...'}
                  </span>
                </div>
                
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Calendar className="w-4 h-4 text-campus-400" />
                    <span className="text-xs font-bold uppercase">Joined</span>
                  </div>
                  <span className="text-sm font-medium text-slate-300">{joinDate}</span>
                </div>
                
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase">Hero Points</span>
                  </div>
                  <span className="text-sm font-bold text-amber-300">{currentUser.points} ⚡</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Activity */}
        <div className="w-full md:w-2/3 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-black text-white mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-campus-400" />
              My Activity
            </h3>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-24 bg-slate-800/50 rounded-xl"></div>
                <div className="h-24 bg-slate-800/50 rounded-xl"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 hover:border-rose-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-rose-500/20 p-2 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                    </div>
                    <span className="text-2xl font-black text-white">{stats.lost}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-400">My Lost Reports</p>
                </div>
                
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-emerald-500/20 p-2 rounded-xl">
                      <MapPin className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-2xl font-black text-white">{stats.found}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-400">My Found Reports</p>
                </div>
                
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 hover:border-ai-purple/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-ai-purple/20 p-2 rounded-xl">
                      <Search className="w-5 h-5 text-ai-purple" />
                    </div>
                    <span className="text-2xl font-black text-white">{stats.matches}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-400">My Matches</p>
                </div>
                
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 hover:border-campus-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-campus-500/20 p-2 rounded-xl">
                      <MessageSquare className="w-5 h-5 text-campus-400" />
                    </div>
                    <span className="text-2xl font-black text-white">{stats.chats}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-400">My Chats</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-black text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-ai-purple" />
              Account Security
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Your internal authentication details are kept secure. The TraceIt ID is your public-facing unique identifier for matches and chats.
            </p>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-300">End-to-End Secure</p>
                <p className="text-xs text-emerald-400/80 mt-1">Your account uses enterprise-grade Supabase authentication and row-level security (RLS).</p>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
