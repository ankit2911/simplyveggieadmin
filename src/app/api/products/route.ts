
import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('[API] GET /api/products');
    try {
        const products = await prisma.product.findMany({
            orderBy: { name: 'asc' },
            include: { unit: true, category: true, subcategory: true, variants: true }
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
        const { name, categoryId, subcategoryId, unitId, basePrice, sku, description } = body;

        if (!name || !categoryId || !unitId || basePrice === undefined) {
            return NextResponse.json({ error: 'Name, Category, Unit, and Base Price are required' }, { status: 400 });
        }

        // Transaction: Create Product + Create Inventory
        const result = await prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name,
                    categoryId,
                    subcategoryId: subcategoryId || null,
                    unitId,
                    basePrice,
                    sku: sku || null,
                    description: description || null,
                    variants: {
                        create: body.variants?.map((v: any) => ({
                            name: v.name,
                            price: v.price === '' || v.price === null ? null : Number(v.price),
                            conversionFactor: Number(v.conversionFactor)
                        }))
                    }
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

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update Product Fields
            const product = await tx.product.update({
                where: { id },
                data: {
                    name: data.name,
                    categoryId: data.categoryId,
                    subcategoryId: data.subcategoryId || null,
                    basePrice: data.basePrice,
                    description: data.description
                }
            });

            // 2. Handle Variants (Sync)
            if (data.variants && Array.isArray(data.variants)) {
                // Get IDs of variants kept
                const keptIds = data.variants.filter((v: any) => v.id).map((v: any) => v.id);

                // Delete removed variants
                await tx.productVariant.deleteMany({
                    where: {
                        productId: id,
                        id: { notIn: keptIds }
                    }
                });

                // Upsert remaining/new
                for (const v of data.variants) {
                    const priceValue = v.price === '' || v.price === null ? null : Number(v.price);
                    if (v.id) {
                        await tx.productVariant.update({
                            where: { id: v.id },
                            data: {
                                name: v.name,
                                price: priceValue,
                                conversionFactor: Number(v.conversionFactor)
                            }
                        });
                    } else {
                        await tx.productVariant.create({
                            data: {
                                productId: id,
                                name: v.name,
                                price: priceValue,
                                conversionFactor: Number(v.conversionFactor)
                            }
                        });
                    }
                }
            }

            return product;
        });

        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.$transaction(async (tx) => {
            await tx.inventoryAdjustment.deleteMany({ where: { productId: id } });
            await tx.inventory.deleteMany({ where: { productId: id } });
            await tx.productVariant.deleteMany({ where: { productId: id } });
            await tx.product.delete({ where: { id } });
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2003') {
            return NextResponse.json({ error: 'Cannot delete Product because it is still linked to existing Orders or Inventory.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
