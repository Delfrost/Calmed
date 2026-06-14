import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// PATCH: Update appointment status
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<'/api/appointments/[id]'>
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    // Verify the appointment exists and belongs to this clinic
    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true, clinicId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (existing.clinicId !== session.user.clinicId) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { status, notes, timeSlot, date } = body;

    // Validate status transition if status is being updated
    if (status) {
      const validStatuses = [
        'SCHEDULED',
        'CHECKED_IN',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(timeSlot !== undefined && { timeSlot }),
        ...(date !== undefined && { date: new Date(date) }),
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
        queueToken: true,
      },
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Failed to update appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE: Cancel an appointment (set status to CANCELLED)
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<'/api/appointments/[id]'>
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    // Verify the appointment exists and belongs to this clinic
    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true, clinicId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (existing.clinicId !== session.user.clinicId) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (existing.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Appointment is already cancelled' },
        { status: 400 }
      );
    }

    // Cancel both the appointment and its queue token in a transaction
    const appointment = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Also cancel the associated queue token if one exists
      await tx.queueToken.updateMany({
        where: {
          appointmentId: id,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        data: { status: 'CANCELLED' },
      });

      return updated;
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Failed to cancel appointment:', error);
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}
