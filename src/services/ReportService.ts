import { BalanceSheet, IncomeStatement, CashFlowDirect, BalanceRow, AccountType } from '@/types/accounting';
import { db } from '@/db/db';

const CASH_ACCOUNT_NAME = 'Cash'; // from seed (id=1). Prefer name lookup to avoid hard-coding ids.

export class ReportService {
  static async getBalanceSheet(asOf: string): Promise<BalanceSheet> {
    // Helper to fetch balances by type with proper sign
    const fetchByType = async (type: AccountType, sign: 'debit' | 'credit'): Promise<BalanceRow[]> => {
      const rows = await db.execute(/* sql */`
        SELECT a.id as accountId, a.name as accountName,
               SUM(CASE WHEN t.debit_account_id = a.id THEN t.amount ELSE 0 END) AS deb,
               SUM(CASE WHEN t.credit_account_id = a.id THEN t.amount ELSE 0 END) AS cred
        FROM accounts a
        LEFT JOIN transactions t ON a.id IN (t.debit_account_id, t.credit_account_id) AND t.date <= ?
        WHERE a.type = ?
        GROUP BY a.id, a.name
      `, [asOf, type]) as any[];

      return rows.map((r: any) => {
        const deb = Number(r.deb || 0);
        const cred = Number(r.cred || 0);
        const balance = sign === 'debit' ? (deb - cred) : (cred - deb);
        return { accountId: r.accountId, accountName: r.accountName, balance };
      }).filter((r: BalanceRow) => Math.abs(r.balance) > 0.000001);
    };

    const assets = await fetchByType('Asset', 'debit');
    const liabilities = await fetchByType('Liability', 'credit');
    const equity = await fetchByType('Equity', 'credit');

    const sum = (xs: BalanceRow[]) => xs.reduce((a, x) => a + x.balance, 0);
    return {
      asOf,
      assets,
      liabilities,
      equity,
      totals: {
        assets: sum(assets),
        liabilities: sum(liabilities),
        equity: sum(equity),
      },
    };
  }

  static async getIncomeStatement(start: string, end: string): Promise<IncomeStatement> {
    const fetchType = async (type: AccountType, positiveWhen: 'credit' | 'debit') => {
      const rows = await db.execute(/* sql */`
        SELECT a.id as accountId, a.name as accountName,
               SUM(CASE WHEN t.debit_account_id = a.id THEN t.amount ELSE 0 END) AS deb,
               SUM(CASE WHEN t.credit_account_id = a.id THEN t.amount ELSE 0 END) AS cred
        FROM accounts a
        LEFT JOIN transactions t ON a.id IN (t.debit_account_id, t.credit_account_id)
           AND t.date BETWEEN ? AND ?
        WHERE a.type = ?
        GROUP BY a.id, a.name
      `, [start, end, type]) as any[];

      return rows.map((r: any) => {
        const deb = Number(r.deb || 0), cred = Number(r.cred || 0);
        const balance = positiveWhen === 'credit' ? (cred - deb) : (deb - cred);
        return { accountId: r.accountId, accountName: r.accountName, balance };
      }).filter((r: BalanceRow) => Math.abs(r.balance) > 0.000001);
    };

    const income = await fetchType('Income', 'credit');
    const expenses = await fetchType('Expense', 'debit');

    const sum = (xs: BalanceRow[]) => xs.reduce((a, x) => a + x.balance, 0);
    const totalIncome = sum(income);
    const totalExpenses = sum(expenses);

    return {
      periodStart: start,
      periodEnd: end,
      income,
      expenses,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        netIncome: totalIncome - totalExpenses,
      },
    };
  }

  static async getCashFlowDirect(start: string, end: string): Promise<CashFlowDirect> {
    // Look up Cash account id by name to avoid hardcoding
    const cash = await db.execute(`SELECT id FROM accounts WHERE name = ? LIMIT 1`, [CASH_ACCOUNT_NAME]) as any[];
    const cashId = cash?.[0]?.id;
    if (!cashId) throw new Error('Cash account not found');

    const inflows = await db.execute(/* sql */`
      SELECT t.date as date, t.amount as amount, ac.name as counterparty
      FROM transactions t
      JOIN accounts ad ON ad.id = t.debit_account_id
      JOIN accounts ac ON ac.id = t.credit_account_id
      WHERE t.debit_account_id = ?
        AND t.date BETWEEN ? AND ?
      ORDER BY t.date ASC
    `, [cashId, start, end]);

    const outflows = await db.execute(/* sql */`
      SELECT t.date as date, t.amount as amount, ad.name as counterparty
      FROM transactions t
      JOIN accounts ad ON ad.id = t.debit_account_id
      JOIN accounts ac ON ac.id = t.credit_account_id
      WHERE t.credit_account_id = ?
        AND t.date BETWEEN ? AND ?
      ORDER BY t.date ASC
    `, [cashId, start, end]);

    const sum = (xs: any[]) => xs.reduce((a, x) => a + Number(x.amount || 0), 0);
    return {
      periodStart: start,
      periodEnd: end,
      inflows,
      outflows,
      totals: {
        inflows: sum(inflows),
        outflows: sum(outflows),
        netCash: sum(inflows) - sum(outflows),
      },
    };
  }
}
