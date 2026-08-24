import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: '🎯 96% Match Found!',
      message: 'A black JanSport backpack found near Main Library matches your reported lost item.',
      time: '10m ago',
      read: false,
      type: 'match',
      matchId: 'match-1',
      reportId: 'rep-lost-1'
    },
    {
      id: 'notif-2',
      title: '🔐 Verification Unlocked',
      message: 'Ownership challenge passed for backpack. In-app secure chat is now active.',
      time: '5m ago',
      read: false,
      type: 'verified',
      matchId: 'match-1'
    }
  ]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        showToast,
        toast
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
