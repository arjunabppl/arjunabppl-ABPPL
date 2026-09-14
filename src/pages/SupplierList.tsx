import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Supplier, LedgerEntry } from '../types/index.js';
import { formatCurrency } from '../utils/paperMath.js';
import {
  Truck, Plus, Search, Edit3, FileText, Phone, MapPin, X, FileSpreadsheet, Printer
} from 'lucide-react';
import { exportToPdf, exportToExcel, ColumnDefinition, SummaryStat } from '../utils/exportUtils.js';

export const SupplierList: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [ledgerSupplier, setLedgerSupplier] = useState<Supplier | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    companyName: '',
    gstin: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    status: 'ACTIVE'
  });

  const loadSuppliers = async () => {
    try {
      const list = await api.getSuppliers();
      setSuppliers(list);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      companyName: '',
      gstin: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: 'Maharashtra',
      status: 'ACTIVE'
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData(s);
    setShowAddModal(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, formData);
      } else {
        await api.createSupplier(formData);
      }
      setShowAddModal(false);
      loadSuppliers();
    } catch (err) {
      console.error('Failed to save supplier:', err);
    }
  };

  const handleOpenLedger = async (s: Supplier) => {
    setLedgerSupplier(s);
    setLoadingLedger(true);
    try {
      const entries = await api.getSupplierLedger(s.id);
      setLedgerEntries(entries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const filteredSuppliers = (suppliers || []).filter(s => {
    const q = (searchTerm || '').toLowerCase();
    if (!q) return true;
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.companyName || '').toLowerCase().includes(q) ||
      (s.gstin && (s.gstin || '').toLowerCase().includes(q))
    );
  });

  const handleExportSuppliersPdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Supplier / Mill', dataKey: 'companyName', align: 'left', format: (v, r) => v || r.name },
      { header: 'Contact Name', dataKey: 'name', align: 'left' },
      { header: 'Phone', dataKey: 'phone', align: 'center' },
      { header: 'Location', dataKey: 'city', align: 'left', format: (v, r) => `${v || ''}, ${r.state || ''}` },
      { header: 'GSTIN', dataKey: 'gstin', align: 'center', format: v => v || 'URP' },
      { header: 'Payable Dues (₹)', dataKey: 'outstandingBalance', align: 'right', format: v => formatCurrency(v || 0) }
    ];

    const totalPayables = filteredSuppliers.reduce((s, sup) => s + (sup.outstandingBalance || 0), 0);

    exportToPdf({
      title: 'Supplier & Paper Mill Directory',
      subtitle: `Total Active Suppliers: ${filteredSuppliers.length}`,
      fileName: `Supplier_Mill_Directory_${new Date().toISOString().split('T')[0]}`,
      summaryStats: [
        { label: 'Total Mill Vendors', value: filteredSuppliers.length },
        { label: 'Total Outstandings Payable', value: formatCurrency(totalPayables) }
      ],
      columns,
      data: filteredSuppliers,
      orientation: 'landscape'
    });
  };

  const handleExportSuppliersExcel = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Mill / Company Name', dataKey: 'companyName', width: 28 },
      { header: 'Contact Person', dataKey: 'name' },
      { header: 'Phone', dataKey: 'phone' },
      { header: 'Email', dataKey: 'email' },
      { header: 'City', dataKey: 'city' },
      { header: 'State', dataKey: 'state' },
      { header: 'GSTIN', dataKey: 'gstin', format: v => v || 'URP' },
      { header: 'Outstanding Payables (₹)', dataKey: 'outstandingBalance' }
    ];

    const totalPayables = filteredSuppliers.reduce((s, sup) => s + (sup.outstandingBalance || 0), 0);

    exportToExcel({
      fileName: `Supplier_Mill_Master_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Suppliers',
      title: 'Supplier & Paper Mill Master List',
      subtitle: 'Amriteshwar Balaji Paper Pvt. Ltd. - Procurement',
      columns,
      data: filteredSuppliers,
      totalsRow: {
        companyName: 'TOTAL',
        outstandingBalance: totalPayables
      }
    });
  };

  const handleExportSupplierLedgerPdf = () => {
    if (!ledgerSupplier) return;

    const columns: ColumnDefinition[] = [
      { header: 'Date', dataKey: 'date', align: 'center' },
      { header: 'Reference', dataKey: 'referenceNo', align: 'center' },
      { header: 'Description', dataKey: 'description', align: 'left' },
      { header: 'Debit (Paid ₹)', dataKey: 'debit', align: 'right', format: v => v ? formatCurrency(v) : '-' },
      { header: 'Credit (Purchased ₹)', dataKey: 'credit', align: 'right', format: v => v ? formatCurrency(v) : '-' },
      { header: 'Balance Payable (₹)', dataKey: 'runningBalance', align: 'right', format: v => formatCurrency(v) }
    ];

    exportToPdf({
      title: `Supplier / Mill Ledger - ${ledgerSupplier.companyName || ledgerSupplier.name}`,
      subtitle: `GSTIN: ${ledgerSupplier.gstin || 'URP'} | Phone: ${ledgerSupplier.phone || '-'} | Location: ${ledgerSupplier.city}, ${ledgerSupplier.state}`,
      fileName: `Supplier_Ledger_${(ledgerSupplier.companyName || ledgerSupplier.name).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
      summaryStats: [
        { label: 'Current Outstanding Payable', value: formatCurrency(ledgerSupplier.outstandingBalance) },
        { label: 'Total Transactions', value: ledgerEntries.length }
      ],
      columns,
      data: ledgerEntries,
      orientation: 'portrait'
    });
  };

  const handleExportSupplierLedgerExcel = () => {
    if (!ledgerSupplier) return;

    const columns: ColumnDefinition[] = [
      { header: 'Date', dataKey: 'date' },
      { header: 'Reference No', dataKey: 'referenceNo' },
      { header: 'Description', dataKey: 'description', width: 35 },
      { header: 'Debit (Paid ₹)', dataKey: 'debit' },
      { header: 'Credit (Purchased ₹)', dataKey: 'credit' },
      { header: 'Balance Payable (₹)', dataKey: 'runningBalance' }
    ];

    exportToExcel({
      fileName: `Supplier_Ledger_${(ledgerSupplier.companyName || ledgerSupplier.name).replace(/\s+/g, '_')}`,
      sheetName: 'Supplier Ledger',
      title: `Supplier Statement of Account - ${ledgerSupplier.companyName || ledgerSupplier.name}`,
      subtitle: `GSTIN: ${ledgerSupplier.gstin || 'URP'} | Current Balance: ${formatCurrency(ledgerSupplier.outstandingBalance)}`,
      columns,
      data: ledgerEntries
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Supplier & Paper Mills</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage paper manufacturing mills, distributors, purchases and accounts payable
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={handleExportSuppliersPdf}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportSuppliersExcel}
            className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm w-max cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Supplier</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Supplier Name, Mill, GSTIN..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total Suppliers: {filteredSuppliers.length}
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <th className="p-3">Paper Mill / Supplier</th>
                <th className="p-3">GSTIN & Contact</th>
                <th className="p-3">Plant Location</th>
                <th className="p-3 text-right">Payable Dues</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSuppliers.map(supp => (
                <tr key={supp.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3">
                    <div className="font-bold text-slate-900 text-sm">{supp.companyName || supp.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{supp.name}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-mono text-xs text-slate-800 font-bold">{supp.gstin || 'URP'}</div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{supp.phone}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{supp.city}, {supp.state}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right font-black text-slate-900">
                    {formatCurrency(supp.outstandingBalance)}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => handleOpenLedger(supp)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="View Purchase Ledger"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(supp)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition"
                        title="Edit Supplier Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-base">
                {editingSupplier ? 'Edit Supplier Profile' : 'Add New Paper Mill Supplier'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Company / Paper Mill</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Plant / Mill Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-lg"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Ledger Modal */}
      {ledgerSupplier && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap gap-2 justify-between items-center">
              <div>
                <h3 className="font-bold text-base">{ledgerSupplier.companyName || ledgerSupplier.name}</h3>
                <p className="text-xs text-slate-400">Supplier Ledger & Purchase Account Statement</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportSupplierLedgerPdf}
                  className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleExportSupplierLedgerExcel}
                  className="flex items-center space-x-1 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-700 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button onClick={() => setLedgerSupplier(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Total Outstanding Payable:</span>
                  <span className="font-extrabold text-slate-900 text-base">{formatCurrency(ledgerSupplier.outstandingBalance)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">GSTIN:</span>
                  <span className="font-mono font-bold text-slate-800">{ledgerSupplier.gstin || 'URP'}</span>
                </div>
              </div>

              {loadingLedger ? (
                <p className="text-xs text-center p-6 text-slate-500">Fetching supplier ledger...</p>
              ) : ledgerEntries.length === 0 ? (
                <p className="text-xs text-center p-6 text-slate-500">No ledger transactions found.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                      <th className="p-2">Date</th>
                      <th className="p-2">Reference</th>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Debit (Paid)</th>
                      <th className="p-2 text-right">Credit (Purchased)</th>
                      <th className="p-2 text-right">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ledgerEntries.map(entry => (
                      <tr key={entry.id}>
                        <td className="p-2 text-slate-600 font-medium">{entry.date}</td>
                        <td className="p-2 font-mono text-emerald-900 font-bold">{entry.referenceNo}</td>
                        <td className="p-2 text-slate-800">{entry.description}</td>
                        <td className="p-2 text-right font-bold text-emerald-700">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                        </td>
                        <td className="p-2 text-right font-black text-slate-900">
                          {formatCurrency(entry.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setLedgerSupplier(null)}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
