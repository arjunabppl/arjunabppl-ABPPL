import React, { useState } from 'react';
import { SupplierPayment, Supplier, PurchaseOrder } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import {
  CreditCard, Plus, Search, CheckCircle2, Globe, Building2,
  FileCheck, ArrowRight, Eye, ShieldCheck, DollarSign
} from 'lucide-react';

interface SupplierPaymentsTabProps {
  payments?: SupplierPayment[];
  suppliers?: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  onSavePayment?: (data: Partial<SupplierPayment>) => Promise<void>;
  currentUserRole?: string;
}

export const SupplierPaymentsTab: React.FC<SupplierPaymentsTabProps> = ({
  payments = [],
  suppliers = [],
  purchaseOrders = [],
  onSavePayment,
  currentUserRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState(suppliers?.[0]?.id || '');
  const [poId, setPoId] = useState('');
  const [paymentMode, setPaymentMode] = useState<'NEFT' | 'RTGS' | 'SWIFT' | 'LC_PAYMENT' | 'CHEQUE'>('RTGS');
  const [amountInr, setAmountInr] = useState(150000);
  const [currency, setCurrency] = useState('INR');
  const [amountForeign, setAmountForeign] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [tdsDeductedInr, setTdsDeductedInr] = useState(150); // 0.1% TDS on purchase
  const [bankAccount, setBankAccount] = useState('HDFC Bank Current A/c - 502000192831');
  const [referenceNumber, setReferenceNumber] = useState('HDFCR52026081900192');
  const [notes, setNotes] = useState('Advance payment against proforma invoice');

  const selectedSupplier = (suppliers || []).find(s => s.id === supplierId);
  const supplierPos = (purchaseOrders || []).filter(p => p.supplierId === supplierId);

  const filtered = (payments || []).filter(p => {
    const q = (searchTerm || '').toLowerCase();
    if (q) {
      return (
        (p.paymentVoucherNo || '').toLowerCase().includes(q) ||
        (p.supplierName || '').toLowerCase().includes(q) ||
        (p.referenceNumber && (p.referenceNumber || '').toLowerCase().includes(q)) ||
        (p.poNumber && (p.poNumber || '').toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSupplierChange = (sId: string) => {
    setSupplierId(sId);
    const sup = suppliers.find(s => s.id === sId);
    if (sup?.currency && sup.currency !== 'INR') {
      setCurrency(sup.currency);
      setPaymentMode('SWIFT');
      setExchangeRate(sup.currency === 'USD' ? 86.80 : sup.currency === 'EUR' ? 94.20 : 64.50);
    } else {
      setCurrency('INR');
      setPaymentMode('RTGS');
      setExchangeRate(1.0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === supplierId);
    const po = purchaseOrders.find(p => p.id === poId);

    await onSavePayment({
      supplierId,
      supplierName: sup?.companyName || 'Supplier',
      poId: poId || undefined,
      poNumber: po?.purchaseNo,
      amountInr,
      currency,
      amountForeign: currency !== 'INR' ? amountForeign : undefined,
      exchangeRate: currency !== 'INR' ? exchangeRate : undefined,
      paymentMode,
      referenceNumber,
      bankAccount,
      tdsDeductedInr,
      status: 'CONFIRMED',
      notes
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-4" id="supplier-payments-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Supplier Payments & Foreign Remittances</h3>
            <p className="text-xs text-slate-400">
              Disburse domestic RTGS/NEFT and overseas SWIFT payments, track TDS Section 194Q deductions
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Record Supplier Payment</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Voucher #, UTR Ref #, Supplier, or PO #..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Voucher # & Date</th>
                <th className="px-4 py-3">Supplier & Bank</th>
                <th className="px-4 py-3">Linked PO</th>
                <th className="px-4 py-3">Mode & UTR / Ref</th>
                <th className="px-4 py-3">TDS (194Q)</th>
                <th className="px-4 py-3 text-right">Amount Paid (INR)</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No supplier payment records logged. Click "Record Supplier Payment" to log disbursements.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-750/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-emerald-400">{p.paymentVoucherNo}</div>
                      <div className="text-[11px] text-slate-400">{p.paymentDate}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-200">{p.supplierName}</div>
                      <div className="text-[11px] text-slate-400">{p.bankAccount}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {p.poNumber || 'Direct On-Account'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-1.5 py-0.2 bg-slate-700 text-slate-300 rounded text-[9px] font-bold">
                          {p.paymentMode}
                        </span>
                        <span className="font-mono text-xs text-slate-300">{p.referenceNumber}</span>
                      </div>
                      {p.currency !== 'INR' && (
                        <div className="text-[11px] text-blue-400">
                          {p.currency} {formatNumber(p.amountForeign || 0)} (Ex: ₹{p.exchangeRate})
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {formatCurrency(p.tdsDeductedInr || 0)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-400">
                      {formatCurrency(p.amountInr)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Payment */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">Record Supplier Payment</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supplier / Beneficiary</label>
                  <select
                    value={supplierId}
                    onChange={e => handleSupplierChange(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.companyName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Linked Purchase Order (Optional)</label>
                  <select
                    value={poId}
                    onChange={e => setPoId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="">-- Direct Account Payment --</option>
                    {supplierPos.map(p => (
                      <option key={p.id} value={p.id}>{p.purchaseNo} ({formatCurrency(p.grandTotal)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                    <option value="NEFT">NEFT (National Electronic Transfer)</option>
                    <option value="SWIFT">SWIFT (Outward Foreign Remittance)</option>
                    <option value="LC_PAYMENT">LC Settlement</option>
                    <option value="CHEQUE">Bank Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount Paid (INR)</label>
                  <input
                    type="number"
                    value={amountInr}
                    onChange={e => setAmountInr(Number(e.target.value))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">TDS Deducted (Sec 194Q)</label>
                  <input
                    type="number"
                    value={tdsDeductedInr}
                    onChange={e => setTdsDeductedInr(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {currency !== 'INR' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Foreign Amount ({currency})</label>
                    <input
                      type="number"
                      value={amountForeign}
                      onChange={e => setAmountForeign(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Exchange Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={e => setExchangeRate(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bank UTR / Ref / Cheque #</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={e => setReferenceNumber(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Paid From Bank Account</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                >
                  Confirm & Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
