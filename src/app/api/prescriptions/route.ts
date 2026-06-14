import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: List prescriptions (filtered by doctorId, patientId, status)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');
    const id = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Fetch single prescription by ID
    if (id) {
      const prescription = await prisma.prescription.findUnique({
        where: { id },
        include: {
          patient: true,
          doctor: { include: { user: true } },
          items: {
            include: { medicine: true },
          },
          labOrders: {
            include: { labTest: true },
          },
        },
      });

      if (!prescription) {
        return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
      }

      return NextResponse.json({ prescription });
    }

    // List prescriptions with filters
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true, phone: true, gender: true, bloodGroup: true },
          },
          doctor: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          items: {
            include: { medicine: { select: { name: true, genericName: true } } },
          },
          labOrders: {
            include: { labTest: { select: { name: true, category: true } } },
          },
          _count: {
            select: { items: true, labOrders: true },
          },
        },
      }),
      prisma.prescription.count({ where }),
    ]);

    return NextResponse.json({
      prescriptions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Failed to fetch prescriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 });
  }
}

// POST: Create a new prescription (as DRAFT by default)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { patientId, doctorId, appointmentId, diagnosis, notes, vitals, items, labOrders } = body;

    if (!patientId || !doctorId) {
      return NextResponse.json({ error: 'patientId and doctorId are required' }, { status: 400 });
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Create prescription with items and lab orders in a transaction
    const prescription = await prisma.$transaction(async (tx) => {
      const rx = await tx.prescription.create({
        data: {
          patientId,
          doctorId,
          appointmentId: appointmentId || null,
          status: 'DRAFT',
          diagnosis: diagnosis || null,
          notes: notes || null,
          vitals: vitals || null,
          items: {
            create: (items || []).map((item: {
              medicineId: string;
              dosage: string;
              frequency: string;
              duration: string;
              quantity: number;
              instructions?: string;
              stockAtPrescription?: number;
            }) => ({
              medicineId: item.medicineId,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              quantity: item.quantity,
              instructions: item.instructions || null,
              stockAtPrescription: item.stockAtPrescription || 0,
            })),
          },
          labOrders: {
            create: (labOrders || []).map((lo: {
              labTestId: string;
              patientId?: string;
              notes?: string;
            }) => ({
              labTestId: lo.labTestId,
              patientId: patientId,
              notes: lo.notes || null,
            })),
          },
        },
        include: {
          patient: true,
          items: { include: { medicine: true } },
          labOrders: { include: { labTest: true } },
        },
      });

      return rx;
    });

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (error) {
    console.error('Failed to create prescription:', error);
    return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 });
  }
}
