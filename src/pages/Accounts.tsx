import { useState, useCallback, useEffect } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

export default function AccountsPage() {
  const { 
    accounts, 
    loading, 
    error, 
    createAccount, 
    updateAccount,
    getAccountsByType,
    refreshAccounts 
  } = useAccounts();
  
  const [activeTab, setActiveTab] = useState<string>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    account_type: 'Asset' as AccountType,
    parent_id: null as number | null,
    is_active: true,
    code: ''
  });

  const handleAddAccount = async () => {
    if (!newAccount.name.trim()) {
      toast.error('Account name is required');
      return;
    }
    
    if (newAccount.code && !/^\d+$/.test(newAccount.code)) {
      toast.error('Account code must contain only numbers');
      return;
    }
    
    try {
      const result = await createAccount(
        newAccount.name.trim(),
        newAccount.account_type,
        newAccount.parent_id || undefined
      );
      
      if (result.success) {
        toast.success('Account created successfully');
        setIsAddModalOpen(false);
        // Reset form
        setNewAccount({
          name: '',
          account_type: 'Asset',
          parent_id: null,
          is_active: true,
          code: ''
        });
        // Refresh accounts list
        await refreshAccounts();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
    }
  };

  const toggleAccountStatus = async (id: number, currentStatus: boolean) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;
    
    try {
      const result = await updateAccount(
        id,
        account.name,
        account.account_type as AccountType,
        account.parent_id,
        !currentStatus
      );
      
      if (result.success) {
        toast.success(`Account ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update account status');
    }
  };

  // Filter accounts based on active tab
  const filteredAccounts = activeTab === 'all' 
    ? accounts 
    : accounts.filter(account => account.account_type === activeTab);

  // Group accounts by type for the sidebar
  const accountGroups = {
    Asset: getAccountsByType('Asset'),
    Liability: getAccountsByType('Liability'),
    Equity: getAccountsByType('Equity'),
    Income: getAccountsByType('Income'),
    Expense: getAccountsByType('Expense')
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Chart of Accounts</h1>
        <div className="flex gap-2">
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                activeTab === 'all' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All Accounts
            </button>
            {Object.entries(accountGroups).map(([type, items]) => (
              <button
                key={type}
                type="button"
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === type
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-white text-gray-700 border-t border-b border-r border-gray-300 hover:bg-gray-50'
                } ${type === 'Expense' ? 'rounded-r-md' : ''}`}
                onClick={() => setActiveTab(type)}
              >
                {type} ({items.length})
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {loading ? 'Loading...' : 'Add Account'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No accounts found. {activeTab !== 'all' && `Try changing the filter or `}
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    create a new account
                  </button>
                </td>
              </tr>
            ) : (
              filteredAccounts.map((account) => (
              <tr key={account.id} className={!account.is_active ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {account.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {account.account_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  ${account.balance.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  <span 
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {account.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => toggleAccountStatus(account.id, account.is_active)}
                    className={`mr-2 ${
                      account.is_active 
                        ? 'text-yellow-600 hover:text-yellow-900' 
                        : 'text-green-600 hover:text-green-900'
                    }`}
                    disabled={loading}
                  >
                    {account.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* Add Account Modal */}
    {isAddModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Add New Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newAccount.name}
                onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Bank Account"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Code
              </label>
              <input
                type="text"
                value={newAccount.code}
                onChange={(e) => {
                  // Allow only numbers
                  if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
                    setNewAccount({...newAccount, code: e.target.value});
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 1000 (optional)"
                pattern="\d*"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
              <select
                value={newAccount.account_type}
                onChange={(e) => setNewAccount({...newAccount, account_type: e.target.value as AccountType})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Account (Optional)
              </label>
              <select
                value={newAccount.parent_id || ''}
                onChange={(e) => setNewAccount({
                  ...newAccount, 
                  parent_id: e.target.value ? parseInt(e.target.value) : null
                })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- None --</option>
                {accounts
                  .filter(acc => 
                    acc.account_type === newAccount.account_type && 
                    acc.id !== newAccount.parent_id &&
                    acc.is_active
                  )
                  .map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.account_type})
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddAccount}
              disabled={!newAccount.name.trim() || loading}
              className={`px-4 py-2 rounded-md text-white flex items-center gap-1 ${
                !newAccount.name.trim() || loading
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Add Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
