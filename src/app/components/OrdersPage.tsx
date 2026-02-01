import React, { useState } from 'react';
import { useAdmin, type Order, type OrderStatus } from '../context/AdminContext';
import { FileText, Check, Printer, Box, Truck, CheckCircle, Edit3, X, Eye, Info } from 'lucide-react';
import { generateOrderInvoicePDF, generatePickListPDF } from '../utils/pdf';
import { toast } from 'sonner';

const workflowSteps: OrderStatus[] = ['Created', 'Accepted', 'Processing', 'Packed', 'Dispatched', 'Delivered'];

// Color Mapping for Tabs (unchanged)
const tabColors: Record<OrderStatus, { active: string; inactive: string; badge: string; border: string }> = {
  Created: { active: 'bg-gray-700 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200', badge: 'bg-gray-500 text-white', border: 'border-gray-700' },
  Accepted: { active: 'bg-blue-600 text-white', inactive: 'bg-blue-50 text-blue-600 hover:bg-blue-100', badge: 'bg-blue-500 text-white', border: 'border-blue-600' },
  Processing: { active: 'bg-amber-500 text-white', inactive: 'bg-amber-50 text-amber-600 hover:bg-amber-100', badge: 'bg-amber-600 text-white', border: 'border-amber-500' },
  Packed: { active: 'bg-purple-600 text-white', inactive: 'bg-purple-50 text-purple-600 hover:bg-purple-100', badge: 'bg-purple-500 text-white', border: 'border-purple-600' },
  Dispatched: { active: 'bg-indigo-600 text-white', inactive: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100', badge: 'bg-indigo-500 text-white', border: 'border-indigo-600' },
  Delivered: { active: 'bg-green-600 text-white', inactive: 'bg-green-50 text-green-600 hover:bg-green-100', badge: 'bg-green-500 text-white', border: 'border-green-600' },
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Order Processing</h2>
      </div>

      {/* Tabs */}
      <div className={`flex overflow-x-auto gap-2 mb-6 border-b-2 pb-1 ${tabColors[activeTab].border}`}>
        {workflowSteps.map(step => (
          <button
            key={step}
            onClick={() => setActiveTab(step)}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-t-lg transition-all ${activeTab === step ? tabColors[step].active : tabColors[step].inactive
              }`}
          >
            {step}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs opacity-90 ${activeTab === step ? 'bg-white/20' : tabColors[step].badge
              }`}>
              {orders.filter(o => o.status === step).length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No orders in {activeTab} stage.
          </div>
        ) : (
          <div className="overflow-x-auto pb-24"> {/* Added padding bottom for popovers */}
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map(order => {
                  const custDetails = getCustomerDetails(order.customerId);
                  const isAddressOpen = viewingAddressId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                      <td className="px-6 py-4 text-gray-800 relative group">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            {custDetails?.attention && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="bg-gray-100 px-1.5 rounded text-gray-600">Attn:</span>
                                {custDetails.attention}
                              </div>
                            )}
                          </div>

                          {/* Address Info Button */}
                          <div className="relative">
                            <button
                              onClick={() => setViewingAddressId(isAddressOpen ? null : order.id)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="View Shipping Address"
                            >
                              <Info className="w-4 h-4" />
                            </button>

                            {/* Address Popover */}
                            {isAddressOpen && custDetails?.shippingAddr && (
                              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4 text-sm">
                                <h4 className="font-medium text-gray-900 mb-2 border-b pb-1">Shipping Address</h4>
                                <div className="space-y-1 text-gray-600">
                                  {custDetails.shippingAddr.attention && <p className="font-medium text-gray-800">{custDetails.shippingAddr.attention}</p>}
                                  <p>{custDetails.shippingAddr.street}</p>
                                  {custDetails.shippingAddr.landmark && <p className="text-xs text-gray-500">Landmark: {custDetails.shippingAddr.landmark}</p>}
                                  <p>{custDetails.shippingAddr.city}, {custDetails.shippingAddr.state}</p>
                                  <p>{custDetails.shippingAddr.zipCode}</p>
                                </div>
                                <button
                                  onClick={() => setViewingAddressId(null)}
                                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <Box className="w-4 h-4 text-gray-400" />
                          {order.items.length} Items
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        {order.invoiceDate ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" /> Yes ({new Date(order.invoiceDate).toLocaleDateString()})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(order)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            {activeTab === 'Processing' ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>

                          {/* CREATED Actions */}
                          {activeTab === 'Created' && (
                            <button
                              onClick={() => handleAcceptOrder(order.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" /> Accept
                            </button>
                          )}

                          {/* ACCEPTED Actions */}
                          {activeTab === 'Accepted' && (
                            <button
                              onClick={() => handlePrintPickList(order)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium shadow-sm"
                            >
                              <Printer className="w-3.5 h-3.5" /> Pick List
                            </button>
                          )}

                          {/* PROCESSING Actions */}
                          {activeTab === 'Processing' && (
                            <button
                              onClick={() => handleMarkPacked(order)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-medium shadow-sm"
                            >
                              <Box className="w-3.5 h-3.5" /> Pack
                            </button>
                          )}

                          {/* PACKED Actions */}
                          {activeTab === 'Packed' && (
                            <>
                              <button
                                onClick={() => handleGenerateInvoice(order)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm ${order.invoiceDate
                                    ? 'border border-orange-200 text-orange-700 hover:bg-orange-50'
                                    : 'bg-orange-600 text-white hover:bg-orange-700'
                                  }`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {order.invoiceDate ? 'Update Inv' : 'Create Inv'}
                              </button>
                              <button
                                onClick={() => handleDispatch(order)}
                                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium"
                              >
                                <Truck className="w-3.5 h-3.5" /> Dispatch
                              </button>
                            </>
                          )}

                          {/* DISPATCHED Actions */}
                          {activeTab === 'Dispatched' && (
                            <button
                              onClick={() => handleDeliver(order.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Delivered
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

      {/* Detail / Edit Modal (Unchanged) */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Order Details: {editingOrder.id}</h3>
                <p className="text-sm text-gray-500">{editingOrder.customerName}</p>
              </div>
              <button onClick={() => setEditingOrder(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="overflow-y-auto p-6">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pack Size</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ordered</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {activeTab === 'Processing' ? 'Delivered (Act)' : 'Delivered'}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Price/Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {editingOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.itemName}</td>
                      <td className="px-4 py-3 text-gray-600">{item.packSize}</td>
                      <td className="px-4 py-3 text-gray-600">{item.orderedQuantity}</td>
                      <td className="px-4 py-3">
                        {activeTab === 'Processing' ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.deliveredQuantity}
                            onChange={(e) => updateItemActual(item.id, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        ) : (
                          <span className="text-gray-900 font-medium">
                            {item.deliveredQuantity !== undefined ? item.deliveredQuantity : '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">₹{item.pricePerUnit}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={4} className="px-4 py-3 text-right">Total</td>
                    <td className="px-4 py-3 text-right">
                      ₹{editingOrder.items.reduce((sum, item) => sum + ((item.deliveredQuantity ?? item.orderedQuantity) * item.pricePerUnit), 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end mt-6 gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  Close
                </button>
                {activeTab === 'Processing' && (
                  <button
                    onClick={saveActuals}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}