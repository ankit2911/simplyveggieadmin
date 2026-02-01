import React, { useState } from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { CustomersPage } from './components/CustomersPage';
import { OrdersPage } from './components/OrdersPage';
import { ItemsPage } from './components/ItemsPage';
import { InventoryPageNew } from './components/InventoryPageNew';
import { PricingPageNew } from './components/PricingPageNew';
import { WalletsPageNew } from './components/WalletsPageNew';
import { RolesPage } from './components/RolesPage';
import { EmployeesPage } from './components/EmployeesPage'; // Corrected import
import { RoutesPageNew } from './components/RoutesPageNew';
import { ConfigurationPage } from './components/ConfigurationPage';
import { PricingTiersPage } from './components/PricingTiersPage';
import { Toaster } from 'sonner';
import { toast } from 'sonner';

function AppContent() {
  const { isAuthenticated, login, logout } = useAdmin();
  const [activeTab, setActiveTab] = useState('customers');

  const handleLogin = (email: string, password: string) => {
    const success = login(email, password);
    if (success) {
      toast.success('Login successful!');
    } else {
      toast.error('Invalid credentials');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'customers':
        return <CustomersPage />;
      case 'orders':
        return <OrdersPage />;
      case 'items':
        return <ItemsPage />;
      case 'inventory':
        return <InventoryPageNew />;
      case 'pricing':
        return <PricingPageNew />;
      case 'wallets':
        return <WalletsPageNew />;
      case 'roles':
        return <RolesPage />;
      case 'employees':
        return <EmployeesPage />; // Corrected usage
      case 'routes':
        return <RoutesPageNew />;
      case 'configuration':
        return <ConfigurationPage />;
      case 'pricingTiers':
        return <PricingTiersPage />;
      default:
        return <CustomersPage />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <AppContent />
      <Toaster position="top-right" richColors />
    </AdminProvider>
  );
}