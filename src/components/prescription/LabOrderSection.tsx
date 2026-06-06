'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FlaskConical, Search, X, StickyNote, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LabTestOption, LabOrderData } from '@/types';

interface LabOrderSectionProps {
  labOrders: LabOrderData[];
  onAdd: (test: LabTestOption) => void;
  onRemove: (index: number) => void;
  onUpdateNotes: (index: number, notes: string) => void;
}

const AVAILABLE_TESTS: LabTestOption[] = [
  // Blood Tests
  { id: 'lt-1', name: 'CBC (Complete Blood Count)', category: 'Blood Tests', price: 350 },
  { id: 'lt-2', name: 'Blood Sugar (Fasting)', category: 'Blood Tests', price: 150 },
  { id: 'lt-3', name: 'HbA1c', category: 'Blood Tests', price: 600 },
  { id: 'lt-4', name: 'Lipid Profile', category: 'Blood Tests', price: 500 },
  { id: 'lt-5', name: 'Thyroid Panel (T3, T4, TSH)', category: 'Blood Tests', price: 800 },
  { id: 'lt-6', name: 'Liver Function Test (LFT)', category: 'Blood Tests', price: 450 },
  { id: 'lt-7', name: 'Kidney Function Test (KFT)', category: 'Blood Tests', price: 500 },
  { id: 'lt-8', name: 'Vitamin D', category: 'Blood Tests', price: 900 },
  { id: 'lt-9', name: 'Vitamin B12', category: 'Blood Tests', price: 700 },
  // Urine Tests
  { id: 'lt-10', name: 'Urinalysis', category: 'Urine Tests', price: 200 },
  { id: 'lt-11', name: 'Urine Culture & Sensitivity', category: 'Urine Tests', price: 450 },
  // Imaging
  { id: 'lt-12', name: 'X-Ray Chest (PA View)', category: 'Imaging', price: 400 },
  { id: 'lt-13', name: 'X-Ray Spine', category: 'Imaging', price: 500 },
  { id: 'lt-14', name: 'Ultrasound Abdomen', category: 'Imaging', price: 1200 },
  { id: 'lt-15', name: 'ECG (12-Lead)', category: 'Imaging', price: 300 },
  // Pathology
  { id: 'lt-16', name: 'Biopsy', category: 'Pathology', price: 2000 },
  { id: 'lt-17', name: 'Pap Smear', category: 'Pathology', price: 800 },
];

const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  'Blood Tests': { border: 'border-l-red-400', bg: 'bg-red-50', text: 'text-red-700' },
  'Urine Tests': { border: 'border-l-amber-400', bg: 'bg-amber-50', text: 'text-amber-700' },
  Imaging: { border: 'border-l-blue-400', bg: 'bg-blue-50', text: 'text-blue-700' },
  Pathology: { border: 'border-l-purple-400', bg: 'bg-purple-50', text: 'text-purple-700' },
};

function getCategoryStyle(category: string) {
  return (
    CATEGORY_COLORS[category] || {
      border: 'border-l-slate-400',
      bg: 'bg-slate-50',
      text: 'text-slate-700',
    }
  );
}

export default function LabOrderSection({
  labOrders,
  onAdd,
  onRemove,
  onUpdateNotes,
}: LabOrderSectionProps) {
  const [filterQuery, setFilterQuery] = useState('');

  const selectedTestIds = useMemo(
    () => new Set(labOrders.map((order) => order.labTestId)),
    [labOrders]
  );

  const filteredTests = useMemo(() => {
    const q = filterQuery.toLowerCase().trim();
    const tests = q
      ? AVAILABLE_TESTS.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q)
        )
      : AVAILABLE_TESTS;
    return tests;
  }, [filterQuery]);

  const groupedTests = useMemo(() => {
    const groups: Record<string, LabTestOption[]> = {};
    for (const test of filteredTests) {
      if (!groups[test.category]) {
        groups[test.category] = [];
      }
      groups[test.category].push(test);
    }
    return groups;
  }, [filteredTests]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-4"
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
          <FlaskConical className="h-4 w-4" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Lab Orders</h3>
        {labOrders.length > 0 && (
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
            {labOrders.length}
          </span>
        )}
      </div>

      {/* Search/Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter tests..."
          className={cn(
            'w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm',
            'outline-none transition-all placeholder:text-slate-400',
            'focus:border-purple-300 focus:ring-2 focus:ring-purple-100'
          )}
        />
      </div>

      {/* Available tests grouped by category */}
      <div className="space-y-3">
        {Object.entries(groupedTests).map(([category, tests]) => {
          const style = getCategoryStyle(category);
          return (
            <div key={category}>
              <div
                className={cn(
                  'mb-1.5 border-l-2 pl-2 text-xs font-semibold uppercase tracking-wider',
                  style.border,
                  style.text
                )}
              >
                {category}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tests.map((test) => {
                  const isSelected = selectedTestIds.has(test.id);
                  return (
                    <button
                      key={test.id}
                      type="button"
                      disabled={isSelected}
                      onClick={() => onAdd(test)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150',
                        isSelected
                          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                          : cn(
                              'border-slate-200 bg-white text-slate-600 cursor-pointer',
                              'hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700',
                              'active:scale-95'
                            )
                      )}
                    >
                      <Plus className="h-3 w-3" />
                      {test.name}
                      <span className="text-[10px] text-slate-400 ml-0.5">
                        ₹{test.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected lab orders */}
      <AnimatePresence mode="popLayout">
        {labOrders.map((order, index) => {
          const style = getCategoryStyle(order.category);
          return (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'rounded-lg border border-slate-200 bg-white p-3 shadow-sm',
                'border-l-4',
                style.border
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-slate-800">
                      {order.labTestName}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        style.bg,
                        style.text
                      )}
                    >
                      {order.category}
                    </span>
                  </div>
                  <div className="relative">
                    <StickyNote className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-300" />
                    <input
                      type="text"
                      value={order.notes}
                      onChange={(e) => onUpdateNotes(index, e.target.value)}
                      placeholder="Add clinical notes..."
                      className={cn(
                        'w-full rounded-md border border-slate-100 bg-slate-50/50 py-1.5 pl-7 pr-3 text-xs text-slate-600',
                        'outline-none transition-all placeholder:text-slate-300',
                        'focus:border-slate-200 focus:bg-white'
                      )}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="rounded-md p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove lab order"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
