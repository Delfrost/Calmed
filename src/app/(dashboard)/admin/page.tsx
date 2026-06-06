'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Users,
  Stethoscope,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Building,
  ArrowRight,
  Percent,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem {
  label: string;
  value: string;
  change: string;
  trendingUp: boolean;
  icon: React.ElementType;
  bg: string;
  text: string;
}

export default function AdminOverview() {
  const stats: StatItem[] = [
    {
      label: 'Gross Revenue',
      value: '₹1,43,890.00',
      change: '+12.5% vs last week',
      trendingUp: true,
      icon: DollarSign,
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Total Consultations',
      value: '1,248',
      change: '+4.3% vs last week',
      trendingUp: true,
      icon: Stethoscope,
      bg: 'bg-teal-50',
      text: 'text-teal-600',
    },
    {
      label: 'Weekly split Paid Out',
      value: '₹88,250.00',
      change: '+8.2% vs last week',
      trendingUp: true,
      icon: TrendingUp,
      bg: 'bg-purple-50',
      text: 'text-purple-600',
    },
    {
      label: 'Patient Retention',
      value: '84.2%',
      change: '-1.5% vs last week',
      trendingUp: false,
      icon: Users,
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
  ];

  const chartData = [
    { label: 'Mon', consult: 8200, pharmacy: 5400 },
    { label: 'Tue', consult: 9400, pharmacy: 6800 },
    { label: 'Wed', consult: 7800, pharmacy: 7200 },
    { label: 'Thu', consult: 11200, pharmacy: 8900 },
    { label: 'Fri', consult: 10500, pharmacy: 9200 },
    { label: 'Sat', consult: 12100, pharmacy: 11400 },
    { label: 'Sun', consult: 6500, pharmacy: 4300 },
  ];

  const maxVal = 25000;

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-xs font-bold text-blue-400 border border-blue-500/10 uppercase tracking-wide">
              <Building className="h-3.5 w-3.5" />
              MedFlow Polyclinics OS
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
              Clinic Operations Center
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              Hello Rajesh, you are currently viewing unified performance analytics across all active polyclinic branches.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-white/5 select-none">
              <Calendar className="h-4 w-4" />
              Today: {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((st, idx) => {
          const Icon = st.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{st.label}</p>
                <p className="text-2xl font-black text-slate-800 mt-1.5 font-display">{st.value}</p>
                <p className="text-[11px] font-semibold mt-1 flex items-center gap-1">
                  {st.trendingUp ? (
                    <span className="text-emerald-600 flex items-center">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      {st.change.split(' ')[0]}
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center">
                      <ArrowDownRight className="h-3.5 w-3.5" />
                      {st.change.split(' ')[0]}
                    </span>
                  )}
                  <span className="text-slate-400 font-medium">{st.change.split(' ').slice(1).join(' ')}</span>
                </p>
              </div>

              <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm', st.bg, st.text)}>
                <Icon className="h-5.5 w-5.5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Revenue split Flex Bar Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-soft flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800 font-display">
                  Weekly Income Performance
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consultation Fees vs Pharmacy drug sales split performance.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold text-slate-500 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-blue-600" />
                  Consultation
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-teal-400" />
                  Pharmacy Sales
                </div>
              </div>
            </div>

            {/* Custom SVG Flex-based Bar Charts */}
            <div className="py-6 flex items-end justify-around h-[220px] pr-2">
              {chartData.map((data, idx) => {
                const totalVal = data.consult + data.pharmacy;
                const consultPct = (data.consult / maxVal) * 100;
                const pharmaPct = (data.pharmacy / maxVal) * 100;

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 group flex-1">
                    <div className="relative w-7 sm:w-10 h-[160px] flex items-end justify-center gap-1">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-elevated z-10 pointer-events-none">
                        <p>Fees: ₹{data.consult}</p>
                        <p>Meds: ₹{data.pharmacy}</p>
                      </div>

                      {/* Consultation Bar */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${consultPct}%` }}
                        className="w-3.5 sm:w-4 bg-blue-600 rounded-t shadow-sm"
                      />

                      {/* Pharmacy Bar */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${pharmaPct}%` }}
                        className="w-3.5 sm:w-4 bg-teal-400 rounded-t shadow-sm"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{data.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 rounded-xl text-[10px] text-slate-400 flex items-center justify-between">
            <span>Saturday shows peak consultations (121 checks completed).</span>
            <span className="font-bold text-blue-600">Calculated automatically</span>
          </div>
        </div>

        {/* Right Column: Live Doctor split Splits & Split Indicators (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-soft flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800 font-display">
                Top Performing Splits
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated Doctor weekly consultation values.
              </p>
            </div>

            <div className="space-y-3.5">
              {[
                { name: 'Dr. Anand Sharma', specialty: 'Cardiology', consultations: 248, split: 70, share: '₹1,24,000' },
                { name: 'Dr. Neha Gupta', specialty: 'Dermatologist', consultations: 182, split: 65, share: '₹91,000' },
                { name: 'Dr. Vikram Seth', specialty: 'Pediatrician', consultations: 92, split: 70, share: '₹36,800' },
              ].map((dr, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-100 p-3 hover:bg-slate-50/50 transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{dr.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {dr.specialty} · {dr.consultations} visits
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-blue-600 font-display">{dr.share}</p>
                    <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {dr.split}% cut
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              href="/admin/payouts"
              className="w-full h-8.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
            >
              Open Payouts Ledger
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
