'use client';

import React, { useState } from 'react';
import { useAdmin, type Employee } from '../context/AdminContext';
import { Plus, Edit2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export function EmployeesPage() {
  const { employees, employeeRoles, addEmployee, updateEmployee } = useAdmin();
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeData, setEmployeeData] = useState({
    name: '',
    phone: '',
    email: '',
    roleIds: [] as string[],
  });

  // Filters and pagination
  const [showActive, setShowActive] = useState<'all' | 'active' | 'inactive'>('active');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesStatus = showActive === 'all' ||
      (showActive === 'active' && emp.isActive) ||
      (showActive === 'inactive' && !emp.isActive);

    const matchesRole = filterRole === 'all' || emp.roleIds.includes(filterRole);

    const matchesSearch = searchTerm === '' ||
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.phone || '').includes(searchTerm) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesRole && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeData.phone) {
      toast.error('Phone number is mandatory');
      return;
    }

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, employeeData);
      toast.success('Employee updated successfully');
    } else {
      addEmployee({ ...employeeData, isActive: true });
      toast.success('Employee added successfully');
    }
    resetForm();
  };

  const resetForm = () => {
    setEmployeeData({ name: '', phone: '', email: '', roleIds: [] });
    setShowForm(false);
    setEditingEmployee(null);
  };

  const toggleRole = (roleId: string) => {
    setEmployeeData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(r => r !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const toggleEmployeeStatus = (employee: Employee) => {
    updateEmployee(employee.id, { isActive: !employee.isActive });
    toast.success(`Employee ${employee.isActive ? 'deactivated' : 'activated'}`);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeData({
      name: employee.name,
      phone: employee.phone || '',
      email: employee.email || '',
      roleIds: employee.roleIds,
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl">Employees</h2>
          <p className="text-gray-600 mt-1">Manage employee accounts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={showActive}
              onChange={(e) => {
                setShowActive(e.target.value as 'all' | 'active' | 'inactive');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="all">All Employees</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Roles</option>
              {employeeRoles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {paginatedEmployees.length} of {filteredEmployees.length} employees
          </div>
        </div>
      </div>

      {/* Employee Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl mb-4">{editingEmployee ? 'Edit' : 'Add'} Employee</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name *</label>
                <input
                  type="text"
                  value={employeeData.name}
                  onChange={(e) => setEmployeeData({ ...employeeData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Phone *</label>
                <input
                  type="tel"
                  value={employeeData.phone}
                  onChange={(e) => setEmployeeData({ ...employeeData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="+91-XXXXX-XXXXX"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={employeeData.email}
                  onChange={(e) => setEmployeeData({ ...employeeData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Roles *</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                  {employeeRoles.map(role => (
                    <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={employeeData.roleIds.includes(role.id)}
                        onChange={() => toggleRole(role.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{role.name}</span>
                    </label>
                  ))}
                </div>
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
                  {editingEmployee ? 'Update' : 'Add'} Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Roles</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedEmployees.map((employee) => {
              const roles = employeeRoles.filter(r => employee.roleIds.includes(r.id));

              return (
                <tr key={employee.id} className={`hover:bg-gray-50 ${!employee.isActive ? 'bg-gray-50 opacity-60' : ''}`}>
                  <td className="px-6 py-4">{employee.name}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{employee.phone}</div>
                    {employee.email && <div className="text-xs text-gray-500">{employee.email}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {roles.map(role => (
                        <span key={role.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleEmployeeStatus(employee)}
                      className={`px-3 py-1 rounded-full text-xs ${employee.isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                    >
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="text-blue-600 hover:text-blue-700"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
