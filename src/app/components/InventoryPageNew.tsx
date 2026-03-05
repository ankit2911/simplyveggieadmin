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
    <>
      <style>{`
        .inv-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .inv-page-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
        }
        .inv-page-subtitle {
          color: #6b7280;
          margin-top: 4px;
          font-size: 14px;
        }
        .inv-table-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          border: 1px solid #f3f4f6;
          overflow: hidden;
        }
        .inv-table {
          width: 100%;
          border-collapse: collapse;
        }
        .inv-thead {
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .inv-th {
          padding: 14px 24px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .inv-th-right {
          text-align: right;
        }
        .inv-th-bold {
          font-weight: 700;
          color: #374151;
        }
        .inv-tbody tr {
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }
        .inv-tbody tr:hover {
          background: #f9fafb;
        }
        .inv-td {
          padding: 14px 24px;
        }
        .inv-td-name {
          font-weight: 500;
          color: #111827;
        }
        .inv-td-category {
          color: #6b7280;
          font-size: 13px;
        }
        .inv-td-unit {
          color: #9ca3af;
          font-size: 13px;
        }
        .inv-td-right {
          text-align: right;
        }
        .inv-stock-value {
          font-family: ui-monospace, monospace;
          font-weight: 500;
          color: #374151;
        }
        .inv-stock-negative {
          color: #dc2626;
        }
        .inv-upcoming {
          color: #9ca3af;
          font-family: ui-monospace, monospace;
        }
        .inv-net-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
        }
        .inv-net-positive {
          background: #dcfce7;
          color: #15803d;
        }
        .inv-net-negative {
          background: #fee2e2;
          color: #b91c1c;
        }
        .inv-net-zero {
          background: #f3f4f6;
          color: #6b7280;
        }
        .inv-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .inv-btn-adjust {
          padding: 6px 12px;
          background: #eff6ff;
          color: #2563eb;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .inv-btn-adjust:hover {
          background: #dbeafe;
        }
        .inv-btn-history {
          padding: 8px;
          color: #9ca3af;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .inv-btn-history:hover {
          color: #2563eb;
          background: #eff6ff;
        }
        .inv-empty {
          padding: 48px 24px;
          text-align: center;
          color: #9ca3af;
        }
        .inv-empty-icon {
          width: 64px;
          height: 64px;
          background: #f9fafb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .inv-empty-title {
          font-size: 18px;
          font-weight: 500;
          color: #111827;
          margin-bottom: 4px;
        }
        .inv-empty-text {
          max-width: 320px;
          margin: 0 auto;
          font-size: 13px;
          color: #9ca3af;
        }
        .inv-modal-backdrop {
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
        .inv-modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 448px;
          overflow: hidden;
        }
        .inv-modal-lg {
          max-width: 512px;
          display: flex;
          flex-direction: column;
          max-height: 80vh;
        }
        .inv-modal-header {
          padding: 16px 24px;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9fafb;
        }
        .inv-modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
        .inv-modal-title-sub {
          margin-left: 8px;
          font-size: 13px;
          font-weight: 400;
          color: #9ca3af;
        }
        .inv-modal-close {
          color: #9ca3af;
          cursor: pointer;
          background: none;
          border: none;
          font-size: 18px;
        }
        .inv-modal-close:hover {
          color: #6b7280;
        }
        .inv-modal-body {
          padding: 24px;
        }
        .inv-form-group {
          margin-bottom: 16px;
        }
        .inv-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
        }
        .inv-field-value {
          color: #111827;
          font-weight: 500;
        }
        .inv-field-hint {
          font-size: 13px;
          color: #9ca3af;
        }
        .inv-input, .inv-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: box-shadow 0.15s;
          background: white;
        }
        .inv-input:focus, .inv-select:focus {
          box-shadow: 0 0 0 2px rgba(59,130,246,0.3);
          border-color: #3b82f6;
        }
        .inv-input-hint {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
        }
        .inv-modal-actions {
          display: flex;
          gap: 12px;
          padding-top: 16px;
        }
        .inv-btn-cancel {
          flex: 1;
          padding: 10px 16px;
          color: #374151;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
        }
        .inv-btn-cancel:hover {
          background: #e5e7eb;
        }
        .inv-btn-submit {
          flex: 1;
          padding: 10px 16px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
        }
        .inv-btn-submit:hover {
          background: #1d4ed8;
        }
        .inv-btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .inv-history-body {
          padding: 0;
          overflow-y: auto;
        }
        .inv-history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .inv-history-thead {
          background: #f9fafb;
          color: #9ca3af;
        }
        .inv-history-thead th {
          padding: 8px 16px;
          text-align: left;
          font-weight: 500;
        }
        .inv-history-thead th:last-child {
          text-align: right;
        }
        .inv-history-tbody tr {
          border-bottom: 1px solid #f9fafb;
        }
        .inv-history-tbody td {
          padding: 8px 16px;
        }
        .inv-history-date {
          color: #6b7280;
        }
        .inv-history-type {
          font-weight: 500;
        }
        .inv-history-reason {
          color: #9ca3af;
        }
        .inv-history-delta {
          text-align: right;
          font-family: ui-monospace, monospace;
          font-weight: 500;
        }
        .inv-delta-positive {
          color: #16a34a;
        }
        .inv-delta-negative {
          color: #dc2626;
        }
        .inv-history-empty {
          padding: 32px;
          text-align: center;
          color: #9ca3af;
        }
        .inv-modal-footer {
          padding: 16px;
          border-top: 1px solid #f3f4f6;
          background: #f9fafb;
          text-align: right;
        }
        .inv-btn-close {
          padding: 8px 16px;
          color: #6b7280;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }
        .inv-btn-close:hover {
          background: #e5e7eb;
        }
      `}</style>

      <div>
        <div className="inv-page-header">
          <div>
            <h2 className="inv-page-title">Inventory Management</h2>
            <p className="inv-page-subtitle">Manage stock levels and view history.</p>
          </div>
        </div>

        <div className="inv-table-card">
          <table className="inv-table">
            <thead className="inv-thead">
              <tr>
                <th className="inv-th">Item</th>
                <th className="inv-th">Category</th>
                <th className="inv-th">Unit</th>
                <th className="inv-th inv-th-right">Actual Stock</th>
                <th className="inv-th inv-th-right">Upcoming</th>
                <th className="inv-th inv-th-right inv-th-bold">Net Available</th>
                <th className="inv-th inv-th-right">Actions</th>
              </tr>
            </thead>
            <tbody className="inv-tbody">
              {validInventory.map((item) => {
                const netAvailable = item.actualStock + item.upcomingStock;
                return (
                  <tr key={item.id}>
                    <td className="inv-td inv-td-name">{item.name}</td>
                    <td className="inv-td inv-td-category">{item.category?.name || 'Uncategorized'}</td>
                    <td className="inv-td inv-td-unit">{item.unit.symbol}</td>

                    <td className="inv-td inv-td-right">
                      <span className={`inv-stock-value ${item.actualStock < 0 ? 'inv-stock-negative' : ''}`}>
                        {item.actualStock}
                      </span>
                    </td>
                    <td className="inv-td inv-td-right inv-upcoming">
                      {item.upcomingStock > 0 ? `+${item.upcomingStock}` : item.upcomingStock}
                    </td>
                    <td className="inv-td inv-td-right">
                      <span className={`inv-net-badge ${netAvailable < 0 ? 'inv-net-negative' :
                        netAvailable === 0 ? 'inv-net-zero' :
                          'inv-net-positive'
                        }`}>
                        {netAvailable}
                      </span>
                    </td>

                    <td className="inv-td inv-td-right">
                      <div className="inv-actions">
                        <button
                          onClick={() => setAdjustItem(item)}
                          className="inv-btn-adjust"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="inv-btn-history"
                          title="View History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {validInventory.length === 0 && (
                <tr>
                  <td colSpan={7} className="inv-empty">
                    <div>
                      <div className="inv-empty-icon">
                        <Package style={{ width: 32, height: 32, color: '#9ca3af' }} />
                      </div>
                      <h3 className="inv-empty-title">No Inventory Found</h3>
                      <p className="inv-empty-text">
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
          <div className="inv-modal-backdrop">
            <div className="inv-modal">
              <div className="inv-modal-header">
                <h3 className="inv-modal-title">Adjust Stock</h3>
                <button onClick={() => setAdjustItem(null)} className="inv-modal-close">✕</button>
              </div>
              <form onSubmit={handleAdjustSubmit} className="inv-modal-body">
                <div className="inv-form-group">
                  <label className="inv-label">Item</label>
                  <div className="inv-field-value">{adjustItem.name} ({adjustItem.unit.symbol})</div>
                  <div className="inv-field-hint">Current Stock: {adjustItem.actualStock}</div>
                </div>

                {products.find(p => p.id === adjustItem.id)?.variants?.length ? (
                  <div className="inv-form-group">
                    <label className="inv-label">Unit / Pack</label>
                    <select
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                      className="inv-select"
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

                <div className="inv-form-group">
                  <label className="inv-label">Adjustment Type</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value)}
                    className="inv-select"
                  >
                    <option value="RECEIPT">Receipt (Add Stock)</option>
                    <option value="CORRECTION">Correction (Adjust +/-)</option>
                    <option value="DAMAGE">Damage (Remove Stock)</option>
                    <option value="WASTE">Waste (Remove Stock)</option>
                  </select>
                </div>

                <div className="inv-form-group">
                  <label className="inv-label">Adjustment Amount (+/-)</label>
                  <input
                    type="number"
                    step="any"
                    value={delta}
                    onChange={(e) => setDelta(e.target.value)}
                    className="inv-input"
                    placeholder="e.g. 10 or -5"
                    required
                  />
                  <p className="inv-input-hint">Positive to add stock, negative to remove.</p>
                </div>

                <div className="inv-form-group">
                  <label className="inv-label">Reason (Optional)</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="inv-input"
                    placeholder="e.g. New Shipment, Damage, Correction"
                  />
                </div>

                <div className="inv-modal-actions">
                  <button
                    type="button"
                    onClick={() => setAdjustItem(null)}
                    className="inv-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || delta === '' || Number(delta) === 0}
                    className="inv-btn-submit"
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
          <div className="inv-modal-backdrop">
            <div className="inv-modal inv-modal-lg">
              <div className="inv-modal-header">
                <h3 className="inv-modal-title">
                  {selectedItem.name}
                  <span className="inv-modal-title-sub">({selectedItem.unit.name})</span>
                </h3>
                <button onClick={() => setSelectedItem(null)} className="inv-modal-close">✕</button>
              </div>
              <div className="inv-history-body">
                {selectedItem.adjustments && selectedItem.adjustments.length > 0 ? (
                  <table className="inv-history-table">
                    <thead className="inv-history-thead">
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Reason</th>
                        <th>Delta</th>
                      </tr>
                    </thead>
                    <tbody className="inv-history-tbody">
                      {selectedItem.adjustments.map(adj => (
                        <tr key={adj.id}>
                          <td className="inv-history-date">{new Date(adj.createdAt).toLocaleDateString()}</td>
                          <td className="inv-history-type">{adj.type}</td>
                          <td className="inv-history-reason">{adj.reason || '-'}</td>
                          <td className={`inv-history-delta ${adj.delta > 0 ? 'inv-delta-positive' : 'inv-delta-negative'}`}>
                            {adj.delta > 0 ? '+' : ''}{adj.delta}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="inv-history-empty">No recent adjustments.</div>
                )}
              </div>
              <div className="inv-modal-footer">
                <button onClick={() => setSelectedItem(null)} className="inv-btn-close">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
