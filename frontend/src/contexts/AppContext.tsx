import { createContext, useContext, useReducer, useEffect } from 'react';
import type { TransactionItem } from '../types';

interface AccountBase {
  id: string;
  name: string;
  balance: number;
  transactions: TransactionItem[];
  code?: string;
  type?: string;
  currency?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AppState {
  accounts: AccountBase[];
  currentAccount: string | null;
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_ACCOUNTS'; payload: AccountBase[] }
  | { type: 'SET_CURRENT_ACCOUNT'; payload: string }
  | { type: 'UPDATE_ACCOUNT'; payload: { accountId: string; transactions: TransactionItem[] } }
  | { type: 'ADD_ACCOUNT'; payload: AccountBase }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: AppState = {
  accounts: [],
  currentAccount: null,
  isLoading: false,
  error: null,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_ACCOUNTS': {
      // Ensure all accounts have required fields
      const accounts = action.payload.map((account: AccountBase) => {
        // Create a new account with all required fields
        const newAccount: AccountBase = {
          id: account.id || `account-${Math.random().toString(36).substr(2, 9)}`,
          name: account.name || 'Unnamed Account',
          balance: account.balance || 0,
          transactions: (account.transactions || []).map((tx: TransactionItem) => ({
            ...tx,
            id: tx.id || `tx-${Math.random().toString(36).substr(2, 9)}`,
            tanggal: tx.tanggal || new Date().toISOString().split('T')[0],
            uraian: tx.uraian || '',
            penerimaan: tx.penerimaan || '0',
            pengeluaran: tx.pengeluaran || '0',
            saldo: tx.saldo || 0
          }))
        };
        return newAccount;
      });
      return {
        ...state,
        accounts,
        currentAccount: accounts[0]?.id || null,
        isLoading: false,
        error: null,
      };
    }
    case 'SET_CURRENT_ACCOUNT':
      return {
        ...state,
        currentAccount: action.payload,
      };
    case 'UPDATE_ACCOUNT': {
      const updatedAccounts = state.accounts.map(account => {
        if (account.id === action.payload.accountId) {
          // Recalculate balance based on transactions
          const transactions = action.payload.transactions || [];
          const balance = transactions.reduce((sum: number, tx: TransactionItem) => {
            // Calculate balance based on penerimaan and pengeluaran
            const penerimaan = parseFloat(tx.penerimaan) || 0;
            const pengeluaran = parseFloat(tx.pengeluaran) || 0;
            return sum + penerimaan - pengeluaran;
          }, 0);
          
          return {
            ...account,
            transactions: transactions.map((tx: TransactionItem) => {
              const newTx = {
                ...tx,
                id: tx.id || `tx-${Math.random().toString(36).substr(2, 9)}`,
                tanggal: tx.tanggal || new Date().toISOString().split('T')[0],
                uraian: tx.uraian || '',
                penerimaan: tx.penerimaan || '0',
                pengeluaran: tx.pengeluaran || '0',
                saldo: tx.saldo || 0,
              };
              return newTx;
            }),
            balance
          };
        }
        return account;
      });
      return { ...state, accounts: updatedAccounts };
    }
    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, action.payload],
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
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
        if (parsedState.accounts) {
          dispatch({ type: 'SET_ACCOUNTS', payload: parsedState.accounts });
        }
        if (parsedState.currentAccount) {
          dispatch({ type: 'SET_CURRENT_ACCOUNT', payload: parsedState.currentAccount });
        }
      }
    } catch (error) {
      console.error('Failed to load state from localStorage', error);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      const { accounts, currentAccount } = state;
      localStorage.setItem('accountingAppState', JSON.stringify({ accounts, currentAccount }));
    } catch (error) {
      console.error('Failed to save state to localStorage', error);
    }
  }, [state.accounts, state.currentAccount]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
