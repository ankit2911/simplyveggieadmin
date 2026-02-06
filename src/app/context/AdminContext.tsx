import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  initialUnits, initialCategories, initialSubcategories,
  initialInventory, initialCustomers, initialOrders,
  initialPriceTiers, initialRoutes, initialEmployees,
  initialRoles, initialLeads
} from '../services/mockDb';
import { loadData, saveData, KEYS, initializeDb, resetDb } from '../services/db';

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
  subcategoryId: string;
  category?: string; // Legacy
  tags: string[];
  packSizes: string[];
  quantityInStock: Record<string, number>;
  minStockLevel: number;
  unit: string; // Legacy default unit
  basePrice: Record<string, number>;
  sku?: string;
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
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  // Master Data Methods
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (subcategory: Omit<Subcategory, 'id'>) => void;
  updateSubcategory: (id: string, subcategory: Partial<Subcategory>) => void;
  deleteSubcategory: (id: string) => void;
  addUnit: (unit: Omit<Unit, 'id'>) => void;
  updateUnit: (id: string, unit: Partial<Unit>) => void;
  deleteUnit: (id: string) => void;

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
  useEffect(() => {
    initializeDb();
    setIsInitialized(true);
  }, []);

  // Initialize Data from localStorage (with mockDb fallback)
  const [leads, setLeads] = useState<Lead[]>(() => loadData(KEYS.leads, initialLeads));
  const [customers, setCustomers] = useState<Customer[]>(() => loadData(KEYS.customers, initialCustomers));
  const [orders, setOrders] = useState<Order[]>(() => loadData(KEYS.orders, initialOrders));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadData(KEYS.inventory, initialInventory));

  const [units, setUnits] = useState<Unit[]>(() => loadData(KEYS.units, initialUnits));
  const [categories, setCategories] = useState<Category[]>(() => loadData(KEYS.categories, initialCategories));
  const [subcategories, setSubcategories] = useState<Subcategory[]>(() => loadData(KEYS.subcategories, initialSubcategories));

  const [priceTiers, setPriceTiers] = useState<PriceTier[]>(() => loadData(KEYS.priceTiers, initialPriceTiers));
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [employeeRoles, setEmployeeRoles] = useState<EmployeeRole[]>(() => loadData(KEYS.roles, initialRoles));
  const [employees, setEmployees] = useState<Employee[]>(() => loadData(KEYS.employees, initialEmployees));
  const [routes, setRoutes] = useState<Route[]>(() => loadData(KEYS.routes, initialRoutes));

  const [websiteLinks, setWebsiteLinks] = useState<WebsiteLinks>(() => loadData(KEYS.websiteLinks, {
    aboutUs: 'https://example.com/about',
    privacyPolicy: 'https://example.com/privacy',
    termsConditions: 'https://example.com/terms'
  }));
  const [partners, setPartners] = useState<Partner[]>(() => loadData(KEYS.partners, []));
  const [banners, setBanners] = useState<Banner[]>(() => loadData(KEYS.banners, []));
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(() => loadData(KEYS.pricingRules, []));

  // Auto-save to localStorage on state changes
  useEffect(() => { if (isInitialized) saveData(KEYS.leads, leads); }, [leads, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.customers, customers); }, [customers, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.orders, orders); }, [orders, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.inventory, inventory); }, [inventory, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.units, units); }, [units, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.categories, categories); }, [categories, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.subcategories, subcategories); }, [subcategories, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.priceTiers, priceTiers); }, [priceTiers, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.roles, employeeRoles); }, [employeeRoles, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.employees, employees); }, [employees, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.routes, routes); }, [routes, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.websiteLinks, websiteLinks); }, [websiteLinks, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.partners, partners); }, [partners, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.banners, banners); }, [banners, isInitialized]);
  useEffect(() => { if (isInitialized) saveData(KEYS.pricingRules, pricingRules); }, [pricingRules, isInitialized]);


  const login = (email: string, pass: string) => { setIsAuthenticated(true); return true; };
  const logout = () => setIsAuthenticated(false);

  const resetData = () => {
    resetDb();
    window.location.reload(); // Force reload to pick up new data from localStorage
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

  const addOrder = (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    setOrders([...orders, { ...order, id: `o${Date.now()}`, createdAt: now, updatedAt: now }]);
  };
  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(orders.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o));
  };
  const bulkUpdateOrderStatus = (ids: string[], status: OrderStatus) => {
    setOrders(orders.map(o => ids.includes(o.id) ? { ...o, status, updatedAt: new Date().toISOString() } : o));
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    setInventory([...inventory, { ...item, id: `i${Date.now()}` }]);
  };
  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory(inventory.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  // Master Data Actions
  const addCategory = (cat: Omit<Category, 'id'>) => setCategories([...categories, { ...cat, id: `c${Date.now()}` }]);
  const updateCategory = (id: string, updates: Partial<Category>) => setCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
  const deleteCategory = (id: string) => setCategories(categories.filter(c => c.id !== id));

  const addSubcategory = (sub: Omit<Subcategory, 'id'>) => setSubcategories([...subcategories, { ...sub, id: `sc${Date.now()}` }]);
  const updateSubcategory = (id: string, updates: Partial<Subcategory>) => setSubcategories(subcategories.map(s => s.id === id ? { ...s, ...updates } : s));
  const deleteSubcategory = (id: string) => setSubcategories(subcategories.filter(s => s.id !== id));

  const addUnit = (unit: Omit<Unit, 'id'>) => setUnits([...units, { ...unit, id: `u${Date.now()}` }]);
  const updateUnit = (id: string, updates: Partial<Unit>) => setUnits(units.map(u => u.id === id ? { ...u, ...updates } : u));
  const deleteUnit = (id: string) => setUnits(units.filter(u => u.id !== id));

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
        ? [...new Set([...r.customerIds, ...ids])]
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
      leads, customers, orders, inventory, categories, subcategories, units, priceTiers, walletTransactions,
      employees, employeeRoles, routes, isAuthenticated,
      websiteLinks, partners, banners,
      currentUser, setCurrentUser,
      resetData,
      login, logout,
      addCustomer, updateCustomer,
      addLead, updateLead, deleteLead,
      addOrder, updateOrder, bulkUpdateOrderStatus,
      addInventoryItem, updateInventoryItem,
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