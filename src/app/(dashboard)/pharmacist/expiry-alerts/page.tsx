'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Search,
  CheckCircle,
  Clock,
  ChevronRight,
  ShieldAlert,
  Layers,
  ArrowRight,
  Trash2,
  Percent,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpiryItem {
  id: string;
  medicineName: string;
  genericName: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  costPrice: number;
  status: 'EXPIRED' | 'CRITICAL' | 'WARNING'; // Expired, <30 days, <90 days
  daysRemaining: number;
}

const MOCK_EXPIRY_ITEMS: ExpiryItem[] = [
  {
    id: 'exp-1',
    medicineName: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    batchNumber: 'AML-2026-G1',
    quantity: 15,
    expiryDate: '2026-06-15',
    costPrice: 3.0,
    status: 'CRITICAL',
    daysRemaining: 20,
  },
  {
    id: 'exp-2',
    medicineName: 'Ibuprofen',
    genericName: 'Ibuprofen',
    batchNumber: 'IBU-2026-O1',
    quantity: 8,
    expiryDate: '2026-05-20',
    costPrice: 1.5,
    status: 'EXPIRED',
    daysRemaining: -6,
  },
  {
    id: 'exp-3',
    medicineName: 'Amoxicillin',
    genericName: 'Amoxicillin Trihydrate',
    batchNumber: 'AMX-2026-C1',
    quantity: 50,
    expiryDate: '2026-08-10',
    costPrice: 4.5,
    status: 'WARNING',
    daysRemaining: 76,
  },
];

export default function PharmacistExpiryAlerts() {
  const [items, setItems] = useState<ExpiryItem[]>(MOCK_EXPIRY_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter = filterStatus === 'ALL' || item.status === filterStatus;
      return matchSearch && matchFilter;
    });
  }, [items, searchQuery, filterStatus]);

  const totalLossCost = useMemo(() => {
    return items
      .filter((i) => i.status === 'EXPIRED')
      .reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
  }, [items]);

  const handleRecallBatch = (id: string, batchNumber: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSuccessToast(`Batch ${batchNumber} successfully recalled and flagged for write-off!`);
    setTimeout(() => setSuccessToast(null), 2200);
  };

  const handleLiquidateBatch = (batchNumber: string) => {
    setSuccessToast(`Batch ${batchNumber} prioritized for checkout with liquidation discount!`);
    setTimeout(() => setSuccessToast(null), 2200);
  };

  return (
    <div className="space-y-6">
      {/* Expiry stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Already Expired</p>
            <p className="text-3xl font-extrabold text-red-600 mt-1">
              {items.filter((i) => i.status === 'EXPIRED').length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Losses (Expired)</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-1 font-display">
              ₹{totalLossCost.toFixed(2)}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Under 30 Days (Critical)</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">
              {items.filter((i) => i.status === 'CRITICAL').length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Expiry alerts listing */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden relative">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">
                Expiry Monitoring & Warnings
              </h3>
              <p className="text-xs text-slate-400">
                Identify expired or near-expiry batches to schedule recall write-offs or liquidation FIFO rules.
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
                placeholder="Search batch or drug..."
                className="w-48 h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-400"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {['ALL', 'EXPIRED', 'CRITICAL', 'WARNING'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer',
                    filterStatus === st
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-100'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  )}
                >
                  {st === 'ALL' ? 'All' : st}
                </button>
              ))}
            </div>

            <button
              onClick={() => setItems(MOCK_EXPIRY_ITEMS)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Reset Mock Batches"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Alerts table listing */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-3 px-6">Medicine Detail</th>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Cost Value</th>
                <th className="py-3 px-4">Risk Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-slate-800">{item.medicineName}</span>
                      <span className="text-[10px] italic text-slate-400">({item.genericName})</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-slate-600">
                    {item.batchNumber}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-500">
                    {item.quantity} units
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-500">
                    {item.expiryDate}
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-800 font-display">
                    ₹{(item.quantity * item.costPrice).toFixed(2)}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                        item.status === 'EXPIRED' && 'bg-red-50 text-red-600 border border-red-100',
                        item.status === 'CRITICAL' && 'bg-amber-50 text-amber-600 border border-amber-100',
                        item.status === 'WARNING' && 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      )}
                    >
                      {item.status === 'EXPIRED'
                        ? `Expired (${Math.abs(item.daysRemaining)}d ago)`
                        : `${item.daysRemaining} days left`}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.status === 'EXPIRED' ? (
                        <button
                          onClick={() => handleRecallBatch(item.id, item.batchNumber)}
                          className="h-7 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          Recall Write-off
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleLiquidateBatch(item.batchNumber)}
                            className="h-7 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-200 text-amber-600 text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                            title="Apply Liquidation Discount"
                          >
                            <Percent className="h-3 w-3" />
                            Liquidate
                          </button>
                          <button
                            onClick={() =>
                              setSuccessToast(`Batch ${item.batchNumber} flagged as High Priority FIFO checkout!`)
                            }
                            className="h-7 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                          >
                            <Layers className="h-3 w-3" />
                            FIFO Priority
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                    <p className="text-sm font-semibold">No expiry warnings</p>
                    <p className="text-xs">All active batches have healthy shelf lifespans</p>
                  </td>
                </tr>
              )}
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
              className="absolute bottom-6 left-6 right-6 bg-slate-900 text-white rounded-xl py-3 px-4 shadow-xl flex items-center justify-between"
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
