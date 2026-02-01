import React, { useState } from 'react';
import { useAdmin, type PriceTier } from '../context/AdminContext';
import { Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export function PricingPage() {
  const { priceTiers, inventory, addPriceTier, updatePriceTier } = useAdmin();
  const [showForm, setShowForm] = useState(false);
  const [editingTier, setEditingTier] = useState<PriceTier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tier = {
      ...formData,
      items: [],
    };

    if (editingTier) {
      updatePriceTier(editingTier.id, tier);
      toast.success('Tier updated successfully');
    } else {
      addPriceTier(tier);
      toast.success('Tier added successfully');
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setShowForm(false);
    setEditingTier(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl">Price Tier Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Add Tier
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl mb-4">{editingTier ? 'Edit' : 'Add'} Tier</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Tier Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
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
                  {editingTier ? 'Update' : 'Add'} Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {priceTiers.map((tier) => (
          <div key={tier.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg">{tier.name}</h3>
                <p className="text-sm text-gray-600">{tier.description}</p>
              </div>
              <button
                onClick={() => {
                  setEditingTier(tier);
                  setFormData({ name: tier.name, description: tier.description });
                  setShowForm(true);
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm">Items in this tier: {tier.items.length}</p>
              {tier.items.slice(0, 3).map((item) => (
                <div key={item.itemId} className="flex justify-between text-sm border-t pt-2">
                  <span>{item.itemName} ({item.packSize})</span>
                  <span className="text-green-600">${item.price.toFixed(2)}</span>
                </div>
              ))}
              {tier.items.length > 3 && (
                <p className="text-xs text-gray-500">+ {tier.items.length - 3} more items</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
