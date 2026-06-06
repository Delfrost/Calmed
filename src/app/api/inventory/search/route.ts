import { NextRequest, NextResponse } from 'next/server';

// Mock medicine data for development (until database is connected)
const MOCK_MEDICINES = [
  {
    id: 'med-001',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    strength: '500mg',
    manufacturer: 'Cipla Ltd',
    totalStock: 250,
    batches: [
      { batchNumber: 'PCM-2026-A1', quantity: 150, expiryDate: '2027-06-15', sellingPrice: 2.5 },
      { batchNumber: 'PCM-2026-B2', quantity: 100, expiryDate: '2027-09-20', sellingPrice: 2.5 },
    ],
  },
  {
    id: 'med-002',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin Trihydrate',
    category: 'Antibiotic',
    dosageForm: 'Capsule',
    strength: '500mg',
    manufacturer: 'Sun Pharma',
    totalStock: 85,
    batches: [
      { batchNumber: 'AMX-2026-C1', quantity: 50, expiryDate: '2027-03-10', sellingPrice: 8.0 },
      { batchNumber: 'AMX-2026-D2', quantity: 35, expiryDate: '2027-08-25', sellingPrice: 8.5 },
    ],
  },
  {
    id: 'med-003',
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    category: 'Antidiabetic',
    dosageForm: 'Tablet',
    strength: '500mg',
    manufacturer: 'USV Pvt Ltd',
    totalStock: 320,
    batches: [
      { batchNumber: 'MET-2026-E1', quantity: 200, expiryDate: '2028-01-15', sellingPrice: 3.0 },
      { batchNumber: 'MET-2026-F2', quantity: 120, expiryDate: '2027-11-30', sellingPrice: 3.0 },
    ],
  },
  {
    id: 'med-004',
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    category: 'Antidiabetic',
    dosageForm: 'Tablet',
    strength: '1000mg',
    manufacturer: 'USV Pvt Ltd',
    totalStock: 180,
    batches: [
      { batchNumber: 'MET1K-2026-A1', quantity: 180, expiryDate: '2028-02-28', sellingPrice: 5.5 },
    ],
  },
  {
    id: 'med-005',
    name: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    category: 'Antihypertensive',
    dosageForm: 'Tablet',
    strength: '5mg',
    manufacturer: 'Pfizer',
    totalStock: 15,
    batches: [
      { batchNumber: 'AML-2026-G1', quantity: 15, expiryDate: '2027-04-20', sellingPrice: 6.0 },
    ],
  },
  {
    id: 'med-006',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    category: 'Statin',
    dosageForm: 'Tablet',
    strength: '10mg',
    manufacturer: 'Ranbaxy',
    totalStock: 200,
    batches: [
      { batchNumber: 'ATV-2026-H1', quantity: 120, expiryDate: '2027-12-31', sellingPrice: 7.0 },
      { batchNumber: 'ATV-2026-I2', quantity: 80, expiryDate: '2028-03-15', sellingPrice: 7.5 },
    ],
  },
  {
    id: 'med-007',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    category: 'Statin',
    dosageForm: 'Tablet',
    strength: '20mg',
    manufacturer: 'Ranbaxy',
    totalStock: 0,
    batches: [],
  },
  {
    id: 'med-008',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    category: 'Proton Pump Inhibitor',
    dosageForm: 'Capsule',
    strength: '20mg',
    manufacturer: 'Dr Reddys',
    totalStock: 150,
    batches: [
      { batchNumber: 'OMP-2026-J1', quantity: 150, expiryDate: '2027-07-10', sellingPrice: 4.0 },
    ],
  },
  {
    id: 'med-009',
    name: 'Pantoprazole',
    genericName: 'Pantoprazole Sodium',
    category: 'Proton Pump Inhibitor',
    dosageForm: 'Tablet',
    strength: '40mg',
    manufacturer: 'Alkem Labs',
    totalStock: 90,
    batches: [
      { batchNumber: 'PNT-2026-K1', quantity: 90, expiryDate: '2027-05-25', sellingPrice: 5.0 },
    ],
  },
  {
    id: 'med-010',
    name: 'Azithromycin',
    genericName: 'Azithromycin Dihydrate',
    category: 'Antibiotic',
    dosageForm: 'Tablet',
    strength: '500mg',
    manufacturer: 'Zydus Cadila',
    totalStock: 60,
    batches: [
      { batchNumber: 'AZM-2026-L1', quantity: 60, expiryDate: '2027-10-15', sellingPrice: 15.0 },
    ],
  },
  {
    id: 'med-011',
    name: 'Cetirizine',
    genericName: 'Cetirizine Hydrochloride',
    category: 'Antihistamine',
    dosageForm: 'Tablet',
    strength: '10mg',
    manufacturer: 'Cipla Ltd',
    totalStock: 500,
    batches: [
      { batchNumber: 'CTZ-2026-M1', quantity: 300, expiryDate: '2028-06-30', sellingPrice: 1.5 },
      { batchNumber: 'CTZ-2026-N2', quantity: 200, expiryDate: '2028-04-15', sellingPrice: 1.5 },
    ],
  },
  {
    id: 'med-012',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    category: 'NSAID',
    dosageForm: 'Tablet',
    strength: '400mg',
    manufacturer: 'Abbott',
    totalStock: 8,
    batches: [
      { batchNumber: 'IBU-2026-O1', quantity: 8, expiryDate: '2027-02-28', sellingPrice: 3.5 },
    ],
  },
  {
    id: 'med-013',
    name: 'Losartan',
    genericName: 'Losartan Potassium',
    category: 'Antihypertensive',
    dosageForm: 'Tablet',
    strength: '50mg',
    manufacturer: 'Lupin',
    totalStock: 140,
    batches: [
      { batchNumber: 'LOS-2026-P1', quantity: 140, expiryDate: '2027-11-20', sellingPrice: 4.5 },
    ],
  },
  {
    id: 'med-014',
    name: 'Metoprolol',
    genericName: 'Metoprolol Succinate',
    category: 'Beta Blocker',
    dosageForm: 'Tablet',
    strength: '50mg',
    manufacturer: 'AstraZeneca',
    totalStock: 75,
    batches: [
      { batchNumber: 'MTP-2026-Q1', quantity: 75, expiryDate: '2027-08-10', sellingPrice: 6.5 },
    ],
  },
  {
    id: 'med-015',
    name: 'Montelukast',
    genericName: 'Montelukast Sodium',
    category: 'Leukotriene Inhibitor',
    dosageForm: 'Tablet',
    strength: '10mg',
    manufacturer: 'Sun Pharma',
    totalStock: 110,
    batches: [
      { batchNumber: 'MTK-2026-R1', quantity: 110, expiryDate: '2028-01-31', sellingPrice: 8.0 },
    ],
  },
  {
    id: 'med-016',
    name: 'Clopidogrel',
    genericName: 'Clopidogrel Bisulfate',
    category: 'Antiplatelet',
    dosageForm: 'Tablet',
    strength: '75mg',
    manufacturer: 'Torrent Pharma',
    totalStock: 95,
    batches: [
      { batchNumber: 'CLP-2026-S1', quantity: 95, expiryDate: '2027-09-15', sellingPrice: 9.0 },
    ],
  },
  {
    id: 'med-017',
    name: 'Aspirin',
    genericName: 'Acetylsalicylic Acid',
    category: 'Antiplatelet',
    dosageForm: 'Tablet',
    strength: '75mg',
    manufacturer: 'Bayer',
    totalStock: 400,
    batches: [
      { batchNumber: 'ASP-2026-T1', quantity: 250, expiryDate: '2028-05-20', sellingPrice: 1.0 },
      { batchNumber: 'ASP-2026-U2', quantity: 150, expiryDate: '2027-12-10', sellingPrice: 1.0 },
    ],
  },
  {
    id: 'med-018',
    name: 'Levothyroxine',
    genericName: 'Levothyroxine Sodium',
    category: 'Thyroid',
    dosageForm: 'Tablet',
    strength: '50mcg',
    manufacturer: 'Abbott',
    totalStock: 0,
    batches: [],
  },
  {
    id: 'med-019',
    name: 'Levothyroxine',
    genericName: 'Levothyroxine Sodium',
    category: 'Thyroid',
    dosageForm: 'Tablet',
    strength: '100mcg',
    manufacturer: 'Abbott',
    totalStock: 45,
    batches: [
      { batchNumber: 'LVT-2026-V1', quantity: 45, expiryDate: '2027-06-30', sellingPrice: 5.0 },
    ],
  },
  {
    id: 'med-020',
    name: 'Diclofenac',
    genericName: 'Diclofenac Sodium',
    category: 'NSAID',
    dosageForm: 'Tablet',
    strength: '50mg',
    manufacturer: 'Novartis',
    totalStock: 180,
    batches: [
      { batchNumber: 'DCL-2026-W1', quantity: 180, expiryDate: '2027-10-31', sellingPrice: 2.0 },
    ],
  },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.toLowerCase() || '';
  const clinicId = searchParams.get('clinicId') || '';

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // In production, this would use Prisma:
  // const medicines = await prisma.medicine.findMany({
  //   where: {
  //     clinicId,
  //     OR: [
  //       { name: { contains: query, mode: 'insensitive' } },
  //       { genericName: { contains: query, mode: 'insensitive' } },
  //     ],
  //   },
  //   include: {
  //     batches: {
  //       where: {
  //         status: 'ACTIVE',
  //         expiryDate: { gt: new Date() },
  //         quantity: { gt: 0 },
  //       },
  //       orderBy: { expiryDate: 'asc' },
  //     },
  //   },
  // });

  const results = MOCK_MEDICINES.filter(
    (med) =>
      med.name.toLowerCase().includes(query) ||
      (med.genericName && med.genericName.toLowerCase().includes(query)) ||
      med.category.toLowerCase().includes(query)
  );

  return NextResponse.json({ results });
}
