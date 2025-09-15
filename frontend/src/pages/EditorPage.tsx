import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { TransactionItem } from '@/types';
import { TransactionEditor } from '@/components/TransactionEditor';
import { AccountSelector } from '@/components/AccountSelector';
import { toast } from 'react-hot-toast';
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import useBeforeUnload from '@/hooks/useBeforeUnload';
import { useSettings } from '@/contexts/SettingsContext';
import { useExportReminder } from '@/components/ExportReminderToast';

export const EditorPage = () => {
  const { state, dispatch } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);
  const { reminderInterval, isReminderActive } = useSettings();
  const { startReminder, stopReminder } = useExportReminder(reminderInterval);
  const hasUnsavedChanges = useRef(false);
  
  const selectedAccount = state.accounts.find(acc => acc.name === state.currentAccount);
  
  // Manage reminders based on settings
  useEffect(() => {
    // Always mark as having changes to ensure reminders work
    hasUnsavedChanges.current = true;
    
    // Start/stop reminder based on settings
    if (isReminderActive) {
      console.log('Starting reminder with interval:', reminderInterval);
      startReminder();
    } else {
      console.log('Stopping reminder');
      stopReminder();
    }
    
    // Clean up on unmount or when dependencies change
    return () => {
      console.log('Cleaning up reminder');
      stopReminder();
    };
  }, [isReminderActive, reminderInterval, startReminder, stopReminder]);
  
  // Handle tab close/refresh confirmation
  useBeforeUnload(hasUnsavedChanges.current, 
    'Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?');
  
  const handleAddAccount = () => {
    const accountName = prompt('Masukkan nama akun baru:');
    if (accountName && !state.accounts.some(acc => acc.name === accountName)) {
      dispatch({ 
        type: 'ADD_ACCOUNT', 
        payload: {
          name: accountName,
          transactions: [],
          balance: 0
        } 
      });
    } else if (accountName) {
      toast.error('Nama akun sudah ada');
    }
  };
  
  const handleSelectAccount = (accountName: string) => {
    dispatch({
      type: 'SET_CURRENT_ACCOUNT',
      payload: accountName
    });
  };

  const handleSaveTransactions = (transactions: TransactionItem[]) => {
    if (!selectedAccount) {
      const error = 'Tidak ada akun yang dipilih';
      console.error(error);
      toast.error(error);
      return;
    }
    
    // Reset the unsaved changes flag
    hasUnsavedChanges.current = false;
    
    // Reset the reminder timer
    if (isReminderActive) {
      stopReminder();
      startReminder();
    }
    
    try {
      dispatch({
        type: 'UPDATE_ACCOUNT',
        payload: {
          accountName: selectedAccount.name,
          transactions: [...transactions]
        }
      });
      toast.success('Transaksi disimpan');
    } catch (error) {
      console.error('Failed to save transactions:', error);
      toast.error('Gagal menyimpan transaksi');
    }
  };

  const handleExportToExcel = async () => {
    if (state.accounts.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    setIsSaving(true);
    try {
      const saveData = {
        accounts: state.accounts.map(account => ({
          name: account.name,
          transactions: account.transactions
        }))
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      });
      
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `akuntansi_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Data berhasil diekspor');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal mengekspor data');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-select first account if none selected but accounts exist
  if (!selectedAccount && state.accounts.length > 0) {
    dispatch({
      type: 'SET_CURRENT_ACCOUNT',
      payload: state.accounts[0].name
    });
    return null;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <AccountSelector 
            accounts={state.accounts}
            selectedAccountId={state.currentAccount}
            onSelect={handleSelectAccount}
            onAddAccount={handleAddAccount}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportToExcel}
            disabled={isSaving || state.accounts.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {isSaving ? 'Menyimpan...' : 'Ekspor ke Excel'}
          </button>
        </div>
      </div>
      {selectedAccount ? (
        <h1 className="text-2xl font-bold text-gray-900">Transaksi - {selectedAccount.name}</h1>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-500 mb-4">Belum ada akun yang dibuat</p>
          <button
            type="button"
            onClick={handleAddAccount}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Tambah Akun Baru
          </button>
        </div>
      )}
      {selectedAccount ? (
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6
          ">
          <TransactionEditor 
            accountName={selectedAccount.name}
            transactions={selectedAccount.transactions} 
            onSave={handleSaveTransactions}
          />
        </div>
      </div>
      ) : null}
    </div>
  );
};

export default EditorPage;