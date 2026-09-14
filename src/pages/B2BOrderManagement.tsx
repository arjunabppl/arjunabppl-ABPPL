import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  SalesOrder, DeliveryChallan, PaymentReceipt, CustomerPriceList,
  AuditLog, OrderStats, Transporter, Warehouse, Invoice
} from '../types/index.js';
import { api } from '../services/api.js';
import { formatCurrency, formatNumber } from '../utils/paperMath.js';
import { NewSalesOrderForm } from '../components/orders/NewSalesOrderForm.js';
import { OrderDetailsModal } from '../components/orders/OrderDetailsModal.js';
import { PackingDispatchModal } from '../components/orders/PackingDispatchModal.js';
import { PaymentReceiptModal } from '../components/orders/PaymentReceiptModal.js';
import { PrintableOrderSlip } from '../components/orders/PrintableOrderSlip.js';
import { PrintableDeliveryChallan } from '../components/orders/PrintableDeliveryChallan.js';
import { PrintableReceipt } from '../components/orders/PrintableReceipt.js';
import {
  ShoppingBag, Package, Truck, CreditCard, Plus, Search,
  Filter, RefreshCw, Calendar, ArrowRight, Eye, CheckCircle2,
  Clock, AlertCircle, Layers, Building, FileText, Download,
  Printer, ShieldCheck, DollarSign, BarChart3, ChevronRight,
  TrendingUp, Users, Tag
} from 'lucide-react';

interface B2BOrderManagementProps {
  onOpenInvoiceView?: (invoice: Invoice) => void;
}

export const B2BOrderManagement: React.FC<B2BOrderManagementProps> = ({ onOpenInvoiceView }) => {
  const { user, settings } = useAuth();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<
    'ORDERS' | 'NEW_ORDER' | 'DELIVERIES' | 'RECEIPTS' | 'PRICE_LISTS' | 'AUDIT_LOGS' | 'ANALYTICS'
  >('ORDERS');

  // Orders State
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryChallan[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [priceLists, setPriceLists] = useState<CustomerPriceList[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');

  // Modals & Full Screen Printable Views
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<SalesOrder | null>(null);
  const [packingModalOrder, setPackingModalOrder] = useState<SalesOrder | null>(null);
  const [dispatchModalOrder, setDispatchModalOrder] = useState<SalesOrder | null>(null);
  const [deliverModalOrder, setDeliverModalOrder] = useState<SalesOrder | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<SalesOrder | null>(null);
  const [activeOrderSlip, setActiveOrderSlip] = useState<SalesOrder | null>(null);
  const [activeDeliveryChallan, setActiveDeliveryChallan] = useState<DeliveryChallan | null>(null);
  const [activeReceiptSlip, setActiveReceiptSlip] = useState<PaymentReceipt | null>(null);

  // New Price List state
  const [showNewPriceListModal, setShowNewPriceListModal] = useState(false);
  const [newPriceListPartyId, setNewPriceListPartyId] = useState('');
  const [newPriceListPartyName, setNewPriceListPartyName] = useState('');
  const [newPriceListProductName, setNewPriceListProductName] = useState('JK Copier A4 75 GSM');
  const [newPriceListGsm, setNewPriceListGsm] = useState(75);
  const [newPriceListCustomRate, setNewPriceListCustomRate] = useState(280);
  const [newPriceListDiscount, setNewPriceListDiscount] = useState(3);
  const [newPriceListMinQty, setNewPriceListMinQty] = useState(100);

  const isAdminOrTeam = user && ['admin', 'superadmin', 'manager', 'sales', 'inventory', 'accounts'].includes(user.role);
  const isCustomer = user?.role === 'customer';
  const isDistributor = user?.role === 'distributor';

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        ordersData,
        statsData,
        deliveriesData,
        receiptsData,
        priceListsData,
        transportersData,
        warehousesData,
        auditLogsData
      ] = await Promise.all([
        api.getSalesOrders(),
        api.getOrderStats(),
        api.getDeliveries(),
        api.getReceipts(),
        api.getPriceLists(),
        api.getTransporters(),
        api.getWarehouses(),
        isAdminOrTeam ? api.getAuditLogs({ limit: 50 }) : Promise.resolve([])
      ]);

      setOrders(ordersData || []);
      setOrderStats(statsData || null);
      setDeliveries(deliveriesData || []);
      setReceipts(receiptsData || []);
      setPriceLists(priceListsData || []);
      setTransporters(transportersData || []);
      setWarehouses(warehousesData || []);
      setAuditLogs(auditLogsData || []);
    } catch (err) {
      console.error('Error fetching B2B orders data', err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for packing, dispatching, delivering, payments
  const handleConfirmPack = async (data: { totalPackages: number; packageType: string; notes: string }) => {
    if (!packingModalOrder) return;
    const updated = await api.packSalesOrder(packingModalOrder.id, data);
    setPackingModalOrder(null);
    if (selectedOrderForDetails?.id === updated.id) {
      setSelectedOrderForDetails(updated);
    }
    loadAllData();
  };

  const handleConfirmDispatch = async (data: any) => {
    if (!dispatchModalOrder) return;
    const res = await api.dispatchSalesOrder(dispatchModalOrder.id, data);
    setDispatchModalOrder(null);
    if (selectedOrderForDetails?.id === res.order.id) {
      setSelectedOrderForDetails(res.order);
    }
    loadAllData();
    // Offer to open generated Delivery Challan
    if (res.deliveryChallan) {
      setActiveDeliveryChallan(res.deliveryChallan);
    }
  };

  const handleConfirmDeliver = async (data: any) => {
    if (!deliverModalOrder) return;
    const updated = await api.markOrderDelivered(deliverModalOrder.id, data);
    setDeliverModalOrder(null);
    if (selectedOrderForDetails?.id === updated.id) {
      setSelectedOrderForDetails(updated);
    }
    loadAllData();
  };

  const handleConfirmPayment = async (data: any) => {
    if (!paymentModalOrder) return;
    const res = await api.recordOrderPayment(paymentModalOrder.id, data);
    setPaymentModalOrder(null);
    if (selectedOrderForDetails?.id === res.order.id) {
      setSelectedOrderForDetails(res.order);
    }
    loadAllData();
    if (res.receipt) {
      setActiveReceiptSlip(res.receipt);
    }
  };

  const handleSavePriceList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.savePriceList({
        partyId: newPriceListPartyId || 'distributor-default',
        partyName: newPriceListPartyName || 'Valued B2B Partner',
        isDistributorTier: true,
        items: [
          {
            productName: newPriceListProductName,
            gsm: Number(newPriceListGsm),
            customRate: Number(newPriceListCustomRate),
            discountPercent: Number(newPriceListDiscount),
            minOrderQuantity: Number(newPriceListMinQty)
          }
        ]
      });
      setShowNewPriceListModal(false);
      const updated = await api.getPriceLists();
      setPriceLists(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to save custom price list');
    }
  };

  // Full Screen Printable Views
  if (activeOrderSlip && settings) {
    return (
      <PrintableOrderSlip
        order={activeOrderSlip}
        settings={settings}
        onBack={() => setActiveOrderSlip(null)}
      />
    );
  }

  if (activeDeliveryChallan && settings) {
    return (
      <PrintableDeliveryChallan
        challan={activeDeliveryChallan}
        settings={settings}
        onBack={() => setActiveDeliveryChallan(null)}
      />
    );
  }

  if (activeReceiptSlip && settings) {
    return (
      <PrintableReceipt
        receipt={activeReceiptSlip}
        settings={settings}
        onBack={() => setActiveReceiptSlip(null)}
      />
    );
  }

  const userPartyId = user?.partyId || '';
  const userPartyName = (user?.partyName || user?.name || '').toLowerCase();
  const userEmail = (user?.email || '').toLowerCase();

  const isCustomerOrder = (ord: SalesOrder) => {
    if (!isCustomer) return true;
    if (userPartyId && ord.customerId === userPartyId) return true;
    if (userPartyName && (ord.customerName || '').toLowerCase().includes(userPartyName)) return true;
    if (ord.customerName && userPartyName && userPartyName.includes((ord.customerName || '').toLowerCase())) return true;
    if (userEmail && (ord.billTo?.email || '').toLowerCase() === userEmail) return true;
    return false;
  };

  const accessibleOrders = isCustomer ? (orders || []).filter(isCustomerOrder) : (orders || []);
  const accessibleDeliveries = isCustomer ? (deliveries || []).filter(d => {
    if (userPartyId && d.customerId === userPartyId) return true;
    if (userPartyName && (d.customerName || '').toLowerCase().includes(userPartyName)) return true;
    return false;
  }) : (deliveries || []);
  const accessibleReceipts = isCustomer ? (receipts || []).filter(r => {
    if (userPartyId && r.partyId === userPartyId) return true;
    if (userPartyName && (r.customerName || r.partyName || '').toLowerCase().includes(userPartyName)) return true;
    return false;
  }) : (receipts || []);

  const effectiveStats: OrderStats = isCustomer ? {
    totalOrders: accessibleOrders.length,
    totalOrderValue: accessibleOrders.reduce((s, o) => s + (o.grandTotal || 0), 0),
    pendingApproval: accessibleOrders.filter(o => ['SUBMITTED', 'PENDING_APPROVAL', 'DRAFT'].includes(o.status)).length,
    stockReservedOrders: accessibleOrders.filter(o => o.status === 'STOCK_RESERVED').length,
    dispatchedOrders: accessibleOrders.filter(o => ['PACKED', 'DISPATCHED', 'IN_TRANSIT'].includes(o.status)).length,
    deliveredOrders: accessibleOrders.filter(o => ['DELIVERED', 'INVOICED', 'COMPLETED'].includes(o.status)).length,
    totalOutstanding: accessibleOrders.reduce((s, o) => s + (o.balanceDue ?? (o.grandTotal - (o.paidAmount || 0))), 0),
    partiallyPaidOrders: accessibleOrders.filter(o => (o.paidAmount || 0) > 0 && (o.balanceDue || 0) > 0).length,
    cancelledOrders: accessibleOrders.filter(o => o.status === 'CANCELLED').length
  } : (orderStats || {
    totalOrders: orders.length,
    totalOrderValue: orders.reduce((s, o) => s + (o.grandTotal || 0), 0),
    pendingApproval: orders.filter(o => ['SUBMITTED', 'PENDING_APPROVAL', 'DRAFT'].includes(o.status)).length,
    stockReservedOrders: orders.filter(o => o.status === 'STOCK_RESERVED').length,
    dispatchedOrders: orders.filter(o => ['PACKED', 'DISPATCHED', 'IN_TRANSIT'].includes(o.status)).length,
    deliveredOrders: orders.filter(o => ['DELIVERED', 'INVOICED', 'COMPLETED'].includes(o.status)).length,
    totalOutstanding: orders.reduce((s, o) => s + (o.balanceDue ?? (o.grandTotal - (o.paidAmount || 0))), 0),
    partiallyPaidOrders: orders.filter(o => (o.paidAmount || 0) > 0 && (o.balanceDue || 0) > 0).length,
    cancelledOrders: orders.filter(o => o.status === 'CANCELLED').length
  });

  // Filtered Orders
  const filteredOrders = accessibleOrders.filter(ord => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      !q ||
      (ord.orderNo || '').toLowerCase().includes(q) ||
      (ord.customerName || '').toLowerCase().includes(q) ||
      (ord.customerPoNumber && (ord.customerPoNumber || '').toLowerCase().includes(q)) ||
      (ord.items || []).some(i => (i.productName || '').toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || ord.status === statusFilter;
    const matchesCustomer = isCustomer ? true : (customerFilter === 'ALL' || ord.customerId === customerFilter);

    return matchesSearch && matchesStatus && matchesCustomer;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* Top Banner & Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {isCustomer ? 'Customer Order Portal & Tracking' : 'B2B Paper Wholesale Order Management'}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  user?.role === 'superadmin' ? 'bg-purple-900 text-purple-200 border border-purple-700' :
                  user?.role === 'admin' ? 'bg-slate-900 text-white' :
                  user?.role === 'distributor' ? 'bg-amber-900 text-amber-200 border border-amber-700' :
                  user?.role === 'customer' ? 'bg-emerald-900 text-emerald-200 border border-emerald-700' :
                  'bg-blue-900 text-blue-200'
                }`}>
                  {isCustomer ? `Customer: ${user?.partyName || user?.name}` : `Role: ${user?.role || 'Guest'}`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isCustomer
                  ? 'Punch new wholesale paper orders, view live order progress, track dispatches and download order slips.'
                  : 'Full lifecycle: Sales orders, mill paper specs, stock reservations, packing slips, truck dispatch challans & money receipts.'}
              </p>
            </div>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadAllData}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setActiveTab('NEW_ORDER')}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>+ Punch New Order</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      {effectiveStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
              <span>Total Orders</span>
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-2">{effectiveStats.totalOrders}</div>
            <div className="text-[10px] text-slate-500 mt-1 font-semibold">{formatCurrency(effectiveStats.totalOrderValue)}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-amber-700 text-[11px] font-bold uppercase">
              <span>Pending Action</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-amber-700 mt-2">{effectiveStats.pendingApproval}</div>
            <div className="text-[10px] text-amber-800 mt-1 font-semibold">Under Processing</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-indigo-700 text-[11px] font-bold uppercase">
              <span>Stock Reserved</span>
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-indigo-700 mt-2">{effectiveStats.stockReservedOrders}</div>
            <div className="text-[10px] text-indigo-800 mt-1 font-semibold">Allocated in Godown</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-blue-700 text-[11px] font-bold uppercase">
              <span>In Dispatch</span>
              <Truck className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-blue-700 mt-2">{effectiveStats.dispatchedOrders}</div>
            <div className="text-[10px] text-blue-800 mt-1 font-semibold">On Truck / In Transit</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-emerald-700 text-[11px] font-bold uppercase">
              <span>Delivered</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-emerald-700 mt-2">{effectiveStats.deliveredOrders}</div>
            <div className="text-[10px] text-emerald-800 mt-1 font-semibold">Completed Orders</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-rose-700 text-[11px] font-bold uppercase">
              <span>Outstanding Due</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-rose-700 mt-2">{formatCurrency(effectiveStats.totalOutstanding)}</div>
            <div className="text-[10px] text-rose-800 mt-1 font-semibold">Payment Balance</div>
          </div>
        </div>
      )}

      {/* Module Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'ORDERS'
              ? 'bg-slate-900 text-white border-b-2 border-emerald-500'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{isCustomer ? `My Orders (${accessibleOrders.length})` : `All Sales Orders (${orders.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('NEW_ORDER')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'NEW_ORDER'
              ? 'bg-slate-900 text-white border-b-2 border-emerald-500'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>+ Punch New Order</span>
        </button>

        <button
          onClick={() => setActiveTab('DELIVERIES')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'DELIVERIES'
              ? 'bg-slate-900 text-white border-b-2 border-emerald-500'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{isCustomer ? `My Deliveries & Challans (${accessibleDeliveries.length})` : `Delivery Challans & Packing Slips (${deliveries.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('RECEIPTS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'RECEIPTS'
              ? 'bg-slate-900 text-white border-b-2 border-emerald-500'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{isCustomer ? `My Payment Receipts (${accessibleReceipts.length})` : `Payment Receipts (${receipts.length})`}</span>
        </button>

        {(isAdminOrTeam || isDistributor) && (
          <button
            onClick={() => setActiveTab('PRICE_LISTS')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'PRICE_LISTS'
                ? 'bg-slate-900 text-white border-b-2 border-emerald-500'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Price Lists & Margins</span>
          </button>
        )}

        {isAdminOrTeam && (
          <button
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'AUDIT_LOGS'
                ? 'bg-slate-900 text-white border-b-2 border-emerald-500'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Activity Trail & Audit Logs</span>
          </button>
        )}

        {!isCustomer && (
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'ANALYTICS'
                ? 'bg-slate-900 text-white border-b-2 border-emerald-500'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Order Reports & Analytics</span>
          </button>
        )}
      </div>

      {/* TAB 1: ALL ORDERS */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            <div className="flex-1 flex items-center space-x-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Order #, Customer, PO #, Paper Grade..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted (Pending)</option>
                <option value="APPROVED">Approved</option>
                <option value="STOCK_RESERVED">Stock Reserved</option>
                <option value="PROCESSING">Processing</option>
                <option value="PACKED">Packed in Godown</option>
                <option value="DISPATCHED">Dispatched on Truck</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              Showing <strong className="text-slate-900">{filteredOrders.length}</strong> of {orders.length} orders
            </div>
          </div>

          {/* Orders Big Screen Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Order # & Date</th>
                    <th className="py-3 px-4">Customer & Delivery</th>
                    <th className="py-3 px-4">Paper Products & GSM</th>
                    <th className="py-3 px-4 text-right">Qty & Weight</th>
                    <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                    <th className="py-3 px-4 text-center">Payment</th>
                    <th className="py-3 px-4 text-center">Fulfillment Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm text-slate-700">No Sales Orders found matching your criteria</p>
                        <p className="text-xs text-slate-400 mt-1">Create a new order or adjust your search filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(ord => {
                      const totalQty = ord.items.reduce((s, i) => s + i.quantity, 0);
                      const totalWeight = ord.items.reduce((s, i) => s + (i.quantityKgs || 0), 0);

                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                          
                          {/* Order # & Date */}
                          <td className="py-3.5 px-4">
                            <div className="font-black text-slate-950 flex items-center space-x-1.5">
                              <span>#{ord.orderNo}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{ord.orderDate}</div>
                            {ord.customerPoNumber && (
                              <div className="text-[10px] text-slate-400 font-semibold">PO: {ord.customerPoNumber}</div>
                            )}
                          </td>

                          {/* Customer */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{ord.customerName}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                              {ord.deliveryAddress || 'Standard Shipping'}
                            </div>
                            {ord.transporterName && (
                              <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                                <Truck className="w-3 h-3 text-emerald-700" />
                                <span>{ord.transporterName}</span>
                              </div>
                            )}
                          </td>

                          {/* Paper Items */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5 max-w-[240px]">
                              {ord.items.slice(0, 2).map((it, idx) => (
                                <div key={idx} className="text-[11px] text-slate-800 font-medium truncate">
                                  • <strong className="text-slate-950">{it.productName}</strong> ({it.gsm} GSM - {it.quantity} {it.unit})
                                </div>
                              ))}
                              {ord.items.length > 2 && (
                                <div className="text-[10px] text-emerald-700 font-bold">
                                  +{ord.items.length - 2} more paper grade(s)
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Qty & Weight */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-black text-slate-900">{formatNumber(totalQty)} Reams</div>
                            <div className="text-[11px] text-slate-500 font-semibold">{formatNumber(totalWeight)} Kg</div>
                          </td>

                          {/* Grand Total */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-black text-emerald-950 text-sm">{formatCurrency(ord.grandTotal)}</div>
                            <div className="text-[10px] text-slate-500">
                              Bal: <strong className="text-rose-700">{formatCurrency(ord.balanceDue || 0)}</strong>
                            </div>
                          </td>

                          {/* Payment */}
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              ord.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                              ord.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {ord.paymentStatus || 'UNPAID'}
                            </span>
                          </td>

                          {/* Fulfillment */}
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              ord.status === 'DELIVERED' ? 'bg-emerald-600 text-white' :
                              ord.status === 'DISPATCHED' ? 'bg-indigo-600 text-white' :
                              ord.status === 'PACKED' ? 'bg-blue-600 text-white' :
                              ord.status === 'APPROVED' ? 'bg-teal-600 text-white' :
                              ord.status === 'CANCELLED' || ord.status === 'REJECTED' ? 'bg-rose-600 text-white' :
                              'bg-amber-500 text-slate-950'
                            }`}>
                              {(ord.status || '').replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => setSelectedOrderForDetails(ord)}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                                title="View Complete Order & Timeline"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Details</span>
                              </button>

                              <button
                                onClick={() => setActiveOrderSlip(ord)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg text-xs transition"
                                title="Print Order Slip"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: NEW SALES ORDER */}
      {activeTab === 'NEW_ORDER' && (
        <NewSalesOrderForm
          currentUser={user!}
          onSuccess={(newOrd) => {
            setActiveTab('ORDERS');
            loadAllData();
            setSelectedOrderForDetails(newOrd);
          }}
          onCancel={() => setActiveTab('ORDERS')}
        />
      )}

      {/* TAB 3: DELIVERIES & CHALLANS */}
      {activeTab === 'DELIVERIES' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Delivery Challans & Dispatch Registry</h2>
                <p className="text-xs text-slate-500">Track outward warehouse shipments, vehicle LR numbers, and delivery receipts.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Challan # & Date</th>
                  <th className="py-3 px-4">Sales Order #</th>
                  <th className="py-3 px-4">Consignee Customer</th>
                  <th className="py-3 px-4">Transporter & Vehicle</th>
                  <th className="py-3 px-4">LR / GR Number</th>
                  <th className="py-3 px-4 text-right">Weight (Kg)</th>
                  <th className="py-3 px-4 text-center">Delivery Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-sm text-slate-700">No Delivery Challans generated yet</p>
                      <p className="text-xs text-slate-400 mt-1">Dispatch an order to create a delivery challan & packing slip.</p>
                    </td>
                  </tr>
                ) : (
                  deliveries.map(dc => (
                    <tr key={dc.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-black text-slate-950">
                        {dc.challanNo}
                        <span className="block text-[11px] text-slate-500 font-normal">{dc.dispatchDate}</span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-800">
                        #{dc.orderNo}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {dc.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <strong className="text-slate-900">{dc.transporterName}</strong>
                        <span className="block text-[11px] text-slate-500">Truck: {dc.vehicleNumber || 'MH-04-AB-1122'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-900">
                        {dc.lrGrNo || 'LR-PENDING'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {formatNumber(dc.totalWeightKgs || 0)} Kg
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                          {dc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setActiveDeliveryChallan(dc)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1 mx-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Challan</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENT RECEIPTS */}
      {activeTab === 'RECEIPTS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Money Receipts & Settlement Ledger</h2>
                <p className="text-xs text-slate-500">Official money receipts issued for customer sales orders.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt # & Date</th>
                  <th className="py-3 px-4">Customer Party</th>
                  <th className="py-3 px-4">Sales Order Ref</th>
                  <th className="py-3 px-4">Payment Mode & Bank</th>
                  <th className="py-3 px-4">UTR / Cheque Ref</th>
                  <th className="py-3 px-4 text-right">Amount Received (₹)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-sm text-slate-700">No Payment Receipts recorded yet</p>
                      <p className="text-xs text-slate-400 mt-1">Record a payment from the order details screen to generate money receipts.</p>
                    </td>
                  </tr>
                ) : (
                  receipts.map(rc => (
                    <tr key={rc.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-black text-slate-950">
                        {rc.receiptNo}
                        <span className="block text-[11px] text-slate-500 font-normal">{rc.paymentDate}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {rc.customerName}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-800">
                        #{rc.orderNo || 'DIRECT'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <strong className="text-slate-900 uppercase">{rc.paymentMode}</strong>
                        <span className="block text-[11px] text-slate-500">{rc.bankName || 'Direct'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {rc.referenceNo || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-950 text-sm">
                        {formatCurrency(rc.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setActiveReceiptSlip(rc)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1 mx-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PRICE LISTS */}
      {activeTab === 'PRICE_LISTS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Custom B2B & Distributor Price Lists</h2>
                <p className="text-xs text-slate-500">Tiered contract pricing, GSM slab discounts, and bulk volume rates.</p>
              </div>
            </div>

            {isAdminOrTeam && (
              <button
                onClick={() => setShowNewPriceListModal(true)}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Special Price List</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priceLists.length === 0 ? (
              <div className="col-span-2 bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
                No custom price lists configured. Standard mill catalog rates apply.
              </div>
            ) : (
              priceLists.map(pl => (
                <div key={pl.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-950">{pl.partyName}</h3>
                      <span className="text-[10px] font-bold uppercase text-emerald-700">
                        {pl.isDistributorTier ? 'Distributor Tier Pricing' : 'Custom Client Rate Sheet'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Effective: {pl.effectiveDate || 'Active'}</span>
                  </div>

                  <div className="space-y-2">
                    {pl.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl">
                        <div>
                          <strong className="text-slate-900">{it.productName}</strong>
                          <span className="block text-[10px] text-slate-500">{it.gsm} GSM • Min MOQ: {it.minOrderQuantity || 1} Reams</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-emerald-950">{formatCurrency(it.customRate)} / Ream</span>
                          {it.discountPercent > 0 && (
                            <span className="block text-[10px] text-emerald-700 font-bold">+{it.discountPercent}% Trade Disc</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'AUDIT_LOGS' && isAdminOrTeam && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-100 text-slate-800 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">B2B ERP Audit Trail & Security Logs</h2>
                <p className="text-xs text-slate-500">Immutable ledger of order changes, stock reservations, truck dispatches, and payments.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User & Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type & ID</th>
                  <th className="py-3 px-4">Details / Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {auditLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500 font-sans">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-4 font-sans font-bold text-slate-900">
                      {log.userName}
                      <span className="block text-[10px] text-slate-400 font-normal">({log.userRole})</span>
                    </td>
                    <td className="py-2.5 px-4 font-black text-emerald-800 uppercase">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-700">{log.entityType} #{log.entityId}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600 text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">B2B Paper Sales Analytics & Insights</h2>
                <p className="text-xs text-slate-500">Order breakdown by mill paper grades, fulfillment timelines, and cash collection.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Fulfillment Status Summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-950 uppercase tracking-wider text-[11px]">
                Order Status Distribution
              </h3>
              <div className="space-y-2 text-xs">
                {['DRAFT', 'SUBMITTED', 'APPROVED', 'STOCK_RESERVED', 'PACKED', 'DISPATCHED', 'DELIVERED'].map(st => {
                  const count = orders.filter(o => o.status === st).length;
                  const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                  return (
                    <div key={st} className="space-y-1">
                      <div className="flex justify-between text-slate-700 font-semibold">
                        <span>{(st || '').replace(/_/g, ' ')}:</span>
                        <span>{count} orders ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Customer / Distributor Demand */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-950 uppercase tracking-wider text-[11px]">
                Top Customer Order Volumes
              </h3>
              <div className="space-y-2 text-xs">
                {orders.slice(0, 5).map(ord => (
                  <div key={ord.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                    <div>
                      <strong className="text-slate-900">{ord.customerName}</strong>
                      <span className="block text-[10px] text-slate-500">Order #{ord.orderNo}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-950">{formatCurrency(ord.grandTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Efficiency Metrics */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-950 uppercase tracking-wider text-[11px]">
                Operational Metrics
              </h3>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                <span className="text-[10px] font-bold text-emerald-900 uppercase block">Dispatch Efficiency</span>
                <p className="text-emerald-950 font-extrabold text-sm mt-0.5">96.4% on-time truck dispatch</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Average Ream Weight</span>
                <p className="text-slate-900 font-extrabold text-sm mt-0.5">2.34 Kg per A4 / 75 GSM ream</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Central Warehouse Stock Reserved</span>
                <p className="text-indigo-950 font-extrabold text-sm mt-0.5">{orderStats?.stockReservedOrders || 0} active allocations</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Order Details Full Screen */}
      {selectedOrderForDetails && (
        <OrderDetailsModal
          order={selectedOrderForDetails}
          currentUser={user!}
          settings={settings!}
          transporters={transporters}
          warehouses={warehouses}
          onClose={() => setSelectedOrderForDetails(null)}
          onRefresh={() => {
            loadAllData();
            // Re-fetch active order
            api.getSalesOrderById(selectedOrderForDetails.id).then(o => setSelectedOrderForDetails(o));
          }}
          onOpenPackingModal={(ord) => setPackingModalOrder(ord)}
          onOpenDispatchModal={(ord) => setDispatchModalOrder(ord)}
          onOpenDeliverModal={(ord) => setDeliverModalOrder(ord)}
          onOpenPaymentModal={(ord) => setPaymentModalOrder(ord)}
          onOpenOrderSlip={(ord) => setActiveOrderSlip(ord)}
          onOpenDeliveryChallanSlip={(challanId) => {
            const ch = deliveries.find(d => d.id === challanId);
            if (ch) setActiveDeliveryChallan(ch);
          }}
          onOpenReceiptSlip={(receiptId) => {
            const rc = receipts.find(r => r.id === receiptId);
            if (rc) setActiveReceiptSlip(rc);
          }}
          onOpenInvoiceView={(invoiceId) => {
            if (onOpenInvoiceView) {
              api.getInvoiceById(invoiceId).then(inv => onOpenInvoiceView(inv));
            }
          }}
        />
      )}

      {/* MODAL: Packing */}
      {packingModalOrder && (
        <PackingDispatchModal
          order={packingModalOrder}
          mode="PACK"
          transporters={transporters}
          warehouses={warehouses}
          onClose={() => setPackingModalOrder(null)}
          onConfirmPack={handleConfirmPack}
          onConfirmDispatch={handleConfirmDispatch}
          onConfirmDeliver={handleConfirmDeliver}
        />
      )}

      {/* MODAL: Dispatching */}
      {dispatchModalOrder && (
        <PackingDispatchModal
          order={dispatchModalOrder}
          mode="DISPATCH"
          transporters={transporters}
          warehouses={warehouses}
          onClose={() => setDispatchModalOrder(null)}
          onConfirmPack={handleConfirmPack}
          onConfirmDispatch={handleConfirmDispatch}
          onConfirmDeliver={handleConfirmDeliver}
        />
      )}

      {/* MODAL: Deliver */}
      {deliverModalOrder && (
        <PackingDispatchModal
          order={deliverModalOrder}
          mode="DELIVER"
          transporters={transporters}
          warehouses={warehouses}
          onClose={() => setDeliverModalOrder(null)}
          onConfirmPack={handleConfirmPack}
          onConfirmDispatch={handleConfirmDispatch}
          onConfirmDeliver={handleConfirmDeliver}
        />
      )}

      {/* MODAL: Payment */}
      {paymentModalOrder && (
        <PaymentReceiptModal
          order={paymentModalOrder}
          onClose={() => setPaymentModalOrder(null)}
          onConfirmPayment={handleConfirmPayment}
        />
      )}

      {/* MODAL: Create Price List */}
      {showNewPriceListModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
              Add Custom Price List / Margin
            </h3>
            <form onSubmit={handleSavePriceList} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Party / Distributor Name</label>
                <input
                  type="text"
                  required
                  value={newPriceListPartyName}
                  onChange={(e) => setNewPriceListPartyName(e.target.value)}
                  placeholder="E.g., Star Printers & Stationers"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Paper Product Grade</label>
                <input
                  type="text"
                  required
                  value={newPriceListProductName}
                  onChange={(e) => setNewPriceListProductName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GSM</label>
                  <input
                    type="number"
                    value={newPriceListGsm}
                    onChange={(e) => setNewPriceListGsm(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Special Rate (₹/Ream)</label>
                  <input
                    type="number"
                    value={newPriceListCustomRate}
                    onChange={(e) => setNewPriceListCustomRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Additional Disc %</label>
                  <input
                    type="number"
                    value={newPriceListDiscount}
                    onChange={(e) => setNewPriceListDiscount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Order Qty (Reams)</label>
                  <input
                    type="number"
                    value={newPriceListMinQty}
                    onChange={(e) => setNewPriceListMinQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewPriceListModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold"
                >
                  Save Price List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
