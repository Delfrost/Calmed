import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Clean up phone number (remove spaces, etc. to try matching loosely)
    const normalizedPhone = phone.trim();

    // In a real app we'd use a strict OTP match, but for this demo, 
    // we just find the patient with the provided phone number.
    const patient = await prisma.patient.findFirst({
      where: {
        phone: {
          contains: normalizedPhone,
        }
      },
      include: {
        clinic: {
          select: { name: true, phone: true, email: true, address: true, logo: true }
        },
        prescriptions: {
          where: {
            status: { not: 'DRAFT' } // Only show finalized prescriptions to patient
          },
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              include: { user: true }
            },
            items: {
              include: { medicine: true }
            },
            labOrders: {
              include: { labTest: true, report: true }
            }
          }
        },
        appointments: {
          orderBy: { date: 'desc' },
          take: 5,
          include: {
            doctor: { include: { user: true } }
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'No patient found with this phone number' }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error('Patient Portal API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
