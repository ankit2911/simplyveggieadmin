import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerId, customerName, items, totalAmount, status, invoiceDate } = body;

        if (!customerId || !items || !Array.isArray(items)) {
            return NextResponse.json({ message: 'Invalid order data' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Order
            const order = await tx.order.create({
                data: {
                    customerId,
                    status: status || 'Created',
                    totalAmount: Number(totalAmount),
                    items: {
                        create: await Promise.all(items.map(async (item: any) => {
                            // Calculate orderedQtyBase
                            let conversionFactor = 1;
                            if (item.variantId) {
                                const variant = await tx.productVariant.findUnique({
                                    where: { id: item.variantId }
                                });
                                if (variant) {
                                    conversionFactor = variant.conversionFactor;
                                }
                            }
                            const orderedQtyBase = Number(item.orderedQuantity) * conversionFactor;

                            return {
                                productId: item.productId,
                                variantId: item.variantId || null,
                                quantity: Number(item.orderedQuantity),
                                orderedQtyBase: orderedQtyBase,
                                price: Number(item.pricePerUnit)
                            };
                        }))
                    }
                },
                include: { items: true }
            });

            // 2. Deduct Inventory
            const createdItems = (order as any).items || [];
            for (const item of createdItems) {
                if (item.orderedQtyBase > 0) {
                    await tx.inventory.upsert({
                        where: { productId: item.productId },
                        update: {
                            actualStock: { decrement: item.orderedQtyBase }
                        },
                        create: {
                            productId: item.productId,
                            actualStock: -item.orderedQtyBase,
                            upcomingStock: 0
                        }
                    });
                }
            }

            return order;
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Failed to create order:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.$transaction(async (tx) => {
            await tx.orderItem.deleteMany({ where: { orderId: id } });
            await tx.order.delete({ where: { id } });
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2003') {
            return NextResponse.json({ error: 'Cannot delete Order due to dependent records.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }
}
