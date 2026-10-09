import React, { useState, useMemo } from 'react';
import { Account, Category, Customer, Transaction, Vehicle } from '../types/finance';
import { formatPKR, formatDate, formatTime } from '../utils/accounting';
import {
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
  X,
  Ban,
  Car,
  User,
  CreditCard,
  FileText,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  customers: Customer[];
  vehicles: Vehicle[];
  isLoading: boolean;
  onVoidTransaction: (id: string, reason: string) => Promise<void>;
  onOpenAddModal: (type?: 'IN' | 'OUT' | 'TRANSFER') => void;
  selectedTransaction?: Transaction | null;
  onCloseSelectedTransaction: () => void;
  onSelectTransaction: (t: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  categories,
  customers,
  vehicles,
  isLoading,
  onVoidTransaction,
  onOpenAddModal,
  selectedTransaction,
  onCloseSelectedTransaction,
  onSelectTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT' | 'TRANSFER' | 'VOID'>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Voiding dialog state
  const [isVoiding, setIsVoiding] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Type / Status filter
      if (typeFilter === 'VOID') {
        if (t.status !== 'VOID') return false;
      } else if (typeFilter !== 'ALL') {
        if (t.type !== typeFilter || t.status === 'VOID') return false;
      }

      // Account filter
      if (accountFilter !== 'ALL') {
        const matchesFrom = t.account === accountFilter;
        const matchesTo = t.toAccount === accountFilter;
        if (!matchesFrom && !matchesTo) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL') {
        if (t.category !== categoryFilter) return false;
      }

      // Date range filter
      if (startDateFilter && t.date < startDateFilter) return false;
      if (endDateFilter && t.date > endDateFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchCategory = t.category?.toLowerCase().includes(query);
        const matchDesc = t.description?.toLowerCase().includes(query);
        const matchCustomer = t.customer?.toLowerCase().includes(query);
        const matchVehicle = t.vehicle?.toLowerCase().includes(query);
        const matchRef = t.reference?.toLowerCase().includes(query);
        const matchAccount = t.account?.toLowerCase().includes(query);
        const matchAmount = String(t.amount).includes(query);
        const matchPayee = t.payee?.toLowerCase().includes(query);

        if (
          !matchCategory &&
          !matchDesc &&
          !matchCustomer &&
          !matchVehicle &&
          !matchRef &&
          !matchAccount &&
          !matchAmount &&
          !matchPayee
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    typeFilter,
    accountFilter,
    categoryFilter,
    startDateFilter,
    endDateFilter,
    searchQuery,
  ]);

  const handleConfirmVoid = async () => {
    if (!selectedTransaction) return;
    try {
      setIsVoiding(true);
      await onVoidTransaction(selectedTransaction.id, voidReason || 'Voided by workshop staff');
      setShowVoidConfirm(false);
      onCloseSelectedTransaction();
    } catch {
      // error handled by parent toast
    } finally {
      setIsVoiding(false);
    }
  };

  const hasActiveFilters =
    accountFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    Boolean(startDateFilter) ||
    Boolean(endDateFilter);

  const clearAllFilters = () => {
    setTypeFilter('ALL');
    setAccountFilter('ALL');
    setCategoryFilter('ALL');
    setStartDateFilter('');
    setEndDateFilter('');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header & Search Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">Financial Transactions</h2>
            <p className="text-xs text-slate-400">
              {filteredTransactions.length} of {transactions.length} records in Google Sheets
            </p>
          </div>
          <button
            onClick={() => onOpenAddModal('IN')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
          >
            + New
          </button>
        </div>

        {/* Search Input & Filter Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, customer, vehicle, notes..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFiltersModal(!showFiltersModal)}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
              hasActiveFilters
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
          </button>
        </div>

        {/* Quick Type Filter Tabs (Interactive Segmented buttons) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
          {(['ALL', 'IN', 'OUT', 'TRANSFER', 'VOID'] as const).map((t) => {
            const isActive = typeFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? t === 'IN'
                      ? 'bg-emerald-600 text-white font-bold'
                      : t === 'OUT'
                      ? 'bg-rose-600 text-white font-bold'
                      : t === 'TRANSFER'
                      ? 'bg-indigo-600 text-white font-bold'
                      : t === 'VOID'
                      ? 'bg-slate-700 text-rose-300 font-bold'
                      : 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'ALL'
                  ? 'All Types'
                  : t === 'IN'
                  ? 'Money In'
                  : t === 'OUT'
                  ? 'Money Out'
                  : t === 'TRANSFER'
                  ? 'Transfers'
                  : 'Voided'}
              </button>
            );
          })}
        </div>

        {/* Filter Drawer / Expanded Box */}
        {showFiltersModal && (
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs animate-slideDown">
            <div className="flex items-center justify-between font-semibold text-slate-300">
              <span>Filter Transactions</span>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-amber-400 hover:text-amber-300 text-[11px] font-normal underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Account</label>
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
                >
                  <option value="ALL">All Accounts</option>
                  {accounts.map((a, idx) => (
                    <option key={a.id ? `acc-opt-${a.id}-${idx}` : `acc-opt-${a.name}-${idx}`} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c, idx) => (
                    <option key={c.id ? `cat-opt-${c.id}-${idx}` : `cat-opt-${c.name}-${idx}`} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">End Date</label>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-2">
          <p className="text-xs text-slate-400">
            {isLoading
              ? 'Fetching transactions from Google Sheets...'
              : 'No transactions found matching your filters.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-amber-400 hover:text-amber-300 text-xs font-medium underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map((tx, idx) => {
            const isVoid = tx.status === 'VOID';
            return (
              <div
                key={tx.id ? `tx-${tx.id}-${idx}` : `tx-idx-${idx}`}
                onClick={() => onSelectTransaction(tx)}
                className={`p-3.5 bg-slate-900 border rounded-xl flex items-start justify-between cursor-pointer transition-all active:scale-[0.99] ${
                  isVoid
                    ? 'border-slate-800/40 opacity-55'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isVoid
                        ? 'bg-slate-800 text-slate-500'
                        : tx.type === 'IN'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        : tx.type === 'OUT'
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                        : 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/60'
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

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5 flex-wrap">
                      <span>
                        {tx.type === 'TRANSFER'
                          ? `${tx.account} → ${tx.toAccount || 'Account'}`
                          : tx.category || 'General'}
                      </span>
                      {isVoid && (
                        <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-950/50 px-1.5 py-0.2 rounded border border-rose-800/50">
                          VOID
                        </span>
                      )}
                    </div>

                    {/* Metadata line without pill enclosures */}
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <span>{formatDate(tx.date)}</span>
                      {tx.time && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{formatTime(tx.time)}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-300 font-medium">{tx.account}</span>
                      {tx.paymentMethod && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{tx.paymentMethod}</span>
                        </>
                      )}
                    </div>

                    {/* Optional Customer, Vehicle, or Payee */}
                    {(tx.customer || tx.vehicle || tx.payee || tx.reference) && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5 flex-wrap">
                        {tx.customer && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <User className="w-3 h-3 text-slate-500" />
                            {tx.customer}
                          </span>
                        )}
                        {tx.vehicle && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Car className="w-3 h-3 text-slate-500" />
                            {tx.vehicle}
                          </span>
                        )}
                        {tx.payee && <span className="text-slate-300">Payee: {tx.payee}</span>}
                        {tx.reference && (
                          <span className="font-mono text-[10px] text-slate-500">
                            Ref: {tx.reference}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0 pl-2">
                  <div
                    className={`text-sm font-bold font-mono ${
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
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {tx.type}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-slate-100 text-sm">Transaction Details</h3>
              </div>
              <button
                onClick={onCloseSelectedTransaction}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Big Amount */}
              <div className="text-center py-2 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">
                  {selectedTransaction.type === 'IN'
                    ? 'Money In'
                    : selectedTransaction.type === 'OUT'
                    ? 'Money Out'
                    : 'Account Transfer'}
                </div>
                <div
                  className={`text-2xl font-black font-mono ${
                    selectedTransaction.status === 'VOID'
                      ? 'line-through text-slate-500'
                      : selectedTransaction.type === 'IN'
                      ? 'text-emerald-400'
                      : selectedTransaction.type === 'OUT'
                      ? 'text-rose-400'
                      : 'text-indigo-400'
                  }`}
                >
                  {formatPKR(selectedTransaction.amount)}
                </div>
                {selectedTransaction.status === 'VOID' && (
                  <div className="text-rose-400 font-bold uppercase tracking-wider text-[11px] mt-1">
                    VOIDED — Excluded from Balances
                  </div>
                )}
              </div>

              {/* Key fields */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Date & Time</span>
                  <span className="text-slate-200 font-medium">
                    {formatDate(selectedTransaction.date)} · {formatTime(selectedTransaction.time)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Category</span>
                  <span className="text-slate-200 font-medium">{selectedTransaction.category}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Account</span>
                  <span className="text-slate-200 font-medium">
                    {selectedTransaction.type === 'TRANSFER'
                      ? `${selectedTransaction.account} → ${selectedTransaction.toAccount}`
                      : selectedTransaction.account}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Payment Method</span>
                  <span className="text-slate-200 font-medium">
                    {selectedTransaction.paymentMethod}
                  </span>
                </div>

                {selectedTransaction.customer && (
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Customer</span>
                    <span className="text-slate-200 font-medium">
                      {selectedTransaction.customer}
                    </span>
                  </div>
                )}

                {selectedTransaction.vehicle && (
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Vehicle</span>
                    <span className="text-slate-200 font-medium">
                      {selectedTransaction.vehicle}
                    </span>
                  </div>
                )}

                {selectedTransaction.payee && (
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Payee</span>
                    <span className="text-slate-200 font-medium">{selectedTransaction.payee}</span>
                  </div>
                )}

                {selectedTransaction.reference && (
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Reference</span>
                    <span className="text-slate-200 font-mono">
                      {selectedTransaction.reference}
                    </span>
                  </div>
                )}

                {selectedTransaction.description && (
                  <div className="py-1">
                    <span className="text-slate-400 block mb-0.5">Notes</span>
                    <span className="text-slate-200">{selectedTransaction.description}</span>
                  </div>
                )}

                {selectedTransaction.voidReason && (
                  <div className="py-1 bg-rose-950/20 p-2 rounded border border-rose-800/30">
                    <span className="text-rose-400 block font-semibold">Void Reason</span>
                    <span className="text-rose-200">{selectedTransaction.voidReason}</span>
                  </div>
                )}
              </div>

              {/* Void Action: Append-only integrity rule */}
              {selectedTransaction.status !== 'VOID' && (
                <div className="pt-2">
                  {!showVoidConfirm ? (
                    <button
                      onClick={() => setShowVoidConfirm(true)}
                      className="w-full py-2 px-3 border border-rose-800/60 text-rose-400 hover:bg-rose-950/40 rounded-xl font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Void This Transaction</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Confirm Voiding</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Financial transactions are append-only. Voiding preserves the record for
                        auditing while removing its balance impact.
                      </p>
                      <input
                        type="text"
                        value={voidReason}
                        onChange={(e) => setVoidReason(e.target.value)}
                        placeholder="Reason for voiding (e.g. entry error)"
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs"
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => setShowVoidConfirm(false)}
                          className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmVoid}
                          disabled={isVoiding}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded text-xs flex items-center gap-1"
                        >
                          {isVoiding && <Loader2 className="w-3 h-3 animate-spin" />}
                          <span>Confirm Void</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
