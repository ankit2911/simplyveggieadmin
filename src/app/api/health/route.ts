
import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('[API] GET /api/health');
    try {
        await prisma.$connect();
        return NextResponse.json({ status: 'db_connected' });
    } catch (error) {
        console.error('Database connection failed:', error);
        return NextResponse.json({ status: 'error', message: 'Failed to connect to database' }, { status: 500 });
    }
}
