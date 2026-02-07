
import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('[API] GET /api/products');
    try {
        const products = await prisma.product.findMany({
            orderBy: { name: 'asc' },
            include: { unit: true, category: true, subcategory: true }
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    console.log('[API] POST /api/products');
    try {
        const body = await request.json();
        const { name, categoryId, subcategoryId, unitId, sku, description } = body;

        if (!name || !categoryId || !unitId) {
            return NextResponse.json({ error: 'Name, Category, and Unit are required' }, { status: 400 });
        }

        // Transaction: Create Product + Create Inventory
        const result = await prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name,
                    categoryId,
                    subcategoryId: subcategoryId || null,
                    unitId,
                    sku: sku || null,
                    description: description || null,
                }
            });

            // Initialize Inventory
            await tx.inventory.create({
                data: {
                    productId: product.id,
                    actualStock: 0,
                    upcomingStock: 0,
                }
            });

            return product;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    console.log('[API] PUT /api/products');
    try {
        const body = await request.json();
        const { id, ...data } = body;
        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                categoryId: data.categoryId,
                subcategoryId: data.subcategoryId || null,
                description: data.description
            }
        });
        return NextResponse.json(product);
    } catch (e) {
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
