/**
 * API Service Layer for SATTAR AUTO MOBILE & ELECTRICAL SERVICES
 * Dedicated communication gateway to the Google Apps Script Web App API.
 * Single source of truth.
 */

import {
  Account,
  BackendHealth,
  Category,
  CreateTransactionPayload,
  Customer,
  DashboardData,
  Transaction,
  User,
  Vehicle,
} from '../types/finance';
import { validateTransactionAmount } from '../utils/validation';

export const DEFAULT_GAS_API_URL =
  'https://script.google.com/macros/s/AKfycbwUWFfwu5LrhkhPqJSG-YMsfokwmUPECctzic8nD3-amS3N-5jXcuthmOQ1nqgoZ0Eh/exec';

const STORAGE_API_KEY = 'sattar_gas_api_url';

export class ApiService {
  private static apiUrl: string =
    typeof window !== 'undefined' && localStorage.getItem(STORAGE_API_KEY)
      ? localStorage.getItem(STORAGE_API_KEY)!
      : DEFAULT_GAS_API_URL;

  public static getApiUrl(): string {
    return this.apiUrl;
  }

  public static setApiUrl(url: string): void {
    this.apiUrl = url.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_API_KEY, this.apiUrl);
    }
  }

  public static resetApiUrl(): void {
    this.apiUrl = DEFAULT_GAS_API_URL;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_API_KEY);
    }
  }

  /**
   * Generic GET request handler
   */
  private static async get<T>(action: string, params: Record<string, string> = {}): Promise<T> {
    const query = new URLSearchParams({ action, ...params }).toString();
    const targetUrl = `${this.apiUrl}${this.apiUrl.includes('?') ? '&' : '?'}${query}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response redirected to Google sign-in
      if (response.url && response.url.includes('accounts.google.com/ServiceLogin')) {
        throw new Error(
          'Google Apps Script returned Google Account Sign-In. The Web App deployment must be set to "Who has access: Anyone" to allow anonymous API calls.'
        );
      }

      const text = await response.text();

      // Check if returned HTML instead of JSON
      if (text.trim().startsWith('<!DOCTYPE html>') || text.includes('Google Accounts')) {
        throw new Error(
          'Google Apps Script returned an authentication page. Please set "Who has access: Anyone" in the Apps Script Deployment settings.'
        );
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}...`);
      }

      // Check if Apps Script returned an error payload
      if (data && data.success === false && data.error) {
        throw new Error(data.error);
      }

      return data as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Connection timed out while reaching the finance server. Please retry.');
      }
      throw err;
    }
  }

  /**
   * Generic POST request handler
   * Uses text/plain to avoid CORS preflight issues with Google Apps Script
   */
  private static async post<T>(action: string, payload: Record<string, any>): Promise<T> {
    const targetUrl = `${this.apiUrl}${this.apiUrl.includes('?') ? '&' : '?'}action=${encodeURIComponent(action)}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      // We package the payload with action as both URL param and body payload
      const bodyData = JSON.stringify({
        action,
        ...payload,
        timestamp: new Date().toISOString(),
      });

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: bodyData,
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.url && response.url.includes('accounts.google.com/ServiceLogin')) {
        throw new Error(
          'Google Apps Script redirected to Login. Set "Who has access: Anyone" in Apps Script Deployment.'
        );
      }

      const text = await response.text();
      if (text.trim().startsWith('<!DOCTYPE html>')) {
        throw new Error(
          'Google Apps Script returned an authentication page. Please set "Who has access: Anyone" in Apps Script.'
        );
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid response: ${text.substring(0, 100)}`);
      }

      if (data && data.success === false) {
        throw new Error(data.error || 'Server error while executing operation.');
      }

      return data as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Timeout saving to finance server. Please verify if it was recorded.');
      }
      throw err;
    }
  }

  // ==========================================
  // Public Endpoint Methods
  // ==========================================

  /**
   * GET ?action=health
   * Confirms API status, Database readiness, business name, currency, timezone, and sheet presence.
   */
  public static async checkHealth(): Promise<BackendHealth> {
    try {
      const res: any = await this.get('health');
      return {
        status: res.status || (res.success ? 'OK' : 'UNKNOWN'),
        databaseReady: res.databaseReady ?? res.database_ready ?? true,
        business: res.business || 'Sattar Auto Mobile & Electrical Services',
        currency: res.currency || 'PKR',
        timezone: res.timezone || 'Asia/Karachi',
        connected: true,
        sheets: res.sheets || [
          'Transactions',
          'Accounts',
          'Categories',
          'Customers',
          'Vehicles',
          'Users',
          'Settings',
          'Audit_Log',
        ],
        raw: res,
      };
    } catch (err: any) {
      return {
        status: 'DISCONNECTED',
        databaseReady: false,
        connected: false,
        message: err.message || 'Unable to connect to the finance server.',
      };
    }
  }

  /**
   * GET ?action=accounts
   * Fetches real accounts from Accounts sheet
   */
  public static async getAccounts(): Promise<Account[]> {
    const res: any = await this.get('accounts');
    const rawAccounts = Array.isArray(res) ? res : res.accounts || res.data || [];
    return rawAccounts.map((acc: any) => ({
      id: acc.accountId || acc.id || acc.account_id || acc.code || acc.accountName || acc.name,
      name: acc.accountName || acc.name || acc.account_name,
      code: acc.accountId || acc.code || acc.id,
      type: acc.accountType || acc.type || 'Standard',
      openingBalance: Number(acc.openingBalance ?? acc.opening_balance ?? 0),
      currentBalance: acc.balance !== undefined ? Number(acc.balance) : (acc.currentBalance !== undefined ? Number(acc.currentBalance) : undefined),
      notes: acc.notes || '',
      active: acc.active !== false,
    }));
  }

  /**
   * GET ?action=categories
   * Fetches categories from Categories sheet
   */
  public static async getCategories(): Promise<Category[]> {
    const res: any = await this.get('categories');
    const rawCategories = Array.isArray(res) ? res : res.categories || res.data || [];
    return rawCategories.map((c: any) => {
      const rawType = String(c.categoryType || c.type || 'OUT').toUpperCase();
      const isIncome = rawType === 'IN' || rawType === 'INCOME';
      return {
        id: c.categoryId || c.id || c.category_id || c.code || c.categoryName || c.name,
        name: c.categoryName || c.name || c.category_name,
        type: isIncome ? 'IN' : 'OUT',
        code: c.categoryId || c.code || c.id,
        active: c.active !== false,
      };
    });
  }

  /**
   * GET ?action=customers
   */
  public static async getCustomers(): Promise<Customer[]> {
    const res: any = await this.get('customers');
    const rawCustomers = Array.isArray(res) ? res : res.customers || res.data || [];
    return rawCustomers.map((c: any) => ({
      id: c.customerId || c.id || c.customer_id,
      name: c.customerName || c.name || c.customer_name,
      phone: c.phone,
      address: c.address,
      notes: c.notes,
      active: c.active !== false,
    }));
  }

  /**
   * GET ?action=vehicles
   */
  public static async getVehicles(): Promise<Vehicle[]> {
    const res: any = await this.get('vehicles');
    const rawVehicles = Array.isArray(res) ? res : res.vehicles || res.data || [];
    return rawVehicles.map((v: any) => ({
      id: v.vehicleId || v.id || v.vehicle_id,
      customerId: v.customerId || v.customer_id,
      registrationNumber: v.registrationNumber || v.reg_no || v.vehicleName || v.name,
      make: v.make,
      model: v.model,
      year: v.year,
      notes: v.notes,
      active: v.active !== false,
    }));
  }

  /**
   * GET ?action=transactions
   */
  public static async getTransactions(params: Record<string, string> = {}): Promise<Transaction[]> {
    const res: any = await this.get('transactions', params);
    const rawList = Array.isArray(res) ? res : res.transactions || res.data || [];
    return rawList.map((t: any) => {
      // Clean and normalize transaction fields
      const dateVal = t.date ? String(t.date).split(' ')[0].split('T')[0] : '';
      let timeVal = t.time ? String(t.time) : '';
      if (timeVal && timeVal.includes(' ')) {
        const parts = timeVal.split(' ')[1];
        if (parts) timeVal = parts.substring(0, 5);
      } else if (timeVal && timeVal.includes('T')) {
        const parts = timeVal.split('T')[1]?.split('.')[0];
        if (parts) timeVal = parts.substring(0, 5);
      }

      const rawType = String(t.transactionType || t.type || 'OUT').toUpperCase();
      const type: 'IN' | 'OUT' | 'TRANSFER' =
        rawType === 'IN' || rawType === 'TRANSFER' ? rawType : 'OUT';

      const rawStatus = String(t.status || 'ACTIVE').toUpperCase();
      const status: 'COMPLETED' | 'VOID' | 'PENDING' =
        rawStatus === 'VOID' ? 'VOID' : rawStatus === 'PENDING' ? 'PENDING' : 'COMPLETED';

      const accountName = t.accountName || t.account || t.account_name || 'Cash';
      const toAccountName = t.transferToAccountName || t.toAccount || t.to_account;
      const categoryName = t.categoryName || t.category || (type === 'TRANSFER' ? 'Transfer' : 'General');

      return {
        id: String(t.transactionId || t.id || t.transaction_id || Math.random().toString(36).substring(2, 9)),
        date: dateVal,
        time: timeVal,
        type,
        category: categoryName,
        categoryId: t.categoryId || t.category_id,
        amount: Number(t.amount) || 0,
        account: accountName,
        accountId: t.accountId || t.account_id,
        toAccount: toAccountName,
        toAccountId: t.transferToAccountId || t.toAccountId || t.to_account_id,
        payee: t.payee,
        customer: t.customerName || t.customer || t.customer_name,
        customerId: t.customerId || t.customer_id,
        vehicle: t.vehicleName || t.vehicle || t.registrationNumber || t.reg_no,
        vehicleId: t.vehicleId || t.vehicle_id,
        paymentMethod: t.paymentMethod || t.payment_method || 'Cash',
        reference: t.reference || t.ref,
        description: t.description || t.notes || '',
        status,
        createdAt: t.createdAt || t.created_at,
        voidReason: t.voidReason || t.void_reason,
        voidedAt: t.voidedAt || t.voided_at,
      };
    });
  }

  /**
   * GET ?action=dashboard
   */
  public static async getDashboard(period = 'today'): Promise<DashboardData | null> {
    try {
      const res: any = await this.get('dashboard', { period });
      if (!res) return null;

      return {
        todayIn: Number(res.todayIn ?? res.today_in ?? 0),
        todayOut: Number(res.todayOut ?? res.today_out ?? 0),
        todayNet: Number(res.todayNet ?? res.today_net ?? 0),
        totalBalance: Number(res.totalBalance ?? res.total_balance ?? 0),
        periodIn: res.periodIn !== undefined ? Number(res.periodIn) : undefined,
        periodOut: res.periodOut !== undefined ? Number(res.periodOut) : undefined,
        periodNet: res.periodNet !== undefined ? Number(res.periodNet) : undefined,
        accounts: res.accounts || [],
        recentTransactions: res.recentTransactions || res.recent_transactions || [],
        incomeByCategory: res.incomeByCategory || res.income_by_category || [],
        expensesByCategory: res.expensesByCategory || res.expenses_by_category || [],
      };
    } catch {
      // Backend may not have pre-calculated dashboard route; we calculate client-side authoritatively
      return null;
    }
  }

  /**
   * GET ?action=report
   */
  public static async getReport(params: Record<string, string> = {}): Promise<any> {
    return this.get('report', params);
  }

  /**
   * POST createTransaction
   * Validates amount strictly and maps all source/destination account aliases
   * to guarantee zero mismatch with Google Apps Script parameter parsing.
   */
  public static async createTransaction(payload: CreateTransactionPayload): Promise<{
    success: boolean;
    transactionId?: string;
    message?: string;
  }> {
    // 1. Strict Amount Validation (Section A)
    const amountVal = validateTransactionAmount(payload.amount);
    if (!amountVal.isValid || !amountVal.cleanAmount || amountVal.cleanAmount <= 0) {
      throw new Error(amountVal.error || 'Please enter an amount greater than zero.');
    }

    const cleanAmount = amountVal.cleanAmount;

    // 2. Account Resolution & Aliases (Section B)
    const srcAccountName = (payload.account || payload.fromAccount || payload.sourceAccount || '').trim();
    const srcAccountId = (payload.accountId || payload.fromAccountId || payload.sourceAccountId || srcAccountName).trim();

    if (!srcAccountName) {
      throw new Error('Please select a valid account.');
    }

    let destAccountName: string | undefined = undefined;
    let destAccountId: string | undefined = undefined;

    if (payload.type === 'TRANSFER') {
      destAccountName = (
        payload.toAccount ||
        payload.destinationAccount ||
        payload.transferToAccount ||
        payload.destination ||
        payload.transferTo ||
        ''
      ).trim();

      destAccountId = (
        payload.toAccountId ||
        payload.destinationAccountId ||
        payload.transferToAccountId ||
        destAccountName
      ).trim();

      if (!destAccountName) {
        throw new Error('Select the destination account.');
      }

      if (
        srcAccountName.toLowerCase() === destAccountName.toLowerCase() ||
        (srcAccountId && destAccountId && srcAccountId.toLowerCase() === destAccountId.toLowerCase())
      ) {
        throw new Error('From Account and To Account must be different. Cannot transfer to the same account.');
      }
    }

    // 3. Fully populate every conceivable alias for Google Apps Script
    const comprehensivePayload: CreateTransactionPayload = {
      ...payload,
      amount: cleanAmount,
      // Source account aliases
      account: srcAccountName,
      accountName: srcAccountName,
      accountId: srcAccountId,
      fromAccount: srcAccountName,
      fromAccountId: srcAccountId,
      sourceAccount: srcAccountName,
      sourceAccountId: srcAccountId,
      // Destination account aliases
      toAccount: destAccountName,
      toAccountId: destAccountId,
      toAccountName: destAccountName,
      destinationAccount: destAccountName,
      destinationAccountId: destAccountId,
      transferToAccount: destAccountName,
      transferToAccountId: destAccountId,
      transferToAccountName: destAccountName,
      destination: destAccountName,
      transferTo: destAccountName,
      category: payload.type === 'TRANSFER' ? 'Transfer' : payload.category,
    };

    const result: any = await this.post('createTransaction', comprehensivePayload);
    return {
      success: true,
      transactionId: result.transactionId || result.id || result.transaction_id,
      message: result.message || 'Transaction recorded successfully.',
    };
  }

  /**
   * POST voidTransaction
   */
  public static async voidTransaction(id: string, reason?: string): Promise<{ success: boolean }> {
    const result: any = await this.post('voidTransaction', {
      transactionId: id,
      id,
      reason: reason || 'Voided by user',
    });
    return { success: true };
  }

  /**
   * POST addAccount
   */
  public static async addAccount(account: {
    name: string;
    type: 'CASH' | 'BANK' | 'MOBILE_WALLET' | 'OTHER' | string;
    openingBalance?: number;
    notes?: string;
  }): Promise<{ success: boolean; id?: string; accountId?: string; message?: string }> {
    const openingBal = Number(account.openingBalance) || 0;
    const payload = {
      name: account.name.trim(),
      accountName: account.name.trim(),
      account_name: account.name.trim(),
      type: account.type,
      accountType: account.type,
      account_type: account.type,
      openingBalance: openingBal,
      opening_balance: openingBal,
      notes: (account.notes || '').trim(),
      active: true,
    };
    const res: any = await this.post('addAccount', payload);
    const resolvedId = res?.accountId || res?.id || res?.account_id || '';
    return {
      success: true,
      id: resolvedId,
      accountId: resolvedId,
      message: res?.message || 'Account added successfully.',
    };
  }

  /**
   * POST addCategory
   */
  public static async addCategory(category: {
    name: string;
    type: 'IN' | 'OUT' | 'INCOME' | 'EXPENSE';
    code?: string;
    description?: string;
  }): Promise<{ success: boolean; id?: string; message?: string }> {
    const isExpense = category.type === 'OUT' || category.type === 'EXPENSE';
    const payload = {
      name: category.name.trim(),
      categoryName: category.name.trim(),
      category_name: category.name.trim(),
      type: isExpense ? 'OUT' : 'IN',
      categoryType: isExpense ? 'EXPENSE' : 'INCOME',
      category_type: isExpense ? 'EXPENSE' : 'INCOME',
      code: (category.code || '').trim(),
      description: (category.description || '').trim(),
      notes: (category.description || '').trim(),
      active: true,
    };
    const res: any = await this.post('addCategory', payload);
    return {
      success: true,
      id: res?.id || res?.categoryId || res?.category_id,
      message:
        res?.message ||
        (isExpense
          ? 'Expense category added successfully.'
          : 'Category added successfully.'),
    };
  }

  /**
   * POST addCustomer
   */
  public static async addCustomer(customer: Partial<Customer>): Promise<any> {
    return this.post('addCustomer', customer);
  }

  /**
   * POST addVehicle
   */
  public static async addVehicle(vehicle: Partial<Vehicle>): Promise<any> {
    return this.post('addVehicle', vehicle);
  }

  // ==========================================
  // Administrator & User Management Endpoints
  // ==========================================

  /**
   * GET ?action=users
   * Fetches registered administrators and workshop staff from Users sheet
   */
  public static async getUsers(): Promise<User[]> {
    try {
      const res: any = await this.get('users');
      const rawUsers = Array.isArray(res) ? res : res.users || res.data || [];
      return rawUsers.map((u: any) => ({
        id: String(u.userId || u.id || u.user_id || u.username),
        username: String(u.username || u.name || '').trim(),
        name: String(u.fullName || u.name || u.username || '').trim(),
        role: (String(u.role || 'STAFF').toUpperCase() === 'ADMIN' ? 'ADMIN' : String(u.role || '').toUpperCase() === 'VIEWER' ? 'VIEWER' : 'STAFF') as any,
        pin: u.pin ? String(u.pin) : undefined,
        phone: u.phone ? String(u.phone) : undefined,
        email: u.email ? String(u.email) : undefined,
        active: u.active !== false && String(u.status || '').toLowerCase() !== 'inactive',
        createdAt: u.createdAt || u.created_at,
        lastLoginAt: u.lastLoginAt || u.last_login,
      }));
    } catch (err: any) {
      console.warn('Backend getUsers warning:', err.message);
      return [];
    }
  }

  /**
   * POST addUser
   */
  public static async addUser(userData: {
    username: string;
    name: string;
    role: 'ADMIN' | 'STAFF' | 'VIEWER';
    pin?: string;
    phone?: string;
    email?: string;
  }): Promise<{ success: boolean; id?: string; message?: string }> {
    const payload = {
      username: userData.username.trim(),
      name: userData.name.trim(),
      fullName: userData.name.trim(),
      role: userData.role,
      pin: userData.pin ? userData.pin.trim() : '1234',
      phone: userData.phone?.trim() || '',
      email: userData.email?.trim() || '',
      active: true,
      status: 'ACTIVE',
    };
    const res: any = await this.post('addUser', payload);
    return {
      success: true,
      id: res?.userId || res?.id,
      message: res?.message || 'User added successfully.',
    };
  }

  /**
   * POST updateUser
   */
  public static async updateUser(
    id: string,
    updates: Partial<User>
  ): Promise<{ success: boolean; message?: string }> {
    const payload = {
      userId: id,
      id,
      ...updates,
    };
    const res: any = await this.post('updateUser', payload);
    return {
      success: true,
      message: res?.message || 'User updated successfully.',
    };
  }

  /**
   * POST login
   * Verifies user credentials on Google Apps Script backend
   */
  public static async loginUser(username: string, pin: string): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const res: any = await this.post('login', {
        username: username.trim(),
        pin: pin.trim(),
      });
      if (res && res.success !== false && res.user) {
        return {
          success: true,
          user: {
            id: String(res.user.id || res.user.userId || res.user.username),
            username: String(res.user.username),
            name: String(res.user.name || res.user.fullName || res.user.username),
            role: (String(res.user.role || 'STAFF').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STAFF') as any,
            active: res.user.active !== false,
          },
          message: res.message || 'Login successful',
        };
      }
      return {
        success: false,
        message: res?.message || res?.error || 'Invalid username or PIN.',
      };
    } catch (err: any) {
      throw err;
    }
  }

  /**
   * GET ?action=backup
   * Requests complete JSON backup from Google Apps Script
   */
  public static async exportBackup(): Promise<any> {
    return this.get('backup');
  }
}

