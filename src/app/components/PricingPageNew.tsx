'use client';

import React, { useState } from 'react';
import { useAdmin, type PriceTier } from '../context/AdminContext';
import { Plus, Download, Upload, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export function PricingPageNew() {
  const { priceTiers, inventory, addPriceTier, categories } = useAdmin();
  const [selectedTiers, setSelectedTiers] = useState<string[]>(['t0', 't1']);
  const [filterCategory, setFilterCategory] = useState('all');

  const baseTier = priceTiers.find(t => t.id === 't0');
  const displayTiers = priceTiers.filter(t => selectedTiers.includes(t.id));

  // Helper to get Category Name
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || 'Uncategorized';

  // Filter items
  const filteredItems = inventory.filter(item =>
    filterCategory === 'all' || item.categoryId === filterCategory
  );

  const getPriceForTier = (tierId: string, itemId: string) => {
    const tier = priceTiers.find(t => t.id === tierId);
    if (!tier) return 0;

    // Check for override in tier logic
    // Note: packSize logic removed, assuming PriceTierItem no longer needs packSize or defaults to item's unit
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl">Pricing</h2>
          <p className="text-gray-600 mt-1">Manage pricing across different customer tiers</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
          <button
            onClick={() => toast.info('Upload CSV functionality')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </button>
          <button
            onClick={() => toast.info('Add tier functionality')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Add Tier
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">Filter by Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">Select Tiers to Compare</label>
            <div className="flex flex-wrap gap-2">
              {priceTiers.map(tier => (
                <button
                  key={tier.id}
                  onClick={() => toggleTierSelection(tier.id)}
                  className={`px-3 py-1 rounded-full text-sm ${selectedTiers.includes(tier.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {tier.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase sticky left-0 bg-gray-50">Item</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Unit</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Category</th>
              {displayTiers.map(tier => (
                <th key={tier.id} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                  {tier.name}
                  {tier.id !== 't0' && <div className="text-xs text-gray-400 normal-case">vs Base</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredItems.map(item => {
              const basePrice = getPriceForTier('t0', item.id);

              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 sticky left-0 bg-white">
                    {item.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-sm rounded">{item.unit.symbol}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {getCatName(item.categoryId)}
                  </td>
                  {displayTiers.map(tier => {
                    const price = getPriceForTier(tier.id, item.id);
                    const { diff, percent } = tier.id !== 't0'
                      ? calculateDifference(basePrice, price)
                      : { diff: 0, percent: 0 };

                    return (
                      <td key={tier.id} className="px-4 py-3">
                        <div className="text-lg text-green-600">₹{price.toFixed(2)}</div>
                        {tier.id !== 't0' && (
                          <div className={`text-xs flex items-center gap-1 ${diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-gray-600'
                            }`}>
                            {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                            {diff !== 0 ? `₹${Math.abs(diff).toFixed(2)} (${percent > 0 ? '+' : ''}${percent.toFixed(1)}%)` : 'Same'}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm mb-2">Notes:</h4>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Base Tier is the default pricing for all items</li>
          <li>Price differences are shown as absolute value and percentage compared to Base Tier</li>
          <li>Download CSV to get all pricing data or upload updated pricing</li>
          <li>Select multiple tiers above to compare pricing side by side</li>
        </ul>
      </div>
    </div>
  );

}
