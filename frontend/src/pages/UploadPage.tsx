import React, { useState, useRef, ChangeEvent, DragEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from 'react-hot-toast';
import type { TransactionItem } from '@/types';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { downloadTemplate } from '@/services/api';

interface AccountData {
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

interface FileValidationError {
  code: string;
  message: string;
}

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

// Helper function to check for duplicate transactions
const checkForDuplicates = (transactions: TransactionItem[]): TransactionItem[] => {
  const duplicates: TransactionItem[] = [];
  const seen = new Map<string, TransactionItem[]>();

  transactions.forEach(tx => {
    const key = `${tx.tanggal}_${tx.uraian}_${tx.jumlah}`;
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      if (existing.length === 1) {
        duplicates.push(existing[0]);
      }
      duplicates.push(tx);
      existing.push(tx);
    } else {
      seen.set(key, [tx]);
    }
  });

  return duplicates;
};

const UploadPage = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<FileValidationError | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicates, setDuplicates] = useState<{
    isOpen: boolean;
    items: TransactionItem[];
    onConfirm: (() => void) | null;
  }>({
    isOpen: false,
    items: [],
    onConfirm: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { dispatch, state } = useAppContext();
  const navigate = useNavigate();

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      await downloadTemplate();
      toast.success('Template berhasil diunduh');
    } catch (error) {
      console.error('Failed to download template:', error);
      toast.error('Gagal mengunduh template. Silakan coba lagi.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Format file size to human readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Check for duplicate transactions in the uploaded data
  const checkAndHandleDuplicates = useCallback((accounts: AccountData[], onSuccess: () => void) => {
    const allTransactions = accounts.flatMap(acc => acc.transactions || []);
    const duplicateItems = checkForDuplicates(allTransactions);
    
    if (duplicateItems.length > 0) {
      setDuplicates({
        isOpen: true,
        items: duplicateItems,
        onConfirm: () => {
          processAndUpdateAccounts(accounts);
          onSuccess();
        }
      });
    } else {
      processAndUpdateAccounts(accounts);
      onSuccess();
    }
  }, []);

  // Process and update accounts in the app state
  const processAndUpdateAccounts = (accounts: AccountData[]): boolean => {
    if (!accounts || accounts.length === 0) return false;
    
    const mappedAccounts = accounts.map(account => {
      const transactions = (account.transactions || []).map(tx => {
        // Ensure we have proper default values for the new structure
        const defaultPenerimaan = typeof tx.penerimaan === 'string' ? {} : (tx.penerimaan || {});
        const defaultPengeluaran = typeof tx.pengeluaran === 'string' ? {} : (tx.pengeluaran || {});
        
        // Calculate jumlah if not provided
        let jumlah = typeof tx.jumlah === 'number' ? tx.jumlah : 0;
        if (jumlah === 0) {
          const penerimaanTotal = Object.values(defaultPenerimaan).reduce((sum: number, val) => 
            sum + (Number(val) || 0), 0);
          const pengeluaranTotal = Object.values(defaultPengeluaran).reduce((sum: number, val) => 
            sum + (Number(val) || 0), 0);
          jumlah = penerimaanTotal - pengeluaranTotal;
        }
        
        return {
          ...tx,
          id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          tanggal: tx.tanggal || new Date().toISOString().split('T')[0],
          uraian: tx.uraian || '',
          penerimaan: defaultPenerimaan,
          pengeluaran: defaultPengeluaran,
          jumlah: jumlah
        } as TransactionItem;
      });
      
      return {
        id: account.id || `acc-${Math.random().toString(36).substr(2, 9)}`,
        name: account.name || 'Akun Tanpa Nama',
        balance: typeof account.balance === 'number' ? account.balance : 0,
        transactions: transactions,
        code: account.code,
        type: account.type,
        currency: account.currency || 'IDR',
        isActive: account.isActive !== false,
        createdAt: account.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
        
    dispatch({ type: 'SET_ACCOUNTS', payload: mappedAccounts });
    
    // Set the first account as current if none is selected
    if (mappedAccounts.length > 0 && !state.currentAccount) {
      dispatch({ type: 'SET_CURRENT_ACCOUNT', payload: mappedAccounts[0].id });
    }
    
    return true;
  };

  // Validate file
  const validateFile = (file: File): FileValidationError | null => {
    if (!file) {
      return {
        code: 'NO_FILE',
        message: 'Silakan pilih file untuk diunggah'
      };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        code: 'INVALID_TYPE',
        message: 'Hanya file Excel (.xlsx, .xls) yang didukung'
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        code: 'FILE_TOO_LARGE',
        message: `Ukuran file tidak boleh melebihi ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    return null;
  };

  const handleFileUpload = async (fileToUpload: File): Promise<AccountData[]> => {
    if (!fileToUpload) return [];
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      setValidationError(null);
      
      // Dynamically import xlsx to handle ESM/CJS compatibility
      const XLSX = await import('xlsx');
      
      // Read the file as ArrayBuffer
      const arrayBuffer = await fileToUpload.arrayBuffer();
      
      // Parse the Excel file
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      if (workbook.SheetNames.length === 0) {
        throw new Error('File does not contain any sheets');
      }
      
      const accounts: AccountData[] = [];
      
      // Process each sheet as a separate account
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: unknown[][] = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });
        
        if (jsonData.length === 0) continue;
        
        // Process headers to identify column indices
        const headers = (jsonData[0] as string[]).map(h => String(h || '').trim());
        
        // Find column indices
        const dateCol = headers.findIndex(h => h.toLowerCase() === 'tanggal');
        const descCol = headers.findIndex(h => h.toLowerCase() === 'uraian');
        const jumlahCol = headers.findIndex(h => h.toLowerCase() === 'jumlah');
        
        // Find all Penerimaan_* and Pengeluaran_* columns
        const penerimaanCols = headers
          .map((h, i) => (h.toLowerCase().startsWith('penerimaan_') ? i : -1))
          .filter(i => i !== -1);
          
        const pengeluaranCols = headers
          .map((h, i) => (h.toLowerCase().startsWith('pengeluaran_') ? i : -1))
          .filter(i => i !== -1);
        
        // Skip if required columns are missing
        if (dateCol === -1 || descCol === -1 || jumlahCol === -1) {
          console.warn(`Skipping sheet '${sheetName}': Missing required columns`);
          continue;
        }
        
        const transactions: TransactionItem[] = [];
        let runningBalance = 0;
        
        // Process each row of data (skip header row)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!Array.isArray(row) || row.length === 0) continue;
          
          // Helper function to safely access row data
          const getStringValue = (index: number): string => {
            if (index < 0 || index >= row.length) return '';
            const value = row[index];
            return value !== null && value !== undefined ? String(value).trim() : '';
          };
          
          const getNumberValue = (index: number): number => {
            if (index < 0 || index >= row.length) return 0;
            const value = row[index];
            if (value === null || value === undefined || value === '') return 0;
            const num = Number(value);
            return isNaN(num) ? 0 : num;
          };
          
          // Process Penerimaan columns
          const penerimaan: Record<string, number> = {};
          for (const col of penerimaanCols) {
            const value = getNumberValue(col);
            if (value > 0) {
              const category = headers[col].replace(/^penerimaan_/i, '');
              penerimaan[category] = value;
            }
          }
          
          // Process Pengeluaran columns
          const pengeluaran: Record<string, number> = {};
          for (const col of pengeluaranCols) {
            const value = getNumberValue(col);
            if (value > 0) {
              const category = headers[col].replace(/^pengeluaran_/i, '');
              pengeluaran[category] = value;
            }
          }
          
          // Calculate total income and expense
          const totalPenerimaan = Object.values(penerimaan).reduce((sum: number, val) => sum + val, 0);
          const totalPengeluaran = Object.values(pengeluaran).reduce((sum: number, val) => sum + val, 0);
          
          // Get transaction amount (use 0 if not a number)
          const amount = typeof row[jumlahCol] === 'number' ? row[jumlahCol] : 0;
          
          // Get or calculate balance
          let saldo = getNumberValue(jumlahCol);
          if (saldo === 0) {
            saldo = totalPenerimaan - totalPengeluaran;
            runningBalance += saldo;
          } else {
            runningBalance = saldo;
          }
          
          // Helper function to parse Excel date (either serial number or formatted string)
          const parseExcelDate = (value: any): string => {
            if (!value && value !== 0) return new Date().toISOString().split('T')[0];
            
            // If it's already a date string in YYYY-MM-DD format
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
              return value;
            }
            
            // If it's an Excel serial date number (days since 1900-01-01)
            if (typeof value === 'number' && value > 0) {
              // Excel's date system starts from 1900-01-01 (with 1900 incorrectly treated as a leap year)
              // JavaScript's Date uses 1970-01-01 as epoch, so we need to adjust
              const excelEpoch = new Date('1899-12-30T00:00:00.000Z');
              const date = new Date(excelEpoch.getTime() + value * 86400000);
              
              // Handle Excel's incorrect leap year in 1900
              if (value >= 60) {
                date.setDate(date.getDate() - 1);
              }
              
              return date.toISOString().split('T')[0];
            }
            
            // Try parsing as date string (MM/DD/YYYY or DD/MM/YYYY)
            const parsedDate = new Date(value);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString().split('T')[0];
            }
            
            // Fallback to current date
            return new Date().toISOString().split('T')[0];
          };
          
          // Get the raw date value from Excel
          const rawDateValue = dateCol >= 0 && dateCol < row.length ? row[dateCol] : null;
          
          // Create transaction
          const transaction: TransactionItem = {
            id: `tx-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            tanggal: parseExcelDate(rawDateValue),
            uraian: getStringValue(descCol) || 'Transaksi Tanpa Keterangan',
            penerimaan,
            pengeluaran,
            jumlah: amount,
            saldo_berjalan: runningBalance
          };
          
          transactions.push(transaction);
        }
        
        // Add account if we have transactions
        if (transactions.length > 0) {
          accounts.push({
            id: `acc-${Date.now()}-${sheetName.replace(/\s+/g, '-').toLowerCase()}`,
            name: sheetName,
            balance: runningBalance,
            transactions,
            currency: 'IDR',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      if (accounts.length === 0) {
        throw new Error('Tidak ada data transaksi yang valid dalam file');
      }
      
      return accounts;
      
    } catch (err) {
      console.error('Error processing file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses file';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Validate file
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      toast.error(error.message);
      return;
    }

    setIsProcessing(true);
    try {
      // Process the file
      const accounts = await handleFileUpload(file);
      
      if (accounts.length === 0) {
        throw new Error('Tidak ada data yang dapat diproses dari file ini');
      }

      // Check for duplicates and handle them
      checkAndHandleDuplicates(accounts, () => {
        toast.success('File berhasil diunggah dan diproses');
        // Navigate to the editor page
        navigate('/editor');
      });
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses file';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      toast.error(error.message);
      return;
    }
    
    setIsProcessing(true);
    try {
      // Process the file
      const accounts = await handleFileUpload(file);
      
      if (accounts.length === 0) {
        throw new Error('Tidak ada data yang dapat diproses dari file ini');
      }
      
      // Check for duplicates and handle them
      checkAndHandleDuplicates(accounts, () => {
        toast.success('File berhasil diunggah dan diproses');
        // Navigate to the editor page
        navigate('/editor');
      });
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses file';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Duplicate Transactions Modal */}
      <Transition.Root show={duplicates.isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setDuplicates(prev => ({ ...prev, isOpen: false }))}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        Transaksi Ganda Ditemukan
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Ditemukan {duplicates.items.length} transaksi yang mungkin duplikat. Apakah Anda yakin ingin melanjutkan?
                        </p>
                        <div className="mt-4 max-h-60 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uraian</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {duplicates.items.slice(0, 10).map((tx, idx) => (
                                <tr key={`${tx.id}-${idx}`}>
                                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(tx.tanggal).toLocaleDateString('id-ID')}
                                  </td>
                                  <td className="px-6 py-2 text-sm text-gray-900">
                                    {tx.uraian}
                                  </td>
                                  <td className="px-6 py-2 text-right text-sm text-gray-900">
                                    {new Intl.NumberFormat('id-ID', {
                                      style: 'currency',
                                      currency: 'IDR',
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0
                                    }).format(tx.jumlah)}
                                  </td>
                                </tr>
                              ))}
                              {duplicates.items.length > 10 && (
                                <tr>
                                  <td colSpan={3} className="px-6 py-2 text-center text-sm text-gray-500">
                                    ...dan {duplicates.items.length - 10} transaksi lainnya
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                      onClick={() => {
                        if (duplicates.onConfirm) duplicates.onConfirm();
                        setDuplicates(prev => ({ ...prev, isOpen: false }));
                      }}
                    >
                      Lanjutkan
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setDuplicates(prev => ({ ...prev, isOpen: false }))}
                    >
                      Batal
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Unggah File Transaksi</h1>
          <p className="mt-2 text-sm text-gray-600">
            Unggah file Excel yang berisi data transaksi Anda
          </p>
        </div>

        <div 
          className={`mt-8 border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-blue-100">
                <CloudArrowUpIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <button
                  type="button"
                  className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition duration-150 ease-in-out"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Memproses...' : 'Unggah file'}
                </button>{' '}
                atau tarik dan lepas
              </p>
              <p className="text-xs text-gray-500">
                File Excel (XLSX) hingga {formatFileSize(MAX_FILE_SIZE)}
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".xlsx, .xls"
            onChange={onFileChange}
            disabled={isProcessing}
          />
        </div>

        {validationError && (
          <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
            {validationError.message}
          </div>
        )}
        
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDownloading || isProcessing}
          >
            {isDownloading ? (
              <>
                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Mengunduh...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="-ml-1 mr-2 h-4 w-4" />
                Unduh Template
              </>
            )}
          </button>
        </div>
        
        {/* Quick Help */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Panduan Singkat</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Unduh template terlebih dahulu untuk format yang benar</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Setiap sheet dalam file Excel mewakili satu akun</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Pastikan format tanggal sesuai (DD/MM/YYYY)</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Gunakan koma (,) untuk desimal dan titik (.) untuk ribuan</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;