import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Header } from './components/layout/Header.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { Login } from './pages/Login.js';
import { Dashboard } from './pages/Dashboard.js';
import { PartyManagement } from './pages/PartyManagement.js';
import { CustomerList } from './pages/CustomerList.js';
import { SupplierList } from './pages/SupplierList.js';
import { ProductList } from './pages/ProductList.js';
import { InventoryOverview } from './pages/InventoryOverview.js';
import { SalesList } from './pages/SalesList.js';
import { QuotationList } from './pages/QuotationList.js';
import { PurchaseList } from './pages/PurchaseList.js';
import { PurchaseManagement } from './pages/PurchaseManagement.js';
import { TransporterFreight } from './pages/TransporterFreight.js';
import { PaymentsPage } from './pages/PaymentsPage.js';
import { DueRemindersPage } from './pages/DueRemindersPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { UserManagement } from './pages/UserManagement.js';
import { HelpPage } from './pages/HelpPage.js';
import { B2BOrderManagement } from './pages/B2BOrderManagement.js';
import { PrintableInvoice } from './components/common/PrintableInvoice.js';
import { Invoice } from './types/index.js';
import { ShieldAlert } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, settings, loading } = useAuth();
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [activeInvoiceView, setActiveInvoiceView] = useState<Invoice | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4"></div>
        <p className="font-extrabold text-sm tracking-wider uppercase text-emerald-400">ABPPL ERP Engine Initializing...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Printable Invoice View Full Screen
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
    // Admin route protection
    if ((currentModule === 'users' || currentModule === 'settings') && user.role !== 'admin') {
      return (
        <div className="p-8 max-w-lg mx-auto my-12 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 bg-rose-950/80 border border-rose-600 rounded-full flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Access Denied</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            You do not have administrative privileges to access User Management or System Settings.
          </p>
          <button
            onClick={() => setCurrentModule('dashboard')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-extrabold transition shadow-md"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    switch (currentModule) {
      case 'dashboard':
        return <Dashboard onNavigate={(mod) => setCurrentModule(mod)} />;
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
      case 'b2b-orders':
      case 'orders':
        return <B2BOrderManagement onOpenInvoiceView={(inv) => setActiveInvoiceView(inv)} />;
      case 'sales':
        return <B2BOrderManagement onOpenInvoiceView={(inv) => setActiveInvoiceView(inv)} />;
      case 'invoices':
        return <SalesList onOpenInvoiceView={(inv) => setActiveInvoiceView(inv)} initialTab="invoices" />;
      case 'quotations':
        return <QuotationList onOpenInvoiceView={(inv) => setActiveInvoiceView(inv)} />;
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
        return <Dashboard onNavigate={(mod) => setCurrentModule(mod)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      
      {/* App Top Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
        onNavigate={(mod) => setCurrentModule(mod)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentModule={currentModule}
          onNavigate={(mod) => setCurrentModule(mod)}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto min-w-0 pb-12">
          {renderModuleContent()}
        </main>
      </div>

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
