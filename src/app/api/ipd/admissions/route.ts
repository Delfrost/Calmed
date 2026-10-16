import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AdmissionStatus, AdmissionSource } from '@/types';

// GET: List admissions with filters
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as AdmissionStatus | null;
  const doctorId = searchParams.get('doctorId');
  const patientId = searchParams.get('patientId');
  const search = searchParams.get('search') || '';

  try {
    const where: any = {
      clinicId: session.user.clinicId,
      ...(status ? { status } : {}),
      ...(patientId ? { patientId } : {}),
      ...(doctorId
        ? {
            OR: [
              { admittingDoctorId: doctorId },
              { attendingDoctorId: doctorId },
            ],
          }
        : {}),
      ...(search
        ? {
            OR: [
              { admissionNumber: { contains: search, mode: 'insensitive' } },
              {
                patient: {
                  OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const admissions = await prisma.admission.findMany({
      where,
      include: {
        patient: true,
        admittingDoctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attendingDoctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        bed: {
          include: {
            room: {
              include: {
                ward: true,
              },
            },
          },
        },
        vitalsLogs: {
          orderBy: {
            recordedAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ admissions });
  } catch (error) {
    console.error('Failed to list admissions:', error);
    return NextResponse.json(
      { error: 'Failed to list admissions' },
      { status: 500 }
    );
  }
}

// POST: Create a new admission or admission request
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      patientId,
      admittingDoctorId,
      attendingDoctorId,
      bedId,
      status = 'REQUESTED',
      source = 'OPD',
      diagnosis,
      chiefComplaints,
      notes,
      appointmentId,
      expectedDischargeDate,
    } = body;

    if (!patientId || !admittingDoctorId) {
      return NextResponse.json(
        { error: 'patientId and admittingDoctorId are required' },
        { status: 400 }
      );
    }

    // Generate unique Admission Number
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const count = await prisma.admission.count({
      where: { clinicId: session.user.clinicId },
    });
    const admissionNumber = `ADM-${year}-${String(count + 1).padStart(4, '0')}-${randomSuffix}`;

    const result = await prisma.$transaction(async (tx) => {
      // If bed is assigned, check its status and mark it OCCUPIED
      if (bedId) {
        const bed = await tx.bed.findUnique({
          where: { id: bedId },
          include: { room: { include: { ward: true } } },
        });

        if (!bed) {
          throw new Error('Assigned bed not found');
        }

        if (bed.status === 'OCCUPIED' && status === 'ADMITTED') {
          throw new Error('Assigned bed is already occupied');
        }

        if (status === 'ADMITTED') {
          await tx.bed.update({
            where: { id: bedId },
            data: { status: 'OCCUPIED' },
          });
        }
      }

      // Create admission
      const admission = await tx.admission.create({
        data: {
          clinicId: session.user.clinicId,
          patientId,
          admittingDoctorId,
          attendingDoctorId: attendingDoctorId || admittingDoctorId,
          bedId: bedId || null,
          admissionNumber,
          status: status as AdmissionStatus,
          source: source as AdmissionSource,
          diagnosis,
          chiefComplaints,
          notes,
          appointmentId: appointmentId || null,
          admittedAt: status === 'ADMITTED' ? new Date() : null,
          expectedDischargeDate: expectedDischargeDate ? new Date(expectedDischargeDate) : null,
        },
      });

      // If admitted, create running bill skeleton
      if (status === 'ADMITTED') {
        await tx.iPDBill.create({
          data: {
            admissionId: admission.id,
            clinicId: session.user.clinicId,
            roomCharges: 0,
            doctorVisitFees: 0,
            nursingCharges: 0,
            pharmacyCharges: 0,
            surgeryCharges: 0,
            labCharges: 0,
            miscCharges: 0,
            totalAmount: 0,
            paidAmount: 0,
            balanceDue: 0,
          },
        });
      }

      return admission;
    });

    return NextResponse.json({ admission: result }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create admission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create admission' },
      { status: 500 }
    );
  }
}
