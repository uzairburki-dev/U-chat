import React, { useState } from 'react';
import { MessageSquare, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LoginPage = ({ onNavigateToRegister }) => {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!identifier.trim() || !password || submitting) return;

    try {
      setError('');
      setSubmitting(true);
      const res = await login(identifier.trim(), password);
      if (res?.requireVerification) {
        onNavigateToRegister(res.email, 'verify');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-brand-50/40 to-slate-200 dark:from-[#0b0f19] dark:via-slate-900 dark:to-[#0f172a] select-none">
      <div className="w-full max-w-4xl grid md:grid-cols-5 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Left Side: Brand & Visuals */}
        <div className="md:col-span-2 p-8 bg-gradient-to-br from-brand-600 via-indigo-600 to-violet-700 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-black/10 blur-2xl" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex p-3 rounded-2xl bg-white/20 backdrop-blur-md shadow-lg">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">ChatBoat</h1>
            <p className="text-xs text-brand-100 leading-relaxed">
              Ultra-fast real-time messaging, group chats, typing indicators, read receipts, and media sharing.
            </p>
          </div>

          <div className="relative z-10 py-6 space-y-2">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-xs">
              <span className="font-semibold block mb-0.5">⚡ Instant Delivery</span>
              <span className="text-[11px] text-white/80">
                Powered by Socket.IO & MongoDB with persistent state.
              </span>
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-white/70">
            © 2026 ChatBoat Live Messenger
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:col-span-3 p-8 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Welcome back
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your credentials to access your live conversations.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 animate-slide-up flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email or Username
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your email or username"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none text-slate-800 dark:text-slate-100 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none text-slate-800 dark:text-slate-100 transition-all shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Register */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigateToRegister('', 'form')}
                className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
