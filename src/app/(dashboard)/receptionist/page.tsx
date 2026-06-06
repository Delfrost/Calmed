'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardList,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Smartphone,
  Check,
  Building,
  Calendar,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueueItem {
  id: string;
  tokenNumber: number;
  patientName: string;
  phone: string;
  age: number;
  gender: string;
  assignedDoctor: string;
  timeSlot: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  checkedInTime: string;
}

const INITIAL_QUEUE: QueueItem[] = [
  {
    id: 'q-1',
    tokenNumber: 1,
    patientName: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    age: 45,
    gender: 'Male',
    assignedDoctor: 'Dr. Anand Sharma',
    timeSlot: '09:00 - 09:15',
    status: 'COMPLETED',
    checkedInTime: '08:50',
  },
  {
    id: 'q-2',
    tokenNumber: 2,
    patientName: 'Priya Sharma',
    phone: '+91 98111 22233',
    age: 32,
    gender: 'Female',
    assignedDoctor: 'Dr. Anand Sharma',
    timeSlot: '09:15 - 09:30',
    status: 'COMPLETED',
    checkedInTime: '09:02',
  },
  {
    id: 'q-3',
    tokenNumber: 3,
    patientName: 'Amit Patel',
    phone: '+91 98555 44433',
    age: 58,
    gender: 'Male',
    assignedDoctor: 'Dr. Anand Sharma',
    timeSlot: '09:30 - 09:45',
    status: 'IN_PROGRESS',
    checkedInTime: '09:25',
  },
  {
    id: 'q-4',
    tokenNumber: 4,
    patientName: 'Sunita Devi',
    phone: '+91 99998 88877',
    age: 67,
    gender: 'Female',
    assignedDoctor: 'Dr. Anand Sharma',
    timeSlot: '09:45 - 10:00',
    status: 'WAITING',
    checkedInTime: '09:35',
  },
];

const DOCTOR_OPTIONS = [
  { id: 'dr-1', name: 'Dr. Anand Sharma', specialty: 'Lead Cardiologist', fee: 500 },
  { id: 'dr-2', name: 'Dr. Neha Gupta', specialty: 'Consultant Dermatologist', fee: 600 },
  { id: 'dr-3', name: 'Dr. Vikram Seth', specialty: 'Pediatric Specialist', fee: 400 },
];

export default function ReceptionistQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [assignedDoctorId, setAssignedDoctorId] = useState('dr-1');
  const [timeSlot, setTimeSlot] = useState('10:00 - 10:15');

  // Modal printed slip states
  const [printedSlipItem, setPrintedSlipItem] = useState<QueueItem | null>(null);
  const [whatsappSent, setWhatsappSent] = useState(false);

  // Sync queue from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('medflow-queue');
    if (stored) {
      try {
        setQueue(JSON.parse(stored));
      } catch {
        localStorage.setItem('medflow-queue', JSON.stringify(INITIAL_QUEUE));
        setQueue(INITIAL_QUEUE);
      }
    } else {
      localStorage.setItem('medflow-queue', JSON.stringify(INITIAL_QUEUE));
      setQueue(INITIAL_QUEUE);
    }
  }, []);

  const activeDoctor = useMemo(() => {
    return DOCTOR_OPTIONS.find((d) => d.id === assignedDoctorId) || DOCTOR_OPTIONS[0];
  }, [assignedDoctorId]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone || !age) return;

    const nextTokenNumber = queue.length > 0 ? Math.max(...queue.map((q) => q.tokenNumber)) + 1 : 1;
    const now = new Date();
    const checkedInTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const newItem: QueueItem = {
      id: `q-${Date.now()}`,
      tokenNumber: nextTokenNumber,
      patientName: `${firstName} ${lastName}`,
      phone,
      age: parseInt(age),
      gender,
      assignedDoctor: activeDoctor.name,
      timeSlot,
      status: 'WAITING',
      checkedInTime,
    };

    const updatedQueue = [...queue, newItem];
    setQueue(updatedQueue);
    localStorage.setItem('medflow-queue', JSON.stringify(updatedQueue));
    window.dispatchEvent(new StorageEvent('storage', { key: 'medflow-queue', newValue: JSON.stringify(updatedQueue) }));

    // Send Toast Sync Notification
    const toastData = {
      id: `toast-${Date.now()}`,
      title: 'New Patient Checked In!',
      description: `${firstName} ${lastName} has checked in for ${activeDoctor.name}.`,
      tokenNumber: nextTokenNumber,
      type: 'CHECK_IN',
      timestamp: checkedInTime,
    };
    localStorage.setItem('medflow-toast', JSON.stringify(toastData));
    window.dispatchEvent(new StorageEvent('storage', { key: 'medflow-toast', newValue: JSON.stringify(toastData) }));

    // Append to notifications
    const storedNotifs = localStorage.getItem('medflow-notifications');
    let notifsList = [];
    if (storedNotifs) {
      try {
        notifsList = JSON.parse(storedNotifs);
      } catch {
        notifsList = [];
      }
    }
    const newNotif = {
      id: `n-${Date.now()}`,
      title: 'New Patient Registered',
      description: `Token #${nextTokenNumber} issued for ${firstName} ${lastName} under ${activeDoctor.name}.`,
      time: 'Just now',
      read: false,
      category: 'CHECK_IN' as const
    };
    const updatedNotifs = [newNotif, ...notifsList];
    localStorage.setItem('medflow-notifications', JSON.stringify(updatedNotifs));
    window.dispatchEvent(new Event('medflow-notif-update'));

    setPrintedSlipItem(newItem);
    setWhatsappSent(false);

    // Clear form
    setFirstName('');
    setLastName('');
    setPhone('');
    setAge('');
  };

  const handleUpdateStatus = (id: string, newStatus: QueueItem['status']) => {
    const updatedQueue = queue.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
    setQueue(updatedQueue);
    localStorage.setItem('medflow-queue', JSON.stringify(updatedQueue));
    window.dispatchEvent(new StorageEvent('storage', { key: 'medflow-queue', newValue: JSON.stringify(updatedQueue) }));
  };

  const handleRemove = (id: string) => {
    const updatedQueue = queue.filter((item) => item.id !== id);
    setQueue(updatedQueue);
    localStorage.setItem('medflow-queue', JSON.stringify(updatedQueue));
    window.dispatchEvent(new StorageEvent('storage', { key: 'medflow-queue', newValue: JSON.stringify(updatedQueue) }));
  };

  const handleResetData = () => {
    setQueue(INITIAL_QUEUE);
    localStorage.setItem('medflow-queue', JSON.stringify(INITIAL_QUEUE));
    window.dispatchEvent(new StorageEvent('storage', { key: 'medflow-queue', newValue: JSON.stringify(INITIAL_QUEUE) }));
  };

  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.includes(searchQuery) ||
        item.tokenNumber.toString() === searchQuery;
      const matchesFilter = filterStatus === 'ALL' || item.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [queue, searchQuery, filterStatus]);

  const waitingCount = queue.filter((q) => q.status === 'WAITING').length;
  const inProgressCount = queue.filter((q) => q.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Queue Total</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-1">{queue.length}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patients Waiting</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">{waitingCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Consultations</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{inProgressCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Check-in Queue List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header / Filter Toolbar */}
            <div className="p-5 border-b border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  Today&apos;s Patient Queue
                </h3>
                <button
                  onClick={handleResetData}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Reset Mock Data"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by token, name, or phone..."
                    className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400"
                  />
                </div>
                <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                  {['ALL', 'WAITING', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all',
                        filterStatus === st
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-100'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      )}
                    >
                      {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-50 overflow-y-auto max-h-[480px]">
              {filteredQueue.map((item) => (
                <div
                  key={item.id}
                  className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={cn(
                        'h-10 w-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 shadow-sm',
                        item.status === 'COMPLETED' && 'bg-emerald-50 text-emerald-700',
                        item.status === 'IN_PROGRESS' && 'bg-blue-50 text-blue-700',
                        item.status === 'WAITING' && 'bg-amber-50 text-amber-700',
                        item.status === 'SKIPPED' && 'bg-slate-50 text-slate-400'
                      )}
                    >
                      #{item.tokenNumber}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">
                        {item.patientName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.age}y / {item.gender} · {item.assignedDoctor} · {item.timeSlot}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status selection */}
                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleUpdateStatus(item.id, e.target.value as QueueItem['status'])
                      }
                      className={cn(
                        'rounded-lg px-2 py-1 text-[10px] font-bold tracking-wider uppercase outline-none border border-transparent shadow-sm cursor-pointer',
                        item.status === 'COMPLETED' && 'bg-emerald-50 text-emerald-700 border-emerald-100',
                        item.status === 'IN_PROGRESS' && 'bg-blue-50 text-blue-700 border-blue-100',
                        item.status === 'WAITING' && 'bg-amber-50 text-amber-700 border-amber-100',
                        item.status === 'SKIPPED' && 'bg-slate-50 text-slate-400 border-slate-100'
                      )}
                    >
                      <option value="WAITING">Waiting</option>
                      <option value="IN_PROGRESS">Active</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="SKIPPED">Skipped</option>
                    </select>

                    <button
                      onClick={() => setPrintedSlipItem(item)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Print Token Slip"
                    >
                      <Printer className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 duration-150"
                      title="Remove Token"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredQueue.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <ClipboardList className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm font-semibold">No active queue tokens</p>
                  <p className="text-xs">All caught up or try updating search/filters</p>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400">
            Click select status to advance wait stages or call next tokens.
          </div>
        </div>

        {/* Right Side: Check-in & Registration Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-soft flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
                <UserPlus className="h-5 w-5 text-blue-500" />
                Register Walk-in Check-in
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Collect demographic details and generate an instant consultation slot token.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Anand"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Verma"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    WhatsApp Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="35"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-blue-400"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Time Slot
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-blue-400"
                  >
                    <option value="10:00 - 10:15">10:00 - 10:15</option>
                    <option value="10:15 - 10:30">10:15 - 10:30</option>
                    <option value="10:30 - 10:45">10:30 - 10:45</option>
                    <option value="10:45 - 11:00">10:45 - 11:00</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Assigned Doctor
                </label>
                <select
                  value={assignedDoctorId}
                  onChange={(e) => setAssignedDoctorId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-blue-400"
                >
                  {DOCTOR_OPTIONS.map((dr) => (
                    <option key={dr.id} value={dr.id}>
                      {dr.name} ({dr.specialty})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Consultation Fee: ₹{activeDoctor.fee}</span>
                  <span className="text-teal-600 font-semibold uppercase tracking-wider">Multi-tenant default</span>
                </p>
              </div>

              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] mt-2"
              >
                Register & Issue Token
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 text-center text-[10px] text-slate-400">
            Registered patients are added directly to the active Doctor Queue.
          </div>
        </div>
      </div>

      {/* Printed Token Slip Modal */}
      <AnimatePresence>
        {printedSlipItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setPrintedSlipItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl relative border border-slate-100"
            >
              {/* Slip Body */}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/50 space-y-4">
                <div className="flex flex-col items-center gap-1.5 border-b border-dashed border-slate-200 pb-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Building className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800 tracking-tight font-display">
                    MedFlow Polyclinics
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-none">
                    Sector 62, Noida, India · Tel: 0120-4321
                  </p>
                </div>

                <div className="py-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Check-in Token
                  </span>
                  <span className="text-5xl font-black bg-gradient-to-tr from-blue-600 to-teal-500 bg-clip-text text-transparent block mt-1 font-display">
                    #{printedSlipItem.tokenNumber}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs border-y border-dashed border-slate-200 py-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Patient:</span>
                    <span className="font-semibold text-slate-700">{printedSlipItem.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Doctor:</span>
                    <span className="font-semibold text-slate-700">{printedSlipItem.assignedDoctor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scheduled:</span>
                    <span className="font-semibold text-slate-700">{printedSlipItem.timeSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Checked In:</span>
                    <span className="font-semibold text-slate-700">{printedSlipItem.checkedInTime}</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3 text-amber-500 animate-spin" />
                  Est. Wait Time: <span className="font-bold text-slate-600">~15 minutes</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.print()}
                  className="h-9 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Token
                </button>
                <button
                  onClick={() => setWhatsappSent(true)}
                  className={cn(
                    'h-9 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm',
                    whatsappSent
                      ? 'bg-emerald-600 shadow-emerald-50'
                      : 'bg-gradient-to-tr from-emerald-500 to-green-500 shadow-green-50'
                  )}
                >
                  {whatsappSent ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Sent Status
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-3.5 w-3.5" />
                      WhatsApp Rx
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setPrintedSlipItem(null)}
                  className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
