import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportService } from '../ReportService';
import type { BalanceRow } from '@/types/accounting';

// Mock the database
vi.mock('@/db/db', () => ({
  db: { execute: vi.fn() }
}));

import { db } from '@/db/db';

// Cast to Vitest's MockInstance type
const mockDbExecute = db.execute as unknown as ReturnType<typeof vi.fn>;

describe('ReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation that returns empty array
    mockDbExecute.mockResolvedValue([]);
  });

  describe('getBalanceSheet', () => {
    it('correctly calculates balance sheet totals', async () => {
      // Set up mock implementations for each query
      mockDbExecute
        .mockImplementationOnce(() => Promise.resolve([ // Assets
          { accountId: 1, accountName: 'Cash', deb: 1000, cred: 200 },
          { accountId: 2, accountName: 'Inventory', deb: 500, cred: 100 }
        ]))
        .mockImplementationOnce(() => Promise.resolve([ // Liabilities
          { accountId: 3, accountName: 'Accounts Payable', deb: 0, cred: 300 }
        ]))
        .mockImplementationOnce(() => Promise.resolve([ // Equity
          { accountId: 4, accountName: 'Retained Earnings', deb: 0, cred: 1000 }
        ]));

      const result = await ReportService.getBalanceSheet('2025-12-31');

      // Verify the structure
      expect(result).toHaveProperty('asOf', '2025-12-31');
      
      // Verify the data
      expect(result.assets).toHaveLength(2);
      expect(result.assets).toContainEqual({
        accountId: 1,
        accountName: 'Cash',
        balance: 800 // 1000 - 200
      });
      expect(result.assets).toContainEqual({
        accountId: 2,
        accountName: 'Inventory',
        balance: 400 // 500 - 100
      });
      
      expect(result.liabilities).toHaveLength(1);
      expect(result.liabilities[0]).toMatchObject({
        accountId: 3,
        accountName: 'Accounts Payable',
        balance: 300
      });
      
      expect(result.equity).toHaveLength(1);
      expect(result.equity[0]).toMatchObject({
        accountId: 4,
        accountName: 'Retained Earnings',
        balance: 1000
      });

      // Verify calculations
      expect(result.totals.assets).toBe(1200); // 800 + 400
      expect(result.totals.liabilities).toBe(300);
      expect(result.totals.equity).toBe(1000);
    });
  });

  describe('getIncomeStatement', () => {
    it('correctly calculates income statement', async () => {
      // Set up mock implementations for each query
      mockDbExecute
        .mockImplementationOnce(() => Promise.resolve([ // Income
          { accountId: 5, accountName: 'Sales Revenue', deb: 0, cred: 2000 },
          { accountId: 6, accountName: 'Interest Income', deb: 0, cred: 100 }
        ]))
        .mockImplementationOnce(() => Promise.resolve([ // Expenses
          { accountId: 7, accountName: 'Rent Expense', deb: 500, cred: 0 },
          { accountId: 8, accountName: 'Salaries', deb: 800, cred: 0 }
        ]));

      const result = await ReportService.getIncomeStatement('2025-01-01', '2025-12-31');

      expect(result.periodStart).toBe('2025-01-01');
      expect(result.periodEnd).toBe('2025-12-31');
      
      // Verify income
      expect(result.income).toHaveLength(2);
      expect(result.income).toContainEqual({
        accountId: 5,
        accountName: 'Sales Revenue',
        balance: 2000 // 0 - (-2000)
      });
      expect(result.income).toContainEqual({
        accountId: 6,
        accountName: 'Interest Income',
        balance: 100 // 0 - (-100)
      });
      
      // Verify expenses
      expect(result.expenses).toHaveLength(2);
      expect(result.expenses).toContainEqual({
        accountId: 7,
        accountName: 'Rent Expense',
        balance: 500 // 500 - 0
      });
      expect(result.expenses).toContainEqual({
        accountId: 8,
        accountName: 'Salaries',
        balance: 800 // 800 - 0
      });
      
      // Verify totals
      expect(result.totals.income).toBe(2100); // 2000 + 100
      expect(result.totals.expenses).toBe(1300); // 500 + 800
      expect(result.totals.netIncome).toBe(800); // 2100 - 1300
    });
  });

  describe('getCashFlowDirect', () => {
    it('correctly calculates cash flow statement', async () => {
      // First call to get cash account ID
      mockDbExecute.mockImplementationOnce(() => 
        Promise.resolve([{ id: 1 }])
      );
      
      // Subsequent calls for inflows and outflows
      mockDbExecute
        .mockResolvedValueOnce([ // Inflows
          { date: '2025-01-15', amount: 1000, counterparty: 'Customer A' },
          { date: '2025-02-20', amount: 500, counterparty: 'Customer B' }
        ])
        .mockResolvedValueOnce([ // Outflows
          { date: '2025-01-10', amount: 300, counterparty: 'Supplier X' },
          { date: '2025-02-05', amount: 200, counterparty: 'Supplier Y' }
        ]);

      const result = await ReportService.getCashFlowDirect('2025-01-01', '2025-12-31');

      expect(result.periodStart).toBe('2025-01-01');
      expect(result.periodEnd).toBe('2025-12-31');
      
      // Verify cash flows
      expect(result.inflows).toHaveLength(2);
      expect(result.outflows).toHaveLength(2);
      
      // Verify totals
      // Inflows: 1000 + 500 = 1500
      // Outflows: 300 + 200 = 500
      // Net Cash: 1500 - 500 = 1000
      expect(result.totals.inflows).toBe(1500);
      expect(result.totals.outflows).toBe(500);
      expect(result.totals.netCash).toBe(1000);
    });
  });
});
