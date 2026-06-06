'use client';

import { motion } from 'motion/react';
import { Check, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StockStatus } from '@/types';

interface StockIndicatorProps {
  stockStatus: StockStatus;
  quantity: number;
}

const statusConfig: Record<
  StockStatus,
  {
    icon: typeof Check;
    label: string;
    bgClass: string;
    textClass: string;
    dotClass: string;
  }
> = {
  in_stock: {
    icon: Check,
    label: 'In Stock',
    bgClass: 'bg-emerald-50 border-emerald-200',
    textClass: 'text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
  low_stock: {
    icon: AlertTriangle,
    label: 'Low Stock',
    bgClass: 'bg-amber-50 border-amber-200',
    textClass: 'text-amber-700',
    dotClass: 'bg-amber-500',
  },
  out_of_stock: {
    icon: X,
    label: 'Out of Stock',
    bgClass: 'bg-red-50 border-red-200',
    textClass: 'text-red-700',
    dotClass: 'bg-red-500',
  },
};

export default function StockIndicator({
  stockStatus,
  quantity,
}: StockIndicatorProps) {
  const config = statusConfig[stockStatus];
  const Icon = config.icon;

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        config.bgClass,
        config.textClass
      )}
    >
      <Icon className="h-3 w-3" />
      {stockStatus === 'out_of_stock' ? 'Out of Stock' : `${quantity} units`}
    </span>
  );

  if (stockStatus === 'low_stock') {
    return (
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="inline-flex"
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
}
