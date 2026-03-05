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
  const [formData, setFormData] = useState({ name: '', code: '', state: '', city: '' });
  const [showCustomersModal, setShowCustomersModal] = useState<string | null>(null);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [assignTab, setAssignTab] = useState<AssignTab>('unassigned');

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignFromRoute, setReassignFromRoute] = useState<string | null>(null);
  const [reassignToRoute, setReassignToRoute] = useState('');
  const [reassignCustomers, setReassignCustomers] = useState<Set<string>>(new Set());

  const unassignedCustomers = useMemo(() => customers.filter(c => !c.routeId), [customers]);
  const getRouteCustomers = (routeId: string) => customers.filter(c => c.routeId === routeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const route = { ...formData, customerIds: editingRoute?.customerIds || [] };
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
    setFormData({ name: route.name, code: route.code, city: route.city, state: route.state });
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
    if (newSelected.has(customerId)) { newSelected.delete(customerId); } else { newSelected.add(customerId); }
    setFn(newSelected);
  };

  const handleRemoveFromRoute = (customerId: string) => {
    removeCustomerFromRoute(customerId);
    toast.success('Customer removed from route');
  };

  const handleReassign = () => {
    if (!reassignToRoute || reassignCustomers.size === 0) { toast.error('Select customers and target route'); return; }
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
    <>
      <style>{`
        .rt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .rt-title { font-size: 20px; font-weight: 600; color: #1f2937; }
        .rt-subtitle { color: #6b7280; margin-top: 4px; font-size: 14px; }
        .rt-header-actions { display: flex; gap: 8px; }
        .rt-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; color: white; }
        .rt-btn-blue { background: #2563eb; }
        .rt-btn-blue:hover { background: #1d4ed8; }
        .rt-btn-green { background: #16a34a; }
        .rt-btn-green:hover { background: #15803d; }
        .rt-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .rt-stat-card { background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); border: 1px solid #e5e7eb; }
        .rt-stat-value { font-size: 24px; font-weight: 700; }
        .rt-stat-value-blue { color: #2563eb; }
        .rt-stat-value-green { color: #16a34a; }
        .rt-stat-value-orange { color: #ea580c; }
        .rt-stat-value-gray { color: #6b7280; }
        .rt-stat-label { font-size: 13px; color: #6b7280; }
        .rt-table-card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow: hidden; }
        .rt-table { width: 100%; border-collapse: collapse; }
        .rt-thead { background: #f9fafb; }
        .rt-th { padding: 12px 24px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; }
        .rt-tbody tr { border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
        .rt-tbody tr:hover { background: #f9fafb; }
        .rt-td { padding: 14px 24px; }
        .rt-td-text { font-size: 13px; color: #6b7280; }
        .rt-code-badge { display: inline-block; padding: 2px 8px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 13px; font-weight: 500; }
        .rt-td-name { font-weight: 500; }
        .rt-customers-btn { display: flex; align-items: center; gap: 8px; color: #2563eb; background: transparent; border: none; cursor: pointer; }
        .rt-customers-btn:hover { color: #1d4ed8; }
        .rt-customers-count { font-weight: 500; }
        .rt-btn-edit { color: #2563eb; background: transparent; border: none; cursor: pointer; padding: 4px; }
        .rt-btn-edit:hover { color: #1d4ed8; }
        .rt-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .rt-modal { background: white; border-radius: 12px; padding: 24px; max-width: 448px; width: 100%; margin: 16px; }
        .rt-modal-lg { max-width: 672px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
        .rt-modal-title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #1f2937; }
        .rt-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .rt-modal-close { color: #9ca3af; cursor: pointer; background: none; border: none; }
        .rt-modal-close:hover { color: #6b7280; }
        .rt-form-group { margin-bottom: 16px; }
        .rt-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; color: #374151; }
        .rt-input, .rt-select { width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white; }
        .rt-input:focus, .rt-select:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.3); border-color: #3b82f6; }
        .rt-modal-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .rt-btn-cancel { padding: 8px 16px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; font-size: 14px; }
        .rt-btn-cancel:hover { background: #f9fafb; }
        .rt-btn-save { padding: 8px 16px; background: #16a34a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px; }
        .rt-btn-save:hover { background: #15803d; }
        .rt-tabs { display: flex; gap: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px; }
        .rt-tab { padding: 8px 16px; border-radius: 8px 8px 0 0; font-weight: 500; transition: all 0.15s; border: none; cursor: pointer; font-size: 14px; }
        .rt-tab-active { background: #dbeafe; color: #1d4ed8; border-bottom: 2px solid #2563eb; }
        .rt-tab-inactive { background: transparent; color: #6b7280; }
        .rt-tab-inactive:hover { color: #111827; }
        .rt-customer-list { flex: 1; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; }
        .rt-customer-empty { padding: 16px; text-align: center; color: #9ca3af; font-size: 14px; }
        .rt-customer-item { display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer; border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
        .rt-customer-item:hover { background: #f9fafb; }
        .rt-customer-selected { background: #eff6ff; }
        .rt-customer-selected-orange { background: #fff7ed; }
        .rt-customer-info { flex: 1; }
        .rt-customer-name { font-weight: 500; color: #111827; }
        .rt-customer-phone { font-size: 13px; color: #9ca3af; }
        .rt-customer-route-badge { font-size: 12px; padding: 2px 8px; background: #f3f4f6; color: #6b7280; border-radius: 4px; }
        .rt-selection-info { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .rt-selection-count { font-size: 13px; color: #6b7280; }
        .rt-btn-assign { padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px; }
        .rt-btn-assign:hover { background: #1d4ed8; }
        .rt-btn-assign:disabled { opacity: 0.5; cursor: not-allowed; }
        .rt-btn-orange { background: #ea580c; color: white; }
        .rt-btn-orange:hover { background: #c2410c; }
        .rt-detail-list { display: flex; flex-direction: column; gap: 8px; flex: 1; overflow-y: auto; }
        .rt-detail-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; transition: background 0.15s; }
        .rt-detail-item:hover { background: #f9fafb; }
        .rt-detail-name { font-weight: 500; }
        .rt-detail-contact { font-size: 13px; color: #6b7280; }
        .rt-detail-empty { text-align: center; padding: 32px; color: #9ca3af; font-size: 14px; }
        .rt-btn-remove { padding: 8px; color: #dc2626; background: transparent; border: none; cursor: pointer; border-radius: 8px; }
        .rt-btn-remove:hover { background: #fef2f2; }
        .rt-detail-footer { display: flex; gap: 8px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #e5e7eb; margin-top: 16px; }
        .rt-btn-reassign { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #ea580c; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px; }
        .rt-btn-reassign:hover { background: #c2410c; }
      `}</style>

      <div>
        <div className="rt-header">
          <div>
            <h2 className="rt-title">Route Management</h2>
            <p className="rt-subtitle">Manage delivery routes and customer assignments</p>
          </div>
          <div className="rt-header-actions">
            <button onClick={() => setShowBulkAssign(true)} className="rt-btn rt-btn-blue">
              <Users style={{ width: 16, height: 16 }} /> Bulk Assign
            </button>
            <button onClick={() => setShowForm(true)} className="rt-btn rt-btn-green">
              <Plus style={{ width: 16, height: 16 }} /> Add Route
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="rt-stats">
          <div className="rt-stat-card">
            <div className="rt-stat-value rt-stat-value-blue">{routes.length}</div>
            <div className="rt-stat-label">Total Routes</div>
          </div>
          <div className="rt-stat-card">
            <div className="rt-stat-value rt-stat-value-green">{customers.filter(c => c.routeId).length}</div>
            <div className="rt-stat-label">Assigned Customers</div>
          </div>
          <div className="rt-stat-card">
            <div className="rt-stat-value rt-stat-value-orange">{unassignedCustomers.length}</div>
            <div className="rt-stat-label">Unassigned Customers</div>
          </div>
          <div className="rt-stat-card">
            <div className="rt-stat-value rt-stat-value-gray">{customers.length}</div>
            <div className="rt-stat-label">Total Customers</div>
          </div>
        </div>

        {/* Add/Edit Route Form */}
        {showForm && (
          <div className="rt-modal-backdrop">
            <div className="rt-modal">
              <h3 className="rt-modal-title">{editingRoute ? 'Edit' : 'Add'} Route</h3>
              <form onSubmit={handleSubmit}>
                <div className="rt-form-group">
                  <label className="rt-label">Route Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rt-input" placeholder="e.g., Mumbai Central" required />
                </div>
                <div className="rt-form-group">
                  <label className="rt-label">Route Code *</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="rt-input" placeholder="e.g., MUM01" required />
                </div>
                <div className="rt-form-group">
                  <label className="rt-label">State *</label>
                  <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })} className="rt-select" required>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(state => (<option key={state} value={state}>{state}</option>))}
                  </select>
                </div>
                <div className="rt-form-group">
                  <label className="rt-label">City *</label>
                  <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="rt-select" required disabled={!formData.state}>
                    <option value="">Select City</option>
                    {availableCities.map(city => (<option key={city} value={city}>{city}</option>))}
                  </select>
                </div>
                <div className="rt-modal-actions">
                  <button type="button" onClick={resetForm} className="rt-btn-cancel">Cancel</button>
                  <button type="submit" className="rt-btn-save">{editingRoute ? 'Update' : 'Add'} Route</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Assign Modal */}
        {showBulkAssign && (
          <div className="rt-modal-backdrop">
            <div className="rt-modal rt-modal-lg">
              <div className="rt-modal-header">
                <h3 className="rt-modal-title" style={{ marginBottom: 0 }}>Bulk Assign Customers to Route</h3>
                <button onClick={() => { setShowBulkAssign(false); setSelectedCustomers(new Set()); }} className="rt-modal-close">
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflow: 'hidden' }}>
                <div className="rt-form-group" style={{ marginBottom: 0 }}>
                  <label className="rt-label">Select Route *</label>
                  <select value={selectedRoute} onChange={(e) => setSelectedRoute(e.target.value)} className="rt-select" required>
                    <option value="">Select Route</option>
                    {routes.map(route => (<option key={route.id} value={route.id}>{route.name} ({route.code}) - {getRouteCustomers(route.id).length} customers</option>))}
                  </select>
                </div>

                <div className="rt-tabs">
                  <button onClick={() => { setAssignTab('unassigned'); setSelectedCustomers(new Set()); }} className={`rt-tab ${assignTab === 'unassigned' ? 'rt-tab-active' : 'rt-tab-inactive'}`}>
                    Unassigned ({unassignedCustomers.length})
                  </button>
                  <button onClick={() => { setAssignTab('all'); setSelectedCustomers(new Set()); }} className={`rt-tab ${assignTab === 'all' ? 'rt-tab-active' : 'rt-tab-inactive'}`}>
                    All Customers ({customers.length})
                  </button>
                </div>

                <div className="rt-customer-list">
                  {displayCustomers.length === 0 ? (
                    <div className="rt-customer-empty">
                      {assignTab === 'unassigned' ? 'All customers are assigned to routes!' : 'No customers found'}
                    </div>
                  ) : (
                    <div>
                      {displayCustomers.map(customer => {
                        const currentRoute = routes.find(r => r.id === customer.routeId);
                        return (
                          <label key={customer.id} className={`rt-customer-item ${selectedCustomers.has(customer.id) ? 'rt-customer-selected' : ''}`}>
                            <input type="checkbox" checked={selectedCustomers.has(customer.id)} onChange={() => toggleCustomer(customer.id, selectedCustomers, setSelectedCustomers)} style={{ accentColor: '#2563eb' }} />
                            <div className="rt-customer-info">
                              <div className="rt-customer-name">{customer.businessName}</div>
                              <div className="rt-customer-phone">{customer.phone}</div>
                            </div>
                            {currentRoute && (<span className="rt-customer-route-badge">{currentRoute.code}</span>)}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rt-selection-info">
                  <div className="rt-selection-count">{selectedCustomers.size} customer(s) selected</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setShowBulkAssign(false); setSelectedCustomers(new Set()); setAssignTab('unassigned'); }} className="rt-btn-cancel">Cancel</button>
                    <button onClick={handleBulkAssign} disabled={selectedCustomers.size === 0 || !selectedRoute} className="rt-btn-assign">
                      Assign {selectedCustomers.size} Customer(s)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customers List Modal */}
        {showCustomersModal && (
          <div className="rt-modal-backdrop">
            <div className="rt-modal rt-modal-lg">
              <div className="rt-modal-header">
                <h3 className="rt-modal-title" style={{ marginBottom: 0 }}>
                  Customers in {routes.find(r => r.id === showCustomersModal)?.name}
                </h3>
                <button onClick={() => setShowCustomersModal(null)} className="rt-modal-close">
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>

              <div className="rt-detail-list">
                {getRouteCustomers(showCustomersModal).length === 0 ? (
                  <div className="rt-detail-empty">No customers in this route</div>
                ) : (
                  getRouteCustomers(showCustomersModal).map(customer => (
                    <div key={customer.id} className="rt-detail-item">
                      <div>
                        <div className="rt-detail-name">{customer.businessName}</div>
                        <div className="rt-detail-contact">{customer.phone} • {customer.email}</div>
                      </div>
                      <button onClick={() => handleRemoveFromRoute(customer.id)} className="rt-btn-remove" title="Remove from route">
                        <Trash2 style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="rt-detail-footer">
                <button onClick={() => openReassignModal(showCustomersModal)} className="rt-btn-reassign">
                  <ArrowRight style={{ width: 16, height: 16 }} /> Reassign to Another Route
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reassign Modal */}
        {showReassignModal && reassignFromRoute && (
          <div className="rt-modal-backdrop">
            <div className="rt-modal rt-modal-lg">
              <div className="rt-modal-header">
                <h3 className="rt-modal-title" style={{ marginBottom: 0 }}>
                  Reassign from {routes.find(r => r.id === reassignFromRoute)?.name}
                </h3>
                <button onClick={() => setShowReassignModal(false)} className="rt-modal-close">
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflow: 'hidden' }}>
                <div className="rt-form-group" style={{ marginBottom: 0 }}>
                  <label className="rt-label">Target Route *</label>
                  <select value={reassignToRoute} onChange={(e) => setReassignToRoute(e.target.value)} className="rt-select">
                    <option value="">Select Target Route</option>
                    {routes.filter(r => r.id !== reassignFromRoute).map(route => (
                      <option key={route.id} value={route.id}>{route.name} ({route.code})</option>
                    ))}
                  </select>
                </div>

                <div className="rt-customer-list">
                  <div>
                    {getRouteCustomers(reassignFromRoute).map(customer => (
                      <label key={customer.id} className={`rt-customer-item ${reassignCustomers.has(customer.id) ? 'rt-customer-selected-orange' : ''}`}>
                        <input type="checkbox" checked={reassignCustomers.has(customer.id)} onChange={() => toggleCustomer(customer.id, reassignCustomers, setReassignCustomers)} style={{ accentColor: '#ea580c' }} />
                        <div className="rt-customer-info">
                          <div className="rt-customer-name">{customer.businessName}</div>
                          <div className="rt-customer-phone">{customer.phone}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rt-selection-info">
                  <div className="rt-selection-count">{reassignCustomers.size} customer(s) selected</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowReassignModal(false)} className="rt-btn-cancel">Cancel</button>
                    <button onClick={handleReassign} disabled={reassignCustomers.size === 0 || !reassignToRoute} className="rt-btn-assign" style={{ background: '#ea580c' }}>
                      Reassign {reassignCustomers.size} Customer(s)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Routes Table */}
        <div className="rt-table-card">
          <table className="rt-table">
            <thead className="rt-thead">
              <tr>
                <th className="rt-th">Route Code</th>
                <th className="rt-th">Route Name</th>
                <th className="rt-th">City</th>
                <th className="rt-th">State</th>
                <th className="rt-th"># Customers</th>
                <th className="rt-th">Actions</th>
              </tr>
            </thead>
            <tbody className="rt-tbody">
              {routes.map((route) => {
                const routeCustomers = getRouteCustomers(route.id);
                return (
                  <tr key={route.id}>
                    <td className="rt-td">
                      <span className="rt-code-badge">{route.code}</span>
                    </td>
                    <td className="rt-td rt-td-name">{route.name}</td>
                    <td className="rt-td rt-td-text">{route.city}</td>
                    <td className="rt-td rt-td-text">{route.state}</td>
                    <td className="rt-td">
                      <button onClick={() => setShowCustomersModal(route.id)} className="rt-customers-btn">
                        <Users style={{ width: 16, height: 16 }} />
                        <span className="rt-customers-count">{routeCustomers.length}</span>
                        <Eye style={{ width: 12, height: 12 }} />
                      </button>
                    </td>
                    <td className="rt-td">
                      <button onClick={() => handleEdit(route)} className="rt-btn-edit">
                        <Edit2 style={{ width: 16, height: 16 }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
