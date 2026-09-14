import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Customer, LedgerEntry } from '../types/index.js';
import { formatCurrency } from '../utils/paperMath.js';
import {
  Users, Plus, Search, Edit3, Trash2, FileText, Phone, MapPin,
  X, CheckCircle, AlertCircle, Building, Wallet, ArrowLeft,
  Save, ShieldCheck, Mail, CreditCard, Landmark, Check, FileSpreadsheet, Printer
} from 'lucide-react';
import { exportToPdf, exportToExcel, ColumnDefinition, SummaryStat } from '../utils/exportUtils.js';

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Big-screen view states
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'LEDGER'>('LIST');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    companyName: '',
    contactPerson: '',
    gstin: '',
    pan: '',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    creditLimit: 500000,
    paymentTerms: 'Net 30 Days',
    openingBalance: 0,
    balanceType: 'RECEIVABLE',
    bankName: '',
    bankAccountNo: '',
    bankIfsc: '',
    bankBranch: '',
    notes: '',
    status: 'ACTIVE'
  });

  const loadCustomers = async () => {
    try {
      const list = await api.getCustomers();
      setCustomers(list);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      companyName: '',
      contactPerson: '',
      gstin: '',
      pan: '',
      phone: '',
      altPhone: '',
      email: '',
      address: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      creditLimit: 500000,
      paymentTerms: 'Net 30 Days',
      openingBalance: 0,
      balanceType: 'RECEIVABLE',
      bankName: '',
      bankAccountNo: '',
      bankIfsc: '',
      bankBranch: '',
      notes: '',
      status: 'ACTIVE'
    });
    setViewMode('FORM');
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData(c);
    setViewMode('FORM');
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData);
      } else {
        await api.createCustomer(formData);
      }
      setViewMode('LIST');
      loadCustomers();
    } catch (err) {
      console.error('Failed to save customer:', err);
      alert('Failed to save customer record. Please check inputs.');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (confirm('Are you sure you want to deactivate or remove this customer?')) {
      await api.deleteCustomer(id);
      loadCustomers();
    }
  };

  const handleOpenLedger = async (c: Customer) => {
    setLedgerCustomer(c);
    setViewMode('LEDGER');
    setLoadingLedger(true);
    try {
      const entries = await api.getCustomerLedger(c.id);
      setLedgerEntries(entries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const filteredCustomers = (customers || []).filter(c => {
    const q = (searchTerm || '').toLowerCase();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.companyName || '').toLowerCase().includes(q) ||
      (c.gstin && (c.gstin || '').toLowerCase().includes(q)) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(searchTerm))
    );
  });

  const handleExportCustomersPdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Customer / Company', dataKey: 'companyName', align: 'left', format: (v, r) => v || r.name },
      { header: 'Contact Person', dataKey: 'contactPerson', align: 'left' },
      { header: 'Phone', dataKey: 'phone', align: 'center' },
      { header: 'Location', dataKey: 'city', align: 'left', format: (v, r) => `${v}, ${r.state}` },
      { header: 'GSTIN', dataKey: 'gstin', align: 'center', format: v => v || 'URP' },
      { header: 'Credit Limit (₹)', dataKey: 'creditLimit', align: 'right', format: v => formatCurrency(v || 0) },
      { header: 'Outstanding (₹)', dataKey: 'outstandingBalance', align: 'right', format: v => formatCurrency(v || 0) }
    ];

    const totalCredit = filteredCustomers.reduce((s, c) => s + (c.creditLimit || 0), 0);
    const totalOut = filteredCustomers.reduce((s, c) => s + (c.outstandingBalance || 0), 0);

    exportToPdf({
      title: 'Customer Master Directory & Credit Ledger',
      subtitle: `Total Registered Customers: ${filteredCustomers.length}`,
      fileName: `Customer_Directory_${new Date().toISOString().split('T')[0]}`,
      summaryStats: [
        { label: 'Total Buyers', value: filteredCustomers.length },
        { label: 'Sanctioned Credit', value: formatCurrency(totalCredit) },
        { label: 'Total Outstandings', value: formatCurrency(totalOut) }
      ],
      columns,
      data: filteredCustomers,
      orientation: 'landscape'
    });
  };

  const handleExportCustomersExcel = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Customer Name', dataKey: 'name' },
      { header: 'Company Name', dataKey: 'companyName', width: 25 },
      { header: 'Contact Person', dataKey: 'contactPerson' },
      { header: 'Phone', dataKey: 'phone' },
      { header: 'Email', dataKey: 'email' },
      { header: 'City', dataKey: 'city' },
      { header: 'State', dataKey: 'state' },
      { header: 'GSTIN', dataKey: 'gstin', format: v => v || 'URP' },
      { header: 'PAN', dataKey: 'pan', format: v => v || 'N/A' },
      { header: 'Payment Terms', dataKey: 'paymentTerms' },
      { header: 'Credit Limit (₹)', dataKey: 'creditLimit' },
      { header: 'Outstanding Dues (₹)', dataKey: 'outstandingBalance' }
    ];

    const totalCredit = filteredCustomers.reduce((s, c) => s + (c.creditLimit || 0), 0);
    const totalOut = filteredCustomers.reduce((s, c) => s + (c.outstandingBalance || 0), 0);

    exportToExcel({
      fileName: `Customer_Master_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Customers',
      title: 'Customer Master Registry',
      subtitle: 'Amriteshwar Balaji Paper Pvt. Ltd. - Master Data',
      columns,
      data: filteredCustomers,
      totalsRow: {
        name: 'TOTAL',
        creditLimit: totalCredit,
        outstandingBalance: totalOut
      }
    });
  };

  const handleExportLedgerPdf = () => {
    if (!ledgerCustomer) return;

    const columns: ColumnDefinition[] = [
      { header: 'Date', dataKey: 'date', align: 'center' },
      { header: 'Ref No', dataKey: 'referenceNo', align: 'center' },
      { header: 'Particulars', dataKey: 'particulars', align: 'left' },
      { header: 'Debit (₹)', dataKey: 'debit', align: 'right', format: v => v ? formatCurrency(v) : '-' },
      { header: 'Credit (₹)', dataKey: 'credit', align: 'right', format: v => v ? formatCurrency(v) : '-' },
      { header: 'Balance (₹)', dataKey: 'runningBalance', align: 'right', format: v => formatCurrency(v) }
    ];

    exportToPdf({
      title: `Account Statement / Ledger - ${ledgerCustomer.companyName || ledgerCustomer.name}`,
      subtitle: `GSTIN: ${ledgerCustomer.gstin || 'URP'} | Phone: ${ledgerCustomer.phone} | Credit Limit: ${formatCurrency(ledgerCustomer.creditLimit)}`,
      fileName: `Ledger_${(ledgerCustomer.companyName || ledgerCustomer.name).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
      summaryStats: [
        { label: 'Current Outstanding', value: formatCurrency(ledgerCustomer.outstandingBalance) },
        { label: 'Sanctioned Credit', value: formatCurrency(ledgerCustomer.creditLimit) },
        { label: 'Transactions', value: ledgerEntries.length }
      ],
      columns,
      data: ledgerEntries,
      orientation: 'portrait'
    });
  };

  const handleExportLedgerExcel = () => {
    if (!ledgerCustomer) return;

    const columns: ColumnDefinition[] = [
      { header: 'Date', dataKey: 'date' },
      { header: 'Reference No', dataKey: 'referenceNo' },
      { header: 'Particulars', dataKey: 'particulars', width: 35 },
      { header: 'Debit (₹)', dataKey: 'debit' },
      { header: 'Credit (₹)', dataKey: 'credit' },
      { header: 'Running Balance (₹)', dataKey: 'runningBalance' }
    ];

    exportToExcel({
      fileName: `Customer_Ledger_${(ledgerCustomer.companyName || ledgerCustomer.name).replace(/\s+/g, '_')}`,
      sheetName: 'Ledger Statement',
      title: `Customer Statement of Account - ${ledgerCustomer.companyName || ledgerCustomer.name}`,
      subtitle: `GSTIN: ${ledgerCustomer.gstin || 'URP'} | Current Balance: ${formatCurrency(ledgerCustomer.outstandingBalance)}`,
      columns,
      data: ledgerEntries
    });
  };

  // --------------------------------------------------------------------------
  // BIG SCREEN VIEW: ADD / EDIT CUSTOMER
  // --------------------------------------------------------------------------
  if (viewMode === 'FORM') {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode('LIST')}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center justify-center"
              title="Back to Customers List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Building className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {editingCustomer ? 'Edit Customer Profile (Big Screen)' : 'New Customer Master Entry (Big Screen)'}
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete account master profile, GSTIN tax credentials, address routing, credit terms and bank details
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
            >
              Cancel & Exit
            </button>
            <button
              type="button"
              onClick={(e) => {
                const form = document.getElementById('customer-big-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>{editingCustomer ? 'Update Customer' : 'Save Customer Master'}</span>
            </button>
          </div>
        </div>

        {/* Big Screen Multi-Section Form */}
        <form id="customer-big-form" onSubmit={handleSaveCustomer} className="space-y-6">
          
          {/* Section 1: Company & GST Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-sm text-slate-900">1. Company & Statutory GST Profile</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Firm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Printpack Solutions Pvt Ltd"
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Person Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anil Gupta (Procurement Head)"
                  value={formData.contactPerson || formData.name}
                  onChange={e => setFormData({ ...formData, contactPerson: e.target.value, name: formData.companyName ? formData.companyName : e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">GSTIN Number</label>
                <input
                  type="text"
                  placeholder="27AABCU9603R1ZM"
                  value={formData.gstin}
                  onChange={e => {
                    const gstin = e.target.value.toUpperCase();
                    const pan = gstin.length >= 12 ? gstin.slice(2, 12) : formData.pan;
                    setFormData({ ...formData, gstin, pan });
                  }}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">PAN Number</label>
                <input
                  type="text"
                  placeholder="AABCU9603R"
                  value={formData.pan || ''}
                  onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98200 12345"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alternate Phone / Landline</label>
                <input
                  type="text"
                  placeholder="022-28711223"
                  value={formData.altPhone || ''}
                  onChange={e => setFormData({ ...formData, altPhone: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="font-bold text-slate-700 block mb-1">Email Address for Invoices & Statements</label>
                <input
                  type="email"
                  placeholder="accounts@apexprintpack.com, billing@apexprintpack.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address & Location Routing */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-900">2. Billing & Factory / Delivery Address</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-3">
                <label className="font-bold text-slate-700 block mb-1">Street / Industrial Estate Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Plot 42, Sector 8, Industrial Area, Near Highway"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">City *</label>
                <input
                  type="text"
                  required
                  placeholder="Mumbai"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">State *</label>
                <input
                  type="text"
                  required
                  placeholder="Maharashtra"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pincode</label>
                <input
                  type="text"
                  placeholder="400063"
                  value={formData.pincode || ''}
                  onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Credit Terms, Balance & Banking */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-sm text-slate-900">3. Credit Terms, Opening Balance & Bank Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  value={formData.creditLimit}
                  onChange={e => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-emerald-900 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Standard Payment Terms</label>
                <select
                  value={formData.paymentTerms || 'Net 30 Days'}
                  onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Immediate / COD">Immediate / Cash on Delivery (COD)</option>
                  <option value="Advance Payment">100% Advance Payment</option>
                  <option value="Net 7 Days">Net 7 Days</option>
                  <option value="Net 15 Days">Net 15 Days</option>
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 45 Days">Net 45 Days</option>
                  <option value="Net 60 Days">Net 60 Days</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Status</label>
                <select
                  value={formData.status || 'ACTIVE'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ACTIVE">ACTIVE (Permit Sales Orders & Invoices)</option>
                  <option value="INACTIVE">INACTIVE / BLOCKED</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  value={formData.openingBalance || 0}
                  onChange={e => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Balance Type</label>
                <select
                  value={formData.balanceType || 'RECEIVABLE'}
                  onChange={e => setFormData({ ...formData, balanceType: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="RECEIVABLE">RECEIVABLE (Customer owes us)</option>
                  <option value="PAYABLE">PAYABLE (We owe customer / advance)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank / ICICI Bank"
                  value={formData.bankName || ''}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Account Number</label>
                <input
                  type="text"
                  placeholder="50200012345678"
                  value={formData.bankAccountNo || ''}
                  onChange={e => setFormData({ ...formData, bankAccountNo: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank IFSC Code</label>
                <input
                  type="text"
                  placeholder="HDFC0000123"
                  value={formData.bankIfsc || ''}
                  onChange={e => setFormData({ ...formData, bankIfsc: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Internal Notes / Delivery Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Preferred transporter: Vijay Roadways. Unload in morning."
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-6 py-3 rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl text-xs shadow-lg transition"
            >
              <Check className="w-4 h-4" />
              <span>{editingCustomer ? 'Update Customer Record' : 'Save Customer Master'}</span>
            </button>
          </div>

        </form>

      </div>
    );
  }

  // --------------------------------------------------------------------------
  // BIG SCREEN VIEW: CUSTOMER ACCOUNT LEDGER STATEMENT
  // --------------------------------------------------------------------------
  if (viewMode === 'LEDGER' && ledgerCustomer) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode('LIST')}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center justify-center"
              title="Back to Customers List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {ledgerCustomer.companyName || ledgerCustomer.name} - Account Ledger Statement
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological ledger statement, invoice debits, payment credits, and running balance calculation
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={handleExportLedgerPdf}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={handleExportLedgerExcel}
              className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Ledger</span>
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Back to List
            </button>
          </div>
        </div>

        {/* Customer KPI Header */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Credit Limit</span>
            <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(ledgerCustomer.creditLimit)}</div>
            <p className="text-[10px] text-slate-500 mt-1">Terms: {ledgerCustomer.paymentTerms}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Current Net Outstanding</span>
            <div className={`text-xl font-black mt-1 ${ledgerCustomer.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {formatCurrency(ledgerCustomer.outstandingBalance)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Receivable balance</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">GSTIN & PAN</span>
            <div className="text-sm font-mono font-bold text-slate-900 mt-1">{ledgerCustomer.gstin || 'URP'}</div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">{ledgerCustomer.pan || 'PAN N/A'}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Location & Contact</span>
            <div className="text-xs font-bold text-slate-900 mt-1 truncate">{ledgerCustomer.city}, {ledgerCustomer.state}</div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">{ledgerCustomer.phone}</p>
          </div>
        </div>

        {/* Ledger Entries Big Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-bold text-slate-800">
              Transaction History ({ledgerEntries.length} Transactions)
            </span>
            <span className="text-[11px] text-slate-500">
              Debits: Invoices / Goods Sent &bull; Credits: Cheques / NEFT / RTGS
            </span>
          </div>

          {loadingLedger ? (
            <div className="p-12 text-center text-xs font-semibold text-slate-500">Fetching statement entries...</div>
          ) : ledgerEntries.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">No ledger transactions found for this customer.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Reference No</th>
                    <th className="p-3.5">Transaction Particulars</th>
                    <th className="p-3.5 text-right">Debit (₹)</th>
                    <th className="p-3.5 text-right">Credit (₹)</th>
                    <th className="p-3.5 text-right">Running Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {ledgerEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-medium text-slate-600">{entry.date}</td>
                      <td className="p-3.5 font-mono text-emerald-900 font-bold">{entry.referenceNo}</td>
                      <td className="p-3.5 text-slate-900">{entry.description}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-700">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900">
                        {formatCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    );
  }

  // --------------------------------------------------------------------------
  // BIG SCREEN VIEW: CUSTOMER LIST TABLE
  // --------------------------------------------------------------------------
  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Customer Master Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain customer profiles, GSTIN tax validation, credit limits, outstanding dues and financial ledgers on big screen
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={handleExportCustomersPdf}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportCustomersExcel}
            className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm w-max cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer (Big Screen Entry)</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Customer Name, Company, GSTIN, City, Phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total Customers: {filteredCustomers.length}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <th className="p-3.5">Customer / Firm</th>
                <th className="p-3.5">GSTIN & Contact</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5 text-right">Credit Limit</th>
                <th className="p-3.5 text-right">Outstanding Dues</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No matching customer records found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-sm">{cust.companyName || cust.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{cust.contactPerson || cust.name}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-mono text-xs text-slate-800 font-bold">{cust.gstin || 'URP'}</div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{cust.phone}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{cust.city}, {cust.state}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-medium text-slate-700">
                      {formatCurrency(cust.creditLimit)}
                    </td>
                    <td className="p-3.5 text-right">
                      <span className={`font-black ${cust.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {formatCurrency(cust.outstandingBalance)}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleOpenLedger(cust)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Big Screen Statement Ledger"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(cust)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Customer Details (Big Screen)"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(cust.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

