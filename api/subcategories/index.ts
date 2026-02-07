
import { PrismaClient } from '@prisma/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        try {
            const subcategories = await prisma.subcategory.findMany({
                orderBy: { name: 'asc' },
            });
            return res.status(200).json(subcategories);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch subcategories' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { name, categoryId, description } = req.body;
            if (!name || !categoryId) {
                return res.status(400).json({ error: 'Name and Category ID are required' });
            }

            const subcategory = await prisma.subcategory.create({
                data: { name, categoryId, description },
            });
            return res.status(201).json(subcategory);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to create subcategory' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.query;
            if (!id || Array.isArray(id)) return res.status(400).json({ error: 'ID required' });
            await prisma.subcategory.delete({ where: { id } });
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to delete subcategory' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
