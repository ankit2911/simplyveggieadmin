'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { loadData, saveData, KEYS } from '../services/db';
import { toast } from 'sonner';

// --- Interfaces ---

export interface Lead {
  id: string;
  businessName: string;
  phone: string;
  status: 'New' | 'Contacted' | 'Ready' | 'Converted';
  salesPersonId?: string; // Employee ID (Origin)
  comments?: string;
  createdAt: string;
}

export interface Address {
  id: string;
  type: 'billing' | 'shipping';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  landmark?: string;
  attention?: string;
}

export interface Customer {
  id: string;
  businessName: string;
  contactPerson?: string;
  type: 'b2b' | 'b2c';
  phone: string;
  email?: string;
  roleIds?: string[];
  isActive?: boolean;
  status?: string;
  pan?: string;
  gstin?: string;
  authorizedUsers: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  }[];
  addresses: Address[];
  tierId?: string;
  routeId?: string;
  // Account Management
  salesPersonId?: string;        // Origin: Who brought them in
  keyAccountManagerId?: string;  // Owner: Who manages them now
  comments?: string;             // Notes/History
  walletBalance: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string | null;
  itemName: string;
  packSize: string;
  orderedQuantity: number;
  deliveredQuantity?: number;
  pricePerUnit: number;
}

export type OrderStatus = 'Created' | 'Accepted' | 'Processing' | 'Packed' | 'Dispatched' | 'Delivered';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  invoiceDate?: string;
  invoiceNumber?: string;
  paymentStatus?: 'pending' | 'paid' | 'overdue';
  deliveryDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string | null;
  sku?: string | null;
  description?: string | null;

  // Relations
  category?: Category;
  subcategory?: Subcategory;

  // Inventory Data (from relation)
  unit: {
    id: string;
    name: string;
    symbol: string;
  };

  // basePrice removed - strictly distinct from Product

  actualStock: number;
  upcomingStock: number;

  // Recent History
  adjustments?: {
    id: string;
    delta: number;
    type: string;
    reason?: string | null;
    createdAt: string;
    referenceId?: string | null;
  }[];
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string | null;
  unitId: string;
  sku: string | null;
  description: string | null;
  basePrice: number;

  // Relations
  category?: Category;
  subcategory?: Subcategory;
  unit?: Unit;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  price: number | null;
  conversionFactor: number;
}

export interface PriceTierItem {
  itemId: string;
  itemName: string;
  packSize: string;
  price: number;
  visible: boolean;
}

export interface PriceTier {
  id: string;
  name: string;
  description: string;
  // Catalog visibility - SKU is visible if included via any of these
  includedCategoryIds: string[];     // Whole categories
  includedSubcategoryIds: string[];  // Specific subcategories
  includedSkuIds: string[];          // Explicit SKU IDs
  // Pricing items
  items: PriceTierItem[];
}

// Pricing Rules - apply adjustments by tier
export type AdjustmentType = 'fixed' | 'percent' | 'constant';
export interface PricingRule {
  id: string;
  tierId: string;
  level: 'category' | 'subcategory' | 'sku';
  targetId: string;                   // categoryId, subcategoryId, or skuId
  adjustmentType: AdjustmentType;     // 'fixed' = ±₹X, 'percent' = ±X%, 'constant' = flat ₹X
  adjustmentOp: 'add' | 'subtract';   // Only for fixed/percent
  adjustmentValue: number;
}

export interface WalletTransaction {
  id: string;
  customerId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: string;
}

export interface EmployeeRole {
  id: string;
  name: string;
  permissions: {
    appAccess: boolean;
    modules: string[];
  };
}

export interface Employee {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  roleIds: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Route {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  customerIds: string[];
}

export interface WebsiteLinks {
  aboutUs: string;
  privacyPolicy: string;
  termsConditions: string;
}

export interface Partner {
  id: string;
  name: string;
  imageUrl: string;
  websiteUrl: string;
}

export interface Banner {
  id: string;
  name: string;
  order: number;
  imageUrl: string;
  linkUrl: string;
}

interface AdminContextType {
  leads: Lead[];
  customers: Customer[];
  orders: Order[];
  inventory: InventoryItem[];
  products: Product[];
  categories: Category[];
  subcategories: Subcategory[];
  units: Unit[];
  priceTiers: PriceTier[];
  walletTransactions: WalletTransaction[];
  employeeRoles: EmployeeRole[];
  employees: Employee[];
  routes: Route[];
  websiteLinks: WebsiteLinks;
  partners: Partner[];
  banners: Banner[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  currentUser: Employee | null;
  setCurrentUser: (user: Employee | null) => void;
  resetData: () => void;
  // Methods
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  updateLead: (id: string, lead: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  bulkUpdateOrderStatus: (orderIds: string[], status: OrderStatus) => void;
  // Inventory Actions
  adjustInventory: (productId: string, delta: number, type: string, reason?: string, variantId?: string) => Promise<void>;

  // Product Actions
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  // Master Data Methods
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => Promise<void>;
  addSubcategory: (subcategory: Omit<Subcategory, 'id'>) => Promise<void>;
  updateSubcategory: (id: string, subcategory: Partial<Subcategory>) => void;
  deleteSubcategory: (id: string) => Promise<void>;
  addUnit: (unit: Omit<Unit, 'id'>) => Promise<void>;
  updateUnit: (id: string, unit: Partial<Unit>) => void;
  deleteUnit: (id: string) => Promise<void>;

  addPriceTier: (tier: Omit<PriceTier, 'id'>) => void;
  updatePriceTier: (id: string, tier: Partial<PriceTier>) => void;
  // Pricing Rules
  pricingRules: PricingRule[];
  addPricingRule: (rule: Omit<PricingRule, 'id'>) => void;
  updatePricingRule: (id: string, rule: Partial<PricingRule>) => void;
  deletePricingRule: (id: string) => void;

  addWalletTransaction: (transaction: Omit<WalletTransaction, 'id' | 'timestamp'>) => void;
  updateWallet: (customerId: string, amount: number) => void;
  addEmployeeRole: (role: Omit<EmployeeRole, 'id'>) => void;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  addRoute: (route: Omit<Route, 'id'>) => void;
  updateRoute: (id: string, route: Partial<Route>) => void;
  bulkAssignRoute: (customerIds: string[], routeId: string) => void;
  removeCustomerFromRoute: (customerId: string) => void;
  // Website Config
  updateWebsiteLinks: (links: Partial<WebsiteLinks>) => void;
  addPartner: (partner: Omit<Partner, 'id'>) => void;
  updatePartner: (id: string, updates: Partial<Partner>) => void;
  deletePartner: (id: string) => void;
  addBanner: (banner: Omit<Banner, 'id'>) => void;
  updateBanner: (id: string, updates: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize DB on mount
  // Initialize DB on mount
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Initialize Data from localStorage (with mockDb fallback)
  // Initialize Data from localStorage (with empty fallback)
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [employeeRoles, setEmployeeRoles] = useState<EmployeeRole[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  const [websiteLinks, setWebsiteLinks] = useState<WebsiteLinks>(() => loadData(KEYS.websiteLinks, {
    aboutUs: 'https://example.com/about',
    privacyPolicy: 'https://example.com/privacy',
    termsConditions: 'https://example.com/terms'
  }));
  const [partners, setPartners] = useState<Partner[]>(() => loadData(KEYS.partners, []));
  const [banners, setBanners] = useState<Banner[]>(() => loadData(KEYS.banners, []));
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(() => loadData(KEYS.pricingRules, []));

  // Auto-save to localStorage on state changes
  // Auto-save to localStorage on state changes (only for legacy sections)
  // Inventory, Units, Categories, Subcategories are now DB-backed and do not use localStorage
  useEffect(() => { if (isInitialized) saveData(KEYS.leads, leads); }, [leads, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.customers, customers); }, [customers, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.orders, orders); }, [orders, isInitialized]);
  // useEffect(() => { if (isInitialized) saveData(KEYS.inventory, inventory); }, [inventory, isInitialized]);
  // useEffect(() => { if (isInitialized) saveData(KEYS.units, units); }, [units, isInitialized]);
  // useEffect(() => { if (isInitialized) saveData(KEYS.categories, categories); }, [categories, isInitialized]);
  // useEffect(() => { if (isInitialized) saveData(KEYS.subcategories, subcategories); }, [subcategories, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.priceTiers, priceTiers); }, [priceTiers, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.roles, employeeRoles); }, [employeeRoles, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.employees, employees); }, [employees, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.routes, routes); }, [routes, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.websiteLinks, websiteLinks); }, [websiteLinks, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.partners, partners); }, [partners, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.banners, banners); }, [banners, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.pricingRules, pricingRules); }, [pricingRules, isInitialized]);

  // --- Actions ---

  // --- Actions ---

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      if (!res.ok) throw new Error('Failed to fetch inventory');
      const data = await res.json();

      const mappeditems: InventoryItem[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        categoryId: p.categoryId,
        subcategoryId: p.subcategoryId,
        sku: p.sku,
        description: p.description,
        category: p.category,
        subcategory: p.subcategory,
        unit: p.unit,
        // basePrice removed
        actualStock: p.inventory?.actualStock ?? 0,
        upcomingStock: p.inventory?.upcomingStock ?? 0,
        adjustments: p.InventoryAdjustment,
      }));
      setInventory(mappeditems);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      // Ensure strict typing
      const mappedProducts: Product[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        categoryId: p.categoryId,
        subcategoryId: p.subcategoryId,
        unitId: p.unitId,
        sku: p.sku,
        description: p.description,
        basePrice: p.basePrice || 0,
        category: p.category,
        subcategory: p.subcategory,
        unit: p.unit,
        variants: p.variants || []
      }));
      setProducts(mappedProducts);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products');
    }
  };

  const fetchMasters = async () => {
    try {
      const [uRes, cRes, sRes] = await Promise.all([
        fetch('/api/units'),
        fetch('/api/categories'),
        fetch('/api/subcategories')
      ]);

      if (uRes.ok) setUnits(await uRes.json());
      if (cRes.ok) setCategories(await cRes.json());
      if (sRes.ok) setSubcategories(await sRes.json());

    } catch (e) {
      console.error("Failed to load masters", e);
      toast.error("Failed to load configuration data");
    }
  };

  const initializeDb = async () => {
    await Promise.all([fetchInventory(), fetchProducts(), fetchMasters()]);

    // Load other mock data for now
    setCustomers(loadData(KEYS.customers, []));
    setOrders(loadData(KEYS.orders, []));
    setPriceTiers(loadData(KEYS.priceTiers, []));
    setRoutes(loadData(KEYS.routes, []));
    setEmployees(loadData(KEYS.employees, []));

    setIsInitialized(true);
  };

  useEffect(() => {
    initializeDb();
  }, []);

  const login = (email: string, pass: string) => { setIsAuthenticated(true); return true; };
  const logout = () => setIsAuthenticated(false);

  const resetData = () => {
    window.location.reload();
  };

  // --- CRUD Implementations ---

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    setCustomers([...customers, { ...customer, id: `c${Date.now()}`, createdAt: new Date().toISOString() }]);
  };
  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addLead = (lead: Omit<Lead, 'id' | 'createdAt'>) => {
    setLeads([...leads, { ...lead, id: `l${Date.now()}`, createdAt: new Date().toISOString() }]);
  };
  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(leads.map(l => l.id === id ? { ...l, ...updates } : l));
  };
  const deleteLead = (id: string) => setLeads(leads.filter(l => l.id !== id));

  const addOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      if (!res.ok) throw new Error("Failed to create order");

      // Refresh orders and inventory
      await Promise.all([
        // fetchOrders(), // You might need to add fetchOrders if it exists or reload
        // For now, re-fetch everything or minimal
        fetchInventory() // Inventory surely changed
      ]);

      // Manually update local state for immediate feedback (optional, or just reload)
      window.location.reload();
    } catch (e) {
      console.error(e);
      toast.error("Failed to create order");
    }
  };
  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(orders.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o));
  };
  const bulkUpdateOrderStatus = (ids: string[], status: OrderStatus) => {
    setOrders(orders.map(o => ids.includes(o.id) ? { ...o, status, updatedAt: new Date().toISOString() } : o));
  };

  // Inventory Mutations
  const adjustInventory = async (productId: string, delta: number, type: string, reason?: string, variantId?: string) => {
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, delta, type, reason, variantId }),
      });

      if (!res.ok) throw new Error('Failed to adjust inventory');
      toast.success('Inventory updated');
      await fetchInventory();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update inventory');
    }
  };

  // Product CRUD
  const addProduct = async (product: any) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (!res.ok) throw new Error("Failed to create product");
      await Promise.all([fetchProducts(), fetchInventory()]);
      toast.success("Product created successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to create product");
    }
  };

  const updateProduct = async (id: string, updates: any) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      if (!res.ok) throw new Error("Failed to update product");
      await Promise.all([fetchProducts(), fetchInventory()]);
      toast.success("Product updated successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update product");
    }
  };

  // Legacy/Deprecated wrappers if needed, but per request we are doing STRICT cleanup.
  // We will simply NOT expose addInventoryItem/updateInventoryItem anymore.

  // Master Data Actions
  const addCategory = async (cat: Omit<Category, 'id'>) => {
    try {
      await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cat) });
      fetchMasters(); // Refresh
    } catch (e) { console.error(e); toast.error("Failed to add category"); }
  };
  const updateCategory = (id: string, updates: Partial<Category>) => { toast.info("Update not implemented yet"); };
  const deleteCategory = async (id: string) => {
    try {
      await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      fetchMasters();
      toast.success("Category deleted");
    } catch (e) { toast.error("Failed to delete category"); }
  };

  const addSubcategory = async (sub: Omit<Subcategory, 'id'>) => {
    try {
      await fetch('/api/subcategories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      fetchMasters();
    } catch (e) { console.error(e); toast.error("Failed to add subcategory"); }
  };
  const updateSubcategory = (id: string, updates: Partial<Subcategory>) => { toast.info("Update not implemented yet"); };
  const deleteSubcategory = async (id: string) => {
    try {
      await fetch(`/api/subcategories?id=${id}`, { method: 'DELETE' });
      fetchMasters();
      toast.success("Subcategory deleted");
    } catch (e) { toast.error("Failed to delete subcategory"); }
  };

  const addUnit = async (unit: Omit<Unit, 'id'>) => {
    try {
      await fetch('/api/units', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(unit) });
      fetchMasters();
    } catch (e) { console.error(e); toast.error("Failed to add unit"); }
  };
  const updateUnit = (id: string, updates: Partial<Unit>) => { toast.info("Update not implemented yet"); };
  const deleteUnit = async (id: string) => {
    try {
      await fetch(`/api/units?id=${id}`, { method: 'DELETE' });
      fetchMasters();
      toast.success("Unit deleted");
    } catch (e) { toast.error("Failed to delete unit"); }
  };

  const addPriceTier = (tier: Omit<PriceTier, 'id'>) => setPriceTiers([...priceTiers, { ...tier, id: `t${Date.now()}` }]);
  const updatePriceTier = (id: string, updates: Partial<PriceTier>) => setPriceTiers(priceTiers.map(t => t.id === id ? { ...t, ...updates } : t));

  // Pricing Rules CRUD
  const addPricingRule = (rule: Omit<PricingRule, 'id'>) => setPricingRules([...pricingRules, { ...rule, id: `pr${Date.now()}` }]);
  const updatePricingRule = (id: string, updates: Partial<PricingRule>) => setPricingRules(pricingRules.map(r => r.id === id ? { ...r, ...updates } : r));
  const deletePricingRule = (id: string) => setPricingRules(pricingRules.filter(r => r.id !== id));

  const addWalletTransaction = (tx: Omit<WalletTransaction, 'id' | 'timestamp'>) => {
    const newTx = { ...tx, id: `wt${Date.now()}`, timestamp: new Date().toISOString() };
    setWalletTransactions([...walletTransactions, newTx]);
    const customer = customers.find(c => c.id === tx.customerId);
    if (customer) {
      const change = tx.type === 'credit' ? tx.amount : -tx.amount;
      updateCustomer(customer.id, { walletBalance: customer.walletBalance + change });
    }
  };
  const updateWallet = (cid: string, amt: number) => {
    addWalletTransaction({ customerId: cid, amount: Math.abs(amt), type: amt > 0 ? 'credit' : 'debit', description: 'Manual Adjustment' });
  };

  const addEmployeeRole = (r: Omit<EmployeeRole, 'id'>) => setEmployeeRoles([...employeeRoles, { ...r, id: `er${Date.now()}` }]);
  const addEmployee = (e: Omit<Employee, 'id' | 'createdAt'>) => setEmployees([...employees, { ...e, id: `e${Date.now()}`, createdAt: new Date().toISOString() }]);
  const updateEmployee = (id: string, upd: Partial<Employee>) => setEmployees(employees.map(e => e.id === id ? { ...e, ...upd } : e));
  const addRoute = (r: Omit<Route, 'id'>) => setRoutes([...routes, { ...r, id: `r${Date.now()}` }]);
  const updateRoute = (id: string, upd: Partial<Route>) => setRoutes(routes.map(r => r.id === id ? { ...r, ...upd } : r));
  const bulkAssignRoute = (ids: string[], routeId: string) => {
    // Also remove customers from their old routes (customerIds array)
    setRoutes(routes.map(r => ({
      ...r,
      customerIds: r.id === routeId
        ? Array.from(new Set([...r.customerIds, ...ids]))
        : r.customerIds.filter(cid => !ids.includes(cid))
    })));
    // Update customer's routeId
    setCustomers(customers.map(c => ids.includes(c.id) ? { ...c, routeId } : c));
  };
  const removeCustomerFromRoute = (customerId: string) => {
    // Remove from routes.customerIds
    setRoutes(routes.map(r => ({
      ...r,
      customerIds: r.customerIds.filter(cid => cid !== customerId)
    })));
    // Clear customer.routeId
    setCustomers(customers.map(c => c.id === customerId ? { ...c, routeId: undefined } : c));
  };

  // Website Config
  const updateWebsiteLinks = (links: Partial<WebsiteLinks>) => setWebsiteLinks({ ...websiteLinks, ...links });
  const addPartner = (p: Omit<Partner, 'id'>) => setPartners([...partners, { ...p, id: `p${Date.now()}` }]);
  const updatePartner = (id: string, upd: Partial<Partner>) => setPartners(partners.map(p => p.id === id ? { ...p, ...upd } : p));
  const deletePartner = (id: string) => setPartners(partners.filter(p => p.id !== id));

  const addBanner = (b: Omit<Banner, 'id'>) => setBanners([...banners, { ...b, id: `b${Date.now()}` }]);
  const updateBanner = (id: string, upd: Partial<Banner>) => setBanners(banners.map(b => b.id === id ? { ...b, ...upd } : b));
  const deleteBanner = (id: string) => setBanners(banners.filter(b => b.id !== id));

  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  return (
    <AdminContext.Provider value={{
      leads, customers, orders, inventory, products, categories, subcategories, units, priceTiers, walletTransactions,
      employees, employeeRoles, routes, isAuthenticated,
      websiteLinks, partners, banners,
      currentUser, setCurrentUser,
      resetData,
      login, logout,
      addCustomer, updateCustomer,
      addLead, updateLead, deleteLead,
      addOrder, updateOrder, bulkUpdateOrderStatus,
      fetchProducts, addProduct, updateProduct,
      adjustInventory,
      addCategory, updateCategory, deleteCategory,
      addSubcategory, updateSubcategory, deleteSubcategory,
      addUnit, updateUnit, deleteUnit,
      addPriceTier, updatePriceTier,
      pricingRules, addPricingRule, updatePricingRule, deletePricingRule,
      addWalletTransaction, updateWallet,
      addEmployeeRole, addEmployee, updateEmployee,
      addRoute, updateRoute, bulkAssignRoute, removeCustomerFromRoute,
      updateWebsiteLinks,
      addPartner, updatePartner, deletePartner,
      addBanner, updateBanner, deleteBanner
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}