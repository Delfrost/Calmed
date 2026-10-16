'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BedDouble,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Home,
  User,
  Activity,
  ArrowRight,
  Clipboard,
  Receipt,
  UserCheck,
  Search,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface AdmissionSummary {
  id: string;
  admissionNumber: string;
  admittedAt: string;
  patient: PatientSummary;
}

interface BedData {
  id: string;
  label: string;
  status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' | 'HOUSEKEEPING' | 'RESERVED';
  admissions: AdmissionSummary[];
}

interface RoomData {
  id: string;
  number: string;
  dailyRate: string;
  beds: BedData[];
}

interface WardData {
  id: string;
  name: string;
  type: 'GENERAL' | 'SEMI_PRIVATE' | 'PRIVATE' | 'ICU' | 'NICU' | 'PICU' | 'HDU';
  floor: number;
  rooms: RoomData[];
}

export default function BedMatrixPage() {
  const [wards, setWards] = useState<WardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingBedId, setUpdatingBedId] = useState<string | null>(null);
  const [selectedBed, setSelectedBed] = useState<(BedData & { roomNumber: string; wardName: string; dailyRate: string }) | null>(null);
  const [selectedWardType, setSelectedWardType] = useState<string>('ALL');
  const [dischargingId, setDischargingId] = useState<string | null>(null);

  const handleDischargePatient = async (id: string) => {
    if (!confirm('Are you sure you want to discharge this patient and release this bed?')) return;
    try {
      setDischargingId(id);
      const res = await fetch(`/api/ipd/admissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISCHARGED' }),
      });
      if (res.ok) {
        alert('Patient successfully discharged. Bed is now in HOUSEKEEPING.');
        setSelectedBed(null); // Close sidebar panel
        await fetchWards();  // Refresh bed matrix
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to discharge patient.');
      }
    } catch (error) {
      console.error('Failed to discharge patient:', error);
      alert('An error occurred during discharge.');
    } finally {
      setDischargingId(null);
    }
  };

  const fetchWards = async () => {
    try {
      const res = await fetch('/api/ipd/wards');
      if (res.ok) {
        const data = await res.json();
        setWards(data.wards || []);
      }
    } catch (error) {
      console.error('Failed to load wards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
    const interval = setInterval(fetchWards, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (bedId: string, newStatus: string) => {
    try {
      setUpdatingBedId(bedId);
      const res = await fetch('/api/ipd/beds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bedId, status: newStatus }),
      });
      if (res.ok) {
        await fetchWards();
        // Update selectedBed details dynamically if open
        if (selectedBed && selectedBed.id === bedId) {
          setSelectedBed((prev: any) => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (error) {
      console.error('Failed to update bed status:', error);
    } finally {
      setUpdatingBedId(null);
    }
  };

  // Compute live matrix statistics
  const stats = useMemo(() => {
    let total = 0;
    let vacant = 0;
    let occupied = 0;
    let housekeeping = 0;
    let maintenance = 0;

    wards.forEach((ward) => {
      ward.rooms.forEach((room) => {
        room.beds.forEach((bed) => {
          total++;
          if (bed.status === 'VACANT') vacant++;
          else if (bed.status === 'OCCUPIED') occupied++;
          else if (bed.status === 'HOUSEKEEPING') housekeeping++;
          else if (bed.status === 'MAINTENANCE') maintenance++;
        });
      });
    });

    return { total, vacant, occupied, housekeeping, maintenance };
  }, [wards]);

  // Filter wards by type
  const filteredWards = useMemo(() => {
    if (selectedWardType === 'ALL') return wards;
    return wards.filter((w) => w.type === selectedWardType);
  }, [wards, selectedWardType]);

  const bedStatusColors: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    VACANT: {
      bg: 'bg-emerald-50/50 hover:bg-emerald-50',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      border: 'border-emerald-200',
    },
    OCCUPIED: {
      bg: 'bg-rose-50/50 hover:bg-rose-50',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
      border: 'border-rose-200',
    },
    HOUSEKEEPING: {
      bg: 'bg-amber-50/50 hover:bg-amber-50',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      border: 'border-amber-200',
    },
    MAINTENANCE: {
      bg: 'bg-slate-50/50 hover:bg-slate-50',
      text: 'text-slate-600',
      dot: 'bg-slate-400',
      border: 'border-slate-200',
    },
    RESERVED: {
      bg: 'bg-indigo-50/50 hover:bg-indigo-50',
      text: 'text-indigo-700',
      dot: 'bg-indigo-500',
      border: 'border-indigo-200',
    },
  };

  const wardTypeLabels: Record<string, string> = {
    ALL: 'All Wards',
    GENERAL: 'General Ward',
    SEMI_PRIVATE: 'Semi-Private',
    PRIVATE: 'Private Room',
    ICU: 'ICU',
    NICU: 'NICU',
    PICU: 'PICU',
    HDU: 'HDU',
  };

  return (
    <div className="space-y-6">
      {/* Top statistics panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Beds</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{loading ? '...' : stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Vacant</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{loading ? '...' : stats.vacant}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Occupied</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{loading ? '...' : stats.occupied}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Housekeeping</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{loading ? '...' : stats.housekeeping}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Maintenance</p>
          <p className="text-2xl font-black text-slate-700 mt-1">{loading ? '...' : stats.maintenance}</p>
        </div>
      </div>

      {/* Ward Filters */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
          {['ALL', 'GENERAL', 'SEMI_PRIVATE', 'PRIVATE', 'ICU', 'NICU'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedWardType(type)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all border',
                selectedWardType === type
                  ? 'bg-primary border-primary text-white shadow-soft'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              {wardTypeLabels[type]}
            </button>
          ))}
        </div>

        <button
          onClick={fetchWards}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors shrink-0"
          title="Refresh matrix"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-4 text-primary" />
          <p className="font-semibold text-sm">Loading Live Bed Matrix...</p>
        </div>
      ) : filteredWards.length === 0 ? (
        <div className="py-24 text-center bg-white border border-slate-100 rounded-2xl">
          <BedDouble className="h-12 w-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500 text-sm">No Wards Configured</p>
          <p className="text-xs text-slate-400 mt-1">Please create wards in administration or seeding.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredWards.map((ward) => (
            <div key={ward.id} className="space-y-4">
              {/* Ward Title Banner */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-slate-500" />
                  <span className="font-bold text-slate-800 text-sm">{ward.name}</span>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-600 rounded-md px-1.5 py-0.5">
                    Floor {ward.floor} · {ward.type}
                  </span>
                </div>
              </div>

              {/* Rooms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ward.rooms.map((room) => (
                  <div key={room.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-soft space-y-4">
                    {/* Room title & daily rate */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-bold text-xs text-slate-700">Room {room.number}</span>
                      <span className="text-[10px] font-semibold text-teal-600">₹{room.dailyRate}/day</span>
                    </div>

                    {/* Beds Grid inside Room */}
                    <div className="grid grid-cols-2 gap-2">
                      {room.beds.map((bed) => {
                        const style = bedStatusColors[bed.status];
                        const activeAdmission = bed.admissions.find(() => true); // Get first active

                        return (
                          <div
                            key={bed.id}
                            onClick={() => setSelectedBed({
                              ...bed,
                              roomNumber: room.number,
                              wardName: ward.name,
                              dailyRate: room.dailyRate,
                            })}
                            className={cn(
                              'p-3 border rounded-lg flex flex-col justify-between items-start gap-1 cursor-pointer transition-all duration-200 hover:-translate-y-[2px]',
                              style.bg,
                              style.border
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-black text-xs text-slate-800">{bed.label}</span>
                              <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', style.dot)} />
                            </div>

                            {bed.status === 'OCCUPIED' && activeAdmission ? (
                              <p className="text-[10px] font-bold text-slate-700 mt-1 truncate max-w-full">
                                {activeAdmission.patient.firstName} {activeAdmission.patient.lastName.charAt(0)}.
                              </p>
                            ) : (
                              <span className="text-[8px] font-bold tracking-wider uppercase text-slate-400 mt-1">
                                {bed.status}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bed Detail Modal */}
      <AnimatePresence>
        {selectedBed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setSelectedBed(null)}
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
                    {selectedBed.wardName} · Room {selectedBed.roomNumber} · {selectedBed.label}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Room Rate: ₹{selectedBed.dailyRate} / day
                  </p>
                </div>
                <span className={cn(
                  'px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border',
                  bedStatusColors[selectedBed.status].bg,
                  bedStatusColors[selectedBed.status].text,
                  bedStatusColors[selectedBed.status].border
                )}>
                  {selectedBed.status}
                </span>
              </div>

              {/* Occupied State Details */}
              {selectedBed.status === 'OCCUPIED' && selectedBed.admissions.find(() => true) ? (
                (() => {
                  const admission = selectedBed.admissions.find(() => true)!;
                  return (
                    <div className="space-y-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Patient:</span>
                          <span className="font-semibold text-slate-800">
                            {admission.patient.firstName} {admission.patient.lastName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Phone:</span>
                          <span className="font-mono text-slate-600">{admission.patient.phone}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">IPD Admission:</span>
                          <span className="font-semibold text-slate-800">{admission.admissionNumber}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Admitted At:</span>
                          <span className="font-semibold text-slate-800">
                            {new Date(admission.admittedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={`/receptionist/ipd/admissions?search=${admission.admissionNumber}`}
                          className="flex-1 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <UserCheck className="h-4 w-4" />
                          ADT details
                        </a>
                        <a
                          href={`/receptionist/ipd/billing?admissionId=${admission.id}`}
                          className="flex-1 h-9 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-soft"
                        >
                          <Receipt className="h-4 w-4" />
                          View running bill
                        </a>
                      </div>

                      <button
                        disabled={dischargingId !== null}
                        onClick={() => handleDischargePatient(admission.id)}
                        className="w-full h-9 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-soft cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        {dischargingId ? 'Discharging...' : 'Discharge Patient & Release'}
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Set Bed Status
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['VACANT', 'HOUSEKEEPING', 'MAINTENANCE'].map((status) => (
                        <button
                          key={status}
                          disabled={updatingBedId !== null}
                          onClick={() => handleUpdateStatus(selectedBed.id, status)}
                          className={cn(
                            'py-2 border rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all active:scale-95',
                            selectedBed.status === status
                              ? 'bg-slate-900 border-slate-900 text-white shadow-soft'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedBed.status === 'VACANT' && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                      <p className="text-xs font-bold text-emerald-800">Bed is available for admissions</p>
                      <p className="text-[10px] text-emerald-600 mt-1">
                        Go to Admissions tab to allocate this bed to a doctor's IPD request.
                      </p>
                      <a
                        href="/receptionist/ipd/admissions"
                        className="mt-3 inline-flex h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs items-center gap-1 transition-all"
                      >
                        Assign Patient
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="text-center pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedBed(null)}
                  className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                >
                  Close Panel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
