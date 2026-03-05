'use client';

import React, { useState } from 'react';
import { useAdmin, type Product } from '../context/AdminContext';
import { Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';

export function ItemsPage() {
  const {
    products, categories, subcategories, units,
    addProduct, updateProduct
  } = useAdmin();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);

  // Variant helper type
  interface VariantFormData {
    id?: string;
    name: string;
    price: string;
    conversionFactor: string;
  }

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    subcategoryId: '',
    unitId: '',
    basePrice: '',
    variants: [] as VariantFormData[]
  });

  // Helpers
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';
  const getSubName = (id: string) => subcategories.find(s => s.id === id)?.name || '-';

  const resetForm = () => {
    setFormData({ name: '', categoryId: '', subcategoryId: '', unitId: '', basePrice: '', variants: [] });
    setShowForm(false);
    setEditingItem(null);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId || '',
      unitId: item.unitId,
      basePrice: String(item.basePrice),
      variants: item.variants?.map(v => ({
        id: v.id,
        name: v.name,
        price: v.price !== null ? String(v.price) : '',
        conversionFactor: String(v.conversionFactor)
      })) || []
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId || null,
      unitId: formData.unitId || '',
      sku: '',
      description: '',
      basePrice: Number(formData.basePrice),
      variants: formData.variants.map(v => ({
        id: v.id,
        name: v.name,
        price: v.price === '' ? null : Number(v.price),
        conversionFactor: Number(v.conversionFactor)
      }))
    };

    if (editingItem) {
      await updateProduct(editingItem.id, productData);
      toast.success('Product updated');
    } else {
      await addProduct(productData as any);
    }
    resetForm();
  };

  const filteredProducts = products.filter(item => {
    if (filterCategory && item.categoryId !== filterCategory) return false;
    if (filterSubcategory && item.subcategoryId !== filterSubcategory) return false;
    return true;
  });

  return (
    <>
      <style>{`
        .items-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .items-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }
        .items-subtitle {
          color: #6b7280;
          margin-top: 4px;
          font-size: 14px;
        }
        .items-btn-add {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #16a34a;
          color: white;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .items-btn-add:hover {
          background: #15803d;
        }
        .items-filters {
          margin-bottom: 32px;
        }
        .items-filters-section {
          margin-bottom: 16px;
        }
        .items-filters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .items-filters-label {
          font-size: 11px;
          font-weight: 600;
          color: #111827;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .items-btn-reset {
          font-size: 12px;
          color: #dc2626;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
        }
        .items-btn-reset:hover {
          color: #b91c1c;
        }
        .items-filter-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .items-pill {
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s;
        }
        .items-pill:hover {
          background: #f9fafb;
        }
        .items-pill-active {
          background: #111827;
          color: white;
          border-color: #111827;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transform: scale(1.05);
        }
        .items-pill-cat-active {
          background: #15803d;
          color: white;
          border-color: #15803d;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transform: scale(1.05);
        }
        .items-subpill {
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid #f3f4f6;
          background: #f9fafb;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s;
        }
        .items-subpill:hover {
          background: #f3f4f6;
        }
        .items-subpill-active {
          background: #dcfce7;
          color: #166534;
          border-color: #bbf7d0;
        }
        .items-subpill-all-active {
          background: #1f2937;
          color: white;
        }
        .items-table-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          border: 1px solid #f3f4f6;
          overflow: hidden;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
        }
        .items-thead {
          background: #f9fafb;
          border-bottom: 1px solid #f3f4f6;
        }
        .items-th {
          padding: 14px 24px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
        }
        .items-th-right {
          text-align: right;
        }
        .items-tbody tr {
          border-bottom: 1px solid #f9fafb;
          transition: background 0.15s;
        }
        .items-tbody tr:hover {
          background: #f9fafb;
        }
        .items-td {
          padding: 14px 24px;
        }
        .items-td-name {
          font-weight: 500;
          color: #111827;
        }
        .items-td-cat {
          color: #6b7280;
          font-size: 13px;
        }
        .items-td-price {
          text-align: right;
          color: #111827;
          font-family: ui-monospace, monospace;
          font-size: 13px;
        }
        .items-td-right {
          text-align: right;
        }
        .items-variant-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .items-variant-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          border: 1px solid;
        }
        .items-variant-computed {
          background: #f9fafb;
          color: #6b7280;
          border-color: #e5e7eb;
        }
        .items-variant-override {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }
        .items-std-only {
          font-style: italic;
          color: #9ca3af;
          font-size: 13px;
        }
        .items-btn-edit {
          padding: 8px;
          color: #2563eb;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .items-btn-edit:hover {
          background: #eff6ff;
        }
        .items-empty {
          padding: 48px 24px;
          text-align: center;
          color: #9ca3af;
          font-size: 14px;
        }
        .items-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 16px;
        }
        .items-modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 672px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }
        .items-modal-header {
          padding: 16px 24px;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9fafb;
        }
        .items-modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
        .items-modal-close {
          color: #9ca3af;
          cursor: pointer;
          background: none;
          border: none;
          font-size: 18px;
        }
        .items-modal-close:hover {
          color: #6b7280;
        }
        .items-form {
          overflow-y: auto;
          padding: 24px;
        }
        .items-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .items-form-full {
          grid-column: span 2;
        }
        .items-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
        }
        .items-input, .items-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          background: white;
        }
        .items-input:focus, .items-select:focus {
          box-shadow: 0 0 0 2px rgba(59,130,246,0.3);
          border-color: #3b82f6;
        }
        .items-variant-section {
          background: #f9fafb;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #f3f4f6;
          margin-bottom: 24px;
        }
        .items-variant-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .items-variant-title {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }
        .items-btn-add-pack {
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: #2563eb;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
        }
        .items-btn-add-pack:hover {
          color: #1d4ed8;
        }
        .items-variant-empty {
          font-size: 12px;
          text-align: center;
          color: #9ca3af;
          padding: 8px 0;
        }
        .items-variant-rows {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .items-variant-row {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }
        .items-variant-input {
          width: 100%;
          padding: 6px 8px;
          font-size: 13px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          outline: none;
        }
        .items-variant-input:focus {
          box-shadow: 0 0 0 1px #3b82f6;
          border-color: #3b82f6;
        }
        .items-variant-multiplier {
          width: 96px;
          flex-shrink: 0;
        }
        .items-variant-price-col {
          width: 128px;
          flex-shrink: 0;
        }
        .items-variant-price-hint {
          font-size: 10px;
          color: #9ca3af;
          margin-top: 2px;
          text-align: right;
        }
        .items-btn-remove-variant {
          padding: 6px;
          color: #f87171;
          background: transparent;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .items-btn-remove-variant:hover {
          color: #dc2626;
          background: #fef2f2;
        }
        .items-form-footer {
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          position: sticky;
          bottom: 0;
          background: white;
          padding-bottom: 8px;
        }
        .items-btn-cancel {
          padding: 10px 20px;
          color: #6b7280;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
        }
        .items-btn-cancel:hover {
          background: #f9fafb;
        }
        .items-btn-save {
          padding: 10px 20px;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          font-size: 14px;
        }
        .items-btn-save:hover {
          background: #15803d;
        }
      `}</style>

      <div>
        <div className="items-header">
          <div>
            <h2 className="items-title">Items Management</h2>
            <p className="items-subtitle">Define items, categories, and pack configurations.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="items-btn-add"
          >
            <Plus style={{ width: 16, height: 16 }} />
            Add Item
          </button>
        </div>

        {/* Filters */}
        <div className="items-filters">
          {/* Categories */}
          <div className="items-filters-section">
            <div className="items-filters-header">
              <h3 className="items-filters-label">Categories</h3>
              {filterCategory && (
                <button
                  onClick={() => { setFilterCategory(''); setFilterSubcategory(''); }}
                  className="items-btn-reset"
                >
                  Reset Filters
                </button>
              )}
            </div>
            <div className="items-filter-pills">
              <button
                onClick={() => { setFilterCategory(''); setFilterSubcategory(''); }}
                className={`items-pill ${!filterCategory ? 'items-pill-active' : ''}`}
              >
                All
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setFilterCategory(c.id); setFilterSubcategory(''); }}
                  className={`items-pill ${filterCategory === c.id ? 'items-pill-cat-active' : ''}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategories */}
          {(filterCategory || subcategories.length > 0) && (
            <div className="items-filters-section">
              <div className="items-filter-pills">
                {filterCategory && (
                  <button
                    onClick={() => setFilterSubcategory('')}
                    className={`items-subpill ${!filterSubcategory ? 'items-subpill-all-active' : ''}`}
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
                        if (!filterCategory) setFilterCategory(s.categoryId);
                        setFilterSubcategory(s.id);
                      }}
                      className={`items-subpill ${filterSubcategory === s.id ? 'items-subpill-active' : ''}`}
                    >
                      {s.name}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Item Table */}
        <div className="items-table-card">
          <table className="items-table">
            <thead className="items-thead">
              <tr>
                <th className="items-th">Item Name</th>
                <th className="items-th">Category</th>
                <th className="items-th">Subcategory</th>
                <th className="items-th items-th-right">Base Price</th>
                <th className="items-th">Variant Config</th>
                <th className="items-th items-th-right">Actions</th>
              </tr>
            </thead>
            <tbody className="items-tbody">
              {filteredProducts.map((item) => (
                <tr key={item.id}>
                  <td className="items-td items-td-name">{item.name}</td>
                  <td className="items-td items-td-cat">{getCatName(item.categoryId)}</td>
                  <td className="items-td items-td-cat">{getSubName(item.subcategoryId || '')}</td>
                  <td className="items-td items-td-price">₹{item.basePrice.toFixed(2)}</td>
                  <td className="items-td">
                    {item.variants && item.variants.length > 0 ? (
                      <div className="items-variant-badges">
                        {item.variants.map(v => {
                          const isComputed = v.price === null;
                          const finalPrice = isComputed ? (item.basePrice * v.conversionFactor) : v.price!;
                          return (
                            <span key={v.id} title={isComputed ? "Computed from Base Price" : "Manual Override"} className={`items-variant-badge ${isComputed ? 'items-variant-computed' : 'items-variant-override'}`}>
                              {v.name} (₹{finalPrice.toFixed(2)})
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="items-std-only">Standard Only</span>
                    )}
                  </td>
                  <td className="items-td items-td-right">
                    <button
                      onClick={() => handleEdit(item)}
                      className="items-btn-edit"
                    >
                      <Edit2 style={{ width: 16, height: 16 }} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="items-empty">
                    No items found. Add one or adjust filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="items-modal-backdrop">
            <div className="items-modal">
              <div className="items-modal-header">
                <h3 className="items-modal-title">{editingItem ? 'Edit Item' : 'New Item'}</h3>
                <button onClick={resetForm} className="items-modal-close">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="items-form">
                {/* Category Info */}
                <div className="items-form-grid">
                  <div className="items-form-full">
                    <label className="items-label">Item Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="items-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="items-label">Category</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, subcategoryId: '' })}
                      className="items-select"
                      required
                    >
                      <option value="">Select...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="items-label">Subcategory</label>
                    <select
                      value={formData.subcategoryId}
                      onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                      className="items-select"
                      disabled={!formData.categoryId}
                    >
                      <option value="">Select...</option>
                      {subcategories.filter(s => s.categoryId === formData.categoryId).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="items-label">Unit</label>
                    <select
                      value={formData.unitId}
                      onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                      className="items-select"
                      required
                    >
                      <option value="">Select Unit...</option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="items-label">Base Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      className="items-input"
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Pack Size Builder Area */}
                <div className="items-variant-section">
                  <div className="items-variant-header">
                    <h4 className="items-variant-title">Pack Configurations (Variants)</h4>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        variants: [...formData.variants, { name: '', price: '', conversionFactor: '' }]
                      })}
                      className="items-btn-add-pack"
                    >
                      <Plus style={{ width: 12, height: 12 }} /> Add Pack
                    </button>
                  </div>

                  {formData.variants.length === 0 ? (
                    <p className="items-variant-empty">No packs defined. Item sold in base unit only.</p>
                  ) : (
                    <div className="items-variant-rows">
                      {formData.variants.map((variant, idx) => (
                        <div key={idx} className="items-variant-row">
                          <div style={{ flex: 1 }}>
                            <input
                              placeholder="Name (e.g. 5kg Pack)"
                              className="items-variant-input"
                              value={variant.name}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[idx].name = e.target.value;
                                setFormData({ ...formData, variants: newVariants });
                              }}
                              required
                            />
                          </div>
                          <div className="items-variant-multiplier">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Multiplier"
                              title="Conversion Factor (e.g. 5 for 5kg)"
                              className="items-variant-input"
                              value={variant.conversionFactor}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[idx].conversionFactor = e.target.value;
                                setFormData({ ...formData, variants: newVariants });
                              }}
                              required
                            />
                          </div>
                          <div className="items-variant-price-col">
                            <input
                              type="number"
                              step="0.01"
                              placeholder={variant.conversionFactor ? `₹${(Number(formData.basePrice) * Number(variant.conversionFactor)).toFixed(2)}` : "Price (₹)"}
                              className="items-variant-input"
                              value={variant.price}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[idx].price = e.target.value;
                                setFormData({ ...formData, variants: newVariants });
                              }}
                            />
                            <p className="items-variant-price-hint">
                              {variant.price === '' ? '(Computed)' : '(Override)'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newVariants = formData.variants.filter((_, i) => i !== idx);
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="items-btn-remove-variant"
                          >
                            <Trash2 style={{ width: 16, height: 16 }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="items-form-footer">
                  <button type="button" onClick={resetForm} className="items-btn-cancel">Cancel</button>
                  <button type="submit" className="items-btn-save">Save Item</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
