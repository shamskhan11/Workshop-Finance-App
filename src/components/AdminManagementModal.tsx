import React, { useState, useEffect } from 'react';
import { Account, Category, Organization, User, UserRole } from '../types/finance';
import { AuthService } from '../services/authService';
import { ApiService } from '../services/apiService';
import {
  X,
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Download,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  Phone,
  Mail,
  Layers,
  Tag,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Building2,
} from 'lucide-react';

interface AdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onShowToast: (message: string) => void;
  org?: Organization;
  onRefreshAccounts: () => Promise<Account[]>;
  onRefreshCategories: () => Promise<Category[]>;
  allFinancialData: {
    accounts: Account[];
    transactions: any[];
    categories: Category[];
    customers: any[];
    vehicles: any[];
  };
}

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onShowToast,
  org,
  onRefreshAccounts,
  onRefreshCategories,
  allFinancialData,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'accounts' | 'categories'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(allFinancialData.accounts);
  const [categories, setCategories] = useState<Category[]>(allFinancialData.categories);

  // User forms
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('STAFF');
  const [newPin, setNewPin] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('STAFF');
  const [editPin, setEditPin] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Account forms
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState<Account | null>(null);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('Bank');
  const [accOpeningBal, setAccOpeningBal] = useState('0');
  const [accNotes, setAccNotes] = useState('');

  // Category forms
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [isEditingCat, setIsEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'IN' | 'OUT'>('OUT');
  const [catCode, setCatCode] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Confirm Dialog for Destructive / Deactivate Operations
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDangerous?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setIsAddUserOpen(false);
      setIsEditingUser(null);
      setIsAddAccountOpen(false);
      setIsEditingAccount(null);
      setIsAddCatOpen(false);
      setIsEditingCat(null);
      setErrorMessage(null);
      setConfirmDialog(null);
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const syncedUsers = await AuthService.syncUsersWithBackend();
      setUsers(syncedUsers);
    } catch {
      setUsers(AuthService.getUsers());
    }

    try {
      const refreshedAccs = await onRefreshAccounts();
      if (refreshedAccs) setAccounts(refreshedAccs);
    } catch {
      setAccounts(allFinancialData.accounts);
    }

    try {
      const refreshedCats = await onRefreshCategories();
      if (refreshedCats) setCategories(refreshedCats);
    } catch {
      setCategories(allFinancialData.categories);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'ADMIN';

  // Helper: check if account is used in any transactions
  const getAccountTransactionCount = (acc: Account): number => {
    const accIdentifier = (acc.id || acc.name).toLowerCase();
    const accNameLower = (acc.name || '').toLowerCase();
    return allFinancialData.transactions.filter((t) => {
      const sAcc = (t.account || t.fromAccount || '').toLowerCase();
      const sId = (t.accountId || '').toLowerCase();
      const dAcc = (t.toAccount || '').toLowerCase();
      const dId = (t.toAccountId || '').toLowerCase();
      return (
        sAcc === accNameLower ||
        sId === accIdentifier ||
        dAcc === accNameLower ||
        dId === accIdentifier
      );
    }).length;
  };

  // Helper: check if category is used in any transactions
  const getCategoryTransactionCount = (cat: Category): number => {
    const catNameLower = (cat.name || '').toLowerCase();
    const catId = (cat.id || '').toLowerCase();
    return allFinancialData.transactions.filter((t) => {
      const tCat = (t.category || '').toLowerCase();
      const tCatId = (t.categoryId || '').toLowerCase();
      return tCat === catNameLower || (tCatId && tCatId === catId);
    }).length;
  };

  // Full Financial Backup Download
  const handleExportBackup = () => {
    try {
      AuthService.createBackupJson({
        ...allFinancialData,
        users,
      });
      onShowToast('Financial database backup created and downloaded successfully.');
    } catch (err: any) {
      setErrorMessage(`Backup creation failed: ${err.message}`);
    }
  };

  // ==========================================
  // USER MANAGEMENT HANDLERS
  // ==========================================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newUsername.trim()) {
      setErrorMessage('Username is required.');
      return;
    }
    if (!newName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }
    if (!newPin.trim() || newPin.trim().length < 4) {
      setErrorMessage('PIN must be at least 4 digits.');
      return;
    }

    try {
      setIsLoading(true);
      await AuthService.addUser({
        username: newUsername.trim(),
        name: newName.trim(),
        role: newRole,
        pin: newPin.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
      });

      onShowToast(`User "${newUsername}" created successfully.`);
      setIsAddUserOpen(false);
      setNewUsername('');
      setNewName('');
      setNewPin('');
      setNewPhone('');
      setNewEmail('');
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create user.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingUser) return;
    setErrorMessage(null);

    try {
      setIsLoading(true);
      const updates: Partial<User> = {
        role: editRole,
        active: editActive,
      };
      if (editPin.trim()) {
        if (editPin.trim().length < 4) {
          setErrorMessage('PIN must be at least 4 digits.');
          setIsLoading(false);
          return;
        }
        updates.pin = editPin.trim();
      }

      await AuthService.updateUser(isEditingUser.id, updates);
      onShowToast(`User "${isEditingUser.username}" updated successfully.`);
      setIsEditingUser(null);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update user.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // ACCOUNT MANAGEMENT HANDLERS
  // ==========================================
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = accName.trim();
    if (!trimmed) {
      setErrorMessage('Account name is required.');
      return;
    }

    if (accounts.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage(`Account named "${trimmed}" already exists.`);
      return;
    }

    try {
      setIsLoading(true);
      await ApiService.addAccount({
        name: trimmed,
        type: accType,
        openingBalance: Number(accOpeningBal) || 0,
        notes: accNotes.trim(),
      });
      onShowToast(`Account "${trimmed}" added successfully.`);
      setIsAddAccountOpen(false);
      setAccName('');
      setAccOpeningBal('0');
      setAccNotes('');
      await onRefreshAccounts();
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingAccount) return;
    setErrorMessage(null);

    const trimmed = accName.trim();
    if (!trimmed) {
      setErrorMessage('Account name is required.');
      return;
    }

    try {
      setIsLoading(true);
      await ApiService.updateAccount(isEditingAccount.id, {
        name: trimmed,
        type: accType,
        notes: accNotes.trim(),
        orgId: org?.id,
        adminUser: currentUser?.username,
      });
      onShowToast(`Account "${trimmed}" updated successfully.`);
      setIsEditingAccount(null);
      await onRefreshAccounts();
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAccountActive = (acc: Account) => {
    const isDeactivating = acc.active !== false;
    setConfirmDialog({
      isOpen: true,
      title: isDeactivating ? `Deactivate ${acc.name}?` : `Reactivate ${acc.name}?`,
      description: isDeactivating
        ? `Deactivating "${acc.name}" hides it from transaction selection while preserving historical records and balances.`
        : `Reactivating "${acc.name}" makes it available again for new financial transactions and transfers.`,
      actionLabel: isDeactivating ? 'Deactivate Account' : 'Reactivate Account',
      isDangerous: isDeactivating,
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await ApiService.updateAccount(acc.id, {
            active: !isDeactivating,
            orgId: org?.id,
            adminUser: currentUser?.username,
          });
          onShowToast(`Account "${acc.name}" ${isDeactivating ? 'deactivated' : 'reactivated'}.`);
          setConfirmDialog(null);
          await onRefreshAccounts();
          loadData();
        } catch (err: any) {
          setErrorMessage(err.message || 'Action failed.');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleDeleteAccount = (acc: Account) => {
    const txCount = getAccountTransactionCount(acc);

    if (txCount > 0) {
      // Safe guard: Offer deactivation instead
      setConfirmDialog({
        isOpen: true,
        title: `Cannot Permanently Delete ${acc.name}`,
        description: `This account is referenced by ${txCount} historical transaction(s) or transfers. To protect financial audit integrity, it cannot be permanently deleted. Would you like to deactivate it instead?`,
        actionLabel: 'Deactivate Account Instead',
        isDangerous: true,
        onConfirm: async () => {
          try {
            setIsLoading(true);
            await ApiService.updateAccount(acc.id, {
              active: false,
              orgId: org?.id,
              adminUser: currentUser?.username,
            });
            onShowToast(`Account "${acc.name}" deactivated safely.`);
            setConfirmDialog(null);
            await onRefreshAccounts();
            loadData();
          } catch (err: any) {
            setErrorMessage(err.message || 'Action failed.');
          } finally {
            setIsLoading(false);
          }
        },
      });
      return;
    }

    // Zero transactions: Safe deletion
    setConfirmDialog({
      isOpen: true,
      title: `Permanently Delete ${acc.name}?`,
      description: `This account has 0 recorded transactions. Permanent deletion will remove it completely. This action cannot be undone.`,
      actionLabel: 'Delete Account Permanently',
      isDangerous: true,
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await ApiService.deleteAccount(acc.id, {
            hardDelete: true,
            orgId: org?.id,
            adminUser: currentUser?.username,
          });
          onShowToast(`Account "${acc.name}" deleted.`);
          setConfirmDialog(null);
          await onRefreshAccounts();
          loadData();
        } catch (err: any) {
          setErrorMessage(err.message || 'Deletion failed.');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // ==========================================
  // CATEGORY MANAGEMENT HANDLERS
  // ==========================================
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = catName.trim();
    if (!trimmed) {
      setErrorMessage('Category name is required.');
      return;
    }

    if (
      categories.some(
        (c) => c.type === catType && c.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setErrorMessage(`A ${catType === 'IN' ? 'Income' : 'Expense'} category named "${trimmed}" already exists.`);
      return;
    }

    try {
      setIsLoading(true);
      await ApiService.addCategory({
        name: trimmed,
        type: catType,
        code: catCode.trim(),
        description: catDesc.trim(),
      });
      onShowToast(`Category "${trimmed}" added successfully.`);
      setIsAddCatOpen(false);
      setCatName('');
      setCatCode('');
      setCatDesc('');
      await onRefreshCategories();
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add category.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingCat) return;
    setErrorMessage(null);

    const trimmed = catName.trim();
    if (!trimmed) {
      setErrorMessage('Category name is required.');
      return;
    }

    try {
      setIsLoading(true);
      await ApiService.updateCategory(isEditingCat.id, {
        name: trimmed,
        type: catType,
        code: catCode.trim(),
        description: catDesc.trim(),
        orgId: org?.id,
        adminUser: currentUser?.username,
      });
      onShowToast(`Category "${trimmed}" updated successfully.`);
      setIsEditingCat(null);
      await onRefreshCategories();
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update category.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCategoryActive = (cat: Category) => {
    const isDeactivating = cat.active !== false;
    setConfirmDialog({
      isOpen: true,
      title: isDeactivating ? `Deactivate ${cat.name}?` : `Reactivate ${cat.name}?`,
      description: isDeactivating
        ? `Deactivating category "${cat.name}" hides it from transaction selection while preserving all historical records.`
        : `Reactivating category "${cat.name}" makes it available again for transactions.`,
      actionLabel: isDeactivating ? 'Deactivate Category' : 'Reactivate Category',
      isDangerous: isDeactivating,
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await ApiService.updateCategory(cat.id, {
            active: !isDeactivating,
            orgId: org?.id,
            adminUser: currentUser?.username,
          });
          onShowToast(`Category "${cat.name}" ${isDeactivating ? 'deactivated' : 'reactivated'}.`);
          setConfirmDialog(null);
          await onRefreshCategories();
          loadData();
        } catch (err: any) {
          setErrorMessage(err.message || 'Action failed.');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleDeleteCategory = (cat: Category) => {
    const txCount = getCategoryTransactionCount(cat);

    if (txCount > 0) {
      // Safe guard: Offer deactivation instead
      setConfirmDialog({
        isOpen: true,
        title: `Cannot Permanently Delete ${cat.name}`,
        description: `This category is referenced by ${txCount} historical transaction(s). To protect financial reporting accuracy, it cannot be permanently deleted. Would you like to deactivate it instead?`,
        actionLabel: 'Deactivate Category Instead',
        isDangerous: true,
        onConfirm: async () => {
          try {
            setIsLoading(true);
            await ApiService.updateCategory(cat.id, {
              active: false,
              orgId: org?.id,
              adminUser: currentUser?.username,
            });
            onShowToast(`Category "${cat.name}" deactivated safely.`);
            setConfirmDialog(null);
            await onRefreshCategories();
            loadData();
          } catch (err: any) {
            setErrorMessage(err.message || 'Action failed.');
          } finally {
            setIsLoading(false);
          }
        },
      });
      return;
    }

    // Zero transactions: Safe deletion
    setConfirmDialog({
      isOpen: true,
      title: `Permanently Delete ${cat.name}?`,
      description: `This category has 0 recorded transactions. Permanent deletion will remove it completely. This action cannot be undone.`,
      actionLabel: 'Delete Category Permanently',
      isDangerous: true,
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await ApiService.deleteCategory(cat.id, {
            hardDelete: true,
            orgId: org?.id,
            adminUser: currentUser?.username,
          });
          onShowToast(`Category "${cat.name}" deleted.`);
          setConfirmDialog(null);
          await onRefreshCategories();
          loadData();
        } catch (err: any) {
          setErrorMessage(err.message || 'Deletion failed.');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const incomeCategories = categories.filter((c) => c.type === 'IN');
  const expenseCategories = categories.filter((c) => c.type === 'OUT');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-slideUp">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm uppercase">ADMINISTRATOR CONTROL</h3>
              <p className="text-[11px] text-slate-400">
                {org?.name ? org.name : 'Workshop Financial Administration'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Users | Accounts | Categories */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-900/40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users & Access ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-1.5 pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'accounts'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Accounts ({accounts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'categories'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Categories ({categories.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Backup Database Banner - Crucial Requirement */}
          <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Financial Data Snapshot Backup</span>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1 shadow-sm"
              >
                <Download className="w-3 h-3" />
                <span>Export Backup</span>
              </button>
            </div>
            <p className="text-[11px] text-indigo-200/80 leading-relaxed">
              Export timestamped JSON snapshot before modifying accounts, categories, or permissions.
            </p>
          </div>

          {!isAdmin ? (
            <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 space-y-2 text-center">
              <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
              <div className="font-bold text-xs uppercase tracking-wide">Administrator Privileges Required</div>
              <p className="text-[11px] text-amber-300/80">
                You are currently logged in as a <strong>{currentUser?.role || 'STAFF'}</strong> user. Only Administrators can modify workshop accounts, categories, and users.
              </p>
            </div>
          ) : (
            <>
              {/* ==================================================== */}
              {/* TAB 1: USERS & ACCESS CONTROL                        */}
              {/* ==================================================== */}
              {activeTab === 'users' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>Authorized Users ({users.length})</span>
                    </span>
                    {!isAddUserOpen && !isEditingUser && (
                      <button
                        onClick={() => setIsAddUserOpen(true)}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add User</span>
                      </button>
                    )}
                  </div>

                  {/* Add User Form */}
                  {isAddUserOpen && (
                    <form
                      onSubmit={handleCreateUser}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                          <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                          <span>Add Workshop User</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddUserOpen(false)}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Username *</label>
                          <input
                            type="text"
                            required
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder="e.g. manager1"
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Muhammad Ali"
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Role *</label>
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as UserRole)}
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                          >
                            <option value="STAFF">STAFF (Cashier / Tech)</option>
                            <option value="ADMIN">ADMIN (Full Permissions)</option>
                            <option value="VIEWER">VIEWER (Read-Only)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Security PIN *</label>
                          <input
                            type="password"
                            required
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            placeholder="4-digit PIN"
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Phone</label>
                          <input
                            type="tel"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            placeholder="+92 300 0000000"
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Email</label>
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="user@workshop.pk"
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsAddUserOpen(false)}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                        >
                          Save User
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Edit User Form */}
                  {isEditingUser && (
                    <form
                      onSubmit={handleUpdateUser}
                      className="p-4 bg-slate-950 border border-amber-500/40 rounded-xl space-y-3 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-amber-400 text-xs">
                          Edit User: @{isEditingUser.username}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingUser(null)}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Role</label>
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as UserRole)}
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                          >
                            <option value="STAFF">STAFF</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            New PIN (leave blank to keep)
                          </label>
                          <input
                            type="password"
                            value={editPin}
                            onChange={(e) => setEditPin(e.target.value)}
                            placeholder="New 4-digit PIN"
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="editActiveCheckbox"
                          checked={editActive}
                          onChange={(e) => setEditActive(e.target.checked)}
                          className="rounded text-amber-500 bg-slate-900 border-slate-700"
                        />
                        <label htmlFor="editActiveCheckbox" className="text-xs text-slate-300 cursor-pointer">
                          Account Active (uncheck to deactivate)
                        </label>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsEditingUser(null)}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                        >
                          Update User
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Users List */}
                  <div className="space-y-2">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">@{u.username}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                            <span
                              className={`font-semibold px-1.5 py-0.5 rounded text-[9px] ${
                                u.role === 'ADMIN'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : u.role === 'STAFF'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {u.role}
                            </span>
                            <span className={u.active ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                              {u.active ? '● Active' : '● Inactive'}
                            </span>
                            {u.phone && <span>· {u.phone}</span>}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingUser(u);
                            setEditRole(u.role);
                            setEditPin('');
                            setEditActive(u.active);
                            setIsAddUserOpen(false);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB 2: ACCOUNTS MANAGEMENT                           */}
              {/* ==================================================== */}
              {activeTab === 'accounts' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Workshop Accounts ({accounts.length})</span>
                    </span>
                    {!isAddAccountOpen && !isEditingAccount && (
                      <button
                        onClick={() => {
                          setIsAddAccountOpen(true);
                          setAccName('');
                          setAccType('Bank');
                          setAccOpeningBal('0');
                          setAccNotes('');
                        }}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Account</span>
                      </button>
                    )}
                  </div>

                  {/* Add / Edit Account Form */}
                  {(isAddAccountOpen || isEditingAccount) && (
                    <form
                      onSubmit={isEditingAccount ? handleUpdateAccount : handleCreateAccount}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-slate-200 text-xs">
                          {isEditingAccount ? `Edit Account: ${isEditingAccount.name}` : 'Add New Account'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddAccountOpen(false);
                            setIsEditingAccount(null);
                          }}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Account Name *</label>
                          <input
                            type="text"
                            required
                            value={accName}
                            onChange={(e) => setAccName(e.target.value)}
                            placeholder="e.g. EasyPaisa / Bank Alfalah"
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Account Type *</label>
                          <select
                            value={accType}
                            onChange={(e) => setAccType(e.target.value)}
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank Account</option>
                            <option value="Mobile Wallet">Mobile Wallet (EasyPaisa / JazzCash)</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {!isEditingAccount && (
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            Opening Balance (PKR)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={accOpeningBal}
                            onChange={(e) => setAccOpeningBal(e.target.value)}
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Notes / Description</label>
                        <input
                          type="text"
                          value={accNotes}
                          onChange={(e) => setAccNotes(e.target.value)}
                          placeholder="Account branch, account number or details"
                          className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddAccountOpen(false);
                            setIsEditingAccount(null);
                          }}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                        >
                          {isEditingAccount ? 'Update Account' : 'Save Account'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Accounts List with Safe Deletion / Deactivation */}
                  <div className="space-y-2">
                    {accounts.map((acc) => {
                      const txCount = getAccountTransactionCount(acc);
                      const isActive = acc.active !== false;

                      return (
                        <div
                          key={acc.id}
                          className={`p-3 bg-slate-950/70 border rounded-xl flex items-center justify-between ${
                            isActive ? 'border-slate-800' : 'border-rose-900/30 opacity-70'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                              <span>{acc.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({acc.type || 'Standard'})</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                              <span className={isActive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                                {isActive ? '● Active' : '● Deactivated'}
                              </span>
                              <span>· {txCount} transaction(s)</span>
                              {acc.notes && <span>· {acc.notes}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingAccount(acc);
                                setAccName(acc.name);
                                setAccType(acc.type || 'Bank');
                                setAccNotes(acc.notes || '');
                                setIsAddAccountOpen(false);
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                              title="Edit Account Name"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleAccountActive(acc)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-slate-800 hover:bg-amber-950 text-slate-400 hover:text-amber-300'
                                  : 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900'
                              }`}
                              title={isActive ? 'Deactivate Account' : 'Reactivate Account'}
                            >
                              {isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(acc)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                              title={txCount > 0 ? 'Safeguarded: Cannot Delete Referenced Account' : 'Delete Account'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB 3: CATEGORIES MANAGEMENT                         */}
              {/* ==================================================== */}
              {activeTab === 'categories' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Workshop Categories ({categories.length})</span>
                    </span>
                    {!isAddCatOpen && !isEditingCat && (
                      <button
                        onClick={() => {
                          setIsAddCatOpen(true);
                          setCatName('');
                          setCatType('OUT');
                          setCatCode('');
                          setCatDesc('');
                        }}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Category</span>
                      </button>
                    )}
                  </div>

                  {/* Add / Edit Category Form */}
                  {(isAddCatOpen || isEditingCat) && (
                    <form
                      onSubmit={isEditingCat ? handleUpdateCategory : handleCreateCategory}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-slate-200 text-xs">
                          {isEditingCat ? `Edit Category: ${isEditingCat.name}` : 'Add New Category'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddCatOpen(false);
                            setIsEditingCat(null);
                          }}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Category Type *</label>
                          <select
                            value={catType}
                            onChange={(e) => setCatType(e.target.value as 'IN' | 'OUT')}
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                          >
                            <option value="OUT">Expense (Money Out)</option>
                            <option value="IN">Income (Money In)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Category Name *</label>
                          <input
                            type="text"
                            required
                            value={catName}
                            onChange={(e) => setCatName(e.target.value)}
                            placeholder="e.g. Engine Oil / Spare Parts"
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Code (Optional)</label>
                          <input
                            type="text"
                            value={catCode}
                            onChange={(e) => setCatCode(e.target.value)}
                            placeholder="e.g. EXP-030"
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Description</label>
                          <input
                            type="text"
                            value={catDesc}
                            onChange={(e) => setCatDesc(e.target.value)}
                            placeholder="Optional notes"
                            className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddCatOpen(false);
                            setIsEditingCat(null);
                          }}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                        >
                          {isEditingCat ? 'Update Category' : 'Save Category'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Income Categories Section */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Income Categories ({incomeCategories.length})
                    </span>
                    <div className="space-y-1.5">
                      {incomeCategories.map((c) => {
                        const txCount = getCategoryTransactionCount(c);
                        const isActive = c.active !== false;

                        return (
                          <div
                            key={c.id}
                            className={`p-2.5 bg-slate-950/70 border rounded-lg flex items-center justify-between ${
                              isActive ? 'border-slate-800' : 'border-rose-900/30 opacity-70'
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                                <span>{c.name}</span>
                                {c.code && (
                                  <span className="text-[10px] text-slate-500 font-mono">({c.code})</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className={isActive ? 'text-emerald-400' : 'text-rose-400'}>
                                  {isActive ? '● Active' : '● Inactive'}
                                </span>
                                <span>· {txCount} record(s)</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingCat(c);
                                  setCatName(c.name);
                                  setCatType('IN');
                                  setCatCode(c.code || '');
                                  setCatDesc(c.description || '');
                                  setIsAddCatOpen(false);
                                }}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                title="Edit Category"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleCategoryActive(c)}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                title={isActive ? 'Deactivate' : 'Reactivate'}
                              >
                                {isActive ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(c)}
                                className="p-1 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded"
                                title="Delete / Safeguard"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expense Categories Section */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                      Expense Categories ({expenseCategories.length})
                    </span>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {expenseCategories.map((c) => {
                        const txCount = getCategoryTransactionCount(c);
                        const isActive = c.active !== false;

                        return (
                          <div
                            key={c.id}
                            className={`p-2.5 bg-slate-950/70 border rounded-lg flex items-center justify-between ${
                              isActive ? 'border-slate-800' : 'border-rose-900/30 opacity-70'
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                                <span>{c.name}</span>
                                {c.code && (
                                  <span className="text-[10px] text-slate-500 font-mono">({c.code})</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className={isActive ? 'text-emerald-400' : 'text-rose-400'}>
                                  {isActive ? '● Active' : '● Inactive'}
                                </span>
                                <span>· {txCount} record(s)</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingCat(c);
                                  setCatName(c.name);
                                  setCatType('OUT');
                                  setCatCode(c.code || '');
                                  setCatDesc(c.description || '');
                                  setIsAddCatOpen(false);
                                }}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                title="Edit Category"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleCategoryActive(c)}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                title={isActive ? 'Deactivate' : 'Reactivate'}
                              >
                                {isActive ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(c)}
                                className="p-1 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded"
                                title="Delete / Safeguard"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Destructive / Deactivation Confirmation Dialog */}
          {confirmDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
              <div className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${confirmDialog.isDangerous ? 'bg-rose-950/60 text-rose-400 border border-rose-800' : 'bg-amber-950/60 text-amber-400 border border-amber-800'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{confirmDialog.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{confirmDialog.description}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setConfirmDialog(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={confirmDialog.onConfirm}
                    className={`px-3 py-1.5 text-white font-bold text-xs rounded-xl shadow-md transition-colors ${
                      confirmDialog.isDangerous
                        ? 'bg-rose-600 hover:bg-rose-500'
                        : 'bg-amber-600 hover:bg-amber-500'
                    }`}
                  >
                    {confirmDialog.actionLabel}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Logged in: <strong className="text-slate-300">{currentUser?.name}</strong> ({currentUser?.role})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
