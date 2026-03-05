'use client';

import React, { useState } from 'react';
import { useAdmin, type PriceTier } from '../context/AdminContext';
import { Plus, Download, Upload, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { toast } from 'sonner';

export function PricingPageNew() {
  const { priceTiers, inventory, addPriceTier, categories } = useAdmin();
  const [selectedTiers, setSelectedTiers] = useState<string[]>(['t0', 't1']);
  const [filterCategory, setFilterCategory] = useState('all');

  const baseTier = priceTiers.find(t => t.id === 't0');
  const displayTiers = priceTiers.filter(t => selectedTiers.includes(t.id));

  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || 'Uncategorized';

  const filteredItems = inventory.filter(item =>
    filterCategory === 'all' || item.categoryId === filterCategory
  );

  const getPriceForTier = (tierId: string, itemId: string) => {
    const tier = priceTiers.find(t => t.id === tierId);
    if (!tier) return 0;
    const tierItem = tier.items?.find(i => i.itemId === itemId);
    if (tierItem) return tierItem.price;
    return 0;
  };

  const calculateDifference = (basePrice: number, tierPrice: number) => {
    const diff = tierPrice - basePrice;
    const percent = basePrice > 0 ? ((diff / basePrice) * 100) : 0;
    return { diff, percent };
  };

  const downloadCSV = () => {
    const headers = ['Item', 'Unit', 'Category', ...displayTiers.map(t => t.name)];
    const rows = filteredItems.map(item => [
      item.name,
      item.unit.symbol,
      getCatName(item.categoryId),
      ...displayTiers.map(tier => getPriceForTier(tier.id, item.id)),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pricing_tiers.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const toggleTierSelection = (tierId: string) => {
    if (selectedTiers.includes(tierId)) {
      setSelectedTiers(selectedTiers.filter(id => id !== tierId));
    } else {
      setSelectedTiers([...selectedTiers, tierId]);
    }
  };

  return (
    <>
      <style>{`
        .price-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .price-title { font-size: 20px; font-weight: 600; color: #1f2937; }
        .price-subtitle { color: #6b7280; margin-top: 4px; font-size: 14px; }
        .price-header-actions { display: flex; gap: 8px; }
        .price-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; }
        .price-btn-outline { border: 1px solid #e5e7eb; background: white; color: #374151; }
        .price-btn-outline:hover { background: #f9fafb; }
        .price-btn-blue { background: #2563eb; color: white; }
        .price-btn-blue:hover { background: #1d4ed8; }
        .price-btn-green { background: #16a34a; color: white; }
        .price-btn-green:hover { background: #15803d; }
        .price-filter-card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); padding: 16px; margin-bottom: 16px; }
        .price-filter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 768px) { .price-filter-grid { grid-template-columns: 1fr; } }
        .price-filter-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 8px; color: #374151; }
        .price-filter-select { width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; background: white; }
        .price-tier-pills { display: flex; flex-wrap: wrap; gap: 8px; }
        .price-tier-pill { padding: 4px 12px; border-radius: 9999px; font-size: 13px; border: none; cursor: pointer; transition: all 0.15s; }
        .price-tier-pill-active { background: #2563eb; color: white; }
        .price-tier-pill-inactive { background: #f3f4f6; color: #6b7280; }
        .price-tier-pill-inactive:hover { background: #e5e7eb; }
        .price-table-card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow-x: auto; }
        .price-table { width: 100%; border-collapse: collapse; }
        .price-thead { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .price-th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .price-th-sticky { position: sticky; left: 0; background: #f9fafb; z-index: 10; }
        .price-th-sub { font-size: 10px; color: #9ca3af; text-transform: none; font-weight: 400; margin-top: 2px; }
        .price-tbody tr { border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
        .price-tbody tr:hover { background: #f9fafb; }
        .price-td { padding: 12px 16px; }
        .price-td-sticky { position: sticky; left: 0; background: white; }
        .price-unit-badge { display: inline-block; padding: 2px 8px; background: #f3f4f6; font-size: 13px; border-radius: 4px; }
        .price-td-cat { font-size: 13px; color: #6b7280; }
        .price-value { font-size: 18px; color: #16a34a; }
        .price-diff { font-size: 12px; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
        .price-diff-up { color: #dc2626; }
        .price-diff-down { color: #16a34a; }
        .price-diff-same { color: #6b7280; }
        .price-empty { padding: 48px 24px; text-align: center; }
        .price-empty-icon { width: 48px; height: 48px; background: #f9fafb; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
        .price-empty-title { font-size: 15px; font-weight: 500; color: #111827; margin-bottom: 4px; }
        .price-empty-text { max-width: 280px; margin: 0 auto; font-size: 13px; color: #9ca3af; }
        .price-notes { margin-top: 16px; padding: 16px; background: #eff6ff; border-radius: 8px; }
        .price-notes-title { font-size: 13px; font-weight: 500; margin-bottom: 8px; color: #1f2937; }
        .price-notes-list { font-size: 13px; color: #374151; list-style: disc; padding-left: 20px; }
        .price-notes-list li { margin-bottom: 4px; }
      `}</style>

      <div>
        <div className="price-header">
          <div>
            <h2 className="price-title">Pricing</h2>
            <p className="price-subtitle">Manage pricing across different customer tiers</p>
          </div>
          <div className="price-header-actions">
            <button onClick={downloadCSV} className="price-btn price-btn-outline">
              <Download style={{ width: 16, height: 16 }} /> Download CSV
            </button>
            <button onClick={() => toast.info('Upload CSV functionality')} className="price-btn price-btn-blue">
              <Upload style={{ width: 16, height: 16 }} /> Upload CSV
            </button>
            <button onClick={() => toast.info('Add tier functionality')} className="price-btn price-btn-green">
              <Plus style={{ width: 16, height: 16 }} /> Add Tier
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="price-filter-card">
          <div className="price-filter-grid">
            <div>
              <label className="price-filter-label">Filter by Category</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="price-filter-select">
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="price-filter-label">Select Tiers to Compare</label>
              <div className="price-tier-pills">
                {priceTiers.map(tier => (
                  <button
                    key={tier.id}
                    onClick={() => toggleTierSelection(tier.id)}
                    className={`price-tier-pill ${selectedTiers.includes(tier.id) ? 'price-tier-pill-active' : 'price-tier-pill-inactive'}`}
                  >
                    {tier.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="price-table-card">
          <table className="price-table">
            <thead className="price-thead">
              <tr>
                <th className="price-th price-th-sticky">Item</th>
                <th className="price-th">Unit</th>
                <th className="price-th">Category</th>
                {displayTiers.map(tier => (
                  <th key={tier.id} className="price-th">
                    {tier.name}
                    {tier.id !== 't0' && <div className="price-th-sub">vs Base</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="price-tbody">
              {filteredItems.map(item => {
                const basePrice = getPriceForTier('t0', item.id);

                return (
                  <tr key={item.id}>
                    <td className="price-td price-td-sticky">{item.name}</td>
                    <td className="price-td">
                      <span className="price-unit-badge">{item.unit.symbol}</span>
                    </td>
                    <td className="price-td price-td-cat">{getCatName(item.categoryId)}</td>
                    {displayTiers.map(tier => {
                      const price = getPriceForTier(tier.id, item.id);
                      const { diff, percent } = tier.id !== 't0'
                        ? calculateDifference(basePrice, price)
                        : { diff: 0, percent: 0 };

                      return (
                        <td key={tier.id} className="price-td">
                          <div className="price-value">₹{price.toFixed(2)}</div>
                          {tier.id !== 't0' && (
                            <div className={`price-diff ${diff > 0 ? 'price-diff-up' : diff < 0 ? 'price-diff-down' : 'price-diff-same'}`}>
                              {diff > 0 ? <TrendingUp style={{ width: 12, height: 12 }} /> : diff < 0 ? <TrendingDown style={{ width: 12, height: 12 }} /> : null}
                              {diff !== 0 ? `₹${Math.abs(diff).toFixed(2)} (${percent > 0 ? '+' : ''}${percent.toFixed(1)}%)` : 'Same'}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={3 + displayTiers.length} style={{ background: 'white' }}>
                    <div className="price-empty">
                      <div className="price-empty-icon">
                        <Search style={{ width: 24, height: 24, color: '#9ca3af' }} />
                      </div>
                      <h3 className="price-empty-title">No Items Found</h3>
                      <p className="price-empty-text">
                        No items match your selected filters. Try changing the category or adding new items.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="price-notes">
          <h4 className="price-notes-title">Notes:</h4>
          <ul className="price-notes-list">
            <li>Base Tier is the default pricing for all items</li>
            <li>Price differences are shown as absolute value and percentage compared to Base Tier</li>
            <li>Download CSV to get all pricing data or upload updated pricing</li>
            <li>Select multiple tiers above to compare pricing side by side</li>
          </ul>
        </div>
      </div>
    </>
  );
}
