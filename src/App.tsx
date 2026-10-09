/**
 * SATTAR AUTO MOBILE & ELECTRICAL SERVICES
 * Mobile-First Finance & Cash Flow Application
 * Powered by Google Apps Script & Google Sheets Single Source of Truth
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Account,
  BackendHealth,
  Category,
  Customer,
  PeriodFilter,
  Transaction,
  TransactionType,
  Vehicle,
} from './types/finance';
import { ApiService } from './services/apiService';
import {
  calculateAccountBalances,
  calculateTotals,
  filterTransactionsByPeriod,
} from './utils/accounting';
import {
  INITIAL_ACCOUNTS,
  INITIAL_INCOME_CATEGORIES,
  INITIAL_EXPENSE_CATEGORIES,
} from './constants/financeDefaults';

import { Header } from './components/Header';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { BottomNav, TabType } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { ReportsView } from './components/ReportsView';
import { MoreView } from './components/MoreView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { BackendStatusModal } from './components/BackendStatusModal';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  // Backend state
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Financial data directly from API
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>(INITIAL_INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>(INITIAL_EXPENSE_CATEGORIES);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<TransactionType>('IN');
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Period filters
  const [period, setPeriod] = useState<PeriodFilter>('today');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Fetch all backend data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Health check
      const healthRes = await ApiService.checkHealth();
      setHealth(healthRes);

      if (!healthRes.connected) {
        setError(healthRes.message || 'Unable to connect to Google Apps Script Web App API.');
      }

      // 2. Fetch Accounts from backend
      try {
        const remoteAccounts = await ApiService.getAccounts();
        if (remoteAccounts && remoteAccounts.length > 0) {
          setAccounts(remoteAccounts);
        }
      } catch (err: any) {
        console.warn('Accounts fetch fallback to defaults:', err.message);
      }

      // 3. Fetch Categories
      try {
        const remoteCategories = await ApiService.getCategories();
        if (remoteCategories && remoteCategories.length > 0) {
          const inCats = remoteCategories.filter((c) => c.type === 'IN');
          const outCats = remoteCategories.filter((c) => c.type === 'OUT');
          if (inCats.length > 0) setIncomeCategories(inCats);
          if (outCats.length > 0) setExpenseCategories(outCats);
        }
      } catch (err: any) {
        console.warn('Categories fetch fallback to defaults:', err.message);
      }

      // 4. Fetch Customers
      try {
        const remoteCustomers = await ApiService.getCustomers();
        if (remoteCustomers) setCustomers(remoteCustomers);
      } catch {
        // Optional
      }

      // 5. Fetch Vehicles
      try {
        const remoteVehicles = await ApiService.getVehicles();
        if (remoteVehicles) setVehicles(remoteVehicles);
      } catch {
        // Optional
      }

      // 6. Fetch Transactions
      try {
        const remoteTransactions = await ApiService.getTransactions();
        if (remoteTransactions) {
          setTransactions(remoteTransactions);
        }
      } catch (err: any) {
        console.warn('Transactions fetch:', err.message);
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Android Native Hardware Back Button & Status Bar
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#020617' });
    } catch (e) {
      console.warn('Status bar styling unavailable:', e);
    }

    const backListener = CapacitorApp.addListener('backButton', () => {
      if (isAddModalOpen) {
        setIsAddModalOpen(false);
      } else if (selectedTransaction) {
        setSelectedTransaction(null);
      } else if (isBackendModalOpen) {
        setIsBackendModalOpen(false);
      } else if (currentTab !== 'dashboard') {
        setCurrentTab('dashboard');
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      backListener.then((h) => h.remove());
    };
  }, [isAddModalOpen, selectedTransaction, isBackendModalOpen, currentTab]);

  // Refresh accounts specifically from backend API
  const refreshAccounts = useCallback(async (): Promise<Account[]> => {
    try {
      const remoteAccounts = await ApiService.getAccounts();
      if (remoteAccounts && remoteAccounts.length > 0) {
        setAccounts(remoteAccounts);
        return remoteAccounts;
      }
    } catch (err: any) {
      console.warn('Accounts refresh error:', err.message);
    }
    return accounts;
  }, [accounts]);

  // Refresh categories specifically from backend API
  const refreshCategories = useCallback(async (): Promise<Category[]> => {
    try {
      const remoteCategories = await ApiService.getCategories();
      if (remoteCategories && remoteCategories.length > 0) {
        const inCats = remoteCategories.filter((c) => c.type === 'IN');
        const outCats = remoteCategories.filter((c) => c.type === 'OUT');
        if (inCats.length > 0) setIncomeCategories(inCats);
        if (outCats.length > 0) setExpenseCategories(outCats);
        return remoteCategories;
      }
    } catch (err: any) {
      console.warn('Categories refresh error:', err.message);
    }
    return [...incomeCategories, ...expenseCategories];
  }, [incomeCategories, expenseCategories]);

  // Compute calculated authoritative account balances
  // Opening Balance + Money In - Money Out + Transfers In - Transfers Out
  const computedAccounts = useMemo(() => {
    return calculateAccountBalances(accounts, transactions);
  }, [accounts, transactions]);

  // Total Business Balance across all accounts
  const totalBalance = useMemo(() => {
    return computedAccounts.reduce((acc, a) => {
      return acc + (a.currentBalance ?? a.openingBalance ?? 0);
    }, 0);
  }, [computedAccounts]);

  // Today's totals (Authoritative Asia/Karachi context)
  const todayTotals = useMemo(() => {
    const todayList = filterTransactionsByPeriod(transactions, 'today');
    return calculateTotals(todayList);
  }, [transactions]);

  // Period totals
  const periodTotals = useMemo(() => {
    const periodList = filterTransactionsByPeriod(
      transactions,
      period,
      period === 'custom' ? { startDate: customStartDate, endDate: customEndDate } : undefined
    );
    return calculateTotals(periodList);
  }, [transactions, period, customStartDate, customEndDate]);

  // Void transaction handler
  const handleVoidTransaction = async (id: string, reason: string) => {
    try {
      await ApiService.voidTransaction(id, reason);
      showToast('Transaction voided successfully. Balances updated.');
      await loadData();
    } catch (err: any) {
      showToast(`Void failed: ${err.message}`);
      throw err;
    }
  };

  const handleOpenAddModal = (type: TransactionType = 'IN') => {
    setAddModalType(type);
    setIsAddModalOpen(true);
  };

  const handleTransactionSuccess = (msg: string) => {
    showToast(msg);
    loadData();
  };

  const allCategories = useMemo(() => {
    return [...incomeCategories, ...expenseCategories];
  }, [incomeCategories, expenseCategories]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] p-3 bg-emerald-900 border border-emerald-700 text-emerald-100 text-xs rounded-xl shadow-xl flex items-center gap-2.5 animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        health={health}
        isLoading={isLoading}
        onRefreshAll={loadData}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
      />

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-24">
        {/* Auth Notice Alert if Google Apps Script returned login redirect */}
        {health && !health.connected && health.message?.includes('Sign-In') && (
          <div
            onClick={() => setIsBackendModalOpen(true)}
            className="mb-4 p-3 bg-amber-950/50 border border-amber-800/80 rounded-xl cursor-pointer hover:bg-amber-950/70 transition-colors flex items-start gap-2.5 text-xs text-amber-200"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">Action Required in Apps Script: </span>
              Deployment needs "Who has access: Anyone". Tap to see instructions & diagnostic info.
            </div>
          </div>
        )}

        {/* Tab Views */}
        {currentTab === 'dashboard' && (
          <DashboardView
            period={period}
            onSelectPeriod={setPeriod}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onChangeCustomDates={(start, end) => {
              setCustomStartDate(start);
              setCustomEndDate(end);
            }}
            todayIn={todayTotals.totalIn}
            todayOut={todayTotals.totalOut}
            todayNet={todayTotals.netCashFlow}
            periodIn={periodTotals.totalIn}
            periodOut={periodTotals.totalOut}
            periodNet={periodTotals.netCashFlow}
            totalBalance={totalBalance}
            accounts={computedAccounts}
            recentTransactions={transactions}
            incomeByCategory={periodTotals.incomeByCategory}
            expensesByCategory={periodTotals.expensesByCategory}
            isLoading={isLoading}
            error={error}
            onRetry={loadData}
            onOpenAddModal={handleOpenAddModal}
            onNavigateTransactions={() => setCurrentTab('transactions')}
            onSelectTransaction={(t) => setSelectedTransaction(t)}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            accounts={computedAccounts}
            categories={allCategories}
            customers={customers}
            vehicles={vehicles}
            isLoading={isLoading}
            onVoidTransaction={handleVoidTransaction}
            onOpenAddModal={handleOpenAddModal}
            selectedTransaction={selectedTransaction}
            onCloseSelectedTransaction={() => setSelectedTransaction(null)}
            onSelectTransaction={(t) => setSelectedTransaction(t)}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            transactions={transactions}
            accounts={computedAccounts}
            categories={allCategories}
            customers={customers}
            vehicles={vehicles}
            onSelectTransaction={(t) => setSelectedTransaction(t)}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'more' && (
          <MoreView
            health={health}
            accounts={computedAccounts}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            onOpenBackendModal={() => setIsBackendModalOpen(true)}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddModal={handleOpenAddModal}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialType={addModalType}
        accounts={computedAccounts}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        customers={customers}
        vehicles={vehicles}
        onSuccess={handleTransactionSuccess}
        onRefreshAccounts={refreshAccounts}
        onRefreshCategories={refreshCategories}
        onShowToast={showToast}
      />

      {/* Backend Status / Diagnostics Modal */}
      <BackendStatusModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        health={health}
        isLoading={isLoading}
        onRefreshHealth={loadData}
      />
    </div>
  );
}
