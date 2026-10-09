import React, { useState } from 'react';
import { User } from '../types/finance';
import { AuthService } from '../services/authService';
import {
  Wrench,
  Lock,
  User as UserIcon,
  KeyRound,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Please enter your username.');
      return;
    }
    if (!pin.trim()) {
      setErrorMessage('Please enter your PIN or password.');
      return;
    }

    try {
      setIsLoading(true);
      const user = await AuthService.login(username, pin);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDefaultAdmin = () => {
    setUsername('admin');
    setPin('1234');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-sm space-y-6 animate-fadeIn">
        {/* Branding & Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 items-center justify-center text-amber-400 shadow-xl shadow-amber-500/5 mb-1">
            <Wrench className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-100 uppercase">
              SATTAR AUTO
            </h1>
            <p className="text-xs text-amber-400 font-semibold tracking-wide uppercase mt-0.5">
              Mobile & Electrical Services
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Workshop Finance & Cash Flow System
            </p>
          </div>
        </div>

        {/* Security Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                Authorized Access
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Secure
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-2.5 animate-slideDown">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Username / User ID
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            {/* PIN / Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Security PIN / Password
                </label>
                <span className="text-[10px] text-slate-500">4-digit PIN</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono tracking-widest text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock Finance System</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Admin Credential Assistant for Fast Access */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={fillDefaultAdmin}
              className="w-full py-2 px-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 hover:text-amber-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Use Default Administrator (admin / 1234)</span>
            </button>
          </div>
        </div>

        {/* Protection Notice */}
        <p className="text-[11px] text-center text-slate-500 leading-relaxed px-4">
          Financial records and cash flows are protected. Login is required before accessing workshop accounts.
        </p>
      </div>
    </div>
  );
};
