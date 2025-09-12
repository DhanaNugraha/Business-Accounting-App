import { useState, useEffect } from 'react';
import { AccountData, TransactionItem } from '@/types';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface AccountSelectorProps {
  accounts: AccountData[];
  selectedAccount: string;
  onSelect: (accountName: string) => void;
  className?: string;
}

export const AccountSelector = ({
  accounts,
  selectedAccount,
  onSelect,
  className = ''
}: AccountSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<AccountData | null>(null);

  useEffect(() => {
    const account = accounts.find(acc => acc.name === selectedAccount) || null;
    setCurrentAccount(account);
  }, [selectedAccount, accounts]);

  const calculateBalance = (account: AccountData | null): string => {
    if (!account) return 'Rp 0';
    
    const balance = account.transactions.reduce((sum: number, tx: TransactionItem) => {
      const penerimaan = Number(tx.penerimaan) || 0;
      const pengeluaran = Number(tx.pengeluaran) || 0;
      return sum + (penerimaan - pengeluaran);
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
      <div className="flex items-center justify-between space-x-4 bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 cursor-pointer hover:bg-gray-50"
           onClick={() => setIsOpen(!isOpen)}>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {currentAccount?.name || 'Pilih Akun'}
          </p>
          <p className="text-xs text-gray-500">
            Saldo: {calculateBalance(currentAccount)}
          </p>
        </div>
        <ChevronDownIcon 
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
          aria-hidden="true" 
        />
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {accounts.map((account) => (
              <div
                key={account.name}
                className={`px-4 py-2 text-sm cursor-pointer ${
                  selectedAccount === account.name 
                    ? 'bg-blue-50 text-blue-900' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => {
                  onSelect(account.name);
                  setIsOpen(false);
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{account.name}</span>
                  <span className="text-xs text-gray-500">
                    {account.transactions.length} transaksi
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {calculateBalance(account)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
