
import { prisma } from './src/lib/prisma';

async function main() {
    try {
        const count = await prisma.product.count();
        console.log(`Product Count: ${count}`);
    } catch (e) {
        console.error('Error counting products:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
