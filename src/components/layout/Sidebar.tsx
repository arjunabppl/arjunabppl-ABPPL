import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutGrid, Users, Truck, Layers, Package, ShoppingCart,
  ShoppingBag, FileSpreadsheet, Receipt, CreditCard, Clock,
  BarChart3, Settings, HelpCircle, ChevronRight, ShieldCheck,
  Building, AlertCircle, Navigation
} from 'lucide-react';

interface SidebarProps {
  currentModule: string;
  onNavigate: (module: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onNavigate,
  isOpenMobile,
  onCloseMobile
}) => {
  const { user, hasRole } = useAuth();
  const isCustomer = user?.role === 'customer';

  const navItems = [
    { id: 'dashboard', label: isCustomer ? 'Customer Portal' : 'Dashboard', icon: LayoutGrid, roles: ['admin', 'superadmin', 'manager', 'sales', 'inventory', 'accounts', 'distributor', 'customer'] },
    { id: 'orders', label: isCustomer ? 'Order Punch & Orders' : 'Order Management', icon: ShoppingBag, roles: ['admin', 'superadmin', 'manager', 'sales', 'inventory', 'accounts', 'distributor', 'customer'] },
    { id: 'users', label: 'User Management', icon: ShieldCheck, roles: ['admin', 'superadmin'] },
    { id: 'parties', label: 'Parties & Ledgers', icon: Building, roles: ['admin', 'superadmin', 'manager', 'sales', 'accounts'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'superadmin', 'manager', 'sales', 'accounts', 'distributor'] },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, roles: ['admin', 'superadmin', 'manager', 'inventory', 'accounts'] },
    { id: 'products', label: isCustomer ? 'Item Catalog (Paper Master)' : 'Paper Master', icon: Layers, roles: ['admin', 'superadmin', 'manager', 'sales', 'inventory', 'distributor', 'customer'] },
    { id: 'inventory', label: 'Stock & Inventory', icon: Package, roles: ['admin', 'superadmin', 'manager', 'inventory'] },
    { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet, roles: ['admin', 'superadmin', 'manager', 'sales'] },
    { id: 'invoices', label: isCustomer ? 'My GST Invoices' : 'GST Invoices', icon: Receipt, roles: ['admin', 'superadmin', 'manager', 'sales', 'accounts', 'customer'] },
    { id: 'purchases', label: 'Purchase & Import', icon: ShoppingCart, roles: ['admin', 'superadmin', 'manager', 'inventory', 'accounts'] },
    { id: 'transporters', label: 'Transporters & Freight', icon: Navigation, roles: ['admin', 'superadmin', 'manager', 'inventory', 'accounts'] },
    { id: 'payments', label: isCustomer ? 'My Payments & Dues' : 'Payments & Receipts', icon: CreditCard, roles: ['admin', 'superadmin', 'manager', 'accounts', 'customer'] },
    { id: 'dueReminders', label: 'Due Reminders & Aging', icon: AlertCircle, roles: ['admin', 'superadmin', 'manager', 'sales', 'accounts'] },
    { id: 'reports', label: isCustomer ? 'My Reports & Pendency' : 'Reports & Analytics', icon: BarChart3, roles: ['admin', 'superadmin', 'manager', 'accounts', 'customer'] },
    { id: 'settings', label: 'Admin Settings', icon: Settings, roles: ['admin', 'superadmin'] },
    { id: 'help', label: 'Support & Formulas', icon: HelpCircle, roles: ['admin', 'superadmin', 'manager', 'sales', 'inventory', 'accounts', 'distributor', 'customer'] }
  ];

  const handleSelect = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="abppl-app-sidebar"
        className={`fixed lg:static top-[53px] bottom-0 left-0 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col z-40 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-3 border-b border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3">
            BUSINESS MODULES
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map(item => {
            if (!hasRole(item.roles as any)) return null;
            const Icon = item.icon;
            const isActive = currentModule === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          <p className="font-semibold text-slate-400">ABPPL Web ERP v2.5</p>
          <p className="text-[10px]">Paper Wholesaler & Distributor System</p>
        </div>
      </aside>
    </>
  );
};
