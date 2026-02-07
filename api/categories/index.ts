
import { PrismaClient } from '@prisma/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        try {
            const categories = await prisma.category.findMany({
                orderBy: { name: 'asc' },
            });
            return res.status(200).json(categories);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { name, description } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'Name is required' });
            }

            const category = await prisma.category.create({
                data: { name, description },
            });
            return res.status(201).json(category);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to create category' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.query;
            if (!id || Array.isArray(id)) return res.status(400).json({ error: 'ID required' });
            await prisma.category.delete({ where: { id } });
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to delete category' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
