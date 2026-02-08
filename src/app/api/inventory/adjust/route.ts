
import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    console.log('[API] POST /api/inventory/adjust');
    try {
        const body = await request.json();
        const { productId, delta, type, reason, referenceId, variantId } = body;

        let multiplier = 1;
        if (variantId) {
            const variant = await prisma.productVariant.findUnique({
                where: { id: variantId }
            });
            if (variant) {
                multiplier = variant.conversionFactor;
            }
        }

        const baseDelta = Number(delta) * multiplier;

        if (!productId || delta === undefined || !type) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Adjustment Record
            const adjustment = await tx.inventoryAdjustment.create({
                data: {
                    productId,
                    delta: baseDelta,
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
                        increment: baseDelta,
                    },
                },
                create: {
                    productId,
                    actualStock: baseDelta,
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
