import { prisma } from '../src/lib/prisma';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(request: VercelRequest, response: VercelResponse) {
    try {
        await prisma.$connect();
        return response.status(200).json({ status: 'db_connected' });
    } catch (error) {
        console.error('Database connection failed:', error);
        return response.status(500).json({ status: 'error', message: 'Failed to connect to database' });
    }
}
