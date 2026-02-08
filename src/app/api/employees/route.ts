import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const employees = await prisma.employee.findMany({
            include: { role: true },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(employees);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, roleId, password } = body;

        const employee = await prisma.employee.create({
            data: {
                name,
                email,
                phone,
                roleId,
                password: password || '123456', // Default password if not provided
            },
            include: { role: true }
        });
        return NextResponse.json(employee);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;
        const employee = await prisma.employee.update({
            where: { id },
            data: updates,
            include: { role: true }
        });
        return NextResponse.json(employee);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.employee.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
    }
}
