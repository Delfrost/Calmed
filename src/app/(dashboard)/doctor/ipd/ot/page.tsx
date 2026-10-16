'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Scissors,
  Clock,
  User,
  Activity,
  CheckSquare,
  RefreshCw,
  Plus,
  ArrowRight,
  ClipboardList,
  AlertCircle,
  Check,
  X,
  Stethoscope,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Patient {
  firstName: string;
  lastName: string;
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

interface Doctor {
  user: {
    firstName: string;
    lastName: string;
  };
}

interface Surgery {
  id: string;
  name: string;
  otRoom: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  status: 'SCHEDULED' | 'PRE_OP' | 'IN_PROGRESS' | 'POST_OP' | 'COMPLETED' | 'CANCELLED';
  preOpChecklist?: any;
  postOpChecklist?: any;
  estimatedCost?: string | null;
  notes?: string | null;
  admission: Admission;
  surgeon: Doctor;
  anesthetist?: Doctor | null;
}

export default function OTSchedulePage() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');

  // Checklist / status management drawer state
  const [managingSurgery, setManagingSurgery] = useState<Surgery | null>(null);
  const [submittingChecklist, setSubmittingChecklist] = useState(false);

  // Checklist values
  const [consent, setConsent] = useState(false);
  const [npo, setNpo] = useState(false);
  const [siteMarked, setSiteMarked] = useState(false);
  const [bloodConfirmed, setBloodConfirmed] = useState(false);

  const [vitalsStable, setVitalsStable] = useState(false);
  const [drainChecked, setDrainChecked] = useState(false);
  const [painPlanActive, setPainPlanActive] = useState(false);

  const [surgeryStatus, setSurgeryStatus] = useState<Surgery['status']>('SCHEDULED');

  const fetchSurgeries = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ipd/surgery?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setSurgeries(data.surgeries || []);
      }
    } catch (error) {
      console.error('Failed to load surgeries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurgeries(selectedDate);
  }, [selectedDate]);

  const handleOpenChecklist = (surg: Surgery) => {
    setManagingSurgery(surg);
    setSurgeryStatus(surg.status);

    // Initialise checklists from JSON
    const pre = surg.preOpChecklist || {};
    setConsent(!!pre.consent);
    setNpo(!!pre.npo);
    setSiteMarked(!!pre.siteMarked);
    setBloodConfirmed(!!pre.bloodConfirmed);

    const post = surg.postOpChecklist || {};
    setVitalsStable(!!post.vitalsStable);
    setDrainChecked(!!post.drainChecked);
    setPainPlanActive(!!post.painPlanActive);
  };

  const handleSaveChecklistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingSurgery) return;

    try {
      setSubmittingChecklist(true);
      const res = await fetch(`/api/ipd/surgery/${managingSurgery.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: surgeryStatus,
          preOpChecklist: {
            consent,
            npo,
            siteMarked,
            bloodConfirmed,
          },
          postOpChecklist: {
            vitalsStable,
            drainChecked,
            painPlanActive,
          },
        }),
      });

      if (res.ok) {
        setManagingSurgery(null);
        await fetchSurgeries(selectedDate);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update OT surgery status.');
      }
    } catch (error) {
      console.error('Failed to update surgery checklist:', error);
    } finally {
      setSubmittingChecklist(false);
    }
  };

  const filteredSurgeries = useMemo(() => {
    if (selectedRoom === 'ALL') return surgeries;
    return surgeries.filter((s) => s.otRoom === selectedRoom);
  }, [surgeries, selectedRoom]);

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
    PRE_OP: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
    POST_OP: 'bg-purple-50 text-purple-700 border-purple-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  return (
    <div className="space-y-6">
      {/* Date & Filter selectors */}
      <div className="bg-white border border-slate-200 shadow-soft rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
            <Scissors className="h-5 w-5 text-rose-500" />
            Operation Theater (OT) Dashboard
          </h3>
          <p className="text-xs text-slate-400">
            Review surgery queue schedule, checklists status, and surgeon/anesthetist allocations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-1 md:max-w-md">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 px-3 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-rose-400 shrink-0"
          />

          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-rose-400"
          >
            <option value="ALL">All OT Rooms</option>
            <option value="OT-1">Operation Theater 1 (OT-1)</option>
            <option value="OT-2">Operation Theater 2 (OT-2)</option>
            <option value="OT-3">Minor OT (OT-3)</option>
          </select>

          <button
            onClick={() => fetchSurgeries(selectedDate)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Schedule Timeline List */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-soft">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-4 text-rose-500" />
          <p className="font-semibold text-sm">Retrieving Operation Theater Logs...</p>
        </div>
      ) : filteredSurgeries.length === 0 ? (
        <div className="py-20 text-center bg-white border border-slate-100 rounded-2xl shadow-soft">
          <Scissors className="h-12 w-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500 text-sm">No Surgeries Booked for Date</p>
          <p className="text-xs text-slate-400 mt-1">There are no surgical procedures scheduled for this date and filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-rose-500" />
              Surgical Queue Ledger ({new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})
            </h4>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredSurgeries.map((surg) => (
              <div
                key={surg.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* OT Room indicator */}
                  <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                    <span className="font-black text-xs text-slate-800">{surg.otRoom}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Room</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-slate-800 text-sm">{surg.name}</strong>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                        🕒 {formatTime(surg.scheduledStart)} - {formatTime(surg.scheduledEnd)}
                      </span>
                      <span className={cn(
                        'text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border',
                        statusColors[surg.status]
                      )}>
                        {surg.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Patient: <strong>{surg.admission.patient.firstName} {surg.admission.patient.lastName}</strong> ({surg.admission.admissionNumber})
                      {surg.admission.bed && (
                        <span> · Bed: {surg.admission.bed.room.ward.name} · Bed {surg.admission.bed.label}</span>
                      )}
                    </p>

                    <div className="flex gap-4 text-[10px] text-slate-400">
                      <span>Lead: <strong>Dr. {surg.surgeon.user.firstName} {surg.surgeon.user.lastName}</strong></span>
                      {surg.anesthetist && (
                        <span>Anesthesia: <strong>Dr. {surg.anesthetist.user.firstName} {surg.anesthetist.user.lastName}</strong></span>
                      )}
                      {surg.estimatedCost && (
                        <span>Est Cost: <strong>₹{Number(surg.estimatedCost).toLocaleString('en-IN')}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 md:self-center">
                  <button
                    onClick={() => handleOpenChecklist(surg)}
                    className="h-8.5 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all active:scale-[0.97] flex items-center gap-1 shadow-soft"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    Manage Checklist & Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Checklist Drawer / Modal */}
      <AnimatePresence>
        {managingSurgery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setManagingSurgery(null)}
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
                    OT Surgical Sign-offs & Checklists
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Procedure: {managingSurgery.name} · Room: {managingSurgery.otRoom}
                  </p>
                </div>
                <button
                  onClick={() => setManagingSurgery(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveChecklistSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Advance Surgery Status
                  </label>
                  <select
                    value={surgeryStatus}
                    onChange={(e) => setSurgeryStatus(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:border-rose-400"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="PRE_OP">Pre-Op Ward rounds</option>
                    <option value="IN_PROGRESS">In Theater (Active)</option>
                    <option value="POST_OP">Recovery Room (Post-Op)</option>
                    <option value="COMPLETED">Completed (Dismember & Bill)</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Pre-Op Checklist */}
                <div className="space-y-2 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pre-Op Safety Checklist</p>
                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-50"
                      />
                      <span>Informed Surgical Consent Signed</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={npo}
                        onChange={(e) => setNpo(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-50"
                      />
                      <span>NPO Active (Nil per oral hours satisfied)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={siteMarked}
                        onChange={(e) => setSiteMarked(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-50"
                      />
                      <span>Surgical Site Marked</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bloodConfirmed}
                        onChange={(e) => setBloodConfirmed(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-50"
                      />
                      <span>Blood Crossmatch Confirmed</span>
                    </label>
                  </div>
                </div>

                {/* Post-Op Checklist */}
                <div className="space-y-2 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Post-Op Recovery Checklist</p>
                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vitalsStable}
                        onChange={(e) => setVitalsStable(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-50"
                      />
                      <span>Vitals stable in recovery room</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={drainChecked}
                        onChange={(e) => setDrainChecked(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-50"
                      />
                      <span>Surgical drains checked & verified</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={painPlanActive}
                        onChange={(e) => setPainPlanActive(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-50"
                      />
                      <span>Pain Management Protocol Active</span>
                    </label>
                  </div>
                </div>

                {surgeryStatus === 'COMPLETED' && (
                  <div className="bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-800 rounded-xl p-3 flex items-start gap-1">
                    <Info className="h-4 w-4 shrink-0 text-emerald-600" />
                    <p>Completing this surgery will automatically append the estimated procedure charges (₹{Number(managingSurgery.estimatedCost || 15000).toLocaleString('en-IN')}) to the patient's IPD Bill ledger.</p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingChecklist}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 text-white font-semibold text-xs transition-all active:scale-[0.98]"
                  >
                    {submittingChecklist ? 'Filing Sign-offs...' : 'Save Checklists & Status'}
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
