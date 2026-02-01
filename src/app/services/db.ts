/**
 * localStorage Database Service
 * Provides persistent storage for all app data
 */

import {
    initialUnits, initialCategories, initialSubcategories,
    initialInventory, initialCustomers, initialOrders,
    initialPriceTiers, initialRoutes, initialEmployees,
    initialRoles, initialLeads
} from './mockDb';

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

/**
 * Initialize database with mock data if empty
 */
export function initializeDb() {
    // Only initialize if no data exists (first run)
    if (!localStorage.getItem(KEYS.units)) {
        saveData(KEYS.units, initialUnits);
    }
    if (!localStorage.getItem(KEYS.categories)) {
        saveData(KEYS.categories, initialCategories);
    }
    if (!localStorage.getItem(KEYS.subcategories)) {
        saveData(KEYS.subcategories, initialSubcategories);
    }
    if (!localStorage.getItem(KEYS.inventory)) {
        saveData(KEYS.inventory, initialInventory);
    }
    if (!localStorage.getItem(KEYS.customers)) {
        saveData(KEYS.customers, initialCustomers);
    }
    if (!localStorage.getItem(KEYS.leads)) {
        saveData(KEYS.leads, initialLeads);
    }
    if (!localStorage.getItem(KEYS.orders)) {
        saveData(KEYS.orders, initialOrders);
    }
    if (!localStorage.getItem(KEYS.routes)) {
        saveData(KEYS.routes, initialRoutes);
    }
    if (!localStorage.getItem(KEYS.employees)) {
        saveData(KEYS.employees, initialEmployees);
    }
    if (!localStorage.getItem(KEYS.roles)) {
        saveData(KEYS.roles, initialRoles);
    }
    if (!localStorage.getItem(KEYS.priceTiers)) {
        saveData(KEYS.priceTiers, initialPriceTiers);
    }
    if (!localStorage.getItem(KEYS.websiteLinks)) {
        saveData(KEYS.websiteLinks, { aboutUs: '', privacyPolicy: '', termsConditions: '' });
    }
    if (!localStorage.getItem(KEYS.partners)) {
        saveData(KEYS.partners, []);
    }
    if (!localStorage.getItem(KEYS.banners)) {
        saveData(KEYS.banners, []);
    }
}

/**
 * Reset all data to initial mock values
 */
export function resetDb() {
    saveData(KEYS.units, initialUnits);
    saveData(KEYS.categories, initialCategories);
    saveData(KEYS.subcategories, initialSubcategories);
    saveData(KEYS.inventory, initialInventory);
    saveData(KEYS.customers, initialCustomers);
    saveData(KEYS.leads, initialLeads);
    saveData(KEYS.orders, initialOrders);
    saveData(KEYS.routes, initialRoutes);
    saveData(KEYS.employees, initialEmployees);
    saveData(KEYS.roles, initialRoles);
    saveData(KEYS.priceTiers, initialPriceTiers);
    saveData(KEYS.websiteLinks, { aboutUs: '', privacyPolicy: '', termsConditions: '' });
    saveData(KEYS.partners, []);
    saveData(KEYS.banners, []);
}

export { KEYS };
