import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AdmissionStatus } from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET: Get detailed single admission record
export async function GET(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const admission = await prisma.admission.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
      include: {
        patient: true,
        admittingDoctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attendingDoctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
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
        vitalsLogs: {
          orderBy: {
            recordedAt: 'desc',
          },
        },
        progressNotes: {
          include: {
            doctor: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
        medicationOrders: {
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
        },
        shiftHandovers: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        surgeries: {
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
          orderBy: {
            scheduledStart: 'desc',
          },
        },
        ipdBill: {
          include: {
            billItems: {
              orderBy: {
                date: 'desc',
              },
            },
          },
        },
        tpaRecord: true,
      },
    });

    if (!admission) {
      return NextResponse.json({ error: 'Admission record not found' }, { status: 404 });
    }

    return NextResponse.json({ admission });
  } catch (error) {
    console.error('Failed to get admission details:', error);
    return NextResponse.json(
      { error: 'Failed to get admission details' },
      { status: 500 }
    );
  }
}

// PATCH: Update admission status, transfer beds, or discharge
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
      bedId,
      attendingDoctorId,
      diagnosis,
      chiefComplaints,
      notes,
      expectedDischargeDate,
    } = body;

    const currentAdmission = await prisma.admission.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    });

    if (!currentAdmission) {
      return NextResponse.json({ error: 'Admission record not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {};

      if (attendingDoctorId) updateData.attendingDoctorId = attendingDoctorId;
      if (diagnosis) updateData.diagnosis = diagnosis;
      if (chiefComplaints) updateData.chiefComplaints = chiefComplaints;
      if (notes) updateData.notes = notes;
      if (expectedDischargeDate) updateData.expectedDischargeDate = new Date(expectedDischargeDate);

      // Scenario A: Transitioning from REQUESTED -> ADMITTED
      if (status === 'ADMITTED' && currentAdmission.status === 'REQUESTED') {
        const targetBedId = bedId || currentAdmission.bedId;
        if (!targetBedId) {
          throw new Error('A bed must be assigned to admit the patient');
        }

        // Check and occupy bed
        const bed = await tx.bed.findUnique({ where: { id: targetBedId } });
        if (!bed || bed.status === 'OCCUPIED') {
          throw new Error('Assigned bed is not available');
        }

        await tx.bed.update({
          where: { id: targetBedId },
          data: { status: 'OCCUPIED' },
        });

        updateData.status = 'ADMITTED';
        updateData.bedId = targetBedId;
        updateData.admittedAt = new Date();

        // Create Billing record if it doesn't exist yet
        const existingBill = await tx.iPDBill.findUnique({ where: { admissionId: id } });
        if (!existingBill) {
          await tx.iPDBill.create({
            data: {
              admissionId: id,
              clinicId: session.user.clinicId,
              roomCharges: 0,
              doctorVisitFees: 0,
              nursingCharges: 0,
              pharmacyCharges: 0,
              surgeryCharges: 0,
              labCharges: 0,
              miscCharges: 0,
              totalAmount: 0,
              paidAmount: 0,
              balanceDue: 0,
            },
          });
        }
      }

      // Scenario B: Bed Transfer (Already Admitted, moving to another bed)
      else if (bedId && bedId !== currentAdmission.bedId && currentAdmission.status === 'ADMITTED') {
        // Retrieve old bed and new bed details
        const oldBed = await tx.bed.findUnique({
          where: { id: currentAdmission.bedId || '' },
          include: {
            room: {
              include: {
                ward: true,
              },
            },
          },
        });

        const newBed = await tx.bed.findUnique({
          where: { id: bedId },
          include: {
            room: {
              include: {
                ward: true,
              },
            },
          },
        });

        if (!newBed || newBed.status === 'OCCUPIED') {
          throw new Error('New bed is not available');
        }

        // Accrue charges for the old bed up to this transfer moment
        const bill = await tx.iPDBill.findUnique({
          where: { admissionId: id },
          include: {
            billItems: true,
          },
        });

        if (bill && oldBed) {
          const roomItems = bill.billItems.filter(item => item.category === 'ROOM');
          roomItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          const lastIndex = roomItems.length;

          const admittedAt = new Date(currentAdmission.admittedAt || currentAdmission.createdAt);
          const transferDate = new Date();

          let startAccrualDate = new Date(admittedAt);
          if (roomItems.length > 0) {
            const lastItemDate = new Date(roomItems[roomItems.length - 1].date);
            startAccrualDate = new Date(lastItemDate);
            startAccrualDate.setDate(lastItemDate.getDate() + 1);
          }

          const diffTime = transferDate.getTime() - startAccrualDate.getTime();
          const daysToAccrue = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
          const wardRate = Number(oldBed.room.dailyRate);
          let totalAccrued = 0;

          for (let i = 0; i < daysToAccrue; i++) {
            const targetDate = new Date(startAccrualDate);
            targetDate.setDate(startAccrualDate.getDate() + i);

            await tx.iPDBillItem.create({
              data: {
                ipdBillId: bill.id,
                category: 'ROOM',
                description: `Daily Room Rent (Prior to Transfer): ${oldBed.room.ward.name} · Room ${oldBed.room.number} · Bed ${oldBed.label} (Day ${lastIndex + i + 1})`,
                quantity: 1,
                unitPrice: wardRate,
                totalPrice: wardRate,
                date: targetDate,
              }
            });
            totalAccrued += wardRate;
          }

          // Record bed transfer/migration event in ledger (cost is 0, just for tracking)
          await tx.iPDBillItem.create({
            data: {
              ipdBillId: bill.id,
              category: 'MISC',
              description: `Bed migration: Transferred from ${oldBed.room.ward.name} (Rm ${oldBed.room.number}, Bed ${oldBed.label}) to ${newBed.room.ward.name} (Rm ${newBed.room.number}, Bed ${newBed.label})`,
              quantity: 1,
              unitPrice: 0,
              totalPrice: 0,
              date: transferDate,
            }
          });

          if (totalAccrued > 0) {
            await tx.iPDBill.update({
              where: { id: bill.id },
              data: {
                roomCharges: Number(bill.roomCharges) + totalAccrued,
                totalAmount: Number(bill.totalAmount) + totalAccrued,
                balanceDue: Number(bill.balanceDue) + totalAccrued,
              }
            });
          }
        }

        // Free up the old bed
        if (currentAdmission.bedId) {
          await tx.bed.update({
            where: { id: currentAdmission.bedId },
            data: { status: 'HOUSEKEEPING' }, // Send old bed to housekeeping
          });
        }

        // Occupy the new bed
        await tx.bed.update({
          where: { id: bedId },
          data: { status: 'OCCUPIED' },
        });

        updateData.bedId = bedId;
      }

      // Scenario C: Discharging
      if (status === 'DISCHARGED' && currentAdmission.status !== 'DISCHARGED') {
        // Free up current bed
        if (currentAdmission.bedId) {
          await tx.bed.update({
            where: { id: currentAdmission.bedId },
            data: { status: 'HOUSEKEEPING' },
          });
        }

        updateData.status = 'DISCHARGED';
        updateData.dischargedAt = new Date();
      }

      // If just normal updates or other status transitions
      if (status && status !== 'ADMITTED' && status !== 'DISCHARGED') {
        updateData.status = status as AdmissionStatus;
      }

      return tx.admission.update({
        where: { id },
        data: updateData,
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
      });
    });

    return NextResponse.json({ admission: result });
  } catch (error: any) {
    console.error('Failed to update admission details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update admission details' },
      { status: 500 }
    );
  }
}
