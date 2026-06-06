'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Users,
  Clock,
  FileText,
  ArrowRight,
  UserCheck,
  Activity,
  Calendar,
  Stethoscope,
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

  // Load and subscribe to real-time receptionist check-ins via storage events
  useEffect(() => {
    const loadQueue = () => {
      const stored = localStorage.getItem('medflow-queue');
      if (stored) {
        try {
          const rawQueue = JSON.parse(stored);
          // Filter only patients checked in under Lead Cardiologist: Dr. Anand Sharma
          const mapped = rawQueue
            .filter((item: any) => item.assignedDoctor === 'Dr. Anand Sharma')
            .map((item: any) => ({
              id: item.id,
              tokenNumber: item.tokenNumber,
              patientId: item.patientId || `p-${item.id.replace('q-', '')}`,
              patientName: item.patientName,
              age: item.age,
              gender: item.gender.startsWith('M') ? 'M' : 'F',
              type: item.tokenNumber % 3 === 0 ? 'Follow-up' : 'Consultation',
              status: item.status === 'SKIPPED' ? 'WAITING' : item.status,
              timeSlot: item.checkedInTime || item.timeSlot.split(' ')[0],
            }));
          setQueue(mapped);
        } catch {
          // ignore parsing error
        }
      }
    };

    loadQueue();

    // Storage listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'medflow-queue') {
        loadQueue();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
                    <Link
                      href={`/doctor/prescription/${item.patientId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100 duration-200"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Prescribe
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
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
    </div>
  );
}
