import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '@/contexts/AppContext';
import { AccountSelector } from '@/components/AccountSelector';
import type { TransactionItem, AccountData } from '@//types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Define interfaces
interface BalanceReport {
  date: string;
  income: number;
  expense: number;
  balance: number;
  runningBalance: number;
}

interface BalanceByPeriod {
  period: string;
  originalPeriod?: string;
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

const formatCurrency = (amount: number, shortFormat: boolean = false): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  if (shortFormat) {
    let formattedAmount: string;
    if (absAmount >= 1000000000) {
      formattedAmount = `Rp${(absAmount / 1000000000).toFixed(1)} M`;
    } else if (absAmount >= 1000000) {
      formattedAmount = `Rp${(absAmount / 1000000).toFixed(1)} jt`;
    } else if (absAmount >= 1000) {
      formattedAmount = `Rp${(absAmount / 1000).toFixed(0)} rb`;
    } else {
      formattedAmount = `Rp${absAmount}`;
    }
    return isNegative ? `-${formattedAmount}` : formattedAmount;
  }
  
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });
  
  return isNegative ? `-${formatter.format(absAmount)}` : formatter.format(absAmount);
};

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportData | null>(null);
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly' | 'running'>('monthly');
  const [exportMode, setExportMode] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);

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
        .map(([period, { income, expense }]) => {
          const [year, month] = period.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          const formattedPeriod = `${monthNames[parseInt(month) - 1]} ${year}`;
          
          return {
            period: formattedPeriod,
            originalPeriod: period,
            income,
            expense,
            balance: income - expense
          };
        });

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

  const errorMessage = useMemo(() => {
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

  // Function to get data for a specific tab
  const getReportData = (tab: 'monthly' | 'yearly' | 'running') => {
    if (!reports) return null;
    
    if (tab === 'monthly') {
      return [...reports.monthly].sort((a, b) => 
        (a.originalPeriod || '').localeCompare(b.originalPeriod || '')
      );
    } else if (tab === 'yearly') {
      return reports.yearly;
    } else {
      return reports.running;
    }
  };

  // Render a single report section
  const renderReportSection = (tab: 'monthly' | 'yearly' | 'running', title: string) => {
    const data = getReportData(tab);
    if (!data) return null;

    return (
      <div key={tab} className={!exportMode ? 'mb-12' : ''}>
        {exportMode && (
          <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
            {title}
          </h2>
        )}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {!exportMode && (
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Grafik {title}
              </h3>
            </div>
          )}
          <div className="p-4">
            <div className="h-96">
              <ResponsiveContainer width="100%" height={400}>
                {tab === 'running' ? (
                  <LineChart 
                    data={data}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 30,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value, true)}
                      tick={{ fontSize: 12 }}
                      width={80}
                      tickMargin={5}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value), true)}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        padding: '0.5rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '20px',
                        paddingBottom: '10px'
                      }}
                    />
                    <Line 
                      type="linear"
                      dataKey="runningBalance" 
                      name="Saldo Berjalan" 
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={data.length <= 12}
                      activeDot={{ r: 6 }}
                      connectNulls={true}
                    />
                  </LineChart>
                ) : (
                  <BarChart 
                    data={data}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 30,
                    }}
                    barGap={0}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value, true)}
                      tick={{ fontSize: 12 }}
                      width={80}
                      tickMargin={5}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value), true)}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        padding: '0.5rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '20px',
                        paddingBottom: '10px'
                      }}
                    />
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
            
            {/* Numeric Breakdown - Only show for monthly/yearly tabs */}
            {tab !== 'running' && (
              <div className="mt-6 overflow-x-auto">
                <h4 className="text-md font-medium text-gray-700 mb-3">
                  {exportMode ? 'Rincian ' : 'Detail '} {tab === 'monthly' ? 'Bulanan' : 'Tahunan'}
                </h4>
                <div className="inline-block min-w-full align-middle rounded-lg overflow-hidden border border-gray-300">
                  <table className="min-w-full divide-y divide-gray-200 border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {tab === 'monthly' ? 'Bulan' : 'Tahun'}
                        </th>
                        <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pendapatan
                        </th>
                        <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pengeluaran
                        </th>
                        <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          NET Perubahan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((item: any) => (
                        <tr key={`${tab}-${item.period}`} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.period}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-green-600">
                            {formatCurrency(item.income, true)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-red-600">
                            {formatCurrency(item.expense, true)}
                          </td>
                          <td className={`px-3 py-2 whitespace-nowrap text-sm text-right font-medium ${
                            item.balance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.balance >= 0 ? '' : '-'}{formatCurrency(Math.abs(item.balance), true)}
                          </td>
                        </tr>
                      ))}
                      {/* Total Row */}
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          Total
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-green-600">
                          {formatCurrency(data.reduce((sum: number, item: any) => sum + item.income, 0), true)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-red-600">
                          {formatCurrency(data.reduce((sum: number, item: any) => sum + item.expense, 0), true)}
                        </td>
                        <td className={`px-3 py-2 whitespace-nowrap text-sm text-right font-medium ${
                          data.reduce((sum: number, item: any) => sum + item.balance, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {data.reduce((sum: number, item: any) => sum + item.balance, 0) >= 0 ? '' : '-'}
                          {formatCurrency(Math.abs(data.reduce((sum: number, item: any) => sum + item.balance, 0)), true)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
                tickFormatter={(value) => formatCurrency(value, true)}
                tick={{ fontSize: 12 }}
                tickMargin={8}
                padding={{ top: 10, bottom: 10 }}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value), true)}
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

  // Handle PDF export with each section on its own page
  const handleExportPDF = async () => {
    if (!reportRef.current || isExporting) return;
    
    try {
      setIsExporting(true);
      
      // Temporarily show all reports for export
      const currentExportMode = exportMode;
      if (!currentExportMode) {
        setExportMode(true);
        // Wait for the DOM to update
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth() - 20; // 10mm margins on each side
      
      // Helper function to add a page with header and footer
      const addPageWithHeader = (title: string, isFirstPage = false) => {
        if (!isFirstPage) {
          pdf.addPage();
        }
        
        // Add header
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Laporan Keuangan - ${selectedAccount || ''}`, 10, 10);
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `Dibuat pada: ${new Date().toLocaleDateString('id-ID', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          })}`,
          10,
          15
        );
        
        // Add title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text(title, 10, 30);
        
        // Add separator line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(10, 35, pageWidth + 10, 35);
        
        return 40; // Return the Y position after the header
      };
      
      // Helper function to add footer
      const addFooter = () => {
        const pageCount = pdf.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.setFontSize(10);
          pdf.text(
            `Halaman ${i} dari ${pageCount}`,
            pdf.internal.pageSize.getWidth() - 30,
            pdf.internal.pageSize.getHeight() - 10
          );
        }
      };
      
      // Get all report sections in the specified order
      const sections = [
        { id: 'income-statement', title: 'Laporan Laba Rugi' },
        { id: 'category-charts', title: 'Grafik Kategori' },
        { id: 'monthly', title: 'Laporan Bulanan' },
        { id: 'yearly', title: 'Laporan Tahunan' },
        { id: 'running', title: 'Laporan Saldo Berjalan' }
      ];
      
      // Helper function to wait for animations to complete
      const waitForAnimations = async (element: HTMLElement) => {
        // Wait for recharts animations to complete (default duration is 1000ms)
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Force re-render of charts by temporarily changing their size
        const charts = element.querySelectorAll('.recharts-wrapper');
        charts.forEach((chart: Element) => {
          const wrapper = chart as HTMLElement;
          const originalWidth = wrapper.style.width;
          
          // Trigger reflow by toggling width
          wrapper.style.width = '99.9%';
          // Force synchronous layout
          void wrapper.offsetHeight;
          wrapper.style.width = originalWidth;
          
          // Wait for the next frame to ensure the chart is re-rendered
          return new Promise(resolve => requestAnimationFrame(resolve));
        });
        
        // Additional small delay to ensure everything is stable
        await new Promise(resolve => setTimeout(resolve, 200));
      };
      
      // Helper function to hide text elements that are duplicated in the PDF
      const hideDuplicateTitles = () => {
        // Hide all section titles in the export view
        const sectionTitles = document.querySelectorAll('[id^="report-section-"] h2, [id^="report-section-"] h3, [id^="report-section-"] h4');
        sectionTitles.forEach(title => {
          (title as HTMLElement).style.visibility = 'hidden';
        });
      };
      
      // Helper function to restore hidden elements
      const restoreTitles = () => {
        // Restore all section titles
        const sectionTitles = document.querySelectorAll('[id^="report-section-"] h2, [id^="report-section-"] h3, [id^="report-section-"] h4');
        sectionTitles.forEach(title => {
          (title as HTMLElement).style.visibility = '';
        });
      };
      
      // Export each section to a separate page
      for (let i = 0; i < sections.length; i++) {
        const { id, title } = sections[i];
        const element = document.getElementById(`report-section-${id}`);
        
        if (!element) continue;
        
        // Show only the current section
        const allSections = document.querySelectorAll('[id^="report-section-"]');
        allSections.forEach(section => {
          (section as HTMLElement).style.display = 'none';
        });
        (element as HTMLElement).style.display = 'block';
        
        // Wait for the DOM to update and animations to complete
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // If this section contains charts, wait for their animations to complete
        if (element.querySelector('.recharts-wrapper')) {
          await waitForAnimations(element);
        }
        
        // Hide text titles before capturing to avoid duplicates
        hideDuplicateTitles();
        
        // Capture the section as an image
        const canvas = await html2canvas(element as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          height: element.scrollHeight,
          width: element.scrollWidth,
          windowHeight: element.scrollHeight,
          windowWidth: element.scrollWidth,
          scrollY: 0,
          scrollX: 0
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Restore titles immediately after capture
        restoreTitles();
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;
        
        // Add a new page for this section (except the first one)
        const yPos = addPageWithHeader(title, i === 0);
        
        // Add the image to the PDF
        pdf.addImage(imgData, 'PNG', 10, yPos, pageWidth, pdfHeight, undefined, 'FAST');
      }
      
      // Add page numbers and other footer content
      addFooter();
      
      // Restore all sections visibility
      const allSections = document.querySelectorAll('[id^="report-section-"]');
      allSections.forEach(section => {
        (section as HTMLElement).style.display = '';
      });
      
      // Generate filename with account name and date
      const accountName = selectedAccount 
        ? selectedAccount.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').toLowerCase() 
        : 'laporan';
      const dateStr = new Date().toISOString().split('T')[0];
      
      // Reset export mode if it was changed
      if (!currentExportMode) {
        setExportMode(false);
        // Wait for the DOM to update before saving
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Save the PDF
      pdf.save(`${accountName}_laporan_${dateStr}.pdf`);
      
      // Reset exporting state after a short delay to ensure the button text updates
      setTimeout(() => setIsExporting(false), 500);
      
    } catch (error) {
      setPdfError('Gagal mengekspor ke PDF. Silakan coba lagi.');
      console.error('PDF Export Error:', error);
      // Make sure to reset export mode if there was an error
      if (exportMode) setExportMode(false);
      setIsExporting(false);
    }
  };

  // Render the main content with all reports
  const renderReports = () => {
    if (!reports) return null;

    if (exportMode) {
      return (
        <div className="space-y-12">
          {/* Income Statement Section */}
          <div id="report-section-income-statement" className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Laporan Laba Rugi</h2>
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

          {/* Category Charts */}
          <div id="report-section-category-charts" className="grid grid-cols-1 gap-6">
            <h2 className="text-xl font-bold text-gray-900">Grafik Kategori</h2>
            {renderBarChart('Pendapatan per Kategori', incomeData)}
            {renderBarChart('Pengeluaran per Kategori', expenseData)}
          </div>

          {/* Monthly, Yearly, and Running Balance Reports */}
          <div id="report-section-monthly">
            {renderReportSection('monthly', 'Laporan Bulanan')}
          </div>
          <div id="report-section-yearly">
            {renderReportSection('yearly', 'Laporan Tahunan')}
          </div>
          <div id="report-section-running">
            {renderReportSection('running', 'Laporan Saldo Berjalan')}
          </div>
        </div>
      );
    }

    // Original single-tab view
    return renderReportSection(activeTab, activeTab === 'monthly' ? 'Bulanan' : activeTab === 'yearly' ? 'Tahunan' : 'Saldo Berjalan');
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show PDF export error if it exists
  if (pdfError) {
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
                {pdfError}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setPdfError(null)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Kembali ke Laporan
        </button>
      </div>
    );
  }

  if (errorMessage) {
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
                {errorMessage}
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
            <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-300">
              <span className="text-sm text-gray-700 whitespace-nowrap">Mode Ekspor</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={exportMode}
                  onChange={(e) => setExportMode(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <button
              onClick={handleExportPDF}
              disabled={!reports || isExporting}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px]"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mengekspor...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" />
                  Ekspor ke PDF
                </>
              )}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              Kembali
            </button>
          </div>
        </div>

        <div ref={reportRef} className="grid grid-cols-1 gap-6">
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

          {!exportMode && (
            <>
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
            </>
          )}
          
          {/* Export Mode Content */}
          {exportMode && (
            <div className="space-y-8">
              {renderReports()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;