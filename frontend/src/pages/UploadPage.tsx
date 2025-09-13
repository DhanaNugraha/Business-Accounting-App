import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from 'react-hot-toast';
import type { TransactionItem } from '@/types';
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

const UploadPage = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<FileValidationError | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

  // Process and update accounts in the app state
  const processAndUpdateAccounts = (accounts: AccountData[]): boolean => {
    if (!accounts || accounts.length === 0) return false;
    
    const mappedAccounts = accounts.map(account => ({
      id: account.id || `acc-${Math.random().toString(36).substr(2, 9)}`,
      name: account.name || 'Akun Tanpa Nama',
      balance: typeof account.balance === 'number' ? account.balance : 0,
      transactions: (account.transactions || []).map(tx => {
        // Ensure we have proper default values for the new structure
        const defaultPenerimaan = typeof tx.penerimaan === 'string' ? {} : (tx.penerimaan || {});
        const defaultPengeluaran = typeof tx.pengeluaran === 'string' ? {} : (tx.pengeluaran || {});
        
        // Calculate saldo if not provided
        let saldo = typeof tx.saldo === 'number' ? tx.saldo : 0;
        if (saldo === 0) {
          const penerimaanTotal = Object.values(defaultPenerimaan).reduce((sum: number, val) => 
            sum + (Number(val) || 0), 0);
          const pengeluaranTotal = Object.values(defaultPengeluaran).reduce((sum: number, val) => 
            sum + (Number(val) || 0), 0);
          saldo = penerimaanTotal - pengeluaranTotal;
        }
        
        return {
          ...tx,
          id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          tanggal: tx.tanggal || new Date().toISOString().split('T')[0],
          uraian: tx.uraian || '',
          penerimaan: defaultPenerimaan,
          pengeluaran: defaultPengeluaran,
          saldo: saldo
        };
      }),
      code: account.code,
      type: account.type,
      currency: account.currency || 'IDR',
      isActive: account.isActive !== false,
      createdAt: account.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
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
      
      // Get the first sheet name as the account name (or use a default if needed)
      const accountName = workbook.SheetNames[0] || 'Akun Baru';
      
      // Convert the first sheet to JSON with proper typing
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: unknown[][] = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: '' });
      
      // Process the data to extract transactions
      const transactions: TransactionItem[] = [];
      
      // Skip header row if exists
      let startRow = 0;
      if (jsonData.length > 0 && Array.isArray(jsonData[0]) && jsonData[0].length > 0) {
        const firstCell = String(jsonData[0][0] || '').toLowerCase();
        if (['tanggal', 'uraian', 'penerimaan', 'pengeluaran', 'saldo'].some(h => 
          firstCell.includes(h.toLowerCase())
        )) {
          startRow = 1;
        }
      }
      
      // Process each row of data
      for (let i = startRow; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row) || row.length === 0) continue;
        
        // Helper functions to safely access row data
        const getStringValue = (index: number): string => {
          if (index >= row.length) return '';
          const value = row[index];
          return value !== null && value !== undefined ? String(value) : '';
        };
        
        const getNumberValue = (index: number): number => {
          if (index >= row.length) return 0;
          const value = row[index];
          if (value === null || value === undefined) return 0;
          const num = Number(value);
          return isNaN(num) ? 0 : num;
        };
        
        // Create transaction with safe defaults
        const transaction: TransactionItem = {
          id: `tx-${Date.now()}-${i}`,
          tanggal: getStringValue(0) || new Date().toISOString().split('T')[0],
          uraian: getStringValue(1),
          penerimaan: {},
          pengeluaran: {},
          saldo: 0
        };
        
        // Process amounts
        const penerimaan = getNumberValue(2);
        const pengeluaran = getNumberValue(3);
        
        if (penerimaan > 0) {
          transaction.penerimaan = { 'Penerimaan': penerimaan };
        }
        
        if (pengeluaran > 0) {
          transaction.pengeluaran = { 'Pengeluaran': pengeluaran };
        }
        
        // Set saldo from column or calculate it
        const saldo = getNumberValue(4);
        transaction.saldo = saldo || (penerimaan - pengeluaran);
        
        transactions.push(transaction);
      }
      
      // Return the account data with the dynamic account name
      return [{
        id: `acc-${Date.now()}`,
        name: accountName,
        balance: transactions.length > 0 ? transactions[transactions.length - 1].saldo : 0,
        transactions: transactions,
        currency: 'IDR',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];
      
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

      // Update the app state with the processed accounts
      const success = processAndUpdateAccounts(accounts);
      
      if (success) {
        toast.success('File berhasil diunggah dan diproses');
        // Navigate to the editor page
        navigate('/editor');
      } else {
        throw new Error('Gagal memproses data akun');
      }
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
      
      // Update the app state with the processed accounts
      const success = processAndUpdateAccounts(accounts);
      
      if (success) {
        toast.success('File berhasil diunggah dan diproses');
        // Navigate to the editor page
        navigate('/editor');
      } else {
        throw new Error('Gagal memproses data akun');
      }
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