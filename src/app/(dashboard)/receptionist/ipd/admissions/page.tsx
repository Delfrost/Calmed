'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserPlus,
  Search,
  CheckCircle,
  Clock,
  UserCheck,
  Building,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  ClipboardList,
  AlertCircle,
  Activity,
  Calendar,
  X,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
}

interface Doctor {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface Bed {
  id: string;
  label: string;
  room: {
    number: string;
    ward: {
      name: string;
      type: string;
    };
  };
}

interface Admission {
  id: string;
  admissionNumber: string;
  status: 'REQUESTED' | 'ADMITTED' | 'TRANSFERRED' | 'DISCHARGED' | 'CANCELLED';
  source: string;
  diagnosis: string;
  chiefComplaints: string;
  notes: string;
  admittedAt: string | null;
  dischargedAt: string | null;
  expectedDischargeDate: string | null;
  patient: Patient;
  admittingDoctor: Doctor;
  attendingDoctor: Doctor;
  bed: Bed | null;
  createdAt: string;
}

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'REQUESTED' | 'ADMITTED' | 'DISCHARGED' | 'ALL'>('REQUESTED');

  // Bed allocation modal states
  const [allocatingAdmission, setAllocatingAdmission] = useState<Admission | null>(null);
  const [vacantBeds, setVacantBeds] = useState<any[]>([]);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [submittingAllocation, setSubmittingAllocation] = useState(false);

  // Doctors list (for reassigning attending doctors)
  const [doctors, setDoctors] = useState<any[]>([]);

  const fetchAdmissions = async () => {
    try {
      const res = await fetch('/api/ipd/admissions');
      if (res.ok) {
        const data = await res.json();
        setAdmissions(data.admissions || []);
      }
    } catch (error) {
      console.error('Failed to load admissions:', error);
    } finally {
      setLoading(false);
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
    fetchDoctors();
    const interval = setInterval(fetchAdmissions, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenAllocateModal = async (admission: Admission) => {
    setAllocatingAdmission(admission);
    setLoadingBeds(true);
    setSelectedBedId('');
    try {
      const res = await fetch('/api/ipd/beds?status=VACANT');
      if (res.ok) {
        const data = await res.json();
        setVacantBeds(data.beds || []);
      }
    } catch (error) {
      console.error('Failed to load vacant beds:', error);
    } finally {
      setLoadingBeds(false);
    }
  };

  const handleAllocateBedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingAdmission || !selectedBedId) return;

    try {
      setSubmittingAllocation(true);
      const res = await fetch(`/api/ipd/admissions/${allocatingAdmission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ADMITTED',
          bedId: selectedBedId,
        }),
      });

      if (res.ok) {
        setAllocatingAdmission(null);
        await fetchAdmissions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to allocate bed.');
      }
    } catch (error) {
      console.error('Failed to allocate bed:', error);
    } finally {
      setSubmittingAllocation(false);
    }
  };

  const handleDischarge = async (admissionId: string) => {
    if (!confirm('Are you sure you want to discharge this patient? This will release the bed and finalize the bill.')) {
      return;
    }

    try {
      const res = await fetch(`/api/ipd/admissions/${admissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DISCHARGED',
        }),
      });

      if (res.ok) {
        await fetchAdmissions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to discharge patient.');
      }
    } catch (error) {
      console.error('Failed to discharge patient:', error);
    }
  };

  const filteredAdmissions = useMemo(() => {
    return admissions.filter((adm) => {
      const matchesTab = activeTab === 'ALL' || adm.status === activeTab;
      const patientName = `${adm.patient.firstName} ${adm.patient.lastName}`.toLowerCase();
      const phone = adm.patient.phone;
      const num = adm.admissionNumber.toLowerCase();
      const diag = (adm.diagnosis || '').toLowerCase();
      
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        patientName.includes(query) ||
        phone.includes(query) ||
        num.includes(query) ||
        diag.includes(query);

      return matchesTab && matchesSearch;
    });
  }, [admissions, activeTab, searchQuery]);

  const requestedCount = admissions.filter((a) => a.status === 'REQUESTED').length;
  const admittedCount = admissions.filter((a) => a.status === 'ADMITTED').length;

  const calculateAge = (dobString: string) => {
    if (!dobString) return 0;
    const birth = new Date(dobString);
    const now = new Date();
    return now.getFullYear() - birth.getFullYear();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Admission Requests</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">{loading ? '...' : requestedCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Admitted Patients</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{loading ? '...' : admittedCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total IPD Transactions</p>
            <p className="text-3xl font-extrabold text-blue-600 mt-1">{loading ? '...' : admissions.length}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FolderOpen className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Admissions Console Layout */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              Admission Management (ADT)
            </h3>
            <button
              onClick={fetchAdmissions}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient name, phone, diagnosis, admission ID..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto w-full md:w-auto no-scrollbar">
              {(['REQUESTED', 'ADMITTED', 'DISCHARGED', 'ALL'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all border',
                    activeTab === tab
                      ? 'bg-slate-900 border-slate-900 text-white shadow-soft'
                      : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                  )}
                >
                  {tab === 'REQUESTED' ? `Requests (${requestedCount})` : tab === 'ADMITTED' ? `Admitted (${admittedCount})` : tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Admissions List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-3 text-primary" />
            <p className="text-xs">Fetching admissions ledger...</p>
          </div>
        ) : filteredAdmissions.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <AlertCircle className="h-10 w-10 mx-auto mb-2 text-slate-200" />
            <p className="text-sm font-semibold">No admissions records found</p>
            <p className="text-xs">Try changing tabs or query search terms</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAdmissions.map((adm) => (
              <div
                key={adm.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-800">
                      {adm.patient.firstName} {adm.patient.lastName}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                      {calculateAge(adm.patient.dateOfBirth)}y · {adm.patient.gender}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">#{adm.admissionNumber}</span>
                    <span className={cn(
                      'text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border',
                      adm.status === 'ADMITTED' && 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      adm.status === 'REQUESTED' && 'bg-amber-50 text-amber-700 border-amber-100',
                      adm.status === 'DISCHARGED' && 'bg-slate-50 text-slate-400 border-slate-200'
                    )}>
                      {adm.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-6 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Stethoscope className="h-3 w-3 shrink-0 text-slate-400" />
                      <span>Doctor: <strong>Dr. {adm.admittingDoctor.user.firstName} {adm.admittingDoctor.user.lastName}</strong></span>
                    </div>
                    {adm.bed ? (
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3 shrink-0 text-slate-400" />
                        <span>Bed: <strong>{adm.bed.room.ward.name} - Room {adm.bed.room.number} - {adm.bed.label}</strong></span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Building className="h-3 w-3 shrink-0" />
                        <span>Bed: <strong>Not Assigned</strong></span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
                      {adm.admittedAt ? (
                        <span>Admitted: <strong>{new Date(adm.admittedAt).toLocaleDateString('en-IN')}</strong></span>
                      ) : (
                        <span>Requested: <strong>{new Date(adm.admittedAt || adm.createdAt).toLocaleDateString('en-IN')}</strong></span>
                      )}
                    </div>
                  </div>

                  {adm.diagnosis && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded px-2.5 py-1 inline-block">
                      Diagnosis: <span className="font-semibold text-slate-800">{adm.diagnosis}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 md:self-center">
                  {adm.status === 'REQUESTED' && (
                    <button
                      onClick={() => handleOpenAllocateModal(adm)}
                      className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-50 transition-all flex items-center gap-1"
                    >
                      <UserPlus className="h-4 w-4" />
                      Approve & Allocate Bed
                    </button>
                  )}

                  {adm.status === 'ADMITTED' && (
                    <>
                      <a
                        href={`/receptionist/ipd/billing?admissionId=${adm.id}`}
                        className="h-9 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center justify-center"
                      >
                        Ledger
                      </a>
                      <button
                        onClick={() => handleDischarge(adm.id)}
                        className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-50 transition-all"
                      >
                        Discharge Patient
                      </button>
                    </>
                  )}

                  {adm.status === 'DISCHARGED' && (
                    <a
                      href={`/receptionist/ipd/billing?admissionId=${adm.id}`}
                      className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center justify-center"
                    >
                      View Billing Summary
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bed Allocation Modal */}
      <AnimatePresence>
        {allocatingAdmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setAllocatingAdmission(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl relative border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 font-display">
                    Approve Admission & Allocate Bed
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Patient: {allocatingAdmission.patient.firstName} {allocatingAdmission.patient.lastName} · Doctor: Dr. {allocatingAdmission.admittingDoctor.user.firstName}
                  </p>
                </div>
                <button
                  onClick={() => setAllocatingAdmission(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAllocateBedSubmit} className="space-y-4">
                {allocatingAdmission.diagnosis && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-600">
                    <p className="font-semibold text-slate-700">Diagnosis Recommendation:</p>
                    <p className="mt-0.5">{allocatingAdmission.diagnosis}</p>
                    {allocatingAdmission.notes && (
                      <p className="mt-1 text-slate-500 font-mono italic">"{allocatingAdmission.notes}"</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Select Available Vacant Bed
                  </label>
                  {loadingBeds ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      <RefreshCw className="h-5 w-5 mx-auto animate-spin mb-2 text-primary" />
                      Loading vacant beds...
                    </div>
                  ) : vacantBeds.length === 0 ? (
                    <div className="py-4 text-center border border-dashed border-red-200 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">
                      No vacant beds available in the entire hospital!
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedBedId}
                      onChange={(e) => setSelectedBedId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                    >
                      <option value="">-- Choose a Bed --</option>
                      {vacantBeds.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.room.ward.name} · Room {b.room.number} · {b.label} (₹{b.room.dailyRate}/day)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingAllocation || !selectedBedId}
                    className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none text-white font-semibold text-xs shadow-md shadow-blue-50 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    {submittingAllocation ? 'Confirming Admission...' : 'Confirm Admission & Check-In'}
                    <ArrowRight className="h-4 w-4" />
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
