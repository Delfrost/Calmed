'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileText, Download, Activity, Calendar, User, ChevronRight, Stethoscope, AlertCircle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Wrapper component since we use useSearchParams
export default function PatientDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  const router = useRouter();
  
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'labs' | 'appointments'>('prescriptions');

  useEffect(() => {
    if (!phone) {
      router.push('/patient');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/patient-portal?phone=${encodeURIComponent(phone)}`);
        if (res.ok) {
          const data = await res.json();
          setPatientData(data.patient);
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to load records');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [phone, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading your medical records...</p>
      </div>
    );
  }

  if (error || !patientData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full border border-slate-100">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-6">{error || 'Could not find patient records.'}</p>
          <button 
            onClick={() => router.push('/patient')}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { prescriptions, clinic } = patientData;

  // Derive lab orders from prescriptions for flat viewing
  const allLabOrders = prescriptions?.flatMap((rx: any) => rx.labOrders) || [];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* App Header */}
      <header className="bg-blue-600 text-white sticky top-0 z-40 shadow-md px-4 py-4 sm:px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold leading-tight">{clinic?.name || 'MedFlow Clinic'}</h1>
            <p className="text-[10px] text-blue-100 uppercase tracking-widest font-semibold">Patient Portal</p>
          </div>
        </div>
        <button 
          onClick={() => router.push('/patient')}
          className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Patient Info Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl shrink-0">
            {patientData.firstName?.[0]}{patientData.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{patientData.firstName} {patientData.lastName}</h2>
            <p className="text-sm text-slate-500">
              {patientData.gender} • {patientData.bloodGroup} • {patientData.phone}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-slate-200/50 rounded-xl">
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'prescriptions' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Prescriptions
          </button>
          <button
            onClick={() => setActiveTab('labs')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'labs' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Lab Reports
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Prescriptions Tab */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-4">
                {prescriptions?.length === 0 ? (
                  <EmptyState icon={<FileText />} message="No prescriptions found." />
                ) : (
                  prescriptions.map((rx: any) => (
                    <div key={rx.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                      <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-50">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            {new Date(rx.createdAt).toLocaleDateString('en-US', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </div>
                          <h3 className="font-bold text-slate-800 text-lg">{rx.diagnosis || 'General Consultation'}</h3>
                          <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                            <User className="h-3.5 w-3.5" />
                            Dr. {rx.doctor?.user?.firstName} {rx.doctor?.user?.lastName}
                          </p>
                        </div>
                        <button 
                          className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors shrink-0"
                          title="Download PDF"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medicines prescribed</p>
                        {rx.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center bg-slate-50 rounded-xl p-3">
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{item.medicine?.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {item.dosage} • {item.frequency} • {item.duration}
                              </p>
                            </div>
                            <div className="bg-white px-2.5 py-1 rounded border border-slate-200 text-xs font-medium text-slate-600">
                              Qty: {item.quantity}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Labs Tab */}
            {activeTab === 'labs' && (
              <div className="space-y-4">
                {allLabOrders?.length === 0 ? (
                  <EmptyState icon={<Activity />} message="No lab orders found." />
                ) : (
                  allLabOrders.map((lab: any) => (
                    <div key={lab.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-800">{lab.labTest?.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            lab.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {lab.status.replace('_', ' ')}
                          </span>
                          <span>•</span>
                          <span>{new Date(lab.orderedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button 
                        disabled={lab.status !== 'COMPLETED'}
                        className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="View Report"
                      >
                        {lab.status === 'COMPLETED' ? <Download className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode, message: string }) {
  return (
    <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
      <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 child-h-8 child-w-8">
        {icon}
      </div>
      <p className="text-slate-500 font-medium">{message}</p>
    </div>
  );
}
