import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: Fetch progress notes for an admission
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
    const progressNotes = await prisma.progressNote.findMany({
      where: {
        admissionId,
        admission: {
          clinicId: session.user.clinicId,
        },
      },
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
    });

    return NextResponse.json({ progressNotes });
  } catch (error) {
    console.error('Failed to fetch progress notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress notes' },
      { status: 500 }
    );
  }
}

// POST: Record new progress note
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { admissionId, doctorId, content, assessment, plan } = body;

    if (!admissionId || !content) {
      return NextResponse.json(
        { error: 'admissionId and content are required' },
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

    // Resolve doctor profile ID
    let finalDoctorId = doctorId;
    if (!finalDoctorId) {
      const doctorProfile = await prisma.doctorProfile.findFirst({
        where: { userId: session.user.id },
      });
      if (!doctorProfile) {
        return NextResponse.json(
          { error: 'Doctor profile not found for current user' },
          { status: 403 }
        );
      }
      finalDoctorId = doctorProfile.id;
    }

    const progressNote = await prisma.progressNote.create({
      data: {
        admissionId,
        doctorId: finalDoctorId,
        content,
        assessment: assessment || null,
        plan: plan || null,
      },
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
    });

    return NextResponse.json({ progressNote }, { status: 201 });
  } catch (error) {
    console.error('Failed to create progress note:', error);
    return NextResponse.json(
      { error: 'Failed to create progress note' },
      { status: 500 }
    );
  }
}
