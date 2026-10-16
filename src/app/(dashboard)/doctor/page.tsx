'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from 'next-auth/react';
import {
  Users,
  Clock,
  FileText,
  ArrowRight,
  UserCheck,
  Activity,
  Calendar,
  Stethoscope,
  X,
  BedDouble,
  Video,
} from 'lucide-react';

// ============================================================================
// Doctor Dashboard Queue & Types
// ============================================================================

interface DoctorQueueItem {
  id: string;
  tokenNumber: number;
  patientId: string;
  patientName: string;
  age: number;
  gender: 'M' | 'F';
  type: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'WAITING';
  timeSlot: string;
}

const statusConfig = {
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  WAITING: {
    label: 'Waiting',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export default function DoctorDashboard() {
  const [queue, setQueue] = useState<DoctorQueueItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    description: string;
    tokenNumber?: number;
    type?: string;
    timestamp?: string;
  } | null>(null);
  const { data: session } = useSession();

  // Admission request modal states
  const [admittingPatient, setAdmittingPatient] = useState<{ id: string; name: string } | null>(null);
  const [wardType, setWardType] = useState('GENERAL');
  const [diagnosis, setDiagnosis] = useState('');
  const [complaints, setComplaints] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admittingPatient) return;

    try {
      setSubmittingRequest(true);
      const res = await fetch('/api/ipd/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: admittingPatient.id,
          admittingDoctorId: session?.user?.doctorProfileId || '',
          status: 'REQUESTED',
          source: 'OPD',
          diagnosis,
          chiefComplaints: complaints,
          notes,
        }),
      });

      if (res.ok) {
        setAdmittingPatient(null);
        setDiagnosis('');
        setComplaints('');
        setNotes('');
        alert('Admission request sent to reception front desk!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit admission request.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const fetchQueue = async () => {
    try {
      const doctorProfileId = session?.user?.doctorProfileId;
      const url = doctorProfileId ? `/api/queue?doctorId=${doctorProfileId}` : '/api/queue';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.tokens.map((token: any) => ({
          id: token.id,
          tokenNumber: token.tokenNumber,
          patientId: token.patient.id,
          patientName: `${token.patient.firstName} ${token.patient.lastName}`,
          age: token.patient.dateOfBirth
            ? new Date().getFullYear() - new Date(token.patient.dateOfBirth).getFullYear()
            : 0,
          gender: token.patient.gender?.startsWith('F') ? 'F' : 'M',
          type: token.appointment.type === 'FOLLOW_UP' ? 'Follow-up' : 'Consultation',
          status: token.status,
          timeSlot: token.appointment.timeSlot,
        }));
        setQueue(mapped);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchQueue();
      const interval = setInterval(fetchQueue, 10000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Storage listener for instant cross-tab sync when receptionist checks in
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'medflow-toast') {
        if (e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            // Display alert to doctor if check-in matches this doctor's profile ID or name
            const doctorName = session?.user?.name;
            const matchesDoctor = data.doctorId === session?.user?.doctorProfileId || 
              (doctorName && data.description.includes(doctorName));
            
            if (matchesDoctor) {
              setActiveToast(data);
              // Auto-dismiss after 6 seconds
              setTimeout(() => {
                setActiveToast(current => current?.id === data.id ? null : current);
              }, 6000);
            }
          } catch (err) {
            console.error(err);
          }
        }
        fetchQueue();
      } else if (e.key === 'medflow-queue') {
        fetchQueue();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [session]);

  const completedCount = queue.filter((q) => q.status === 'COMPLETED').length;
  const inProgressCount = queue.filter((q) => q.status === 'IN_PROGRESS').length;
  const waitingCount = queue.filter((q) => q.status === 'WAITING').length;

  const filteredQueue =
    selectedStatus === 'ALL'
      ? queue
      : queue.filter((q) => q.status === selectedStatus);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={cardVariants} className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Today&apos;s Patients</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{queue.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Completed</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{completedCount}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">In Progress</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{inProgressCount}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Waiting</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{waitingCount}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Queue Section */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
        {/* Queue Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Today&apos;s Queue</h2>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            {['ALL', 'WAITING', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {status === 'ALL'
                  ? 'All'
                  : status === 'IN_PROGRESS'
                  ? 'In Progress'
                  : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Queue List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="divide-y divide-slate-50"
        >
          {filteredQueue.map((item) => {
            const config = statusConfig[item.status];
            return (
              <motion.div
                key={item.id}
                variants={cardVariants}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors duration-200 group"
              >
                <div className="flex items-center gap-4">
                  {/* Token Number */}
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold ${config.bg} ${config.text}`}
                  >
                    #{item.tokenNumber}
                  </div>

                  {/* Patient Info */}
                  <div>
                    <p className="font-medium text-slate-800">{item.patientName}</p>
                    <p className="text-sm text-slate-500">
                      {item.age}y / {item.gender} · {item.type} · {item.timeSlot}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                    {config.label}
                  </span>

                  {/* Actions */}
                  {item.status !== 'COMPLETED' && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={() => setAdmittingPatient({ id: item.patientId, name: item.patientName })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        <BedDouble className="h-3.5 w-3.5 text-blue-500" />
                        Admit
                      </button>
                      <Link
                        href={`/doctor/telemedicine/${item.patientId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold"
                      >
                        <Video className="h-3.5 w-3.5 text-indigo-500" />
                        Telemed
                      </Link>
                      <Link
                        href={`/doctor/prescription/${item.patientId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Prescribe
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filteredQueue.length === 0 && (
            <div className="py-16 text-center text-slate-400">
              <Users className="h-10 w-10 mx-auto mb-2 text-slate-200" />
              <p className="text-sm font-semibold">No active queue tokens found</p>
              <p className="text-xs">All caught up or waiting for receptionist check-ins</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Real-time Receptionist Check-in Toast Alert */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl border-l-4 border-l-blue-600 border border-slate-200/80 shadow-2xl p-4 flex gap-3.5 items-start"
          >
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
              <Stethoscope className="h-5 w-5 text-blue-600 animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
                  {activeToast.title}
                </p>
                <button 
                  onClick={() => setActiveToast(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                {activeToast.description}
              </p>
              {activeToast.tokenNumber && (
                <div className="mt-2.5 inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                  Token #{activeToast.tokenNumber}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Admission Modal */}
      <AnimatePresence>
        {admittingPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setAdmittingPatient(null)}
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
                  Request Inpatient Admission
                </h4>
                <button
                  onClick={() => setAdmittingPatient(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAdmitSubmit} className="space-y-4">
                <p className="text-xs text-slate-500">
                  Requesting bed admission for patient: <strong>{admittingPatient.name}</strong>.
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Requested Ward Tier
                  </label>
                  <select
                    value={wardType}
                    onChange={(e) => setWardType(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:border-blue-400"
                  >
                    <option value="GENERAL">General Ward</option>
                    <option value="SEMI_PRIVATE">Semi-Private</option>
                    <option value="PRIVATE">Private Room</option>
                    <option value="ICU">ICU (Intensive Care)</option>
                    <option value="NICU">NICU (Neonatal ICU)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Diagnosis / Reason for Admission
                  </label>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Appendicitis / High fever"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Chief Complaints
                    </label>
                    <input
                      type="text"
                      value={complaints}
                      onChange={(e) => setComplaints(e.target.value)}
                      placeholder="e.g. Abdominal pain"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Clinical Notes
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Needs immediate scan"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs transition-all active:scale-[0.98]"
                  >
                    {submittingRequest ? 'Submitting Request...' : 'Send Admission Request'}
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

