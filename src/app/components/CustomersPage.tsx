'use client';

import React, { useState } from 'react';
import { useAdmin, type Customer, type Address, type Lead } from '../context/AdminContext';
import { Plus, Edit2, Trash2, MapPin, UserPlus, ArrowRight, Building, Users } from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'customers' | 'leads';

export function CustomersPage() {
  const { customers, leads, routes, priceTiers, addCustomer, updateCustomer, addLead, updateLead, deleteLead, employees, employeeRoles, currentUser, setCurrentUser, resetData } = useAdmin();
  const [activeTab, setActiveTab] = useState<Tab>('customers');

  // Derived Lists & Roles
  const salesRole = employeeRoles.find(r => r.name === 'Sales Executive');
  const kamRole = employeeRoles.find(r => r.name === 'Key Account Manager');
  const salesEmployees = employees.filter(e => e.roleIds.includes(salesRole?.id || ''));
  const kamEmployees = employees.filter(e => e.roleIds.includes(kamRole?.id || ''));

  // Current Permissions
  const isSales = currentUser?.roleIds.includes(salesRole?.id || '');
  const isKAM = currentUser?.roleIds.includes(kamRole?.id || '');

  // Filtered Lists
  const visibleleads = isSales
    ? leads.filter(l => l.salesPersonId === currentUser?.id)
    : leads;

  const visibleCustomers = isKAM
    ? customers.filter(c => c.keyAccountManagerId === currentUser?.id)
    : customers;

  // -- Customer Form State --
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);

  const [customerFormData, setCustomerFormData] = useState({
    businessName: '',
    type: 'b2b' as Customer['type'],
    email: '',
    phone: '',
    tierId: '',
    routeId: '',
    pan: '',
    gstin: '',
    salesPersonId: '',
    keyAccountManagerId: '',
    comments: '',
  });

  const [addresses, setAddresses] = useState<Omit<Address, 'id'>[]>([
    { street: '', city: '', state: '', zipCode: '', type: 'billing', landmark: '', attention: '' },
  ]);

  const [authorizedUsers, setAuthorizedUsers] = useState<{ id: string; name: string; phone: string; email?: string }[]>([]);

  // -- Lead Form State --
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    businessName: '',
    phone: '',
    status: 'New' as Lead['status'],
    salesPersonId: '',
    comments: '',
  });
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // --- Customer Form Handlers ---

  // -- Form Errors --
  const [formErrors, setFormErrors] = useState<{ phone?: string; email?: string; billing?: string; authorizedUsers?: string }>({});
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);

  // --- Handlers ---

  const validateCustomer = (data: typeof customerFormData, isEditingId?: string) => {
    const errors: { phone?: string; email?: string; billing?: string; authorizedUsers?: string } = {};
    const cleanPhone = data.phone;

    // Phone Validation (10 digits)
    if (!/^\d{10}$/.test(cleanPhone)) {
      errors.phone = 'Phone must be 10 digits';
    } else {
      // Unique against Customers
      const dupCustomer = customers.find(c => c.phone === `+91${cleanPhone}` && c.id !== isEditingId);
      if (dupCustomer) errors.phone = 'Phone already used by another Customer';

      // Unique against Leads (optional check, but good for data integrity)
      const dupLead = leads.find(l => l.phone === `+91${cleanPhone}` && (!convertingLeadId || l.id !== convertingLeadId));
      if (dupLead && !convertingLeadId) errors.phone = 'Phone exists in Leads';
    }

    // Email Validation
    if (data.email) {
      const dupEmail = customers.find(c => c.email?.toLowerCase() === data.email.toLowerCase() && c.id !== isEditingId);
      if (dupEmail) errors.email = 'Email already used by another Customer';
    }

    // Billing Address Validation
    const billingAddr = addresses.find(a => a.type === 'billing');
    if (!billingAddr || !billingAddr.street || !billingAddr.city || !billingAddr.state || !billingAddr.zipCode) {
      errors.billing = 'Billing address is mandatory (Street, City, State, Zip)';
    }

    // Authorized Users Validation
    const invalidAuthUser = authorizedUsers.find(u => !/^\d{10}$/.test(u.phone));
    if (invalidAuthUser) {
      errors.authorizedUsers = 'All authorized users must have valid 10-digit phones';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateLead = (data: typeof leadFormData, isEditingId?: string) => {
    const errors: { phone?: string; } = {};
    const cleanPhone = data.phone;

    if (!/^\d{10}$/.test(cleanPhone)) {
      errors.phone = 'Phone must be 10 digits';
    } else {
      const dupLead = leads.find(l => l.phone === `+91${cleanPhone}` && l.id !== isEditingId);
      if (dupLead) errors.phone = 'Phone already used by another Lead';

      const dupCust = customers.find(c => c.phone === `+91${cleanPhone}`);
      if (dupCust) errors.phone = 'Phone already used by a Customer';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCustomer(customerFormData, editingCustomer?.id)) {
      if (formErrors.billing) toast.error(formErrors.billing);
      if (formErrors.authorizedUsers) toast.error(formErrors.authorizedUsers);
      return;
    }

    if (!customerFormData.pan) {
      toast.error('PAN is mandatory');
      return;
    }

    let finalAddresses = addresses.map((addr, idx) => ({
      ...addr,
      id: (addr as any).id || `addr_${Date.now()}_${idx}`,
    }));

    if (shippingSameAsBilling) {
      const billing = finalAddresses.find(a => a.type === 'billing');
      if (billing) {
        finalAddresses.push({ ...billing, id: `addr_${Date.now()}_copy`, type: 'shipping' });
      }
    }

    const finalAuthUsers = authorizedUsers.map(u => ({
      ...u,
      phone: u.phone.startsWith('+91') ? u.phone : `+91${u.phone}`
    }));

    const formattedData = {
      ...customerFormData,
      phone: `+91${customerFormData.phone}`
    };

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        ...formattedData,
        addresses: finalAddresses,
        authorizedUsers: finalAuthUsers,
      });
      toast.success('Customer updated successfully');
    } else {
      addCustomer({
        ...formattedData,
        addresses: finalAddresses,
        authorizedUsers: finalAuthUsers,
        walletBalance: 0,
      });
      toast.success('Customer added successfully');

      if (convertingLeadId) {
        deleteLead(convertingLeadId);
        toast.info('Lead converted to Customer');
      }
    }

    resetCustomerForm();
  };

  const resetCustomerForm = () => {
    setCustomerFormData({ businessName: '', type: 'b2b', email: '', phone: '', tierId: '', routeId: '', pan: '', gstin: '', salesPersonId: '', keyAccountManagerId: '', comments: '' });
    setAddresses([{ street: '', city: '', state: '', zipCode: '', type: 'billing', landmark: '', attention: '' }]);
    setAuthorizedUsers([]);
    setFormErrors({});
    setShippingSameAsBilling(true);
    setShowCustomerForm(false);
    setEditingCustomer(null);
    setConvertingLeadId(null);
  };

  const initEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    const rawPhone = customer.phone?.startsWith('+91') ? customer.phone.slice(3) : customer.phone;
    setCustomerFormData({
      businessName: customer.businessName,
      type: customer.type || 'b2b',
      email: customer.email || '',
      phone: rawPhone,
      tierId: customer.tierId || '',
      routeId: customer.routeId || '',
      pan: customer.pan || '',
      gstin: customer.gstin || '',
      salesPersonId: customer.salesPersonId || '',
      keyAccountManagerId: customer.keyAccountManagerId || '',
      comments: customer.comments || '',
    });
    setAddresses(customer.addresses.map(({ id, ...addr }) => ({
      ...addr,
      landmark: addr.landmark || '',
      attention: addr.attention || ''
    })));

    setAuthorizedUsers(customer.authorizedUsers?.map(u => ({
      ...u,
      phone: u.phone.startsWith('+91') ? u.phone.slice(3) : u.phone
    })) || []);

    setFormErrors({});
    setShippingSameAsBilling(false);
    setShowCustomerForm(true);
  };

  const initConvertLead = (lead: Lead) => {
    setConvertingLeadId(lead.id);
    const rawPhone = lead.phone?.startsWith('+91') ? lead.phone.slice(3) : lead.phone;
    setCustomerFormData({
      businessName: lead.businessName,
      type: 'b2b',
      email: '',
      phone: rawPhone,
      tierId: '',
      routeId: '',
      pan: '',
      gstin: '',
      salesPersonId: lead.salesPersonId || '', // Carry over Sales Person
      keyAccountManagerId: '', // To be decided
      comments: lead.comments || '', // Carry over comments
    });
    // Defaults
    setAddresses([{ street: '', city: '', state: '', zipCode: '', type: 'billing', landmark: '', attention: '' }]);
    setAuthorizedUsers([]);
    setFormErrors({});
    setShowCustomerForm(true);
    setActiveTab('customers'); // Switch tab to context
  };

  // ... address handlers ...
  const addAuthorizedUser = () => {
    setAuthorizedUsers([...authorizedUsers, { id: `au_${Date.now()}`, name: '', phone: '' }]);
  };

  const updateAuthorizedUser = (index: number, field: keyof typeof authorizedUsers[0], value: string) => {
    const newUsers = [...authorizedUsers];
    newUsers[index] = { ...newUsers[index], [field]: value };
    setAuthorizedUsers(newUsers);
  };

  const removeAuthorizedUser = (index: number) => {
    setAuthorizedUsers(authorizedUsers.filter((_, i) => i !== index));
  };

  const addShippingAddress = () => {
    setAddresses([...addresses, { street: '', city: '', state: '', zipCode: '', type: 'shipping', landmark: '', attention: '' }]);
  };

  const updateAddressField = (index: number, field: keyof typeof addresses[0], value: string) => {
    const newAddresses = [...addresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    setAddresses(newAddresses);
  };

  const removeShippingAddress = (index: number) => {
    if (index === 0) return; // Cannot remove billing
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLead(leadFormData, editingLead?.id)) return;

    const formattedData = {
      ...leadFormData,
      phone: `+91${leadFormData.phone}`
    };

    if (editingLead) {
      updateLead(editingLead.id, formattedData);
      toast.success('Lead updated');
    } else {
      addLead(formattedData);
      toast.success('Lead added');
    }
    resetLeadForm();
  };

  const resetLeadForm = () => {
    setLeadFormData({ businessName: '', phone: '', status: 'New', salesPersonId: '', comments: '' });
    setFormErrors({});
    setShowLeadForm(false);
    setEditingLead(null);
  };

  const initEditLead = (lead: Lead) => {
    setEditingLead(lead);
    const rawPhone = lead.phone?.startsWith('+91') ? lead.phone.slice(3) : lead.phone;
    setLeadFormData({
      businessName: lead.businessName,
      phone: rawPhone,
      status: lead.status,
      salesPersonId: lead.salesPersonId || '',
      comments: lead.comments || '',
    });
    setFormErrors({});
    setShowLeadForm(true);
  };

  // Helpers
  const handlePhoneInput = (setter: any, data: any, field: string = 'phone') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setter({ ...data, [field]: val });
    if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
  };

  const handleAuthUserPhone = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    updateAuthorizedUser(index, 'phone', val);
  };

  return (
    <div>
      {/* ... header ... */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Role Simulator (Dev Only) */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center justify-between">
          <span className="text-sm text-yellow-800 font-medium">🕵️ Role Simulator: Viewing as <span className="font-bold">{currentUser?.name || 'Admin'}</span></span>
          <select
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            onChange={(e) => setCurrentUser(employees.find(emp => emp.id === e.target.value) || null)}
            value={currentUser?.id || ''}
          >
            <option value="">Admin (Super User)</option>
            <optgroup label="Sales Team">
              {salesEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </optgroup>
            <optgroup label="KAM Team">
              {kamEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </optgroup>
          </select>
          <button
            onClick={() => {
              if (confirm('This will reset all data to initial state. Continue?')) {
                resetData();
              }
            }}
            className="ml-4 px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors"
          >
            Reset Data (Dev)
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">
          {activeTab === 'leads' ? 'Leads Management' : 'Customer Management'}
        </h2>

        <div className="flex gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'customers' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Customers
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'leads' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Leads
            </button>
          </div>

          <button
            onClick={() => activeTab === 'leads' ? setShowLeadForm(true) : setShowCustomerForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'leads' ? 'Add Lead' : 'Add Customer'}
          </button>
        </div>
      </div>

      {/* --- LEADS TAB --- */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales Rep</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visibleleads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{lead.businessName}</td>
                  <td className="px-6 py-4 text-gray-600">{lead.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {employees.find(e => e.id === lead.salesPersonId)?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => initConvertLead(lead)}
                        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
                        title="Convert to Customer"
                      >
                        <UserPlus className="w-4 h-4" />
                        Convert
                      </button>
                      <button
                        onClick={() => initEditLead(lead)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleleads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No leads found. Add a new lead to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- CUSTOMERS TAB --- */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">KAM</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales Rep</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Wallet</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visibleCustomers.map((customer) => {
                const tier = priceTiers.find(t => t.id === customer.tierId);
                const route = routes.find(r => r.id === customer.routeId);

                return (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{customer.businessName}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tier?.name || 'Default'}</td>
                    <td className="px-6 py-4">
                      {route ? (
                        <span className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {route.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {employees.find(e => e.id === customer.keyAccountManagerId)?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {employees.find(e => e.id === customer.salesPersonId)?.name || '-'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{customer.walletBalance.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => initEditCustomer(customer)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
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
      )}

      {/* --- LEAD FORM MODAL --- */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{editingLead ? 'Edit Lead' : 'Add New Lead'}</h3>
              <button onClick={resetLeadForm} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleLeadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={leadFormData.businessName}
                  onChange={(e) => setLeadFormData({ ...leadFormData, businessName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Tasty Bites Cafe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={leadFormData.phone}
                    onChange={handlePhoneInput(setLeadFormData, leadFormData)}
                    className={`rounded-none rounded-r-lg border block flex-1 min-w-0 w-full text-sm p-2.5 outline-none ${formErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                      }`}
                    placeholder="9876543210"
                    required
                  />
                </div>
                {formErrors.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>}
              </div>

              {/* ... status ... */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={leadFormData.status}
                  onChange={(e) => setLeadFormData({ ...leadFormData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Ready">Ready</option>
                </select>
              </div>

              {/* Sales Person & Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sales Person</label>
                <select
                  value={leadFormData.salesPersonId}
                  onChange={(e) => setLeadFormData({ ...leadFormData, salesPersonId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select Sales Person</option>
                  {salesEmployees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea
                  value={leadFormData.comments}
                  onChange={(e) => setLeadFormData({ ...leadFormData, comments: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  rows={3}
                  placeholder="Internal notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                {/* ... buttons ... */}
                <button
                  type="button"
                  onClick={resetLeadForm}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                >
                  {editingLead ? 'Update Lead' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CUSTOMER FORM MODAL --- */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
            {/* ... header ... */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {convertingLeadId ? 'Converting lead to detailed customer profile' : 'Enter business and legal details'}
                  </p>
                </div>
              </div>
              <button onClick={resetCustomerForm} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleCustomerSubmit} className="overflow-y-auto p-6 space-y-8">

              {/* Basic Info */}
              <section>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Business Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
                    <select
                      value={customerFormData.type}
                      onChange={(e) => setCustomerFormData({ ...customerFormData, type: e.target.value as any })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="b2b">B2B (Business)</option>
                      <option value="b2c">B2C (Individual)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                    <input
                      type="text"
                      value={customerFormData.businessName}
                      onChange={(e) => setCustomerFormData({ ...customerFormData, businessName: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={customerFormData.email}
                      onChange={(e) => {
                        setCustomerFormData({ ...customerFormData, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                      }}
                      className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:bg-white focus:ring-2 focus:border-transparent outline-none transition-all ${formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                        }`}
                      required
                    />
                    {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone *</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={customerFormData.phone}
                        onChange={handlePhoneInput(setCustomerFormData, customerFormData)}
                        className={`rounded-none rounded-r-lg border bg-gray-50 text-gray-900 block flex-1 min-w-0 w-full text-sm p-2.5 outline-none focus:bg-white transition-all ${formErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        placeholder="9876543210"
                        required
                      />
                    </div>
                    {formErrors.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>}
                  </div>
                </div>
              </section>

              {/* Legal Info */}
              <section>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Legal Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number *</label>
                    <input
                      type="text"
                      value={customerFormData.pan}
                      onChange={(e) => setCustomerFormData({ ...customerFormData, pan: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all uppercase"
                      placeholder="ABCDE1234F"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN (Optional)</label>
                    <input
                      type="text"
                      value={customerFormData.gstin}
                      onChange={(e) => setCustomerFormData({ ...customerFormData, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all uppercase"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </div>
              </section>

              {/* Configuration */}
              <section>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Tier</label>
                    <select
                      value={customerFormData.tierId}
                      onChange={(e) => setCustomerFormData({ ...customerFormData, tierId: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Default Tier</option>
                      {priceTiers.map(tier => (
                        <option key={tier.id} value={tier.id}>{tier.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Route</label>
                    <select
                      value={customerFormData.routeId}
                      onChange={(e) => setCustomerFormData({ ...customerFormData, routeId: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="">No Route Assigned</option>
                      {routes.map(route => (
                        <option key={route.id} value={route.id}>{route.name} ({route.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Account Manager</label>
                    <select
                      value={customerFormData.keyAccountManagerId}
                      onChange={(e) => setCustomerFormData({ ...customerFormData, keyAccountManagerId: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select KAM</option>
                      {kamEmployees.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin Sales Person (Read Only)</label>
                    <div className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
                      {customers.find(c => c.id === editingCustomer?.id)?.salesPersonId
                        ? employees.find(e => e.id === customers.find(c => c.id === editingCustomer?.id)?.salesPersonId)?.name
                        : customerFormData.salesPersonId
                          ? employees.find(e => e.id === customerFormData.salesPersonId)?.name
                          : 'None'}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comments / History</label>
                    <textarea
                      value={customerFormData.comments}
                      onChange={(e) => setCustomerFormData({ ...customerFormData, comments: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      rows={3}
                      placeholder="Customer history..."
                    />
                  </div>
                </div>
              </section>

              {/* Authorized Users */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    Authorized Users
                  </h4>
                  <button
                    type="button"
                    onClick={addAuthorizedUser}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add User
                  </button>
                </div>

                <div className="space-y-3">
                  {authorizedUsers.map((user, index) => (
                    <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Name"
                          value={user.name}
                          onChange={(e) => updateAuthorizedUser(index, 'name', e.target.value)}
                          className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-teal-500"
                          required
                        />
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-100 text-gray-500 text-sm">
                            +91
                          </span>
                          <input
                            type="tel"
                            placeholder="Phone"
                            value={user.phone}
                            onChange={handleAuthUserPhone(index)}
                            className="rounded-none rounded-r-md bg-white border border-gray-200 block flex-1 min-w-0 w-full text-sm px-3 py-2 outline-none focus:border-teal-500"
                            required
                          />
                        </div>
                        <input
                          type="email"
                          placeholder="Email (Optional)"
                          value={user.email || ''}
                          onChange={(e) => updateAuthorizedUser(index, 'email', e.target.value)}
                          className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-teal-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAuthorizedUser(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {authorizedUsers.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No authorized users added yet.</p>
                  )}
                </div>
              </section>

              {/* Addresses */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    Addresses
                  </h4>
                  <button type="button" onClick={addShippingAddress} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Shipping Address
                  </button>
                </div>
                {formErrors.billing && <p className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{formErrors.billing}</p>}

                {/* Billing + Primary Shipping Address Block */}
                <div className="p-4 border border-indigo-200 bg-indigo-50/30 rounded-xl space-y-4 mb-4">
                  {/* Billing */}
                  <div>
                    <span className="text-sm font-semibold text-indigo-700 block mb-2">Billing Address (Mandatory)</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                      <input type="text" placeholder="Attention" value={addresses[0]?.attention || ''} onChange={(e) => updateAddressField(0, 'attention', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" />
                      <input type="text" placeholder="Landmark" value={addresses[0]?.landmark || ''} onChange={(e) => updateAddressField(0, 'landmark', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" />
                    </div>
                    <input type="text" placeholder="Street Address *" value={addresses[0]?.street || ''} onChange={(e) => updateAddressField(0, 'street', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 mb-2" required />
                    <div className="grid grid-cols-3 gap-3">
                      <input type="text" placeholder="City *" value={addresses[0]?.city || ''} onChange={(e) => updateAddressField(0, 'city', e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" required />
                      <input type="text" placeholder="State *" value={addresses[0]?.state || ''} onChange={(e) => updateAddressField(0, 'state', e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" required />
                      <input type="text" placeholder="ZIP *" value={addresses[0]?.zipCode || ''} onChange={(e) => updateAddressField(0, 'zipCode', e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" required />
                    </div>
                  </div>

                  {/* Primary Shipping */}
                  <div className="pt-3 border-t border-indigo-100">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" id="shippingSameAsBilling" checked={shippingSameAsBilling} onChange={(e) => setShippingSameAsBilling(e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <label htmlFor="shippingSameAsBilling" className="text-sm text-gray-700">Primary Shipping same as Billing</label>
                    </div>
                    {!shippingSameAsBilling && (
                      <div className="space-y-2 mt-2">
                        <span className="text-sm font-medium text-gray-600 block">Primary Shipping Address</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input type="text" placeholder="Attention" value={addresses[1]?.attention || ''} onChange={(e) => updateAddressField(1, 'attention', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" />
                          <input type="text" placeholder="Landmark" value={addresses[1]?.landmark || ''} onChange={(e) => updateAddressField(1, 'landmark', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" />
                        </div>
                        <input type="text" placeholder="Street Address *" value={addresses[1]?.street || ''} onChange={(e) => updateAddressField(1, 'street', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" required />
                        <div className="grid grid-cols-3 gap-3">
                          <input type="text" placeholder="City *" value={addresses[1]?.city || ''} onChange={(e) => updateAddressField(1, 'city', e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" required />
                          <input type="text" placeholder="State *" value={addresses[1]?.state || ''} onChange={(e) => updateAddressField(1, 'state', e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" required />
                          <input type="text" placeholder="ZIP *" value={addresses[1]?.zipCode || ''} onChange={(e) => updateAddressField(1, 'zipCode', e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" required />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Shipping Addresses */}
                {addresses.length > 2 && (
                  <div className="space-y-4">
                    <span className="text-sm font-medium text-gray-700">Additional Shipping Addresses</span>
                    {addresses.slice(2).map((address, idx) => {
                      const index = idx + 2;
                      return (
                        <div key={index} className="p-4 border border-gray-200 rounded-xl space-y-3 bg-white hover:border-gray-300">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Shipping Address {idx + 1}</span>
                            <button type="button" onClick={() => removeShippingAddress(index)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input type="text" placeholder="Attention" value={address.attention || ''} onChange={(e) => updateAddressField(index, 'attention', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" />
                            <input type="text" placeholder="Landmark" value={address.landmark || ''} onChange={(e) => updateAddressField(index, 'landmark', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" />
                          </div>
                          <input type="text" placeholder="Street Address *" value={address.street} onChange={(e) => updateAddressField(index, 'street', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" required />
                          <div className="grid grid-cols-3 gap-3">
                            <input type="text" placeholder="City *" value={address.city} onChange={(e) => updateAddressField(index, 'city', e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" required />
                            <input type="text" placeholder="State *" value={address.state} onChange={(e) => updateAddressField(index, 'state', e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" required />
                            <input type="text" placeholder="ZIP *" value={address.zipCode} onChange={(e) => updateAddressField(index, 'zipCode', e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" required />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Actions */}
              <div className="pt-6 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white pb-2">
                <button
                  type="button"
                  onClick={resetCustomerForm}
                  className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm transition-colors"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}