'use client';

import React, { useState } from 'react';
import { useAdmin, type InventoryItem } from '../context/AdminContext';
import { Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';

export function ItemsPage() {
  const {
    inventory, categories, subcategories, units,
    addInventoryItem, updateInventoryItem
  } = useAdmin();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    subcategoryId: '',
    unitId: '',
  });

  // Helpers
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';
  const getSubName = (id: string) => subcategories.find(s => s.id === id)?.name || '-';

  const resetForm = () => {
    setFormData({ name: '', categoryId: '', subcategoryId: '', unitId: '' });
    setShowForm(false);
    setEditingItem(null);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId || '',
      unitId: item.unit?.id || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Note: Legacy packSizes and basePrice logic removed.
    // In future, ProductVariants should be managed here.

    const itemData = {
      name: formData.name,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId,
      unitId: formData.unitId || '', // Need to add unit selection to form!
      // Default/Placeholder for now as we don't have variant UI yet
    };

    if (editingItem) {
      updateInventoryItem(editingItem.id, itemData);
      toast.success('Item updated');
    } else {
      await addInventoryItem(itemData as any);
      // Toast handled by context
    }
    resetForm();
  };

  const filteredInventory = inventory.filter(item => {
    if (filterCategory && item.categoryId !== filterCategory) return false;
    if (filterSubcategory && item.subcategoryId !== filterSubcategory) return false;
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Items Management</h2>
          <p className="text-gray-600 mt-1">Define items, categories, and pack configurations.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-6">
        {/* Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Categories</h3>
            {filterCategory && (
              <button
                onClick={() => { setFilterCategory(''); setFilterSubcategory(''); }}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setFilterCategory(''); setFilterSubcategory(''); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!filterCategory
                ? 'bg-gray-900 text-white shadow-md transform scale-105'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => { setFilterCategory(c.id); setFilterSubcategory(''); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filterCategory === c.id
                  ? 'bg-green-700 text-white shadow-md transform scale-105'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Subcategories - Only show if category selected and has subs, or show relevant ones? 
            Let's show all available subcategories if no category selected (might be too many), 
            OR only show when category is selected. The standard pattern is usually drill-down. 
            However, user screenshot shows "Premium Fruits", "Regular Fruits" etc. implying subcats.
            Let's show subcategories row only if there are subcategories to show.
        */}
        {(filterCategory || subcategories.length > 0) && (
          <div className="space-y-3 animate-fadeIn">
            {/* Only label if we want to distinguish, user screenshot didn't have explicit label but grouped logical */}

            <div className="flex flex-wrap gap-2">
              {/* "All" button for subcategory only makes sense if a category is selected and we want to reset sub without resetting category */}
              {filterCategory && (
                <button
                  onClick={() => setFilterSubcategory('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!filterSubcategory
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  All {categories.find(c => c.id === filterCategory)?.name}
                </button>
              )}

              {subcategories
                .filter(s => !filterCategory || s.categoryId === filterCategory)
                .map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (!filterCategory) setFilterCategory(s.categoryId); // Auto-select category if clicking global sub
                      setFilterSubcategory(s.id);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterSubcategory === s.id
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'
                      }`}
                  >
                    {s.name}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Item Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Item Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Subcategory</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Variant Config</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredInventory.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-gray-600 text-sm">{getCatName(item.categoryId)}</td>
                <td className="px-6 py-4 text-gray-600 text-sm">{getSubName(item.subcategoryId || '')}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {/* Pack variants removed from display */}
                  <span className="italic">Standard</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredInventory.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  No items found. Add one or adjust filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">{editingItem ? 'Edit Item' : 'New Item'}</h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
              {/* Category Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, subcategoryId: '' })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                    required
                  >
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                  <select
                    value={formData.subcategoryId}
                    onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                    disabled={!formData.categoryId}
                  >
                    <option value="">Select...</option>
                    {subcategories.filter(s => s.categoryId === formData.categoryId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                    required
                  >
                    <option value="">Select Unit...</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pack Size Builder Area */}
              {/* Pack Size Builder Removed - Inventory is now Base Unit only */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
                <p>Inventory is managed in base units.</p>
                <p className="text-xs mt-1 text-gray-400">Pack configurations are no longer needed.</p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
                <button type="button" onClick={resetForm} className="px-5 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
