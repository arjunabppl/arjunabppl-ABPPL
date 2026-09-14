import React, { useState } from 'react';
import { PurchaseRequisition, PurchaseRequisitionItem, Product, Warehouse } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import {
  FileCheck, Plus, Search, CheckCircle2, XCircle, Clock, AlertCircle,
  Eye, Edit3, ArrowRight, Trash2, Filter, Layers
} from 'lucide-react';

interface PurchaseRequisitionTabProps {
  requisitions: PurchaseRequisition[];
  products: Product[];
  warehouses: Warehouse[];
  onSaveRequisition: (data: Partial<PurchaseRequisition>) => Promise<void>;
  onApproveRequisition: (id: string) => Promise<void>;
  onRejectRequisition: (id: string, reason: string) => Promise<void>;
  onConvertToPo: (req: PurchaseRequisition) => void;
  currentUserRole?: string;
}

export const PurchaseRequisitionTab: React.FC<PurchaseRequisitionTabProps> = ({
  requisitions = [],
  products = [],
  warehouses = [],
  onSaveRequisition,
  onApproveRequisition,
  onRejectRequisition,
  onConvertToPo,
  currentUserRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<PurchaseRequisition | null>(null);
  const [viewDetailReq, setViewDetailReq] = useState<PurchaseRequisition | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Form State
  const [department, setDepartment] = useState('Procurement & Warehouse');
  const [priority, setPriority] = useState<PurchaseRequisition['priority']>('MEDIUM');
  const [requiredByDate, setRequiredByDate] = useState(
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [warehouseId, setWarehouseId] = useState(warehouses?.[0]?.id || 'wh-1');
  const [purpose, setPurpose] = useState('Stock replenishment for peak printing season');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseRequisitionItem[]>([
    {
      productId: products?.[0]?.id || 'p-1',
      productName: products?.[0]?.name || 'Century Star Copier Paper 75 GSM A4',
      category: (products?.[0]?.category as any) || 'Copier Paper',
      gsm: products?.[0]?.gsm || 75,
      sizeInches: products?.[0]?.sizeInches || 'A4',
      requiredQuantity: 200,
      unit: products?.[0]?.unit || 'Ream',
      targetRate: products?.[0]?.purchaseRate || 220,
      estimatedTotal: 200 * (products?.[0]?.purchaseRate || 220),
      remarks: 'Fast selling stock'
    }
  ]);

  const filtered = (requisitions || []).filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
    const q = (searchTerm || '').toLowerCase();
    if (q) {
      const matchNo = (r.reqNo || '').toLowerCase().includes(q);
      const matchBy = (r.requestedBy || '').toLowerCase().includes(q);
      const matchItem = (r.items || []).some(it => (it.productName || '').toLowerCase().includes(q));
      return matchNo || matchBy || matchItem;
    }
    return true;
  });

  const handleOpenNew = () => {
    setSelectedReq(null);
    setDepartment('Procurement & Warehouse');
    setPriority('MEDIUM');
    setRequiredByDate(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]);
    setWarehouseId(warehouses?.[0]?.id || 'wh-1');
    setPurpose('Stock replenishment for peak printing season');
    setNotes('');
    if ((products || []).length > 0 && products[0]) {
      setItems([
        {
          productId: products[0].id,
          productName: products[0].name,
          category: products[0].category,
          gsm: products[0].gsm,
          sizeInches: products[0].sizeInches,
          requiredQuantity: 100,
          unit: products[0].unit || 'Ream',
          targetRate: products[0].purchaseRate || 250,
          estimatedTotal: 100 * (products[0].purchaseRate || 250),
          remarks: 'Standard replenishment'
        }
      ]);
    }
    setShowModal(true);
  };

  const handleAddItem = () => {
    const p = products?.[0];
    if (!p) return;
    setItems([
      ...items,
      {
        productId: p.id,
        productName: p.name,
        category: p.category,
        gsm: p.gsm,
        sizeInches: p.sizeInches,
        requiredQuantity: 50,
        unit: p.unit || 'Ream',
        targetRate: p.purchaseRate || 200,
        estimatedTotal: 50 * (p.purchaseRate || 200),
        remarks: ''
      }
    ]);
  };

  const handleItemProductChange = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      gsm: prod.gsm,
      sizeInches: prod.sizeInches,
      unit: prod.unit || 'Ream',
      targetRate: prod.purchaseRate || 200,
      estimatedTotal: newItems[index].requiredQuantity * (prod.purchaseRate || 200)
    };
    setItems(newItems);
  };

  const handleItemQtyRateChange = (index: number, field: 'requiredQuantity' | 'targetRate', val: number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: val,
      estimatedTotal:
        field === 'requiredQuantity'
          ? val * newItems[index].targetRate
          : newItems[index].requiredQuantity * val
    };
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selWh = warehouses.find(w => w.id === warehouseId);
    await onSaveRequisition({
      id: selectedReq ? selectedReq.id : undefined,
      department,
      priority,
      requiredByDate,
      warehouseId,
      warehouseName: selWh ? selWh.name : 'Bhiwandi Godown',
      purpose,
      notes,
      items,
      status: 'PENDING_APPROVAL'
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-4" id="purchase-requisition-container">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Purchase Requisitions (PR)</h3>
            <p className="text-xs text-slate-400">Internal procurement requests and approval workflow</p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Requisition</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by PR #, requester, or paper name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CONVERTED_TO_PO">Converted to PO</option>
          </select>

          <span className="text-slate-400 ml-2">Priority:</span>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">PR Number</th>
                <th className="px-4 py-3">Requested By & Dept</th>
                <th className="px-4 py-3">Required By</th>
                <th className="px-4 py-3">Items Requested</th>
                <th className="px-4 py-3 text-right">Est. Total</th>
                <th className="px-4 py-3 text-center">Priority</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No purchase requisitions found. Click "New Requisition" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map(req => (
                  <tr key={req.id} className="hover:bg-slate-750/40 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-400">
                      {req.reqNo}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-200">{req.requestedBy}</div>
                      <div className="text-[11px] text-slate-400">{req.department}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      {req.requiredByDate}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        {req.items.map((it, idx) => (
                          <div key={idx} className="text-[11px] text-slate-200">
                            • {it.productName} ({it.requiredQuantity} {it.unit})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-100">
                      {formatCurrency(req.estimatedTotalAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.priority === 'URGENT'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : req.priority === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : req.priority === 'MEDIUM'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : req.status === 'REJECTED'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : req.status === 'CONVERTED_TO_PO'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {(req.status || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => setViewDetailReq(req)}
                        title="View Details"
                        className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {req.status === 'PENDING_APPROVAL' && (currentUserRole === 'superadmin' || currentUserRole === 'purchase' || currentUserRole === 'admin') && (
                        <>
                          <button
                            onClick={() => onApproveRequisition(req.id)}
                            title="Approve Requisition"
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded transition"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(req.id);
                              setRejectReason('');
                            }}
                            title="Reject Requisition"
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {req.status === 'APPROVED' && (
                        <button
                          onClick={() => onConvertToPo(req)}
                          title="Generate Purchase Order"
                          className="px-2 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition inline-flex items-center space-x-1"
                        >
                          <span>Make PO</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Requisition */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">Create Purchase Requisition</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Required By Date</label>
                  <input
                    type="date"
                    value={requiredByDate}
                    onChange={e => setRequiredByDate(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Receiving Warehouse</label>
                  <select
                    value={warehouseId}
                    onChange={e => setWarehouseId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Purpose / Reason</label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    placeholder="e.g. Stock replenishment for corporate printing"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-200 flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Requested Paper Products</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded border border-emerald-500/30 text-[11px] font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-6">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Product</label>
                          <select
                            value={item.productId}
                            onChange={e => handleItemProductChange(idx, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:outline-none"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.gsm} GSM - {p.sizeInches})</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Qty ({item.unit})</label>
                          <input
                            type="number"
                            min="1"
                            value={item.requiredQuantity}
                            onChange={e => handleItemQtyRateChange(idx, 'requiredQuantity', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Target Rate (₹)</label>
                          <input
                            type="number"
                            min="1"
                            value={item.targetRate}
                            onChange={e => handleItemQtyRateChange(idx, 'targetRate', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2 flex items-end justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Est. Subtotal</span>
                            <span className="font-semibold text-emerald-400 text-xs">
                              {formatCurrency(item.estimatedTotal)}
                            </span>
                          </div>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-300">
                  Total Requisition Estimate:{' '}
                  <span className="text-sm font-bold text-emerald-400">
                    {formatCurrency(items.reduce((s, it) => s + it.estimatedTotal, 0))}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-xs"
                  >
                    Submit Requisition
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>Reject Purchase Requisition</span>
            </h3>
            <p className="text-xs text-slate-300">
              Please enter the reason for rejecting this purchase requisition:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Existing stock sufficient until next quarter / Rate exceeds budget"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-red-500"
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (rejectingId) {
                    await onRejectRequisition(rejectingId, rejectReason || 'Budget constraints');
                    setRejectingId(null);
                  }
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewDetailReq && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-emerald-400 font-mono">
                  {viewDetailReq.reqNo}
                </h3>
                <span className="text-xs text-slate-400">Created on {viewDetailReq.reqDate}</span>
              </div>
              <button onClick={() => setViewDetailReq(null)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Requested By:</span>
                <span className="text-slate-100 font-semibold">{viewDetailReq.requestedBy} ({viewDetailReq.department})</span>
              </div>
              <div>
                <span className="text-slate-400 block">Required By Date:</span>
                <span className="text-slate-100 font-semibold">{viewDetailReq.requiredByDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Warehouse Destination:</span>
                <span className="text-slate-100 font-semibold">{viewDetailReq.warehouseName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Priority & Status:</span>
                <span className="font-semibold text-emerald-400">{viewDetailReq.priority} • {viewDetailReq.status}</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">Item Breakdown</h4>
              <div className="bg-slate-950/60 rounded-lg border border-slate-800 p-3 space-y-2 text-xs">
                {viewDetailReq.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-200 pb-1.5 border-b border-slate-800/60 last:border-none">
                    <div>
                      <p className="font-medium text-slate-100">{it.productName}</p>
                      <p className="text-[11px] text-slate-400">{it.gsm} GSM • {it.sizeInches}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-400">{it.requiredQuantity} {it.unit} @ ₹{it.targetRate}</p>
                      <p className="text-[11px] text-slate-400">{formatCurrency(it.estimatedTotal)}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700 font-bold">
                  <span className="text-slate-300">Total Estimated Amount:</span>
                  <span className="text-emerald-400 text-sm">{formatCurrency(viewDetailReq.estimatedTotalAmount)}</span>
                </div>
              </div>
            </div>

            {viewDetailReq.rejectionReason && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300">
                <span className="font-bold">Rejection Reason: </span> {viewDetailReq.rejectionReason}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewDetailReq(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
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
