import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('[API] GET /api/customers');
    try {
        const customers = await prisma.customer.findMany({
            orderBy: { businessName: 'asc' },
            include: { route: true }
        });
        return NextResponse.json(customers);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    console.log('[API] POST /api/customers');
    try {
        const body = await request.json();
        const { businessName, phone, email, routeId } = body;

        if (!businessName || !phone) {
            return NextResponse.json({ error: 'Business name and phone are required' }, { status: 400 });
        }

        const customer = await prisma.customer.create({
            data: {
                businessName,
                phone,
                email,
                routeId
            },
        });
        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create customer', details: String(error) }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    console.log('[API] DELETE /api/customers');
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.customer.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2003') {
            return NextResponse.json({ error: 'Cannot delete Customer because they are still linked to existing Orders.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }
}
