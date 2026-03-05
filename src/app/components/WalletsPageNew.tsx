'use client';

import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Plus, Minus, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';

export function WalletsPageNew() {
  const { customers, walletTransactions, updateWallet } = useAdmin();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit');
  const [description, setDescription] = useState('');
  const [showTransactionsFor, setShowTransactionsFor] = useState<string | null>(null);

  const getCustomerTransactions = (customerId: string) => {
    return walletTransactions.filter(t => t.customerId === customerId);
  };

  const getLastCredit = (customerId: string) => {
    const txns = getCustomerTransactions(customerId).filter(t => t.type === 'credit');
    return txns.length > 0 ? txns[txns.length - 1] : null;
  };

  const getLastDebit = (customerId: string) => {
    const txns = getCustomerTransactions(customerId).filter(t => t.type === 'debit');
    return txns.length > 0 ? txns[txns.length - 1] : null;
  };

  const handleTransaction = () => {
    if (!selectedCustomer || !amount) {
      toast.error('Please fill all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    const finalAmount = transactionType === 'credit' ? amountNum : -amountNum;

    updateWallet(selectedCustomer, finalAmount);
    toast.success(`Wallet ${transactionType} of ₹${amountNum} successful`);

    setShowCreditModal(false);
    setSelectedCustomer(null);
    setAmount('');
    setDescription('');
  };

  const openTransactionModal = (customerId: string, type: 'credit' | 'debit') => {
    setSelectedCustomer(customerId);
    setTransactionType(type);
    setShowCreditModal(true);
  };

  const downloadTransactionsCSV = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const transactions = getCustomerTransactions(customerId);
    const csvContent = [
      ['Date', 'Type', 'Amount', 'Description'],
      ...transactions.map(t => [
        new Date(t.timestamp).toLocaleString(),
        t.type,
        t.amount.toFixed(2),
        t.description || ''
      ])
    ].map(row => row.join(',')).join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${customer.businessName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        .wal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .wal-title { font-size: 20px; font-weight: 600; color: #1f2937; }
        .wal-subtitle { color: #6b7280; margin-top: 4px; font-size: 14px; }
        .wal-table-card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow: hidden; }
        .wal-table { width: 100%; border-collapse: collapse; }
        .wal-thead { background: #f9fafb; }
        .wal-th { padding: 12px 24px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
        .wal-tbody tr { border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
        .wal-tbody tr:hover { background: #f9fafb; }
        .wal-td { padding: 14px 24px; }
        .wal-td-email { font-size: 13px; color: #374151; }
        .wal-td-phone { font-size: 12px; color: #9ca3af; }
        .wal-balance { font-size: 18px; font-weight: 500; }
        .wal-bal-good { color: #16a34a; }
        .wal-bal-med { color: #ca8a04; }
        .wal-bal-low { color: #dc2626; }
        .wal-td-count { font-size: 13px; color: #6b7280; }
        .wal-last-txn { font-size: 13px; }
        .wal-last-credit { color: #16a34a; }
        .wal-last-debit { color: #dc2626; }
        .wal-last-date { font-size: 11px; color: #9ca3af; }
        .wal-last-none { color: #9ca3af; }
        .wal-actions { display: flex; gap: 8px; }
        .wal-btn-icon { padding: 8px; border: none; border-radius: 6px; cursor: pointer; transition: background 0.15s; background: transparent; }
        .wal-btn-credit { color: #16a34a; }
        .wal-btn-credit:hover { background: #f0fdf4; }
        .wal-btn-debit { color: #dc2626; }
        .wal-btn-debit:hover { background: #fef2f2; }
        .wal-btn-view { color: #2563eb; }
        .wal-btn-view:hover { background: #eff6ff; }
        .wal-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .wal-modal { background: white; border-radius: 12px; padding: 24px; max-width: 448px; width: 100%; margin: 16px; }
        .wal-modal-lg { max-width: 896px; margin: 32px; }
        .wal-modal-title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #1f2937; }
        .wal-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .wal-modal-close { color: #9ca3af; cursor: pointer; background: none; border: none; font-size: 18px; }
        .wal-modal-close:hover { color: #6b7280; }
        .wal-info-box { padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 16px; }
        .wal-info-label { font-size: 13px; color: #6b7280; }
        .wal-info-value { font-weight: 500; color: #111827; }
        .wal-info-balance { font-size: 18px; color: #16a34a; }
        .wal-form-group { margin-bottom: 16px; }
        .wal-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; color: #374151; }
        .wal-input, .wal-textarea { width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; }
        .wal-input:focus, .wal-textarea:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.3); border-color: #3b82f6; }
        .wal-preview { padding: 12px; background: #eff6ff; border-radius: 8px; margin-bottom: 16px; }
        .wal-preview-label { font-size: 13px; color: #6b7280; }
        .wal-preview-value { font-size: 18px; color: #2563eb; }
        .wal-modal-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .wal-btn-cancel { padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; font-size: 14px; }
        .wal-btn-cancel:hover { background: #f9fafb; }
        .wal-btn-confirm { padding: 8px 16px; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px; }
        .wal-btn-confirm-credit { background: #16a34a; }
        .wal-btn-confirm-credit:hover { background: #15803d; }
        .wal-btn-confirm-debit { background: #dc2626; }
        .wal-btn-confirm-debit:hover { background: #b91c1c; }
        .wal-txn-table { width: 100%; border-collapse: collapse; }
        .wal-txn-thead { background: #f9fafb; }
        .wal-txn-th { padding: 8px 16px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase; }
        .wal-txn-tbody tr { border-bottom: 1px solid #f3f4f6; }
        .wal-txn-tbody tr:hover { background: #f9fafb; }
        .wal-txn-td { padding: 8px 16px; font-size: 13px; }
        .wal-txn-date { color: #6b7280; }
        .wal-txn-badge { padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
        .wal-txn-badge-credit { background: #dcfce7; color: #166534; }
        .wal-txn-badge-debit { background: #fee2e2; color: #991b1b; }
        .wal-txn-amount-credit { color: #16a34a; }
        .wal-txn-amount-debit { color: #dc2626; }
        .wal-txn-desc { color: #6b7280; }
        .wal-btn-download { padding: 8px; color: #2563eb; background: transparent; border: none; cursor: pointer; border-radius: 4px; display: flex; align-items: center; gap: 4px; font-size: 13px; }
        .wal-btn-download:hover { background: #eff6ff; }
        .wal-btn-download-text { display: none; }
        @media (min-width: 640px) { .wal-btn-download-text { display: inline; } }
        .wal-legend { margin-top: 16px; padding: 16px; background: #eff6ff; border-radius: 8px; }
        .wal-legend-title { font-size: 13px; font-weight: 500; margin-bottom: 8px; color: #1f2937; }
        .wal-legend-items { display: flex; gap: 16px; font-size: 13px; }
        .wal-legend-dot { width: 12px; height: 12px; border-radius: 4px; display: inline-block; }
        .wal-legend-item { display: flex; align-items: center; gap: 8px; }
      `}</style>

      <div>
        <div className="wal-header">
          <div>
            <h2 className="wal-title">Wallet Management</h2>
            <p className="wal-subtitle">Manage customer wallet balances and transactions</p>
          </div>
        </div>

        {/* Transaction Modal */}
        {showCreditModal && selectedCustomer && (
          <div className="wal-modal-backdrop">
            <div className="wal-modal">
              <h3 className="wal-modal-title">
                {transactionType === 'credit' ? 'Credit' : 'Debit'} Wallet
              </h3>

              <div className="wal-info-box">
                <div className="wal-info-label">Customer</div>
                <div className="wal-info-value">
                  {customers.find(c => c.id === selectedCustomer)?.businessName}
                </div>
                <div className="wal-info-label" style={{ marginTop: 8 }}>Current Balance</div>
                <div className="wal-info-balance">
                  ₹{customers.find(c => c.id === selectedCustomer)?.walletBalance.toFixed(2)}
                </div>
              </div>

              <div className="wal-form-group">
                <label className="wal-label">Amount (₹) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="wal-input"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  autoFocus
                />
              </div>

              <div className="wal-form-group">
                <label className="wal-label">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="wal-textarea"
                  rows={2}
                  placeholder="Add a note..."
                />
              </div>

              {amount && (
                <div className="wal-preview">
                  <div className="wal-preview-label">New Balance</div>
                  <div className="wal-preview-value">
                    ₹{(
                      (customers.find(c => c.id === selectedCustomer)?.walletBalance || 0) +
                      (transactionType === 'credit' ? parseFloat(amount) : -parseFloat(amount))
                    ).toFixed(2)}
                  </div>
                </div>
              )}

              <div className="wal-modal-actions">
                <button
                  onClick={() => {
                    setShowCreditModal(false);
                    setSelectedCustomer(null);
                    setAmount('');
                    setDescription('');
                  }}
                  className="wal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransaction}
                  className={`wal-btn-confirm ${transactionType === 'credit' ? 'wal-btn-confirm-credit' : 'wal-btn-confirm-debit'}`}
                >
                  Confirm {transactionType === 'credit' ? 'Credit' : 'Debit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customers Wallet Table */}
        <div className="wal-table-card">
          <table className="wal-table">
            <thead className="wal-thead">
              <tr>
                <th className="wal-th">Customer</th>
                <th className="wal-th">Contact</th>
                <th className="wal-th">Balance</th>
                <th className="wal-th"># Transactions</th>
                <th className="wal-th">Last Credit</th>
                <th className="wal-th">Last Debit</th>
                <th className="wal-th">Actions</th>
              </tr>
            </thead>
            <tbody className="wal-tbody">
              {customers.map((customer) => {
                const transactions = getCustomerTransactions(customer.id);
                const lastCredit = getLastCredit(customer.id);
                const lastDebit = getLastDebit(customer.id);

                return (
                  <tr key={customer.id}>
                    <td className="wal-td">{customer.businessName}</td>
                    <td className="wal-td">
                      <div className="wal-td-email">{customer.email}</div>
                      <div className="wal-td-phone">{customer.phone}</div>
                    </td>
                    <td className="wal-td">
                      <span className={`wal-balance ${customer.walletBalance >= 5000
                        ? 'wal-bal-good'
                        : customer.walletBalance >= 1000
                          ? 'wal-bal-med'
                          : 'wal-bal-low'
                        }`}>
                        ₹{customer.walletBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="wal-td wal-td-count">{transactions.length}</td>
                    <td className="wal-td wal-last-txn">
                      {lastCredit ? (
                        <div>
                          <div className="wal-last-credit">₹{lastCredit.amount}</div>
                          <div className="wal-last-date">{new Date(lastCredit.timestamp).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <span className="wal-last-none">-</span>
                      )}
                    </td>
                    <td className="wal-td wal-last-txn">
                      {lastDebit ? (
                        <div>
                          <div className="wal-last-debit">₹{lastDebit.amount}</div>
                          <div className="wal-last-date">{new Date(lastDebit.timestamp).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <span className="wal-last-none">-</span>
                      )}
                    </td>
                    <td className="wal-td">
                      <div className="wal-actions">
                        <button onClick={() => openTransactionModal(customer.id, 'credit')} className="wal-btn-icon wal-btn-credit" title="Credit">
                          <Plus style={{ width: 16, height: 16 }} />
                        </button>
                        <button onClick={() => openTransactionModal(customer.id, 'debit')} className="wal-btn-icon wal-btn-debit" title="Debit">
                          <Minus style={{ width: 16, height: 16 }} />
                        </button>
                        <button onClick={() => setShowTransactionsFor(customer.id)} className="wal-btn-icon wal-btn-view" title="View Transactions">
                          <Eye style={{ width: 16, height: 16 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Transactions Detail Modal */}
        {showTransactionsFor && (
          <div className="wal-modal-backdrop" style={{ overflowY: 'auto', padding: 16 }}>
            <div className="wal-modal wal-modal-lg">
              <div className="wal-modal-header">
                <h3 className="wal-modal-title" style={{ marginBottom: 0 }}>
                  Transaction History - {customers.find(c => c.id === showTransactionsFor)?.businessName}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => showTransactionsFor && downloadTransactionsCSV(showTransactionsFor)}
                    className="wal-btn-download"
                    title="Download CSV"
                  >
                    <Download style={{ width: 16, height: 16 }} />
                    <span className="wal-btn-download-text">Download CSV</span>
                  </button>
                  <button onClick={() => setShowTransactionsFor(null)} className="wal-modal-close">✕</button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="wal-txn-table">
                  <thead className="wal-txn-thead">
                    <tr>
                      <th className="wal-txn-th">Date</th>
                      <th className="wal-txn-th">Type</th>
                      <th className="wal-txn-th">Amount</th>
                      <th className="wal-txn-th">Description</th>
                    </tr>
                  </thead>
                  <tbody className="wal-txn-tbody">
                    {getCustomerTransactions(showTransactionsFor).reverse().map((txn) => (
                      <tr key={txn.id}>
                        <td className="wal-txn-td wal-txn-date">{new Date(txn.timestamp).toLocaleString()}</td>
                        <td className="wal-txn-td">
                          <span className={`wal-txn-badge ${txn.type === 'credit' ? 'wal-txn-badge-credit' : 'wal-txn-badge-debit'}`}>
                            {txn.type}
                          </span>
                        </td>
                        <td className="wal-txn-td">
                          <span className={txn.type === 'credit' ? 'wal-txn-amount-credit' : 'wal-txn-amount-debit'}>
                            {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="wal-txn-td wal-txn-desc">{txn.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="wal-legend">
          <h4 className="wal-legend-title">Balance Status:</h4>
          <div className="wal-legend-items">
            <div className="wal-legend-item">
              <span className="wal-legend-dot" style={{ background: '#dc2626' }}></span>
              <span>Low ({'<'} ₹1,000)</span>
            </div>
            <div className="wal-legend-item">
              <span className="wal-legend-dot" style={{ background: '#ca8a04' }}></span>
              <span>Medium (₹1,000 - ₹5,000)</span>
            </div>
            <div className="wal-legend-item">
              <span className="wal-legend-dot" style={{ background: '#16a34a' }}></span>
              <span>Good ({'>'} ₹5,000)</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
