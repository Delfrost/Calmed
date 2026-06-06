'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Pill,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertCircle,
  FileText,
  Building,
  Activity,
  ArrowRight,
  PackageCheck,
  ShieldAlert,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrescriptionItem {
  id: string;
  medicineName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedQty: number;
  availableStock: number;
  substituteNotes?: string;
}

interface PendingPrescription {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  diagnosis: string;
  doctorId: string;
  doctorName: string;
  items: PrescriptionItem[];
  status: 'PENDING' | 'DISPENSED' | 'CANCELLED';
  dateOrdered: string;
}

const MOCK_PRESCRIPTIONS: PendingPrescription[] = [
  {
    id: 'rx-201',
    patientName: 'Sunita Devi',
    patientAge: 67,
    patientGender: 'Female',
    diagnosis: 'Seasonal Allergic Bronchitis',
    doctorId: 'dr-1',
    doctorName: 'Dr. Anand Sharma',
    items: [
      { id: 'item-1', medicineName: 'Paracetamol', genericName: 'Acetaminophen', dosage: '500mg', frequency: 'Thrice daily', duration: '5 days', prescribedQty: 15, availableStock: 250 },
      { id: 'item-2', medicineName: 'Amoxicillin', genericName: 'Amoxicillin Trihydrate', dosage: '500mg', frequency: 'Once daily', duration: '3 days', prescribedQty: 3, availableStock: 85 },
    ],
    status: 'PENDING',
    dateOrdered: '2026-05-26 10:15',
  },
  {
    id: 'rx-202',
    patientName: 'Rajesh Kumar',
    patientAge: 45,
    patientGender: 'Male',
    diagnosis: 'Routine Type 2 Diabetes Intake',
    doctorId: 'dr-1',
    doctorName: 'Dr. Anand Sharma',
    items: [
      { id: 'item-3', medicineName: 'Metformin', genericName: 'Metformin Hydrochloride', dosage: '500mg', frequency: 'Twice daily', duration: '14 days', prescribedQty: 28, availableStock: 320 },
      { id: 'item-4', medicineName: 'Amlodipine', genericName: 'Amlodipine Besylate', dosage: '5mg', frequency: 'Once daily', duration: '7 days', prescribedQty: 7, availableStock: 15 },
    ],
    status: 'PENDING',
    dateOrdered: '2026-05-26 11:30',
  },
];

export default function PharmacistRxQueue() {
  const [prescriptions, setPrescriptions] = useState<PendingPrescription[]>(MOCK_PRESCRIPTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRx, setSelectedRx] = useState<PendingPrescription | null>(MOCK_PRESCRIPTIONS[0]);

  // Dispensing flow states
  const [isDispensing, setIsDispensing] = useState(false);
  const [dispenseSuccess, setDispenseSuccess] = useState(false);

  // Substitute editor states
  const [editSubstituteItemId, setEditSubstituteItemId] = useState<string | null>(null);
  const [substituteValue, setSubstituteValue] = useState('');

  const filteredRx = useMemo(() => {
    return prescriptions.filter((rx) => {
      const matchSearch =
        rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rx.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rx.id.includes(searchQuery);
      return matchSearch;
    });
  }, [prescriptions, searchQuery]);

  const handleUpdateSubstitute = (itemId: string) => {
    if (!selectedRx) return;

    setSelectedRx({
      ...selectedRx,
      items: selectedRx.items.map((item) =>
        item.id === itemId ? { ...item, substituteNotes: substituteValue } : item
      ),
    });

    setEditSubstituteItemId(null);
    setSubstituteValue('');
  };

  const handleDispense = () => {
    if (!selectedRx) return;
    setIsDispensing(true);

    // Simulate batch-level FIFO depletion updates
    setTimeout(() => {
      setPrescriptions((prev) =>
        prev.map((rx) => (rx.id === selectedRx.id ? { ...rx, status: 'DISPENSED' } : rx))
      );
      setSelectedRx({ ...selectedRx, status: 'DISPENSED' });
      setIsDispensing(false);
      setDispenseSuccess(true);
      setTimeout(() => setDispenseSuccess(false), 2000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-soft">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">
              Prescription Dispensing Desk
            </h3>
            <p className="text-xs text-slate-400">
              Review and dispense medications sent directly from Doctor pad consults.
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prescriptions..."
            className="w-48 h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Pending RX Queue (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 font-display">
                Dispensing Waiting Room
              </h4>
              <span className="text-[9.5px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Doctor pad sync
              </span>
            </div>

            <div className="divide-y divide-slate-50 overflow-y-auto max-h-[460px]">
              {filteredRx.map((rx) => {
                const isSelected = selectedRx?.id === rx.id;
                return (
                  <button
                    key={rx.id}
                    onClick={() => {
                      setSelectedRx(rx);
                      setEditSubstituteItemId(null);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between px-5 py-4 text-left transition-colors border-b border-slate-50',
                      isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{rx.patientName}</span>
                        <span
                          className={cn(
                            'text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider',
                            rx.status === 'DISPENSED' && 'bg-emerald-50 text-emerald-700',
                            rx.status === 'PENDING' && 'bg-amber-50 text-amber-700',
                            rx.status === 'CANCELLED' && 'bg-red-50 text-red-700'
                          )}
                        >
                          {rx.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">
                        Diagnosis: {rx.diagnosis}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        Sent by {rx.doctorName} · {rx.dateOrdered}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="inline-flex h-6 w-6 rounded-full bg-slate-100 items-center justify-center text-[10px] font-bold text-slate-500">
                        {rx.items.length}
                      </span>
                    </div>
                  </button>
                );
              })}

              {filteredRx.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <Pill className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm font-semibold">No prescriptions found</p>
                  <p className="text-xs font-medium">All caught up or adjust filters</p>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400">
            Dispensing a prescription settles it and adjusts catalog stock batch quantities.
          </div>
        </div>

        {/* Right: Checkout Dispensing Drawer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-soft flex flex-col justify-between relative">
          {selectedRx ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-base font-bold text-slate-800 font-display">
                    Review Rx Request — #{selectedRx.id}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Patient: <span className="font-bold text-slate-600">{selectedRx.patientName}</span> ({selectedRx.patientAge}y/{selectedRx.patientGender})
                  </p>
                </div>

                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                    selectedRx.status === 'DISPENSED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  )}
                >
                  {selectedRx.status}
                </span>
              </div>

              {/* Itemized prescribed medications list */}
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">
                  Prescribed Drugs & Stock Checks
                </p>

                {selectedRx.items.map((item) => {
                  const isInsufficient = item.availableStock < item.prescribedQty;
                  const isLow = item.availableStock > 0 && item.availableStock < 20;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'border rounded-xl p-4 transition-all flex flex-col justify-between gap-3 bg-slate-50/30',
                        isInsufficient ? 'border-red-100 bg-red-50/10' : 'border-slate-200'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-bold text-slate-800">{item.medicineName}</span>
                            <span className="text-[10px] italic text-slate-400 truncate">({item.genericName})</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {item.dosage} · {item.frequency} · {item.duration} · Qty: <span className="font-bold text-slate-600">{item.prescribedQty}</span>
                          </p>
                        </div>

                        {/* Stock Check Badge */}
                        <div className="text-right shrink-0">
                          {isInsufficient ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                              <ShieldAlert className="h-3 w-3" />
                              Short: {item.prescribedQty - item.availableStock}
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                              <AlertCircle className="h-3 w-3" />
                              Low Stock: {item.availableStock}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              <CheckCircle2 className="h-3 w-3" />
                              Verify: {item.availableStock}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Substitute Note / Drug Substitution workflow */}
                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px]">
                        <div className="text-slate-400">
                          {item.substituteNotes ? (
                            <p className="italic text-amber-600 font-medium">
                              Subbed: &quot;{item.substituteNotes}&quot;
                            </p>
                          ) : (
                            <span>Drug substitution (substitute generic brand)</span>
                          )}
                        </div>

                        {editSubstituteItemId === item.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={substituteValue}
                              onChange={(e) => setSubstituteValue(e.target.value)}
                              placeholder="Enter brand name..."
                              className="h-7 border border-slate-200 rounded px-2 outline-none text-[10px]"
                            />
                            <button
                              onClick={() => handleUpdateSubstitute(item.id)}
                              className="h-7 w-7 rounded bg-blue-600 text-white flex items-center justify-center"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditSubstituteItemId(null)}
                              className="h-7 w-7 rounded border border-slate-200 text-slate-400 flex items-center justify-center"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditSubstituteItemId(item.id);
                              setSubstituteValue(item.substituteNotes || '');
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                          >
                            <Edit2 className="h-3 w-3" />
                            Substitute
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action drawer */}
              {selectedRx.status !== 'DISPENSED' && (
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3.5">
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 text-blue-500" />
                    FIFO Stock Ingestion algorithm will automatically deplete quantities.
                  </div>

                  <button
                    onClick={handleDispense}
                    disabled={isDispensing}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100 active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isDispensing ? (
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <PackageCheck className="h-4 w-4" />
                        Confirm Dispense & Deplete Inventory
                      </>
                    )}
                  </button>
                </div>
              )}

              {selectedRx.status === 'DISPENSED' && (
                <div className="border border-emerald-100 bg-emerald-50/20 rounded-xl p-5 text-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
                  <div>
                    <h5 className="text-sm font-bold text-emerald-800">Prescription Fully Dispensed</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Completed and archived on {selectedRx.dateOrdered}
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-slate-400 leading-tight">
                    WhatsApp dispensing notification sent to patient phone.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400">
              <Pill className="h-10 w-10 mx-auto mb-2 text-slate-200 animate-pulse" />
              <p className="text-sm font-semibold">No prescription selected</p>
              <p className="text-xs">Select a request from the queue to process dispensing reviews</p>
            </div>
          )}

          {/* Success toast */}
          <AnimatePresence>
            {dispenseSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-6 left-6 right-6 bg-emerald-600 text-white rounded-xl py-3 px-4 shadow-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-white shrink-0" />
                  <span className="text-xs font-bold">Dispensing checkout complete! Quantities deducted from FIFO batches.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
