import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: List lab tests for the clinic
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const where: Record<string, unknown> = {
      clinicId: session.user.clinicId,
      isActive: true,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }

    const labTests = await prisma.labTest.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Group by category
    const grouped: Record<string, typeof labTests> = {};
    for (const test of labTests) {
      if (!grouped[test.category]) grouped[test.category] = [];
      grouped[test.category].push(test);
    }

    return NextResponse.json({ labTests, grouped });
  } catch (error) {
    console.error('Failed to fetch lab tests:', error);
    return NextResponse.json({ error: 'Failed to fetch lab tests' }, { status: 500 });
  }
}
