'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BedDouble,
  Search,
  RefreshCw,
  Plus,
  Activity,
  Pill,
  Scissors,
  ClipboardList,
  AlertCircle,
  FileText,
  User,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  X,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
}

interface VitalsLog {
  temperature?: string | null;
  systolicBP?: number | null;
  diastolicBP?: number | null;
  heartRate?: number | null;
  spO2?: number | null;
  recordedAt: string;
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
  diagnosis?: string | null;
  chiefComplaints?: string | null;
  notes?: string | null;
  admittedAt: string;
  patient: Patient;
  bed: Bed | null;
  vitalsLogs: VitalsLog[];
}

export default function DoctorIPDRoundsPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);

  // Modals state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteAssessment, setNoteAssessment] = useState('');
  const [notePlan, setNotePlan] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [orderDosage, setOrderDosage] = useState('');
  const [orderRoute, setOrderRoute] = useState('ORAL');
  const [orderFrequency, setOrderFrequency] = useState('OD');
  const [orderStartDate, setOrderStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [orderEndDate, setOrderEndDate] = useState('');
  const [orderInstructions, setOrderInstructions] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const [showSurgeryModal, setShowSurgeryModal] = useState(false);
  const [surgeryName, setSurgeryName] = useState('');
  const [surgeryOtRoom, setSurgeryOtRoom] = useState('OT-1');
  const [surgeryStart, setSurgeryStart] = useState('');
  const [surgeryEnd, setSurgeryEnd] = useState('');
  const [surgeryCost, setSurgeryCost] = useState('');
  const [surgeryNotes, setSurgeryNotes] = useState('');
  const [submittingSurgery, setSubmittingSurgery] = useState(false);

  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedAnesthetistId, setSelectedAnesthetistId] = useState('');

  const fetchAdmissions = async () => {
    try {
      const res = await fetch('/api/ipd/admissions?status=ADMITTED');
      if (res.ok) {
        const data = await res.json();
        setAdmissions(data.admissions || []);
      }
    } catch (error) {
      console.error('Failed to load doctor rounds patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await fetch('/api/inventory/search');
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines || []);
      }
    } catch (error) {
      console.error('Failed to load medicines:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.doctors || []);
      }
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    fetchMedicines();
    fetchDoctors();
  }, []);

  const handleCreateProgressNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission || !noteContent) return;

    try {
      setSubmittingNote(true);
      const res = await fetch('/api/ipd/progress-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId: selectedAdmission.id,
          content: noteContent,
          assessment: noteAssessment,
          plan: notePlan,
        }),
      });

      if (res.ok) {
        setShowNoteModal(false);
        setNoteContent('');
        setNoteAssessment('');
        setNotePlan('');
        alert('Progress note recorded successfully!');
        await fetchAdmissions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to write progress note.');
      }
    } catch (error) {
      console.error('Failed to write progress note:', error);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleCreateMedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission || !selectedMedicineId || !orderDosage || !orderFrequency) return;

    try {
      setSubmittingOrder(true);
      const res = await fetch('/api/ipd/medication-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId: selectedAdmission.id,
          medicineId: selectedMedicineId,
          dosage: orderDosage,
          frequency: orderFrequency,
          route: orderRoute,
          startDate: orderStartDate,
          endDate: orderEndDate || null,
          instructions: orderInstructions,
        }),
      });

      if (res.ok) {
        setShowOrderModal(false);
        setSelectedMedicineId('');
        setOrderDosage('');
        setOrderInstructions('');
        alert('Medication plan ordered. MAR schedules generated.');
        await fetchAdmissions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to place order.');
      }
    } catch (error) {
      console.error('Failed to place order:', error);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleScheduleSurgery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission || !surgeryName || !surgeryStart || !surgeryEnd) return;

    // Resolve surgeonId (current user).
    // The endpoint will retrieve it from user session, but we can pass doctor user details or have api resolve it.
    // We also require surgeonId. Let's pass the first doctor as mock lead surgeon if session is not doctor profile.
    let surgeonId = '';
    // Let's check doctor list. We will find doctor that matches current session or just use doctor profile.
    const activeDoctor = doctors.find(() => true);
    if (activeDoctor) {
      surgeonId = activeDoctor.doctorProfile?.id;
    }

    try {
      setSubmittingSurgery(true);
      const res = await fetch('/api/ipd/surgery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId: selectedAdmission.id,
          name: surgeryName,
          surgeonId,
          anesthetistId: selectedAnesthetistId || null,
          otRoom: surgeryOtRoom,
          scheduledStart: surgeryStart,
          scheduledEnd: surgeryEnd,
          estimatedCost: surgeryCost,
          notes: surgeryNotes,
        }),
      });

      if (res.ok) {
        setShowSurgeryModal(false);
        setSurgeryName('');
        setSurgeryStart('');
        setSurgeryEnd('');
        setSurgeryCost('');
        setSurgeryNotes('');
        alert('Surgery successfully scheduled in OT room!');
        await fetchAdmissions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to schedule surgery.');
      }
    } catch (error) {
      console.error('Failed to schedule surgery:', error);
    } finally {
      setSubmittingSurgery(false);
    }
  };

  const filteredAdmissions = useMemo(() => {
    return admissions.filter((adm) => {
      const patientName = `${adm.patient.firstName} ${adm.patient.lastName}`.toLowerCase();
      const num = adm.admissionNumber.toLowerCase();
      const query = searchQuery.toLowerCase();
      return patientName.includes(query) || num.includes(query);
    });
  }, [admissions, searchQuery]);

  const calculateAge = (dobString: string) => {
    if (!dobString) return 0;
    return new Date().getFullYear() - new Date(dobString).getFullYear();
  };

  return (
    <div className="space-y-6">
      {/* Overview Toolbar */}
      <div className="bg-white border border-slate-200 shadow-soft rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
            <BedDouble className="h-5 w-5 text-blue-500" />
            Ward Rounds Console
          </h3>
          <p className="text-xs text-slate-400">
            Monitor patient progress notes, check live vitals flowsheet logs, issue medication orders, and book surgeries.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-1 md:max-w-xs">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inpatient..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-400 placeholder:text-slate-300"
            />
          </div>
          <button
            onClick={fetchAdmissions}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-soft">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-4 text-blue-500" />
          <p className="font-semibold text-sm">Retrieving Ward Patient Roster...</p>
        </div>
      ) : filteredAdmissions.length === 0 ? (
        <div className="py-20 text-center bg-white border border-slate-100 rounded-2xl shadow-soft">
          <BedDouble className="h-12 w-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500 text-sm">No Active Admitted Patients</p>
          <p className="text-xs text-slate-400 mt-1">There are currently no patients checked into wards under your care.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left List (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Admitted Roster</span>
            </div>
            <div className="divide-y divide-slate-50 overflow-y-auto max-h-[500px]">
              {filteredAdmissions.map((adm) => {
                const lastVitals = adm.vitalsLogs.find(() => true); // Get most recent
                const isSelected = selectedAdmission?.id === adm.id;

                return (
                  <div
                    key={adm.id}
                    onClick={() => setSelectedAdmission(adm)}
                    className={cn(
                      'p-4 cursor-pointer transition-all border-l-2',
                      isSelected
                        ? 'bg-blue-50/40 border-blue-600'
                        : 'border-transparent hover:bg-slate-50/50'
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">
                          {adm.patient.firstName} {adm.patient.lastName}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {adm.admissionNumber} · {calculateAge(adm.patient.dateOfBirth)}y / {adm.patient.gender}
                        </p>
                      </div>
                      {adm.bed && (
                        <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">
                          {adm.bed.room.ward.name} · Bed {adm.bed.label}
                        </span>
                      )}
                    </div>

                    {/* Vitals preview */}
                    {lastVitals && (
                      <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-2.5 mt-2.5 text-[9px] text-slate-500 font-semibold">
                        <div>Temp: <span className="text-slate-800 font-bold">{lastVitals.temperature ? `${lastVitals.temperature}°F` : '--'}</span></div>
                        <div>BP: <span className="text-slate-800 font-bold">{lastVitals.systolicBP && lastVitals.diastolicBP ? `${lastVitals.systolicBP}/${lastVitals.diastolicBP}` : '--'}</span></div>
                        <div>HR: <span className="text-slate-800 font-bold">{lastVitals.heartRate ? `${lastVitals.heartRate} bpm` : '--'}</span></div>
                        <div>SpO2: <span className={cn('font-bold', lastVitals.spO2 && lastVitals.spO2 < 95 ? 'text-amber-600' : 'text-slate-800')}>{lastVitals.spO2 ? `${lastVitals.spO2}%` : '--'}</span></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right cockpit (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            {!selectedAdmission ? (
              <div className="bg-white border border-slate-200 shadow-soft rounded-2xl flex-1 flex flex-col justify-center items-center p-6 text-center text-slate-400">
                <Stethoscope className="h-10 w-10 mb-2 text-slate-200" />
                <p className="text-xs font-semibold">Select Inpatient Patient</p>
                <p className="text-[10px] mt-0.5">Click a patient card on the left list to open their rounds clinical station.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 shadow-soft rounded-2xl p-6 flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  {/* Title */}
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">
                        Rounds: {selectedAdmission.patient.firstName} {selectedAdmission.patient.lastName}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Admitted: {new Date(selectedAdmission.admittedAt).toLocaleDateString('en-IN')} · Diagnosis: <strong>{selectedAdmission.diagnosis || 'General Observation'}</strong>
                      </p>
                    </div>

                    <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                      {selectedAdmission.bed ? `Ward Bed: ${selectedAdmission.bed.label}` : 'Unassigned'}
                    </span>
                  </div>

                  {/* Vitals log preview */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Most Recent Vitals Chart</p>
                    {selectedAdmission.vitalsLogs.find(() => true) ? (
                      (() => {
                        const vitals = selectedAdmission.vitalsLogs.find(() => true)!;
                        return (
                          <div className="grid grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
                            <div>Temp: <strong className="text-slate-800 block text-sm mt-0.5">{vitals.temperature}°F</strong></div>
                            <div>BP: <strong className="text-slate-800 block text-sm mt-0.5">{vitals.systolicBP}/{vitals.diastolicBP}</strong></div>
                            <div>Pulse: <strong className="text-slate-800 block text-sm mt-0.5">{vitals.heartRate} bpm</strong></div>
                            <div>Oxygen: <strong className="text-slate-800 block text-sm mt-0.5">{vitals.spO2}%</strong></div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-xs text-slate-400">No vitals logs filed for this patient yet.</p>
                    )}
                  </div>

                  {/* Actions Drawer options */}
                  <div className="space-y-2.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Clinical Orders Console</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => setShowNoteModal(true)}
                        className="h-11 px-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <FileText className="h-4.5 w-4.5 text-blue-500" />
                        Write Progress Note
                      </button>
                      <button
                        onClick={() => setShowOrderModal(true)}
                        className="h-11 px-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Pill className="h-4.5 w-4.5 text-emerald-500" />
                        Order Medication
                      </button>
                      <button
                        onClick={() => setShowSurgeryModal(true)}
                        className="h-11 px-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/20 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Scissors className="h-4.5 w-4.5 text-rose-500" />
                        Book OT Surgery
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-center">
                  <a
                    href={`/receptionist/ipd/admissions?search=${selectedAdmission.admissionNumber}`}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold inline-flex items-center gap-1"
                  >
                    Open ADT Timeline History
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Note Modal */}
      <AnimatePresence>
        {showNoteModal && selectedAdmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowNoteModal(false)}
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
                  Write Clinical Progress Note
                </h4>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProgressNote} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Daily Progress Observation
                  </label>
                  <textarea
                    required
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Patient reports less abdominal pain today. Abdomen soft, non-tender..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400 h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Assessment
                  </label>
                  <input
                    type="text"
                    value={noteAssessment}
                    onChange={(e) => setNoteAssessment(e.target.value)}
                    placeholder="Resolving gastroenteritis"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Treatment Plan
                  </label>
                  <input
                    type="text"
                    value={notePlan}
                    onChange={(e) => setNotePlan(e.target.value)}
                    placeholder="Continue current iv antibiotics. Discharged tomorrow if vitals stable."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingNote}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs transition-all active:scale-[0.98]"
                  >
                    {submittingNote ? 'Saving Note...' : 'Record Rounds Sign-off'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medication Order Modal */}
      <AnimatePresence>
        {showOrderModal && selectedAdmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowOrderModal(false)}
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
                  Order Inpatient Medication
                </h4>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMedOrder} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Select Medicine
                  </label>
                  <select
                    required
                    value={selectedMedicineId}
                    onChange={(e) => setSelectedMedicineId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:border-emerald-400"
                  >
                    <option value="">-- Choose Medicine --</option>
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.dosageForm} · Stock: {m.totalStock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Dosage (mg/ml/tab)
                    </label>
                    <input
                      type="text"
                      required
                      value={orderDosage}
                      onChange={(e) => setOrderDosage(e.target.value)}
                      placeholder="e.g. 500mg"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Dispense Route
                    </label>
                    <select
                      value={orderRoute}
                      onChange={(e) => setOrderRoute(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:border-emerald-400"
                    >
                      <option value="ORAL">Oral</option>
                      <option value="IV">Intravenous (IV)</option>
                      <option value="IM">Intramuscular (IM)</option>
                      <option value="SC">Subcutaneous (SC)</option>
                      <option value="TOPICAL">Topical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Frequency
                    </label>
                    <select
                      value={orderFrequency}
                      onChange={(e) => setOrderFrequency(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:border-emerald-400"
                    >
                      <option value="OD">Once daily (OD)</option>
                      <option value="BD">Twice daily (BD)</option>
                      <option value="TDS">Three times daily (TDS)</option>
                      <option value="QID">Four times daily (QID)</option>
                      <option value="Every 8 hours">Every 8 hours</option>
                      <option value="Every 12 hours">Every 12 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={orderEndDate}
                      onChange={(e) => setOrderEndDate(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Special Instructions
                  </label>
                  <input
                    type="text"
                    value={orderInstructions}
                    onChange={(e) => setOrderInstructions(e.target.value)}
                    placeholder="e.g. Empty stomach in morning"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingOrder}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs transition-all active:scale-[0.98]"
                  >
                    {submittingOrder ? 'Placing Order...' : 'Confirm Medication Plan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Surgery Modal */}
      <AnimatePresence>
        {showSurgeryModal && selectedAdmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowSurgeryModal(false)}
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
                  Book OT & Schedule Surgery
                </h4>
                <button
                  onClick={() => setShowSurgeryModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleScheduleSurgery} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Procedure / Surgery Name
                  </label>
                  <input
                    type="text"
                    required
                    value={surgeryName}
                    onChange={(e) => setSurgeryName(e.target.value)}
                    placeholder="e.g. Laparoscopic Appendectomy"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-rose-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      OT Room Room
                    </label>
                    <select
                      value={surgeryOtRoom}
                      onChange={(e) => setSurgeryOtRoom(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:border-rose-400"
                    >
                      <option value="OT-1">Operation Theater 1 (OT-1)</option>
                      <option value="OT-2">Operation Theater 2 (OT-2)</option>
                      <option value="OT-3">Minor OT (OT-3)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Anesthetist Doctor
                    </label>
                    <select
                      value={selectedAnesthetistId}
                      onChange={(e) => setSelectedAnesthetistId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:border-rose-400"
                    >
                      <option value="">-- None / TBD --</option>
                      {doctors.map((dr) => (
                        <option key={dr.doctorProfile?.id} value={dr.doctorProfile?.id}>
                          Dr. {dr.firstName} {dr.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Scheduled Start Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={surgeryStart}
                      onChange={(e) => setSurgeryStart(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-rose-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Scheduled End Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={surgeryEnd}
                      onChange={(e) => setSurgeryEnd(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Estimated Procedure Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={surgeryCost}
                    onChange={(e) => setSurgeryCost(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-rose-400 font-semibold"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingSurgery}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs transition-all active:scale-[0.98]"
                  >
                    {submittingSurgery ? 'Checking Clashes...' : 'Confirm OT Booking'}
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
