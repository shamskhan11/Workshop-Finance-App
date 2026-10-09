import React, { useState, useMemo } from 'react';
import { Account, Category, Customer, Organization, PeriodFilter, Transaction, Vehicle } from '../types/finance';
import { formatPKR, formatDate, calculateTotals, filterTransactionsByPeriod } from '../utils/accounting';
import { exportFinancialReportPDF } from '../utils/pdfReport';
import {
  BarChart3,
  Calendar,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronDown,
  FileDown,
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  customers: Customer[];
  vehicles: Vehicle[];
  onSelectTransaction: (t: Transaction) => void;
  onShowToast?: (msg: string) => void;
  org?: Organization;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  accounts,
  categories,
  onSelectTransaction,
  onShowToast,
  org,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Filter transactions
  const reportTransactions = useMemo(() => {
    let list = filterTransactionsByPeriod(
      transactions,
      period,
      period === 'custom' && customStart && customEnd
        ? { startDate: customStart, endDate: customEnd }
        : undefined
    );

    if (accountFilter !== 'ALL') {
      list = list.filter((t) => t.account === accountFilter || t.toAccount === accountFilter);
    }

    if (categoryFilter !== 'ALL') {
      list = list.filter((t) => t.category === categoryFilter);
    }

    return list;
  }, [transactions, period, customStart, customEnd, accountFilter, categoryFilter]);

  // Totals calculated strictly per accounting rules
  const totals = useMemo(() => {
    return calculateTotals(reportTransactions);
  }, [reportTransactions]);

  // Largest Income & Largest Expense
  const largestIncome = useMemo(() => {
    return reportTransactions
      .filter((t) => t.type === 'IN' && t.status !== 'VOID')
      .sort((a, b) => b.amount - a.amount)[0];
  }, [reportTransactions]);

  const largestExpense = useMemo(() => {
    return reportTransactions
      .filter((t) => t.type === 'OUT' && t.status !== 'VOID')
      .sort((a, b) => b.amount - a.amount)[0];
  }, [reportTransactions]);

  const getPeriodLabel = (): string => {
    switch (period) {
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'this_week':
        return 'This Week';
      case 'last_week':
        return 'Last Week';
      case 'this_month':
        return 'This Month';
      case 'last_month':
        return 'Last Month';
      case 'this_quarter':
        return 'This Quarter';
      case 'this_year':
        return 'This Year';
      case 'custom':
        return customStart && customEnd
          ? `${formatDate(customStart)} – ${formatDate(customEnd)}`
          : 'Custom Range';
      default:
        return 'Custom Period';
    }
  };

  const handleExportPDF = async () => {
    if (reportTransactions.length === 0) {
      const msg = 'No transactions found in this period to export.';
      setExportFeedback({ type: 'info', message: msg });
      if (onShowToast) onShowToast(msg);
      setTimeout(() => setExportFeedback(null), 4000);
      return;
    }

    setIsExporting(true);
    setExportFeedback(null);

    try {
      const result = await exportFinancialReportPDF({
        periodLabel: getPeriodLabel(),
        startDate: period === 'custom' ? customStart : undefined,
        endDate: period === 'custom' ? customEnd : undefined,
        filtersApplied: {
          period: getPeriodLabel(),
          account: accountFilter === 'ALL' ? 'All Accounts' : accountFilter,
          category: categoryFilter === 'ALL' ? 'All Categories' : categoryFilter,
        },
        summary: totals,
        accounts,
        incomeByCategory: totals.incomeByCategory,
        expensesByCategory: totals.expensesByCategory,
        transactions: reportTransactions,
        businessName: org?.name || 'SATTAR AUTO MOBILE & ELECTRICAL SERVICES',
        businessAddress: org?.address,
        businessPhone: org?.phone,
        businessEmail: org?.email,
        logoUrl: org?.logoUrl,
        currency: org?.currency || 'PKR',
      });

      setExportFeedback({ type: 'success', message: result.message });
      if (onShowToast) onShowToast(result.message);
      setTimeout(() => setExportFeedback(null), 6000);
    } catch (err: any) {
      console.error('PDF export error:', err);
      const errMsg = `Failed to generate PDF: ${err.message || 'Unknown error'}`;
      setExportFeedback({ type: 'error', message: errMsg });
      if (onShowToast) onShowToast(errMsg);
      setTimeout(() => setExportFeedback(null), 6000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Title */}
      <div>
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span>Financial Reports & Analysis</span>
        </h2>
        <p className="text-xs text-slate-400">
          Strict accounting rules applied (Transfers do not affect Net Cash Flow)
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Time Horizon</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Account Filter</label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
            >
              <option value="ALL">All Accounts</option>
              {accounts.map((a, idx) => (
                <option key={a.id ? `rep-acc-${a.id}-${idx}` : `rep-acc-${a.name}-${idx}`} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Category Filter</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c, idx) => (
                <option key={c.id ? `rep-cat-${c.id}-${idx}` : `rep-cat-${c.name}-${idx}`} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">From Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">To Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Export PDF Button and Status Banner */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="text-xs text-slate-300">
            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Report Export ({reportTransactions.length} records)</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Download formal PDF statement in PKR (Asia/Karachi)
            </div>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] text-slate-950 font-bold rounded-lg text-xs shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50 transition-all shrink-0"
            title="Export financial report to PDF"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-slate-950" />
                <span>📄 Export PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Export Feedback notification banner */}
        {exportFeedback && (
          <div
            className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
              exportFeedback.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                : exportFeedback.type === 'error'
                ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                : 'bg-amber-950/60 text-amber-300 border border-amber-800'
            }`}
          >
            {exportFeedback.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            )}
            <span className="flex-1">{exportFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Money In */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Total Money In</span>
          </div>
          <div className="text-base font-bold font-mono text-slate-100">
            {formatPKR(totals.totalIn)}
          </div>
          <div className="text-[10px] text-slate-400">{totals.countIn} incoming records</div>
        </div>

        {/* Money Out */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Total Money Out</span>
          </div>
          <div className="text-base font-bold font-mono text-slate-100">
            {formatPKR(totals.totalOut)}
          </div>
          <div className="text-[10px] text-slate-400">{totals.countOut} outgoing records</div>
        </div>

        {/* Net Cash Flow */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
            {totals.netCashFlow >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>Net Cash Flow</span>
          </div>
          <div
            className={`text-base font-bold font-mono ${
              totals.netCashFlow > 0
                ? 'text-emerald-400'
                : totals.netCashFlow < 0
                ? 'text-rose-400'
                : 'text-slate-100'
            }`}
          >
            {formatPKR(totals.netCashFlow)}
          </div>
          <div className="text-[10px] text-slate-400">Money In minus Money Out</div>
        </div>

        {/* Transfer Volume */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfers Volume</span>
          </div>
          <div className="text-base font-bold font-mono text-slate-100">
            {formatPKR(totals.totalTransfer)}
          </div>
          <div className="text-[10px] text-indigo-300/80">Neutral to Net Cash Flow</div>
        </div>
      </div>

      {/* Largest Transactions Spotlight */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Largest Income
          </span>
          {largestIncome ? (
            <div>
              <div className="font-bold text-emerald-400 font-mono">
                {formatPKR(largestIncome.amount)}
              </div>
              <div className="text-[11px] text-slate-300 truncate">{largestIncome.category}</div>
              <div className="text-[10px] text-slate-500">{formatDate(largestIncome.date)}</div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 py-1">No income in period</div>
          )}
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Largest Expense
          </span>
          {largestExpense ? (
            <div>
              <div className="font-bold text-rose-400 font-mono">
                {formatPKR(largestExpense.amount)}
              </div>
              <div className="text-[11px] text-slate-300 truncate">{largestExpense.category}</div>
              <div className="text-[10px] text-slate-500">{formatDate(largestExpense.date)}</div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 py-1">No expense in period</div>
          )}
        </div>
      </div>

      {/* Income by Category */}
      {totals.incomeByCategory.length > 0 && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Income by Category
          </div>
          <div className="space-y-2">
            {totals.incomeByCategory.map((c, idx) => (
              <div key={`rep-inc-${c.category || 'cat'}-${idx}`} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {c.category} ({c.count})
                  </span>
                  <span className="font-mono text-slate-200">{formatPKR(c.amount)}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${c.percentage || 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses by Category */}
      {totals.expensesByCategory.length > 0 && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
            Expenses by Category
          </div>
          <div className="space-y-2">
            {totals.expensesByCategory.map((c, idx) => (
              <div key={`rep-exp-${c.category || 'cat'}-${idx}`} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {c.category} ({c.count})
                  </span>
                  <span className="font-mono text-slate-200">{formatPKR(c.amount)}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500"
                    style={{ width: `${c.percentage || 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Transactions List Preview in Current Report */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Report Transactions ({reportTransactions.length})
          </div>
          <span className="text-[11px] text-slate-400">Tap record for details</span>
        </div>

        {reportTransactions.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No transactions match the selected filters.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
            {reportTransactions.map((tx, idx) => {
              const isVoid = tx.status === 'VOID';
              return (
                <div
                  key={tx.id ? `rep-tx-${tx.id}-${idx}` : `rep-tx-${idx}`}
                  onClick={() => onSelectTransaction(tx)}
                  className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                    isVoid
                      ? 'bg-slate-950/50 border-slate-800/50 opacity-60'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.type === 'IN'
                          ? 'bg-emerald-950 text-emerald-400'
                          : tx.type === 'OUT'
                          ? 'bg-rose-950 text-rose-400'
                          : 'bg-indigo-950 text-indigo-400'
                      }`}
                    >
                      {tx.type === 'IN' ? (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      ) : tx.type === 'OUT' ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                        <span>{tx.category || (tx.type === 'TRANSFER' ? 'Transfer' : 'General')}</span>
                        {isVoid && (
                          <span className="px-1 py-0.2 bg-rose-950 text-rose-400 text-[9px] rounded font-mono">
                            VOID
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {tx.type === 'TRANSFER'
                          ? `${tx.account} → ${tx.toAccount}`
                          : tx.account}
                        {(tx.customer || tx.vehicle) && ` · ${tx.customer || tx.vehicle}`}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs font-bold font-mono ${
                        isVoid
                          ? 'text-slate-500 line-through'
                          : tx.type === 'IN'
                          ? 'text-emerald-400'
                          : tx.type === 'OUT'
                          ? 'text-rose-400'
                          : 'text-indigo-300'
                      }`}
                    >
                      {tx.type === 'IN' ? '+' : tx.type === 'OUT' ? '-' : ''}
                      {formatPKR(tx.amount)}
                    </div>
                    <div className="text-[10px] text-slate-500">{formatDate(tx.date)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
