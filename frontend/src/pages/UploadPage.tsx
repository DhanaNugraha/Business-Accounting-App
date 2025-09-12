import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import axios, { AxiosError } from 'axios';
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

// Type declarations for financial reports
interface FinancialPosition {
  assets: Record<string, number>;
  liabilities: Record<string, number>;
  equity: Record<string, number>;
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
}

interface IncomeStatement {
  revenue: Record<string, number>;
  expenses: Record<string, number>;
  gross_profit: number;
  operating_income: number;
  net_income: number;
  period: string;
}

interface CashFlow {
  operating_activities: number;
  investing_activities: number;
  financing_activities: number;
  net_cash_flow: number;
  period: string;
}

interface UploadResponse {
  reports: {
    balance_sheet: FinancialPosition;
    income_statement: IncomeStatement;
    cash_flow: CashFlow;
  };
}

type FileValidationError = {
  code: string;
  message: string;
  field?: string;
};

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_NAME_LENGTH = 100;
const ALLOWED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/csv',
  'text/csv',
  'text/plain' // Some CSV files might have this MIME type
];

// Magic numbers for file signatures (first few bytes of the file)
const FILE_SIGNATURES = {
  XLSX: '504B0304', // PK\x03\x04
  XLS: 'D0CF11E0', // Standard MS Office/OLE2
  CSV: 'EFBBBF', // UTF-8 BOM (optional for CSV)
};

// Check if file has a valid Excel or CSV signature
const hasValidSignature = async (file: File): Promise<boolean> => {
  if (file.size === 0) return false;
  
  const slice = file.slice(0, 4); // Only need first 4 bytes for signature
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  return Object.values(FILE_SIGNATURES).some(sig => hex.startsWith(sig));
};

// Validate file name
const validateFileName = (fileName: string): FileValidationError | null => {
  if (fileName.length > MAX_FILE_NAME_LENGTH) {
    return {
      code: 'invalid-name-length',
      message: `File name is too long. Maximum ${MAX_FILE_NAME_LENGTH} characters allowed.`,
      field: 'name'
    };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
  if (invalidChars.test(fileName)) {
    return {
      code: 'invalid-characters',
      message: 'File name contains invalid characters.',
      field: 'name'
    };
  }

  return null;
};

// Main file validation function
const validateFile = async (file: File | null): Promise<FileValidationError | null> => {
  // Check if file exists
  if (!file) {
    return { 
      code: 'no-file', 
      message: 'Please select a file to upload',
      field: 'file'
    };
  }

  // Check file size
  if (file.size === 0) {
    return { 
      code: 'empty-file', 
      message: 'The file is empty. Please select a valid file.',
      field: 'file'
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      code: 'file-too-large', 
      message: `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      field: 'file'
    };
  }

  // Check file extension
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['xlsx', 'xls', 'csv'];
  if (!fileExt || !validExtensions.includes(fileExt)) {
    return { 
      code: 'invalid-extension', 
      message: 'Invalid file extension. Please upload an Excel (.xlsx, .xls) or CSV file.',
      field: 'file'
    };
  }

  // Check MIME type
  const mimeType = file.type.toLowerCase();
  const hasValidMimeType = ALLOWED_FILE_TYPES.some(type => 
    mimeType.includes(type.split('/').pop() || '')
  );

  if (!hasValidMimeType) {
    return { 
      code: 'invalid-mime-type', 
      message: 'Invalid file type. The file does not appear to be a valid Excel or CSV file.',
      field: 'file'
    };
  }

  // Validate file name
  const nameError = validateFileName(file.name);
  if (nameError) return nameError;

  // Check file signature (magic number)
  const hasValidFileSignature = await hasValidSignature(file);
  if (!hasValidFileSignature) {
    return {
      code: 'invalid-signature',
      message: 'The file does not appear to be a valid Excel or CSV file. The file may be corrupted or in an unexpected format.',
      field: 'file'
    };
  }

  return null;
};

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<FileValidationError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  // Format file size to human readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Clear validation error when file changes
  useEffect(() => {
    const validate = async () => {
      if (file) {
        const error = await validateFile(file);
        setValidationError(error);
      } else {
        setValidationError(null);
      }
    };
    
    validate();
  }, [file]);

  // Extended error response type for better type safety
  interface ApiErrorResponse {
    detail?: string;
    error?: string;
    message?: string;
    statusCode?: number;
    code?: string;
    issues?: Array<{
      field: string;
      message: string;
    }>;
  }

  // Enhanced error handler with specific error types
  const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const { response, code, message } = error;
      
      // Handle network errors
      if (code === 'ERR_NETWORK') {
        return 'Network error. Please check your internet connection.';
      }
      
      // Handle timeout
      if (code === 'ECONNABORTED') {
        return 'Request timed out. Please try again.';
      }
      
      // Handle HTTP errors
      if (response) {
        const { status, data } = response;
        
        switch (status) {
          case 400:
            if (data.issues?.length) {
              // Handle validation errors
              return data.issues.map(issue => `${issue.field}: ${issue.message}`).join('\n');
            }
            return data.detail || data.message || 'Invalid request. Please check your input.';
            
          case 401:
            return 'Authentication required. Please log in again.';
            
          case 403:
            return 'You do not have permission to perform this action.';
            
          case 404:
            return 'The requested resource was not found.';
            
          case 413:
            return 'File is too large. Maximum size is 10MB.';
            
          case 429:
            return 'Too many requests. Please try again later.';
            
          case 500:
            return 'An unexpected server error occurred. Please try again later.';
            
          default:
            return data.detail || data.message || `An error occurred (${status})`;
        }
      }
      
      return message || 'An unknown error occurred';
    }
    
    // Handle non-Axios errors
    if (error instanceof Error) {
      return error.message || 'An unexpected error occurred';
    }
    
    return 'An unknown error occurred';
  };

  const uploadFile = async (fileToUpload: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const { data } = await axios.post<UploadResponse>(
        'http://localhost:8000/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
          timeout: 60000, // Increased to 60 seconds for large files
          withCredentials: true, // For handling cookies/auth
          validateStatus: (status) => status < 500, // Don't throw for 4xx errors
        }
      );
      return data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      throw new Error(errorMessage);
    }
  };

  const { mutate: uploadMutation, isPending } = useMutation<UploadResponse, Error, File>({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      toast.success('File processed successfully!');
      // Save to session storage in case of page refresh
      try {
        sessionStorage.setItem('accountingReports', JSON.stringify(data.reports));
        // Navigate to reports page with the data
        navigate('/reports', { 
          state: { 
            reports: data.reports,
            timestamp: new Date().toISOString() 
          } 
        });
      } catch (storageError) {
        console.error('Failed to save to session storage:', storageError);
        toast.error('Failed to save report data. Please try again.');
      }
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to process file';
      toast.error(errorMessage, { 
        duration: 10000, // Longer duration for error messages
        position: 'top-center',
        className: 'max-w-md',
      });
      setFile(null);
      setValidationError({
        code: 'upload-failed',
        message: errorMessage,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setValidationError({ 
        code: 'no-file', 
        message: 'Please select a file to upload',
        field: 'file'
      });
      return;
    }
    
    const error = await validateFile(file);
    if (error) {
      setValidationError(error);
      toast.error(error.message, { 
        duration: 5000,
        position: 'top-center',
        className: 'max-w-md',
      });
      return;
    }
    
    setIsSubmitting(true);
    uploadMutation(file, {
      onSettled: () => {
        setIsSubmitting(false);
      }
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const error = await validateFile(selectedFile);
      
      if (error) {
        setValidationError(error);
        setFile(null);
        toast.error(error.message, {
          duration: 5000,
          position: 'top-center',
          className: 'max-w-md',
        });
      } else {
        setFile(selectedFile);
        setValidationError(null);
      }
    }
    
    // Reset the file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const error = await validateFile(droppedFile);
      
      if (error) {
        setValidationError(error);
        setFile(null);
        toast.error(error.message, {
          duration: 5000,
          position: 'top-center',
          className: 'max-w-md',
        });
      } else {
        setFile(droppedFile);
        setValidationError(null);
      }
    }
  };

  const downloadTemplate = async (): Promise<void> => {
    try {
      const response = await axios.get<Blob>('http://localhost:8000/download-template', {
        responseType: 'blob',
        timeout: 30000,
      });
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'accounting_template.xlsx');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Template downloaded successfully!');
    } catch (error) {
      console.error('Error downloading template:', error);
      let errorMessage = 'Failed to download template';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = `Server error: ${error.response.status} - ${error.response.statusText}`;
        } else if (error.request) {
          errorMessage = 'No response from server. Please check your connection.';
        } else {
          errorMessage = `Request error: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { duration: 5000 });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Upload Your Accounting Data
          </h1>
          <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your financial statements in Excel or CSV format to generate comprehensive accounting reports.
          </p>
        </motion.div>

        <motion.div 
          className="bg-white shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl border border-gray-100"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="p-6 sm:p-8">
            <motion.div
              className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-300 ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50/70' 
                  : validationError 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <AnimatePresence>
                {file ? (
                  <motion.div
                    key="file-selected"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-50">
                      <CheckCircleIcon className="h-10 w-10 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-700 mt-2"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Remove file
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="upload-prompt"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full ${validationError ? 'bg-red-50' : 'bg-indigo-50'} transition-colors`}>
                      <CloudArrowUpIcon className={`h-10 w-10 ${validationError ? 'text-red-500' : isDragging ? 'text-indigo-600' : 'text-indigo-500'} transition-colors`} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-base font-medium text-gray-900">
                        <span className={`${validationError ? 'text-red-600' : 'text-indigo-600 hover:text-indigo-500'} cursor-pointer font-semibold`}>
                          Click to upload
                        </span>
                        <span className="text-gray-500"> or drag and drop</span>
                      </p>
                      <p className={`text-sm ${validationError ? 'text-red-500' : 'text-gray-500'}`}>
                        {validationError ? (
                          <span className="inline-flex items-center justify-center">
                            <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {validationError.message}
                          </span>
                        ) : (
                          'Excel (.xlsx, .xls) or CSV (max. 10MB)'
                        )}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              />
            </motion.div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <motion.button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                disabled={isPending || isSubmitting}
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Download Template
              </motion.button>
              
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={!file || isPending || isSubmitting}
                className={`inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                  !file || isPending || isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                } transition-colors duration-200`}
                whileHover={(!isPending && !isSubmitting && file) ? { scale: 1.03 } : {}}
                whileTap={(!isPending && !isSubmitting && file) ? { scale: 0.98 } : {}}
              >
                {isPending || isSubmitting ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                    Processing...
                  </>
                ) : (
                  'Upload & Analyze'
                )}
              </motion.button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Need help? Contact support@accountingapp.com
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UploadPage;