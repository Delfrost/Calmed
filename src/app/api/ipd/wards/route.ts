import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { WardType } from '@/types';

// GET: Fetch all wards with rooms and beds for the current clinic
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const wards = await prisma.ward.findMany({
      where: {
        clinicId: session.user.clinicId,
      },
      include: {
        rooms: {
          include: {
            beds: {
              include: {
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
              orderBy: {
                label: 'asc',
              },
            },
          },
          orderBy: {
            number: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ wards });
  } catch (error) {
    console.error('Failed to fetch wards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wards' },
      { status: 500 }
    );
  }
}

// POST: Create a new ward (with nested rooms and beds)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, type, floor, rooms } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      );
    }

    // Check duplicate ward name
    const existing = await prisma.ward.findUnique({
      where: {
        clinicId_name: {
          clinicId: session.user.clinicId,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Ward named '${name}' already exists in this clinic` },
        { status: 409 }
      );
    }

    // Use transaction to create ward, rooms and beds
    const result = await prisma.$transaction(async (tx) => {
      const newWard = await tx.ward.create({
        data: {
          clinicId: session.user.clinicId,
          name,
          type: type as WardType,
          floor: floor !== undefined ? parseInt(floor) : 0,
        },
      });

      if (rooms && Array.isArray(rooms)) {
        for (const roomObj of rooms) {
          const { number, dailyRate, bedsCount } = roomObj;
          if (!number || dailyRate === undefined) continue;

          const newRoom = await tx.room.create({
            data: {
              wardId: newWard.id,
              number: String(number),
              dailyRate: parseFloat(dailyRate),
            },
          });

          if (bedsCount && parseInt(bedsCount) > 0) {
            const count = parseInt(bedsCount);
            const bedsData = Array.from({ length: count }, (_, i) => ({
              roomId: newRoom.id,
              label: `Bed ${i + 1}`,
              status: 'VACANT' as const,
            }));

            await tx.bed.createMany({
              data: bedsData,
            });
          }
        }
      }

      return tx.ward.findUnique({
        where: { id: newWard.id },
        include: {
          rooms: {
            include: {
              beds: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ ward: result }, { status: 201 });
  } catch (error) {
    console.error('Failed to create ward:', error);
    return NextResponse.json(
      { error: 'Failed to create ward' },
      { status: 500 }
    );
  }
}
