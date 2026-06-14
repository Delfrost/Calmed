import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: List appointments for a date and optional doctorId
// Query params: ?date=YYYY-MM-DD&doctorId=<id>
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');
  const doctorId = searchParams.get('doctorId');

  try {
    // Build the where clause
    const where: Record<string, unknown> = {
      clinicId: session.user.clinicId,
    };

    if (dateStr) {
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = { gte: startOfDay, lte: endOfDay };
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    const appointments = await prisma.appointment.findMany({
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
        queueToken: {
          select: {
            id: true,
            tokenNumber: true,
            status: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Failed to fetch appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST: Create a new appointment and auto-create a QueueToken
// Body: { date, timeSlot, patientId, doctorId, type?, notes? }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { date, timeSlot, patientId, doctorId, type, notes } = body;

    if (!date || !timeSlot || !patientId || !doctorId) {
      return NextResponse.json(
        { error: 'date, timeSlot, patientId, and doctorId are required' },
        { status: 400 }
      );
    }

    const clinicId = session.user.clinicId;

    // Verify the patient belongs to this clinic
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found in this clinic' },
        { status: 404 }
      );
    }

    // Verify the doctor exists
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: { id: true, userId: true },
    });
    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    const appointmentDate = new Date(date);

    // Use a transaction to create both appointment and queue token atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create the appointment
      const appointment = await tx.appointment.create({
        data: {
          clinicId,
          patientId,
          doctorId,
          date: appointmentDate,
          timeSlot,
          type: type || 'CONSULTATION',
          notes: notes || null,
          status: 'SCHEDULED',
        },
      });

      // Calculate next token number for today for this doctor
      const todayStart = new Date(appointmentDate);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(appointmentDate);
      todayEnd.setHours(23, 59, 59, 999);

      const lastToken = await tx.queueToken.findFirst({
        where: {
          clinicId,
          doctorId,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
        orderBy: { tokenNumber: 'desc' },
        select: { tokenNumber: true },
      });

      const tokenNumber = (lastToken?.tokenNumber ?? 0) + 1;

      // Create the queue token
      const queueToken = await tx.queueToken.create({
        data: {
          clinicId,
          appointmentId: appointment.id,
          patientId,
          doctorId,
          tokenNumber,
          status: 'WAITING',
        },
      });

      return { appointment, queueToken };
    });

    return NextResponse.json(
      {
        appointment: result.appointment,
        queueToken: result.queueToken,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
