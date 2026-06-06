'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign,
  Search,
  CheckCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Percent,
  UserCheck,
  Building,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Payout {
  id: string;
  doctorName: string;
  specialty: string;
  period: string;
  consultationsCount: number;
  grossRevenue: number;
  doctorShare: number;
  splitPercent: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  processedDate?: string;
}

const INITIAL_PAYOUTS: Payout[] = [
  {
    id: 'pay-001',
    doctorName: 'Dr. Anand Sharma',
    specialty: 'Cardiologist',
    period: '20 May - 26 May',
    consultationsCount: 248,
    grossRevenue: 124000,
    doctorShare: 86800,
    splitPercent: 70,
    status: 'APPROVED',
  },
  {
    id: 'pay-002',
    doctorName: 'Dr. Neha Gupta',
    specialty: 'Dermatologist',
    period: '20 May - 26 May',
    consultationsCount: 182,
    grossRevenue: 109200,
    doctorShare: 70980,
    splitPercent: 65,
    status: 'PAID',
    processedDate: '2026-05-25',
  },
  {
    id: 'pay-003',
    doctorName: 'Dr. Vikram Seth',
    specialty: 'Pediatrician',
    period: '20 May - 26 May',
    consultationsCount: 92,
    grossRevenue: 36800,
    doctorShare: 25760,
    splitPercent: 70,
    status: 'PENDING',
  },
];

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>(INITIAL_PAYOUTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const filteredPayouts = payouts.filter((pay) => {
    const matchSearch =
      pay.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  const handleProcessPayout = (id: string, name: string) => {
    setPayouts((prev) =>
      prev.map((pay) =>
        pay.id === id ? { ...pay, status: 'PAID', processedDate: new Date().toLocaleDateString('en-IN') } : pay
      )
    );
    setSuccessToast(`Weekly split payout for ${name} successfully settled via bank transfer!`);
    setTimeout(() => setSuccessToast(null), 2200);
  };

  const handleApprovePayout = (id: string, name: string) => {
    setPayouts((prev) =>
      prev.map((pay) => (pay.id === id ? { ...pay, status: 'APPROVED' } : pay))
    );
    setSuccessToast(`Weekly payout sheet for ${name} successfully approved!`);
    setTimeout(() => setSuccessToast(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unprocessed Payouts</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-1">
              {payouts.filter((p) => p.status === 'PENDING').length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved splits value</p>
            <p className="text-3xl font-extrabold text-indigo-600 mt-1 font-display">
              ₹{payouts.filter((p) => p.status === 'APPROVED').reduce((s, p) => s + p.doctorShare, 0).toLocaleString()}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payouts Disbursed (Weekly)</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1 font-display">
              ₹{payouts.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.doctorShare, 0).toLocaleString()}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Payouts table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden relative">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">
                Weekly Doctor Splits Payout Ledger
              </h3>
              <p className="text-xs text-slate-400">
                Process Split payout calculations and trigger mock bank transactions for Doctor splits splits.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search payouts by doctor..."
                className="w-48 h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-400"
              />
            </div>

            <button
              onClick={() => setPayouts(INITIAL_PAYOUTS)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Reset Ledger Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-3 px-6">Practitioner Info</th>
                <th className="py-3 px-4">Period Range</th>
                <th className="py-3 px-4">Gross In consultations</th>
                <th className="py-3 px-4">Doctor Splits Cut %</th>
                <th className="py-3 px-4">Payout Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Settlement Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-600">
              {filteredPayouts.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-bold text-slate-800">{pay.doctorName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{pay.specialty}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-500 font-medium">
                    {pay.period}
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-slate-800">
                    ₹{pay.grossRevenue.toLocaleString()} <span className="text-[10px] font-medium text-slate-400">({pay.consultationsCount} visits)</span>
                  </td>
                  <td className="py-4 px-4 font-bold text-teal-600 font-display">
                    {pay.splitPercent}%
                  </td>
                  <td className="py-4 px-4 font-extrabold text-blue-600 font-display text-sm">
                    ₹{pay.doctorShare.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                        pay.status === 'PAID' && 'bg-emerald-50 text-emerald-700 border border-emerald-100',
                        pay.status === 'APPROVED' && 'bg-blue-50 text-blue-700 border border-blue-100',
                        pay.status === 'PENDING' && 'bg-amber-50 text-amber-700 border border-amber-100'
                      )}
                    >
                      {pay.status === 'PAID' ? `Disbursed (${pay.processedDate})` : pay.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {pay.status === 'PENDING' && (
                        <button
                          onClick={() => handleApprovePayout(pay.id, pay.doctorName)}
                          className="h-7 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 text-indigo-600 text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                        >
                          Approve Sheet
                        </button>
                      )}

                      {pay.status === 'APPROVED' && (
                        <button
                          onClick={() => handleProcessPayout(pay.id, pay.doctorName)}
                          className="h-7 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          Process Bank Transfer
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {pay.status === 'PAID' && (
                        <span className="text-[10px] font-bold text-slate-400">Reconciled</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      </div>
    </div>
  );
}
