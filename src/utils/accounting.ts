/**
 * Authoritative Accounting Logic & Formatting for
 * SATTAR AUTO MOBILE & ELECTRICAL SERVICES
 * 
 * Rules:
 * 1. IN: Money received (Income)
 * 2. OUT: Money spent (Expense)
 * 3. TRANSFER: Money moved between accounts (NOT income, NOT expense, Net Cash Flow neutral)
 * 4. Account balance formula:
 *    Opening Balance + Money In - Money Out + Transfers In - Transfers Out
 * 5. VOID transactions are visible in history but excluded from balance & net cash flow
 */

import { Account, Transaction, PeriodFilter, CategorySummary } from '../types/finance';

/**
 * Format currency in PKR with thousands separator.
 * Whole numbers without redundant decimals, matching workshop practice.
 */
export function formatPKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'PKR 0';
  }
  const isNegative = amount < 0;
  const absVal = Math.round(Math.abs(amount));
  const formatted = new Intl.NumberFormat('en-PK').format(absVal);
  return isNegative ? `-PKR ${formatted}` : `PKR ${formatted}`;
}

/**
 * Format date in Asia/Karachi friendly format, e.g., "08 Oct 2026"
 */
export function formatDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return '—';
  try {
    let d: Date;
    if (typeof dateInput === 'string') {
      // Handles YYYY-MM-DD or ISO strings without timezone warping
      const parts = dateInput.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        d = new Date(year, month, day);
      } else {
        d = new Date(dateInput);
      }
    } else {
      d = dateInput;
    }

    if (isNaN(d.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Karachi',
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Format time in 12-hour format, e.g. "1:42 PM"
 */
export function formatTime(timeInput: string | undefined): string {
  if (!timeInput) return '—';
  try {
    if (timeInput.includes(':')) {
      const [h, m] = timeInput.split(':');
      let hour = parseInt(h, 10);
      const min = parseInt(m, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12; // '0' should be 12
      const minStr = min < 10 ? `0${min}` : `${min}`;
      return `${hour}:${minStr} ${ampm}`;
    }
    return timeInput;
  } catch {
    return timeInput;
  }
}

/**
 * Calculate authoritative account balances following formula:
 * Opening Balance + Money In - Money Out + Transfers In - Transfers Out
 */
export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Account[] {
  // Map of accountId or accountName to balance adjustments
  const inMap: Record<string, number> = {};
  const outMap: Record<string, number> = {};
  const transferInMap: Record<string, number> = {};
  const transferOutMap: Record<string, number> = {};

  for (const t of transactions) {
    if (t.status === 'VOID') continue;
    const amt = Number(t.amount) || 0;
    if (amt <= 0) continue;

    const fromAccKey = (t.accountId || t.account || '').trim().toLowerCase();
    const toAccKey = (t.toAccountId || t.toAccount || '').trim().toLowerCase();

    if (t.type === 'IN') {
      inMap[fromAccKey] = (inMap[fromAccKey] || 0) + amt;
    } else if (t.type === 'OUT') {
      outMap[fromAccKey] = (outMap[fromAccKey] || 0) + amt;
    } else if (t.type === 'TRANSFER') {
      if (fromAccKey) {
        transferOutMap[fromAccKey] = (transferOutMap[fromAccKey] || 0) + amt;
      }
      if (toAccKey) {
        transferInMap[toAccKey] = (transferInMap[toAccKey] || 0) + amt;
      }
    }
  }

  return accounts.map((acc) => {
    const keyId = (acc.id || '').trim().toLowerCase();
    const keyName = (acc.name || '').trim().toLowerCase();

    const moneyIn = (inMap[keyId] || 0) + (inMap[keyName] || 0);
    const moneyOut = (outMap[keyId] || 0) + (outMap[keyName] || 0);
    const transfersIn = (transferInMap[keyId] || 0) + (transferInMap[keyName] || 0);
    const transfersOut = (transferOutMap[keyId] || 0) + (transferOutMap[keyName] || 0);

    const opening = Number(acc.openingBalance) || 0;
    // Account balance formula: Opening + In - Out + Transfers In - Transfers Out
    const computed = opening + moneyIn - moneyOut + transfersIn - transfersOut;

    return {
      ...acc,
      currentBalance: acc.currentBalance !== undefined && acc.currentBalance !== null
        ? Number(acc.currentBalance)
        : computed,
    };
  });
}

/**
 * Filter transactions by period in Asia/Karachi context
 */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: PeriodFilter,
  customRange?: { startDate: string; endDate: string }
): Transaction[] {
  if (!transactions || transactions.length === 0) return [];
  if (period === 'custom' && customRange) {
    return transactions.filter((t) => {
      const d = t.date?.split('T')[0];
      return d && d >= customRange.startDate && d <= customRange.endDate;
    });
  }

  // Current date in Asia/Karachi
  const now = new Date();
  const karachiStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }); // YYYY-MM-DD
  const [curYear, curMonth, curDay] = karachiStr.split('-').map(Number);
  const todayDate = new Date(curYear, curMonth - 1, curDay);

  const getDaysAgo = (days: number) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - days);
    return d.toLocaleDateString('en-CA');
  };

  const todayStr = karachiStr;
  const yesterdayStr = getDaysAgo(1);

  // Day of week: 0 = Sun, 1 = Mon ...
  const dayOfWeek = todayDate.getDay();
  // Mon = 1, Sun = 7
  const distFromMon = (dayOfWeek + 6) % 7;
  const startOfThisWeek = getDaysAgo(distFromMon);
  const startOfLastWeek = getDaysAgo(distFromMon + 7);
  const endOfLastWeek = getDaysAgo(distFromMon + 1);

  const startOfThisMonth = `${curYear}-${String(curMonth).padStart(2, '0')}-01`;
  const prevMonthDate = new Date(curYear, curMonth - 2, 1);
  const prevMonthYear = prevMonthDate.getFullYear();
  const prevMonthNum = prevMonthDate.getMonth() + 1;
  const lastDayOfPrevMonth = new Date(curYear, curMonth - 1, 0).getDate();
  const startOfLastMonth = `${prevMonthYear}-${String(prevMonthNum).padStart(2, '0')}-01`;
  const endOfLastMonth = `${prevMonthYear}-${String(prevMonthNum).padStart(2, '0')}-${String(lastDayOfPrevMonth).padStart(2, '0')}`;

  const currentQuarter = Math.floor((curMonth - 1) / 3);
  const quarterStartMonth = currentQuarter * 3 + 1;
  const startOfThisQuarter = `${curYear}-${String(quarterStartMonth).padStart(2, '0')}-01`;

  const startOfThisYear = `${curYear}-01-01`;

  return transactions.filter((t) => {
    const d = t.date ? t.date.split('T')[0] : '';
    if (!d) return false;

    switch (period) {
      case 'today':
        return d === todayStr;
      case 'yesterday':
        return d === yesterdayStr;
      case 'this_week':
        return d >= startOfThisWeek && d <= todayStr;
      case 'last_week':
        return d >= startOfLastWeek && d <= endOfLastWeek;
      case 'this_month':
        return d >= startOfThisMonth && d <= todayStr;
      case 'last_month':
        return d >= startOfLastMonth && d <= endOfLastMonth;
      case 'this_quarter':
        return d >= startOfThisQuarter && d <= todayStr;
      case 'this_year':
        return d >= startOfThisYear && d <= todayStr;
      default:
        return true;
    }
  });
}

/**
 * Calculate totals strictly adhering to rules:
 * - IN is income
 * - OUT is expense
 * - TRANSFER does NOT affect income or expense
 * - Net Cash Flow = Total In - Total Out
 * - VOID is excluded
 */
export function calculateTotals(transactions: Transaction[]) {
  let totalIn = 0;
  let totalOut = 0;
  let totalTransfer = 0;
  let countIn = 0;
  let countOut = 0;
  let countTransfer = 0;
  let countVoid = 0;

  const incomeCatMap: Record<string, { amount: number; count: number }> = {};
  const expenseCatMap: Record<string, { amount: number; count: number }> = {};

  for (const t of transactions) {
    if (t.status === 'VOID') {
      countVoid++;
      continue;
    }
    const amt = Number(t.amount) || 0;
    if (amt <= 0) continue;

    if (t.type === 'IN') {
      totalIn += amt;
      countIn++;
      const cat = t.category || 'Uncategorized';
      if (!incomeCatMap[cat]) incomeCatMap[cat] = { amount: 0, count: 0 };
      incomeCatMap[cat].amount += amt;
      incomeCatMap[cat].count += 1;
    } else if (t.type === 'OUT') {
      totalOut += amt;
      countOut++;
      const cat = t.category || 'Uncategorized';
      if (!expenseCatMap[cat]) expenseCatMap[cat] = { amount: 0, count: 0 };
      expenseCatMap[cat].amount += amt;
      expenseCatMap[cat].count += 1;
    } else if (t.type === 'TRANSFER') {
      totalTransfer += amt;
      countTransfer++;
      // Strictly do not add to totalIn or totalOut
    }
  }

  const incomeByCategory: CategorySummary[] = Object.entries(incomeCatMap)
    .map(([category, val]) => ({
      category,
      amount: val.amount,
      count: val.count,
      percentage: totalIn > 0 ? (val.amount / totalIn) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const expensesByCategory: CategorySummary[] = Object.entries(expenseCatMap)
    .map(([category, val]) => ({
      category,
      amount: val.amount,
      count: val.count,
      percentage: totalOut > 0 ? (val.amount / totalOut) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalIn,
    totalOut,
    netCashFlow: totalIn - totalOut, // Transfers strictly excluded
    totalTransfer,
    countIn,
    countOut,
    countTransfer,
    countVoid,
    incomeByCategory,
    expensesByCategory,
  };
}
