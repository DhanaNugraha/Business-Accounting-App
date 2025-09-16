import { TransactionItem } from '@/types';

// Date Validation
export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regex)) return false;
  
  const date = new Date(dateString);
  const timestamp = date.getTime();
  
  // Check if the date is valid
  if (isNaN(timestamp)) return false;
  
  // No date restrictions
  return true;
};

export const getDateValidationError = (dateString: string): string | null => {
  if (!dateString) return 'Tanggal tidak boleh kosong';
  
  if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD';
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Tanggal tidak valid';
  
  // No date restrictions
  
  return null;
};

// Numeric Validation
export const isValidNumber = (value: string | number): boolean => {
  if (value === '') return false;
  const num = Number(value);
  return !isNaN(num) && isFinite(num) && num >= 0;
};

export const getNumberValidationError = (value: string | number, fieldName: string = 'Nilai'): string | null => {
  if (value === '') return `${fieldName} tidak boleh kosong`;
  
  const num = Number(value);
  if (isNaN(num)) return `${fieldName} harus berupa angka`;
  if (!isFinite(num)) return `${fieldName} tidak valid`;
  if (num < 0) return `${fieldName} tidak boleh negatif`;
  
  return null;
};

// Category Name Validation
export const isValidCategoryName = (name: string): boolean => {
  if (!name.trim()) return false;
  // Only allow letters, numbers, spaces, and basic punctuation
  return /^[\w\-\s]+$/.test(name);
};

export const getCategoryNameError = (name: string): string | null => {
  if (!name.trim()) return 'Nama kategori tidak boleh kosong';
  if (!/^[\w\-\s]+$/.test(name)) {
    return 'Nama kategori hanya boleh berisi huruf, angka, spasi, dan tanda hubung (-)';
  }
  return null;
};

// Transaction Validation
export const validateTransaction = (transaction: Omit<TransactionItem, 'id' | 'saldo'>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Validate date
  const dateError = getDateValidationError(transaction.tanggal);
  if (dateError) errors.tanggal = dateError;
  
  // Validate jumlah
  if (isNaN(Number(transaction.jumlah))) {
    errors.jumlah = 'Jumlah harus berupa angka';
  }
  
  // Validate description
  if (!transaction.uraian?.trim()) {
    errors.uraian = 'Uraian tidak boleh kosong';
  }
  
  // Validate at least one amount field is filled
  const hasPenerimaan = Object.values(transaction.penerimaan || {}).some(v => v > 0);
  const hasPengeluaran = Object.values(transaction.pengeluaran || {}).some(v => v > 0);
  
  if (!hasPenerimaan && !hasPengeluaran) {
    errors.amount = 'Minimal harus ada satu nilai penerimaan atau pengeluaran';
  }
  
  // Validate category names
  Object.keys(transaction.penerimaan || {}).forEach(cat => {
    const error = getCategoryNameError(cat);
    if (error) {
      errors[`penerimaan_${cat}`] = `Kategori Penerimaan: ${error}`;
    }
  });
  
  Object.keys(transaction.pengeluaran || {}).forEach(cat => {
    const error = getCategoryNameError(cat);
    if (error) {
      errors[`pengeluaran_${cat}`] = `Kategori Pengeluaran: ${error}`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Account Balance Validation
export const validateAccountBalance = (
  transactions: TransactionItem[],
  initialBalance: number = 0
): { isValid: boolean; currentBalance: number; expectedBalance: number } => {
  let calculatedBalance = initialBalance;
  
  for (const tx of transactions) {
    const penerimaan = Object.values(tx.penerimaan || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const pengeluaran = Object.values(tx.pengeluaran || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const jumlah = penerimaan - pengeluaran;
    calculatedBalance += jumlah;
    
    // Check if balance would go negative
    if (calculatedBalance < 0) {
      return {
        isValid: false,
        currentBalance: calculatedBalance,
        expectedBalance: tx.jumlah || 0
      };
    }
  }
  
  return {
    isValid: true,
    currentBalance: calculatedBalance,
    expectedBalance: 0
  };
};
