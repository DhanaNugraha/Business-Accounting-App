import { useState, useEffect, useCallback } from 'react';
import { TransactionItem } from '@/types';
import { TrashIcon, PlusIcon, CheckIcon as CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TransactionEditorProps {
  transactions: TransactionItem[];
  onSave: (transactions: TransactionItem[]) => void;
  accountName: string;
}

export const TransactionEditor = ({ transactions, onSave, accountName }: TransactionEditorProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editedTransactions, setEditedTransactions] = useState<TransactionItem[]>(transactions);
  const [simpleForm, setSimpleForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    uraian: '',
    jumlah: '',
    tipe: 'penerimaan' as 'penerimaan' | 'pengeluaran',
    kategori: ''
  });

  // Extract unique categories from existing transactions
  const getExistingCategories = useCallback(() => {
    const categories = new Set<string>();
    
    editedTransactions.forEach(tx => {
      Object.keys(tx.penerimaan || {}).forEach(cat => categories.add(cat));
      Object.keys(tx.pengeluaran || {}).forEach(cat => categories.add(cat));
    });
    
    return Array.from(categories).sort();
  }, [editedTransactions]);
  
  const existingCategories = getExistingCategories();

  // Update local state when transactions prop changes
  useEffect(() => {
    setEditedTransactions(transactions);
  }, [transactions]);

  const handleSave = () => {
    console.log('Save button clicked');
    if (editedTransactions.length > 0) {
      console.log('Saving all transactions:', editedTransactions);
      onSave(editedTransactions);
    } else {
      console.log('No transactions to save');
    }
  };

  const handleDelete = (id: string) => {
    const updated = editedTransactions.filter(t => t.id !== id);
    setEditedTransactions(updated);
    onSave(updated);
  };

  // Handle input change for simple form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSimpleForm(prev => ({
      ...prev,
      [name]: name === 'jumlah' ? value.replace(/\D/g, '') : value
    }));
  };

  // Format currency
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Number(value) || 0);
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

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{accountName} Transactions</h2>
        <div className="space-x-2">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <CheckCircleIcon className="-ml-1 mr-2 h-5 w-5" />
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isAdding ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
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
                    name="tanggal"
                    className="block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2"
                    value={simpleForm.tanggal}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <select
                    name="tipe"
                    className="block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2"
                    value={simpleForm.tipe}
                    onChange={handleInputChange}
                  >
                    <option value="penerimaan">Penerimaan</option>
                    <option value="pengeluaran">Pengeluaran</option>
                  </select>
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="kategori"
                      list="categoryOptions"
                      className="block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 pr-8 appearance-none"
                      value={simpleForm.kategori}
                      onChange={handleInputChange}
                      placeholder="Pilih atau ketik baru"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <datalist id="categoryOptions">
                      {existingCategories.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                  </div>
                </div>
                
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uraian</label>
                  <input
                    type="text"
                    name="uraian"
                    className="block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2"
                    value={simpleForm.uraian}
                    onChange={handleInputChange}
                    placeholder="Deskripsi transaksi"
                    required
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      Rp
                    </span>
                    <input
                      type="text"
                      name="jumlah"
                      className="block w-full min-w-0 flex-1 bg-white border border-gray-300 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
                      value={simpleForm.jumlah}
                      onChange={handleInputChange}
                      placeholder="0"
                      required
                    />
                  </div>
                  {simpleForm.jumlah && (
                    <p className="mt-1 text-xs text-gray-500">
                      {formatCurrency(simpleForm.jumlah)}
                    </p>
                  )}
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
                  {new Date(tx.tanggal).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 min-w-[200px]">
                  <div className="break-words">{tx.uraian}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 w-48">
                  {Object.entries(tx.penerimaan || {}).map(([category, amount]) => (
                    <div key={category} className="text-right">
                      {category}: {formatCurrency(amount.toString())}
                    </div>
                  ))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 w-48">
                  {Object.entries(tx.pengeluaran || {}).map(([category, amount]) => (
                    <div key={category} className="text-right">
                      {category}: {formatCurrency(amount.toString())}
                    </div>
                  ))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 w-32">
                  {formatCurrency(tx.saldo?.toString() || '0')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Hapus transaksi"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
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
