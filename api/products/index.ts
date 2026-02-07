
import { PrismaClient } from '@prisma/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // GET logic - handled by /api/inventory/index.ts which fetches products + inventory
    // But we might want a raw product fetch for admin? 
    // For now, let's keep GET here minimal or relying on inventory endpoint.
    // Actually, ItemsPage uses `inventory` from context, so we don't strictly need a separate GET products unless context splits them.
    // But for completeness let's support GET all products.

    if (req.method === 'GET') {
        try {
            const products = await prisma.product.findMany({
                orderBy: { name: 'asc' },
                include: { unit: true, category: true, subcategory: true }
            });
            return res.status(200).json(products);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { name, categoryId, subcategoryId, unitId, sku, description } = req.body;

            if (!name || !categoryId || !unitId) {
                return res.status(400).json({ error: 'Name, Category, and Unit are required' });
            }

            // Transaction: Create Product + Create Inventory
            const result = await prisma.$transaction(async (tx) => {
                const product = await tx.product.create({
                    data: {
                        name,
                        categoryId,
                        subcategoryId: subcategoryId || null,
                        unitId,
                        sku: sku || null,
                        description: description || null,
                    }
                });

                // Initialize Inventory
                await tx.inventory.create({
                    data: {
                        productId: product.id,
                        actualStock: 0,
                        upcomingStock: 0,
                    }
                });

                return product;
            });

            return res.status(201).json(result);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to create product' });
        }
    }

    if (req.method === 'PUT') {
        // Update logic
        try {
            const { id, ...data } = req.body;
            if (!id) return res.status(400).json({ error: "ID required" });

            const product = await prisma.product.update({
                where: { id },
                data: {
                    name: data.name,
                    categoryId: data.categoryId,
                    subcategoryId: data.subcategoryId || null,
                    // Unit usually shouldn't change easily if inventory exists, but letting it for now
                    description: data.description
                }
            });
            return res.status(200).json(product);
        } catch (e) {
            return res.status(500).json({ error: "Failed to update" });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
