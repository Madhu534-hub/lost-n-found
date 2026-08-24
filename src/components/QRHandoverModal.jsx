import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { QrCode, ShieldCheck, CheckCircle2, X, Loader2, Award, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const QRHandoverModal = ({ isOpen, onClose, match, onHandoverConfirmed }) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(match?.status === 'reunited');

  useEffect(() => {
    if (isOpen && match) {
      loadQR();
    }
  }, [isOpen, match]);

  const loadQR = async () => {
    try {
      setLoading(true);
      const res = await api.generateQR(match.id);
      setQrToken(res.qrToken || `TRACEIT-HANDOVER-${match.id}`);
      if (res.handover?.status === 'confirmed' || match.status === 'reunited') {
        setIsConfirmed(true);
      }
    } catch (err) {
      console.error('Failed to generate QR:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmScan = async () => {
    try {
      setConfirming(true);
      const res = await api.confirmQR(match.id, {
        qrToken,
        scannedByUserId: currentUser?.id || 'user-alex',
        scannedByName: currentUser?.name || 'Campus Member'
      });

      setIsConfirmed(true);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 }
      });
      showToast('🎉 In-person handover verified! +100 Hero Karma points awarded!', 'success');
      if (onHandoverConfirmed) {
        onHandoverConfirmed(match.id);
      }
    } catch (err) {
      console.error('Handover confirmation failed:', err);
      showToast('Error confirming QR handover.', 'error');
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border border-campus-500/40 shadow-2xl space-y-6 relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-campus-600 to-ai-purple flex items-center justify-center text-white shadow-glow-primary">
            <QrCode className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-white">Physical Handover Confirmation</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            Present this QR code when meeting at the campus security desk to safely confirm the handover in person.
          </p>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 text-campus-400 animate-spin" />
            <span className="text-xs text-slate-400">Generating secure handover QR token...</span>
          </div>
        ) : isConfirmed ? (
          <div className="p-6 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-glow-emerald">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-emerald-200">Verified Handover Completed! ✅</h4>
            <p className="text-xs text-emerald-300/80 leading-relaxed">
              This item has been officially reunited and verified on campus.
            </p>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-900/60 rounded-full text-xs font-bold text-emerald-300 border border-emerald-500/30">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>+100 Hero Karma Points Awarded</span>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl mx-auto w-fit shadow-2xl border-4 border-slate-800">
              <QRCodeSVG
                value={qrToken || 'TRACEIT-HANDOVER'}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="text-[11px] text-slate-400">
              Token ID: <code className="text-campus-300 font-mono">{qrToken}</code>
            </div>

            {/* Confirm / Scan simulation button (>= 48px height) */}
            <button
              onClick={handleConfirmScan}
              disabled={confirming}
              className="w-full min-h-[48px] px-6 py-3.5 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-glow-emerald hover:opacity-95 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying Physical Handover...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Scan & Confirm In-Person Handover</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
