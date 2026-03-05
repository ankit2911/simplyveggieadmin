'use client';

import React, { useState } from 'react';
import { useAdmin, type Order, type OrderStatus } from '../context/AdminContext';
import { FileText, Check, Printer, Box, Truck, CheckCircle, Edit3, X, Eye, Info } from 'lucide-react';
import { generateOrderInvoicePDF, generatePickListPDF } from '../utils/pdf';
import { toast } from 'sonner';

const workflowSteps: OrderStatus[] = ['Created', 'Accepted', 'Processing', 'Packed', 'Dispatched', 'Delivered'];

const tabColorMap: Record<OrderStatus, { activeBg: string; activeTxt: string; inactiveBg: string; inactiveTxt: string; hoverBg: string; badgeBg: string; border: string }> = {
  Created: { activeBg: '#374151', activeTxt: '#fff', inactiveBg: '#f3f4f6', inactiveTxt: '#6b7280', hoverBg: '#e5e7eb', badgeBg: '#6b7280', border: '#374151' },
  Accepted: { activeBg: '#2563eb', activeTxt: '#fff', inactiveBg: '#eff6ff', inactiveTxt: '#2563eb', hoverBg: '#dbeafe', badgeBg: '#3b82f6', border: '#2563eb' },
  Processing: { activeBg: '#f59e0b', activeTxt: '#fff', inactiveBg: '#fffbeb', inactiveTxt: '#d97706', hoverBg: '#fef3c7', badgeBg: '#d97706', border: '#f59e0b' },
  Packed: { activeBg: '#7c3aed', activeTxt: '#fff', inactiveBg: '#f5f3ff', inactiveTxt: '#7c3aed', hoverBg: '#ede9fe', badgeBg: '#8b5cf6', border: '#7c3aed' },
  Dispatched: { activeBg: '#4f46e5', activeTxt: '#fff', inactiveBg: '#eef2ff', inactiveTxt: '#4f46e5', hoverBg: '#e0e7ff', badgeBg: '#6366f1', border: '#4f46e5' },
  Delivered: { activeBg: '#16a34a', activeTxt: '#fff', inactiveBg: '#f0fdf4', inactiveTxt: '#16a34a', hoverBg: '#dcfce7', badgeBg: '#22c55e', border: '#16a34a' },
};

export function OrdersPage() {
  const { orders, customers, updateOrder } = useAdmin();
  const [activeTab, setActiveTab] = useState<OrderStatus>('Created');

  // Modal State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingAddressId, setViewingAddressId] = useState<string | null>(null);

  const filteredOrders = orders.filter(order => order.status === activeTab);

  // --- Workflow Actions ---

  const handleAcceptOrder = (orderId: string) => {
    updateOrder(orderId, { status: 'Accepted' });
    toast.success('Order Accepted');
  };

  const handlePrintPickList = (order: Order) => {
    generatePickListPDF(order);
    updateOrder(order.id, { status: 'Processing' });
    toast.success('Pick List Generated. Order moved to Processing.');
  };

  const handleMarkPacked = (order: Order) => {
    const updatedItems = order.items.map(item => ({
      ...item,
      deliveredQuantity: item.deliveredQuantity ?? item.orderedQuantity
    }));

    const newTotal = updatedItems.reduce((sum, item) => sum + (item.deliveredQuantity! * item.pricePerUnit), 0);

    updateOrder(order.id, {
      status: 'Packed',
      items: updatedItems,
      totalAmount: newTotal
    });
    toast.success('Order Packed. Helper quantities finalized.');
  };

  const handleGenerateInvoice = (order: Order) => {
    generateOrderInvoicePDF(order);
    updateOrder(order.id, { invoiceDate: new Date().toISOString() });
    toast.success('Invoice Generated');
  };

  const handleDispatch = (order: Order) => {
    if (!order.invoiceDate) {
      toast.error('Please generate an invoice before dispatching!');
      return;
    }
    updateOrder(order.id, { status: 'Dispatched' });
    toast.success('Order Dispatched');
  };

  const handleDeliver = (orderId: string) => {
    updateOrder(orderId, { status: 'Delivered' });
    toast.success('Order Delivered');
  };

  // --- Edit Actuals Handlers ---
  const openEditModal = (order: Order) => {
    const itemsWithDefaults = order.items.map(item => ({
      ...item,
      deliveredQuantity: item.deliveredQuantity ?? item.orderedQuantity
    }));
    setEditingOrder({ ...order, items: itemsWithDefaults });
  };

  const updateItemActual = (itemId: string, qty: number) => {
    if (!editingOrder) return;
    setEditingOrder({
      ...editingOrder,
      items: editingOrder.items.map(item =>
        item.id === itemId ? { ...item, deliveredQuantity: qty } : item
      )
    });
  };

  const saveActuals = () => {
    if (!editingOrder) return;
    const newTotal = editingOrder.items.reduce((sum, item) => sum + (item.deliveredQuantity! * item.pricePerUnit), 0);

    updateOrder(editingOrder.id, {
      items: editingOrder.items,
      totalAmount: newTotal
    });
    setEditingOrder(null);
    toast.success('Order quantities updated');
  };

  // --- Helper to get customer details ---
  const getCustomerDetails = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return null;
    const shippingAddr = customer.addresses.find(a => a.type === 'shipping') || customer.addresses[0];
    return {
      attention: shippingAddr?.attention,
      shippingAddr
    };
  };

  return (
    <>
      <style>{`
        .ord-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .ord-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }
        .ord-tabs {
          display: flex;
          overflow-x: auto;
          gap: 8px;
          margin-bottom: 24px;
          padding-bottom: 4px;
          border-bottom: 2px solid;
        }
        .ord-tab {
          padding: 8px 16px;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 500;
          border-radius: 8px 8px 0 0;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ord-tab-badge {
          margin-left: 8px;
          padding: 2px 6px;
          border-radius: 9999px;
          font-size: 11px;
          opacity: 0.9;
        }
        .ord-table-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          border: 1px solid #f3f4f6;
          overflow: hidden;
          min-height: 400px;
        }
        .ord-empty {
          padding: 48px;
          text-align: center;
          color: #9ca3af;
          font-size: 14px;
        }
        .ord-scroll {
          overflow-x: auto;
          padding-bottom: 96px;
        }
        .ord-table {
          width: 100%;
          border-collapse: collapse;
        }
        .ord-thead {
          background: #f9fafb;
          border-bottom: 1px solid #f3f4f6;
        }
        .ord-th {
          padding: 14px 24px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ord-tbody tr {
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }
        .ord-tbody tr:hover {
          background: #f9fafb;
        }
        .ord-td {
          padding: 14px 24px;
        }
        .ord-td-id {
          font-weight: 500;
          color: #111827;
        }
        .ord-td-customer {
          color: #1f2937;
        }
        .ord-customer-name {
          font-weight: 500;
        }
        .ord-customer-attn {
          font-size: 12px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 2px;
        }
        .ord-attn-label {
          background: #f3f4f6;
          padding: 1px 6px;
          border-radius: 4px;
          color: #6b7280;
          font-size: 11px;
        }
        .ord-customer-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ord-td-date {
          color: #6b7280;
          font-size: 13px;
        }
        .ord-td-items {
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ord-td-total {
          font-weight: 700;
          color: #111827;
        }
        .ord-badge-invoice {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 500;
        }
        .ord-badge-yes {
          background: #dcfce7;
          color: #166534;
        }
        .ord-badge-pending {
          background: #fff7ed;
          color: #c2410c;
        }
        .ord-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ord-btn-icon {
          padding: 8px;
          color: #9ca3af;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ord-btn-icon:hover {
          color: #2563eb;
          background: #eff6ff;
        }
        .ord-btn-action {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .ord-btn-green { background: #16a34a; }
        .ord-btn-green:hover { background: #15803d; }
        .ord-btn-blue { background: #2563eb; }
        .ord-btn-blue:hover { background: #1d4ed8; }
        .ord-btn-purple { background: #7c3aed; }
        .ord-btn-purple:hover { background: #6d28d9; }
        .ord-btn-orange { background: #ea580c; }
        .ord-btn-orange:hover { background: #c2410c; }
        .ord-btn-outline-orange {
          background: transparent;
          border: 1px solid #fed7aa;
          color: #c2410c;
        }
        .ord-btn-outline-orange:hover {
          background: #fff7ed;
        }
        .ord-btn-outline-gray {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: transparent;
          border: 1px solid #e5e7eb;
          color: #374151;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }
        .ord-btn-outline-gray:hover {
          background: #f9fafb;
        }
        .ord-info-btn {
          color: #9ca3af;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.15s;
        }
        .ord-info-btn:hover {
          color: #2563eb;
        }
        .ord-popover {
          position: absolute;
          left: 0;
          top: 100%;
          margin-top: 8px;
          width: 256px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          border: 1px solid #e5e7eb;
          z-index: 50;
          padding: 16px;
          font-size: 13px;
        }
        .ord-popover-title {
          font-weight: 500;
          color: #111827;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid #f3f4f6;
        }
        .ord-popover-body {
          color: #6b7280;
        }
        .ord-popover-body p {
          margin: 4px 0;
        }
        .ord-popover-attn {
          font-weight: 500;
          color: #1f2937;
        }
        .ord-popover-landmark {
          font-size: 12px;
          color: #9ca3af;
        }
        .ord-popover-close {
          position: absolute;
          top: 8px;
          right: 8px;
          color: #9ca3af;
          background: none;
          border: none;
          cursor: pointer;
        }
        .ord-popover-close:hover {
          color: #6b7280;
        }
        .ord-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 16px;
        }
        .ord-modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 672px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }
        .ord-modal-header {
          padding: 16px 24px;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9fafb;
        }
        .ord-modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
        .ord-modal-subtitle {
          font-size: 13px;
          color: #9ca3af;
        }
        .ord-modal-close {
          color: #9ca3af;
          cursor: pointer;
          background: none;
          border: none;
          font-size: 18px;
        }
        .ord-modal-close:hover {
          color: #6b7280;
        }
        .ord-modal-body {
          overflow-y: auto;
          padding: 24px;
        }
        .ord-detail-table {
          width: 100%;
          border-collapse: collapse;
        }
        .ord-detail-thead {
          background: #f9fafb;
        }
        .ord-detail-th {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
        }
        .ord-detail-th-right {
          text-align: right;
        }
        .ord-detail-tbody tr {
          border-bottom: 1px solid #f9fafb;
        }
        .ord-detail-td {
          padding: 12px 16px;
        }
        .ord-detail-td-name {
          font-weight: 500;
          color: #111827;
        }
        .ord-detail-td-text {
          color: #6b7280;
        }
        .ord-detail-td-right {
          text-align: right;
          color: #6b7280;
        }
        .ord-detail-delivered {
          color: #111827;
          font-weight: 500;
        }
        .ord-detail-input {
          width: 96px;
          padding: 4px 8px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          text-align: center;
          outline: none;
        }
        .ord-detail-input:focus {
          box-shadow: 0 0 0 2px rgba(59,130,246,0.3);
          border-color: #3b82f6;
        }
        .ord-detail-total {
          background: #f9fafb;
          font-weight: 600;
        }
        .ord-detail-total td {
          padding: 12px 16px;
        }
        .ord-modal-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 24px;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
        }
        .ord-btn-close {
          padding: 8px 16px;
          color: #6b7280;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        .ord-btn-close:hover {
          background: #f9fafb;
        }
        .ord-btn-save {
          padding: 8px 24px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          font-size: 14px;
        }
        .ord-btn-save:hover {
          background: #1d4ed8;
        }
      `}</style>

      <div>
        <div className="ord-header">
          <h2 className="ord-title">Order Processing</h2>
        </div>

        {/* Tabs */}
        <div className="ord-tabs" style={{ borderColor: tabColorMap[activeTab].border }}>
          {workflowSteps.map(step => {
            const colors = tabColorMap[step];
            const isActive = activeTab === step;
            return (
              <button
                key={step}
                onClick={() => setActiveTab(step)}
                className="ord-tab"
                style={{
                  background: isActive ? colors.activeBg : colors.inactiveBg,
                  color: isActive ? colors.activeTxt : colors.inactiveTxt,
                }}
              >
                {step}
                <span className="ord-tab-badge" style={{
                  background: isActive ? 'rgba(255,255,255,0.2)' : colors.badgeBg,
                  color: isActive ? colors.activeTxt : '#fff',
                }}>
                  {orders.filter(o => o.status === step).length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ord-table-card">
          {filteredOrders.length === 0 ? (
            <div className="ord-empty">
              No orders in {activeTab} stage.
            </div>
          ) : (
            <div className="ord-scroll">
              <table className="ord-table">
                <thead className="ord-thead">
                  <tr>
                    <th className="ord-th">Order ID</th>
                    <th className="ord-th">Customer</th>
                    <th className="ord-th">Date</th>
                    <th className="ord-th">Items</th>
                    <th className="ord-th">Total</th>
                    <th className="ord-th">Invoice</th>
                    <th className="ord-th">Actions</th>
                  </tr>
                </thead>
                <tbody className="ord-tbody">
                  {filteredOrders.map(order => {
                    const custDetails = getCustomerDetails(order.customerId);
                    const isAddressOpen = viewingAddressId === order.id;

                    return (
                      <tr key={order.id}>
                        <td className="ord-td ord-td-id">{order.id}</td>
                        <td className="ord-td ord-td-customer" style={{ position: 'relative' }}>
                          <div className="ord-customer-row">
                            <div>
                              <div className="ord-customer-name">{order.customerName}</div>
                              {custDetails?.attention && (
                                <div className="ord-customer-attn">
                                  <span className="ord-attn-label">Attn:</span>
                                  {custDetails.attention}
                                </div>
                              )}
                            </div>

                            {/* Address Info Button */}
                            <div style={{ position: 'relative' }}>
                              <button
                                onClick={() => setViewingAddressId(isAddressOpen ? null : order.id)}
                                className="ord-info-btn"
                                title="View Shipping Address"
                              >
                                <Info style={{ width: 16, height: 16 }} />
                              </button>

                              {/* Address Popover */}
                              {isAddressOpen && custDetails?.shippingAddr && (
                                <div className="ord-popover">
                                  <h4 className="ord-popover-title">Shipping Address</h4>
                                  <div className="ord-popover-body">
                                    {custDetails.shippingAddr.attention && <p className="ord-popover-attn">{custDetails.shippingAddr.attention}</p>}
                                    <p>{custDetails.shippingAddr.street}</p>
                                    {custDetails.shippingAddr.landmark && <p className="ord-popover-landmark">Landmark: {custDetails.shippingAddr.landmark}</p>}
                                    <p>{custDetails.shippingAddr.city}, {custDetails.shippingAddr.state}</p>
                                    <p>{custDetails.shippingAddr.zipCode}</p>
                                  </div>
                                  <button
                                    onClick={() => setViewingAddressId(null)}
                                    className="ord-popover-close"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="ord-td ord-td-date">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="ord-td ord-td-items">
                          <Box style={{ width: 16, height: 16, color: '#9ca3af' }} />
                          {order.items.length} Items
                        </td>
                        <td className="ord-td ord-td-total">₹{order.totalAmount.toFixed(2)}</td>
                        <td className="ord-td">
                          {order.invoiceDate ? (
                            <span className="ord-badge-invoice ord-badge-yes">
                              <CheckCircle style={{ width: 12, height: 12 }} /> Yes ({new Date(order.invoiceDate).toLocaleDateString()})
                            </span>
                          ) : (
                            <span className="ord-badge-invoice ord-badge-pending">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="ord-td">
                          <div className="ord-actions">
                            <button
                              onClick={() => openEditModal(order)}
                              className="ord-btn-icon"
                              title="View Details"
                            >
                              {activeTab === 'Processing' ? <Edit3 style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                            </button>

                            {/* CREATED Actions */}
                            {activeTab === 'Created' && (
                              <button onClick={() => handleAcceptOrder(order.id)} className="ord-btn-action ord-btn-green">
                                <Check style={{ width: 14, height: 14 }} /> Accept
                              </button>
                            )}

                            {/* ACCEPTED Actions */}
                            {activeTab === 'Accepted' && (
                              <button onClick={() => handlePrintPickList(order)} className="ord-btn-action ord-btn-blue">
                                <Printer style={{ width: 14, height: 14 }} /> Pick List
                              </button>
                            )}

                            {/* PROCESSING Actions */}
                            {activeTab === 'Processing' && (
                              <button onClick={() => handleMarkPacked(order)} className="ord-btn-action ord-btn-purple">
                                <Box style={{ width: 14, height: 14 }} /> Pack
                              </button>
                            )}

                            {/* PACKED Actions */}
                            {activeTab === 'Packed' && (
                              <>
                                <button
                                  onClick={() => handleGenerateInvoice(order)}
                                  className={`ord-btn-action ${order.invoiceDate ? 'ord-btn-outline-orange' : 'ord-btn-orange'}`}
                                >
                                  <FileText style={{ width: 14, height: 14 }} />
                                  {order.invoiceDate ? 'Update Inv' : 'Create Inv'}
                                </button>
                                <button onClick={() => handleDispatch(order)} className="ord-btn-outline-gray">
                                  <Truck style={{ width: 14, height: 14 }} /> Dispatch
                                </button>
                              </>
                            )}

                            {/* DISPATCHED Actions */}
                            {activeTab === 'Dispatched' && (
                              <button onClick={() => handleDeliver(order.id)} className="ord-btn-action ord-btn-green">
                                <CheckCircle style={{ width: 14, height: 14 }} /> Delivered
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail / Edit Modal */}
        {editingOrder && (
          <div className="ord-modal-backdrop">
            <div className="ord-modal">
              <div className="ord-modal-header">
                <div>
                  <h3 className="ord-modal-title">Order Details: {editingOrder.id}</h3>
                  <p className="ord-modal-subtitle">{editingOrder.customerName}</p>
                </div>
                <button onClick={() => setEditingOrder(null)} className="ord-modal-close">✕</button>
              </div>

              <div className="ord-modal-body">
                <table className="ord-detail-table">
                  <thead className="ord-detail-thead">
                    <tr>
                      <th className="ord-detail-th">Item</th>
                      <th className="ord-detail-th">Pack Size</th>
                      <th className="ord-detail-th">Ordered</th>
                      <th className="ord-detail-th">
                        {activeTab === 'Processing' ? 'Delivered (Act)' : 'Delivered'}
                      </th>
                      <th className="ord-detail-th ord-detail-th-right">Price/Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingOrder.items.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                        <td className="ord-detail-td ord-detail-td-name">{item.itemName}</td>
                        <td className="ord-detail-td ord-detail-td-text">{item.packSize}</td>
                        <td className="ord-detail-td ord-detail-td-text">{item.orderedQuantity}</td>
                        <td className="ord-detail-td">
                          {activeTab === 'Processing' ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.deliveredQuantity}
                              onChange={(e) => updateItemActual(item.id, parseFloat(e.target.value) || 0)}
                              className="ord-detail-input"
                            />
                          ) : (
                            <span className="ord-detail-delivered">
                              {item.deliveredQuantity !== undefined ? item.deliveredQuantity : '-'}
                            </span>
                          )}
                        </td>
                        <td className="ord-detail-td ord-detail-td-right">₹{item.pricePerUnit}</td>
                      </tr>
                    ))}
                    <tr className="ord-detail-total">
                      <td colSpan={4} style={{ textAlign: 'right' }}>Total</td>
                      <td style={{ textAlign: 'right' }}>
                        ₹{editingOrder.items.reduce((sum, item) => sum + ((item.deliveredQuantity ?? item.orderedQuantity) * item.pricePerUnit), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="ord-modal-footer">
                  <button onClick={() => setEditingOrder(null)} className="ord-btn-close">
                    Close
                  </button>
                  {activeTab === 'Processing' && (
                    <button onClick={saveActuals} className="ord-btn-save">
                      Save Changes
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}