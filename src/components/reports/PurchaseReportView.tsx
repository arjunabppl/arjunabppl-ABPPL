import React, { useState } from 'react';
import { PurchaseOrder } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import { exportToPdf, exportToExcel, ColumnDefinition, SummaryStat } from '../../utils/exportUtils.js';
import { ShoppingCart, Search, Filter, FileText, FileSpreadsheet, Building2, Package, Layers } from 'lucide-react';

interface PurchaseReportViewProps {
  purchaseOrders: PurchaseOrder[];
  startDate: string;
  endDate: string;
}

export const PurchaseReportView: React.FC<PurchaseReportViewProps> = ({ purchaseOrders, startDate, endDate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter purchase orders
  const filteredPurchases = purchaseOrders.filter(po => {
    if (po.orderDate && (po.orderDate < startDate || po.orderDate > endDate)) {
      return false;
    }
    if (statusFilter !== 'ALL' && po.status !== statusFilter) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchPo = po.poNumber.toLowerCase().includes(q);
      const matchSupp = po.supplierName.toLowerCase().includes(q);
      const matchItem = (po.items || []).some(i => i.productName.toLowerCase().includes(q));
      return matchPo || matchSupp || matchItem;
    }
    return true;
  });

  // Calculate Purchase Statistics
  const totalPurchasesCount = filteredPurchases.length;
  const totalPurchaseTurnover = filteredPurchases.reduce((s, p) => s + (p.grandTotal || 0), 0);
  const totalTaxablePurchases = filteredPurchases.reduce((s, p) => s + (p.taxableAmount || (p.subtotal - (p.discountTotal || 0))), 0);
  const totalInputGst = filteredPurchases.reduce((s, p) => s + (p.gstTotal || 0), 0);
  const totalInputCgst = Math.round((totalInputGst / 2) * 100) / 100;
  const totalInputSgst = Math.round((totalInputGst / 2) * 100) / 100;
  
  const totalReamsInward = filteredPurchases.reduce((sum, p) => {
    return sum + (p.items || []).reduce((iSum, it) => iSum + (it.quantity || 0), 0);
  }, 0);

  const totalWeightInwardKg = filteredPurchases.reduce((sum, p) => {
    return sum + (p.items || []).reduce((iSum, it) => iSum + (it.totalWeightKg || (it.quantity * (it.calculatedReamWeightKg || 20))), 0);
  }, 0);

  // PDF Export
  const handleExportPdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'PO Number', dataKey: 'poNumber', align: 'left' },
      { header: 'Date', dataKey: 'orderDate', align: 'center' },
      { header: 'Supplier Mill', dataKey: 'supplierName', align: 'left' },
      { header: 'Paper Grades / Items', dataKey: 'itemsSummary', align: 'left', format: (_, r) => (r.items || []).map((i: any) => `${i.productName} (${i.quantity} ${i.unit || 'Reams'})`).join(', ') },
      { header: 'Total Reams', dataKey: 'totalReams', align: 'center', format: (_, r) => formatNumber((r.items || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0)) },
      { header: 'Weight (MT)', dataKey: 'weightMt', align: 'right', format: (_, r) => {
        const wt = (r.items || []).reduce((s: number, i: any) => s + (i.totalWeightKg || (i.quantity * (i.calculatedReamWeightKg || 20))), 0);
        return (wt / 1000).toFixed(2);
      }},
      { header: 'Taxable (₹)', dataKey: 'taxableAmount', align: 'right', format: (v, r) => formatCurrency(v || (r.subtotal - (r.discountTotal || 0))) },
      { header: 'Input GST (18%) (₹)', dataKey: 'gstTotal', align: 'right', format: v => formatCurrency(v) },
      { header: 'PO Total (₹)', dataKey: 'grandTotal', align: 'right', format: v => formatCurrency(v) },
      { header: 'Status', dataKey: 'status', align: 'center' }
    ];

    const stats: SummaryStat[] = [
      { label: 'Total Purchase Orders', value: totalPurchasesCount },
      { label: 'Purchased Reams', value: `${formatNumber(totalReamsInward)} Reams` },
      { label: 'Inward Metric Weight', value: `${(totalWeightInwardKg / 1000).toFixed(2)} MT` },
      { label: 'Taxable Purchases', value: formatCurrency(totalTaxablePurchases) },
      { label: 'Eligible ITC (Input GST)', value: formatCurrency(totalInputGst) },
      { label: 'Gross Mill Inward Value', value: formatCurrency(totalPurchaseTurnover) }
    ];

    exportToPdf({
      title: 'Comprehensive Purchase Orders & Mill Inward Register',
      subtitle: `Domestic & International Paper Mill Purchases and Eligible ITC Register (${filteredPurchases.length} Records)`,
      dateRange: { start: startDate, end: endDate },
      fileName: `Purchase_Report_${startDate}_to_${endDate}`,
      summaryStats: stats,
      columns,
      data: filteredPurchases,
      orientation: 'landscape'
    });
  };

  // Excel Export
  const handleExportExcel = () => {
    const columns: ColumnDefinition[] = [
      { header: 'PO Number', dataKey: 'poNumber' },
      { header: 'Order Date', dataKey: 'orderDate' },
      { header: 'Supplier Mill Name', dataKey: 'supplierName', width: 28 },
      { header: 'Expected Delivery', dataKey: 'expectedDeliveryDate', format: v => v || '-' },
      { header: 'Inward Quantity (Reams)', dataKey: 'items', format: (v: any[]) => (v || []).reduce((s, i) => s + (i.quantity || 0), 0) },
      { header: 'Inward Weight (Kgs)', dataKey: 'items', format: (v: any[]) => (v || []).reduce((s, i) => s + (i.totalWeightKg || (i.quantity * (i.calculatedReamWeightKg || 20))), 0) },
      { header: 'Subtotal Amount (₹)', dataKey: 'subtotal' },
      { header: 'Discount (₹)', dataKey: 'discountTotal', format: v => v || 0 },
      { header: 'Taxable Amount (₹)', dataKey: 'taxableAmount', format: (v, r) => v || (r.subtotal - (r.discountTotal || 0)) },
      { header: 'Input CGST 9% (₹)', dataKey: 'gstTotal', format: v => Math.round((v / 2) * 100) / 100 },
      { header: 'Input SGST 9% (₹)', dataKey: 'gstTotal', format: v => Math.round((v / 2) * 100) / 100 },
      { header: 'Total Input GST (18%) (₹)', dataKey: 'gstTotal' },
      { header: 'Grand PO Total (₹)', dataKey: 'grandTotal' },
      { header: 'PO Status', dataKey: 'status' },
      { header: 'GRN Received', dataKey: 'grnNos', format: v => (v && v.length > 0 ? v.join(', ') : 'Pending') }
    ];

    const stats: SummaryStat[] = [
      { label: 'Total POs', value: totalPurchasesCount },
      { label: 'Total Reams Purchased', value: totalReamsInward },
      { label: 'Total Inward Weight (Kgs)', value: totalWeightInwardKg },
      { label: 'Taxable Purchases (₹)', value: totalTaxablePurchases },
      { label: 'Eligible ITC (Input GST ₹)', value: totalInputGst },
      { label: 'Gross Mill Inwards (₹)', value: totalPurchaseTurnover }
    ];

    exportToExcel({
      fileName: `Purchase_Report_${startDate}_${endDate}`,
      sheetName: 'Purchase Register',
      title: 'Comprehensive Purchase Orders & Mill Inward Register',
      subtitle: 'Amriteshwar Balaji Paper Pvt. Ltd. - Inward Mill Purchases Ledger',
      dateRange: { start: startDate, end: endDate },
      summaryStats: stats,
      columns,
      data: filteredPurchases,
      totalsRow: {
        poNumber: 'TOTAL',
        subtotal: totalTaxablePurchases,
        gstTotal: totalInputGst,
        grandTotal: totalPurchaseTurnover
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <h3 className="font-extrabold text-sm text-white">Purchase Orders & Mill Inwards Register</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Period: {startDate} to {endDate} &bull; Paper Mill Inwards, Inbound Freight, and Input Tax Credit Ledger
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Mill POs</span>
            <span className="text-xl font-black text-white">{totalPurchasesCount}</span>
          </div>
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Purchased Quantity</span>
            <span className="text-xl font-black text-white">{formatNumber(totalReamsInward)} Reams</span>
          </div>
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Inward Metric Wt</span>
            <span className="text-xl font-black text-emerald-400">{(totalWeightInwardKg / 1000).toFixed(2)} MT</span>
          </div>
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Eligible Input ITC</span>
            <span className="text-xl font-black text-blue-400">{formatCurrency(totalInputGst)}</span>
          </div>
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 border-blue-500/40">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Inward Total</span>
            <span className="text-xl font-black text-amber-400">{formatCurrency(totalPurchaseTurnover)}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by PO number, supplier mill, paper grade..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">PO Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All PO Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued / Sent to Mill</option>
            <option value="CONFIRMED">Confirmed by Mill</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="RECEIVED">Received & Inspected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
            <span>Purchase Orders Breakdown</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800 font-bold">
              {filteredPurchases.length} Purchase Orders
            </span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <th className="p-3">PO No & Date</th>
                <th className="p-3">Supplier Mill</th>
                <th className="p-3">Purchased Items</th>
                <th className="p-3 text-center">Reams</th>
                <th className="p-3 text-center">Weight (MT)</th>
                <th className="p-3 text-right">Taxable (₹)</th>
                <th className="p-3 text-right">Input GST (18%)</th>
                <th className="p-3 text-right">PO Total (₹)</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No purchase orders found for the selected period.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(po => {
                  const taxable = po.taxableAmount || (po.subtotal - (po.discountTotal || 0));
                  const poReams = (po.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
                  const poKg = (po.items || []).reduce((s, i) => s + (i.totalWeightKg || (i.quantity * (i.calculatedReamWeightKg || 20))), 0);

                  return (
                    <tr key={po.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 font-mono block">{po.poNumber}</span>
                        <span className="text-[11px] text-slate-500">{po.orderDate}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{po.supplierName}</td>
                      <td className="p-3 max-w-xs">
                        <div className="space-y-0.5">
                          {(po.items || []).map((it, idx) => (
                            <div key={idx} className="text-[11px] text-slate-700 truncate">
                              &bull; {it.productName} - <span className="font-semibold">{it.quantity} {it.unit || 'Reams'}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-900">
                        {formatNumber(poReams)}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-800">
                        {(poKg / 1000).toFixed(2)} MT
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">{formatCurrency(taxable)}</td>
                      <td className="p-3 text-right font-mono text-blue-700 font-semibold">{formatCurrency(po.gstTotal || 0)}</td>
                      <td className="p-3 text-right font-mono font-black text-slate-900">{formatCurrency(po.grandTotal || 0)}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                          {po.status}
                        </span>
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
