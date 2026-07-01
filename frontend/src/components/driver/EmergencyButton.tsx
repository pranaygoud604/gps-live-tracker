import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface EmergencyButtonProps {
  isConnected: boolean;
  location: { lat: number; lng: number } | null;
  onEmergency: (data: { message: string; location: { lat: number; lng: number } | null; timestamp: number }) => void;
}

export function EmergencyButton({ isConnected, location, onEmergency }: EmergencyButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const handlePress = useCallback(() => {
    if (!isConnected) return;
    setShowConfirm(true);
    setCountdown(5);

    let count = 5;
    const timer = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        onEmergency({ message: 'Driver needs immediate assistance!', location, timestamp: Date.now() });
        setSent(true);
        setShowConfirm(false);
        setTimeout(() => setSent(false), 5000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isConnected, location, onEmergency]);

  const handleCancel = useCallback(() => {
    setShowConfirm(false);
    setCountdown(5);
  }, []);

  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Emergency</p>

      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-center"
          >
            <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-400">Emergency Alert Sent!</p>
            <p className="text-xs text-slate-500 mt-1">Admin has been notified.</p>
          </motion.div>
        ) : showConfirm ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-red-500/15 border border-red-500/30 p-4"
          >
            <p className="text-sm font-semibold text-red-400 text-center mb-3">
              Sending alert in {countdown}s…
            </p>
            <div className="w-full bg-red-900/30 rounded-full h-1.5 mb-3">
              <motion.div
                className="bg-red-500 h-1.5 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
              />
            </div>
            <button
              onClick={handleCancel}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-sm text-white hover:bg-white/12 transition-colors"
            >
              <X size={14} />
              Cancel Emergency
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="button"
            onClick={handlePress}
            disabled={!isConnected}
            whileTap={{ scale: 0.96 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl
              bg-red-600/15 border border-red-500/30 text-red-400 font-semibold text-sm
              hover:bg-red-600/25 hover:border-red-500/50 transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <AlertTriangle size={16} />
            Emergency Alert
          </motion.button>
        )}
      </AnimatePresence>

      {!isConnected && (
        <p className="text-2xs text-slate-600 text-center mt-2">Connect to server to use emergency</p>
      )}
    </div>
  );
}
