'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BottomTabBar from '@/components/layout/BottomTabBar';
import { UserRole, Breadcrumb } from '@/types';

import ToastNotifier from '@/components/shared/ToastNotifier';

// ============================================================================
// Dashboard Layout
// Wraps all authenticated /doctor, /receptionist, /pharmacist, /admin pages
// Dynamically detects the user role based on path segments
// ============================================================================

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Resolve role dynamically based on active path
  let role = UserRole.DOCTOR;
  let dashboardTitle = 'Doctor Pad';
  let rolePrefix = '/doctor';

  if (pathname.startsWith('/receptionist')) {
    role = UserRole.RECEPTIONIST;
    dashboardTitle = 'Reception Desk';
    rolePrefix = '/receptionist';
  } else if (pathname.startsWith('/pharmacist')) {
    role = UserRole.PHARMACIST;
    dashboardTitle = 'Pharmacy Stock';
    rolePrefix = '/pharmacist';
  } else if (pathname.startsWith('/admin')) {
    role = UserRole.ADMIN;
    dashboardTitle = 'Admin Portal';
    rolePrefix = '/admin';
  }

  // Resolve breadcrumbs dynamically
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Home', href: '/' },
    { 
      label: role === UserRole.RECEPTIONIST ? 'Reception' : role.charAt(0) + role.slice(1).toLowerCase(), 
      href: rolePrefix 
    },
  ];

  if (pathSegments.length > 1) {
    const subpath = pathSegments[1];
    let label = subpath.charAt(0).toUpperCase() + subpath.slice(1).replace(/-/g, ' ');
    if (subpath === 'rx-queue') label = 'Dispensing Queue';
    if (subpath === 'lab-reports') label = 'Lab Reports';
    if (subpath === 'expiry-alerts') label = 'Expiry Alerts';
    breadcrumbs.push({ label, href: `${rolePrefix}/${subpath}` });
  }

  if (pathSegments.length > 2) {
    breadcrumbs.push({ label: 'Details' });
  }

  // Resolve dynamic user details for sidebar
  const userNames: Record<UserRole, string> = {
    [UserRole.DOCTOR]: 'Dr. Anand Sharma',
    [UserRole.RECEPTIONIST]: 'Sunita Devi (Front Desk)',
    [UserRole.PHARMACIST]: 'Amit Patel (R.Ph.)',
    [UserRole.ADMIN]: 'Rajesh Kumar (Clinic Director)',
  };

  return (
    <div className="min-h-dvh bg-bg">
      {/* Toast Notifier Global alerts overlay */}
      <ToastNotifier />

      {/* Sidebar — desktop only */}
      <Sidebar 
        role={role} 
        userName={userNames[role]}
        clinicName="MedFlow Clinic"
      />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="lg:pl-[260px] flex flex-col min-h-dvh transition-all duration-300">
        {/* Sticky header */}
        <Header
          title={dashboardTitle}
          breadcrumbs={breadcrumbs}
        />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Bottom tab bar — mobile only */}
      <BottomTabBar role={role} />
    </div>
  );
}
