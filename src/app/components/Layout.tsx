'use client';

import React, { useState } from 'react';
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  Wallet,
  UserCog,
  Briefcase,
  MapPin,
  Menu,
  X,
  LogOut,
  Box,
  Settings,
  Layers,
  Carrot
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const tabs = [
  { id: 'orders', label: 'Live Orders', icon: ShoppingCart },
  { id: 'inventory', label: 'Inventory (Stock)', icon: Package },
  { id: 'items', label: 'Item Definitions', icon: Box },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'routes', label: 'Routes', icon: MapPin },
  { id: 'employees', label: 'Employees', icon: Briefcase },
  { id: 'roles', label: 'Employee Roles', icon: UserCog },
  { id: 'configuration', label: 'Configuration', icon: Settings },
  { id: 'pricingTiers', label: 'Pricing Tiers', icon: Layers },
  { id: 'wallets', label: 'Wallets', icon: Wallet },
];

export function Layout({ children, activeTab, onTabChange, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                <Carrot className="w-5 h-5 shrink-0" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xl font-bold text-gray-900 tracking-tight leading-none uppercase font-serif">Simply Veggie</span>
                <span className="text-[9px] text-gray-500 mt-1 italic font-serif">your kitchen partner</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-colors ${isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User info & Legal */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                <UserCog className="w-5 h-5 text-green-700" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">Super Admin</div>
                <div className="text-xs text-gray-500">admin@example.com</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 mb-4"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
            <div className="pt-2 border-t text-[10px] text-gray-400 text-center uppercase tracking-widest">
              © {new Date().getFullYear()} FUTURE VEGGIES INDIA PRIVATE LIMITED
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>

            <h1 className="text-xl">
              {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
            </h1>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}