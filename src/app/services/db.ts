/**
 * localStorage Database Service
 * Provides persistent storage for all app data
 */

// Storage keys
const KEYS = {
    units: 'sv_units',
    categories: 'sv_categories',
    subcategories: 'sv_subcategories',
    inventory: 'sv_inventory',
    customers: 'sv_customers',
    leads: 'sv_leads',
    orders: 'sv_orders',
    routes: 'sv_routes',
    employees: 'sv_employees',
    roles: 'sv_roles',
    priceTiers: 'sv_price_tiers',
    pricingRules: 'sv_pricing_rules',
    websiteLinks: 'sv_website_links',
    partners: 'sv_partners',
    banners: 'sv_banners',
} as const;

/**
 * Load data from localStorage
 */
export function loadData<T>(key: string, fallback: T): T {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored) as T;
        }
    } catch (e) {
        console.warn(`Failed to load ${key} from localStorage:`, e);
    }
    return fallback;
}

/**
 * Save data to localStorage
 */
export function saveData<T>(key: string, data: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Failed to save ${key} to localStorage:`, e);
    }
}

export { KEYS };
