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

  const handleSaveTransactions = async (transactions: TransactionItem[]) => {
    console.group('Saving Transactions to Excel');
    
    if (!selectedAccount) {
      const error = 'No account selected';
      console.error(error);
      toast.error(error);
      console.groupEnd();
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('Preparing data for Excel export...');
      
      // Update local state first
      dispatch({
        type: 'UPDATE_ACCOUNT',
        payload: {
          accountId: selectedAccount.id,
          transactions: [...transactions]
        }
      });
      
      // Prepare data for Excel export
      const saveData = {
        accounts: [{
          id: selectedAccount.id,
          name: selectedAccount.name,
          transactions: transactions
        }]
      };
      
      // Call the API to generate and download the Excel file
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
      
      // Get the filename from the content-disposition header or use a default one
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Convert the response to a blob and create a download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Excel file downloaded successfully');
      toast.success('Transactions exported to Excel');
      
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      console.groupEnd();
    }
  };

  // ... rest of the component code ...

  return (
    // ... existing JSX ...
    <TransactionEditor
      transactions={selectedAccount.transactions}
      onSave={handleSaveTransactions}
      accountName={selectedAccount.name}
    />
    // ... rest of the JSX ...
  );
};

export default EditorPage;