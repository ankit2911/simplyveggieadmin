import React, { useState } from 'react';
import { useAdmin, type InventoryItem, type Category, type Subcategory, type Unit } from '../context/AdminContext';
import { Plus, Edit2, Trash2, Folder, FolderPlus, Tag, Settings, Save, X, Filter } from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'inventory' | 'categories' | 'units';

export function InventoryPage() {
  const {
    inventory, categories, subcategories, units,
    addInventoryItem, updateInventoryItem,
    addCategory, updateCategory, deleteCategory,
    addSubcategory, updateSubcategory, deleteSubcategory,
    addUnit, updateUnit, deleteUnit
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<Tab>('inventory');

  // --- Inventory Form State ---
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemFormData, setItemFormData] = useState({
    name: '',
    categoryId: '',
    subcategoryId: '',
    packSizes: [] as string[],
  });
  // Helper for Pack Size Builder
  const [packSizeValue, setPackSizeValue] = useState('');
  const [packSizeUnitId, setPackSizeUnitId] = useState('');

  // Pricing/Qty State (Keyed by packSize string)
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});

  // --- Filter State ---
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');

  // --- Master Data State ---
  const [categoryName, setCategoryName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [selectedCatIdForSub, setSelectedCatIdForSub] = useState('');

  const [unitName, setUnitName] = useState('');
  const [unitSymbol, setUnitSymbol] = useState('');


  // ==================== INVENTORY ACTIONS ====================

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemFormData.packSizes.length === 0) {
      toast.error('Please add at least one pack size');
      return;
    }

    const itemData = {
      ...itemFormData,
      quantityInStock: quantities,
      basePrice: prices,
    };

    if (editingItem) {
      updateInventoryItem(editingItem.id, itemData);
      toast.success('Item updated');
    } else {
      addInventoryItem(itemData);
      toast.success('Item added');
    }
    resetItemForm();
  };

  const resetItemForm = () => {
    setItemFormData({ name: '', categoryId: '', subcategoryId: '', packSizes: [] as string[] });
    setQuantities({});
    setPrices({});
    setShowItemForm(false);
    setEditingItem(null);
    setPackSizeValue('');
    setPackSizeUnitId('');
  };

  const initEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId,
      packSizes: item.packSizes,
    });
    setQuantities(item.quantityInStock);
    setPrices(item.basePrice);
    setShowItemForm(true);
  };

  const addPackSize = () => {
    if (!packSizeValue || !packSizeUnitId) {
      toast.error('Enter value and select unit');
      return;
    }
    const unit = units.find(u => u.id === packSizeUnitId);
    if (!unit) return;

    const newSize = `${packSizeValue}${unit.symbol}`;
    if (itemFormData.packSizes.includes(newSize)) {
      toast.error('Pack size already exists');
      return;
    }

    setItemFormData({ ...itemFormData, packSizes: [...itemFormData.packSizes, newSize] });
    setQuantities({ ...quantities, [newSize]: 0 });
    setPrices({ ...prices, [newSize]: 0 });
    setPackSizeValue('');
    // Keep unit selected for convenience
  };

  const removePackSize = (size: string) => {
    setItemFormData({ ...itemFormData, packSizes: itemFormData.packSizes.filter(s => s !== size) });
    const newQty = { ...quantities }; delete newQty[size];
    const newPrices = { ...prices }; delete newPrices[size];
    setQuantities(newQty);
    setPrices(newPrices);
  };

  // ==================== MASTER DATA ACTIONS ====================

  const handleAddCategory = () => {
    if (!categoryName) return;
    addCategory({ name: categoryName });
    setCategoryName('');
    toast.success('Category added');
  };

  const handleAddSubcategory = () => {
    if (!subcategoryName || !selectedCatIdForSub) {
      toast.error('Select Category and Enter Name');
      return;
    }
    addSubcategory({ name: subcategoryName, categoryId: selectedCatIdForSub });
    setSubcategoryName('');
    toast.success('Subcategory added');
  };

  const handleAddUnit = () => {
    if (!unitName || !unitSymbol) return;
    addUnit({ name: unitName, symbol: unitSymbol });
    setUnitName('');
    setUnitSymbol('');
    toast.success('Unit added');
  };

  // ==================== RENDER HELPERS ====================

  const filteredItems = inventory.filter(item => {
    if (filterCategory && item.categoryId !== filterCategory) return false;
    if (filterSubcategory && item.subcategoryId !== filterSubcategory) return false;
    return true;
  });

  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';
  const getSubName = (id: string) => subcategories.find(s => s.id === id)?.name || '-';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Inventory Management</h2>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>Inventory Items</button>
          <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'categories' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>Categories</button>
          <button onClick={() => setActiveTab('units')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'units' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>Units</button>
        </div>
      </div>

      {/* ==================== INVENTORY TAB ==================== */}
      {activeTab === 'inventory' && (
        <>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Filter Category</label>
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setFilterSubcategory(''); }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Filter Subcategory</label>
              <select
                value={filterSubcategory}
                onChange={(e) => setFilterSubcategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                disabled={!filterCategory}
              >
                <option value="">All Subcategories</option>
                {subcategories.filter(s => s.categoryId === filterCategory).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowItemForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{getCatName(item.categoryId)}</span>
                      <span>›</span>
                      <span className="text-gray-600">{getSubName(item.subcategoryId)}</span>
                    </div>
                  </div>
                  <button onClick={() => initEditItem(item)} className="text-gray-400 hover:text-blue-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {item.packSizes.map(size => (
                    <div key={size} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="font-semibold text-gray-700">{size}</span>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Qty: {item.quantityInStock[size]}</div>
                        <div className="font-bold text-green-700">₹{item.basePrice[size]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                No items found matching filters.
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== CATEGORIES TAB ==================== */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Categories List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Categories</h3>
            </div>
            <div className="p-4 border-b border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="New Category Name"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <button onClick={handleAddCategory} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Add</button>
              </div>
            </div>
            <ul className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              {categories.map(c => (
                <li key={c.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <span className="font-medium text-gray-700">{c.name}</span>
                  <button onClick={() => deleteCategory(c.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Subcategories List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Subcategories</h3>
            </div>
            <div className="p-4 border-b border-gray-100 space-y-3">
              <select
                value={selectedCatIdForSub}
                onChange={(e) => setSelectedCatIdForSub(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">Select Parent Category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  placeholder="New Subcategory Name"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <button onClick={handleAddSubcategory} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Add</button>
              </div>
            </div>
            <ul className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              {subcategories.filter(s => !selectedCatIdForSub || s.categoryId === selectedCatIdForSub).map(s => (
                <li key={s.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-700">{s.name}</span>
                    <span className="text-xs text-gray-400">{getCatName(s.categoryId)}</span>
                  </div>
                  <button onClick={() => deleteSubcategory(s.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ==================== UNITS TAB ==================== */}
      {activeTab === 'units' && (
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Measurement Units</h3>
          </div>
          <div className="p-4 border-b border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="Name (e.g. Kilogram)"
                className="flex-[2] px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <input
                type="text"
                value={unitSymbol}
                onChange={(e) => setUnitSymbol(e.target.value)}
                placeholder="Symbol (e.g. kg)"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <button onClick={handleAddUnit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Add</button>
            </div>
          </div>
          <ul className="divide-y divide-gray-50">
            {units.map(u => (
              <li key={u.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <span className="font-medium text-gray-900">{u.name}</span>
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">{u.symbol}</span>
                </div>
                <button onClick={() => deleteUnit(u.id)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ==================== ITEM MODAL ==================== */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-800">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={resetItemForm} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleItemSubmit} className="overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    value={itemFormData.name}
                    onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={itemFormData.categoryId}
                    onChange={(e) => setItemFormData({ ...itemFormData, categoryId: e.target.value, subcategoryId: '' })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                  <select
                    value={itemFormData.subcategoryId}
                    onChange={(e) => setItemFormData({ ...itemFormData, subcategoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    disabled={!itemFormData.categoryId}
                    required
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories.filter(s => s.categoryId === itemFormData.categoryId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pack Size Builder */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">Pack Sizes & Pricing</label>

                <div className="flex gap-2 items-end mb-4">
                  <div className="w-24">
                    <label className="block text-xs text-gray-400 mb-1">Value</label>
                    <input
                      type="number"
                      value={packSizeValue}
                      onChange={(e) => setPackSizeValue(e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Unit</label>
                    <select
                      value={packSizeUnitId}
                      onChange={(e) => setPackSizeUnitId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      <option value="">Unit...</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={addPackSize}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Add Size
                  </button>
                </div>

                <div className="space-y-2">
                  {itemFormData.packSizes.map(size => (
                    <div key={size} className="flex gap-3 items-center bg-white p-2 rounded-lg border border-gray-200">
                      <span className="w-24 font-bold text-gray-700 px-2">{size}</span>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="number"
                          placeholder="Stock Qty"
                          value={quantities[size] || 0}
                          onChange={(e) => setQuantities({ ...quantities, [size]: parseFloat(e.target.value) || 0 })}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm min-w-0"
                        />
                        <input
                          type="number"
                          placeholder="Price (₹)"
                          value={prices[size] || 0}
                          onChange={(e) => setPrices({ ...prices, [size]: parseFloat(e.target.value) || 0 })}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm min-w-0"
                        />
                      </div>
                      <button type="button" onClick={() => removePackSize(size)} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {itemFormData.packSizes.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-2">No pack sizes added yet.</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
                <button type="button" onClick={resetItemForm} className="px-5 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
