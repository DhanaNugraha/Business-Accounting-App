import { useState, useEffect, useCallback } from 'react';
import { TransactionItem } from '@/types';
import { TrashIcon, PlusIcon, CheckIcon as CheckCircleIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { validateTransaction, getNumberValidationError, getDateValidationError, getCategoryNameError } from '@/utils/validators';
import { toast } from 'react-hot-toast';

interface SimpleFormData {
  id?: string;
  tanggal: string;
  tipe: 'penerimaan' | 'pengeluaran';
  kategori: string;
  uraian: string;
  jumlah: string;
}

interface TransactionEditorProps {
  transactions: TransactionItem[];
  onSave: (transactions: TransactionItem[]) => void;
  accountName: string;
}

export const TransactionEditor = ({ transactions, onSave, accountName }: TransactionEditorProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editedTransactions, setEditedTransactions] = useState<TransactionItem[]>(transactions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string | null}>({ isOpen: false, id: null });
  const [simpleForm, setSimpleForm] = useState<SimpleFormData>({
    tanggal: new Date().toISOString().split('T')[0],
    uraian: '',
    jumlah: '',
    tipe: 'penerimaan',
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
    if (editedTransactions.length === 0) {
      toast.error('Tidak ada transaksi untuk disimpan');
      return;
    }
    
    // Validate all transactions
    const allErrors: Record<string, string> = {};
    let hasErrors = false;
    
    editedTransactions.forEach((tx, index) => {
      const { isValid, errors: txErrors } = validateTransaction(tx);
      if (!isValid) {
        hasErrors = true;
        Object.entries(txErrors).forEach(([field, error]) => {
          allErrors[`${index}_${field}`] = error;
        });
      }
    });
    
    if (hasErrors) {
      setErrors(allErrors);
      toast.error('Terdapat kesalahan pada data transaksi. Silakan periksa kembali.');
      return;
    }
    
    onSave(editedTransactions);
    setErrors({});
    toast.success('Transaksi berhasil disimpan');
  };

  // Handles opening the delete confirmation dialog
  const confirmDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const handleEdit = (id: string) => {
    const transaction = editedTransactions.find(tx => tx.id === id);
    if (transaction) {
      // Get the first category from either penerimaan or pengeluaran
      const firstCategory = Object.keys(transaction.penerimaan || {})[0] || 
                           Object.keys(transaction.pengeluaran || {})[0] || '';
      
      // Get the amount from the first category
      const amount = (transaction.penerimaan?.[firstCategory] || 
                     transaction.pengeluaran?.[firstCategory] || 0).toString();
      
      // Determine the type based on which object has values
      const type = Object.keys(transaction.penerimaan || {}).length > 0 ? 'penerimaan' : 'pengeluaran';
      
      setSimpleForm({
        id: transaction.id,
        tanggal: transaction.tanggal,
        tipe: type,
        kategori: firstCategory,
        uraian: transaction.uraian || '',
        jumlah: amount,
      });
      setEditingId(id);
      setIsAdding(true);
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirm.id) return;
    
    const updated = editedTransactions.filter(t => t.id !== deleteConfirm.id);
    setEditedTransactions(updated);
    onSave(updated);
    setDeleteConfirm({ isOpen: false, id: null });
    toast.success('Transaksi berhasil dihapus');
  };

  // Handle input change for simple form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear any existing error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setSimpleForm(prev => ({
      ...prev,
      [name]: name === 'jumlah' ? value.replace(/\D/g, '') : value
    }));
  };
  
  // Handle date input with validation
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const error = getDateValidationError(value);
    
    setSimpleForm(prev => ({
      ...prev,
      tanggal: value
    }));
    
    if (error) {
      setErrors(prev => ({
        ...prev,
        tanggal: error
      }));
    } else if (errors.tanggal) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.tanggal;
        return newErrors;
      });
    }
  };

  // Format currency
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate required fields
    const newErrors: Record<string, string> = {};
    
    // Validate date
    const dateError = getDateValidationError(simpleForm.tanggal);
    if (dateError) newErrors.tanggal = dateError;
    
    // Validate description
    if (!simpleForm.uraian.trim()) {
      newErrors.uraian = 'Uraian tidak boleh kosong';
    }
    
    // Validate amount
    const amountError = getNumberValidationError(simpleForm.jumlah, 'Jumlah');
    if (amountError) newErrors.jumlah = amountError;
    
    // Validate category if custom category is used
    if (!simpleForm.kategori && !existingCategories.includes(simpleForm.kategori)) {
      const categoryError = getCategoryNameError(simpleForm.kategori);
      if (categoryError) newErrors.kategori = categoryError;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Terdapat kesalahan pada form. Silakan periksa kembali.');
      return;
    }

    const txData: Omit<TransactionItem, 'id'> = {
      tanggal: simpleForm.tanggal,
      uraian: simpleForm.uraian,
      penerimaan: {},
      pengeluaran: {},
      saldo: 0
    };

    if (simpleForm.tipe === 'penerimaan') {
      txData.penerimaan = { [simpleForm.kategori || 'Lainnya']: Number(simpleForm.jumlah) };
    } else {
      txData.pengeluaran = { [simpleForm.kategori || 'Lainnya']: Number(simpleForm.jumlah) };
    }

    const penerimaanTotal = Object.values(txData.penerimaan).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const pengeluaranTotal = Object.values(txData.pengeluaran).reduce((sum, val) => sum + (Number(val) || 0), 0);
    txData.saldo = penerimaanTotal - pengeluaranTotal;

    let updated: TransactionItem[];
    if (editingId) {
      // Update existing transaction
      updated = editedTransactions.map(tx => 
        tx.id === editingId ? { ...txData, id: editingId } : tx
      );
      setEditingId(null);
    } else {
      // Add new transaction
      const newTx: TransactionItem = {
        ...txData,
        id: `tx-${Date.now()}`
      };
      updated = [...editedTransactions, newTx];
    }

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
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Hapus Transaksi"
        message="Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        isDanger
      />
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
        <div className="bg-blue-50 p-3 rounded shadow-sm mb-4 border border-blue-100 overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-900">
              {editingId ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
            </h3>
            <button
              onClick={() => setIsAdding(false)}
              className="text-gray-500 hover:text-gray-700"
              title="Tutup form"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          
          <form onSubmit={handleSaveTransaction} className="bg-white p-3 rounded border border-gray-200 max-w-full">
            {/* First Row */}
            <div className="grid grid-cols-12 gap-3 mb-3">
              {/* Tanggal */}
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  name="tanggal"
                  value={simpleForm.tanggal}
                  onChange={handleDateChange}
                  className={`block w-full rounded-md border ${
                    errors.tanggal ? 'border-red-500' : 'border-gray-300'
                  } shadow-sm text-sm h-9 px-2 bg-white`}
                  aria-invalid={!!errors.tanggal}
                />
                {errors.tanggal && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.tanggal}
                  </p>
                )}
              </div>
              
              {/* Tipe */}
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                <select
                  name="tipe"
                  value={simpleForm.tipe}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 h-9"
                >
                  <option value="penerimaan">Penerimaan</option>
                  <option value="pengeluaran">Pengeluaran</option>
                </select>
              </div>
              
              {/* Kategori */}
              <div className="col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <div className="flex">
                  <select
                    name="kategori"
                    value={simpleForm.kategori}
                    onChange={handleInputChange}
                    className={`block w-1/2 rounded-l-md border border-r-0 border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 h-9 bg-white ${
                      errors.kategori ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="" disabled hidden>Pilih Kategori</option>
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="kategori"
                    value={!existingCategories.includes(simpleForm.kategori) ? simpleForm.kategori : ''}
                    onChange={handleInputChange}
                    placeholder="Ketik kategori baru"
                    className={`block w-1/2 rounded-r-md border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 h-9 ${
                      errors.kategori ? 'border-red-500' : 'border-l-0'
                    }`}
                    aria-invalid={!!errors.kategori}
                  />
                </div>
                {errors.kategori && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.kategori}
                  </p>
                )}
              </div>
            </div>
            
            {/* Second Row */}
            <div className="grid grid-cols-12 gap-3 items-end">
              {/* Uraian */}
              <div className="col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Uraian</label>
                <input
                  type="text"
                  name="uraian"
                  value={simpleForm.uraian}
                  onChange={handleInputChange}
                  className={`block w-full rounded-md border ${
                    errors.uraian ? 'border-red-500' : 'border-gray-300'
                  } shadow-sm text-sm h-9 px-3`}
                  placeholder="Deskripsi transaksi"
                  aria-invalid={!!errors.uraian}
                />
                {errors.uraian && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.uraian}
                  </p>
                )}
              </div>
              
              {/* Jumlah */}
              <div className="col-span-4">
                <div className="min-h-[72px] flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">Rp</span>
                    </div>
                    <input
                      type="text"
                      name="jumlah"
                      value={simpleForm.jumlah}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 rounded-md border ${
                        errors.jumlah ? 'border-red-500' : 'border-gray-300'
                      } shadow-sm text-sm h-9 pr-2`}
                      placeholder="0"
                      aria-invalid={!!errors.jumlah}
                    />
                  </div>
                  {errors.jumlah ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.jumlah}
                    </p>
                  ) : simpleForm.jumlah ? (
                    <p className="text-xs text-gray-500 h-4 mt-1">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(simpleForm.jumlah.replace(/\D/g, '')) || 0)}
                    </p>
                  ) : <div className="h-4"></div>}
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="col-span-3 flex items-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 h-9 w-full"
                >
                  {editingId ? 'Update' : 'Tambah'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto max-w-full">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow-sm border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Tanggal</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] max-w-[200px]">Uraian</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Penerimaan</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Pengeluaran</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Saldo</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {editedTransactions.map((tx, index) => (
                  <tr key={tx.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>                    
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {new Date(tx.tanggal).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit'
                      }).replace(/\s/g, ' ')}
                    </td>
                    
                    <td className="px-3 py-2 text-xs text-gray-900 max-w-[200px]">
                      <div className="break-words line-clamp-2">{tx.uraian}</div>
                    </td>
                    
                    <td className="px-3 py-2 whitespace-nowrap text-right text-xs text-gray-900">
                      {Object.entries(tx.penerimaan || {}).map(([category, amount]) => (
                        <div key={category} className="text-right">
                          <span className="text-xs text-gray-500">{category}:</span> {formatCurrency(amount.toString())}
                        </div>
                      ))}
                    </td>
                    
                    <td className="px-3 py-2 whitespace-nowrap text-right text-xs text-gray-900">
                      {Object.entries(tx.pengeluaran || {}).map(([category, amount]) => (
                        <div key={category} className="text-right">
                          <span className="text-xs text-gray-500">{category}:</span> {formatCurrency(amount.toString())}
                        </div>
                      ))}
                    </td>
                    
                    <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium text-gray-900">
                      {formatCurrency(tx.saldo?.toString() || '0')}
                    </td>
                    
                    <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium space-x-1">
                      <button
                        onClick={() => handleEdit(tx.id)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit"
                      >
                        <PencilIcon className="h-3.5 w-3.5 inline" />
                      </button>
                      <button
                        onClick={() => confirmDeleteClick(tx.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Hapus"
                      >
                        <TrashIcon className="h-3.5 w-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionEditor;
