'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Plus,
  RefreshCw,
  Clock,
  ArrowRight,
  ClipboardList,
  AlertCircle,
  TrendingUp,
  X,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VitalsLog {
  id: string;
  temperature: string | null;
  systolicBP: number | null;
  diastolicBP: number | null;
  heartRate: number | null;
  spO2: number | null;
  respiratoryRate: number | null;
  painScale: number | null;
  notes: string | null;
  recordedBy: string;
  recordedAt: string;
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

function VitalsContent() {
  const searchParams = useSearchParams();
  const initialAdmissionId = searchParams.get('admissionId') || '';

  const [admissionId, setAdmissionId] = useState(initialAdmissionId);
  const [activeAdmissions, setActiveAdmissions] = useState<Admission[]>([]);
  const [vitals, setVitals] = useState<VitalsLog[]>([]);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const [loadingAdmissions, setLoadingAdmissions] = useState(true);

  // Form state
  const [showLogModal, setShowLogModal] = useState(false);
  const [temp, setTemp] = useState('');
  const [sysBP, setSysBP] = useState('');
  const [diaBP, setDiaBP] = useState('');
  const [hr, setHr] = useState('');
  const [spo2, setSpo2] = useState('');
  const [rr, setRr] = useState('');
  const [pain, setPain] = useState('0');
  const [notes, setNotes] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);

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

  const fetchVitals = async (id: string) => {
    if (!id) return;
    setLoadingVitals(true);
    try {
      const res = await fetch(`/api/ipd/vitals?admissionId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setVitals(data.vitalsLogs || []);
      } else {
        setVitals([]);
      }
    } catch (error) {
      console.error('Failed to fetch vitals:', error);
      setVitals([]);
    } finally {
      setLoadingVitals(false);
    }
  };

  useEffect(() => {
    fetchActiveAdmissions();
  }, []);

  useEffect(() => {
    if (admissionId) {
      fetchVitals(admissionId);
    } else {
      setVitals([]);
    }
  }, [admissionId]);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionId) return;

    try {
      setSubmittingLog(true);
      const res = await fetch('/api/ipd/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId,
          temperature: temp,
          systolicBP: sysBP,
          diastolicBP: diaBP,
          heartRate: hr,
          spO2: spo2,
          respiratoryRate: rr,
          painScale: pain,
          notes,
        }),
      });

      if (res.ok) {
        setShowLogModal(false);
        setTemp('');
        setSysBP('');
        setDiaBP('');
        setHr('');
        setSpo2('');
        setRr('');
        setPain('0');
        setNotes('');
        await fetchVitals(admissionId);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to record vitals.');
      }
    } catch (error) {
      console.error('Failed to log vitals:', error);
    } finally {
      setSubmittingLog(false);
    }
  };

  const selectedPatient = useMemo(() => {
    return activeAdmissions.find((adm) => adm.id === admissionId);
  }, [activeAdmissions, admissionId]);

  // Vitals ranges classification for alerting
  const getSpO2Class = (val: number | null) => {
    if (val === null) return '';
    if (val < 92) return 'bg-rose-50 text-rose-700 font-bold border-rose-200';
    if (val < 95) return 'bg-amber-50 text-amber-700 font-semibold border-amber-200';
    return 'text-slate-700';
  };

  const getBPClass = (sys: number | null, dia: number | null) => {
    if (sys === null || dia === null) return '';
    if (sys > 140 || dia > 90) return 'bg-rose-50 text-rose-700 font-bold border-rose-200';
    if (sys < 90 || dia < 60) return 'bg-blue-50 text-blue-700 font-semibold border-blue-200';
    return 'text-slate-700';
  };

  const getHRClass = (val: number | null) => {
    if (val === null) return '';
    if (val > 100 || val < 50) return 'bg-rose-50 text-rose-700 font-bold border-rose-200';
    if (val > 90 || val < 60) return 'bg-amber-50 text-amber-700 font-semibold border-amber-200';
    return 'text-slate-700';
  };

  const getTempClass = (val: string | null) => {
    if (val === null) return '';
    const num = parseFloat(val);
    if (num > 101) return 'bg-rose-50 text-rose-700 font-bold border-rose-200';
    if (num > 99) return 'bg-amber-50 text-amber-700 font-semibold border-amber-200';
    return 'text-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Patient Select Toolbar */}
      <div className="bg-white border border-slate-200 shadow-soft rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
            <Activity className="h-5 w-5 text-emerald-500 animate-pulse" />
            Vitals Observation Flowsheet
          </h3>
          <p className="text-xs text-slate-400">
            Log temperature, blood pressure, heart rate, oxygen levels, and pain scales at schedule periods.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-1 md:max-w-xs">
          {loadingAdmissions ? (
            <div className="text-xs text-slate-400">Loading admissions...</div>
          ) : (
            <select
              value={admissionId}
              onChange={(e) => setAdmissionId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-emerald-400"
            >
              <option value="">-- Choose Ward Patient --</option>
              {activeAdmissions.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  {adm.patient.firstName} {adm.patient.lastName} ({adm.admissionNumber})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => admissionId && fetchVitals(admissionId)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors shrink-0"
            title="Refresh logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loadingVitals ? (
        <div className="py-24 text-center text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-soft">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-4 text-emerald-500" />
          <p className="font-semibold text-sm">Retrieving Flowsheet Ledger...</p>
        </div>
      ) : !selectedPatient ? (
        <div className="py-24 text-center bg-white border border-slate-100 rounded-2xl shadow-soft">
          <Activity className="h-12 w-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500 text-sm">No Active Patient Selected</p>
          <p className="text-xs text-slate-400 mt-1">Please select an inpatient from the dropdown above to view or write vitals logs.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Patient Details & Quick Action Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Patient In rounds</span>
              <h4 className="font-extrabold text-sm text-slate-800">
                {selectedPatient.patient.firstName} {selectedPatient.patient.lastName} · In Bed: {selectedPatient.bed?.room.ward.name} ({selectedPatient.bed?.room.number} - {selectedPatient.bed?.label})
              </h4>
            </div>

            <button
              onClick={() => setShowLogModal(true)}
              className="h-9 px-4 rounded-xl bg-slate-950 text-white font-semibold text-xs flex items-center gap-1 hover:bg-slate-800 transition-all active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" />
              Log Vitals Entry
            </button>
          </div>

          {/* Flowsheet Timeline Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-emerald-500" />
                Vitals Flowsheet Timeline Logs
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4">Time logged</th>
                    <th className="p-4">Temperature (°F)</th>
                    <th className="p-4">Blood Pressure (mmHg)</th>
                    <th className="p-4">Heart Rate (bpm)</th>
                    <th className="p-4">Oxygen SpO2 (%)</th>
                    <th className="p-4">Resp Rate (breaths/m)</th>
                    <th className="p-4">Pain Scale (0-10)</th>
                    <th className="p-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {vitals.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 font-semibold text-[11px] whitespace-nowrap">
                        {new Date(log.recordedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </td>
                      <td className={cn('p-4 border-l border-r border-slate-50', getTempClass(log.temperature))}>
                        {log.temperature ? `${log.temperature}°F` : '--'}
                      </td>
                      <td className={cn('p-4 border-r border-slate-50', getBPClass(log.systolicBP, log.diastolicBP))}>
                        {log.systolicBP && log.diastolicBP ? `${log.systolicBP}/${log.diastolicBP}` : '--'}
                      </td>
                      <td className={cn('p-4 border-r border-slate-50', getHRClass(log.heartRate))}>
                        {log.heartRate ? `${log.heartRate} bpm` : '--'}
                      </td>
                      <td className={cn('p-4 border-r border-slate-50', getSpO2Class(log.spO2))}>
                        {log.spO2 ? `${log.spO2}%` : '--'}
                      </td>
                      <td className="p-4 border-r border-slate-50">
                        {log.respiratoryRate ? `${log.respiratoryRate} /min` : '--'}
                      </td>
                      <td className={cn('p-4 border-r border-slate-50 font-bold', log.painScale && log.painScale >= 6 ? 'text-rose-600 bg-rose-50/50' : 'text-slate-700')}>
                        {log.painScale !== null ? `${log.painScale} / 10` : '--'}
                      </td>
                      <td className="p-4 max-w-xs truncate" title={log.notes || ''}>
                        {log.notes || '--'}
                      </td>
                    </tr>
                  ))}

                  {vitals.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-16 text-center text-slate-400">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                        <p className="text-xs">No vitals logs recorded for this patient yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Log Vitals Modal */}
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
                  Record Inpatient Vitals
                </h4>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleLogSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Temperature (°F)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      placeholder="e.g. 98.6"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Oxygen SpO2 (%)
                    </label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      placeholder="e.g. 98"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      BP Systolic (mmHg)
                    </label>
                    <input
                      type="number"
                      value={sysBP}
                      onChange={(e) => setSysBP(e.target.value)}
                      placeholder="e.g. 120"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      BP Diastolic (mmHg)
                    </label>
                    <input
                      type="number"
                      value={diaBP}
                      onChange={(e) => setDiaBP(e.target.value)}
                      placeholder="e.g. 80"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      value={hr}
                      onChange={(e) => setHr(e.target.value)}
                      placeholder="e.g. 72"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Resp Rate (/min)
                    </label>
                    <input
                      type="number"
                      value={rr}
                      onChange={(e) => setRr(e.target.value)}
                      placeholder="e.g. 16"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Pain Scale (0-10)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={pain}
                      onChange={(e) => setPain(e.target.value)}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2.5"
                    />
                  </div>
                  <div className="text-center shrink-0">
                    <span className="text-[10px] font-bold text-slate-400">Score:</span>
                    <span className="font-extrabold text-sm text-slate-800 block">{pain} / 10</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Patient resting comfortably"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingLog}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs transition-all active:scale-[0.98]"
                  >
                    {submittingLog ? 'Logging Entry...' : 'Save Vitals Entry'}
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

export default function VitalsFlowsheetPage() {
  return (
    <Suspense fallback={
      <div className="py-24 text-center text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-soft">
        <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-4 text-emerald-500" />
        <p className="font-semibold text-sm">Loading Vitals Flowsheet...</p>
      </div>
    }>
      <VitalsContent />
    </Suspense>
  );
}
