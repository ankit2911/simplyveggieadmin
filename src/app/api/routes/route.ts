import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const routes = await prisma.route.findMany({
            include: { customers: true },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(routes);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const route = await prisma.route.create({
            data: {
                name: body.name,
                code: body.code,
                city: body.city,
                description: body.description
            }
        });
        return NextResponse.json(route);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create route', details: String(error) }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;
        const route = await prisma.route.update({
            where: { id },
            data: updates
        });
        return NextResponse.json(route);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update route' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.route.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2003') {
            return NextResponse.json({ error: 'Cannot delete Route because it is still linked to existing Customers.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
    }
}
