'use client';

import { useState, useMemo, useEffect } from 'react';
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

const TIME_SLOTS = [
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:15', '12:30', '12:45',
];

function getLocalDateString(d: Date = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AppointmentsScheduler() {
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal states
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchedPatients, setSearchedPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<Appointment['type']>('CONSULTATION');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch doctors list on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch('/api/doctors');
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.doctors || []);
          if (data.doctors && data.doctors.length > 0) {
            setSelectedDoctorId(data.doctors[0].doctorProfile?.id || '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch appointments for selected date and doctor
  const fetchAppointments = async () => {
    if (!selectedDoctorId) return;
    try {
      setIsLoadingAppointments(true);
      const res = await fetch(`/api/appointments?date=${selectedDate}&doctorId=${selectedDoctorId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.appointments.map((apt: any) => ({
          id: apt.id,
          patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
          phone: apt.patient.phone,
          doctorId: apt.doctorId,
          doctorName: `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`,
          timeSlot: apt.timeSlot,
          type: apt.type,
          status: apt.status,
          notes: apt.notes,
        }));
        setAppointments(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, selectedDoctorId]);

  // Debounced patient search
  useEffect(() => {
    if (patientSearchQuery.trim().length < 2) {
      setSearchedPatients([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients?search=${patientSearchQuery}`);
        if (res.ok) {
          const data = await res.json();
          setSearchedPatients(data.patients || []);
        }
      } catch (err) {
        console.error('Failed to search patients:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [patientSearchQuery]);

  const activeDoctor = useMemo(() => {
    return doctors.find((d) => d.doctorProfile?.id === selectedDoctorId);
  }, [doctors, selectedDoctorId]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(getLocalDateString(d));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(getLocalDateString(d));
  };

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedDoctorId) return;

    try {
      setIsSubmitting(true);
      let patientId = selectedPatientId;

      // Create new patient if none selected
      if (!patientId) {
        if (!firstName || !lastName || !phone) {
          alert('Patient first name, last name, and phone are required.');
          setIsSubmitting(false);
          return;
        }

        // Check duplicate phone number first
        const searchRes = await fetch(`/api/patients?search=${phone}`);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const match = searchData.patients?.find((p: any) => p.phone === phone);
          if (match) {
            patientId = match.id;
          }
        }

        if (!patientId) {
          const patientRes = await fetch('/api/patients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName,
              lastName,
              phone,
            }),
          });

          const patientData = await patientRes.json();
          if (patientRes.status === 201) {
            patientId = patientData.patient.id;
          } else if (patientRes.status === 409) {
            patientId = patientData.existingPatient.id;
          } else {
            alert(patientData.error || 'Failed to register patient');
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Create appointment
      const apptRes = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          timeSlot: selectedSlot,
          patientId,
          doctorId: selectedDoctorId,
          type,
          notes: notes || undefined,
        }),
      });

      const apptData = await apptRes.json();
      if (!apptRes.ok) {
        alert(apptData.error || 'Failed to book appointment');
        setIsSubmitting(false);
        return;
      }

      // Reset modal state
      setSelectedSlot(null);
      setSelectedPatientId(null);
      setPatientSearchQuery('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setType('CONSULTATION');
      setNotes('');

      // Refresh appointments
      await fetchAppointments();
    } catch (err) {
      console.error('Error booking slot:', err);
      alert('An error occurred during booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: Appointment['status']) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedApt = data.appointment;

        if (status === 'CHECKED_IN' && updatedApt) {
          const tokenNum = updatedApt.queueToken?.tokenNumber || 1;
          const patientName = `${updatedApt.patient.firstName} ${updatedApt.patient.lastName}`;
          const docName = `Dr. ${updatedApt.doctor.user.firstName} ${updatedApt.doctor.user.lastName}`;

          const checkedInTime = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });

          // Trigger Toast for Real-time Doctor Alert
          const toastData = {
            id: `toast-${Date.now()}`,
            title: 'New Patient Checked In!',
            description: `${patientName} has checked in for ${docName}.`,
            tokenNumber: tokenNum,
            doctorId: updatedApt.doctorId,
            type: 'CHECK_IN',
            timestamp: checkedInTime,
          };
          localStorage.setItem('medflow-toast', JSON.stringify(toastData));
          window.dispatchEvent(new StorageEvent('storage', { key: 'medflow-toast', newValue: JSON.stringify(toastData) }));

          // Trigger persistent header notifications list
          const storedNotifs = localStorage.getItem('medflow-notifications');
          let notifsList = [];
          if (storedNotifs) {
            try { notifsList = JSON.parse(storedNotifs); } catch { notifsList = []; }
          }
          const newNotif = {
            id: `n-${Date.now()}`,
            title: 'New Patient Registered',
            description: `Token #${tokenNum} issued for ${patientName} under ${docName}.`,
            time: 'Just now',
            read: false,
            category: 'CHECK_IN' as const
          };
          localStorage.setItem('medflow-notifications', JSON.stringify([newNotif, ...notifsList]));
          window.dispatchEvent(new Event('medflow-notif-update'));
        }

        await fetchAppointments();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update status.');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Local search filtering
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments;
    const q = searchQuery.toLowerCase();
    return appointments.filter(
      (apt) =>
        apt.patientName.toLowerCase().includes(q) ||
        apt.phone.includes(q) ||
        (apt.notes && apt.notes.toLowerCase().includes(q))
    );
  }, [appointments, searchQuery]);

  // Group appointments by time slot
  const appointmentsBySlot = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const apt of filteredAppointments) {
      if (!map[apt.timeSlot]) {
        map[apt.timeSlot] = [];
      }
      map[apt.timeSlot].push(apt);
    }
    return map;
  }, [filteredAppointments]);

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
              disabled={doctors.length === 0}
            >
              {doctors.length === 0 ? (
                <option>Loading doctors...</option>
              ) : (
                doctors.map((dr) => (
                  <option key={dr.doctorProfile?.id} value={dr.doctorProfile?.id || ''}>
                    Dr. {dr.firstName} {dr.lastName} ({dr.doctorProfile?.specialization || 'General'})
                  </option>
                ))
              )}
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
            <button
              onClick={handlePrevDay}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="relative flex items-center">
              <span className="text-sm font-bold text-slate-800 cursor-pointer hover:text-blue-600 flex items-center gap-1">
                {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              />
            </div>
            <button
              onClick={handleNextDay}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
            >
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
          {isLoadingAppointments ? (
            <div className="py-20 text-center text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-primary mx-auto mb-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Loading Appointments...</p>
            </div>
          ) : (
            TIME_SLOTS.map((time) => {
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
            })
          )}
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
            onClick={() => {
              if (!isSubmitting) setSelectedSlot(null);
            }}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md h-full shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-blue-500" />
                      Book Consultation Slot
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Time-slot: <span className="font-bold text-blue-600">{selectedSlot}</span> with {activeDoctor ? `Dr. ${activeDoctor.firstName} ${activeDoctor.lastName}` : 'doctor'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSlot(null)}
                    disabled={isSubmitting}
                    className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleBookSlot} className="space-y-4">
                  {/* Patient lookup / search */}
                  {!selectedPatientId && (
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        Search Existing Patient (Optional)
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={patientSearchQuery}
                          onChange={(e) => setPatientSearchQuery(e.target.value)}
                          placeholder="Type name or phone to search..."
                          className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400"
                        />
                      </div>
                      {searchedPatients.length > 0 && (
                        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto text-xs divide-y divide-slate-100">
                          {searchedPatients.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedPatientId(p.id);
                                setFirstName(p.firstName);
                                setLastName(p.lastName);
                                setPhone(p.phone);
                                setPatientSearchQuery('');
                                setSearchedPatients([]);
                              }}
                              className="p-2.5 hover:bg-blue-50/50 cursor-pointer flex justify-between items-center"
                            >
                              <div>
                                <p className="font-bold text-slate-700">{p.firstName} {p.lastName}</p>
                                <p className="text-[10px] text-slate-400">{p.phone}</p>
                              </div>
                              <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Select</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Patient registration fields */}
                  {selectedPatientId ? (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-blue-800">Linked to Existing Patient</p>
                        <p className="text-[10px] text-blue-600 mt-0.5">{firstName} {lastName} ({phone})</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatientId(null);
                          setFirstName('');
                          setLastName('');
                          setPhone('');
                        }}
                        className="text-[10px] font-bold text-blue-700 hover:text-blue-800 underline"
                      >
                        Clear Selection
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                            First Name
                          </label>
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="e.g. Rajesh"
                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                            Last Name
                          </label>
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="e.g. Kumar"
                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400"
                          />
                        </div>
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
                    </>
                  )}

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
                    disabled={isSubmitting}
                    className={cn(
                      "w-full h-10 rounded-xl text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] pt-1",
                      isSubmitting
                        ? "bg-slate-400 cursor-not-allowed shadow-none"
                        : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Confirming...
                      </>
                    ) : (
                      'Confirm Appointment'
                    )}
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400 mt-6">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                Booking an appointment will automatically issue a Queue Token.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
