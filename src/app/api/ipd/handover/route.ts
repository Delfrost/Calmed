import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ShiftType } from '@/types';

// GET: Fetch handovers for an admission
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const admissionId = searchParams.get('admissionId');

  if (!admissionId) {
    return NextResponse.json({ error: 'admissionId is required' }, { status: 400 });
  }

  try {
    const handovers = await prisma.shiftHandover.findMany({
      where: {
        admissionId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ handovers });
  } catch (error) {
    console.error('Failed to fetch handovers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch handovers' },
      { status: 500 }
    );
  }
}

// POST: Create shift handover note (outgoing nurse)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      admissionId,
      shiftType,
      shiftDate,
      shiftStartHour = 0,
      shiftDurationHrs = 8,
      criticalNotes,
      generalNotes,
    } = body;

    if (!admissionId || !shiftType || !criticalNotes) {
      return NextResponse.json(
        { error: 'admissionId, shiftType and criticalNotes are required' },
        { status: 400 }
      );
    }

    const handover = await prisma.shiftHandover.create({
      data: {
        admissionId,
        shiftType: shiftType as ShiftType,
        shiftDate: shiftDate ? new Date(shiftDate) : new Date(),
        shiftStartHour: parseInt(shiftStartHour),
        shiftDurationHrs: parseInt(shiftDurationHrs),
        outgoingNurseId: session.user.id,
        criticalNotes,
        generalNotes: generalNotes || null,
      },
    });

    return NextResponse.json({ handover }, { status: 201 });
  } catch (error) {
    console.error('Failed to create shift handover:', error);
    return NextResponse.json(
      { error: 'Failed to create shift handover' },
      { status: 500 }
    );
  }
}

// PATCH: Acknowledge shift handover (incoming nurse)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await prisma.shiftHandover.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Handover record not found' }, { status: 404 });
    }

    if (existing.acknowledgedAt) {
      return NextResponse.json({ error: 'Handover already acknowledged' }, { status: 400 });
    }

    const handover = await prisma.shiftHandover.update({
      where: { id },
      data: {
        incomingNurseId: session.user.id,
        acknowledgedAt: new Date(),
      },
    });

    return NextResponse.json({ handover });
  } catch (error) {
    console.error('Failed to acknowledge shift handover:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge shift handover' },
      { status: 500 }
    );
  }
}
