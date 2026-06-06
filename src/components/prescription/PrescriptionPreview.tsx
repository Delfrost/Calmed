'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { PrescriptionItemData, LabOrderData, VitalsData } from '@/types';

interface PrescriptionPreviewProps {
  patientName: string;
  doctorName: string;
  diagnosis: string;
  items: PrescriptionItemData[];
  labOrders: LabOrderData[];
  vitals: VitalsData;
  notes: string;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function PrescriptionPreview({
  patientName,
  doctorName,
  diagnosis,
  items,
  labOrders,
  vitals,
  notes,
}: PrescriptionPreviewProps) {
  const today = formatDate(new Date());

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-slate-200 bg-[#fefdf8] shadow-lg',
        'font-serif'
      )}
    >
      {/* PREVIEW watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span
          className="select-none text-6xl font-bold tracking-widest text-slate-200/40 uppercase"
          style={{ transform: 'rotate(-35deg)' }}
        >
          PREVIEW
        </span>
      </div>

      <div className="relative z-10 p-6 space-y-5">
        {/* Clinic header */}
        <div className="border-b-2 border-blue-600 pb-3 text-center">
          <h1 className="text-xl font-bold text-blue-800 tracking-wide">
            HealthCare Plus Clinic
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            123, Medical Complex, Sector 15, Gurgaon, Haryana – 122001
          </p>
          <p className="text-xs text-slate-500">
            Phone: +91 124-4567890 • Email: care@healthcareplus.in
          </p>
          <div className="mt-2 border-t border-slate-200 pt-2">
            <p className="text-sm font-semibold text-slate-700">
              Dr. {doctorName}
            </p>
            <p className="text-[11px] text-slate-400">
              MBBS, MD (General Medicine) • Reg. No. MH-12345
            </p>
          </div>
        </div>

        {/* Patient info row */}
        <div className="flex flex-wrap justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span>
            <strong>Patient:</strong> {patientName || '—'}
          </span>
          <span>
            <strong>Date:</strong> {today}
          </span>
        </div>

        {/* Vitals summary */}
        {(vitals.bloodPressure ||
          vitals.temperature ||
          vitals.weight ||
          vitals.heartRate ||
          vitals.oxygenSaturation) && (
          <div className="rounded-md border border-slate-100 bg-white px-3 py-2 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-600 mr-2">Vitals:</span>
            {vitals.bloodPressure && (
              <span className="mr-3">BP: {vitals.bloodPressure} mmHg</span>
            )}
            {vitals.temperature && (
              <span className="mr-3">Temp: {vitals.temperature}°F</span>
            )}
            {vitals.weight && (
              <span className="mr-3">Wt: {vitals.weight} kg</span>
            )}
            {vitals.heartRate && (
              <span className="mr-3">HR: {vitals.heartRate} bpm</span>
            )}
            {vitals.oxygenSaturation && (
              <span>SpO₂: {vitals.oxygenSaturation}%</span>
            )}
          </div>
        )}

        {/* Diagnosis */}
        {diagnosis && (
          <div className="text-sm">
            <span className="font-semibold text-slate-700">Diagnosis: </span>
            <span className="text-slate-600">{diagnosis}</span>
          </div>
        )}

        {/* Rx Symbol + Medicines */}
        <div>
          <div className="mb-2 text-3xl font-bold text-blue-700 leading-none">
            ℞
          </div>

          {items.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-1.5 pr-2 w-6">#</th>
                  <th className="pb-1.5 pr-2">Medicine</th>
                  <th className="pb-1.5 pr-2">Dosage</th>
                  <th className="pb-1.5 pr-2">Frequency</th>
                  <th className="pb-1.5 pr-2">Duration</th>
                  <th className="pb-1.5 w-8">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, i) => (
                  <tr key={item.id} className="text-slate-600">
                    <td className="py-1.5 pr-2 text-slate-400">{i + 1}.</td>
                    <td className="py-1.5 pr-2">
                      <span className="font-semibold text-slate-800">
                        {item.medicineName}
                      </span>
                      {item.genericName && (
                        <span className="ml-1 text-slate-400 italic">
                          ({item.genericName})
                        </span>
                      )}
                      {item.instructions && (
                        <p className="text-[10px] text-blue-500 mt-0.5">
                          ↳ {item.instructions}
                        </p>
                      )}
                    </td>
                    <td className="py-1.5 pr-2">{item.dosage || '—'}</td>
                    <td className="py-1.5 pr-2">{item.frequency || '—'}</td>
                    <td className="py-1.5 pr-2">{item.duration || '—'}</td>
                    <td className="py-1.5">{item.quantity || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs italic text-slate-400">
              No medicines added yet
            </p>
          )}
        </div>

        {/* Lab orders */}
        {labOrders.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              Lab Investigations
            </h4>
            <ol className="list-decimal list-inside space-y-0.5 text-xs text-slate-600">
              {labOrders.map((order) => (
                <li key={order.id}>
                  <span className="font-medium">{order.labTestName}</span>
                  {order.notes && (
                    <span className="text-slate-400 italic">
                      {' '}
                      — {order.notes}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Notes / advice */}
        {notes && (
          <div className="rounded-md border border-slate-100 bg-blue-50/30 p-3">
            <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Advice / Notes
            </h4>
            <p className="text-xs text-slate-600 whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        )}

        {/* Signature line */}
        <div className="mt-8 flex justify-end">
          <div className="text-center">
            <div className="mb-1 h-px w-40 bg-slate-300" />
            <p className="text-xs font-semibold text-slate-600">
              Dr. {doctorName}
            </p>
            <p className="text-[10px] text-slate-400">Signature & Stamp</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
