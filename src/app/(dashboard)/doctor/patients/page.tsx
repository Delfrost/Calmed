'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  User,
  Phone,
  AlertCircle,
  FileText,
  Calendar,
  X,
  Plus,
  ChevronRight,
  TrendingUp,
  Activity,
  Heart,
  Thermometer,
  Weight,
  Clock,
  ArrowLeft,
  FileDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types & Mock Patient Data
// ============================================================================

interface TimelineVisit {
  date: string;
  diagnosis: string;
  doctor: string;
  vitals: {
    bp: string;
    temp: string;
    hr: string;
    weight: string;
  };
  medicines: {
    name: string;
    dose: string;
    duration: string;
  }[];
  labOrders: {
    testName: string;
    category: string;
  }[];
  notes: string;
}

interface PatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  allergies: string[];
  chronicConditions: string[];
  visitCount: number;
  timeline: TimelineVisit[];
}

const MOCK_PATIENTS_RECORDS: PatientRecord[] = [
  {
    id: 'p1',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    age: 45,
    gender: 'Male',
    bloodGroup: 'B+',
    phone: '+91 98765 43210',
    allergies: ['Penicillin', 'Sulfa drugs'],
    chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
    visitCount: 12,
    timeline: [
      {
        date: 'May 20, 2026',
        diagnosis: 'Seasonal Allergic Rhinitis',
        doctor: 'Dr. Anand Sharma',
        vitals: { bp: '118/78', temp: '98.4°F', hr: '72 bpm', weight: '74 kg' },
        medicines: [
          { name: 'Cetirizine 10mg', dose: '1 tablet once daily', duration: '5 days' }
        ],
        labOrders: [],
        notes: 'Patient presented with sneezing, nasal congestion and itchy eyes. Avoid allergen exposure.'
      },
      {
        date: 'April 15, 2026',
        diagnosis: 'Type 2 Diabetes Routine Checkup',
        doctor: 'Dr. Anand Sharma',
        vitals: { bp: '124/82', temp: '98.6°F', hr: '76 bpm', weight: '75 kg' },
        medicines: [
          { name: 'Metformin 500mg', dose: '1 tablet twice daily with meals', duration: '3 months' }
        ],
        labOrders: [{ testName: 'HbA1c', category: 'Blood Tests' }, { testName: 'Lipid Profile', category: 'Blood Tests' }],
        notes: 'Blood sugar levels moderately controlled. Suggested daily brisk walking.'
      }
    ]
  },
  {
    id: 'p2',
    firstName: 'Priya',
    lastName: 'Sharma',
    age: 32,
    gender: 'Female',
    bloodGroup: 'A-',
    phone: '+91 98111 22233',
    allergies: [],
    chronicConditions: [],
    visitCount: 3,
    timeline: [
      {
        date: 'May 10, 2026',
        diagnosis: 'Mild Gastritis',
        doctor: 'Dr. Anand Sharma',
        vitals: { bp: '110/70', temp: '98.1°F', hr: '68 bpm', weight: '58 kg' },
        medicines: [
          { name: 'Pantoprazole 40mg', dose: '1 tablet once daily before food', duration: '14 days' }
        ],
        labOrders: [],
        notes: 'Advised to avoid spicy food and caffeine. Eat smaller meals.'
      }
    ]
  },
  {
    id: 'p3',
    firstName: 'Amit',
    lastName: 'Verma',
    age: 58,
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '+91 98555 44433',
    allergies: ['Penicillin'],
    chronicConditions: ['Hypertension'],
    visitCount: 8,
    timeline: [
      {
        date: 'May 12, 2026',
        diagnosis: 'Hypertension Follow-up',
        doctor: 'Dr. Anand Sharma',
        vitals: { bp: '138/88', temp: '98.2°F', hr: '80 bpm', weight: '82 kg' },
        medicines: [
          { name: 'Amlodipine 5mg', dose: '1 tablet once daily', duration: '1 month' }
        ],
        labOrders: [{ testName: 'Kidney Function Test', category: 'Blood Tests' }],
        notes: 'BP is slightly elevated but stable compared to last month. Maintain low sodium diet.'
      }
    ]
  },
  {
    id: 'p4',
    firstName: 'Sunita',
    lastName: 'Devi',
    age: 67,
    gender: 'Female',
    bloodGroup: 'AB+',
    phone: '+91 99998 88877',
    allergies: ['Dust mites'],
    chronicConditions: ['Hypertension', 'Osteoarthritis'],
    visitCount: 15,
    timeline: [
      {
        date: 'May 25, 2026',
        diagnosis: 'Osteoarthritis Knee Flare-up',
        doctor: 'Dr. Anand Sharma',
        vitals: { bp: '130/84', temp: '98.5°F', hr: '74 bpm', weight: '65 kg' },
        medicines: [
          { name: 'Paracetamol 650mg', dose: '1 tablet thrice daily as needed', duration: '7 days' }
        ],
        labOrders: [{ testName: 'X-Ray Knee (Bilateral)', category: 'Imaging' }],
        notes: 'Severe joint stiffness in the morning. Advised light stretching exercises.'
      }
    ]
  }
];

// ============================================================================
// Main Inner Patient Registry
// ============================================================================

function PatientRegistryInner() {
  const searchParams = useSearchParams();
  const searchParamQuery = searchParams.get('search') || '';
  const searchParamId = searchParams.get('id') || '';

  const [searchQuery, setSearchQuery] = useState(searchParamQuery);
  const [selectedChronic, setSelectedChronic] = useState<string>('ALL');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [patientDetails, setPatientDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [patients, setPatients] = useState<any[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);

  // Fetch patients list dynamically
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoadingPatients(true);
        const res = await fetch(`/api/patients?search=${searchQuery}`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.patients.map((p: any) => {
            const birthDate = p.dateOfBirth ? new Date(p.dateOfBirth) : null;
            const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : 45;
            return {
              id: p.id,
              firstName: p.firstName,
              lastName: p.lastName,
              age,
              gender: p.gender || 'Male',
              bloodGroup: p.bloodGroup || 'Not set',
              phone: p.phone,
              allergies: p.allergies || [],
              chronicConditions: p.chronicConditions || [],
              visitCount: p._count?.appointments || 0,
            };
          });
          setPatients(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch patients list:', err);
      } finally {
        setIsLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [searchQuery]);

  const handleSelectPatient = async (p: any) => {
    setSelectedPatient(p);
    setLoadingDetails(true);
    setPatientDetails(null);
    try {
      const res = await fetch(`/api/patients/${p.id}`);
      if (res.ok) {
        const data = await res.json();
        const patientDb = data.patient;
        
        const timeline = (patientDb.prescriptions || []).map((rx: any) => {
          const rxVitals = (rx.vitals || {}) as any;
          return {
            date: new Date(rx.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            diagnosis: rx.diagnosis || 'General Checkup',
            doctor: `Dr. ${rx.doctor.user.firstName} ${rx.doctor.user.lastName}`,
            vitals: {
              bp: rxVitals.bloodPressure || 'N/A',
              temp: rxVitals.temperature || 'N/A',
              hr: rxVitals.heartRate || 'N/A',
              weight: rxVitals.weight || 'N/A',
            },
            medicines: (rx.items || []).map((item: any) => ({
              name: item.medicine.name,
              dose: `${item.dosage} · ${item.frequency}`,
              duration: item.duration,
            })),
            labOrders: (rx.labOrders || []).map((lo: any) => ({
              testName: lo.labTest.name,
              category: lo.labTest.category,
            })),
            notes: rx.notes || 'No extra notes.',
          };
        });

        const birthDate = patientDb.dateOfBirth ? new Date(patientDb.dateOfBirth) : null;
        const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : 45;

        setPatientDetails({
          id: patientDb.id,
          firstName: patientDb.firstName,
          lastName: patientDb.lastName,
          age,
          gender: patientDb.gender || 'Male',
          bloodGroup: patientDb.bloodGroup || 'Not set',
          phone: patientDb.phone,
          allergies: patientDb.allergies || [],
          chronicConditions: patientDb.chronicConditions || [],
          visitCount: patientDb.appointments?.length || 0,
          timeline,
        });
      }
    } catch (err) {
      console.error('Failed to load patient details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Load patient from URL query params (for header search navigation)
  useEffect(() => {
    if (searchParamId) {
      const match = patients.find(p => p.id === searchParamId);
      if (match) handleSelectPatient(match);
    } else if (searchParamQuery) {
      setSearchQuery(searchParamQuery);
    }
  }, [searchParamId, searchParamQuery, patients]);

  // Compute unique chronic conditions for filters
  const allChronicConditions = useMemo(() => {
    const set = new Set<string>();
    patients.forEach((p: any) => p.chronicConditions.forEach((c: string) => set.add(c)));
    return Array.from(set);
  }, [patients]);

  // Filter patient list
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesChronic = selectedChronic === 'ALL' || p.chronicConditions.includes(selectedChronic);
      return matchesChronic;
    });
  }, [patients, selectedChronic]);

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search registry by patient name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-xs outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary-light/20"
          />
        </div>

        {/* Chronic Conditions Filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => setSelectedChronic('ALL')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider',
              selectedChronic === 'ALL'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            )}
          >
            All Patients
          </button>
          {allChronicConditions.map((cond) => (
            <button
              key={cond}
              onClick={() => setSelectedChronic(cond)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider',
                selectedChronic === cond
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              )}
            >
              {cond}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Cards Registry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredPatients.map((p) => {
          return (
            <motion.div
              key={p.id}
              layoutId={`card-${p.id}`}
              onClick={() => handleSelectPatient(p)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-primary/20 shadow-soft hover:shadow-md cursor-pointer transition-all duration-200 overflow-hidden flex flex-col justify-between group"
            >
              {/* Header block */}
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white font-extrabold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform duration-200">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">
                      {p.firstName} {p.lastName}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      {p.gender} · {p.age} yrs · Blood: {p.bloodGroup}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.phone}</span>
                </div>

                {/* Badges conditions & allergies */}
                <div className="mt-4 flex flex-wrap gap-1">
                  {p.allergies.map((all: string) => (
                    <span key={all} className="text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-600 px-2 py-0.5 rounded-md">
                      {all}
                    </span>
                  ))}
                  {p.chronicConditions.map((chr: string) => (
                    <span key={chr} className="text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md">
                      {chr}
                    </span>
                  ))}
                  {p.allergies.length === 0 && p.chronicConditions.length === 0 && (
                    <span className="text-[9px] font-semibold text-slate-400 italic">No registered risk warnings</span>
                  )}
                </div>
              </div>

              {/* Bottom total visits banner */}
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:bg-primary-50/50 transition-colors duration-200">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Total: <strong className="text-slate-700">{p.visitCount} visits</strong>
                </span>
                <span className="text-[10px] font-extrabold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Timeline
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          );
        })}

        {filteredPatients.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200 shadow-soft">
            <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No Patient Records found</h4>
            <p className="text-xs text-slate-400 mt-1">Try refining your search keyword or active filters</p>
          </div>
        )}
      </div>

      {/* Slide-out Intake Timeline Drawer Overlay */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black"
              onClick={() => setSelectedPatient(null)}
            />

            {/* Drawer Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white font-extrabold flex items-center justify-center text-base shadow-sm">
                    {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 font-display">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Patient ID: {selectedPatient.id.toUpperCase()} · {selectedPatient.gender} · {selectedPatient.age} yrs · Blood {selectedPatient.bloodGroup}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPatient(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body (Timeline visits scroll) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    Intake Visit Timeline
                  </h4>
                  {patientDetails && (
                    <span className="text-[10px] font-bold bg-primary-50 text-primary-dark px-2.5 py-0.5 rounded-full">
                      {patientDetails.timeline.length} Registered entries
                    </span>
                  )}
                </div>

                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-primary mb-4" />
                    <p className="text-xs">Loading clinical history...</p>
                  </div>
                ) : patientDetails ? (
                  <div className="relative border-l border-slate-200/80 ml-3 pl-6 space-y-6">
                    {patientDetails.timeline.map((visit: any, index: number) => {
                      return (
                        <div key={index} className="relative group">
                          {/* Timeline dot */}
                          <span className="absolute -left-[30px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary shadow-sm flex items-center justify-center shrink-0 z-10" />

                          {/* Visit Card details */}
                          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-soft transition-all duration-200">
                            {/* Visit header */}
                            <div className="flex items-center justify-between border-b border-slate-50 pb-2.5 mb-3">
                              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {visit.date}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">
                                {visit.doctor}
                              </span>
                            </div>

                            {/* Diagnosis */}
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Clinical Diagnosis</span>
                              <h5 className="font-bold text-slate-800 text-sm mt-0.5">{visit.diagnosis}</h5>
                            </div>

                            {/* Vitals Grid */}
                            <div className="grid grid-cols-4 gap-2 mt-4 bg-slate-50 rounded-xl p-2.5">
                              <div className="text-center border-r border-slate-200/50">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-0.5">
                                  <Heart className="w-2.5 h-2.5 text-red-500 shrink-0" />
                                  BP
                                </span>
                                <p className="text-xs font-bold text-slate-700 mt-1">{visit.vitals.bp}</p>
                              </div>
                              <div className="text-center border-r border-slate-200/50">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-0.5">
                                  <Thermometer className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                  Temp
                                </span>
                                <p className="text-xs font-bold text-slate-700 mt-1">{visit.vitals.temp}</p>
                              </div>
                              <div className="text-center border-r border-slate-200/50">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-0.5">
                                  <Activity className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                                  HR
                                </span>
                                <p className="text-xs font-bold text-slate-700 mt-1">{visit.vitals.hr}</p>
                              </div>
                              <div className="text-center">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-0.5">
                                  <Weight className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                  Weight
                                </span>
                                <p className="text-xs font-bold text-slate-700 mt-1">{visit.vitals.weight}</p>
                              </div>
                            </div>

                            {/* Prescribed Drugs */}
                            {visit.medicines.length > 0 && (
                              <div className="mt-4">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Prescribed Rx</span>
                                <div className="flex flex-col gap-1.5">
                                  {visit.medicines.map((med: any, mi: number) => (
                                    <div key={mi} className="flex items-center justify-between bg-slate-50 border border-slate-100/50 rounded-lg px-3 py-1.5 text-xs">
                                      <span className="font-bold text-slate-700">{med.name}</span>
                                      <span className="text-[10px] text-slate-500">{med.dose} · {med.duration}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Lab Orders */}
                            {visit.labOrders.length > 0 && (
                              <div className="mt-4">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Requested Lab Orders</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {visit.labOrders.map((lab: any, li: number) => (
                                    <span key={li} className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 px-2.5 py-1 rounded-lg">
                                      {lab.testName}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Advice Notes */}
                            <div className="mt-4 pt-3 border-t border-slate-50">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Clinical Advice Notes</span>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{visit.notes}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {patientDetails.timeline.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-4">No prescription visits found for this patient.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Failed to load medical history.</p>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 gap-4">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="flex-1 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Close Drawer
                </button>
                <button
                  onClick={() => alert('Downloading Patient Health Timeline PDF Summary...')}
                  className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-50"
                >
                  <FileDown className="w-4 h-4" />
                  Export History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Suspense Wrapped Registry
// ============================================================================

export default function PatientRecordsPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-primary mx-auto mb-4" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading Patient Registry...</p>
      </div>
    }>
      <PatientRegistryInner />
    </Suspense>
  );
}
