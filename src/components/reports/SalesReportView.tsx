import React, { useState } from 'react';
import { Invoice, SalesOrder } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import { exportToPdf, exportToExcel, ColumnDefinition, SummaryStat } from '../../utils/exportUtils.js';
import { Receipt, Search, Filter, FileText, FileSpreadsheet, DollarSign, Calendar, TrendingUp } from 'lucide-react';

interface SalesReportViewProps {
  invoices: Invoice[];
  salesOrders: SalesOrder[];
  startDate: string;
  endDate: string;
}

export const SalesReportView: React.FC<SalesReportViewProps> = ({ invoices, salesOrders, startDate, endDate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter invoices by date
  const filteredInvoices = invoices.filter(inv => {
    if (inv.date && (inv.date < startDate || inv.date > endDate)) {
      return false;
    }
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchInv = inv.invoiceNo.toLowerCase().includes(q);
      const matchCust = inv.customerName.toLowerCase().includes(q);
      const matchGstin = (inv.customerGstin || '').toLowerCase().includes(q);
      return matchInv || matchCust || matchGstin;
    }
    return true;
  });

  // Calculate Sales Summary Totals
  const totalSalesCount = filteredInvoices.length;
  const totalGrossTurnover = filteredInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
  const totalTaxableSales = filteredInvoices.reduce((s, i) => s + ((i.subtotal || 0) - (i.discountTotal || 0)), 0);
  const totalGstCollected = filteredInvoices.reduce((s, i) => s + (i.gstTotal || 0), 0);
  const totalCgst = Math.round((totalGstCollected / 2) * 100) / 100;
  const totalSgst = Math.round((totalGstCollected / 2) * 100) / 100;
  const totalFreight = filteredInvoices.reduce((s, i) => s + (i.freightCharges || 0), 0);

  // PDF Export
  const handleExportPdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Invoice No', dataKey: 'invoiceNo', align: 'left' },
      { header: 'Date', dataKey: 'date', align: 'center' },
      { header: 'Customer Buyer', dataKey: 'customerName', align: 'left' },
      { header: 'GSTIN', dataKey: 'customerGstin', align: 'center', format: v => v || 'URP' },
      { header: 'Place of Supply', dataKey: 'placeOfSupply', align: 'center', format: v => v || 'Maharashtra (27)' },
      { header: 'Taxable (₹)', dataKey: 'subtotal', align: 'right', format: (v, r) => formatCurrency(v - (r.discountTotal || 0)) },
      { header: 'CGST 9% (₹)', dataKey: 'cgst', align: 'right', format: (_, r) => formatCurrency(r.gstTotal / 2) },
      { header: 'SGST 9% (₹)', dataKey: 'sgst', align: 'right', format: (_, r) => formatCurrency(r.gstTotal / 2) },
      { header: 'Total GST (₹)', dataKey: 'gstTotal', align: 'right', format: v => formatCurrency(v) },
      { header: 'Freight (₹)', dataKey: 'freightCharges', align: 'right', format: v => formatCurrency(v || 0) },
      { header: 'Invoice Total (₹)', dataKey: 'grandTotal', align: 'right', format: v => formatCurrency(v) },
      { header: 'Status', dataKey: 'status', align: 'center' }
    ];

    const stats: SummaryStat[] = [
      { label: 'Total Invoices', value: totalSalesCount },
      { label: 'Taxable Sales', value: formatCurrency(totalTaxableSales) },
      { label: 'CGST (9%)', value: formatCurrency(totalCgst) },
      { label: 'SGST (9%)', value: formatCurrency(totalSgst) },
      { label: 'Total GST (18%)', value: formatCurrency(totalGstCollected) },
      { label: 'Gross Sales Revenue', value: formatCurrency(totalGrossTurnover) }
    ];

    exportToPdf({
      title: 'Comprehensive Sales & Revenue Register',
      subtitle: `Official B2B Tax Invoices, GST Breakdown, and Revenue Register (${filteredInvoices.length} Invoices)`,
      dateRange: { start: startDate, end: endDate },
      fileName: `Sales_Report_${startDate}_to_${endDate}`,
      summaryStats: stats,
      columns,
      data: filteredInvoices,
      orientation: 'landscape'
    });
  };

  // Excel Export
  const handleExportExcel = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Invoice No', dataKey: 'invoiceNo' },
      { header: 'Date', dataKey: 'date' },
      { header: 'Customer Name', dataKey: 'customerName', width: 25 },
      { header: 'Customer GSTIN', dataKey: 'customerGstin', format: v => v || 'URP' },
      { header: 'Place of Supply', dataKey: 'placeOfSupply', format: v => v || 'Maharashtra (27)' },
      { header: 'Subtotal Amount (₹)', dataKey: 'subtotal' },
      { header: 'Discount (₹)', dataKey: 'discountTotal', format: v => v || 0 },
      { header: 'Taxable Amount (₹)', dataKey: 'subtotal', format: (v, r) => Math.round((v - (r.discountTotal || 0)) * 100) / 100 },
      { header: 'CGST 9% (₹)', dataKey: 'gstTotal', format: v => Math.round((v / 2) * 100) / 100 },
      { header: 'SGST 9% (₹)', dataKey: 'gstTotal', format: v => Math.round((v / 2) * 100) / 100 },
      { header: 'Total GST 18% (₹)', dataKey: 'gstTotal' },
      { header: 'Freight & Surcharges (₹)', dataKey: 'freightCharges', format: v => v || 0 },
      { header: 'Invoice Total (₹)', dataKey: 'grandTotal' },
      { header: 'Payment Status', dataKey: 'status' }
    ];

    const stats: SummaryStat[] = [
      { label: 'Total Invoices', value: totalSalesCount },
      { label: 'Taxable Turnover (₹)', value: totalTaxableSales },
      { label: 'Total Output GST (₹)', value: totalGstCollected },
      { label: 'Gross Sales Revenue (₹)', value: totalGrossTurnover }
    ];

    exportToExcel({
      fileName: `Sales_Report_${startDate}_${endDate}`,
      sheetName: 'Sales Register',
      title: 'Comprehensive Sales & Revenue Register',
      subtitle: 'Amriteshwar Balaji Paper Pvt. Ltd. - B2B GST Sales Invoices',
      dateRange: { start: startDate, end: endDate },
      summaryStats: stats,
      columns,
      data: filteredInvoices,
      totalsRow: {
        invoiceNo: 'TOTAL',
        subtotal: totalTaxableSales,
        gstTotal: totalGstCollected,
        freightCharges: totalFreight,
        grandTotal: totalGrossTurnover
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
              <Receipt className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-sm text-white">Sales & Revenue Register (18% GST Paper Standard)</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Period: {startDate} to {endDate} &bull; Registered B2B Sales Invoices & Output Tax Ledger
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
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Invoices</span>
            <span className="text-xl font-black text-white">{totalSalesCount}</span>
          </div>
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Taxable Sales</span>
            <span className="text-xl font-black text-white">{formatCurrency(totalTaxableSales)}</span>
          </div>
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Output CGST (9%)</span>
            <span className="text-xl font-black text-emerald-400">{formatCurrency(totalCgst)}</span>
          </div>
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Output SGST (9%)</span>
            <span className="text-xl font-black text-emerald-400">{formatCurrency(totalSgst)}</span>
          </div>
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 border-emerald-500/40">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Sales Turnover</span>
            <span className="text-xl font-black text-amber-400">{formatCurrency(totalGrossTurnover)}</span>
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
            placeholder="Search by invoice number, customer buyer, or GSTIN..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Payment Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Invoices</option>
            <option value="PAID">Paid / Settled</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="DRAFT">Draft</option>
            <option value="APPROVED">Approved / Issued</option>
            <option value="DISPATCHED">Dispatched</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
            <span>Sales Invoices Breakdown</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800 font-bold">
              {filteredInvoices.length} Invoices
            </span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <th className="p-3">Invoice No & Date</th>
                <th className="p-3">Customer (Buyer)</th>
                <th className="p-3 font-mono">Recipient GSTIN</th>
                <th className="p-3 text-right">Taxable Value (₹)</th>
                <th className="p-3 text-right">CGST (9%)</th>
                <th className="p-3 text-right">SGST (9%)</th>
                <th className="p-3 text-right">Total GST (18%)</th>
                <th className="p-3 text-right">Invoice Grand Total</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No sales invoices found for the selected period.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const taxable = (inv.subtotal || 0) - (inv.discountTotal || 0);
                  const halfGst = Math.round(((inv.gstTotal || 0) / 2) * 100) / 100;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 font-mono block">{inv.invoiceNo}</span>
                        <span className="text-[11px] text-slate-500">{inv.date}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{inv.customerName}</td>
                      <td className="p-3 font-mono text-emerald-900 font-bold">{inv.customerGstin || 'URP'}</td>
                      <td className="p-3 text-right font-mono font-semibold">{formatCurrency(taxable)}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{formatCurrency(halfGst)}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{formatCurrency(halfGst)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{formatCurrency(inv.gstTotal || 0)}</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-900">{formatCurrency(inv.grandTotal || 0)}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                          {inv.status}
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
