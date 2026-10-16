import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { MARStatus } from '@/types';

// GET: Fetch MAR entries for a date, optionally filtered by admissionId
// Query params: ?date=2026-06-14&admissionId=123
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const admissionId = searchParams.get('admissionId');

  try {
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const where: any = {
      scheduledTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      medicationOrder: {
        admission: {
          clinicId: session.user.clinicId,
          ...(admissionId ? { id: admissionId } : { status: 'ADMITTED' }),
        },
      },
    };

    const marEntries = await prisma.mAREntry.findMany({
      where,
      include: {
        medicationOrder: {
          include: {
            medicine: true,
            admission: {
              include: {
                patient: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    gender: true,
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
          },
        },
      },
      orderBy: {
        scheduledTime: 'asc',
      },
    });

    return NextResponse.json({ marEntries });
  } catch (error) {
    console.error('Failed to fetch MAR entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MAR entries' },
      { status: 500 }
    );
  }
}

// PATCH: Update MAR entry status (Administer, hold, miss, refuse)
// If status is ADMINISTERED, deducts pharmacy inventory & logs pharmacy charge to IPD bill
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    const marEntry = await prisma.mAREntry.findUnique({
      where: { id },
      include: {
        medicationOrder: {
          include: {
            medicine: true,
            admission: {
              include: {
                ipdBill: true,
              },
            },
          },
        },
      },
    });

    if (!marEntry || marEntry.medicationOrder.admission.clinicId !== session.user.clinicId) {
      return NextResponse.json({ error: 'MAR entry not found' }, { status: 404 });
    }

    if (marEntry.status === 'ADMINISTERED' && status === 'ADMINISTERED') {
      return NextResponse.json({ error: 'Medication already administered' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let chargeAmount = 0;
      let batchLabel = 'Unknown Batch';

      // 1. Deduct stock & calculate cost only if transitioning to ADMINISTERED
      if (status === 'ADMINISTERED') {
        const medicineId = marEntry.medicationOrder.medicineId;

        // Find earliest expiry active batch with stock
        const activeBatch = await tx.medicineBatch.findFirst({
          where: {
            medicineId,
            status: 'ACTIVE',
            quantity: { gt: 0 },
          },
          orderBy: {
            expiryDate: 'asc',
          },
        });

        if (activeBatch) {
          const newQty = activeBatch.quantity - 1;
          await tx.medicineBatch.update({
            where: { id: activeBatch.id },
            data: {
              quantity: newQty,
              status: newQty === 0 ? 'DEPLETED' : 'ACTIVE',
            },
          });

          await tx.stockMovement.create({
            data: {
              batchId: activeBatch.id,
              type: 'DISPENSED',
              quantity: -1,
              reason: `Administered via MAR (Order ID: ${marEntry.medicationOrderId})`,
              reference: id,
              performedBy: session.user.id,
            },
          });

          chargeAmount = Number(activeBatch.sellingPrice);
          batchLabel = activeBatch.batchNumber;
        } else {
          // Fallback if pharmacy stock runs out (allow administration but flag it or use generic price)
          // We default to a standard minimal charge or medicine average price
          chargeAmount = 50; // default fallback amount
          batchLabel = 'Stock Depleted (Emergency)';
        }

        // 2. Add to IPDBill if active
        const bill = marEntry.medicationOrder.admission.ipdBill;
        if (bill) {
          const medicineName = marEntry.medicationOrder.medicine.name;
          const dosage = marEntry.medicationOrder.dosage;

          await tx.iPDBillItem.create({
            data: {
              ipdBillId: bill.id,
              category: 'PHARMACY',
              description: `Dispensed: ${medicineName} (${dosage}) - Batch: ${batchLabel}`,
              quantity: 1,
              unitPrice: chargeAmount,
              totalPrice: chargeAmount,
              date: new Date(),
              referenceId: id,
              referenceType: 'MAR_ENTRY',
            },
          });

          const currentPharmacyCharges = Number(bill.pharmacyCharges) + chargeAmount;
          const currentTotal = Number(bill.totalAmount) + chargeAmount;
          const currentBalance = Number(bill.balanceDue) + chargeAmount;

          await tx.iPDBill.update({
            where: { id: bill.id },
            data: {
              pharmacyCharges: currentPharmacyCharges,
              totalAmount: currentTotal,
              balanceDue: currentBalance,
            },
          });
        }
      }

      // 3. Update MAR entry status
      return tx.mAREntry.update({
        where: { id },
        data: {
          status: status as MARStatus,
          notes: notes || null,
          administeredAt: status === 'ADMINISTERED' ? new Date() : null,
          administeredBy: status === 'ADMINISTERED' ? session.user.id : null,
        },
        include: {
          medicationOrder: {
            include: {
              medicine: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ marEntry: result });
  } catch (error: any) {
    console.error('Failed to update MAR entry status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update MAR entry status' },
      { status: 500 }
    );
  }
}
