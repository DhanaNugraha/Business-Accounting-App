import { useAppContext } from '@/contexts/AppContext';
import type { TransactionItem } from '@/types';
import { TransactionEditor } from '@/components/TransactionEditor';
import { toast } from 'react-hot-toast';

export const EditorPage = () => {
  const { state, dispatch } = useAppContext();
  
  if (!state.currentAccount) {
    return <div>No account selected</div>;
  }
  
  const selectedAccount = state.accounts.find(acc => acc.id === state.currentAccount);
  
  if (!selectedAccount) {
    return <div>Account not found</div>;
  }

  // ... rest of the component code ...

  const handleSaveTransactions = (transactions: TransactionItem[]) => {
    if (!selectedAccount) {
      const error = 'No account selected';
      console.error(error);
      toast.error(error);
      return;
    }
    
    // Just update the local state without exporting
    dispatch({
      type: 'UPDATE_ACCOUNT',
      payload: {
        accountId: selectedAccount.id,
        transactions: [...transactions]
      }
    });
    
    toast.success('Transactions saved successfully');
  };

  const handleExportToExcel = async () => {
    if (!selectedAccount) {
      toast.error('No account selected');
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const saveData = {
        accounts: [{
          id: selectedAccount.id,
          name: selectedAccount.name,
          transactions: selectedAccount.transactions
        }]
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Transactions exported to Excel');
      
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ... rest of the component code ...

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{selectedAccount.name}</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleExportToExcel}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Excel
          </button>
        </div>
      </div>
      <TransactionEditor
        transactions={selectedAccount.transactions}
        onSave={handleSaveTransactions}
        accountName={selectedAccount.name}
      />
    </div>
  );
};

export default EditorPage;