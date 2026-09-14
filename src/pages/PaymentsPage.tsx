import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { PaymentRecord, Customer, Supplier, Invoice } from '../types/index.js';
import { formatCurrency } from '../utils/paperMath.js';
import {
  CreditCard, Plus, Search, ArrowDownLeft, ArrowUpRight, X, CheckCircle,
  FileText, FileSpreadsheet, Printer
} from 'lucide-react';
import { exportToPdf, exportToExcel, ColumnDefinition, SummaryStat } from '../utils/exportUtils.js';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT');
  const [partyId, setPartyId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState<number>(50000);
  const [mode, setMode] = useState<'NEFT' | 'RTGS' | 'CHEQUE' | 'CASH' | 'UPI'>('NEFT');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('Payment against pending invoice bill');

  const loadData = async () => {
    try {
      const [pList, cList, sList, invList] = await Promise.all([
        api.getPayments(),
        api.getCustomers(),
        api.getSuppliers(),
        api.getInvoices('INVOICE')
      ]);
      setPayments(pList);
      setCustomers(cList);
      setSuppliers(sList);
      setInvoices(invList);

      if (cList.length > 0) setPartyId(cList[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    let partyName = '';
    if (paymentType === 'RECEIPT') {
      const c = customers.find(cust => cust.id === partyId);
      partyName = c ? (c.companyName || c.name) : 'Customer';
    } else {
      const s = suppliers.find(sup => sup.id === partyId);
      partyName = s ? (s.companyName || s.name) : 'Supplier';
    }

    try {
      const mappedMethod = (mode === 'NEFT' || mode === 'RTGS') ? 'BANK_TRANSFER' : (mode === 'CASH') ? 'CASH' : (mode === 'CHEQUE') ? 'CHEQUE' : 'UPI';
      await api.recordPayment({
        partyType: paymentType === 'RECEIPT' ? 'CUSTOMER' : 'SUPPLIER',
        partyId,
        partyName,
        invoiceId: invoiceId || undefined,
        amount,
        method: mappedMethod,
        referenceNo: referenceNo || `UTR-${Date.now().toString().slice(-6)}`,
        paymentDate: new Date().toISOString().split('T')[0],
        remarks: notes
      });
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPayments = (payments || []).filter(p => {
    const s = (searchTerm || '').toLowerCase();
    if (!s) return true;
    return (
      (p.partyName || '').toLowerCase().includes(s) ||
      (p.referenceNo || '').toLowerCase().includes(s)
    );
  });

  const handleExportPdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Type', dataKey: 'partyType', align: 'center', format: v => v === 'CUSTOMER' ? 'Receipt' : 'Payment' },
      { header: 'Party Name', dataKey: 'partyName', align: 'left' },
      { header: 'Payment Mode', dataKey: 'method', align: 'center' },
      { header: 'Ref / UTR No', dataKey: 'referenceNo', align: 'center' },
      { header: 'Date', dataKey: 'paymentDate', align: 'center' },
      { header: 'Amount (₹)', dataKey: 'amount', align: 'right', format: v => formatCurrency(v || 0) },
      { header: 'Remarks', dataKey: 'remarks', align: 'left' }
    ];

    const totalReceipts = filteredPayments.filter(p => p.partyType === 'CUSTOMER').reduce((s, p) => s + (p.amount || 0), 0);
    const totalPayouts = filteredPayments.filter(p => p.partyType !== 'CUSTOMER').reduce((s, p) => s + (p.amount || 0), 0);

    exportToPdf({
      title: 'Payments & Receipts Voucher Register',
      subtitle: `Total Transactions Recorded: ${filteredPayments.length}`,
      fileName: `Payments_DayBook_${new Date().toISOString().split('T')[0]}`,
      summaryStats: [
        { label: 'Total Inflow (Receipts)', value: formatCurrency(totalReceipts) },
        { label: 'Total Outflow (Mill Payouts)', value: formatCurrency(totalPayouts) },
        { label: 'Total Vouchers', value: filteredPayments.length }
      ],
      columns,
      data: filteredPayments,
      orientation: 'landscape'
    });
  };

  const handleExportExcel = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Voucher Type', dataKey: 'partyType', format: v => v === 'CUSTOMER' ? 'Customer Receipt' : 'Supplier Payment' },
      { header: 'Party Name', dataKey: 'partyName', width: 28 },
      { header: 'Payment Mode', dataKey: 'method' },
      { header: 'Reference / UTR No', dataKey: 'referenceNo' },
      { header: 'Payment Date', dataKey: 'paymentDate' },
      { header: 'Amount (₹)', dataKey: 'amount' },
      { header: 'Remarks / Notes', dataKey: 'remarks', width: 30 }
    ];

    const totalAmount = filteredPayments.reduce((s, p) => s + (p.amount || 0), 0);

    exportToExcel({
      fileName: `Payments_Register_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Payments Register',
      title: 'Day Book Payments & Collections Register',
      subtitle: 'Amriteshwar Balaji Paper Pvt. Ltd. - Financial Accounts',
      columns,
      data: filteredPayments,
      totalsRow: {
        partyName: 'TOTAL',
        amount: totalAmount
      }
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Payments & Receipts Voucher Register</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Record customer receipts (NEFT/RTGS/Cheque) and mill supplier payments with UTR tracking
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={handleExportPdf}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
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
            onClick={() => {
              setPaymentType('RECEIPT');
              setShowModal(true);
            }}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Customer Receipt</span>
          </button>

          <button
            onClick={() => {
              setPaymentType('PAYMENT');
              setShowModal(true);
            }}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-700 transition shadow-sm cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span>Mill Payment</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Party Name, UTR / Cheque No..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total Transactions: {filteredPayments.length}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <th className="p-3">Voucher Type</th>
                <th className="p-3">Party Name</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3 text-center">Payment Mode</th>
                <th className="p-3 font-mono">UTR / Cheque Ref</th>
                <th className="p-3">Date</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      p.partyType === 'CUSTOMER' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {p.partyType === 'CUSTOMER' ? 'Customer Receipt' : 'Supplier Payment'}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900">{p.partyName}</td>
                  <td className="p-3 text-right font-extrabold text-slate-900">{formatCurrency(p.amount)}</td>
                  <td className="p-3 text-center font-bold text-slate-700">{p.method}</td>
                  <td className="p-3 font-mono text-emerald-900 font-bold">{p.referenceNo}</td>
                  <td className="p-3 text-slate-500">{p.paymentDate}</td>
                  <td className="p-3 text-slate-600">{p.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-base">
                {paymentType === 'RECEIPT' ? 'Record Customer Receipt Voucher' : 'Record Supplier Payment Voucher'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Select {paymentType === 'RECEIPT' ? 'Customer Firm' : 'Mill Supplier'}
                </label>
                <select
                  value={partyId}
                  onChange={e => setPartyId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 bg-white"
                >
                  {paymentType === 'RECEIPT'
                    ? customers.map(c => <option key={c.id} value={c.id}>{c.companyName || c.name} (Due: ₹{c.outstandingBalance})</option>)
                    : suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName || s.name} (Due: ₹{s.outstandingBalance})</option>)
                  }
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-extrabold text-emerald-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
                  <select
                    value={mode}
                    onChange={e => setMode(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold bg-white"
                  >
                    <option value="NEFT">NEFT / NetBanking</option>
                    <option value="RTGS">RTGS</option>
                    <option value="CHEQUE">Bank Cheque</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">UTR / Cheque Ref No</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC10928374"
                    value={referenceNo}
                    onChange={e => setReferenceNo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-lg"
                >
                  Post Payment Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
