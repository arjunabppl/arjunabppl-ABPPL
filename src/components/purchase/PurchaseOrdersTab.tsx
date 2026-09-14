import React, { useState } from 'react';
import { PurchaseOrder, PurchaseItem, Supplier, Product, Warehouse, PurchaseRequisition } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import {
  ShoppingCart, Plus, Search, Filter, Globe, Building2, CheckCircle2,
  XCircle, Clock, Eye, Printer, ArrowRight, Trash2, Calendar, FileText,
  DollarSign, Truck, AlertCircle
} from 'lucide-react';

interface PurchaseOrdersTabProps {
  purchases?: PurchaseOrder[];
  purchaseOrders?: PurchaseOrder[];
  suppliers?: Supplier[];
  products?: Product[];
  warehouses?: Warehouse[];
  onSavePurchase?: (data: Partial<PurchaseOrder>) => Promise<void>;
  onSavePurchaseOrder?: (data: Partial<PurchaseOrder>) => Promise<void>;
  onApprovePurchase?: (id: string) => Promise<void>;
  onApprovePurchaseOrder?: (id: string) => Promise<void>;
  onRejectPurchase?: (id: string, reason: string) => Promise<void>;
  onCancelPurchase?: (id: string) => Promise<void>;
  onCancelPurchaseOrder?: (id: string) => Promise<void>;
  onCreateShipmentFromPo?: (po: PurchaseOrder) => void;
  onCreateGrnFromPo?: (po: PurchaseOrder) => void;
  currentUserRole?: string;
  initialNewPo?: {
    requisitionId?: string;
    items?: PurchaseItem[];
    supplierId?: string;
    isImport?: boolean;
  } | null;
}

export const PurchaseOrdersTab: React.FC<PurchaseOrdersTabProps> = ({
  purchases = [],
  purchaseOrders = [],
  suppliers = [],
  products = [],
  warehouses = [],
  onSavePurchase,
  onSavePurchaseOrder,
  onApprovePurchase,
  onApprovePurchaseOrder,
  onRejectPurchase,
  onCancelPurchase,
  onCancelPurchaseOrder,
  onCreateShipmentFromPo,
  onCreateGrnFromPo,
  currentUserRole,
  initialNewPo
}) => {
  const saveHandler = onSavePurchase || onSavePurchaseOrder;
  const approveHandler = onApprovePurchase || onApprovePurchaseOrder;
  const cancelHandler = onCancelPurchase || onCancelPurchaseOrder;
  const orderList = purchases.length > 0 ? purchases : purchaseOrders;

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DOMESTIC' | 'IMPORT'>('ALL');
  const [approvalFilter, setApprovalFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [viewPoModal, setViewPoModal] = useState<PurchaseOrder | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Form State
  const [supplierId, setSupplierId] = useState(suppliers?.[0]?.id || '');
  const [isImport, setIsImport] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [incoterm, setIncoterm] = useState('FOR (Free On Road)');
  const [originCountry, setOriginCountry] = useState('India');
  const [originPort, setOriginPort] = useState('');
  const [destinationPort, setDestinationPort] = useState('Nhava Sheva (JNPT), Mumbai');
  const [warehouseId, setWarehouseId] = useState(warehouses?.[0]?.id || 'wh-1');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [lcNumber, setLcNumber] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Standard mill packing in pallets with moisture-proof wrapping.');

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      productId: products?.[0]?.id || 'p-1',
      productName: products?.[0]?.name || 'Century Star Copier Paper 75 GSM A4',
      category: (products?.[0]?.category as any) || 'Copier Paper',
      gsm: products?.[0]?.gsm || 75,
      sizeInches: products?.[0]?.sizeInches || 'A4',
      quantity: 100,
      unit: products?.[0]?.unit || 'Ream',
      rate: products?.[0]?.purchaseRate || 220,
      discountPercent: 0,
      taxPercent: 18,
      hsnCode: products?.[0]?.hsnCode || '4802',
      amount: 100 * (products?.[0]?.purchaseRate || 220)
    }
  ]);

  const selectedSupplier = (suppliers || []).find(s => s.id === supplierId);

  const filtered = (orderList || []).filter(p => {
    if (typeFilter === 'DOMESTIC' && p.isImport) return false;
    if (typeFilter === 'IMPORT' && !p.isImport) return false;
    if (approvalFilter !== 'ALL' && p.approvalStatus !== approvalFilter) return false;
    const q = (searchTerm || '').toLowerCase();
    if (q) {
      const matchNo = (p.purchaseNo || '').toLowerCase().includes(q);
      const matchSup = (p.supplierName || '').toLowerCase().includes(q);
      const matchItem = (p.items || []).some(it => (it.productName || '').toLowerCase().includes(q));
      return matchNo || matchSup || matchItem;
    }
    return true;
  });

  const handleOpenNew = () => {
    setIsImport(false);
    setCurrency('INR');
    setExchangeRate(1.0);
    setIncoterm('FOR (Free On Road)');
    setOriginCountry('India');
    if (suppliers.length > 0) setSupplierId(suppliers[0].id);
    if (products.length > 0) {
      setItems([
        {
          productId: products[0].id,
          productName: products[0].name,
          category: products[0].category,
          gsm: products[0].gsm,
          sizeInches: products[0].sizeInches,
          quantity: 100,
          unit: products[0].unit || 'Ream',
          rate: products[0].purchaseRate || 220,
          discountPercent: 0,
          taxPercent: 18,
          hsnCode: products[0].hsnCode || '4802',
          amount: 100 * (products[0].purchaseRate || 220)
        }
      ]);
    }
    setShowModal(true);
  };

  const handleSupplierChange = (sId: string) => {
    setSupplierId(sId);
    const sup = suppliers.find(s => s.id === sId);
    if (sup) {
      if (sup.currency && sup.currency !== 'INR') {
        setIsImport(true);
        setCurrency(sup.currency);
        setExchangeRate(sup.currency === 'USD' ? 86.80 : sup.currency === 'EUR' ? 94.20 : 64.50);
        setOriginCountry(sup.country || 'International');
        setIncoterm('CIF (Cost, Insurance & Freight)');
      } else {
        setIsImport(false);
        setCurrency('INR');
        setExchangeRate(1.0);
        setOriginCountry('India');
        setIncoterm('FOR (Free On Road)');
      }
      if (sup.paymentTerms) setPaymentTerms(sup.paymentTerms);
    }
  };

  const handleAddItem = () => {
    const p = products[0];
    if (!p) return;
    setItems([
      ...items,
      {
        productId: p.id,
        productName: p.name,
        category: p.category,
        gsm: p.gsm,
        sizeInches: p.sizeInches,
        quantity: 50,
        unit: p.unit || 'Ream',
        rate: isImport ? 15 : (p.purchaseRate || 200),
        discountPercent: 0,
        taxPercent: isImport ? 0 : 18,
        hsnCode: p.hsnCode || '4802',
        amount: 50 * (isImport ? 15 : (p.purchaseRate || 200))
      }
    ]);
  };

  const handleItemChange = (index: number, field: keyof PurchaseItem, val: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: val };
    if (field === 'productId') {
      const prod = products.find(p => p.id === val);
      if (prod) {
        item.productName = prod.name;
        item.category = prod.category;
        item.gsm = prod.gsm;
        item.sizeInches = prod.sizeInches;
        item.unit = prod.unit || 'Ream';
        item.hsnCode = prod.hsnCode || '4802';
        item.rate = isImport ? 15 : prod.purchaseRate;
      }
    }
    const lineSub = item.quantity * item.rate;
    const lineDiscount = lineSub * ((item.discountPercent || 0) / 100);
    item.amount = Number((lineSub - lineDiscount).toFixed(2));
    newItems[index] = item;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotalForeign = items.reduce((s, it) => s + it.amount, 0);
  const subtotalInr = currency === 'INR' ? subtotalForeign : subtotalForeign * exchangeRate;
  const taxInr = isImport ? 0 : subtotalInr * 0.18;
  const grandTotalInr = subtotalInr + taxInr;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === supplierId);
    const wh = warehouses.find(w => w.id === warehouseId);

    if (saveHandler) {
      await saveHandler({
        supplierId,
        supplierName: sup?.companyName || 'Supplier',
        isImport,
        currency,
        exchangeRate,
        incoterm,
        originCountry,
        originPort,
        destinationPort,
        warehouseId,
        warehouseName: wh?.name || 'Bhiwandi Godown',
        paymentTerms,
        lcNumber,
        expectedDeliveryDate,
        items,
        subtotalForeign,
        subtotal: subtotalInr,
        taxAmount: taxInr,
        grandTotal: grandTotalInr,
        totalAmountForeign: isImport ? subtotalForeign : undefined,
        notes,
        approvalStatus: 'PENDING',
        status: 'APPROVED'
      });
    }

    setShowModal(false);
  };

  return (
    <div className="space-y-4" id="purchase-orders-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Purchase Orders (Domestic & Import)</h3>
            <p className="text-xs text-slate-400">Formal purchase contracts with currency exchange, incoterms, and approval workflow</p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO #, supplier, or product name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg bg-slate-900/80 p-0.5 border border-slate-700">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                typeFilter === 'ALL' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('DOMESTIC')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                typeFilter === 'DOMESTIC' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Domestic
            </button>
            <button
              onClick={() => setTypeFilter('IMPORT')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                typeFilter === 'IMPORT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Imports
            </button>
          </div>

          <span className="text-slate-400 ml-2">Approval:</span>
          <select
            value={approvalFilter}
            onChange={e => setApprovalFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Approvals</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">PO Number & Date</th>
                <th className="px-4 py-3">Supplier & Origin</th>
                <th className="px-4 py-3">Items & Qty</th>
                <th className="px-4 py-3">Currency / Terms</th>
                <th className="px-4 py-3 text-right">Grand Total (INR)</th>
                <th className="px-4 py-3 text-center">Approval</th>
                <th className="px-4 py-3 text-center">Fulfillment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No purchase orders found. Click "Create Purchase Order" to issue one.
                  </td>
                </tr>
              ) : (
                filtered.map(po => (
                  <tr key={po.id} className="hover:bg-slate-750/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-emerald-400">{po.purchaseNo}</div>
                      <div className="text-[11px] text-slate-400">{po.date}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-100 flex items-center space-x-1.5">
                        <span>{po.supplierName}</span>
                        {po.isImport ? (
                          <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded text-[9px] font-bold">
                            IMPORT
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-bold">
                            DOMESTIC
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {po.originCountry || 'India'} • {po.incoterm || 'FOR'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        {po.items.map((it, idx) => (
                          <div key={idx} className="text-[11px] text-slate-200">
                            • {it.productName} ({it.quantity} {it.unit})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      <div>
                        {po.currency !== 'INR' ? (
                          <span className="font-semibold text-blue-400">
                            {po.currency} {formatNumber(po.totalAmountForeign || 0)} (Ex: ₹{po.exchangeRate})
                          </span>
                        ) : (
                          <span>INR (₹)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{po.paymentTerms}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-100">
                      {formatCurrency(po.grandTotal)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        po.approvalStatus === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : po.approvalStatus === 'REJECTED'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {po.approvalStatus || 'APPROVED'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => setViewPoModal(po)}
                        title="View / Print PO"
                        className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {po.approvalStatus === 'PENDING' && (currentUserRole === 'superadmin' || currentUserRole === 'purchase' || currentUserRole === 'admin') && (
                        <>
                          <button
                            onClick={() => approveHandler && approveHandler(po.id)}
                            title="Approve PO"
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded transition"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setRejectId(po.id);
                              setRejectReason('');
                            }}
                            title="Reject PO"
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {po.isImport && onCreateShipmentFromPo && (
                        <button
                          onClick={() => onCreateShipmentFromPo(po)}
                          title="Create Container Shipment"
                          className="px-2 py-1 bg-blue-600/80 hover:bg-blue-500 text-white rounded text-[11px] font-semibold transition inline-flex items-center space-x-1"
                        >
                          <Globe className="w-3 h-3" />
                          <span>Shipment</span>
                        </button>
                      )}

                      {!po.isImport && onCreateGrnFromPo && (
                        <button
                          onClick={() => onCreateGrnFromPo(po)}
                          title="Receive Goods (GRN)"
                          className="px-2 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition inline-flex items-center space-x-1"
                        >
                          <Truck className="w-3 h-3" />
                          <span>GRN</span>
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

      {/* Create Purchase Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">Create Purchase Order</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Supplier & Currency Header */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Supplier / Mill</label>
                  <select
                    value={supplierId}
                    onChange={e => handleSupplierChange(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.companyName} ({s.country || 'India'} - {s.currency || 'INR'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Procurement Type</label>
                  <div className="flex items-center space-x-3 mt-2">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="procType"
                        checked={!isImport}
                        onChange={() => {
                          setIsImport(false);
                          setCurrency('INR');
                          setExchangeRate(1.0);
                          setIncoterm('FOR (Free On Road)');
                          setOriginCountry('India');
                        }}
                        className="text-emerald-500"
                      />
                      <span className="text-slate-200 font-medium">Domestic</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="procType"
                        checked={isImport}
                        onChange={() => {
                          setIsImport(true);
                          setCurrency('USD');
                          setExchangeRate(86.80);
                          setIncoterm('CIF (Cost, Insurance & Freight)');
                          setOriginCountry('International');
                        }}
                        className="text-blue-500"
                      />
                      <span className="text-slate-200 font-medium">Import</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Currency & Rate</label>
                  <div className="flex space-x-1.5">
                    <select
                      value={currency}
                      onChange={e => {
                        setCurrency(e.target.value);
                        if (e.target.value === 'INR') setExchangeRate(1.0);
                        if (e.target.value === 'USD') setExchangeRate(86.80);
                        if (e.target.value === 'EUR') setExchangeRate(94.20);
                        if (e.target.value === 'SGD') setExchangeRate(64.50);
                      }}
                      className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-slate-100 focus:outline-none"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="SGD">SGD ($)</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      disabled={currency === 'INR'}
                      onChange={e => setExchangeRate(Number(e.target.value))}
                      placeholder="Ex Rate"
                      className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-slate-100 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Incoterms & Delivery */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Incoterms</label>
                  <select
                    value={incoterm}
                    onChange={e => setIncoterm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="FOR (Free On Road)">FOR (Free On Road)</option>
                    <option value="Ex-Mill / Ex-Works">Ex-Mill / Ex-Works</option>
                    <option value="FOB (Free On Board)">FOB (Free On Board)</option>
                    <option value="CIF (Cost, Insurance, Freight)">CIF (Cost, Insurance, Freight)</option>
                    <option value="CFR (Cost & Freight)">CFR (Cost & Freight)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Destination Port / Wh</label>
                  <input
                    type="text"
                    value={destinationPort}
                    onChange={e => setDestinationPort(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
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

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={e => setExpectedDeliveryDate(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-200">Line Items to Purchase</h4>
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
                  {items.map((it, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-5">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Product</label>
                          <select
                            value={it.productId}
                            onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:outline-none"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.gsm} GSM • {p.sizeInches})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Qty ({it.unit})</label>
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Rate ({currency})</label>
                          <input
                            type="number"
                            step="0.01"
                            value={it.rate}
                            onChange={e => handleItemChange(idx, 'rate', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-3 flex items-end justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Subtotal ({currency})</span>
                            <span className="font-semibold text-emerald-400 text-xs">
                              {currency} {formatNumber(it.amount)}
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

              {/* Calculations Summary */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1 text-slate-400">
                  <p>Subtotal Foreign: <strong className="text-slate-200">{currency} {formatNumber(subtotalForeign)}</strong></p>
                  {currency !== 'INR' && (
                    <p>Subtotal INR (@ ₹{exchangeRate}): <strong className="text-slate-200">{formatCurrency(subtotalInr)}</strong></p>
                  )}
                  <p>Estimated GST/IGST (18%): <strong className="text-slate-200">{formatCurrency(taxInr)}</strong></p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total PO Value (INR)</span>
                  <span className="text-xl font-bold text-emerald-400">{formatCurrency(grandTotalInr)}</span>
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
                  Save & Submit Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>Reject Purchase Order</span>
            </h3>
            <p className="text-xs text-slate-300">Enter reason for rejection:</p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Quoted rates exceed approved budget limits"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setRejectId(null)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs">
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (rejectId) {
                    if (onRejectPurchase) {
                      await onRejectPurchase(rejectId, rejectReason || 'Terms unapproved');
                    } else if (cancelHandler) {
                      await cancelHandler(rejectId);
                    }
                    setRejectId(null);
                  }
                }}
                className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold"
              >
                Reject PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View PO Printable Modal */}
      {viewPoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchase Order Voucher</span>
                <h3 className="text-lg font-bold text-emerald-400 font-mono">{viewPoModal.purchaseNo}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PO</span>
                </button>
                <button onClick={() => setViewPoModal(null)} className="text-slate-400 hover:text-slate-200">✕</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-bold text-slate-200">{viewPoModal.supplierName}</p>
                <p className="text-slate-400">{viewPoModal.originCountry || 'India'}</p>
                <p className="text-slate-400">Payment Terms: {viewPoModal.paymentTerms}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-300">Date: <strong>{viewPoModal.date}</strong></p>
                <p className="text-slate-300">Expected Delivery: <strong>{viewPoModal.expectedDeliveryDate || 'N/A'}</strong></p>
                <p className="text-slate-300">Warehouse: <strong>{viewPoModal.warehouseName}</strong></p>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-center">HSN</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Rate</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {viewPoModal.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5">
                        <span className="font-medium text-slate-100">{it.productName}</span>
                        <span className="text-[11px] text-slate-400 block">{it.gsm} GSM • {it.sizeInches}</span>
                      </td>
                      <td className="p-2.5 text-center text-slate-400">{it.hsnCode || '4802'}</td>
                      <td className="p-2.5 text-center font-semibold">{it.quantity} {it.unit}</td>
                      <td className="p-2.5 text-right">{viewPoModal.currency} {formatNumber(it.rate)}</td>
                      <td className="p-2.5 text-right font-bold text-slate-100">{viewPoModal.currency} {formatNumber(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Grand Total Amount (INR):</span>
              <span className="text-base font-bold text-emerald-400">{formatCurrency(viewPoModal.grandTotal)}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewPoModal(null)}
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
