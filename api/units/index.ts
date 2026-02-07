
import { PrismaClient } from '@prisma/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        try {
            const units = await prisma.unit.findMany({
                orderBy: { name: 'asc' },
            });
            return res.status(200).json(units);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch units' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { name, symbol } = req.body;
            if (!name || !symbol) {
                return res.status(400).json({ error: 'Name and symbol are required' });
            }

            const unit = await prisma.unit.create({
                data: { name, symbol },
            });
            return res.status(201).json(unit);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to create unit' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.query;
            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID is required' });
            }

            // check for variants/products usage?
            // For now, simplicity: allow delete (prisma might throw if foreign key constraint)
            await prisma.unit.delete({ where: { id } });
            return res.status(200).json({ success: true });
        } catch (error) {
            // Likely constraint error
            return res.status(500).json({ error: 'Failed to delete unit' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
