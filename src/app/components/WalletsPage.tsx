import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export function WalletsPage() {
  const { customers, walletTransactions, updateWallet } = useAdmin();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit');

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer || !amount) {
      toast.error('Please select a customer and enter an amount');
      return;
    }

    const amountNum = parseFloat(amount);
    updateWallet(selectedCustomer, transactionType === 'credit' ? amountNum : -amountNum);
    toast.success(`Wallet ${transactionType} successful`);
    setAmount('');
  };

  return (
    <div>
      <h2 className="text-2xl mb-6">Wallet Management</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Transaction */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg mb-4">Add Transaction</h3>
          <form onSubmit={handleTransaction} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Customer</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.businessName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTransactionType('credit')}
                  className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    transactionType === 'credit' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Credit
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType('debit')}
                  className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    transactionType === 'debit' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-100'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  Debit
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Transaction
            </button>
          </form>
        </div>

        {/* Customer Wallets */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg">Customer Wallets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((customer) => {
                  const customerTransactions = walletTransactions.filter(t => t.customerId === customer.id);
                  
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{customer.businessName}</td>
                      <td className="px-6 py-4">
                        <span className={`text-lg ${customer.walletBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${customer.walletBalance.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {customerTransactions.length} transaction(s)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {walletTransactions.slice().reverse().map((transaction) => {
                const customer = customers.find(c => c.id === transaction.customerId);
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{customer?.businessName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.type === 'credit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{transaction.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
