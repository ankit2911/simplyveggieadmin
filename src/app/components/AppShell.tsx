'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  Wallet,
  Briefcase,
  MapPin,
  Menu,
  X,
  LogOut,
  Box,
  Settings,
  Layers,
  LayoutDashboard
} from 'lucide-react';

import { useAdmin } from '../context/AdminContext';
import { LoginPage } from './LoginPage';

interface LayoutProps {
  children: React.ReactNode;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { id: 'orders', label: 'Live Orders', icon: ShoppingCart, href: '/orders' },
  { id: 'inventory', label: 'Inventory (Stock)', icon: Package, href: '/inventory' },
  { id: 'items', label: 'Item Definitions', icon: Box, href: '/items' },
  { id: 'pricing', label: 'Pricing', icon: DollarSign, href: '/pricing' },
  { id: 'customers', label: 'Customers', icon: Users, href: '/customers' },
  { id: 'routes', label: 'Routes', icon: MapPin, href: '/routes' },
  { id: 'employees', label: 'Employees', icon: Briefcase, href: '/employees' },
  { id: 'configuration', label: 'Configuration', icon: Settings, href: '/configuration' },
  { id: 'pricingTiers', label: 'Pricing Tiers', icon: Layers, href: '/pricingTiers' },
  { id: 'wallets', label: 'Wallets', icon: Wallet, href: '/wallets' },
];

export function AppShell({ children }: LayoutProps) {
  const { logout: onLogout, isAuthenticated, login, currentUser, hasPermission } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogin = async (email: string, pass: string) => {
    if (!await login(email, pass)) {
      alert('Invalid credentials');
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <style>{`
        .app-container {
          display: flex;
          min-height: 100vh;
          background: #fafafa;
        }
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 240px;
          background: white;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          z-index: 40;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }
        .sidebar.open {
          transform: translateX(0);
        }
        @media (min-width: 1024px) {
          .sidebar {
            transform: translateX(0);
          }
        }
        .sidebar-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #f39c12, #e67e22);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .logo-text {
          display: flex;
          flex-direction: column;
        }
        .logo-simply {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .logo-veggie {
          font-size: 18px;
          font-weight: 800;
          color: #108542;
          text-transform: uppercase;
          margin-top: -2px;
        }
        .logo-tagline {
          font-size: 9px;
          color: #999;
          font-style: italic;
        }
        .nav-section {
          flex: 1;
          overflow-y: auto;
          padding: 12px 8px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          margin: 2px 0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }
        .nav-item:hover {
          background: #f3f4f6;
          color: #111;
        }
        .nav-item.active {
          background: #dcfce7;
          color: #108542;
        }
        .nav-item svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
        .user-section {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          background: #fafafa;
        }
        .user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .user-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #2ecc71, #108542);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }
        .user-info {
          flex: 1;
          min-width: 0;
        }
        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: #111;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-email {
          font-size: 11px;
          color: #666;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 8px;
          border-radius: 8px;
          background: transparent;
          color: #dc2626;
          font-size: 13px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .logout-btn:hover {
          background: #fef2f2;
        }
        .copyright {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 9px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .main-content {
          flex: 1;
          margin-left: 0;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 1024px) {
          .main-content {
            margin-left: 240px;
          }
        }
        .main-header {
          position: sticky;
          top: 0;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 0 24px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 30;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .menu-btn {
          display: flex;
          padding: 8px;
          border-radius: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .menu-btn:hover {
          background: #f3f4f6;
        }
        @media (min-width: 1024px) {
          .menu-btn {
            display: none;
          }
        }
        .page-title {
          font-size: 16px;
          font-weight: 600;
          color: #111;
        }
        .main-body {
          flex: 1;
          padding: 24px;
        }
        .backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 30;
          display: none;
        }
        .backdrop.open {
          display: block;
        }
        @media (min-width: 1024px) {
          .backdrop {
            display: none !important;
          }
        }
      `}</style>

      <div className="app-container">
        {/* Backdrop for mobile */}
        <div
          className={`backdrop ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7z" />
                <path d="M8.64 14.27a4.5 4.5 0 0 1 5.99-6.01" />
                <path d="M14 6s3-2 6-2-3 3-3 3" />
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-simply">Simply</span>
              <span className="logo-veggie">VEGGIE</span>
              <span className="logo-tagline">your kitchen partner</span>
            </div>
            <button
              className="menu-btn"
              onClick={() => setSidebarOpen(false)}
              style={{ marginLeft: 'auto' }}
            >
              <X size={20} color="#666" />
            </button>
          </div>

          <nav className="nav-section">
            {tabs.filter(tab => hasPermission(tab.id) || hasPermission('all')).map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    router.push(tab.href);
                    setSidebarOpen(false);
                  }}
                  className={`nav-item ${active ? 'active' : ''}`}
                >
                  <Icon />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="user-section">
            <div className="user-card">
              <div className="user-avatar">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="user-info">
                <div className="user-name">{currentUser?.name || 'User'}</div>
                <div className="user-email">{currentUser?.email || ''}</div>
              </div>
            </div>
            <button onClick={onLogout} className="logout-btn">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
            <div className="copyright">
              © {new Date().getFullYear()} Future Veggies India<br />Private Limited
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="main-content">
          <header className="main-header">
            <div className="header-left">
              <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
                <Menu size={20} color="#666" />
              </button>
              <h1 className="page-title">
                {tabs.find(t => isActive(t.href))?.label || 'Dashboard'}
              </h1>
            </div>
          </header>

          <main className="main-body">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}