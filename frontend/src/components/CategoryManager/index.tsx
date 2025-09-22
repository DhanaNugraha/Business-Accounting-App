import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { PlusIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

export const CategoryManager = () => {
  const { state, dispatch } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'pengeluaran' as 'penerimaan' | 'pengeluaran'
  });
  const [formErrors, setFormErrors] = useState({
    name: ''
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: '' };

    if (!formData.name.trim()) {
      newErrors.name = 'Nama kategori tidak boleh kosong';
      isValid = false;
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nama kategori minimal 3 karakter';
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleAddCategory = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const newCategory = {
        id: uuidv4(),
        name: formData.name.trim(),
        type: formData.type
      };

      dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
      setFormData({ name: '', type: 'pengeluaran' });
      setIsAdding(false);
      toast.success('Kategori berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Gagal menambahkan kategori');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (id: string, newName?: string) => {
    // Use the provided newName or fall back to formData.name
    const nameToUse = newName || formData.name.trim();
    
    // Don't proceed if the name is empty
    if (!nameToUse) {
      setFormErrors({ ...formErrors, name: 'Nama kategori tidak boleh kosong' });
      return;
    }
    
    if (nameToUse.length < 3) {
      setFormErrors({ ...formErrors, name: 'Nama kategori minimal 3 karakter' });
      return;
    }
    
    setIsLoading(true);
    
    // Check if we're updating a context category (has ID) or a transaction category (prefixed with 'tx-')
    const isTransactionCategory = id.startsWith('tx-');
    const oldName = isTransactionCategory ? id.substring(3) : null;
    
    // Find the category in context (if it exists)
    const contextCategory = isTransactionCategory ? null : state.categories.find(cat => cat.id === id);
    
    // For transaction categories, we need to update all transactions that use this category
    if (isTransactionCategory && oldName) {
      // Check if the name is actually being changed
      if (oldName === nameToUse) {
        // If the name hasn't changed, just cancel editing
        setEditingId(null);
        setFormData({ name: '', type: 'pengeluaran' });
        setFormErrors({ name: '' });
        setIsLoading(false);
        return;
      }
      
      // Check if the new name already exists in context categories
      const nameExistsInContext = state.categories.some(
        cat => cat.name.toLowerCase() === nameToUse.toLowerCase()
      );
      
      if (nameExistsInContext) {
        toast.error('Kategori dengan nama yang sama sudah ada di daftar kategori');
        setIsLoading(false);
        return;
      }
      
      // Check if there are any transactions using this category
      const hasTransactions = state.accounts.some(account => 
        account.transactions.some(tx => 
          (tx.penerimaan && oldName in tx.penerimaan) || 
          (tx.pengeluaran && oldName in tx.pengeluaran)
        )
      );
      
      if (!hasTransactions) {
        // If no transactions are using this category, just cancel editing
        setEditingId(null);
        setFormData({ name: '', type: 'pengeluaran' });
        setFormErrors({ name: '' });
        setIsLoading(false);
        return;
      }
      
      // Update all transactions that use this category
      const updatedAccounts = state.accounts.map(account => {
        const updatedTransactions = account.transactions.map(tx => {
          // Create a deep copy of the transaction
          const updatedTx = { 
            ...tx,
            penerimaan: { ...(tx.penerimaan || {}) },
            pengeluaran: { ...(tx.pengeluaran || {}) }
          };
          
          // Handle penerimaan
          if (updatedTx.penerimaan && oldName in updatedTx.penerimaan) {
            // Move the value to the new category name
            updatedTx.penerimaan[nameToUse] = updatedTx.penerimaan[oldName];
            // Remove the old category name
            delete updatedTx.penerimaan[oldName];
          }
          
          // Handle pengeluaran
          if (updatedTx.pengeluaran && oldName in updatedTx.pengeluaran) {
            // Move the value to the new category name
            updatedTx.pengeluaran[nameToUse] = updatedTx.pengeluaran[oldName];
            // Remove the old category name
            delete updatedTx.pengeluaran[oldName];
          }
          
          return updatedTx;
        });
        
        return {
          ...account,
          transactions: updatedTransactions
        };
      });
      
      // Update the accounts in the state
      updatedAccounts.forEach(account => {
        dispatch({ 
          type: 'UPDATE_ACCOUNT', 
          payload: { 
            accountName: account.name, 
            transactions: account.transactions 
          } 
        });
      });
      
      setEditingId(null);
      setFormData({ name: '', type: 'pengeluaran' });
      setFormErrors({ name: '' });
      toast.success('Kategori transaksi berhasil diperbarui');
      setIsLoading(false);
      return;
    }
    
    // For context categories
    if (contextCategory) {
      // Check if a category with the same name already exists (case insensitive)
      const nameExists = state.categories.some(
        cat => 
          cat.id !== id && 
          cat.name.toLowerCase() === nameToUse.toLowerCase()
      );

      if (nameExists) {
        toast.error('Kategori dengan nama yang sama sudah ada');
        setIsLoading(false);
        return;
      }

      const updatedCategory = {
        ...contextCategory,
        name: nameToUse,
        type: formData.type
      };

      dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
      setEditingId(null);
      setFormData({ name: '', type: 'pengeluaran' });
      setFormErrors({ name: '' });
      toast.success('Kategori berhasil diperbarui');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      setIsLoading(true);
      try {
        dispatch({ type: 'REMOVE_CATEGORY', payload: { id } });
        toast.success('Kategori berhasil dihapus');
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Gagal menghapus kategori');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const startEditing = (category: any) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      type: category.type
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormData({ name: '', type: 'pengeluaran' });
  };

  // Get categories from both context and current account's transactions
  const getCategories = (type: 'penerimaan' | 'pengeluaran') => {
    // Get categories from context
    const contextCategories = state.categories
      .filter(cat => cat.type === type)
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type,
        fromContext: true
      }));

    // Get current account's transactions
    const currentAccount = state.accounts.find(acc => acc.name === state.currentAccount);
    const transactionCategories = new Set<string>();
    
    // Only process transactions if we have a current account
    if (currentAccount) {
      currentAccount.transactions.forEach(tx => {
        const categories = type === 'penerimaan' ? tx.penerimaan : tx.pengeluaran;
        Object.keys(categories || {}).forEach(catName => {
          transactionCategories.add(catName);
        });
      });
    }

    // Convert transaction categories to the same format
    const transactionCategoriesArray = Array.from(transactionCategories).map(name => ({
      id: `tx-${name}`, // Prefix to avoid conflicts with context categories
      name,
      type,
      fromContext: false
    }));

    // Combine and remove duplicates (prioritize context categories)
    const allCategories = [...contextCategories];
    const existingNames = new Set(contextCategories.map(c => c.name));
    
    transactionCategoriesArray.forEach(cat => {
      if (!existingNames.has(cat.name)) {
        allCategories.push(cat);
        existingNames.add(cat.name);
      }
    });

    return allCategories;
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kelola Kategori</h2>
          <p className="text-sm text-gray-500 mt-1">Tambah, edit, atau hapus kategori penerimaan dan pengeluaran</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            setFormData({ name: '', type: 'pengeluaran' });
            setFormErrors({ name: '' });
          }}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 text-sm font-medium shadow-sm w-full sm:w-auto justify-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              {isAdding ? 'Batal' : 'Tambah Kategori'}
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tambah Kategori Baru</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({...formData, name: e.target.value});
                  if (formErrors.name) setFormErrors({...formErrors, name: ''});
                }}
                className={`mt-1 block w-full rounded-lg border ${
                  formErrors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } shadow-sm py-2 px-3 text-sm`}
                placeholder="Contoh: Gaji, Belanja, dll."
                disabled={isLoading}
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Transaksi</label>
              <div className="mt-1 relative">
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'penerimaan' | 'pengeluaran'})}
                  className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="pengeluaran">Pengeluaran</option>
                  <option value="penerimaan">Penerimaan</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isLoading}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!formData.name.trim() || isLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  !formData.name.trim() || isLoading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Menyimpan...
                  </span>
                ) : (
                  'Simpan Kategori'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Penerimaan Categories */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-700 flex items-center">
              <span className="w-2 h-5 bg-green-500 rounded-full mr-2"></span>
              Penerimaan
            </h3>
            <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
              {getCategories('penerimaan').length} kategori
            </span>
          </div>
          
          {getCategories('penerimaan').length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <p>Belum ada kategori penerimaan</p>
              <button
                onClick={() => {
                  setIsAdding(true);
                  setFormData({...formData, type: 'penerimaan'});
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Tambah kategori penerimaan
              </button>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2 -mr-2">
              {getCategories('penerimaan').map((category) => (
              <li key={category.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                {editingId === category.id ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-1 border rounded"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={cancelEditing}
                        className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleUpdateCategory(category.id)}
                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-gray-800">{category.name}</span>
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => startEditing(category)}
                        className="p-1.5 text-blue-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors duration-150"
                        title="Edit category"
                        disabled={isLoading}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-1.5 text-red-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors duration-150"
                        title="Delete category"
                        disabled={isLoading}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
            </ul>
          )}
        </div>
        
        {/* Pengeluaran Categories */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-700 flex items-center">
              <span className="w-2 h-5 bg-red-500 rounded-full mr-2"></span>
              Pengeluaran
            </h3>
            <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-medium">
              {getCategories('pengeluaran').length} kategori
            </span>
          </div>
          
          {getCategories('pengeluaran').length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <p>Belum ada kategori pengeluaran</p>
              <button
                onClick={() => {
                  setIsAdding(true);
                  setFormData({...formData, type: 'pengeluaran'});
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Tambah kategori pengeluaran
              </button>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2 -mr-2">
              {getCategories('pengeluaran').map((category) => (
                <li key={category.id} className="group flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150">
                  {editingId === category.id ? (
                    <div className="flex-1 space-y-3">
                      <div>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({...formData, name: e.target.value});
                            if (formErrors.name) setFormErrors({...formErrors, name: ''});
                          }}
                          className={`w-full p-2 text-sm rounded-lg border ${
                            formErrors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          } shadow-sm`}
                          disabled={isLoading}
                        />
                        {formErrors.name && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                        )}
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={cancelEditing}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleUpdateCategory(category.id)}
                          disabled={isLoading || !formData.name.trim()}
                          className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                            !formData.name.trim() || isLoading
                              ? 'bg-blue-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {isLoading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-gray-800">{category.name}</span>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => startEditing(category)}
                          className="p-1.5 text-blue-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors duration-150"
                          title="Edit category"
                          disabled={isLoading}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1.5 text-red-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors duration-150"
                          title="Delete category"
                          disabled={isLoading}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-700">
        <h4 className="font-medium mb-1">Tips Penggunaan Kategori</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Klik ikon pensil untuk mengedit nama kategori</li>
          <li>Klik ikon tong sampah untuk menghapus kategori</li>
          <li>Kategori yang digunakan dalam transaksi tidak dapat dihapus</li>
        </ul>
      </div>
    </div>
  );
};

export default CategoryManager;
