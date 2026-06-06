'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ClipboardList,
  FileText,
  Users,
  Calendar,
  FlaskConical,
  Receipt,
  Package,
  Pill,
  AlertTriangle,
  LayoutDashboard,
  Stethoscope,
  TrendingUp,
  DollarSign,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

// ============================================================================
// Tab Configuration per Role
// ============================================================================

interface TabItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const tabsByRole: Record<UserRole, TabItem[]> = {
  [UserRole.DOCTOR]: [
    { label: 'Queue', href: '/doctor', icon: ClipboardList },
    { label: 'Prescribe', href: '/doctor/prescription/p1', icon: FileText },
    { label: 'Records', href: '/doctor/patients', icon: Users },
  ],
  [UserRole.RECEPTIONIST]: [
    { label: 'Queue', href: '/receptionist', icon: ClipboardList },
    { label: 'Appointments', href: '/receptionist/appointments', icon: Calendar },
    { label: 'Lab Reports', href: '/receptionist/lab-reports', icon: FlaskConical },
    { label: 'Billing', href: '/receptionist/billing', icon: Receipt },
  ],
  [UserRole.PHARMACIST]: [
    { label: 'Catalog', href: '/pharmacist', icon: Package },
    { label: 'Rx Queue', href: '/pharmacist/rx-queue', icon: Pill },
    { label: 'Expiry', href: '/pharmacist/expiry-alerts', icon: AlertTriangle },
  ],
  [UserRole.ADMIN]: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Doctors', href: '/admin/doctors', icon: Stethoscope },
    { label: 'Revenue', href: '/admin/revenue', icon: TrendingUp },
    { label: 'Payouts', href: '/admin/payouts', icon: DollarSign },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ],
};

// ============================================================================
// BottomTabBar Props
// ============================================================================

interface BottomTabBarProps {
  role: UserRole;
}

// ============================================================================
// BottomTabBar Component
// ============================================================================

export default function BottomTabBar({ role }: BottomTabBarProps) {
  const pathname = usePathname();
  const tabs = tabsByRole[role];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'lg:hidden',
        'glass border-t border-white/30',
        'safe-bottom'
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5',
                'flex-1 py-1.5',
                'transition-colors duration-200'
              )}
            >
              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="bottom-tab-active"
                  className="absolute inset-x-2 -top-0.5 h-[3px] bg-primary rounded-full"
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}

              <motion.div
                animate={{
                  scale: isActive ? 1 : 0.95,
                  y: isActive ? -1 : 0,
                }}
                transition={{ duration: 0.15 }}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-slate-400'
                  )}
                />
              </motion.div>

              <span
                className={cn(
                  'text-[10px] font-medium leading-tight transition-colors duration-200',
                  isActive ? 'text-primary font-semibold' : 'text-slate-400'
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
