import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: Retrieve a unified queue of pending billing records (both OPD Invoices & IPD Bills)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const typeFilter = searchParams.get('type') || 'ALL'; // 'ALL' | 'OPD' | 'IPD'

  try {
    const unifiedBills: any[] = [];

    // 1. Fetch IPD Bills (Inpatient)
    if (typeFilter === 'ALL' || typeFilter === 'IPD') {
      const ipdBills = await prisma.iPDBill.findMany({
        where: {
          clinicId: session.user.clinicId,
        },
        include: {
          billItems: {
            orderBy: {
              date: 'asc',
            },
          },
          admission: {
            include: {
              patient: true,
              attendingDoctor: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      ipdBills.forEach((bill) => {
        // Map IPD Bill items
        const items = bill.billItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          category: item.category,
        }));

        const patient = bill.admission.patient;
        const doctor = bill.admission.attendingDoctor;
        const doctorName = doctor ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}` : 'Attending Staff';

        // An IPD bill is considered PENDING if balanceDue > 0, PAID if balanceDue <= 0
        const isPaid = Number(bill.balanceDue) <= 0 && Number(bill.totalAmount) > 0;
        const status = isPaid ? 'PAID' : 'PENDING';

        unifiedBills.push({
          id: bill.id,
          billType: 'IPD',
          admissionId: bill.admissionId,
          patientName: `${patient.firstName} ${patient.lastName}`,
          phone: patient.phone || '',
          doctorName,
          items,
          status,
          subtotal: Number(bill.totalAmount), // Running total before tax / discount on main desk
          paidAmount: Number(bill.paidAmount),
          balanceDue: Number(bill.balanceDue),
          date: new Date(bill.admission.admittedAt || bill.admission.createdAt).toISOString().split('T')[0],
        });
      });
    }

    // 2. Fetch OPD Invoices (Outpatient)
    if (typeFilter === 'ALL' || typeFilter === 'OPD') {
      const opdInvoices = await prisma.invoice.findMany({
        where: {
          clinicId: session.user.clinicId,
        },
        include: {
          items: true,
          patient: true,
          appointment: {
            include: {
              doctor: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      opdInvoices.forEach((inv) => {
        const items = inv.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          category: 'MISC',
        }));

        const patient = inv.patient;
        const doctor = inv.appointment?.doctor;
        const doctorName = doctor ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}` : 'Consulting Doctor';

        unifiedBills.push({
          id: inv.id,
          billType: 'OPD',
          patientName: `${patient.firstName} ${patient.lastName}`,
          phone: patient.phone || '',
          doctorName,
          items,
          status: inv.status, // PENDING, PAID, OVERDUE
          subtotal: Number(inv.subtotal),
          taxAmount: Number(inv.taxAmount),
          discountAmount: Number(inv.discountAmount),
          totalAmount: Number(inv.totalAmount),
          paidAmount: Number(inv.paidAmount),
          balanceDue: Number(inv.balanceDue),
          date: inv.createdAt.toISOString().split('T')[0],
        });
      });
    }

    // Sort unified bills: pending bills first, then newest
    unifiedBills.sort((a, b) => {
      if (a.status === 'PENDING' && b.status === 'PAID') return -1;
      if (a.status === 'PAID' && b.status === 'PENDING') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return NextResponse.json({ bills: unifiedBills });
  } catch (error) {
    console.error('Failed to query unified bills:', error);
    return NextResponse.json({ error: 'Failed to query unified bills' }, { status: 500 });
  }
}

// POST: Settle payment for an invoice or IPD bill at the main billing desk
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { billId, billType, amountPaid, discountPercent = 0, paymentMethod } = body;

    if (!billId || !billType || amountPaid === undefined) {
      return NextResponse.json({ error: 'billId, billType, and amountPaid are required' }, { status: 400 });
    }

    const payAmount = parseFloat(amountPaid);

    const result = await prisma.$transaction(async (tx) => {
      if (billType === 'IPD') {
        const ipdBill = await tx.iPDBill.findUnique({
          where: { id: billId },
        });

        if (!ipdBill) {
          throw new Error('IPD Bill not found');
        }

        const newPaid = Number(ipdBill.paidAmount) + payAmount;
        const newBalance = Math.max(0, Number(ipdBill.balanceDue) - payAmount);

        // Record payment item
        await tx.iPDBillItem.create({
          data: {
            ipdBillId: ipdBill.id,
            category: 'MISC',
            description: `Payment Received (${paymentMethod})`,
            quantity: 1,
            unitPrice: -payAmount,
            totalPrice: -payAmount,
            date: new Date(),
            referenceType: 'PAYMENT',
          },
        });

        // If balance is fully settled, transition admission bed to HOUSEKEEPING and update status
        const isFullySettled = newBalance <= 0;

        const updated = await tx.iPDBill.update({
          where: { id: billId },
          data: {
            paidAmount: newPaid,
            balanceDue: newBalance,
          },
        });

        return { bill: updated, message: 'IPD Bill payment successfully posted' };
      } else {
        // OPD Invoice
        const invoice = await tx.invoice.findUnique({
          where: { id: billId },
        });

        if (!invoice) {
          throw new Error('OPD Invoice not found');
        }

        const newPaid = Number(invoice.paidAmount) + payAmount;
        const newBalance = Math.max(0, Number(invoice.balanceDue) - payAmount);
        const isSettled = newBalance <= 0;

        const updated = await tx.invoice.update({
          where: { id: billId },
          data: {
            paidAmount: newPaid,
            balanceDue: newBalance,
            status: isSettled ? 'PAID' : 'PENDING',
            paidAt: isSettled ? new Date() : null,
          },
        });

        // Create a Payment log
        await tx.payment.create({
          data: {
            invoiceId: billId,
            amount: payAmount,
            method: paymentMethod as any,
            transactionId: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
            receivedBy: session.user.id,
          },
        });

        return { bill: updated, message: 'OPD Invoice payment successfully posted' };
      }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to post unified payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to post unified payment' }, { status: 500 });
  }
}
