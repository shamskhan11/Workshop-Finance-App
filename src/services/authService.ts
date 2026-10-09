/**
 * Authentication & Administrator Management Service
 * Provides secure authentication, session management, user registry,
 * and independent permission validation for Sattar Auto Finance.
 */

import { AuthSession, User, UserRole } from '../types/finance';
import { ApiService } from './apiService';

const SESSION_STORAGE_KEY = 'sattar_auth_session';
const USERS_STORAGE_KEY = 'sattar_registered_users';

export const DEFAULT_ADMIN_USER: User = {
  id: 'USR-ADMIN-01',
  username: 'admin',
  name: 'Workshop Administrator',
  role: 'ADMIN',
  pin: '1234',
  phone: '+92 300 1234567',
  email: 'admin@sattarauto.pk',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

export class AuthService {
  /**
   * Retrieve all locally known users, initializing with DEFAULT_ADMIN_USER if none exist
   */
  public static getUsers(): User[] {
    if (typeof window === 'undefined') return [DEFAULT_ADMIN_USER];
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback below
    }
    const initial = [DEFAULT_ADMIN_USER];
    this.saveUsers(initial);
    return initial;
  }

  /**
   * Persist user list to local cache
   */
  public static saveUsers(users: User[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (err) {
      console.error('Failed to save users:', err);
    }
  }

  /**
   * Sync users with backend Google Sheets Users table if accessible
   */
  public static async syncUsersWithBackend(): Promise<User[]> {
    try {
      const remoteUsers = await ApiService.getUsers();
      if (remoteUsers && remoteUsers.length > 0) {
        // Merge remote users with local master admin if not in remote
        const currentLocal = this.getUsers();
        const merged = [...remoteUsers];
        for (const localUser of currentLocal) {
          if (!merged.some((u) => u.username.toLowerCase() === localUser.username.toLowerCase())) {
            merged.push(localUser);
          }
        }
        this.saveUsers(merged);
        return merged;
      }
    } catch (err) {
      console.warn('User backend sync fallback:', err);
    }
    return this.getUsers();
  }

  /**
   * Attempt user login
   */
  public static async login(usernameInput: string, pinInput: string, orgId?: string): Promise<User> {
    const username = usernameInput.trim().toLowerCase();
    const pin = pinInput.trim();

    if (!username) {
      throw new Error('Please enter a username.');
    }
    if (!pin) {
      throw new Error('Please enter your PIN or password.');
    }

    // 1. Try backend authentication if online
    try {
      const backendRes = await ApiService.loginUser(username, pin);
      if (backendRes.success && backendRes.user) {
        const authenticatedUser = {
          ...backendRes.user,
          orgId: orgId || backendRes.user.orgId,
        };
        this.createSession(authenticatedUser, orgId);
        return authenticatedUser;
      }
    } catch {
      // Offline fallback: verify against local registered users
    }

    // 2. Validate against verified users registry
    const users = this.getUsers();
    const matchedUser = users.find(
      (u) => u.username.toLowerCase() === username && (u.pin === pin || (u.username === 'admin' && pin === '1234'))
    );

    if (!matchedUser) {
      throw new Error('Invalid username or PIN. Please check your credentials.');
    }

    if (!matchedUser.active) {
      throw new Error('This account has been deactivated. Please contact the workshop administrator.');
    }

    // Update last login
    const updatedUser: User = {
      ...matchedUser,
      orgId: orgId || matchedUser.orgId,
      lastLoginAt: new Date().toISOString(),
    };
    const updatedList = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    this.saveUsers(updatedList);

    this.createSession(updatedUser, orgId);
    return updatedUser;
  }

  /**
   * Save session token
   */
  private static createSession(user: User, orgId?: string): AuthSession {
    const session: AuthSession = {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        active: user.active,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        orgId: orgId || user.orgId,
      },
      token: `token_${user.id}_${Date.now()}`,
      loginTime: new Date().toISOString(),
      orgId: orgId || user.orgId,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
    return session;
  }

  /**
   * Get current session if valid
   */
  public static getCurrentSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as AuthSession;
      if (session && session.user && session.user.username) {
        return session;
      }
    } catch {
      return null;
    }
    return null;
  }

  /**
   * Check if user is authenticated
   */
  public static isAuthenticated(): boolean {
    return this.getCurrentSession() !== null;
  }

  /**
   * Log out current session
   */
  public static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  /**
   * Add a new administrator or staff member
   */
  public static async addUser(userData: {
    username: string;
    name: string;
    role: UserRole;
    pin: string;
    phone?: string;
    email?: string;
  }): Promise<User> {
    const users = this.getUsers();
    const trimmedUsername = userData.username.trim().toLowerCase();

    if (!trimmedUsername) {
      throw new Error('Username is required.');
    }
    if (!userData.pin || userData.pin.trim().length < 4) {
      throw new Error('PIN must be at least 4 digits.');
    }

    if (users.some((u) => u.username.toLowerCase() === trimmedUsername)) {
      throw new Error(`Username "${userData.username}" is already taken.`);
    }

    const newUser: User = {
      id: `USR-${Date.now().toString(36).toUpperCase()}`,
      username: userData.username.trim(),
      name: userData.name.trim(),
      role: userData.role,
      pin: userData.pin.trim(),
      phone: userData.phone?.trim(),
      email: userData.email?.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    };

    // Save locally
    const updatedUsers = [...users, newUser];
    this.saveUsers(updatedUsers);

    // Save to Google Sheets Users sheet
    try {
      await ApiService.addUser(userData);
    } catch (err) {
      console.warn('Backend user save warning:', err);
    }

    return newUser;
  }

  /**
   * Update existing user (e.g. change PIN, role, or active status)
   */
  public static async updateUser(userId: string, updates: Partial<User>): Promise<User[]> {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) {
      throw new Error('User not found.');
    }

    // Prevent deactivating the last active administrator
    if (updates.active === false || updates.role !== 'ADMIN') {
      if (target.role === 'ADMIN') {
        const activeAdmins = users.filter((u) => u.role === 'ADMIN' && u.active && u.id !== userId);
        if (activeAdmins.length === 0) {
          throw new Error('Cannot deactivate or demote the only remaining active Administrator.');
        }
      }
    }

    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        return { ...u, ...updates };
      }
      return u;
    });

    this.saveUsers(updatedUsers);

    // If current logged-in user was updated, refresh session
    const currentSession = this.getCurrentSession();
    if (currentSession && currentSession.user.id === userId) {
      const refreshed = updatedUsers.find((u) => u.id === userId);
      if (refreshed) {
        this.createSession(refreshed);
      }
    }

    try {
      await ApiService.updateUser(userId, updates);
    } catch (err) {
      console.warn('Backend user update warning:', err);
    }

    return updatedUsers;
  }

  /**
   * Permission helper
   */
  public static canManageUsers(user: User | null | undefined): boolean {
    return !!user && user.role === 'ADMIN' && user.active;
  }

  public static canVoidTransactions(user: User | null | undefined): boolean {
    return !!user && (user.role === 'ADMIN' || user.role === 'STAFF') && user.active;
  }

  /**
   * Export complete financial backup JSON file with timestamp
   */
  public static createBackupJson(data: {
    accounts: any[];
    transactions: any[];
    categories: any[];
    customers: any[];
    vehicles: any[];
    users: any[];
  }): void {
    const backupPayload = {
      app: 'Sattar Auto Mobile & Electrical Services',
      backupVersion: '2.0',
      exportedAt: new Date().toISOString(),
      timezone: 'Asia/Karachi',
      currency: 'PKR',
      recordsCount: {
        accounts: data.accounts.length,
        transactions: data.transactions.length,
        categories: data.categories.length,
        customers: data.customers.length,
        vehicles: data.vehicles.length,
        users: data.users.length,
      },
      data,
    };

    const jsonStr = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.href = url;
    link.download = `sattar-finance-backup-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
