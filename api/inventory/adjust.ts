import { prisma } from '../../src/lib/prisma';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { productId, delta, type, reason, referenceId } = req.body;

    if (!productId || delta === undefined || !type) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
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
            // We use upsert to ensure Inventory record exists, though it should ideally exist if product exists
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

        return res.status(200).json(result);
    } catch (error) {
        console.error('Failed to adjust inventory:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
