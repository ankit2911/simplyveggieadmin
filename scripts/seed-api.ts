import {
    initialUnits, initialCategories, initialSubcategories,
    initialInventory, initialRoutes, initialCustomers,
    initialEmployees, initialRoles, initialOrders
} from './mockDbData.ts';

const API_BASE = 'http://localhost:3000/api';

async function post(endpoint: string, data: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const text = await res.text();
        console.error(`Failed POST ${endpoint}: ${res.status} - ${text}`);
        return null;
    }
    return res.json();
}

async function del(endpoint: string) {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' });
    if (!res.ok) {
        const text = await res.text();
        console.error(`Failed DELETE ${endpoint}: ${res.status} - ${text}`);
        return false;
    }
    return true;
}

async function get(endpoint: string) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) return [];
    return res.json();
}

async function clearData() {
    console.log('--- Clearing Existing Data ---');

    // 1. Orders
    const orders = await get('/orders');
    if (orders.length > 0) console.log(`Deleting ${orders.length} orders...`);
    for (const o of orders) await del(`/orders?id=${o.id}`);

    // 2. Employees
    const employees = await get('/employees');
    if (employees.length > 0) console.log(`Deleting ${employees.length} employees...`);
    for (const e of employees) {
        if (e.id !== 'admin') await del(`/employees?id=${e.id}`); // keep super admin if explicit
    }

    // 3. Products
    const products = await get('/products');
    if (products.length > 0) console.log(`Deleting ${products.length} products...`);
    for (const p of products) await del(`/products?id=${p.id}`);

    // 4. Customers
    const customers = await get('/customers');
    if (customers.length > 0) console.log(`Deleting ${customers.length} customers...`);
    for (const c of customers) await del(`/customers?id=${c.id}`);

    // 5. Routes
    const routes = await get('/routes');
    if (routes.length > 0) console.log(`Deleting ${routes.length} routes...`);
    for (const r of routes) await del(`/routes?id=${r.id}`);

    // 6. Roles
    const roles = await get('/roles');
    if (roles.length > 0) console.log(`Deleting ${roles.length} roles...`);
    for (const r of roles) {
        if (r.id !== 'admin') await del(`/roles?id=${r.id}`);
    }

    // 7. Subcategories
    const subs = await get('/subcategories');
    if (subs.length > 0) console.log(`Deleting ${subs.length} subcategories...`);
    for (const s of subs) await del(`/subcategories?id=${s.id}`);

    // 8. Categories
    const cats = await get('/categories');
    if (cats.length > 0) console.log(`Deleting ${cats.length} categories...`);
    for (const c of cats) await del(`/categories?id=${c.id}`);

    // 9. Units
    const units = await get('/units');
    if (units.length > 0) console.log(`Deleting ${units.length} units...`);
    for (const u of units) await del(`/units?id=${u.id}`);
}

async function main() {
    await clearData();

    console.log('--- Starting DB Seed via API ---');

    console.log('Seeding Units...');
    const unitMap: Record<string, string> = {};
    for (const u of initialUnits) {
        const created = await post('/units', { name: u.name, symbol: u.symbol });
        if (created) unitMap[u.id] = created.id;
    }

    console.log('Seeding Categories...');
    const categoryMap: Record<string, string> = {};
    for (const c of initialCategories) {
        const created = await post('/categories', { name: c.name, description: c.description });
        if (created) categoryMap[c.id] = created.id;
    }

    console.log('Seeding Subcategories...');
    const subcategoryMap: Record<string, string> = {};
    for (const s of initialSubcategories) {
        const catId = categoryMap[s.categoryId];
        if (!catId) continue;
        const created = await post('/subcategories', { name: s.name, description: s.description, categoryId: catId });
        if (created) subcategoryMap[s.id] = created.id;
    }

    console.log('Seeding Routes...');
    const routeMap: Record<string, string> = {};
    for (const r of initialRoutes) {
        const created = await post('/routes', { name: r.name, code: r.code, city: r.city, description: r.state });
        if (created) routeMap[r.id] = created.id;
    }

    console.log('Seeding Customers...');
    const customerMap: Record<string, string> = {};
    for (const c of initialCustomers) {
        const rId = routeMap[c.routeId || ''] || null;
        const created = await post('/customers', {
            businessName: c.businessName,
            phone: c.phone,
            email: c.email || null,
            routeId: rId
        });
        if (created) customerMap[c.id] = created.id;
    }

    console.log('Seeding Products and Inventory...');
    const productMap: Record<string, any> = {};
    for (const item of initialInventory) {
        const cId = categoryMap[item.categoryId];
        const sId = item.subcategoryId ? subcategoryMap[item.subcategoryId] : null;

        let actualUnitId = Object.values(unitMap)[0];
        const matchingUnitKey = Object.keys(unitMap).find(k => initialUnits.find(u => u.id === k)?.symbol === item.unit);
        if (matchingUnitKey) {
            actualUnitId = unitMap[matchingUnitKey];
        }

        const variants = Object.entries(item.basePrice).map(([packSize, price]) => {
            let cf = 1;
            if (packSize.includes('g') && !packSize.includes('kg')) cf = parseInt(packSize) / 1000 || 1;
            else if (packSize.includes('kg')) cf = parseInt(packSize) || 1;
            return {
                name: packSize,
                price: price,
                conversionFactor: cf
            };
        });

        const created = await post('/products', {
            name: item.name,
            categoryId: cId,
            subcategoryId: sId,
            unitId: actualUnitId,
            basePrice: Object.values(item.basePrice)[0] || 0,
            sku: item.sku,
            variants
        });
        if (created) productMap[item.id] = created;
    }

    console.log('Seeding Roles...');
    const roleMap: Record<string, string> = {};
    for (const r of initialRoles) {
        const created = await post('/roles', { name: r.name, permissions: r.permissions });
        if (created) roleMap[r.id] = created.id;
    }

    console.log('Seeding Employees...');
    for (const e of initialEmployees) {
        const rId = roleMap[e.roleIds[0]];
        if (!rId) continue;
        await post('/employees', {
            name: e.name,
            email: e.email,
            roleId: rId,
            password: 'password123'
        });
    }

    console.log('Seeding Orders...');
    for (const o of initialOrders) {
        const cId = customerMap[o.customerId];
        if (!cId) continue;

        const orderItems = o.items.map((oi: any) => {
            const mockProductEntry = initialInventory.find(p => p.name === oi.itemName);
            let productAPI = null;
            if (mockProductEntry) productAPI = productMap[mockProductEntry.id];

            if (!productAPI) return null;

            const variantAPI = productAPI.variants?.find((v: any) => v.name === oi.packSize);

            return {
                productId: productAPI.id,
                variantId: variantAPI ? variantAPI.id : null,
                orderedQuantity: oi.orderedQuantity,
                pricePerUnit: oi.pricePerUnit
            };
        }).filter(Boolean);

        if (orderItems.length > 0) {
            await post('/orders', {
                customerId: cId,
                status: o.status,
                totalAmount: o.totalAmount,
                items: orderItems,
                invoiceDate: o.invoiceDate
            });
        }
    }

    console.log('--- Seeding Complete ---');
}

main().catch(console.error);
