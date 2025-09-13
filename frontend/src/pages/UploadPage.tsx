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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [validationError, setValidationError] = useState<FileValidationError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { dispatch } = useAppContext();
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

  // Helper function to convert string values to numbers in transaction objects
  const normalizeTransaction = (tx: any): TransactionItem => {
    const normalized: any = { ...tx };
    
    // Convert string values to numbers for all numeric fields
    if (tx.penerimaan) {
      if (typeof tx.penerimaan === 'string') {
        // Handle old format where penerimaan was a string
        normalized.penerimaan = { 'Penerimaan': Number(tx.penerimaan) || 0 };
      } else if (typeof tx.penerimaan === 'object') {
        // Ensure all values in the object are numbers
        const penerimaan: Record<string, number> = {};
        Object.entries(tx.penerimaan).forEach(([key, value]) => {
          penerimaan[key] = Number(value) || 0;
        });
        normalized.penerimaan = penerimaan;
      }
    } else {
      normalized.penerimaan = {};
    }

    if (tx.pengeluaran) {
      if (typeof tx.pengeluaran === 'string') {
        // Handle old format where pengeluaran was a string
        normalized.pengeluaran = { 'Pengeluaran': Number(tx.pengeluaran) || 0 };
      } else if (typeof tx.pengeluaran === 'object') {
        // Ensure all values in the object are numbers
        const pengeluaran: Record<string, number> = {};
        Object.entries(tx.pengeluaran).forEach(([key, value]) => {
          pengeluaran[key] = Number(value) || 0;
        });
        normalized.pengeluaran = pengeluaran;
      }
    } else {
      normalized.pengeluaran = {};
    }

    // Calculate saldo if not provided
    if (typeof tx.saldo !== 'number') {
      const penerimaanTotal = Object.values(normalized.penerimaan).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
      const pengeluaranTotal = Object.values(normalized.pengeluaran).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
      normalized.saldo = penerimaanTotal - pengeluaranTotal;
    }

    return normalized as TransactionItem;
  };

  // Process and update accounts in the app state
  const processAndUpdateAccounts = (accounts: AccountData[]): boolean => {
    if (!accounts || accounts.length === 0) return false;
    
    const mappedAccounts = accounts.map(account => ({
      id: account.id || `acc-${Math.random().toString(36).substr(2, 9)}`,
      name: account.name || 'Akun Tanpa Nama',
      balance: account.balance || 0,
      transactions: (account.transactions || []).map(tx => ({
        ...normalizeTransaction(tx),
        id: tx.id || `tx-${Math.random().toString(36).substr(2, 9)}`,
        tanggal: tx.tanggal || new Date().toISOString().split('T')[0],
        uraian: tx.uraian || ''
      })),
      code: account.code,
      type: account.type,
      currency: account.currency || 'IDR',
      isActive: account.isActive !== false,
      createdAt: account.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    dispatch({ type: 'SET_ACCOUNTS', payload: mappedAccounts });
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
      
      // In a real app, you would upload the file to your server here
      // For now, we'll simulate a successful upload with sample data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sample response - replace with actual API call
      const responseData = {
        accounts: [
          {
            id: 'acc-1',
            name: 'Kas',
            balance: 0,
            transactions: []
          }
        ]
      };
      
      return responseData.accounts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah file';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    const error = validateFile(selectedFile);
    if (error) {
      setValidationError(error);
      return;
    }
    
    setValidationError(null);
    setIsSubmitting(true);
    
    handleFileUpload(selectedFile)
      .then(accounts => {
        if (processAndUpdateAccounts(accounts)) {
          toast.success('File berhasil diunggah');
          navigate('/editor');
        } else {
          toast.error('Tidak ada data transaksi yang valid');
        }
      })
      .catch(err => {
        console.error('Upload error:', err);
        toast.error('Gagal memproses file. Silakan coba lagi.');
      })
      .finally(() => {
        setIsSubmitting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      });
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
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    
    const error = validateFile(droppedFile);
    if (error) {
      setValidationError(error);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const accounts = await handleFileUpload(droppedFile);
      if (processAndUpdateAccounts(accounts)) {
        toast.success('File berhasil diunggah');
        navigate('/editor');
      } else {
        toast.error('Tidak ada data transaksi yang valid');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Gagal memproses file. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
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
                  disabled={isSubmitting}
                >
                  Unggah file
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
            onChange={handleFileChange}
            disabled={isSubmitting}
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
            disabled={isSubmitting || isDownloading}
          >
            {isDownloading ? (
              <>
                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Mengunduh...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" />
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