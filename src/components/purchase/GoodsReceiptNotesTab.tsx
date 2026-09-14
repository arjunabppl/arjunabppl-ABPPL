import React, { useState } from 'react';
import { GoodsReceiptNote, GoodsReceiptItem, PurchaseOrder, ImportShipment, Warehouse, Product } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import {
  PackageCheck, Plus, Search, CheckCircle2, Truck, ShieldCheck,
  AlertTriangle, Eye, ArrowRight, Layers, FileText, Check, X
} from 'lucide-react';

interface GoodsReceiptNotesTabProps {
  grns?: GoodsReceiptNote[];
  purchaseOrders?: PurchaseOrder[];
  shipments?: ImportShipment[];
  warehouses?: Warehouse[];
  products?: Product[];
  onSaveGrn?: (data: Partial<GoodsReceiptNote>) => Promise<void>;
  onConfirmGrn?: (id: string) => Promise<void>;
  currentUserRole?: string;
  initialPoForGrn?: PurchaseOrder | null;
}

export const GoodsReceiptNotesTab: React.FC<GoodsReceiptNotesTabProps> = ({
  grns = [],
  purchaseOrders = [],
  shipments = [],
  warehouses = [],
  products = [],
  onSaveGrn,
  onConfirmGrn,
  currentUserRole,
  initialPoForGrn
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [viewDetailModal, setViewDetailModal] = useState<GoodsReceiptNote | null>(null);

  // Form State
  const [poId, setPoId] = useState(initialPoForGrn?.id || '');
  const [shipmentId, setShipmentId] = useState('');
  const [warehouseId, setWarehouseId] = useState(warehouses?.[0]?.id || 'wh-1');
  const [supplierChallanNo, setSupplierChallanNo] = useState('CH-2026-9912');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('INV-SUP-8821');
  const [vehicleNumber, setVehicleNumber] = useState('MH-04-FK-9921');
  const [transporterName, setTransporterName] = useState('Vijay Roadways Express');
  const [gateEntryNo, setGateEntryNo] = useState('GE-2026-0812');
  const [remarks, setRemarks] = useState('Pallets unloaded in good condition. All ream seals intact.');

  const [items, setItems] = useState<GoodsReceiptItem[]>([
    {
      productId: products?.[0]?.id || 'p-1',
      productName: products?.[0]?.name || 'Century Star Copier Paper 75 GSM A4',
      category: (products?.[0]?.category as any) || 'Copier Paper',
      gsm: products?.[0]?.gsm || 75,
      sizeInches: products?.[0]?.sizeInches || 'A4',
      orderedQuantity: 100,
      receivedQuantity: 100,
      acceptedQuantity: 100,
      rejectedQuantity: 0,
      damagedQuantity: 0,
      unit: 'Ream',
      batchLotNumber: 'LOT-2026-B08',
      storageBinLocation: 'Rack A-04, Bay 2',
      inspectedMoisturePercent: 5.2,
      measuredGsm: 75.1,
      burstFactor: 24.5,
      qcStatus: 'ACCEPTED'
    }
  ]);

  const filtered = (grns || []).filter(g => {
    if (statusFilter !== 'ALL' && g.status !== statusFilter) return false;
    const q = (searchTerm || '').toLowerCase();
    if (q) {
      return (
        (g.grnNo || '').toLowerCase().includes(q) ||
        (g.poNumber || '').toLowerCase().includes(q) ||
        (g.supplierName || '').toLowerCase().includes(q) ||
        (g.vehicleNumber || '').toLowerCase().includes(q) ||
        (g.items || []).some(it => (it.productName || '').toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenNew = () => {
    if (purchaseOrders.length > 0) {
      handlePoChange(purchaseOrders[0].id);
    }
    setShowModal(true);
  };

  const handlePoChange = (selectedPoId: string) => {
    setPoId(selectedPoId);
    const po = purchaseOrders.find(p => p.id === selectedPoId);
    if (po) {
      if (po.warehouseId) setWarehouseId(po.warehouseId);
      setItems(
        po.items.map(it => ({
          productId: it.productId,
          productName: it.productName,
          category: it.category,
          gsm: it.gsm,
          sizeInches: it.sizeInches,
          orderedQuantity: it.quantity,
          receivedQuantity: it.quantity,
          acceptedQuantity: it.quantity,
          rejectedQuantity: 0,
          damagedQuantity: 0,
          unit: it.unit || 'Ream',
          batchLotNumber: `LOT-${Date.now().toString().slice(-4)}`,
          storageBinLocation: 'Rack A-01',
          inspectedMoisturePercent: 5.0,
          measuredGsm: it.gsm,
          burstFactor: 24,
          qcStatus: 'ACCEPTED'
        }))
      );
    }
  };

  const handleItemQtyChange = (
    index: number,
    field: 'receivedQuantity' | 'acceptedQuantity' | 'rejectedQuantity' | 'damagedQuantity',
    val: number
  ) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: val };
    if (field === 'receivedQuantity') {
      item.acceptedQuantity = val - (item.rejectedQuantity || 0) - (item.damagedQuantity || 0);
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const po = purchaseOrders.find(p => p.id === poId);
    const wh = warehouses.find(w => w.id === warehouseId);
    const ship = shipments.find(s => s.id === shipmentId);

    await onSaveGrn({
      poId: poId || undefined,
      poNumber: po?.purchaseNo || 'PO-DIRECT',
      shipmentId: shipmentId || undefined,
      shipmentNo: ship?.shipmentNo,
      supplierId: po?.supplierId || 's-1',
      supplierName: po?.supplierName || 'Supplier',
      warehouseId,
      warehouseName: wh?.name || 'Bhiwandi Godown',
      supplierChallanNo,
      supplierInvoiceNo,
      vehicleNumber,
      transporterName,
      gateEntryNo,
      items,
      qcInspector: 'Warehouse Quality Team',
      remarks,
      status: 'INSPECTED'
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-4" id="goods-receipt-notes-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Goods Receipt Notes (GRN) & QC Inspection</h3>
            <p className="text-xs text-slate-400">
              Verify physical receipt, measure Moisture & GSM, record rejections, and approve stock posting
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Goods Receipt (GRN)</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search GRN #, PO #, Vehicle #, or Supplier..."
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
            <option value="INSPECTED">Inspected</option>
            <option value="CONFIRMED_POSTED_TO_STOCK">Confirmed & Stock Posted</option>
          </select>
        </div>
      </div>

      {/* GRN Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">GRN # & Date</th>
                <th className="px-4 py-3">PO & Supplier</th>
                <th className="px-4 py-3">Vehicle & Transporter</th>
                <th className="px-4 py-3">Items & Quantities</th>
                <th className="px-4 py-3">Warehouse & Bin</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No Goods Receipt Notes found. Click "New Goods Receipt (GRN)" to log warehouse arrivals.
                  </td>
                </tr>
              ) : (
                filtered.map(grn => (
                  <tr key={grn.id} className="hover:bg-slate-750/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-emerald-400">{grn.grnNo}</div>
                      <div className="text-[11px] text-slate-400">{grn.receiptDate}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-200">{grn.supplierName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">PO: {grn.poNumber}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-200 font-medium">{grn.vehicleNumber}</div>
                      <div className="text-[11px] text-slate-400">{grn.transporterName || 'Direct'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        {grn.items.map((it, idx) => (
                          <div key={idx} className="text-[11px]">
                            <span className="text-slate-200">{it.productName}: </span>
                            <strong className="text-emerald-400">{it.acceptedQuantity} Acc</strong>
                            {it.rejectedQuantity > 0 && <span className="text-red-400 ml-1">({it.rejectedQuantity} Rej)</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-200">{grn.warehouseName}</div>
                      <div className="text-[11px] text-slate-400">
                        Bin: {grn.items[0]?.storageBinLocation || 'General Yard'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        grn.status === 'CONFIRMED_POSTED_TO_STOCK'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {grn.status === 'CONFIRMED_POSTED_TO_STOCK' ? 'STOCK POSTED' : 'INSPECTED (PENDING POST)'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => setViewDetailModal(grn)}
                        className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {grn.status !== 'CONFIRMED_POSTED_TO_STOCK' && (currentUserRole === 'superadmin' || currentUserRole === 'inventory' || currentUserRole === 'warehouse' || currentUserRole === 'admin') && (
                        <button
                          onClick={() => onConfirmGrn(grn.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition inline-flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Post to Stock</span>
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

      {/* Modal: New GRN */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <PackageCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">Create Goods Receipt Note (GRN)</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Select Purchase Order</label>
                  <select
                    value={poId}
                    onChange={e => handlePoChange(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {purchaseOrders.map(po => (
                      <option key={po.id} value={po.id}>
                        {po.purchaseNo} — {po.supplierName} ({po.items.length} items)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Receiving Warehouse</label>
                  <select
                    value={warehouseId}
                    onChange={e => setWarehouseId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supplier Challan / Bill #</label>
                  <input
                    type="text"
                    value={supplierChallanNo}
                    onChange={e => setSupplierChallanNo(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vehicle / Container #</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Transporter Name</label>
                  <input
                    type="text"
                    value={transporterName}
                    onChange={e => setTransporterName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gate Entry #</label>
                  <input
                    type="text"
                    value={gateEntryNo}
                    onChange={e => setGateEntryNo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Verification & QC Section */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="font-semibold text-slate-200">Physical Verification & QC Inspection</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-100">{it.productName} ({it.gsm} GSM)</span>
                        <span className="text-slate-400">Ordered Qty: <strong>{it.orderedQuantity} {it.unit}</strong></span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Received Qty</label>
                          <input
                            type="number"
                            value={it.receivedQuantity}
                            onChange={e => handleItemQtyChange(idx, 'receivedQuantity', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-emerald-400 block mb-0.5">Accepted Qty</label>
                          <input
                            type="number"
                            value={it.acceptedQuantity}
                            onChange={e => handleItemQtyChange(idx, 'acceptedQuantity', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-emerald-500/50 rounded px-2 py-1 text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-red-400 block mb-0.5">Rejected Qty</label>
                          <input
                            type="number"
                            value={it.rejectedQuantity}
                            onChange={e => handleItemQtyChange(idx, 'rejectedQuantity', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Storage Bin / Rack</label>
                          <input
                            type="text"
                            value={it.storageBinLocation}
                            onChange={e => {
                              const newItems = [...items];
                              newItems[idx].storageBinLocation = e.target.value;
                              setItems(newItems);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-700/50 text-[11px]">
                        <div>
                          <span className="text-slate-400">Moisture %: </span>
                          <input
                            type="number"
                            step="0.1"
                            value={it.inspectedMoisturePercent}
                            onChange={e => {
                              const newItems = [...items];
                              newItems[idx].inspectedMoisturePercent = Number(e.target.value);
                              setItems(newItems);
                            }}
                            className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-100 ml-1"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400">Tested GSM: </span>
                          <input
                            type="number"
                            step="0.1"
                            value={it.measuredGsm}
                            onChange={e => {
                              const newItems = [...items];
                              newItems[idx].measuredGsm = Number(e.target.value);
                              setItems(newItems);
                            }}
                            className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-100 ml-1"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400">Burst Factor: </span>
                          <input
                            type="number"
                            step="0.1"
                            value={it.burstFactor}
                            onChange={e => {
                              const newItems = [...items];
                              newItems[idx].burstFactor = Number(e.target.value);
                              setItems(newItems);
                            }}
                            className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-100 ml-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
                  Save GRN Inspection
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
                <h3 className="text-base font-bold text-emerald-400 font-mono">
                  {viewDetailModal.grnNo}
                </h3>
                <span className="text-xs text-slate-400">
                  Received on {viewDetailModal.receiptDate} • PO: {viewDetailModal.poNumber}
                </span>
              </div>
              <button onClick={() => setViewDetailModal(null)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Supplier:</span>
                <span className="text-slate-100 font-semibold">{viewDetailModal.supplierName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Warehouse:</span>
                <span className="text-slate-100 font-semibold">{viewDetailModal.warehouseName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Vehicle & Gate Entry:</span>
                <span className="text-slate-100 font-semibold">{viewDetailModal.vehicleNumber} (GE: {viewDetailModal.gateEntryNo || 'N/A'})</span>
              </div>
              <div>
                <span className="text-slate-400 block">QC Status:</span>
                <span className="font-semibold text-emerald-400">{viewDetailModal.status}</span>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5 text-center">Ordered</th>
                    <th className="p-2.5 text-center">Accepted</th>
                    <th className="p-2.5 text-center">Rejected</th>
                    <th className="p-2.5 text-center">Tested GSM/Moisture</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {viewDetailModal.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium text-slate-100">{it.productName}</td>
                      <td className="p-2.5 text-center">{it.orderedQuantity} {it.unit}</td>
                      <td className="p-2.5 text-center font-bold text-emerald-400">{it.acceptedQuantity}</td>
                      <td className="p-2.5 text-center text-red-400">{it.rejectedQuantity}</td>
                      <td className="p-2.5 text-center text-slate-300">{it.measuredGsm} GSM / {it.inspectedMoisturePercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
