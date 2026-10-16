'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Search,
  Plus,
  RefreshCw,
  Clock,
  ArrowRight,
  ClipboardList,
  AlertCircle,
  FileText,
  DollarSign,
  Activity,
  CheckCircle,
  X,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TPARecord {
  id: string;
  admissionId: string;
  insurerName: string;
  policyNumber: string;
  tpaName?: string | null;
  memberId?: string | null;
  preAuthAmount?: string | null;
  approvedAmount?: string | null;
  claimAmount?: string | null;
  settledAmount?: string | null;
  status: 'PRE_AUTH_PENDING' | 'PRE_AUTH_APPROVED' | 'PRE_AUTH_REJECTED' | 'CLAIM_SUBMITTED' | 'CLAIM_APPROVED' | 'CLAIM_REJECTED' | 'CLAIM_SETTLED';
  preAuthDocUrl?: string | null;
  claimDocUrl?: string | null;
  notes?: string | null;
  admission: {
    admissionNumber: string;
    patient: {
      firstName: string;
      lastName: string;
      phone: string;
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

export default function TPADeskPage() {
  const [records, setRecords] = useState<TPARecord[]>([]);
  const [activeAdmissions, setActiveAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Form modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [newAdmissionId, setNewAdmissionId] = useState('');
  const [newInsurer, setNewInsurer] = useState('Star Health');
  const [newPolicy, setNewPolicy] = useState('');
  const [newTpa, setNewTpa] = useState('Medi Assist');
  const [newMemberId, setNewMemberId] = useState('');
  const [newPreAuthAmt, setNewPreAuthAmt] = useState('');

  // Update modal state
  const [updatingRecord, setUpdatingRecord] = useState<TPARecord | null>(null);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [updatePreAuthAmt, setUpdatePreAuthAmt] = useState('');
  const [updateApprovedAmt, setUpdateApprovedAmt] = useState('');
  const [updateClaimAmt, setUpdateClaimAmt] = useState('');
  const [updateSettledAmt, setUpdateSettledAmt] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');

  const fetchTPARecords = async () => {
    try {
      const res = await fetch('/api/ipd/tpa');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.tpaRecords || []);
      }
    } catch (error) {
      console.error('Failed to load TPA records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveAdmissions = async () => {
    try {
      const res = await fetch('/api/ipd/admissions?status=ADMITTED');
      if (res.ok) {
        const data = await res.json();
        setActiveAdmissions(data.admissions || []);
      }
    } catch (error) {
      console.error('Failed to load active admissions:', error);
    }
  };

  useEffect(() => {
    fetchTPARecords();
    fetchActiveAdmissions();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmissionId || !newInsurer || !newPolicy) return;

    try {
      setSubmittingCreate(true);
      const res = await fetch('/api/ipd/tpa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId: newAdmissionId,
          insurerName: newInsurer,
          policyNumber: newPolicy,
          tpaName: newTpa,
          memberId: newMemberId,
          preAuthAmount: newPreAuthAmt,
          status: 'PRE_AUTH_PENDING',
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewAdmissionId('');
        setNewPolicy('');
        setNewMemberId('');
        setNewPreAuthAmt('');
        await fetchTPARecords();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create TPA record.');
      }
    } catch (error) {
      console.error('Failed to create TPA record:', error);
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleOpenUpdate = (rec: TPARecord) => {
    setUpdatingRecord(rec);
    setUpdateStatus(rec.status);
    setUpdatePreAuthAmt(rec.preAuthAmount || '');
    setUpdateApprovedAmt(rec.approvedAmount || '');
    setUpdateClaimAmt(rec.claimAmount || '');
    setUpdateSettledAmt(rec.settledAmount || '');
    setUpdateNotes(rec.notes || '');
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingRecord) return;

    try {
      setSubmittingUpdate(true);
      const res = await fetch('/api/ipd/tpa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updatingRecord.id,
          status: updateStatus,
          preAuthAmount: updatePreAuthAmt,
          approvedAmount: updateApprovedAmt,
          claimAmount: updateClaimAmt,
          settledAmount: updateSettledAmt,
          notes: updateNotes,
        }),
      });

      if (res.ok) {
        setUpdatingRecord(null);
        await fetchTPARecords();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update TPA record.');
      }
    } catch (error) {
      console.error('Failed to update TPA record:', error);
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchesStatus = selectedStatus === 'ALL' || rec.status === selectedStatus;
      const patientName = `${rec.admission.patient.firstName} ${rec.admission.patient.lastName}`.toLowerCase();
      const insurer = rec.insurerName.toLowerCase();
      const policy = rec.policyNumber.toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        patientName.includes(query) ||
        insurer.includes(query) ||
        policy.includes(query) ||
        rec.admission.admissionNumber.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [records, selectedStatus, searchQuery]);

  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let claims = 0;
    let settled = 0;

    records.forEach((r) => {
      if (r.status === 'PRE_AUTH_PENDING') pending++;
      else if (r.status === 'PRE_AUTH_APPROVED') approved++;
      else if (r.status === 'CLAIM_SUBMITTED' || r.status === 'CLAIM_APPROVED') claims++;
      else if (r.status === 'CLAIM_SETTLED') settled++;
    });

    return { pending, approved, claims, settled };
  }, [records]);

  const tpaStatusLabels: Record<string, string> = {
    PRE_AUTH_PENDING: 'Pre-Auth Pending',
    PRE_AUTH_APPROVED: 'Pre-Auth Approved',
    PRE_AUTH_REJECTED: 'Pre-Auth Rejected',
    CLAIM_SUBMITTED: 'Claim Submitted',
    CLAIM_APPROVED: 'Claim Approved',
    CLAIM_REJECTED: 'Claim Rejected',
    CLAIM_SETTLED: 'Claim Settled',
  };

  return (
    <div className="space-y-6">
      {/* Top Aggregates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pre-Auth Pending</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{loading ? '...' : stats.pending}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pre-Auth Approved</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{loading ? '...' : stats.approved}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Shield className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Claims Active</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{loading ? '...' : stats.claims}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Activity className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Claims Settled</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{loading ? '...' : stats.settled}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
              <Shield className="h-5 w-5 text-blue-500" />
              TPA / Insurance Desk
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-9 px-4 rounded-xl bg-slate-950 text-white font-semibold text-xs flex items-center gap-1 hover:bg-slate-800 transition-all active:scale-[0.97]"
              >
                <Plus className="h-4 w-4" />
                Initialize TPA Claim
              </button>
              <button
                onClick={fetchTPARecords}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient name, insurer, policy number, admission ID..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-400 placeholder:text-slate-300"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto w-full md:w-auto no-scrollbar">
              {['ALL', 'PRE_AUTH_PENDING', 'PRE_AUTH_APPROVED', 'CLAIM_SUBMITTED', 'CLAIM_SETTLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all border',
                    selectedStatus === st
                      ? 'bg-slate-900 border-slate-900 text-white shadow-soft'
                      : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                  )}
                >
                  {st === 'ALL' ? 'All Claims' : tpaStatusLabels[st] || st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Claims List Table */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-3 text-primary" />
            <p className="text-xs">Fetching claims database...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <AlertCircle className="h-10 w-10 mx-auto mb-2 text-slate-200" />
            <p className="text-sm font-semibold">No insurance records found</p>
            <p className="text-xs">Try changing filtering options or search query</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors group"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-800">
                      {rec.admission.patient.firstName} {rec.admission.patient.lastName}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                      {rec.insurerName} · Policy: {rec.policyNumber}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">#{rec.admission.admissionNumber}</span>
                    <span className={cn(
                      'text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border',
                      rec.status.includes('PENDING') && 'bg-amber-50 text-amber-700 border-amber-100',
                      rec.status.includes('APPROVED') && 'bg-indigo-50 text-indigo-700 border-indigo-100',
                      rec.status.includes('SETTLED') && 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      rec.status.includes('REJECTED') && 'bg-rose-50 text-rose-700 border-rose-100'
                    )}>
                      {tpaStatusLabels[rec.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-[11px] text-slate-500">
                    <div>
                      <span>Pre-Auth Requested:</span> <strong className="text-slate-700">₹{Number(rec.preAuthAmount || 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span>Pre-Auth Approved:</span> <strong className="text-slate-700">₹{Number(rec.approvedAmount || 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span>Claim Filed:</span> <strong className="text-slate-700">₹{Number(rec.claimAmount || 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span>Settled:</span> <strong className="text-emerald-600 font-bold">₹{Number(rec.settledAmount || 0).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  {rec.notes && <p className="text-[10px] text-slate-400 italic">"{rec.notes}"</p>}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenUpdate(rec)}
                    className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center transition-all"
                  >
                    Manage Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Claim Initialization Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowCreateModal(false)}
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
                  Initialize TPA Claim
                </h4>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Select Admitted Inpatient
                  </label>
                  <select
                    required
                    value={newAdmissionId}
                    onChange={(e) => setNewAdmissionId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none bg-white focus:border-blue-400"
                  >
                    <option value="">-- Choose Patient --</option>
                    {activeAdmissions.map((adm) => {
                      // Check if already has TPA record
                      const exists = records.some((r) => r.admissionId === adm.id);
                      if (exists) return null;
                      return (
                        <option key={adm.id} value={adm.id}>
                          {adm.patient.firstName} {adm.patient.lastName} ({adm.admissionNumber})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Insurer Name
                    </label>
                    <select
                      value={newInsurer}
                      onChange={(e) => setNewInsurer(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:border-blue-400"
                    >
                      <option value="Star Health">Star Health</option>
                      <option value="ICICI Lombard">ICICI Lombard</option>
                      <option value="Niva Bupa">Niva Bupa</option>
                      <option value="HDFC ERGO">HDFC ERGO</option>
                      <option value="Bajaj Allianz">Bajaj Allianz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      TPA Desk
                    </label>
                    <select
                      value={newTpa}
                      onChange={(e) => setNewTpa(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:border-blue-400"
                    >
                      <option value="Medi Assist">Medi Assist</option>
                      <option value="FHPL">FHPL</option>
                      <option value="Paramount TPA">Paramount TPA</option>
                      <option value="Direct Insurer">Direct Insurer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      required
                      value={newPolicy}
                      onChange={(e) => setNewPolicy(e.target.value)}
                      placeholder="POL-12345"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Member ID / Card No
                    </label>
                    <input
                      type="text"
                      value={newMemberId}
                      onChange={(e) => setNewMemberId(e.target.value)}
                      placeholder="MEM-987"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Pre-Auth Estimated Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={newPreAuthAmt}
                    onChange={(e) => setNewPreAuthAmt(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingCreate || !newAdmissionId}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs transition-all active:scale-[0.98]"
                  >
                    {submittingCreate ? 'Initializing Record...' : 'Register Claim Pre-Auth'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Updates Modal */}
      <AnimatePresence>
        {updatingRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setUpdatingRecord(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl relative border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 font-display">
                    Manage Claim Ledger
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Patient: {updatingRecord.admission.patient.firstName} {updatingRecord.admission.patient.lastName}
                  </p>
                </div>
                <button
                  onClick={() => setUpdatingRecord(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Claim Pipeline Stage
                  </label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:border-blue-400"
                  >
                    <option value="PRE_AUTH_PENDING">Pre-Auth Pending</option>
                    <option value="PRE_AUTH_APPROVED">Pre-Auth Approved</option>
                    <option value="PRE_AUTH_REJECTED">Pre-Auth Rejected</option>
                    <option value="CLAIM_SUBMITTED">Claim Submitted</option>
                    <option value="CLAIM_APPROVED">Claim Approved</option>
                    <option value="CLAIM_REJECTED">Claim Rejected</option>
                    <option value="CLAIM_SETTLED">Claim Settled</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Pre-Auth Request (₹)
                    </label>
                    <input
                      type="number"
                      value={updatePreAuthAmt}
                      onChange={(e) => setUpdatePreAuthAmt(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Pre-Auth Approved (₹)
                    </label>
                    <input
                      type="number"
                      value={updateApprovedAmt}
                      onChange={(e) => setUpdateApprovedAmt(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400 font-semibold text-indigo-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Final Claim Filed (₹)
                    </label>
                    <input
                      type="number"
                      value={updateClaimAmt}
                      onChange={(e) => setUpdateClaimAmt(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Settled By Insurer (₹)
                    </label>
                    <input
                      type="number"
                      value={updateSettledAmt}
                      onChange={(e) => setUpdateSettledAmt(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400 font-bold text-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Notes
                  </label>
                  <textarea
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="Enter query details, settlement numbers..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-400 h-16 resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingUpdate}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 text-white font-semibold text-xs transition-all active:scale-[0.98]"
                  >
                    {submittingUpdate ? 'Updating Records...' : 'Save Claim State'}
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
