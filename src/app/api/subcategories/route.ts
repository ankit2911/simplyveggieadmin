
import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('[API] GET /api/subcategories');
    try {
        const subcategories = await prisma.subcategory.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(subcategories);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    console.log('[API] POST /api/subcategories');
    try {
        const body = await request.json();
        const { name, categoryId, description } = body;
        if (!name || !categoryId) {
            return NextResponse.json({ error: 'Name and Category ID are required' }, { status: 400 });
        }

        const subcategory = await prisma.subcategory.create({
            data: { name, categoryId, description },
        });
        return NextResponse.json(subcategory, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create subcategory' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    console.log('[API] DELETE /api/subcategories');
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.subcategory.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2003') {
            return NextResponse.json({ error: 'Cannot delete Subcategory because it is still linked to existing Products.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to delete subcategory' }, { status: 500 });
    }
}
