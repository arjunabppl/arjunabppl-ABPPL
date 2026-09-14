import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { ShieldCheck, Lock, ArrowRight, Layers, User, KeyRound, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !password.trim()) {
      setErrorMessage('Please enter both your User ID / Email and Password.');
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await login(loginId.trim(), password.trim());
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Invalid User ID or Password. Please check your credentials or contact the Administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900">
        
        {/* Left Hero Panel */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-950/50">
                A
              </div>
              <div>
                <h1 className="text-xl font-black tracking-wider text-white">ABPPL</h1>
                <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Enterprise ERP Suite</p>
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-white leading-snug mb-3">
              Paper Wholesaler & Distributor Management
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Authorized access portal for Paper & Board inventory control, GSM/Ream specifications, GST sales & purchase invoicing, order tracking, and financial ledgers.
            </p>

            <div className="space-y-3">
              <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Strict Role-Based Security: Admin, Operations, Sales, Warehouse, Accounts & Portals</span>
              </div>
              <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                <Layers className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Paper Grade Master: Kraft, Art Paper, Duplex Board, Maplitho & Copier</span>
              </div>
              <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>GST Invoicing, Order Pendency, Godown Stock & Ledgers</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-slate-800/80 mt-6">
            <div className="flex items-start space-x-2.5 text-[11px] text-emerald-300/90 bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/50">
              <Shield className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>
                <strong>Confidential & Secure:</strong> All user credentials are provided directly by the Owner / Administrator. Unauthorized access attempts are restricted.
              </span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-6 sm:p-10 flex flex-col justify-center bg-slate-900/60">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Account Sign In</span>
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-wider">
                Protected Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Enter your assigned User ID / Email and Password
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 bg-rose-950/80 border border-rose-600 text-rose-300 text-xs p-3.5 rounded-xl font-medium flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">{errorMessage}</p>
                <p className="text-[11px] text-rose-300/70 mt-1">
                  If you forgot your login details or need access, please contact your System Administrator.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                User ID / Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={loginId}
                  onChange={e => setLoginId(e.target.value)}
                  placeholder="Enter your User ID or Email"
                  className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium placeholder:text-slate-500"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 rounded-xl pl-9 pr-10 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono placeholder:text-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold py-3 rounded-xl transition shadow-lg shadow-emerald-950 flex items-center justify-center space-x-2 mt-4 cursor-pointer"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In to ABPPL ERP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Security Notice */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Protected by ABPPL Enterprise Security. Only active accounts configured by the Administrator can log in.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

