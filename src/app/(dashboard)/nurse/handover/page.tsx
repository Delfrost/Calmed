'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRightLeft,
  RefreshCw,
  Clock,
  Check,
  AlertCircle,
  Plus,
  ClipboardList,
  CheckCircle,
  X,
  FileText,
  User,
  HeartPulse,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Handover {
  id: string;
  shiftType: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  shiftDate: string;
  shiftStartHour: number;
  shiftDurationHrs: number;
  outgoingNurseId: string;
  incomingNurseId?: string | null;
  criticalNotes: string;
  generalNotes?: string | null;
  acknowledgedAt?: string | null;
  createdAt: string;
}

interface Admission {
  id: string;
  admissionNumber: string;
  patient: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  bed: {
    label: string;
    room: {
      number: string;
      ward: {
        name: string;
      };
    };
  } | null;
}

function HandoverContent() {
  const searchParams = useSearchParams();
  const initialAdmissionId = searchParams.get('admissionId') || '';

  const [admissionId, setAdmissionId] = useState(initialAdmissionId);
  const [activeAdmissions, setActiveAdmissions] = useState<Admission[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [loadingHandovers, setLoadingHandovers] = useState(false);
  const [loadingAdmissions, setLoadingAdmissions] = useState(true);

  // Form state
  const [showLogModal, setShowLogModal] = useState(false);
  const [shiftType, setShiftType] = useState('MORNING');
  const [shiftDate, setShiftDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [criticalNotes, setCriticalNotes] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [submittingHandover, setSubmittingHandover] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

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

  const fetchHandovers = async (id: string) => {
    if (!id) return;
    setLoadingHandovers(true);
    try {
      const res = await fetch(`/api/ipd/handover?admissionId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setHandovers(data.handovers || []);
      } else {
        setHandovers([]);
      }
    } catch (error) {
      console.error('Failed to load handovers:', error);
      setHandovers([]);
    } finally {
      setLoadingHandovers(false);
    }
  };

  useEffect(() => {
    fetchActiveAdmissions();
  }, []);

  useEffect(() => {
    if (admissionId) {
      fetchHandovers(admissionId);
    } else {
      setHandovers([]);
    }
  }, [admissionId]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionId || !criticalNotes) return;

    try {
      setSubmittingHandover(true);
      const res = await fetch('/api/ipd/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId,
          shiftType,
          shiftDate,
          criticalNotes,
          generalNotes,
        }),
      });

      if (res.ok) {
        setShowLogModal(false);
        setCriticalNotes('');
        setGeneralNotes('');
        await fetchHandovers(admissionId);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to file handover note.');
      }
    } catch (error) {
      console.error('Failed to create handover:', error);
    } finally {
      setSubmittingHandover(false);
    }
  };

  const handleAcknowledge = async (handoverId: string) => {
    try {
      setAcknowledgingId(handoverId);
      const res = await fetch('/api/ipd/handover', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: handoverId }),
      });

      if (res.ok) {
        await fetchHandovers(admissionId);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to sign sign-off.');
      }
    } catch (error) {
      console.error('Failed to acknowledge handover:', error);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const selectedPatient = useMemo(() => {
    return activeAdmissions.find((adm) => adm.id === admissionId);
  }, [activeAdmissions, admissionId]);

  return (
    <div className="space-y-6">
      {/* Patient selector bar */}
      <div className="bg-white border border-slate-200 shadow-soft rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
            <ArrowRightLeft className="h-5 w-5 text-indigo-500 animate-pulse" />
            Shift Handover & End-of-Shift Sign-Offs
          </h3>
          <p className="text-xs text-slate-400">
            Document patient status updates, lines/drips status, and transfer clinical custody.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-1 md:max-w-xs">
          {loadingAdmissions ? (
            <div className="text-xs text-slate-400">Loading patients...</div>
          ) : (
            <select
              value={admissionId}
              onChange={(e) => setAdmissionId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-indigo-400"
            >
              <option value="">-- Choose Inpatient --</option>
              {activeAdmissions.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  {adm.patient.firstName} {adm.patient.lastName} ({adm.admissionNumber})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => admissionId && fetchHandovers(admissionId)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loadingHandovers ? (
        <div className="py-24 text-center text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-soft">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-4 text-indigo-500" />
          <p className="font-semibold text-sm">Retrieving Shift Handovers...</p>
        </div>
      ) : !selectedPatient ? (
        <div className="py-24 text-center bg-white border border-slate-100 rounded-2xl shadow-soft">
          <ArrowRightLeft className="h-12 w-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500 text-sm">No Active Patient Selected</p>
          <p className="text-xs text-slate-400 mt-1">Please select an admitted patient to write handovers or sign off on outstanding logs.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Details</span>
              <h4 className="font-extrabold text-sm text-slate-800">
                {selectedPatient.patient.firstName} {selectedPatient.patient.lastName} · Room: {selectedPatient.bed?.room.number || 'Unassigned'} ({selectedPatient.bed?.label})
              </h4>
            </div>

            <button
              onClick={() => setShowLogModal(true)}
              className="h-9 px-4 rounded-xl bg-slate-950 text-white font-semibold text-xs flex items-center gap-1 hover:bg-slate-800 transition-all active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" />
              File Shift Handover
            </button>
          </div>

          {/* History of shift handovers */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-indigo-500" />
                Shift Handover History Notes
              </h4>
            </div>

            <div className="divide-y divide-slate-100">
              {handovers.map((hand) => {
                const isAck = !!hand.acknowledgedAt;

                return (
                  <div key={hand.id} className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          'text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border',
                          hand.shiftType === 'MORNING' && 'bg-amber-50 text-amber-700 border-amber-100',
                          hand.shiftType === 'AFTERNOON' && 'bg-orange-50 text-orange-700 border-orange-100',
                          hand.shiftType === 'NIGHT' && 'bg-slate-900 border-slate-900 text-slate-200'
                        )}>
                          {hand.shiftType} Shift
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(hand.shiftDate).toLocaleDateString('en-IN')}
                        </span>
                        <span className={cn(
                          'text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border flex items-center gap-0.5',
                          isAck ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                        )}>
                          {isAck ? <Check className="h-3 w-3" /> : null}
                          {isAck ? 'Acknowledged' : 'Pending Sign-Off'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <p className="text-red-700 font-bold">⚠️ CRITICAL NOTES:</p>
                        <p className="text-slate-800 font-medium whitespace-pre-wrap">{hand.criticalNotes}</p>

                        {hand.generalNotes && (
                          <>
                            <p className="text-slate-400 mt-2 font-bold uppercase text-[9px] tracking-wide">General Observation:</p>
                            <p className="text-slate-600 whitespace-pre-wrap">{hand.generalNotes}</p>
                          </>
                        )}
                      </div>

                      <div className="flex gap-4 text-[10px] text-slate-400">
                        <span>Outgoing: <strong>Sister (ID: {hand.outgoingNurseId.slice(-4)})</strong></span>
                        {isAck && (
                          <span>Acknowledged by: <strong>Sister (ID: {hand.incomingNurseId?.slice(-4)})</strong> at {new Date(hand.acknowledgedAt!).toLocaleTimeString()}</span>
                        )}
                      </div>
                    </div>

                    {!isAck && (
                      <div className="shrink-0 md:self-center">
                        <button
                          onClick={() => handleAcknowledge(hand.id)}
                          disabled={acknowledgingId === hand.id}
                          className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white font-semibold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 shadow-soft"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {acknowledgingId === hand.id ? 'Signing...' : 'Acknowledge Handover'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {handovers.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-xs">No shift handovers logged for this patient yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log Handover Modal */}
      <AnimatePresence>
        {showLogModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowLogModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl relative border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-sm text-slate-800 font-display">
                  File Shift Handover
                </h4>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Active Shift
                    </label>
                    <select
                      value={shiftType}
                      onChange={(e) => setShiftType(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:border-indigo-400"
                    >
                      <option value="MORNING">Morning Shift</option>
                      <option value="AFTERNOON">Afternoon Shift</option>
                      <option value="NIGHT">Night Shift</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Shift Date
                    </label>
                    <input
                      type="date"
                      value={shiftDate}
                      onChange={(e) => setShiftDate(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Critical Notes (Vitals/Lines/Drips Alert) *
                  </label>
                  <textarea
                    required
                    value={criticalNotes}
                    onChange={(e) => setCriticalNotes(e.target.value)}
                    placeholder="e.g. IV line inserted right forearm. Patient has high risk of fall. Check vitals at 8pm."
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-indigo-400 h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    General Observations (Optional)
                  </label>
                  <textarea
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    placeholder="e.g. Sleeping well, had light dinner."
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-indigo-400 h-16 resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingHandover}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs transition-all active:scale-[0.98]"
                  >
                    {submittingHandover ? 'Filing Handover...' : 'File Handover Log'}
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

export default function ShiftHandoverPage() {
  return (
    <Suspense fallback={
      <div className="py-24 text-center text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-soft">
        <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-4 text-indigo-500" />
        <p className="font-semibold text-sm">Loading Handover Console...</p>
      </div>
    }>
      <HandoverContent />
    </Suspense>
  );
}
