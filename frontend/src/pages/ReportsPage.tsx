import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowDownTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axios from 'axios';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ReportsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Get reports from location state or load from session storage
  useEffect(() => {
    if (location.state?.reports) {
      setReports(location.state.reports);
      // Save to session storage for page refresh
      sessionStorage.setItem('accountingReports', JSON.stringify(location.state.reports));
    } else {
      // Try to load from session storage on page refresh
      const savedReports = sessionStorage.getItem('accountingReports');
      if (savedReports) {
        setReports(JSON.parse(savedReports));
      } else {
        // No reports found, redirect to upload
        navigate('/upload');
      }
    }
  }, [location.state, navigate]);

  const handleDownloadUpdated = async () => {
    if (!reports) return;

    try {
      setIsDownloading(true);
      // In a real app, you would get the original file from the server
      // For demo, we'll use a placeholder file
      const response = await axios.post(
        'http://localhost:8000/download-updated',
        {},
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'accounting_report_updated.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!reports) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const { balance_sheet, income_statement, cash_flow } = reports;

  // Prepare data for charts
  const incomeData = Object.entries(income_statement.income).map(([name, value]) => ({
    name,
    value: Math.abs(value),
  }));

  const expenseData = Object.entries(income_statement.expenses).map(([name, value]) => ({
    name,
    value: Math.abs(value),
  }));

  const cashFlowData = [
    { name: 'Operating', value: cash_flow.operating },
    { name: 'Investing', value: cash_flow.investing },
    { name: 'Financing', value: cash_flow.financing },
  ];

  const renderAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const renderSection = (title: string, items: Record<string, number>, total: number) => (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-medium text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">
        {Object.entries(items).map(([name, value]) => (
          <div key={name} className="flex justify-between">
            <span className="text-gray-600">{name}</span>
            <span className="font-medium">{renderAmount(value)}</span>
          </div>
        ))}
        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between font-semibold">
            <span>Total {title}</span>
            <span>{renderAmount(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Financial Reports</h2>
        <button
          onClick={handleDownloadUpdated}
          disabled={isDownloading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" />
          {isDownloading ? 'Downloading...' : 'Download Report'}
        </button>
      </div>

      {/* Balance Sheet */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Balance Sheet</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderSection(
            'Assets',
            balance_sheet.assets,
            Object.values(balance_sheet.assets).reduce((a, b) => a + b, 0)
          )}
          {renderSection(
            'Liabilities',
            balance_sheet.liabilities,
            Object.values(balance_sheet.liabilities).reduce((a, b) => a + b, 0)
          )}
          {renderSection(
            'Equity',
            balance_sheet.equity,
            Object.values(balance_sheet.equity).reduce((a, b) => a + b, 0)
          )}
        </div>
      </section>

      {/* Income Statement */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Income Statement</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Income</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [renderAmount(Number(value)), 'Amount']} />
                  <Bar dataKey="value" fill="#00C49F" name="Income" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Expenses</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [renderAmount(Number(value)), 'Amount']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Net Income</span>
            <span className={`text-xl font-semibold ${
              income_statement.net_income >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {renderAmount(income_statement.net_income)}
            </span>
          </div>
        </div>
      </section>

      {/* Cash Flow */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Cash Flow Statement</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Cash from Operating Activities</span>
                <span className="font-medium">{renderAmount(cash_flow.operating)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cash from Investing Activities</span>
                <span className="font-medium">{renderAmount(cash_flow.investing)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cash from Financing Activities</span>
                <span className="font-medium">{renderAmount(cash_flow.financing)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Net Increase in Cash</span>
                  <span className={cash_flow.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {renderAmount(cash_flow.net_cash_flow)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [renderAmount(Number(value)), 'Amount']} />
                <Bar dataKey="value" name="Cash Flow">
                  {cashFlowData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value >= 0 ? COLORS[1] : COLORS[5]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <div className="flex justify-center mt-8">
        <button
          onClick={() => navigate('/upload')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
          Back to Upload
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;
