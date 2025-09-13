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
    if (!selectedAccount) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const normalizedTransactions = transactions.map(tx => {
        // Ensure we have proper default values for the new structure
        const defaultPenerimaan = typeof tx.penerimaan === 'string' ? {} : (tx.penerimaan || {});
        const defaultPengeluaran = typeof tx.pengeluaran === 'string' ? {} : (tx.pengeluaran || {});
        
        // Calculate saldo if not provided
        let saldo = tx.saldo;
        if (typeof saldo !== 'number') {
          const penerimaanTotal = Object.values(defaultPenerimaan).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
          const pengeluaranTotal = Object.values(defaultPengeluaran).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
          saldo = penerimaanTotal - pengeluaranTotal;
        }
        
        return {
          ...tx,
          id: tx.id || `tx-${Date.now()}`,
          tanggal: tx.tanggal || new Date().toISOString().split('T')[0],
          uraian: tx.uraian || '',
          penerimaan: defaultPenerimaan,
          pengeluaran: defaultPengeluaran,
          saldo: saldo
        };
      });
      
      // First update the local state
      dispatch({
        type: 'UPDATE_ACCOUNT',
        payload: {
          accountId: selectedAccount.id,
          transactions: normalizedTransactions
        }
      });
      
      // Format data for the backend
      const saveData = {
        accounts: [{
          id: selectedAccount.id,
          name: selectedAccount.name,
          transactions: normalizedTransactions
        }]
      };

      // Then save to the backend
      const response = await fetch('http://localhost:8000/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save transactions');
      }
      
      const result = await response.json();
      
      // Update local state with any server-side changes
      if (result.success) {
        toast.success('Transactions saved successfully');
      }
    } catch (error) {
      console.error('Error saving transactions:', error);
      toast.error('Failed to save transactions');
      // Revert to the previous transactions if save fails
      dispatch({
        type: 'SET_ACCOUNTS',
        payload: [...state.accounts]
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
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