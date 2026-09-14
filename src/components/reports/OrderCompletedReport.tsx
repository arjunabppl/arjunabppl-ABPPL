import React, { useState } from 'react';
import { SalesOrder } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import { exportToPdf, exportToExcel, ColumnDefinition, SummaryStat } from '../../utils/exportUtils.js';
import { CheckCircle2, Search, Filter, FileText, FileSpreadsheet, Truck, Layers, Calendar } from 'lucide-react';

interface OrderCompletedReportProps {
  orders: SalesOrder[];
  startDate: string;
  endDate: string;
}

export const OrderCompletedReport: React.FC<OrderCompletedReportProps> = ({ orders, startDate, endDate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter for completed/delivered orders
  const completedOrders = orders.filter(so => {
    const isCompleted = ['DELIVERED', 'INVOICED', 'COMPLETED'].includes(so.status);
    if (!isCompleted) return false;

    // Filter by order date or delivery date
    const dateToCheck = so.actualDeliveryDate || so.orderDate;
    if (dateToCheck && (dateToCheck < startDate || dateToCheck > endDate)) {
      return false;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchOrderNo = so.orderNo.toLowerCase().includes(q);
      const matchCust = so.customerName.toLowerCase().includes(q);
      const matchCity = so.billTo?.city?.toLowerCase().includes(q) || false;
      const matchInvoice = (so.invoiceNos || []).some(no => no.toLowerCase().includes(q));
      const matchDc = (so.deliveryChallanNos || []).some(dc => dc.toLowerCase().includes(q));
      return matchOrderNo || matchCust || matchCity || matchInvoice || matchDc;
    }

    return true;
  });

  // Calculate KPIs
  const totalCompletedOrders = completedOrders.length;
  const totalDeliveredValue = completedOrders.reduce((sum, so) => sum + (so.grandTotal || 0), 0);
  const totalDeliveredQuantity = completedOrders.reduce((sum, so) => {
    return sum + (so.items || []).reduce((iSum, it) => iSum + (it.quantity || 0), 0);
  }, 0);
  const totalDeliveredWeightKg = completedOrders.reduce((sum, so) => {
    return sum + (so.items || []).reduce((iSum, it) => iSum + (it.totalWeightKg || (it.quantity * (it.calculatedReamWeightKg || 20))), 0);
  }, 0);

  const getLeadTimeDays = (orderDateStr: string, deliveryDateStr?: string) => {
    try {
      const oDate = new Date(orderDateStr);
      const dDate = deliveryDateStr ? new Date(deliveryDateStr) : new Date();
      const diff = Math.max(1, Math.floor((dDate.getTime() - oDate.getTime()) / (1000 * 60 * 60 * 24)));
      return diff;
    } catch {
      return 1;
    }
  };

  // Export PDF
  const handleExportPdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Order No', dataKey: 'orderNo', align: 'left' },
      { header: 'Order Date', dataKey: 'orderDate', align: 'center' },
      { header: 'Delivered Date', dataKey: 'actualDeliveryDate', align: 'center', format: v => v || 'Delivered' },
      { header: 'Customer Buyer', dataKey: 'customerName', align: 'left' },
      { header: 'Delivered Items', dataKey: 'itemsSummary', align: 'left', format: (_, r) => (r.items || []).map((i: any) => `${i.productName} (${i.quantity} ${i.unit || 'Reams'})`).join(', ') },
      { header: 'Total Reams', dataKey: 'totalReams', align: 'center', format: (_, r) => formatNumber((r.items || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0)) },
      { header: 'Weight (MT)', dataKey: 'weightMt', align: 'right', format: (_, r) => {
        const wt = (r.items || []).reduce((s: number, i: any) => s + (i.totalWeightKg || (i.quantity * (i.calculatedReamWeightKg || 20))), 0);
        return (wt / 1000).toFixed(2);
      }},
      { header: 'Invoice Ref', dataKey: 'invoiceNos', align: 'center', format: v => (v && v.length > 0 ? v.join(', ') : 'Generated') },
      { header: 'Fulfillment Lead Time', dataKey: 'leadTime', align: 'center', format: (_, r) => `${getLeadTimeDays(r.orderDate, r.actualDeliveryDate)} days` },
      { header: 'Grand Total (₹)', dataKey: 'grandTotal', align: 'right', format: v => formatCurrency(v) }
    ];

    const stats: SummaryStat[] = [
      { label: 'Completed Orders', value: totalCompletedOrders },
      { label: 'Delivered Quantity', value: `${formatNumber(totalDeliveredQuantity)} Reams` },
      { label: 'Delivered Weight', value: `${(totalDeliveredWeightKg / 1000).toFixed(2)} MT` },
      { label: 'Realized Turnover', value: formatCurrency(totalDeliveredValue) }
    ];

    exportToPdf({
      title: 'Completed & Delivered Orders Performance Report',
      subtitle: `Successfully fulfilled B2B paper dispatches and closed orders (${completedOrders.length} Completed Orders)`,
      dateRange: { start: startDate, end: endDate },
      fileName: `Completed_Orders_Report_${startDate}_to_${endDate}`,
      summaryStats: stats,
      columns,
      data: completedOrders,
      orientation: 'landscape'
    });
  };

  // Export Excel
  const handleExportExcel = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Order Number', dataKey: 'orderNo' },
      { header: 'Order Date', dataKey: 'orderDate' },
      { header: 'Delivered Date', dataKey: 'actualDeliveryDate', format: v => v || 'Delivered' },
      { header: 'Customer Buyer Name', dataKey: 'customerName', width: 26 },
      { header: 'Buyer GSTIN', dataKey: 'customerGstin', format: v => v || 'URP' },
      { header: 'City', dataKey: 'city', format: (_, r) => r.billTo?.city || '-' },
      { header: 'Delivered Reams / Units', dataKey: 'items', format: (v: any[]) => (v || []).reduce((s, i) => s + (i.quantity || 0), 0) },
      { header: 'Delivered Weight (Kgs)', dataKey: 'items', format: (v: any[]) => (v || []).reduce((s, i) => s + (i.totalWeightKg || (i.quantity * (i.calculatedReamWeightKg || 20))), 0) },
      { header: 'Delivery Challan No', dataKey: 'deliveryChallanNos', format: v => (v && v.length > 0 ? v.join(', ') : '-') },
      { header: 'Linked Invoice No', dataKey: 'invoiceNos', format: v => (v && v.length > 0 ? v.join(', ') : '-') },
      { header: 'Taxable Amount (₹)', dataKey: 'taxableAmount' },
      { header: 'GST Total (18%) (₹)', dataKey: 'gstTotal' },
      { header: 'Grand Total (₹)', dataKey: 'grandTotal' },
      { header: 'Payment Status', dataKey: 'paymentStatus', format: v => v || 'COMPLETED' },
      { header: 'Transporter', dataKey: 'transporterName', format: v => v || 'Direct Fleet' },
      { header: 'Fulfillment Lead Time (Days)', dataKey: 'orderDate', format: (v, r) => getLeadTimeDays(v, r.actualDeliveryDate) }
    ];

    const stats: SummaryStat[] = [
      { label: 'Total Completed Orders', value: totalCompletedOrders },
      { label: 'Total Delivered Quantity', value: totalDeliveredQuantity },
      { label: 'Total Delivered Weight (Kgs)', value: totalDeliveredWeightKg },
      { label: 'Total Realized Revenue (₹)', value: totalDeliveredValue }
    ];

    exportToExcel({
      fileName: `Completed_Orders_Report_${startDate}_${endDate}`,
      sheetName: 'Completed Orders',
      title: 'Completed & Delivered Orders Performance Report',
      subtitle: 'Amriteshwar Balaji Paper Pvt. Ltd. - Closed Sales Orders Registry',
      dateRange: { start: startDate, end: endDate },
      summaryStats: stats,
      columns,
      data: completedOrders,
      totalsRow: {
        orderNo: 'TOTAL',
        grandTotal: totalDeliveredValue
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-sm text-white">Completed & Delivered Orders Report</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Closed orders with delivery dates, invoices generated, and final realization status
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

        {/* 4-KPI Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Fulfilled Orders</span>
            <span className="text-xl font-black text-emerald-400">{totalCompletedOrders}</span>
          </div>
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivered Quantity</span>
            <span className="text-xl font-black text-white">{formatNumber(totalDeliveredQuantity)} Reams</span>
          </div>
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivered Weight</span>
            <span className="text-xl font-black text-white">{(totalDeliveredWeightKg / 1000).toFixed(2)} MT</span>
          </div>
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 border-emerald-500/40">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Realized Revenue</span>
            <span className="text-xl font-black text-emerald-400">{formatCurrency(totalDeliveredValue)}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search completed orders by order number, customer name, invoice no or DC..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Completed Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
            <span>Completed Orders List</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              {completedOrders.length} Records
            </span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <th className="p-3">Order No & Date</th>
                <th className="p-3">Delivered Date</th>
                <th className="p-3">Customer Buyer</th>
                <th className="p-3">Delivered Items Summary</th>
                <th className="p-3 text-center">Delivered Reams</th>
                <th className="p-3 text-center">Weight (MT)</th>
                <th className="p-3 text-center">Invoice Ref</th>
                <th className="p-3 text-center">Turnaround</th>
                <th className="p-3 text-right">Realized Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {completedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No completed orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                completedOrders.map(so => {
                  const leadTime = getLeadTimeDays(so.orderDate, so.actualDeliveryDate);
                  const orderReams = (so.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
                  const orderKg = (so.items || []).reduce((s, i) => s + (i.totalWeightKg || (i.quantity * (i.calculatedReamWeightKg || 20))), 0);

                  return (
                    <tr key={so.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 font-mono block">{so.orderNo}</span>
                        <span className="text-[11px] text-slate-500">{so.orderDate}</span>
                      </td>
                      <td className="p-3 font-semibold text-emerald-800 font-mono">
                        {so.actualDeliveryDate || 'Delivered'}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{so.customerName}</span>
                        <span className="text-[11px] text-slate-500">{so.billTo?.city || '-'}, {so.billTo?.state || '-'}</span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="space-y-0.5">
                          {(so.items || []).map((it, idx) => (
                            <div key={idx} className="text-[11px] text-slate-700 truncate">
                              &bull; {it.productName} - <span className="font-semibold">{it.quantity} {it.unit || 'Reams'}</span>
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
                      <td className="p-3 text-center font-mono font-bold text-slate-700">
                        {so.invoiceNos && so.invoiceNos.length > 0 ? so.invoiceNos.join(', ') : 'Invoice Ready'}
                      </td>
                      <td className="p-3 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                          {leadTime} days
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-emerald-900">
                        {formatCurrency(so.grandTotal)}
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
