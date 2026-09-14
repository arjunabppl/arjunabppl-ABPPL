import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { DashboardSummary, Product, Invoice, SalesOrder, Customer } from '../types/index.js';
import { formatCurrency, formatNumber } from '../utils/paperMath.js';
import {
  TrendingUp, AlertTriangle, Users, Package, ShoppingBag,
  ArrowUpRight, Plus, Eye, Receipt, Clock, FileSpreadsheet,
  CheckCircle2, CreditCard, Layers, ShieldCheck, Truck, FileText
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface DashboardProps {
  onNavigate: (module: string) => void;
  onOpenInvoiceView?: (inv: Invoice) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenInvoiceView }) => {
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [customerOrders, setCustomerOrders] = useState<SalesOrder[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [customerProfile, setCustomerProfile] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isCustomer) {
      // Load customer isolated data
      Promise.all([
        api.getSalesOrders(),
        api.getInvoices('INVOICE'),
        api.getCustomers()
      ]).then(([allOrders, allInvoices, allCusts]) => {
        const partyId = user?.partyId || '';
        const partyName = (user?.partyName || user?.name || '').toLowerCase();
        const userEmail = (user?.email || '').toLowerCase();

        const myCust = allCusts.find(c =>
          (partyId && c.id === partyId) ||
          (partyName && (c.name || '').toLowerCase().includes(partyName)) ||
          (partyName && partyName.includes((c.name || '').toLowerCase())) ||
          (userEmail && (c.email || '').toLowerCase() === userEmail)
        ) || null;
        setCustomerProfile(myCust);

        const myOrders = (allOrders || []).filter(ord => {
          if (partyId && ord.customerId === partyId) return true;
          if (myCust && ord.customerId === myCust.id) return true;
          if (partyName && (ord.customerName || '').toLowerCase().includes(partyName)) return true;
          if (ord.customerName && partyName && partyName.includes((ord.customerName || '').toLowerCase())) return true;
          if (userEmail && (ord.billTo?.email || '').toLowerCase() === userEmail) return true;
          return false;
        });
        setCustomerOrders(myOrders);

        const myInvoices = (allInvoices || []).filter(inv => {
          if (partyId && inv.customerId === partyId) return true;
          if (myCust && inv.customerId === myCust.id) return true;
          if (partyName && (inv.customerName || '').toLowerCase().includes(partyName)) return true;
          if (inv.customerName && partyName && partyName.includes((inv.customerName || '').toLowerCase())) return true;
          return false;
        });
        setCustomerInvoices(myInvoices);
      }).catch(err => console.error('Customer dashboard load error:', err))
        .finally(() => setLoading(false));
    } else {
      api.getDashboardSummary()
        .then(res => setData(res))
        .catch(err => console.error('Dashboard load error:', err))
        .finally(() => setLoading(false));
    }
  }, [isCustomer, user]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-semibold">
            {isCustomer ? 'Loading Your Account Dashboard...' : 'Loading ABPPL Business Overview...'}
          </p>
        </div>
      </div>
    );
  }

  // Customer Dedicated Portal View
  if (isCustomer) {
    const totalOrderSpend = customerInvoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0) ||
      customerOrders.reduce((s, ord) => s + (ord.grandTotal || 0), 0);
    const outstandingDue = customerProfile?.outstandingBalance ??
      customerInvoices.reduce((s, inv) => s + (inv.balanceDue ?? (inv.grandTotal - (inv.paidAmount || 0))), 0);
    const creditLimit = customerProfile?.creditLimit || 500000;
    const availableCredit = Math.max(0, creditLimit - outstandingDue);

    const pendingOrdersCount = customerOrders.filter(o => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.status)).length;
    const deliveredOrdersCount = customerOrders.filter(o => ['DELIVERED', 'INVOICED', 'COMPLETED'].includes(o.status)).length;

    return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Customer Top Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight">Customer Portal</h1>
              <span className="text-[10px] uppercase bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-800">
                Verified Buyer
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Welcome, <strong className="text-emerald-400">{user?.partyName || user?.name}</strong> • Real-time orders, billings, and credit ledger
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => onNavigate('orders')}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Punch New Order</span>
            </button>

            <button
              onClick={() => onNavigate('invoices')}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-lg border border-slate-700 transition"
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>My GST Invoices</span>
            </button>

            <button
              onClick={() => onNavigate('products')}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-lg border border-slate-700 transition"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Paper Catalog</span>
            </button>
          </div>
        </div>

        {/* Customer Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Orders Placed */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders Placed</span>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-slate-900">{customerOrders.length} Orders</div>
              <p className="text-[11px] text-slate-500 mt-0.5">{deliveredOrdersCount} Delivered &bull; {pendingOrdersCount} In Progress</p>
            </div>
          </div>

          {/* Outstanding Account Due */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Outstanding Due</span>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-slate-900">{formatCurrency(outstandingDue)}</div>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-slate-500">Invoiced balance</span>
                <button
                  onClick={() => onNavigate('payments')}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  View Receipts
                </button>
              </div>
            </div>
          </div>

          {/* Credit Limit Status */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Credit Limit</span>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-slate-900">{formatCurrency(creditLimit)}</div>
              <p className="text-[11px] text-emerald-700 font-bold mt-0.5">Available: {formatCurrency(availableCredit)}</p>
            </div>
          </div>

          {/* Total Billed Purchases */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Purchases</span>
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-slate-900">{formatCurrency(totalOrderSpend)}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">{customerInvoices.length} Invoices Issued</p>
            </div>
          </div>
        </div>

        {/* Recent Orders & Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active / Recent Orders */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Recent Purchase Orders</h3>
                <p className="text-xs text-slate-500">Your latest paper orders placed with ABPPL</p>
              </div>
              <button
                onClick={() => onNavigate('orders')}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                View All &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="p-3">Order No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Grand Total</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {customerOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        No orders placed yet. Click "Punch New Order" to start.
                      </td>
                    </tr>
                  ) : (
                    customerOrders.slice(0, 5).map(ord => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-bold font-mono text-emerald-900">#{ord.orderNo}</td>
                        <td className="p-3 text-slate-500">{ord.orderDate}</td>
                        <td className="p-3 text-right font-extrabold text-slate-900">{formatCurrency(ord.grandTotal)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ord.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                            ord.status === 'DISPATCHED' ? 'bg-indigo-100 text-indigo-800' :
                            ord.status === 'PACKED' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {(ord.status || '').replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">My GST Invoices</h3>
                <p className="text-xs text-slate-500">Tax invoices issued for paper supplies</p>
              </div>
              <button
                onClick={() => onNavigate('invoices')}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                View All &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Payment</th>
                    <th className="p-3 text-center">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {customerInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        No invoices generated yet.
                      </td>
                    </tr>
                  ) : (
                    customerInvoices.slice(0, 5).map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-bold font-mono text-emerald-900">{inv.invoiceNo}</td>
                        <td className="p-3 text-slate-500">{inv.date}</td>
                        <td className="p-3 text-right font-extrabold text-slate-900">{formatCurrency(inv.grandTotal)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            inv.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                            inv.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => onOpenInvoiceView && onOpenInvoiceView(inv)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded transition"
                            title="View & Print Invoice"
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
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* Top Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold tracking-tight">Business Overview</h1>
            <span className="text-[10px] uppercase bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-800">
              Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time paper wholesaler performance, inventory stock levels and receivables
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => onNavigate('sales')}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Sales Order</span>
          </button>

          <button
            onClick={() => onNavigate('quotations')}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-lg border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>New Quotation</span>
          </button>

          <button
            onClick={() => onNavigate('payments')}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-lg border border-slate-700 transition"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Sales</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900">{formatCurrency(data.todaySales)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Updated live from sales orders</p>
          </div>
        </div>

        {/* Total Receivables */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Receivables</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900">{formatCurrency(data.totalReceivables)}</div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-500">{data.totalCustomersCount} Active Customers</span>
              <button 
                onClick={() => onNavigate('outstanding')}
                className="text-emerald-700 font-bold hover:underline"
              >
                View Dues
              </button>
            </div>
          </div>
        </div>

        {/* Supplier Payables */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier Payables</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900">{formatCurrency(data.totalPayables)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">{data.totalSuppliersCount} Paper Mills & Suppliers</p>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Items</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-rose-600">{data.lowStockCount} Items</div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-500">{data.totalProductsCount} Paper Grades Total</span>
              <button 
                onClick={() => onNavigate('inventory')}
                className="text-emerald-700 font-bold hover:underline"
              >
                Manage Stock
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Analytics Chart & Low Stock Side Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart: Monthly Sales vs Purchases */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Sales vs Purchases Trend (INR)</h3>
              <p className="text-xs text-slate-500">Comparative business trade performance</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
            >
              <span>Detailed Report</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickFormatter={val => `₹${val/100000}L`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="sales" name="Sales (₹)" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchases" name="Purchases (₹)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alert Box */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900">Low Stock Reorder Alerts</h3>
              </div>
              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                {data.lowStockProducts.length} Items
              </span>
            </div>

            <div className="space-y-3">
              {data.lowStockProducts.map(prod => (
                <div key={prod.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{prod.name}</h4>
                      <p className="text-[10px] text-slate-500">{prod.gsm} GSM ({prod.sizeInches}") &bull; {prod.category}</p>
                    </div>
                    <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {prod.currentStock} {prod.unit}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] border-t border-slate-200/60 pt-1.5">
                    <span className="text-slate-500">Min Reorder Level: {prod.minStockLevel} {prod.unit}</span>
                    <button
                      onClick={() => onNavigate('inventory')}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Stock In
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('products')}
            className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg transition"
          >
            Open Product Master Catalog
          </button>
        </div>

      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recent Sales Invoices</h3>
            <p className="text-xs text-slate-500">Latest transactions dispatched to customers</p>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            View All Invoices &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="p-3">Invoice No</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Grand Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.recentInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-bold font-mono text-emerald-900">{inv.invoiceNo}</td>
                  <td className="p-3 font-semibold text-slate-900">{inv.customerName}</td>
                  <td className="p-3 text-slate-500">{inv.date}</td>
                  <td className="p-3 text-right font-extrabold text-slate-900">
                    {formatCurrency(inv.grandTotal)}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      inv.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                      inv.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onOpenInvoiceView && onOpenInvoiceView(inv)}
                      className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded transition"
                      title="View & Print Invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
