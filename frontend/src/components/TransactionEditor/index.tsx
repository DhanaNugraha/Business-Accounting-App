import { useState, useEffect } from 'react';
import { TransactionItem } from '@/types';
import { PencilIcon, TrashIcon, PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TransactionEditorProps {
  transactions: TransactionItem[];
  onSave: (transactions: TransactionItem[]) => void;
  accountName: string;
}

export const TransactionEditor = ({ transactions, onSave, accountName }: TransactionEditorProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTransactions, setEditedTransactions] = useState<TransactionItem[]>(transactions);
  const [newTransaction, setNewTransaction] = useState<Partial<TransactionItem>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Update local state when transactions prop changes
  useEffect(() => {
    setEditedTransactions(transactions);
  }, [transactions]);

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = () => {
    setEditingId(null);
    onSave(editedTransactions);
  };

  const handleDelete = (id: string) => {
    const updated = editedTransactions.filter(t => t.id !== id);
    setEditedTransactions(updated);
    onSave(updated);
  };

  const handleAdd = () => {
    if (!newTransaction.tanggal || !newTransaction.uraian) return;
    
    const newTx: TransactionItem = {
      id: Date.now().toString(),
      tanggal: newTransaction.tanggal,
      uraian: newTransaction.uraian,
      penerimaan: newTransaction.penerimaan || '',
      pengeluaran: newTransaction.pengeluaran || '',
      saldo: Number(newTransaction.penerimaan || 0) - Number(newTransaction.pengeluaran || 0)
    };

    const updated = [...editedTransactions, newTx];
    setEditedTransactions(updated);
    setNewTransaction({});
    setIsAdding(false);
    onSave(updated);
  };

  const handleInputChange = (id: string, field: keyof TransactionItem, value: string) => {
    setEditedTransactions(prev => 
      prev.map(tx => 
        tx.id === id ? { ...tx, [field]: value } : tx
      )
    );
  };

  const calculateRunningBalance = (index: number): number => {
    let balance = 0;
    for (let i = 0; i <= index; i++) {
      const tx = editedTransactions[i];
      balance += Number(tx.penerimaan || 0) - Number(tx.pengeluaran || 0);
    }
    return balance;
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">{accountName}</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Tambah Transaksi
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uraian</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Penerimaan</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pengeluaran</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isAdding && (
              <tr className="bg-blue-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="date"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={newTransaction.tanggal || ''}
                    onChange={(e) => setNewTransaction({...newTransaction, tanggal: e.target.value})}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={newTransaction.uraian || ''}
                    onChange={(e) => setNewTransaction({...newTransaction, uraian: e.target.value})}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <input
                    type="number"
                    className="block w-full text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={newTransaction.penerimaan || ''}
                    onChange={(e) => setNewTransaction({...newTransaction, penerimaan: e.target.value})}
                    placeholder="0"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <input
                    type="number"
                    className="block w-full text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={newTransaction.pengeluaran || ''}
                    onChange={(e) => setNewTransaction({...newTransaction, pengeluaran: e.target.value})}
                    placeholder="0"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  {(
                    (Number(newTransaction.penerimaan || 0) - Number(newTransaction.pengeluaran || 0)).toLocaleString('id-ID')
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleAdd}
                      className="text-green-600 hover:text-green-900"
                      title="Simpan"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setIsAdding(false)}
                      className="text-red-600 hover:text-red-900"
                      title="Batal"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            
            {editedTransactions.map((tx, index) => (
              <tr key={tx.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === tx.id ? (
                    <input
                      type="date"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={tx.tanggal}
                      onChange={(e) => handleInputChange(tx.id, 'tanggal', e.target.value)}
                    />
                  ) : (
                    new Date(tx.tanggal).toLocaleDateString('id-ID')
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === tx.id ? (
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={tx.uraian}
                      onChange={(e) => handleInputChange(tx.id, 'uraian', e.target.value)}
                    />
                  ) : (
                    tx.uraian
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {editingId === tx.id ? (
                    <input
                      type="number"
                      className="block w-full text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={tx.penerimaan}
                      onChange={(e) => handleInputChange(tx.id, 'penerimaan', e.target.value)}
                    />
                  ) : (
                    Number(tx.penerimaan || 0).toLocaleString('id-ID')
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {editingId === tx.id ? (
                    <input
                      type="number"
                      className="block w-full text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={tx.pengeluaran}
                      onChange={(e) => handleInputChange(tx.id, 'pengeluaran', e.target.value)}
                    />
                  ) : (
                    Number(tx.pengeluaran || 0).toLocaleString('id-ID')
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  {calculateRunningBalance(index).toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {editingId === tx.id ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="text-green-600 hover:text-green-900"
                          title="Simpan"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-red-600 hover:text-red-900"
                          title="Batal"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(tx.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
