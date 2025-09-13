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
      
      dispatch({
        type: 'UPDATE_ACCOUNT',
        payload: {
          accountId: selectedAccount.id,
          transactions: normalizedTransactions
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