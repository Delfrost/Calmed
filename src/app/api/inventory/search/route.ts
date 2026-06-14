import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: Search medicines by name, generic name, or category
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const clinicId = session.user.clinicId;

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const medicines = await prisma.medicine.findMany({
      where: {
        clinicId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { genericName: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        batches: {
          where: { status: 'ACTIVE' },
          orderBy: { expiryDate: 'asc' },
          select: {
            id: true,
            batchNumber: true,
            quantity: true,
            expiryDate: true,
            sellingPrice: true,
          },
        },
      },
      take: 15,
      orderBy: { name: 'asc' },
    });

    const results = medicines.map((med) => {
      const totalStock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
      return {
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        category: med.category,
        dosageForm: med.dosageForm,
        strength: med.strength,
        manufacturer: med.manufacturer,
        totalStock,
        batches: med.batches.map((b) => ({
          batchNumber: b.batchNumber,
          quantity: b.quantity,
          expiryDate: b.expiryDate.toISOString().split('T')[0],
          sellingPrice: Number(b.sellingPrice),
        })),
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Inventory search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
