import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: List patients for the clinic
// Query params: ?search=<name/phone>&page=1&limit=20
// Returns patients with pagination
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  try {
    const where = {
      clinicId: session.user.clinicId,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              prescriptions: true,
              appointments: true,
            },
          },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST: Create a new patient
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      phone,
      email,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      allergies,
      chronicConditions,
      emergencyContactName,
      emergencyContactPhone,
    } = body;

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'firstName, lastName, and phone are required' },
        { status: 400 }
      );
    }

    // Check for duplicate phone in same clinic
    const existing = await prisma.patient.findUnique({
      where: {
        clinicId_phone: { clinicId: session.user.clinicId, phone },
      },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: 'Patient with this phone number already exists',
          existingPatient: existing,
        },
        { status: 409 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        clinicId: session.user.clinicId,
        firstName,
        lastName,
        phone,
        email: email || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        address: address || null,
        allergies: allergies || [],
        chronicConditions: chronicConditions || [],
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
      },
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    console.error('Failed to create patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}
