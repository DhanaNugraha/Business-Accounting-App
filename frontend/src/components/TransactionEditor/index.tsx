import { useState, useEffect } from 'react';
import { TransactionItem } from '@/types';
import { PencilIcon, TrashIcon, PlusIcon, CheckIcon as CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TransactionEditorProps {
  transactions: TransactionItem[];
  onSave: (transactions: TransactionItem[]) => void;
  accountName: string;
}

export const TransactionEditor = ({ transactions, onSave, accountName }: TransactionEditorProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTransactions, setEditedTransactions] = useState<TransactionItem[]>(transactions);
  const [isAdding, setIsAdding] = useState(false);
  const [newPenerimaan, setNewPenerimaan] = useState({ category: '', amount: '' });
  const [newPengeluaran, setNewPengeluaran] = useState({ category: '', amount: '' });
  const [simpleForm, setSimpleForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    uraian: '',
    jumlah: '',
    tipe: 'penerimaan',
    kategori: ''
  });

  // Update local state when transactions prop changes
  useEffect(() => {
    setEditedTransactions(transactions);
  }, [transactions]);

  const handleEdit = (id: string) => {
    console.log('Edit button clicked for transaction ID:', id);
    const transactionToEdit = editedTransactions.find(tx => tx.id === id);
    console.log('Transaction to edit:', transactionToEdit);
    if (transactionToEdit) {
      setNewPenerimaan({ category: '', amount: '' });
      setNewPengeluaran({ category: '', amount: '' });
      setEditingId(id);
      console.log('Editing ID set to:', id);
    } else {
      console.error('Transaction not found for ID:', id);
    }
  };

  const handleSave = () => {
    console.log('Save button clicked');
    if (editedTransactions.length > 0) {
      console.log('Saving all transactions:', editedTransactions);
      onSave(editedTransactions);
      setEditingId(null);
    } else {
      console.log('No transactions to save');
    }
  };

  const handleDelete = (id: string) => {
    const updated = editedTransactions.filter(t => t.id !== id);
    setEditedTransactions(updated);
    onSave(updated);
  };

  const handleSimpleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Simple form submitted:', simpleForm);
    
    if (!simpleForm.tanggal || !simpleForm.uraian || !simpleForm.jumlah) {
      console.error('Missing required fields');
      return;
    }

    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      tanggal: simpleForm.tanggal,
      uraian: simpleForm.uraian,
      penerimaan: {},
      pengeluaran: {},
      saldo: 0
    };

    if (simpleForm.tipe === 'penerimaan') {
      newTx.penerimaan = { [simpleForm.kategori || 'Lainnya']: Number(simpleForm.jumlah) };
    } else {
      newTx.pengeluaran = { [simpleForm.kategori || 'Lainnya']: Number(simpleForm.jumlah) };
    }

    const penerimaanTotal = Object.values(newTx.penerimaan).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const pengeluaranTotal = Object.values(newTx.pengeluaran).reduce((sum, val) => sum + (Number(val) || 0), 0);
    newTx.saldo = penerimaanTotal - pengeluaranTotal;

    const updated = [...editedTransactions, newTx];
    setEditedTransactions(updated);
    // Save the updated transactions to the parent component
    onSave(updated);
    
    // Reset the form
    setSimpleForm({
      tanggal: new Date().toISOString().split('T')[0],
      uraian: '',
      jumlah: '',
      tipe: 'penerimaan',
      kategori: ''
    });
    
    setIsAdding(false);
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
    <div className="bg-white shadow rounded-lg p-6">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{accountName} Transactions</h2>
        <div className="space-x-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Save button clicked directly');
              handleSave();
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <CheckCircleIcon className="-ml-1 mr-2 h-5 w-5" />
            Save Changes
          </button>
          <button
            onClick={() => {
              console.log('Add Transaction button clicked');
              setIsAdding(!isAdding);
              setEditingId(null);
              console.log('Toggling transaction form');
            }}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isAdding ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            {isAdding ? 'Sembunyikan Form' : 'Tambah Transaksi'}
          </button>
        </div>
      </div>
      
      {/* Transaction Form */}
      {isAdding && (
        <div className="bg-blue-50 p-4 sm:p-6 rounded-lg shadow-sm mb-6 border border-blue-100 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Tambah Transaksi Baru</h3>
            <button
              onClick={() => setIsAdding(false)}
              className="text-gray-500 hover:text-gray-700"
              title="Tutup form"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSimpleAdd}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2"
                    value={simpleForm.tanggal}
                    onChange={(e) => setSimpleForm({...simpleForm, tanggal: e.target.value})}
                    required
                  />
                </div>
                
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uraian</label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2"
                    value={simpleForm.uraian}
                    onChange={(e) => setSimpleForm({...simpleForm, uraian: e.target.value})}
                    placeholder="Deskripsi transaksi"
                    required
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2"
                    value={simpleForm.tipe}
                    onChange={(e) => setSimpleForm({...simpleForm, tipe: e.target.value as 'penerimaan' | 'pengeluaran'})}
                  >
                    <option value="penerimaan">Penerimaan</option>
                    <option value="pengeluaran">Pengeluaran</option>
                  </select>
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2"
                    value={simpleForm.kategori}
                    onChange={(e) => setSimpleForm({...simpleForm, kategori: e.target.value})}
                    placeholder="Kategori"
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      Rp
                    </span>
                    <input
                      type="number"
                      className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
                      value={simpleForm.jumlah}
                      onChange={(e) => setSimpleForm({...simpleForm, jumlah: e.target.value})}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="lg:col-span-1 flex items-end">
                  <button
                    type="submit"
                    className="w-full h-10 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <PlusIcon className="h-4 w-4 sm:mr-1.5" />
                    <span className="text-xs sm:text-sm">Tambah</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

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
            
            {editedTransactions.map((tx, index) => (
              <tr key={tx.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-32">
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
                <td className="px-6 py-4 text-sm text-gray-900 min-w-[200px]">
                  {editingId === tx.id ? (
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={tx.uraian}
                      onChange={(e) => handleInputChange(tx.id, 'uraian', e.target.value)}
                    />
                  ) : (
                    <div className="break-words">{tx.uraian}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 w-48">
                  <div className="space-y-2">
                    {editingId === tx.id ? (
                      <>
                        {Object.entries(tx.penerimaan || {}).map(([category, amount]) => (
                          <div key={category} className="flex items-center justify-end space-x-2">
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
                        <div className="flex items-center justify-end space-x-2">
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
                      <div className="space-y-1 text-right">
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
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 w-48">
                  <div className="space-y-2">
                    {editingId === tx.id ? (
                      <>
                        {Object.entries(tx.pengeluaran || {}).map(([category, amount]) => (
                          <div key={category} className="flex items-center justify-end space-x-2">
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
                        <div className="flex items-center justify-end space-x-2">
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
                      <div className="space-y-1 text-right">
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
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 w-32">
                  {Number(tx.saldo || 0).toLocaleString('id-ID')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium w-24">
                  <div className="flex justify-end">
                    {editingId === tx.id ? (
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSave();
                          }}
                          className="text-green-600 hover:text-green-900 p-0.5 rounded-full hover:bg-green-100"
                          title="Simpan"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingId(null);
                          }}
                          className="text-red-600 hover:text-red-900 p-0.5 rounded-full hover:bg-red-100"
                          title="Batal"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(tx.id)}
                          className="text-blue-600 hover:text-blue-900 p-0.5 rounded-full hover:bg-blue-100"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="text-red-600 hover:text-red-900 p-0.5 rounded-full hover:bg-red-100"
                          title="Hapus"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
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

export default TransactionEditor;