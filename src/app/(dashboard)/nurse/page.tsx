'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  HeartPulse,
  Search,
  Activity,
  Pill,
  ArrowRightLeft,
  BedDouble,
  UserCheck,
  RefreshCw,
  Clock,
  ChevronRight,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phone?: string | null;
  bloodGroup?: string | null;
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
  admittedAt: string;
  patient: Patient;
  bed: Bed | null;
  admittingDoctor: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function NurseDashboard() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdmissions = async () => {
    try {
      const res = await fetch('/api/ipd/admissions?status=ADMITTED');
      if (res.ok) {
        const data = await res.json();
        setAdmissions(data.admissions || []);
      }
    } catch (error) {
      console.error('Failed to fetch admitted patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    const interval = setInterval(fetchAdmissions, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, []);

  const filteredAdmissions = useMemo(() => {
    return admissions.filter((adm) => {
      const name = `${adm.patient.firstName} ${adm.patient.lastName}`.toLowerCase();
      const num = adm.admissionNumber.toLowerCase();
      const phone = adm.patient.phone || '';
      const query = searchQuery.toLowerCase();

      return name.includes(query) || num.includes(query) || phone.includes(query);
    });
  }, [admissions, searchQuery]);

  const calculateAge = (dobString: string) => {
    if (!dobString) return 0;
    return new Date().getFullYear() - new Date(dobString).getFullYear();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admitted Patients</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{loading ? '...' : admissions.length}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <BedDouble className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vitals Due</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{loading ? '...' : Math.max(0, admissions.length - 1)}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Medication Doses Scheduled</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{loading ? '...' : admissions.length * 3}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Pill className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Shift Handover</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">Pending</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main patients queue list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        {/* Search header */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
              <HeartPulse className="h-5 w-5 text-emerald-500 animate-pulse" />
              Active Inpatient Ward Queue
            </h3>
            <p className="text-xs text-slate-400">Manage logs, medication administrations, and nursing rounds schedules.</p>
          </div>

          <div className="flex items-center gap-2.5 flex-1 md:max-w-xs">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient or bed..."
                className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-400 placeholder:text-slate-300"
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

        {/* Patients Cards List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-3 text-emerald-500" />
            <p className="text-xs">Fetching ward patients ledger...</p>
          </div>
        ) : filteredAdmissions.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <BedDouble className="h-10 w-10 mx-auto mb-2 text-slate-200" />
            <p className="text-sm font-semibold">No active ward patients</p>
            <p className="text-xs">All caught up or update filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            {filteredAdmissions.map((adm) => (
              <div
                key={adm.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-soft hover:border-emerald-200 transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">
                        {adm.patient.firstName} {adm.patient.lastName}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ID: {adm.admissionNumber} · {calculateAge(adm.patient.dateOfBirth)}y · {adm.patient.gender} {adm.patient.bloodGroup ? `· BG: ${adm.patient.bloodGroup}` : ''}
                      </p>
                    </div>

                    {adm.bed ? (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 text-right shrink-0">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-emerald-500">Bed Location</p>
                        <p className="text-xs font-black text-emerald-700 mt-0.5">
                          {adm.bed.room.ward.name} · {adm.bed.room.number} · {adm.bed.label}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 text-right shrink-0">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-amber-500">Bed Allocation</p>
                        <p className="text-xs font-black text-amber-700 mt-0.5">Unassigned</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[11px] text-slate-600">
                    <p>Diagnosis: <strong className="text-slate-800">{adm.diagnosis || 'General Observation'}</strong></p>
                    <p className="mt-0.5">Doctor: <span className="font-semibold text-slate-700">Dr. {adm.admittingDoctor.user.firstName} {adm.admittingDoctor.user.lastName}</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <a
                    href={`/nurse/vitals?admissionId=${adm.id}`}
                    className="h-8.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 text-slate-700 text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-1 transition-all"
                  >
                    <Activity className="h-3.5 w-3.5 text-emerald-500" />
                    Flowsheet
                  </a>
                  <a
                    href={`/nurse/mar?admissionId=${adm.id}`}
                    className="h-8.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 text-slate-700 text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-1 transition-all"
                  >
                    <Pill className="h-3.5 w-3.5 text-blue-500" />
                    MAR tasks
                  </a>
                  <a
                    href={`/nurse/handover?admissionId=${adm.id}`}
                    className="h-8.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 text-slate-700 text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-1 transition-all"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-500" />
                    Handover
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
