'use client';

import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import StockIndicator from '@/components/prescription/StockIndicator';
import type { PrescriptionItemData } from '@/types';

interface MedicineRowProps {
  item: PrescriptionItemData;
  index: number;
  onUpdate: (index: number, field: keyof PrescriptionItemData, value: string | number) => void;
  onRemove: (index: number) => void;
}

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Thrice daily',
  'Four times daily',
  'Every 6 hours',
  'Every 8 hours',
  'Before meals',
  'After meals',
  'At bedtime',
  'As needed (SOS)',
] as const;

function CompactInput({
  value,
  onChange,
  placeholder,
  className,
  type = 'text',
  min,
}: {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: 'text' | 'number';
  min?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      className={cn(
        'w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm',
        'outline-none transition-all duration-150',
        'focus:border-blue-400 focus:ring-1 focus:ring-blue-100',
        'placeholder:text-slate-300',
        className
      )}
    />
  );
}

export default function MedicineRow({
  item,
  index,
  onUpdate,
  onRemove,
}: MedicineRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'group grid grid-cols-[32px_1fr] gap-3 rounded-lg border border-slate-100 bg-white p-3',
        'transition-all duration-150 hover:border-slate-200 hover:shadow-sm'
      )}
    >
      {/* Row number */}
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-600 self-start mt-0.5">
        {index + 1}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_1fr_0.8fr_0.5fr_1fr_auto_auto] gap-2 items-start">
        {/* Medicine name (read-only) */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {item.medicineName}
          </p>
          <p className="text-[11px] italic text-slate-400 truncate">
            {item.genericName}
          </p>
        </div>

        {/* Dosage */}
        <div>
          <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5 lg:hidden">
            Dosage
          </label>
          <CompactInput
            value={item.dosage}
            onChange={(val) => onUpdate(index, 'dosage', val)}
            placeholder="e.g. 500mg"
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5 lg:hidden">
            Frequency
          </label>
          <select
            value={item.frequency}
            onChange={(e) => onUpdate(index, 'frequency', e.target.value)}
            className={cn(
              'w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm',
              'outline-none transition-all duration-150',
              'focus:border-blue-400 focus:ring-1 focus:ring-blue-100',
              item.frequency === '' && 'text-slate-300'
            )}
          >
            <option value="" disabled>
              Select frequency
            </option>
            {FREQUENCY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5 lg:hidden">
            Duration
          </label>
          <CompactInput
            value={item.duration}
            onChange={(val) => onUpdate(index, 'duration', val)}
            placeholder="e.g. 5 days"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5 lg:hidden">
            Qty
          </label>
          <CompactInput
            type="number"
            min={1}
            value={item.quantity}
            onChange={(val) => onUpdate(index, 'quantity', parseInt(val) || 0)}
            placeholder="Qty"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5 lg:hidden">
            Instructions
          </label>
          <CompactInput
            value={item.instructions}
            onChange={(val) => onUpdate(index, 'instructions', val)}
            placeholder="Special instructions..."
          />
        </div>

        {/* Stock indicator */}
        <div className="flex items-center justify-center pt-1">
          <StockIndicator
            stockStatus={item.stockStatus}
            quantity={item.availableStock}
          />
        </div>

        {/* Remove button */}
        <div className="flex items-center justify-center pt-0.5">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className={cn(
              'rounded-md p-1.5 text-slate-300 transition-all duration-150',
              'hover:bg-red-50 hover:text-red-500',
              'opacity-0 group-hover:opacity-100 focus:opacity-100'
            )}
            aria-label="Remove medicine"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
