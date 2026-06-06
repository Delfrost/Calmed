'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Receipt,
  Search,
  DollarSign,
  QrCode,
  CheckCircle,
  Printer,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
  TrendingUp,
  Percent,
  CreditCard,
  Building,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface PendingInvoice {
  id: string;
  patientName: string;
  phone: string;
  doctorName: string;
  items: InvoiceItem[];
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  date: string;
}

const MOCK_INVOICES: PendingInvoice[] = [
  {
    id: 'inv-101',
    patientName: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    doctorName: 'Dr. Anand Sharma',
    items: [
      { description: 'Cardiology Consultation Fee', quantity: 1, unitPrice: 500 },
      { description: 'Paracetamol 500mg (10 tabs)', quantity: 2, unitPrice: 25 },
      { description: 'Complete Blood Count (CBC)', quantity: 1, unitPrice: 350 },
    ],
    status: 'PENDING',
    date: '2026-05-26',
  },
  {
    id: 'inv-102',
    patientName: 'Priya Sharma',
    phone: '+91 98111 22233',
    doctorName: 'Dr. Anand Sharma',
    items: [
      { description: 'Cardiology Consultation Fee', quantity: 1, unitPrice: 500 },
      { description: 'Amoxicillin 500mg (10 caps)', quantity: 1, unitPrice: 80 },
    ],
    status: 'PAID',
    date: '2026-05-26',
  },
  {
    id: 'inv-103',
    patientName: 'Amit Patel',
    phone: '+91 98555 44433',
    doctorName: 'Dr. Anand Sharma',
    items: [
      { description: 'Cardiology Consultation Fee', quantity: 1, unitPrice: 500 },
      { description: 'ECG Analysis (12-Lead)', quantity: 1, unitPrice: 300 },
    ],
    status: 'PENDING',
    date: '2026-05-26',
  },
];

export default function BillingDesk() {
  const [invoices, setInvoices] = useState<PendingInvoice[]>(MOCK_INVOICES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<PendingInvoice | null>(MOCK_INVOICES[0]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('UPI');

  // Checkout modal QR states
  const [showQRModal, setShowQRModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        inv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.id.includes(searchQuery) ||
        inv.phone.includes(searchQuery);
      return matchSearch;
    });
  }, [invoices, searchQuery]);

  // Invoice calculations
  const totals = useMemo(() => {
    if (!selectedInvoice) return { subtotal: 0, tax: 0, discount: 0, total: 0 };

    const subtotal = selectedInvoice.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const discount = subtotal * (discountPercent / 100);
    const taxableSubtotal = subtotal - discount;
    const tax = taxableSubtotal * 0.18; // 18% GST standard in medical
    const total = taxableSubtotal + tax;

    return { subtotal, tax, discount, total };
  }, [selectedInvoice, discountPercent]);

  const handleProcessPayment = () => {
    if (!selectedInvoice) return;
    setIsProcessing(true);

    if (paymentMethod === 'UPI') {
      setShowQRModal(true);
      setIsProcessing(false);
    } else {
      // Simulate cash payment settling
      setTimeout(() => {
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === selectedInvoice.id ? { ...inv, status: 'PAID' } : inv))
        );
        if (selectedInvoice) {
          setSelectedInvoice({ ...selectedInvoice, status: 'PAID' });
        }
        setIsProcessing(false);
        setPaymentSuccess(true);
        setTimeout(() => setPaymentSuccess(false), 2000);
      }, 1000);
    }
  };

  const handleConfirmUPIPayment = () => {
    if (!selectedInvoice) return;
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === selectedInvoice.id ? { ...inv, status: 'PAID' } : inv))
    );
    setSelectedInvoice({ ...selectedInvoice, status: 'PAID' });
    setShowQRModal(false);
    setPaymentSuccess(true);
    setTimeout(() => setPaymentSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Billing</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-1">
              {invoices.filter((i) => i.status === 'PENDING').length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Settled Today</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1 font-display">
              ₹{invoices.filter((i) => i.status === 'PAID').length * 1250}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Revenue</p>
            <p className="text-3xl font-extrabold text-blue-600 mt-1 font-display">
              ₹{invoices.length * 1100}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Pending Invoices Queue (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 space-y-4">
              <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                Unsettled Invoices
              </h3>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search billing queue..."
                  className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-400"
                />
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-50 overflow-y-auto max-h-[460px]">
              {filteredInvoices.map((inv) => {
                const totalAmount = inv.items.reduce(
                  (sum, item) => sum + item.quantity * item.unitPrice,
                  0
                );
                const isSelected = selectedInvoice?.id === inv.id;

                return (
                  <button
                    key={inv.id}
                    onClick={() => {
                      setSelectedInvoice(inv);
                      setDiscountPercent(0);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between border-b border-slate-100 px-5 py-4 text-left transition-colors',
                      isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{inv.patientName}</span>
                        <span
                          className={cn(
                            'text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider',
                            inv.status === 'PAID' && 'bg-emerald-50 text-emerald-700',
                            inv.status === 'PENDING' && 'bg-amber-50 text-amber-700',
                            inv.status === 'OVERDUE' && 'bg-red-50 text-red-700'
                          )}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Invoice: #{inv.id} · {inv.date}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-800 font-display">
                        ₹{totalAmount.toFixed(2)}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{inv.items.length} items</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400">
            Consultations, pharmacy bills, and lab costs are unified here.
          </div>
        </div>

        {/* Right: Checkout Billing Calculator (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-soft flex flex-col justify-between relative">
          {selectedInvoice ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-base font-bold text-slate-800 font-display">
                    Invoice Details — #{selectedInvoice.id}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Patient: <span className="font-bold text-slate-600">{selectedInvoice.patientName}</span> ({selectedInvoice.phone})
                  </p>
                </div>

                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                    selectedInvoice.status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  )}
                >
                  {selectedInvoice.status}
                </span>
              </div>

              {/* Itemized charges table */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                <div className="grid grid-cols-[1fr_80px_100px] gap-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                  <span>Description</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Price</span>
                </div>

                {selectedInvoice.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_80px_100px] gap-2 px-3 text-xs py-2 hover:bg-slate-50/50 rounded-lg transition-colors items-center"
                  >
                    <span className="font-medium text-slate-700">{item.description}</span>
                    <span className="text-center font-bold text-slate-500">x{item.quantity}</span>
                    <span className="text-right font-bold text-slate-800">
                      ₹{(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculator footer split */}
              {selectedInvoice.status !== 'PAID' && (
                <div className="bg-slate-50/50 rounded-xl p-4 space-y-3.5 border border-slate-100">
                  <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
                    {/* Discount Slider */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Percent className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Discount %</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) =>
                          setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))
                        }
                        className="w-16 h-8 border border-slate-200 rounded-lg px-2 text-center text-xs font-bold focus:border-blue-400"
                      />
                    </div>

                    {/* Pay Methods selector */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                      {[
                        { id: 'UPI', label: 'UPI QR Scan', icon: QrCode },
                        { id: 'CASH', label: 'Cash Desk', icon: DollarSign },
                        { id: 'CARD', label: 'POS Terminal', icon: CreditCard },
                      ].map((pay) => {
                        const PayIcon = pay.icon;
                        const isSelect = paymentMethod === pay.id;

                        return (
                          <button
                            key={pay.id}
                            onClick={() => setPaymentMethod(pay.id as any)}
                            className={cn(
                              'h-8 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 transition-all cursor-pointer',
                              isSelect
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            )}
                          >
                            <PayIcon className="h-3.5 w-3.5" />
                            {pay.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Splits itemized pricing totals */}
                  <div className="space-y-1.5 text-xs border-t border-slate-200/60 pt-3">
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Subtotal Charges:</span>
                      <span>₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-red-500 font-medium">
                        <span>Discount ({discountPercent}%):</span>
                        <span>-₹{totals.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Medical Service Tax (18% GST):</span>
                      <span>₹{totals.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-800 text-sm border-t border-slate-200/40 pt-2 font-display">
                      <span>Total Invoice Due:</span>
                      <span className="text-blue-600">₹{totals.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleProcessPayment}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100 active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Process Payment & Settle Bill
                  </button>
                </div>
              )}

              {selectedInvoice.status === 'PAID' && (
                <div className="border border-emerald-100 bg-emerald-50/20 rounded-xl p-5 text-center space-y-3">
                  <CheckCircle className="h-10 w-10 mx-auto text-emerald-500 animate-pulse" />
                  <div>
                    <h5 className="text-sm font-bold text-emerald-800">Invoice Fully Settled</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Completed via UPI transaction ref: <span className="font-semibold text-slate-600">TXN-43892</span>
                    </p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="h-8 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all active:scale-95 shadow-sm"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Invoice Receipt
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400">
              <Receipt className="h-10 w-10 mx-auto mb-2 text-slate-200" />
              <p className="text-sm font-semibold">No invoice selected</p>
              <p className="text-xs">Choose a patient from the queue to process billing details</p>
            </div>
          )}

          {/* Payment Success absolute Toast Banner */}
          <AnimatePresence>
            {paymentSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-6 left-6 right-6 bg-emerald-600 text-white rounded-xl py-3 px-4 shadow-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4.5 w-4.5 text-white shrink-0" />
                  <span className="text-xs font-bold">Invoice settled and WhatsApp receipt dispatched!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* UPI QR Payment Modal */}
      <AnimatePresence>
        {showQRModal && selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl relative border border-slate-100 text-center space-y-4"
            >
              <div className="flex flex-col items-center gap-1">
                <h4 className="font-extrabold text-sm text-slate-800 font-display">
                  Dynamic UPI Payment Gateway
                </h4>
                <p className="text-[10px] text-slate-400">
                  Scan the QR to settle ₹{totals.total.toFixed(2)} with GST
                </p>
              </div>

              {/* Scannable UPI QR Mock */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white max-w-[200px] mx-auto relative shadow-sm group">
                <QrCode className="h-[160px] w-[160px] text-slate-800 mx-auto" />
                <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9.5px] font-bold text-blue-600 uppercase tracking-widest leading-normal p-2">
                    Scannable sandbox demo QR
                  </span>
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 rounded-xl p-3 border border-slate-100 max-w-[240px] mx-auto text-[10px] text-slate-500">
                <p>Merchant: <span className="font-semibold text-slate-700">MedFlow Polyclinics</span></p>
                <p>UPI ID: <span className="font-semibold text-slate-700">medflow@paytm</span></p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="h-9 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUPIPayment}
                  className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  Mock Scan Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
