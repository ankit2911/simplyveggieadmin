
import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('[API] GET /api/units');
    try {
        const units = await prisma.unit.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(units);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    console.log('[API] POST /api/units');
    try {
        const body = await request.json();
        const { name, symbol } = body;
        if (!name || !symbol) {
            return NextResponse.json({ error: 'Name and symbol are required' }, { status: 400 });
        }

        const unit = await prisma.unit.create({
            data: { name, symbol },
        });
        return NextResponse.json(unit, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create unit' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    console.log('[API] DELETE /api/units');
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.unit.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2003') {
            return NextResponse.json({ error: 'Cannot delete Unit because it is still linked to existing Products.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to delete unit' }, { status: 500 });
    }
}
