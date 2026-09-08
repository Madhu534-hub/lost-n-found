import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Session load error:', err);
      setCurrentUser(null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const generateTraceItId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'TRC-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const buildProfileFromUser = (user) => {
    if (!user) return null;
    const meta = user.user_metadata || {};
    const name = meta.name || meta.full_name || user.email?.split('@')[0] || 'Campus Student';
    return {
      id: user.id,
      email: user.email,
      name,
      role: meta.role || 'student',
      avatar_url: meta.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      points: 140,
      monthly_points: 40,
      badges: [],
      traceit_id: meta.traceit_id || null,
      created_at: user.created_at
    };
  };

  const fetchUserProfile = async (authUser) => {
    if (!authUser) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    const fallbackProfile = buildProfileFromUser(authUser);
    // Set fallback immediately so currentUser is synchronously available
    setCurrentUser(fallbackProfile);

    try {
      // 1. Try to fetch from database if the table exists
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      
      let profileData = { ...fallbackProfile };
      
      if (!error && data) {
        profileData = { ...profileData, ...data };
      }
      
      // 2. Ensure TraceIt ID exists (Auto-generate for legacy users)
      if (!profileData.traceit_id) {
        const newTraceItId = generateTraceItId();
        profileData.traceit_id = newTraceItId;
        
        // Save to Auth metadata permanently (doesn't require public.users table)
        await supabase.auth.updateUser({
          data: { traceit_id: newTraceItId }
        }).catch(() => {});
        
        // Also try saving to DB if table exists
        if (!error) {
           await supabase.from('users').update({ traceit_id: newTraceItId }).eq('id', authUser.id).catch(() => {});
        }
      }
      
      setCurrentUser(profileData);
      
    } catch (err) {
      console.warn('Profile sync notice (using Supabase Auth user):', err.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { 
        success: false, 
        error: 'Supabase URL or API key is not configured. Please add your real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.' 
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        let msg = error.message;
        if (error.status === 429 || msg.toLowerCase().includes('rate limit')) {
          msg = 'Too many login attempts. Please wait a few minutes before trying again.';
        } else if (msg.toLowerCase().includes('invalid login credentials')) {
          msg = 'Invalid email or password. Please check your credentials and try again.';
        } else if (msg.toLowerCase().includes('email not confirmed')) {
          msg = 'Your email has not been confirmed yet. Please check your inbox for the confirmation link.';
        }
        return { success: false, error: msg };
      }
      return { success: true };
    } catch (err) {
      if (err.message?.includes('fetch') || err.name === 'TypeError') {
        return { 
          success: false, 
          error: 'Cannot reach Supabase servers. Please check your internet connection and verify your VITE_SUPABASE_URL in frontend/.env.' 
        };
      }
      return { success: false, error: err.message };
    }
  };

  const register = async (name, email, password) => {
    if (!isSupabaseConfigured()) {
      return { 
        success: false, 
        error: 'Supabase URL or API key is not configured. Please add your real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.' 
      };
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      const newTraceItId = generateTraceItId();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { 
            name: name.trim(),
            traceit_id: newTraceItId 
          } // Store name and traceit_id permanently in auth metadata
        }
      });
      
      if (authError) {
        let msg = authError.message;
        if (authError.status === 429 || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('over_email')) {
          msg = 'Too many email requests sent. Please wait a while before trying again, or try signing in if your account is already created.';
        } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already in use') || msg.toLowerCase().includes('user already exists')) {
          msg = 'An account with this email address already exists. Please switch to Sign In.';
        }
        return { success: false, error: msg };
      }

      // Supabase returns a user object even when user already exists if confirmation is enabled
      // If user identities array is empty, it means the user already exists!
      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        return {
          success: false,
          error: 'An account with this email address already exists. Please switch to Sign In.'
        };
      }

      if (authData.user) {
        // Try to insert into public.users table (might fail if table not created by user yet, which is fine)
        try {
          await supabase
            .from('users')
            .upsert([
              {
                id: authData.user.id,
                traceit_id: newTraceItId,
                name: name.trim(),
                email: cleanEmail,
                role: 'student',
                avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`
              }
            ]);
        } catch (dbErr) {
          console.warn('Profile sync note:', dbErr);
        }
      }

      // Check if session was granted or email confirmation required
      if (authData.user && !authData.session) {
        return {
          success: true,
          requiresConfirmation: true,
          message: 'Account created! Please check your email inbox to confirm your account, then sign in.'
        };
      }

      return { success: true };
    } catch (err) {
      if (err.message?.includes('fetch') || err.name === 'TypeError') {
        return { 
          success: false, 
          error: 'Cannot reach Supabase servers. Please check your internet connection and verify your VITE_SUPABASE_URL in frontend/.env.' 
        };
      }
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        loading,
        login,
        register,
        logout,
        isAdmin: currentUser?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
