import { useState } from 'react';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { AccountData, TransactionItem } from '@/types';

interface AccountSelectorProps {
  accounts: AccountData[];
  selectedAccountId: string | null;
  onSelect: (accountName: string) => void;
  onAddAccount: () => void;
  className?: string;
}

export const AccountSelector = ({
  accounts,
  selectedAccountId,
  onSelect,
  onAddAccount,
  className = ''
}: AccountSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectedAccount = accounts.find(acc => acc.name === selectedAccountId);

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateBalance = (account: AccountData): string => {
    if (!account?.transactions?.length) return 'Rp 0';
    
    const balance = account.transactions.reduce((sum: number, tx: TransactionItem) => {
      const income = Object.values(tx.penerimaan || {}).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
      const expense = Object.values(tx.pengeluaran || {}).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
      return sum + (income - expense);
    }, 0);
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(balance);
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className="flex items-center justify-between w-full px-4 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {selectedAccountId || 'Pilih Akun'}
          </p>
          {selectedAccount && (
            <p className="text-xs text-gray-500 truncate">
              Saldo: {calculateBalance(selectedAccount)}
            </p>
          )}
        </div>
        <ChevronDownIcon 
          className={`w-5 h-5 ml-2 text-gray-400 ${isOpen ? 'transform rotate-180' : ''}`}
          aria-hidden="true"
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Cari akun..."
              className="w-full px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredAccounts.map((account) => (
              <div
                key={account.name}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                  selectedAccountId === account.name ? 'bg-blue-50 text-blue-900' : 'text-gray-700'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(account.name);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{account.name}</span>
                  <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">
                    {account.transactions?.length || 0} transaksi
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {calculateBalance(account)}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="flex items-center w-full px-4 py-2 text-sm text-left text-blue-600 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                onAddAccount();
                setIsOpen(false);
              }}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Tambah Akun Baru
            </button>
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => {
            setIsOpen(false);
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
};