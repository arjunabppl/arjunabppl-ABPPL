```tsx
import React, { useState } from 'react';

import { AuthProvider, useAuth } from './context/AuthContext';

import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { PrintableInvoice } from './components/common/PrintableInvoice';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PartyManagement } from './pages/PartyManagement';
import { CustomerList } from './pages/CustomerList';
import { SupplierList } from './pages/SupplierList';
import { ProductList } from './pages/ProductList';
import { InventoryOverview } from './pages/InventoryOverview';
import { SalesList } from './pages/SalesList';
import { QuotationList } from './pages/QuotationList';
import { PurchaseManagement } from './pages/PurchaseManagement';
import { TransporterFreight } from './pages/TransporterFreight';
import { PaymentsPage } from './pages/PaymentsPage';
import { DueRemindersPage } from './pages/DueRemindersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UserManagement } from './pages/UserManagement';
import { HelpPage } from './pages/HelpPage';
import { B2BOrderManagement } from './pages/B2BOrderManagement';

import { Invoice } from './types';
import { ShieldAlert } from 'lucide-react';

type AppModule =
  | 'dashboard'
  | 'users'
  | 'parties'
  | 'customers'
  | 'outstanding'
  | 'suppliers'
  | 'products'
  | 'inventory'
  | 'orders'
  | 'b2b-orders'
  | 'sales'
  | 'invoices'
  | 'quotations'
  | 'purchases'
  | 'transporters'
  | 'payments'
  | 'dueReminders'
  | 'reports'
  | 'settings'
  | 'help';

const ADMIN_MODULES: AppModule[] = ['users', 'settings'];

const isAdminModule = (module: AppModule): boolean =>
  ADMIN_MODULES.includes(module);

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
    <div
      className="
        w-12 h-12 rounded-full
        border-4 border-emerald-500
        border-t-transparent
        animate-spin mb-5
      "
    />

    <p className="font-extrabold text-sm tracking-wider uppercase text-emerald-400">
      ABPPL ERP Engine Initializing...
    </p>

    <p className="mt-2 text-xs text-slate-500">
      Please wait while your workspace is being prepared.
    </p>
  </div>
);

const AccessDenied: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => (
  <div className="min-h-[70vh] flex items-center justify-center p-6">
    <div
      className="
        w-full max-w-lg
        bg-slate-900
        border border-slate-800
        rounded-2xl
        shadow-2xl
        p-8
        text-center
      "
    >
      <div
        className="
          w-14 h-14 mx-auto mb-5
          bg-rose-950/80
          border border-rose-600
          rounded-full
          flex items-center justify-center
          text-rose-400
        "
      >
        <ShieldAlert className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-bold text-white">
        Access Denied
      </h2>

      <p className="mt-3 text-sm text-slate-400 leading-relaxed">
        You do not have administrative privileges to access
        User Management or System Settings.
      </p>

      <button
        type="button"
        onClick={onBack}
        className="
          mt-6
          bg-emerald-600
          hover:bg-emerald-500
          text-white
          px-5 py-2.5
          rounded-lg
          text-sm
          font-bold
          transition
          shadow-md
        "
      >
        Return to Dashboard
      </button>
    </div>
  </div>
);

const MainAppContent: React.FC = () => {
  const { user, settings, loading } = useAuth();

  const [currentModule, setCurrentModule] =
    useState<AppModule>('dashboard');

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] =
    useState(false);

  const [activeInvoiceView, setActiveInvoiceView] =
    useState<Invoice | null>(null);

  const navigate = (module: string) => {
    setCurrentModule(module as AppModule);
    setIsSidebarOpenMobile(false);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Login />;
  }

  if (activeInvoiceView && settings) {
    return (
      <PrintableInvoice
        invoice={activeInvoiceView}
        settings={settings}
        onBack={() => setActiveInvoiceView(null)}
      />
    );
  }

  const renderModuleContent = () => {
    /*
     * Authorization
     *
     * Admin-only modules:
     * - User Management
     * - System Settings
     */
    if (isAdminModule(currentModule) && user.role !== 'admin') {
      return (
        <AccessDenied
          onBack={() => navigate('dashboard')}
        />
      );
    }

    switch (currentModule) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={navigate}
          />
        );

      case 'users':
        return <UserManagement />;

      case 'parties':
        return <PartyManagement />;

      case 'customers':
      case 'outstanding':
        return <CustomerList />;

      case 'suppliers':
        return <SupplierList />;

      case 'products':
        return <ProductList />;

      case 'inventory':
        return <InventoryOverview />;

      case 'orders':
      case 'b2b-orders':
      case 'sales':
        return (
          <B2BOrderManagement
            onOpenInvoiceView={setActiveInvoiceView}
          />
        );

      case 'invoices':
        return (
          <SalesList
            onOpenInvoiceView={setActiveInvoiceView}
            initialTab="invoices"
          />
        );

      case 'quotations':
        return (
          <QuotationList
            onOpenInvoiceView={setActiveInvoiceView}
          />
        );

      case 'purchases':
        return <PurchaseManagement />;

      case 'transporters':
        return <TransporterFreight />;

      case 'payments':
        return <PaymentsPage />;

      case 'dueReminders':
        return <DueRemindersPage />;

      case 'reports':
        return <ReportsPage />;

      case 'settings':
        return <SettingsPage />;

      case 'help':
        return <HelpPage />;

      default:
        return (
          <Dashboard
            onNavigate={navigate}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      <Header
        onToggleSidebar={() =>
          setIsSidebarOpenMobile((previous) => !previous)
        }
        onNavigate={navigate}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentModule={currentModule}
          onNavigate={navigate}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() =>
            setIsSidebarOpenMobile(false)
          }
        />

        <main
          className="
            flex-1
            overflow-y-auto
            min-w-0
            pb-12
            bg-slate-100
          "
        >
          {renderModuleContent()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
```
