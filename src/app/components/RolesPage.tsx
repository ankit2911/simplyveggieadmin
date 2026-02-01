import React, { useState } from 'react';
import { useAdmin, type EmployeeRole } from '../context/AdminContext';
import { Plus, Edit2, Users } from 'lucide-react';
import { toast } from 'sonner';

export function RolesPage() {
  const { employeeRoles, employees, addEmployeeRole } = useAdmin();
  const [showForm, setShowForm] = useState(false);
  const [roleData, setRoleData] = useState({
    name: '',
    modules: [] as string[],
    appAccess: true,
  });

  const modules = ['customers', 'orders', 'inventory', 'pricing', 'wallets', 'routes', 'all'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addEmployeeRole({
      name: roleData.name,
      permissions: {
        appAccess: roleData.appAccess,
        modules: roleData.modules,
      },
    });
    toast.success('Role added successfully');
    resetForm();
  };

  const resetForm = () => {
    setRoleData({ name: '', modules: [], appAccess: true });
    setShowForm(false);
  };

  const toggleModule = (module: string) => {
    setRoleData(prev => ({
      ...prev,
      modules: prev.modules.includes(module)
        ? prev.modules.filter(m => m !== module)
        : [...prev.modules, module],
    }));
  };

  const getEmployeeCount = (roleId: string) => {
    return employees.filter(emp => emp.roleIds.includes(roleId) && emp.isActive).length;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl">Employee Roles</h2>
          <p className="text-gray-600 mt-1">Manage employee roles and permissions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Add Role
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl mb-4">Add Employee Role</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Role Name *</label>
                <input
                  type="text"
                  value={roleData.name}
                  onChange={(e) => setRoleData({ ...roleData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Warehouse Manager"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roleData.appAccess}
                    onChange={(e) => setRoleData({ ...roleData, appAccess: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">App Access</span>
                </label>
              </div>
              <div>
                <label className="block text-sm mb-2">Module Access *</label>
                <div className="space-y-2 border rounded-lg p-3 max-h-64 overflow-y-auto">
                  {modules.map(module => (
                    <label key={module} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleData.modules.includes(module)}
                        onChange={() => toggleModule(module)}
                        className="rounded"
                      />
                      <span className="text-sm capitalize">{module}</span>
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
                  Add Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Role Name</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">App Access</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Module Permissions</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase"># Active Users</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {employeeRoles.map(role => {
              const userCount = getEmployeeCount(role.id);
              
              return (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{role.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      role.permissions.appAccess 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {role.permissions.appAccess ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.modules.map(module => (
                        <span key={module} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {module}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{userCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-700">
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
