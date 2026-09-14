import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import {
  Product, StockMovement, Warehouse, StockTransfer, StockAdjustment,
  StockReservation, InventorySummary, StockMovementType, StockReferenceDocType
} from '../types/index.js';
import { formatCurrency, formatNumber } from '../utils/paperMath.js';
import {
  Package, ArrowUpRight, ArrowDownLeft, RefreshCw, AlertTriangle, X,
  Building2, ArrowLeftRight, FileCheck, BookmarkCheck, History, Plus,
  Search, Filter, ShieldCheck, CheckCircle2, AlertCircle, Truck, FileText,
  Boxes, Layers, Info
} from 'lucide-react';

type TabType = 'PRODUCT_STOCK' | 'WAREHOUSE_STOCK' | 'TRANSFERS' | 'ADJUSTMENTS' | 'RESERVATIONS' | 'AUDIT_TRAIL';

export const InventoryOverview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('PRODUCT_STOCK');
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [reservations, setReservations] = useState<StockReservation[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showOpeningStockModal, setShowOpeningStockModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);

  // Form states
  // 1. Movement Form
  const [movForm, setMovForm] = useState({
    productId: '',
    warehouseId: '',
    type: 'STOCK_IN' as StockMovementType,
    quantity: 10,
    referenceDocType: 'PURCHASE_RECEIPT' as StockReferenceDocType,
    referenceNo: '',
    reason: 'Stock Inward from Mill'
  });

  // 2. Transfer Form
  const [trfForm, setTrfForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    productId: '',
    quantity: 10,
    referenceDocNo: '',
    reason: 'Stock rebalancing between godowns',
    transporterName: 'Local Paper Logistics',
    vehicleNo: 'MH-04-AB-1234',
    notes: ''
  });

  // 3. Adjustment Form
  const [adjForm, setAdjForm] = useState({
    warehouseId: '',
    productId: '',
    adjustmentType: 'ADD' as 'ADD' | 'DEDUCT',
    quantity: 5,
    reasonCode: 'CYCLE_COUNT_SURPLUS' as StockAdjustment['reasonCode'],
    referenceDocNo: '',
    remarks: 'Physical godown audit variance adjustment',
    physicalCountedQty: 0
  });

  // 4. Reservation Form
  const [resForm, setResForm] = useState({
    productId: '',
    warehouseId: '',
    quantity: 10,
    salesOrderRef: '',
    customerName: '',
    notes: 'Hold stock for confirmed sales contract'
  });

  // 5. Opening Stock Form
  const [opForm, setOpForm] = useState({
    productId: '',
    warehouseId: '',
    openingStock: 0,
    referenceNo: 'OB-SETUP-2026',
    remarks: 'Initial stock calibration'
  });

  // 6. Warehouse Form
  const [whForm, setWhForm] = useState<Partial<Warehouse>>({
    code: '',
    name: '',
    location: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    capacityTon: 500,
    managerName: '',
    contactPhone: '',
    isDefault: false
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [pList, wList, mList, tList, aList, rList, sum] = await Promise.all([
        api.getProducts(),
        api.getWarehouses(),
        api.getStockMovements(),
        api.getStockTransfers(),
        api.getStockAdjustments(),
        api.getStockReservations(),
        api.getInventorySummary()
      ]);
      setProducts(pList);
      setWarehouses(wList);
      setMovements(mList);
      setTransfers(tList);
      setAdjustments(aList);
      setReservations(rList);
      setSummary(sum);

      if (pList.length > 0) {
        setMovForm(prev => ({ ...prev, productId: prev.productId || pList[0].id }));
        setTrfForm(prev => ({ ...prev, productId: prev.productId || pList[0].id }));
        setAdjForm(prev => ({ ...prev, productId: prev.productId || pList[0].id }));
        setResForm(prev => ({ ...prev, productId: prev.productId || pList[0].id }));
        setOpForm(prev => ({ ...prev, productId: prev.productId || pList[0].id, openingStock: pList[0].openingStock || 0 }));
      }
      if (wList.length > 0) {
        setMovForm(prev => ({ ...prev, warehouseId: prev.warehouseId || wList[0].id }));
        setTrfForm(prev => ({
          ...prev,
          fromWarehouseId: prev.fromWarehouseId || wList[0].id,
          toWarehouseId: prev.toWarehouseId || (wList[1] ? wList[1].id : wList[0].id)
        }));
        setAdjForm(prev => ({ ...prev, warehouseId: prev.warehouseId || wList[0].id }));
        setResForm(prev => ({ ...prev, warehouseId: prev.warehouseId || wList[0].id }));
        setOpForm(prev => ({ ...prev, warehouseId: prev.warehouseId || wList[0].id }));
      }
    } catch (err: any) {
      console.error('Failed to load inventory data', err);
      setErrorMsg(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const notifyError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // Submit Handlers
  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prod = products.find(p => p.id === movForm.productId);
      const wh = warehouses.find(w => w.id === movForm.warehouseId);
      if (!prod) return;

      await api.recordStockMovement({
        productId: prod.id,
        productName: prod.name,
        type: movForm.type,
        quantity: Number(movForm.quantity),
        unit: prod.unit,
        warehouseId: wh?.id,
        warehouseName: wh?.name,
        referenceDocType: movForm.referenceDocType,
        referenceNo: movForm.referenceNo || `REF-${Date.now().toString().slice(-5)}`,
        reason: movForm.reason
      });

      setShowMovementModal(false);
      notifySuccess(`Stock movement recorded successfully with document #${movForm.referenceNo}`);
      loadData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to record stock movement');
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStockTransfer({
        fromWarehouseId: trfForm.fromWarehouseId,
        toWarehouseId: trfForm.toWarehouseId,
        productId: trfForm.productId,
        quantity: Number(trfForm.quantity),
        referenceDocNo: trfForm.referenceDocNo,
        reason: trfForm.reason,
        transporterName: trfForm.transporterName,
        vehicleNo: trfForm.vehicleNo,
        notes: trfForm.notes
      });
      setShowTransferModal(false);
      notifySuccess('Inter-warehouse stock transfer executed and stock updated.');
      loadData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to create stock transfer');
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStockAdjustment({
        warehouseId: adjForm.warehouseId,
        productId: adjForm.productId,
        adjustmentType: adjForm.adjustmentType,
        quantity: Number(adjForm.quantity),
        reasonCode: adjForm.reasonCode,
        referenceDocNo: adjForm.referenceDocNo || `VOUCHER-${Date.now().toString().slice(-4)}`,
        remarks: adjForm.remarks,
        physicalCountedQty: Number(adjForm.physicalCountedQty)
      });
      setShowAdjustmentModal(false);
      notifySuccess('Stock adjustment voucher posted to stock ledger.');
      loadData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to post adjustment');
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStockReservation({
        productId: resForm.productId,
        warehouseId: resForm.warehouseId,
        quantity: Number(resForm.quantity),
        salesOrderRef: resForm.salesOrderRef || `SO-${Date.now().toString().slice(-4)}`,
        customerName: resForm.customerName || 'Direct Client',
        notes: resForm.notes
      });
      setShowReservationModal(false);
      notifySuccess('Stock reservation hold placed successfully.');
      loadData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to reserve stock');
    }
  };

  const handleReleaseReservation = async (id: string, action: 'FULFILLED' | 'CANCELLED') => {
    try {
      await api.releaseStockReservation(id, action, `Manual release by manager as ${action}`);
      notifySuccess(`Reservation marked as ${action} and available stock restored.`);
      loadData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to release reservation');
    }
  };

  const handleUpdateOpeningStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateOpeningStock({
        productId: opForm.productId,
        openingStock: Number(opForm.openingStock),
        warehouseId: opForm.warehouseId,
        referenceNo: opForm.referenceNo,
        remarks: opForm.remarks
      });
      setShowOpeningStockModal(false);
      notifySuccess('Opening stock calibrated and audit record logged.');
      loadData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to update opening stock');
    }
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveWarehouse(whForm);
      setShowWarehouseModal(false);
      notifySuccess('Godown / Warehouse record saved successfully.');
      loadData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to save warehouse');
    }
  };

  // Filtered Products
  const filteredProducts = (products || []).filter(p => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q);
    
    if (selectedWarehouseFilter === 'ALL') return matchesSearch;
    const hasInWh = (p.warehouseStocks || []).some(w => w.warehouseId === selectedWarehouseFilter && w.physicalStock > 0);
    return matchesSearch && (hasInWh || p.warehouse === selectedWarehouseFilter);
  });

  // Filtered Movements
  const filteredMovements = (movements || []).filter(m => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = !q ||
      (m.productName || '').toLowerCase().includes(q) ||
      (m.referenceNo && (m.referenceNo || '').toLowerCase().includes(q)) ||
      (m.reason && (m.reason || '').toLowerCase().includes(q)) ||
      (m.warehouseName && (m.warehouseName || '').toLowerCase().includes(q));
    
    if (selectedTypeFilter === 'ALL') return matchesSearch;
    return matchesSearch && m.type === selectedTypeFilter;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Alert Banners */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900"><X className="w-4 h-4" /></button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-700 hover:text-rose-900"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Warehouse & Stock Control</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized multi-godown stock ledger, available stock calculation, inter-warehouse transfers & audit log
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setMovForm(prev => ({
                ...prev,
                type: 'STOCK_IN',
                referenceDocType: 'PURCHASE_RECEIPT',
                reason: 'Direct Mill Inward / Purchase Receipt'
              }));
              setShowMovementModal(true);
            }}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow-xs"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Stock Inward</span>
          </button>

          <button
            onClick={() => {
              setShowTransferModal(true);
            }}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow-xs"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Stock Transfer</span>
          </button>

          <button
            onClick={() => {
              setShowAdjustmentModal(true);
            }}
            className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow-xs"
          >
            <FileCheck className="w-4 h-4" />
            <span>Adjustment Voucher</span>
          </button>

          <button
            onClick={() => {
              setShowReservationModal(true);
            }}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow-xs"
          >
            <BookmarkCheck className="w-4 h-4 text-emerald-400" />
            <span>Hold / Reserve</span>
          </button>

          <button
            onClick={loadData}
            title="Refresh Stock Ledger"
            className="p-2 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stock Calculation Formula Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Authoritative Stock Calculation Engine</span>
            </div>
            <p className="text-xs text-slate-300">
              Never silently change stock. Every single movement traces to a verified source document (PO Receipt, Sales Dispatch, Transfer Challan, or Adjustment Voucher).
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700 font-mono text-xs">
            <span className="text-sky-300 font-bold">Physical Stock</span>
            <span className="text-slate-400 font-bold">-</span>
            <span className="text-amber-300 font-bold">Reserved Stock</span>
            <span className="text-slate-400 font-bold">=</span>
            <span className="text-emerald-300 font-black bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">Available Stock</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Physical Stock</span>
          <div className="text-lg font-black text-slate-900 mt-1">
            {formatNumber(summary?.totalPhysicalStock || 0)} <span className="text-xs font-normal text-slate-500">Qty</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">In Godowns</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 bg-amber-50/20 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Reserved Stock</span>
          <div className="text-lg font-black text-amber-700 mt-1">
            {formatNumber(summary?.totalReservedStock || 0)} <span className="text-xs font-normal text-amber-600">Qty</span>
          </div>
          <span className="text-[10px] text-amber-600/80 font-medium">Order Holds</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Available Stock</span>
          <div className="text-lg font-black text-emerald-700 mt-1">
            {formatNumber(summary?.totalAvailableStock || 0)} <span className="text-xs font-normal text-emerald-600">Qty</span>
          </div>
          <span className="text-[10px] text-emerald-600/80 font-medium">Ready to Sell</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Valuation</span>
          <div className="text-lg font-black text-slate-900 mt-1">
            {formatCurrency(summary?.totalValuation || 0)}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">At Purchase Rate Master</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Metric Tons</span>
          <div className="text-lg font-black text-indigo-700 mt-1">
            {summary?.totalTons || 0} <span className="text-xs font-normal text-indigo-500">MT</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{summary?.totalReams || 0} Reams</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Godowns & Depots</span>
          <div className="text-lg font-black text-slate-900 mt-1">
            {summary?.warehousesCount || warehouses.length} <span className="text-xs font-normal text-slate-500">Units</span>
          </div>
          <span className="text-[10px] text-rose-600 font-bold">
            {summary?.lowStockCount ? `${summary.lowStockCount} Low Stock` : 'Stock Optimal'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex overflow-x-auto space-x-2 text-xs font-bold pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('PRODUCT_STOCK')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'PRODUCT_STOCK'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Product-Wise Stock ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('WAREHOUSE_STOCK')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'WAREHOUSE_STOCK'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Warehouse-Wise Stock ({warehouses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TRANSFERS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'TRANSFERS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Stock Transfers ({transfers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ADJUSTMENTS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'ADJUSTMENTS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Stock Adjustments ({adjustments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RESERVATIONS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'RESERVATIONS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookmarkCheck className="w-4 h-4" />
          <span>Reserved Stock ({reservations.filter(r => r.status === 'ACTIVE').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_TRAIL')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'AUDIT_TRAIL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Register ({movements.length})</span>
        </button>
      </div>

      {/* TAB 1: PRODUCT-WISE CENTRAL STOCK */}
      {activeTab === 'PRODUCT_STOCK' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search SKU, Paper Name, Grade or GSM..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedWarehouseFilter}
                onChange={e => setSelectedWarehouseFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Warehouses / Godowns</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>

              <button
                onClick={() => setShowOpeningStockModal(true)}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                Opening Stock Calibration
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Item / SKU</th>
                  <th className="p-3">Specs (GSM & Size)</th>
                  <th className="p-3 text-right">Opening</th>
                  <th className="p-3 text-right">Purchased</th>
                  <th className="p-3 text-right">Dispatched</th>
                  <th className="p-3 text-right text-sky-400 font-black">Physical Stock</th>
                  <th className="p-3 text-right text-amber-300 font-bold">Reserved</th>
                  <th className="p-3 text-right text-emerald-400 font-black">Available</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="font-mono text-[10px] text-slate-500">{p.code} • {p.category}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-700">{p.gsm} GSM</div>
                      <div className="text-[11px] text-slate-500">{p.sizeInches}" • {p.unit}</div>
                    </td>
                    <td className="p-3 text-right font-medium text-slate-600">
                      {p.openingStock || 0}
                    </td>
                    <td className="p-3 text-right font-medium text-emerald-700">
                      +{p.totalPurchasedStock || 0}
                    </td>
                    <td className="p-3 text-right font-medium text-rose-600">
                      -{p.totalSoldStock || 0}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900 bg-sky-50/30">
                      {p.physicalStock || p.currentStock || 0} {p.unit}
                    </td>
                    <td className="p-3 text-right font-bold text-amber-700 bg-amber-50/30">
                      {p.reservedStock || 0} {p.unit}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-700 bg-emerald-50/30 text-sm">
                      {p.availableStock !== undefined ? p.availableStock : (p.currentStock - (p.reservedStock || 0))} {p.unit}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        p.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-800' :
                        p.status === 'LOW_STOCK' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {p.status}
                      </span>
                      {p.minStockLevel && (
                        <div className="text-[9px] text-slate-400 mt-0.5">Min: {p.minStockLevel}</div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => {
                            setTrfForm(prev => ({ ...prev, productId: p.id }));
                            setShowTransferModal(true);
                          }}
                          title="Transfer between Godowns"
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setAdjForm(prev => ({ ...prev, productId: p.id }));
                            setShowAdjustmentModal(true);
                          }}
                          title="Adjustment Voucher"
                          className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setResForm(prev => ({ ...prev, productId: p.id }));
                            setShowReservationModal(true);
                          }}
                          title="Reserve for Order"
                          className="p-1 text-slate-700 hover:bg-slate-100 rounded"
                        >
                          <BookmarkCheck className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: WAREHOUSE-WISE STOCK & GODOWNS */}
      {activeTab === 'WAREHOUSE_STOCK' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900">Active Warehouses & Godowns</h3>
            <button
              onClick={() => {
                setWhForm({
                  code: '',
                  name: '',
                  location: '',
                  city: 'Mumbai',
                  state: 'Maharashtra',
                  capacityTon: 500,
                  managerName: '',
                  contactPhone: '',
                  isDefault: false
                });
                setShowWarehouseModal(true);
              }}
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Warehouse</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map(wh => {
              const whSummary = (summary?.warehouseSummaries || []).find(s => s.warehouseId === wh.id);
              return (
                <div key={wh.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {wh.code}
                        </span>
                        {wh.isDefault && (
                          <span className="bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-1">{wh.name}</h4>
                      <p className="text-xs text-slate-500">{wh.location || `${wh.city}, ${wh.state}`}</p>
                    </div>
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Capacity</span>
                      <span className="font-extrabold text-slate-900">{wh.capacityTon} MT</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Stock Items</span>
                      <span className="font-extrabold text-slate-900">{whSummary?.itemCount || 0} Grades</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Physical Qty</span>
                      <span className="font-extrabold text-sky-700">{whSummary?.physicalStock || 0} Units</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Available Qty</span>
                      <span className="font-extrabold text-emerald-700">{whSummary?.availableStock || 0} Units</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
                    <span>Supervisor: <strong className="text-slate-700">{wh.managerName || 'Depot Incharge'}</strong></span>
                    <span>{wh.contactPhone}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: STOCK TRANSFERS */}
      {activeTab === 'TRANSFERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Inter-Warehouse Stock Transfers</h3>
              <p className="text-xs text-slate-500">Documented stock transfer challans and gate passes</p>
            </div>
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Transfer Challan</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Transfer No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Paper Product</th>
                  <th className="p-3 text-center">Quantity</th>
                  <th className="p-3">From Godown</th>
                  <th className="p-3">To Godown</th>
                  <th className="p-3">Transporter / Vehicle</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transfers.map(trf => (
                  <tr key={trf.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-indigo-900">{trf.transferNo}</td>
                    <td className="p-3 text-slate-600">{new Date(trf.date).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-slate-900">{trf.productName}</td>
                    <td className="p-3 text-center font-black text-slate-900 bg-slate-50">
                      {trf.quantity} {trf.unit}
                    </td>
                    <td className="p-3 text-rose-700 font-semibold">{trf.fromWarehouseName}</td>
                    <td className="p-3 text-emerald-700 font-semibold">{trf.toWarehouseName}</td>
                    <td className="p-3 text-slate-600">
                      <div>{trf.transporterName || 'Self Transporter'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{trf.vehicleNo || 'N/A'}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        {trf.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STOCK ADJUSTMENTS */}
      {activeTab === 'ADJUSTMENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Stock Adjustment & Audit Vouchers</h3>
              <p className="text-xs text-slate-500">Physical cycle count differences, transit damages, and corrections</p>
            </div>
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Adjustment Voucher</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Adjustment No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-center">Adjusted Qty</th>
                  <th className="p-3">Reason Code</th>
                  <th className="p-3">Ref Doc / Remarks</th>
                  <th className="p-3">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {adjustments.map(adj => (
                  <tr key={adj.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-amber-900">{adj.adjustmentNo}</td>
                    <td className="p-3 text-slate-600">{new Date(adj.date).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        adj.adjustmentType === 'ADD' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {adj.adjustmentType === 'ADD' ? '+ ADD STOCK' : '- DEDUCT STOCK'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{adj.productName}</td>
                    <td className="p-3 text-center font-black text-slate-900">
                      {adj.quantity} {adj.unit}
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-700 font-semibold">{adj.reasonCode}</td>
                    <td className="p-3 text-slate-600">
                      <div className="font-semibold text-slate-800">{adj.referenceDocNo}</div>
                      <div className="text-[11px] text-slate-500">{adj.remarks}</div>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{adj.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: STOCK RESERVATIONS */}
      {activeTab === 'RESERVATIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Stock Reservations & Order Holds</h3>
              <p className="text-xs text-slate-500">Reserved stock reduces Available Stock immediately to prevent double-selling</p>
            </div>
            <button
              onClick={() => setShowReservationModal(true)}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Reserve Stock</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Reservation No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Paper Item</th>
                  <th className="p-3 text-center">Reserved Qty</th>
                  <th className="p-3">Customer / Order Ref</th>
                  <th className="p-3">Warehouse</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reservations.map(res => (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{res.reservationNo}</td>
                    <td className="p-3 text-slate-600">{new Date(res.date).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-slate-900">{res.productName}</td>
                    <td className="p-3 text-center font-black text-amber-700 bg-amber-50/40">
                      {res.quantity} {res.unit}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{res.customerName}</div>
                      <div className="text-[10px] font-mono text-emerald-800">SO Ref: {res.salesOrderRef}</div>
                    </td>
                    <td className="p-3 text-slate-600">{res.warehouseName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        res.status === 'ACTIVE' ? 'bg-amber-100 text-amber-800' :
                        res.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {res.status === 'ACTIVE' && (
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleReleaseReservation(res.id, 'FULFILLED')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded"
                          >
                            Fulfill
                          </button>
                          <button
                            onClick={() => handleReleaseReservation(res.id, 'CANCELLED')}
                            className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded"
                          >
                            Release
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL */}
      {activeTab === 'AUDIT_TRAIL' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Complete Stock Movement Audit Register</h3>
              <p className="text-xs text-slate-500">Immutable ledger recording balance before & after every transaction</p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Movement Types</option>
                <option value="STOCK_IN">STOCK_IN (Purchase/Receipt)</option>
                <option value="STOCK_OUT">STOCK_OUT (Sales/Dispatch)</option>
                <option value="TRANSFER_IN">TRANSFER_IN</option>
                <option value="TRANSFER_OUT">TRANSFER_OUT</option>
                <option value="ADJUSTMENT_ADD">ADJUSTMENT_ADD</option>
                <option value="ADJUSTMENT_DEDUCT">ADJUSTMENT_DEDUCT</option>
                <option value="OPENING_STOCK">OPENING_STOCK</option>
                <option value="RESERVE">RESERVE</option>
                <option value="UNRESERVE">UNRESERVE</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Movement #</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Paper Item</th>
                  <th className="p-3 text-center">Movement Qty</th>
                  <th className="p-3 text-center">Stock Before / After</th>
                  <th className="p-3">Reference Doc</th>
                  <th className="p-3">Reason / Remarks</th>
                  <th className="p-3">Godown</th>
                  <th className="p-3">Auditor / User</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMovements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono text-[10px] font-bold text-slate-800">{m.movementNo || m.id}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        m.type === 'STOCK_IN' || m.type === 'TRANSFER_IN' || m.type === 'ADJUSTMENT_ADD' || m.type === 'OPENING_STOCK'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.type === 'STOCK_OUT' || m.type === 'TRANSFER_OUT' || m.type === 'ADJUSTMENT_DEDUCT'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{m.productName}</td>
                    <td className="p-3 text-center font-black text-slate-900">
                      {m.quantity} {m.unit}
                    </td>
                    <td className="p-3 text-center font-mono text-[11px]">
                      {m.stockBefore !== undefined ? (
                        <span>
                          <span className="text-slate-500">{m.stockBefore}</span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span className="font-bold text-slate-900">{m.stockAfter}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-emerald-900 font-bold">{m.referenceNo || 'N/A'}</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate" title={m.reason}>{m.reason}</td>
                    <td className="p-3 text-slate-600">{m.warehouseName || m.toWarehouse || m.fromWarehouse || 'Central Godown'}</td>
                    <td className="p-3 text-slate-700 font-medium">{m.performedBy}</td>
                    <td className="p-3 text-slate-500 text-[10px]">{new Date(m.date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: STOCK INWARD / OUTWARD MOVEMENT */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-base">Record Stock Movement</h3>
              <button onClick={() => setShowMovementModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Movement Type</label>
                <select
                  value={movForm.type}
                  onChange={e => setMovForm({ ...movForm, type: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="STOCK_IN">STOCK_IN (Receipt / Inward Arrival)</option>
                  <option value="STOCK_OUT">STOCK_OUT (Sales Dispatch / Issue)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Paper Product SKU</label>
                <select
                  value={movForm.productId}
                  onChange={e => setMovForm({ ...movForm, productId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500 bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gsm} GSM) - Phys: {p.physicalStock || p.currentStock} {p.unit} (Avail: {p.availableStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Warehouse / Godown</label>
                <select
                  value={movForm.warehouseId}
                  onChange={e => setMovForm({ ...movForm, warehouseId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500 bg-white"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Movement Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={movForm.quantity}
                  onChange={e => setMovForm({ ...movForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-extrabold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Source / Reference Document Type</label>
                <select
                  value={movForm.referenceDocType}
                  onChange={e => setMovForm({ ...movForm, referenceDocType: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="PURCHASE_RECEIPT">Purchase Receipt (MRN)</option>
                  <option value="SALES_DISPATCH">Sales Dispatch Challan</option>
                  <option value="MILL_GATEPASS">Mill Gate Pass</option>
                  <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reference Document / Bill # *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO-9920, DC-1049, MRN-442"
                  value={movForm.referenceNo}
                  onChange={e => setMovForm({ ...movForm, referenceNo: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Audit Reason / Remarks *</label>
                <input
                  type="text"
                  required
                  value={movForm.reason}
                  onChange={e => setMovForm({ ...movForm, reason: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-lg"
                >
                  Commit Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INTER-WAREHOUSE STOCK TRANSFER */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-base">Create Stock Transfer (Inter-Godown)</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Source Warehouse (Transfer Out)</label>
                  <select
                    value={trfForm.fromWarehouseId}
                    onChange={e => setTrfForm({ ...trfForm, fromWarehouseId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Destination Warehouse (Transfer In)</label>
                  <select
                    value={trfForm.toWarehouseId}
                    onChange={e => setTrfForm({ ...trfForm, toWarehouseId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Paper Product SKU</label>
                <select
                  value={trfForm.productId}
                  onChange={e => setTrfForm({ ...trfForm, productId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500 bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gsm} GSM) - Available: {p.availableStock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Transfer Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={trfForm.quantity}
                  onChange={e => setTrfForm({ ...trfForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-extrabold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Transporter Name</label>
                  <input
                    type="text"
                    value={trfForm.transporterName}
                    onChange={e => setTrfForm({ ...trfForm, transporterName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={trfForm.vehicleNo}
                    onChange={e => setTrfForm({ ...trfForm, vehicleNo: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Transfer Reason / Remarks</label>
                <input
                  type="text"
                  required
                  value={trfForm.reason}
                  onChange={e => setTrfForm({ ...trfForm, reason: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-lg"
                >
                  Dispatch Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STOCK ADJUSTMENT VOUCHER */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-base">Create Stock Adjustment Voucher</h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Adjustment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjForm({ ...adjForm, adjustmentType: 'ADD' })}
                    className={`py-2 rounded-lg font-bold border transition ${
                      adjForm.adjustmentType === 'ADD'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    + ADD Stock (Surplus)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjForm({ ...adjForm, adjustmentType: 'DEDUCT' })}
                    className={`py-2 rounded-lg font-bold border transition ${
                      adjForm.adjustmentType === 'DEDUCT'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    - DEDUCT Stock (Deficit)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Paper Product SKU</label>
                <select
                  value={adjForm.productId}
                  onChange={e => setAdjForm({ ...adjForm, productId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gsm} GSM) - Phys Stock: {p.physicalStock || p.currentStock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Warehouse</label>
                <select
                  value={adjForm.warehouseId}
                  onChange={e => setAdjForm({ ...adjForm, warehouseId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 bg-white"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Adjustment Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjForm.quantity}
                  onChange={e => setAdjForm({ ...adjForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-extrabold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason Classification</label>
                <select
                  value={adjForm.reasonCode}
                  onChange={e => setAdjForm({ ...adjForm, reasonCode: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 bg-white"
                >
                  <option value="CYCLE_COUNT_SURPLUS">Physical Cycle Count Surplus</option>
                  <option value="CYCLE_COUNT_DEFICIT">Physical Cycle Count Deficit</option>
                  <option value="DAMAGE_TRANSIT">Transit Handling Damage</option>
                  <option value="DAMAGE_WATER">Water / Moisture Damage</option>
                  <option value="QUALITY_REJECTION">Mill Quality Rejection</option>
                  <option value="RETURN_TO_MILL">Return to Paper Mill</option>
                  <option value="OTHER">Other Auditor Adjustment</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Audit Voucher / Reference # *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AUDIT-VOUCHER-08"
                  value={adjForm.referenceDocNo}
                  onChange={e => setAdjForm({ ...adjForm, referenceDocNo: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Auditor Remarks *</label>
                <input
                  type="text"
                  required
                  value={adjForm.remarks}
                  onChange={e => setAdjForm({ ...adjForm, remarks: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2 rounded-lg"
                >
                  Post Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: STOCK RESERVATION HOLD */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-base">Reserve Stock for Sales Order</h3>
              <button onClick={() => setShowReservationModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Paper Product SKU</label>
                <select
                  value={resForm.productId}
                  onChange={e => setResForm({ ...resForm, productId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500 bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gsm} GSM) - Available: {p.availableStock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reserve Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={resForm.quantity}
                  onChange={e => setResForm({ ...resForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-extrabold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer / Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navneet Publications / S. Chand"
                  value={resForm.customerName}
                  onChange={e => setResForm({ ...resForm, customerName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sales Order Ref # *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SO-2026-904"
                  value={resForm.salesOrderRef}
                  onChange={e => setResForm({ ...resForm, salesOrderRef: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  value={resForm.notes}
                  onChange={e => setResForm({ ...resForm, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReservationModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-lg"
                >
                  Confirm Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: OPENING STOCK SETUP */}
      {showOpeningStockModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-base">Opening Stock Calibration</h3>
              <button onClick={() => setShowOpeningStockModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOpeningStock} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Paper Product SKU</label>
                <select
                  value={opForm.productId}
                  onChange={e => {
                    const prod = products.find(p => p.id === e.target.value);
                    setOpForm({ ...opForm, productId: e.target.value, openingStock: prod?.openingStock || 0 });
                  }}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500 bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gsm} GSM) - Current Opening: {p.openingStock || 0} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Opening Stock Quantity</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={opForm.openingStock}
                  onChange={e => setOpForm({ ...opForm, openingStock: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-extrabold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reference Document / Audit Note #</label>
                <input
                  type="text"
                  required
                  value={opForm.referenceNo}
                  onChange={e => setOpForm({ ...opForm, referenceNo: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Remarks</label>
                <input
                  type="text"
                  value={opForm.remarks}
                  onChange={e => setOpForm({ ...opForm, remarks: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowOpeningStockModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-lg"
                >
                  Save Calibration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ADD / EDIT WAREHOUSE */}
      {showWarehouseModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-base">Add Storage Godown / Warehouse</h3>
              <button onClick={() => setShowWarehouseModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Godown Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-BHIWANDI"
                    value={whForm.code}
                    onChange={e => setWhForm({ ...whForm, code: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Capacity (Metric Tons)</label>
                  <input
                    type="number"
                    required
                    value={whForm.capacityTon}
                    onChange={e => setWhForm({ ...whForm, capacityTon: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bhiwandi Central Godown"
                  value={whForm.name}
                  onChange={e => setWhForm({ ...whForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Address / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Unit 4, Harihar Complex, Mankoli"
                  value={whForm.location}
                  onChange={e => setWhForm({ ...whForm, location: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={whForm.city}
                    onChange={e => setWhForm({ ...whForm, city: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    value={whForm.state}
                    onChange={e => setWhForm({ ...whForm, state: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Manager / Incharge</label>
                  <input
                    type="text"
                    value={whForm.managerName}
                    onChange={e => setWhForm({ ...whForm, managerName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={whForm.contactPhone}
                    onChange={e => setWhForm({ ...whForm, contactPhone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-lg"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
