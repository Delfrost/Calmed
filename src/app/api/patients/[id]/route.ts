import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: Fetch a single patient with full history
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/patients/[id]'>
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        prescriptions: {
          include: {
            items: {
              include: { medicine: true },
            },
            labOrders: {
              include: { labTest: true },
            },
            doctor: {
              include: { user: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        appointments: {
          include: {
            doctor: {
              include: { user: true },
            },
          },
          orderBy: { date: 'desc' },
          take: 20,
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Verify the patient belongs to the same clinic as the logged-in user
    if (patient.clinicId !== session.user.clinicId) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error('Failed to fetch patient:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

// PATCH: Update patient demographics
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<'/api/patients/[id]'>
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    // Verify the patient exists and belongs to the same clinic
    const existing = await prisma.patient.findUnique({
      where: { id },
      select: { id: true, clinicId: true, phone: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    if (existing.clinicId !== session.user.clinicId) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      phone,
      email,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      allergies,
      chronicConditions,
      emergencyContactName,
      emergencyContactPhone,
    } = body;

    // If phone is being changed, check for duplicate in the same clinic
    if (phone && phone !== existing.phone) {
      const duplicate = await prisma.patient.findUnique({
        where: {
          clinicId_phone: { clinicId: session.user.clinicId, phone },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'Another patient with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email: email || null }),
        ...(dateOfBirth !== undefined && {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        }),
        ...(gender !== undefined && { gender: gender || null }),
        ...(bloodGroup !== undefined && { bloodGroup: bloodGroup || null }),
        ...(address !== undefined && { address: address || null }),
        ...(allergies !== undefined && { allergies }),
        ...(chronicConditions !== undefined && { chronicConditions }),
        ...(emergencyContactName !== undefined && {
          emergencyContactName: emergencyContactName || null,
        }),
        ...(emergencyContactPhone !== undefined && {
          emergencyContactPhone: emergencyContactPhone || null,
        }),
      },
    });

    return NextResponse.json({ patient });
  } catch (error) {
    console.error('Failed to update patient:', error);
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}
