import React, { useState } from 'react';
import { SalesOrder } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import { exportToPdf, exportToExcel, ColumnDefinition, SummaryStat } from '../../utils/exportUtils.js';
import { Layers, Search, Filter, FileText, FileSpreadsheet, Tag, Building2, Package } from 'lucide-react';

interface OrderDetailsReportProps {
  orders: SalesOrder[];
  startDate: string;
  endDate: string;
}

interface FlattenedOrderItem {
  orderId: string;
  orderNo: string;
  orderDate: string;
  orderStatus: string;
  customerId: string;
  customerName: string;
  customerCity: string;
  productId: string;
  productName: string;
  category: string;
  brand?: string;
  gsm: number;
  sizeInches: string;
  unit: string;
  quantity: number;
  reamWeightKg: number;
  totalWeightKg: number;
  rate: number;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
}

export const OrderDetailsReport: React.FC<OrderDetailsReportProps> = ({ orders, startDate, endDate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Flatten all items across sales orders
  const allOrderItems: FlattenedOrderItem[] = [];

  orders.forEach(so => {
    // Filter by order date
    if (so.orderDate && (so.orderDate < startDate || so.orderDate > endDate)) {
      return;
    }

    if (statusFilter !== 'ALL' && so.status !== statusFilter) {
      return;
    }

    (so.items || []).forEach(item => {
      const gsm = item.gsm || 80;
      const sizeInches = item.sizeInches || '23x36';
      let reamWeight = item.calculatedReamWeightKg || 0;
      if (!reamWeight) {
        const parts = sizeInches.toLowerCase().split('x').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          reamWeight = (parts[0] * parts[1] * gsm * 500) / 3100000;
        } else {
          reamWeight = 20;
        }
      }

      const totalWt = item.totalWeightKg || Math.round(item.quantity * reamWeight * 100) / 100;
      const itemSubtotal = item.subtotal || item.quantity * item.rate;
      const gstRate = item.gstRate || 18;
      const gstAmount = Math.round((itemSubtotal * (gstRate / 100)) * 100) / 100;
      const totalAmount = item.totalAmount || itemSubtotal + gstAmount;

      allOrderItems.push({
        orderId: so.id,
        orderNo: so.orderNo,
        orderDate: so.orderDate,
        orderStatus: so.status,
        customerId: so.customerId,
        customerName: so.customerName,
        customerCity: so.billTo?.city || '-',
        productId: item.productId,
        productName: item.productName,
        category: (item as any).category || 'Paper',
        brand: (item as any).brand || 'Standard Mill',
        gsm,
        sizeInches,
        unit: item.unit || 'Reams',
        quantity: item.quantity,
        reamWeightKg: reamWeight,
        totalWeightKg: totalWt,
        rate: item.rate,
        subtotal: itemSubtotal,
        gstRate,
        gstAmount,
        totalAmount
      });
    });
  });

  // Filter with search term
  const filteredItems = allOrderItems.filter(item => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.orderNo.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.productName.toLowerCase().includes(q) ||
      item.customerCity.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      String(item.gsm).includes(q)
    );
  });

  // Totals
  const totalItemCount = filteredItems.length;
  const totalOrderedQuantity = filteredItems.reduce((s, i) => s + i.quantity, 0);
  const totalItemWeightKg = filteredItems.reduce((s, i) => s + i.totalWeightKg, 0);
  const totalTaxableValue = filteredItems.reduce((s, i) => s + i.subtotal, 0);
  const totalGstValue = filteredItems.reduce((s, i) => s + i.gstAmount, 0);
  const totalGrossItemValue = filteredItems.reduce((s, i) => s + i.totalAmount, 0);

  // Export PDF
  const handleExportPdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Order Ref', dataKey: 'orderNo', align: 'left' },
      { header: 'Date', dataKey: 'orderDate', align: 'center' },
      { header: 'Customer Buyer', dataKey: 'customerName', align: 'left' },
      { header: 'Paper Item / Grade', dataKey: 'productName', align: 'left' },
      { header: 'GSM & Size', dataKey: 'spec', align: 'center', format: (_, r) => `${r.gsm} GSM (${r.sizeInches}")` },
      { header: 'Ream Wt', dataKey: 'reamWeightKg', align: 'center', format: v => `${Number(v).toFixed(2)} Kg` },
      { header: 'Qty (Reams)', dataKey: 'quantity', align: 'center', format: v => formatNumber(v) },
      { header: 'Total Wt (MT)', dataKey: 'totalWeightKg', align: 'right', format: v => (v / 1000).toFixed(2) },
      { header: 'Rate (₹)', dataKey: 'rate', align: 'right', format: v => `₹${v}` },
      { header: 'Taxable (₹)', dataKey: 'subtotal', align: 'right', format: v => formatCurrency(v) },
      { header: 'GST (₹)', dataKey: 'gstAmount', align: 'right', format: v => formatCurrency(v) },
      { header: 'Line Total (₹)', dataKey: 'totalAmount', align: 'right', format: v => formatCurrency(v) },
      { header: 'Status', dataKey: 'orderStatus', align: 'center' }
    ];

    const stats: SummaryStat[] = [
      { label: 'Total Line Items', value: totalItemCount },
      { label: 'Ordered Quantity', value: `${formatNumber(totalOrderedQuantity)} Reams` },
      { label: 'Total Weight', value: `${(totalItemWeightKg / 1000).toFixed(2)} MT` },
      { label: 'Total Taxable Value', value: formatCurrency(totalTaxableValue) },
      { label: 'Total Output GST', value: formatCurrency(totalGstValue) },
      { label: 'Gross Line Value', value: formatCurrency(totalGrossItemValue) }
    ];

    exportToPdf({
      title: 'Itemized Order Details & Paper Specifications Matrix',
      subtitle: `Granular line-item breakdown of grades, GSM, ream weights, and GST rates (${filteredItems.length} Records)`,
      dateRange: { start: startDate, end: endDate },
      fileName: `Order_Details_Report_${startDate}_to_${endDate}`,
      summaryStats: stats,
      columns,
      data: filteredItems,
      orientation: 'landscape'
    });
  };

  // Export Excel
  const handleExportExcel = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Order No', dataKey: 'orderNo' },
      { header: 'Order Date', dataKey: 'orderDate' },
      { header: 'Customer Name', dataKey: 'customerName', width: 25 },
      { header: 'Customer City', dataKey: 'customerCity' },
      { header: 'Paper Grade Name', dataKey: 'productName', width: 28 },
      { header: 'Category', dataKey: 'category' },
      { header: 'GSM', dataKey: 'gsm' },
      { header: 'Size (Inches)', dataKey: 'sizeInches' },
      { header: 'Unit of Measure', dataKey: 'unit' },
      { header: 'Unit Ream Weight (Kg)', dataKey: 'reamWeightKg', format: v => Number(v).toFixed(2) },
      { header: 'Ordered Quantity', dataKey: 'quantity' },
      { header: 'Total Weight (Kgs)', dataKey: 'totalWeightKg' },
      { header: 'Unit Rate (₹)', dataKey: 'rate' },
      { header: 'Taxable Subtotal (₹)', dataKey: 'subtotal' },
      { header: 'GST Rate (%)', dataKey: 'gstRate' },
      { header: 'GST Amount (₹)', dataKey: 'gstAmount' },
      { header: 'Total Line Value (₹)', dataKey: 'totalAmount' },
      { header: 'Order Status', dataKey: 'orderStatus' }
    ];

    const stats: SummaryStat[] = [
      { label: 'Total Line Items', value: totalItemCount },
      { label: 'Total Reams Ordered', value: totalOrderedQuantity },
      { label: 'Total Weight (Kgs)', value: totalItemWeightKg },
      { label: 'Gross Line Turnover (₹)', value: totalGrossItemValue }
    ];

    exportToExcel({
      fileName: `Order_Details_Report_${startDate}_${endDate}`,
      sheetName: 'Order Details',
      title: 'Itemized Order Details & Paper Specifications Matrix',
      subtitle: 'Amriteshwar Balaji Paper Pvt. Ltd. - Sales Line Item Registry',
      dateRange: { start: startDate, end: endDate },
      summaryStats: stats,
      columns,
      data: filteredItems,
      totalsRow: {
        orderNo: 'TOTAL',
        quantity: totalOrderedQuantity,
        totalWeightKg: totalItemWeightKg,
        subtotal: totalTaxableValue,
        gstAmount: totalGstValue,
        totalAmount: totalGrossItemValue
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
              <Layers className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-sm text-white">Itemized Order Details & Specification Matrix</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Granular breakdown of every ordered paper item, GSM, size in inches, calculated ream weight, and tax rates
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
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Line Items</span>
            <span className="text-xl font-black text-amber-400">{totalItemCount} Items</span>
          </div>
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Ordered Quantity</span>
            <span className="text-xl font-black text-white">{formatNumber(totalOrderedQuantity)} Reams</span>
          </div>
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Weight</span>
            <span className="text-xl font-black text-white">{(totalItemWeightKg / 1000).toFixed(2)} MT</span>
          </div>
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 border-emerald-500/40">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Line Value</span>
            <span className="text-xl font-black text-emerald-400">{formatCurrency(totalGrossItemValue)}</span>
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
            placeholder="Search by order no, customer, product grade, GSM or category..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Order Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="PACKED">Packed</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="INVOICED">Invoiced</option>
          </select>
        </div>
      </div>

      {/* Table of Line Items */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
            <span>Order Line Items List</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800 font-bold">
              {filteredItems.length} Records
            </span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <th className="p-3">Order Ref & Date</th>
                <th className="p-3">Customer Buyer</th>
                <th className="p-3">Paper Grade & SKU</th>
                <th className="p-3 text-center">GSM / Size</th>
                <th className="p-3 text-center">Ream Wt</th>
                <th className="p-3 text-center">Qty (Reams)</th>
                <th className="p-3 text-center">Weight (MT)</th>
                <th className="p-3 text-right">Unit Rate (₹)</th>
                <th className="p-3 text-right">Taxable (₹)</th>
                <th className="p-3 text-right">Total Line (₹)</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    No order item records found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 font-mono block">{item.orderNo}</span>
                      <span className="text-[11px] text-slate-500">{item.orderDate}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{item.customerName}</span>
                      <span className="text-[11px] text-slate-500">{item.customerCity}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{item.productName}</span>
                      <span className="text-[11px] text-slate-500">{item.category}</span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-700">
                      {item.gsm} GSM ({item.sizeInches}")
                    </td>
                    <td className="p-3 text-center font-mono font-semibold">
                      {item.reamWeightKg.toFixed(2)} Kg
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900">
                      {formatNumber(item.quantity)}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-800">
                      {(item.totalWeightKg / 1000).toFixed(2)} MT
                    </td>
                    <td className="p-3 text-right font-mono">
                      ₹{item.rate}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-800">
                      {formatCurrency(item.subtotal)}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-slate-900">
                      {formatCurrency(item.totalAmount)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                        {item.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
