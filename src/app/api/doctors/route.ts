import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: List all doctors in the clinic (for dropdowns, queue assignment, etc.)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctors = await prisma.user.findMany({
      where: {
        clinicId: session.user.clinicId,
        role: 'DOCTOR',
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        doctorProfile: {
          select: {
            id: true,
            specialization: true,
            qualification: true,
            consultationDuration: true,
            isVisiting: true,
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}
