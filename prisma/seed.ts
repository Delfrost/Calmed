import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Truncate all tables to start fresh
  try {
    const tablenames = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"${name}"`)
      .join(', ');

    if (tables.length > 0) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
      console.log('✅ All tables truncated successfully.');
    }
  } catch (error) {
    console.warn('⚠️ Truncation failed, continuing without truncation:', error);
  }

  // ─── 1. Clinic ────────────────────────────────────────────────────
  const clinic = await prisma.clinic.create({
    data: {
      id: 'clinic-001',
      name: 'MedFlow Polyclinics',
      address: '42, MG Road, Sector 14, Gurugram, Haryana 122001',
      phone: '+91-124-4567890',
      email: 'contact@medflowclinic.in',
      consultationFee: 500,
      defaultDoctorSplit: 70,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
  });
  console.log('✅ Clinic created:', clinic.name);

  // ─── 2. Users ─────────────────────────────────────────────────────
  const passwordDoctor = await hash('doctor123', 12);
  const passwordReceptionist = await hash('reception123', 12);
  const passwordPharmacist = await hash('pharma123', 12);
  const passwordAdmin = await hash('admin123', 12);

  const doctor = await prisma.user.create({
    data: {
      id: 'user-doctor-01',
      clinicId: clinic.id,
      email: 'doctor@medflow.in',
      passwordHash: passwordDoctor,
      firstName: 'Anand',
      lastName: 'Sharma',
      phone: '+91-9876543210',
      role: 'DOCTOR',
      isActive: true,
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      id: 'user-doctor-02',
      clinicId: clinic.id,
      email: 'priya@medflow.in',
      passwordHash: passwordDoctor,
      firstName: 'Priya',
      lastName: 'Mehta',
      phone: '+91-9876543211',
      role: 'DOCTOR',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      id: 'user-receptionist-01',
      clinicId: clinic.id,
      email: 'receptionist@medflow.in',
      passwordHash: passwordReceptionist,
      firstName: 'Sunita',
      lastName: 'Devi',
      phone: '+91-9876543220',
      role: 'RECEPTIONIST',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      id: 'user-pharmacist-01',
      clinicId: clinic.id,
      email: 'pharmacist@medflow.in',
      passwordHash: passwordPharmacist,
      firstName: 'Amit',
      lastName: 'Patel',
      phone: '+91-9876543230',
      role: 'PHARMACIST',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      id: 'user-admin-01',
      clinicId: clinic.id,
      email: 'admin@medflow.in',
      passwordHash: passwordAdmin,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+91-9876543240',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ 5 users created (doctor x2, receptionist, pharmacist, admin)');

  // ─── 3. Doctor Profiles ───────────────────────────────────────────
  const doctorProfile1 = await prisma.doctorProfile.create({
    data: {
      id: 'dp-01',
      userId: doctor.id,
      specialization: 'Cardiology',
      qualification: 'MD, DM Cardiology (AIIMS Delhi)',
      licenseNumber: 'MCI-2015-KA-28451',
      experience: 12,
      consultationDuration: 15,
      isVisiting: false,
      revenueSplitPercent: 70,
    },
  });

  const doctorProfile2 = await prisma.doctorProfile.create({
    data: {
      id: 'dp-02',
      userId: doctor2.id,
      specialization: 'Dermatology',
      qualification: 'MD Dermatology (KEM Mumbai)',
      licenseNumber: 'MCI-2018-MH-39214',
      experience: 8,
      consultationDuration: 20,
      isVisiting: true,
      revenueSplitPercent: 65,
    },
  });

  console.log('✅ Doctor profiles created');

  // ─── 4. Patients ──────────────────────────────────────────────────
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        id: 'patient-01',
        clinicId: clinic.id,
        firstName: 'Rajesh',
        lastName: 'Kumar',
        phone: '+91-9811111111',
        email: 'rajesh.kumar@email.com',
        dateOfBirth: new Date('1981-03-15'),
        gender: 'Male',
        bloodGroup: 'B+',
        address: '12, Sector 22, Noida, UP',
        allergies: ['Penicillin', 'Sulfa drugs'],
        chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
      },
    }),
    prisma.patient.create({
      data: {
        id: 'patient-02',
        clinicId: clinic.id,
        firstName: 'Meena',
        lastName: 'Sharma',
        phone: '+91-9811111112',
        email: 'meena.sharma@email.com',
        dateOfBirth: new Date('1975-07-22'),
        gender: 'Female',
        bloodGroup: 'O+',
        address: '56, DLF Phase 3, Gurugram',
        allergies: [],
        chronicConditions: ['Hypothyroidism'],
      },
    }),
    prisma.patient.create({
      data: {
        id: 'patient-03',
        clinicId: clinic.id,
        firstName: 'Amit',
        lastName: 'Singh',
        phone: '+91-9811111113',
        dateOfBirth: new Date('1992-11-05'),
        gender: 'Male',
        bloodGroup: 'A+',
        address: '78, Sector 15, Faridabad',
        allergies: ['Aspirin'],
        chronicConditions: [],
      },
    }),
    prisma.patient.create({
      data: {
        id: 'patient-04',
        clinicId: clinic.id,
        firstName: 'Priya',
        lastName: 'Gupta',
        phone: '+91-9811111114',
        dateOfBirth: new Date('1988-01-30'),
        gender: 'Female',
        bloodGroup: 'AB+',
        address: '23, Lajpat Nagar, Delhi',
        allergies: [],
        chronicConditions: ['Asthma'],
      },
    }),
  ]);

  console.log('✅ 4 patients created');

  // ─── 5. Medicines ─────────────────────────────────────────────────
  const medicinesData = [
    { name: 'Paracetamol', genericName: 'Acetaminophen', category: 'Analgesic', manufacturer: 'Cipla Ltd', dosageForm: 'Tablet', strength: '500mg', sku: 'MED-001', batches: [{ batchNumber: 'PCM-2026-A1', quantity: 200, costPrice: 1.50, sellingPrice: 2.50, expiryDate: new Date('2027-06-30') }] },
    { name: 'Metformin', genericName: 'Metformin HCl', category: 'Antidiabetic', manufacturer: 'USV Pvt Ltd', dosageForm: 'Tablet', strength: '500mg', sku: 'MED-002', batches: [{ batchNumber: 'MET-2026-B1', quantity: 150, costPrice: 2.00, sellingPrice: 3.80, expiryDate: new Date('2027-09-30') }] },
    { name: 'Amlodipine', genericName: 'Amlodipine Besylate', category: 'Antihypertensive', manufacturer: 'Sun Pharma', dosageForm: 'Tablet', strength: '5mg', sku: 'MED-003', batches: [{ batchNumber: 'AML-2026-C1', quantity: 180, costPrice: 3.00, sellingPrice: 5.50, expiryDate: new Date('2027-12-31') }] },
    { name: 'Cetirizine', genericName: 'Cetirizine Dihydrochloride', category: 'Antihistamine', manufacturer: 'Dr Reddy\'s', dosageForm: 'Tablet', strength: '10mg', sku: 'MED-004', batches: [{ batchNumber: 'CET-2026-D1', quantity: 300, costPrice: 1.20, sellingPrice: 2.00, expiryDate: new Date('2028-03-31') }] },
    { name: 'Amoxicillin', genericName: 'Amoxicillin Trihydrate', category: 'Antibiotic', manufacturer: 'Cipla Ltd', dosageForm: 'Capsule', strength: '500mg', sku: 'MED-005', batches: [{ batchNumber: 'AMX-2026-E1', quantity: 120, costPrice: 4.00, sellingPrice: 7.00, expiryDate: new Date('2027-08-31') }] },
    { name: 'Azithromycin', genericName: 'Azithromycin Dihydrate', category: 'Antibiotic', manufacturer: 'Zydus Cadila', dosageForm: 'Tablet', strength: '500mg', sku: 'MED-006', batches: [{ batchNumber: 'AZI-2026-F1', quantity: 80, costPrice: 12.00, sellingPrice: 18.50, expiryDate: new Date('2027-10-31') }] },
    { name: 'Omeprazole', genericName: 'Omeprazole', category: 'Antacid', manufacturer: 'Mankind Pharma', dosageForm: 'Capsule', strength: '20mg', sku: 'MED-007', batches: [{ batchNumber: 'OMP-2026-G1', quantity: 250, costPrice: 2.50, sellingPrice: 4.50, expiryDate: new Date('2027-11-30') }] },
    { name: 'Atorvastatin', genericName: 'Atorvastatin Calcium', category: 'Lipid Lowering', manufacturer: 'Lupin Ltd', dosageForm: 'Tablet', strength: '10mg', sku: 'MED-008', batches: [{ batchNumber: 'ATV-2026-H1', quantity: 160, costPrice: 5.00, sellingPrice: 8.50, expiryDate: new Date('2027-07-31') }] },
    { name: 'Montelukast', genericName: 'Montelukast Sodium', category: 'Anti-asthmatic', manufacturer: 'Sun Pharma', dosageForm: 'Tablet', strength: '10mg', sku: 'MED-009', batches: [{ batchNumber: 'MNT-2026-I1', quantity: 100, costPrice: 6.00, sellingPrice: 10.00, expiryDate: new Date('2028-01-31') }] },
    { name: 'Losartan', genericName: 'Losartan Potassium', category: 'Antihypertensive', manufacturer: 'Torrent Pharma', dosageForm: 'Tablet', strength: '50mg', sku: 'MED-010', batches: [{ batchNumber: 'LOS-2026-J1', quantity: 140, costPrice: 3.50, sellingPrice: 6.00, expiryDate: new Date('2027-05-31') }] },
    { name: 'Pantoprazole', genericName: 'Pantoprazole Sodium', category: 'Antacid', manufacturer: 'Alkem Labs', dosageForm: 'Tablet', strength: '40mg', sku: 'MED-011', batches: [{ batchNumber: 'PNT-2026-K1', quantity: 220, costPrice: 3.00, sellingPrice: 5.50, expiryDate: new Date('2028-02-28') }] },
    { name: 'Levothyroxine', genericName: 'Levothyroxine Sodium', category: 'Thyroid', manufacturer: 'Abbott India', dosageForm: 'Tablet', strength: '50mcg', sku: 'MED-012', batches: [{ batchNumber: 'LVT-2026-L1', quantity: 90, costPrice: 4.00, sellingPrice: 7.50, expiryDate: new Date('2027-09-30') }] },
    { name: 'Clopidogrel', genericName: 'Clopidogrel Bisulfate', category: 'Antiplatelet', manufacturer: 'Cipla Ltd', dosageForm: 'Tablet', strength: '75mg', sku: 'MED-013', batches: [{ batchNumber: 'CLP-2026-M1', quantity: 110, costPrice: 7.00, sellingPrice: 12.00, expiryDate: new Date('2027-08-31') }] },
    { name: 'Metoprolol', genericName: 'Metoprolol Succinate', category: 'Beta Blocker', manufacturer: 'Torrent Pharma', dosageForm: 'Tablet', strength: '25mg', sku: 'MED-014', batches: [{ batchNumber: 'MTP-2026-N1', quantity: 130, costPrice: 3.50, sellingPrice: 6.50, expiryDate: new Date('2028-04-30') }] },
    { name: 'Ibuprofen', genericName: 'Ibuprofen', category: 'NSAID', manufacturer: 'Dr Reddy\'s', dosageForm: 'Tablet', strength: '400mg', sku: 'MED-015', batches: [{ batchNumber: 'IBU-2026-O1', quantity: 5, costPrice: 1.80, sellingPrice: 3.00, expiryDate: new Date('2027-04-30') }] },
    { name: 'Dolo 650', genericName: 'Paracetamol', category: 'Analgesic', manufacturer: 'Micro Labs', dosageForm: 'Tablet', strength: '650mg', sku: 'MED-016', batches: [{ batchNumber: 'DLO-2026-P1', quantity: 350, costPrice: 1.80, sellingPrice: 3.20, expiryDate: new Date('2028-06-30') }] },
  ];

  for (const med of medicinesData) {
    const { batches, ...medData } = med;
    await prisma.medicine.create({
      data: {
        clinicId: clinic.id,
        ...medData,
        batches: {
          create: batches.map((b) => ({
            ...b,
            costPrice: b.costPrice,
            sellingPrice: b.sellingPrice,
            status: 'ACTIVE',
          })),
        },
      },
    });
  }

  console.log('✅ 16 medicines created with batches');

  // ─── 6. Lab Tests ─────────────────────────────────────────────────
  await prisma.labTest.createMany({
    data: [
      { id: 'lt-01', clinicId: clinic.id, name: 'Complete Blood Count (CBC)', category: 'Blood', description: 'Full blood count including WBC, RBC, platelets, hemoglobin', price: 350 },
      { id: 'lt-02', clinicId: clinic.id, name: 'Lipid Profile', category: 'Blood', description: 'Total cholesterol, LDL, HDL, triglycerides', price: 600 },
      { id: 'lt-03', clinicId: clinic.id, name: 'HbA1c', category: 'Blood', description: 'Glycated hemoglobin for 3-month glucose average', price: 500 },
      { id: 'lt-04', clinicId: clinic.id, name: 'Thyroid Panel (T3/T4/TSH)', category: 'Blood', description: 'Comprehensive thyroid function test', price: 800 },
      { id: 'lt-05', clinicId: clinic.id, name: 'Kidney Function Test (KFT)', category: 'Blood', description: 'BUN, creatinine, uric acid, electrolytes', price: 550 },
      { id: 'lt-06', clinicId: clinic.id, name: 'Liver Function Test (LFT)', category: 'Blood', description: 'SGOT, SGPT, bilirubin, alkaline phosphatase', price: 500 },
      { id: 'lt-07', clinicId: clinic.id, name: 'Urine Routine & Microscopy', category: 'Urine', description: 'Physical, chemical, and microscopic examination', price: 200 },
      { id: 'lt-08', clinicId: clinic.id, name: 'Chest X-Ray', category: 'Imaging', description: 'PA view chest radiograph', price: 400 },
      { id: 'lt-09', clinicId: clinic.id, name: 'ECG (12-Lead)', category: 'Cardiology', description: '12-lead electrocardiogram', price: 300 },
      { id: 'lt-10', clinicId: clinic.id, name: 'Blood Glucose Fasting', category: 'Blood', description: 'Fasting blood sugar level', price: 100 },
    ],
  });

  console.log('✅ 10 lab tests created');

  // ─── 7. Sample Appointments for Today ─────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        id: 'appt-01',
        clinicId: clinic.id,
        patientId: 'patient-01',
        doctorId: doctorProfile1.id,
        date: today,
        timeSlot: '09:00-09:15',
        status: 'CHECKED_IN',
        type: 'CONSULTATION',
        notes: 'Follow-up for diabetes management',
      },
    }),
    prisma.appointment.create({
      data: {
        id: 'appt-02',
        clinicId: clinic.id,
        patientId: 'patient-02',
        doctorId: doctorProfile1.id,
        date: today,
        timeSlot: '09:15-09:30',
        status: 'SCHEDULED',
        type: 'CONSULTATION',
      },
    }),
    prisma.appointment.create({
      data: {
        id: 'appt-03',
        clinicId: clinic.id,
        patientId: 'patient-03',
        doctorId: doctorProfile1.id,
        date: today,
        timeSlot: '09:30-09:45',
        status: 'SCHEDULED',
        type: 'FOLLOW_UP',
        notes: 'Post-treatment follow-up',
      },
    }),
    prisma.appointment.create({
      data: {
        id: 'appt-04',
        clinicId: clinic.id,
        patientId: 'patient-04',
        doctorId: doctorProfile2.id,
        date: today,
        timeSlot: '10:00-10:20',
        status: 'SCHEDULED',
        type: 'CONSULTATION',
        notes: 'Skin allergy consultation',
      },
    }),
  ]);

  console.log('✅ 4 appointments created for today');

  // ─── 8. Queue Tokens ──────────────────────────────────────────────
  await prisma.queueToken.create({
    data: {
      clinicId: clinic.id,
      appointmentId: appointments[0].id,
      patientId: 'patient-01',
      doctorId: doctorProfile1.id,
      tokenNumber: 1,
      status: 'WAITING',
      estimatedTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM
      channelId: `queue-${doctorProfile1.id}-${today.toISOString().split('T')[0]}`,
    },
  });

  await prisma.queueToken.create({
    data: {
      clinicId: clinic.id,
      appointmentId: appointments[1].id,
      patientId: 'patient-02',
      doctorId: doctorProfile1.id,
      tokenNumber: 2,
      status: 'WAITING',
      estimatedTime: new Date(today.getTime() + 9.25 * 60 * 60 * 1000), // 9:15 AM
      channelId: `queue-${doctorProfile1.id}-${today.toISOString().split('T')[0]}`,
    },
  });

  console.log('✅ 2 queue tokens created');

  // ─── 9. Sample Prescription (Draft) ───────────────────────────────
  await prisma.prescription.create({
    data: {
      id: 'rx-draft-01',
      patientId: 'patient-01',
      doctorId: doctorProfile1.id,
      status: 'DRAFT',
      diagnosis: 'Uncontrolled Type 2 Diabetes Mellitus',
      notes: 'Patient reports increased thirst and frequent urination. HbA1c review pending.',
      vitals: { bp: '140/90', temp: '98.4', weight: '82', heartRate: '78', oxygenSaturation: '97' },
      items: {
        create: [
          {
            medicineId: (await prisma.medicine.findFirst({ where: { name: 'Metformin' } }))!.id,
            dosage: '500mg',
            frequency: 'Twice daily',
            duration: '30 days',
            quantity: 60,
            instructions: 'After meals',
            stockAtPrescription: 150,
          },
          {
            medicineId: (await prisma.medicine.findFirst({ where: { name: 'Amlodipine' } }))!.id,
            dosage: '5mg',
            frequency: 'Once daily',
            duration: '30 days',
            quantity: 30,
            instructions: 'Morning, empty stomach',
            stockAtPrescription: 180,
          },
        ],
      },
    },
  });

  console.log('✅ 1 draft prescription created');

  // ─── 10. Nurse User ────────────────────────────────────────────────
  const passwordNurse = await hash('nurse123', 12);
  const nurse = await prisma.user.create({
    data: {
      id: 'user-nurse-01',
      clinicId: clinic.id,
      email: 'nurse@medflow.in',
      passwordHash: passwordNurse,
      firstName: 'Mary',
      lastName: 'Sister',
      phone: '+91-9876543250',
      role: 'NURSE',
      isActive: true,
    },
  });
  console.log('✅ Nurse user created:', nurse.email);

  // ─── 11. Wards, Rooms & Beds ────────────────────────────────────────
  // General Ward
  const generalWard = await prisma.ward.create({
    data: {
      id: 'ward-general',
      clinicId: clinic.id,
      name: 'General Ward A',
      type: 'GENERAL',
      floor: 1,
    },
  });

  const room101 = await prisma.room.create({
    data: {
      id: 'room-101',
      wardId: generalWard.id,
      number: '101',
      dailyRate: 1200,
    },
  });

  const room102 = await prisma.room.create({
    data: {
      id: 'room-102',
      wardId: generalWard.id,
      number: '102',
      dailyRate: 1200,
    },
  });

  await prisma.bed.createMany({
    data: [
      { id: 'bed-101-a', roomId: room101.id, label: 'Bed A', status: 'OCCUPIED' },
      { id: 'bed-101-b', roomId: room101.id, label: 'Bed B', status: 'VACANT' },
      { id: 'bed-102-a', roomId: room102.id, label: 'Bed A', status: 'VACANT' },
      { id: 'bed-102-b', roomId: room102.id, label: 'Bed B', status: 'VACANT' },
    ],
  });

  // Private Ward
  const privateWard = await prisma.ward.create({
    data: {
      id: 'ward-private',
      clinicId: clinic.id,
      name: 'Deluxe Private Ward',
      type: 'PRIVATE',
      floor: 2,
    },
  });

  const room201 = await prisma.room.create({
    data: {
      id: 'room-201',
      wardId: privateWard.id,
      number: '201',
      dailyRate: 4500,
    },
  });

  await prisma.bed.createMany({
    data: [
      { id: 'bed-201-a', roomId: room201.id, label: 'Bed A', status: 'OCCUPIED' },
      { id: 'bed-201-b', roomId: room201.id, label: 'Bed B', status: 'VACANT' },
    ],
  });

  // ICU Ward
  const icuWard = await prisma.ward.create({
    data: {
      id: 'ward-icu',
      clinicId: clinic.id,
      name: 'Intensive Care Unit',
      type: 'ICU',
      floor: 3,
    },
  });

  const room301 = await prisma.room.create({
    data: {
      id: 'room-301',
      wardId: icuWard.id,
      number: '301',
      dailyRate: 9500,
    },
  });

  await prisma.bed.createMany({
    data: [
      { id: 'bed-301-a', roomId: room301.id, label: 'Bed A', status: 'VACANT' },
      { id: 'bed-301-b', roomId: room301.id, label: 'Bed B', status: 'VACANT' },
    ],
  });

  console.log('✅ Wards, Rooms, and Beds hierarchy seeded');

  // ─── 12. Active Admissions (ADT) ──────────────────────────────────
  const admission1 = await prisma.admission.create({
    data: {
      id: 'adm-01',
      clinicId: clinic.id,
      patientId: 'patient-01',
      admittingDoctorId: doctorProfile1.id,
      attendingDoctorId: doctorProfile1.id,
      bedId: 'bed-101-a',
      admissionNumber: 'ADM-2026-0001-9872',
      status: 'ADMITTED',
      source: 'OPD',
      admittedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // Admitted 2 days ago
      diagnosis: 'Severe chest pain / Observation',
      chiefComplaints: 'Shortness of breath and palpitations',
      notes: 'Evaluate cardiac markers and monitor ECG.',
    },
  });

  const admission2 = await prisma.admission.create({
    data: {
      id: 'adm-02',
      clinicId: clinic.id,
      patientId: 'patient-02',
      admittingDoctorId: doctorProfile1.id,
      attendingDoctorId: doctorProfile2.id,
      bedId: 'bed-201-a',
      admissionNumber: 'ADM-2026-0002-3841',
      status: 'ADMITTED',
      source: 'EMERGENCY',
      admittedAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), // Admitted 1 day ago
      diagnosis: 'Cellulitis / Lower limb skin infection',
      chiefComplaints: 'Swelling and redness on left calf',
    },
  });

  console.log('✅ 2 active admissions created');

  // ─── 13. Clinical Logs (Vitals & Progress Notes) ──────────────────
  // Vitals logs
  await prisma.vitalsLog.createMany({
    data: [
      {
        admissionId: admission1.id,
        temperature: 98.6,
        systolicBP: 130,
        diastolicBP: 85,
        heartRate: 82,
        spO2: 97,
        respiratoryRate: 18,
        painScale: 2,
        notes: 'Resting comfortably.',
        recordedBy: nurse.id,
        recordedAt: new Date(today.getTime() - 12 * 60 * 60 * 1000),
      },
      {
        admissionId: admission1.id,
        temperature: 99.1,
        systolicBP: 135,
        diastolicBP: 90,
        heartRate: 88,
        spO2: 95,
        respiratoryRate: 20,
        painScale: 4,
        notes: 'Complaining of mild dyspnea.',
        recordedBy: nurse.id,
        recordedAt: new Date(),
      },
    ],
  });

  // Progress Note
  await prisma.progressNote.create({
    data: {
      admissionId: admission1.id,
      doctorId: doctorProfile1.id,
      content: 'Patient assessed during morning rounds. Chest pain is non-exertional. ECG shows normal sinus rhythm without acute changes.',
      assessment: 'R/O Angina',
      plan: 'Continue telemetry monitoring. Keep NPO for stress test tomorrow.',
    },
  });

  console.log('✅ Inpatient vitals flowsheet & rounds notes seeded');

  // ─── 14. Medication Orders & MAR ─────────────────────────────────
  const pcmMed = await prisma.medicine.findFirst({ where: { name: 'Paracetamol' } });
  if (pcmMed) {
    const medOrder = await prisma.medicationOrder.create({
      data: {
        admissionId: admission1.id,
        medicineId: pcmMed.id,
        dosage: '500mg',
        frequency: 'Every 12 hours',
        route: 'ORAL',
        startDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
        instructions: 'After meals',
        orderedBy: doctor.id,
      },
    });

    await prisma.mAREntry.createMany({
      data: [
        {
          medicationOrderId: medOrder.id,
          scheduledTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // yesterday 9 AM
          status: 'ADMINISTERED',
          administeredAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000),
          administeredBy: nurse.id,
          notes: 'Administered after breakfast.',
        },
        {
          medicationOrderId: medOrder.id,
          scheduledTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000), // yesterday 9 PM
          status: 'ADMINISTERED',
          administeredAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 21.2 * 60 * 60 * 1000),
          administeredBy: nurse.id,
          notes: 'Given with water.',
        },
        {
          medicationOrderId: medOrder.id,
          scheduledTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // today 9 AM
          status: 'SCHEDULED',
        },
        {
          medicationOrderId: medOrder.id,
          scheduledTime: new Date(today.getTime() + 21 * 60 * 60 * 1000), // today 9 PM
          status: 'SCHEDULED',
        },
      ],
    });
  }

  // ─── 15. Shift Handovers ──────────────────────────────────────────
  await prisma.shiftHandover.create({
    data: {
      admissionId: admission1.id,
      shiftType: 'MORNING',
      shiftDate: today,
      criticalNotes: 'Keep NPO for diagnostic stress test at 11am. Monitor SpO2 closely.',
      generalNotes: 'Patient was anxious during night shift but slept after reassurance.',
      outgoingNurseId: nurse.id,
      acknowledgedAt: new Date(),
      incomingNurseId: nurse.id,
    },
  });

  // ─── 16. OT Scheduled Surgery ─────────────────────────────────────
  await prisma.surgery.create({
    data: {
      id: 'surgery-01',
      admissionId: admission1.id,
      clinicId: clinic.id,
      name: 'Diagnostic Coronary Angiography',
      surgeonId: doctorProfile1.id,
      anesthetistId: doctorProfile2.id,
      otRoom: 'OT-1',
      scheduledStart: new Date(today.getTime() + 18 * 60 * 60 * 1000), // today 6 PM
      scheduledEnd: new Date(today.getTime() + 19 * 60 * 60 * 1000),   // today 7 PM
      estimatedCost: 18000,
      notes: 'Prepare cardiac OT setting.',
      status: 'SCHEDULED',
    },
  });

  // ─── 17. IPD Bills ────────────────────────────────────────────────
  const bill1 = await prisma.iPDBill.create({
    data: {
      id: 'bill-ipd-01',
      admissionId: admission1.id,
      clinicId: clinic.id,
      roomCharges: 2400, // 2 days x 1200
      doctorVisitFees: 1000,
      nursingCharges: 400,
      pharmacyCharges: 250,
      surgeryCharges: 0,
      labCharges: 350,
      miscCharges: 100,
      totalAmount: 4500,
      paidAmount: 1500,
      balanceDue: 3000,
      lastAccruedAt: today,
    },
  });

  await prisma.iPDBillItem.createMany({
    data: [
      { ipdBillId: bill1.id, category: 'ROOM', description: 'Room Rent: Room 101 - General Ward', quantity: 2, unitPrice: 1200, totalPrice: 2400, date: new Date(today.getTime() - 24 * 60 * 60 * 1000) },
      { ipdBillId: bill1.id, category: 'DOCTOR_VISIT', description: 'Doctor rounds fee - Dr. Anand Sharma', quantity: 2, unitPrice: 500, totalPrice: 1000, date: new Date(today.getTime() - 24 * 60 * 60 * 1000) },
      { ipdBillId: bill1.id, category: 'LAB', description: 'Complete Blood Count (CBC) test charges', quantity: 1, unitPrice: 350, totalPrice: 350, date: new Date(today.getTime() - 24 * 60 * 60 * 1000) },
    ],
  });

  const bill2 = await prisma.iPDBill.create({
    data: {
      id: 'bill-ipd-02',
      admissionId: admission2.id,
      clinicId: clinic.id,
      roomCharges: 4500, // 1 day x 4500
      totalAmount: 4500,
      balanceDue: 4500,
      lastAccruedAt: today,
    },
  });

  await prisma.iPDBillItem.create({
    data: {
      ipdBillId: bill2.id,
      category: 'ROOM',
      description: 'Room Rent: Room 201 - Private Deluxe',
      quantity: 1,
      unitPrice: 4500,
      totalPrice: 4500,
      date: new Date(today.getTime() - 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ IPD Bills & itemized ledger entries seeded');

  // ─── 18. TPA Insurance Records ────────────────────────────────────
  await prisma.tPARecord.create({
    data: {
      admissionId: admission2.id,
      insurerName: 'Star Health Insurance',
      policyNumber: 'STAR-IPD-98721A',
      tpaName: 'Medi Assist',
      memberId: 'STAR-MEM-77218',
      preAuthAmount: 50000,
      approvedAmount: 40000,
      status: 'PRE_AUTH_APPROVED',
      notes: 'Pre-auth approved. Original ID card copies collected.',
    },
  });

  console.log('✅ TPA Insurance claim tracking records seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('  Doctor 1:      doctor@medflow.in      / doctor123');
  console.log('  Doctor 2:      priya@medflow.in       / doctor123');
  console.log('  Receptionist:  receptionist@medflow.in / reception123');
  console.log('  Pharmacist:    pharmacist@medflow.in   / pharma123');
  console.log('  Admin:         admin@medflow.in        / admin123');
  console.log('  Nurse:         nurse@medflow.in        / nurse123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
