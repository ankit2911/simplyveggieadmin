import React, { useState } from 'react';
import { useAdmin, type Route } from '../context/AdminContext';
import { Plus, Edit2, Users } from 'lucide-react';
import { toast } from 'sonner';

export function RoutesPage() {
  const { routes, customers, addRoute, updateRoute, bulkAssignRoute } = useAdmin();
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const route = {
      ...formData,
      customerIds: editingRoute?.customerIds || [],
    };

    if (editingRoute) {
      updateRoute(editingRoute.id, route);
      toast.success('Route updated successfully');
    } else {
      addRoute(route);
      toast.success('Route added successfully');
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', city: '', state: '' });
    setShowForm(false);
    setEditingRoute(null);
  };

  const handleBulkAssign = () => {
    if (!selectedRoute || selectedCustomers.size === 0) {
      toast.error('Please select a route and customers');
      return;
    }
    
    bulkAssignRoute(Array.from(selectedCustomers), selectedRoute);
    toast.success(`${selectedCustomers.size} customer(s) assigned to route`);
    setShowAssignModal(false);
    setSelectedCustomers(new Set());
    setSelectedRoute('');
  };

  const toggleCustomer = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl">Route Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Users className="w-4 h-4" />
            Bulk Assign
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Add Route
          </button>
        </div>
      </div>

      {/* Add/Edit Route Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl mb-4">{editingRoute ? 'Edit' : 'Add'} Route</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Route Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Route Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingRoute ? 'Update' : 'Add'} Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl mb-4">Bulk Assign Customers to Route</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Select Route</label>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select Route</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>
                      {route.name} ({route.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">Select Customers</label>
                <div className="border rounded-lg p-3 max-h-96 overflow-y-auto space-y-2">
                  {customers.map(customer => (
                    <label key={customer.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.has(customer.id)}
                        onChange={() => toggleCustomer(customer.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{customer.businessName}</span>
                      {customer.routeId && (
                        <span className="ml-auto text-xs text-gray-500">
                          (Currently in: {routes.find(r => r.id === customer.routeId)?.name})
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedCustomers(new Set());
                    setSelectedRoute('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAssign}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign {selectedCustomers.size} Customer(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Routes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((route) => {
          const routeCustomers = customers.filter(c => route.customerIds.includes(c.id));
          
          return (
            <div key={route.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg">{route.name}</h3>
                  <p className="text-sm text-gray-600">{route.code}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingRoute(route);
                    setFormData({
                      name: route.name,
                      code: route.code,
                      city: route.city,
                      state: route.state,
                    });
                    setShowForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {route.city}, {route.state}
                </p>
                <div className="pt-2 border-t">
                  <p className="text-sm mb-2">{routeCustomers.length} customer(s)</p>
                  {routeCustomers.slice(0, 3).map(customer => (
                    <div key={customer.id} className="text-xs text-gray-500">
                      • {customer.businessName}
                    </div>
                  ))}
                  {routeCustomers.length > 3 && (
                    <p className="text-xs text-gray-500 mt-1">
                      + {routeCustomers.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
