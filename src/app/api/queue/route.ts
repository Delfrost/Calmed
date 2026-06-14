import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: Get today's queue tokens for the clinic
// Query params: ?doctorId=<id>
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get('doctorId');

  try {
    const clinicId = session.user.clinicId;

    // Build date range for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      clinicId,
      createdAt: { gte: todayStart, lte: todayEnd },
    };

    if (doctorId) {
      where.doctorId = doctorId;
    }

    const tokens = await prisma.queueToken.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            gender: true,
            dateOfBirth: true,
          },
        },
        appointment: {
          select: {
            id: true,
            date: true,
            timeSlot: true,
            status: true,
            type: true,
            notes: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { tokenNumber: 'asc' },
    });

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('Failed to fetch queue tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue tokens' },
      { status: 500 }
    );
  }
}

// POST: Issue a new queue token
// Body: { appointmentId, patientId, doctorId }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { appointmentId, patientId, doctorId } = body;

    if (!appointmentId || !patientId || !doctorId) {
      return NextResponse.json(
        { error: 'appointmentId, patientId, and doctorId are required' },
        { status: 400 }
      );
    }

    const clinicId = session.user.clinicId;

    // Verify the appointment exists and belongs to this clinic
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, clinicId: true, patientId: true, doctorId: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (appointment.clinicId !== clinicId) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if a queue token already exists for this appointment
    const existingToken = await prisma.queueToken.findUnique({
      where: { appointmentId },
    });
    if (existingToken) {
      return NextResponse.json(
        {
          error: 'A queue token already exists for this appointment',
          existingToken,
        },
        { status: 409 }
      );
    }

    // Calculate the next token number for today for this doctor
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const lastToken = await prisma.queueToken.findFirst({
      where: {
        clinicId,
        doctorId,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { tokenNumber: 'desc' },
      select: { tokenNumber: true },
    });

    const tokenNumber = (lastToken?.tokenNumber ?? 0) + 1;

    const queueToken = await prisma.queueToken.create({
      data: {
        clinicId,
        appointmentId,
        patientId,
        doctorId,
        tokenNumber,
        status: 'WAITING',
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            id: true,
            date: true,
            timeSlot: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json({ queueToken }, { status: 201 });
  } catch (error) {
    console.error('Failed to create queue token:', error);
    return NextResponse.json(
      { error: 'Failed to create queue token' },
      { status: 500 }
    );
  }
}
