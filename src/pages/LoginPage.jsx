import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Sparkles, MapPin, Search, Mail, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// BUG FIX: PasswordInput was previously defined INSIDE LoginPage's function body.
//
// WHY THAT WAS A BUG:
//   When you define a component (like PasswordInput) inside another component's
//   function, React creates a brand-new "component type" every time the parent
//   re-renders. React sees the old and new PasswordInput as two DIFFERENT
//   components, so it DESTROYS the old input and CREATES a fresh one from scratch.
//   That's why the cursor lost focus after every keystroke — the <input> element
//   you were typing into was being deleted and replaced with a new one!
//
// THE FIX:
//   Move PasswordInput OUTSIDE of LoginPage so it's only created once.
//   Now React recognises it as the same stable component across renders and
//   simply updates its props without destroying the DOM element.
// ──────────────────────────────────────────────────────────────────────────────
const PasswordInput = ({ id, label, value, onChange, show, onToggle, placeholder = '••••••••', minLength = 6 }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Lock className="h-5 w-5 text-slate-500" />
      </div>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        required
        value={value}
        onChange={onChange}
        className="block w-full pl-10 pr-12 py-3 border border-slate-800 rounded-xl leading-5 bg-slate-950/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-campus-500 focus:border-campus-500 sm:text-sm transition-all"
        placeholder={placeholder}
        minLength={minLength}
        autoComplete={label.toLowerCase().includes('new') ? 'new-password' : 'current-password'}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 pr-3 flex items-center min-w-[44px] min-h-[44px] justify-center text-slate-400 hover:text-white transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  </div>
);

export function LoginPage() {
  const { login, register } = useAuth();
  // 'login' | 'signup' | 'forgot' | 'reset'
  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Reset password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);

  const isLogin = view === 'login';
  const isSignup = view === 'signup';
  const isForgot = view === 'forgot';
  const isReset = view === 'reset';

  // Listen for PASSWORD_RECOVERY event to auto-switch to reset view
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('reset');
        setError(null);
        setInfoMessage(null);
      }
    });
    // Also check URL hash for recovery token (type=recovery)
    if (window.location.hash?.includes('type=recovery') || window.location.pathname === '/reset-password') {
      setView('reset');
    }
    return () => subscription.unsubscribe();
  }, []);

  const startCooldown = (seconds) => {
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      if (isSignup) {
        // Confirm password validation
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const result = await register(name, email, password);
        if (!result.success) {
          setError(result.error || 'Account creation failed.');
          if (result.error?.includes('Too many') || result.error?.includes('wait')) startCooldown(15);
        } else if (result.requiresConfirmation) {
          setInfoMessage(result.message);
          setView('login');
        }
      } else if (isLogin) {
        const result = await login(email, password);
        if (!result.success) {
          setError(result.error || 'Authentication failed. Please check your credentials.');
          if (result.error?.includes('Too many') || result.error?.includes('wait')) startCooldown(15);
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (loading || !email.trim()) return;

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://lost-n-found-nfiq.vercel.app/reset-password'
      });
      if (resetError) {
        // Supabase does not reveal whether email exists by design
        setError(resetError.message);
      } else {
        setInfoMessage('If an account exists with this email, a password reset link has been sent. Please check your inbox.');
      }
    } catch (err) {
      setError(err.message || 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setInfoMessage(null);

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError(updateError.message);
      } else {
        setInfoMessage('Password updated successfully. You can now log in with your new password.');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          setView('login');
          // Clean up URL hash from recovery token
          if (window.location.hash) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Password update failed.');
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
            The intelligent lost &amp; found network for your campus.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-xl">

          {/* ── Reset Password View ── */}
          {isReset ? (
            <>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Set New Password</h3>
                  <p className="text-xs text-slate-400">Enter and confirm your new password.</p>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <PasswordInput
                  id="new-password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  show={showNewPassword}
                  onToggle={() => setShowNewPassword(v => !v)}
                />
                <PasswordInput
                  id="confirm-new-password"
                  label="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  show={showConfirmNew}
                  onToggle={() => setShowConfirmNew(v => !v)}
                />

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
                {infoMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-start space-x-2">
                    <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-300">{infoMessage}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-campus-600 hover:bg-campus-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-campus-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          ) : isForgot ? (
            /* ── Forgot Password View ── */
            <>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Forgot Password?</h3>
                  <p className="text-xs text-slate-400">Enter your email to receive a reset link.</p>
                </div>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
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

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
                {infoMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-start space-x-2">
                    <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-300">{infoMessage}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-campus-600 hover:bg-campus-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-campus-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => { setView('login'); setError(null); setInfoMessage(null); }}
                  className="w-full text-center text-sm text-campus-400 hover:text-campus-300 font-semibold transition-colors mt-2"
                >
                  ← Back to Sign In
                </button>
              </form>
            </>
          ) : (
            /* ── Login / Signup View ── */
            <>
              <div className="flex bg-slate-950 rounded-xl p-1 mb-6 border border-slate-800">
                <button
                  onClick={() => { setView('login'); setError(null); setInfoMessage(null); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    isLogin
                      ? 'bg-campus-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setView('signup'); setError(null); setInfoMessage(null); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    isSignup
                      ? 'bg-campus-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && (
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
                        placeholder="Your name"
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

                <PasswordInput
                  id="login-password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  show={showPassword}
                  onToggle={() => setShowPassword(v => !v)}
                />

                {isSignup && (
                  <PasswordInput
                    id="confirm-password"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    show={showConfirm}
                    onToggle={() => setShowConfirm(v => !v)}
                  />
                )}

                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => { setView('forgot'); setError(null); setInfoMessage(null); }}
                      className="text-sm text-campus-400 hover:text-campus-300 font-semibold transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

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
            </>
          )}
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
