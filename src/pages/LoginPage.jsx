import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, MapPin, Search, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;

    setLoading(true);
    setError(null);
    setInfoMessage(null);
    
    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        result = await register(name, email, password);
      }
      
      if (!result.success) {
        setError(result.error || 'Authentication failed. Please check your credentials.');
        // Set a 5-second submit cooldown if rate limited or failed
        if (result.error?.includes('Too many') || result.error?.includes('wait')) {
          setCooldown(15);
          const interval = setInterval(() => {
            setCooldown((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else if (result.requiresConfirmation) {
        setInfoMessage(result.message);
        setIsLogin(true); // Switch to Sign In view for user
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-campus-600 via-ai-purple to-ai-fuchsia shadow-glow-primary mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Trace<span className="text-campus-400">It</span>
            <span className="ml-2 text-xs font-extrabold px-2 py-1 rounded-full bg-campus-500/20 text-campus-300 border border-campus-500/30 align-top">AI</span>
          </h2>
          <p className="mt-3 text-slate-400 text-sm font-medium">
            The intelligent lost & found network for your campus.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex bg-slate-950 rounded-xl p-1 mb-6 border border-slate-800">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                isLogin 
                  ? 'bg-campus-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                !isLogin 
                  ? 'bg-campus-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl leading-5 bg-slate-950/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-campus-500 focus:border-campus-500 sm:text-sm transition-all"
                    placeholder="Alex Chen"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl leading-5 bg-slate-950/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-campus-500 focus:border-campus-500 sm:text-sm transition-all"
                  placeholder="alex@college.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl leading-5 bg-slate-950/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-campus-500 focus:border-campus-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            {infoMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-start space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-300">{infoMessage}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || cooldown > 0}
              className="w-full mt-6 flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-campus-600 hover:bg-campus-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-campus-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </span>
              ) : cooldown > 0 ? (
                <span>Please wait ({cooldown}s)...</span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>{isLogin ? 'Sign In Securely' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
        </div>
        
        {/* Features Footer */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800 flex items-center space-x-3">
            <div className="bg-ai-purple/20 p-2 rounded-lg">
              <Search className="w-4 h-4 text-ai-fuchsia" />
            </div>
            <p className="text-xs font-semibold text-slate-300">AI Visual Match</p>
          </div>
          <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800 flex items-center space-x-3">
            <div className="bg-campus-500/20 p-2 rounded-lg">
              <MapPin className="w-4 h-4 text-campus-400" />
            </div>
            <p className="text-xs font-semibold text-slate-300">Smart Mapping</p>
          </div>
        </div>
      </div>
    </div>
  );
}
