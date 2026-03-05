'use client';

import React, { useState } from 'react';
import { useAdmin, type Customer, type Address, type Lead } from '../context/AdminContext';
import { Plus, Edit2, Trash2, MapPin, UserPlus, ArrowRight, Building, Users } from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'customers' | 'leads';

export function CustomersPage() {
  const { customers, leads, routes, priceTiers, addCustomer, updateCustomer, addLead, updateLead, deleteLead, employees, employeeRoles, currentUser, setCurrentUser, resetData } = useAdmin();
  const [activeTab, setActiveTab] = useState<Tab>('customers');

  const salesRole = employeeRoles.find(r => r.name === 'Sales Executive');
  const kamRole = employeeRoles.find(r => r.name === 'Key Account Manager');
  const salesEmployees = employees.filter(e => e.roleIds.includes(salesRole?.id || ''));
  const kamEmployees = employees.filter(e => e.roleIds.includes(kamRole?.id || ''));

  const isSales = currentUser?.roleIds.includes(salesRole?.id || '');
  const isKAM = currentUser?.roleIds.includes(kamRole?.id || '');

  const visibleleads = isSales ? leads.filter(l => l.salesPersonId === currentUser?.id) : leads;
  const visibleCustomers = isKAM ? customers.filter(c => c.keyAccountManagerId === currentUser?.id) : customers;

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);

  const [customerFormData, setCustomerFormData] = useState({
    businessName: '', type: 'b2b' as Customer['type'], email: '', phone: '', tierId: '', routeId: '', pan: '', gstin: '', salesPersonId: '', keyAccountManagerId: '', comments: '',
  });

  const [addresses, setAddresses] = useState<Omit<Address, 'id'>[]>([
    { street: '', city: '', state: '', zipCode: '', type: 'billing', landmark: '', attention: '' },
  ]);

  const [authorizedUsers, setAuthorizedUsers] = useState<{ id: string; name: string; phone: string; email?: string }[]>([]);

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    businessName: '', phone: '', status: 'New' as Lead['status'], salesPersonId: '', comments: '',
  });
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [formErrors, setFormErrors] = useState<{ phone?: string; email?: string; billing?: string; authorizedUsers?: string }>({});
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);

  const validateCustomer = (data: typeof customerFormData, isEditingId?: string) => {
    const errors: { phone?: string; email?: string; billing?: string; authorizedUsers?: string } = {};
    const cleanPhone = data.phone;
    if (!/^\d{10}$/.test(cleanPhone)) { errors.phone = 'Phone must be 10 digits'; }
    else {
      const dupCustomer = customers.find(c => c.phone === `+91${cleanPhone}` && c.id !== isEditingId);
      if (dupCustomer) errors.phone = 'Phone already used by another Customer';
      const dupLead = leads.find(l => l.phone === `+91${cleanPhone}` && (!convertingLeadId || l.id !== convertingLeadId));
      if (dupLead && !convertingLeadId) errors.phone = 'Phone exists in Leads';
    }
    if (data.email) {
      const dupEmail = customers.find(c => c.email?.toLowerCase() === data.email.toLowerCase() && c.id !== isEditingId);
      if (dupEmail) errors.email = 'Email already used by another Customer';
    }
    const billingAddr = addresses.find(a => a.type === 'billing');
    if (!billingAddr || !billingAddr.street || !billingAddr.city || !billingAddr.state || !billingAddr.zipCode) { errors.billing = 'Billing address is mandatory (Street, City, State, Zip)'; }
    const invalidAuthUser = authorizedUsers.find(u => !/^\d{10}$/.test(u.phone));
    if (invalidAuthUser) { errors.authorizedUsers = 'All authorized users must have valid 10-digit phones'; }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateLead = (data: typeof leadFormData, isEditingId?: string) => {
    const errors: { phone?: string; } = {};
    const cleanPhone = data.phone;
    if (!/^\d{10}$/.test(cleanPhone)) { errors.phone = 'Phone must be 10 digits'; }
    else {
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
    if (!customerFormData.pan) { toast.error('PAN is mandatory'); return; }
    let finalAddresses = addresses.map((addr, idx) => ({ ...addr, id: (addr as any).id || `addr_${Date.now()}_${idx}` }));
    if (shippingSameAsBilling) {
      const billing = finalAddresses.find(a => a.type === 'billing');
      if (billing) { finalAddresses.push({ ...billing, id: `addr_${Date.now()}_copy`, type: 'shipping' }); }
    }
    const finalAuthUsers = authorizedUsers.map(u => ({ ...u, phone: u.phone.startsWith('+91') ? u.phone : `+91${u.phone}` }));
    const formattedData = { ...customerFormData, phone: `+91${customerFormData.phone}` };
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, { ...formattedData, addresses: finalAddresses, authorizedUsers: finalAuthUsers });
      toast.success('Customer updated successfully');
    } else {
      addCustomer({ ...formattedData, addresses: finalAddresses, authorizedUsers: finalAuthUsers, walletBalance: 0 });
      toast.success('Customer added successfully');
      if (convertingLeadId) { deleteLead(convertingLeadId); toast.info('Lead converted to Customer'); }
    }
    resetCustomerForm();
  };

  const resetCustomerForm = () => {
    setCustomerFormData({ businessName: '', type: 'b2b', email: '', phone: '', tierId: '', routeId: '', pan: '', gstin: '', salesPersonId: '', keyAccountManagerId: '', comments: '' });
    setAddresses([{ street: '', city: '', state: '', zipCode: '', type: 'billing', landmark: '', attention: '' }]);
    setAuthorizedUsers([]); setFormErrors({}); setShippingSameAsBilling(true); setShowCustomerForm(false); setEditingCustomer(null); setConvertingLeadId(null);
  };

  const initEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    const rawPhone = customer.phone?.startsWith('+91') ? customer.phone.slice(3) : customer.phone;
    setCustomerFormData({ businessName: customer.businessName, type: customer.type || 'b2b', email: customer.email || '', phone: rawPhone, tierId: customer.tierId || '', routeId: customer.routeId || '', pan: customer.pan || '', gstin: customer.gstin || '', salesPersonId: customer.salesPersonId || '', keyAccountManagerId: customer.keyAccountManagerId || '', comments: customer.comments || '' });
    setAddresses(customer.addresses.map(({ id, ...addr }) => ({ ...addr, landmark: addr.landmark || '', attention: addr.attention || '' })));
    setAuthorizedUsers(customer.authorizedUsers?.map(u => ({ ...u, phone: u.phone.startsWith('+91') ? u.phone.slice(3) : u.phone })) || []);
    setFormErrors({}); setShippingSameAsBilling(false); setShowCustomerForm(true);
  };

  const initConvertLead = (lead: Lead) => {
    setConvertingLeadId(lead.id);
    const rawPhone = lead.phone?.startsWith('+91') ? lead.phone.slice(3) : lead.phone;
    setCustomerFormData({ businessName: lead.businessName, type: 'b2b', email: '', phone: rawPhone, tierId: '', routeId: '', pan: '', gstin: '', salesPersonId: lead.salesPersonId || '', keyAccountManagerId: '', comments: lead.comments || '' });
    setAddresses([{ street: '', city: '', state: '', zipCode: '', type: 'billing', landmark: '', attention: '' }]);
    setAuthorizedUsers([]); setFormErrors({}); setShowCustomerForm(true); setActiveTab('customers');
  };

  const addAuthorizedUser = () => { setAuthorizedUsers([...authorizedUsers, { id: `au_${Date.now()}`, name: '', phone: '' }]); };
  const updateAuthorizedUser = (index: number, field: keyof typeof authorizedUsers[0], value: string) => { const newUsers = [...authorizedUsers]; newUsers[index] = { ...newUsers[index], [field]: value }; setAuthorizedUsers(newUsers); };
  const removeAuthorizedUser = (index: number) => { setAuthorizedUsers(authorizedUsers.filter((_, i) => i !== index)); };
  const addShippingAddress = () => { setAddresses([...addresses, { street: '', city: '', state: '', zipCode: '', type: 'shipping', landmark: '', attention: '' }]); };
  const updateAddressField = (index: number, field: keyof typeof addresses[0], value: string) => { const newAddresses = [...addresses]; newAddresses[index] = { ...newAddresses[index], [field]: value }; setAddresses(newAddresses); };
  const removeShippingAddress = (index: number) => { if (index === 0) return; setAddresses(addresses.filter((_, i) => i !== index)); };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLead(leadFormData, editingLead?.id)) return;
    const formattedData = { ...leadFormData, phone: `+91${leadFormData.phone}` };
    if (editingLead) { updateLead(editingLead.id, formattedData); toast.success('Lead updated'); }
    else { addLead(formattedData); toast.success('Lead added'); }
    resetLeadForm();
  };

  const resetLeadForm = () => { setLeadFormData({ businessName: '', phone: '', status: 'New', salesPersonId: '', comments: '' }); setFormErrors({}); setShowLeadForm(false); setEditingLead(null); };

  const initEditLead = (lead: Lead) => {
    setEditingLead(lead);
    const rawPhone = lead.phone?.startsWith('+91') ? lead.phone.slice(3) : lead.phone;
    setLeadFormData({ businessName: lead.businessName, phone: rawPhone, status: lead.status, salesPersonId: lead.salesPersonId || '', comments: lead.comments || '' });
    setFormErrors({}); setShowLeadForm(true);
  };

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
    <>
      <style>{`
        .cust-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .cust-title { font-size: 20px; font-weight: 600; color: #1f2937; }
        .cust-role-sim { background: #fefce8; border: 1px solid #fde68a; padding: 12px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .cust-role-text { font-size: 13px; color: #854d0e; font-weight: 500; }
        .cust-role-bold { font-weight: 700; }
        .cust-role-select { font-size: 13px; border: 1px solid #d1d5db; border-radius: 6px; padding: 4px 8px; }
        .cust-role-reset { margin-left: 16px; padding: 4px 12px; background: #fee2e2; color: #b91c1c; font-size: 12px; border-radius: 4px; border: none; cursor: pointer; }
        .cust-role-reset:hover { background: #fecaca; }
        .cust-header-actions { display: flex; gap: 16px; align-items: center; }
        .cust-tab-group { display: flex; background: #f3f4f6; border-radius: 8px; padding: 4px; }
        .cust-tab { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; border: none; cursor: pointer; transition: all 0.15s; }
        .cust-tab-active { background: white; color: #2563eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .cust-tab-inactive { background: transparent; color: #6b7280; }
        .cust-tab-inactive:hover { color: #111827; }
        .cust-btn-add { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #16a34a; color: white; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .cust-btn-add:hover { background: #15803d; }
        .cust-table-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; overflow: hidden; margin-top: 16px; }
        .cust-table { width: 100%; border-collapse: collapse; }
        .cust-thead { background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
        .cust-th { padding: 14px 24px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .cust-th-right { text-align: right; }
        .cust-tbody tr { border-bottom: 1px solid #f9fafb; transition: background 0.15s; }
        .cust-tbody tr:hover { background: #f9fafb; }
        .cust-td { padding: 14px 24px; }
        .cust-td-name { font-weight: 500; color: #111827; }
        .cust-td-email { font-size: 13px; color: #111827; }
        .cust-td-phone { font-size: 12px; color: #9ca3af; margin-top: 2px; }
        .cust-td-text { font-size: 13px; color: #6b7280; }
        .cust-td-wallet { font-weight: 500; color: #111827; }
        .cust-td-right { text-align: right; }
        .cust-route-text { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; }
        .cust-unassigned { color: #9ca3af; font-size: 13px; font-style: italic; }
        .cust-btn-icon { padding: 4px; color: #9ca3af; background: transparent; border: none; cursor: pointer; transition: color 0.15s; }
        .cust-btn-icon:hover { color: #2563eb; }
        .cust-badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
        .cust-badge-blue { background: #dbeafe; color: #1e40af; }
        .cust-badge-yellow { background: #fef9c3; color: #854d0e; }
        .cust-badge-green { background: #dcfce7; color: #166534; }
        .cust-lead-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
        .cust-btn-convert { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #16a34a; font-weight: 500; background: none; border: none; cursor: pointer; }
        .cust-btn-convert:hover { color: #15803d; }
        .cust-btn-icon-delete:hover { color: #dc2626; }
        .cust-empty { padding: 48px 24px; text-align: center; color: #9ca3af; font-size: 14px; }
        .cust-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 16px; overflow-y: auto; }
        .cust-modal { background: white; border-radius: 16px; box-shadow: 0 25px 50px rgba(0,0,0,0.2); width: 100%; max-width: 448px; overflow: hidden; }
        .cust-modal-lg { max-width: 896px; margin: 32px auto; display: flex; flex-direction: column; max-height: 90vh; }
        .cust-modal-header { padding: 16px 24px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; background: #f9fafb; }
        .cust-modal-header-icon { background: #dbeafe; padding: 8px; border-radius: 8px; display: flex; }
        .cust-modal-header-text h3 { font-size: 18px; font-weight: 600; color: #1f2937; }
        .cust-modal-header-text p { font-size: 12px; color: #9ca3af; }
        .cust-modal-close { color: #9ca3af; cursor: pointer; background: none; border: none; font-size: 18px; }
        .cust-modal-close:hover { color: #6b7280; }
        .cust-form-scroll { overflow-y: auto; padding: 24px; }
        .cust-section { margin-bottom: 32px; }
        .cust-section-title { font-size: 11px; font-weight: 600; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .cust-section-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
        .cust-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 768px) { .cust-form-grid { grid-template-columns: 1fr; } }
        .cust-form-full { grid-column: span 2; }
        .cust-label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 4px; }
        .cust-input, .cust-select, .cust-textarea { width: 100%; padding: 8px 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.15s; }
        .cust-input:focus, .cust-select:focus, .cust-textarea:focus { background: white; box-shadow: 0 0 0 2px rgba(59,130,246,0.3); border-color: #3b82f6; }
        .cust-input-error { border-color: #ef4444; }
        .cust-input-error:focus { box-shadow: 0 0 0 2px rgba(239,68,68,0.3); }
        .cust-error-text { font-size: 12px; color: #dc2626; margin-top: 4px; }
        .cust-phone-group { display: flex; }
        .cust-phone-prefix { display: inline-flex; align-items: center; padding: 0 12px; border: 1px solid #d1d5db; border-right: none; border-radius: 8px 0 0 8px; background: #f9fafb; color: #9ca3af; font-size: 13px; }
        .cust-phone-input { border-radius: 0 8px 8px 0; flex: 1; min-width: 0; }
        .cust-addr-block { padding: 16px; border: 1px solid #c7d2fe; background: #f5f3ff; border-radius: 12px; margin-bottom: 16px; }
        .cust-addr-block-extra { padding: 16px; border: 1px solid #e5e7eb; background: white; border-radius: 12px; margin-bottom: 12px; }
        .cust-addr-block-extra:hover { border-color: #d1d5db; }
        .cust-addr-title { font-size: 13px; font-weight: 600; color: #4338ca; margin-bottom: 8px; display: block; }
        .cust-addr-title-extra { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; }
        .cust-addr-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px; }
        .cust-addr-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .cust-addr-input { width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; outline: none; }
        .cust-addr-input:focus { border-color: #6366f1; }
        .cust-shipping-checkbox { display: flex; align-items: center; gap: 8px; padding-top: 12px; border-top: 1px solid #e0e7ff; margin-top: 12px; }
        .cust-shipping-label { font-size: 13px; color: #374151; }
        .cust-auth-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .cust-btn-add-user { font-size: 13px; color: #0d9488; background: none; border: none; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 4px; }
        .cust-btn-add-user:hover { color: #0f766e; }
        .cust-auth-row { display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6; margin-bottom: 8px; }
        .cust-auth-fields { flex: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        @media (max-width: 768px) { .cust-auth-fields { grid-template-columns: 1fr; } }
        .cust-auth-input { padding: 8px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; outline: none; width: 100%; }
        .cust-auth-input:focus { border-color: #0d9488; }
        .cust-btn-remove-auth { padding: 8px; color: #9ca3af; background: transparent; border: none; cursor: pointer; opacity: 0; transition: opacity 0.15s; }
        .cust-auth-row:hover .cust-btn-remove-auth { opacity: 1; }
        .cust-btn-remove-auth:hover { color: #ef4444; }
        .cust-auth-empty { font-size: 13px; color: #9ca3af; font-style: italic; }
        .cust-form-footer { padding-top: 24px; border-top: 1px solid #f3f4f6; display: flex; gap: 12px; justify-content: flex-end; position: sticky; bottom: 0; background: white; padding-bottom: 8px; }
        .cust-btn-cancel { padding: 10px 24px; border: 1px solid #e5e7eb; border-radius: 8px; color: #374151; font-weight: 500; background: white; cursor: pointer; font-size: 14px; }
        .cust-btn-cancel:hover { background: #f9fafb; }
        .cust-btn-save { padding: 10px 24px; background: #16a34a; color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05); font-size: 14px; }
        .cust-btn-save:hover { background: #15803d; }
        .cust-readonly-field { width: 100%; padding: 8px 16px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; color: #6b7280; font-size: 14px; }
        .cust-addr-extra-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .cust-btn-remove-addr { color: #9ca3af; background: none; border: none; cursor: pointer; }
        .cust-btn-remove-addr:hover { color: #dc2626; }
      `}</style>

      <div>
        {/* Role Simulator */}
        <div className="cust-role-sim">
          <span className="cust-role-text">🕵️ Role Simulator: Viewing as <span className="cust-role-bold">{currentUser?.name || 'Admin'}</span></span>
          <select
            className="cust-role-select"
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
          <button onClick={() => { if (confirm('This will reset all data to initial state. Continue?')) { resetData(); } }} className="cust-role-reset">
            Reset Data (Dev)
          </button>
        </div>

        <div className="cust-header">
          <h2 className="cust-title">{activeTab === 'leads' ? 'Leads Management' : 'Customer Management'}</h2>
          <div className="cust-header-actions">
            <div className="cust-tab-group">
              <button onClick={() => setActiveTab('customers')} className={`cust-tab ${activeTab === 'customers' ? 'cust-tab-active' : 'cust-tab-inactive'}`}>Customers</button>
              <button onClick={() => setActiveTab('leads')} className={`cust-tab ${activeTab === 'leads' ? 'cust-tab-active' : 'cust-tab-inactive'}`}>Leads</button>
            </div>
            <button onClick={() => activeTab === 'leads' ? setShowLeadForm(true) : setShowCustomerForm(true)} className="cust-btn-add">
              <Plus style={{ width: 16, height: 16 }} /> {activeTab === 'leads' ? 'Add Lead' : 'Add Customer'}
            </button>
          </div>
        </div>

        {/* LEADS TAB */}
        {activeTab === 'leads' && (
          <div className="cust-table-card">
            <table className="cust-table">
              <thead className="cust-thead">
                <tr>
                  <th className="cust-th">Business Name</th>
                  <th className="cust-th">Phone</th>
                  <th className="cust-th">Status</th>
                  <th className="cust-th">Sales Rep</th>
                  <th className="cust-th">Created</th>
                  <th className="cust-th cust-th-right">Actions</th>
                </tr>
              </thead>
              <tbody className="cust-tbody">
                {visibleleads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="cust-td cust-td-name">{lead.businessName}</td>
                    <td className="cust-td cust-td-text">{lead.phone}</td>
                    <td className="cust-td">
                      <span className={`cust-badge ${lead.status === 'New' ? 'cust-badge-blue' : lead.status === 'Contacted' ? 'cust-badge-yellow' : 'cust-badge-green'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="cust-td cust-td-text">{employees.find(e => e.id === lead.salesPersonId)?.name || '-'}</td>
                    <td className="cust-td cust-td-text">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="cust-td">
                      <div className="cust-lead-actions">
                        <button onClick={() => initConvertLead(lead)} className="cust-btn-convert" title="Convert to Customer">
                          <UserPlus style={{ width: 16, height: 16 }} /> Convert
                        </button>
                        <button onClick={() => initEditLead(lead)} className="cust-btn-icon"><Edit2 style={{ width: 16, height: 16 }} /></button>
                        <button onClick={() => deleteLead(lead.id)} className="cust-btn-icon cust-btn-icon-delete"><Trash2 style={{ width: 16, height: 16 }} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleleads.length === 0 && (<tr><td colSpan={6} className="cust-empty">No leads found. Add a new lead to get started.</td></tr>)}
              </tbody>
            </table>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="cust-table-card">
            <table className="cust-table">
              <thead className="cust-thead">
                <tr>
                  <th className="cust-th">Business Name</th>
                  <th className="cust-th">Contact</th>
                  <th className="cust-th">Tier</th>
                  <th className="cust-th">Route</th>
                  <th className="cust-th">KAM</th>
                  <th className="cust-th">Sales Rep</th>
                  <th className="cust-th">Wallet</th>
                  <th className="cust-th cust-th-right">Actions</th>
                </tr>
              </thead>
              <tbody className="cust-tbody">
                {visibleCustomers.map((customer) => {
                  const tier = priceTiers.find(t => t.id === customer.tierId);
                  const route = routes.find(r => r.id === customer.routeId);
                  return (
                    <tr key={customer.id}>
                      <td className="cust-td cust-td-name">{customer.businessName}</td>
                      <td className="cust-td">
                        <div className="cust-td-email">{customer.email}</div>
                        <div className="cust-td-phone">{customer.phone}</div>
                      </td>
                      <td className="cust-td cust-td-text">{tier?.name || 'Default'}</td>
                      <td className="cust-td">
                        {route ? (
                          <span className="cust-route-text"><MapPin style={{ width: 14, height: 14, color: '#9ca3af' }} />{route.name}</span>
                        ) : (<span className="cust-unassigned">Unassigned</span>)}
                      </td>
                      <td className="cust-td cust-td-text">{employees.find(e => e.id === customer.keyAccountManagerId)?.name || '-'}</td>
                      <td className="cust-td cust-td-text">{employees.find(e => e.id === customer.salesPersonId)?.name || '-'}</td>
                      <td className="cust-td cust-td-wallet">₹{customer.walletBalance.toFixed(2)}</td>
                      <td className="cust-td cust-td-right">
                        <button onClick={() => initEditCustomer(customer)} className="cust-btn-icon"><Edit2 style={{ width: 16, height: 16 }} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* LEAD FORM MODAL */}
        {showLeadForm && (
          <div className="cust-modal-backdrop">
            <div className="cust-modal">
              <div className="cust-modal-header">
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937' }}>{editingLead ? 'Edit Lead' : 'Add New Lead'}</h3>
                <button onClick={resetLeadForm} className="cust-modal-close">✕</button>
              </div>
              <form onSubmit={handleLeadSubmit} className="cust-form-scroll">
                <div className="cust-section">
                  <label className="cust-label">Business Name</label>
                  <input type="text" value={leadFormData.businessName} onChange={(e) => setLeadFormData({ ...leadFormData, businessName: e.target.value })} className="cust-input" placeholder="e.g. Tasty Bites Cafe" required />
                </div>
                <div className="cust-section">
                  <label className="cust-label">Phone Number</label>
                  <div className="cust-phone-group">
                    <span className="cust-phone-prefix">+91</span>
                    <input type="tel" value={leadFormData.phone} onChange={handlePhoneInput(setLeadFormData, leadFormData)} className={`cust-input cust-phone-input ${formErrors.phone ? 'cust-input-error' : ''}`} placeholder="9876543210" required />
                  </div>
                  {formErrors.phone && <p className="cust-error-text">{formErrors.phone}</p>}
                </div>
                <div className="cust-section">
                  <label className="cust-label">Status</label>
                  <select value={leadFormData.status} onChange={(e) => setLeadFormData({ ...leadFormData, status: e.target.value as any })} className="cust-select">
                    <option value="New">New</option><option value="Contacted">Contacted</option><option value="Ready">Ready</option>
                  </select>
                </div>
                <div className="cust-section">
                  <label className="cust-label">Sales Person</label>
                  <select value={leadFormData.salesPersonId} onChange={(e) => setLeadFormData({ ...leadFormData, salesPersonId: e.target.value })} className="cust-select">
                    <option value="">Select Sales Person</option>
                    {salesEmployees.map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
                  </select>
                </div>
                <div className="cust-section">
                  <label className="cust-label">Comments</label>
                  <textarea value={leadFormData.comments} onChange={(e) => setLeadFormData({ ...leadFormData, comments: e.target.value })} className="cust-textarea" rows={3} placeholder="Internal notes..." />
                </div>
                <div style={{ display: 'flex', gap: 12, paddingTop: 16 }}>
                  <button type="button" onClick={resetLeadForm} className="cust-btn-cancel" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="cust-btn-save" style={{ flex: 1, background: '#2563eb' }}>{editingLead ? 'Update Lead' : 'Add Lead'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CUSTOMER FORM MODAL */}
        {showCustomerForm && (
          <div className="cust-modal-backdrop">
            <div className="cust-modal cust-modal-lg">
              <div className="cust-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="cust-modal-header-icon"><Building style={{ width: 20, height: 20, color: '#2563eb' }} /></div>
                  <div className="cust-modal-header-text">
                    <h3>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
                    <p>{convertingLeadId ? 'Converting lead to detailed customer profile' : 'Enter business and legal details'}</p>
                  </div>
                </div>
                <button onClick={resetCustomerForm} className="cust-modal-close">✕</button>
              </div>

              <form onSubmit={handleCustomerSubmit} className="cust-form-scroll">
                {/* Business Info */}
                <section className="cust-section">
                  <h4 className="cust-section-title"><span className="cust-section-dot" style={{ background: '#3b82f6' }}></span> Business Information</h4>
                  <div className="cust-form-grid">
                    <div><label className="cust-label">Customer Type</label><select value={customerFormData.type} onChange={(e) => setCustomerFormData({ ...customerFormData, type: e.target.value as any })} className="cust-select"><option value="b2b">B2B (Business)</option><option value="b2c">B2C (Individual)</option></select></div>
                    <div><label className="cust-label">Business Name *</label><input type="text" value={customerFormData.businessName} onChange={(e) => setCustomerFormData({ ...customerFormData, businessName: e.target.value })} className="cust-input" required /></div>
                    <div>
                      <label className="cust-label">Email *</label>
                      <input type="email" value={customerFormData.email} onChange={(e) => { setCustomerFormData({ ...customerFormData, email: e.target.value }); if (formErrors.email) setFormErrors({ ...formErrors, email: undefined }); }} className={`cust-input ${formErrors.email ? 'cust-input-error' : ''}`} required />
                      {formErrors.email && <p className="cust-error-text">{formErrors.email}</p>}
                    </div>
                    <div>
                      <label className="cust-label">Primary Phone *</label>
                      <div className="cust-phone-group"><span className="cust-phone-prefix">+91</span><input type="tel" value={customerFormData.phone} onChange={handlePhoneInput(setCustomerFormData, customerFormData)} className={`cust-input cust-phone-input ${formErrors.phone ? 'cust-input-error' : ''}`} placeholder="9876543210" required /></div>
                      {formErrors.phone && <p className="cust-error-text">{formErrors.phone}</p>}
                    </div>
                  </div>
                </section>

                {/* Legal */}
                <section className="cust-section">
                  <h4 className="cust-section-title"><span className="cust-section-dot" style={{ background: '#8b5cf6' }}></span> Legal Details</h4>
                  <div className="cust-form-grid">
                    <div><label className="cust-label">PAN Number *</label><input type="text" value={customerFormData.pan} onChange={(e) => setCustomerFormData({ ...customerFormData, pan: e.target.value.toUpperCase() })} className="cust-input" style={{ textTransform: 'uppercase' }} placeholder="ABCDE1234F" required /></div>
                    <div><label className="cust-label">GSTIN (Optional)</label><input type="text" value={customerFormData.gstin} onChange={(e) => setCustomerFormData({ ...customerFormData, gstin: e.target.value.toUpperCase() })} className="cust-input" style={{ textTransform: 'uppercase' }} placeholder="22AAAAA0000A1Z5" /></div>
                  </div>
                </section>

                {/* Configuration */}
                <section className="cust-section">
                  <h4 className="cust-section-title"><span className="cust-section-dot" style={{ background: '#f97316' }}></span> Configuration</h4>
                  <div className="cust-form-grid">
                    <div><label className="cust-label">Price Tier</label><select value={customerFormData.tierId} onChange={(e) => setCustomerFormData({ ...customerFormData, tierId: e.target.value })} className="cust-select"><option value="">Default Tier</option>{priceTiers.map(tier => (<option key={tier.id} value={tier.id}>{tier.name}</option>))}</select></div>
                    <div><label className="cust-label">Delivery Route</label><select value={customerFormData.routeId} onChange={(e) => setCustomerFormData({ ...customerFormData, routeId: e.target.value })} className="cust-select"><option value="">No Route Assigned</option>{routes.map(route => (<option key={route.id} value={route.id}>{route.name} ({route.code})</option>))}</select></div>
                    <div><label className="cust-label">Key Account Manager</label><select value={customerFormData.keyAccountManagerId} onChange={(e) => setCustomerFormData({ ...customerFormData, keyAccountManagerId: e.target.value })} className="cust-select"><option value="">Select KAM</option>{kamEmployees.map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}</select></div>
                    <div><label className="cust-label">Origin Sales Person (Read Only)</label><div className="cust-readonly-field">{customers.find(c => c.id === editingCustomer?.id)?.salesPersonId ? employees.find(e => e.id === customers.find(c => c.id === editingCustomer?.id)?.salesPersonId)?.name : customerFormData.salesPersonId ? employees.find(e => e.id === customerFormData.salesPersonId)?.name : 'None'}</div></div>
                    <div className="cust-form-full"><label className="cust-label">Comments / History</label><textarea value={customerFormData.comments} onChange={(e) => setCustomerFormData({ ...customerFormData, comments: e.target.value })} className="cust-textarea" rows={3} placeholder="Customer history..." /></div>
                  </div>
                </section>

                {/* Authorized Users */}
                <section className="cust-section">
                  <div className="cust-auth-header">
                    <h4 className="cust-section-title" style={{ marginBottom: 0 }}><span className="cust-section-dot" style={{ background: '#14b8a6' }}></span> Authorized Users</h4>
                    <button type="button" onClick={addAuthorizedUser} className="cust-btn-add-user"><Plus style={{ width: 16, height: 16 }} /> Add User</button>
                  </div>
                  {authorizedUsers.map((user, index) => (
                    <div key={index} className="cust-auth-row">
                      <div className="cust-auth-fields">
                        <input type="text" placeholder="Name" value={user.name} onChange={(e) => updateAuthorizedUser(index, 'name', e.target.value)} className="cust-auth-input" required />
                        <div className="cust-phone-group"><span className="cust-phone-prefix">+91</span><input type="tel" placeholder="Phone" value={user.phone} onChange={handleAuthUserPhone(index)} className="cust-auth-input" style={{ borderRadius: '0 6px 6px 0' }} required /></div>
                        <input type="email" placeholder="Email (Optional)" value={user.email || ''} onChange={(e) => updateAuthorizedUser(index, 'email', e.target.value)} className="cust-auth-input" />
                      </div>
                      <button type="button" onClick={() => removeAuthorizedUser(index)} className="cust-btn-remove-auth"><Trash2 style={{ width: 16, height: 16 }} /></button>
                    </div>
                  ))}
                  {authorizedUsers.length === 0 && (<p className="cust-auth-empty">No authorized users added yet.</p>)}
                </section>

                {/* Addresses */}
                <section className="cust-section">
                  <div className="cust-auth-header">
                    <h4 className="cust-section-title" style={{ marginBottom: 0 }}><span className="cust-section-dot" style={{ background: '#6366f1' }}></span> Addresses</h4>
                    <button type="button" onClick={addShippingAddress} className="cust-btn-add-user" style={{ color: '#4f46e5' }}><Plus style={{ width: 16, height: 16 }} /> Add Shipping Address</button>
                  </div>
                  {formErrors.billing && <p className="cust-error-text" style={{ background: '#fef2f2', padding: 8, borderRadius: 4, marginBottom: 16 }}>{formErrors.billing}</p>}

                  <div className="cust-addr-block">
                    <span className="cust-addr-title">Billing Address (Mandatory)</span>
                    <div className="cust-addr-row">
                      <input type="text" placeholder="Attention" value={addresses[0]?.attention || ''} onChange={(e) => updateAddressField(0, 'attention', e.target.value)} className="cust-addr-input" />
                      <input type="text" placeholder="Landmark" value={addresses[0]?.landmark || ''} onChange={(e) => updateAddressField(0, 'landmark', e.target.value)} className="cust-addr-input" />
                    </div>
                    <input type="text" placeholder="Street Address *" value={addresses[0]?.street || ''} onChange={(e) => updateAddressField(0, 'street', e.target.value)} className="cust-addr-input" style={{ marginBottom: 8 }} required />
                    <div className="cust-addr-row-3">
                      <input type="text" placeholder="City *" value={addresses[0]?.city || ''} onChange={(e) => updateAddressField(0, 'city', e.target.value)} className="cust-addr-input" required />
                      <input type="text" placeholder="State *" value={addresses[0]?.state || ''} onChange={(e) => updateAddressField(0, 'state', e.target.value)} className="cust-addr-input" required />
                      <input type="text" placeholder="ZIP *" value={addresses[0]?.zipCode || ''} onChange={(e) => updateAddressField(0, 'zipCode', e.target.value)} className="cust-addr-input" required />
                    </div>

                    <div className="cust-shipping-checkbox">
                      <input type="checkbox" id="shippingSameAsBilling" checked={shippingSameAsBilling} onChange={(e) => setShippingSameAsBilling(e.target.checked)} style={{ accentColor: '#6366f1' }} />
                      <label htmlFor="shippingSameAsBilling" className="cust-shipping-label">Primary Shipping same as Billing</label>
                    </div>
                    {!shippingSameAsBilling && (
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 8 }}>Primary Shipping Address</span>
                        <div className="cust-addr-row">
                          <input type="text" placeholder="Attention" value={addresses[1]?.attention || ''} onChange={(e) => updateAddressField(1, 'attention', e.target.value)} className="cust-addr-input" />
                          <input type="text" placeholder="Landmark" value={addresses[1]?.landmark || ''} onChange={(e) => updateAddressField(1, 'landmark', e.target.value)} className="cust-addr-input" />
                        </div>
                        <input type="text" placeholder="Street Address *" value={addresses[1]?.street || ''} onChange={(e) => updateAddressField(1, 'street', e.target.value)} className="cust-addr-input" style={{ marginBottom: 8 }} required />
                        <div className="cust-addr-row-3">
                          <input type="text" placeholder="City *" value={addresses[1]?.city || ''} onChange={(e) => updateAddressField(1, 'city', e.target.value)} className="cust-addr-input" required />
                          <input type="text" placeholder="State *" value={addresses[1]?.state || ''} onChange={(e) => updateAddressField(1, 'state', e.target.value)} className="cust-addr-input" required />
                          <input type="text" placeholder="ZIP *" value={addresses[1]?.zipCode || ''} onChange={(e) => updateAddressField(1, 'zipCode', e.target.value)} className="cust-addr-input" required />
                        </div>
                      </div>
                    )}
                  </div>

                  {addresses.length > 2 && (
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8, display: 'block' }}>Additional Shipping Addresses</span>
                      {addresses.slice(2).map((address, idx) => {
                        const index = idx + 2;
                        return (
                          <div key={index} className="cust-addr-block-extra">
                            <div className="cust-addr-extra-header">
                              <span className="cust-addr-title-extra">Shipping Address {idx + 1}</span>
                              <button type="button" onClick={() => removeShippingAddress(index)} className="cust-btn-remove-addr"><Trash2 style={{ width: 16, height: 16 }} /></button>
                            </div>
                            <div className="cust-addr-row">
                              <input type="text" placeholder="Attention" value={address.attention || ''} onChange={(e) => updateAddressField(index, 'attention', e.target.value)} className="cust-addr-input" />
                              <input type="text" placeholder="Landmark" value={address.landmark || ''} onChange={(e) => updateAddressField(index, 'landmark', e.target.value)} className="cust-addr-input" />
                            </div>
                            <input type="text" placeholder="Street Address *" value={address.street} onChange={(e) => updateAddressField(index, 'street', e.target.value)} className="cust-addr-input" style={{ marginBottom: 8 }} required />
                            <div className="cust-addr-row-3">
                              <input type="text" placeholder="City *" value={address.city} onChange={(e) => updateAddressField(index, 'city', e.target.value)} className="cust-addr-input" required />
                              <input type="text" placeholder="State *" value={address.state} onChange={(e) => updateAddressField(index, 'state', e.target.value)} className="cust-addr-input" required />
                              <input type="text" placeholder="ZIP *" value={address.zipCode} onChange={(e) => updateAddressField(index, 'zipCode', e.target.value)} className="cust-addr-input" required />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <div className="cust-form-footer">
                  <button type="button" onClick={resetCustomerForm} className="cust-btn-cancel">Cancel</button>
                  <button type="submit" className="cust-btn-save">{editingCustomer ? 'Update Customer' : 'Save Customer'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}