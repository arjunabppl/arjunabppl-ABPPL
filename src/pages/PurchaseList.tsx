import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { PurchaseOrder, Supplier, Product, PurchaseItem } from '../types/index.js';
import { formatCurrency, formatNumber } from '../utils/paperMath.js';
import {
  ShoppingCart, Plus, Search, Eye, X, PlusCircle, MinusCircle,
  ArrowLeft, Save, Building2, Calendar, Package, Truck, Calculator, Check
} from 'lucide-react';

export const PurchaseList: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Big Screen View Mode
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierBillNo, setSupplierBillNo] = useState('');
  const [vehicleNo, setVehicleNo] = useState('MH-04-FK-9921');
  const [transporterName, setTransporterName] = useState('Vijay Roadways Express');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [notes, setNotes] = useState('Mill direct dispatch arrival at Bhiwandi godown');

  const loadData = async () => {
    try {
      setLoading(true);
      const [poList, sList, pList] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts()
      ]);
      setPurchases(poList);
      setSuppliers(sList);
      setProducts(pList);

      if (sList.length > 0) setSelectedSupplierId(sList[0].id);
      if (pList.length > 0 && purchaseItems.length === 0) {
        initDefaultItem(pList[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const initDefaultItem = (p: Product) => {
    setPurchaseItems([{
      productId: p.id,
      productName: p.name,
      category: p.category,
      gsm: p.gsm,
      sizeInches: p.sizeInches,
      quantity: 100,
      unit: p.unit || 'Ream',
      rate: p.ratePerUnit * 0.85,
      amount: 100 * p.ratePerUnit * 0.85
    }]);
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    const p = products[0];
    setPurchaseItems([...purchaseItems, {
      productId: p.id,
      productName: p.name,
      category: p.category,
      gsm: p.gsm,
      sizeInches: p.sizeInches,
      quantity: 50,
      unit: p.unit || 'Ream',
      rate: p.ratePerUnit * 0.85,
      amount: 50 * p.ratePerUnit * 0.85
    }]);
  };

  const handleRemoveItem = (idx: number) => {
    if (purchaseItems.length <= 1) return;
    setPurchaseItems(purchaseItems.filter((_, i) => i !== idx));
  };

  const subtotal = Math.round(purchaseItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0) * 100) / 100;
  const gstAmount = Math.round((subtotal * 0.18) * 100) / 100;
  const grandTotal = Math.round((subtotal + gstAmount) * 100) / 100;

  const handleOpenNewPurchase = () => {
    setBillDate(new Date().toISOString().split('T')[0]);
    setSupplierBillNo(`INV-${Date.now().toString().slice(-4)}`);
    if (products.length > 0) initDefaultItem(products[0]);
    setViewMode('FORM');
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const supp = suppliers.find(s => s.id === selectedSupplierId);
    if (!supp) return;

    try {
      await api.createPurchase({
        supplierId: supp.id,
        supplierName: supp.companyName || supp.name,
        date: billDate || new Date().toISOString().split('T')[0],
        items: purchaseItems,
        subtotal,
        gstAmount,
        grandTotal,
        paidAmount: 0,
        paymentStatus: 'UNPAID',
        notes: `${notes} | Bill Ref: ${supplierBillNo} | Truck: ${vehicleNo} | Transporter: ${transporterName}`
      });

      setViewMode('LIST');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPurchases = (purchases || []).filter(p => {
    const s = (searchTerm || '').toLowerCase();
    if (!s) return true;
    return (
      (p.purchaseNo || '').toLowerCase().includes(s) ||
      (p.supplierName || '').toLowerCase().includes(s)
    );
  });

  // =========================================================================
  // BIG SCREEN VIEW: NEW PURCHASE BILL DATA ENTRY FORM
  // =========================================================================
  if (viewMode === 'FORM') {
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
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Record Paper Mill Purchase Inward (Big Screen)
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full-screen data entry: mill supplier, bill date, truck & transporter details, line items with 18% GST and auto-inventory update
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const f = document.getElementById('purchase-master-form') as HTMLFormElement;
                if (f) f.requestSubmit();
              }}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Purchase Bill</span>
            </button>
          </div>
        </div>

        <form id="purchase-master-form" onSubmit={handleCreatePurchase} className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Supplier & Items */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Section 1: Supplier & Date Entry */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h2 className="font-bold text-sm text-slate-900">1. Paper Mill Supplier & Bill Date</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Select Paper Mill Supplier *</label>
                    <select
                      value={selectedSupplierId}
                      onChange={e => setSelectedSupplierId(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 bg-white"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.companyName || s.name} &bull; GSTIN: {s.gstin || 'URP'} &bull; Balance: ₹{s.outstandingBalance}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Purchase Bill Date *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={billDate}
                      onChange={e => setBillDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 font-mono font-bold text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Supplier Mill Invoice / Bill No</label>
                    <input
                      type="text"
                      placeholder="e.g. MILL-INV-9921"
                      value={supplierBillNo}
                      onChange={e => setSupplierBillNo(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Truck / Vehicle No</label>
                    <input
                      type="text"
                      placeholder="e.g. MH-04-FK-9921"
                      value={vehicleNo}
                      onChange={e => setVehicleNo(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 font-mono font-bold text-emerald-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Transporter Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Vijay Roadways"
                      value={transporterName}
                      onChange={e => setTransporterName(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Items Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <h2 className="font-bold text-sm text-slate-900">2. Purchased Paper Items & Quantities</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center space-x-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition border border-blue-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                        <th className="p-3">Paper Grade</th>
                        <th className="p-3 text-center w-28">Quantity</th>
                        <th className="p-3 text-right w-28">Purchase Rate (₹)</th>
                        <th className="p-3 text-right w-32">Line Amount (₹)</th>
                        <th className="p-3 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {purchaseItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3">
                            <select
                              value={item.productId}
                              onChange={e => {
                                const p = products.find(prod => prod.id === e.target.value);
                                if (p) {
                                  const updated = [...purchaseItems];
                                  updated[idx] = {
                                    ...item,
                                    productId: p.id,
                                    productName: p.name,
                                    category: p.category,
                                    gsm: p.gsm,
                                    sizeInches: p.sizeInches,
                                    rate: p.ratePerUnit * 0.85,
                                    unit: p.unit || 'Ream',
                                    amount: (item.quantity || 0) * (p.ratePerUnit * 0.85)
                                  };
                                  setPurchaseItems(updated);
                                }
                              }}
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 bg-white"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.gsm} GSM)</option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => {
                                const updated = [...purchaseItems];
                                const q = parseFloat(e.target.value) || 0;
                                updated[idx].quantity = q;
                                updated[idx].amount = q * updated[idx].rate;
                                setPurchaseItems(updated);
                              }}
                              className="w-24 border border-slate-300 rounded-lg px-2 py-1.5 text-center font-bold"
                            />
                            <span className="text-[10px] text-slate-500 block mt-0.5">{item.unit}</span>
                          </td>

                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={e => {
                                const updated = [...purchaseItems];
                                const r = parseFloat(e.target.value) || 0;
                                updated[idx].rate = r;
                                updated[idx].amount = (updated[idx].quantity || 0) * r;
                                setPurchaseItems(updated);
                              }}
                              className="w-24 border border-slate-300 rounded-lg px-2 py-1.5 text-right font-mono font-bold"
                            />
                          </td>

                          <td className="p-3 text-right font-mono font-extrabold text-slate-900">
                            {formatCurrency(item.quantity * item.rate)}
                          </td>

                          <td className="p-3 text-center">
                            {purchaseItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-rose-600 hover:text-rose-800 p-1"
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

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Arrival Remarks & Storage Location</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>
              </div>

            </div>

            {/* Column 3: Tax Summary */}
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4 sticky top-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">Purchase Cost & GST</h3>
                  </div>
                  <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-bold">
                    Input Tax Credit
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Taxable Subtotal:</span>
                    <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Input GST (18%):</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(gstAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-3 text-lg font-black">
                    <span className="text-emerald-400">Total Bill Payable:</span>
                    <span className="text-emerald-400 font-mono">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save & Inward Stock</span>
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
  // BIG SCREEN VIEW: PURCHASES LIST
  // =========================================================================
  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Purchase Orders & Mill Arrivals (Big Screen)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Record paper mill purchase bills, auto-update godown stock inventory and supplier accounts payable
          </p>
        </div>

        <button
          onClick={handleOpenNewPurchase}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm w-max"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Bill</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO #, Supplier Mill..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total Purchase Bills: {filteredPurchases.length}
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <th className="p-3.5">PO Bill No</th>
                <th className="p-3.5">Paper Mill Supplier</th>
                <th className="p-3.5">Bill Date</th>
                <th className="p-3.5 text-right">Subtotal</th>
                <th className="p-3.5 text-right">GST (18%)</th>
                <th className="p-3.5 text-right">Grand Total</th>
                <th className="p-3.5 text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No purchase bills found. Click "New Purchase Bill" to record one.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold font-mono text-emerald-900">{po.purchaseNo}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{po.supplierName}</td>
                    <td className="p-3.5 text-slate-500 font-mono">{po.date}</td>
                    <td className="p-3.5 text-right font-medium text-slate-700">{formatCurrency(po.subtotal)}</td>
                    <td className="p-3.5 text-right font-medium text-slate-700">{formatCurrency(po.gstAmount)}</td>
                    <td className="p-3.5 text-right font-extrabold text-slate-900">{formatCurrency(po.grandTotal)}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        po.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : po.paymentStatus === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}>
                        {po.paymentStatus}
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
