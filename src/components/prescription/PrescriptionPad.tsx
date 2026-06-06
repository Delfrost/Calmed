'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Pill,
  Eye,
  EyeOff,
  Save,
  SendHorizonal,
  Loader2,
  Stethoscope,
  FileText,
  X,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PatientHeader from '@/components/prescription/PatientHeader';
import MedicineSearch from '@/components/prescription/MedicineSearch';
import MedicineRow from '@/components/prescription/MedicineRow';
import LabOrderSection from '@/components/prescription/LabOrderSection';
import PrescriptionPreview from '@/components/prescription/PrescriptionPreview';
import type {
  PatientInfo,
  VitalsData,
  PrescriptionItemData,
  LabOrderData,
  MedicineSearchResult,
  LabTestOption,
  StockStatus,
} from '@/types';

interface PrescriptionPadProps {
  patientId: string;
}

const MOCK_PATIENT: PatientInfo = {
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
};

const INITIAL_VITALS: VitalsData = {
  bloodPressure: '',
  temperature: '',
  weight: '',
  heartRate: '',
  oxygenSaturation: '',
};

function getStockStatus(totalStock: number): StockStatus {
  if (totalStock === 0) return 'out_of_stock';
  if (totalStock < 20) return 'low_stock';
  return 'in_stock';
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function PatientSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-slate-200" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-3 w-28 rounded bg-slate-100" />
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-5 w-20 rounded-full bg-slate-200" />
            <div className="h-5 w-16 rounded-full bg-slate-200" />
          </div>
          <div className="h-4 w-48 rounded bg-slate-100" />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PrescriptionPad({ patientId }: PrescriptionPadProps) {
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  const [vitals, setVitals] = useState<VitalsData>(INITIAL_VITALS);
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<PrescriptionItemData[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrderData[]>([]);
  const [notes, setNotes] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulate loading patient data
  useEffect(() => {
    const timer = setTimeout(() => {
      // In production, fetch from /api/patients/:patientId
      setPatient(MOCK_PATIENT);
      setIsLoadingPatient(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [patientId]);

  // Add medicine from search
  const handleMedicineSelect = useCallback(
    (medicine: MedicineSearchResult) => {
      const newItem: PrescriptionItemData = {
        id: generateId(),
        medicineId: medicine.id,
        medicineName: medicine.name,
        genericName: medicine.genericName || '',
        dosage: medicine.strength || '',
        frequency: '',
        duration: '',
        quantity: 1,
        instructions: '',
        stockStatus: getStockStatus(medicine.totalStock),
        availableStock: medicine.totalStock,
      };
      setMedicines((prev) => [...prev, newItem]);
    },
    []
  );

  // Update medicine field
  const handleMedicineUpdate = useCallback(
    (
      index: number,
      field: keyof PrescriptionItemData,
      value: string | number
    ) => {
      setMedicines((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
      );
    },
    []
  );

  // Remove medicine
  const handleMedicineRemove = useCallback((index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Lab order handlers
  const handleLabAdd = useCallback((test: LabTestOption) => {
    const newOrder: LabOrderData = {
      id: generateId(),
      labTestId: test.id,
      labTestName: test.name,
      category: test.category,
      notes: '',
    };
    setLabOrders((prev) => [...prev, newOrder]);
  }, []);

  const handleLabRemove = useCallback((index: number) => {
    setLabOrders((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleLabNotesUpdate = useCallback(
    (index: number, newNotes: string) => {
      setLabOrders((prev) =>
        prev.map((order, i) =>
          i === index ? { ...order, notes: newNotes } : order
        )
      );
    },
    []
  );

  // Form actions
  const handleSaveDraft = useCallback(async () => {
    setIsSubmitting(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
  }, []);

  const handleFinalize = useCallback(async () => {
    setIsSubmitting(true);
    // Simulate finalize
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
  }, []);

  const patientFullName = patient
    ? `${patient.firstName} ${patient.lastName}`
    : '';

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="mx-auto max-w-[1600px] p-4 lg:p-6 pb-24">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-200">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Prescription Pad
            </h1>
            <p className="text-sm text-slate-500">
              Create a new prescription for your patient
            </p>
          </div>
        </motion.div>

        {/* Patient header */}
        {isLoadingPatient ? (
          <PatientSkeleton />
        ) : patient ? (
          <PatientHeader
            patient={patient}
            vitals={vitals}
            onVitalsChange={setVitals}
          />
        ) : null}

        {/* Main content area */}
        <div className="mt-5 flex flex-col lg:flex-row gap-5">
          {/* Left column - Form */}
          <div
            className={cn(
              'space-y-5 transition-all duration-300',
              showPreview ? 'lg:w-[60%]' : 'lg:w-full'
            )}
          >
            {/* Diagnosis */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FileText className="h-4 w-4 text-blue-500" />
                Diagnosis / Chief Complaint
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Enter diagnosis or chief complaint..."
                className={cn(
                  'w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-base',
                  'outline-none transition-all placeholder:text-slate-400',
                  'focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:shadow-sm'
                )}
              />
            </motion.div>

            {/* Medicines section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Pill className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800">
                    Medicines
                  </h3>
                  {medicines.length > 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {medicines.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Medicine search */}
              <div className="mb-3">
                <MedicineSearch
                  onSelect={handleMedicineSelect}
                  clinicId="clinic-1"
                />
              </div>

              {/* Column headers - visible on desktop */}
              {medicines.length > 0 && (
                <div className="mb-2 hidden lg:grid grid-cols-[32px_1fr] gap-3">
                  <div />
                  <div className="grid grid-cols-[1.5fr_0.8fr_1fr_0.8fr_0.5fr_1fr_auto_auto] gap-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <span>Medicine</span>
                    <span>Dosage</span>
                    <span>Frequency</span>
                    <span>Duration</span>
                    <span>Qty</span>
                    <span>Instructions</span>
                    <span>Stock</span>
                    <span />
                  </div>
                </div>
              )}

              {/* Medicine rows */}
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {medicines.map((item, index) => (
                    <MedicineRow
                      key={item.id}
                      item={item}
                      index={index}
                      onUpdate={handleMedicineUpdate}
                      onRemove={handleMedicineRemove}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {medicines.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
                  <Pill className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-400">
                    No medicines added yet
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Search and select medicines above
                  </p>
                </div>
              )}

              {medicines.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    // Focus the search input
                    const input = document.querySelector<HTMLInputElement>(
                      '[placeholder*="Search medicines"]'
                    );
                    input?.focus();
                  }}
                  className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add another medicine
                </button>
              )}
            </motion.div>

            {/* Lab Orders */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <LabOrderSection
                labOrders={labOrders}
                onAdd={handleLabAdd}
                onRemove={handleLabRemove}
                onUpdateNotes={handleLabNotesUpdate}
              />
            </motion.div>

            {/* Notes */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FileText className="h-4 w-4 text-slate-400" />
                Additional Notes / Advice
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes, dietary advice, follow-up instructions..."
                rows={4}
                className={cn(
                  'w-full resize-y rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm',
                  'outline-none transition-all placeholder:text-slate-400',
                  'focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100',
                  'min-h-[100px]'
                )}
              />
            </motion.div>
          </div>

          {/* Right column - Preview (desktop) */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '40%' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="hidden lg:block"
              >
                <div className="sticky top-6">
                  <PrescriptionPreview
                    patientName={patientFullName}
                    doctorName="Anand Sharma"
                    diagnosis={diagnosis}
                    items={medicines}
                    labOrders={labOrders}
                    vitals={vitals}
                    notes={notes}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile preview modal */}
      <AnimatePresence>
        {showMobilePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setShowMobilePreview(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">
                  Prescription Preview
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMobilePreview(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <PrescriptionPreview
                patientName={patientFullName}
                doctorName="Anand Sharma"
                diagnosis={diagnosis}
                items={medicines}
                labOrders={labOrders}
                vitals={vitals}
                notes={notes}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom action bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, type: 'spring', damping: 20 }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200',
          'bg-white/80 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)]'
        )}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 lg:px-6">
          {/* Left: Preview toggle */}
          <div className="flex items-center gap-2">
            {/* Desktop toggle */}
            <button
              type="button"
              onClick={() => setShowPreview((prev) => !prev)}
              className={cn(
                'hidden lg:inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium',
                'transition-all duration-150 hover:bg-slate-50',
                showPreview
                  ? 'text-blue-600 border-blue-200 bg-blue-50/50'
                  : 'text-slate-600'
              )}
            >
              {showPreview ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setShowMobilePreview(true)}
              className={cn(
                'inline-flex lg:hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium',
                'text-slate-600 transition-all hover:bg-slate-50'
              )}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          </div>

          {/* Right: Save / Finalize */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium',
                'text-slate-600 transition-all duration-150',
                'hover:bg-slate-50 hover:border-slate-300',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Save Draft</span>
            </button>

            <button
              type="button"
              onClick={handleFinalize}
              disabled={isSubmitting || medicines.length === 0}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200',
                'transition-all duration-150',
                'hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200',
                'active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizonal className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Finalize & Send to Pharmacy</span>
              <span className="sm:hidden">Finalize</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
