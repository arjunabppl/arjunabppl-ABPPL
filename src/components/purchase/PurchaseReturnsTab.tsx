import React, { useState } from 'react';
import { PurchaseReturn, PurchaseReturnItem, PurchaseOrder, Supplier, Warehouse, Product } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import {
  RotateCcw, Plus, Search, FileText, CheckCircle2, AlertTriangle, Eye,
  Trash2, Printer
} from 'lucide-react';

interface PurchaseReturnsTabProps {
  returns?: PurchaseReturn[];
  purchaseOrders?: PurchaseOrder[];
  suppliers?: Supplier[];
  products?: Product[];
  warehouses?: Warehouse[];
  onSaveReturn?: (data: Partial<PurchaseReturn>) => Promise<void>;
  currentUserRole?: string;
}

export const PurchaseReturnsTab: React.FC<PurchaseReturnsTabProps> = ({
  returns = [],
  purchaseOrders = [],
  suppliers = [],
  products = [],
  warehouses = [],
  onSaveReturn,
  currentUserRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewDetailModal, setViewDetailModal] = useState<PurchaseReturn | null>(null);

  // Form State
  const [poId, setPoId] = useState(purchaseOrders?.[0]?.id || '');
  const [supplierId, setSupplierId] = useState(suppliers?.[0]?.id || '');
  const [reason, setReason] = useState('GSM out of spec and edge curl during high-speed printing');
  const [transporterName, setTransporterName] = useState('Vijay Roadways Express');
  const [vehicleNo, setVehicleNo] = useState('MH-04-FK-9921');
  const [items, setItems] = useState<PurchaseReturnItem[]>([
    {
      productId: products?.[0]?.id || 'p-1',
      productName: products?.[0]?.name || 'Century Star Copier Paper 75 GSM A4',
      category: 'Copier Paper',
      gsm: 75,
      sizeInches: 'A4',
      returnQuantity: 20,
      unit: 'Ream',
      purchaseRate: 220,
      taxPercent: 18,
      totalAmount: 20 * 220 * 1.18,
      defectReason: 'Ream moisture higher than standard 5%'
    }
  ]);

  const selectedPo = (purchaseOrders || []).find(p => p.id === poId);

  const filtered = (returns || []).filter(r => {
    const q = (searchTerm || '').toLowerCase();
    if (q) {
      return (
        (r.returnNo || '').toLowerCase().includes(q) ||
        (r.debitNoteNumber || '').toLowerCase().includes(q) ||
        (r.supplierName || '').toLowerCase().includes(q) ||
        (r.poNumber || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handlePoChange = (pId: string) => {
    setPoId(pId);
    const po = purchaseOrders.find(p => p.id === pId);
    if (po) {
      setSupplierId(po.supplierId);
      if (po.items.length > 0) {
        setItems([
          {
            productId: po.items[0].productId,
            productName: po.items[0].productName,
            category: po.items[0].category,
            gsm: po.items[0].gsm,
            sizeInches: po.items[0].sizeInches,
            returnQuantity: 10,
            unit: po.items[0].unit || 'Ream',
            purchaseRate: po.items[0].rate,
            taxPercent: po.items[0].taxPercent || 18,
            totalAmount: 10 * po.items[0].rate * (1 + (po.items[0].taxPercent || 18) / 100),
            defectReason: 'Surface coating scratches and burst defects'
          }
        ]);
      }
    }
  };

  const handleItemQtyRateChange = (index: number, field: 'returnQuantity' | 'purchaseRate' | 'defectReason', val: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: val };
    const base = item.returnQuantity * item.purchaseRate;
    item.totalAmount = base * (1 + (item.taxPercent || 18) / 100);
    newItems[index] = item;
    setItems(newItems);
  };

  const subtotal = items.reduce((s, it) => s + it.returnQuantity * it.purchaseRate, 0);
  const taxAmount = subtotal * 0.18;
  const grandTotal = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === supplierId);
    await onSaveReturn({
      poId: selectedPo?.id,
      poNumber: selectedPo?.purchaseNo || 'PO-DIRECT',
      supplierId: sup?.id || 's-1',
      supplierName: sup?.companyName || 'Supplier',
      reason,
      items,
      subtotal,
      taxAmount,
      grandTotal,
      transporterName,
      vehicleNo,
      status: 'APPROVED'
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-4" id="purchase-returns-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-red-500/10 text-red-400 rounded-lg">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Purchase Returns & Debit Notes</h3>
            <p className="text-xs text-slate-400">
              Return damaged or out-of-spec paper stock, issue GST Debit Notes, and adjust supplier payables
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Return / Debit Note</span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Return #, Debit Note #, Supplier, or PO..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Debit Note #</th>
                <th className="px-4 py-3">PO & Supplier</th>
                <th className="px-4 py-3">Returned Items</th>
                <th className="px-4 py-3">Defect Reason</th>
                <th className="px-4 py-3 text-right">Debit Note Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No purchase returns or debit notes logged. Click "New Purchase Return" to record rejections.
                  </td>
                </tr>
              ) : (
                filtered.map(ret => (
                  <tr key={ret.id} className="hover:bg-slate-750/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-red-400">{ret.debitNoteNumber}</div>
                      <div className="text-[11px] text-slate-400">{ret.returnDate}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-200">{ret.supplierName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">PO: {ret.poNumber}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        {ret.items.map((it, idx) => (
                          <div key={idx} className="text-[11px] text-slate-200">
                            • {it.productName} ({it.returnQuantity} {it.unit})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 max-w-xs truncate">
                      {ret.reason}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-red-400">
                      {formatCurrency(ret.grandTotal)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {ret.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => setViewDetailModal(ret)}
                        className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Return */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-bold text-slate-100">Generate Purchase Return & Debit Note</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Purchase Order</label>
                  <select
                    value={poId}
                    onChange={e => handlePoChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    {purchaseOrders.map(p => (
                      <option key={p.id} value={p.id}>{p.purchaseNo} — {p.supplierName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Defect Reason / Return Cause</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h4 className="font-semibold text-slate-200">Items to Return</h4>
                {items.map((it, idx) => (
                  <div key={idx} className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
                    <div className="flex justify-between font-medium text-slate-200">
                      <span>{it.productName} ({it.gsm} GSM)</span>
                      <span className="text-red-400 font-bold">{formatCurrency(it.totalAmount)}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Return Qty ({it.unit})</label>
                        <input
                          type="number"
                          value={it.returnQuantity}
                          onChange={e => handleItemQtyRateChange(idx, 'returnQuantity', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Purchase Rate (₹)</label>
                        <input
                          type="number"
                          value={it.purchaseRate}
                          onChange={e => handleItemQtyRateChange(idx, 'purchaseRate', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Defect Details</label>
                        <input
                          type="text"
                          value={it.defectReason}
                          onChange={e => handleItemQtyRateChange(idx, 'defectReason', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Total Debit Note Amount (with GST):</span>
                <span className="text-base font-bold text-red-400">{formatCurrency(grandTotal)}</span>
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold"
                >
                  Create Return & Issue Debit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewDetailModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-red-400 font-mono">
                  {viewDetailModal.debitNoteNumber}
                </h3>
                <span className="text-xs text-slate-400">Issued on {viewDetailModal.returnDate} • PO: {viewDetailModal.poNumber}</span>
              </div>
              <button onClick={() => setViewDetailModal(null)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Supplier / Mill:</span>
                <span className="text-slate-100 font-semibold">{viewDetailModal.supplierName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Return Total:</span>
                <span className="text-red-400 font-bold text-sm">{formatCurrency(viewDetailModal.grandTotal)}</span>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/50 text-xs">
              <span className="font-semibold text-slate-300 block mb-1">Reason:</span>
              <p className="text-slate-400">{viewDetailModal.reason}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewDetailModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
