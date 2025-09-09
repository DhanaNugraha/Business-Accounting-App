export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  parent_id?: number | null;
}

export interface Transaction {
  id: number;
  date: string; // ISO yyyy-mm-dd
  amount: number;
  debit_account_id: number;
  credit_account_id: number;
  description?: string | null;
}

export interface TrialBalanceRow {
  accountId: number;
  accountName: string;
  accountType: AccountType;
  debit: number;   // period or to date
  credit: number;  // period or to date
}

export interface BalanceRow {
  accountId: number;
  accountName: string;
  balance: number; // sign already normalized for the section
}

export interface BalanceSheet {
  asOf: string;
  assets: BalanceRow[];
  liabilities: BalanceRow[];
  equity: BalanceRow[];
  totals: { assets: number; liabilities: number; equity: number };
}

export interface IncomeStatement {
  periodStart: string;
  periodEnd: string;
  income: BalanceRow[];
  expenses: BalanceRow[];
  totals: { income: number; expenses: number; netIncome: number };
}

export interface CashFlowLine {
  date: string;
  amount: number;
  counterparty: string; // source/destination account name
}

export interface CashFlowDirect {
  periodStart: string;
  periodEnd: string;
  inflows: CashFlowLine[];
  outflows: CashFlowLine[];
  totals: { inflows: number; outflows: number; netCash: number };
}
