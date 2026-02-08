import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const roles = await prisma.employeeRole.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(roles);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const role = await prisma.employeeRole.create({
            data: {
                name: body.name,
                permissions: body.permissions // Expected to be a JSON object
            }
        });
        return NextResponse.json(role);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.employeeRole.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
    }
}
