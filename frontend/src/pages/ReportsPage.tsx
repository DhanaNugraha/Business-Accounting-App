import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '@/contexts/AppContext';
import { AccountSelector } from '@/components/AccountSelector';
import type { TransactionItem, AccountData } from '@/types';

interface BalanceReport {
  date: string;
  income: number;
  expense: number;
  balance: number;
  runningBalance: number;
}

interface BalanceByPeriod {
  period: string;
  income: number;
  expense: number;
  balance: number;
}

interface ReportData {
  monthly: BalanceByPeriod[];
  yearly: BalanceByPeriod[];
  running: BalanceReport[];
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
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly' | 'running'>('monthly');

  // Get the currently selected account data
  const currentAccountData = useMemo<AccountData | null>(() => {
    if (!selectedAccount) return null;
    return state.accounts.find(acc => acc.name === selectedAccount) || null;
  }, [selectedAccount, state.accounts]);

  // Generate reports when the selected account changes
  useEffect(() => {
    const generateReports = (account: AccountData | null): ReportData | null => {
      if (!account) return null;

      const monthlyData: Record<string, { income: number; expense: number }> = {};
      const yearlyData: Record<string, { income: number; expense: number }> = {};
      const runningBalanceData: BalanceReport[] = [];
      let runningBalance = 0;

      // Sort transactions by date
      const sortedTransactions = [...account.transactions].sort((a, b) => 
        new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
      );

      // Process transactions for the current account
      sortedTransactions.forEach((transaction) => {
        const date = new Date(transaction.tanggal);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const monthYear = `${year}-${month.toString().padStart(2, '0')}`;
        const yearStr = year.toString();

        // Calculate income and expense for the transaction
        const income = Object.values(transaction.penerimaan || {}).reduce(
          (sum, val) => sum + (typeof val === 'number' ? val : 0), 0
        );
        const expense = Object.values(transaction.pengeluaran || {}).reduce(
          (sum, val) => sum + (typeof val === 'number' ? val : 0), 0
        );
        const balance = income - expense;

        // Update running balance
        runningBalance += balance;
        
        // Add to running balance data
        runningBalanceData.push({
          date: transaction.tanggal,
          income,
          expense,
          balance,
          runningBalance
        });

        // Update monthly data
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { income: 0, expense: 0 };
        }
        monthlyData[monthYear].income += income;
        monthlyData[monthYear].expense += expense;

        // Update yearly data
        if (!yearlyData[yearStr]) {
          yearlyData[yearStr] = { income: 0, expense: 0 };
        }
        yearlyData[yearStr].income += income;
        yearlyData[yearStr].expense += expense;
      });

      // Convert to arrays with proper formatting
      const monthlyReports: BalanceByPeriod[] = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, { income, expense }]) => ({
          period,
          income,
          expense,
          balance: income - expense
        }));

      const yearlyReports: BalanceByPeriod[] = Object.entries(yearlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, { income, expense }]) => ({
          period,
          income,
          expense,
          balance: income - expense
        }));

      const reportsData: ReportData = {
        monthly: monthlyReports,
        yearly: yearlyReports,
        running: runningBalanceData,
        balance_sheet: {
          assets: {},
          liabilities: {},
          equity: {}
        },
        income_statement: {
          income: {},
          expenses: {},
          net_income: monthlyReports.reduce((sum, { balance }) => sum + balance, 0)
        },
        cash_flow: {
          operating: monthlyReports.reduce((sum, { income }) => sum + income * 0.7, 0),
          investing: -monthlyReports.reduce((sum, { expense }) => sum + expense * 0.2, 0),
          financing: monthlyReports.reduce((sum, { income, expense }) => sum + (income * 0.3 - expense * 0.8), 0),
          net_cash_flow: monthlyReports.reduce((sum, { balance }) => sum + balance, 0)
        }
      };

      // Process income and expense categories
      account.transactions.forEach((transaction: TransactionItem) => {
        // Process income (penerimaan)
        Object.entries(transaction.penerimaan).forEach(([category, amount]) => {
          const value = typeof amount === 'number' ? amount : 0;
          reportsData.income_statement.income[category] = 
            (reportsData.income_statement.income[category] || 0) + value;
        });

        // Process expenses (pengeluaran)
        Object.entries(transaction.pengeluaran).forEach(([category, amount]) => {
          const value = typeof amount === 'number' ? amount : 0;
          reportsData.income_statement.expenses[category] = 
            (reportsData.income_statement.expenses[category] || 0) + value;
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

  // Render bar chart for income/expense by category
  const renderBarChart = (title: string, data: ChartDataPoint[]) => {
    const barColor = title.includes('Pendapatan') ? '#10b981' : '#ef4444';
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickMargin={8} />
              <YAxis
                width={100}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} Jt`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)} Rb`;
                  return value.toString();
                }}
                tick={{ fontSize: 12 }}
                tickMargin={8}
                padding={{ top: 10, bottom: 10 }}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ color: barColor, fontWeight: 500 }}
                labelStyle={{ color: '#4b5563', fontWeight: 600 }}
              />
              <Bar dataKey="value" fill={barColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render the main content with all reports
  const renderReports = () => {
    if (!reports) return null;

    const data = activeTab === 'monthly' ? reports.monthly : 
                activeTab === 'yearly' ? reports.yearly : 
                reports.running;

    return (
      <div className="space-y-6">
        {/* Laporan Laba Rugi with Detailed Breakdown */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Laporan Laba Rugi</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Ringkasan pendapatan dan pengeluaran</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Pendapatan</h4>
                <div className="space-y-2">
                  {Object.entries(reports.income_statement.income).map(([category, amount]) => (
                    <div key={`income-${category}`} className="flex justify-between">
                      <span className="text-gray-600">{category}</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Pengeluaran</h4>
                <div className="space-y-2">
                  {Object.entries(reports.income_statement.expenses).map(([category, amount]) => (
                    <div key={`expense-${category}`} className="flex justify-between">
                      <span className="text-gray-600">{category}</span>
                      <span className="font-medium text-red-600">- {formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
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

        {/* Main Chart */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Grafik {activeTab === 'monthly' ? 'Bulanan' : activeTab === 'yearly' ? 'Tahunan' : 'Saldo Berjalan'}
            </h3>
          </div>
          <div className="p-4">
            <div className="h-96">
              <ResponsiveContainer width="100%" height={400}>
                {activeTab === 'running' ? (
                  <BarChart 
                    data={data}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                        return value.toString();
                      }}
                      tick={{ fontSize: 12 }}
                      width={80}
                      tickMargin={5}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        padding: '0.5rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="runningBalance" 
                      name="Saldo Berjalan" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <BarChart 
                    data={data}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                        return value.toString();
                      }}
                      tick={{ fontSize: 12 }}
                      width={80}
                      tickMargin={5}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        padding: '0.5rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="income" 
                      name="Pendapatan" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="expense" 
                      name="Pengeluaran" 
                      fill="#ef4444" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
          {/* Category Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderBarChart('Pendapatan per Kategori', incomeData)}
            {renderBarChart('Pengeluaran per Kategori', expenseData)}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('monthly')}
                className={`${activeTab === 'monthly' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Bulanan
              </button>
              <button
                onClick={() => setActiveTab('yearly')}
                className={`${activeTab === 'yearly' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Tahunan
              </button>
              <button
                onClick={() => setActiveTab('running')}
                className={`${activeTab === 'running' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Saldo Berjalan
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {renderReports()}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportsPage;