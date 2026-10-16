import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: Fetch vitals logs for an admission
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
    // Verify admission belongs to user's clinic
    const admission = await prisma.admission.findFirst({
      where: {
        id: admissionId,
        clinicId: session.user.clinicId,
      },
    });

    if (!admission) {
      return NextResponse.json({ error: 'Admission record not found' }, { status: 404 });
    }

    const vitalsLogs = await prisma.vitalsLog.findMany({
      where: {
        admissionId,
      },
      orderBy: {
        recordedAt: 'desc',
      },
    });

    return NextResponse.json({ vitalsLogs });
  } catch (error) {
    console.error('Failed to fetch vitals logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vitals logs' },
      { status: 500 }
    );
  }
}

// POST: Record new vitals log
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      admissionId,
      temperature,
      systolicBP,
      diastolicBP,
      heartRate,
      spO2,
      respiratoryRate,
      painScale,
      notes,
    } = body;

    if (!admissionId) {
      return NextResponse.json({ error: 'admissionId is required' }, { status: 400 });
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

    const vitalsLog = await prisma.vitalsLog.create({
      data: {
        admissionId,
        temperature: temperature !== undefined && temperature !== '' ? parseFloat(temperature) : null,
        systolicBP: systolicBP !== undefined && systolicBP !== '' ? parseInt(systolicBP) : null,
        diastolicBP: diastolicBP !== undefined && diastolicBP !== '' ? parseInt(diastolicBP) : null,
        heartRate: heartRate !== undefined && heartRate !== '' ? parseInt(heartRate) : null,
        spO2: spO2 !== undefined && spO2 !== '' ? parseInt(spO2) : null,
        respiratoryRate: respiratoryRate !== undefined && respiratoryRate !== '' ? parseInt(respiratoryRate) : null,
        painScale: painScale !== undefined && painScale !== '' ? parseInt(painScale) : null,
        notes: notes || null,
        recordedBy: session.user.id,
      },
    });

    return NextResponse.json({ vitalsLog }, { status: 201 });
  } catch (error) {
    console.error('Failed to create vitals log:', error);
    return NextResponse.json(
      { error: 'Failed to create vitals log' },
      { status: 500 }
    );
  }
}
