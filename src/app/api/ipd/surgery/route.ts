import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { SurgeryStatus } from '@/types';

// GET: Fetch surgery schedule with filters
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');
  const otRoom = searchParams.get('otRoom');
  const surgeonId = searchParams.get('surgeonId');
  const admissionId = searchParams.get('admissionId');

  try {
    const where: any = {
      clinicId: session.user.clinicId,
      ...(otRoom ? { otRoom } : {}),
      ...(surgeonId ? { surgeonId } : {}),
      ...(admissionId ? { admissionId } : {}),
    };

    if (dateStr) {
      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
      where.scheduledStart = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const surgeries = await prisma.surgery.findMany({
      where,
      include: {
        admission: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
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
          },
        },
        surgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        anesthetist: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    return NextResponse.json({ surgeries });
  } catch (error) {
    console.error('Failed to fetch surgeries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch surgeries' },
      { status: 500 }
    );
  }
}

// POST: Schedule a new surgery with clash checking
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      admissionId,
      name,
      surgeonId,
      anesthetistId,
      otRoom,
      scheduledStart,
      scheduledEnd,
      estimatedCost,
      notes,
    } = body;

    if (!admissionId || !name || !surgeonId || !otRoom || !scheduledStart || !scheduledEnd) {
      return NextResponse.json(
        { error: 'admissionId, name, surgeonId, otRoom, scheduledStart and scheduledEnd are required' },
        { status: 400 }
      );
    }

    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);

    if (start >= end) {
      return NextResponse.json(
        { error: 'scheduledStart must be before scheduledEnd' },
        { status: 400 }
      );
    }

    // Clash detection: Surgeon double-booking
    const surgeonClash = await prisma.surgery.findFirst({
      where: {
        clinicId: session.user.clinicId,
        surgeonId,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
        OR: [
          {
            scheduledStart: { lte: start },
            scheduledEnd: { gt: start },
          },
          {
            scheduledStart: { lt: end },
            scheduledEnd: { gte: end },
          },
          {
            scheduledStart: { gte: start },
            scheduledEnd: { lte: end },
          },
        ],
      },
    });

    if (surgeonClash) {
      return NextResponse.json(
        { error: `The selected surgeon is already booked for another surgery ('${surgeonClash.name}') at this time.` },
        { status: 409 }
      );
    }

    // Clash detection: OT Room double-booking
    const roomClash = await prisma.surgery.findFirst({
      where: {
        clinicId: session.user.clinicId,
        otRoom,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
        OR: [
          {
            scheduledStart: { lte: start },
            scheduledEnd: { gt: start },
          },
          {
            scheduledStart: { lt: end },
            scheduledEnd: { gte: end },
          },
          {
            scheduledStart: { gte: start },
            scheduledEnd: { lte: end },
          },
        ],
      },
    });

    if (roomClash) {
      return NextResponse.json(
        { error: `Operation Theater room '${otRoom}' is already booked for another surgery ('${roomClash.name}') at this time.` },
        { status: 409 }
      );
    }

    // Create surgery
    const surgery = await prisma.surgery.create({
      data: {
        clinicId: session.user.clinicId,
        admissionId,
        name,
        surgeonId,
        anesthetistId: anesthetistId || null,
        otRoom,
        scheduledStart: start,
        scheduledEnd: end,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        notes: notes || null,
        status: 'SCHEDULED' as const,
      },
      include: {
        surgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ surgery }, { status: 201 });
  } catch (error) {
    console.error('Failed to schedule surgery:', error);
    return NextResponse.json(
      { error: 'Failed to schedule surgery' },
      { status: 500 }
    );
  }
}
