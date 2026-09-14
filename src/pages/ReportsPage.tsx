import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import {
  DashboardSummary, Invoice, Product, Customer, Supplier,
  PurchaseOrder, PaymentRecord, DueReminder, SalesOrder
} from '../types/index.js';
import { formatCurrency, formatNumber } from '../utils/paperMath.js';
import {
  BarChart3, TrendingUp, DollarSign, Calendar, Layers, Download, Printer,
  FileText, ArrowRight, Filter, RefreshCw, CheckCircle2, AlertCircle,
  Building2, Package, Scale, PieChart, Clock, ShieldCheck, FileSpreadsheet,
  BookOpen, ChevronDown, Check, CreditCard, ArrowUpRight, ArrowDownLeft,
  ShoppingCart, Receipt, CheckCircle, ListFilter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  exportToPdf, exportToExcel, exportMultiSheetExcel,
  ColumnDefinition, SummaryStat
} from '../utils/exportUtils.js';

// Modular Report Sub-Components
import { OrderPendingReport } from '../components/reports/OrderPendingReport.js';
import { OrderCompletedReport } from '../components/reports/OrderCompletedReport.js';
import { OrderDetailsReport } from '../components/reports/OrderDetailsReport.js';
import { SalesReportView } from '../components/reports/SalesReportView.js';
import { PurchaseReportView } from '../components/reports/PurchaseReportView.js';
import { useAuth } from '../context/AuthContext.js';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';
  const userPartyId = user?.partyId || '';
  const userPartyName = (user?.partyName || user?.name || '').toLowerCase();
  const userEmail = (user?.email || '').toLowerCase();

  const isCustomerMatch = (id?: string, name?: string, email?: string) => {
    if (!isCustomer) return true;
    if (userPartyId && id === userPartyId) return true;
    if (userPartyName && (name || '').toLowerCase().includes(userPartyName)) return true;
    if (name && userPartyName && userPartyName.includes((name || '').toLowerCase())) return true;
    if (userEmail && (email || '').toLowerCase() === userEmail) return true;
    return false;
  };

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [dueReminders, setDueReminders] = useState<DueReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Active Report Tab
  const [activeReportTab, setActiveReportTab] = useState<
    | 'ORDER_PENDING'
    | 'ORDER_COMPLETED'
    | 'ORDER_DETAILS'
    | 'SALES_REPORT'
    | 'PURCHASE_REPORT'
    | 'SUMMARY'
    | 'GSTR1'
    | 'GSTR3B'
    | 'STOCK_LEDGER'
    | 'CUSTOMER_AGING'
    | 'SUPPLIER_PAYABLES'
    | 'DAY_BOOK'
    | 'DUE_REMINDERS'
  >('ORDER_PENDING');

  // Date Entry & Filtering State
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [datePreset, setDatePreset] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'Q1' | 'Q2' | 'FY' | 'CUSTOM'>('THIS_MONTH');

  const loadData = async () => {
    try {
      setLoading(true);
      const [sum, invList, soList, prodList, custList, suppList, poList, payList, dueList] = await Promise.all([
        api.getDashboardSummary().catch(() => null),
        api.getInvoices('INVOICE').catch(() => []),
        api.getSalesOrders().catch(() => []),
        api.getProducts().catch(() => []),
        api.getCustomers().catch(() => []),
        api.getSuppliers().catch(() => []),
        api.getPurchases().catch(() => []),
        api.getPayments().catch(() => []),
        api.getDueReminders().catch(() => [])
      ]);
      setSummary(sum);
      setInvoices(invList || []);
      setSalesOrders(soList || []);
      setProducts(prodList || []);
      setCustomers(custList || []);
      setSuppliers(suppList || []);
      setPurchases(poList || []);
      setPayments(payList || []);
      setDueReminders(dueList || []);
    } catch (err) {
      console.error('Error loading reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDatePreset = (preset: 'THIS_MONTH' | 'LAST_MONTH' | 'Q1' | 'Q2' | 'FY' | 'CUSTOM') => {
    setDatePreset(preset);
    const now = new Date();
    const curYear = now.getFullYear();

    if (preset === 'THIS_MONTH') {
      setStartDate(new Date(curYear, now.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'LAST_MONTH') {
      setStartDate(new Date(curYear, now.getMonth() - 1, 1).toISOString().split('T')[0]);
      setEndDate(new Date(curYear, now.getMonth(), 0).toISOString().split('T')[0]);
    } else if (preset === 'Q1') {
      setStartDate(`${curYear}-04-01`);
      setEndDate(`${curYear}-06-30`);
    } else if (preset === 'Q2') {
      setStartDate(`${curYear}-07-01`);
      setEndDate(`${curYear}-09-30`);
    } else if (preset === 'FY') {
      const fyStart = now.getMonth() >= 3 ? curYear : curYear - 1;
      setStartDate(`${fyStart}-04-01`);
      setEndDate(`${fyStart + 1}-03-31`);
    }
  };

  // Accessible Scoped Data by Role
  const accessibleInvoices = isCustomer ? invoices.filter(inv => isCustomerMatch(inv.customerId, inv.customerName, (inv as any).customerEmail)) : invoices;
  const accessibleSalesOrders = isCustomer ? salesOrders.filter(so => isCustomerMatch(so.customerId, so.customerName, so.billTo?.email)) : salesOrders;
  const accessiblePurchases = isCustomer ? [] : purchases;
  const accessibleSuppliers = isCustomer ? [] : suppliers;
  const accessibleCustomers = isCustomer ? customers.filter(c => isCustomerMatch(c.id, c.name, c.email)) : customers;
  const accessiblePayments = isCustomer ? payments.filter(p => isCustomerMatch(p.partyId, p.partyName, undefined)) : payments;
  const accessibleDueReminders = isCustomer ? dueReminders.filter(d => isCustomerMatch(d.customerId, d.customerName, undefined)) : dueReminders;

  // Filter Data by Date Entry Range
  const filteredInvoices = accessibleInvoices.filter(inv => {
    if (!inv.date) return true;
    return inv.date >= startDate && inv.date <= endDate;
  });

  const filteredPurchases = accessiblePurchases.filter(po => {
    const d = po.date || po.orderDate;
    if (!d) return true;
    return d >= startDate && d <= endDate;
  });

  const filteredPayments = accessiblePayments.filter(p => {
    const d = p.paymentDate || p.date;
    if (!d) return true;
    return d >= startDate && d <= endDate;
  });

  // Calculate GSTR-1 Outward Supplies Summary
  const gstr1Taxable = filteredInvoices.reduce((sum, inv) => sum + ((inv.subtotal || 0) - (inv.discountTotal || 0)), 0);
  const gstr1Gst = filteredInvoices.reduce((sum, inv) => sum + (inv.gstTotal || 0), 0);
  const gstr1Cgst = Math.round((gstr1Gst / 2) * 100) / 100;
  const gstr1Sgst = Math.round((gstr1Gst / 2) * 100) / 100;
  const gstr1GrandTotal = gstr1Taxable + gstr1Gst;

  // Calculate Inward Purchase ITC (GSTR-3B Input Tax Credit)
  const purchaseTaxable = filteredPurchases.reduce((sum, po) => sum + ((po.subtotal || po.totalAmount || 0)), 0);
  const purchaseGst = filteredPurchases.reduce((sum, po) => sum + (po.gstTotal || (po.totalAmount ? po.totalAmount * 0.18 : 0)), 0);
  const netGstPayable = Math.max(0, gstr1Gst - purchaseGst);

  // Stock Ledger Metrics
  const stockMetrics = (products || []).map(p => {
    let reamWeight = p.reamWeightKg || 0;
    if (!reamWeight && p.gsm && p.sizeInches) {
      const parts = (p.sizeInches || '').toLowerCase().split('x').map(s => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        reamWeight = (parts[0] * parts[1] * p.gsm * 500) / 3100000;
      }
    }
    if (!reamWeight) reamWeight = 20;
    const totalKg = Math.round((p.currentStock || 0) * reamWeight * 100) / 100;
    const val = (p.currentStock || 0) * (p.saleRate || p.ratePerUnit || 0);
    return { ...p, calculatedReamWeight: reamWeight, totalKg, totalVal: val };
  });

  const totalStockUnits = stockMetrics.reduce((sum, p) => sum + (p.currentStock || 0), 0);
  const totalStockKg = stockMetrics.reduce((sum, p) => sum + (p.totalKg || 0), 0);
  const totalInventoryValuation = stockMetrics.reduce((sum, p) => sum + (p.totalVal || 0), 0);

  // Customer Aging Calculations
  const totalCustomerReceivables = accessibleCustomers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
  const totalCustomerCreditLimit = accessibleCustomers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);

  // Supplier Payables
  const totalSupplierPayables = accessibleSuppliers.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);

  // -------------------------------------------------------------------------
  // EXPORT HANDLERS FOR INDIVIDUAL TABS
  // -------------------------------------------------------------------------

  const handleExportGstr1Pdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Invoice No', dataKey: 'invoiceNo', align: 'left' },
      { header: 'Date', dataKey: 'date', align: 'center' },
      { header: 'Customer (Buyer)', dataKey: 'customerName', align: 'left' },
      { header: 'GSTIN', dataKey: 'customerGstin', align: 'center', format: v => v || 'URP' },
      { header: 'Taxable (₹)', dataKey: 'taxable', align: 'right', format: (_, r) => formatCurrency(r.subtotal - (r.discountTotal || 0)) },
      { header: 'CGST 9% (₹)', dataKey: 'cgst', align: 'right', format: (_, r) => formatCurrency(r.gstTotal / 2) },
      { header: 'SGST 9% (₹)', dataKey: 'sgst', align: 'right', format: (_, r) => formatCurrency(r.gstTotal / 2) },
      { header: 'GST Total (₹)', dataKey: 'gstTotal', align: 'right', format: v => formatCurrency(v) },
      { header: 'Total Value (₹)', dataKey: 'grandTotal', align: 'right', format: v => formatCurrency(v) }
    ];

    const stats: SummaryStat[] = [
      { label: 'Taxable Turnover', value: formatCurrency(gstr1Taxable) },
      { label: 'CGST (9%)', value: formatCurrency(gstr1Cgst) },
      { label: 'SGST (9%)', value: formatCurrency(gstr1Sgst) },
      { label: 'Gross Outward Value', value: formatCurrency(gstr1GrandTotal) }
    ];

    exportToPdf({
      title: 'GSTR-1 Outward Supplies Statement (18% GST)',
      subtitle: `Statutory Tax Breakdown & B2B Invoices (${filteredInvoices.length} Records)`,
      dateRange: { start: startDate, end: endDate },
      fileName: `GSTR1_Outward_Supplies_${startDate}_to_${endDate}`,
      summaryStats: stats,
      columns,
      data: filteredInvoices,
      orientation: 'landscape'
    });
  };

  const handleExportGstr1Excel = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Invoice No', dataKey: 'invoiceNo' },
      { header: 'Invoice Date', dataKey: 'date' },
      { header: 'Customer Name', dataKey: 'customerName', width: 25 },
      { header: 'Customer GSTIN', dataKey: 'customerGstin', format: v => v || 'URP' },
      { header: 'Place of Supply', dataKey: 'placeOfSupply', format: v => v || 'Maharashtra (27)' },
      { header: 'Taxable Amount', dataKey: 'subtotal', format: (v, r) => Math.round((v - (r.discountTotal || 0)) * 100) / 100 },
      { header: 'CGST (9%)', dataKey: 'gstTotal', format: v => Math.round((v / 2) * 100) / 100 },
      { header: 'SGST (9%)', dataKey: 'gstTotal', format: v => Math.round((v / 2) * 100) / 100 },
      { header: 'Total GST (18%)', dataKey: 'gstTotal' },
      { header: 'Invoice Grand Total', dataKey: 'grandTotal' }
    ];

    const stats: SummaryStat[] = [
      { label: 'Total Taxable Turnover (₹)', value: gstr1Taxable },
      { label: 'Total Output GST (₹)', value: gstr1Gst },
      { label: 'Gross Sales Value (₹)', value: gstr1GrandTotal },
      { label: 'Total Invoices', value: filteredInvoices.length }
    ];

    exportToExcel({
      fileName: `GSTR1_Tax_Report_${startDate}_${endDate}`,
      sheetName: 'GSTR-1 Outward',
      title: 'GSTR-1 Outward Supplies Tax Register',
      subtitle: 'Amriteshwar Balaji Paper Pvt. Ltd. - Statutory GST Report',
      dateRange: { start: startDate, end: endDate },
      summaryStats: stats,
      columns,
      data: filteredInvoices,
      totalsRow: {
        invoiceNo: 'TOTAL',
        subtotal: gstr1Taxable,
        gstTotal: gstr1Gst,
        grandTotal: gstr1GrandTotal
      }
    });
  };

  const handleExportStockPdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Paper Grade & Brand', dataKey: 'name', align: 'left' },
      { header: 'Category', dataKey: 'category', align: 'left' },
      { header: 'GSM / Size', dataKey: 'sizeInches', align: 'center', format: (v, r) => `${r.gsm} GSM (${v}")` },
      { header: 'Unit Wt (Kg)', dataKey: 'calculatedReamWeight', align: 'center', format: v => `${Number(v).toFixed(2)} Kg` },
      { header: 'Stock Units', dataKey: 'currentStock', align: 'center', format: (v, r) => `${v} ${r.unit}` },
      { header: 'Total Wt (Kg)', dataKey: 'totalKg', align: 'right', format: v => formatNumber(v) },
      { header: 'Rate (₹)', dataKey: 'saleRate', align: 'right', format: (v, r) => `₹${v || r.ratePerUnit || 0}` },
      { header: 'Inventory Value', dataKey: 'totalVal', align: 'right', format: v => formatCurrency(v) }
    ];

    const stats: SummaryStat[] = [
      { label: 'Total Active SKUs', value: products.length },
      { label: 'Total Stock Quantity', value: `${formatNumber(totalStockUnits)} Units` },
      { label: 'Total Stock Weight', value: `${formatNumber(Math.round(totalStockKg / 1000))} MT` },
      { label: 'Total Stock Valuation', value: formatCurrency(totalInventoryValuation) }
    ];

    exportToPdf({
      title: 'Inventory Stock Valuation & Grade Ledger',
      subtitle: `Real-time physical stock counts, ream weight conversions, and market valuations`,
      fileName: `Stock_Valuation_Ledger_${new Date().toISOString().split('T')[0]}`,
      summaryStats: stats,
      columns,
      data: stockMetrics,
      orientation: 'landscape'
    });
  };

  const handleExportStockExcel = () => {
    const columns: ColumnDefinition[] = [
      { header: 'SKU Code', dataKey: 'code' },
      { header: 'Grade / Product Name', dataKey: 'name', width: 28 },
      { header: 'Category', dataKey: 'category' },
      { header: 'Mill Brand', dataKey: 'brand' },
      { header: 'GSM', dataKey: 'gsm' },
      { header: 'Size (Inches)', dataKey: 'sizeInches' },
      { header: 'Unit Ream Weight (Kg)', dataKey: 'calculatedReamWeight', format: v => Number(v).toFixed(2) },
      { header: 'Physical Stock Units', dataKey: 'currentStock' },
      { header: 'Unit of Measure', dataKey: 'unit' },
      { header: 'Total Stock Weight (Kgs)', dataKey: 'totalKg' },
      { header: 'Standard Sale Rate (₹)', dataKey: 'saleRate', format: (v, r) => v || r.ratePerUnit || 0 },
      { header: 'Inventory Valuation (₹)', dataKey: 'totalVal' },
      { header: 'Stock Status', dataKey: 'status' }
    ];

    const stats: SummaryStat[] = [
      { label: 'Total SKUs in Catalog', value: products.length },
      { label: 'Total Physical Stock (Units)', value: totalStockUnits },
      { label: 'Total Weight (Kgs)', value: totalStockKg },
      { label: 'Gross Inventory Value (₹)', value: totalInventoryValuation }
    ];

    exportToExcel({
      fileName: `Inventory_Stock_Ledger_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Stock Valuation',
      title: 'Live Inventory Valuation & Grade Ledger',
      subtitle: 'Amriteshwar Balaji Paper Pvt. Ltd. - Stock Registry',
      summaryStats: stats,
      columns,
      data: stockMetrics,
      totalsRow: {
        code: 'TOTAL',
        currentStock: totalStockUnits,
        totalKg: totalStockKg,
        totalVal: totalInventoryValuation
      }
    });
  };

  const handleExportCustomerAgingPdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Customer Firm', dataKey: 'companyName', align: 'left', format: (v, r) => v || r.name },
      { header: 'Contact & City', dataKey: 'city', align: 'left', format: (v, r) => `${r.contactPerson || '-'} (${v})` },
      { header: 'GSTIN', dataKey: 'gstin', align: 'center', format: v => v || 'URP' },
      { header: 'Payment Terms', dataKey: 'paymentTerms', align: 'center' },
      { header: 'Credit Limit (₹)', dataKey: 'creditLimit', align: 'right', format: v => formatCurrency(v) },
      { header: 'Outstanding Dues (₹)', dataKey: 'outstandingBalance', align: 'right', format: v => formatCurrency(v) },
      { header: 'Credit Status', dataKey: 'outstandingBalance', align: 'center', format: (v, r) => v > r.creditLimit ? 'LIMIT EXCEEDED' : 'WITHIN LIMIT' }
    ];

    const stats: SummaryStat[] = [
      { label: isCustomer ? 'Account' : 'Total Registered Buyers', value: isCustomer ? (user?.partyName || user?.name || '') : accessibleCustomers.length },
      { label: 'Approved Credit Limit', value: formatCurrency(totalCustomerCreditLimit) },
      { label: 'Total Outstanding Dues', value: formatCurrency(totalCustomerReceivables) },
      { label: 'Overdue Count', value: accessibleCustomers.filter(c => (c.outstandingBalance || 0) > (c.creditLimit || 0)).length }
    ];

    exportToPdf({
      title: isCustomer ? 'My Account Statement & Credit Aging' : 'Customer Receivables & Credit Aging Ledger',
      subtitle: isCustomer ? 'Account balance, authorized credit limit, and dues summary' : 'Buyer balances, authorized credit thresholds, and overdue compliance tracking',
      fileName: isCustomer ? `My_Account_Statement_${new Date().toISOString().split('T')[0]}` : `Customer_Receivables_Aging_${new Date().toISOString().split('T')[0]}`,
      summaryStats: stats,
      columns,
      data: accessibleCustomers,
      orientation: 'landscape'
    });
  };

  const handleExportCustomerAgingExcel = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Customer Name', dataKey: 'name' },
      { header: 'Company Firm Name', dataKey: 'companyName', width: 25 },
      { header: 'Contact Person', dataKey: 'contactPerson' },
      { header: 'Phone', dataKey: 'phone' },
      { header: 'City', dataKey: 'city' },
      { header: 'State', dataKey: 'state' },
      { header: 'GSTIN', dataKey: 'gstin', format: v => v || 'URP' },
      { header: 'Payment Terms', dataKey: 'paymentTerms' },
      { header: 'Credit Limit (₹)', dataKey: 'creditLimit' },
      { header: 'Outstanding Balance (₹)', dataKey: 'outstandingBalance' },
      { header: 'Credit Compliance', dataKey: 'outstandingBalance', format: (v, r) => v > r.creditLimit ? 'EXCEEDED' : 'NORMAL' }
    ];

    const stats: SummaryStat[] = [
      { label: isCustomer ? 'Customer Account' : 'Total Customers', value: isCustomer ? (user?.partyName || user?.name || '') : accessibleCustomers.length },
      { label: 'Total Credit Sanctioned (₹)', value: totalCustomerCreditLimit },
      { label: 'Total Market Receivables (₹)', value: totalCustomerReceivables }
    ];

    exportToExcel({
      fileName: isCustomer ? `My_Account_Statement_${new Date().toISOString().split('T')[0]}` : `Customer_Aging_Report_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Customer Aging',
      title: isCustomer ? 'My Account Statement & Dues' : 'Customer Outstanding Receivables & Aging',
      subtitle: 'Amriteshwar Balaji Paper Pvt. Ltd. - Credit Management',
      summaryStats: stats,
      columns,
      data: accessibleCustomers,
      totalsRow: {
        name: 'TOTAL',
        creditLimit: totalCustomerCreditLimit,
        outstandingBalance: totalCustomerReceivables
      }
    });
  };

  // -------------------------------------------------------------------------
  // MASTER EXPORT: ALL REPORTS BUNDLE (MULTI-SHEET EXCEL)
  // -------------------------------------------------------------------------
  const handleExportAllReportsExcel = () => {
    try {
      setExporting(true);

      const pendingOrdersData = accessibleSalesOrders.filter(so => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(so.status));
      const completedOrdersData = accessibleSalesOrders.filter(so => ['DELIVERED', 'INVOICED', 'COMPLETED'].includes(so.status));

      // Flatten items for Order Details sheet
      const orderDetailsData: any[] = [];
      accessibleSalesOrders.forEach(so => {
        (so.items || []).forEach(it => {
          orderDetailsData.push({
            orderNo: so.orderNo,
            orderDate: so.orderDate,
            customerName: so.customerName,
            status: so.status,
            productName: it.productName,
            gsm: it.gsm || 80,
            sizeInches: it.sizeInches || '23x36',
            quantity: it.quantity,
            unit: it.unit || 'Reams',
            rate: it.rate,
            subtotal: it.subtotal || it.quantity * it.rate,
            gstRate: it.gstRate || 18,
            totalAmount: it.totalAmount || (it.subtotal || it.quantity * it.rate) * 1.18
          });
        });
      });

      const sheets = [
        // 1. Executive Summary Sheet
        {
          sheetName: 'Executive Summary',
          title: 'ERP Financial & Performance Summary',
          columns: [
            { header: 'Metric Category', dataKey: 'label', width: 30 },
            { header: 'Key Performance Value', dataKey: 'value', width: 25 }
          ],
          data: [
            { label: 'Report Generated At', value: new Date().toLocaleString() },
            { label: 'Active Date Filter', value: `${startDate} to ${endDate}` },
            { label: 'Total Pending Orders Count', value: pendingOrdersData.length },
            { label: 'Total Completed Orders Count', value: completedOrdersData.length },
            { label: 'Period Gross Sales Revenue', value: formatCurrency(gstr1GrandTotal) },
            { label: 'Period Taxable Sales', value: formatCurrency(gstr1Taxable) },
            { label: 'Period Output GST Collected', value: formatCurrency(gstr1Gst) },
            { label: 'Period Mill Purchases (ITC Base)', value: formatCurrency(purchaseTaxable) },
            { label: 'Eligible Inward Input Tax Credit (ITC)', value: formatCurrency(purchaseGst) },
            { label: 'Net Estimated GST Payable', value: formatCurrency(netGstPayable) },
            { label: 'Total Customer Receivables (Dues)', value: formatCurrency(totalCustomerReceivables) },
            { label: 'Total Paper Mill Payables', value: formatCurrency(totalSupplierPayables) },
            { label: 'Total Active Catalog SKUs', value: products.length },
            { label: 'Total Inventory Stock Valuation', value: formatCurrency(totalInventoryValuation) },
            { label: 'Total Inventory Stock Weight', value: `${formatNumber(Math.round(totalStockKg))} Kgs (${formatNumber(Math.round(totalStockKg/1000))} MT)` }
          ]
        },
        // 2. Order Pendency Sheet
        {
          sheetName: 'Order Pendency',
          title: 'Unfulfilled & Pending Sales Orders Backlog',
          columns: [
            { header: 'Order Number', dataKey: 'orderNo' },
            { header: 'Order Date', dataKey: 'orderDate' },
            { header: 'Customer Buyer', dataKey: 'customerName', width: 26 },
            { header: 'City', dataKey: 'city', format: (_: any, r: any) => r.billTo?.city || '-' },
            { header: 'Status / Stage', dataKey: 'status' },
            { header: 'Reams / Units', dataKey: 'items', format: (v: any[]) => (v || []).reduce((s, i) => s + (i.quantity || 0), 0) },
            { header: 'Weight (Kgs)', dataKey: 'items', format: (v: any[]) => (v || []).reduce((s, i) => s + (i.totalWeightKg || (i.quantity * (i.calculatedReamWeightKg || 20))), 0) },
            { header: 'Order Grand Total (₹)', dataKey: 'grandTotal' },
            { header: 'Advance Paid (₹)', dataKey: 'paidAmount', format: (v: any) => v || 0 },
            { header: 'Balance Due (₹)', dataKey: 'balanceDue', format: (v: any, r: any) => v ?? (r.grandTotal - (r.paidAmount || 0)) }
          ],
          data: pendingOrdersData
        },
        // 3. Completed Orders Sheet
        {
          sheetName: 'Completed Orders',
          title: 'Fulfilled & Delivered Orders Register',
          columns: [
            { header: 'Order Number', dataKey: 'orderNo' },
            { header: 'Order Date', dataKey: 'orderDate' },
            { header: 'Delivered Date', dataKey: 'actualDeliveryDate', format: (v: any) => v || 'Delivered' },
            { header: 'Customer Buyer', dataKey: 'customerName', width: 26 },
            { header: 'Buyer GSTIN', dataKey: 'customerGstin', format: (v: any) => v || 'URP' },
            { header: 'Delivered Reams', dataKey: 'items', format: (v: any[]) => (v || []).reduce((s, i) => s + (i.quantity || 0), 0) },
            { header: 'Delivered Weight (Kgs)', dataKey: 'items', format: (v: any[]) => (v || []).reduce((s, i) => s + (i.totalWeightKg || (i.quantity * (i.calculatedReamWeightKg || 20))), 0) },
            { header: 'Invoice Ref', dataKey: 'invoiceNos', format: (v: any[]) => (v && v.length > 0 ? v.join(', ') : '-') },
            { header: 'Grand Total (₹)', dataKey: 'grandTotal' },
            { header: 'Status', dataKey: 'status' }
          ],
          data: completedOrdersData
        },
        // 4. Order Details Line Items Sheet
        {
          sheetName: 'Order Details',
          title: 'Itemized Order Details & Paper Specifications Matrix',
          columns: [
            { header: 'Order Ref', dataKey: 'orderNo' },
            { header: 'Order Date', dataKey: 'orderDate' },
            { header: 'Customer Name', dataKey: 'customerName', width: 25 },
            { header: 'Paper Grade Name', dataKey: 'productName', width: 28 },
            { header: 'GSM', dataKey: 'gsm' },
            { header: 'Size (Inches)', dataKey: 'sizeInches' },
            { header: 'Quantity (Reams)', dataKey: 'quantity' },
            { header: 'Unit Rate (₹)', dataKey: 'rate' },
            { header: 'Taxable Subtotal (₹)', dataKey: 'subtotal' },
            { header: 'GST Rate (%)', dataKey: 'gstRate' },
            { header: 'Line Total (₹)', dataKey: 'totalAmount' },
            { header: 'Order Status', dataKey: 'status' }
          ],
          data: orderDetailsData
        },
        // 5. Sales Register Sheet
        {
          sheetName: 'Sales Register',
          title: 'B2B Sales Invoices & Output Tax Register',
          columns: [
            { header: 'Invoice No', dataKey: 'invoiceNo' },
            { header: 'Invoice Date', dataKey: 'date' },
            { header: 'Customer Name', dataKey: 'customerName', width: 25 },
            { header: 'Customer GSTIN', dataKey: 'customerGstin', format: (v: any) => v || 'URP' },
            { header: 'Place of Supply', dataKey: 'placeOfSupply', format: (v: any) => v || 'Maharashtra (27)' },
            { header: 'Taxable Amount (₹)', dataKey: 'subtotal', format: (v: number, r: any) => Math.round((v - (r.discountTotal || 0)) * 100) / 100 },
            { header: 'CGST (9%) (₹)', dataKey: 'gstTotal', format: (v: number) => Math.round((v / 2) * 100) / 100 },
            { header: 'SGST (9%) (₹)', dataKey: 'gstTotal', format: (v: number) => Math.round((v / 2) * 100) / 100 },
            { header: 'Total GST (18%) (₹)', dataKey: 'gstTotal' },
            { header: 'Freight & Charges (₹)', dataKey: 'freightCharges', format: (v: any) => v || 0 },
            { header: 'Invoice Grand Total (₹)', dataKey: 'grandTotal' },
            { header: 'Payment Status', dataKey: 'status' }
          ],
          data: filteredInvoices,
          totalsRow: {
            invoiceNo: 'TOTAL',
            subtotal: gstr1Taxable,
            gstTotal: gstr1Gst,
            grandTotal: gstr1GrandTotal
          }
        },
        // 6. Purchase Register Sheet
        {
          sheetName: 'Purchase Register',
          title: 'Purchase Orders & Mill Inward Register',
          columns: [
            { header: 'PO Number', dataKey: 'poNumber' },
            { header: 'Order Date', dataKey: 'orderDate' },
            { header: 'Supplier Mill Name', dataKey: 'supplierName', width: 28 },
            { header: 'Inward Reams', dataKey: 'items', format: (v: any[]) => (v || []).reduce((s, i) => s + (i.quantity || 0), 0) },
            { header: 'Inward Weight (Kgs)', dataKey: 'items', format: (v: any[]) => (v || []).reduce((s, i) => s + (i.totalWeightKg || (i.quantity * (i.calculatedReamWeightKg || 20))), 0) },
            { header: 'Taxable Amount (₹)', dataKey: 'taxableAmount', format: (v: any, r: any) => v || (r.subtotal - (r.discountTotal || 0)) },
            { header: 'Input CGST 9% (₹)', dataKey: 'gstTotal', format: (v: number) => Math.round((v / 2) * 100) / 100 },
            { header: 'Input SGST 9% (₹)', dataKey: 'gstTotal', format: (v: number) => Math.round((v / 2) * 100) / 100 },
            { header: 'Total Input GST (₹)', dataKey: 'gstTotal' },
            { header: 'Grand PO Total (₹)', dataKey: 'grandTotal' },
            { header: 'PO Status', dataKey: 'status' }
          ],
          data: filteredPurchases,
          totalsRow: {
            poNumber: 'TOTAL',
            subtotal: purchaseTaxable,
            gstTotal: purchaseGst,
            grandTotal: filteredPurchases.reduce((s, p) => s + (p.grandTotal || 0), 0)
          }
        },
        // 2. GSTR-1 Outward Supplies Sheet
        {
          sheetName: 'GSTR-1 Outward',
          title: 'GSTR-1 Outward Supplies Tax Register (18% GST)',
          columns: [
            { header: 'Invoice No', dataKey: 'invoiceNo' },
            { header: 'Date', dataKey: 'date' },
            { header: 'Customer Buyer', dataKey: 'customerName', width: 25 },
            { header: 'GSTIN', dataKey: 'customerGstin', format: (v: any) => v || 'URP' },
            { header: 'Taxable Turnover (₹)', dataKey: 'subtotal', format: (v: number, r: any) => Math.round((v - (r.discountTotal || 0)) * 100) / 100 },
            { header: 'CGST 9% (₹)', dataKey: 'gstTotal', format: (v: number) => Math.round((v / 2) * 100) / 100 },
            { header: 'SGST 9% (₹)', dataKey: 'gstTotal', format: (v: number) => Math.round((v / 2) * 100) / 100 },
            { header: 'Total GST 18% (₹)', dataKey: 'gstTotal' },
            { header: 'Invoice Total (₹)', dataKey: 'grandTotal' }
          ],
          data: filteredInvoices,
          totalsRow: {
            invoiceNo: 'TOTAL',
            subtotal: gstr1Taxable,
            gstTotal: gstr1Gst,
            grandTotal: gstr1GrandTotal
          }
        },
        // 3. Stock Valuation Sheet
        {
          sheetName: 'Stock Valuation',
          title: 'Paper Stock Valuation & Ream Weight Ledger',
          columns: [
            { header: 'SKU Code', dataKey: 'code' },
            { header: 'Grade / Product Name', dataKey: 'name', width: 28 },
            { header: 'Category', dataKey: 'category' },
            { header: 'Mill Brand', dataKey: 'brand' },
            { header: 'GSM', dataKey: 'gsm' },
            { header: 'Size (Inches)', dataKey: 'sizeInches' },
            { header: 'Ream Wt (Kg)', dataKey: 'calculatedReamWeight', format: (v: any) => Number(v).toFixed(2) },
            { header: 'Stock Units', dataKey: 'currentStock' },
            { header: 'UOM', dataKey: 'unit' },
            { header: 'Total Wt (Kgs)', dataKey: 'totalKg' },
            { header: 'Rate / Unit (₹)', dataKey: 'saleRate', format: (v: any, r: any) => v || r.ratePerUnit || 0 },
            { header: 'Total Valuation (₹)', dataKey: 'totalVal' }
          ],
          data: stockMetrics,
          totalsRow: {
            code: 'TOTAL',
            currentStock: totalStockUnits,
            totalKg: totalStockKg,
            totalVal: totalInventoryValuation
          }
        },
        // 4. Customer Receivables Sheet
        {
          sheetName: 'Customer Aging',
          title: 'Customer Outstanding Receivables Ledger',
          columns: [
            { header: 'Customer Name', dataKey: 'name' },
            { header: 'Company Firm Name', dataKey: 'companyName', width: 25 },
            { header: 'Contact Person', dataKey: 'contactPerson' },
            { header: 'Phone', dataKey: 'phone' },
            { header: 'City', dataKey: 'city' },
            { header: 'State', dataKey: 'state' },
            { header: 'GSTIN', dataKey: 'gstin', format: (v: any) => v || 'URP' },
            { header: 'Payment Terms', dataKey: 'paymentTerms' },
            { header: 'Credit Limit (₹)', dataKey: 'creditLimit' },
            { header: 'Outstanding Balance (₹)', dataKey: 'outstandingBalance' }
          ],
          data: customers,
          totalsRow: {
            name: 'TOTAL',
            creditLimit: totalCustomerCreditLimit,
            outstandingBalance: totalCustomerReceivables
          }
        },
        // 5. Supplier Mill Payables Sheet
        {
          sheetName: 'Supplier Payables',
          title: 'Supplier Mill Payables & Balances',
          columns: [
            { header: 'Supplier Name', dataKey: 'companyName' },
            { header: 'Type', dataKey: 'supplierType', format: (v: any) => v || 'DOMESTIC_MILL' },
            { header: 'Contact Person', dataKey: 'contactPerson' },
            { header: 'City / Country', dataKey: 'city', format: (v: any, r: any) => `${v || ''}, ${r.country || 'India'}` },
            { header: 'GSTIN / Swift', dataKey: 'gstin', format: (v: any, r: any) => v || r.ifscOrSwift || '-' },
            { header: 'Payment Terms', dataKey: 'paymentTerms' },
            { header: 'Outstanding Payable (₹)', dataKey: 'outstandingBalance' }
          ],
          data: suppliers,
          totalsRow: {
            companyName: 'TOTAL',
            outstandingBalance: totalSupplierPayables
          }
        },
        // 6. Day Book Payments Sheet
        {
          sheetName: 'Day Book',
          title: 'Payments & Collections Register',
          columns: [
            { header: 'Date', dataKey: 'paymentDate', format: (v: any, r: any) => v || r.date || '-' },
            { header: 'Voucher No', dataKey: 'voucherNo', format: (v: any, r: any) => v || r.id || '-' },
            { header: 'Party Name', dataKey: 'partyName' },
            { header: 'Type', dataKey: 'type', format: (v: any) => v || 'CUSTOMER_RECEIPT' },
            { header: 'Payment Mode', dataKey: 'paymentMode' },
            { header: 'Ref / Cheque No', dataKey: 'referenceNo', format: (v: any) => v || '-' },
            { header: 'Amount (₹)', dataKey: 'amount' }
          ],
          data: filteredPayments,
          totalsRow: {
            date: 'TOTAL',
            amount: filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
          }
        },
        // 7. Overdue Reminders Sheet
        {
          sheetName: 'Overdue Reminders',
          title: 'Customer Invoice Due & Overdue Ageing',
          columns: [
            { header: 'Party Name', dataKey: 'partyName' },
            { header: 'Invoice No', dataKey: 'invoiceNo' },
            { header: 'Invoice Date', dataKey: 'invoiceDate' },
            { header: 'Due Date', dataKey: 'dueDate' },
            { header: 'Days Overdue', dataKey: 'daysOverdue' },
            { header: 'Phone', dataKey: 'phone' },
            { header: 'Invoice Amount (₹)', dataKey: 'totalAmount' },
            { header: 'Due Balance (₹)', dataKey: 'dueAmount' },
            { header: 'Status', dataKey: 'status' }
          ],
          data: accessibleDueReminders,
          totalsRow: {
            partyName: 'TOTAL',
            dueAmount: accessibleDueReminders.reduce((sum, d) => sum + (d.dueAmount || 0), 0)
          }
        }
      ];

      const effectiveSheets = isCustomer
        ? sheets.filter(s => !['Purchase Register', 'Stock Valuation', 'Supplier Payables'].includes(s.sheetName))
        : sheets;

      exportMultiSheetExcel({
        fileName: isCustomer
          ? `Customer_Reports_${(user?.partyName || user?.name || 'Account').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
          : `ABPPL_Master_ERP_Reports_${new Date().toISOString().split('T')[0]}`,
        sheets: effectiveSheets
      });
    } catch (err) {
      console.error('Failed to export all reports', err);
    } finally {
      setExporting(false);
    }
  };

  // -------------------------------------------------------------------------
  // MASTER EXPORT: COMPREHENSIVE PDF DOSSIER
  // -------------------------------------------------------------------------
  const handleExportMasterPdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Report Module', dataKey: 'module', align: 'left' },
      { header: 'Primary Metrics / Count', dataKey: 'metric', align: 'left' },
      { header: 'Period Value (₹)', dataKey: 'val', align: 'right', format: v => typeof v === 'number' ? formatCurrency(v) : v }
    ];

    const dossierData = isCustomer ? [
      { module: 'Account Purchases / Invoiced', metric: `${filteredInvoices.length} Invoices Issued`, val: gstr1GrandTotal },
      { module: 'Taxable Goods Base (18% GST)', metric: 'Standard Rate Paper Goods', val: gstr1Taxable },
      { module: 'Central GST (CGST 9%)', metric: 'Intrastate 9% Component', val: gstr1Cgst },
      { module: 'State GST (SGST 9%)', metric: 'Intrastate 9% Component', val: gstr1Sgst },
      { module: 'Pending Sales Orders', metric: `${accessibleSalesOrders.filter(so => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(so.status)).length} Unfulfilled Orders`, val: accessibleSalesOrders.filter(so => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(so.status)).reduce((s, o) => s + (o.grandTotal || 0), 0) },
      { module: 'Completed & Delivered Orders', metric: `${accessibleSalesOrders.filter(so => ['DELIVERED', 'INVOICED', 'COMPLETED'].includes(so.status)).length} Fulfilled Orders`, val: accessibleSalesOrders.filter(so => ['DELIVERED', 'INVOICED', 'COMPLETED'].includes(so.status)).reduce((s, o) => s + (o.grandTotal || 0), 0) },
      { module: 'Current Outstanding Account Balance', metric: 'Total Account Dues', val: totalCustomerReceivables },
      { module: 'Sanctioned Credit Limit', metric: 'Authorized Credit Threshold', val: totalCustomerCreditLimit },
      { module: 'Overdue Invoices Balance', metric: `${accessibleDueReminders.filter(d => d.status === 'OVERDUE').length} Invoices Overdue`, val: accessibleDueReminders.reduce((s, d) => s + (d.dueAmount || 0), 0) }
    ] : [
      { module: 'Executive Revenue Turnover', metric: `${filteredInvoices.length} Invoices Issued`, val: gstr1GrandTotal },
      { module: 'GSTR-1 Taxable Base', metric: 'Standard 18% GST Outward Supplies', val: gstr1Taxable },
      { module: 'Central Tax (CGST 9%)', metric: 'State Intrastate Share', val: gstr1Cgst },
      { module: 'State Tax (SGST 9%)', metric: 'State Intrastate Share', val: gstr1Sgst },
      { module: 'Input Tax Credit (ITC)', metric: `Mill Purchases: ${formatCurrency(purchaseTaxable)}`, val: purchaseGst },
      { module: 'Net Statutory GST Payable', metric: 'Output Tax - Eligible ITC', val: netGstPayable },
      { module: 'Customer Outstanding Receivables', metric: `${accessibleCustomers.length} Registered Buyers`, val: totalCustomerReceivables },
      { module: 'Supplier Mill Payables', metric: `${accessibleSuppliers.length} Mills & Vendors`, val: totalSupplierPayables },
      { module: 'Inventory Asset Valuation', metric: `${products.length} SKUs (${formatNumber(Math.round(totalStockKg/1000))} MT)`, val: totalInventoryValuation },
      { module: 'Overdue Dues Pending', metric: `${accessibleDueReminders.filter(d => d.status === 'OVERDUE').length} Invoices Overdue`, val: accessibleDueReminders.reduce((s, d) => s + (d.dueAmount || 0), 0) }
    ];

    const stats: SummaryStat[] = isCustomer ? [
      { label: 'Purchases Total', value: formatCurrency(gstr1GrandTotal) },
      { label: 'Outstanding Balance', value: formatCurrency(totalCustomerReceivables) },
      { label: 'Credit Limit', value: formatCurrency(totalCustomerCreditLimit) },
      { label: 'Pending Orders', value: accessibleSalesOrders.filter(so => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(so.status)).length }
    ] : [
      { label: 'Total Revenue', value: formatCurrency(gstr1GrandTotal) },
      { label: 'Customer Dues', value: formatCurrency(totalCustomerReceivables) },
      { label: 'Mill Payables', value: formatCurrency(totalSupplierPayables) },
      { label: 'Stock Valuation', value: formatCurrency(totalInventoryValuation) }
    ];

    exportToPdf({
      title: isCustomer ? 'Customer Account Statement & Dossier' : 'Executive Financial & Operational Dossier',
      subtitle: isCustomer ? `Order history, billed invoices, and payment ledger for ${user?.partyName || user?.name}` : 'Complete ERP business analytics, statutory tax standing, and working capital summary',
      dateRange: { start: startDate, end: endDate },
      fileName: isCustomer ? `Customer_Dossier_${startDate}_${endDate}` : `ABPPL_Master_ERP_Dossier_${startDate}_${endDate}`,
      summaryStats: stats,
      columns,
      data: dossierData,
      orientation: 'portrait'
    });
  };

  if (loading || !summary) {
    return (
      <div className="p-8 flex items-center justify-center space-x-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
        <span className="text-xs font-bold">Loading Comprehensive ERP Business Reports & Ledgers...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* ========================================================================= */}
      {/* TOP HEADER & MASTER EXPORT ACTION BAR                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-800">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                ERP Reports & Export Hub
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory GST (GSTR-1/3B), Stock Valuation Ledger, Customer Receivables Aging & Mill Payables
              </p>
            </div>
          </div>
        </div>

        {/* Master All-in-One Export Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2 print:hidden">
          <button
            onClick={handleExportAllReportsExcel}
            disabled={exporting}
            className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl border border-emerald-600 transition shadow-xs cursor-pointer"
            title="Download single Excel file containing all reports in separate sheets"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export All (Excel .xlsx)</span>
          </button>

          <button
            onClick={handleExportMasterPdf}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl border border-slate-700 transition shadow-xs cursor-pointer"
            title="Export master executive summary report as PDF"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Master PDF Dossier</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DATE RANGE FILTER BAR & QUICK PRESETS                                     */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900">Report Filter Period:</span>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
            <button
              onClick={() => handleDatePreset('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                datePreset === 'THIS_MONTH'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              This Month
            </button>

            <button
              onClick={() => handleDatePreset('LAST_MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                datePreset === 'LAST_MONTH'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Last Month
            </button>

            <button
              onClick={() => handleDatePreset('Q1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                datePreset === 'Q1'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Q1 (Apr - Jun)
            </button>

            <button
              onClick={() => handleDatePreset('Q2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                datePreset === 'Q2'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Q2 (Jul - Sep)
            </button>

            <button
              onClick={() => handleDatePreset('FY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                datePreset === 'FY'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Full FY 2026
            </button>

            <button
              onClick={() => setDatePreset('CUSTOM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                datePreset === 'CUSTOM'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Date Entry Inputs */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white"
              />
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Report Selection Tabs */}
        <div className="flex items-center space-x-1.5 border-t border-slate-100 pt-3 flex-wrap gap-y-1.5">
          <button
            onClick={() => setActiveReportTab('ORDER_PENDING')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              activeReportTab === 'ORDER_PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isCustomer ? 'My Pending Orders' : 'Order Pending'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeReportTab === 'ORDER_PENDING' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-900'
            }`}>
              {accessibleSalesOrders.filter(so => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(so.status)).length}
            </span>
          </button>

          <button
            onClick={() => setActiveReportTab('ORDER_COMPLETED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              activeReportTab === 'ORDER_COMPLETED'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{isCustomer ? 'My Completed Orders' : 'Order Completed'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeReportTab === 'ORDER_COMPLETED' ? 'bg-emerald-900 text-white' : 'bg-emerald-100 text-emerald-900'
            }`}>
              {accessibleSalesOrders.filter(so => ['DELIVERED', 'INVOICED', 'COMPLETED'].includes(so.status)).length}
            </span>
          </button>

          <button
            onClick={() => setActiveReportTab('ORDER_DETAILS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              activeReportTab === 'ORDER_DETAILS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isCustomer ? 'My Order Details Matrix' : 'Order Details Matrix'}</span>
          </button>

          <button
            onClick={() => setActiveReportTab('SALES_REPORT')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              activeReportTab === 'SALES_REPORT'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{isCustomer ? 'My Sales Invoices' : 'Sales Reports'}</span>
          </button>

          {!isCustomer && (
            <button
              onClick={() => setActiveReportTab('PURCHASE_REPORT')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                activeReportTab === 'PURCHASE_REPORT'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Purchase Reports</span>
            </button>
          )}

          {!isCustomer && (
            <button
              onClick={() => setActiveReportTab('SUMMARY')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeReportTab === 'SUMMARY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Executive Summary
            </button>
          )}

          {!isCustomer && (
            <button
              onClick={() => setActiveReportTab('GSTR1')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeReportTab === 'GSTR1'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              GSTR-1 Outward (18% GST)
            </button>
          )}

          {!isCustomer && (
            <button
              onClick={() => setActiveReportTab('GSTR3B')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeReportTab === 'GSTR3B'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              GSTR-3B & ITC Reconciliation
            </button>
          )}

          {!isCustomer && (
            <button
              onClick={() => setActiveReportTab('STOCK_LEDGER')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeReportTab === 'STOCK_LEDGER'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Stock Valuation & Ledger
            </button>
          )}

          <button
            onClick={() => setActiveReportTab('CUSTOMER_AGING')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeReportTab === 'CUSTOMER_AGING'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isCustomer ? 'My Account Statement & Dues' : 'Customer Aging & Receivables'}
          </button>

          {!isCustomer && (
            <button
              onClick={() => setActiveReportTab('SUPPLIER_PAYABLES')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeReportTab === 'SUPPLIER_PAYABLES'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Supplier Mill Payables
            </button>
          )}

          {!isCustomer && (
            <button
              onClick={() => setActiveReportTab('DAY_BOOK')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeReportTab === 'DAY_BOOK'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Day-Book & Payments
            </button>
          )}

          <button
            onClick={() => setActiveReportTab('DUE_REMINDERS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeReportTab === 'DUE_REMINDERS'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isCustomer ? 'My Invoices Due / Overdue' : 'Overdue Ageing & Reminders'}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB: ORDER PENDING STATUS REPORT                                          */}
      {/* ========================================================================= */}
      {activeReportTab === 'ORDER_PENDING' && (
        <OrderPendingReport
          orders={accessibleSalesOrders}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: ORDER COMPLETED STATUS REPORT                                        */}
      {/* ========================================================================= */}
      {activeReportTab === 'ORDER_COMPLETED' && (
        <OrderCompletedReport
          orders={accessibleSalesOrders}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: ORDER DETAILS LINE ITEMS MATRIX REPORT                               */}
      {/* ========================================================================= */}
      {activeReportTab === 'ORDER_DETAILS' && (
        <OrderDetailsReport
          orders={accessibleSalesOrders}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: SALES REGISTER & INVOICES REPORT                                     */}
      {/* ========================================================================= */}
      {activeReportTab === 'SALES_REPORT' && (
        <SalesReportView
          invoices={accessibleInvoices}
          salesOrders={accessibleSalesOrders}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: PURCHASE REGISTER & MILL INWARDS REPORT                              */}
      {/* ========================================================================= */}
      {activeReportTab === 'PURCHASE_REPORT' && (
        <PurchaseReportView
          purchaseOrders={purchases}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE SUMMARY & TRENDS                                          */}
      {/* ========================================================================= */}
      {activeReportTab === 'SUMMARY' && (
        <div className="space-y-6">
          {/* Quick Action Export Bar for Tab */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Executive Financial Overview</h3>
              <p className="text-xs text-slate-500">Period: {startDate} to {endDate}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportMasterPdf}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={handleExportAllReportsExcel}
                className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Analytics KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Filtered Period Turnover</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(gstr1GrandTotal)}</div>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">Total {filteredInvoices.length} invoices issued</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Customer Receivables</span>
              <div className="text-2xl font-black text-rose-700 mt-1">{formatCurrency(totalCustomerReceivables)}</div>
              <p className="text-[10px] text-slate-500 mt-1">Outstanding pending dues</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Supplier Mill Payables</span>
              <div className="text-2xl font-black text-blue-700 mt-1">{formatCurrency(totalSupplierPayables)}</div>
              <p className="text-[10px] text-slate-500 mt-1">Paper mill pending balances</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Inventory Valuation</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalInventoryValuation)}</div>
              <p className="text-[10px] text-emerald-700 font-bold mt-1">{formatNumber(Math.round(totalStockKg / 1000))} MT in godowns</p>
            </div>
          </div>

          {/* Revenue & Purchases Bar Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">FY 2026 Monthly Sales vs Purchases Comparison (₹)</h3>
              <span className="text-xs text-slate-500">Amounts in INR Lakhs</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="sales" name="Sales Revenue (₹)" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchases" name="Mill Purchases (₹)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GSTR-1 OUTWARD SUPPLIES REPORT                                      */}
      {/* ========================================================================= */}
      {activeReportTab === 'GSTR1' && (
        <div className="space-y-6">
          
          {/* Statutory Tax Summary Banner */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-white">GSTR-1 Outward Supplies Summary (18% GST Trade Standard)</h3>
                <p className="text-xs text-slate-400">Date Filter: {startDate} to {endDate} &bull; Total {filteredInvoices.length} Registered Invoices</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportGstr1Pdf}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Export</span>
                </button>
                <button
                  onClick={handleExportGstr1Excel}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel Export</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1 text-xs">
              <div className="bg-slate-800 p-4 rounded-xl">
                <span className="text-slate-400 block mb-1">Total Taxable Turnover</span>
                <span className="text-lg font-black text-white">{formatCurrency(gstr1Taxable)}</span>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl">
                <span className="text-slate-400 block mb-1">Central Tax (CGST 9%)</span>
                <span className="text-lg font-black text-emerald-400">{formatCurrency(gstr1Cgst)}</span>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl">
                <span className="text-slate-400 block mb-1">State Tax (SGST 9%)</span>
                <span className="text-lg font-black text-emerald-400">{formatCurrency(gstr1Sgst)}</span>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-emerald-500/30">
                <span className="text-slate-400 block mb-1">Total Outward Gross Value</span>
                <span className="text-lg font-black text-amber-400">{formatCurrency(gstr1GrandTotal)}</span>
              </div>
            </div>
          </div>

          {/* GSTR-1 Invoices Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-xs text-slate-900">B2B Registered Invoices Breakdown</h4>
              <span className="text-xs text-slate-500">{filteredInvoices.length} Records</span>
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
                    <th className="p-3 text-right">Invoice Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No invoices found for the selected date range.
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

      {/* ========================================================================= */}
      {/* TAB 3: GSTR-3B TAX & ITC RECONCILIATION                                    */}
      {/* ========================================================================= */}
      {activeReportTab === 'GSTR3B' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">GSTR-3B Tax Liability & Input Tax Credit (ITC) Summary</h3>
                <p className="text-xs text-slate-500">Reconciled Output GST vs Inward Mill Purchase Credits & Net Cash Outflow</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const columns: ColumnDefinition[] = [
                      { header: 'Statutory GST Section', dataKey: 'section' },
                      { header: 'Taxable Turnover (₹)', dataKey: 'taxable', align: 'right', format: v => formatCurrency(v) },
                      { header: 'IGST (₹)', dataKey: 'igst', align: 'right', format: v => formatCurrency(v) },
                      { header: 'CGST (₹)', dataKey: 'cgst', align: 'right', format: v => formatCurrency(v) },
                      { header: 'SGST (₹)', dataKey: 'sgst', align: 'right', format: v => formatCurrency(v) },
                      { header: 'Total Tax (₹)', dataKey: 'total', align: 'right', format: v => formatCurrency(v) }
                    ];
                    const data = [
                      { section: '3.1 Outward Taxable Supplies (Output Tax Liability)', taxable: gstr1Taxable, igst: 0, cgst: gstr1Cgst, sgst: gstr1Sgst, total: gstr1Gst },
                      { section: '4.0 Eligible Input Tax Credit (Inward Mill Purchases)', taxable: purchaseTaxable, igst: 0, cgst: Math.round(purchaseGst/2), sgst: Math.round(purchaseGst/2), total: purchaseGst },
                      { section: '6.1 Net Tax Payable in Cash / Electronic Ledger', taxable: Math.max(0, gstr1Taxable - purchaseTaxable), igst: 0, cgst: Math.round(netGstPayable/2), sgst: Math.round(netGstPayable/2), total: netGstPayable }
                    ];
                    exportToPdf({
                      title: 'GSTR-3B Tax Liability & ITC Reconciliation',
                      subtitle: `Period: ${startDate} to ${endDate}`,
                      fileName: `GSTR3B_ITC_Reconciliation_${startDate}_${endDate}`,
                      columns,
                      data
                    });
                  }}
                  className="flex items-center space-x-1.5 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PDF Statement</span>
                </button>
              </div>
            </div>

            {/* Reconciliation Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-900 text-white p-4 rounded-xl">
                <span className="text-slate-400 block mb-1">1. Gross Output Tax Liability</span>
                <span className="text-xl font-black text-rose-400">{formatCurrency(gstr1Gst)}</span>
                <p className="text-[10px] text-slate-400 mt-2">From ₹{formatNumber(Math.round(gstr1Taxable))} Outward Sales</p>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl">
                <span className="text-slate-400 block mb-1">2. Eligible ITC (Inward Purchases)</span>
                <span className="text-xl font-black text-emerald-400">{formatCurrency(purchaseGst)}</span>
                <p className="text-[10px] text-slate-400 mt-2">From ₹{formatNumber(Math.round(purchaseTaxable))} Mill Purchases</p>
              </div>

              <div className="bg-emerald-950 text-white p-4 rounded-xl border border-emerald-800">
                <span className="text-emerald-300 block mb-1">3. Net GST Payable in Cash</span>
                <span className="text-xl font-black text-amber-300">{formatCurrency(netGstPayable)}</span>
                <p className="text-[10px] text-emerald-200 mt-2">Output Tax minus Available ITC</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: STOCK VALUATION & GRADE LEDGER                                      */}
      {/* ========================================================================= */}
      {activeReportTab === 'STOCK_LEDGER' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Inventory Stock Valuation & Ream Weight Ledger</h3>
              <p className="text-xs text-slate-500">Live stock valuation based on standard unit rates and ream weights ({products.length} Grades)</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportStockPdf}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDF Ledger</span>
              </button>
              <button
                onClick={handleExportStockExcel}
                className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel Export</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-0.5">Total Physical Units</span>
              <span className="text-base font-black text-slate-900">{formatNumber(totalStockUnits)} Units</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-0.5">Total Metric Weight</span>
              <span className="text-base font-black text-emerald-800">{formatNumber(Math.round(totalStockKg))} Kgs ({formatNumber(Math.round(totalStockKg/1000))} MT)</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-0.5">Total Asset Valuation</span>
              <span className="text-base font-black text-slate-900">{formatCurrency(totalInventoryValuation)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-3">Paper Grade & Brand</th>
                  <th className="p-3 text-center">GSM / Size</th>
                  <th className="p-3 text-center">Unit Ream Wt (Kg)</th>
                  <th className="p-3 text-center">Current Stock</th>
                  <th className="p-3 text-center">Total Stock (Kgs)</th>
                  <th className="p-3 text-right">Standard Rate (₹)</th>
                  <th className="p-3 text-right">Inventory Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {stockMetrics.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{p.name}</span>
                      <span className="text-[11px] text-slate-500">{p.brand} &bull; {p.category}</span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-700">{p.gsm} GSM ({p.sizeInches}")</td>
                    <td className="p-3 text-center font-mono font-semibold">{p.calculatedReamWeight.toFixed(2)} Kg</td>
                    <td className="p-3 text-center font-bold text-slate-900">{p.currentStock} {p.unit}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-900">{formatNumber(p.totalKg)} Kg</td>
                    <td className="p-3 text-right font-mono">₹{p.saleRate || p.ratePerUnit}</td>
                    <td className="p-3 text-right font-mono font-black text-slate-900">{formatCurrency(p.totalVal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CUSTOMER AGING & OUTSTANDINGS                                       */}
      {/* ========================================================================= */}
      {activeReportTab === 'CUSTOMER_AGING' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Customer Outstanding Balance & Credit Aging</h3>
              <p className="text-xs text-slate-500">Live receivable ledger with GSTIN and credit limits</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCustomerAgingPdf}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDF Aging</span>
              </button>
              <button
                onClick={handleExportCustomerAgingExcel}
                className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel Aging</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-3">Customer Firm</th>
                  <th className="p-3">Contact & City</th>
                  <th className="p-3 font-mono">GSTIN</th>
                  <th className="p-3 text-right">Credit Limit</th>
                  <th className="p-3 text-right">Outstanding Dues</th>
                  <th className="p-3 text-center">Credit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {accessibleCustomers.map(c => {
                  const isOverdue = (c.outstandingBalance || 0) > (c.creditLimit || 0);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{c.companyName || c.name}</td>
                      <td className="p-3 text-slate-700">{c.contactPerson} &bull; {c.city}, {c.state}</td>
                      <td className="p-3 font-mono text-emerald-900 font-bold">{c.gstin || 'URP'}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(c.creditLimit || 0)}</td>
                      <td className="p-3 text-right font-mono font-black text-rose-700">{formatCurrency(c.outstandingBalance || 0)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                          isOverdue
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}>
                          {isOverdue ? 'Limit Exceeded' : 'Within Limit'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SUPPLIER MILL PAYABLES                                              */}
      {/* ========================================================================= */}
      {activeReportTab === 'SUPPLIER_PAYABLES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Supplier Mill Payables & Inward Register</h3>
              <p className="text-xs text-slate-500">Domestic & International Paper Mill balances and payment terms</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const columns: ColumnDefinition[] = [
                    { header: 'Supplier Mill', dataKey: 'companyName' },
                    { header: 'Type', dataKey: 'supplierType', format: v => v || 'DOMESTIC_MILL' },
                    { header: 'Contact Person', dataKey: 'contactPerson' },
                    { header: 'City / Country', dataKey: 'city', format: (v, r) => `${v || ''}, ${r.country || 'India'}` },
                    { header: 'GSTIN / Code', dataKey: 'gstin', format: (v, r) => v || r.ifscOrSwift || '-' },
                    { header: 'Payment Terms', dataKey: 'paymentTerms' },
                    { header: 'Outstanding Payable (₹)', dataKey: 'outstandingBalance', align: 'right', format: v => formatCurrency(v) }
                  ];
                  exportToPdf({
                    title: 'Supplier Mill Payables Ledger',
                    subtitle: `Total Outstanding Mill Balances: ${formatCurrency(totalSupplierPayables)}`,
                    fileName: `Supplier_Mill_Payables_${new Date().toISOString().split('T')[0]}`,
                    columns,
                    data: suppliers,
                    orientation: 'landscape'
                  });
                }}
                className="flex items-center space-x-1.5 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDF Payables</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-3">Supplier Mill Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Location</th>
                  <th className="p-3 font-mono">GSTIN / Ref</th>
                  <th className="p-3">Payment Terms</th>
                  <th className="p-3 text-right">Outstanding Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{s.companyName || s.name}</td>
                    <td className="p-3 text-slate-600">{s.supplierType || 'DOMESTIC_MILL'}</td>
                    <td className="p-3 text-slate-700">{s.city}, {s.country || 'India'}</td>
                    <td className="p-3 font-mono text-slate-900">{s.gstin || s.ifscOrSwift || '-'}</td>
                    <td className="p-3 text-slate-700">{s.paymentTerms || 'Net 30 Days'}</td>
                    <td className="p-3 text-right font-mono font-black text-blue-700">{formatCurrency(s.outstandingBalance || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: DAY BOOK & PAYMENTS REGISTER                                        */}
      {/* ========================================================================= */}
      {activeReportTab === 'DAY_BOOK' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Day-Book & Payments / Receipts Register</h3>
              <p className="text-xs text-slate-500">Period: {startDate} to {endDate} &bull; Customer collections and supplier payouts</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const columns: ColumnDefinition[] = [
                    { header: 'Date', dataKey: 'paymentDate', format: (v, r) => v || r.date || '-' },
                    { header: 'Voucher No', dataKey: 'voucherNo', format: (v, r) => v || r.id || '-' },
                    { header: 'Party Name', dataKey: 'partyName' },
                    { header: 'Payment Mode', dataKey: 'paymentMode' },
                    { header: 'Reference No', dataKey: 'referenceNo' },
                    { header: 'Amount (₹)', dataKey: 'amount', align: 'right', format: v => formatCurrency(v) }
                  ];
                  exportToPdf({
                    title: 'Day Book Payments & Collections Register',
                    subtitle: `Period: ${startDate} to ${endDate}`,
                    fileName: `Day_Book_${startDate}_${endDate}`,
                    columns,
                    data: filteredPayments
                  });
                }}
                className="flex items-center space-x-1.5 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDF Day Book</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-3">Payment Date</th>
                  <th className="p-3">Voucher / ID</th>
                  <th className="p-3">Party Name</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3 font-mono">Reference No</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No payment transactions recorded for the selected period.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-900">{p.paymentDate || p.date || '-'}</td>
                      <td className="p-3 font-mono text-slate-600">{p.voucherNo || p.id || '-'}</td>
                      <td className="p-3 font-bold text-slate-900">{p.partyName}</td>
                      <td className="p-3 text-slate-700">{p.paymentMode}</td>
                      <td className="p-3 font-mono text-slate-600">{p.referenceNo || '-'}</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-800">{formatCurrency(p.amount || 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: OVERDUE AGEING & REMINDERS                                          */}
      {/* ========================================================================= */}
      {activeReportTab === 'DUE_REMINDERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Overdue Ageing & Customer Due Reminders</h3>
              <p className="text-xs text-slate-500">Follow-up schedule with contact details and invoice overdue counts</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const columns: ColumnDefinition[] = [
                    { header: 'Party Name', dataKey: 'partyName' },
                    { header: 'Invoice No', dataKey: 'invoiceNo' },
                    { header: 'Due Date', dataKey: 'dueDate' },
                    { header: 'Days Overdue', dataKey: 'daysOverdue', align: 'center' },
                    { header: 'Phone', dataKey: 'phone' },
                    { header: 'Due Amount (₹)', dataKey: 'dueAmount', align: 'right', format: v => formatCurrency(v) },
                    { header: 'Status', dataKey: 'status', align: 'center' }
                  ];
                  exportToPdf({
                    title: isCustomer ? 'My Outstanding Dues & Overdue Ageing' : 'Customer Due Reminders & Overdue Ageing Report',
                    subtitle: `Total Active Reminders: ${accessibleDueReminders.length}`,
                    fileName: `Overdue_Reminders_Report_${new Date().toISOString().split('T')[0]}`,
                    columns,
                    data: accessibleDueReminders
                  });
                }}
                className="flex items-center space-x-1.5 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDF Reminders</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-3">Customer Party</th>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-center">Overdue Days</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-right">Due Amount</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {accessibleDueReminders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No due or overdue reminders found. All invoices are settled.
                    </td>
                  </tr>
                ) : (
                  accessibleDueReminders.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{d.partyName}</td>
                      <td className="p-3 font-mono font-medium text-slate-700">{d.invoiceNo}</td>
                      <td className="p-3 font-mono text-slate-600">{d.dueDate}</td>
                      <td className="p-3 text-center font-bold text-rose-700">{d.daysOverdue > 0 ? `${d.daysOverdue} days` : 'Due Today'}</td>
                      <td className="p-3 text-slate-600">{d.phone || '-'}</td>
                      <td className="p-3 text-right font-mono font-black text-rose-700">{formatCurrency(d.dueAmount || 0)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          d.status === 'OVERDUE' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {(d.status || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
