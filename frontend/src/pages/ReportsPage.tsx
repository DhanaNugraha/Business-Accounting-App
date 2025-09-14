import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '@/contexts/AppContext';
import { AccountSelector } from '@/components/AccountSelector';
import type { TransactionItem, AccountData } from '@/types';

interface ReportData {
  balance_sheet: {
    assets: Record<string, number>;
    liabilities: Record<string, number>;
    equity: Record<string, number>;
  };
  income_statement: {
    income: Record<string, number>;
    expenses: Record<string, number>;
    net_income: number;
  };
  cash_flow: {
    operating: number;
    investing: number;
    financing: number;
    net_cash_flow: number;
  };
}

interface ChartDataPoint {
  name: string;
  value: number;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportData | null>(null);

  // Get the currently selected account data
  const currentAccountData = useMemo<AccountData | null>(() => {
    if (!selectedAccount) return null;
    return state.accounts.find(acc => acc.name === selectedAccount) || null;
  }, [selectedAccount, state.accounts]);

  // Generate reports when the selected account changes
  useEffect(() => {
    const generateReports = (account: AccountData | null): ReportData | null => {
      if (!account) return null;

      const reportsData: ReportData = {
        balance_sheet: {
          assets: {},
          liabilities: {},
          equity: {}
        },
        income_statement: {
          income: {},
          expenses: {},
          net_income: 0
        },
        cash_flow: {
          operating: 0,
          investing: 0,
          financing: 0,
          net_cash_flow: 0
        }
      };

      // Process transactions for the current account
      account.transactions.forEach((transaction: TransactionItem) => {
        // Process income (penerimaan)
        Object.entries(transaction.penerimaan).forEach(([category, amount]) => {
          const value = typeof amount === 'number' ? amount : 0;
          reportsData.income_statement.income[category] = 
            (reportsData.income_statement.income[category] || 0) + value;
          reportsData.income_statement.net_income += value;
        });

        // Process expenses (pengeluaran)
        Object.entries(transaction.pengeluaran).forEach(([category, amount]) => {
          const value = typeof amount === 'number' ? amount : 0;
          reportsData.income_statement.expenses[category] = 
            (reportsData.income_statement.expenses[category] || 0) + value;
          reportsData.income_statement.net_income -= value;
        });
      });

      return reportsData;
    };

    setReports(generateReports(currentAccountData));
  }, [currentAccountData]);

  // Set initial selected account
  useEffect(() => {
    if (state.currentAccount) {
      setSelectedAccount(state.currentAccount);
    } else if (state.accounts.length > 0) {
      setSelectedAccount(state.accounts[0].name);
    }
  }, [state.currentAccount, state.accounts]);

  const handleAccountSelect = useCallback((accountName: string) => {
    setSelectedAccount(accountName);
    if (dispatch) {
      dispatch({
        type: 'SET_CURRENT_ACCOUNT',
        payload: accountName
      });
    }
  }, [dispatch]);

  const error = useMemo(() => {
    if (state.accounts.length === 0) {
      return 'Tidak ada data transaksi yang tersedia. Silakan unggah file terlebih dahulu.';
    }
    if (!selectedAccount) {
      return 'Silakan pilih akun untuk melihat laporan.';
    }
    return null;
  }, [state.accounts.length, selectedAccount]);

  const incomeData: ChartDataPoint[] = useMemo(() => {
    if (!reports) return [];
    return Object.entries(reports.income_statement.income).map(([name, value]) => ({
      name,
      value: typeof value === 'number' ? value : 0
    }));
  }, [reports]);

  const expenseData: ChartDataPoint[] = useMemo(() => {
    if (!reports) return [];
    return Object.entries(reports.income_statement.expenses).map(([name, value]) => ({
      name,
      value: Math.abs(typeof value === 'number' ? value : 0)
    }));
  }, [reports]);

  const cashFlowData: ChartDataPoint[] = useMemo(() => {
    if (!reports) return [];
    return [
      { name: 'Operating', value: reports.cash_flow.operating || 0 },
      { name: 'Investing', value: reports.cash_flow.investing || 0 },
      { name: 'Financing', value: reports.cash_flow.financing || 0 },
    ];
  }, [reports]);

  const renderBarChart = (title: string, data: ChartDataPoint[]) => (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Kembali ke Unggah File
        </button>
      </div>
    );
  }

  if (!reports) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
            {selectedAccount && (
              <p className="text-sm text-gray-500 mt-1">Akun: {selectedAccount}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <AccountSelector 
                accounts={state.accounts}
                selectedAccountId={selectedAccount}
                onSelect={handleAccountSelect}
              />
            </div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              Kembali
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Laporan Laba Rugi */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Laporan Laba Rugi</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Ringkasan pendapatan dan pengeluaran</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Pendapatan</h4>
                  {incomeData.length > 0 ? (
                    <div className="space-y-2">
                      {incomeData.map((item) => (
                        <div key={item.name} className="flex justify-between">
                          <span className="text-gray-600">{item.name}</span>
                          <span className="font-medium">
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Tidak ada data pendapatan</p>
                  )}
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Pengeluaran</h4>
                  {expenseData.length > 0 ? (
                    <div className="space-y-2">
                      {expenseData.map((item) => (
                        <div key={item.name} className="flex justify-between">
                          <span className="text-gray-600">{item.name}</span>
                          <span className="font-medium text-red-600">
                            - {formatCurrency(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Tidak ada data pengeluaran</p>
                  )}
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-lg font-medium">Laba/Rugi Bersih</span>
                  <span className={`text-lg font-bold ${
                    reports.income_statement.net_income >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(reports.income_statement.net_income)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grafik */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderBarChart('Pendapatan per Kategori', incomeData)}
            {renderBarChart('Pengeluaran per Kategori', expenseData)}
          </div>

          {/* Arus Kas */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Laporan Arus Kas</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Ringkasan arus kas operasi, investasi, dan pendanaan</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500">Kas dari Operasi</h4>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(reports.cash_flow.operating || 0)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500">Kas dari Investasi</h4>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(reports.cash_flow.investing || 0)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500">Kas dari Pendanaan</h4>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(reports.cash_flow.financing || 0)}
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-lg font-medium">Kenaikan/Penurunan Kas Bersih</span>
                  <span className={`text-lg font-bold ${
                    (reports.cash_flow.net_cash_flow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(reports.cash_flow.net_cash_flow || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;