import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Invoice, Customer, Product, InvoiceItem, SalesOrder, Transporter,
  InvoiceStatus, SalesOrderStatus, PartyAddress
} from '../types/index.js';
import { formatCurrency, formatNumber } from '../utils/paperMath.js';
import {
  ShoppingBag, Receipt, Plus, Search, Eye, Trash2, X, PlusCircle,
  MinusCircle, Printer, ArrowRight, Truck, CheckCircle2, AlertCircle,
  Clock, FileText, Send, Building2, Package, ShieldCheck, ChevronDown,
  FileCheck, RefreshCw, Calendar, CreditCard, Layers, ArrowLeft,
  Save, Calculator, Sparkles, Scale, Check
} from 'lucide-react';

interface SalesListProps {
  onOpenInvoiceView: (inv: Invoice) => void;
  initialTab?: 'invoices' | 'orders';
}

export const SalesList: React.FC<SalesListProps> = ({ onOpenInvoiceView, initialTab = 'invoices' }) => {
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';

  const [activeTab, setActiveTab] = useState<'invoices' | 'orders'>(initialTab);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Big Screen View Mode State
  const [viewMode, setViewMode] = useState<'LIST' | 'ORDER_FORM' | 'INVOICE_FORM' | 'CONVERT_FORM' | 'STATUS_FORM'>('LIST');

  // Form States (for both SO & Invoice big screen creation)
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerPoNumber, setCustomerPoNumber] = useState('');
  const [customerPoDate, setCustomerPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [deliveryDispatchRef, setDeliveryDispatchRef] = useState('');
  const [selectedTransporterName, setSelectedTransporterName] = useState('Vijay Roadways Express');
  const [vehicleNumber, setVehicleNumber] = useState('MH-04-FK-9921');
  const [lrGrNo, setLrGrNo] = useState('LR-8821');
  const [ewayBillNo, setEwayBillNo] = useState('');
  const [orderNotes, setOrderNotes] = useState('Paper trade standard quality verified. 18% GST applied.');
  const [orderItems, setOrderItems] = useState<InvoiceItem[]>([]);

  // Bill To / Ship To Addresses
  const [useSeparateShipTo, setUseSeparateShipTo] = useState(false);
  const [shipToName, setShipToName] = useState('');
  const [shipToAddress, setShipToAddress] = useState('');
  const [shipToCity, setShipToCity] = useState('');
  const [shipToState, setShipToState] = useState('');
  const [shipToPincode, setShipToPincode] = useState('');
  const [shipToGstin, setShipToGstin] = useState('');
  const [shipToPhone, setShipToPhone] = useState('');

  // Quick Convert SO to Invoice Big Screen State
  const [convertingOrder, setConvertingOrder] = useState<SalesOrder | null>(null);
  const [convertTruckNumber, setConvertTruckNumber] = useState('');
  const [convertLrGrNo, setConvertLrGrNo] = useState('');
  const [convertTransporter, setConvertTransporter] = useState('');
  const [convertDispatchRef, setConvertDispatchRef] = useState('');
  const [convertEwayBill, setConvertEwayBill] = useState('');

  // Direct Invoice Imported SO State
  const [importedSalesOrderId, setImportedSalesOrderId] = useState<string>('');

  // Status Change State
  const [statusInvoice, setStatusInvoice] = useState<Invoice | null>(null);
  const [targetStatus, setTargetStatus] = useState<InvoiceStatus>('DISPATCHED');
  const [statusVehicleNo, setStatusVehicleNo] = useState('');
  const [statusLrGrNo, setStatusLrGrNo] = useState('');
  const [statusTrackingNo, setStatusTrackingNo] = useState('');
  const [statusDeliveryNotes, setStatusDeliveryNotes] = useState('');
  const [statusDispatchDate, setStatusDispatchDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invList, soList, cList, pList, tList] = await Promise.all([
        api.getInvoices('INVOICE'),
        api.getSalesOrders(),
        api.getCustomers(),
        api.getProducts(),
        api.getTransporters().catch(() => [])
      ]);
      setInvoices(invList || []);
      setSalesOrders(soList || []);
      setCustomers(cList || []);
      setProducts(pList || []);
      setTransporters(tList || []);

      if (cList.length > 0) {
        if (isCustomer) {
          const userPartyId = user?.partyId || '';
          const userPartyName = (user?.partyName || user?.name || '').toLowerCase();
          const userEmail = (user?.email || '').toLowerCase();
          const myCust = cList.find(c =>
            (userPartyId && c.id === userPartyId) ||
            (userPartyName && (c.name || '').toLowerCase().includes(userPartyName)) ||
            (userPartyName && userPartyName.includes((c.name || '').toLowerCase())) ||
            (userEmail && (c.email || '').toLowerCase() === userEmail)
          ) || cList[0];

          setSelectedCustomerId(myCust.id);
        } else if (!selectedCustomerId) {
          setSelectedCustomerId(cList[0].id);
        }
      }
      if (pList.length > 0 && orderItems.length === 0) {
        initDefaultItemRow(pList[0]);
      }
    } catch (err) {
      console.error('Failed to load sales data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateWeightKg = (p: Product, qty: number): number => {
    if (p.reamWeightKg && p.reamWeightKg > 0) {
      return Math.round(p.reamWeightKg * qty * 100) / 100;
    }
    const sizeParts = (p.sizeInches || '23x36').toLowerCase().split('x');
    if (sizeParts.length === 2) {
      const length = parseFloat(sizeParts[0]);
      const width = parseFloat(sizeParts[1]);
      if (!isNaN(length) && !isNaN(width) && p.gsm) {
        const kg = (length * width * p.gsm * 500 * qty) / 3100000;
        return Math.round(kg * 100) / 100;
      }
    }
    return Math.round(qty * 20 * 100) / 100;
  };

  const initDefaultItemRow = (firstP: Product) => {
    const qty = 50;
    const rate = firstP.saleRate || firstP.ratePerUnit || 85;
    const gross = qty * rate;
    const taxable = gross;
    const gstRate = 18;
    const gstAmount = Math.round(taxable * 0.18 * 100) / 100;
    const netAmount = Math.round((taxable + gstAmount) * 100) / 100;
    const kg = calculateWeightKg(firstP, qty);

    setOrderItems([{
      productId: firstP.id,
      productName: firstP.name,
      code: firstP.code,
      category: firstP.category,
      brand: firstP.brand,
      gsm: firstP.gsm,
      sizeInches: firstP.sizeInches,
      quantity: qty,
      quantityKgs: kg,
      unit: firstP.unit || 'Ream',
      rate: rate,
      discountPct: 0,
      taxableValue: taxable,
      gstRate: gstRate,
      cgst: Math.round((gstAmount / 2) * 100) / 100,
      sgst: Math.round((gstAmount / 2) * 100) / 100,
      igst: 0,
      gstAmount: gstAmount,
      netAmount: netAmount,
      amount: gross
    }]);
  };

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    const p = products[0];
    const qty = 20;
    const rate = p.saleRate || p.ratePerUnit || 85;
    const gross = qty * rate;
    const taxable = gross;
    const gstRate = 18;
    const gstAmount = Math.round(taxable * 0.18 * 100) / 100;
    const netAmount = Math.round((taxable + gstAmount) * 100) / 100;
    const kg = calculateWeightKg(p, qty);

    setOrderItems([...orderItems, {
      productId: p.id,
      productName: p.name,
      code: p.code,
      category: p.category,
      brand: p.brand,
      gsm: p.gsm,
      sizeInches: p.sizeInches,
      quantity: qty,
      quantityKgs: kg,
      unit: p.unit || 'Ream',
      rate: rate,
      discountPct: 0,
      taxableValue: taxable,
      gstRate: gstRate,
      cgst: Math.round((gstAmount / 2) * 100) / 100,
      sgst: Math.round((gstAmount / 2) * 100) / 100,
      igst: 0,
      gstAmount: gstAmount,
      netAmount: netAmount,
      amount: gross
    }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleUpdateItem = (idx: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...orderItems];
    const item = { ...updated[idx], [field]: value };

    let targetProd = products.find(p => p.id === item.productId);
    if (field === 'productId') {
      targetProd = products.find(p => p.id === value);
      if (targetProd) {
        item.productName = targetProd.name;
        item.code = targetProd.code;
        item.category = targetProd.category;
        item.brand = targetProd.brand;
        item.gsm = targetProd.gsm;
        item.sizeInches = targetProd.sizeInches;
        item.unit = targetProd.unit || 'Ream';
        item.rate = targetProd.saleRate || targetProd.ratePerUnit || item.rate;
        item.gstRate = 18;
      }
    }

    if (targetProd && (field === 'quantity' || field === 'productId')) {
      item.quantityKgs = calculateWeightKg(targetProd, item.quantity || 0);
    }

    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discPct = Number(item.discountPct) || 0;
    const gstRate = 18;

    const gross = qty * rate;
    const discAmount = gross * (discPct / 100);
    const taxable = Math.max(0, gross - discAmount);
    const gstAmt = Math.round(taxable * (gstRate / 100) * 100) / 100;
    const halfGst = Math.round((gstAmt / 2) * 100) / 100;
    const net = Math.round((taxable + gstAmt) * 100) / 100;

    item.amount = gross;
    item.taxableValue = Math.round(taxable * 100) / 100;
    item.gstRate = gstRate;
    item.cgst = halfGst;
    item.sgst = halfGst;
    item.igst = 0;
    item.gstAmount = gstAmt;
    item.netAmount = net;

    updated[idx] = item;
    setOrderItems(updated);
  };

  // Calculations
  const subtotal = Math.round(orderItems.reduce((sum, i) => sum + ((i.quantity || 0) * (i.rate || 0)), 0) * 100) / 100;
  const discountTotal = Math.round(orderItems.reduce((sum, i) => sum + (((i.quantity || 0) * (i.rate || 0)) * ((i.discountPct || 0) / 100)), 0) * 100) / 100;
  const taxableTotal = Math.round((subtotal - discountTotal) * 100) / 100;
  const gstTotal = Math.round(orderItems.reduce((sum, i) => sum + (i.gstAmount || 0), 0) * 100) / 100;
  const totalWeightKgs = Math.round(orderItems.reduce((sum, i) => sum + (i.quantityKgs || 0), 0) * 100) / 100;
  const grandTotal = Math.round((taxableTotal + gstTotal) * 100) / 100;

  const handleOpenNewOrder = () => {
    setImportedSalesOrderId('');
    setCustomerPoNumber(`PO-${Date.now().toString().slice(-4)}`);
    setCustomerPoDate(new Date().toISOString().split('T')[0]);
    setEntryDate(new Date().toISOString().split('T')[0]);
    setDeliveryDispatchRef(`DC-${Date.now().toString().slice(-4)}`);
    setSelectedTransporterName('Vijay Roadways Express');
    setVehicleNumber('MH-04-FK-9921');
    setLrGrNo('LR-8821');
    if (products.length > 0) initDefaultItemRow(products[0]);
    setViewMode('ORDER_FORM');
  };

  const handleOpenNewInvoice = () => {
    setImportedSalesOrderId('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setDeliveryDispatchRef(`DC-${Date.now().toString().slice(-4)}`);
    setSelectedTransporterName('Vijay Roadways Express');
    setVehicleNumber('MH-04-FK-9921');
    setLrGrNo('LR-8821');
    setEwayBillNo(`EWB-${Math.floor(100000000000 + Math.random() * 900000000000)}`);
    if (products.length > 0) initDefaultItemRow(products[0]);
    setViewMode('INVOICE_FORM');
  };

  const handleCreateSalesOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId);
    if (!cust) return;

    const billTo: PartyAddress = {
      name: cust.name,
      companyName: cust.companyName || cust.name,
      contactPerson: cust.contactPerson,
      address: cust.address,
      city: cust.city,
      state: cust.state,
      pincode: cust.pincode,
      gstin: cust.gstin,
      pan: cust.pan,
      phone: cust.phone,
      email: cust.email
    };

    const shipTo: PartyAddress = useSeparateShipTo ? {
      name: shipToName || cust.name,
      companyName: shipToName || cust.companyName || cust.name,
      address: shipToAddress || cust.address,
      city: shipToCity || cust.city,
      state: shipToState || cust.state,
      pincode: shipToPincode || cust.pincode,
      gstin: shipToGstin || cust.gstin,
      phone: shipToPhone || cust.phone
    } : { ...billTo };

    try {
      await api.createSalesOrder({
        customerId: cust.id,
        customerName: cust.companyName || cust.name,
        customerGstin: cust.gstin,
        customerPhone: cust.phone,
        customerEmail: cust.email,
        customerAddress: `${cust.address}, ${cust.city}, ${cust.state}`,
        billTo,
        shipTo,
        customerPoNumber: customerPoNumber || `PO-${Date.now().toString().slice(-4)}`,
        customerPoDate: customerPoDate || new Date().toISOString().split('T')[0],
        paymentTerms: paymentTerms || 'Net 30 Days',
        deliveryDispatchRef: deliveryDispatchRef || `DC-${Date.now().toString().slice(-4)}`,
        transporterName: selectedTransporterName || 'Vijay Roadways Express',
        vehicleNumber: vehicleNumber || 'MH-04-FK-9921',
        lrGrNo: lrGrNo || 'LR-8821',
        items: orderItems,
        subtotal,
        discountTotal,
        taxableAmount: taxableTotal,
        cgstTotal: Math.round((gstTotal / 2) * 100) / 100,
        sgstTotal: Math.round((gstTotal / 2) * 100) / 100,
        igstTotal: 0,
        gstTotal,
        grandTotal,
        status: 'CONFIRMED',
        notes: orderNotes || 'Paper trade standard quality verified. 18% GST applied.'
      });

      setViewMode('LIST');
      await loadData();
      setActiveTab('orders');
    } catch (err: any) {
      alert(err.message || 'Failed to create sales order');
    }
  };

  const handleOpenConvertModal = (so: SalesOrder) => {
    setConvertingOrder(so);
    setConvertTruckNumber(so.vehicleNumber || 'MH-04-FK-9921');
    setConvertLrGrNo(so.lrGrNo || 'LR-8821');
    setConvertTransporter(so.transporterName || 'Vijay Roadways Express');
    setConvertDispatchRef(so.deliveryDispatchRef || `DC-${so.orderNo.slice(-4)}`);
    setConvertEwayBill(`EWB-${Math.floor(100000000000 + Math.random() * 900000000000)}`);
    setViewMode('CONVERT_FORM');
  };

  const handleExecuteConvertOrderToInvoice = async () => {
    if (!convertingOrder) return;
    try {
      const generatedInvoice = await api.createInvoiceFromSalesOrder(convertingOrder.id, {
        vehicleNumber: convertTruckNumber,
        lrGrNo: convertLrGrNo,
        transporterName: convertTransporter,
        deliveryDispatchRef: convertDispatchRef,
        ewayBillNo: convertEwayBill,
        invoiceStatus: 'GENERATED'
      });

      setConvertingOrder(null);
      setViewMode('LIST');
      await loadData();
      setActiveTab('invoices');
      onOpenInvoiceView(generatedInvoice);
    } catch (err: any) {
      alert(err.message || 'Failed to convert order to invoice');
    }
  };

  const handleImportSalesOrderIntoDirectInvoice = (soId: string) => {
    setImportedSalesOrderId(soId);
    const so = salesOrders.find(s => s.id === soId);
    if (!so) return;

    setSelectedCustomerId(so.customerId);
    setCustomerPoNumber(so.customerPoNumber || '');
    setCustomerPoDate(so.customerPoDate || new Date().toISOString().split('T')[0]);
    setPaymentTerms(so.paymentTerms || 'Net 30 Days');
    setDeliveryDispatchRef(so.deliveryDispatchRef || '');
    setSelectedTransporterName(so.transporterName || '');
    setVehicleNumber(so.vehicleNumber || '');
    setLrGrNo(so.lrGrNo || '');
    setOrderItems(so.items.map(i => ({ ...i, gstRate: 18 })));
  };

  const handleCreateDirectInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId);
    if (!cust) return;

    const billTo: PartyAddress = {
      name: cust.name,
      companyName: cust.companyName || cust.name,
      contactPerson: cust.contactPerson,
      address: cust.address,
      city: cust.city,
      state: cust.state,
      pincode: cust.pincode,
      gstin: cust.gstin,
      pan: cust.pan,
      phone: cust.phone,
      email: cust.email
    };

    const shipTo: PartyAddress = useSeparateShipTo ? {
      name: shipToName || cust.name,
      companyName: shipToName || cust.companyName || cust.name,
      address: shipToAddress || cust.address,
      city: shipToCity || cust.city,
      state: shipToState || cust.state,
      pincode: shipToPincode || cust.pincode,
      gstin: shipToGstin || cust.gstin,
      phone: shipToPhone || cust.phone
    } : { ...billTo };

    try {
      const newInv = await api.createInvoice({
        type: 'INVOICE',
        invoiceStatus: 'GENERATED',
        salesOrderId: importedSalesOrderId || undefined,
        salesOrderNo: importedSalesOrderId ? salesOrders.find(s => s.id === importedSalesOrderId)?.orderNo : undefined,
        orderReference: customerPoNumber || (importedSalesOrderId ? salesOrders.find(s => s.id === importedSalesOrderId)?.orderNo : 'Direct Sale'),
        deliveryDispatchRef: deliveryDispatchRef || `DC-${Date.now().toString().slice(-4)}`,
        customerId: cust.id,
        customerName: cust.companyName || cust.name,
        customerGstin: cust.gstin,
        customerPhone: cust.phone,
        customerAddress: `${cust.address}, ${cust.city}, ${cust.state}`,
        billTo,
        shipTo,
        date: entryDate || new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        paymentTerms: paymentTerms || 'Net 30 Days',
        transporterName: selectedTransporterName || 'Vijay Roadways Express',
        vehicleNumber: vehicleNumber || 'MH-04-FK-9921',
        lrGrNo: lrGrNo || 'LR-8821',
        ewayBillNo: ewayBillNo || undefined,
        items: orderItems,
        subtotal,
        discountTotal,
        gstTotal,
        grandTotal,
        paidAmount: 0,
        paymentStatus: 'UNPAID',
        notes: orderNotes || 'Paper supply with standard 18% GST. Transporter and Delivery verified.'
      });

      setViewMode('LIST');
      setImportedSalesOrderId('');
      await loadData();
      onOpenInvoiceView(newInv);
    } catch (err: any) {
      alert(err.message || 'Failed to save GST Tax Invoice');
    }
  };

  const handleOpenStatusModal = (inv: Invoice) => {
    setStatusInvoice(inv);
    setTargetStatus(inv.invoiceStatus === 'GENERATED' ? 'DISPATCHED' : (inv.invoiceStatus === 'DISPATCHED' ? 'DELIVERED' : 'PAID'));
    setStatusVehicleNo(inv.vehicleNumber || 'MH-04-FK-9921');
    setStatusLrGrNo(inv.lrGrNo || 'LR-8821');
    setStatusTrackingNo(inv.deliveryDispatchRef || '');
    setStatusDispatchDate(new Date().toISOString().split('T')[0]);
    setStatusDeliveryNotes('Shipment verified and acknowledged in good condition.');
    setViewMode('STATUS_FORM');
  };

  const handleSaveInvoiceStatus = async () => {
    if (!statusInvoice) return;
    try {
      await api.updateInvoiceStatus(statusInvoice.id, targetStatus, {
        vehicleNumber: statusVehicleNo,
        lrGrNo: statusLrGrNo,
        trackingNo: statusTrackingNo,
        deliveryNotes: statusDeliveryNotes,
        dispatchDate: statusDispatchDate
      });

      setStatusInvoice(null);
      setViewMode('LIST');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update invoice status');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm('Are you sure you want to delete this GST Tax Invoice? This will revert stock dispatch.')) {
      await api.deleteInvoice(id);
      loadData();
    }
  };

  const handleDeleteSalesOrder = async (id: string) => {
    if (confirm('Are you sure you want to delete this Sales Order?')) {
      try {
        await api.deleteSalesOrder(id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Cannot delete sales order');
      }
    }
  };

  const userPartyId = user?.partyId || '';
  const userPartyName = (user?.partyName || user?.name || '').toLowerCase();
  const userEmail = (user?.email || '').toLowerCase();

  const isCustomerInvoice = (i: Invoice) => {
    if (!isCustomer) return true;
    if (userPartyId && i.customerId === userPartyId) return true;
    if (userPartyName && (i.customerName || '').toLowerCase().includes(userPartyName)) return true;
    if (i.customerName && userPartyName && userPartyName.includes((i.customerName || '').toLowerCase())) return true;
    if (userEmail && (i.billTo?.email || '').toLowerCase() === userEmail) return true;
    return false;
  };

  const isCustomerSalesOrder = (so: SalesOrder) => {
    if (!isCustomer) return true;
    if (userPartyId && so.customerId === userPartyId) return true;
    if (userPartyName && (so.customerName || '').toLowerCase().includes(userPartyName)) return true;
    if (so.customerName && userPartyName && userPartyName.includes((so.customerName || '').toLowerCase())) return true;
    if (userEmail && (so.billTo?.email || '').toLowerCase() === userEmail) return true;
    return false;
  };

  const filteredInvoices = (invoices || []).filter(i => {
    if (!isCustomerInvoice(i)) return false;
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = !q || (
      (i.invoiceNo || '').toLowerCase().includes(q) ||
      (i.customerName || '').toLowerCase().includes(q) ||
      (i.orderReference && (i.orderReference || '').toLowerCase().includes(q)) ||
      (i.vehicleNumber && (i.vehicleNumber || '').toLowerCase().includes(q))
    );
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'PAID' || statusFilter === 'UNPAID' || statusFilter === 'PARTIAL') {
      return matchesSearch && i.paymentStatus === statusFilter;
    }
    return matchesSearch && (i.invoiceStatus === statusFilter);
  });

  const filteredSalesOrders = (salesOrders || []).filter(so => {
    if (!isCustomerSalesOrder(so)) return false;
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = !q || (
      (so.orderNo || '').toLowerCase().includes(q) ||
      (so.customerName || '').toLowerCase().includes(q) ||
      (so.customerPoNumber && (so.customerPoNumber || '').toLowerCase().includes(q)) ||
      (so.vehicleNumber && (so.vehicleNumber || '').toLowerCase().includes(q))
    );

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && so.status === statusFilter;
  });

  // =========================================================================
  // BIG SCREEN VIEW: CONVERT SALES ORDER TO INVOICE
  // =========================================================================
  if (viewMode === 'CONVERT_FORM' && convertingOrder) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode('LIST')}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h1 className="text-xl font-extrabold text-slate-900">
                  Generate GST Tax Invoice from SO {convertingOrder.orderNo} (Big Screen)
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant 1-click conversion with zero duplicate data entry. Customer, Products, 18% GST, and Addresses carried forward.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('LIST')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteConvertOrderToInvoice}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition"
            >
              <FileCheck className="w-4 h-4" />
              <span>Confirm & Issue GST Invoice</span>
            </button>
          </div>
        </div>

        {/* Big Screen Convert Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Customer & Logistics Summary</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <span className="text-slate-500 block mb-1">Customer / Buyer</span>
                  <span className="font-bold text-slate-900 text-sm block">{convertingOrder.customerName}</span>
                  <span className="text-[11px] font-mono text-emerald-900 font-bold block mt-1">GSTIN: {convertingOrder.customerGstin || 'URP'}</span>
                  <span className="text-[11px] text-slate-600 block mt-1">{convertingOrder.customerAddress}</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl">
                  <span className="text-slate-500 block mb-1">Order References</span>
                  <span className="font-bold text-slate-900 block">SO Number: {convertingOrder.orderNo}</span>
                  <span className="text-slate-700 block mt-1">Customer PO: {convertingOrder.customerPoNumber}</span>
                  <span className="text-slate-700 block mt-1">Payment Terms: {convertingOrder.paymentTerms}</span>
                </div>
              </div>

              {/* Logistics & Dispatch Inputs */}
              <div className="pt-2">
                <h3 className="font-bold text-xs text-slate-800 mb-3 flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-purple-600" />
                  <span>Update Final Transport & E-Way Bill Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">Truck / Vehicle No *</label>
                    <input
                      type="text"
                      value={convertTruckNumber}
                      onChange={e => setConvertTruckNumber(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">Transporter Name *</label>
                    <input
                      type="text"
                      value={convertTransporter}
                      onChange={e => setConvertTransporter(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">LR / GR Number</label>
                    <input
                      type="text"
                      value={convertLrGrNo}
                      onChange={e => setConvertLrGrNo(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">E-Way Bill Number</label>
                    <input
                      type="text"
                      value={convertEwayBill}
                      onChange={e => setConvertEwayBill(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Invoice Line Items & Quantities</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-center">GSM / Size</th>
                      <th className="p-3 text-center">Quantity</th>
                      <th className="p-3 text-center">Weight (Kg)</th>
                      <th className="p-3 text-right">Rate (₹)</th>
                      <th className="p-3 text-right">Taxable</th>
                      <th className="p-3 text-right">GST 18%</th>
                      <th className="p-3 text-right">Net Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {convertingOrder.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{it.productName}</td>
                        <td className="p-3 text-center font-mono text-slate-700">{it.gsm} GSM ({it.sizeInches}")</td>
                        <td className="p-3 text-center font-bold">{it.quantity} {it.unit}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-900">{it.quantityKgs} Kg</td>
                        <td className="p-3 text-right font-mono">₹{it.rate}</td>
                        <td className="p-3 text-right font-mono font-semibold">{formatCurrency(it.taxableValue)}</td>
                        <td className="p-3 text-right font-mono text-slate-600">{formatCurrency(it.gstAmount)}</td>
                        <td className="p-3 text-right font-mono font-extrabold text-slate-900">{formatCurrency(it.netAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Column 3: Invoice Grand Total Preview */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4 h-max sticky top-6">
            <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-3 flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Financial Tax Summary</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Taxable Amount:</span>
                <span className="font-bold text-white">{formatCurrency(convertingOrder.taxableAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CGST (9%):</span>
                <span className="font-bold text-white">{formatCurrency(convertingOrder.cgstTotal || convertingOrder.gstTotal / 2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SGST (9%):</span>
                <span className="font-bold text-white">{formatCurrency(convertingOrder.sgstTotal || convertingOrder.gstTotal / 2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-base font-black">
                <span className="text-emerald-400">Grand Total:</span>
                <span className="text-emerald-400 font-mono">{formatCurrency(convertingOrder.grandTotal)}</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleExecuteConvertOrderToInvoice}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Issue Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // BIG SCREEN VIEW: CREATE / EDIT SALES ORDER & INVOICE FORM
  // =========================================================================
  if (viewMode === 'ORDER_FORM' || viewMode === 'INVOICE_FORM') {
    const isInvoice = viewMode === 'INVOICE_FORM';

    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode('LIST')}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-lg ${isInvoice ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-900 text-white'}`}>
                  {isInvoice ? <Receipt className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {isInvoice ? 'Generate GST Tax Invoice (Big Screen)' : 'Create New Customer Sales Order (Big Screen)'}
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isInvoice
                  ? 'Full-screen GST billing: connected with Sales Orders, dynamic weight calculation, transport references and 18% GST'
                  : 'Full-screen Sales Order booking: customer specs, ream weights, payment terms and logistics details'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
            >
              Cancel & Back
            </button>
            <button
              type="button"
              onClick={() => {
                const f = document.getElementById('sales-master-form') as HTMLFormElement;
                if (f) f.requestSubmit();
              }}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>{isInvoice ? 'Save & Issue GST Invoice' : 'Save Sales Order'}</span>
            </button>
          </div>
        </div>

        {/* Optional SO Auto-Fill Banner (for Invoices) */}
        {isInvoice && salesOrders.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="font-extrabold text-blue-900 block text-xs">Auto-Fill from Existing Sales Order</span>
              <span className="text-[11px] text-blue-700">Select an existing Sales Order to populate customer info, line items, rates, weight in Kgs and 18% GST automatically:</span>
            </div>
            <select
              value={importedSalesOrderId}
              onChange={e => handleImportSalesOrderIntoDirectInvoice(e.target.value)}
              className="border border-blue-300 rounded-xl px-3.5 py-2 text-xs font-bold text-blue-900 bg-white"
            >
              <option value="">-- Independent Direct Billing --</option>
              {salesOrders.map(s => (
                <option key={s.id} value={s.id}>
                  {s.orderNo} &bull; {s.customerName} ({formatCurrency(s.grandTotal)})
                </option>
              ))}
            </select>
          </div>
        )}

        <form id="sales-master-form" onSubmit={isInvoice ? handleCreateDirectInvoice : handleCreateSalesOrder} className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Master Fields & Line Items */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Section 1: Customer & Date Entries */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <h2 className="font-bold text-sm text-slate-900">1. Customer Details & Date Entries</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Customer / Buyer Firm *</label>
                    <select
                      value={selectedCustomerId}
                      onChange={e => setSelectedCustomerId(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-emerald-500"
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.companyName || c.name} &bull; GSTIN: {c.gstin || 'URP'} &bull; Balance: ₹{c.outstandingBalance}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Payment Terms</label>
                    <select
                      value={paymentTerms}
                      onChange={e => setPaymentTerms(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Net 30 Days">Net 30 Days</option>
                      <option value="Net 15 Days">Net 15 Days</option>
                      <option value="Net 45 Days">Net 45 Days</option>
                      <option value="Net 60 Days">Net 60 Days</option>
                      <option value="Immediate / COD">Immediate / Cash on Delivery</option>
                      <option value="100% Advance">100% Advance Payment</option>
                      <option value="PDC (Post Dated Cheque)">PDC (Post Dated Cheque)</option>
                    </select>
                  </div>

                  {/* Date Entries */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isInvoice ? 'Invoice Date *' : 'Order Date *'}</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={entryDate}
                      onChange={e => setEntryDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isInvoice ? 'Payment Due Date *' : 'Customer PO Date'}</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={isInvoice ? dueDate : customerPoDate}
                      onChange={e => isInvoice ? setDueDate(e.target.value) : setCustomerPoDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Customer PO / Order Ref</label>
                    <input
                      type="text"
                      placeholder="e.g. PO-8819"
                      value={customerPoNumber}
                      onChange={e => setCustomerPoNumber(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Transporter, Truck Number & Delivery References */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Truck className="w-4 h-4 text-purple-600" />
                  <h2 className="font-bold text-sm text-slate-900">2. Transporter Details, Truck No & Logistics</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Transporter Name *</label>
                    <input
                      type="text"
                      value={selectedTransporterName}
                      onChange={e => setSelectedTransporterName(e.target.value)}
                      placeholder="e.g. Vijay Roadways Express"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Truck / Vehicle No *</label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={e => setVehicleNumber(e.target.value)}
                      placeholder="e.g. MH-04-FK-9921"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-emerald-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">LR / GR Number</label>
                    <input
                      type="text"
                      value={lrGrNo}
                      onChange={e => setLrGrNo(e.target.value)}
                      placeholder="e.g. LR-8821"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Delivery / Dispatch Ref</label>
                    <input
                      type="text"
                      value={deliveryDispatchRef}
                      onChange={e => setDeliveryDispatchRef(e.target.value)}
                      placeholder="e.g. DC-9921"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Separate Ship To Option */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="separate-ship-to-big"
                      checked={useSeparateShipTo}
                      onChange={e => setUseSeparateShipTo(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                    />
                    <label htmlFor="separate-ship-to-big" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Ship To (Consignee) address is different from Bill To address
                    </label>
                  </div>

                  {useSeparateShipTo && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Consignee / Plant Name</label>
                        <input
                          type="text"
                          value={shipToName}
                          onChange={e => setShipToName(e.target.value)}
                          placeholder="e.g. Unit-2 Packaging Works"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Delivery Destination Address</label>
                        <input
                          type="text"
                          value={shipToAddress}
                          onChange={e => setShipToAddress(e.target.value)}
                          placeholder="Plot 44, MIDC Industrial Area"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">City & State</label>
                        <input
                          type="text"
                          value={shipToCity}
                          onChange={e => setShipToCity(e.target.value)}
                          placeholder="Thane, Maharashtra"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">PIN Code</label>
                        <input
                          type="text"
                          value={shipToPincode}
                          onChange={e => setShipToPincode(e.target.value)}
                          placeholder="400601"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Consignee GSTIN</label>
                        <input
                          type="text"
                          value={shipToGstin}
                          onChange={e => setShipToGstin(e.target.value)}
                          placeholder="27AAACW1234F1Z5"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Line Items (Big Screen Table) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <h2 className="font-bold text-sm text-slate-900">3. Products, Quantity in Kgs, Rate & 18% GST</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition border border-emerald-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                        <th className="p-3 w-48">Product Grade</th>
                        <th className="p-3 text-center w-28">Quantity</th>
                        <th className="p-3 text-center w-28">Weight (Kgs)</th>
                        <th className="p-3 text-right w-28">Rate (₹)</th>
                        <th className="p-3 text-center w-20">Disc %</th>
                        <th className="p-3 text-right w-28">Taxable</th>
                        <th className="p-3 text-right w-28">GST (18%)</th>
                        <th className="p-3 text-right w-28">Net (₹)</th>
                        <th className="p-3 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {orderItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3">
                            <select
                              value={item.productId}
                              onChange={e => handleUpdateItem(idx, 'productId', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 bg-white"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.gsm} GSM - {p.sizeInches}")
                                </option>
                              ))}
                            </select>
                            <span className="text-[10px] text-slate-500 block mt-1">
                              {item.gsm} GSM &bull; Size: {item.sizeInches}"
                            </span>
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-20 border border-slate-300 rounded-lg px-2 py-1.5 text-center font-bold"
                            />
                            <span className="text-[10px] text-slate-500 block mt-1">{item.unit}</span>
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantityKgs || 0}
                              onChange={e => handleUpdateItem(idx, 'quantityKgs', parseFloat(e.target.value) || 0)}
                              className="w-24 border border-slate-300 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-emerald-900 bg-emerald-50/50"
                            />
                            <span className="text-[10px] text-emerald-700 block mt-1">Total Kgs</span>
                          </td>

                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={e => handleUpdateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                              className="w-24 border border-slate-300 rounded-lg px-2 py-1.5 text-right font-mono font-bold text-slate-900"
                            />
                            <span className="text-[10px] text-slate-500 block mt-1">/ {item.unit}</span>
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              value={item.discountPct || 0}
                              onChange={e => handleUpdateItem(idx, 'discountPct', parseFloat(e.target.value) || 0)}
                              className="w-16 border border-slate-300 rounded-lg px-1.5 py-1.5 text-center"
                            />
                          </td>

                          <td className="p-3 text-right font-mono font-semibold text-slate-800">
                            {formatCurrency(item.taxableValue)}
                          </td>

                          <td className="p-3 text-right font-mono text-slate-700">
                            {formatCurrency(item.gstAmount)}
                            <span className="text-[10px] text-slate-400 block">18% GST</span>
                          </td>

                          <td className="p-3 text-right font-mono font-black text-slate-900">
                            {formatCurrency(item.netAmount)}
                          </td>

                          <td className="p-3 text-center">
                            {orderItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                className="text-rose-600 hover:text-rose-800 p-1.5"
                                title="Remove row"
                              >
                                <MinusCircle className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Notes */}
                <div className="pt-2">
                  <label className="font-bold text-slate-700 block mb-1">Order / Invoice Dispatch Instructions & Remarks</label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    placeholder="e.g. Standard paper trade quality verified. 18% GST applied. Road freight dispatch."
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

            </div>

            {/* Column 3: Live Financial Summary Engine */}
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4 sticky top-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">Financial Calculation</h3>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                    GST 18%
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Weight in Kgs:</span>
                    <span className="font-mono font-bold text-emerald-400">{formatNumber(totalWeightKgs)} Kg</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Gross Subtotal:</span>
                    <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
                  </div>

                  {discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount Allowed:</span>
                      <span className="font-bold">- {formatCurrency(discountTotal)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-400">
                    <span>Taxable Amount:</span>
                    <span className="font-bold text-white">{formatCurrency(taxableTotal)}</span>
                  </div>

                  <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1">
                    <span>CGST (9%):</span>
                    <span className="font-bold text-white">{formatCurrency(gstTotal / 2)}</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>SGST (9%):</span>
                    <span className="font-bold text-white">{formatCurrency(gstTotal / 2)}</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Total GST 18%:</span>
                    <span className="font-bold text-slate-200">{formatCurrency(gstTotal)}</span>
                  </div>

                  <div className="flex justify-between border-t border-slate-800 pt-3 text-lg font-black">
                    <span className="text-emerald-400">Grand Total:</span>
                    <span className="text-emerald-400 font-mono">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isInvoice ? 'Save & Issue GST Invoice' : 'Confirm & Save Sales Order'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('LIST')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

          </div>

        </form>

      </div>
    );
  }

  // =========================================================================
  // BIG SCREEN VIEW: UPDATE INVOICE STATUS & DISPATCH (BIG SCREEN)
  // =========================================================================
  if (viewMode === 'STATUS_FORM' && statusInvoice) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode('LIST')}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                Update Invoice Status & Tracking (Big Screen)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Invoice {statusInvoice.invoiceNo} &bull; Customer: {statusInvoice.customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('LIST')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveInvoiceStatus}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md transition"
            >
              Update Status
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Select New Status</label>
            <select
              value={targetStatus}
              onChange={e => setTargetStatus(e.target.value as InvoiceStatus)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 bg-white"
            >
              <option value="GENERATED">GENERATED (Invoice Created)</option>
              <option value="DISPATCHED">DISPATCHED (Goods Left Warehouse)</option>
              <option value="DELIVERED">DELIVERED (Goods Received by Customer)</option>
              <option value="PAID">PAID (Payment Received)</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Truck / Vehicle No</label>
              <input
                type="text"
                value={statusVehicleNo}
                onChange={e => setStatusVehicleNo(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">LR / GR Number</label>
              <input
                type="text"
                value={statusLrGrNo}
                onChange={e => setStatusLrGrNo(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Dispatch Date</label>
              <input
                type="date"
                value={statusDispatchDate}
                onChange={e => setStatusDispatchDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tracking / Dispatch Ref</label>
              <input
                type="text"
                value={statusTrackingNo}
                onChange={e => setStatusTrackingNo(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Delivery Remarks & Confirmation</label>
            <input
              type="text"
              value={statusDeliveryNotes}
              onChange={e => setStatusDeliveryNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2"
            />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // BIG SCREEN VIEW: MAIN INVOICES & ORDERS LIST
  // =========================================================================
  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {isCustomer ? 'My Purchase Orders & GST Invoices' : 'Sales Orders & GST Invoices (Big Screen)'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isCustomer
                  ? `Viewing verified transactions & invoices for ${user?.partyName || user?.name || 'your customer account'}`
                  : 'Connected workflow: Sales Order → Automatic GST 18% Invoice → Dispatch & Transport Tracking'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenNewOrder}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isCustomer ? 'Punch New Order' : 'New Sales Order (SO)'}</span>
          </button>

          {!isCustomer && (
            <button
              onClick={handleOpenNewInvoice}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              <Receipt className="w-4 h-4" />
              <span>Generate GST Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          
          {/* Dual Tabs */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'invoices'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>GST Tax Invoices ({filteredInvoices.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'orders'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>{isCustomer ? 'My Orders' : 'Sales Orders'} ({filteredSalesOrders.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'invoices' ? "Search Invoices, Customers, Truck No..." : "Search Sales Orders, PO Ref, Customer..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* INVOICES TABLE VIEW */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-3.5">Invoice No & Date</th>
                  <th className="p-3.5">Customer Firm & GSTIN</th>
                  <th className="p-3.5">Order Ref & Transport</th>
                  <th className="p-3.5 text-center">Items & Weight</th>
                  <th className="p-3.5 text-right">Taxable (₹)</th>
                  <th className="p-3.5 text-right">GST 18%</th>
                  <th className="p-3.5 text-right">Invoice Total</th>
                  <th className="p-3.5 text-center">Delivery Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No GST invoices found. Click "Generate GST Invoice" above to create one.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 font-mono text-sm">{inv.invoiceNo}</div>
                        <div className="text-[11px] text-slate-500">{inv.date}</div>
                        {inv.salesOrderNo && (
                          <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 border border-blue-200">
                            SO: {inv.salesOrderNo}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm">{inv.customerName}</div>
                        <div className="text-[11px] font-mono text-emerald-900 font-bold">
                          {inv.customerGstin || 'URP'}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="text-slate-800 font-semibold">{inv.orderReference || 'Direct Sale'}</div>
                        <div className="text-[11px] text-slate-500">
                          {inv.vehicleNumber ? `🚛 ${inv.vehicleNumber}` : 'Local pickup'}
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="font-bold text-slate-800">{inv.items.length} items</span>
                        <span className="block text-[10px] font-mono text-slate-500 font-semibold">
                          {inv.items.reduce((sum, i) => sum + (i.quantityKgs || 0), 0).toFixed(0)} Kg
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono font-semibold text-slate-800">
                        {formatCurrency(inv.subtotal - (inv.discountTotal || 0))}
                      </td>

                      <td className="p-3.5 text-right font-mono text-slate-700">
                        {formatCurrency(inv.gstTotal)}
                      </td>

                      <td className="p-3.5 text-right font-mono font-extrabold text-slate-900 text-sm">
                        {formatCurrency(inv.grandTotal)}
                      </td>

                      <td className="p-3.5 text-center">
                        {isCustomer ? (
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                              inv.invoiceStatus === 'DELIVERED' || inv.invoiceStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : inv.invoiceStatus === 'DISPATCHED'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {inv.invoiceStatus || 'GENERATED'}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenStatusModal(inv)}
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition ${
                              inv.invoiceStatus === 'DELIVERED' || inv.invoiceStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : inv.invoiceStatus === 'DISPATCHED'
                                ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            {inv.invoiceStatus || 'GENERATED'} &bull; Edit
                          </button>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onOpenInvoiceView(inv)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="View / Print Tax Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!isCustomer && (
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SALES ORDERS TABLE VIEW */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-3.5">Order No & Date</th>
                  <th className="p-3.5">Customer & PO Ref</th>
                  <th className="p-3.5">Transporter & Truck</th>
                  <th className="p-3.5 text-center">Quantity & Kgs</th>
                  <th className="p-3.5 text-right">Taxable</th>
                  <th className="p-3.5 text-right">Order Value</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">1-Click Invoice Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSalesOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No Sales Orders found. Click "New Sales Order (SO)" to book an order.
                    </td>
                  </tr>
                ) : (
                  filteredSalesOrders.map(so => {
                    const isInvoiced = so.status === 'INVOICED' || (so.invoiceIds && so.invoiceIds.length > 0);

                    return (
                      <tr key={so.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 font-mono text-sm">{so.orderNo}</div>
                          <div className="text-[11px] text-slate-500">{so.orderDate}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 text-sm">{so.customerName}</div>
                          <div className="text-[11px] text-slate-500">
                            PO: <span className="font-semibold text-slate-800">{so.customerPoNumber}</span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">{so.transporterName || 'Vijay Roadways'}</div>
                          <div className="text-[11px] font-mono text-emerald-900 font-bold">
                            {so.vehicleNumber || 'Pending'}
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="font-bold text-slate-800">{so.items.length} items</span>
                          <span className="block text-[10px] font-mono text-slate-500 font-semibold">
                            {so.items.reduce((sum, i) => sum + (i.quantityKgs || 0), 0).toFixed(0)} Kg
                          </span>
                        </td>

                        <td className="p-3.5 text-right font-mono font-semibold text-slate-800">
                          {formatCurrency(so.taxableAmount)}
                        </td>

                        <td className="p-3.5 text-right font-mono font-extrabold text-slate-900 text-sm">
                          {formatCurrency(so.grandTotal)}
                        </td>

                        <td className="p-3.5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                            isInvoiced
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            {so.status}
                          </span>
                          {so.invoiceNos && so.invoiceNos.length > 0 && (
                            <span className="block text-[10px] font-mono text-emerald-700 mt-0.5">
                              Inv: {so.invoiceNos[0]}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {isInvoiced ? (
                              <button
                                onClick={() => {
                                  if (so.invoiceIds && so.invoiceIds.length > 0) {
                                    const linkedInv = invoices.find(i => i.id === so.invoiceIds![0]);
                                    if (linkedInv) onOpenInvoiceView(linkedInv);
                                  }
                                }}
                                className="flex items-center space-x-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition border border-emerald-200"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Invoice</span>
                              </button>
                            ) : isCustomer ? (
                              <span className="text-[11px] font-semibold text-slate-400">
                                In Processing
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenConvertModal(so)}
                                className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition shadow-xs"
                                title="Convert this Sales Order into a GST Tax Invoice directly"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Generate Invoice</span>
                              </button>
                            )}

                            {!isCustomer && (
                              <button
                                onClick={() => handleDeleteSalesOrder(so.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                                title="Delete SO"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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
      )}

    </div>
  );
};
