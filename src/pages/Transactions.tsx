import { useState } from 'react';

type Transaction = {
  id: string;
  date: string;
  description: string;
  account: string;
  debit: number;
  credit: number;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      date: '2025-09-10',
      description: 'Office supplies purchase',
      account: 'Office Expenses',
      debit: 150.75,
      credit: 0,
    },
    {
      id: '2',
      date: '2025-09-09',
      description: 'Client payment received',
      account: 'Accounts Receivable',
      debit: 0,
      credit: 2500.00,
    },
    {
      id: '3',
      date: '2025-09-08',
      description: 'Monthly rent payment',
      account: 'Rent Expense',
      debit: 1200.00,
      credit: 0,
    },
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <button className="btn btn-primary">
          <span className="mr-1">+</span> New Transaction
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debit
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {transaction.account}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                  Totals:
                </td>
                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                  {formatCurrency(transactions.reduce((sum, t) => sum + t.debit, 0))}
                </td>
                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                  {formatCurrency(transactions.reduce((sum, t) => sum + t.credit, 0))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
