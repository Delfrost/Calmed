import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST: Run room rent accruals for all active admissions
// Calculates room rates from the assigned room daily rate, adds bill items, and updates totals.
// Can be called via cron job or triggered manually from receptionist billing screen.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const activeAdmissions = await prisma.admission.findMany({
      where: {
        clinicId: session.user.clinicId,
        status: 'ADMITTED',
        bedId: { not: null },
      },
      include: {
        bed: {
          include: {
            room: {
              include: {
                ward: true,
              },
            },
          },
        },
        ipdBill: true,
      },
    });

    const results = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);

    for (const admission of activeAdmissions) {
      if (!admission.bed?.room) continue;
      const room = admission.bed.room;
      const dailyRate = Number(room.dailyRate);

      const bill = admission.ipdBill;
      if (!bill) continue;

      // Determine starting date for accrual calculation
      // If we've never accrued, start from admittedAt. Otherwise, start from lastAccruedAt.
      const lastAccrued = bill.lastAccruedAt ? new Date(bill.lastAccruedAt) : new Date(admission.admittedAt || admission.createdAt);
      
      // Calculate how many days need rent accrual
      const lastAccruedDay = new Date(lastAccrued);
      lastAccruedDay.setHours(0, 0, 0, 0);

      const targetDay = new Date(todayStart);

      const diffTime = targetDay.getTime() - lastAccruedDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        // Already accrued for today/recently
        results.push({
          admissionId: admission.id,
          patientName: admission.patientId,
          accrued: false,
          reason: 'Already accrued up to date',
        });
        continue;
      }

      // Perform transaction for this specific patient
      const updateResult = await prisma.$transaction(async (tx) => {
        let totalAccruedRent = 0;
        const itemsToCreate = [];

        for (let i = 1; i <= diffDays; i++) {
          const accrueDate = new Date(lastAccruedDay);
          accrueDate.setDate(accrueDate.getDate() + i);

          const dateStr = accrueDate.toISOString().split('T')[0];
          totalAccruedRent += dailyRate;

          itemsToCreate.push({
            ipdBillId: bill.id,
            category: 'ROOM',
            description: `Room Rent: Room ${room.number} (${room.ward.name}) - Date: ${dateStr}`,
            quantity: 1,
            unitPrice: dailyRate,
            totalPrice: dailyRate,
            date: accrueDate,
            referenceType: 'ROOM_RENT',
          });
        }

        // Create the bill items
        await tx.iPDBillItem.createMany({
          data: itemsToCreate,
        });

        // Update the running totals
        const updatedBill = await tx.iPDBill.update({
          where: { id: bill.id },
          data: {
            roomCharges: Number(bill.roomCharges) + totalAccruedRent,
            totalAmount: Number(bill.totalAmount) + totalAccruedRent,
            balanceDue: Number(bill.balanceDue) + totalAccruedRent,
            lastAccruedAt: now,
          },
        });

        return {
          admissionId: admission.id,
          accrued: true,
          daysAccrued: diffDays,
          amountAccrued: totalAccruedRent,
        };
      });

      results.push(updateResult);
    }

    return NextResponse.json({ summary: results });
  } catch (error) {
    console.error('Failed to run room rent accruals:', error);
    return NextResponse.json(
      { error: 'Failed to run room rent accruals' },
      { status: 500 }
    );
  }
}
