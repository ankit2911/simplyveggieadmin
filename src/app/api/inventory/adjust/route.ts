
import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    console.log('[API] POST /api/inventory/adjust');
    try {
        const body = await request.json();
        const { productId, delta, type, reason, referenceId } = body;

        if (!productId || delta === undefined || !type) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Adjustment Record
            const adjustment = await tx.inventoryAdjustment.create({
                data: {
                    productId,
                    delta: Number(delta),
                    type,
                    reason,
                    referenceId,
                },
            });

            // 2. Update Inventory Stock
            const inventory = await tx.inventory.upsert({
                where: { productId },
                update: {
                    actualStock: {
                        increment: Number(delta),
                    },
                },
                create: {
                    productId,
                    actualStock: Number(delta),
                    upcomingStock: 0,
                },
            });

            return { adjustment, inventory };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to adjust inventory:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
