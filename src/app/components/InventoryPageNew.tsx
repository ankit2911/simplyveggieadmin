'use client';

import React, { useState } from 'react';
import { useAdmin, type InventoryItem } from '../context/AdminContext';
import { History, Eye, Download, Package } from 'lucide-react';
import { toast } from 'sonner';

export function InventoryPageNew() {
  const { inventory, products, adjustInventory } = useAdmin();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Adjustment Modal State
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [delta, setDelta] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState('CORRECTION');
  const [reason, setReason] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out items without proper inventory data
  const validInventory = inventory.filter(i => i.unit);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || delta === '') return;

    setIsSubmitting(true);
    try {
      await adjustInventory(adjustItem.id, Number(delta), adjustmentType, reason, selectedVariantId || undefined);
      setAdjustItem(null);
      setDelta('');
      setReason('');
      setSelectedVariantId('');
      setAdjustmentType('CORRECTION');
    } catch (error) {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
          <p className="text-gray-600 mt-1">Manage stock levels and view history.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actual Stock</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Upcoming</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Net Available</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {validInventory.map((item) => {
              const netAvailable = item.actualStock + item.upcomingStock;
              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{item.category?.name || 'Uncategorized'}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{item.unit.symbol}</td>

                  <td className="px-6 py-4 text-right">
                    <span className={`font-mono font-medium ${item.actualStock < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                      {item.actualStock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500 font-mono">
                    {item.upcomingStock > 0 ? `+${item.upcomingStock}` : item.upcomingStock}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${netAvailable < 0 ? 'bg-red-100 text-red-700' :
                      netAvailable === 0 ? 'bg-gray-100 text-gray-600' :
                        'bg-green-100 text-green-700'
                      }`}>
                      {netAvailable}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => setAdjustItem(item)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      Adjust
                    </button>
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View History"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {validInventory.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Inventory Found</h3>
                    <p className="max-w-sm text-sm text-gray-500">
                      We couldn't find any items with valid units. Please ensure your items are configured correctly.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Adjustment Modal */}
      {adjustItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Adjust Stock</h3>
              <button onClick={() => setAdjustItem(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <div className="text-gray-900 font-medium">{adjustItem.name} ({adjustItem.unit.symbol})</div>
                <div className="text-sm text-gray-500">Current Stock: {adjustItem.actualStock}</div>
              </div>

              {products.find(p => p.id === adjustItem.id)?.variants?.length ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit / Pack</label>
                  <select
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Base Unit ({adjustItem.unit.symbol})</option>
                    {products.find(p => p.id === adjustItem.id)?.variants?.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} (x{v.conversionFactor})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="RECEIPT">Receipt (Add Stock)</option>
                  <option value="CORRECTION">Correction (Adjust +/-)</option>
                  <option value="DAMAGE">Damage (Remove Stock)</option>
                  <option value="WASTE">Waste (Remove Stock)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Amount (+/-)</label>
                <input
                  type="number"
                  step="any"
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 10 or -5"
                  required
                />          <p className="text-xs text-gray-500 mt-1">Positive to add stock, negative to remove.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. New Shipment, Damage, Correction"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || delta === '' || Number(delta) === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedItem.name}
                <span className="ml-2 text-sm font-normal text-gray-500">({selectedItem.unit.name})</span>
              </h3>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-0 overflow-y-auto">
              {selectedItem.adjustments && selectedItem.adjustments.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Reason</th>
                      <th className="px-4 py-2 text-right">Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedItem.adjustments.map(adj => (
                      <tr key={adj.id}>
                        <td className="px-4 py-2 text-gray-600">{new Date(adj.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-2 font-medium">{adj.type}</td>
                        <td className="px-4 py-2 text-gray-500">{adj.reason || '-'}</td>
                        <td className={`px-4 py-2 text-right font-mono font-medium ${adj.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {adj.delta > 0 ? '+' : ''}{adj.delta}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-400">No recent adjustments.</div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
              <button onClick={() => setSelectedItem(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
