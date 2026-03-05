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
    return employees.filter(emp => emp.roleId === roleId && emp.isActive).length;
  };

  return (
    <>
      <style>{`
        .role-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .role-title { font-size: 20px; font-weight: 600; color: #1f2937; }
        .role-subtitle { color: #6b7280; margin-top: 4px; font-size: 14px; }
        .role-btn-add { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #16a34a; color: white; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; font-size: 14px; }
        .role-btn-add:hover { background: #15803d; }
        .role-table-card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow: hidden; }
        .role-table { width: 100%; border-collapse: collapse; }
        .role-thead { background: #f9fafb; }
        .role-th { padding: 12px 24px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
        .role-tbody tr { border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
        .role-tbody tr:hover { background: #f9fafb; }
        .role-td { padding: 14px 24px; }
        .role-badge { display: inline-flex; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
        .role-badge-green { background: #dcfce7; color: #166534; }
        .role-badge-red { background: #fee2e2; color: #991b1b; }
        .role-module-badges { display: flex; flex-wrap: wrap; gap: 4px; }
        .role-module-badge { padding: 2px 8px; background: #dbeafe; color: #1e40af; font-size: 12px; border-radius: 4px; }
        .role-count { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .role-btn-edit { color: #2563eb; background: transparent; border: none; cursor: pointer; }
        .role-btn-edit:hover { color: #1d4ed8; }
        .role-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .role-modal { background: white; border-radius: 12px; padding: 24px; max-width: 448px; width: 100%; margin: 16px; }
        .role-modal-title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #1f2937; }
        .role-form-group { margin-bottom: 16px; }
        .role-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; color: #374151; }
        .role-input { width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; }
        .role-input:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.3); border-color: #3b82f6; }
        .role-checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .role-checkbox-text { font-size: 13px; color: #374151; }
        .role-modules-list { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; max-height: 256px; overflow-y: auto; }
        .role-module-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px; }
        .role-module-checkbox:last-child { margin-bottom: 0; }
        .role-module-name { font-size: 13px; text-transform: capitalize; color: #374151; }
        .role-modal-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .role-btn-cancel { padding: 8px 16px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; font-size: 14px; }
        .role-btn-cancel:hover { background: #f9fafb; }
        .role-btn-save { padding: 8px 16px; background: #16a34a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px; }
        .role-btn-save:hover { background: #15803d; }
      `}</style>

      <div>
        <div className="role-header">
          <div>
            <h2 className="role-title">Employee Roles</h2>
            <p className="role-subtitle">Manage employee roles and permissions</p>
          </div>
          <button onClick={() => setShowForm(true)} className="role-btn-add">
            <Plus style={{ width: 16, height: 16 }} /> Add Role
          </button>
        </div>

        {showForm && (
          <div className="role-modal-backdrop">
            <div className="role-modal">
              <h3 className="role-modal-title">Add Employee Role</h3>

              <form onSubmit={handleSubmit}>
                <div className="role-form-group">
                  <label className="role-label">Role Name *</label>
                  <input
                    type="text"
                    value={roleData.name}
                    onChange={(e) => setRoleData({ ...roleData, name: e.target.value })}
                    className="role-input"
                    placeholder="e.g., Warehouse Manager"
                    required
                  />
                </div>
                <div className="role-form-group">
                  <label className="role-checkbox-label">
                    <input
                      type="checkbox"
                      checked={roleData.appAccess}
                      onChange={(e) => setRoleData({ ...roleData, appAccess: e.target.checked })}
                    />
                    <span className="role-checkbox-text">App Access</span>
                  </label>
                </div>
                <div className="role-form-group">
                  <label className="role-label">Module Access *</label>
                  <div className="role-modules-list">
                    {modules.map(module => (
                      <label key={module} className="role-module-checkbox">
                        <input
                          type="checkbox"
                          checked={roleData.modules.includes(module)}
                          onChange={() => toggleModule(module)}
                        />
                        <span className="role-module-name">{module}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="role-modal-actions">
                  <button type="button" onClick={resetForm} className="role-btn-cancel">Cancel</button>
                  <button type="submit" className="role-btn-save">Add Role</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="role-table-card">
          <table className="role-table">
            <thead className="role-thead">
              <tr>
                <th className="role-th">Role Name</th>
                <th className="role-th">App Access</th>
                <th className="role-th">Module Permissions</th>
                <th className="role-th"># Active Users</th>
                <th className="role-th">Actions</th>
              </tr>
            </thead>
            <tbody className="role-tbody">
              {employeeRoles.map(role => {
                const userCount = getEmployeeCount(role.id);

                return (
                  <tr key={role.id}>
                    <td className="role-td">{role.name}</td>
                    <td className="role-td">
                      <span className={`role-badge ${role.permissions.appAccess ? 'role-badge-green' : 'role-badge-red'}`}>
                        {role.permissions.appAccess ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="role-td">
                      <div className="role-module-badges">
                        {role.permissions.modules.map(module => (
                          <span key={module} className="role-module-badge">{module}</span>
                        ))}
                      </div>
                    </td>
                    <td className="role-td">
                      <div className="role-count">
                        <Users style={{ width: 16, height: 16, color: '#9ca3af' }} />
                        <span>{userCount}</span>
                      </div>
                    </td>
                    <td className="role-td">
                      <button className="role-btn-edit">
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
