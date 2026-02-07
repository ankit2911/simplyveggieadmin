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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl">Wallet Management</h2>
          <p className="text-gray-600 mt-1">Manage customer wallet balances and transactions</p>
        </div>
      </div>

      {/* Transaction Modal */}
      {showCreditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl mb-4">
              {transactionType === 'credit' ? 'Credit' : 'Debit'} Wallet
            </h3>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Customer</div>
              <div className="font-medium">
                {customers.find(c => c.id === selectedCustomer)?.businessName}
              </div>
              <div className="text-sm text-gray-600 mt-2">Current Balance</div>
              <div className="text-lg text-green-600">
                ₹{customers.find(c => c.id === selectedCustomer)?.walletBalance.toFixed(2)}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Add a note..."
                />
              </div>

              {amount && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">New Balance</div>
                  <div className="text-lg text-blue-600">
                    ₹{(
                      (customers.find(c => c.id === selectedCustomer)?.walletBalance || 0) +
                      (transactionType === 'credit' ? parseFloat(amount) : -parseFloat(amount))
                    ).toFixed(2)}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    setShowCreditModal(false);
                    setSelectedCustomer(null);
                    setAmount('');
                    setDescription('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransaction}
                  className={`px-4 py-2 text-white rounded-lg ${transactionType === 'credit'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  Confirm {transactionType === 'credit' ? 'Credit' : 'Debit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customers Wallet Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Balance</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase"># Transactions</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Last Credit</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Last Debit</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((customer) => {
              const transactions = getCustomerTransactions(customer.id);
              const lastCredit = getLastCredit(customer.id);
              const lastDebit = getLastDebit(customer.id);

              return (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{customer.businessName}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{customer.email}</div>
                    <div className="text-xs text-gray-500">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-lg ${customer.walletBalance >= 5000
                      ? 'text-green-600'
                      : customer.walletBalance >= 1000
                        ? 'text-yellow-600'
                        : 'text-red-600'
                      }`}>
                      ₹{customer.walletBalance.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {transactions.length}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {lastCredit ? (
                      <div>
                        <div className="text-green-600">₹{lastCredit.amount}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(lastCredit.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {lastDebit ? (
                      <div>
                        <div className="text-red-600">₹{lastDebit.amount}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(lastDebit.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openTransactionModal(customer.id, 'credit')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Credit"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openTransactionModal(customer.id, 'debit')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Debit"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowTransactionsFor(customer.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Transactions"
                      >
                        <Eye className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl">
                Transaction History - {customers.find(c => c.id === showTransactionsFor)?.businessName}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showTransactionsFor && downloadTransactionsCSV(showTransactionsFor)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1 text-sm"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download CSV</span>
                </button>
                <button
                  onClick={() => setShowTransactionsFor(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {getCustomerTransactions(showTransactionsFor).reverse().map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">
                        {new Date(txn.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${txn.type === 'credit'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {txn.type}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                          {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{txn.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm mb-2">Balance Status:</h4>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span>Low ({'<'} ₹1,000)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-600 rounded"></div>
            <span>Medium (₹1,000 - ₹5,000)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span>Good ({'>'} ₹5,000)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
