'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Pill,
  Search,
  RefreshCw,
  Clock,
  Check,
  AlertCircle,
  FileText,
  DollarSign,
  Activity,
  ArrowRight,
  ClipboardList,
  CheckCircle,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Patient {
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
}

interface Bed {
  label: string;
  room: {
    number: string;
    ward: {
      name: string;
    };
  };
}

interface Admission {
  id: string;
  admissionNumber: string;
  patient: Patient;
  bed: Bed | null;
}

interface Medicine {
  name: string;
  dosageForm: string;
}

interface MedicationOrder {
  dosage: string;
  route: string;
  frequency: string;
  instructions?: string | null;
  medicine: Medicine;
  admission: Admission;
}

interface MAREntry {
  id: string;
  scheduledTime: string;
  status: 'SCHEDULED' | 'ADMINISTERED' | 'MISSED' | 'HELD' | 'REFUSED';
  administeredAt?: string | null;
  administeredBy?: string | null;
  notes?: string | null;
  medicationOrder: MedicationOrder;
}

function MARContent() {
  const searchParams = useSearchParams();
  const initialAdmissionId = searchParams.get('admissionId') || '';

  const [admissionId, setAdmissionId] = useState(initialAdmissionId);
  const [activeAdmissions, setActiveAdmissions] = useState<Admission[]>([]);
  const [marEntries, setMarEntries] = useState<MAREntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [loadingAdmissions, setLoadingAdmissions] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Administer modal state
  const [administeringEntry, setAdministeringEntry] = useState<MAREntry | null>(null);
  const [actionStatus, setActionStatus] = useState<'ADMINISTERED' | 'HELD' | 'MISSED' | 'REFUSED'>('ADMINISTERED');
  const [administerNotes, setAdministerNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchActiveAdmissions = async () => {
    try {
      const res = await fetch('/api/ipd/admissions?status=ADMITTED');
      if (res.ok) {
        const data = await res.json();
        setActiveAdmissions(data.admissions || []);
      }
    } catch (error) {
      console.error('Failed to load active admissions:', error);
    } finally {
      setLoadingAdmissions(false);
    }
  };

  const fetchMarEntries = async (id: string, date: string) => {
    setLoadingEntries(true);
    try {
      const url = id 
        ? `/api/ipd/mar?admissionId=${id}&date=${date}`
        : `/api/ipd/mar?date=${date}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMarEntries(data.marEntries || []);
      } else {
        setMarEntries([]);
      }
    } catch (error) {
      console.error('Failed to load MAR entries:', error);
      setMarEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    fetchActiveAdmissions();
  }, []);

  useEffect(() => {
    fetchMarEntries(admissionId, selectedDate);
  }, [admissionId, selectedDate]);

  const handleOpenAdminister = (entry: MAREntry, status: typeof actionStatus = 'ADMINISTERED') => {
    setAdministeringEntry(entry);
    setActionStatus(status);
    setAdministerNotes('');
  };

  const handleAdministerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!administeringEntry) return;

    try {
      setSubmittingAction(true);
      const res = await fetch('/api/ipd/mar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: administeringEntry.id,
          status: actionStatus,
          notes: administerNotes,
        }),
      });

      if (res.ok) {
        setAdministeringEntry(null);
        await fetchMarEntries(admissionId, selectedDate);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update MAR entry status.');
      }
    } catch (error) {
      console.error('Failed to update MAR entry status:', error);
    } finally {
      setSubmittingAction(false);
    }
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const statusPills: Record<string, string> = {
    SCHEDULED: 'bg-slate-50 text-slate-500 border-slate-200',
    ADMINISTERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    MISSED: 'bg-rose-50 text-rose-700 border-rose-200',
    HELD: 'bg-amber-50 text-amber-700 border-amber-200',
    REFUSED: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="space-y-6">
      {/* Patient selector bar */}
      <div className="bg-white border border-slate-200 shadow-soft rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
            <Pill className="h-5 w-5 text-blue-500" />
            Medication Administration Record (MAR)
          </h3>
          <p className="text-xs text-slate-400">
            View active medication plans, dispense status, and log administrations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-1 md:max-w-md">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 px-3 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-blue-400 shrink-0"
          />

          {loadingAdmissions ? (
            <div className="text-xs text-slate-400">Loading active list...</div>
          ) : (
            <select
              value={admissionId}
              onChange={(e) => setAdmissionId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-blue-400"
            >
              <option value="">-- All Active Patients --</option>
              {activeAdmissions.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  {adm.patient.firstName} {adm.patient.lastName} ({adm.admissionNumber})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => fetchMarEntries(admissionId, selectedDate)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* MAR task lists */}
      {loadingEntries ? (
        <div className="py-24 text-center text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-soft">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-4 text-blue-500" />
          <p className="font-semibold text-sm">Retrieving Drug Administration Charts...</p>
        </div>
      ) : marEntries.length === 0 ? (
        <div className="py-20 text-center bg-white border border-slate-100 rounded-2xl shadow-soft">
          <Pill className="h-12 w-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500 text-sm">No Medication Tasks for Date</p>
          <p className="text-xs text-slate-400 mt-1">
            Either no active orders have been scheduled for this day or all patients are settled.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-blue-500" />
              Medication Schedule Chart ({new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})
            </h4>
          </div>

          <div className="divide-y divide-slate-100">
            {marEntries.map((entry) => {
              const order = entry.medicationOrder;
              const isScheduled = entry.status === 'SCHEDULED';

              return (
                <div
                  key={entry.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Time indicator */}
                    <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="font-bold text-[10px] text-slate-700 mt-1">{formatTime(entry.scheduledTime)}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-slate-800 text-sm">{order.medicine.name}</strong>
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 uppercase tracking-wide">
                          {order.route} · {order.dosage}
                        </span>
                        <span className={cn(
                          'text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border',
                          statusPills[entry.status]
                        )}>
                          {entry.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Patient: <strong>{order.admission.patient.firstName} {order.admission.patient.lastName}</strong>
                        {order.admission.bed && (
                          <span> (Bed: {order.admission.bed.room.ward.name} · Rm {order.admission.bed.room.number} · {order.admission.bed.label})</span>
                        )}
                      </p>

                      {order.instructions && (
                        <p className="text-[10px] text-slate-400 italic">Instructions: "{order.instructions}"</p>
                      )}

                      {entry.administeredAt && (
                        <p className="text-[9px] text-emerald-600 font-semibold">
                          Administered At: {new Date(entry.administeredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          {entry.notes && ` (Notes: "${entry.notes}")`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick actions for Scheduled entries */}
                  {isScheduled && (
                    <div className="shrink-0 flex items-center gap-2 md:self-center">
                      <button
                        onClick={() => handleOpenAdminister(entry, 'ADMINISTERED')}
                        className="h-8.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all active:scale-[0.97] flex items-center gap-1 shadow-soft"
                      >
                        <Check className="h-4 w-4" />
                        Administer
                      </button>
                      <button
                        onClick={() => handleOpenAdminister(entry, 'HELD')}
                        className="h-8.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-all active:scale-[0.97]"
                      >
                        Hold
                      </button>
                      <button
                        onClick={() => handleOpenAdminister(entry, 'MISSED')}
                        className="h-8.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-all active:scale-[0.97]"
                      >
                        Miss
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Administer Entry Confirmation Modal */}
      <AnimatePresence>
        {administeringEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setAdministeringEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl relative border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 font-display">
                    Confirm Medication Action
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {administeringEntry.medicationOrder.medicine.name} ({administeringEntry.medicationOrder.dosage}) · {administeringEntry.medicationOrder.route}
                  </p>
                </div>
                <button
                  onClick={() => setAdministeringEntry(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAdministerSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Status
                  </label>
                  <select
                    value={actionStatus}
                    onChange={(e) => setActionStatus(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:border-blue-400"
                  >
                    <option value="ADMINISTERED">Administered (Dispense & Charge)</option>
                    <option value="HELD">Held (Hold dose temporary)</option>
                    <option value="MISSED">Missed (Overdue/Forgot)</option>
                    <option value="REFUSED">Refused (Patient declined)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Administration Notes / Vitals Sign-off
                  </label>
                  <input
                    type="text"
                    value={administerNotes}
                    onChange={(e) => setAdministerNotes(e.target.value)}
                    placeholder="e.g. Taken with water after meals"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                  />
                </div>

                {actionStatus === 'ADMINISTERED' && (
                  <div className="bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-800 rounded-xl p-3">
                    <p className="font-bold">Inventory & Invoice Action:</p>
                    <p className="mt-0.5">This will automatically deplete 1 unit from Pharmacy inventory (FEFO) and add medicine charges to the patient's bill.</p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs transition-all active:scale-[0.98]"
                  >
                    {submittingAction ? 'Confirming Sign-off...' : 'Confirm Action'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MARPage() {
  return (
    <Suspense fallback={
      <div className="py-24 text-center text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-soft">
        <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-4 text-blue-500" />
        <p className="font-semibold text-sm">Loading Medication Records...</p>
      </div>
    }>
      <MARContent />
    </Suspense>
  );
}
