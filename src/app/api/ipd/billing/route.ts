import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: Fetch the running IPD bill for an admission
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
    const bill = await prisma.iPDBill.findFirst({
      where: {
        admissionId,
        clinicId: session.user.clinicId,
      },
      include: {
        billItems: {
          orderBy: {
            date: 'desc',
          },
        },
        admission: {
          include: {
            patient: true,
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
    });

    if (!bill) {
      return NextResponse.json({ error: 'IPD Bill not found for this admission' }, { status: 404 });
    }

    // Map Invoice item type to IPD bill category
    const mapInvoiceItemCategory = (type: string): string => {
      switch (type) {
        case 'CONSULTATION': return 'DOCTOR_VISIT';
        case 'MEDICINE': return 'PHARMACY';
        case 'LAB_TEST': return 'LAB';
        case 'PROCEDURE': return 'SURGERY';
        default: return 'MISC';
      }
    };

    // Auto-accrue and synchronize charges in a database transaction
    let updatedBill = bill;
    const syncResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch current bill state
      const currentBill = await tx.iPDBill.findUnique({
        where: { id: bill.id },
        include: {
          billItems: true,
          admission: {
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
            },
          },
        },
      });

      if (!currentBill) return null;

      let totalAdded = 0;
      let roomAdded = 0;
      let pharmacyAdded = 0;
      let surgeryAdded = 0;
      let docVisitAdded = 0;
      let miscAdded = 0;
      let labAdded = 0;
      let nursingAdded = 0;

      // A. Room Rent Auto-Accrual
      if (currentBill.admission.status === 'ADMITTED' && currentBill.admission.bed) {
        const admittedAt = new Date(currentBill.admission.admittedAt || currentBill.admission.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - admittedAt.getTime());
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const wardRate = Number(currentBill.admission.bed.room.dailyRate);
        const existingRoomItems = currentBill.billItems.filter(item => item.category === 'ROOM');

        for (let i = 0; i < diffDays; i++) {
          const targetDate = new Date(admittedAt);
          targetDate.setDate(admittedAt.getDate() + i);
          const dateStr = targetDate.toISOString().split('T')[0];

          const alreadyAccrued = existingRoomItems.some(item => {
            const itemDateStr = new Date(item.date).toISOString().split('T')[0];
            return itemDateStr === dateStr;
          });

          if (!alreadyAccrued) {
            await tx.iPDBillItem.create({
              data: {
                ipdBillId: currentBill.id,
                category: 'ROOM',
                description: `Daily Room Rent: ${currentBill.admission.bed.room.ward.name} · Room ${currentBill.admission.bed.room.number} · Bed ${currentBill.admission.bed.label} (Day ${i + 1})`,
                quantity: 1,
                unitPrice: wardRate,
                totalPrice: wardRate,
                date: targetDate,
              }
            });
            roomAdded += wardRate;
            totalAdded += wardRate;
          }
        }
      }

      // B. Medication Administration Record (MAR) Sync
      // Find all administered MAR entries for this admission
      const administeredMAR = await tx.mAREntry.findMany({
        where: {
          medicationOrder: {
            admissionId: admissionId,
          },
          status: 'ADMINISTERED',
        },
        include: {
          medicationOrder: {
            include: {
              medicine: true,
            },
          },
        },
      });

      const existingMARItemIds = new Set(
        currentBill.billItems
          .filter(item => item.referenceType === 'MAR_ENTRY' && item.referenceId)
          .map(item => item.referenceId)
      );

      for (const entry of administeredMAR) {
        if (!existingMARItemIds.has(entry.id)) {
          // Get price of medicine from batch or fallback
          const activeBatch = await tx.medicineBatch.findFirst({
            where: {
              medicineId: entry.medicationOrder.medicineId,
              status: 'ACTIVE',
              quantity: { gt: 0 },
            },
            orderBy: {
              expiryDate: 'asc',
            },
          });

          const price = activeBatch ? Number(activeBatch.sellingPrice) : 50; // fallback ₹50
          const batchNum = activeBatch ? activeBatch.batchNumber : 'Emergency Stock';

          await tx.iPDBillItem.create({
            data: {
              ipdBillId: currentBill.id,
              category: 'PHARMACY',
              description: `Dispensed: ${entry.medicationOrder.medicine.name} (${entry.medicationOrder.dosage}) - Batch: ${batchNum}`,
              quantity: 1,
              unitPrice: price,
              totalPrice: price,
              date: entry.administeredAt || new Date(),
              referenceId: entry.id,
              referenceType: 'MAR_ENTRY',
            },
          });

          pharmacyAdded += price;
          totalAdded += price;
        }
      }

      // C. Surgery Sync
      // Find completed surgeries for this admission
      const completedSurgeries = await tx.surgery.findMany({
        where: {
          admissionId: admissionId,
          status: 'COMPLETED',
        },
      });

      const existingSurgeryItemIds = new Set(
        currentBill.billItems
          .filter(item => item.referenceType === 'SURGERY' && item.referenceId)
          .map(item => item.referenceId)
      );

      for (const surg of completedSurgeries) {
        if (!existingSurgeryItemIds.has(surg.id)) {
          const cost = Number(surg.estimatedCost || 15000);
          await tx.iPDBillItem.create({
            data: {
              ipdBillId: currentBill.id,
              category: 'SURGERY',
              description: `Procedure: ${surg.name}`,
              quantity: 1,
              unitPrice: cost,
              totalPrice: cost,
              date: surg.actualEnd || surg.scheduledStart || new Date(),
              referenceId: surg.id,
              referenceType: 'SURGERY',
            },
          });

          surgeryAdded += cost;
          totalAdded += cost;
        }
      }

      // D. OPD Invoice Sync (Consultation charges / OPD items associated with the triggering appointment)
      if (currentBill.admission.appointmentId) {
        const opdInvoice = await tx.invoice.findFirst({
          where: {
            appointmentId: currentBill.admission.appointmentId,
            status: {
              in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'],
            },
          },
          include: {
            items: true,
          },
        });

        if (opdInvoice) {
          const existingOPDItemIds = new Set(
            currentBill.billItems
              .filter(item => item.referenceType === 'OPD_INVOICE_ITEM' && item.referenceId)
              .map(item => item.referenceId)
          );

          let opdInvoiceTotal = 0;

          for (const item of opdInvoice.items) {
            if (!existingOPDItemIds.has(item.id)) {
              const category = mapInvoiceItemCategory(item.type);
              const price = Number(item.totalPrice);

              await tx.iPDBillItem.create({
                data: {
                  ipdBillId: currentBill.id,
                  category,
                  description: `OPD: ${item.description}`,
                  quantity: 1,
                  unitPrice: price,
                  totalPrice: price,
                  date: opdInvoice.createdAt || new Date(),
                  referenceId: item.id,
                  referenceType: 'OPD_INVOICE_ITEM',
                },
              });

              opdInvoiceTotal += price;
              totalAdded += price;

              if (category === 'ROOM') roomAdded += price;
              else if (category === 'DOCTOR_VISIT') docVisitAdded += price;
              else if (category === 'NURSING') nursingAdded += price;
              else if (category === 'PHARMACY') pharmacyAdded += price;
              else if (category === 'SURGERY') surgeryAdded += price;
              else if (category === 'LAB') labAdded += price;
              else miscAdded += price;
            }
          }

          // Mark the OPD invoice as PAID since it's merged into IPD Bill
          if (opdInvoiceTotal > 0) {
            await tx.invoice.update({
              where: { id: opdInvoice.id },
              data: {
                status: 'PAID',
                paidAmount: opdInvoice.totalAmount,
                balanceDue: 0,
                paidAt: new Date(),
              },
            });

            await tx.payment.create({
              data: {
                invoiceId: opdInvoice.id,
                amount: opdInvoice.totalAmount,
                method: 'BANK_TRANSFER',
                receivedBy: session.user.id,
                notes: `Merged into IPD Bill: ${currentBill.id}`,
              },
            });
          }
        }
      }

      // E. Update running totals if any charges were added
      if (totalAdded > 0) {
        await tx.iPDBill.update({
          where: { id: currentBill.id },
          data: {
            roomCharges: Number(currentBill.roomCharges) + roomAdded,
            pharmacyCharges: Number(currentBill.pharmacyCharges) + pharmacyAdded,
            surgeryCharges: Number(currentBill.surgeryCharges) + surgeryAdded,
            doctorVisitFees: Number(currentBill.doctorVisitFees) + docVisitAdded,
            miscCharges: Number(currentBill.miscCharges) + miscAdded,
            labCharges: Number(currentBill.labCharges) + labAdded,
            nursingCharges: Number(currentBill.nursingCharges) + nursingAdded,
            totalAmount: Number(currentBill.totalAmount) + totalAdded,
            balanceDue: Number(currentBill.balanceDue) + totalAdded,
            lastAccruedAt: roomAdded > 0 ? new Date() : currentBill.lastAccruedAt,
          },
        });
      }

      // F. Re-fetch final bill with updated values
      return tx.iPDBill.findUnique({
        where: { id: currentBill.id },
        include: {
          billItems: {
            orderBy: {
              date: 'desc',
            },
          },
          admission: {
            include: {
              patient: true,
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
      });
    });

    if (syncResult) {
      updatedBill = syncResult as any;
    }

    return NextResponse.json({ bill: updatedBill });
  } catch (error) {
    console.error('Failed to fetch IPD bill:', error);
    return NextResponse.json(
      { error: 'Failed to fetch IPD bill' },
      { status: 500 }
    );
  }
}

// POST: Add manual/ad-hoc charge or record a payment
// For charges, updates category charges and total amount
// For payments, updates paidAmount and balanceDue
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      admissionId,
      type = 'CHARGE', // 'CHARGE' or 'PAYMENT'
      category, // For CHARGE: ROOM, DOCTOR_VISIT, NURSING, PHARMACY, SURGERY, LAB, MISC
      description,
      quantity = 1,
      unitPrice,
      amount, // For PAYMENT
    } = body;

    if (!admissionId) {
      return NextResponse.json({ error: 'admissionId is required' }, { status: 400 });
    }

    const bill = await prisma.iPDBill.findFirst({
      where: {
        admissionId,
        clinicId: session.user.clinicId,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: 'IPD Bill not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      if (type === 'CHARGE') {
        if (!category || !description || unitPrice === undefined) {
          throw new Error('category, description, and unitPrice are required for charges');
        }

        const price = parseFloat(unitPrice);
        const qty = parseInt(quantity);
        const total = price * qty;

        const billItem = await tx.iPDBillItem.create({
          data: {
            ipdBillId: bill.id,
            category,
            description,
            quantity: qty,
            unitPrice: price,
            totalPrice: total,
            date: new Date(),
          },
        });

        // Determine which category charge to update
        const updateData: any = {};
        if (category === 'ROOM') updateData.roomCharges = Number(bill.roomCharges) + total;
        else if (category === 'DOCTOR_VISIT') updateData.doctorVisitFees = Number(bill.doctorVisitFees) + total;
        else if (category === 'NURSING') updateData.nursingCharges = Number(bill.nursingCharges) + total;
        else if (category === 'PHARMACY') updateData.pharmacyCharges = Number(bill.pharmacyCharges) + total;
        else if (category === 'SURGERY') updateData.surgeryCharges = Number(bill.surgeryCharges) + total;
        else if (category === 'LAB') updateData.labCharges = Number(bill.labCharges) + total;
        else updateData.miscCharges = Number(bill.miscCharges) + total;

        updateData.totalAmount = Number(bill.totalAmount) + total;
        updateData.balanceDue = Number(bill.balanceDue) + total;

        await tx.iPDBill.update({
          where: { id: bill.id },
          data: updateData,
        });

        return billItem;
      } else {
        // PAYMENT processing
        if (amount === undefined || parseFloat(amount) <= 0) {
          throw new Error('amount must be greater than 0 for payments');
        }

        const payAmount = parseFloat(amount);
        const newPaid = Number(bill.paidAmount) + payAmount;
        const newBalance = Number(bill.balanceDue) - payAmount;

        // Record payment in invoice items (using reference for billing history)
        const paymentItem = await tx.iPDBillItem.create({
          data: {
            ipdBillId: bill.id,
            category: 'MISC',
            description: `Payment Received (Receipt)`,
            quantity: 1,
            unitPrice: -payAmount, // Negative price signifies credit/payment
            totalPrice: -payAmount,
            date: new Date(),
            referenceType: 'PAYMENT',
          },
        });

        await tx.iPDBill.update({
          where: { id: bill.id },
          data: {
            paidAmount: newPaid,
            balanceDue: newBalance,
          },
        });

        return paymentItem;
      }
    });

    return NextResponse.json({ item: result });
  } catch (error: any) {
    console.error('Failed to post billing action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to post billing action' },
      { status: 500 }
    );
  }
}
