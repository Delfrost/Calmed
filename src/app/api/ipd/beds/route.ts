import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { BedStatus, WardType } from '@/types';

// GET: Fetch all beds with their ward and room details
// Query filters: ?status=VACANT&wardType=ICU
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as BedStatus | null;
  const wardType = searchParams.get('wardType') as WardType | null;

  try {
    const beds = await prisma.bed.findMany({
      where: {
        room: {
          ward: {
            clinicId: session.user.clinicId,
            ...(wardType ? { type: wardType } : {}),
          },
        },
        ...(status ? { status } : {}),
      },
      include: {
        room: {
          include: {
            ward: true,
          },
        },
        admissions: {
          where: {
            status: 'ADMITTED',
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [
        { room: { ward: { name: 'asc' } } },
        { room: { number: 'asc' } },
        { label: 'asc' },
      ],
    });

    return NextResponse.json({ beds });
  } catch (error) {
    console.error('Failed to fetch beds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beds' },
      { status: 500 }
    );
  }
}

// PATCH: Update specific bed status (e.g. VACANT, MAINTENANCE, HOUSEKEEPING)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    // Verify bed belongs to user's clinic
    const bed = await prisma.bed.findFirst({
      where: {
        id,
        room: {
          ward: {
            clinicId: session.user.clinicId,
          },
        },
      },
    });

    if (!bed) {
      return NextResponse.json(
        { error: 'Bed not found in this clinic' },
        { status: 404 }
      );
    }

    const updatedBed = await prisma.bed.update({
      where: { id },
      data: {
        status: status as BedStatus,
      },
      include: {
        room: {
          include: {
            ward: true,
          },
        },
      },
    });

    return NextResponse.json({ bed: updatedBed });
  } catch (error) {
    console.error('Failed to update bed status:', error);
    return NextResponse.json(
      { error: 'Failed to update bed status' },
      { status: 500 }
    );
  }
}
