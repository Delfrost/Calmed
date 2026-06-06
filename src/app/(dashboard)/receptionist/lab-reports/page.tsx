'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FlaskConical,
  UploadCloud,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertCircle,
  File,
  X,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LabOrder {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  testName: string;
  category: 'Blood' | 'Urine' | 'Imaging' | 'Pathology';
  status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'COMPLETED';
  dateOrdered: string;
  doctorName: string;
  reportUrl?: string;
  reportName?: string;
}

const MOCK_LAB_ORDERS: LabOrder[] = [
  {
    id: 'lo-1',
    patientName: 'Rajesh Kumar',
    patientAge: 45,
    patientGender: 'Male',
    testName: 'Complete Blood Count (CBC)',
    category: 'Blood',
    status: 'COMPLETED',
    dateOrdered: '2026-05-25',
    doctorName: 'Dr. Anand Sharma',
    reportUrl: 'https://medflow-s3.s3.amazonaws.com/reports/rajesh_cbc.pdf',
    reportName: 'rajesh_cbc_report.pdf',
  },
  {
    id: 'lo-2',
    patientName: 'Priya Sharma',
    patientAge: 32,
    patientGender: 'Female',
    testName: 'HbA1c',
    category: 'Blood',
    status: 'IN_PROGRESS',
    dateOrdered: '2026-05-26',
    doctorName: 'Dr. Anand Sharma',
  },
  {
    id: 'lo-3',
    patientName: 'Amit Patel',
    patientAge: 58,
    patientGender: 'Male',
    testName: 'ECG (12-Lead)',
    category: 'Imaging',
    status: 'SAMPLE_COLLECTED',
    dateOrdered: '2026-05-26',
    doctorName: 'Dr. Anand Sharma',
  },
  {
    id: 'lo-4',
    patientName: 'Sunita Devi',
    patientAge: 67,
    patientGender: 'Female',
    testName: 'Urinalysis',
    category: 'Urine',
    status: 'ORDERED',
    dateOrdered: '2026-05-26',
    doctorName: 'Dr. Anand Sharma',
  },
];

export default function LabReportsTracker() {
  const [labOrders, setLabOrders] = useState<LabOrder[]>(MOCK_LAB_ORDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Upload Panel states
  const [activeUploadOrder, setActiveUploadOrder] = useState<LabOrder | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [mockFile, setMockFile] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    return labOrders.filter((item) => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.includes(searchQuery);
      const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [labOrders, searchQuery, filterCategory]);

  const handleUpdateStatus = (id: string, newStatus: LabOrder['status']) => {
    setLabOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status: newStatus } : order))
    );
  };

  const handleSimulateUpload = () => {
    if (!activeUploadOrder) return;
    setUploadProgress(0);
    setMockFile('report_scan_982.pdf');

    // Simulate S3 file upload interval
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          // Mark as complete after delay
          setTimeout(() => {
            setLabOrders((orders) =>
              orders.map((ord) =>
                ord.id === activeUploadOrder.id
                  ? {
                      ...ord,
                      status: 'COMPLETED',
                      reportName: 'lab_result_scanned.pdf',
                      reportUrl: 'https://medflow-s3.s3.amazonaws.com/reports/scanned_report.pdf',
                    }
                  : ord
              )
            );
            setActiveUploadOrder(null);
            setUploadProgress(null);
            setMockFile(null);
          }, 400);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleRemoveReport = (id: string) => {
    setLabOrders((prev) =>
      prev.map((ord) =>
        ord.id === id ? { ...ord, status: 'ORDERED', reportUrl: undefined, reportName: undefined } : ord
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview stats toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-soft">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">
              Lab Reports Tracking & Uploads
            </h3>
            <p className="text-xs text-slate-400">
              Collect diagnostic blood, urine, or imaging orders and upload PDF reports for Doctor views.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="w-48 h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-400"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 bg-white outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Blood">Blood Tests</option>
            <option value="Urine">Urine Tests</option>
            <option value="Imaging">Imaging / ECG</option>
            <option value="Pathology">Pathology</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Panel: Lab Orders Registry (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 font-display">
                Active Diagnostic Requests
              </h4>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Syncing with doctor pad
              </span>
            </div>

            <div className="divide-y divide-slate-50 overflow-y-auto max-h-[480px]">
              {filteredOrders.map((item) => (
                <div
                  key={item.id}
                  className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 shadow-sm">
                      <FlaskConical className="h-4.5 w-4.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 text-xs truncate">
                          {item.patientName}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium shrink-0">
                          {item.patientAge}y/{item.patientGender}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-1">
                        {item.testName}
                        <span className="text-[9.5px] font-semibold text-slate-400">({item.category})</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        By {item.doctorName} · {item.dateOrdered}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status badge */}
                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleUpdateStatus(item.id, e.target.value as LabOrder['status'])
                      }
                      className={cn(
                        'rounded-lg px-2 py-1 text-[9px] font-bold tracking-wider uppercase outline-none border border-transparent shadow-sm cursor-pointer',
                        item.status === 'COMPLETED' && 'bg-emerald-50 text-emerald-700 border-emerald-100',
                        item.status === 'IN_PROGRESS' && 'bg-blue-50 text-blue-700 border-blue-100',
                        item.status === 'SAMPLE_COLLECTED' && 'bg-purple-50 text-purple-700 border-purple-100',
                        item.status === 'ORDERED' && 'bg-amber-50 text-amber-700 border-amber-100'
                      )}
                    >
                      <option value="ORDERED">Ordered</option>
                      <option value="SAMPLE_COLLECTED">Sample Done</option>
                      <option value="IN_PROGRESS">Analyzing</option>
                      <option value="COMPLETED">Completed</option>
                    </select>

                    {item.reportUrl ? (
                      <div className="flex items-center gap-1">
                        <a
                          href={item.reportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Open S3 PDF"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleRemoveReport(item.id)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Report File"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveUploadOrder(item)}
                        className="h-7 inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-purple-50/50 hover:border-purple-200 text-[10px] font-bold text-purple-600 transition-all active:scale-95 cursor-pointer"
                      >
                        <UploadCloud className="h-3.5 w-3.5" />
                        Upload
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <FlaskConical className="h-10 w-10 mx-auto mb-2 text-slate-200 animate-pulse" />
                  <p className="text-sm font-semibold">No lab orders synced</p>
                  <p className="text-xs font-medium">All diagnostic uploads are complete</p>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400">
            Doctors will see uploaded PDF reports inside their Patient Records pad dynamically.
          </div>
        </div>

        {/* Right Panel: Upload Report Drawer (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-soft flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
                <UploadCloud className="h-5 w-5 text-purple-500" />
                Upload Center
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Drag diagnostic files or click to simulate secure PDF reports uploads to S3 buckets.
              </p>
            </div>

            {activeUploadOrder ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5 rounded-xl border border-purple-100 bg-purple-50/10 p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9.5px] font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Selected Order
                    </span>
                    <h5 className="font-bold text-slate-800 text-sm mt-2 leading-tight">
                      {activeUploadOrder.patientName}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {activeUploadOrder.testName}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveUploadOrder(null);
                      setMockFile(null);
                      setUploadProgress(null);
                    }}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Upload drag block */}
                {!mockFile ? (
                  <div
                    onClick={handleSimulateUpload}
                    className="border-2 border-dashed border-purple-200 rounded-xl py-12 flex flex-col items-center justify-center gap-3 bg-white hover:bg-purple-50/20 hover:border-purple-300 transition-all cursor-pointer select-none group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-500 group-hover:scale-110 flex items-center justify-center shadow-sm transition-transform">
                      <UploadCloud className="h-5.5 w-5.5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-700">Click to Select Scanned Report</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Supports: PDF, JPEG up to 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{mockFile}</p>
                        <p className="text-[10px] text-slate-400">1.2 MB</p>
                      </div>
                      {uploadProgress === 100 && (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      )}
                    </div>

                    {uploadProgress !== null && uploadProgress < 100 && (
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            animate={{ width: `${uploadProgress}%` }}
                            className="h-full bg-purple-500 rounded-full"
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-400">
                          <span>Uploading report...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-xl py-16 text-center text-slate-400 bg-slate-50/20">
                <File className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold">Select a diagnostic order from the registry</p>
                <p className="text-[10px] text-slate-300 mt-0.5">Click &quot;Upload&quot; button to launch uploader slots</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
            <AlertCircle className="h-4 w-4 text-purple-500 shrink-0" />
            Upload integrity compliance meets clinical HIPAA guidelines.
          </div>
        </div>
      </div>
    </div>
  );
}
