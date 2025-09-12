export interface TransactionItem {
  id: string;
  tanggal: string;
  uraian: string;
  penerimaan: string;
  pengeluaran: string;
  saldo: number;
}

export interface AccountData {
  name: string;
  transactions: TransactionItem[];
}

export interface UploadResponse {
  accounts: AccountData[];
}

export interface FileValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface AccountBalance {
  [key: string]: number;
}

export interface AccountType {
  [key: string]: string; // accountName: accountType (asset, liability, equity, income, expense)
}

export interface BalanceSheet {
  assets: AccountBalance;
  liabilities: AccountBalance;
  equity: AccountBalance;
}

export interface IncomeStatement {
  income: AccountBalance;
  expenses: AccountBalance;
  netIncome: number;
}

export interface CashFlow {
  operating: number;
  investing: number;
  financing: number;
  netCashFlow: number;
}

export interface FinancialStatements {
  balanceSheet: BalanceSheet;
  incomeStatement: IncomeStatement;
  cashFlow: CashFlow;
}
