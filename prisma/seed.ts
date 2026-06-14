import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

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

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('  Doctor 1:      doctor@medflow.in      / doctor123');
  console.log('  Doctor 2:      priya@medflow.in       / doctor123');
  console.log('  Receptionist:  receptionist@medflow.in / reception123');
  console.log('  Pharmacist:    pharmacist@medflow.in   / pharma123');
  console.log('  Admin:         admin@medflow.in        / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
