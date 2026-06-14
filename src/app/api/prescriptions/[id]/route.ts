import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: Fetch a single prescription with all details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
        items: {
          include: {
            medicine: {
              include: {
                batches: {
                  where: { status: 'ACTIVE' },
                  select: { quantity: true },
                },
              },
            },
          },
        },
        labOrders: {
          include: { labTest: true },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    return NextResponse.json({ prescription });
  } catch (error) {
    console.error('Failed to fetch prescription:', error);
    return NextResponse.json({ error: 'Failed to fetch prescription' }, { status: 500 });
  }
}

// PATCH: Update a prescription (edit items, change status, update diagnosis/notes/vitals)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, diagnosis, notes, vitals, items, labOrders } = body;

    // Verify prescription exists
    const existing = await prisma.prescription.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    // Only allow editing DRAFT prescriptions (except status changes)
    if (existing.status !== 'DRAFT' && !status) {
      return NextResponse.json(
        { error: 'Cannot edit a non-draft prescription' },
        { status: 400 }
      );
    }

    const prescription = await prisma.$transaction(async (tx) => {
      // Update prescription fields
      const updateData: Record<string, unknown> = {};
      if (status) updateData.status = status;
      if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
      if (notes !== undefined) updateData.notes = notes;
      if (vitals !== undefined) updateData.vitals = vitals;

      // If items are provided, replace all existing items
      if (items && Array.isArray(items)) {
        await tx.prescriptionItem.deleteMany({ where: { prescriptionId: id } });
        await tx.prescriptionItem.createMany({
          data: items.map((item: {
            medicineId: string;
            dosage: string;
            frequency: string;
            duration: string;
            quantity: number;
            instructions?: string;
            stockAtPrescription?: number;
          }) => ({
            prescriptionId: id,
            medicineId: item.medicineId,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            quantity: item.quantity,
            instructions: item.instructions || null,
            stockAtPrescription: item.stockAtPrescription || 0,
          })),
        });
      }

      // If labOrders are provided, replace all existing lab orders
      if (labOrders && Array.isArray(labOrders)) {
        await tx.labOrder.deleteMany({ where: { prescriptionId: id } });
        await tx.labOrder.createMany({
          data: labOrders.map((lo: {
            labTestId: string;
            notes?: string;
          }) => ({
            prescriptionId: id,
            patientId: existing.patientId,
            labTestId: lo.labTestId,
            notes: lo.notes || null,
          })),
        });
      }

      if (status === 'DISPENSED' && existing.status !== 'DISPENSED') {
        const rxItems = await tx.prescriptionItem.findMany({
          where: { prescriptionId: id },
        });

        for (const item of rxItems) {
          let remainingToDeplete = item.quantity;

          const batches = await tx.medicineBatch.findMany({
            where: {
              medicineId: item.medicineId,
              status: 'ACTIVE',
              quantity: { gt: 0 },
            },
            orderBy: { expiryDate: 'asc' },
          });

          for (const batch of batches) {
            if (remainingToDeplete <= 0) break;

            const deductQty = Math.min(batch.quantity, remainingToDeplete);
            const newBatchQty = batch.quantity - deductQty;

            await tx.medicineBatch.update({
              where: { id: batch.id },
              data: {
                quantity: newBatchQty,
                status: newBatchQty === 0 ? 'DEPLETED' : 'ACTIVE',
              },
            });

            await tx.stockMovement.create({
              data: {
                batchId: batch.id,
                type: 'DISPENSED',
                quantity: -deductQty,
                reason: 'Prescription Dispensed',
                reference: id,
                performedBy: session.user.id,
              },
            });

            remainingToDeplete -= deductQty;
          }
        }
      }

      return tx.prescription.update({
        where: { id },
        data: updateData,
        include: {
          patient: true,
          items: { include: { medicine: true } },
          labOrders: { include: { labTest: true } },
        },
      });
    });

    return NextResponse.json({ prescription });
  } catch (error) {
    console.error('Failed to update prescription:', error);
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 });
  }
}

// DELETE: Cancel a draft prescription
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.prescription.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft prescriptions can be deleted' },
        { status: 400 }
      );
    }

    await prisma.prescription.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ message: 'Prescription cancelled' });
  } catch (error) {
    console.error('Failed to cancel prescription:', error);
    return NextResponse.json({ error: 'Failed to cancel prescription' }, { status: 500 });
  }
}
