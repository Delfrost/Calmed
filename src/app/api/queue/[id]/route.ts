import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// PATCH: Update queue token status
// Body: { status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED' }
// If status is IN_PROGRESS, set calledAt to now()
// If status is COMPLETED, set completedAt to now()
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<'/api/queue/[id]'>
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    // Verify the queue token exists and belongs to this clinic
    const existing = await prisma.queueToken.findUnique({
      where: { id },
      select: { id: true, clinicId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Queue token not found' },
        { status: 404 }
      );
    }

    if (existing.clinicId !== session.user.clinicId) {
      return NextResponse.json(
        { error: 'Queue token not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    const validStatuses = [
      'WAITING',
      'IN_PROGRESS',
      'COMPLETED',
      'SKIPPED',
      'CANCELLED',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Build the data update with conditional timestamp fields
    const data: Record<string, unknown> = { status };

    if (status === 'IN_PROGRESS') {
      data.calledAt = new Date();
    }

    if (status === 'COMPLETED') {
      data.completedAt = new Date();
    }

    const queueToken = await prisma.queueToken.update({
      where: { id },
      data,
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
            status: true,
            type: true,
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
    });

    // Also update the corresponding appointment status when queue status changes
    if (status === 'IN_PROGRESS') {
      await prisma.appointment.update({
        where: { id: queueToken.appointmentId },
        data: { status: 'IN_PROGRESS' },
      });
    } else if (status === 'COMPLETED') {
      await prisma.appointment.update({
        where: { id: queueToken.appointmentId },
        data: { status: 'COMPLETED' },
      });
    } else if (status === 'CANCELLED') {
      await prisma.appointment.update({
        where: { id: queueToken.appointmentId },
        data: { status: 'CANCELLED' },
      });
    }

    return NextResponse.json({ queueToken });
  } catch (error) {
    console.error('Failed to update queue token:', error);
    return NextResponse.json(
      { error: 'Failed to update queue token' },
      { status: 500 }
    );
  }
}
