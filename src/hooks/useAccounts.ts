import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface Account {
  id: number;
  name: string;
  account_type: string;
  parent_id: number | null;
  balance: number;
  is_active: boolean;
}

type CreateAccountParams = {
  name: string;
  accountType: string;
  parentId?: number | null;
};

type UpdateAccountParams = {
  id: number;
  name: string;
  accountType: string;
  parentId: number | null;
  isActive: boolean;
};

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<Account[]>('get_accounts');
      setAccounts(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAccount = async (name: string, accountType: string, parentId?: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<{ id: number }>('create_account', { 
        name, 
        accountType,
        parentId: parentId || null 
      });
      await fetchAccounts();
      return { success: true, id: result.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (
    id: number, 
    name: string, 
    accountType: string, 
    parentId: number | null, 
    isActive: boolean
  ) => {
    try {
      setLoading(true);
      setError(null);
      await invoke<{ success: boolean }>('update_account', { 
        id, 
        name, 
        accountType,
        parentId: parentId,
        isActive: isActive
      });
      await fetchAccounts();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update account';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Get account by ID
  const getAccountById = useCallback((id: number): Account | undefined => {
    return accounts.find(account => account.id === id);
  }, [accounts]);

  // Get accounts by type
  const getAccountsByType = useCallback((type: string): Account[] => {
    return accounts.filter(account => account.account_type === type);
  }, [accounts]);

  return {
    accounts,
    loading,
    error,
    createAccount,
    updateAccount,
    getAccountById,
    getAccountsByType,
    refreshAccounts: fetchAccounts,
  };
}
