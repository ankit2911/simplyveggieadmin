import React, { useState, useMemo } from 'react';
import { useAdmin, type Route } from '../context/AdminContext';
import { Plus, Edit2, Users, Eye, Trash2, ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_STATES, CITIES_BY_STATE } from '../utils/constants';

type AssignTab = 'unassigned' | 'all';

export function RoutesPageNew() {
  const { routes, customers, addRoute, updateRoute, bulkAssignRoute, removeCustomerFromRoute } = useAdmin();
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    state: '',
    city: '',
  });
  const [showCustomersModal, setShowCustomersModal] = useState<string | null>(null);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [assignTab, setAssignTab] = useState<AssignTab>('unassigned');

  // For reassign modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignFromRoute, setReassignFromRoute] = useState<string | null>(null);
  const [reassignToRoute, setReassignToRoute] = useState('');
  const [reassignCustomers, setReassignCustomers] = useState<Set<string>>(new Set());

  // Derived data
  const unassignedCustomers = useMemo(() =>
    customers.filter(c => !c.routeId), [customers]);

  const getRouteCustomers = (routeId: string) =>
    customers.filter(c => c.routeId === routeId);

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

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      code: route.code,
      city: route.city,
      state: route.state,
    });
    setShowForm(true);
  };

  const handleBulkAssign = () => {
    if (!selectedRoute || selectedCustomers.size === 0) {
      toast.error('Please select a route and customers');
      return;
    }

    bulkAssignRoute(Array.from(selectedCustomers), selectedRoute);
    toast.success(`${selectedCustomers.size} customer(s) assigned to route`);
    setShowBulkAssign(false);
    setSelectedCustomers(new Set());
    setSelectedRoute('');
    setAssignTab('unassigned');
  };

  const toggleCustomer = (customerId: string, set: Set<string>, setFn: (s: Set<string>) => void) => {
    const newSelected = new Set(set);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setFn(newSelected);
  };

  const handleRemoveFromRoute = (customerId: string) => {
    removeCustomerFromRoute(customerId);
    toast.success('Customer removed from route');
  };

  const handleReassign = () => {
    if (!reassignToRoute || reassignCustomers.size === 0) {
      toast.error('Select customers and target route');
      return;
    }
    bulkAssignRoute(Array.from(reassignCustomers), reassignToRoute);
    toast.success(`${reassignCustomers.size} customer(s) reassigned`);
    setShowReassignModal(false);
    setReassignCustomers(new Set());
    setReassignFromRoute(null);
    setReassignToRoute('');
    setShowCustomersModal(null);
  };

  const openReassignModal = (routeId: string) => {
    setReassignFromRoute(routeId);
    setReassignCustomers(new Set());
    setReassignToRoute('');
    setShowReassignModal(true);
  };

  const displayCustomers = assignTab === 'unassigned' ? unassignedCustomers : customers;
  const availableCities = formData.state ? CITIES_BY_STATE[formData.state] || [] : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Route Management</h2>
          <p className="text-gray-600 mt-1">Manage delivery routes and customer assignments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkAssign(true)}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{routes.length}</div>
          <div className="text-sm text-gray-600">Total Routes</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{customers.filter(c => c.routeId).length}</div>
          <div className="text-sm text-gray-600">Assigned Customers</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">{unassignedCustomers.length}</div>
          <div className="text-sm text-gray-600">Unassigned Customers</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-gray-600">{customers.length}</div>
          <div className="text-sm text-gray-600">Total Customers</div>
        </div>
      </div>

      {/* Add/Edit Route Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">{editingRoute ? 'Edit' : 'Add'} Route</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Route Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Mumbai Central"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Route Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., MUM01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State *</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={!formData.state}
                >
                  <option value="">Select City</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
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
      {showBulkAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Bulk Assign Customers to Route</h3>
              <button onClick={() => { setShowBulkAssign(false); setSelectedCustomers(new Set()); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div>
                <label className="block text-sm font-medium mb-1">Select Route *</label>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select Route</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>
                      {route.name} ({route.code}) - {getRouteCustomers(route.id).length} customers
                    </option>
                  ))}
                </select>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b pb-2">
                <button
                  onClick={() => { setAssignTab('unassigned'); setSelectedCustomers(new Set()); }}
                  className={`px-4 py-2 rounded-t-lg font-medium transition ${assignTab === 'unassigned' ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Unassigned ({unassignedCustomers.length})
                </button>
                <button
                  onClick={() => { setAssignTab('all'); setSelectedCustomers(new Set()); }}
                  className={`px-4 py-2 rounded-t-lg font-medium transition ${assignTab === 'all' ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  All Customers ({customers.length})
                </button>
              </div>

              {/* Customer List */}
              <div className="flex-1 overflow-y-auto border rounded-lg">
                {displayCustomers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {assignTab === 'unassigned' ? 'All customers are assigned to routes!' : 'No customers found'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {displayCustomers.map(customer => {
                      const currentRoute = routes.find(r => r.id === customer.routeId);
                      return (
                        <label
                          key={customer.id}
                          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${selectedCustomers.has(customer.id) ? 'bg-blue-50' : ''
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCustomers.has(customer.id)}
                            onChange={() => toggleCustomer(customer.id, selectedCustomers, setSelectedCustomers)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{customer.businessName}</div>
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                          </div>
                          {currentRoute && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              {currentRoute.code}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {selectedCustomers.size} customer(s) selected
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowBulkAssign(false); setSelectedCustomers(new Set()); setAssignTab('unassigned'); }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAssign}
                    disabled={selectedCustomers.size === 0 || !selectedRoute}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign {selectedCustomers.size} Customer(s)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customers List Modal (with remove/reassign) */}
      {showCustomersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Customers in {routes.find(r => r.id === showCustomersModal)?.name}
              </h3>
              <button onClick={() => setShowCustomersModal(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {getRouteCustomers(showCustomersModal).length === 0 ? (
                <div className="text-center py-8 text-gray-500">No customers in this route</div>
              ) : (
                <div className="space-y-2">
                  {getRouteCustomers(showCustomersModal).map(customer => (
                    <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <div className="font-medium">{customer.businessName}</div>
                        <div className="text-sm text-gray-600">{customer.phone} • {customer.email}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveFromRoute(customer.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Remove from route"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t mt-4">
              <button
                onClick={() => openReassignModal(showCustomersModal)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <ArrowRight className="w-4 h-4" />
                Reassign to Another Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showReassignModal && reassignFromRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Reassign from {routes.find(r => r.id === reassignFromRoute)?.name}
              </h3>
              <button onClick={() => setShowReassignModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div>
                <label className="block text-sm font-medium mb-1">Target Route *</label>
                <select
                  value={reassignToRoute}
                  onChange={(e) => setReassignToRoute(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="">Select Target Route</option>
                  {routes.filter(r => r.id !== reassignFromRoute).map(route => (
                    <option key={route.id} value={route.id}>
                      {route.name} ({route.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto border rounded-lg">
                <div className="divide-y">
                  {getRouteCustomers(reassignFromRoute).map(customer => (
                    <label
                      key={customer.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${reassignCustomers.has(customer.id) ? 'bg-orange-50' : ''
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={reassignCustomers.has(customer.id)}
                        onChange={() => toggleCustomer(customer.id, reassignCustomers, setReassignCustomers)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{customer.businessName}</div>
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {reassignCustomers.size} customer(s) selected
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReassignModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReassign}
                    disabled={reassignCustomers.size === 0 || !reassignToRoute}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    Reassign {reassignCustomers.size} Customer(s)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Routes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"># Customers</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {routes.map((route) => {
              const routeCustomers = getRouteCustomers(route.id);

              return (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                      {route.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{route.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{route.city}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{route.state}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setShowCustomersModal(route.id)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{routeCustomers.length}</span>
                      <Eye className="w-3 h-3" />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(route)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
