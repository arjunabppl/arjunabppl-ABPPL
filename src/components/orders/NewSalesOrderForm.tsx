import React, { useState, useEffect } from 'react';
import { Product, Customer, SalesOrder, SalesOrderItem, User } from '../../types/index.js';
import { api } from '../../services/api.js';
import { formatCurrency, formatNumber, calculateReamWeightKg } from '../../utils/paperMath.js';
import {
  Plus, Trash2, Save, Send, AlertCircle, CheckCircle2, Layers,
  Building, Truck, ShieldAlert, FileText, Info, ShoppingBag, ArrowLeft
} from 'lucide-react';

interface NewSalesOrderFormProps {
  currentUser: User;
  onSuccess: (order: SalesOrder) => void;
  onCancel: () => void;
}

export const NewSalesOrderForm: React.FC<NewSalesOrderFormProps> = ({
  currentUser,
  onSuccess,
  onCancel
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected Customer details
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerPoNumber, setCustomerPoNumber] = useState<string>('');
  const [customerPoDate, setCustomerPoDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState<string>('30 Days Credit');
  const [transporterName, setTransporterName] = useState<string>('Mahalaxmi Freight Carriers');
  const [notes, setNotes] = useState<string>('Packed in shrink-wrapped poly film with corner edge guards.');
  const [freightCharges, setFreightCharges] = useState<number>(0);

  // Paper Categories Filter helper
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Items in Order
  const [items, setItems] = useState<SalesOrderItem[]>([
    {
      id: `item-${Date.now()}-1`,
      productId: '',
      productName: '',
      category: 'Copier Paper',
      brand: 'JK Paper',
      gsm: 75,
      sizeInches: 'A4',
      quantity: 50,
      unit: 'Ream',
      rate: 285,
      discountPct: 2,
      discountAmount: 285,
      taxableValue: 13965,
      gstRate: 18,
      gstAmount: 2513.7,
      netAmount: 16478.7,
      quantityKgs: 117,
      stockReserved: true
    }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodList, custList] = await Promise.all([
        api.getProducts(),
        api.getCustomers()
      ]);
      setProducts(prodList || []);
      setCustomers(custList || []);

      // If user is a customer, lock/pre-select customer
      const currentUserName = (currentUser?.name || '').toLowerCase();
      const currentUserPartyName = (currentUser?.partyName || '').toLowerCase();
      const currentUserEmail = (currentUser?.email || '').toLowerCase();
      const currentPartyId = currentUser?.partyId;

      if (currentUser.role === 'customer') {
        const found = custList?.find(c => 
          (currentPartyId && c.id === currentPartyId) ||
          (currentUserPartyName && (c.name || '').toLowerCase().includes(currentUserPartyName)) ||
          (currentUserPartyName && currentUserPartyName.includes((c.name || '').toLowerCase())) ||
          (currentUserEmail && (c.email || '').toLowerCase() === currentUserEmail) || 
          (currentUserName && (c.name || '').toLowerCase().includes(currentUserName))
        ) || custList?.[0];

        if (found) {
          setSelectedCustomerId(found.id);
          setSelectedCustomer(found);
          setDeliveryAddress([found.address, found.city, found.state].filter(Boolean).join(', ') || found.address || '');
        }
      } else if (currentUser.role === 'distributor') {
        const found = custList?.find(c => 
          (c.name || '').toLowerCase().includes('distributor') || 
          (currentUserName && (c.name || '').toLowerCase() === currentUserName)
        );
        if (found) {
          setSelectedCustomerId(found.id);
          setSelectedCustomer(found);
          setDeliveryAddress([found.address, found.city, found.state].filter(Boolean).join(', ') || found.address || '');
        } else if (custList && custList.length > 0) {
          setSelectedCustomerId(custList[0].id);
          setSelectedCustomer(custList[0]);
          setDeliveryAddress([custList[0].address, custList[0].city, custList[0].state].filter(Boolean).join(', ') || custList[0].address || '');
        }
      } else if (custList && custList.length > 0) {
        setSelectedCustomerId(custList[0].id);
        setSelectedCustomer(custList[0]);
        setDeliveryAddress([custList[0].address, custList[0].city, custList[0].state].filter(Boolean).join(', ') || custList[0].address || '');
      }
    } catch (err) {
      console.error('Error loading order form prerequisites', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    const c = customers.find(x => x.id === id);
    setSelectedCustomer(c || null);
    if (c) {
      setDeliveryAddress(c.shippingAddress || c.billingAddress || '');
      setPaymentTerms(c.paymentTerms || '30 Days Credit');
    }
  };

  // Recalculate item financials
  const updateItem = (index: number, updates: Partial<SalesOrderItem>) => {
    setItems(prev => {
      const updated = [...prev];
      const current = { ...updated[index], ...updates };

      const qty = Number(current.quantity) || 0;
      const rate = Number(current.rate) || 0;
      const discPct = Number(current.discountPct) || 0;
      const gstRate = Number(current.gstRate) || 18;

      const gross = qty * rate;
      const discAmount = (gross * discPct) / 100;
      const taxable = gross - discAmount;
      const gstAmount = (taxable * gstRate) / 100;
      const netAmount = taxable + gstAmount;

      // Estimate weight in kgs
      let kgs = 0;
      const sizeStr = (current.sizeInches || '').toUpperCase();
      if (sizeStr.includes('A4')) {
        // Standard A4 500 sheets: 75 GSM ~ 2.34kg, 80 GSM ~ 2.5kg
        kgs = Math.round((current.gsm * 0.0312 * qty) * 10) / 10;
      } else if (sizeStr.includes('X')) {
        const parts = sizeStr.split('X').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          kgs = Math.round(calculateReamWeightKg(parts[0], parts[1], current.gsm) * qty * 10) / 10;
        }
      }
      if (kgs === 0) {
        kgs = Math.round((qty * 2.3) * 10) / 10;
      }

      current.discountAmount = discAmount;
      current.taxableValue = taxable;
      current.gstAmount = gstAmount;
      current.netAmount = netAmount;
      current.quantityKgs = kgs;

      updated[index] = current;
      return updated;
    });
  };

  const handleProductSelect = (index: number, productId: string) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    updateItem(index, {
      productId: p.id,
      productName: p.name,
      category: p.category,
      brand: p.brand || 'ABPPL Mill Paper',
      gsm: p.gsm || 75,
      sizeInches: p.sizeInches || (p.size ? `${p.size.width} x ${p.size.length}` : 'A4'),
      rate: p.sellingPrice || p.currentStockPrice || 290,
      unit: p.unit || 'Ream',
      gstRate: p.taxRate || 18
    });
  };

  const addItemRow = () => {
    const defaultProd = products[0];
    setItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        productId: defaultProd ? defaultProd.id : '',
        productName: defaultProd ? defaultProd.name : 'A4 Copier Paper 75 GSM',
        category: defaultProd ? defaultProd.category : 'Copier Paper',
        brand: defaultProd?.brand || 'JK Paper',
        gsm: defaultProd ? defaultProd.gsm : 75,
        sizeInches: defaultProd ? (defaultProd.sizeInches || 'A4') : 'A4',
        quantity: 50,
        unit: defaultProd ? defaultProd.unit : 'Ream',
        rate: defaultProd ? defaultProd.sellingPrice : 285,
        discountPct: 0,
        discountAmount: 0,
        taxableValue: 14250,
        gstRate: defaultProd ? (defaultProd.taxRate || 18) : 18,
        gstAmount: 2565,
        netAmount: 16815,
        quantityKgs: 117,
        stockReserved: true
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Aggregates
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const totalWeightKgs = items.reduce((sum, it) => sum + (it.quantityKgs || 0), 0);
  const subtotal = items.reduce((sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.rate) || 0)), 0);
  const discountTotal = items.reduce((sum, it) => sum + (it.discountAmount || 0), 0);
  const taxableAmount = items.reduce((sum, it) => sum + (it.taxableValue || 0), 0);
  const gstTotal = items.reduce((sum, it) => sum + (it.gstAmount || 0), 0);
  const cgstTotal = Math.round((gstTotal / 2) * 100) / 100;
  const sgstTotal = Math.round((gstTotal / 2) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + gstTotal + (Number(freightCharges) || 0)) * 100) / 100;

  // Credit Limit Check
  const currentOutstanding = selectedCustomer?.outstandingBalance || 0;
  const creditLimit = selectedCustomer?.creditLimit || 0;
  const isCreditExceeded = creditLimit > 0 && (currentOutstanding + grandTotal > creditLimit);

  const handleSubmitOrder = async (isDraft: boolean) => {
    try {
      setSubmitting(true);
      setErrorMessage(null);

      if (!selectedCustomer) {
        throw new Error('Please select a Customer for this order.');
      }
      if (items.length === 0) {
        throw new Error('Please add at least one paper product.');
      }
      for (const it of items) {
        if (!it.productName || !it.quantity || it.quantity <= 0) {
          throw new Error('All items must have a valid paper product and quantity > 0.');
        }
      }

      const orderData: Partial<SalesOrder> = {
        orderNo: `SO-${Date.now().toString().slice(-6)}`,
        orderDate: new Date().toISOString().split('T')[0],
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerAddress: deliveryAddress || selectedCustomer.shippingAddress || selectedCustomer.billingAddress,
        customerGstin: selectedCustomer.gstin,
        customerPhone: selectedCustomer.phone,
        customerEmail: selectedCustomer.email,
        customerPoNumber,
        customerPoDate,
        expectedDeliveryDate,
        paymentTerms,
        transporterName,
        deliveryAddress,
        status: isDraft ? 'DRAFT' : 'SUBMITTED',
        paymentStatus: 'UNPAID',
        items,
        subtotal,
        discountTotal,
        taxableAmount,
        cgstTotal,
        sgstTotal,
        gstTotal,
        freightCharges: Number(freightCharges) || 0,
        otherCharges: 0,
        grandTotal,
        paidAmount: 0,
        balanceDue: grandTotal,
        notes,
        creditLimitExceeded: isCreditExceeded
      };

      const saved = await api.createSalesOrder(orderData);
      onSuccess(saved);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit sales order');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCatalogProducts = categoryFilter === 'ALL'
    ? products
    : products.filter(p => p.category?.toUpperCase() === categoryFilter.toUpperCase());

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">Create B2B Paper Wholesale Sales Order</h1>
            <p className="text-xs text-slate-400">
              Select mill-grade papers, calculate ream weights & taxes, check available godown stock.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Customer & Billing Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          
          {/* Customer Selector */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Building className="w-4 h-4 text-emerald-700" />
              <span>1. Customer & Account *</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Customer Party</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                disabled={currentUser.role === 'customer'}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-700"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isDistributor ? '(Distributor)' : ''} - {c.city || 'MH'}
                  </option>
                ))}
              </select>
              {currentUser.role === 'customer' && (
                <div className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                  <span>Order punching locked to your customer account: <strong>{selectedCustomer?.name || currentUser.partyName || currentUser.name}</strong></span>
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="text-[11px] text-slate-600">GSTIN: <strong className="text-slate-900">{selectedCustomer.gstin || 'URP'}</strong></div>
                <div className="text-[11px] text-slate-600">Credit Limit: <strong className="text-slate-900">{formatCurrency(selectedCustomer.creditLimit || 0)}</strong></div>
                <div className="text-[11px] text-slate-600">Outstanding Balance: <strong className="text-slate-900">{formatCurrency(selectedCustomer.outstandingBalance || 0)}</strong></div>
                
                {isCreditExceeded && (
                  <div className="p-2 mt-2 bg-amber-50 border border-amber-300 rounded-lg text-[10px] font-bold text-amber-900 flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Credit limit will be exceeded with this order!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PO & Schedule Details */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>2. PO & Schedule</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer PO Number</label>
                <input
                  type="text"
                  value={customerPoNumber}
                  onChange={(e) => setCustomerPoNumber(e.target.value)}
                  placeholder="PO-ABP-8821"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">PO Date</label>
                <input
                  type="date"
                  value={customerPoDate}
                  onChange={(e) => setCustomerPoDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500"
                >
                  <option value="Immediate Advance">Immediate Advance</option>
                  <option value="15 Days Credit">15 Days Credit</option>
                  <option value="30 Days Credit">30 Days Credit</option>
                  <option value="45 Days Credit">45 Days Credit</option>
                  <option value="Against Delivery">Against Delivery</option>
                </select>
              </div>
            </div>
          </div>

          {/* Delivery Address & Transport */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Truck className="w-4 h-4 text-emerald-700" />
              <span>3. Shipping & Logistics</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Delivery Destination Address *</label>
              <textarea
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Complete Godown / Press Delivery Address..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Preferred Transporter</label>
              <input
                type="text"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                placeholder="E.g. Mahalaxmi Roadways"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500"
              />
            </div>
          </div>

        </div>

        {/* Paper Products Selector & Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          
          <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold">Paper Products & Technical Line Items</h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Paper Item</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3 w-8">#</th>
                  <th className="py-3 px-3 min-w-[220px]">Paper Grade & Product</th>
                  <th className="py-3 px-3 w-28">GSM & Size</th>
                  <th className="py-3 px-3 w-24 text-right">Quantity</th>
                  <th className="py-3 px-3 w-24 text-right">Approx Wt (Kg)</th>
                  <th className="py-3 px-3 w-28 text-right">Rate / Unit (₹)</th>
                  <th className="py-3 px-3 w-20 text-right">Disc %</th>
                  <th className="py-3 px-3 w-28 text-right">Taxable (₹)</th>
                  <th className="py-3 px-3 w-24 text-right">GST (18%)</th>
                  <th className="py-3 px-3 w-28 text-right">Net Total (₹)</th>
                  <th className="py-3 px-3 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, idx) => {
                  const selectedProduct = products.find(p => p.id === item.productId);
                  const availableStock = selectedProduct ? selectedProduct.currentStock : 500;

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50">
                      <td className="py-3 px-3 text-slate-400 font-bold">{idx + 1}</td>
                      
                      {/* Product selection */}
                      <td className="py-3 px-3">
                        <select
                          value={item.productId || ''}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500"
                        >
                          <option value="">-- Choose Paper Master --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} [{p.gsm} GSM] - Stock: {p.currentStock} {p.unit || 'Reams'}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center justify-between text-[10px] mt-1 text-slate-500">
                          <span>Brand: <strong className="text-slate-700">{item.brand || 'ABPPL'}</strong></span>
                          <span className={`font-bold ${availableStock < item.quantity ? 'text-rose-600' : 'text-emerald-700'}`}>
                            Stock: {availableStock} {item.unit || 'Reams'}
                          </span>
                        </div>
                      </td>

                      {/* GSM & Size */}
                      <td className="py-3 px-3 space-y-1">
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            value={item.gsm}
                            onChange={(e) => updateItem(idx, { gsm: Number(e.target.value) })}
                            className="w-14 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-center font-bold"
                            placeholder="GSM"
                          />
                          <span className="text-[10px] text-slate-500 font-semibold">GSM</span>
                        </div>
                        <input
                          type="text"
                          value={item.sizeInches || 'A4'}
                          onChange={(e) => updateItem(idx, { sizeInches: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-[11px] text-slate-800"
                          placeholder="e.g. 23x36"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, { quantity: Math.max(1, Number(e.target.value)) })}
                          className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-black text-right text-slate-900 focus:border-emerald-500"
                        />
                        <span className="block text-[10px] text-slate-500 mt-0.5">{item.unit || 'Ream'}</span>
                      </td>

                      {/* Calculated Weight */}
                      <td className="py-3 px-3 text-right text-slate-700 font-bold">
                        {formatNumber(item.quantityKgs || 0)} Kg
                      </td>

                      {/* Rate */}
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateItem(idx, { rate: Math.max(0, Number(e.target.value)) })}
                          className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-right text-slate-900 focus:border-emerald-500"
                        />
                      </td>

                      {/* Discount % */}
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={item.discountPct || 0}
                          onChange={(e) => updateItem(idx, { discountPct: Math.max(0, Math.min(100, Number(e.target.value))) })}
                          className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-right text-slate-900 focus:border-emerald-500"
                        />
                      </td>

                      {/* Taxable Value */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-900">
                        {formatCurrency(item.taxableValue)}
                      </td>

                      {/* GST */}
                      <td className="py-3 px-3 text-right text-slate-700">
                        {formatCurrency(item.gstAmount)}
                      </td>

                      {/* Net Total */}
                      <td className="py-3 px-3 text-right font-black text-slate-950">
                        {formatCurrency(item.netAmount)}
                      </td>

                      {/* Remove Row */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* Bottom Financials & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-xs">
          
          {/* Notes & Freight */}
          <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Order Notes / Special Paper Handling Instructions
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:border-emerald-500"
                placeholder="E.g., Pallet strapping, moisture-resistant wrap, deliver before 5 PM..."
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Transport / Freight Charges (₹)
                </label>
                <span className="text-[10px] text-slate-500">Door delivery charges if applicable</span>
              </div>
              <input
                type="number"
                min="0"
                value={freightCharges}
                onChange={(e) => setFreightCharges(Math.max(0, Number(e.target.value)))}
                className="w-32 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-right text-slate-900 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Grand Total Calculation Card */}
          <div className="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2.5">
            <div className="flex justify-between text-slate-700">
              <span>Total Quantity & Weight:</span>
              <span className="font-bold text-slate-900">{formatNumber(totalQuantity)} Reams ({formatNumber(totalWeightKgs)} Kg)</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Gross Paper Subtotal:</span>
              <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Total Trade Discount:</span>
                <span className="font-bold">-{formatCurrency(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700">
              <span>Taxable Value:</span>
              <span className="font-bold text-slate-900">{formatCurrency(taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>CGST (9%):</span>
              <span className="font-bold text-slate-900">{formatCurrency(cgstTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>SGST (9%):</span>
              <span className="font-bold text-slate-900">{formatCurrency(sgstTotal)}</span>
            </div>
            {freightCharges > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Transport / Freight:</span>
                <span className="font-bold text-slate-900">{formatCurrency(freightCharges)}</span>
              </div>
            )}

            <div className="border-t-2 border-emerald-700 pt-3 flex justify-between items-center">
              <div>
                <span className="text-sm font-black text-emerald-950 block">Grand Total:</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Inclusive of all GST & freight</span>
              </div>
              <div className="text-2xl font-black text-emerald-950">
                {formatCurrency(grandTotal)}
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Discard Order
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitOrder(true)}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold transition border border-slate-300"
            >
              <Save className="w-4 h-4 text-slate-600" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitOrder(false)}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-black transition shadow-lg"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting Order...' : 'Submit Sales Order to ABPPL'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
