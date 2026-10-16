'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stethoscope, ArrowRight, ShieldCheck, Phone } from 'lucide-react';
import { motion } from 'motion/react';

export default function PatientPortalLogin() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    setIsLoading(true);
    // In a real app we'd verify OTP here. 
    // For the demo, we just pass the phone to the dashboard route.
    setTimeout(() => {
      router.push(`/patient/dashboard?phone=${encodeURIComponent(phone)}`);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">MedFlow Patient Portal</h1>
          <p className="text-slate-500 mt-2">Access your medical records, prescriptions, and lab reports securely.</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Registered Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                OTP verification is bypassed for this demo
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !phone}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-blue-200 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  View My Records
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Demo helper */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sandbox Accounts</p>
            <div className="space-y-2">
              <button 
                type="button"
                onClick={() => setPhone('+91 98765 43210')}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors flex justify-between items-center group"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">Rajesh Kumar</p>
                  <p className="text-xs text-slate-500">+91 98765 43210</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
