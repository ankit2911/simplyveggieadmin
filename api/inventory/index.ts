import { prisma } from '../../src/lib/prisma';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

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

        return res.status(200).json(products);
    } catch (error) {
        console.error('Failed to fetch inventory:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
