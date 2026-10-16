import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: Fetch medication orders for an admission
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const admissionId = searchParams.get('admissionId');
  const activeOnly = searchParams.get('activeOnly') === 'true';

  if (!admissionId) {
    return NextResponse.json({ error: 'admissionId is required' }, { status: 400 });
  }

  try {
    const orders = await prisma.medicationOrder.findMany({
      where: {
        admissionId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: {
        medicine: true,
        marEntries: {
          orderBy: {
            scheduledTime: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Failed to fetch medication orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medication orders' },
      { status: 500 }
    );
  }
}

// Helper to calculate MAR scheduled times
function generateMARSchedule(
  startDate: Date,
  endDate: Date,
  frequency: string
): Date[] {
  const times: Date[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Normalise names to simplify matching
  const freq = frequency.toUpperCase().trim();

  // Helper to add times for a date
  const addTime = (d: Date, hours: number, minutes = 0) => {
    const scheduled = new Date(d);
    scheduled.setHours(hours, minutes, 0, 0);
    if (scheduled >= start && scheduled <= end) {
      times.push(scheduled);
    }
  };

  // Iterate day by day from start to end
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const endDay = new Date(end);
  endDay.setHours(23, 59, 59, 999);

  while (current <= endDay) {
    if (freq === 'OD' || freq.includes('ONCE DAILY') || freq.includes('QD')) {
      // 09:00 AM
      addTime(current, 9);
    } else if (freq === 'BD' || freq.includes('TWICE DAILY') || freq.includes('BID')) {
      // 09:00 AM, 09:00 PM
      addTime(current, 9);
      addTime(current, 21);
    } else if (freq === 'TDS' || freq === 'TID' || freq.includes('THREE TIMES DAILY')) {
      // 09:00 AM, 01:00 PM, 09:00 PM
      addTime(current, 9);
      addTime(current, 13);
      addTime(current, 21);
    } else if (freq === 'QID' || freq.includes('FOUR TIMES DAILY')) {
      // 08:00 AM, 12:00 PM, 04:00 PM, 08:00 PM
      addTime(current, 8);
      addTime(current, 12);
      addTime(current, 16);
      addTime(current, 20);
    } else if (freq.includes('EVERY 8 HOURS')) {
      addTime(current, 6);
      addTime(current, 14);
      addTime(current, 22);
    } else if (freq.includes('EVERY 12 HOURS')) {
      addTime(current, 9);
      addTime(current, 21);
    } else {
      // Default: once daily at 9am
      addTime(current, 9);
    }

    current.setDate(current.getDate() + 1);
  }

  return times.sort((a, b) => a.getTime() - b.getTime());
}

// POST: Create a medication order and generate MAR entries
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      admissionId,
      medicineId,
      dosage,
      frequency,
      route = 'ORAL',
      startDate,
      endDate,
      instructions,
    } = body;

    if (!admissionId || !medicineId || !dosage || !frequency || !startDate) {
      return NextResponse.json(
        { error: 'admissionId, medicineId, dosage, frequency and startDate are required' },
        { status: 400 }
      );
    }

    // Verify admission
    const admission = await prisma.admission.findFirst({
      where: {
        id: admissionId,
        clinicId: session.user.clinicId,
      },
    });

    if (!admission) {
      return NextResponse.json({ error: 'Admission record not found' }, { status: 404 });
    }

    // Check medicine exists
    const medicine = await prisma.medicine.findFirst({
      where: {
        id: medicineId,
        clinicId: session.user.clinicId,
      },
    });

    if (!medicine) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
    }

    // Calculate dates
    const start = new Date(startDate);
    // If no end date provided, default to 3 days from start date
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);

    const scheduledTimes = generateMARSchedule(start, end, frequency);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.medicationOrder.create({
        data: {
          admissionId,
          medicineId,
          dosage,
          frequency,
          route,
          startDate: start,
          endDate: endDate ? end : null,
          instructions: instructions || null,
          orderedBy: session.user.id,
          isActive: true,
        },
      });

      // Bulk create MAR entries
      const marData = scheduledTimes.map((time) => ({
        medicationOrderId: order.id,
        scheduledTime: time,
        status: 'SCHEDULED' as const,
      }));

      if (marData.length > 0) {
        await tx.mAREntry.createMany({
          data: marData,
        });
      }

      return tx.medicationOrder.findUnique({
        where: { id: order.id },
        include: {
          medicine: true,
          marEntries: true,
        },
      });
    });

    return NextResponse.json({ order: result }, { status: 201 });
  } catch (error) {
    console.error('Failed to create medication order:', error);
    return NextResponse.json(
      { error: 'Failed to create medication order' },
      { status: 500 }
    );
  }
}
