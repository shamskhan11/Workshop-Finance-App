import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  BarChart3,
  Menu,
} from 'lucide-react';

export type TabType = 'dashboard' | 'transactions' | 'reports' | 'more';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAddModal: (defaultType?: 'IN' | 'OUT' | 'TRANSFER') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe">
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-between">
        {/* 1. Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentTab === 'dashboard'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[11px] mt-1">Dashboard</span>
        </button>

        {/* 2. Transactions */}
        <button
          onClick={() => onSelectTab('transactions')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentTab === 'transactions'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[11px] mt-1">Transactions</span>
        </button>

        {/* 3. Central Add Button */}
        <div className="flex-1 flex items-center justify-center -mt-5">
          <button
            onClick={() => onOpenAddModal()}
            title="Add Transaction (Money In, Out, or Transfer)"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center transition-transform active:scale-95 border-2 border-slate-900"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Reports */}
        <button
          onClick={() => onSelectTab('reports')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentTab === 'reports'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[11px] mt-1">Reports</span>
        </button>

        {/* 5. More */}
        <button
          onClick={() => onSelectTab('more')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            currentTab === 'more'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[11px] mt-1">More</span>
        </button>
      </div>
    </nav>
  );
};
