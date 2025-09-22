import { createContext, useContext, useReducer, useEffect } from 'react';
import type { TransactionItem } from '../types';

interface AccountBase {
  name: string;
  transactions: TransactionItem[];
  balance: number;
}

interface AppState {
  accounts: AccountBase[];
  currentAccount: string | null;
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  isBackendReady: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'penerimaan' | 'pengeluaran';
  description?: string;
}

type AppAction =
  | { type: 'SET_ACCOUNTS'; payload: AccountBase[] }
  | { type: 'SET_CURRENT_ACCOUNT'; payload: string | null }
  | { type: 'UPDATE_ACCOUNT'; payload: { accountName: string; transactions: TransactionItem[] } }
  | { type: 'ADD_ACCOUNT'; payload: AccountBase }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'REMOVE_CATEGORY'; payload: { id: string } }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_BACKEND_READY'; payload: boolean };

const initialState: AppState = {
  accounts: [],
  currentAccount: null,
  categories: [],
  isLoading: false,
  error: null,
  isBackendReady: true,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

// Helper to calculate account balance from transactions
const calculateAccountBalance = (transactions: TransactionItem[]): number => {
  return transactions.reduce((balance, tx) => {
    const income = Object.values(tx.penerimaan || {}).reduce(
      (sum: number, val) => sum + (Number(val) || 0), 
      0
    );
    const expense = Object.values(tx.pengeluaran || {}).reduce(
      (sum: number, val) => sum + (Number(val) || 0), 
      0
    );
    return balance + (income - expense);
  }, 0);
};

// Normalize transaction data to ensure consistent format
const normalizeTransaction = (tx: Partial<TransactionItem>): TransactionItem => {
  const normalizedTx: TransactionItem = {
    id: tx.id || `tx-${Math.random().toString(36).substr(2, 9)}`,
    tanggal: tx.tanggal || new Date().toISOString().split('T')[0],
    uraian: tx.uraian || '',
    penerimaan: {},
    pengeluaran: {},
    jumlah: 0,
    saldo_berjalan: 0
  };

  // Handle penerimaan
  if (typeof tx.penerimaan === 'string') {
    normalizedTx.penerimaan = { 'Penerimaan': Number(tx.penerimaan) || 0 };
  } else if (tx.penerimaan && typeof tx.penerimaan === 'object') {
    Object.entries(tx.penerimaan).forEach(([key, value]) => {
      normalizedTx.penerimaan[key] = Number(value) || 0;
    });
  }

  // Handle pengeluaran
  if (typeof tx.pengeluaran === 'string') {
    normalizedTx.pengeluaran = { 'Pengeluaran': Number(tx.pengeluaran) || 0 };
  } else if (tx.pengeluaran && typeof tx.pengeluaran === 'object') {
    Object.entries(tx.pengeluaran).forEach(([key, value]) => {
      normalizedTx.pengeluaran[key] = Number(value) || 0;
    });
  }

  // Calculate jumlah
  const penerimaanTotal = Object.values(normalizedTx.penerimaan).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  );
  const pengeluaranTotal = Object.values(normalizedTx.pengeluaran).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  );
  normalizedTx.jumlah = penerimaanTotal - pengeluaranTotal;

  return normalizedTx;
};

// Create a new account with calculated balance
const createAccount = (name: string, transactions: TransactionItem[] = []): AccountBase => ({
  name,
  transactions: transactions.map(normalizeTransaction),
  balance: calculateAccountBalance(transactions),
});

// Main reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_ACCOUNTS':
      return {
        ...state,
        accounts: action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_CURRENT_ACCOUNT':
      return {
        ...state,
        currentAccount: action.payload,
      };
    case 'UPDATE_ACCOUNT': {
      const { accountName, transactions } = action.payload;
      const updatedAccounts = state.accounts.map(account =>
        account.name === accountName
          ? createAccount(accountName, transactions)
          : account
      );
      return {
        ...state,
        accounts: updatedAccounts,
        isLoading: false,
        error: null,
      };
    }
    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, action.payload],
        currentAccount: action.payload.name,
        isLoading: false,
        error: null,
      };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    case 'REMOVE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(cat => cat.id !== action.payload.id),
      };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(cat => 
          cat.id === action.payload.id ? action.payload : cat
        ),
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'SET_BACKEND_READY':
      return {
        ...state,
        isBackendReady: action.payload,
      };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('accountingAppState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'SET_ACCOUNTS', payload: parsedState.accounts || [] });
        if (parsedState.currentAccount) {
          dispatch({ type: 'SET_CURRENT_ACCOUNT', payload: parsedState.currentAccount });
        }
      }
    } catch (error) {
      console.error('Failed to load state from localStorage', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load saved data' });
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      const { accounts, currentAccount } = state;
      localStorage.setItem('accountingAppState', JSON.stringify({
        accounts,
        currentAccount,
      }));
    } catch (error) {
      console.error('Failed to save state to localStorage', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save data' });
    }
  }, [state.accounts, state.currentAccount]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
