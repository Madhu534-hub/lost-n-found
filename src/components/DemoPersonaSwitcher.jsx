import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Shield, User, CheckCircle2 } from 'lucide-react';

export const DemoPersonaSwitcher = () => {
  const { currentUser, allUsers, switchUser } = useAuth();

  const personas = [
    {
      id: 'user-alex',
      label: 'Alex Chen (Lost Backpack)',
      role: 'Student',
      emoji: '🎒',
      badge: 'Lost Report Owner',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'user-sarah',
      label: 'Sarah Connor (Found Item)',
      role: 'Student',
      emoji: '🔍',
      badge: 'Found Report Submitter',
      color: 'from-purple-600 to-indigo-600'
    },
    {
      id: 'user-admin',
      label: 'Officer Miller',
      role: 'Admin / Security',
      emoji: '🛡️',
      badge: 'Campus Security Admin',
      color: 'from-amber-600 to-emerald-600'
    },
    {
      id: 'user-priya',
      label: 'Priya Sharma (Student)',
      role: 'Student',
      emoji: '📱',
      badge: 'Lost AirPods & Flask',
      color: 'from-emerald-600 to-teal-600'
    }
  ];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800/80 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Hackathon Live Persona Switcher:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {personas.map(p => {
            const isActive = currentUser?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => switchUser(p.id)}
                className={`min-h-[40px] flex items-center space-x-2 px-3.5 py-1.5 rounded-full font-bold text-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r ' + p.color + ' text-white shadow-md ring-2 ring-white/40'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                <span className="text-sm">{p.emoji}</span>
                <span>{p.label}</span>
                {isActive && <CheckCircle2 className="w-4 h-4 text-white ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
