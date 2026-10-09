/**
 * Finance Domain Types for Sattar Auto Mobile & Electrical Services
 * Authoritative accounting rules:
 * - IN: Money received (Income)
 * - OUT: Money spent (Expense)
 * - TRANSFER: Money moved between accounts (NOT income, NOT expense, Net Cash Flow neutral)
 * - VOID: Historic only, no balance or report impact
 */

export type TransactionType = 'IN' | 'OUT' | 'TRANSFER';

export type TransactionStatus = 'COMPLETED' | 'VOID' | 'PENDING';

export type PeriodFilter = 
  | 'today' 
  | 'yesterday' 
  | 'this_week' 
  | 'last_week' 
  | 'this_month' 
  | 'last_month' 
  | 'this_quarter' 
  | 'this_year' 
  | 'custom';

export interface Account {
  id: string;
  name: string;
  code?: string;
  type?: string;
  openingBalance?: number;
  currentBalance?: number;
  notes?: string;
  active?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'IN' | 'OUT';
  code?: string;
  description?: string;
  active?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  active?: boolean;
}

export interface Vehicle {
  id: string;
  customerId?: string;
  registrationNumber: string;
  make?: string;
  model?: string;
  year?: string;
  vin?: string;
  engineNumber?: string;
  notes?: string;
  active?: boolean;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: TransactionType;
  category: string;
  categoryId?: string;
  amount: number;
  account: string;
  accountId?: string;
  toAccount?: string;
  toAccountId?: string;
  payee?: string;
  customer?: string;
  customerId?: string;
  vehicle?: string;
  vehicleId?: string;
  paymentMethod: string;
  reference?: string;
  description?: string;
  status: TransactionStatus;
  createdAt?: string;
  voidReason?: string;
  voidedAt?: string;
}

export interface CategorySummary {
  category: string;
  amount: number;
  count: number;
  percentage?: number;
}

export interface DashboardData {
  todayIn: number;
  todayOut: number;
  todayNet: number;
  totalBalance: number;
  periodIn?: number;
  periodOut?: number;
  periodNet?: number;
  accounts: Account[];
  recentTransactions: Transaction[];
  incomeByCategory: CategorySummary[];
  expensesByCategory: CategorySummary[];
}

export interface BackendHealth {
  status: string;
  databaseReady: boolean;
  business?: string;
  currency?: string;
  timezone?: string;
  connected?: boolean;
  sheets?: string[];
  message?: string;
  raw?: any;
}

export interface CreateTransactionPayload {
  date: string;
  time: string;
  type: TransactionType;
  category?: string;
  categoryId?: string;
  amount: number;
  account: string;
  accountId?: string;
  toAccount?: string;
  toAccountId?: string;
  payee?: string;
  customer?: string;
  customerId?: string;
  vehicle?: string;
  vehicleId?: string;
  paymentMethod: string;
  reference?: string;
  description?: string;
}
