-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('VACANT', 'OCCUPIED', 'MAINTENANCE', 'HOUSEKEEPING', 'RESERVED');

-- CreateEnum
CREATE TYPE "WardType" AS ENUM ('GENERAL', 'SEMI_PRIVATE', 'PRIVATE', 'ICU', 'NICU', 'PICU', 'HDU');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('REQUESTED', 'ADMITTED', 'TRANSFERRED', 'DISCHARGED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdmissionSource" AS ENUM ('OPD', 'EMERGENCY', 'DIRECT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT');

-- CreateEnum
CREATE TYPE "MARStatus" AS ENUM ('SCHEDULED', 'ADMINISTERED', 'MISSED', 'HELD', 'REFUSED');

-- CreateEnum
CREATE TYPE "SurgeryStatus" AS ENUM ('SCHEDULED', 'PRE_OP', 'IN_PROGRESS', 'POST_OP', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TPAStatus" AS ENUM ('PRE_AUTH_PENDING', 'PRE_AUTH_APPROVED', 'PRE_AUTH_REJECTED', 'CLAIM_SUBMITTED', 'CLAIM_APPROVED', 'CLAIM_REJECTED', 'CLAIM_SETTLED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'NURSE';

-- CreateTable
CREATE TABLE "Ward" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WardType" NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "dailyRate" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bed" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'VACANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admission" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "admittingDoctorId" TEXT NOT NULL,
    "attendingDoctorId" TEXT,
    "bedId" TEXT,
    "admissionNumber" TEXT NOT NULL,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'REQUESTED',
    "source" "AdmissionSource" NOT NULL DEFAULT 'OPD',
    "admittedAt" TIMESTAMP(3),
    "dischargedAt" TIMESTAMP(3),
    "expectedDischargeDate" TIMESTAMP(3),
    "diagnosis" TEXT,
    "chiefComplaints" TEXT,
    "notes" TEXT,
    "appointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalsLog" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "temperature" DECIMAL(4,1),
    "systolicBP" INTEGER,
    "diastolicBP" INTEGER,
    "heartRate" INTEGER,
    "spO2" INTEGER,
    "respiratoryRate" INTEGER,
    "painScale" INTEGER,
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VitalsLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressNote" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "assessment" TEXT,
    "plan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationOrder" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "route" TEXT NOT NULL DEFAULT 'ORAL',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "instructions" TEXT,
    "orderedBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicationOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MAREntry" (
    "id" TEXT NOT NULL,
    "medicationOrderId" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "status" "MARStatus" NOT NULL DEFAULT 'SCHEDULED',
    "administeredAt" TIMESTAMP(3),
    "administeredBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MAREntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftHandover" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "shiftDate" TIMESTAMP(3) NOT NULL,
    "shiftStartHour" INTEGER NOT NULL DEFAULT 0,
    "shiftDurationHrs" INTEGER NOT NULL DEFAULT 8,
    "outgoingNurseId" TEXT NOT NULL,
    "incomingNurseId" TEXT,
    "criticalNotes" TEXT NOT NULL,
    "generalNotes" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftHandover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Surgery" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surgeonId" TEXT NOT NULL,
    "anesthetistId" TEXT,
    "otRoom" TEXT NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "status" "SurgeryStatus" NOT NULL DEFAULT 'SCHEDULED',
    "preOpChecklist" JSONB,
    "postOpChecklist" JSONB,
    "estimatedCost" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Surgery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IPDBill" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "roomCharges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "doctorVisitFees" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "nursingCharges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pharmacyCharges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "surgeryCharges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "labCharges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "miscCharges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lastAccruedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IPDBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IPDBillItem" (
    "id" TEXT NOT NULL,
    "ipdBillId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IPDBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TPARecord" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "insurerName" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "tpaName" TEXT,
    "memberId" TEXT,
    "preAuthAmount" DECIMAL(10,2),
    "approvedAmount" DECIMAL(10,2),
    "claimAmount" DECIMAL(10,2),
    "settledAmount" DECIMAL(10,2),
    "status" "TPAStatus" NOT NULL DEFAULT 'PRE_AUTH_PENDING',
    "preAuthDocUrl" TEXT,
    "claimDocUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TPARecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ward_clinicId_idx" ON "Ward"("clinicId");

-- CreateIndex
CREATE INDEX "Ward_type_idx" ON "Ward"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Ward_clinicId_name_key" ON "Ward"("clinicId", "name");

-- CreateIndex
CREATE INDEX "Room_wardId_idx" ON "Room"("wardId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_wardId_number_key" ON "Room"("wardId", "number");

-- CreateIndex
CREATE INDEX "Bed_roomId_idx" ON "Bed"("roomId");

-- CreateIndex
CREATE INDEX "Bed_status_idx" ON "Bed"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Bed_roomId_label_key" ON "Bed"("roomId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "Admission_admissionNumber_key" ON "Admission"("admissionNumber");

-- CreateIndex
CREATE INDEX "Admission_clinicId_status_idx" ON "Admission"("clinicId", "status");

-- CreateIndex
CREATE INDEX "Admission_patientId_idx" ON "Admission"("patientId");

-- CreateIndex
CREATE INDEX "Admission_bedId_idx" ON "Admission"("bedId");

-- CreateIndex
CREATE INDEX "Admission_admittingDoctorId_idx" ON "Admission"("admittingDoctorId");

-- CreateIndex
CREATE INDEX "Admission_attendingDoctorId_idx" ON "Admission"("attendingDoctorId");

-- CreateIndex
CREATE INDEX "Admission_createdAt_idx" ON "Admission"("createdAt");

-- CreateIndex
CREATE INDEX "VitalsLog_admissionId_recordedAt_idx" ON "VitalsLog"("admissionId", "recordedAt");

-- CreateIndex
CREATE INDEX "VitalsLog_recordedBy_idx" ON "VitalsLog"("recordedBy");

-- CreateIndex
CREATE INDEX "ProgressNote_admissionId_idx" ON "ProgressNote"("admissionId");

-- CreateIndex
CREATE INDEX "ProgressNote_doctorId_idx" ON "ProgressNote"("doctorId");

-- CreateIndex
CREATE INDEX "ProgressNote_createdAt_idx" ON "ProgressNote"("createdAt");

-- CreateIndex
CREATE INDEX "MedicationOrder_admissionId_idx" ON "MedicationOrder"("admissionId");

-- CreateIndex
CREATE INDEX "MedicationOrder_medicineId_idx" ON "MedicationOrder"("medicineId");

-- CreateIndex
CREATE INDEX "MedicationOrder_isActive_idx" ON "MedicationOrder"("isActive");

-- CreateIndex
CREATE INDEX "MAREntry_medicationOrderId_scheduledTime_idx" ON "MAREntry"("medicationOrderId", "scheduledTime");

-- CreateIndex
CREATE INDEX "MAREntry_status_idx" ON "MAREntry"("status");

-- CreateIndex
CREATE INDEX "MAREntry_administeredBy_idx" ON "MAREntry"("administeredBy");

-- CreateIndex
CREATE INDEX "ShiftHandover_admissionId_shiftDate_idx" ON "ShiftHandover"("admissionId", "shiftDate");

-- CreateIndex
CREATE INDEX "ShiftHandover_outgoingNurseId_idx" ON "ShiftHandover"("outgoingNurseId");

-- CreateIndex
CREATE INDEX "ShiftHandover_shiftType_shiftDate_idx" ON "ShiftHandover"("shiftType", "shiftDate");

-- CreateIndex
CREATE INDEX "Surgery_clinicId_scheduledStart_idx" ON "Surgery"("clinicId", "scheduledStart");

-- CreateIndex
CREATE INDEX "Surgery_surgeonId_idx" ON "Surgery"("surgeonId");

-- CreateIndex
CREATE INDEX "Surgery_otRoom_scheduledStart_idx" ON "Surgery"("otRoom", "scheduledStart");

-- CreateIndex
CREATE INDEX "Surgery_status_idx" ON "Surgery"("status");

-- CreateIndex
CREATE INDEX "Surgery_admissionId_idx" ON "Surgery"("admissionId");

-- CreateIndex
CREATE UNIQUE INDEX "IPDBill_admissionId_key" ON "IPDBill"("admissionId");

-- CreateIndex
CREATE INDEX "IPDBill_clinicId_idx" ON "IPDBill"("clinicId");

-- CreateIndex
CREATE INDEX "IPDBill_createdAt_idx" ON "IPDBill"("createdAt");

-- CreateIndex
CREATE INDEX "IPDBillItem_ipdBillId_date_idx" ON "IPDBillItem"("ipdBillId", "date");

-- CreateIndex
CREATE INDEX "IPDBillItem_category_idx" ON "IPDBillItem"("category");

-- CreateIndex
CREATE UNIQUE INDEX "TPARecord_admissionId_key" ON "TPARecord"("admissionId");

-- CreateIndex
CREATE INDEX "TPARecord_status_idx" ON "TPARecord"("status");

-- CreateIndex
CREATE INDEX "TPARecord_admissionId_idx" ON "TPARecord"("admissionId");

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_admittingDoctorId_fkey" FOREIGN KEY ("admittingDoctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_attendingDoctorId_fkey" FOREIGN KEY ("attendingDoctorId") REFERENCES "DoctorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalsLog" ADD CONSTRAINT "VitalsLog_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressNote" ADD CONSTRAINT "ProgressNote_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressNote" ADD CONSTRAINT "ProgressNote_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationOrder" ADD CONSTRAINT "MedicationOrder_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationOrder" ADD CONSTRAINT "MedicationOrder_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MAREntry" ADD CONSTRAINT "MAREntry_medicationOrderId_fkey" FOREIGN KEY ("medicationOrderId") REFERENCES "MedicationOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftHandover" ADD CONSTRAINT "ShiftHandover_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Surgery" ADD CONSTRAINT "Surgery_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Surgery" ADD CONSTRAINT "Surgery_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Surgery" ADD CONSTRAINT "Surgery_surgeonId_fkey" FOREIGN KEY ("surgeonId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Surgery" ADD CONSTRAINT "Surgery_anesthetistId_fkey" FOREIGN KEY ("anesthetistId") REFERENCES "DoctorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IPDBill" ADD CONSTRAINT "IPDBill_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IPDBill" ADD CONSTRAINT "IPDBill_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IPDBillItem" ADD CONSTRAINT "IPDBillItem_ipdBillId_fkey" FOREIGN KEY ("ipdBillId") REFERENCES "IPDBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TPARecord" ADD CONSTRAINT "TPARecord_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
