'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  patientName: string;
  phone: string;
  doctorId: string;
  doctorName: string;
  timeSlot: string; // "09:00", "09:30", etc.
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY';
  status: 'SCHEDULED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    patientName: 'Anil Kapoor',
    phone: '+91 98321 09876',
    doctorId: 'dr-1',
    doctorName: 'Dr. Anand Sharma',
    timeSlot: '09:00',
    type: 'CONSULTATION',
    status: 'COMPLETED',
  },
  {
    id: 'apt-2',
    patientName: 'Rita Sen',
    phone: '+91 99112 23344',
    doctorId: 'dr-1',
    doctorName: 'Dr. Anand Sharma',
    timeSlot: '09:30',
    type: 'FOLLOW_UP',
    status: 'CHECKED_IN',
  },
  {
    id: 'apt-3',
    patientName: 'Karan Johar',
    phone: '+91 98887 77766',
    doctorId: 'dr-2',
    doctorName: 'Dr. Neha Gupta',
    timeSlot: '10:00',
    type: 'CONSULTATION',
    status: 'SCHEDULED',
  },
  {
    id: 'apt-4',
    patientName: 'Madhavan Nair',
    phone: '+91 99443 32211',
    doctorId: 'dr-3',
    doctorName: 'Dr. Vikram Seth',
    timeSlot: '10:30',
    type: 'EMERGENCY',
    status: 'SCHEDULED',
  },
];

const DOCTOR_OPTIONS = [
  { id: 'dr-1', name: 'Dr. Anand Sharma', specialty: 'Cardiologist', color: 'bg-blue-500' },
  { id: 'dr-2', name: 'Dr. Neha Gupta', specialty: 'Dermatologist', color: 'bg-teal-500' },
  { id: 'dr-3', name: 'Dr. Vikram Seth', specialty: 'Pediatrician', color: 'bg-purple-500' },
];

const TIME_SLOTS = [
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:15', '12:30', '12:45',
];

export default function AppointmentsScheduler() {
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('dr-1');
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal states
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<Appointment['type']>('CONSULTATION');
  const [notes, setNotes] = useState('');

  const activeDoctor = useMemo(() => {
    return DOCTOR_OPTIONS.find((d) => d.id === selectedDoctorId) || DOCTOR_OPTIONS[0];
  }, [selectedDoctorId]);

  const handleBookSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !patientName || !phone) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      patientName,
      phone,
      doctorId: selectedDoctorId,
      doctorName: activeDoctor.name,
      timeSlot: selectedSlot,
      type,
      status: 'SCHEDULED',
      notes,
    };

    setAppointments((prev) => [...prev, newApt]);
    setSelectedSlot(null);

    // Clear form
    setPatientName('');
    setPhone('');
    setType('CONSULTATION');
    setNotes('');
  };

  const handleUpdateStatus = (id: string, status: Appointment['status']) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status } : apt))
    );
  };

  // Maps slot time to appointments of current selected doctor
  const appointmentsBySlot = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const apt of appointments) {
      if (apt.doctorId === selectedDoctorId) {
        if (!map[apt.timeSlot]) {
          map[apt.timeSlot] = [];
        }
        map[apt.timeSlot].push(apt);
      }
    }
    return map;
  }, [appointments, selectedDoctorId]);

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-soft">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">
              Appointments Calendar
            </h3>
            <p className="text-xs text-slate-400">
              Manage clinical time-slots and schedule patient consultations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Doctor selector */}
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50">
            <Stethoscope className="h-4 w-4 text-slate-400" />
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-transparent outline-none cursor-pointer"
            >
              {DOCTOR_OPTIONS.map((dr) => (
                <option key={dr.id} value={dr.id}>
                  {dr.name} ({dr.specialty})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search appointments..."
              className="w-48 h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      {/* Grid schedule */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden">
        {/* Calendar Title */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-slate-800">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <button className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Scheduler Active
          </span>
        </div>

        {/* Time-Slot Rows */}
        <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
          {TIME_SLOTS.map((time) => {
            const apts = appointmentsBySlot[time] || [];
            const hasApt = apts.length > 0;

            return (
              <div key={time} className="flex items-stretch min-h-[72px] hover:bg-slate-50/20 transition-colors">
                {/* Time Indicator (left) */}
                <div className="w-20 px-4 py-4 flex items-center gap-1.5 text-slate-400 border-r border-slate-100 shrink-0 text-xs font-semibold select-none">
                  <Clock className="h-3.5 w-3.5 text-slate-300" />
                  {time}
                </div>

                {/* Appointment Card Slot (right) */}
                <div className="flex-1 p-3 flex flex-wrap gap-2 items-center">
                  {hasApt ? (
                    apts.map((apt) => (
                      <motion.div
                        key={apt.id}
                        layout
                        className={cn(
                          'rounded-xl border p-3 min-w-[240px] max-w-sm flex items-start justify-between gap-3 shadow-sm transition-all',
                          apt.status === 'COMPLETED' && 'bg-emerald-50/50 border-emerald-100 text-emerald-800',
                          apt.status === 'CHECKED_IN' && 'bg-blue-50/50 border-blue-100 text-blue-800',
                          apt.status === 'SCHEDULED' && 'bg-white border-slate-200 text-slate-700',
                          apt.status === 'CANCELLED' && 'bg-slate-50 border-slate-100 text-slate-400'
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold">{apt.patientName}</span>
                            <span
                              className={cn(
                                'text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider',
                                apt.type === 'EMERGENCY' && 'bg-red-100 text-red-700',
                                apt.type === 'FOLLOW_UP' && 'bg-amber-100 text-amber-700',
                                apt.type === 'CONSULTATION' && 'bg-slate-100 text-slate-600'
                              )}
                            >
                              {apt.type}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{apt.phone}</p>
                          {apt.notes && <p className="text-[10px] italic text-slate-400 mt-1">&quot;{apt.notes}&quot;</p>}
                        </div>

                        {/* Status update options */}
                        <div className="flex flex-col items-end gap-1.5">
                          <select
                            value={apt.status}
                            onChange={(e) => handleUpdateStatus(apt.id, e.target.value as Appointment['status'])}
                            className="text-[9px] font-bold uppercase tracking-wider rounded border border-transparent bg-white/80 p-1 shadow-sm shrink-0 cursor-pointer"
                          >
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="CHECKED_IN">Check In</option>
                            <option value="COMPLETED">Complete</option>
                            <option value="CANCELLED">Cancel</option>
                          </select>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <button
                      onClick={() => setSelectedSlot(time)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 transition-colors font-medium border border-dashed border-slate-200 bg-white hover:bg-blue-50/30 px-3 py-1.5 rounded-lg active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add appointment slot
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Form Sidebar Modal */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-xs"
            onClick={() => setSelectedSlot(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md h-full shadow-2xl p-6 sm:p-8 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-blue-500" />
                      Book Consultation Slot
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Time-slot: <span className="font-bold text-blue-600">{selectedSlot}</span> with {activeDoctor.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleBookSlot} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Patient Name
                    </label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Ramesh Verma"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 99887 76655"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Appointment Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as Appointment['type'])}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none bg-white focus:border-blue-400"
                    >
                      <option value="CONSULTATION">Consultation</option>
                      <option value="FOLLOW_UP">Follow Up</option>
                      <option value="EMERGENCY">Emergency / Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Clinical Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Check blood sugar readings, chronic complaints..."
                      rows={3}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-400 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] pt-1"
                  >
                    Confirm Appointment
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                Double booking slots triggers conflict warnings on multi-tenancy.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
