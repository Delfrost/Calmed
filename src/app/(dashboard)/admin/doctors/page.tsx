'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Stethoscope,
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  Percent,
  CheckCircle,
  FileText,
  Building,
  User,
  Shield,
  Activity,
  Award,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  licenseNumber: string;
  experience: number;
  consultationFee: number;
  revenueSplitPercent: number;
  isVisiting: boolean;
  isActive: boolean;
}

const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'dr-1',
    name: 'Dr. Anand Sharma',
    specialization: 'Cardiology',
    qualification: 'MD, DM (Cardiology) - AIIMS',
    licenseNumber: 'MCI-84392',
    experience: 16,
    consultationFee: 500,
    revenueSplitPercent: 70,
    isVisiting: false,
    isActive: true,
  },
  {
    id: 'dr-2',
    name: 'Dr. Neha Gupta',
    specialization: 'Dermatology',
    qualification: 'MD (Dermatology) - MAMC',
    licenseNumber: 'MCI-93821',
    experience: 10,
    consultationFee: 600,
    revenueSplitPercent: 65,
    isVisiting: false,
    isActive: true,
  },
  {
    id: 'dr-3',
    name: 'Dr. Vikram Seth',
    specialization: 'Pediatrics',
    qualification: 'DCH, DNB (Pediatrics)',
    licenseNumber: 'MCI-43892',
    experience: 8,
    consultationFee: 400,
    revenueSplitPercent: 70,
    isVisiting: true,
    isActive: true,
  },
  {
    id: 'dr-4',
    name: 'Dr. Shruti Sen',
    specialization: 'Gynaecology',
    qualification: 'MS, DGO (Obstetrics & Gynae)',
    licenseNumber: 'MCI-73210',
    experience: 12,
    consultationFee: 500,
    revenueSplitPercent: 60,
    isVisiting: true,
    isActive: false,
  },
];

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>(MOCK_DOCTORS);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDrId, setEditingDrId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Edit states
  const [editFee, setEditFee] = useState('');
  const [editSplit, setEditSplit] = useState('');

  const filteredDoctors = doctors.filter((dr) => {
    const matchSearch =
      dr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dr.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  const handleStartEditing = (dr: Doctor) => {
    setEditingDrId(dr.id);
    setEditFee(dr.consultationFee.toString());
    setEditSplit(dr.revenueSplitPercent.toString());
  };

  const handleSaveEdits = (id: string, name: string) => {
    setDoctors((prev) =>
      prev.map((dr) =>
        dr.id === id
          ? {
              ...dr,
              consultationFee: parseInt(editFee) || dr.consultationFee,
              revenueSplitPercent: Math.min(100, Math.max(0, parseInt(editSplit) || dr.revenueSplitPercent)),
            }
          : dr
      )
    );
    setEditingDrId(null);
    setSuccessToast(`Practitioner ${name} splits and consultation fee successfully updated!`);
    setTimeout(() => setSuccessToast(null), 2000);
  };

  const handleToggleActive = (id: string, name: string, currentState: boolean) => {
    setDoctors((prev) =>
      prev.map((dr) => (dr.id === id ? { ...dr, isActive: !currentState } : dr))
    );
    setSuccessToast(`Doctor ${name} set to ${!currentState ? 'Active' : 'Inactive'} successfully.`);
    setTimeout(() => setSuccessToast(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-soft">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">
              Practitioners split Splits Registry
            </h3>
            <p className="text-xs text-slate-400">
              Manage doctor schedules, visiting states, consultation splits splits, and clinical fees.
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctors by name..."
            className="w-48 h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch relative">
        {filteredDoctors.map((dr) => {
          const isEditing = editingDrId === dr.id;

          return (
            <motion.div
              key={dr.id}
              layout
              className={cn(
                'bg-white border rounded-2xl p-5 shadow-soft flex flex-col justify-between transition-all hover:shadow-soft',
                dr.isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'
              )}
            >
              <div className="space-y-4">
                {/* Header status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-teal-500 flex items-center justify-center text-white font-extrabold shadow-soft">
                      {dr.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <h4 className="text-xs font-black text-slate-800">{dr.name}</h4>
                        <span className="text-[9px] text-slate-400 font-medium">({dr.specialization})</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{dr.qualification}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleActive(dr.id, dr.name, dr.isActive)}
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border transition-all cursor-pointer',
                        dr.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      )}
                    >
                      {dr.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider">
                      LIC: {dr.licenseNumber}
                    </span>
                  </div>
                </div>

                {/* Splits values specs */}
                <div className="grid grid-cols-3 gap-3 border-y border-dashed border-slate-100 py-3.5 text-center text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                      Consult fee
                    </span>
                    {isEditing ? (
                      <div className="mt-1.5 relative inline-block max-w-[64px]">
                        <input
                          type="number"
                          value={editFee}
                          onChange={(e) => setEditFee(e.target.value)}
                          className="w-full text-center border border-slate-200 rounded font-bold font-display"
                        />
                      </div>
                    ) : (
                      <span className="font-extrabold text-slate-700 block mt-1.5 font-display">
                        ₹{dr.consultationFee}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                      Admin split
                    </span>
                    {isEditing ? (
                      <div className="mt-1.5 relative inline-block max-w-[64px]">
                        <input
                          type="number"
                          value={editSplit}
                          onChange={(e) => setEditSplit(e.target.value)}
                          className="w-full text-center border border-slate-200 rounded font-bold font-display"
                        />
                      </div>
                    ) : (
                      <span className="font-extrabold text-blue-600 block mt-1.5 font-display">
                        {dr.revenueSplitPercent}%
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                      Visiting state
                    </span>
                    <span className="font-extrabold text-slate-500 block mt-1.5 font-display">
                      {dr.isVisiting ? 'Visiting' : 'Permanent'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit triggers */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  {dr.experience} years experience
                </span>

                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingDrId(null)}
                      className="px-2.5 py-1 rounded border border-slate-200 text-[10px] font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdits(dr.id, dr.name)}
                      className="px-2.5 py-1 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartEditing(dr)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    Adjust splits & fees
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Success toast absolute banner */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-6 right-6 bg-slate-900 text-white rounded-xl py-3 px-4 shadow-xl flex items-center justify-between z-40"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold">{successToast}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
