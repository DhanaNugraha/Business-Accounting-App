import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TransactionItem } from '@/types';
import { 
  TrashIcon, 
  PencilIcon, 
  ChartBarIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  PlusIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { getDateValidationError } from '@/utils/validators';
import { useAppContext } from '@/contexts/AppContext';

type SortField = 'tanggal' | 'jumlah' | 'saldo_berjalan' | 'uraian' | 'kategori';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  searchQuery: string;
  transactionType: 'all' | 'penerimaan' | 'pengeluaran';
  startDate: string;
  endDate: string;
  sortField: SortField;
  sortDirection: SortDirection;
}

interface SimpleFormData {
  id?: string;
  tanggal: string;
  tipe: 'penerimaan' | 'pengeluaran';
  kategori: string;
  uraian: string;
  jumlah: string;
}

interface TransactionEditorProps {
  transactions: TransactionItem[];
  onSave: (transactions: TransactionItem[]) => void;
  accountName: string;
}

export const TransactionEditor = ({ transactions, onSave, accountName }: TransactionEditorProps) => {
  const { state: { categories } } = useAppContext();
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  
  // State for duplicate transaction warning
  const [duplicateWarning, setDuplicateWarning] = useState<{
    isOpen: boolean;
    transaction: TransactionItem | null;
    onConfirm: (() => void) | null;
  }>({
    isOpen: false,
    transaction: null,
    onConfirm: null,
  });
  
  // Calculate running balance for transactions
  const transactionsWithRunningBalance = useMemo(() => {
    let runningBalance = 0;
    return transactions.map(tx => {
      const penerimaan = Object.values(tx.penerimaan || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
      const pengeluaran = Object.values(tx.pengeluaran || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
      const jumlah = penerimaan - pengeluaran;
      runningBalance += jumlah;
      return {
        ...tx,
        jumlah,
        saldo_berjalan: runningBalance
      };
    });
  }, [transactions]);
  
  // Filter and sort state
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    transactionType: 'all',
    startDate: '',
    endDate: '',
    sortField: 'tanggal',
    sortDirection: 'desc'
  });

  const handleSearch = useCallback(() => {
    const searchValue = searchInputRef.current?.value || '';
    setFilters(prev => ({ ...prev, searchQuery: searchValue }));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const searchValue = (e.target as HTMLInputElement).value;
      setFilters(prev => ({ ...prev, searchQuery: searchValue }));
    }
  }, []);

  // Toggle sort direction
  const toggleSort = useCallback((field: SortField) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Apply filters and sorting to transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactionsWithRunningBalance];

    // Apply search
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(tx => 
        tx.uraian?.toLowerCase().includes(query) ||
        Object.keys(tx.penerimaan || {}).some(k => k.toLowerCase().includes(query)) ||
        Object.keys(tx.pengeluaran || {}).some(k => k.toLowerCase().includes(query))
      );
    }

    // Apply transaction type filter
    if (filters.transactionType !== 'all') {
      result = result.filter(tx => 
        filters.transactionType === 'penerimaan' 
          ? Object.keys(tx.penerimaan || {}).length > 0
          : Object.keys(tx.pengeluaran || {}).length > 0
      );
    }

    // Apply date range filter
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      result = result.filter(tx => new Date(tx.tanggal) >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999); // End of the day
      result = result.filter(tx => new Date(tx.tanggal) <= end);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortField) {
        case 'kategori':
          aValue = Object.keys(a.penerimaan || a.pengeluaran || {})[0] || '';
          bValue = Object.keys(b.penerimaan || b.pengeluaran || {})[0] || '';
          break;
        case 'tanggal':
          aValue = new Date(a.tanggal);
          bValue = new Date(b.tanggal);
          break;
        default:
          aValue = a[filters.sortField as keyof typeof a];
          bValue = b[filters.sortField as keyof typeof b];
      }

      if (aValue < bValue) return filters.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [transactionsWithRunningBalance, filters]);


  const [editedTransactions, setEditedTransactions] = useState<TransactionItem[]>(transactionsWithRunningBalance);
  const [simpleForm, setSimpleForm] = useState<SimpleFormData>({
    tanggal: new Date().toISOString().split('T')[0],
    tipe: 'penerimaan',
    kategori: '',
    uraian: '',
    jumlah: '0'
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  // Update the error state type to allow undefined values for clearing errors
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string | null}>({ 
    isOpen: false, 
    id: null 
  });
  

  // Extract unique categories from context and transactions
  const availableCategories = useMemo(() => {
    console.log('Recalculating available categories');
    
    // Create a map of categories from context
    const contextCategories = {
      penerimaan: categories
        .filter(cat => cat.type === 'penerimaan')
        .map(cat => cat.name),
      pengeluaran: categories
        .filter(cat => cat.type === 'pengeluaran')
        .map(cat => cat.name)
    };

    console.log('Context categories:', contextCategories);

    // Extract categories from existing transactions
    const transactionCategories = {
      penerimaan: new Set<string>(),
      pengeluaran: new Set<string>()
    };

    transactions.forEach(tx => {
      Object.keys(tx.penerimaan || {}).forEach(cat => 
        transactionCategories.penerimaan.add(cat)
      );
      Object.keys(tx.pengeluaran || {}).forEach(cat => 
        transactionCategories.pengeluaran.add(cat)
      );
    });

    // Combine context categories with transaction categories
    const combinedCategories = {
      penerimaan: Array.from(new Set([
        ...contextCategories.penerimaan,
        ...transactionCategories.penerimaan
      ])),
      pengeluaran: Array.from(new Set([
        ...contextCategories.pengeluaran,
        ...transactionCategories.pengeluaran
      ]))
    };

    console.log('Combined categories:', combinedCategories);
    return combinedCategories;

  }, [transactions, categories]);

  // Debug effect to log available categories
  useEffect(() => {
    console.log('Available categories:', availableCategories);
  }, [availableCategories]);

  // Update local state when transactions prop changes
  useEffect(() => {
    let runningBalance = 0;
    const updatedTransactions = transactions.map(tx => {
      const penerimaan = Object.values(tx.penerimaan || {}).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
      const pengeluaran = Object.values(tx.pengeluaran || {}).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
      const jumlah = penerimaan - pengeluaran;
      runningBalance += jumlah;
      return {
        ...tx,
        jumlah,
        saldo_berjalan: runningBalance
      };
    });
    setEditedTransactions(updatedTransactions);
  }, [transactions]);


  // Handles opening the delete confirmation dialog
  const confirmDeleteClick = useCallback((id: string): void => {
    setDeleteConfirm({ isOpen: true, id });
  }, []);

  const formRef = useRef<HTMLDivElement>(null);

  const handleEdit = useCallback((id: string) => {
    const transaction = editedTransactions.find(tx => tx.id === id) as TransactionItem | undefined;
    if (transaction) {
      // Get the first category from either penerimaan or pengeluaran
      const firstCategory = Object.keys(transaction.penerimaan || {})[0] || 
                          Object.keys(transaction.pengeluaran || {})[0] || '';
      
      // Get the amount from the first category
      const amount = (transaction.penerimaan?.[firstCategory] || 
                     transaction.pengeluaran?.[firstCategory] || 0).toString();
      
      // Determine the type based on which object has values
      const type = Object.keys(transaction.penerimaan || {}).length > 0 ? 'penerimaan' : 'pengeluaran';
      
      setSimpleForm({
        id: transaction.id,
        tanggal: transaction.tanggal,
        tipe: type,
        kategori: firstCategory,
        uraian: transaction.uraian || '',
        jumlah: amount,
      });
      
      setEditingId(id);
      setIsAdding(true);
      
      // Add visual feedback by highlighting the row
      const row = document.getElementById(`transaction-${id}`);
      if (row) {
        row.classList.add('bg-blue-50');
        setTimeout(() => {
          row.classList.remove('bg-blue-50');
        }, 2000);
      }
      
      // Scroll to form with smooth behavior
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [editedTransactions]);

  const confirmDelete = useCallback(() => {
    if (!deleteConfirm.id) return;
    
    const updated = editedTransactions.filter(t => t.id !== deleteConfirm.id);
    setEditedTransactions(updated);
    onSave(updated);
    setDeleteConfirm({ isOpen: false, id: null });
    toast.success('Transaksi berhasil dihapus');
  }, [deleteConfirm.id, editedTransactions, onSave]);

  // Handle input change for simple form
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear any existing error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // For amount field, keep only numbers
    if (name === 'jumlah') {
      const numericValue = value.replace(/\D/g, '');
      setSimpleForm(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setSimpleForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, [errors]);

  // Handle date input with validation
  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const error = getDateValidationError(value);
    
    setSimpleForm(prev => ({
      ...prev,
      tanggal: value
    }));
    
    if (error) {
      setErrors(prev => ({
        ...prev,
        tanggal: error
      }));
    } else if (errors.tanggal) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.tanggal;
        return newErrors;
      });
    }
  }, [errors.tanggal]);

  // Format amount for display (handles both string and number inputs)
  const formatCurrency = (amount: string | number): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };
  
  // Helper to safely convert values to numbers
  const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  };

  // Check for potential duplicate transactions
  const checkForDuplicates = useCallback((txData: TransactionItem, currentId?: string): boolean => {
    return transactions.some(tx => {
      // Skip the current transaction when editing
      if (currentId && tx.id === currentId) return false;
      
      // Check for same date, similar amount (±1%), and similar description
      const isSameDate = tx.tanggal === txData.tanggal;
      const txAmount = Math.abs(toNumber(tx.jumlah));
      const newAmount = Math.abs(toNumber(txData.jumlah));
      const amountDiff = Math.abs(txAmount - newAmount);
      const isSimilarAmount = amountDiff / Math.max(txAmount, 1) < 0.01; // Within 1%
      
      // Check if descriptions are similar (case insensitive, ignoring whitespace)
      const normalizeStr = (str: string) => str.toLowerCase().replace(/\s+/g, '');
      const txDesc = normalizeStr(tx.uraian || '');
      const newDesc = normalizeStr(txData.uraian || '');
      const isSimilarDescription = 
        txDesc.includes(newDesc) || 
        newDesc.includes(txDesc) ||
        txDesc.length > 0 && newDesc.length > 0 && (
          txDesc.length > newDesc.length 
            ? (txDesc.includes(newDesc) || newDesc.length / txDesc.length > 0.7)
            : (newDesc.includes(txDesc) || txDesc.length / newDesc.length > 0.7)
        );
      
      // If same date, similar amount, and similar descriptions, it's likely a duplicate
      return isSameDate && isSimilarAmount && isSimilarDescription;
    });
  }, [transactions]);

  // Save transaction after duplicate check
  const saveTransaction = useCallback((txData: Omit<TransactionItem, 'id' | 'saldo_berjalan'>, currentId?: string) => {
    const newTransaction: TransactionItem = {
      ...txData,
      id: currentId || `tx-${Date.now()}`,
      saldo_berjalan: 0 // This will be recalculated
    };

    let updated: TransactionItem[];
    if (currentId) {
      // Update existing transaction
      updated = editedTransactions.map(tx => 
        tx.id === currentId ? { ...newTransaction } : tx
      );
    } else {
      // Add new transaction
      updated = [...editedTransactions, newTransaction];
    }

    setEditedTransactions(updated);
    onSave(updated);
    
    // Reset the form
    setSimpleForm({
      tanggal: new Date().toISOString().split('T')[0],
      tipe: 'penerimaan',
      kategori: '',
      uraian: '',
      jumlah: '0'
    });
    
    setIsAdding(false);
    setEditingId(null);
  }, [editedTransactions, onSave]);

  const handleSaveTransaction = useCallback((e: React.FormEvent): void => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    const newErrors: Record<string, string> = {};
    const amount = toNumber(simpleForm.jumlah);
    
    if (!simpleForm.tanggal) {
      newErrors.tanggal = 'Tanggal harus diisi';
    }
    
    if (!simpleForm.kategori) {
      newErrors.kategori = 'Kategori harus dipilih';
    }
    
    if (!simpleForm.uraian) {
      newErrors.uraian = 'Uraian harus diisi';
    }
    
    if (isNaN(amount) || amount <= 0) {
      newErrors.jumlah = 'Jumlah harus lebih dari 0';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Terdapat kesalahan pada form. Silakan periksa kembali.');
      return;
    }

    // Prepare the transaction data
    const txData: Omit<TransactionItem, 'id' | 'saldo_berjalan'> = {
      tanggal: simpleForm.tanggal,
      uraian: simpleForm.uraian.trim(),
      penerimaan: {},
      pengeluaran: {},
      jumlah: 0
    };

    // Set the appropriate transaction type and amount
    if (simpleForm.tipe === 'penerimaan') {
      txData.penerimaan = { [simpleForm.kategori]: Number(simpleForm.jumlah) };
    } else {
      txData.pengeluaran = { [simpleForm.kategori]: Number(simpleForm.jumlah) };
    }

    // Calculate total amount
    const penerimaanTotal = Object.values(txData.penerimaan).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const pengeluaranTotal = Object.values(txData.pengeluaran).reduce((sum, val) => sum + (Number(val) || 0), 0);
    txData.jumlah = penerimaanTotal - pengeluaranTotal;

    // Check for duplicates for both new and updated transactions
    const isDuplicate = checkForDuplicates(txData as TransactionItem, editingId || undefined);
    if (isDuplicate) {
      // Show duplicate warning
      setDuplicateWarning({
        isOpen: true,
        transaction: { ...txData, id: editingId || 'temp', saldo_berjalan: 0 } as TransactionItem,
        onConfirm: () => saveTransaction(txData, editingId || undefined)
      });
      return; // Wait for user confirmation
    }

    // If no duplicates found, save the transaction
    saveTransaction(txData, editingId || undefined);
  }, [simpleForm, editingId, editedTransactions, onSave]);

  // Add scroll to form with smooth behavior
  useEffect(() => {
    if (isAdding && formRef.current) {
      // Small delay to ensure the form is rendered
      const timer = setTimeout(() => {
        formRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'start'
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isAdding, editingId]);

  // Filter and search controls component
  const FilterControls = (): JSX.Element => {
    const hasActiveFilters = filters.searchQuery || 
                           filters.transactionType !== 'all' || 
                           filters.startDate || 
                           filters.endDate;

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 text-blue-500 mr-2" />
            Filter Transaksi
          </h3>
        </div>
        
        <div className="p-5 space-y-4">
          {/* Top Row: Search and Reset */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* Search Input */}
            <div className="relative flex-grow md:w-2/3">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1.5">
                Cari Transaksi
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-grow rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="search"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Cari uraian/kategori..."
                    defaultValue={filters.searchQuery}
                    ref={searchInputRef}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Cari
                </button>
              </div>
            </div>

            {/* Reset Filters Button */}
            <div className="flex items-end justify-end md:justify-end w-full md:w-1/3">
              <button
                type="button"
                onClick={() => {
                  setFilters({
                    searchQuery: '',
                    transactionType: 'all',
                    startDate: '',
                    endDate: '',
                    sortField: 'tanggal',
                    sortDirection: 'desc'
                  });
                  if (searchInputRef.current) {
                    searchInputRef.current.value = '';
                  }
                }}
                disabled={!hasActiveFilters}
                className={`w-full md:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  hasActiveFilters 
                    ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent'
                }`}
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Reset Filter
              </button>
            </div>
          </div>

          {/* Bottom Row: Other Filters */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* Transaction Type Filter */}
            <div className="w-full md:w-1/3">
              <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700 mb-1.5">
                Jenis Transaksi
              </label>
              <div className="relative">
                <select
                  id="transactionType"
                  className="appearance-none block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={filters.transactionType}
                  onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value as any }))}
                >
                  <option value="all">Semua Transaksi</option>
                  <option value="penerimaan">Penerimaan</option>
                  <option value="pengeluaran">Pengeluaran</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Start Date */}
            <div className="relative w-full md:w-1/3">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                Dari Tanggal
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="startDate"
                  className="block w-full pl-3 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
            </div>

            {/* End Date */}
            <div className="relative w-full md:w-1/3">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                Sampai Tanggal
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="endDate"
                  className="block w-full pl-3 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  min={filters.startDate}
                />
              </div>
            </div>
          </div>
          
          {/* Active Filters Badges */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.searchQuery && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Pencarian: {filters.searchQuery}
                  <button 
                    onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 hover:bg-blue-300 focus:outline-none"
                  >
                    <XMarkIcon className="h-3 w-3 text-blue-600" />
                  </button>
                </span>
              )}
              {filters.transactionType !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Jenis: {filters.transactionType === 'penerimaan' ? 'Penerimaan' : 'Pengeluaran'}
                  <button 
                    onClick={() => setFilters(prev => ({ ...prev, transactionType: 'all' }))}
                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-200 hover:bg-green-300 focus:outline-none"
                  >
                    <XMarkIcon className="h-3 w-3 text-green-600" />
                  </button>
                </span>
              )}
              {filters.startDate && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Dari: {new Date(filters.startDate).toLocaleDateString('id-ID')}
                  <button 
                    onClick={() => setFilters(prev => ({ ...prev, startDate: '' }))}
                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-purple-200 hover:bg-purple-300 focus:outline-none"
                  >
                    <XMarkIcon className="h-3 w-3 text-purple-600" />
                  </button>
                </span>
              )}
              {filters.endDate && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Sampai: {new Date(filters.endDate).toLocaleDateString('id-ID')}
                  <button 
                    onClick={() => setFilters(prev => ({ ...prev, endDate: '' }))}
                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-yellow-200 hover:bg-yellow-300 focus:outline-none"
                  >
                    <XMarkIcon className="h-3 w-3 text-yellow-600" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render the transaction list
  const renderTransactionList = (): JSX.Element => (
    <div className="overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSort('tanggal')}
            >
              <div className="flex items-center">
                Tanggal
                {filters.sortField === 'tanggal' ? (
                  filters.sortDirection === 'asc' 
                    ? <ChevronUpIcon className="ml-2 h-5 w-5 text-blue-600 font-bold" /> 
                    : <ChevronDownIcon className="ml-2 h-5 w-5 text-blue-600 font-bold" />
                ) : <ArrowsUpDownIcon className="ml-2 h-4 w-4 text-gray-400" />}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSort('uraian')}
            >
              <div className="flex items-center">
                Uraian
                {filters.sortField === 'uraian' ? (
                  filters.sortDirection === 'asc' 
                    ? <ChevronUpIcon className="ml-2 h-5 w-5 text-blue-600 font-bold" /> 
                    : <ChevronDownIcon className="ml-2 h-5 w-5 text-blue-600 font-bold" />
                ) : <ArrowsUpDownIcon className="ml-2 h-4 w-4 text-gray-400" />}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSort('kategori')}
            >
              <div className="flex items-center">
                Kategori
                {filters.sortField === 'kategori' ? (
                  filters.sortDirection === 'asc' 
                    ? <ChevronUpIcon className="ml-2 h-5 w-5 text-blue-600 font-bold" /> 
                    : <ChevronDownIcon className="ml-2 h-5 w-5 text-blue-600 font-bold" />
                ) : <ArrowsUpDownIcon className="ml-2 h-4 w-4 text-gray-400" />}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSort('jumlah')}
            >
              <div className="flex items-center justify-end">
                Jumlah
                {filters.sortField === 'jumlah' ? (
                  filters.sortDirection === 'asc' 
                    ? <ChevronUpIcon className="ml-2 h-5 w-5 text-blue-600 font-bold" /> 
                    : <ChevronDownIcon className="ml-2 h-5 w-5 text-blue-600 font-bold" />
                ) : <ArrowsUpDownIcon className="ml-2 h-4 w-4 text-gray-400" />}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSort('saldo_berjalan')}
            >
              <div className="flex items-center justify-end">
                Saldo Berjalan
                {filters.sortField === 'saldo_berjalan' ? (
                  filters.sortDirection === 'asc' 
                    ? <ChevronUpIcon className="ml-2 h-5 w-5 text-blue-600 font-bold" /> 
                    : <ChevronDownIcon className="ml-2 h-5 w-5 text-blue-600 font-bold" />
                ) : <ArrowsUpDownIcon className="ml-2 h-4 w-4 text-gray-400" />}
              </div>
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredAndSortedTransactions.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                Tidak ada transaksi. Klik tombol "Tambah Transaksi" untuk menambahkan transaksi baru.
              </td>
            </tr>
          ) : (
            filteredAndSortedTransactions.map((transaction) => {
              const isPenerimaan = Object.keys(transaction.penerimaan || {}).length > 0;
              const category = isPenerimaan 
                ? Object.keys(transaction.penerimaan || {})[0] 
                : Object.keys(transaction.pengeluaran || {})[0];
              const amount = isPenerimaan 
                ? Object.values(transaction.penerimaan || {})[0] 
                : Object.values(transaction.pengeluaran || {})[0];
              
              return (
                <tr 
                  id={`transaction-${transaction.id}`}
                  key={transaction.id} 
                  className={`hover:bg-gray-50 transition-all duration-300 ${
                    editingId === transaction.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(transaction.tanggal).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-medium">
                      {transaction.uraian || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      isPenerimaan 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-medium ${
                      isPenerimaan ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPenerimaan ? '' : '-'}{formatCurrency(Math.abs(toNumber(amount?.toString() || '0')))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.saldo_berjalan?.toString() || '0')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(transaction.id)}
                        className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        title="Edit transaksi"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDeleteClick(transaction.id)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        title="Hapus transaksi"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  // Render the transaction form
  const renderTransactionForm = (): JSX.Element => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {editingId ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {editingId ? 'Perbarui detail transaksi' : 'Masukkan detail transaksi baru'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsAdding(false);
            setEditingId(null);
            setErrors({});
          }}
          className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          aria-label="Tutup form"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      
      <form onSubmit={handleSaveTransaction} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Tanggal */}
          <div className="space-y-1">
            <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="tanggal"
                id="tanggal"
                value={simpleForm.tanggal}
                onChange={handleDateChange}
                className={`block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-opacity-50 ${
                  errors.tanggal 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
            </div>
            {errors.tanggal && (
              <p className="mt-1 text-sm text-red-600">{errors.tanggal}</p>
            )}
          </div>

          {/* Jenis Transaksi */}
          <div className="space-y-1">
            <label htmlFor="tipe" className="block text-sm font-medium text-gray-700">
              Jenis Transaksi <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="tipe"
                name="tipe"
                value={simpleForm.tipe}
                onChange={handleInputChange}
                className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <option value="penerimaan" className="text-green-600">Penerimaan</option>
                <option value="pengeluaran" className="text-red-600">Pengeluaran</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Kategori */}
        <div className="space-y-1">
          <label htmlFor="kategori" className="block text-sm font-medium text-gray-700">
            Kategori <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="kategori"
              id="kategori"
              list="kategori-list"
              value={simpleForm.kategori}
              onChange={handleInputChange}
              className={`block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-opacity-50 ${
                errors.kategori 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
              placeholder="Contoh: Gaji, Belanja, dll"
              autoComplete="off"
            />
            {/* Category selection UI */}
            <datalist id="kategori-list">
              {availableCategories[simpleForm.tipe]?.map((category) => (
                <option key={`${simpleForm.tipe}-${category}`} value={category}>
                  {category}
                </option>
              ))}
            </datalist>

            {/* Quick category buttons */}
            {availableCategories[simpleForm.tipe]?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {availableCategories[simpleForm.tipe].map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setSimpleForm(prev => ({
                        ...prev,
                        kategori: category
                      }));
                      if (errors.kategori) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.kategori;
                          return newErrors;
                        });
                      }
                    }}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors duration-200"
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            {errors.kategori && (
              <p className="mt-1 text-sm text-red-600">{errors.kategori}</p>
            )}
          </div>
        </div>

        {/* Uraian */}
        <div className="space-y-1">
          <label htmlFor="uraian" className="block text-sm font-medium text-gray-700">
            Uraian <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="uraian"
            id="uraian"
            value={simpleForm.uraian}
            onChange={handleInputChange}
            className={`block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:ring-opacity-50 ${
              errors.uraian 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            }`}
            placeholder="Deskripsi singkat transaksi"
          />
          {errors.uraian && (
            <p className="mt-1 text-sm text-red-600">{errors.uraian}</p>
          )}
        </div>

        {/* Jumlah */}
        <div className="space-y-1">
          <label htmlFor="jumlah" className="block text-sm font-medium text-gray-700">
            Jumlah (Rp) <span className="text-red-500">*</span>
          </label>
          <div className="space-y-1">
            <div className="relative group">
              <div className={`flex items-center rounded-lg border px-3 py-2.5 shadow-sm transition-all duration-200 ${
                errors.jumlah 
                  ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-200' 
                  : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 group-hover:border-blue-400'
              }`}>
                <span className={`text-gray-500 transition-colors duration-200 ${
                  errors.jumlah ? 'text-red-500' : 'group-hover:text-blue-600'
                }`}>Rp</span>
                <input
                  type="text"
                  name="jumlah"
                  id="jumlah"
                  value={simpleForm.jumlah}
                  onChange={handleInputChange}
                  className="ml-1 w-full border-none p-0 text-gray-900 outline-none focus:ring-0 bg-transparent"
                  placeholder="0"
                  inputMode="numeric"
                  aria-invalid={!!errors.jumlah}
                />
              </div>
              {simpleForm.jumlah && (
                <div className="text-sm text-gray-500 mt-1">
                  Jumlah: Rp {formatCurrency(simpleForm.jumlah)}
                </div>
              )}
            </div>
          {errors.jumlah && (
            <p className="mt-1 text-sm text-red-600">{errors.jumlah}</p>
          )}
          </div>
        </div>

        <div className="pt-2 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setEditingId(null);
              setErrors({});
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            {editingId ? 'Perbarui' : 'Tambah'} Transaksi
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Duplicate Transaction Warning Modal */}
      <div className={`fixed inset-0 z-50 overflow-y-auto ${duplicateWarning.isOpen ? 'block' : 'hidden'}`}>
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Transaksi Serupa Ditemukan
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Transaksi serupa sudah ada di database:
                  </p>
                  {duplicateWarning.transaction && (
                    <div className="mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-left">
                      <p className="text-sm text-yellow-700">
                        <span className="font-medium">Tanggal:</span> {new Date(duplicateWarning.transaction.tanggal).toLocaleDateString('id-ID')}<br />
                        <span className="font-medium">Jumlah:</span> {formatCurrency(Math.abs(Number(duplicateWarning.transaction.jumlah)))}<br />
                        <span className="font-medium">Keterangan:</span> {duplicateWarning.transaction.uraian}
                      </p>
                    </div>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    Apakah Anda yakin ingin menyimpan transaksi ini?
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:col-start-2 sm:text-sm"
                onClick={() => {
                  if (duplicateWarning.onConfirm) {
                    duplicateWarning.onConfirm();
                  }
                  setDuplicateWarning(prev => ({ ...prev, isOpen: false }));
                }}
              >
                Simpan Tetap
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                onClick={() => setDuplicateWarning(prev => ({ ...prev, isOpen: false }))}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
      {showCategoryManager && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Kelola Kategori</h3>
            <button
              onClick={() => setShowCategoryManager(false)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Tutup manajer kategori"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600 mb-4">
              Tambah, edit, atau hapus kategori yang tersedia untuk transaksi.
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-green-600 mb-2">Kategori Penerimaan</h4>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.penerimaan.map(cat => (
                    <span key={cat} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-red-600 mb-2">Kategori Pengeluaran</h4>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.pengeluaran.map(cat => (
                    <span key={cat} className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    // Open the full category manager in a modal or new page
                    // This is a placeholder - you'll need to implement the actual modal or navigation
                    alert('Buka halaman manajemen kategori lengkap');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Kelola Kategori Lengkap →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      

      <div className="bg-white/80 backdrop-blur-sm rounded-lg mb-6 transition-all duration-200 ease-in-out">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowFilters(prev => !prev)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <FunnelIcon className="h-4 w-4 mr-2 text-blue-500" />
              <span>{showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}</span>
            </button>
          </div>
          <div className="w-full sm:w-auto">
            {!isAdding && (
              <button
                type="button"
                onClick={() => {
                  setIsAdding(true);
                  setSimpleForm({
                    tanggal: new Date().toISOString().split('T')[0],
                    uraian: '',
                    jumlah: '',
                    tipe: 'penerimaan',
                    kategori: ''
                  });
                  setEditingId(null);
                  // Smooth scroll to form when added
                  setTimeout(() => {
                    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }, 50);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
                <span>Tambah Transaksi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showFilters && <FilterControls />}
      
      {isAdding && (
        <div 
          ref={formRef} 
          className="mb-6 transition-all duration-300 ease-in-out transform hover:shadow-lg border-l-4 border-blue-500 pl-4 bg-blue-50/30 rounded-r-lg"
          style={{ scrollMarginTop: '20px' }}
        >
          {renderTransactionForm()}
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Hapus Transaksi"
        message="Apakah Anda yakin ingin menghapus transaksi ini?"
        confirmText="Hapus"
        cancelText="Batal"
      />

      {editedTransactions.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">
              Daftar Transaksi {isAdding && '(Scroll ke bawah untuk melihat semua)'}
            </h3>
            {isAdding && (
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Sembunyikan Form
              </button>
            )}
          </div>
          {renderTransactionList()}
        </div>
      )}

      {editedTransactions.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow border border-gray-100 transition-all duration-200 hover:shadow-md">
          <div className="text-sm text-gray-600">
            Total <span className="font-medium">{editedTransactions.length}</span> transaksi
          </div>
          <button
            type="button"
            onClick={() => {
              navigate('/reports', { 
                state: { 
                  accountData: {
                    name: accountName,
                    transactions: editedTransactions
                  }
                } 
              });
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ChartBarIcon className="-ml-1 mr-2 h-4 w-4" />
            Lihat Laporan
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionEditor;