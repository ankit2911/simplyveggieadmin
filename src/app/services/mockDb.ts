import {
    Customer, Order, InventoryItem, Category,
    Subcategory, Unit, PriceTier, Employee,
    EmployeeRole, Route, Lead, Address
} from '../context/AdminContext';

// --- 1. Master Data: Units ---
export const initialUnits: Unit[] = [
    { id: 'u1', name: 'Kilogram', symbol: 'kg' },
    { id: 'u2', name: 'Gram', symbol: 'g' },
    { id: 'u3', name: 'Pieces', symbol: 'pcs' },
    { id: 'u4', name: 'Bunch', symbol: 'bunch' },
    { id: 'u5', name: 'Packet', symbol: 'pkt' },
    { id: 'u6', name: 'Dozen', symbol: 'dz' },
    { id: 'u7', name: 'Tray', symbol: 'tray' },
    { id: 'u8', name: 'Box', symbol: 'box' },
    { id: 'u9', name: 'Crate', symbol: 'crate' },
];

// --- 2. Master Data: Categories & Subcategories ---
export const initialCategories: Category[] = [
    { id: 'c1', name: 'Vegetables', description: 'Fresh farm vegetables' },
    { id: 'c2', name: 'Fruits', description: 'Seasonal and regular fruits' },
    { id: 'c3', name: 'Exotics', description: 'Imported and exotic items' },
    { id: 'c4', name: 'Leafy Greens', description: 'Fresh leafy vegetables' },
    { id: 'c5', name: 'Herbs & Seasoning', description: 'Fresh herbs and seasoning items' },
];

export const initialSubcategories: Subcategory[] = [
    // Veg (c1)
    { id: 's1', categoryId: 'c1', name: 'Roots & Tubers', description: 'Potatoes, Carrots, etc.' },
    { id: 's2', categoryId: 'c1', name: 'Gourds', description: 'Pumpkin, Bottle Gourd, etc.' },
    { id: 's3', categoryId: 'c1', name: 'Beans & Pods', description: 'French Beans, Peas' },
    { id: 's4', categoryId: 'c1', name: 'Onion & Garlic', description: '' },
    // Fruits (c2)
    { id: 's5', categoryId: 'c2', name: 'Citrus', description: 'Lemons, Oranges' },
    { id: 's6', categoryId: 'c2', name: 'Melons', description: 'Watermelon, Muskmelon' },
    { id: 's7', categoryId: 'c2', name: 'Berries', description: 'Strawberries, etc.' },
    { id: 's8', categoryId: 'c2', name: 'Tropical', description: 'Bananas, Pineapples' },
    // Exotics (c3)
    { id: 's9', categoryId: 'c3', name: 'Mushrooms', description: '' },
    { id: 's10', categoryId: 'c3', name: 'Peppers', description: 'Bell Peppers, Jalapenos' },
    { id: 's11', categoryId: 'c3', name: 'Salad Veggies', description: 'Lettuce, Zucchini' },
];

// --- 3. Master Data: Price Tiers ---
export const initialPriceTiers: PriceTier[] = [
    {
        id: 't0',
        name: 'Standard Retail',
        description: 'Default pricing for walk-in or small customers',
        includedCategoryIds: ['c1', 'c2', 'c4', 'c5'], // Most categories
        includedSubcategoryIds: [],
        includedSkuIds: [],
        items: []
    },
    {
        id: 't1',
        name: 'Premium HORECA',
        description: 'Pricing for high-end hotels and restaurants',
        includedCategoryIds: ['c1', 'c2', 'c3', 'c4', 'c5'], // All including exotics
        includedSubcategoryIds: [],
        includedSkuIds: [],
        items: []
    },
    {
        id: 't2',
        name: 'Wholesale Mandi',
        description: 'Bulk market rates for large aggregators',
        includedCategoryIds: ['c1', 'c2'], // Only veggies and fruits
        includedSubcategoryIds: [],
        includedSkuIds: [],
        items: []
    },
    {
        id: 't3',
        name: 'Friends & Family',
        description: 'Discounted rates for internal use',
        includedCategoryIds: ['c1', 'c2', 'c3', 'c4', 'c5'],
        includedSubcategoryIds: [],
        includedSkuIds: [],
        items: []
    },
];

// --- 4. Inventory Items ---
// Helper to create item
const createItem = (id: string, name: string, cat: string, sub: string, packs: Record<string, number>): InventoryItem => ({
    id,
    name,
    categoryId: cat,
    subcategoryId: sub,
    category: '',
    tags: [],
    quantityInStock: Object.keys(packs).reduce((acc, k) => ({ ...acc, [k]: Math.floor(Math.random() * 100) + 10 }), {}),
    minStockLevel: 20,
    unit: 'kg',
    basePrice: packs,
    packSizes: Object.keys(packs),
    sku: `SKU-${id.toUpperCase()}-${Math.floor(Math.random() * 1000)}`
});

export const initialInventory: InventoryItem[] = [
    // Vegetables
    createItem('i1', 'Potato (Jyoti)', 'c1', 's1', { '1kg': 30, '5kg': 140, '50kg': 1200 }),
    createItem('i2', 'Potato (Pahari)', 'c1', 's1', { '1kg': 35, '5kg': 160, '50kg': 1400 }),
    createItem('i3', 'Onion (Nashik)', 'c1', 's4', { '1kg': 40, '5kg': 190, '50kg': 1800 }),
    createItem('i4', 'Onion (Red)', 'c1', 's4', { '1kg': 45, '5kg': 210, '50kg': 2000 }),
    createItem('i5', 'Tomato (Hybrid)', 'c1', 's2', { '1kg': 25, '10kg': 220 }),
    createItem('i6', 'Tomato (Desi)', 'c1', 's2', { '1kg': 30, '10kg': 280 }),
    createItem('i7', 'Carrot (Ooty)', 'c1', 's1', { '500g': 30, '1kg': 55 }),
    createItem('i8', 'Carrot (Local)', 'c1', 's1', { '1kg': 40 }),
    createItem('i9', 'Cauliflower', 'c1', 's2', { '1pcs': 45, '10pcs': 400 }),
    createItem('i10', 'Cabbage', 'c1', 's2', { '1pcs': 30, '1kg': 25 }),
    createItem('i11', 'French Beans', 'c1', 's3', { '500g': 40, '1kg': 75 }),

    // Leafy
    createItem('i12', 'Coriander', 'c4', '', { '1bunch': 15, '1kg': 120 }),
    createItem('i13', 'Spinach (Palak)', 'c4', '', { '1bunch': 20, '1kg': 80 }),
    createItem('i14', 'Mint (Pudina)', 'c5', '', { '1bunch': 10, '1kg': 100 }),
    createItem('i15', 'Methi', 'c4', '', { '1bunch': 25 }),

    // Fruits
    createItem('i16', 'Apple (Washington)', 'c2', 's5', { '1kg': 220, 'box': 3000 }),
    createItem('i17', 'Banana (Robusta)', 'c2', 's8', { '1dz': 60, '1kg': 40 }),
    createItem('i18', 'Watermelon (Kiran)', 'c2', 's6', { '1pcs': 60, '1kg': 20 }),
    createItem('i19', 'Orange (Nagpur)', 'c2', 's5', { '1kg': 80, '10kg': 750 }),

    // Exotics
    createItem('i20', 'Mushroom (Button)', 'c3', 's9', { '200g': 55, '1kg': 240 }),
    createItem('i21', 'Broccoli', 'c3', 's11', { '1pcs': 80, '1kg': 200 }),
    createItem('i22', 'Red Bell Pepper', 'c3', 's10', { '1kg': 280 }),
    createItem('i23', 'Yellow Bell Pepper', 'c3', 's10', { '1kg': 280 }),
    createItem('i24', 'Zucchini (Green)', 'c3', 's11', { '1pcs': 50, '1kg': 150 }),
];

// --- 5. Routes ---
export const initialRoutes: Route[] = [
    { id: 'r1', name: 'Downtown (Morning)', code: 'RT-DT-01', city: 'Metro City', state: 'State', customerIds: ['c1', 'c2'] },
    { id: 'r2', name: 'Suburban North', code: 'RT-NO-02', city: 'Metro City', state: 'State', customerIds: ['c3', 'c5'] },
    { id: 'r3', name: 'Tech Park Zone', code: 'RT-TP-03', city: 'Metro City', state: 'State', customerIds: ['c4', 'c6'] },
    { id: 'r4', name: 'West End Hotels', code: 'RT-WE-04', city: 'Metro City', state: 'State', customerIds: [] },
];

// --- 6. Customers ---
const createAddress = (type: 'billing' | 'shipping', attn: string): Address => ({
    id: Math.random().toString(36).substr(2, 9),
    type,
    street: '123 Market St',
    city: 'Metro City',
    state: 'State',
    zipCode: '500001',
    country: 'India',
    attention: attn
});

export const initialCustomers: Customer[] = [
    {
        id: 'c1',
        businessName: 'Hotel Royal Orchid',
        contactPerson: 'Chef Ramesh',
        email: 'purchasing@royalorchid.com',
        phone: '9876543210',
        type: 'b2b',
        status: 'active',
        gstin: '29ABCDE1234F1Z5',
        addresses: [createAddress('billing', 'Accounts Dept'), createAddress('shipping', 'Kitchen Gate 2')],
        tierId: 't1',
        routeId: 'r1',
        walletBalance: 5000,
        authorizedUsers: [],
        createdAt: new Date(Date.now() - 10000000).toISOString()
    },
    {
        id: 'c2',
        businessName: 'Fresh Mart Supermarket',
        contactPerson: 'Mr. Agarwal',
        email: 'admin@freshmart.com',
        phone: '9898989898',
        type: 'b2b',
        status: 'active',
        gstin: '29XYZAB1234F1Z5',
        addresses: [createAddress('shipping', 'Store Manager')],
        tierId: 't2',
        routeId: 'r1',
        walletBalance: -1200,
        authorizedUsers: [],
        createdAt: new Date(Date.now() - 8000000).toISOString()
    },
    {
        id: 'c3',
        businessName: 'Tech Cafeteria',
        contactPerson: 'Ops Manager',
        email: 'ops@techcafe.com',
        phone: '7777777777',
        type: 'b2b',
        status: 'active',
        addresses: [createAddress('shipping', 'Receiving Dock')],
        tierId: 't0',
        routeId: 'r2',
        walletBalance: 12000,
        authorizedUsers: [],
        createdAt: new Date(Date.now() - 5000000).toISOString()
    },
    {
        id: 'c4',
        businessName: 'Green Salad Bar',
        contactPerson: 'Sarah Jones',
        email: 'sarah@greensalad.com',
        phone: '9988776655',
        type: 'b2c',
        status: 'active',
        addresses: [createAddress('shipping', 'Front Desk')],
        tierId: 't0',
        routeId: 'r3',
        walletBalance: 500,
        authorizedUsers: [],
        createdAt: new Date(Date.now() - 2000000).toISOString()
    },
    {
        id: 'c5',
        businessName: 'Spice Garden Restaurant',
        contactPerson: 'Manager Raj',
        phone: '8877665544',
        type: 'b2b',
        status: 'on_hold',
        addresses: [createAddress('shipping', 'Main Entrance')],
        tierId: 't1',
        routeId: 'r2',
        walletBalance: 0,
        authorizedUsers: [],
        createdAt: new Date(Date.now() - 6000000).toISOString()
    },
    {
        id: 'c6',
        businessName: 'Daily Needs Store',
        contactPerson: 'Owner',
        phone: '6655443322',
        type: 'b2b',
        status: 'active',
        addresses: [createAddress('shipping', 'Shop #4')],
        tierId: 't2',
        routeId: 'r3',
        walletBalance: 2000,
        authorizedUsers: [],
        createdAt: new Date(Date.now() - 1000000).toISOString()
    }
];

// --- 7. Orders ---
export const initialOrders: Order[] = [
    // Completed Orders
    {
        id: 'ORD-1001',
        customerId: 'c1',
        customerName: 'Hotel Royal Orchid',
        status: 'Delivered',
        items: [
            { id: 'oi1', itemName: 'Potato (Jyoti)', packSize: '50kg', orderedQuantity: 2, pricePerUnit: 1200, deliveredQuantity: 2 },
            { id: 'oi2', itemName: 'Onion (Nashik)', packSize: '5kg', orderedQuantity: 5, pricePerUnit: 190, deliveredQuantity: 5 },
            { id: 'oi3', itemName: 'Tomato (Hybrid)', packSize: '10kg', orderedQuantity: 2, pricePerUnit: 220, deliveredQuantity: 2 },
        ],
        totalAmount: 3790,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        deliveryDate: new Date(Date.now() - 86400000).toISOString(),
        paymentStatus: 'paid',
        invoiceDate: new Date(Date.now() - 86400000).toISOString(),
        invoiceNumber: 'INV-001'
    },
    {
        id: 'ORD-1002',
        customerId: 'c3',
        customerName: 'Tech Cafeteria',
        status: 'Delivered',
        items: [
            { id: 'oi4', itemName: 'Banana (Robusta)', packSize: '1dz', orderedQuantity: 20, pricePerUnit: 60, deliveredQuantity: 20 },
            { id: 'oi5', itemName: 'Apple (Washington)', packSize: 'box', orderedQuantity: 2, pricePerUnit: 3000, deliveredQuantity: 2 },
        ],
        totalAmount: 7200,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        deliveryDate: new Date(Date.now() - 86400000).toISOString(),
        paymentStatus: 'paid',
        invoiceDate: new Date(Date.now() - 86400000).toISOString(),
        invoiceNumber: 'INV-002'
    },
    // Active Orders
    {
        id: 'ORD-1003',
        customerId: 'c2',
        customerName: 'Fresh Mart Supermarket',
        status: 'Packed',
        items: [
            { id: 'oi6', itemName: 'Coriander', packSize: '1bunch', orderedQuantity: 50, pricePerUnit: 15 },
            { id: 'oi7', itemName: 'Spinach', packSize: '1bunch', orderedQuantity: 30, pricePerUnit: 20 },
            { id: 'oi8', itemName: 'Potato (Pahari)', packSize: '50kg', orderedQuantity: 5, pricePerUnit: 1400 },
        ],
        totalAmount: 8350,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        deliveryDate: new Date(Date.now() + 86400000).toISOString(),
        paymentStatus: 'pending'
    },
    {
        id: 'ORD-1004',
        customerId: 'c4',
        customerName: 'Green Salad Bar',
        status: 'Processing',
        items: [
            { id: 'oi9', itemName: 'Iceberg Lettuce', packSize: '1kg', orderedQuantity: 5, pricePerUnit: 150 }, // Note: Item not in inventory list, logic handles this gracefully usually or we should add it
            { id: 'oi10', itemName: 'Cherry Tomato', packSize: '250g', orderedQuantity: 10, pricePerUnit: 60 },
            { id: 'oi11', itemName: 'Zucchini (Green)', packSize: '1kg', orderedQuantity: 3, pricePerUnit: 150 },
        ],
        totalAmount: 1800,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        deliveryDate: new Date(Date.now() + 86400000).toISOString(),
        paymentStatus: 'pending'
    },
    {
        id: 'ORD-1005',
        customerId: 'c1',
        customerName: 'Hotel Royal Orchid',
        status: 'Created',
        items: [
            { id: 'oi12', itemName: 'Mushroom (Button)', packSize: '1kg', orderedQuantity: 15, pricePerUnit: 240 },
            { id: 'oi13', itemName: 'Broccoli', packSize: '1kg', orderedQuantity: 10, pricePerUnit: 200 },
            { id: 'oi14', itemName: 'Red Bell Pepper', packSize: '1kg', orderedQuantity: 5, pricePerUnit: 280 },
            { id: 'oi15', itemName: 'Yellow Bell Pepper', packSize: '1kg', orderedQuantity: 5, pricePerUnit: 280 },
        ],
        totalAmount: 8400,
        createdAt: new Date().toISOString(),
        deliveryDate: new Date(Date.now() + 86400000).toISOString(),
        paymentStatus: 'pending'
    }
];

// --- 8. Employees & Roles ---
export const initialRoles: EmployeeRole[] = [
    { id: 'er1', name: 'Super Admin', permissions: { appAccess: true, modules: ['all'] } },
    { id: 'er2', name: 'Manager', permissions: { appAccess: true, modules: ['orders', 'inventory', 'customers'] } },
    { id: 'er3', name: 'Driver', permissions: { appAccess: true, modules: ['delivery'] } },
    { id: 'er4', name: 'Picker/Packer', permissions: { appAccess: true, modules: ['inventory'] } }
];

export const initialEmployees: Employee[] = [
    { id: 'e1', name: 'Admin User', email: 'admin@simplyveggie.com', roleIds: ['er1'], isActive: true, createdAt: new Date().toISOString() },
    { id: 'e2', name: 'Driver Bob', email: 'bob@driver.com', roleIds: ['er3'], isActive: true, createdAt: new Date().toISOString() },
    { id: 'e3', name: 'Manager Alice', email: 'alice@store.com', roleIds: ['er2'], isActive: true, createdAt: new Date().toISOString() },
    { id: 'e4', name: 'Driver Mike', email: 'mike@driver.com', roleIds: ['er3'], isActive: true, createdAt: new Date().toISOString() },
];

export const initialLeads: Lead[] = [
    { id: 'l1', businessName: 'New Cafe Town', phone: '9876500001', status: 'New', createdAt: new Date().toISOString() },
    { id: 'l2', businessName: 'Organic Store', phone: '9876500002', status: 'Contacted', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'l3', businessName: 'Juice Bar', phone: '9876500003', status: 'Converted', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
];

