import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Account, Category, Customer, TransactionType, Vehicle } from '../types/finance';
import { ApiService } from '../services/apiService';
import { PAYMENT_METHODS } from '../constants/financeDefaults';
import { validateTransactionAmount } from '../utils/validation';
import { AddAccountModal } from './AddAccountModal';
import { AddCategoryModal } from './AddCategoryModal';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Check,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  accounts: Account[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  customers: Customer[];
  vehicles: Vehicle[];
  onSuccess: (message: string) => void;
  onRefreshAccounts: () => Promise<Account[]>;
  onRefreshCategories: () => Promise<Category[]>;
  onShowToast: (message: string) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'IN',
  accounts,
  incomeCategories,
  expenseCategories,
  customers,
  vehicles,
  onSuccess,
  onRefreshAccounts,
  onRefreshCategories,
  onShowToast,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);

  // Asia/Karachi current date & time defaults
  const getKarachiDate = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  };
  const getKarachiTime = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Karachi',
    }).format(new Date());
    return parts;
  };

  const [date, setDate] = useState<string>(getKarachiDate());
  const [time, setTime] = useState<string>(getKarachiTime());
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  
  // Selected Account IDs (primary source of truth)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');

  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [customer, setCustomer] = useState<string>('');
  const [vehicle, setVehicle] = useState<string>('');
  const [payee, setPayee] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Add Modals State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalTarget, setAccountModalTarget] = useState<'account' | 'toAccount'>('account');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Track previous open state to avoid resetting form fields on account/category re-fetch
  const prevIsOpenRef = useRef(false);

  // Helper to reliably find an account by ID, code, or name
  const findAccount = (identifier: string): Account | undefined => {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    return accounts.find(
      (a) =>
        (a.id && a.id.trim().toLowerCase() === clean) ||
        (a.name && a.name.trim().toLowerCase() === clean) ||
        (a.code && a.code.trim().toLowerCase() === clean)
    );
  };

  // Real-time amount validation memo (Section A)
  const amountValidation = useMemo(() => {
    return validateTransactionAmount(amount);
  }, [amount]);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Modal just opened: initialize fields
      setType(initialType);
      setDate(getKarachiDate());
      setTime(getKarachiTime());
      setAmount('');
      setReference('');
      setDescription('');
      setCustomer('');
      setVehicle('');
      setPayee('');
      setErrorMessage(null);

      // Default selected account ID
      if (accounts.length > 0) {
        const firstAcc = accounts[0].id || accounts[0].name;
        setSelectedAccountId(firstAcc);
        if (accounts.length > 1) {
          const secondAcc = accounts[1].id || accounts[1].name;
          setToAccountId(secondAcc);
        } else {
          setToAccountId('');
        }
      }

      // Default category
      if (initialType === 'IN' && incomeCategories.length > 0) {
        setCategory(incomeCategories[0].name);
      } else if (initialType === 'OUT' && expenseCategories.length > 0) {
        setCategory(expenseCategories[0].name);
      } else {
        setCategory('');
      }
    } else if (isOpen && prevIsOpenRef.current) {
      // Modal is already open and accounts list updated:
      if (!selectedAccountId && accounts.length > 0) {
        setSelectedAccountId(accounts[0].id || accounts[0].name);
      }
      if (!toAccountId && accounts.length > 1) {
        const candidate = accounts.find(
          (a) => (a.id || a.name) !== selectedAccountId
        );
        setToAccountId(candidate ? (candidate.id || candidate.name) : accounts[1].id || accounts[1].name);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialType, accounts, incomeCategories, expenseCategories]);

  // Adjust default category and destination accounts when type tab changes
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setErrorMessage(null);
    if (newType === 'IN') {
      setCategory(incomeCategories[0]?.name || '');
    } else if (newType === 'OUT') {
      setCategory(expenseCategories[0]?.name || '');
    } else if (newType === 'TRANSFER') {
      setCategory('Transfer');
      // Ensure source and destination accounts are distinct and populated
      if (accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accounts[0].id || accounts[0].name);
      }
      const curSrc = selectedAccountId || (accounts[0] ? (accounts[0].id || accounts[0].name) : '');
      const validDest = accounts.find((a) => (a.id || a.name) !== curSrc);
      if (validDest && (!toAccountId || toAccountId === curSrc)) {
        setToAccountId(validDest.id || validDest.name);
      }
    }
  };

  const handleAccountSelectChange = (
    val: string,
    target: 'account' | 'toAccount' = 'account'
  ) => {
    if (val === '__ADD_NEW_ACCOUNT__') {
      setAccountModalTarget(target);
      setIsAccountModalOpen(true);
    } else {
      if (target === 'account') {
        setSelectedAccountId(val);
        // If transfer and destination is now equal to source, auto-switch destination if possible
        if (type === 'TRANSFER' && toAccountId === val) {
          const alternate = accounts.find((a) => (a.id || a.name) !== val);
          if (alternate) {
            setToAccountId(alternate.id || alternate.name);
          }
        }
      } else {
        setToAccountId(val);
      }
    }
  };

  const handleCategorySelectChange = (val: string) => {
    if (val === '__ADD_NEW_CATEGORY__') {
      setIsCategoryModalOpen(true);
    } else {
      setCategory(val);
    }
  };

  // Called when AddAccountModal saves successfully
  const handleAccountCreated = async (newAccountInfo: { id: string; name: string }) => {
    try {
      // 1. Fetch fresh accounts from Google Sheets
      const refreshedAccounts = await onRefreshAccounts();

      // 2. Identify the newly created account by ID or name
      const matchedAccount = refreshedAccounts.find(
        (a) =>
          (newAccountInfo.id && a.id === newAccountInfo.id) ||
          (a.name && a.name.trim().toLowerCase() === newAccountInfo.name.trim().toLowerCase())
      );

      const targetId = matchedAccount?.id || newAccountInfo.id || newAccountInfo.name;

      // 3. Auto-select in the dropdown that triggered it
      if (accountModalTarget === 'account') {
        setSelectedAccountId(targetId);
      } else {
        setToAccountId(targetId);
      }

      onShowToast('Account added successfully.');
    } catch (err: any) {
      console.error('Error refreshing accounts:', err);
    }
  };

  // Called when AddCategoryModal saves successfully
  const handleCategoryCreated = async (newCategoryInfo: { id: string; name: string }) => {
    try {
      await onRefreshCategories();
      setCategory(newCategoryInfo.name);
      onShowToast(
        type === 'OUT' ? 'Expense category added successfully.' : 'Category added successfully.'
      );
    } catch (err: any) {
      console.error('Error refreshing categories:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Amount Validation (Section A)
    const amountCheck = validateTransactionAmount(amount);
    if (!amountCheck.isValid || !amountCheck.cleanAmount || amountCheck.cleanAmount <= 0) {
      setErrorMessage(amountCheck.error || 'Please enter an amount strictly greater than zero.');
      return;
    }

    const cleanAmount = amountCheck.cleanAmount;

    // 2. Account Resolution & Verification (Section B)
    const selectedAcc = findAccount(selectedAccountId);
    if (!selectedAcc) {
      setErrorMessage('Please select a valid account.');
      return;
    }

    let destAcc: Account | undefined = undefined;

    if (type === 'TRANSFER') {
      destAcc = findAccount(toAccountId);
      if (!destAcc) {
        setErrorMessage('Select the destination account.');
        return;
      }
      if (
        selectedAcc.id === destAcc.id ||
        selectedAcc.name.trim().toLowerCase() === destAcc.name.trim().toLowerCase()
      ) {
        setErrorMessage('From Account and To Account must be different. Cannot transfer money to the same account.');
        return;
      }
    } else {
      if (!category) {
        setErrorMessage('Please select a category.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await ApiService.createTransaction({
        date,
        time,
        type,
        amount: cleanAmount,
        category: type === 'TRANSFER' ? 'Transfer' : category,
        // Source account mapping
        account: selectedAcc.name,
        accountId: selectedAcc.id,
        accountName: selectedAcc.name,
        fromAccount: selectedAcc.name,
        fromAccountId: selectedAcc.id,
        sourceAccount: selectedAcc.name,
        sourceAccountId: selectedAcc.id,
        // Destination account mapping
        toAccount: type === 'TRANSFER' ? destAcc?.name : undefined,
        toAccountId: type === 'TRANSFER' ? destAcc?.id : undefined,
        toAccountName: type === 'TRANSFER' ? destAcc?.name : undefined,
        destinationAccount: type === 'TRANSFER' ? destAcc?.name : undefined,
        destinationAccountId: type === 'TRANSFER' ? destAcc?.id : undefined,
        transferToAccount: type === 'TRANSFER' ? destAcc?.name : undefined,
        transferToAccountId: type === 'TRANSFER' ? destAcc?.id : undefined,
        transferToAccountName: type === 'TRANSFER' ? destAcc?.name : undefined,
        destination: type === 'TRANSFER' ? destAcc?.name : undefined,
        transferTo: type === 'TRANSFER' ? destAcc?.name : undefined,
        paymentMethod,
        customer: customer || undefined,
        vehicle: vehicle || undefined,
        payee: payee || undefined,
        reference: reference || undefined,
        description: description || undefined,
      });

      onSuccess(
        type === 'IN'
          ? `Money In (PKR ${cleanAmount.toLocaleString()}) recorded successfully.`
          : type === 'OUT'
          ? `Money Out (PKR ${cleanAmount.toLocaleString()}) recorded successfully.`
          : `Transfer of PKR ${cleanAmount.toLocaleString()} from ${selectedAcc.name} to ${destAcc?.name} recorded.`
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Transaction could not be saved to backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-slideUp">
          {/* Header with Type Selector */}
          <div className="px-5 pt-4 pb-3 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-100 text-sm">Add Financial Record</h3>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Segmented Buttons */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => handleTypeChange('IN')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                  type === 'IN'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Money In</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('OUT')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                  type === 'OUT'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Money Out</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('TRANSFER')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                  type === 'TRANSFER'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Transfer</span>
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-sm">
            {errorMessage && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Amount Input - Strict Validation (Section A) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Amount (PKR) <span className="text-amber-400">*</span>
                </label>
                {/* Live validation message directly beside the amount field */}
                {amount.trim() === '' ? (
                  <span className="text-[11px] text-slate-400 font-medium">Must be &gt; 0</span>
                ) : amountValidation.isValid ? (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Valid Amount (PKR {amountValidation.cleanAmount?.toLocaleString()})</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{amountValidation.error}</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  PKR
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[-+eE]/g, '');
                    setAmount(val);
                  }}
                  placeholder="0"
                  className={`w-full pl-15 pr-4 py-2.5 bg-slate-950 border rounded-lg text-lg font-bold text-slate-100 focus:outline-none placeholder:text-slate-600 transition-colors ${
                    amount.trim() !== '' && !amountValidation.isValid
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : amount.trim() !== '' && amountValidation.isValid
                      ? 'border-emerald-600 focus:border-emerald-500'
                      : 'border-slate-700 focus:border-amber-500'
                  }`}
                />
              </div>
              {amount.trim() !== '' && !amountValidation.isValid && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{amountValidation.error}</span>
                </p>
              )}
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Time</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Category with Quick Add Option */}
            {type !== 'TRANSFER' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    {type === 'OUT' ? 'Expense Category' : 'Category'} <span className="text-amber-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>{type === 'OUT' ? 'Add Expense Category' : 'Add Category'}</span>
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => handleCategorySelectChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">
                    {type === 'OUT' ? 'Select Expense Category...' : 'Select Category...'}
                  </option>
                  {(type === 'IN' ? incomeCategories : expenseCategories).map((c, idx) => (
                    <option
                      key={c.id ? `modal-cat-${c.id}-${idx}` : `modal-cat-${c.name}-${idx}`}
                      value={c.name}
                    >
                      {c.code ? `${c.code} · ${c.name}` : c.name}
                    </option>
                  ))}
                  <option disabled value="">
                    ────────────────────
                  </option>
                  <option
                    value="__ADD_NEW_CATEGORY__"
                    className="text-amber-400 font-bold bg-slate-900"
                  >
                    {type === 'OUT' ? '+ Add Expense Category' : '+ Add Income Category'}
                  </option>
                </select>
              </div>
            )}

            {/* Accounts Section with Quick Add Option */}
            {type === 'TRANSFER' ? (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                {/* 3. Transfer -> From Account */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">
                      From Account <span className="text-amber-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountModalTarget('account');
                        setIsAccountModalOpen(true);
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Add</span>
                    </button>
                  </div>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => handleAccountSelectChange(e.target.value, 'account')}
                    required
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Account...</option>
                    {accounts.map((a, idx) => (
                      <option
                        key={a.id ? `from-acc-${a.id}-${idx}` : `from-acc-${a.name}-${idx}`}
                        value={a.id || a.name}
                      >
                        {a.name}
                      </option>
                    ))}
                    <option disabled value="">
                      ──────────────
                    </option>
                    <option value="__ADD_NEW_ACCOUNT__" className="text-amber-400 font-bold bg-slate-900">
                      + Add New Account
                    </option>
                  </select>
                </div>

                {/* 4. Transfer -> To Account */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">
                      To Account <span className="text-amber-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountModalTarget('toAccount');
                        setIsAccountModalOpen(true);
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Add</span>
                    </button>
                  </div>
                  <select
                    value={toAccountId}
                    onChange={(e) => handleAccountSelectChange(e.target.value, 'toAccount')}
                    required
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Destination...</option>
                    {accounts.map((a, idx) => (
                      <option
                        key={a.id ? `to-acc-${a.id}-${idx}` : `to-acc-${a.name}-${idx}`}
                        value={a.id || a.name}
                      >
                        {a.name}
                      </option>
                    ))}
                    <option disabled value="">
                      ──────────────
                    </option>
                    <option value="__ADD_NEW_ACCOUNT__" className="text-amber-400 font-bold bg-slate-900">
                      + Add New Account
                    </option>
                  </select>
                </div>

                {selectedAccountId && toAccountId && findAccount(selectedAccountId)?.name.toLowerCase() === findAccount(toAccountId)?.name.toLowerCase() && (
                  <div className="col-span-2 p-2 bg-rose-950/70 border border-rose-800 rounded-lg text-rose-300 text-[11px] flex items-center gap-1.5 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>From and To accounts cannot be the same. Please select a different destination.</span>
                  </div>
                )}

                <div className="col-span-2 text-[11px] text-indigo-300/80">
                  Transfers move money between workshop accounts without affecting Net Cash Flow.
                </div>
              </div>
            ) : (
              /* 1. Money In -> Account & 2. Money Out -> Account */
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    Account <span className="text-amber-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountModalTarget('account');
                      setIsAccountModalOpen(true);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>Add New Account</span>
                  </button>
                </div>
                <select
                  value={selectedAccountId}
                  onChange={(e) => handleAccountSelectChange(e.target.value, 'account')}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Account...</option>
                  {accounts.map((a, idx) => (
                    <option
                      key={a.id ? `modal-acc-${a.id}-${idx}` : `modal-acc-${a.name}-${idx}`}
                      value={a.id || a.name}
                    >
                      {a.name}
                    </option>
                  ))}
                  <option disabled value="">
                    ────────────────────
                  </option>
                  <option
                    value="__ADD_NEW_ACCOUNT__"
                    className="text-amber-400 font-bold bg-slate-900"
                  >
                    + Add New Account
                  </option>
                </select>
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {PAYMENT_METHODS.map((pm, idx) => (
                  <option key={`pm-${pm}-${idx}`} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            {/* Payee for Money Out */}
            {type === 'OUT' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Payee / Vendor (Optional)</label>
                <input
                  type="text"
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  placeholder="e.g. Parts Supplier, Landlord, Staff"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Customer & Vehicle (Optional for Money In) */}
            {type === 'IN' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Customer (Optional)</label>
                  {customers.length > 0 ? (
                    <select
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Select customer...</option>
                      {customers.map((c, idx) => (
                        <option
                          key={c.id ? `modal-cust-${c.id}-${idx}` : `modal-cust-${c.name}-${idx}`}
                          value={c.name}
                        >
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      placeholder="Customer Name"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Vehicle (Optional)</label>
                  {vehicles.length > 0 ? (
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Select vehicle...</option>
                      {vehicles.map((v, idx) => (
                        <option
                          key={v.id ? `modal-veh-${v.id}-${idx}` : `modal-veh-${v.registrationNumber}-${idx}`}
                          value={v.registrationNumber}
                        >
                          {v.registrationNumber} {v.make ? `(${v.make})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      placeholder="e.g. LEA-1234"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Reference & Description */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Reference / Slip # (Optional)</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. INV-104, TID-9821, Cash Memo"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Description / Notes (Optional)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Workshop job notes or details..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !amountValidation.isValid ||
                  (type === 'TRANSFER' &&
                    (!toAccountId ||
                      findAccount(selectedAccountId)?.name.trim().toLowerCase() ===
                        findAccount(toAccountId)?.name.trim().toLowerCase()))
                }
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 ${
                  type === 'IN'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : type === 'OUT'
                    ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/20'
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Recording Transaction in Sheets...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>
                      {type === 'IN'
                        ? 'Record Money In'
                        : type === 'OUT'
                        ? 'Record Money Out'
                        : 'Record Account Transfer'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded Reusable Quick Add Modals */}
      <AddAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        existingAccounts={accounts}
        onSuccess={handleAccountCreated}
      />

      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categoryType={type === 'OUT' ? 'EXPENSE' : 'INCOME'}
        existingCategories={type === 'OUT' ? expenseCategories : incomeCategories}
        onSuccess={handleCategoryCreated}
      />
    </>
  );
};
