import React, { useState } from 'react';
import { ImportShipment, PurchaseOrder, Supplier, Warehouse, ShipmentTimelineEvent } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import {
  Globe, Plus, Search, Filter, Anchor, Truck, ShieldCheck, CheckCircle2,
  Clock, ArrowRight, Eye, Calendar, Package, Layers, FileText, AlertCircle,
  TrendingUp, MapPin
} from 'lucide-react';

interface ImportShipmentsTabProps {
  shipments?: ImportShipment[];
  purchaseOrders?: PurchaseOrder[];
  suppliers?: Supplier[];
  warehouses?: Warehouse[];
  onSaveShipment?: (data: Partial<ImportShipment>) => Promise<void>;
  onUpdateTimeline?: (id: string, status: string, location: string, description: string) => Promise<void>;
  onOpenLandedCost?: (shipment: ImportShipment) => void;
  onOpenLandedCostForShipment?: (shipment: ImportShipment) => void;
  currentUserRole?: string;
}

const LIFECYCLE_STAGES = [
  'PLANNED',
  'CONFIRMED',
  'PRODUCTION',
  'SHIPPED',
  'IN_TRANSIT',
  'ARRIVED_AT_PORT',
  'CUSTOMS_CLEARED',
  'IN_CFS',
  'OUT_FOR_DELIVERY',
  'DELIVERED_TO_WAREHOUSE',
  'CLOSED'
];

export const ImportShipmentsTab: React.FC<ImportShipmentsTabProps> = ({
  shipments = [],
  purchaseOrders = [],
  suppliers = [],
  warehouses = [],
  onSaveShipment,
  onUpdateTimeline,
  onOpenLandedCost,
  onOpenLandedCostForShipment,
  currentUserRole
}) => {
  const openLandedCostHandler = onOpenLandedCost || onOpenLandedCostForShipment;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [viewDetailShipment, setViewDetailShipment] = useState<ImportShipment | null>(null);
  const [timelineModal, setTimelineModal] = useState<ImportShipment | null>(null);

  // Timeline Update Form State
  const [nextStatus, setNextStatus] = useState('ARRIVED_AT_PORT');
  const [eventLocation, setEventLocation] = useState('Nhava Sheva (JNPT) Terminal 4');
  const [eventDescription, setEventDescription] = useState('Vessel berthed. Container discharged onto yard.');

  // Create Shipment Form State
  const [poId, setPoId] = useState('');
  const [containerNumber, setContainerNumber] = useState('MSKU-829102-4');
  const [containerType, setContainerType] = useState('40ft High Cube');
  const [sealNumber, setSealNumber] = useState('SL-99210');
  const [billOfLadingNo, setBillOfLadingNo] = useState('BL-MAEU-982182');
  const [shippingLine, setShippingLine] = useState('Maersk Line');
  const [vesselName, setVesselName] = useState('M/V Mumbai Express');
  const [billOfEntryNo, setBillOfEntryNo] = useState('BOE-2026-88192');
  const [billOfEntryDate, setBillOfEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [customsHouseAgent, setCustomsHouseAgent] = useState('TransIndia Logistics & CHA Services');
  const [originCountry, setOriginCountry] = useState('Finland');
  const [originPort, setOriginPort] = useState('Port of Helsinki');
  const [destinationPort, setDestinationPort] = useState('Nhava Sheva (JNPT), Mumbai');
  const [etd, setEtd] = useState(new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [eta, setEta] = useState(new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [commercialInvoiceNo, setCommercialInvoiceNo] = useState('CI-FI-2026-09');
  const [commercialInvoiceAmount, setCommercialInvoiceAmount] = useState(24500);
  const [currency, setCurrency] = useState('USD');
  const [totalGrossWeightKg, setTotalGrossWeightKg] = useState(26000);
  const [totalNetWeightKg, setTotalNetWeightKg] = useState(24800);
  const [destinationWarehouseId, setDestinationWarehouseId] = useState(warehouses?.[0]?.id || 'wh-1');

  const filtered = (shipments || []).filter(s => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    const q = (searchTerm || '').toLowerCase();
    if (q) {
      return (
        (s.shipmentNo || '').toLowerCase().includes(q) ||
        (s.containerNumber || '').toLowerCase().includes(q) ||
        (s.billOfLadingNo || '').toLowerCase().includes(q) ||
        (s.supplierName || '').toLowerCase().includes(q) ||
        (s.billOfEntryNo && (s.billOfEntryNo || '').toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenNew = () => {
    const importPos = (purchaseOrders || []).filter(p => p.isImport);
    if (importPos.length > 0) {
      setPoId(importPos[0].id);
      setOriginCountry(importPos[0].originCountry || 'Finland');
    }
    setShowModal(true);
  };

  const handlePoSelectionChange = (selectedId: string) => {
    setPoId(selectedId);
    const po = (purchaseOrders || []).find(p => p.id === selectedId);
    if (po) {
      setOriginCountry(po.originCountry || 'International');
      if (po.currency) setCurrency(po.currency);
      if (po.totalAmountForeign) setCommercialInvoiceAmount(po.totalAmountForeign);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const po = purchaseOrders.find(p => p.id === poId);
    const wh = warehouses.find(w => w.id === destinationWarehouseId);

    await onSaveShipment({
      poId: poId || undefined,
      poNumber: po?.purchaseNo,
      supplierId: po?.supplierId || suppliers[0]?.id,
      supplierName: po?.supplierName || suppliers[0]?.companyName || 'Supplier',
      containerNumber,
      containerType,
      sealNumber,
      billOfLadingNo,
      shippingLine,
      vesselName,
      billOfEntryNo,
      billOfEntryDate,
      customsHouseAgent,
      originCountry,
      originPort,
      destinationPort,
      etd,
      eta,
      commercialInvoiceNo,
      commercialInvoiceAmountForeign: commercialInvoiceAmount,
      commercialInvoiceCurrency: currency,
      totalGrossWeightKg,
      totalNetWeightKg,
      destinationWarehouseId,
      destinationWarehouseName: wh?.name || 'Bhiwandi Central Godown',
      status: 'IN_TRANSIT',
      timeline: [
        {
          status: 'SHIPPED',
          date: etd,
          location: originPort,
          description: `Container loaded on ${vesselName}. BL ${billOfLadingNo} issued.`
        }
      ]
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-4" id="import-shipments-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Import Shipments & Container Tracking</h3>
            <p className="text-xs text-slate-400">Track marine transit, container numbers, Bill of Entry, and Customs Clearance</p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Container Shipment</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Shipment #, Container #, BL #, or Bill of Entry..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Stage:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Stages</option>
            {LIFECYCLE_STAGES.map(st => (
              <option key={st} value={st}>{(st || '').replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Shipments Cards Grid */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400 text-xs">
            No import shipments found. Click "New Container Shipment" to track overseas cargo.
          </div>
        ) : (
          filtered.map(ship => {
            const currentStageIndex = LIFECYCLE_STAGES.indexOf(ship.status);

            return (
              <div
                key={ship.id}
                className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-600 transition"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-400 text-sm">{ship.shipmentNo}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {ship.containerNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-300">
                        {ship.containerType || '40ft HC'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-medium">
                      {ship.supplierName} ({ship.originCountry}) • BL: <span className="font-mono">{ship.billOfLadingNo}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setTimelineModal(ship);
                        setNextStatus(
                          currentStageIndex < LIFECYCLE_STAGES.length - 1
                            ? LIFECYCLE_STAGES[currentStageIndex + 1]
                            : ship.status
                        );
                      }}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>Update Status</span>
                    </button>

                    {onOpenLandedCostForShipment && (
                      <button
                        onClick={() => onOpenLandedCostForShipment(ship)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Landed Cost</span>
                      </button>
                    )}

                    <button
                      onClick={() => setViewDetailShipment(ship)}
                      className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stepper Progress Bar */}
                <div className="py-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 font-medium">
                    <span>Shipped ({ship.etd})</span>
                    <span className="font-bold text-blue-400 uppercase">
                      Current Stage: {(ship.status || '').replace(/_/g, ' ')}
                    </span>
                    <span>ETA ({ship.eta})</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(10, ((currentStageIndex + 1) / LIFECYCLE_STAGES.length) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Details Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Commercial Invoice</span>
                    <span className="font-bold text-emerald-400">
                      {ship.commercialInvoiceCurrency} {formatNumber(ship.commercialInvoiceAmountForeign)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Vessel & Shipping Line</span>
                    <span className="text-slate-200 font-medium">
                      {ship.shippingLine} ({ship.vesselName || 'N/A'})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Bill of Entry (BOE)</span>
                    <span className="text-slate-200 font-mono font-medium">
                      {ship.billOfEntryNo || 'Pending Filing'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Weight & Target Wh</span>
                    <span className="text-slate-200">
                      {formatNumber(ship.totalNetWeightKg / 1000)} MT • {ship.destinationWarehouseName}
                    </span>
                  </div>
                </div>

                {/* Latest Timeline Event */}
                {ship.timeline && ship.timeline.length > 0 && (
                  <div className="text-[11px] text-slate-400 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        <strong className="text-slate-300">Latest Event:</strong> {ship.timeline[ship.timeline.length - 1].description} ({ship.timeline[ship.timeline.length - 1].location})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{ship.timeline[ship.timeline.length - 1].date}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Shipment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-slate-100">Create Container Import Shipment</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Linked Import Purchase Order</label>
                  <select
                    value={poId}
                    onChange={e => handlePoSelectionChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Direct Shipment (Without PO) --</option>
                    {purchaseOrders.map(po => (
                      <option key={po.id} value={po.id}>
                        {po.purchaseNo} — {po.supplierName} ({po.currency} {formatNumber(po.grandTotal)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Origin Country</label>
                  <input
                    type="text"
                    value={originCountry}
                    onChange={e => setOriginCountry(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Container Number</label>
                  <input
                    type="text"
                    value={containerNumber}
                    onChange={e => setContainerNumber(e.target.value)}
                    placeholder="e.g. MSKU-829102-4"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Container Type</label>
                  <select
                    value={containerType}
                    onChange={e => setContainerType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="40ft High Cube">40ft High Cube</option>
                    <option value="20ft Standard">20ft Standard</option>
                    <option value="40ft Standard">40ft Standard</option>
                    <option value="Break Bulk / Reel Vessel">Break Bulk / Reel Vessel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Seal Number</label>
                  <input
                    type="text"
                    value={sealNumber}
                    onChange={e => setSealNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bill of Lading (BL) #</label>
                  <input
                    type="text"
                    value={billOfLadingNo}
                    onChange={e => setBillOfLadingNo(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shipping Line</label>
                  <input
                    type="text"
                    value={shippingLine}
                    onChange={e => setShippingLine(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vessel / Voyage</label>
                  <input
                    type="text"
                    value={vesselName}
                    onChange={e => setVesselName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bill of Entry (BOE) #</label>
                  <input
                    type="text"
                    value={billOfEntryNo}
                    onChange={e => setBillOfEntryNo(e.target.value)}
                    placeholder="BOE Number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customs CHA Agent</label>
                  <input
                    type="text"
                    value={customsHouseAgent}
                    onChange={e => setCustomsHouseAgent(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Destination Warehouse</label>
                  <select
                    value={destinationWarehouseId}
                    onChange={e => setDestinationWarehouseId(e.target.value)}
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
                  <label className="block text-slate-300 font-semibold mb-1">Invoice Value</label>
                  <div className="flex space-x-1">
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="w-1/3 bg-slate-800 border border-slate-700 rounded px-1.5 py-2 text-slate-100"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="INR">INR</option>
                    </select>
                    <input
                      type="number"
                      value={commercialInvoiceAmount}
                      onChange={e => setCommercialInvoiceAmount(Number(e.target.value))}
                      className="w-2/3 bg-slate-800 border border-slate-700 rounded px-2 py-2 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Net Weight (KG)</label>
                  <input
                    type="number"
                    value={totalNetWeightKg}
                    onChange={e => setTotalNetWeightKg(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ETD (Dispatch)</label>
                  <input
                    type="date"
                    value={etd}
                    onChange={e => setEtd(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ETA (Arrival)</label>
                  <input
                    type="date"
                    value={eta}
                    onChange={e => setEta(e.target.value)}
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  Track Container Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Timeline Modal */}
      {timelineModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-blue-400 flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Update Container Status / Location</span>
            </h3>
            <p className="text-xs text-slate-300">
              Container: <strong>{timelineModal.containerNumber}</strong> ({timelineModal.shipmentNo})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Next Lifecycle Stage</label>
                <select
                  value={nextStatus}
                  onChange={e => setNextStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                >
                  {LIFECYCLE_STAGES.map(st => (
                    <option key={st} value={st}>{(st || '').replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Current Physical Location</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={e => setEventLocation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Event Remarks / Log</label>
                <textarea
                  rows={2}
                  value={eventDescription}
                  onChange={e => setEventDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setTimelineModal(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onUpdateTimeline(timelineModal.id, nextStatus, eventLocation, eventDescription);
                  setTimelineModal(null);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
              >
                Update Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewDetailShipment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-blue-400 font-mono">
                  {viewDetailShipment.shipmentNo} — {viewDetailShipment.containerNumber}
                </h3>
                <span className="text-xs text-slate-400">{viewDetailShipment.shippingLine} • BL {viewDetailShipment.billOfLadingNo}</span>
              </div>
              <button onClick={() => setViewDetailShipment(null)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Supplier:</span>
                <span className="text-slate-100 font-semibold">{viewDetailShipment.supplierName} ({viewDetailShipment.originCountry})</span>
              </div>
              <div>
                <span className="text-slate-400 block">Bill of Entry (BOE):</span>
                <span className="text-slate-100 font-semibold">{viewDetailShipment.billOfEntryNo || 'Pending'} ({viewDetailShipment.billOfEntryDate || 'N/A'})</span>
              </div>
              <div>
                <span className="text-slate-400 block">Customs House Agent (CHA):</span>
                <span className="text-slate-100 font-semibold">{viewDetailShipment.customsHouseAgent || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Destination Warehouse:</span>
                <span className="text-slate-100 font-semibold">{viewDetailShipment.destinationWarehouseName}</span>
              </div>
            </div>

            {/* Timeline history */}
            <div className="border-t border-slate-800 pt-3">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">Transit & Milestone Timeline</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {viewDetailShipment.timeline?.map((ev, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
                    <div className="flex items-center justify-between font-semibold text-blue-400">
                      <span>{(ev.status || '').replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-slate-500">{ev.date}</span>
                    </div>
                    <p className="text-slate-300 mt-0.5">{ev.description}</p>
                    <span className="text-[10px] text-slate-500 block">Location: {ev.location}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewDetailShipment(null)}
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
