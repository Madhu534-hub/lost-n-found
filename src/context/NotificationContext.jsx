import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const channelRef = useRef(null);

  // ── Fetch notifications from Supabase ──────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id || !isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifications(data);
      }
    } catch (err) {
      console.warn('[NotificationContext] fetch error:', err.message);
    }
  }, [currentUser?.id]);

  // ── Subscribe to realtime inserts for this user ────────────────────────────
  useEffect(() => {
    if (!currentUser?.id || !isSupabaseConfigured()) return;

    // Initial fetch
    fetchNotifications();

    // Subscribe to realtime changes on the notifications table for this user
    const channel = supabase
      .channel(`notifications:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          setNotifications((prev) => {
            // Deduplicate by id
            if (prev.some((n) => n.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? payload.new : n))
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUser?.id, fetchNotifications]);

  // ── Mark a single notification as read ────────────────────────────────────
  const markAsRead = useCallback(async (notifId) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    if (!isSupabaseConfigured()) return;
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notifId)
        .eq('user_id', currentUser?.id);
    } catch (err) {
      console.warn('[NotificationContext] markAsRead error:', err.message);
    }
  }, [currentUser?.id]);

  // ── Mark all as read ───────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!currentUser?.id || !isSupabaseConfigured()) return;
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUser.id)
        .eq('read', false);
    } catch (err) {
      console.warn('[NotificationContext] markAllAsRead error:', err.message);
    }
  }, [currentUser?.id]);

  // ── Toast notifications (unchanged) ───────────────────────────────────────
  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        showToast,
        toast,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div className={`flex items-center space-x-3 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-xl border ${
            toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' :
            toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/40 text-rose-200' :
            'bg-slate-900/90 border-campus-500/40 text-campus-100'
          }`}>
            <span className="text-xl">
              {toast.type === 'success' ? '✨' : toast.type === 'error' ? '⚠️' : '💡'}
            </span>
            <div className="text-sm font-medium">{toast.message}</div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
