import React, { useState } from 'react';
import { ThreeWayMatch, PurchaseOrder, GoodsReceiptNote, Supplier } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import {
  FileCheck2, Plus, Search, CheckCircle2, AlertTriangle, ShieldAlert,
  ArrowRight, Eye, Check, X, ShieldCheck
} from 'lucide-react';

interface ThreeWayMatchTabProps {
  matches?: ThreeWayMatch[];
  purchaseOrders?: PurchaseOrder[];
  grns?: GoodsReceiptNote[];
  suppliers?: Supplier[];
  onPerformMatch?: (data: Partial<ThreeWayMatch>) => Promise<void>;
  onApproveMatch?: (id: string, notes: string) => Promise<void>;
  currentUserRole?: string;
}

export const ThreeWayMatchTab: React.FC<ThreeWayMatchTabProps> = ({
  matches = [],
  purchaseOrders = [],
  grns = [],
  suppliers = [],
  onPerformMatch,
  onApproveMatch,
  currentUserRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState<ThreeWayMatch | null>(null);
  const [approveNotes, setApproveNotes] = useState('Variance is within allowable 1% commercial tolerance');
  const [approvingMatch, setApprovingMatch] = useState<ThreeWayMatch | null>(null);

  // Form State
  const [poId, setPoId] = useState(purchaseOrders?.[0]?.id || '');
  const [grnId, setGrnId] = useState(grns?.[0]?.id || '');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('INV-SUP-8821');
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceQuantity, setInvoiceQuantity] = useState(100);
  const [invoiceRate, setInvoiceRate] = useState(220);
  const [invoiceTotalAmount, setInvoiceTotalAmount] = useState(25960);
  const [remarks, setRemarks] = useState('Automated 3-way matching cross verification');

  const selectedPo = (purchaseOrders || []).find(p => p.id === poId);
  const selectedGrn = (grns || []).find(g => g.id === grnId);

  const poQty = (selectedPo?.items || []).reduce((s, it) => s + (it.quantity || 0), 0) || 100;
  const poRate = selectedPo?.items?.[0]?.rate || 220;
  const poAmount = selectedPo?.grandTotal || 25960;

  const grnQty = (selectedGrn?.items || []).reduce((s, it) => s + (it.acceptedQuantity || 0), 0) || 100;

  const qtyVariance = invoiceQuantity - grnQty;
  const priceVariance = invoiceRate - poRate;
  const totalVariance = invoiceTotalAmount - poAmount;

  const hasDiscrepancy = Math.abs(qtyVariance) > 0 || Math.abs(priceVariance) > 0 || Math.abs(totalVariance) > 10;

  const filtered = (matches || []).filter(m => {
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    const q = (searchTerm || '').toLowerCase();
    if (q) {
      return (
        (m.matchNo || '').toLowerCase().includes(q) ||
        (m.poNumber || '').toLowerCase().includes(q) ||
        (m.grnNumber || '').toLowerCase().includes(q) ||
        (m.supplierInvoiceNo || '').toLowerCase().includes(q) ||
        (m.supplierName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onPerformMatch({
      poId: selectedPo?.id,
      poNumber: selectedPo?.purchaseNo || 'PO-001',
      grnId: selectedGrn?.id,
      grnNumber: selectedGrn?.grnNo || 'GRN-001',
      supplierInvoiceNo,
      supplierInvoiceDate,
      supplierId: selectedPo?.supplierId || 's-1',
      supplierName: selectedPo?.supplierName || 'Supplier',
      poQuantity: poQty,
      grnQuantity: grnQty,
      invoiceQuantity,
      quantityVariance: qtyVariance,
      poUnitPrice: poRate,
      invoiceUnitPrice: invoiceRate,
      priceVariance,
      poTotalAmount: poAmount,
      invoiceTotalAmount,
      totalAmountVariance: totalVariance,
      tolerancePercent: 1.0,
      isQuantityMatched: qtyVariance === 0,
      isPriceMatched: priceVariance === 0,
      isTaxMatched: true,
      status: hasDiscrepancy ? 'DISCREPANCY' : 'MATCHED',
      remarks
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-4" id="three-way-match-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">3-Way Matching & Bill Audit</h3>
            <p className="text-xs text-slate-400">
              Cross-validate Purchase Orders vs GRN Physical Receipts vs Supplier Invoices to prevent overbilling
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Perform 3-Way Match</span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Match #, PO #, GRN #, or Supplier Invoice..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="MATCHED">Matched</option>
            <option value="DISCREPANCY">Discrepancy</option>
            <option value="APPROVED_FOR_PAYMENT">Approved for Payment</option>
          </select>
        </div>
      </div>

      {/* Grid of Matches */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400 text-xs">
            No 3-Way Match audits found. Click "Perform 3-Way Match" to cross-verify bills.
          </div>
        ) : (
          filtered.map(m => (
            <div
              key={m.id}
              className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-600 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-blue-400 text-sm">{m.matchNo}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.status === 'MATCHED' || m.status === 'APPROVED_FOR_PAYMENT'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {(m.status || '').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-medium">
                    {m.supplierName} • PO: <span className="font-mono">{m.poNumber}</span> • GRN: <span className="font-mono">{m.grnNumber}</span> • Bill: <span className="font-mono">{m.supplierInvoiceNo}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {m.status === 'DISCREPANCY' && (currentUserRole === 'superadmin' || currentUserRole === 'accounts' || currentUserRole === 'admin') && (
                    <button
                      onClick={() => {
                        setApprovingMatch(m);
                        setApproveNotes(`Approved variance of ₹${m.totalAmountVariance} under commercial tolerance.`);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Release Payment</span>
                    </button>
                  )}

                  <button
                    onClick={() => setViewModal(m)}
                    className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 3 Pillars Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. PO */}
                <div className="p-3 bg-slate-900/60 border border-slate-700/50 rounded-xl space-y-1 text-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">1. Purchase Order</span>
                  <div className="flex justify-between text-slate-300">
                    <span>Ordered Qty:</span>
                    <span className="font-bold text-slate-100">{m.poQuantity} Reams</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Agreed Rate:</span>
                    <span className="font-bold text-slate-100">₹{m.poUnitPrice}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                    <span>PO Total:</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(m.poTotalAmount)}</span>
                  </div>
                </div>

                {/* 2. GRN */}
                <div className="p-3 bg-slate-900/60 border border-slate-700/50 rounded-xl space-y-1 text-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">2. GRN Physical Receipt</span>
                  <div className="flex justify-between text-slate-300">
                    <span>Accepted Qty:</span>
                    <span className="font-bold text-slate-100">{m.grnQuantity} Reams</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Qty Match:</span>
                    <span className={`font-bold ${m.isQuantityMatched ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.isQuantityMatched ? '100% MATCH' : `${m.quantityVariance} Diff`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                    <span>QC Status:</span>
                    <span className="font-semibold text-emerald-400">PASSED</span>
                  </div>
                </div>

                {/* 3. Invoice */}
                <div className="p-3 bg-slate-900/60 border border-slate-700/50 rounded-xl space-y-1 text-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">3. Supplier Invoice</span>
                  <div className="flex justify-between text-slate-300">
                    <span>Billed Qty:</span>
                    <span className="font-bold text-slate-100">{m.invoiceQuantity} Reams</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Billed Rate:</span>
                    <span className="font-bold text-slate-100">₹{m.invoiceUnitPrice}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                    <span>Invoice Total:</span>
                    <span className={`font-bold ${m.totalAmountVariance === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {formatCurrency(m.invoiceTotalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {m.approvedBy && (
                <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
                  <span>Approved by {m.approvedBy} on {m.approvalDate}</span>
                  <span className="text-[11px] text-slate-400">{m.approvalNotes}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: New 3-Way Match */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-slate-100">Execute 3-Way Match Audit</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Purchase Order</label>
                  <select
                    value={poId}
                    onChange={e => setPoId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    {purchaseOrders.map(p => (
                      <option key={p.id} value={p.id}>{p.purchaseNo} — {p.supplierName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select GRN (Goods Receipt)</label>
                  <select
                    value={grnId}
                    onChange={e => setGrnId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    {grns.map(g => (
                      <option key={g.id} value={g.id}>{g.grnNo} — {g.supplierName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supplier Bill #</label>
                  <input
                    type="text"
                    value={supplierInvoiceNo}
                    onChange={e => setSupplierInvoiceNo(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Billed Quantity</label>
                  <input
                    type="number"
                    value={invoiceQuantity}
                    onChange={e => setInvoiceQuantity(Number(e.target.value))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Billed Total Amount (INR)</label>
                  <input
                    type="number"
                    value={invoiceTotalAmount}
                    onChange={e => setInvoiceTotalAmount(Number(e.target.value))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Variance Indicator */}
              <div className={`p-3 rounded-xl border text-xs ${hasDiscrepancy ? 'bg-amber-950/40 border-amber-500/50 text-amber-300' : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'}`}>
                {hasDiscrepancy ? (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Discrepancy detected: Qty diff {qtyVariance}, Amount diff ₹{totalVariance}. Requires supervisor authorization.</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Perfect 3-way match! PO, GRN, and Invoice values match 100%.</span>
                  </div>
                )}
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  Save 3-Way Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Override Modal */}
      {approvingMatch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Authorize & Approve Payment</span>
            </h3>
            <p className="text-xs text-slate-300">
              Match <strong>{approvingMatch.matchNo}</strong> — Invoice Amount: {formatCurrency(approvingMatch.invoiceTotalAmount)}
            </p>
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Approval / Tolerance Notes</label>
              <textarea
                rows={3}
                value={approveNotes}
                onChange={e => setApproveNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setApprovingMatch(null)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs">
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onApproveMatch(approvingMatch.id, approveNotes);
                  setApprovingMatch(null);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
