import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { TPAStatus } from '@/types';

// GET: Fetch TPA insurance records
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as TPAStatus | null;
  const search = searchParams.get('search') || '';

  try {
    const where: any = {
      admission: {
        clinicId: session.user.clinicId,
      },
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { insurerName: { contains: search, mode: 'insensitive' } },
              { policyNumber: { contains: search } },
              { tpaName: { contains: search, mode: 'insensitive' } },
              {
                admission: {
                  patient: {
                    OR: [
                      { firstName: { contains: search, mode: 'insensitive' } },
                      { lastName: { contains: search, mode: 'insensitive' } },
                      { phone: { contains: search } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const tpaRecords = await prisma.tPARecord.findMany({
      where,
      include: {
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
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ tpaRecords });
  } catch (error) {
    console.error('Failed to fetch TPA records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TPA records' },
      { status: 500 }
    );
  }
}

// POST: Create TPA record
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      admissionId,
      insurerName,
      policyNumber,
      tpaName,
      memberId,
      preAuthAmount,
      approvedAmount,
      claimAmount,
      settledAmount,
      status = 'PRE_AUTH_PENDING',
      notes,
    } = body;

    if (!admissionId || !insurerName || !policyNumber) {
      return NextResponse.json(
        { error: 'admissionId, insurerName and policyNumber are required' },
        { status: 400 }
      );
    }

    // Check duplicate TPA record
    const existing = await prisma.tPARecord.findUnique({
      where: { admissionId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'TPA record already exists for this admission' },
        { status: 409 }
      );
    }

    const tpaRecord = await prisma.tPARecord.create({
      data: {
        admissionId,
        insurerName,
        policyNumber,
        tpaName: tpaName || null,
        memberId: memberId || null,
        preAuthAmount: preAuthAmount ? parseFloat(preAuthAmount) : null,
        approvedAmount: approvedAmount ? parseFloat(approvedAmount) : null,
        claimAmount: claimAmount ? parseFloat(claimAmount) : null,
        settledAmount: settledAmount ? parseFloat(settledAmount) : null,
        status: status as TPAStatus,
        notes: notes || null,
      },
    });

    return NextResponse.json({ tpaRecord }, { status: 201 });
  } catch (error) {
    console.error('Failed to create TPA record:', error);
    return NextResponse.json(
      { error: 'Failed to create TPA record' },
      { status: 500 }
    );
  }
}

// PATCH: Update TPA record
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      id,
      status,
      insurerName,
      policyNumber,
      tpaName,
      memberId,
      preAuthAmount,
      approvedAmount,
      claimAmount,
      settledAmount,
      preAuthDocUrl,
      claimDocUrl,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const current = await prisma.tPARecord.findUnique({
      where: { id },
      include: {
        admission: true,
      },
    });

    if (!current || current.admission.clinicId !== session.user.clinicId) {
      return NextResponse.json({ error: 'TPA record not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status as TPAStatus;
    if (insurerName) updateData.insurerName = insurerName;
    if (policyNumber) updateData.policyNumber = policyNumber;
    if (tpaName !== undefined) updateData.tpaName = tpaName;
    if (memberId !== undefined) updateData.memberId = memberId;
    if (preAuthAmount !== undefined) updateData.preAuthAmount = preAuthAmount ? parseFloat(preAuthAmount) : null;
    if (approvedAmount !== undefined) updateData.approvedAmount = approvedAmount ? parseFloat(approvedAmount) : null;
    if (claimAmount !== undefined) updateData.claimAmount = claimAmount ? parseFloat(claimAmount) : null;
    if (settledAmount !== undefined) updateData.settledAmount = settledAmount ? parseFloat(settledAmount) : null;
    if (preAuthDocUrl !== undefined) updateData.preAuthDocUrl = preAuthDocUrl;
    if (claimDocUrl !== undefined) updateData.claimDocUrl = claimDocUrl;
    if (notes !== undefined) updateData.notes = notes;

    const tpaRecord = await prisma.tPARecord.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ tpaRecord });
  } catch (error) {
    console.error('Failed to update TPA record:', error);
    return NextResponse.json(
      { error: 'Failed to update TPA record' },
      { status: 500 }
    );
  }
}
