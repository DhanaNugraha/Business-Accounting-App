import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';

export const CategoryManager = () => {
  const { state, dispatch } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'pengeluaran' as 'penerimaan' | 'pengeluaran'
  });

  const handleAddCategory = () => {
    if (!formData.name.trim()) return;
    
    const newCategory = {
      id: uuidv4(),
      name: formData.name.trim(),
      type: formData.type
    };

    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    setFormData({ name: '', type: 'pengeluaran' });
    setIsAdding(false);
  };

  const handleUpdateCategory = (id: string, newName?: string) => {
    // Use the provided newName or fall back to formData.name
    const nameToUse = newName || formData.name.trim();
    
    // Don't proceed if the name is empty
    if (!nameToUse) return;
    
    // Check if we're updating a context category (has ID) or a transaction category (prefixed with 'tx-')
    const isTransactionCategory = id.startsWith('tx-');
    const oldName = isTransactionCategory ? id.substring(3) : null;
    
    // Find the category in context (if it exists)
    const contextCategory = isTransactionCategory ? null : state.categories.find(cat => cat.id === id);
    
    // For transaction categories, we need to update all transactions that use this category
    if (isTransactionCategory && oldName) {
      // Check if the new name already exists in context categories
      const nameExistsInContext = state.categories.some(
        cat => cat.name.toLowerCase() === nameToUse.toLowerCase()
      );
      
      if (nameExistsInContext) {
        alert('Kategori dengan nama yang sama sudah ada di daftar kategori');
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
        alert('Kategori dengan nama yang sama sudah ada');
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
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      dispatch({ type: 'REMOVE_CATEGORY', payload: { id } });
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Kelola Kategori</h2>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            setFormData({ name: '', type: 'pengeluaran' });
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          {isAdding ? 'Batal' : 'Tambah Kategori'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-medium mb-3">Tambah Kategori Baru</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Kategori</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Nama kategori"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Jenis</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as 'penerimaan' | 'pengeluaran'})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="pengeluaran">Pengeluaran</option>
                <option value="penerimaan">Penerimaan</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!formData.name.trim()}
                className={`px-4 py-2 rounded-md text-white ${formData.name.trim() ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed'}`}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-green-600 mb-3">Kategori Penerimaan</h3>
          <ul className="space-y-2">
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
                    <span>{category.name}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(category)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Hapus"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-red-600 mb-3">Kategori Pengeluaran</h3>
          <ul className="space-y-2">
            {getCategories('pengeluaran').map((category) => (
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
                    <span>{category.name}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(category)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Hapus"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
