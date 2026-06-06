'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Stethoscope,
  Users,
  Pill,
  Settings,
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  TrendingUp,
  ShieldCheck,
  Building,
} from 'lucide-react';

const heroVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-800">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 right-0 h-[500px] bg-gradient-to-b from-blue-50/60 to-transparent -z-10 pointer-events-none rounded-full blur-[100px] opacity-70" />
      <div className="absolute top-1/3 left-10 w-[300px] h-[300px] bg-teal-50/50 -z-10 pointer-events-none rounded-full blur-[80px] opacity-60" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center shadow-md shadow-blue-100">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent font-display">
                MedFlow
              </span>
              <span className="text-[10px] font-semibold text-teal-600 block leading-3 tracking-widest uppercase">
                Vertical OS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/doctor"
              className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-[0.98]"
            >
              Enter Sandbox
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700 shadow-sm shadow-blue-50/50">
            <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
            Empowering Modern Clinical Workflows
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] font-display">
            A Unified{' '}
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 bg-clip-text text-transparent">
              Vertical OS
            </span>{' '}
            for Clinics & Attached Pharmacies
          </h1>

          <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Eliminate fragmented software. MedFlow coordinates patient queueing,
            smart digital prescribing, real-time pharmacy inventory syncing,
            and weekly split calculations in one cohesive ecosystem.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/doctor"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white text-base font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 transition-all active:scale-[0.98]"
            >
              Launch Doctor Sandbox
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#modules"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-base font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
            >
              Explore Modules
            </a>
          </div>
        </motion.div>
      </section>

      {/* Role-based Dashboards Section */}
      <section id="modules" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 font-display">
            Role-Based Modules
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            MedFlow orchestrates custom environments designed perfectly for the
            core roles of your clinic ecosystem.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Card 1: Doctor Dashboard */}
          <motion.div
            variants={cardVariants}
            className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-soft transition-all duration-300 hover:shadow-elevated hover:border-blue-200 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 uppercase tracking-wide border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Sandbox
              </div>

              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm shadow-blue-50">
                <Stethoscope className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-800 mt-5 mb-2 group-hover:text-blue-600 transition-colors">
                Doctor Pad
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Smart digital prescription writing interface with real-time,
                debounced pharmacy stock level checking and integrated lab ordering.
              </p>

              <ul className="mt-4 space-y-2">
                {[
                  'Live Patient Queue Tracker',
                  'Drug Expiry & Stock Badging',
                  'Zod-validated Medical Intake',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100">
              <Link
                href="/doctor"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100"
              >
                Enter Doctor Sandbox
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* Card 2: Receptionist Dashboard */}
          <motion.div
            variants={cardVariants}
            className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-soft transition-all duration-300 hover:shadow-elevated hover:border-teal-200 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="absolute top-4 right-4 inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Simulated Module
              </div>

              <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-sm shadow-teal-50">
                <Users className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-800 mt-5 mb-2 group-hover:text-teal-600 transition-colors">
                Reception Desk
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamless patient registration, scheduling, live queue token issuance,
                and unified billing invoices (consultation + pharmacy + labs).
              </p>

              <ul className="mt-4 space-y-2">
                {[
                  'Live Token Generator',
                  'Instant Consultation Billing',
                  'Walk-in Queue Syncing',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100">
              <button
                disabled
                className="w-full inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold cursor-not-allowed"
              >
                In Development
              </button>
            </div>
          </motion.div>

          {/* Card 3: Pharmacist Dashboard */}
          <motion.div
            variants={cardVariants}
            className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-soft transition-all duration-300 hover:shadow-elevated hover:border-purple-200 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="absolute top-4 right-4 inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Simulated Module
              </div>

              <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm shadow-purple-50">
                <Pill className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-800 mt-5 mb-2 group-hover:text-purple-600 transition-colors">
                Pharmacy Stock
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Batch-level medical stock management. Automatic dispensing queue,
                first-expiry, first-out (FIFO) tracking, and expiry alerts.
              </p>

              <ul className="mt-4 space-y-2">
                {[
                  'Batch-Level Inventory Control',
                  'Refill Reminder Alerts',
                  'First-Expiry-First-Out (FIFO)',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100">
              <button
                disabled
                className="w-full inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold cursor-not-allowed"
              >
                In Development
              </button>
            </div>
          </motion.div>

          {/* Card 4: Admin Panel */}
          <motion.div
            variants={cardVariants}
            className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-soft transition-all duration-300 hover:shadow-elevated hover:border-amber-200 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="absolute top-4 right-4 inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Simulated Module
              </div>

              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-sm shadow-amber-50">
                <Settings className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-800 mt-5 mb-2 group-hover:text-amber-600 transition-colors">
                Admin Analytics
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralized dashboard with role management, clinic billing analytics,
                audits, and automated revenue splits and payouts calculation.
              </p>

              <ul className="mt-4 space-y-2">
                {[
                  'Doctor Profit Splits & Payouts',
                  'Auditing & Security Log',
                  'Multi-tenant Clinic Profiles',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100">
              <button
                disabled
                className="w-full inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold cursor-not-allowed"
              >
                In Development
              </button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Product Architecture and Core Capabilities */}
      <section className="bg-white border-y border-slate-200/60 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 font-display">
              Built for Modern Independent Polyclinics
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              Real-time engineering meets specialized medical SaaS design to bring
              high-performance software into the clinic environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                <Activity className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Token Live Sync
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                WebSocket connection maintains patient check-in counts, live
                estimated wait times, and current consultation statuses instantly.
              </p>
            </div>

            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-sm">
                <Smartphone className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                WhatsApp Messaging
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deliver digital prescriptions (PDF), check-in tokens, follow-up
                booking links, and automated chronic medication reminders direct to patients.
              </p>
            </div>

            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Revenue Splits Engine
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Relational calculations compute consultations and doctor split
                percentages, generating weekly payout receipts automatically.
              </p>
            </div>

            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Medical-Grade Security
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full-audit trails, structured role-based access controls (RBAC) at the
                database level, and robust Zod validation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time sync / seed details panel */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Subtle light effect inside banner */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-xs font-bold text-blue-400 border border-blue-500/10 uppercase tracking-wide">
                <Building className="h-3.5 w-3.5" />
                Multi-Tenant Architecture
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white font-display">
                Engineered for Infinite Personalization
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                MedFlow serves as a powerful blueprint. Each clinic database is fully isolated
                via a multi-tenant cuid pattern, allowing custom modifications, local currencies,
                and personalized scheduling duration for doctor profiles.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
              <Link
                href="/doctor"
                className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
              >
                Launch Live Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/50 bg-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
              <Stethoscope className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold text-slate-700 font-display">
              MedFlow
            </span>
            <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100">
              v1.0.0-beta
            </span>
          </div>
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} MedFlow Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
