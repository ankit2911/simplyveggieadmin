
import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('[API] GET /api/inventory');
    try {
        const products = await prisma.product.findMany({
            include: {
                inventory: true,
                unit: true,
                InventoryAdjustment: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
                category: true,
                subcategory: true,
                variants: true,
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Failed to fetch inventory:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
