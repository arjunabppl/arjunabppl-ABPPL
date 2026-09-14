import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  Bell, LogOut, Menu, User, ShieldCheck, FileText, Search
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigate: (module: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNavigate
}) => {
  const { user, logout, settings } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header id="abppl-app-header" className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="flex items-center justify-between px-4 py-2.5">
        
        {/* Left: Hamburger & ABPPL Branding */}
        <div className="flex items-center space-x-3">
          <button
            id="btn-sidebar-toggle"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-xl text-white shadow-sm group-hover:bg-emerald-500 transition">
              A
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-wider text-white">ABPPL</span>
                <span className="text-[10px] uppercase tracking-widest bg-emerald-950 text-emerald-400 font-semibold px-1.5 py-0.5 rounded border border-emerald-800">
                  ERP WEB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium -mt-0.5 hidden sm:block">
                {settings?.companyName || 'Paper Wholesalers & Distributors'}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search & Quick Calculator Tool */}
        <div className="hidden md:flex items-center space-x-3 max-w-md w-full">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Invoice #, Customer, Paper Grade, GSTIN..."
              className="w-full bg-slate-800 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-500"
              onClick={() => onNavigate('products')}
            />
          </div>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* User Profile Menu */}
          <div className="relative">
            <button
              id="btn-user-profile-menu"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <div className="w-7 h-7 rounded-full bg-slate-700 text-emerald-400 flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name[0] : 'U'}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-medium text-slate-200 leading-tight">{user?.name}</div>
                <div className="text-[10px] text-emerald-400 uppercase font-semibold">{user?.role}</div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-xl border border-slate-700 py-1 z-50 text-slate-200">
                <div className="px-4 py-2 border-b border-slate-700">
                  <p className="text-xs font-bold text-white">{user?.name}</p>
                  <p className="text-[11px] text-slate-400">{user?.email}</p>
                  <div className="mt-1 flex items-center space-x-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950 px-2 py-0.5 rounded w-max border border-emerald-900">
                    <ShieldCheck className="w-3 h-3" />
                    <span>ROLE: {user?.role.toUpperCase()}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onNavigate('settings');
                  }}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-slate-700 flex items-center space-x-2 transition"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Company Settings</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onNavigate('help');
                  }}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-slate-700 flex items-center space-x-2 transition"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>User Guide & Help</span>
                </button>

                <div className="border-t border-slate-700 my-1"></div>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center space-x-2 transition"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Logout Session</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
