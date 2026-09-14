import React, { useState } from 'react';
import { SalesOrder, Transporter, Warehouse, DeliveryChallan } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import { Package, Truck, X, CheckCircle2, AlertCircle, Layers } from 'lucide-react';

interface PackingDispatchModalProps {
  order: SalesOrder;
  mode: 'PACK' | 'DISPATCH' | 'DELIVER' | 'PAY';
  transporters: Transporter[];
  warehouses: Warehouse[];
  onClose: () => void;
  onConfirmPack: (data: { totalPackages: number; packageType: string; notes: string }) => Promise<void>;
  onConfirmDispatch: (data: {
    transporterName: string;
    transporterId?: string;
    vehicleNumber: string;
    lrGrNo: string;
    lrGrDate: string;
    driverPhone?: string;
    warehouseId: string;
    totalPackages: number;
    packageType: string;
    deliveryRemarks?: string;
    itemDispatches: { productId: string; dispatchedQty: number }[];
  }) => Promise<void>;
  onConfirmDeliver: (data: { actualDeliveryDate: string; receivedBy: string; deliveryRemarks: string }) => Promise<void>;
}

export const PackingDispatchModal: React.FC<PackingDispatchModalProps> = ({
  order,
  mode,
  transporters,
  warehouses,
  onClose,
  onConfirmPack,
  onConfirmDispatch,
  onConfirmDeliver
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Packing State
  const [totalPackages, setTotalPackages] = useState<number>(10);
  const [packageType, setPackageType] = useState<string>('Heavy Wooden Pallets & Shrink Bundles');
  const [packNotes, setPackNotes] = useState<string>('Moisture-proof poly-wrapping with corner edge protectors.');

  // Dispatch State
  const [selectedTransporter, setSelectedTransporter] = useState<string>(
    order.transporterName || (transporters[0]?.name || 'Mahalaxmi Freight Carriers')
  );
  const [selectedTransporterId, setSelectedTransporterId] = useState<string>(
    order.transporterId || (transporters[0]?.id || '')
  );
  const [vehicleNumber, setVehicleNumber] = useState<string>(order.vehicleNumber || 'MH-04-GP-9912');
  const [lrGrNo, setLrGrNo] = useState<string>(order.lrGrNo || `LR-${Date.now().toString().slice(-6)}`);
  const [lrGrDate, setLrGrDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [driverPhone, setDriverPhone] = useState<string>('+91 98200 44112');
  const [warehouseId, setWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-1');
  const [deliveryRemarks, setDeliveryRemarks] = useState<string>('Urgent commercial press dispatch. Deliver during business hours.');
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    order.items.forEach(it => {
      if (it.productId) {
        const remaining = it.quantity - (it.dispatchedQty || 0);
        map[it.productId] = Math.max(0, remaining);
      }
    });
    return map;
  });

  // Delivery State
  const [actualDeliveryDate, setActualDeliveryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receivedBy, setReceivedBy] = useState<string>(order.customerName);
  const [receiveRemarks, setReceiveRemarks] = useState<string>('Goods received in undamaged condition. Verified count.');

  const handleTransporterChange = (name: string) => {
    setSelectedTransporter(name);
    const tr = transporters.find(t => t.name === name);
    if (tr) {
      setSelectedTransporterId(tr.id);
      if (tr.contactNumber) setDriverPhone(tr.contactNumber);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (mode === 'PACK') {
        await onConfirmPack({
          totalPackages: Number(totalPackages),
          packageType,
          notes: packNotes
        });
      } else if (mode === 'DISPATCH') {
        if (!selectedTransporter) throw new Error('Please select a Transporter');
        if (!vehicleNumber) throw new Error('Please enter Vehicle Number');
        if (!lrGrNo) throw new Error('Please enter LR / GR Number');

        const itemDispatches = Object.entries(itemQuantities).map(([productId, dispatchedQty]) => ({
          productId,
          dispatchedQty: Number(dispatchedQty)
        }));

        await onConfirmDispatch({
          transporterName: selectedTransporter,
          transporterId: selectedTransporterId,
          vehicleNumber,
          lrGrNo,
          lrGrDate,
          driverPhone,
          warehouseId,
          totalPackages: Number(totalPackages),
          packageType,
          deliveryRemarks,
          itemDispatches
        });
      } else if (mode === 'DELIVER') {
        await onConfirmDeliver({
          actualDeliveryDate,
          receivedBy,
          deliveryRemarks: receiveRemarks
        });
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white">
              {mode === 'PACK' && <Package className="w-5 h-5" />}
              {mode === 'DISPATCH' && <Truck className="w-5 h-5" />}
              {mode === 'DELIVER' && <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {mode === 'PACK' && 'Pack Order for Dispatch'}
                {mode === 'DISPATCH' && 'Dispatch Order & Generate Delivery Challan'}
                {mode === 'DELIVER' && 'Confirm Order Delivery & Acknowledgment'}
              </h2>
              <p className="text-xs text-slate-400">
                Sales Order: <strong className="text-emerald-400">#{order.orderNo}</strong> • {order.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* MODE: PACK */}
          {mode === 'PACK' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Number of Packages / Bundles *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalPackages}
                    onChange={(e) => setTotalPackages(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Packaging Format *
                  </label>
                  <select
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="Carton Boxes & Strapping">Carton Boxes & Strapping</option>
                    <option value="Shrink-Wrapped Wooden Pallets">Shrink-Wrapped Wooden Pallets</option>
                    <option value="Kraft Bundles (Moisture Proof)">Kraft Bundles (Moisture Proof)</option>
                    <option value="Heavy Duty Palletised Rolls">Heavy Duty Palletised Rolls</option>
                    <option value="Corrugated Master Cartons">Corrugated Master Cartons</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Packing Slip Remarks / Godown Notes
                </label>
                <textarea
                  rows={3}
                  value={packNotes}
                  onChange={(e) => setPackNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  placeholder="E.g., All 4 edges protected, moisture-resistant barrier included..."
                />
              </div>
            </div>
          )}

          {/* MODE: DISPATCH */}
          {mode === 'DISPATCH' && (
            <div className="space-y-4">
              
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
                <div>
                  <span className="font-bold">Stock will be deducted from Central Godown</span>
                  <p className="text-[11px] text-emerald-800">A Delivery Challan & Packing Slip with official serial number will be generated automatically.</p>
                </div>
                <Truck className="w-6 h-6 text-emerald-700 shrink-0" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dispatch Warehouse / Godown *
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500"
                  >
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name} ({wh.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Transporter Name *
                  </label>
                  <input
                    type="text"
                    required
                    list="transporters-list"
                    value={selectedTransporter}
                    onChange={(e) => handleTransporterChange(e.target.value)}
                    placeholder="E.g. Mahalaxmi Roadlines"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500"
                  />
                  <datalist id="transporters-list">
                    {transporters.map(t => (
                      <option key={t.id} value={t.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Truck / Vehicle No *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="MH-04-AB-1234"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 uppercase focus:bg-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    LR / GR Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={lrGrNo}
                    onChange={(e) => setLrGrNo(e.target.value.toUpperCase())}
                    placeholder="LR-98213"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 uppercase focus:bg-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    LR / Dispatch Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={lrGrDate}
                    onChange={(e) => setLrGrDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Items dispatch breakdown (supports partial delivery) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Dispatched Items & Quantities
                </div>
                <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                  {order.items.map((it) => {
                    const remaining = it.quantity - (it.dispatchedQty || 0);
                    const currentQty = itemQuantities[it.productId || ''] ?? remaining;

                    return (
                      <div key={it.id || it.productId} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-none">
                        <div>
                          <span className="font-bold text-slate-900">{it.productName}</span>
                          <span className="block text-[11px] text-slate-500">{it.gsm} GSM • {it.sizeInches || 'A4'} • Total: {it.quantity} {it.unit}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-slate-500">Dispatch:</span>
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={currentQty}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(remaining, Number(e.target.value)));
                              setItemQuantities(prev => ({ ...prev, [it.productId || '']: val }));
                            }}
                            className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-right text-emerald-900 focus:bg-white focus:border-emerald-500"
                          />
                          <span className="text-[11px] font-semibold text-slate-600">{it.unit || 'Ream'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Delivery Remarks / Driver Instructions
                </label>
                <textarea
                  rows={2}
                  value={deliveryRemarks}
                  onChange={(e) => setDeliveryRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-emerald-500"
                  placeholder="Transport instructions..."
                />
              </div>
            </div>
          )}

          {/* MODE: DELIVER */}
          {mode === 'DELIVER' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Actual Delivery Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={actualDeliveryDate}
                    onChange={(e) => setActualDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Received By (Person / Incharge) *
                  </label>
                  <input
                    type="text"
                    required
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    placeholder="E.g. Mr. Ramesh Gupta (Store Incharge)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Receiver Signature Notes / Condition of Goods
                </label>
                <textarea
                  rows={3}
                  value={receiveRemarks}
                  onChange={(e) => setReceiveRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-emerald-500"
                  placeholder="Confirmed receipt of all reams, packaging intact..."
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition shadow-md flex items-center space-x-2"
            >
              {submitting ? (
                <span>Processing...</span>
              ) : (
                <>
                  {mode === 'PACK' && <span>Confirm Packing</span>}
                  {mode === 'DISPATCH' && <span>Issue Challan & Dispatch</span>}
                  {mode === 'DELIVER' && <span>Mark as Delivered</span>}
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
