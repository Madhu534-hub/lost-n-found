import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ConfirmationModal } from './ConfirmationModal';
import {
  MessageSquare,
  Send,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  X,
  Sparkles,
  Info,
  Clock,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ChatDrawer = ({ isOpen, onClose, match, onReunited }) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [reunited, setReunited] = useState(match?.status === 'reunited');
  const [showConfirmReunite, setShowConfirmReunite] = useState(false);
  const messagesEndRef = useRef(null);

  const safeLocations = [
    'Main Library 1st Floor Security Desk',
    'Student Union Ground Floor Info Center',
    'Campus Police Station (Main Gate)',
    'Gates CS Building Front Desk'
  ];

  useEffect(() => {
    if (isOpen && match) {
      setReunited(match.status === 'reunited');
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, match]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!match?.id) return;
    try {
      const data = await api.getChat(match.id);
      if (data.messages) {
        setMessages(data.messages);
      }
      if (data.match?.status === 'reunited') {
        setReunited(true);
      }
    } catch (err) {
      console.error('Fetch chat error:', err);
    }
  };

  const handleSend = async (textToSend = inputText, isLocation = false) => {
    if (!textToSend.trim()) return;

    try {
      setSending(true);
      const newMsg = await api.sendMessage(match.id, {
        senderId: currentUser?.id || 'user-alex',
        senderName: currentUser?.name || 'Campus Student',
        text: textToSend.trim(),
        isLocationShare: isLocation
      });

      setMessages(prev => [...prev, newMsg]);
      setInputText('');
    } catch (err) {
      console.error('Send error:', err);
      showToast('Failed to send message.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleExecuteReunite = async () => {
    try {
      await api.markReunited(match.id, {
        userId: currentUser?.id,
        userName: currentUser?.name,
        notes: 'Handed over in person at campus security desk.'
      });

      setReunited(true);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 }
      });
      showToast('🎉 Item successfully marked as Reunited! +100 Hero Karma Points Awarded!', 'success');
      fetchMessages();
      if (onReunited) onReunited(match.id);
    } catch (err) {
      console.error('Mark reunited error:', err);
      showToast('Error marking reunited.', 'error');
    }
  };

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg h-full glass-panel border-l border-slate-800/80 shadow-2xl flex flex-col justify-between animate-slideInRight overflow-hidden">
        {/* Top gradient line */}
        <div className="h-1 bg-gradient-to-r from-campus-600 via-ai-purple to-ai-fuchsia" />

        {/* Header */}
        <div className="p-5 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-glow-emerald">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">Secure Match Chat</h3>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full font-bold">
                  Verified Owner
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Item: <span className="text-white font-medium">{match.lost_title || match.found_title || 'Campus Item'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reunited Status Banner */}
        {reunited ? (
          <div className="p-3.5 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border-b border-emerald-500/30 flex items-center justify-between px-5">
            <div className="flex items-center space-x-2 text-xs text-emerald-200">
              <Award className="w-4 h-4 text-amber-400 animate-bounce" />
              <span className="font-bold">Item Safely Reunited! 🎉</span>
            </div>
            <span className="text-[10px] text-emerald-300 bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
              Verified Handover ✅
            </span>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-950/30 border-b border-emerald-500/25 flex items-center justify-between px-5">
            <div className="flex items-center space-x-2 text-xs text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">Safe Campus Handover Active</span>
            </div>
            <button
              onClick={() => setShowConfirmReunite(true)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-white shadow-glow-emerald transition-all flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark as Reunited</span>
            </button>
          </div>
        )}

        {/* Safe Campus Meetup Spots Suggestions */}
        {!reunited && (
          <div className="p-4 bg-slate-900/30 border-b border-slate-800/60">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 mb-2.5">
              <MapPin className="w-3.5 h-3.5 text-campus-400" />
              <span>Suggested Pickup Desks (Recommended):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {safeLocations.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(`Let's meet at: ${loc}`, true)}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-campus-300 border border-slate-800 hover:border-campus-500/30 transition-all"
                >
                  📍 {loc}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map(msg => {
            const isMe = msg.sender_id === currentUser?.id || (currentUser?.id === 'user-alex' && msg.sender_id === 'user-alex');
            const isSystem = msg.sender_id === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/25 text-center my-3 animate-scaleIn">
                  <p className="text-xs text-purple-200 leading-relaxed font-semibold">{msg.text}</p>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-scaleIn`}
              >
                <div className="flex items-center space-x-1.5 mb-1 px-1.5">
                  <span className="text-[11px] text-slate-400 font-bold">{msg.sender_name}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-campus-600 to-ai-purple text-white rounded-tr-none shadow-md'
                      : 'bg-slate-900/80 text-slate-100 rounded-tl-none border border-slate-850'
                  } ${msg.is_location_share ? 'border-l-4 border-l-amber-400 bg-amber-950/20' : ''}`}
                >
                  {msg.is_location_share && (
                    <div className="flex items-center space-x-1 text-xs font-black text-amber-300 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>PROPOSED PICKUP SPOT</span>
                    </div>
                  )}
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-slate-800/60 bg-slate-900/30 flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={reunited ? 'Item reunited. Chat archive.' : 'Type your message to arrange safe pickup...'}
            disabled={reunited}
            className="flex-1 min-h-[48px] px-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim() || reunited}
            className="min-h-[48px] px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-glow-primary hover:opacity-95 disabled:opacity-40 flex items-center space-x-1.5 transition-all"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>

      {/* Confirmation Dialog Before Marking Reunited */}
      <ConfirmationModal
        isOpen={showConfirmReunite}
        onClose={() => setShowConfirmReunite(false)}
        onConfirm={handleExecuteReunite}
        title="Confirm Safe Item Handover"
        message="Are you sure you want to mark this item as successfully reunited with its owner? +100 Hero Karma Points will be awarded to the finder."
        confirmText="Yes, Mark Reunited (+100 pts)"
        cancelText="Cancel"
        type="success"
      />
    </div>
  );
};
