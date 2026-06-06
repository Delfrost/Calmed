'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Stethoscope, ClipboardList, Check, Pill, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  tokenNumber?: number;
  type: 'CHECK_IN' | 'DISPENSED' | 'LAB_UPLOAD' | 'PAYOUT';
  timestamp: string;
}

export default function ToastNotifier() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'medflow-toast' && e.newValue) {
        try {
          const toastData: ToastMessage = JSON.parse(e.newValue);
          // Append new toast
          setToasts((prev) => [...prev, toastData]);

          // Play a gentle alert sound if browser allows
          try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.connect(gain);
            gain.connect(context.destination);
            osc.frequency.value = 523.25; // C5
            gain.gain.setValueAtTime(0.08, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
            osc.start();
            osc.stop(context.currentTime + 0.35);
          } catch (audioErr) {
            // Audio context blocked, fail silently
          }

          // Auto-remove after 4 seconds
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toastData.id));
          }, 4500);
        } catch (err) {
          // Parsing failure
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 120, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 120, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className={cn(
                'pointer-events-auto w-full rounded-2xl border bg-white/90 backdrop-blur-xl p-4 shadow-xl flex items-start gap-3',
                toast.type === 'CHECK_IN' && 'border-amber-100 shadow-amber-200/20',
                toast.type === 'DISPENSED' && 'border-emerald-100 shadow-emerald-200/20',
                toast.type === 'LAB_UPLOAD' && 'border-purple-100 shadow-purple-200/20',
                toast.type === 'PAYOUT' && 'border-indigo-100 shadow-indigo-200/20'
              )}
            >
              {/* Left icon wrapper */}
              <div
                className={cn(
                  'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm',
                  toast.type === 'CHECK_IN' && 'bg-gradient-to-tr from-amber-500 to-orange-500',
                  toast.type === 'DISPENSED' && 'bg-gradient-to-tr from-emerald-500 to-teal-500',
                  toast.type === 'LAB_UPLOAD' && 'bg-gradient-to-tr from-purple-500 to-pink-500',
                  toast.type === 'PAYOUT' && 'bg-gradient-to-tr from-indigo-500 to-blue-500'
                )}
              >
                {toast.type === 'CHECK_IN' && <ClipboardList className="h-4.5 w-4.5" />}
                {toast.type === 'DISPENSED' && <Pill className="h-4.5 w-4.5" />}
                {toast.type === 'LAB_UPLOAD' && <FlaskConical className="h-4.5 w-4.5" />}
                {toast.type === 'PAYOUT' && <Check className="h-4.5 w-4.5" />}
              </div>

              {/* Toast info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-extrabold text-slate-800 leading-tight">
                    {toast.title}
                  </p>
                  <button
                    onClick={() => handleDismiss(toast.id)}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {toast.description}
                </p>
                <div className="flex items-center justify-between mt-2 text-[9px] font-bold text-slate-400">
                  <span>{toast.timestamp}</span>
                  {toast.tokenNumber && (
                    <span className="bg-slate-100 rounded px-1.5 py-0.5 font-black uppercase text-slate-600">
                      Token #{toast.tokenNumber}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
