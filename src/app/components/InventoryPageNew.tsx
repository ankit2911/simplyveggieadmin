import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Plus, Minus, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export function InventoryPageNew() {
  const { inventory, updateInventoryItem, categories } = useAdmin();
  const [adjustments, setAdjustments] = useState<Record<string, Record<string, number>>>({});

  const handleQuickAdjust = (itemId: string, packSize: string, change: number) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const currentQty = item.quantityInStock[packSize] || 0;
    const newQty = Math.max(0, currentQty + change);

    updateInventoryItem(itemId, {
      quantityInStock: {
        ...item.quantityInStock,
        [packSize]: newQty,
      },
    });

    toast.success(`Updated ${item.name} (${packSize})`);
  };

  const handleManualUpdate = (itemId: string, packSize: string, value: number) => {
    if (!adjustments[itemId]) {
      adjustments[itemId] = {};
    }
    adjustments[itemId][packSize] = value;
    setAdjustments({ ...adjustments });
  };

  const applyManualUpdate = (itemId: string, packSize: string) => {
    const value = adjustments[itemId]?.[packSize];
    if (value === undefined) return;

    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    updateInventoryItem(itemId, {
      quantityInStock: {
        ...item.quantityInStock,
        [packSize]: Math.max(0, value),
      },
    });

    // Clear adjustment
    delete adjustments[itemId][packSize];
    setAdjustments({ ...adjustments });
    toast.success(`Updated ${item.name} (${packSize})`);
  };

  const downloadSampleCSV = () => {
    const headers = ['Item ID', 'Item Name', 'Pack Size', 'Quantity'];
    const rows = inventory.flatMap(item =>
      item.packSizes.map(size => [
        item.id,
        item.name,
        size,
        item.quantityInStock[size] || 0,
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV template downloaded');
  };

  const handleBulkUpdate = () => {
    toast.info('Bulk update feature - Upload CSV functionality would be implemented here');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl">Inventory Management</h2>
          <p className="text-gray-600 mt-1">Manage stock quantities for all items</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
          <button
            onClick={handleBulkUpdate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Upload className="w-4 h-4" />
            Bulk Update
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Pack Size</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Current Stock</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Quick Adjust</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Set Quantity</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {inventory.flatMap(item =>
              item.packSizes.map((size, idx) => (
                <tr key={`${item.id}-${size}`} className="hover:bg-gray-50">
                  {idx === 0 && (
                    <td className="px-6 py-4" rowSpan={item.packSizes.length}>
                      <div className="font-medium">{item.name}</div>
                    </td>
                  )}
                  {idx === 0 && (
                    <td className="px-6 py-4 text-sm text-gray-600" rowSpan={item.packSizes.length}>
                      {categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized'}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-sm rounded">{size}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-lg ${item.quantityInStock[size] <= 20
                      ? 'text-red-600'
                      : item.quantityInStock[size] <= 50
                        ? 'text-yellow-600'
                        : 'text-green-600'
                      }`}>
                      {item.quantityInStock[size]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickAdjust(item.id, size, -10)}
                        className="p-1 border rounded hover:bg-gray-100"
                        title="Subtract 10"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleQuickAdjust(item.id, size, -1)}
                        className="px-2 py-1 border rounded hover:bg-gray-100 text-sm"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleQuickAdjust(item.id, size, 1)}
                        className="px-2 py-1 border rounded hover:bg-gray-100 text-sm"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleQuickAdjust(item.id, size, 10)}
                        className="p-1 border rounded hover:bg-gray-100"
                        title="Add 10"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder={item.quantityInStock[size].toString()}
                        value={adjustments[item.id]?.[size] ?? ''}
                        onChange={(e) => handleManualUpdate(item.id, size, Number(e.target.value))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            applyManualUpdate(item.id, size);
                          }
                        }}
                        className="w-24 px-2 py-1 border rounded text-sm"
                        min="0"
                      />
                      <button
                        onClick={() => applyManualUpdate(item.id, size)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        disabled={!adjustments[item.id]?.[size]}
                      >
                        Set
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm mb-2">Stock Status Legend:</h4>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span>Low Stock (≤ 20)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-600 rounded"></div>
            <span>Medium Stock (21-50)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span>Good Stock ({'>'} 50)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
