'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Building,
  CheckCircle,
  Percent,
  Clock,
  ArrowRight,
  ShieldAlert,
  Globe,
  Coins,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSettings() {
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form states
  const [clinicName, setClinicName] = useState('MedFlow Polyclinics Inc.');
  const [licenseNo, setLicenseNo] = useState('MD-LIC-84392/A');
  const [phone, setPhone] = useState('+91 0120-43210');
  const [address, setAddress] = useState('Sector 62, Noida, Uttar Pradesh, India');

  const [consultFee, setConsultFee] = useState('500');
  const [defaultSplit, setDefaultSplit] = useState('70');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessToast('Clinic settings and tenant parameters successfully saved!');
    setTimeout(() => setSuccessToast(null), 2200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 bg-white border border-slate-200 rounded-2xl shadow-soft">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Settings className="h-5 w-5 animate-spin-slow" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 font-display">
            Clinic System Settings
          </h3>
          <p className="text-xs text-slate-400">
            Configure clinic branding, default split splits, pricing configurations, and multi-tenant keys.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative">
        {/* Left: General Settings (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-6">
          <div className="space-y-5">
            <h4 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Building className="h-4.5 w-4.5 text-blue-500" />
              polyclinic Demographics & License
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                   polclinic Name
                </label>
                <input
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Registration License No
                </label>
                <input
                  type="text"
                  required
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-50 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Primary Contact Phone
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  TimeZone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-10 px-2 rounded-xl border border-slate-200 text-xs outline-none bg-white focus:border-blue-400"
                >
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="America/New_York">US (EST)</option>
                  <option value="Europe/London">UK (GMT)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Physical Clinic Address
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              Save Configuration Settings
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right: Default split splits & multi-tenancy configurations (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-soft flex flex-col justify-between">
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Coins className="h-4.5 w-4.5 text-blue-500" />
              Billing & Splits splits
            </h4>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Base Consultation Fee (₹)
              </label>
              <input
                type="number"
                required
                value={consultFee}
                onChange={(e) => setConsultFee(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-50 font-mono font-bold text-slate-700"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Default Doctor Split splits (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={defaultSplit}
                  onChange={(e) => setDefaultSplit(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)).toString())}
                  className="w-full h-10 pl-3.5 pr-8 rounded-xl border border-slate-200 text-xs outline-none transition-all focus:border-blue-400 font-mono font-bold text-blue-600"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                This splits consultation margins between visiting specialists and clinic coffers.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Default Currency Code
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none bg-white focus:border-blue-400 font-bold"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
              </select>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
            <Lock className="h-4 w-4 text-slate-300" />
            Config keys are secure under PostgreSQL multi-tenant cuid layers.
          </div>
        </div>

        {/* Success toast absolute banner */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-6 right-6 bg-slate-900 text-white rounded-xl py-3 px-4 shadow-xl flex items-center justify-between z-40"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold">{successToast}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
