'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, PackageOpen, Pill } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventorySearch } from '@/lib/hooks/useInventorySearch';
import StockIndicator from '@/components/prescription/StockIndicator';
import type { MedicineSearchResult, StockStatus } from '@/types';

interface MedicineSearchProps {
  onSelect: (medicine: MedicineSearchResult) => void;
  clinicId: string;
}

function getStockStatus(totalStock: number): StockStatus {
  if (totalStock === 0) return 'out_of_stock';
  if (totalStock < 20) return 'low_stock';
  return 'in_stock';
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="h-8 w-8 rounded-lg bg-slate-200" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-40 rounded bg-slate-200" />
        <div className="h-2.5 w-28 rounded bg-slate-100" />
      </div>
      <div className="h-5 w-16 rounded-full bg-slate-200" />
    </div>
  );
}

export default function MedicineSearch({
  onSelect,
  clinicId,
}: MedicineSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { results, isLoading, error } = useInventorySearch(query, clinicId);

  const showDropdown = isOpen && query.length >= 2;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-medicine-item]');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleSelect = useCallback(
    (medicine: MedicineSearchResult) => {
      onSelect(medicine);
      setQuery('');
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || results.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search medicines by name, generic name, or manufacturer..."
          className={cn(
            'w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4',
            'text-sm text-slate-800 placeholder:text-slate-400',
            'outline-none transition-all duration-200',
            'focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:shadow-md',
            'hover:border-slate-300'
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-500" />
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200/80',
              'bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/40'
            )}
          >
            <div ref={listRef} className="max-h-72 overflow-y-auto">
              {isLoading && results.length === 0 && (
                <div className="divide-y divide-slate-100">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              )}

              {!isLoading && results.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <PackageOpen className="mb-2 h-8 w-8" />
                  <p className="text-sm font-medium">No medicines found</p>
                  <p className="text-xs">Try a different search term</p>
                </div>
              )}

              {error && (
                <div className="px-4 py-6 text-center text-sm text-red-500">
                  {error}
                </div>
              )}

              {results.map((medicine, index) => {
                const stockStatus = getStockStatus(medicine.totalStock);
                return (
                  <button
                    key={medicine.id}
                    data-medicine-item
                    type="button"
                    onClick={() => handleSelect(medicine)}
                    className={cn(
                      'flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left',
                      'transition-colors duration-100',
                      'hover:bg-blue-50/60',
                      highlightedIndex === index && 'bg-blue-50/80'
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-slate-800 truncate">
                          {medicine.name}
                        </span>
                        {medicine.genericName && (
                          <span className="text-xs italic text-slate-400 truncate">
                            {medicine.genericName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">
                          {medicine.dosageForm}
                          {medicine.strength && ` • ${medicine.strength}`}
                        </span>
                        {medicine.manufacturer && (
                          <span className="text-[10px] text-slate-400">
                            — {medicine.manufacturer}
                          </span>
                        )}
                      </div>
                    </div>
                    <StockIndicator
                      stockStatus={stockStatus}
                      quantity={medicine.totalStock}
                    />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
