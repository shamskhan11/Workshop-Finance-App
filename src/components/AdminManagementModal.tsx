import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types/finance';
import { AuthService } from '../services/authService';
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
  UserCheck,
  UserX,
} from 'lucide-react';

interface AdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onShowToast: (message: string) => void;
  allFinancialData: {
    accounts: any[];
    transactions: any[];
    categories: any[];
    customers: any[];
    vehicles: any[];
  };
}

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onShowToast,
  allFinancialData,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState<User | null>(null);

  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('STAFF');
  const [newPin, setNewPin] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Edit User Form State
  const [editRole, setEditRole] = useState<UserRole>('STAFF');
  const [editPin, setEditPin] = useState('');
  const [editActive, setEditActive] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setIsAddUserOpen(false);
      setIsEditingUser(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const synced = await AuthService.syncUsersWithBackend();
      setUsers(synced);
    } catch {
      setUsers(AuthService.getUsers());
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'ADMIN';

  // Handle Full Financial Backup Download
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

  // Add User Submission
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
      loadUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create user.');
    } finally {
      setIsLoading(false);
    }
  };

  // Edit User Submission
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
      loadUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update user.');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (u: User) => {
    setIsEditingUser(u);
    setEditRole(u.role);
    setEditPin('');
    setEditActive(u.active);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slideUp">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">ADMINISTRATOR & USER CONTROL</h3>
              <p className="text-[11px] text-slate-400">Roles, PINs, and Database Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Backup Database Banner - Crucial Requirement */}
          <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Financial Data Backup</span>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Create & Download Backup</span>
              </button>
            </div>
            <p className="text-[11px] text-indigo-200/80 leading-relaxed">
              Export full timestamped snapshot containing accounts, transactions, categories, and registered users before performing admin changes.
            </p>
          </div>

          {!isAdmin ? (
            <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 space-y-2 text-center">
              <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
              <div className="font-bold text-xs uppercase tracking-wide">Administrator Privileges Required</div>
              <p className="text-[11px] text-amber-300/80">
                You are currently logged in as a <strong>{currentUser?.role || 'STAFF'}</strong> user. Only Administrators can modify user accounts or assign security roles.
              </p>
            </div>
          ) : (
            <>
              {/* User Actions Toolbar */}
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

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400">Username *</label>
                      <input
                        type="text"
                        required
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="e.g. shams"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Shams Khan"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400">Role *</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="ADMIN">ADMIN (Full Control)</option>
                        <option value="STAFF">STAFF (Records Transactions)</option>
                        <option value="VIEWER">VIEWER (Read-Only)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400">Security PIN *</label>
                      <input
                        type="password"
                        required
                        maxLength={8}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="4-digit PIN"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400">Phone (Optional)</label>
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="+92 3..."
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400">Email (Optional)</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="user@sattar.pk"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAddUserOpen(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save User</span>
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
                    <span className="font-bold text-slate-200 text-xs">
                      Edit User: <span className="text-amber-400 font-mono">{isEditingUser.username}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingUser(null)}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400">Assigned Role</label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="STAFF">STAFF</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-400">Account Status</label>
                      <button
                        type="button"
                        onClick={() => setEditActive(!editActive)}
                        className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                          editActive
                            ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                            : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                        }`}
                      >
                        {editActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        <span>{editActive ? 'Active Account' : 'Deactivated'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">
                      Reset PIN (Leave blank to keep current PIN)
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={editPin}
                      onChange={(e) => setEditPin(e.target.value)}
                      placeholder="New PIN (min 4 digits)"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingUser(null)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Update User</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Users List */}
              <div className="space-y-2">
                {users.map((u) => {
                  const isCurrent = currentUser?.id === u.id || currentUser?.username === u.username;
                  return (
                    <div
                      key={u.id}
                      className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-xs">{u.name}</span>
                          <span className="font-mono text-[10px] text-slate-500">@{u.username}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded font-semibold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span
                            className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                              u.role === 'ADMIN'
                                ? 'bg-amber-500/20 text-amber-300'
                                : u.role === 'STAFF'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {u.role}
                          </span>
                          <span className={u.active ? 'text-emerald-400' : 'text-rose-400'}>
                            {u.active ? '● Active' : '● Inactive'}
                          </span>
                          {u.phone && <span>· {u.phone}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(u)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Current User: <strong className="text-slate-300">{currentUser?.name}</strong> ({currentUser?.role})
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
