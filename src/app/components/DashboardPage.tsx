'use client';

import React from 'react';
import {
    ShoppingCart,
    Users,
    Package,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle,
    Truck,
    AlertCircle,
    ArrowRight,
    Carrot,
    Leaf
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useRouter } from 'next/navigation';

export function DashboardPage() {
    const { orders, customers, products } = useAdmin();
    const router = useRouter();

    const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
    });

    const pendingOrders = orders.filter(o => o.status === 'Created' || o.status === 'Accepted' || o.status === 'Processing');
    const totalRevenue = orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.total, 0);

    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const getCustomerName = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        return customer?.name || 'Unknown Customer';
    };

    const getStatusStyle = (status: string) => {
        const styles: Record<string, { bg: string; color: string }> = {
            Created: { bg: '#dbeafe', color: '#1d4ed8' },
            Processing: { bg: '#fef3c7', color: '#b45309' },
            Dispatched: { bg: '#e9d5ff', color: '#7c3aed' },
            Delivered: { bg: '#dcfce7', color: '#15803d' },
            Cancelled: { bg: '#fee2e2', color: '#dc2626' },
        };
        return styles[status] || styles.Created;
    };

    const StatusIcon = ({ status }: { status: string }) => {
        const props = { size: 12 };
        switch (status) {
            case 'Created': return <Clock {...props} />;
            case 'Processing': return <Package {...props} />;
            case 'Dispatched': return <Truck {...props} />;
            case 'Delivered': return <CheckCircle {...props} />;
            default: return <AlertCircle {...props} />;
        }
    };

    return (
        <>
            <style>{`
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .welcome-banner {
          background: linear-gradient(135deg, #108542, #2ecc71);
          border-radius: 20px;
          padding: 32px;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(16, 133, 66, 0.25);
        }
        .welcome-icon {
          position: absolute;
          opacity: 0.1;
          color: white;
        }
        .welcome-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .welcome-subtitle {
          font-size: 15px;
          opacity: 0.85;
          max-width: 500px;
        }
        .welcome-stats {
          display: flex;
          gap: 16px;
          margin-top: 24px;
          flex-wrap: wrap;
        }
        .welcome-stat {
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          padding: 12px 16px;
        }
        .welcome-stat-label {
          font-size: 12px;
          opacity: 0.7;
        }
        .welcome-stat-value {
          font-size: 24px;
          font-weight: 700;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .stat-card {
          border-radius: 16px;
          padding: 20px;
          color: white;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-4px);
        }
        .stat-card-circle {
          position: absolute;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
        }
        .stat-icon {
          display: inline-flex;
          padding: 10px;
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
          margin-bottom: 12px;
        }
        .stat-label {
          font-size: 13px;
          opacity: 0.8;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 700;
        }
        .stat-change {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          margin-top: 8px;
        }
        .content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 1024px) {
          .content-grid {
            grid-template-columns: 2fr 1fr;
          }
        }
        .card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #f3f4f6;
        }
        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: #111;
        }
        .card-subtitle {
          font-size: 13px;
          color: #666;
        }
        .card-link {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #108542;
          font-weight: 500;
          cursor: pointer;
          background: none;
          border: none;
          transition: gap 0.2s;
        }
        .card-link:hover {
          gap: 8px;
        }
        .order-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          transition: background 0.15s;
        }
        .order-row:hover {
          background: #fafafa;
        }
        .order-id {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #108542;
          flex-shrink: 0;
        }
        .order-info {
          flex: 1;
          min-width: 0;
        }
        .order-customer {
          font-size: 14px;
          font-weight: 500;
          color: #111;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .order-details {
          font-size: 12px;
          color: #666;
        }
        .order-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
        }
        .empty-state {
          padding: 48px 20px;
          text-align: center;
          color: #999;
        }
        .empty-state svg {
          color: #ddd;
          margin-bottom: 12px;
        }
        .quick-actions {
          padding: 16px;
        }
        .quick-action {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }
        .quick-action:hover {
          border-color: #d1d5db;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .quick-action:last-child {
          margin-bottom: 0;
        }
        .quick-action-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .quick-action:hover .quick-action-icon {
          transform: scale(1.1);
        }
        .quick-action-text {
          flex: 1;
        }
        .quick-action-title {
          font-size: 13px;
          font-weight: 600;
          color: #111;
        }
        .quick-action-desc {
          font-size: 11px;
          color: #666;
        }
        .quick-action-arrow {
          color: #9ca3af;
          transition: transform 0.2s;
        }
        .quick-action:hover .quick-action-arrow {
          transform: translateX(4px);
        }
      `}</style>

            <div className="dashboard">
                {/* Welcome Banner */}
                <div className="welcome-banner">
                    <Carrot className="welcome-icon" style={{ top: 20, right: 40, width: 100, height: 100, transform: 'rotate(15deg)' }} />
                    <Leaf className="welcome-icon" style={{ bottom: 20, right: 160, width: 70, height: 70, transform: 'rotate(-15deg)' }} />

                    <div className="welcome-title">Welcome to Simply Veggie Admin 🥕</div>
                    <div className="welcome-subtitle">
                        Your kitchen partner's control center. Manage orders, inventory, and customers all in one place.
                    </div>

                    <div className="welcome-stats">
                        <div className="welcome-stat">
                            <div className="welcome-stat-label">Active Orders</div>
                            <div className="welcome-stat-value">{pendingOrders.length}</div>
                        </div>
                        <div className="welcome-stat">
                            <div className="welcome-stat-label">Today's Orders</div>
                            <div className="welcome-stat-value">{todayOrders.length}</div>
                        </div>
                        <div className="welcome-stat">
                            <div className="welcome-stat-label">Total Customers</div>
                            <div className="welcome-stat-value">{customers.length}</div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    {[
                        { label: 'Total Orders', value: orders.length, change: 12, gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', shadow: 'rgba(59, 130, 246, 0.3)', Icon: ShoppingCart },
                        { label: 'Active Customers', value: customers.length, change: 8, gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', shadow: 'rgba(139, 92, 246, 0.3)', Icon: Users },
                        { label: 'Products', value: products.length, change: -2, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245, 158, 11, 0.3)', Icon: Package },
                        { label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, change: 15, gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16, 185, 129, 0.3)', Icon: TrendingUp },
                    ].map((stat, idx) => (
                        <div key={idx} className="stat-card" style={{ background: stat.gradient, boxShadow: `0 8px 24px ${stat.shadow}` }}>
                            <div className="stat-card-circle" style={{ width: 80, height: 80, top: -20, right: -20 }} />
                            <div className="stat-card-circle" style={{ width: 100, height: 100, bottom: -40, left: -40 }} />
                            <div className="stat-icon">
                                <stat.Icon size={20} />
                            </div>
                            <div className="stat-label">{stat.label}</div>
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-change" style={{ color: stat.change >= 0 ? '#a7f3d0' : '#fecaca' }}>
                                {stat.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {Math.abs(stat.change)}% from last week
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content Grid */}
                <div className="content-grid">
                    {/* Recent Orders */}
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">Recent Orders</div>
                                <div className="card-subtitle">Latest customer orders</div>
                            </div>
                            <button className="card-link" onClick={() => router.push('/orders')}>
                                View all <ArrowRight size={14} />
                            </button>
                        </div>

                        {recentOrders.length === 0 ? (
                            <div className="empty-state">
                                <ShoppingCart size={48} />
                                <div>No orders yet</div>
                            </div>
                        ) : (
                            recentOrders.map((order) => {
                                const statusStyle = getStatusStyle(order.status);
                                return (
                                    <div key={order.id} className="order-row">
                                        <div className="order-id">#{order.id.slice(-2)}</div>
                                        <div className="order-info">
                                            <div className="order-customer">{getCustomerName(order.customerId)}</div>
                                            <div className="order-details">{order.items.length} items • ₹{order.total.toLocaleString()}</div>
                                        </div>
                                        <div className="order-status" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                                            <StatusIcon status={order.status} />
                                            {order.status}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">Quick Actions</div>
                                <div className="card-subtitle">Common tasks at your fingertips</div>
                            </div>
                        </div>
                        <div className="quick-actions">
                            {[
                                { title: 'View Live Orders', desc: 'Process and manage orders', href: '/orders', bg: '#dbeafe', color: '#1d4ed8', Icon: ShoppingCart },
                                { title: 'Manage Inventory', desc: 'Update stock levels', href: '/inventory', bg: '#fef3c7', color: '#d97706', Icon: Package },
                                { title: 'Customer List', desc: 'View and manage customers', href: '/customers', bg: '#e9d5ff', color: '#7c3aed', Icon: Users },
                                { title: 'Update Pricing', desc: 'Modify product prices', href: '/pricing', bg: '#dcfce7', color: '#059669', Icon: TrendingUp },
                            ].map((action, idx) => (
                                <button key={idx} className="quick-action" onClick={() => router.push(action.href)}>
                                    <div className="quick-action-icon" style={{ background: action.bg }}>
                                        <action.Icon size={18} color={action.color} />
                                    </div>
                                    <div className="quick-action-text">
                                        <div className="quick-action-title">{action.title}</div>
                                        <div className="quick-action-desc">{action.desc}</div>
                                    </div>
                                    <ArrowRight size={16} className="quick-action-arrow" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
