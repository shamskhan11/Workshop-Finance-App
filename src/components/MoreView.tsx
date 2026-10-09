import React from 'react';
import { Account, BackendHealth, Category } from '../types/finance';
import {
  Wrench,
  Server,
  Layers,
  Tag,
  ExternalLink,
  ShieldCheck,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react';

interface MoreViewProps {
  health: BackendHealth | null;
  accounts: Account[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  onOpenBackendModal: () => void;
}

export const MoreView: React.FC<MoreViewProps> = ({
  health,
  accounts,
  incomeCategories,
  expenseCategories,
  onOpenBackendModal,
}) => {
  return (
    <div className="space-y-4 pb-12">
      {/* Business Header Card */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-sm">
              SATTAR AUTO MOBILE & ELECTRICAL SERVICES
            </h2>
            <p className="text-xs text-slate-400">Workshop Financial Operations Management</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Base Currency</span>
            <span className="font-bold text-slate-200">PKR (Pakistani Rupee)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Operational Timezone</span>
            <span className="font-bold text-slate-200">Asia/Karachi</span>
          </div>
        </div>
      </div>

      {/* Backend & Database Health Summary */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
              Google Sheets Backend
            </span>
          </div>
          <button
            onClick={onOpenBackendModal}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium underline"
          >
            Diagnostics & Settings
          </button>
        </div>

        <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
          <p>
            Connected to deployed Google Apps Script Web App API serving Google Sheets as the single
            source of truth for Sattar Auto.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>8 Mandatory Database Sheets configured</span>
          </div>
        </div>
      </div>

      {/* Workshop Accounts */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Workshop Accounts ({accounts.length})</span>
        </div>

        <div className="space-y-1.5 text-xs">
          {accounts.map((acc, idx) => (
            <div
              key={acc.id ? `more-acc-${acc.id}-${idx}` : `more-acc-${acc.name}-${idx}`}
              className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between"
            >
              <div>
                <span className="font-medium text-slate-200">{acc.name}</span>
                <span className="text-[11px] text-slate-400 ml-2 font-mono">
                  {acc.code || acc.id}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">{acc.type || 'Standard'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Summary */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider">
          <Tag className="w-4 h-4 text-amber-400" />
          <span>Category Catalog</span>
        </div>

        <div className="space-y-3 text-xs">
          {/* Income Categories */}
          <div>
            <div className="text-[11px] font-semibold text-emerald-400 mb-1.5">
              Income Categories ({incomeCategories.length})
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {incomeCategories.map((c, idx) => (
                <div
                  key={c.id ? `more-inc-${c.id}-${idx}` : `more-inc-${c.name}-${idx}`}
                  className="p-1.5 bg-slate-950/50 border border-slate-800/60 rounded text-[11px] text-slate-300 truncate"
                >
                  <span className="font-mono text-slate-500 mr-1">{c.code}</span>
                  {c.name}
                </div>
              ))}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] font-semibold text-rose-400 mb-1.5">
              Expense Categories ({expenseCategories.length})
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
              {expenseCategories.map((c, idx) => (
                <div
                  key={c.id ? `more-exp-${c.id}-${idx}` : `more-exp-${c.name}-${idx}`}
                  className="p-1.5 bg-slate-950/50 border border-slate-800/60 rounded text-[11px] text-slate-300 truncate"
                >
                  <span className="font-mono text-slate-500 mr-1">{c.code}</span>
                  {c.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
