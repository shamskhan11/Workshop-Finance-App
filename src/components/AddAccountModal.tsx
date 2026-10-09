import React, { useState, useEffect } from 'react';
import { Account } from '../types/finance';
import { ApiService } from '../services/apiService';
import { X, Landmark, AlertCircle, Loader2, Check } from 'lucide-react';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingAccounts: Account[];
  onSuccess: (newAccount: { id: string; name: string }) => Promise<void> | void;
}

export type AccountTypeOption = 'CASH' | 'BANK' | 'MOBILE_WALLET' | 'OTHER';

const ACCOUNT_TYPE_LABELS: { value: AccountTypeOption; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank' },
  { value: 'MOBILE_WALLET', label: 'Mobile Wallet (JazzCash / Easypaisa)' },
  { value: 'OTHER', label: 'Other' },
];

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  existingAccounts,
  onSuccess,
}) => {
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountTypeOption>('BANK');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAccountName('');
      setAccountType('BANK');
      setOpeningBalance('0');
      setNotes('');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = accountName.trim();
    if (!trimmedName) {
      setErrorMessage('Account Name is required and cannot be blank.');
      return;
    }

    // Check duplicate account name
    const exists = existingAccounts.some(
      (a) => (a.name || '').trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      setErrorMessage(`An account named "${trimmedName}" already exists. Please use a unique name.`);
      return;
    }

    if (!accountType) {
      setErrorMessage('Account Type is required.');
      return;
    }

    const parsedOpeningBalance = parseFloat(openingBalance);
    if (isNaN(parsedOpeningBalance)) {
      setErrorMessage('Opening Balance must be a valid number.');
      return;
    }
    if (parsedOpeningBalance < 0) {
      setErrorMessage('Opening Balance cannot be negative.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await ApiService.addAccount({
        name: trimmedName,
        type: accountType,
        openingBalance: Math.round(parsedOpeningBalance),
        notes: notes.trim(),
      });

      if (res && res.success !== false) {
        const createdId = res.accountId || res.id || '';
        await onSuccess({ id: createdId, name: trimmedName });
        onClose();
      } else {
        throw new Error(res?.message || 'Failed to create account on backend.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to save account to Google Sheets.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">ADD NEW ACCOUNT</h3>
              <p className="text-[11px] text-slate-400">Saves to Google Sheets Accounts Sheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Account Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Account Name <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. Meezan Bank, Petty Cash 2, Workshop Safe"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
            />
          </div>

          {/* Account Type */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Account Type <span className="text-amber-400">*</span>
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountTypeOption)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {ACCOUNT_TYPE_LABELS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Opening Balance */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Opening Balance (PKR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                PKR
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0"
                className="w-full pl-12 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Initial balance before recorded transactions.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Account number, branch name, custodian..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
