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
  const [newTransaction, setNewTransaction] = useState<Partial<TransactionItem>>({
    penerimaan: {},
    pengeluaran: {}
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newPenerimaan, setNewPenerimaan] = useState({ category: '', amount: '' });
  const [newPengeluaran, setNewPengeluaran] = useState({ category: '', amount: '' });

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
    
    const penerimaanTotal = Object.values(newTransaction.penerimaan || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const pengeluaranTotal = Object.values(newTransaction.pengeluaran || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
    
    const newTx: TransactionItem = {
      id: Date.now().toString(),
      tanggal: newTransaction.tanggal,
      uraian: newTransaction.uraian,
      penerimaan: { ...newTransaction.penerimaan },
      pengeluaran: { ...newTransaction.pengeluaran },
      saldo: penerimaanTotal - pengeluaranTotal
    };

    const updated = [...editedTransactions, newTx];
    setEditedTransactions(updated);
    setNewTransaction({ penerimaan: {}, pengeluaran: {} });
    setIsAdding(false);
    onSave(updated);
  };

  const handleInputChange = (id: string, field: keyof Omit<TransactionItem, 'penerimaan' | 'pengeluaran'>, value: string) => {
    setEditedTransactions(prev => 
      prev.map(tx => 
        tx.id === id ? { ...tx, [field]: value } : tx
      )
    );
  };

  const handlePenerimaanChange = (id: string, category: string, value: string) => {
    setEditedTransactions(prev => 
      prev.map(tx => {
        if (tx.id !== id) return tx;
        const newPenerimaan = { ...tx.penerimaan };
        if (value === '') {
          delete newPenerimaan[category];
        } else {
          newPenerimaan[category] = Number(value) || 0;
        }
        return { ...tx, penerimaan: newPenerimaan };
      })
    );
  };

  const handlePengeluaranChange = (id: string, category: string, value: string) => {
    setEditedTransactions(prev => 
      prev.map(tx => {
        if (tx.id !== id) return tx;
        const newPengeluaran = { ...tx.pengeluaran };
        if (value === '') {
          delete newPengeluaran[category];
        } else {
          newPengeluaran[category] = Number(value) || 0;
        }
        return { ...tx, pengeluaran: newPengeluaran };
      })
    );
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    {Object.entries(newTransaction.penerimaan || {}).map(([category, amount]) => (
                      <div key={category} className="flex items-center space-x-2">
                        <span className="text-sm">{category}:</span>
                        <input
                          type="number"
                          className="block w-24 text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={amount}
                          onChange={(e) => setNewTransaction({
                            ...newTransaction,
                            penerimaan: {
                              ...newTransaction.penerimaan,
                              [category]: Number(e.target.value) || 0
                            }
                          })}
                          placeholder="0"
                        />
                        <button
                          onClick={() => {
                            const { [category]: _, ...rest } = newTransaction.penerimaan || {};
                            setNewTransaction({
                              ...newTransaction,
                              penerimaan: rest
                            });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={newPenerimaan.category}
                        onChange={(e) => setNewPenerimaan({...newPenerimaan, category: e.target.value})}
                        placeholder="Kategori"
                      />
                      <input
                        type="number"
                        className="block w-24 text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={newPenerimaan.amount}
                        onChange={(e) => setNewPenerimaan({...newPenerimaan, amount: e.target.value})}
                        placeholder="Jumlah"
                      />
                      <button
                        onClick={() => {
                          if (newPenerimaan.category && newPenerimaan.amount) {
                            setNewTransaction({
                              ...newTransaction,
                              penerimaan: {
                                ...newTransaction.penerimaan,
                                [newPenerimaan.category]: Number(newPenerimaan.amount)
                              }
                            });
                            setNewPenerimaan({ category: '', amount: '' });
                          }
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    {Object.entries(newTransaction.pengeluaran || {}).map(([category, amount]) => (
                      <div key={category} className="flex items-center space-x-2">
                        <span className="text-sm">{category}:</span>
                        <input
                          type="number"
                          className="block w-24 text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={amount}
                          onChange={(e) => setNewTransaction({
                            ...newTransaction,
                            pengeluaran: {
                              ...newTransaction.pengeluaran,
                              [category]: Number(e.target.value) || 0
                            }
                          })}
                          placeholder="0"
                        />
                        <button
                          onClick={() => {
                            const { [category]: _, ...rest } = newTransaction.pengeluaran || {};
                            setNewTransaction({
                              ...newTransaction,
                              pengeluaran: rest
                            });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={newPengeluaran.category}
                        onChange={(e) => setNewPengeluaran({...newPengeluaran, category: e.target.value})}
                        placeholder="Kategori"
                      />
                      <input
                        type="number"
                        className="block w-24 text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={newPengeluaran.amount}
                        onChange={(e) => setNewPengeluaran({...newPengeluaran, amount: e.target.value})}
                        placeholder="Jumlah"
                      />
                      <button
                        onClick={() => {
                          if (newPengeluaran.category && newPengeluaran.amount) {
                            setNewTransaction({
                              ...newTransaction,
                              pengeluaran: {
                                ...newTransaction.pengeluaran,
                                [newPengeluaran.category]: Number(newPengeluaran.amount)
                              }
                            });
                            setNewPengeluaran({ category: '', amount: '' });
                          }
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  {(
                    (Object.values(newTransaction.penerimaan || {}).reduce((sum, val) => sum + (Number(val) || 0), 0) -
                     Object.values(newTransaction.pengeluaran || {}).reduce((sum, val) => sum + (Number(val) || 0), 0))
                    .toLocaleString('id-ID')
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    {editingId === tx.id ? (
                      <>
                        {Object.entries(tx.penerimaan || {}).map(([category, amount]) => (
                          <div key={category} className="flex items-center space-x-2">
                            <span className="text-sm">{category}:</span>
                            <input
                              type="number"
                              className="block w-24 text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={amount}
                              onChange={(e) => handlePenerimaanChange(tx.id, category, e.target.value)}
                              placeholder="0"
                            />
                            <button
                              onClick={() => handlePenerimaanChange(tx.id, category, '')}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={newPenerimaan.category}
                            onChange={(e) => setNewPenerimaan({...newPenerimaan, category: e.target.value})}
                            placeholder="Kategori"
                          />
                          <input
                            type="number"
                            className="block w-24 text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={newPenerimaan.amount}
                            onChange={(e) => setNewPenerimaan({...newPenerimaan, amount: e.target.value})}
                            placeholder="Jumlah"
                          />
                          <button
                            onClick={() => {
                              if (newPenerimaan.category && newPenerimaan.amount) {
                                handlePenerimaanChange(tx.id, newPenerimaan.category, newPenerimaan.amount);
                                setNewPenerimaan({ category: '', amount: '' });
                              }
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(tx.penerimaan || {}).map(([category, amount]) => (
                          <div key={category} className="flex justify-between">
                            <span className="text-sm">{category}:</span>
                            <span>{Number(amount).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    {editingId === tx.id ? (
                      <>
                        {Object.entries(tx.pengeluaran || {}).map(([category, amount]) => (
                          <div key={category} className="flex items-center space-x-2">
                            <span className="text-sm">{category}:</span>
                            <input
                              type="number"
                              className="block w-24 text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={amount}
                              onChange={(e) => handlePengeluaranChange(tx.id, category, e.target.value)}
                              placeholder="0"
                            />
                            <button
                              onClick={() => handlePengeluaranChange(tx.id, category, '')}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={newPengeluaran.category}
                            onChange={(e) => setNewPengeluaran({...newPengeluaran, category: e.target.value})}
                            placeholder="Kategori"
                          />
                          <input
                            type="number"
                            className="block w-24 text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={newPengeluaran.amount}
                            onChange={(e) => setNewPengeluaran({...newPengeluaran, amount: e.target.value})}
                            placeholder="Jumlah"
                          />
                          <button
                            onClick={() => {
                              if (newPengeluaran.category && newPengeluaran.amount) {
                                handlePengeluaranChange(tx.id, newPengeluaran.category, newPengeluaran.amount);
                                setNewPengeluaran({ category: '', amount: '' });
                              }
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(tx.pengeluaran || {}).map(([category, amount]) => (
                          <div key={category} className="flex justify-between">
                            <span className="text-sm">{category}:</span>
                            <span>{Number(amount).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  {(
                    (Object.values(tx.penerimaan || {}).reduce((sum, val) => sum + (Number(val) || 0), 0) -
                     Object.values(tx.pengeluaran || {}).reduce((sum, val) => sum + (Number(val) || 0), 0))
                    .toLocaleString('id-ID')
                  )}
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
