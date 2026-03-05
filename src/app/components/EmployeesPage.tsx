'use client';

import React, { useState } from 'react';
import { useAdmin, type Employee, type EmployeeRole } from '../context/AdminContext';
import { User, Shield, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';


const AVAILABLE_MODULES = [
  { id: 'orders', label: 'Live Orders' },
  { id: 'inventory', label: 'Inventory (Stock)' },
  { id: 'items', label: 'Item Definitions' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'customers', label: 'Customers' },
  { id: 'routes', label: 'Routes' },
  { id: 'employees', label: 'Employees' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'pricingTiers', label: 'Pricing Tiers' },
  { id: 'wallets', label: 'Wallets' },
];

export function EmployeesPage() {
  const { employees, employeeRoles, addEmployee, updateEmployee, deleteEmployee, addEmployeeRole, deleteEmployeeRole } = useAdmin();
  const [activeTab, setActiveTab] = useState<'employees' | 'roles'>('employees');

  // Employee Form State
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [empFormData, setEmpFormData] = useState({ name: '', email: '', phone: '', roleId: '', password: '' });

  // Role Form State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState({ appAccess: true, modules: [] as string[] });

  const openEmpModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmp(emp);
      setEmpFormData({ name: emp.name, email: emp.email || '', phone: emp.phone || '', roleId: emp.roleId, password: '' });
    } else {
      setEditingEmp(null);
      setEmpFormData({ name: '', email: '', phone: '', roleId: '', password: '' });
    }
    setIsEmpModalOpen(true);
  };

  const handleEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp) {
      await updateEmployee(editingEmp.id, empFormData);
    } else {
      await addEmployee({ ...empFormData, isActive: true });
    }
    setIsEmpModalOpen(false);
  };

  const handleEmpDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      await deleteEmployee(id);
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addEmployeeRole({ name: roleName, permissions });
    setRoleName('');
    setPermissions({ appAccess: true, modules: [] });
    setIsRoleModalOpen(false);
  };

  const handleRoleDelete = async (id: string) => {
    const used = employees.some(e => e.roleId === id);
    if (used) {
      toast.error("Cannot delete role: Assigned to active employees");
      return;
    }
    if (confirm('Delete this role?')) {
      await deleteEmployeeRole(id);
    }
  }

  const toggleModule = (moduleId: string) => {
    setPermissions(prev => {
      const currentModules = prev.modules;
      if (currentModules.includes(moduleId)) {
        return { ...prev, modules: currentModules.filter(m => m !== moduleId) };
      } else {
        return { ...prev, modules: [...currentModules, moduleId] };
      }
    });
  };

  const toggleAllModules = () => {
    if (permissions.modules.includes('all')) {
      setPermissions(prev => ({ ...prev, modules: [] }));
    } else {
      setPermissions(prev => ({ ...prev, modules: ['all'] }));
    }
  };

  return (
    <>
      <style>{`
        .emp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .emp-title { font-size: 20px; font-weight: 700; color: #1f2937; }
        .emp-subtitle { color: #6b7280; margin-top: 4px; font-size: 14px; }
        .emp-btn-add { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #2563eb; color: white; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; font-size: 14px; }
        .emp-btn-add:hover { background: #1d4ed8; }
        .emp-tabs { display: flex; border-bottom: 1px solid #e5e7eb; margin-bottom: 24px; }
        .emp-tab { padding: 12px 24px; font-weight: 500; font-size: 13px; border: none; background: transparent; cursor: pointer; transition: all 0.15s; color: #6b7280; border-bottom: 2px solid transparent; }
        .emp-tab:hover { color: #374151; }
        .emp-tab-active { border-bottom-color: #2563eb; color: #2563eb; }
        .emp-table-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; overflow: hidden; }
        .emp-table { width: 100%; border-collapse: collapse; }
        .emp-thead { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .emp-th { padding: 14px 24px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; }
        .emp-th-right { text-align: right; }
        .emp-tbody tr { border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
        .emp-tbody tr:hover { background: #f9fafb; }
        .emp-td { padding: 14px 24px; }
        .emp-td-right { text-align: right; display: flex; justify-content: flex-end; gap: 8px; }
        .emp-avatar { width: 32px; height: 32px; border-radius: 50%; background: #dbeafe; display: flex; align-items: center; justify-content: center; color: #2563eb; font-weight: 700; font-size: 14px; flex-shrink: 0; }
        .emp-name-row { display: flex; align-items: center; gap: 12px; }
        .emp-name { font-weight: 500; color: #111827; }
        .emp-badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
        .emp-badge-gray { background: #f3f4f6; color: #1f2937; }
        .emp-badge-green { background: #dcfce7; color: #166534; }
        .emp-badge-red { background: #fee2e2; color: #991b1b; }
        .emp-contact { font-size: 13px; color: #6b7280; }
        .emp-contact-sub { color: #9ca3af; }
        .emp-btn-icon { padding: 8px; color: #9ca3af; background: transparent; border: none; cursor: pointer; transition: color 0.15s; }
        .emp-btn-icon-edit:hover { color: #2563eb; }
        .emp-btn-icon-delete:hover { color: #dc2626; }
        .emp-empty { padding: 32px 24px; text-align: center; color: #9ca3af; font-size: 14px; }
        .emp-roles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .emp-role-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #f3f4f6; position: relative; transition: border-color 0.15s; }
        .emp-role-card:hover { border-color: #bfdbfe; }
        .emp-role-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .emp-role-icon { width: 40px; height: 40px; border-radius: 8px; background: #eef2ff; display: flex; align-items: center; justify-content: center; color: #4f46e5; }
        .emp-role-delete { color: #d1d5db; background: none; border: none; cursor: pointer; }
        .emp-role-delete:hover { color: #ef4444; }
        .emp-role-name { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 8px; }
        .emp-role-count { font-size: 13px; color: #9ca3af; margin-bottom: 16px; }
        .emp-role-perms { font-size: 12px; color: #9ca3af; background: #f9fafb; padding: 12px; border-radius: 8px; }
        .emp-role-perms-title { font-weight: 500; color: #374151; margin-bottom: 8px; }
        .emp-role-badges { display: flex; flex-wrap: wrap; gap: 4px; }
        .emp-role-badge-green { padding: 2px 8px; background: #dcfce7; color: #166534; border-radius: 4px; font-size: 11px; }
        .emp-role-badge-gray { padding: 2px 8px; background: #e5e7eb; color: #374151; border-radius: 4px; font-size: 11px; text-transform: capitalize; }
        .emp-role-no-access { color: #9ca3af; font-style: italic; }
        .emp-roles-empty { grid-column: 1 / -1; padding: 32px; text-align: center; color: #9ca3af; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; }
        .emp-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 16px; }
        .emp-modal { background: white; border-radius: 16px; box-shadow: 0 25px 50px rgba(0,0,0,0.2); width: 100%; max-width: 448px; overflow: hidden; }
        .emp-modal-sm { max-width: 384px; }
        .emp-modal-header { padding: 16px 24px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; background: #f9fafb; }
        .emp-modal-title { font-size: 18px; font-weight: 600; color: #1f2937; }
        .emp-modal-close { color: #9ca3af; cursor: pointer; background: none; border: none; font-size: 18px; }
        .emp-modal-close:hover { color: #6b7280; }
        .emp-modal-body { padding: 24px; }
        .emp-form-group { margin-bottom: 16px; }
        .emp-label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 4px; }
        .emp-input, .emp-select { width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white; }
        .emp-input:focus, .emp-select:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.3); border-color: #3b82f6; }
        .emp-perms-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .emp-btn-toggle { font-size: 12px; color: #2563eb; background: none; border: none; cursor: pointer; font-weight: 500; }
        .emp-btn-toggle:hover { color: #1d4ed8; }
        .emp-perms-list { max-height: 240px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #f9fafb; }
        .emp-perm-item { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px; border-radius: 4px; }
        .emp-perm-item:hover { background: #f3f4f6; }
        .emp-perm-checkbox { border-radius: 4px; accent-color: #2563eb; }
        .emp-perm-label { font-size: 13px; color: #374151; }
        .emp-modal-actions { display: flex; gap: 12px; padding-top: 16px; }
        .emp-btn-cancel { flex: 1; padding: 10px 16px; color: #374151; background: #f3f4f6; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 14px; }
        .emp-btn-cancel:hover { background: #e5e7eb; }
        .emp-btn-submit { flex: 1; padding: 10px 16px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 14px; }
        .emp-btn-submit:hover { background: #1d4ed8; }
      `}</style>

      <div>
        <div className="emp-header">
          <div>
            <h2 className="emp-title">Team Management</h2>
            <p className="emp-subtitle">Manage employees and access roles.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => activeTab === 'employees' ? openEmpModal() : setIsRoleModalOpen(true)}
              className="emp-btn-add"
            >
              <Plus style={{ width: 16, height: 16 }} />
              Add {activeTab === 'employees' ? 'Employee' : 'Role'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="emp-tabs">
          <button onClick={() => setActiveTab('employees')} className={`emp-tab ${activeTab === 'employees' ? 'emp-tab-active' : ''}`}>
            Employees
          </button>
          <button onClick={() => setActiveTab('roles')} className={`emp-tab ${activeTab === 'roles' ? 'emp-tab-active' : ''}`}>
            Roles & Permissions
          </button>
        </div>

        {activeTab === 'employees' ? (
          <div className="emp-table-card">
            <table className="emp-table">
              <thead className="emp-thead">
                <tr>
                  <th className="emp-th">Name</th>
                  <th className="emp-th">Role</th>
                  <th className="emp-th">Contact</th>
                  <th className="emp-th">Status</th>
                  <th className="emp-th emp-th-right">Actions</th>
                </tr>
              </thead>
              <tbody className="emp-tbody">
                {employees.length > 0 ? employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="emp-td">
                      <div className="emp-name-row">
                        <div className="emp-avatar">{emp.name.charAt(0)}</div>
                        <div className="emp-name">{emp.name}</div>
                      </div>
                    </td>
                    <td className="emp-td">
                      <span className="emp-badge emp-badge-gray">{emp.role?.name || 'Unknown Role'}</span>
                    </td>
                    <td className="emp-td emp-contact">
                      <div>{emp.email || '-'}</div>
                      <div className="emp-contact-sub">{emp.phone || '-'}</div>
                    </td>
                    <td className="emp-td">
                      <span className={`emp-badge ${emp.isActive ? 'emp-badge-green' : 'emp-badge-red'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="emp-td emp-td-right">
                      <button onClick={() => openEmpModal(emp)} className="emp-btn-icon emp-btn-icon-edit">
                        <Edit2 style={{ width: 16, height: 16 }} />
                      </button>
                      <button onClick={() => handleEmpDelete(emp.id)} className="emp-btn-icon emp-btn-icon-delete">
                        <Trash2 style={{ width: 16, height: 16 }} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="emp-empty">No employees found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="emp-roles-grid">
            {employeeRoles.map(role => (
              <div key={role.id} className="emp-role-card">
                <div className="emp-role-header">
                  <div className="emp-role-icon">
                    <Shield style={{ width: 20, height: 20 }} />
                  </div>
                  <button onClick={() => handleRoleDelete(role.id)} className="emp-role-delete">
                    <Trash2 style={{ width: 16, height: 16 }} />
                  </button>
                </div>
                <h3 className="emp-role-name">{role.name}</h3>
                <div className="emp-role-count">
                  {employees.filter(e => e.roleId === role.id).length} Active Users
                </div>
                <div className="emp-role-perms">
                  <div className="emp-role-perms-title">Accessed Modules:</div>
                  <div className="emp-role-badges">
                    {role.permissions?.modules?.includes('all') ? (
                      <span className="emp-role-badge-green">All Modules</span>
                    ) : (
                      role.permissions?.modules?.length > 0 ? (
                        role.permissions.modules.map((m: string) => (
                          <span key={m} className="emp-role-badge-gray">
                            {AVAILABLE_MODULES.find(mod => mod.id === m)?.label || m}
                          </span>
                        ))
                      ) : (
                        <span className="emp-role-no-access">No access</span>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
            {employeeRoles.length === 0 && (
              <div className="emp-roles-empty">
                No roles created yet.
              </div>
            )}
          </div>
        )}

        {/* Employee Modal */}
        {isEmpModalOpen && (
          <div className="emp-modal-backdrop">
            <div className="emp-modal">
              <div className="emp-modal-header">
                <h3 className="emp-modal-title">{editingEmp ? 'Edit Employee' : 'Add Employee'}</h3>
                <button onClick={() => setIsEmpModalOpen(false)} className="emp-modal-close">✕</button>
              </div>
              <form onSubmit={handleEmpSubmit} className="emp-modal-body">
                <div className="emp-form-group">
                  <label className="emp-label">Name</label>
                  <input required type="text" value={empFormData.name} onChange={e => setEmpFormData({ ...empFormData, name: e.target.value })} className="emp-input" />
                </div>
                <div className="emp-form-group">
                  <label className="emp-label">Role</label>
                  <select required value={empFormData.roleId} onChange={e => setEmpFormData({ ...empFormData, roleId: e.target.value })} className="emp-select">
                    <option value="">Select Role</option>
                    {employeeRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="emp-form-group">
                  <label className="emp-label">Email (Optional)</label>
                  <input type="email" value={empFormData.email} onChange={e => setEmpFormData({ ...empFormData, email: e.target.value })} className="emp-input" />
                </div>
                <div className="emp-form-group">
                  <label className="emp-label">Phone (Optional)</label>
                  <input type="tel" value={empFormData.phone} onChange={e => setEmpFormData({ ...empFormData, phone: e.target.value })} className="emp-input" />
                </div>
                {!editingEmp && (
                  <div className="emp-form-group">
                    <label className="emp-label">Password</label>
                    <input type="password" value={empFormData.password} onChange={e => setEmpFormData({ ...empFormData, password: e.target.value })} className="emp-input" placeholder="Default: 123456" />
                  </div>
                )}
                <div className="emp-modal-actions">
                  <button type="button" onClick={() => setIsEmpModalOpen(false)} className="emp-btn-cancel">Cancel</button>
                  <button type="submit" className="emp-btn-submit">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Role Modal */}
        {isRoleModalOpen && (
          <div className="emp-modal-backdrop">
            <div className="emp-modal emp-modal-sm">
              <div className="emp-modal-header">
                <h3 className="emp-modal-title">Add Role</h3>
                <button onClick={() => setIsRoleModalOpen(false)} className="emp-modal-close">✕</button>
              </div>
              <form onSubmit={handleRoleSubmit} className="emp-modal-body">
                <div className="emp-form-group">
                  <label className="emp-label">Role Name</label>
                  <input required type="text" value={roleName} onChange={e => setRoleName(e.target.value)} className="emp-input" />
                </div>
                <div className="emp-form-group">
                  <div className="emp-perms-header">
                    <label className="emp-label">Permissions</label>
                    <button type="button" onClick={toggleAllModules} className="emp-btn-toggle">
                      {permissions.modules.includes('all') ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="emp-perms-list">
                    {AVAILABLE_MODULES.map(mod => (
                      <label key={mod.id} className="emp-perm-item">
                        <input
                          type="checkbox"
                          checked={permissions.modules.includes('all') || permissions.modules.includes(mod.id)}
                          onChange={() => toggleModule(mod.id)}
                          disabled={permissions.modules.includes('all')}
                          className="emp-perm-checkbox"
                        />
                        <span className="emp-perm-label">{mod.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="emp-modal-actions">
                  <button type="button" onClick={() => setIsRoleModalOpen(false)} className="emp-btn-cancel">Cancel</button>
                  <button type="submit" className="emp-btn-submit">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
