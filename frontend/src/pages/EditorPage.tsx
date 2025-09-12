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
      dispatch({
        type: 'UPDATE_ACCOUNT',
        payload: {
          accountId: selectedAccount.id,
          transactions: transactions.map(tx => ({
            ...tx,
            // Ensure all required fields are present
            id: tx.id || `tx-${Date.now()}`,
            tanggal: tx.tanggal || new Date().toISOString().split('T')[0],
            uraian: tx.uraian || '',
            penerimaan: tx.penerimaan || '0',
            pengeluaran: tx.pengeluaran || '0',
            saldo: tx.saldo || 0
          }))
        }
      });
      toast.success('Perubahan berhasil disimpan');
    } catch (error) {
      console.error('Error saving transactions:', error);
      toast.error('Gagal menyimpan perubahan');
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