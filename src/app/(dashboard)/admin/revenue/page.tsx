'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  DollarSign,
  Percent,
  Activity,
  ArrowRight,
  TrendingDown,
  Building,
  User,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminRevenue() {
  const [activeTab, setActiveTab] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');

  const stats = {
    gross: 143890,
    doctorCut: 88250,
    clinicCut: 55640,
    gstTax: 25900,
  };

  const salesBreakdown = [
    { source: 'Clinical Consultation splits', amount: 82000, margin: 70, share: 57400, color: 'bg-blue-600' },
    { source: 'Pharmacy Attached Sales', amount: 41890, margin: 45, share: 18850, color: 'bg-teal-500' },
    { source: 'Diagnostic Lab Commissions', amount: 20000, margin: 30, share: 6000, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Sales Income</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1 font-display">₹{stats.gross.toLocaleString()}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Doctor Share</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1 font-display">₹{stats.doctorCut.toLocaleString()}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <User className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Clinic share</p>
            <p className="text-2xl font-extrabold text-teal-600 mt-1 font-display">₹{stats.clinicCut.toLocaleString()}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Building className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Financial splits margin charts (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-soft flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800 font-display">
                  Revenue Channels & Margins
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Split margins and absolute splits computed dynamically from clinic configurations.
                </p>
              </div>

              {/* Weekly switcher */}
              <div className="flex gap-1.5 bg-slate-50 p-1 rounded-lg select-none">
                <button
                  onClick={() => setActiveTab('WEEKLY')}
                  className={cn(
                    'px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer',
                    activeTab === 'WEEKLY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
                  )}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setActiveTab('MONTHLY')}
                  className={cn(
                    'px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer',
                    activeTab === 'MONTHLY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
                  )}
                >
                  Monthly
                </button>
              </div>
            </div>

            {/* Margin lines flex items */}
            <div className="space-y-5 py-2">
              {salesBreakdown.map((item, idx) => {
                const totalPct = (item.amount / stats.gross) * 100;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{item.source}</span>
                      <span className="text-slate-400">
                        ₹{item.amount.toLocaleString()} ({totalPct.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${totalPct}%` }}
                        className={cn('h-full rounded-full', item.color)}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                      <span>Applied Margin Split Split: {item.margin}%</span>
                      <span className="text-slate-700">Calculated Cut: ₹{item.share.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 rounded-xl text-[10px] text-slate-400">
            Consultations provide 57% of absolute gross billing value.
          </div>
        </div>

        {/* Right: Security split audit trails (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-soft flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800 font-display">
                Weekly Financial split Ledger Log
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit transactions processed today.
              </p>
            </div>

            <div className="space-y-3 pr-1 max-h-[300px] overflow-y-auto">
              {[
                { ref: 'TXN-101', detail: 'Rajesh Kumar consultation bill processed', amount: '₹875.00', time: '10 mins ago' },
                { ref: 'TXN-102', detail: 'Priya Sharma pharmacy checkout settled', amount: '₹580.00', time: '25 mins ago' },
                { ref: 'TXN-103', detail: 'Amit Patel lab order fee settled', amount: '₹800.00', time: '1 hour ago' },
              ].map((log, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-100 p-3 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{log.detail}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Ref: {log.ref} · {log.time}</p>
                  </div>
                  <span className="font-bold text-blue-600 shrink-0 font-display">{log.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            Billing ledgers auto-reconcile on multi-tenant frameworks.
          </div>
        </div>
      </div>
    </div>
  );
}
