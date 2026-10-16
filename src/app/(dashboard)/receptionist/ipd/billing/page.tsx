'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Receipt,
  Search,
  Plus,
  CreditCard,
  Printer,
  TrendingUp,
  RefreshCw,
  Clock,
  ArrowRight,
  ClipboardList,
  AlertCircle,
  FileText,
  DollarSign,
  Activity,
  Calculator,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillItem {
  id: string;
  category: 'ROOM' | 'DOCTOR_VISIT' | 'NURSING' | 'PHARMACY' | 'SURGERY' | 'LAB' | 'MISC';
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  date: string;
  referenceType?: string | null;
}

interface BillData {
  id: string;
  roomCharges: string;
  doctorVisitFees: string;
  nursingCharges: string;
  pharmacyCharges: string;
  surgeryCharges: string;
  labCharges: string;
  miscCharges: string;
  totalAmount: string;
  discountAmount: string;
  taxAmount: string;
  paidAmount: string;
  balanceDue: string;
  lastAccruedAt: string | null;
  billItems: BillItem[];
  admission: {
    admissionNumber: string;
    patient: {
      firstName: string;
      lastName: string;
      phone: string;
      gender: string;
      dateOfBirth: string;
    };
    bed: {
      label: string;
      room: {
        number: string;
        ward: {
          name: string;
        };
      };
    } | null;
  };
}

function IPDBillingContent() {
  const searchParams = useSearchParams();
  const initialAdmissionId = searchParams.get('admissionId') || '';

  const [admissionId, setAdmissionId] = useState(initialAdmissionId);
  const [activeAdmissions, setActiveAdmissions] = useState<any[]>([]);
  const [bill, setBill] = useState<BillData | null>(null);
  const [loadingBill, setLoadingBill] = useState(false);
  const [loadingAdmissions, setLoadingAdmissions] = useState(true);

  // Modals state
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeCategory, setChargeCategory] = useState('MISC');
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeUnitPrice, setChargeUnitPrice] = useState('');
  const [chargeQuantity, setChargeQuantity] = useState('1');
  const [submittingCharge, setSubmittingCharge] = useState(false);

  const [accruingRent, setAccruingRent] = useState(false);

  const fetchActiveAdmissions = async () => {
    try {
      const res = await fetch('/api/ipd/admissions?status=ADMITTED');
      if (res.ok) {
        const data = await res.json();
        setActiveAdmissions(data.admissions || []);
      }
    } catch (error) {
      console.error('Failed to load active admissions:', error);
    } finally {
      setLoadingAdmissions(false);
    }
  };

  const fetchBill = async (id: string) => {
    if (!id) return;
    setLoadingBill(true);
    try {
      const res = await fetch(`/api/ipd/billing?admissionId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setBill(data.bill || null);
      } else {
        setBill(null);
      }
    } catch (error) {
      console.error('Failed to load bill:', error);
      setBill(null);
    } finally {
      setLoadingBill(false);
    }
  };

  useEffect(() => {
    fetchActiveAdmissions();
  }, []);

  useEffect(() => {
    if (admissionId) {
      fetchBill(admissionId);
    } else {
      setBill(null);
    }
  }, [admissionId]);

  const handleAddChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionId || !chargeDescription || !chargeUnitPrice) return;

    try {
      setSubmittingCharge(true);
      const res = await fetch('/api/ipd/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId,
          type: 'CHARGE',
          category: chargeCategory,
          description: chargeDescription,
          unitPrice: chargeUnitPrice,
          quantity: chargeQuantity,
        }),
      });

      if (res.ok) {
        setShowChargeModal(false);
        setChargeCategory('MISC');
        setChargeDescription('');
        setChargeUnitPrice('');
        setChargeQuantity('1');
        await fetchBill(admissionId);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add charge.');
      }
    } catch (error) {
      console.error('Failed to add charge:', error);
    } finally {
      setSubmittingCharge(false);
    }
  };


  const handleAccrueRent = async () => {
    try {
      setAccruingRent(true);
      const res = await fetch('/api/ipd/billing/accrue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        const accruedCount = data.summary?.filter((s: any) => s.accrued).length || 0;
        const totalAmount = data.summary?.reduce((sum: number, s: any) => sum + (s.amountAccrued || 0), 0) || 0;
        alert(`Room rent accrual job executed!\nAccrued rent for ${accruedCount} patient(s).\nTotal accrued amount: ₹${totalAmount}`);
        if (admissionId) {
          await fetchBill(admissionId);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to accrue room rent.');
      }
    } catch (error) {
      console.error('Failed to run rent accrual job:', error);
    } finally {
      setAccruingRent(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    ROOM: 'Room Charges',
    DOCTOR_VISIT: 'Doctor Consultation',
    NURSING: 'Nursing Charges',
    PHARMACY: 'Pharmacy & Consumables',
    SURGERY: 'Operation/Surgery',
    LAB: 'Lab & Diagnostic',
    MISC: 'Miscellaneous',
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return 0;
    return new Date().getFullYear() - new Date(dobString).getFullYear();
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-white border border-slate-200 shadow-soft rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
            <Receipt className="h-5 w-5 text-blue-500" />
            IPD Inpatient Billing Console
          </h3>
          <p className="text-xs text-slate-400">
            Select an active ward patient to view their running ledger, post charges, and process checkout payments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-1 md:max-w-md">
          {loadingAdmissions ? (
            <div className="text-xs text-slate-400">Loading active patients...</div>
          ) : (
            <select
              value={admissionId}
              onChange={(e) => setAdmissionId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            >
              <option value="">-- Select Admitted Patient --</option>
              {activeAdmissions.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  {adm.patient.firstName} {adm.patient.lastName} ({adm.admissionNumber})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleAccrueRent}
            disabled={accruingRent}
            className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-300 text-slate-600 font-semibold text-xs transition-all shrink-0 flex items-center gap-1.5 shadow-soft"
            title="Trigger daily room rent accrual script"
          >
            <Calculator className="h-4 w-4 text-teal-600" />
            {accruingRent ? 'Accruing...' : 'Accrue Rent'}
          </button>
        </div>
      </div>

      {loadingBill ? (
        <div className="py-24 text-center text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-soft">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-4 text-primary" />
          <p className="font-semibold text-sm">Retrieving Patient Ledger...</p>
        </div>
      ) : !bill ? (
        <div className="py-24 text-center bg-white border border-slate-100 rounded-2xl shadow-soft">
          <Receipt className="h-12 w-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500 text-sm">No Active Bill Selected</p>
          <p className="text-xs text-slate-400 mt-1">Please select an admitted patient from the dropdown above to view billing details.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Summary and Ledger Items (8 cols) */}
          <div className="lg:col-span-8 space-y-6 flex flex-col">
            {/* Bill Summary totals */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Total</p>
                <p className="text-xl font-black text-slate-800 mt-1">₹{Number(bill.totalAmount).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Paid Amount</p>
                <p className="text-xl font-black text-emerald-600 mt-1">₹{Number(bill.paidAmount).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Balance Due</p>
                <p className="text-xl font-black text-rose-600 mt-1">₹{Number(bill.balanceDue).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Ledger Line Items List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft flex-1 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-blue-500" />
                    Running Ledger Items
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowChargeModal(true)}
                      className="h-8 px-3 rounded-lg bg-slate-950 text-white font-semibold text-[10px] uppercase tracking-wide flex items-center gap-1 hover:bg-slate-800 active:scale-[0.97]"
                    >
                      <Plus className="h-3 w-3" />
                      Add Charge
                    </button>
                    <Link
                      href={`/receptionist/billing?billId=${bill.id}`}
                      className="h-8 px-3 rounded-lg bg-emerald-600 text-white font-semibold text-[10px] uppercase tracking-wide flex items-center gap-1 hover:bg-emerald-700 active:scale-[0.97]"
                    >
                      <CreditCard className="h-3 w-3" />
                      Checkout at Billing Desk
                    </Link>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[450px]">
                  {bill.billItems.map((item) => {
                    const isPayment = Number(item.totalPrice) < 0;
                    return (
                      <div key={item.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
                        <div className="space-y-1 min-w-0 pr-4">
                          <p className="font-bold text-slate-800 truncate">{item.description}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider',
                              item.category === 'ROOM' && 'bg-blue-50 text-blue-700',
                              item.category === 'DOCTOR_VISIT' && 'bg-purple-50 text-purple-700',
                              item.category === 'PHARMACY' && 'bg-emerald-50 text-emerald-700',
                              item.category === 'SURGERY' && 'bg-rose-50 text-rose-700',
                              item.category === 'LAB' && 'bg-amber-50 text-amber-700',
                              item.category === 'MISC' && 'bg-slate-100 text-slate-600'
                            )}>
                              {categoryLabels[item.category] || item.category}
                            </span>
                            <span>{new Date(item.date).toLocaleDateString('en-IN')}</span>
                            <span>Qty: {item.quantity} · Price: ₹{Math.abs(Number(item.unitPrice)).toLocaleString('en-IN')}</span>
                          </p>
                        </div>
                        <span className={cn(
                          'font-black text-sm shrink-0',
                          isPayment ? 'text-emerald-600' : 'text-slate-800'
                        )}>
                          {isPayment ? '-' : ''}₹{Math.abs(Number(item.totalPrice)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}

                  {bill.billItems.length === 0 && (
                    <div className="py-16 text-center text-slate-400">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                      <p className="text-xs">No transactions recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Accrual job last run: <strong>{bill.lastAccruedAt ? new Date(bill.lastAccruedAt).toLocaleDateString('en-IN') : 'Never'}</strong></span>
                <button
                  onClick={() => window.print()}
                  className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Statement
                </button>
              </div>
            </div>
          </div>

          {/* Right: Patient demographics and category aggregates (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Patient card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft space-y-4">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400" />
                Patient Profile
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="font-bold text-slate-700">
                    {bill.admission.patient.firstName} {bill.admission.patient.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Age / Gender:</span>
                  <span className="font-semibold text-slate-700">
                    {calculateAge(bill.admission.patient.dateOfBirth)}y / {bill.admission.patient.gender}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-mono text-slate-700">{bill.admission.patient.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IPD ID:</span>
                  <span className="font-mono font-semibold text-slate-800">{bill.admission.admissionNumber}</span>
                </div>
                {bill.admission.bed && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bed Allocation:</span>
                    <span className="font-semibold text-slate-700 text-right">
                      {bill.admission.bed.room.ward.name} · Rm {bill.admission.bed.room.number} · {bill.admission.bed.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Category breakdown aggregates */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft space-y-4">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                Category Summary
              </h4>

              <div className="space-y-3.5 text-xs">
                {[
                  { label: 'Room rent', amount: bill.roomCharges, color: 'bg-blue-500' },
                  { label: 'Doctor visits', amount: bill.doctorVisitFees, color: 'bg-purple-500' },
                  { label: 'Nursing fee', amount: bill.nursingCharges, color: 'bg-emerald-500' },
                  { label: 'Pharmacy cost', amount: bill.pharmacyCharges, color: 'bg-teal-500' },
                  { label: 'Surgeries', amount: bill.surgeryCharges, color: 'bg-rose-500' },
                  { label: 'Lab diagnostics', amount: bill.labCharges, color: 'bg-amber-500' },
                  { label: 'Miscellaneous', amount: bill.miscCharges, color: 'bg-slate-400' },
                ].map((cat) => (
                  <div key={cat.label} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">{cat.label}</span>
                      <span className="font-bold text-slate-800">₹{Number(cat.amount).toLocaleString('en-IN')}</span>
                    </div>
                    {Number(bill.totalAmount) > 0 && (
                      <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', cat.color)}
                          style={{ width: `${(Number(cat.amount) / Number(bill.totalAmount)) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charge Modal */}
      <AnimatePresence>
        {showChargeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowChargeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl relative border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-sm text-slate-800 font-display">
                  Post Ad-hoc Charge Item
                </h4>
                <button
                  onClick={() => setShowChargeModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddChargeSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Category
                  </label>
                  <select
                    value={chargeCategory}
                    onChange={(e) => setChargeCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-blue-400"
                  >
                    <option value="MISC">Miscellaneous</option>
                    <option value="ROOM">Room Charges</option>
                    <option value="DOCTOR_VISIT">Doctor Consultation</option>
                    <option value="NURSING">Nursing Charges</option>
                    <option value="PHARMACY">Pharmacy & Consumables</option>
                    <option value="SURGERY">Operation/Surgery</option>
                    <option value="LAB">Lab & Diagnostic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Charge Description
                  </label>
                  <input
                    type="text"
                    required
                    value={chargeDescription}
                    onChange={(e) => setChargeDescription(e.target.value)}
                    placeholder="e.g. Oxygen Cylinder (2 Hours)"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Unit Price (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={chargeUnitPrice}
                      onChange={(e) => setChargeUnitPrice(e.target.value)}
                      placeholder="e.g. 800"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      required
                      value={chargeQuantity}
                      onChange={(e) => setChargeQuantity(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingCharge}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs transition-all active:scale-[0.98]"
                  >
                    {submittingCharge ? 'Posting Charge...' : 'Post Charge to Ledger'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}

export default function IPDBillingPage() {
  return (
    <Suspense fallback={
      <div className="py-24 text-center text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-soft">
        <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-4 text-indigo-500" />
        <p className="font-semibold text-sm">Loading Billing Console...</p>
      </div>
    }>
      <IPDBillingContent />
    </Suspense>
  );
}

// Simple absolute close SVG
function X(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
