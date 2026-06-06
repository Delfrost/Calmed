// ============================================================================
// Enums (mirroring Prisma schema)
// ============================================================================

export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  RECEPTIONIST = 'RECEPTIONIST',
  PHARMACIST = 'PHARMACIST',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum QueueStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
}

export enum PrescriptionStatus {
  DRAFT = 'DRAFT',
  FINALIZED = 'FINALIZED',
  SENT_TO_PHARMACY = 'SENT_TO_PHARMACY',
  PARTIALLY_DISPENSED = 'PARTIALLY_DISPENSED',
  DISPENSED = 'DISPENSED',
  CANCELLED = 'CANCELLED',
}

export enum BatchStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  RECALLED = 'RECALLED',
  DEPLETED = 'DEPLETED',
}

export enum StockMovementType {
  PURCHASE = 'PURCHASE',
  DISPENSED = 'DISPENSED',
  RETURNED = 'RETURNED',
  EXPIRED = 'EXPIRED',
  DAMAGED = 'DAMAGED',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  INSURANCE = 'INSURANCE',
}

export enum InvoiceItemType {
  CONSULTATION = 'CONSULTATION',
  MEDICINE = 'MEDICINE',
  LAB_TEST = 'LAB_TEST',
  PROCEDURE = 'PROCEDURE',
  OTHER = 'OTHER',
}

export enum LabOrderStatus {
  ORDERED = 'ORDERED',
  SAMPLE_COLLECTED = 'SAMPLE_COLLECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  CALCULATED = 'CALCULATED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
}

export enum RefillStatus {
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// Stock Status (derived, not in DB)
// ============================================================================

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

// ============================================================================
// Core Entity Types
// ============================================================================

export interface Patient {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  allergies: string[];
  chronicConditions: string[];
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Medicine {
  id: string;
  clinicId: string;
  name: string;
  genericName?: string | null;
  sku?: string | null;
  category: string;
  manufacturer?: string | null;
  dosageForm: string;
  strength?: string | null;
  requiresPrescription: boolean;
  reorderLevel: number;
  totalStock: number; // Computed: sum of active batch quantities
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MedicineBatch {
  id: string;
  medicineId: string;
  batchNumber: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  expiryDate: Date | string;
  manufacturedDate?: Date | string | null;
  status: BatchStatus;
  supplier?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MedicineSearchResult {
  id: string;
  name: string;
  genericName?: string | null;
  category: string;
  dosageForm: string;
  strength?: string | null;
  manufacturer?: string | null;
  totalStock: number;
  batches: {
    batchNumber: string;
    quantity: number;
    expiryDate: Date | string;
    sellingPrice: number;
  }[];
}

// ============================================================================
// Prescription Types
// ============================================================================

export interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string | null;
  stockStatus: StockStatus;
}

export interface LabTest {
  id: string;
  clinicId: string;
  name: string;
  category: string;
  description?: string | null;
  price: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LabOrder {
  labTestId: string;
  labTestName: string;
  notes?: string | null;
}

export interface Vitals {
  bp?: string;
  temp?: string;
  weight?: string;
  heartRate?: string;
  oxygenSaturation?: string;
}

export interface PrescriptionFormData {
  patientId: string;
  diagnosis: string;
  notes?: string;
  vitals: Vitals;
  items: PrescriptionItem[];
  labOrders: LabOrder[];
}

// ============================================================================
// User & Auth Types
// ============================================================================

export interface User {
  id: string;
  clinicId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialization: string;
  qualification?: string | null;
  licenseNumber: string;
  experience?: number | null;
  consultationDuration: number;
  isVisiting: boolean;
  revenueSplitPercent: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================================================
// Appointment & Queue Types
// ============================================================================

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  date: Date | string;
  timeSlot: string;
  status: AppointmentStatus;
  type: string;
  notes?: string | null;
  patient?: Patient;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface QueueToken {
  id: string;
  clinicId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  tokenNumber: number;
  status: QueueStatus;
  estimatedTime?: Date | string | null;
  calledAt?: Date | string | null;
  completedAt?: Date | string | null;
  channelId?: string | null;
  patient?: Patient;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================================================
// Billing Types
// ============================================================================

export interface Invoice {
  id: string;
  clinicId: string;
  invoiceNumber: string;
  patientId: string;
  appointmentId?: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  dueDate?: Date | string | null;
  paidAt?: Date | string | null;
  items?: InvoiceItem[];
  payments?: Payment[];
  patient?: Patient;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  type: InvoiceItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  referenceId?: string | null;
  referenceType?: string | null;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string | null;
  notes?: string | null;
  receivedBy: string;
  createdAt: Date | string;
}

// ============================================================================
// Doctor Payout Types
// ============================================================================

export interface DoctorPayout {
  id: string;
  clinicId: string;
  doctorId: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  totalConsultations: number;
  totalRevenue: number;
  doctorShare: number;
  clinicShare: number;
  splitPercent: number;
  status: PayoutStatus;
  paidAt?: Date | string | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================================================
// Navigation Types (used by layout components)
// ============================================================================

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
  badge?: number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

// ============================================================================
// UI Component Specific Types for Smart Prescription Pad
// ============================================================================

export interface PrescriptionItemData {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  stockStatus: StockStatus;
  availableStock: number;
}

export interface LabTestOption {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface LabOrderData {
  id: string;
  labTestId: string;
  labTestName: string;
  category: string;
  notes: string;
}

export interface VitalsData {
  bloodPressure: string;
  temperature: string;
  weight: string;
  heartRate: string;
  oxygenSaturation: string;
}

export interface PatientInfo {
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
}
