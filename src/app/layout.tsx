import type { Metadata } from 'next';
import { Inter, DM_Sans } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import './globals.css';

// ============================================================================
// Font Configuration
// ============================================================================

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  });

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700'],
});

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'MedFlow — Clinic Management System',
  description:
    'Premium clinic management platform for polyclinics and pharmacies. Manage appointments, prescriptions, inventory, billing, and analytics — all in one place.',
  keywords: [
    'clinic management',
    'healthcare SaaS',
    'prescription management',
    'pharmacy inventory',
    'medical billing',
    'patient records',
  ],
};

// ============================================================================
// Root Layout
// ============================================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-slate-800 font-sans">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
