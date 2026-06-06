import { NextRequest, NextResponse } from 'next/server';

// Types for prescription creation
interface PrescriptionItemInput {
  medicineId: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
  stockAtPrescription?: number;
}

interface LabOrderInput {
  labTestId: string;
  notes?: string;
}

interface CreatePrescriptionInput {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  diagnosis?: string;
  notes?: string;
  vitals?: Record<string, string>;
  items: PrescriptionItemInput[];
  labOrders: LabOrderInput[];
  status: 'DRAFT' | 'FINALIZED' | 'SENT_TO_PHARMACY';
}

// POST - Create a new prescription
export async function POST(request: NextRequest) {
  try {
    const body: CreatePrescriptionInput = await request.json();

    // Validate required fields
    if (!body.patientId || !body.doctorId) {
      return NextResponse.json(
        { error: 'Patient ID and Doctor ID are required' },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one prescription item is required' },
        { status: 400 }
      );
    }

    // In production, this would be a Prisma transaction:
    // const prescription = await prisma.$transaction(async (tx) => {
    //   const rx = await tx.prescription.create({
    //     data: {
    //       patientId: body.patientId,
    //       doctorId: body.doctorId,
    //       appointmentId: body.appointmentId,
    //       diagnosis: body.diagnosis,
    //       notes: body.notes,
    //       vitals: body.vitals,
    //       status: body.status,
    //       items: {
    //         create: body.items.map(item => ({
    //           medicineId: item.medicineId,
    //           dosage: item.dosage,
    //           frequency: item.frequency,
    //           duration: item.duration,
    //           quantity: item.quantity,
    //           instructions: item.instructions || '',
    //           stockAtPrescription: item.stockAtPrescription || 0,
    //         })),
    //       },
    //       labOrders: {
    //         create: body.labOrders.map(order => ({
    //           patientId: body.patientId,
    //           labTestId: order.labTestId,
    //           notes: order.notes || '',
    //         })),
    //       },
    //     },
    //     include: {
    //       items: { include: { medicine: true } },
    //       labOrders: { include: { labTest: true } },
    //       patient: true,
    //       doctor: { include: { user: true } },
    //     },
    //   });
    //   return rx;
    // });

    // Mock response
    const mockPrescription = {
      id: `rx-${Date.now()}`,
      patientId: body.patientId,
      doctorId: body.doctorId,
      appointmentId: body.appointmentId || null,
      diagnosis: body.diagnosis || '',
      notes: body.notes || '',
      vitals: body.vitals || {},
      status: body.status,
      items: body.items.map((item, index) => ({
        id: `rxi-${Date.now()}-${index}`,
        ...item,
        dispensedQty: 0,
        isSubstituted: false,
        substituteNote: null,
      })),
      labOrders: body.labOrders.map((order, index) => ({
        id: `lo-${Date.now()}-${index}`,
        ...order,
        status: 'ORDERED',
        orderedAt: new Date().toISOString(),
      })),
      pdfUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        prescription: mockPrescription,
        message:
          body.status === 'SENT_TO_PHARMACY'
            ? 'Prescription finalized and sent to pharmacy'
            : 'Prescription saved as draft',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    );
  }
}

// GET - Fetch prescriptions
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const patientId = searchParams.get('patientId');
  const prescriptionId = searchParams.get('id');

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 150));

  if (prescriptionId) {
    // Fetch single prescription by ID
    // In production: prisma.prescription.findUnique({ where: { id: prescriptionId }, include: { ... } })
    return NextResponse.json({
      id: prescriptionId,
      status: 'FINALIZED',
      diagnosis: 'Upper Respiratory Tract Infection',
      notes: 'Rest and drink plenty of fluids. Follow up in 5 days if symptoms persist.',
      vitals: {
        bloodPressure: '120/80',
        temperature: '99.2',
        weight: '72',
        heartRate: '78',
        oxygenSaturation: '98',
      },
      items: [
        {
          id: 'rxi-1',
          medicineId: 'med-001',
          medicineName: 'Paracetamol 500mg',
          dosage: '1 tablet',
          frequency: 'Thrice daily',
          duration: '5 days',
          quantity: 15,
          instructions: 'After meals',
        },
        {
          id: 'rxi-2',
          medicineId: 'med-010',
          medicineName: 'Azithromycin 500mg',
          dosage: '1 tablet',
          frequency: 'Once daily',
          duration: '3 days',
          quantity: 3,
          instructions: 'Before breakfast',
        },
      ],
      labOrders: [
        {
          id: 'lo-1',
          labTestId: 'lt-1',
          labTestName: 'Complete Blood Count (CBC)',
          category: 'Blood',
          status: 'ORDERED',
        },
      ],
      createdAt: new Date().toISOString(),
    });
  }

  if (patientId) {
    // Fetch prescriptions for a patient
    // In production: prisma.prescription.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({
      prescriptions: [
        {
          id: 'rx-past-1',
          diagnosis: 'Seasonal Allergic Rhinitis',
          status: 'DISPENSED',
          itemCount: 2,
          createdAt: '2026-05-20T10:30:00Z',
        },
        {
          id: 'rx-past-2',
          diagnosis: 'Type 2 Diabetes - Routine',
          status: 'DISPENSED',
          itemCount: 3,
          createdAt: '2026-04-15T09:15:00Z',
        },
      ],
    });
  }

  return NextResponse.json({ error: 'Missing patientId or id parameter' }, { status: 400 });
}
