'use client';

import { motion } from 'motion/react';
import {
  User,
  Phone,
  Heart,
  Thermometer,
  Weight,
  Activity,
  Droplets,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PatientInfo, VitalsData } from '@/types';

interface PatientHeaderProps {
  patient: PatientInfo;
  vitals: VitalsData;
  onVitalsChange: (vitals: VitalsData) => void;
}

interface VitalCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  fieldKey: keyof VitalsData;
  color: string;
  onChange: (key: keyof VitalsData, value: string) => void;
}

function VitalCard({
  icon,
  label,
  value,
  unit,
  fieldKey,
  color,
  onChange,
}: VitalCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md',
        'min-w-[140px]'
      )}
    >
      <div className={cn('rounded-md p-1.5', color)}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <div className="flex items-baseline gap-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-300"
            placeholder="—"
          />
          <span className="text-[10px] text-slate-400 shrink-0">{unit}</span>
        </div>
      </div>
    </div>
  );
}

export default function PatientHeader({
  patient,
  vitals,
  onVitalsChange,
}: PatientHeaderProps) {
  const initials = `${patient.firstName[0]}${patient.lastName[0]}`;
  const fullName = `${patient.firstName} ${patient.lastName}`;

  const handleVitalChange = (key: keyof VitalsData, value: string) => {
    onVitalsChange({ ...vitals, [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-5">
        {/* Left: Patient identity */}
        <div className="flex items-center gap-4 lg:min-w-[220px]">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-bold text-white shadow-md">
              {initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{fullName}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <User className="h-3.5 w-3.5" />
              <span>
                {patient.age} yrs • {patient.gender}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Phone className="h-3.5 w-3.5" />
              <span>{patient.phone}</span>
            </div>
          </div>
        </div>

        {/* Center: Badges and conditions */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              <Calendar className="h-3 w-3" />
              Visit #{patient.visitCount}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              <Droplets className="h-3 w-3" />
              {patient.bloodGroup}
            </span>
          </div>

          {patient.allergies.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                <AlertCircle className="h-3 w-3" />
                Allergies:
              </span>
              {patient.allergies.map((allergy) => (
                <span
                  key={allergy}
                  className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700"
                >
                  {allergy}
                </span>
              ))}
            </div>
          )}

          {patient.chronicConditions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                <Activity className="h-3 w-3" />
                Chronic:
              </span>
              {patient.chronicConditions.map((condition) => (
                <span
                  key={condition}
                  className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                >
                  {condition}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: Editable vitals */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <VitalCard
            icon={<Heart className="h-3.5 w-3.5 text-rose-600" />}
            label="BP"
            value={vitals.bloodPressure}
            unit="mmHg"
            fieldKey="bloodPressure"
            color="bg-rose-50"
            onChange={handleVitalChange}
          />
          <VitalCard
            icon={<Thermometer className="h-3.5 w-3.5 text-orange-600" />}
            label="Temp"
            value={vitals.temperature}
            unit="°F"
            fieldKey="temperature"
            color="bg-orange-50"
            onChange={handleVitalChange}
          />
          <VitalCard
            icon={<Weight className="h-3.5 w-3.5 text-blue-600" />}
            label="Weight"
            value={vitals.weight}
            unit="kg"
            fieldKey="weight"
            color="bg-blue-50"
            onChange={handleVitalChange}
          />
          <VitalCard
            icon={<Activity className="h-3.5 w-3.5 text-emerald-600" />}
            label="Heart Rate"
            value={vitals.heartRate}
            unit="bpm"
            fieldKey="heartRate"
            color="bg-emerald-50"
            onChange={handleVitalChange}
          />
          <VitalCard
            icon={<Droplets className="h-3.5 w-3.5 text-sky-600" />}
            label="SpO₂"
            value={vitals.oxygenSaturation}
            unit="%"
            fieldKey="oxygenSaturation"
            color="bg-sky-50"
            onChange={handleVitalChange}
          />
        </div>
      </div>
    </motion.div>
  );
}
