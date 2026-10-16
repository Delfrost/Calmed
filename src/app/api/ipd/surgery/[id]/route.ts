import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { SurgeryStatus } from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PATCH: Update surgery details, status, and checklists
// If surgery status transitions to COMPLETED, auto-posts surgery charges to the patient's IPD bill
export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = await req.json();
    const {
      status,
      preOpChecklist,
      postOpChecklist,
      actualStart,
      actualEnd,
      notes,
      estimatedCost,
      anesthetistId,
      otRoom,
    } = body;

    const currentSurgery = await prisma.surgery.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
      include: {
        admission: {
          include: {
            ipdBill: true,
          },
        },
      },
    });

    if (!currentSurgery) {
      return NextResponse.json({ error: 'Surgery record not found' }, { status: 404 });
    }

    if (currentSurgery.status === 'COMPLETED' && status === 'COMPLETED') {
      return NextResponse.json({ error: 'Surgery already completed' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {};

      if (status) updateData.status = status as SurgeryStatus;
      if (preOpChecklist !== undefined) updateData.preOpChecklist = preOpChecklist;
      if (postOpChecklist !== undefined) updateData.postOpChecklist = postOpChecklist;
      if (actualStart) updateData.actualStart = new Date(actualStart);
      if (actualEnd) updateData.actualEnd = new Date(actualEnd);
      if (notes !== undefined) updateData.notes = notes;
      if (estimatedCost !== undefined) updateData.estimatedCost = parseFloat(estimatedCost);
      if (anesthetistId !== undefined) updateData.anesthetistId = anesthetistId || null;
      if (otRoom) updateData.otRoom = otRoom;

      // Automatically post charges to IPD bill when completed
      if (status === 'COMPLETED') {
        updateData.actualEnd = new Date();
        const cost = estimatedCost !== undefined ? parseFloat(estimatedCost) : Number(currentSurgery.estimatedCost || 15000);

        const bill = currentSurgery.admission.ipdBill;
        if (bill) {
          await tx.iPDBillItem.create({
            data: {
              ipdBillId: bill.id,
              category: 'SURGERY',
              description: `Procedure: ${currentSurgery.name}`,
              quantity: 1,
              unitPrice: cost,
              totalPrice: cost,
              date: new Date(),
              referenceId: id,
              referenceType: 'SURGERY',
            },
          });

          const currentSurgeryCharges = Number(bill.surgeryCharges) + cost;
          const currentTotal = Number(bill.totalAmount) + cost;
          const currentBalance = Number(bill.balanceDue) + cost;

          await tx.iPDBill.update({
            where: { id: bill.id },
            data: {
              surgeryCharges: currentSurgeryCharges,
              totalAmount: currentTotal,
              balanceDue: currentBalance,
            },
          });
        }
      }

      return tx.surgery.update({
        where: { id },
        data: updateData,
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
    });

    return NextResponse.json({ surgery: result });
  } catch (error: any) {
    console.error('Failed to update surgery details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update surgery details' },
      { status: 500 }
    );
  }
}
