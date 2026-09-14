import React, { useState } from 'react';
import { LandedCostCalculation, LandedCostItem, ImportShipment, PurchaseOrder, Product } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import {
  TrendingUp, Plus, Search, CheckCircle2, Calculator, ArrowRight, Eye,
  Layers, DollarSign, Percent, ShieldCheck, RefreshCw, AlertCircle, FileCheck
} from 'lucide-react';

interface LandedCostTabProps {
  calculations?: LandedCostCalculation[];
  shipments?: ImportShipment[];
  purchaseOrders?: PurchaseOrder[];
  products?: Product[];
  onSaveCalculation?: (data: Partial<LandedCostCalculation>) => Promise<void>;
  onFinalizeCalculation?: (id: string) => Promise<void>;
  selectedShipmentForCalc?: ImportShipment | null;
  currentUserRole?: string;
}

export const LandedCostTab: React.FC<LandedCostTabProps> = ({
  calculations = [],
  shipments = [],
  purchaseOrders = [],
  products = [],
  onSaveCalculation,
  onFinalizeCalculation,
  selectedShipmentForCalc,
  currentUserRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewDetailModal, setViewDetailModal] = useState<LandedCostCalculation | null>(null);

  // Form State
  const [shipmentId, setShipmentId] = useState(selectedShipmentForCalc?.id || '');
  const [allocationMethod, setAllocationMethod] = useState<'BY_WEIGHT' | 'BY_VALUE'>('BY_WEIGHT');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(86.80);
  const [fobAmountForeign, setFobAmountForeign] = useState(24500);
  const [oceanFreightForeign, setOceanFreightForeign] = useState(2200);
  const [insuranceInr, setInsuranceInr] = useState(15000);

  // Customs Duties
  const [bcdRatePct, setBcdRatePct] = useState(10);
  const [swsRatePct, setSwsRatePct] = useState(10); // 10% of BCD
  const [igstRatePct, setIgstRatePct] = useState(18);

  // Overheads
  const [portHandlingInr, setPortHandlingInr] = useState(32000);
  const [cfsHandlingInr, setCfsHandlingInr] = useState(24000);
  const [demurrageChargesInr, setDemurrageChargesInr] = useState(0);
  const [chaChargesInr, setChaChargesInr] = useState(18500);
  const [inlandTransportInr, setInlandTransportInr] = useState(38000);
  const [bankChargesInr, setBankChargesInr] = useState(8500);
  const [profitMarginPercent, setProfitMarginPercent] = useState(15);

  const [items, setItems] = useState<LandedCostItem[]>([
    {
      productId: products?.[0]?.id || 'p-1',
      productName: products?.[0]?.name || 'Stora Enso Virgin SBS Board 300 GSM',
      category: (products?.[0]?.category as any) || 'Packaging Board',
      gsm: 300,
      sizeInches: '25x36',
      quantity: 500,
      unit: 'Ream',
      netWeightKg: 13500,
      fobUnitPriceForeign: 49.00,
      fobAmountInr: 500 * 49.00 * 86.80,
      allocatedFreightInr: 0,
      allocatedInsuranceInr: 0,
      allocatedCustomsDutyInr: 0,
      allocatedOtherChargesInr: 0,
      totalLandedCostInr: 0,
      unitLandedCostInr: 0,
      costPerKgInr: 0,
      suggestedSalePriceInr: 0
    }
  ]);

  // Calculations Engine
  const fobAmountInr = fobAmountForeign * exchangeRate;
  const oceanFreightInr = oceanFreightForeign * exchangeRate;
  const cifValueInr = fobAmountInr + oceanFreightInr + insuranceInr;

  // Customs Duties math
  const basicCustomsDutyInr = (cifValueInr * bcdRatePct) / 100;
  const socialWelfareSurchargeInr = (basicCustomsDutyInr * swsRatePct) / 100;
  const totalCustomsDutyInr = basicCustomsDutyInr + socialWelfareSurchargeInr;
  const igstAmountInr = ((cifValueInr + totalCustomsDutyInr) * igstRatePct) / 100;

  const totalOtherOverheadsInr =
    portHandlingInr +
    cfsHandlingInr +
    demurrageChargesInr +
    chaChargesInr +
    inlandTransportInr +
    bankChargesInr;

  // Total Landed Expenditure
  const totalLandedCostInr = cifValueInr + totalCustomsDutyInr + totalOtherOverheadsInr;

  const totalWeightKg = items.reduce((s, it) => s + (it.netWeightKg || 1), 0);
  const totalFobInrItems = items.reduce((s, it) => s + (it.fobAmountInr || 1), 0);

  // Compute item allocations
  const computedItems: LandedCostItem[] = items.map(it => {
    const factor =
      allocationMethod === 'BY_WEIGHT'
        ? (it.netWeightKg || 1) / (totalWeightKg || 1)
        : (it.fobAmountInr || 1) / (totalFobInrItems || 1);

    const itFreight = oceanFreightInr * factor;
    const itInsurance = insuranceInr * factor;
    const itCustoms = totalCustomsDutyInr * factor;
    const itOverheads = totalOtherOverheadsInr * factor;

    const itTotalLanded = it.fobAmountInr + itFreight + itInsurance + itCustoms + itOverheads;
    const itUnitLanded = it.quantity > 0 ? itTotalLanded / it.quantity : 0;
    const itCostPerKg = it.netWeightKg > 0 ? itTotalLanded / it.netWeightKg : 0;
    const itSuggestedSale = itUnitLanded * (1 + profitMarginPercent / 100);

    return {
      ...it,
      allocatedFreightInr: Number(itFreight.toFixed(2)),
      allocatedInsuranceInr: Number(itInsurance.toFixed(2)),
      allocatedCustomsDutyInr: Number(itCustoms.toFixed(2)),
      allocatedOtherChargesInr: Number(itOverheads.toFixed(2)),
      totalLandedCostInr: Number(itTotalLanded.toFixed(2)),
      unitLandedCostInr: Number(itUnitLanded.toFixed(2)),
      costPerKgInr: Number(itCostPerKg.toFixed(2)),
      suggestedSalePriceInr: Number(itSuggestedSale.toFixed(2))
    };
  });

  const filtered = (calculations || []).filter(c => {
    const q = (searchTerm || '').toLowerCase();
    if (q) {
      return (
        (c.calculationNo || '').toLowerCase().includes(q) ||
        (c.shipmentNo && (c.shipmentNo || '').toLowerCase().includes(q)) ||
        (c.containerNumber && (c.containerNumber || '').toLowerCase().includes(q)) ||
        (c.supplierName && (c.supplierName || '').toLowerCase().includes(q)) ||
        (c.items || []).some(it => (it.productName || '').toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenNew = () => {
    if (shipments.length > 0) {
      setShipmentId(shipments[0].id);
      setCurrency(shipments[0].commercialInvoiceCurrency || 'USD');
      setFobAmountForeign(shipments[0].commercialInvoiceAmountForeign || 25000);
    }
    setShowModal(true);
  };

  const handleShipmentChange = (sId: string) => {
    setShipmentId(sId);
    const ship = shipments.find(s => s.id === sId);
    if (ship) {
      setCurrency(ship.commercialInvoiceCurrency || 'USD');
      setFobAmountForeign(ship.commercialInvoiceAmountForeign || 25000);
      if (ship.totalNetWeightKg) {
        setItems([
          {
            productId: products[0]?.id || 'p-1',
            productName: products[0]?.name || 'Imported Paper Board',
            category: 'Packaging Board',
            gsm: 300,
            sizeInches: '25x36',
            quantity: 500,
            unit: 'Ream',
            netWeightKg: ship.totalNetWeightKg,
            fobUnitPriceForeign: Number(((ship.commercialInvoiceAmountForeign || 25000) / 500).toFixed(2)),
            fobAmountInr: (ship.commercialInvoiceAmountForeign || 25000) * exchangeRate,
            allocatedFreightInr: 0,
            allocatedInsuranceInr: 0,
            allocatedCustomsDutyInr: 0,
            allocatedOtherChargesInr: 0,
            totalLandedCostInr: 0,
            unitLandedCostInr: 0,
            costPerKgInr: 0,
            suggestedSalePriceInr: 0
          }
        ]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ship = shipments.find(s => s.id === shipmentId);

    await onSaveCalculation({
      shipmentId: shipmentId || undefined,
      shipmentNo: ship?.shipmentNo,
      containerNumber: ship?.containerNumber,
      commercialInvoiceCurrency: currency,
      exchangeRate,
      fobAmountForeign,
      fobAmountInr,
      oceanFreightForeign,
      oceanFreightInr,
      insuranceInr,
      cifValueInr,
      basicCustomsDutyInr,
      socialWelfareSurchargeInr,
      totalCustomsDutyInr,
      igstAmountInr,
      portHandlingInr,
      cfsHandlingInr,
      demurrageChargesInr,
      chaChargesInr,
      inlandTransportInr,
      bankChargesInr,
      otherChargesInr: 0,
      totalLandedCostInr,
      allocationMethod,
      items: computedItems,
      suggestedProfitMarginPercent: profitMarginPercent,
      isFinalized: false
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-4" id="landed-cost-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Landed Cost Engine & Inventory Valuation</h3>
            <p className="text-xs text-slate-400">
              Calculate FOB to CIF, Customs Duties (BCD+SWS), Demurrage, Port Handling, and update Product Master valuations
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Landed Cost Calculation</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Landed Cost #, Shipment #, Container #, or Paper Grade..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Calculations Grid */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400 text-xs">
            No landed cost calculations found. Click "New Landed Cost Calculation" to compute exact import landing costs.
          </div>
        ) : (
          filtered.map(calc => (
            <div
              key={calc.id}
              className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-600 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-amber-400 text-sm">{calc.calculationNo}</span>
                    {calc.isFinalized ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>FINALIZED & VALUATION SYNCED</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        DRAFT CALCULATION
                      </span>
                    )}
                    {calc.shipmentNo && (
                      <span className="text-[11px] text-slate-400">
                        Shipment: <strong className="text-slate-200">{calc.shipmentNo}</strong> ({calc.containerNumber})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Calculated by {calc.calculatedBy} on {calc.calculationDate} • Allocation by {calc.allocationMethod}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {!calc.isFinalized && (currentUserRole === 'superadmin' || currentUserRole === 'accounts' || currentUserRole === 'admin') && (
                    <button
                      onClick={() => onFinalizeCalculation(calc.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Finalize & Sync Valuation</span>
                    </button>
                  )}

                  <button
                    onClick={() => setViewDetailModal(calc)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Breakdown</span>
                  </button>
                </div>
              </div>

              {/* Four Cost Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">1. CIF Value</span>
                  <span className="font-bold text-slate-100 text-sm">{formatCurrency(calc.cifValueInr)}</span>
                  <span className="text-[10px] text-slate-500 block">
                    FOB {calc.commercialInvoiceCurrency} {formatNumber(calc.fobAmountForeign)} + Freight
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">2. Customs Duty (BCD+SWS)</span>
                  <span className="font-bold text-amber-400 text-sm">{formatCurrency(calc.totalCustomsDutyInr)}</span>
                  <span className="text-[10px] text-slate-500 block">
                    BCD {formatCurrency(calc.basicCustomsDutyInr)} + SWS
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">3. Port / CHA / Demurrage</span>
                  <span className="font-bold text-blue-400 text-sm">
                    {formatCurrency(
                      calc.portHandlingInr + calc.cfsHandlingInr + calc.demurrageChargesInr + calc.chaChargesInr + calc.inlandTransportInr + calc.bankChargesInr
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Clearance & Inland freight</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Total Landed INR</span>
                  <span className="font-bold text-emerald-400 text-base">{formatCurrency(calc.totalLandedCostInr)}</span>
                  <span className="text-[10px] text-slate-500 block">Net landed cost to warehouse</span>
                </div>
              </div>

              {/* Items Landed Breakdown */}
              <div className="bg-slate-950/40 rounded-lg p-3 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-300 mb-2">Item Landing Rate & Suggested Selling Price:</div>
                <div className="space-y-2">
                  {calc.items.map((it, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 pb-1.5 border-b border-slate-800/80 last:border-none">
                      <div>
                        <span className="font-medium text-slate-200">{it.productName}</span>
                        <span className="text-[11px] text-slate-400 block">
                          {it.quantity} {it.unit} • {formatNumber((it.netWeightKg || 0) / 1000)} MT
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-right">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Unit Landed Cost</span>
                          <span className="font-bold text-amber-400">₹{it.unitLandedCostInr} / {it.unit}</span>
                          <span className="text-[10px] text-slate-500 block">₹{it.costPerKgInr} / KG</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Suggested Selling (+{calc.suggestedProfitMarginPercent}%)</span>
                          <span className="font-bold text-emerald-400">₹{it.suggestedSalePriceInr} / {it.unit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Interactive Landed Cost Engine Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">Landed Cost Calculation Engine</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Linked Shipment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Select Import Container Shipment</label>
                  <select
                    value={shipmentId}
                    onChange={e => handleShipmentChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Direct Landed Cost Entry --</option>
                    {shipments.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.shipmentNo} — {s.containerNumber} ({s.commercialInvoiceCurrency} {formatNumber(s.commercialInvoiceAmountForeign)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cost Allocation Method</label>
                  <select
                    value={allocationMethod}
                    onChange={e => setAllocationMethod(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="BY_WEIGHT">By Weight (Metric Tons / KG)</option>
                    <option value="BY_VALUE">By Value (FOB Amount %)</option>
                  </select>
                </div>
              </div>

              {/* 1. FOB & Freight */}
              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
                <h4 className="font-semibold text-slate-200">1. FOB Invoice & Ocean/Air Freight</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-0.5">FOB Value ({currency})</label>
                    <input
                      type="number"
                      value={fobAmountForeign}
                      onChange={e => setFobAmountForeign(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Exchange Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={e => setExchangeRate(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Ocean Freight ({currency})</label>
                    <input
                      type="number"
                      value={oceanFreightForeign}
                      onChange={e => setOceanFreightForeign(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Marine Insurance (INR)</label>
                    <input
                      type="number"
                      value={insuranceInr}
                      onChange={e => setInsuranceInr(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100"
                    />
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-300">
                  Assessable CIF Value: <strong className="text-emerald-400">{formatCurrency(cifValueInr)}</strong>
                </div>
              </div>

              {/* 2. Customs Duties */}
              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
                <h4 className="font-semibold text-slate-200">2. Statutory Customs Duties</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-0.5">Basic Customs Duty (BCD %)</label>
                    <input
                      type="number"
                      value={bcdRatePct}
                      onChange={e => setBcdRatePct(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{formatCurrency(basicCustomsDutyInr)}</span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">Social Welfare (SWS % on BCD)</label>
                    <input
                      type="number"
                      value={swsRatePct}
                      onChange={e => setSwsRatePct(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{formatCurrency(socialWelfareSurchargeInr)}</span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-0.5">IGST Rate (%)</label>
                    <input
                      type="number"
                      value={igstRatePct}
                      onChange={e => setIgstRatePct(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{formatCurrency(igstAmountInr)} (ITC input credit)</span>
                  </div>
                </div>
              </div>

              {/* 3. Port, Demurrage & Handling */}
              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
                <h4 className="font-semibold text-slate-200">3. Port, CHA, Demurrage & Inland Freight (INR)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">THC / Port</label>
                    <input
                      type="number"
                      value={portHandlingInr}
                      onChange={e => setPortHandlingInr(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">CFS Storage</label>
                    <input
                      type="number"
                      value={cfsHandlingInr}
                      onChange={e => setCfsHandlingInr(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Demurrage</label>
                    <input
                      type="number"
                      value={demurrageChargesInr}
                      onChange={e => setDemurrageChargesInr(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">CHA Agency</label>
                    <input
                      type="number"
                      value={chaChargesInr}
                      onChange={e => setChaChargesInr(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Inland Truck</label>
                    <input
                      type="number"
                      value={inlandTransportInr}
                      onChange={e => setInlandTransportInr(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Bank LC Fee</label>
                    <input
                      type="number"
                      value={bankChargesInr}
                      onChange={e => setBankChargesInr(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Total Summary Footer */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div>
                  <span className="text-xs text-slate-400 block">Total Landed Cost Expenditure (INR)</span>
                  <span className="text-xl font-bold text-amber-400">{formatCurrency(totalLandedCostInr)}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <label className="text-xs text-slate-300">Target Profit Margin (%):</label>
                  <input
                    type="number"
                    value={profitMarginPercent}
                    onChange={e => setProfitMarginPercent(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs"
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
                >
                  Save Landed Cost Calculation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewDetailModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-amber-400 font-mono">
                  {viewDetailModal.calculationNo}
                </h3>
                <span className="text-xs text-slate-400">
                  Shipment: {viewDetailModal.shipmentNo || 'N/A'} • {viewDetailModal.containerNumber}
                </span>
              </div>
              <button onClick={() => setViewDetailModal(null)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">FOB Foreign:</span>
                <span className="font-semibold text-slate-200">{viewDetailModal.commercialInvoiceCurrency} {formatNumber(viewDetailModal.fobAmountForeign)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Exchange Rate:</span>
                <span className="font-semibold text-slate-200">₹{viewDetailModal.exchangeRate}</span>
              </div>
              <div>
                <span className="text-slate-400 block">CIF Value:</span>
                <span className="font-semibold text-emerald-400">{formatCurrency(viewDetailModal.cifValueInr)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Customs Duty:</span>
                <span className="font-semibold text-amber-400">{formatCurrency(viewDetailModal.totalCustomsDutyInr)}</span>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Landed Unit Rate</th>
                    <th className="p-2.5 text-right">Cost / KG</th>
                    <th className="p-2.5 text-right">Suggested Sale Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {viewDetailModal.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium text-slate-100">{it.productName}</td>
                      <td className="p-2.5 text-center">{it.quantity} {it.unit}</td>
                      <td className="p-2.5 text-right font-bold text-amber-400">₹{it.unitLandedCostInr}</td>
                      <td className="p-2.5 text-right text-slate-300">₹{it.costPerKgInr}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-400">₹{it.suggestedSalePriceInr}</td>
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
