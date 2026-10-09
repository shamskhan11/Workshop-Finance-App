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

export interface Organization {
  id: string; // Stable UUID or Org code, e.g. ORG-SATTAR-01
  name: string;
  address: string;
  phone: string;
  email?: string;
  logoUrl?: string; // base64 or URL
  currency: string; // 'PKR'
  timezone: string; // 'Asia/Karachi'
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  details: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  orgId?: string;
  timestamp: string;
}

export interface Account {
  id: string;
  name: string;
  code?: string;
  type?: string;
  openingBalance?: number;
  currentBalance?: number;
  notes?: string;
  active?: boolean;
  orgId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'IN' | 'OUT';
  code?: string;
  description?: string;
  active?: boolean;
  orgId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  active?: boolean;
  orgId?: string;
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
  orgId?: string;
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
  orgId?: string;
  createdByUser?: string;
  createdByRole?: string;
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
  accountName?: string;
  fromAccount?: string;
  fromAccountId?: string;
  sourceAccount?: string;
  sourceAccountId?: string;
  toAccount?: string;
  toAccountId?: string;
  toAccountName?: string;
  destinationAccount?: string;
  destinationAccountId?: string;
  transferToAccount?: string;
  transferToAccountId?: string;
  transferToAccountName?: string;
  destination?: string;
  transferTo?: string;
  payee?: string;
  customer?: string;
  customerId?: string;
  vehicle?: string;
  vehicleId?: string;
  paymentMethod: string;
  reference?: string;
  description?: string;
  createdByUser?: string;
  createdByRole?: string;
  orgId?: string;
}

export type UserRole = 'ADMIN' | 'STAFF' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  pin?: string;
  phone?: string;
  email?: string;
  active: boolean;
  orgId?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  loginTime: string;
  orgId?: string;
}

export interface AmountValidationResult {
  isValid: boolean;
  error?: string;
  cleanAmount?: number;
}
