'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useSession, signOut } from 'next-auth/react';
import {
  Search,
  Bell,
  ChevronRight,
  User,
  LogOut,
  Stethoscope,
  ClipboardList,
  Pill,
  Shield,
  Check,
  TrendingUp,
  Settings,
  AlertTriangle,
  Building,
  Activity,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Breadcrumb } from '@/types';

// ============================================================================
// Header Props & Mock Data
// ============================================================================

interface HeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
}

const MOCK_PATIENTS = [
  { id: 'p1', name: 'Rajesh Kumar', age: 45, gender: 'Male', phone: '+91 98765 43210', info: 'Type 2 Diabetes, Hypertension' },
  { id: 'p2', name: 'Priya Sharma', age: 32, gender: 'Female', phone: '+91 98111 22233', info: 'Allergies: None' },
  { id: 'p3', name: 'Amit Patel', age: 58, gender: 'Male', phone: '+91 98555 44433', info: 'Allergies: Penicillin' },
  { id: 'p4', name: 'Sunita Devi', age: 67, gender: 'Female', phone: '+91 99998 88877', info: 'Hypertension' },
];

const MOCK_DRUGS = [
  { id: 'd1', name: 'Paracetamol 650mg', category: 'Analgesics', stock: '120 units', status: 'in_stock' },
  { id: 'd2', name: 'Metformin 500mg', category: 'Antidiabetics', stock: '85 units', status: 'in_stock' },
  { id: 'd3', name: 'Cetirizine 10mg', category: 'Antihistamines', stock: '12 units', status: 'low_stock' },
  { id: 'd4', name: 'Amoxicillin 500mg', category: 'Antibiotics', stock: '0 units', status: 'out_of_stock' },
];

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  category: 'CHECK_IN' | 'STOCK' | 'LAB' | 'PAYOUT';
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Stock Alert: Cetirizine 10mg',
    description: 'Stock level has fallen below reorder threshold (12 units remaining).',
    time: '15 mins ago',
    read: false,
    category: 'STOCK'
  },
  {
    id: 'n2',
    title: 'Lab Report Uploaded',
    description: 'Amit Patel\'s CBC report has been uploaded by receptionist.',
    time: '1 hr ago',
    read: false,
    category: 'LAB'
  },
  {
    id: 'n3',
    title: 'Payout Approved',
    description: 'Revenue split payout of ₹42,500 has been paid by Rajesh Kumar.',
    time: '3 hrs ago',
    read: true,
    category: 'PAYOUT'
  }
];

// ============================================================================
// Header Component
// ============================================================================

export default function Header({ title, breadcrumbs = [] }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown States
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Dynamic notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Asynchronous Search States
  const [patientsResult, setPatientsResult] = useState<any[]>([]);
  const [drugsResult, setDrugsResult] = useState<any[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Resolve staff role details based on path
  let activeRole = 'DOCTOR';
  let activeStaffName = 'Dr. Anand Sharma';
  let activeStaffSub = 'Lead Cardiologist';

  if (pathname.startsWith('/receptionist')) {
    activeRole = 'RECEPTIONIST';
    activeStaffName = 'Sunita Devi';
    activeStaffSub = 'Front Desk Executive';
  } else if (pathname.startsWith('/pharmacist')) {
    activeRole = 'PHARMACIST';
    activeStaffName = 'Amit Patel (R.Ph.)';
    activeStaffSub = 'Head Pharmacist';
  } else if (pathname.startsWith('/admin')) {
    activeRole = 'ADMIN';
    activeStaffName = 'Rajesh Kumar';
    activeStaffSub = 'Clinic Director';
  }

  if (session?.user) {
    activeRole = session.user.role;
    activeStaffName = session.user.name || `${session.user.firstName} ${session.user.lastName}`;
    if (activeRole === 'DOCTOR') {
      activeStaffSub = 'Consulting Doctor';
    } else if (activeRole === 'RECEPTIONIST') {
      activeStaffSub = 'Front Desk Executive';
    } else if (activeRole === 'PHARMACIST') {
      activeStaffSub = 'Head Pharmacist';
    } else if (activeRole === 'ADMIN') {
      activeStaffSub = 'Clinic Director';
    }
  }

  // Load and sync notifications from localStorage
  useEffect(() => {
    const loadNotifications = () => {
      const stored = localStorage.getItem('medflow-notifications');
      if (stored) {
        try {
          setNotifications(JSON.parse(stored));
        } catch {
          setNotifications(DEFAULT_NOTIFICATIONS);
        }
      } else {
        localStorage.setItem('medflow-notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
    };

    loadNotifications();

    // Storage listener for synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'medflow-notifications') {
        loadNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Custom trigger event listener
    window.addEventListener('medflow-notif-update', loadNotifications);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('medflow-notif-update', loadNotifications);
    };
  }, []);

  // Listen to window scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside to close popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic for patients & medicines
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setPatientsResult([]);
      setDrugsResult([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setIsLoadingSearch(true);
        const [patientsRes, drugsRes] = await Promise.all([
          fetch(`/api/patients?search=${encodeURIComponent(searchQuery)}`),
          fetch(`/api/inventory/search?q=${encodeURIComponent(searchQuery)}`)
        ]);

        if (patientsRes.ok) {
          const data = await patientsRes.json();
          setPatientsResult((data.patients || []).slice(0, 5));
        }
        if (drugsRes.ok) {
          const data = await drugsRes.json();
          setDrugsResult((data.results || []).slice(0, 5));
        }
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Compute unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  const showSearchResults = searchFocused && searchQuery.length >= 2;

  // Mark all notifications read
  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('medflow-notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('medflow-notif-update'));
  };

  // Clear single notification
  const handleClearNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('medflow-notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('medflow-notif-update'));
  };

  // Sign out functionality
  const handleSignOut = async () => {
    // Clear session details if any
    localStorage.removeItem('medflow-user-role');
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between h-16 px-6',
        'transition-all duration-300 ease-in-out',
        'border-b',
        scrolled
          ? 'glass border-slate-200/60 shadow-soft'
          : 'bg-transparent border-transparent'
      )}
    >
      {/* ---- Left: Page Title + Breadcrumbs ---- */}
      <div className="flex flex-col justify-center min-w-0">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 mb-0.5" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.label} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-xs text-slate-400 hover:text-primary transition-colors font-medium"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Page title */}
        <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight truncate font-display">
          {title}
        </h1>
      </div>

      {/* ---- Right: Search + Notifications + Avatar ---- */}
      <div className="flex items-center gap-3">
        
        {/* Search Bar Wrapper */}
        <div ref={searchRef} className="hidden sm:block relative">
          <motion.div
            animate={{ width: searchFocused ? 280 : 220 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="relative"
          >
            <Search
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors',
                searchFocused ? 'text-primary' : 'text-slate-400'
              )}
            />
            <input
              type="text"
              placeholder="Search patients, meds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              className={cn(
                'w-full h-9 pl-9 pr-4 rounded-xl text-sm',
                'bg-slate-100/80 border border-transparent',
                'placeholder:text-slate-400 text-slate-700',
                'focus:bg-white focus:border-primary/30 focus:ring-0',
                'transition-all duration-200'
              )}
            />
          </motion.div>

          {/* Search Dropdown Popover */}
          <AnimatePresence>
            {showSearchResults && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-4 shadow-xl z-50 flex flex-col gap-4"
              >
                {isLoadingSearch ? (
                  <div className="py-6 text-center text-slate-400">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-primary mx-auto mb-2" />
                    <p className="text-[10px] uppercase font-bold tracking-wider">Searching database...</p>
                  </div>
                ) : (
                  <>
                    {/* Patients Results */}
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-2 flex items-center gap-1">
                        <ClipboardList className="w-3.5 h-3.5 text-blue-500" />
                        Patients
                      </h4>
                      {patientsResult.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {patientsResult.map((p) => {
                            const name = `${p.firstName} ${p.lastName}`;
                            const age = p.dateOfBirth
                              ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()
                              : 'N/A';
                            const info = [...(p.allergies || []), ...(p.chronicConditions || [])].join(', ') || 'No registered risk warnings';
                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setSearchFocused(false);
                                  setSearchQuery('');
                                  router.push(`/doctor/patients?id=${p.id}`);
                                }}
                                className="p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-700 group-hover:text-primary transition-colors">
                                    {name}
                                  </span>
                                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                                    {p.gender ? p.gender.charAt(0) : 'M'} · {age} yrs
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {p.phone} · {info}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic py-1">No matching patients found.</p>
                      )}
                    </div>

                    {/* Drugs Results */}
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-2 flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-teal-500" />
                        Drugs (Inventory)
                      </h4>
                      {drugsResult.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {drugsResult.map((d) => {
                            const totalStock = d.totalStock || 0;
                            const status = totalStock >= 20 ? 'in_stock' : totalStock > 0 ? 'low_stock' : 'out_of_stock';
                            const stockText = `${totalStock} units`;
                            return (
                              <div
                                key={d.id}
                                onClick={() => {
                                  setSearchFocused(false);
                                  setSearchQuery('');
                                  router.push(`/pharmacist?q=${d.name}`);
                                }}
                                className="p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-left"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-700">
                                    {d.name}
                                  </span>
                                  <span className={cn(
                                    'text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider',
                                    status === 'in_stock' && 'bg-emerald-50 text-emerald-600',
                                    status === 'low_stock' && 'bg-amber-50 text-amber-600',
                                    status === 'out_of_stock' && 'bg-red-50 text-red-600'
                                  )}>
                                    {stockText}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                  Category: {d.category}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic py-1">No matching medicines found.</p>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notification Bell Dropdown Wrapper */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={cn(
              'relative p-2 rounded-xl',
              'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
              'transition-all duration-200 cursor-pointer',
              notificationsOpen && 'bg-slate-100 text-slate-800'
            )}
            aria-label={`Notifications (${unreadCount} unread)`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className={cn(
                  'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]',
                  'flex items-center justify-center',
                  'bg-danger text-white text-[10px] font-bold',
                  'rounded-full px-1 shadow-sm'
                )}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-4 shadow-xl z-50 flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                  <span className="text-xs font-extrabold text-slate-800 font-display">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="flex flex-col divide-y divide-slate-50 max-h-72 overflow-y-auto no-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          'py-3 flex items-start gap-2.5 transition-colors text-left group pr-1',
                          !notif.read && 'bg-slate-50/50 rounded-xl px-2 -mx-2'
                        )}
                      >
                        {/* Icon Indicator */}
                        <div className={cn(
                          'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm mt-0.5',
                          notif.category === 'CHECK_IN' && 'bg-gradient-to-tr from-amber-500 to-orange-500',
                          notif.category === 'STOCK' && 'bg-gradient-to-tr from-red-500 to-rose-500',
                          notif.category === 'LAB' && 'bg-gradient-to-tr from-purple-500 to-pink-500',
                          notif.category === 'PAYOUT' && 'bg-gradient-to-tr from-indigo-500 to-blue-500'
                        )}>
                          {notif.category === 'CHECK_IN' && <ClipboardList className="h-3.5 w-3.5" />}
                          {notif.category === 'STOCK' && <AlertTriangle className="h-3.5 w-3.5" />}
                          {notif.category === 'LAB' && <Activity className="h-3.5 w-3.5" />}
                          {notif.category === 'PAYOUT' && <Check className="h-3.5 w-3.5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-xs font-bold text-slate-800 leading-tight',
                            !notif.read ? 'font-black' : 'font-semibold'
                          )}>
                            {notif.title}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                            {notif.description}
                          </p>
                          <span className="text-[9px] text-slate-400 font-medium block mt-1">{notif.time}</span>
                        </div>

                        <button
                          onClick={(e) => handleClearNotif(notif.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-300 hover:bg-slate-100 hover:text-red-500 transition-all cursor-pointer shrink-0 self-center"
                          title="Remove notification"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No notifications active right now.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar Dropdown Wrapper */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={cn(
              'flex items-center gap-2 p-1.5 rounded-xl',
              'hover:bg-slate-100 transition-all duration-200 cursor-pointer',
              profileOpen && 'bg-slate-100'
            )}
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-soft">
              <User className="w-4 h-4 text-white" />
            </div>
          </button>

          {/* Profile Dropdown Popover */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-4 shadow-xl z-50 flex flex-col gap-4"
              >
                {/* Staff credentials summary */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                    {activeStaffName.split(' ').pop()?.slice(0, 2).toUpperCase() || 'SF'}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                      {activeStaffName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold truncate leading-none mt-1">
                      {activeStaffSub}
                    </p>
                    <span className="inline-block bg-blue-50 text-primary text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase mt-2">
                      {activeRole}
                    </span>
                  </div>
                </div>

                {/* Sandbox quick portals switch */}
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2 text-left">
                    Sandbox Portals Hot-Swap
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Link
                      href="/doctor"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        'flex items-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold text-left transition-all',
                        activeRole === 'DOCTOR'
                          ? 'border-primary/20 bg-primary/5 text-primary'
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      )}
                    >
                      <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                      Doctor
                    </Link>

                    <Link
                      href="/receptionist"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        'flex items-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold text-left transition-all',
                        activeRole === 'RECEPTIONIST'
                          ? 'border-primary/20 bg-primary/5 text-primary'
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      )}
                    >
                      <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                      Receptionist
                    </Link>

                    <Link
                      href="/pharmacist"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        'flex items-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold text-left transition-all',
                        activeRole === 'PHARMACIST'
                          ? 'border-primary/20 bg-primary/5 text-primary'
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      )}
                    >
                      <Pill className="w-3.5 h-3.5 shrink-0" />
                      Pharmacy
                    </Link>

                    <Link
                      href="/admin"
                      onClick={() => setProfileOpen(false)}
                      className={cn(
                        'flex items-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold text-left transition-all',
                        activeRole === 'ADMIN'
                          ? 'border-primary/20 bg-primary/5 text-primary'
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      )}
                    >
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      Admin
                    </Link>
                  </div>
                </div>

                {/* Sign Out Action Button */}
                <button
                  onClick={handleSignOut}
                  className="w-full h-8.5 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-[0.98]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
