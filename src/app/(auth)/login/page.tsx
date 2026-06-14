'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { motion } from 'motion/react';
import {
  Stethoscope,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Users,
  Pill,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSandboxLogin = async (role: string, targetPath: string) => {
    setLoadingRole(role);
    setError(null);
    let demoEmail = '';
    let demoPassword = '';
    
    if (role === 'Doctor') {
      demoEmail = 'doctor@medflow.in';
      demoPassword = 'doctor123';
    } else if (role === 'Receptionist') {
      demoEmail = 'receptionist@medflow.in';
      demoPassword = 'reception123';
    } else if (role === 'Pharmacist') {
      demoEmail = 'pharmacist@medflow.in';
      demoPassword = 'pharma123';
    } else if (role === 'Administrator') {
      demoEmail = 'admin@medflow.in';
      demoPassword = 'admin123';
    }

    try {
      const res = await signIn('credentials', {
        email: demoEmail,
        password: demoPassword,
        redirect: false,
      });

      if (res?.error) {
        setError('Failed to sign in. Please verify the database is running.');
        setLoadingRole(null);
      } else {
        router.push(targetPath);
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred during sandbox sign-in.');
      setLoadingRole(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRole('custom');
    setError(null);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid email or password.');
        setLoadingRole(null);
      } else {
        const session = await getSession();
        const role = session?.user?.role?.toLowerCase() || 'doctor';
        router.push(`/${role}`);
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred during sign-in.');
      setLoadingRole(null);
    }
  };

  const sandboxUsers = [
    {
      roleName: 'Doctor',
      userName: 'Dr. Anand Sharma',
      specialty: 'Lead Cardiologist',
      icon: Stethoscope,
      bg: 'from-blue-500 to-indigo-500',
      text: 'text-blue-600',
      border: 'hover:border-blue-200',
      path: '/doctor',
    },
    {
      roleName: 'Receptionist',
      userName: 'Sunita Devi',
      specialty: 'Front Desk Lead',
      icon: Users,
      bg: 'from-teal-500 to-emerald-500',
      text: 'text-teal-600',
      border: 'hover:border-teal-200',
      path: '/receptionist',
    },
    {
      roleName: 'Pharmacist',
      userName: 'Amit Patel',
      specialty: 'Head Pharmacist',
      icon: Pill,
      bg: 'from-purple-500 to-pink-500',
      text: 'text-purple-600',
      border: 'hover:border-purple-200',
      path: '/pharmacist',
    },
    {
      roleName: 'Administrator',
      userName: 'Rajesh Kumar',
      specialty: 'Clinic Director',
      icon: Settings,
      bg: 'from-amber-500 to-orange-500',
      text: 'text-amber-600',
      border: 'hover:border-amber-200',
      path: '/admin',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-800">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-100/40 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Brand Logo Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 shadow-md shadow-blue-200 mb-4">
          <Stethoscope className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
          Welcome to MedFlow
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          The unified Vertical OS for polyclinics and attached pharmacies
        </p>
      </div>

      {/* Main Grid Frame */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-2">
        {/* Left Side: Standard Login Form (5 cols) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-soft flex flex-col justify-between"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-display">
                Staff Sign In
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your credentials registered by the clinic admin.
              </p>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@clinic.com"
                    className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-sm outline-none transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-sm outline-none transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-1.5 text-slate-500 font-medium cursor-pointer">
                  <input type="checkbox" className="rounded text-blue-500 focus:ring-blue-400" />
                  Remember me
                </label>
                <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loadingRole !== null}
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
              >
                {loadingRole === 'custom' ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            Medical data encrypted via SSL/TLS
          </div>
        </motion.div>

        {/* Right Side: Sandbox Login Helpers (7 cols) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-7 bg-white/80 border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-soft flex flex-col justify-between glass"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 font-display flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                  Sandbox Entrance
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Hot-swap credentials and bypass typing to explore the sandbox modules instantly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sandboxUsers.map((user) => {
                const Icon = user.icon;
                const isThisLoading = loadingRole === user.roleName;

                return (
                  <button
                    key={user.roleName}
                    onClick={() => handleSandboxLogin(user.roleName, user.path)}
                    disabled={loadingRole !== null}
                    className={cn(
                      'group rounded-xl border border-slate-200/60 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft',
                      user.border,
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={cn('h-10 w-10 rounded-lg bg-gradient-to-tr flex items-center justify-center text-white shrink-0', user.bg)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                        {user.roleName}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-bold text-slate-800 leading-tight">
                        {user.userName}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {user.specialty}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isThisLoading ? (
                        <span className="h-3 w-3 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                      ) : (
                        <>
                          Launch Portal
                          <ArrowRight className="h-3 w-3" />
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            For production deployments, sandbox logging can be disabled in the admin dashboard config.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
