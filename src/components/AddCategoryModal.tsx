import React, { useState, useEffect } from 'react';
import { Category } from '../types/finance';
import { ApiService } from '../services/apiService';
import { X, Tag, AlertCircle, Loader2, Check } from 'lucide-react';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryType?: 'EXPENSE' | 'INCOME';
  existingCategories: Category[];
  onSuccess: (newCategory: { id: string; name: string }) => Promise<void> | void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryType = 'EXPENSE',
  existingCategories,
  onSuccess,
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isExpense = categoryType === 'EXPENSE';

  useEffect(() => {
    if (isOpen) {
      setCategoryName('');
      // Suggest next auto code if desired, or leave empty
      setCode('');
      setDescription('');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      setErrorMessage('Category Name is required and cannot be blank.');
      return;
    }

    // Check duplicate category name within this type
    const normalizedTargetType = isExpense ? 'OUT' : 'IN';
    const exists = existingCategories.some(
      (c) =>
        c.type === normalizedTargetType &&
        (c.name || '').trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      setErrorMessage(
        `A ${isExpense ? 'expense' : 'income'} category named "${trimmedName}" already exists.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await ApiService.addCategory({
        name: trimmedName,
        type: isExpense ? 'EXPENSE' : 'INCOME',
        code: code.trim(),
        description: description.trim(),
      });

      if (res && res.success !== false) {
        const createdId = res.id || '';
        await onSuccess({ id: createdId, name: trimmedName });
        onClose();
      } else {
        throw new Error(res?.message || 'Failed to save category to backend.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to save category to Google Sheets.');
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
            <div
              className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
                isExpense
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}
            >
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                {isExpense ? 'ADD EXPENSE CATEGORY' : 'ADD INCOME CATEGORY'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Saves to Google Sheets Categories Sheet · Type: {categoryType}
              </p>
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

          {/* Category Type Notice (Automatic) */}
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between">
            <span className="text-slate-400">Category Classification</span>
            <span
              className={`font-bold font-mono text-[11px] px-2 py-0.5 rounded ${
                isExpense ? 'bg-rose-950/80 text-rose-300' : 'bg-emerald-950/80 text-emerald-300'
              }`}
            >
              {categoryType}
            </span>
          </div>

          {/* Category Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Category Name <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder={
                isExpense ? 'e.g. Generator Fuel, AC Gas, Welding Rods' : 'e.g. Key Programming'
              }
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
            />
          </div>

          {/* Code / ID */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Code / ID (Optional)</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={isExpense ? 'e.g. EXP-024 (Auto-assigned if blank)' : 'e.g. INC-009'}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Workshop accounting purpose or classification notes..."
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
              className={`px-4 py-2 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 ${
                isExpense ? 'bg-rose-500 hover:bg-rose-400' : 'bg-emerald-500 hover:bg-emerald-400'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
