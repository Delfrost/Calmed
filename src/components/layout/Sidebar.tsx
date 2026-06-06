'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Calendar,
  FlaskConical,
  Receipt,
  Package,
  Pill,
  AlertTriangle,
  Settings,
  DollarSign,
  TrendingUp,
  Stethoscope,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

// ============================================================================
// Navigation Configuration
// ============================================================================

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Clinical',
    items: [
      {
        label: 'Patient Queue',
        href: '/doctor',
        icon: ClipboardList,
        roles: [UserRole.DOCTOR],
      },
      {
        label: 'Prescription Pad',
        href: '/doctor/prescription/p1',
        icon: FileText,
        roles: [UserRole.DOCTOR],
      },
      {
        label: 'Patient Records',
        href: '/doctor/patients',
        icon: Users,
        roles: [UserRole.DOCTOR],
      },
    ],
  },
  {
    title: 'Front Desk',
    items: [
      {
        label: 'Check-in Queue',
        href: '/receptionist',
        icon: ClipboardList,
        roles: [UserRole.RECEPTIONIST],
      },
      {
        label: 'Appointments',
        href: '/receptionist/appointments',
        icon: Calendar,
        roles: [UserRole.RECEPTIONIST],
      },
      {
        label: 'Lab Reports',
        href: '/receptionist/lab-reports',
        icon: FlaskConical,
        roles: [UserRole.RECEPTIONIST],
      },
      {
        label: 'Billing Desk',
        href: '/receptionist/billing',
        icon: Receipt,
        roles: [UserRole.RECEPTIONIST],
      },
    ],
  },
  {
    title: 'Pharmacy',
    items: [
      {
        label: 'Drug Catalog',
        href: '/pharmacist',
        icon: Package,
        roles: [UserRole.PHARMACIST],
      },
      {
        label: 'Dispensing Queue',
        href: '/pharmacist/rx-queue',
        icon: Pill,
        roles: [UserRole.PHARMACIST],
      },
      {
        label: 'Expiry Alerts',
        href: '/pharmacist/expiry-alerts',
        icon: AlertTriangle,
        roles: [UserRole.PHARMACIST],
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        roles: [UserRole.ADMIN],
      },
      {
        label: 'Doctors splits',
        href: '/admin/doctors',
        icon: Stethoscope,
        roles: [UserRole.ADMIN],
      },
      {
        label: 'Revenue split',
        href: '/admin/revenue',
        icon: TrendingUp,
        roles: [UserRole.ADMIN],
      },
      {
        label: 'Payouts ledger',
        href: '/admin/payouts',
        icon: DollarSign,
        roles: [UserRole.ADMIN],
      },
      {
        label: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        roles: [UserRole.ADMIN],
      },
    ],
  },
];

// ============================================================================
// Sidebar Props
// ============================================================================

interface SidebarProps {
  role: UserRole;
  userName?: string;
  clinicName?: string;
  avatarUrl?: string;
}

// ============================================================================
// Sidebar Component
// ============================================================================

export default function Sidebar({
  role,
  userName = 'Dr. Sharma',
  clinicName = 'MedFlow Clinic',
  avatarUrl,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Filter sections and items by role
  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

  const roleBadgeColors: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'bg-purple-100 text-purple-700',
    [UserRole.DOCTOR]: 'bg-primary-50 text-primary-dark',
    [UserRole.RECEPTIONIST]: 'bg-secondary/10 text-secondary-dark',
    [UserRole.PHARMACIST]: 'bg-accent/10 text-accent-dark',
  };

  const roleLabels: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Admin',
    [UserRole.DOCTOR]: 'Doctor',
    [UserRole.RECEPTIONIST]: 'Receptionist',
    [UserRole.PHARMACIST]: 'Pharmacist',
  };

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col fixed left-0 top-0 h-dvh z-40',
        'glass border-r border-white/30',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* ---- Clinic Logo / Name ---- */}
      <div
        className={cn(
          'flex items-center h-16 px-4 border-b border-slate-200/60',
          collapsed ? 'justify-center' : 'gap-3'
        )}
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-soft">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <h1 className="font-display text-base font-bold text-slate-900 whitespace-nowrap leading-tight">
                {clinicName}
              </h1>
              <p className="text-[11px] text-slate-400 whitespace-nowrap leading-none">
                Clinic Management
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 no-scrollbar">
        {filteredSections.map((section) => (
          <div key={section.title} className="mb-5">
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2"
                >
                  {section.title}
                </motion.p>
              )}
            </AnimatePresence>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5',
                        'transition-all duration-200 ease-in-out',
                        collapsed && 'justify-center px-0',
                        isActive
                          ? 'bg-primary-50 text-primary-dark'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-indicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full"
                          transition={{
                            type: 'spring',
                            stiffness: 350,
                            damping: 30,
                          }}
                        />
                      )}

                      <Icon
                        className={cn(
                          'w-[20px] h-[20px] flex-shrink-0 transition-colors duration-200',
                          isActive
                            ? 'text-primary'
                            : 'text-slate-400 group-hover:text-slate-600'
                        )}
                      />

                      <AnimatePresence mode="wait">
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                              'text-sm font-medium whitespace-nowrap overflow-hidden',
                              isActive ? 'text-primary-dark' : ''
                            )}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Tooltip on collapsed */}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-elevated">
                          {item.label}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45" />
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ---- Collapse Toggle ---- */}
      <div className="px-3 py-2 border-t border-slate-200/60">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-xl',
            'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
            'transition-all duration-200',
            collapsed && 'justify-center px-0'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* ---- User Profile ---- */}
      <div
        className={cn(
          'px-3 pb-4 pt-2 border-t border-slate-200/60',
          collapsed ? 'flex justify-center' : ''
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl p-2',
            'hover:bg-slate-100/80 transition-colors cursor-pointer',
            collapsed && 'justify-center p-1'
          )}
        >
          {/* Avatar */}
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold shadow-soft">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            )}
          </div>

          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden flex-1 min-w-0"
              >
                <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                  {userName}
                </p>
                <span
                  className={cn(
                    'inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5',
                    roleBadgeColors[role]
                  )}
                >
                  {roleLabels[role]}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger-bg transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
