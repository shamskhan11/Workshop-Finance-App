import React, { useState } from 'react';
import { Account, PeriodFilter, Transaction } from '../types/finance';
import { formatPKR, formatDate, formatTime } from '../utils/accounting';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface DashboardViewProps {
  period: PeriodFilter;
  onSelectPeriod: (p: PeriodFilter) => void;
  customStartDate: string;
  customEndDate: string;
  onChangeCustomDates: (start: string, end: string) => void;
  // Authoritative metrics
  todayIn: number;
  todayOut: number;
  todayNet: number;
  periodIn: number;
  periodOut: number;
  periodNet: number;
  totalBalance: number;
  accounts: Account[];
  recentTransactions: Transaction[];
  incomeByCategory: { category: string; amount: number; count: number; percentage?: number }[];
  expensesByCategory: { category: string; amount: number; count: number; percentage?: number }[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenAddModal: (type?: 'IN' | 'OUT' | 'TRANSFER') => void;
  onNavigateTransactions: () => void;
  onSelectTransaction: (t: Transaction) => void;
}

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  last_week: 'Last Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_quarter: 'This Quarter',
  this_year: 'This Year',
  custom: 'Custom',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  period,
  onSelectPeriod,
  customStartDate,
  customEndDate,
  onChangeCustomDates,
  todayIn,
  todayOut,
  todayNet,
  periodIn,
  periodOut,
  periodNet,
  totalBalance,
  accounts,
  recentTransactions,
  incomeByCategory,
  expensesByCategory,
  isLoading,
  error,
  onRetry,
  onOpenAddModal,
  onNavigateTransactions,
  onSelectTransaction,
}) => {
  const [showCustomRange, setShowCustomRange] = useState(period === 'custom');

  const isTodayActive = period === 'today';
  const displayIn = isTodayActive ? todayIn : periodIn;
  const displayOut = isTodayActive ? todayOut : periodOut;
  const displayNet = isTodayActive ? todayNet : periodNet;

  return (
    <div className="space-y-5 pb-8">
      {/* Error Banner with Retry */}
      {error && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start justify-between gap-3 text-rose-200 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-rose-300">Connection Alert</span>
              <p className="text-slate-300 leading-relaxed">{error}</p>
            </div>
          </div>
          <button
            onClick={onRetry}
            className="px-2.5 py-1 bg-rose-800/60 hover:bg-rose-700 text-white rounded text-[11px] font-medium shrink-0 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Period Filter Scrollable Tabs (Segmented interactive buttons) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Time Horizon</span>
          </span>
          <span className="text-[11px] text-slate-500">Asia/Karachi</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar py-0.5">
          {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((pKey) => {
            const isActive = period === pKey;
            return (
              <button
                key={pKey}
                onClick={() => {
                  onSelectPeriod(pKey);
                  setShowCustomRange(pKey === 'custom');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {PERIOD_LABELS[pKey]}
              </button>
            );
          })}
        </div>

        {/* Custom Date Range Selector if selected */}
        {showCustomRange && (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">From Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => onChangeCustomDates(e.target.value, customEndDate)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">To Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => onChangeCustomDates(customStartDate, e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Primary Financial Overview Cards */}
      <div className="space-y-3">
        {/* Total Business Balance - Large Prominent Display */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium tracking-wide flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>Total Business Balance</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">5 Accounts</span>
          </div>

          <div className="text-3xl font-extrabold tracking-tight text-white font-mono my-1">
            {formatPKR(totalBalance)}
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span>Includes Cash, Banks & Wallets</span>
            <span className="text-emerald-400 font-medium">Opening + In - Out ± Transfers</span>
          </div>
        </div>

        {/* 3 Metrics Grid: Money In, Money Out, Net Cash Flow */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Money In */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 mb-1">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Money In</span>
              </div>
              <div className="text-sm font-bold text-slate-100 font-mono tracking-tight">
                {formatPKR(displayIn)}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2">
              {isTodayActive ? 'Today' : PERIOD_LABELS[period]}
            </div>
          </div>

          {/* Money Out */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 mb-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Money Out</span>
              </div>
              <div className="text-sm font-bold text-slate-100 font-mono tracking-tight">
                {formatPKR(displayOut)}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2">
              {isTodayActive ? 'Today' : PERIOD_LABELS[period]}
            </div>
          </div>

          {/* Net Cash Flow */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 mb-1">
                {displayNet >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>Net Flow</span>
              </div>
              <div
                className={`text-sm font-bold font-mono tracking-tight ${
                  displayNet > 0
                    ? 'text-emerald-400'
                    : displayNet < 0
                    ? 'text-rose-400'
                    : 'text-slate-100'
                }`}
              >
                {formatPKR(displayNet)}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2">In minus Out</div>
          </div>
        </div>
      </div>

      {/* Fast Action Shortcuts */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onOpenAddModal('IN')}
          className="p-3 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-800/50 rounded-xl flex items-center justify-center gap-2 text-emerald-300 font-semibold text-xs transition-colors"
        >
          <ArrowDownRight className="w-4 h-4 text-emerald-400" />
          <span>+ Money In</span>
        </button>

        <button
          onClick={() => onOpenAddModal('OUT')}
          className="p-3 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/50 rounded-xl flex items-center justify-center gap-2 text-rose-300 font-semibold text-xs transition-colors"
        >
          <ArrowUpRight className="w-4 h-4 text-rose-400" />
          <span>- Money Out</span>
        </button>

        <button
          onClick={() => onOpenAddModal('TRANSFER')}
          className="p-3 bg-indigo-950/30 hover:bg-indigo-950/50 border border-indigo-800/50 rounded-xl flex items-center justify-center gap-2 text-indigo-300 font-semibold text-xs transition-colors"
        >
          <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
          <span>Transfer</span>
        </button>
      </div>

      {/* Account Balances Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Account Balances</span>
          </span>
          <span className="text-[11px] text-slate-400">Authoritative Sheet Balances</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {accounts.map((acc, index) => {
            const bal = acc.currentBalance ?? acc.openingBalance ?? 0;
            return (
              <div
                key={acc.id ? `acc-${acc.id}-${index}` : `acc-${acc.name || 'item'}-${index}`}
                className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200">{acc.name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span>{acc.type || 'Account'}</span>
                    {acc.code && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[10px] text-slate-400">{acc.code}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-bold font-mono ${
                      bal < 0 ? 'text-rose-400' : 'text-slate-100'
                    }`}
                  >
                    {formatPKR(bal)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Income & Expense Categories Distribution */}
      {(incomeByCategory.length > 0 || expensesByCategory.length > 0) && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Category Breakdown ({PERIOD_LABELS[period]})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Income by Category */}
            {incomeByCategory.length > 0 && (
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Income Categories</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {formatPKR(displayIn)}
                  </span>
                </div>

                <div className="space-y-2">
                  {incomeByCategory.slice(0, 4).map((item, index) => (
                    <div key={`inc-cat-${item.category || 'item'}-${index}`} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 truncate max-w-[150px]">
                          {item.category}
                        </span>
                        <span className="font-mono font-medium text-slate-200">
                          {formatPKR(item.amount)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(5, item.percentage || 10))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expenses by Category */}
            {expensesByCategory.length > 0 && (
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Expense Categories</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {formatPKR(displayOut)}
                  </span>
                </div>

                <div className="space-y-2">
                  {expensesByCategory.slice(0, 4).map((item, index) => (
                    <div key={`exp-cat-${item.category || 'item'}-${index}`} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 truncate max-w-[150px]">
                          {item.category}
                        </span>
                        <span className="font-mono font-medium text-slate-200">
                          {formatPKR(item.amount)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(5, item.percentage || 10))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Transactions List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Recent Transactions</span>
          </span>
          <button
            onClick={onNavigateTransactions}
            className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5 text-xs transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-xl text-center space-y-2">
            <div className="text-slate-400 text-xs">
              {isLoading
                ? 'Loading authoritative transactions from Google Sheets...'
                : 'No transactions recorded yet in Google Sheets.'}
            </div>
            {!isLoading && (
              <button
                onClick={() => onOpenAddModal('IN')}
                className="px-3 py-1.5 bg-amber-500 text-slate-950 font-semibold text-xs rounded-lg hover:bg-amber-400 transition-colors"
              >
                Record First Transaction
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.slice(0, 6).map((tx, index) => {
              const isVoid = tx.status === 'VOID';
              return (
                <div
                  key={tx.id ? `tx-${tx.id}-${index}` : `tx-idx-${index}`}
                  onClick={() => onSelectTransaction(tx)}
                  className={`p-3 bg-slate-900 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    isVoid
                      ? 'border-slate-800/50 opacity-60'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Direction Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isVoid
                          ? 'bg-slate-800 text-slate-500'
                          : tx.type === 'IN'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                          : tx.type === 'OUT'
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                          : 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/50'
                      }`}
                    >
                      {tx.type === 'IN' ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : tx.type === 'OUT' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowLeftRight className="w-4 h-4" />
                      )}
                    </div>

                    {/* Description & Category */}
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-200">
                        {tx.type === 'TRANSFER'
                          ? `${tx.account} → ${tx.toAccount || 'Account'}`
                          : tx.category || tx.description || 'General'}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span>{formatDate(tx.date)}</span>
                        {tx.time && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{formatTime(tx.time)}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-400">{tx.account}</span>
                        {isVoid && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-rose-400 font-bold uppercase text-[10px]">
                              VOID
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <div
                      className={`text-xs font-bold font-mono ${
                        isVoid
                          ? 'line-through text-slate-500'
                          : tx.type === 'IN'
                          ? 'text-emerald-400'
                          : tx.type === 'OUT'
                          ? 'text-rose-400'
                          : 'text-indigo-400'
                      }`}
                    >
                      {tx.type === 'IN' ? '+' : tx.type === 'OUT' ? '-' : ''}
                      {formatPKR(tx.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400">{tx.paymentMethod}</div>
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
