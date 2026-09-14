import React, { useState } from 'react';
import { SalesOrder } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import { exportToPdf, exportToExcel, ColumnDefinition, SummaryStat } from '../../utils/exportUtils.js';
import { Clock, Search, Filter, FileText, FileSpreadsheet, AlertCircle, CheckCircle2, ChevronRight, Package, User } from 'lucide-react';

interface OrderPendingReportProps {
  orders: SalesOrder[];
  startDate: string;
  endDate: string;
}

export const OrderPendingReport: React.FC<OrderPendingReportProps> = ({ orders, startDate, endDate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  // Filter for pending orders (not yet fully delivered or cancelled/rejected)
  const pendingOrders = orders.filter(so => {
    const isPendingStatus = !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(so.status);
    if (!isPendingStatus) return false;

    // Date range filter
    if (so.orderDate && (so.orderDate < startDate || so.orderDate > endDate)) {
      return false;
    }

    // Stage filter
    if (stageFilter !== 'ALL' && so.status !== stageFilter) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchOrderNo = so.orderNo.toLowerCase().includes(q);
      const matchCust = so.customerName.toLowerCase().includes(q);
      const matchCity = so.billTo?.city?.toLowerCase().includes(q) || false;
      const matchItems = (so.items || []).some(item => item.productName.toLowerCase().includes(q));
      return matchOrderNo || matchCust || matchCity || matchItems;
    }

    return true;
  });

  // Calculate Key Summary Indicators
  const totalPendingOrders = pendingOrders.length;
  const totalPendingValue = pendingOrders.reduce((sum, so) => sum + (so.grandTotal || 0), 0);
  const totalAdvanceCollected = pendingOrders.reduce((sum, so) => sum + (so.paidAmount || 0), 0);
  const totalBalanceDue = pendingOrders.reduce((sum, so) => sum + (so.balanceDue ?? (so.grandTotal - (so.paidAmount || 0))), 0);
  
  const totalReams = pendingOrders.reduce((sum, so) => {
    return sum + (so.items || []).reduce((iSum, it) => iSum + (it.quantity || 0), 0);
  }, 0);

  const totalWeightKg = pendingOrders.reduce((sum, so) => {
    return sum + (so.items || []).reduce((iSum, it) => iSum + (it.totalWeightKg || (it.quantity * (it.calculatedReamWeightKg || 20))), 0);
  }, 0);

  const getDaysPending = (orderDateStr: string) => {
    try {
      const orderDate = new Date(orderDateStr);
      const now = new Date();
      const diffMs = now.getTime() - orderDate.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  };

  // Export Handlers
  const handleExportPdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Order No', dataKey: 'orderNo', align: 'left' },
      { header: 'Date', dataKey: 'orderDate', align: 'center' },
      { header: 'Customer Buyer', dataKey: 'customerName', align: 'left' },
      { header: 'City', dataKey: 'city', align: 'left', format: (_, r) => r.billTo?.city || '-' },
      { header: 'Items / Grades', dataKey: 'itemsSummary', align: 'left', format: (_, r) => (r.items || []).map((i: any) => `${i.productName} (${i.quantity} ${i.unit || 'Reams'})`).join(', ') },
      { header: 'Total Reams', dataKey: 'totalReams', align: 'center', format: (_, r) => formatNumber((r.items || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0)) },
      { header: 'Weight (MT)', dataKey: 'weightMt', align: 'right', format: (_, r) => {
        const wt = (r.items || []).reduce((s: number, i: any) => s + (i.totalWeightKg || (i.quantity * (i.calculatedReamWeightKg || 20))), 0);
        return (wt / 1000).toFixed(2);
      }},
      { header: 'Stage Status', dataKey: 'status', align: 'center' },
      { header: 'Days Pending', dataKey: 'daysPending', align: 'center', format: (_, r) => `${getDaysPending(r.orderDate)} days` },
      { header: 'Order Value (₹)', dataKey: 'grandTotal', align: 'right', format: v => formatCurrency(v) },
      { header: 'Advance (₹)', dataKey: 'paidAmount', align: 'right', format: v => formatCurrency(v || 0) },
      { header: 'Due Balance (₹)', dataKey: 'balanceDue', align: 'right', format: (v, r) => formatCurrency(v ?? (r.grandTotal - (r.paidAmount || 0))) }
    ];

    const stats: SummaryStat[] = [
      { label: 'Pending Orders', value: totalPendingOrders },
      { label: 'Pending Quantity', value: `${formatNumber(totalReams)} Reams` },
      { label: 'Pending Weight', value: `${(totalWeightKg / 1000).toFixed(2)} MT` },
      { label: 'Gross Order Value', value: formatCurrency(totalPendingValue) },
      { label: 'Advance Collected', value: formatCurrency(totalAdvanceCollected) },
      { label: 'Net Balance Due', value: formatCurrency(totalBalanceDue) }
    ];

    exportToPdf({
      title: 'Order Pendency & Backlog Status Report',
      subtitle: `Unfulfilled & In-Transit Paper Orders Register (${pendingOrders.length} Pending Orders)`,
      dateRange: { start: startDate, end: endDate },
      fileName: `Order_Pendency_Report_${startDate}_to_${endDate}`,
      summaryStats: stats,
      columns,
      data: pendingOrders,
      orientation: 'landscape'
    });
  };

  const handleExportExcel = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Order Number', dataKey: 'orderNo' },
      { header: 'Order Date', dataKey: 'orderDate' },
      { header: 'Customer Name', dataKey: 'customerName', width: 26 },
      { header: 'Customer Phone', dataKey: 'customerPhone', format: (v, r) => v || r.billTo?.phone || '-' },
      { header: 'City', dataKey: 'city', format: (_, r) => r.billTo?.city || '-' },
      { header: 'State', dataKey: 'state', format: (_, r) => r.billTo?.state || '-' },
      { header: 'Status / Stage', dataKey: 'status' },
      { header: 'Days Pending (Ageing)', dataKey: 'orderDate', format: v => getDaysPending(v) },
      { header: 'Items Count', dataKey: 'items', format: (v: any[]) => v ? v.length : 0 },
      { header: 'Total Quantity (Reams)', dataKey: 'items', format: (v: any[]) => (v || []).reduce((s, i) => s + (i.quantity || 0), 0) },
      { header: 'Total Weight (Kgs)', dataKey: 'items', format: (v: any[]) => (v || []).reduce((s, i) => s + (i.totalWeightKg || (i.quantity * (i.calculatedReamWeightKg || 20))), 0) },
      { header: 'Order Subtotal (₹)', dataKey: 'subtotal' },
      { header: 'Taxable Amount (₹)', dataKey: 'taxableAmount' },
      { header: 'Total GST (18%) (₹)', dataKey: 'gstTotal' },
      { header: 'Grand Total (₹)', dataKey: 'grandTotal' },
      { header: 'Advance Paid (₹)', dataKey: 'paidAmount', format: v => v || 0 },
      { header: 'Balance Due (₹)', dataKey: 'balanceDue', format: (v, r) => v ?? (r.grandTotal - (r.paidAmount || 0)) },
      { header: 'Payment Terms', dataKey: 'paymentTerms' },
      { header: 'Transporter', dataKey: 'transporterName', format: v => v || 'Direct Delivery' },
      { header: 'Vehicle No', dataKey: 'vehicleNumber', format: v => v || '-' }
    ];

    const stats: SummaryStat[] = [
      { label: 'Total Pending Orders', value: totalPendingOrders },
      { label: 'Total Pending Reams', value: totalReams },
      { label: 'Total Pending Weight (Kgs)', value: totalWeightKg },
      { label: 'Gross Pending Turnover (₹)', value: totalPendingValue },
      { label: 'Total Advance Collected (₹)', value: totalAdvanceCollected },
      { label: 'Net Pending Balance (₹)', value: totalBalanceDue }
    ];

    exportToExcel({
      fileName: `Order_Pendency_Report_${startDate}_${endDate}`,
      sheetName: 'Order Pendency',
      title: 'Order Pendency & Backlog Status Report',
      subtitle: 'Amriteshwar Balaji Paper Pvt. Ltd. - Unfulfilled Sales Orders Registry',
      dateRange: { start: startDate, end: endDate },
      summaryStats: stats,
      columns,
      data: pendingOrders,
      totalsRow: {
        orderNo: 'TOTAL',
        grandTotal: totalPendingValue,
        paidAmount: totalAdvanceCollected,
        balanceDue: totalBalanceDue
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Statistics */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm text-white">Order Pendency & Unfulfilled Backlog Report</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live tracking of pending, submitted, approved, packed, and in-transit orders with ageing calculation
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPdf}
              className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* 5-KPI Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending Orders</span>
            <span className="text-lg font-black text-amber-400">{totalPendingOrders}</span>
          </div>
          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending Quantity</span>
            <span className="text-lg font-black text-white">{formatNumber(totalReams)} Reams</span>
          </div>
          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending Weight</span>
            <span className="text-lg font-black text-white">{(totalWeightKg / 1000).toFixed(2)} MT</span>
          </div>
          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Order Value</span>
            <span className="text-lg font-black text-white">{formatCurrency(totalPendingValue)}</span>
          </div>
          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Advance Collected</span>
            <span className="text-lg font-black text-emerald-400">{formatCurrency(totalAdvanceCollected)}</span>
          </div>
          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700 border-rose-500/40">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending Balance Due</span>
            <span className="text-lg font-black text-rose-400">{formatCurrency(totalBalanceDue)}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by order number, customer name, paper grade or city..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Filter Stage:</span>
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Pending Stages</option>
            <option value="PENDING">Pending Approval</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved (Ready to Pack)</option>
            <option value="PACKED">Packed & Staged</option>
            <option value="IN_TRANSIT">In Transit (Dispatched)</option>
            <option value="PARTIAL_DISPATCHED">Partially Dispatched</option>
          </select>
        </div>
      </div>

      {/* Pending Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
            <span>Pending Orders List</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {pendingOrders.length} Records
            </span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <th className="p-3">Order No & Date</th>
                <th className="p-3">Customer Buyer</th>
                <th className="p-3">Paper Items Summary</th>
                <th className="p-3 text-center">Reams / Units</th>
                <th className="p-3 text-center">Weight (MT)</th>
                <th className="p-3 text-center">Stage Status</th>
                <th className="p-3 text-center">Days Pending</th>
                <th className="p-3 text-right">Order Value</th>
                <th className="p-3 text-right">Advance Paid</th>
                <th className="p-3 text-right">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pendingOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    No pending orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                pendingOrders.map(so => {
                  const days = getDaysPending(so.orderDate);
                  const orderReams = (so.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
                  const orderKg = (so.items || []).reduce((s, i) => s + (i.totalWeightKg || (i.quantity * (i.calculatedReamWeightKg || 20))), 0);
                  const dueBal = so.balanceDue ?? (so.grandTotal - (so.paidAmount || 0));

                  return (
                    <tr key={so.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 font-mono block">{so.orderNo}</span>
                        <span className="text-[11px] text-slate-500">{so.orderDate}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{so.customerName}</span>
                        <span className="text-[11px] text-slate-500">{so.billTo?.city || '-'}, {so.billTo?.state || '-'}</span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="space-y-0.5">
                          {(so.items || []).map((it, idx) => (
                            <div key={idx} className="text-[11px] text-slate-700 truncate">
                              &bull; {it.productName} ({it.gsm} GSM) - <span className="font-semibold">{it.quantity} {it.unit || 'Reams'}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-900">
                        {formatNumber(orderReams)}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-800">
                        {(orderKg / 1000).toFixed(2)} MT
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          so.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                          so.status === 'PACKED' ? 'bg-indigo-100 text-indigo-800' :
                          so.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {so.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                          days > 7 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {days} days
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(so.grandTotal)}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                        {formatCurrency(so.paidAmount || 0)}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-rose-700">
                        {formatCurrency(dueBal)}
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
  );
};
