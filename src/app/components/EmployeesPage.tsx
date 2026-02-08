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

  // --- Employee Handlers ---

  const openEmpModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmp(emp);
      setEmpFormData({
        name: emp.name,
        email: emp.email || '',
        phone: emp.phone || '',
        roleId: emp.roleId,
        password: ''
      });
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

  // --- Role Handlers ---

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addEmployeeRole({ name: roleName, permissions });
    setRoleName('');
    setPermissions({ appAccess: true, modules: [] });
    setIsRoleModalOpen(false);
  };

  const handleRoleDelete = async (id: string) => {
    // Check usage first
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Team Management</h2>
          <p className="text-gray-600 mt-1">Manage employees and access roles.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => activeTab === 'employees' ? openEmpModal() : setIsRoleModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add {activeTab === 'employees' ? 'Employee' : 'Role'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'employees' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Employees
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'roles' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Roles & Permissions
        </button>
      </div>

      {activeTab === 'employees' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.length > 0 ? employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="font-medium text-gray-900">{emp.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {emp.role?.name || 'Unknown Role'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{emp.email || '-'}</div>
                    <div className="text-gray-400">{emp.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => openEmpModal(emp)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEmpDelete(emp.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No employees found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employeeRoles.map(role => (
            <div key={role.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group hover:border-blue-200 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Shield className="w-5 h-5" />
                </div>
                <button onClick={() => handleRoleDelete(role.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{role.name}</h3>
              <div className="text-sm text-gray-500 mb-4">
                {employees.filter(e => e.roleId === role.id).length} Active Users
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded space-y-2">
                <div className="font-medium text-gray-700">Accessed Modules:</div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions?.modules?.includes('all') ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded">All Modules</span>
                  ) : (
                    role.permissions?.modules?.length > 0 ? (
                      role.permissions.modules.map((m: string) => (
                        <span key={m} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded capitalize">
                          {AVAILABLE_MODULES.find(mod => mod.id === m)?.label || m}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic">No access</span>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
          {employeeRoles.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              No roles created yet.
            </div>
          )}
        </div>
      )}

      {/* Employee Modal */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">{editingEmp ? 'Edit Employee' : 'Add Employee'}</h3>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleEmpSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required type="text" value={empFormData.name} onChange={e => setEmpFormData({ ...empFormData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select required value={empFormData.roleId} onChange={e => setEmpFormData({ ...empFormData, roleId: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white outline-none">
                  <option value="">Select Role</option>
                  {employeeRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                <input type="email" value={empFormData.email} onChange={e => setEmpFormData({ ...empFormData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                <input type="tel" value={empFormData.phone} onChange={e => setEmpFormData({ ...empFormData, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              {!editingEmp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" value={empFormData.password} onChange={e => setEmpFormData({ ...empFormData, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Default: 123456" />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEmpModalOpen(false)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Add Role</h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleRoleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input required type="text" value={roleName} onChange={e => setRoleName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Permissions</label>
                  <button type="button" onClick={toggleAllModules} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    {permissions.modules.includes('all') ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {AVAILABLE_MODULES.map(mod => (
                    <label key={mod.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-100 rounded">
                      <input
                        type="checkbox"
                        checked={permissions.modules.includes('all') || permissions.modules.includes(mod.id)}
                        onChange={() => toggleModule(mod.id)}
                        disabled={permissions.modules.includes('all')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsRoleModalOpen(false)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
