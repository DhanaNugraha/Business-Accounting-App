import { useEffect, useState } from 'react';
import { ReportService } from '@/services/ReportService';
import { formatCurrency, formatDate, formatDateToISO } from '../utils/formatters';

type ReportSectionProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

const ReportSection = ({ title, subtitle, children, className = '' }: ReportSectionProps) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    <div className="border-b border-gray-200 pb-4 mb-4">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const FinancialTable = ({ data, className = '' }: { data: Array<{name: string; value: number; className?: string}>, className?: string }) => (
  <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
    <tbody className="divide-y divide-gray-200">
      {data.map((row, index) => (
        <tr key={index} className={row.className}>
          <td className="py-2 whitespace-nowrap text-sm font-medium text-gray-900">
            {row.name}
          </td>
          <td className="py-2 whitespace-nowrap text-right text-sm text-gray-500">
            {formatCurrency(row.value)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default function ReportsPage() {
  const today = new Date();
  const lastYear = new Date(today.getFullYear() - 1, 0, 1);
  const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
  
  const [asOf, setAsOf] = useState(formatDateToISO(endOfLastYear));
  const [start, setStart] = useState(formatDateToISO(lastYear));
  const [end, setEnd] = useState(formatDateToISO(endOfLastYear));
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'balance' | 'income' | 'cashflow'>('balance');

  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [incomeStatement, setIncomeStatement] = useState<any>(null);
  const [cashFlow, setCashFlow] = useState<any>(null);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const [bs, isr, cf] = await Promise.all([
        ReportService.getBalanceSheet(asOf),
        ReportService.getIncomeStatement(start, end),
        ReportService.getCashFlowDirect(start, end)
      ]);
      setBalanceSheet(bs);
      setIncomeStatement(isr);
      setCashFlow(cf);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [asOf, start, end]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end' | 'asOf') => {
    const value = e.target.value;
    if (type === 'asOf') setAsOf(value);
    else if (type === 'start') setStart(value);
    else setEnd(value);
  };

  const renderBalanceSheet = () => {
    if (!balanceSheet) return null;
    
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">As of {formatDate(asOf)}</h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">As of:</span>
              <input
                type="date"
                value={asOf}
                onChange={(e) => handleDateChange(e, 'asOf')}
                className="border rounded px-2 py-1 text-sm"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportSection title="Assets">
            <FinancialTable 
              data={[
                ...(balanceSheet.assets || []).map((a: any) => ({
                  name: a.accountName,
                  value: a.balance
                })),
                {
                  name: 'Total Assets',
                  value: balanceSheet.totals?.assets || 0,
                  className: 'border-t border-gray-200 font-semibold'
                }
              ]}
            />
          </ReportSection>

          <div className="space-y-6">
            <ReportSection title="Liabilities">
              <FinancialTable 
                data={[
                  ...(balanceSheet.liabilities || []).map((l: any) => ({
                    name: l.accountName,
                    value: l.balance
                  })),
                  {
                    name: 'Total Liabilities',
                    value: balanceSheet.totals?.liabilities || 0,
                    className: 'border-t border-gray-200 font-semibold'
                  }
                ]}
              />
            </ReportSection>

            <ReportSection title="Equity">
              <FinancialTable 
                data={[
                  ...(balanceSheet.equity || []).map((e: any) => ({
                    name: e.accountName,
                    value: e.balance
                  })),
                  {
                    name: 'Total Equity',
                    value: balanceSheet.totals?.equity || 0,
                    className: 'border-t border-gray-200 font-semibold'
                  },
                  {
                    name: 'Total Liabilities & Equity',
                    value: (balanceSheet.totals?.liabilities || 0) + (balanceSheet.totals?.equity || 0),
                    className: 'border-t-2 border-gray-300 font-bold text-gray-900'
                  }
                ]}
              />
            </ReportSection>
          </div>
        </div>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    if (!incomeStatement) return null;
    
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">
            For the period {formatDate(start)} to {formatDate(end)}
          </h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">From:</span>
              <input
                type="date"
                value={start}
                onChange={(e) => handleDateChange(e, 'start')}
                className="border rounded px-2 py-1 text-sm"
              />
            </label>
            <label className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">To:</span>
              <input
                type="date"
                value={end}
                onChange={(e) => handleDateChange(e, 'end')}
                className="border rounded px-2 py-1 text-sm"
                min={start}
              />
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <ReportSection title="Income">
            <FinancialTable 
              data={[
                ...(incomeStatement.income || []).map((i: any) => ({
                  name: i.accountName,
                  value: i.balance
                })),
                {
                  name: 'Total Income',
                  value: incomeStatement.totals?.income || 0,
                  className: 'border-t border-gray-200 font-semibold'
                }
              ]}
            />
          </ReportSection>

          <ReportSection title="Expenses">
            <FinancialTable 
              data={[
                ...(incomeStatement.expenses || []).map((e: any) => ({
                  name: e.accountName,
                  value: e.balance
                })),
                {
                  name: 'Total Expenses',
                  value: incomeStatement.totals?.expenses || 0,
                  className: 'border-t border-gray-200 font-semibold'
                },
                {
                  name: 'Net Income',
                  value: incomeStatement.totals?.netIncome || 0,
                  className: 'border-t-2 border-gray-300 font-bold text-gray-900'
                }
              ]}
            />
          </ReportSection>
        </div>
      </div>
    );
  };

  const renderCashFlow = () => {
    if (!cashFlow) return null;
    
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">
            For the period {formatDate(start)} to {formatDate(end)}
          </h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">From:</span>
              <input
                type="date"
                value={start}
                onChange={(e) => handleDateChange(e, 'start')}
                className="border rounded px-2 py-1 text-sm"
              />
            </label>
            <label className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">To:</span>
              <input
                type="date"
                value={end}
                onChange={(e) => handleDateChange(e, 'end')}
                className="border rounded px-2 py-1 text-sm"
                min={start}
              />
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <ReportSection title="Cash Inflows">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(cashFlow.inflows || []).map((inflow: any, index: number) => (
                    <tr key={`inflow-${index}`}>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(inflow.date)}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                        {inflow.counterparty}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(inflow.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-2 py-2 text-sm font-medium text-gray-900">
                      Total Cash Inflows
                    </td>
                    <td className="px-2 py-2 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(cashFlow.totals?.inflows || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ReportSection>

          <ReportSection title="Cash Outflows">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(cashFlow.outflows || []).map((outflow: any, index: number) => (
                    <tr key={`outflow-${index}`}>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(outflow.date)}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                        {outflow.counterparty}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(outflow.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-2 py-2 text-sm font-medium text-gray-900">
                      Total Cash Outflows
                    </td>
                    <td className="px-2 py-2 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(cashFlow.totals?.outflows || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ReportSection>

          <ReportSection title="Net Cash Flow" className="bg-blue-50">
            <div className="flex justify-between items-center py-2">
              <span className="text-lg font-semibold text-gray-900">Net Increase (Decrease) in Cash</span>
              <span className="text-lg font-bold text-blue-700">
                {formatCurrency(cashFlow.totals?.netCash || 0)}
              </span>
            </div>
          </ReportSection>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and analyze your financial performance
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('balance')}
              className={`${activeTab === 'balance' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Balance Sheet
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`${activeTab === 'income' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Income Statement
            </button>
            <button
              onClick={() => setActiveTab('cashflow')}
              className={`${activeTab === 'cashflow' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Cash Flow
            </button>
          </nav>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Report content */}
        {!isLoading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              {activeTab === 'balance' && renderBalanceSheet()}
              {activeTab === 'income' && renderIncomeStatement()}
              {activeTab === 'cashflow' && renderCashFlow()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
