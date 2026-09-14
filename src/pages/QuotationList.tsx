import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Invoice, Customer, Product, InvoiceItem } from '../types/index.js';
import { formatCurrency } from '../utils/paperMath.js';
import {
  FileSpreadsheet, Plus, Search, Eye, CheckCircle2, ArrowRight, X, PlusCircle, MinusCircle
} from 'lucide-react';

interface QuotationListProps {
  onOpenInvoiceView: (inv: Invoice) => void;
}

export const QuotationList: React.FC<QuotationListProps> = ({ onOpenInvoiceView }) => {
  const [quotations, setQuotations] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);

  const loadData = async () => {
    try {
      const [qList, cList, pList] = await Promise.all([
        api.getInvoices('QUOTATION'),
        api.getCustomers(),
        api.getProducts()
      ]);
      setQuotations(qList);
      setCustomers(cList);
      setProducts(pList);

      if (cList.length > 0) setSelectedCustomerId(cList[0].id);
      if (pList.length > 0) {
        setItems([{
          productId: pList[0].id,
          productName: pList[0].name,
          category: pList[0].category,
          gsm: pList[0].gsm,
          sizeInches: pList[0].sizeInches,
          quantity: 100,
          unit: pList[0].unit,
          rate: pList[0].ratePerUnit,
          amount: 100 * pList[0].ratePerUnit,
          discountPct: 2,
          gstRate: pList[0].gstRate || 12,
          gstAmount: (100 * pList[0].ratePerUnit * 0.98) * 0.12,
          netAmount: (100 * pList[0].ratePerUnit * 0.98) * 1.12
        }]);
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

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const discountTotal = items.reduce((sum, item) => sum + ((item.quantity * item.rate) * (item.discountPct / 100)), 0);
  const gstTotal = items.reduce((sum, item) => sum + item.gstAmount, 0);
  const grandTotal = Math.round((subtotal - discountTotal + gstTotal) * 100) / 100;

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId);
    if (!cust) return;

    try {
      const qtn = await api.createInvoice({
        type: 'QUOTATION',
        quotationStatus: 'SENT',
        customerId: cust.id,
        customerName: cust.companyName || cust.name,
        customerGstin: cust.gstin,
        customerPhone: cust.phone,
        customerAddress: `${cust.address}, ${cust.city}`,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        items,
        subtotal,
        discountTotal,
        gstTotal,
        grandTotal,
        notes: 'Price estimate valid for 15 days.'
      });

      setShowModal(false);
      loadData();
      onOpenInvoiceView(qtn);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertToInvoice = async (qtn: Invoice) => {
    if (confirm(`Convert quotation #${qtn.invoiceNo} into official Tax Invoice?`)) {
      try {
        await api.createInvoice({
          ...qtn,
          type: 'INVOICE',
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
        });
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredQuotations = (quotations || []).filter(q => {
    const s = (searchTerm || '').toLowerCase();
    if (!s) return true;
    return (
      (q.invoiceNo || '').toLowerCase().includes(s) ||
      (q.customerName || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Quotations & Rate Estimates</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate formal paper price quotes, track approval status and convert to Tax Invoices
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition shadow-sm w-max"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Quotation #, Customer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total Quotations: {filteredQuotations.length}
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <th className="p-3">Quotation No</th>
                <th className="p-3">Customer Firm</th>
                <th className="p-3">Issue Date</th>
                <th className="p-3 text-right">Quoted Amount</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredQuotations.map(qtn => (
                <tr key={qtn.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-bold font-mono text-emerald-900">{qtn.invoiceNo}</td>
                  <td className="p-3 font-semibold text-slate-900">{qtn.customerName}</td>
                  <td className="p-3 text-slate-500">{qtn.date}</td>
                  <td className="p-3 text-right font-extrabold text-slate-900">{formatCurrency(qtn.grandTotal)}</td>
                  <td className="p-3 text-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      {qtn.quotationStatus || 'SENT'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onOpenInvoiceView(qtn)}
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded transition"
                        title="View & Print Quotation"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleConvertToInvoice(qtn)}
                        className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-[11px] rounded border border-emerald-300 transition"
                        title="Convert to Sales Invoice"
                      >
                        <span>Convert to Invoice</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Quotation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-base">Generate Paper Price Quotation</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 bg-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 uppercase text-[10px] block mb-2">Paper Items</label>
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-12 gap-2 items-center mb-2">
                    <div className="col-span-6">
                      <select
                        value={item.productId}
                        onChange={e => {
                          const p = products.find(prod => prod.id === e.target.value);
                          if (p) {
                            const updated = [...items];
                            updated[idx] = {
                              ...item,
                              productId: p.id,
                              productName: p.name,
                              rate: p.ratePerUnit,
                              unit: p.unit
                            };
                            setItems(updated);
                          }
                        }}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-bold bg-white"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => {
                          const updated = [...items];
                          updated[idx].quantity = parseInt(e.target.value) || 0;
                          setItems(updated);
                        }}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-center font-bold"
                      />
                    </div>

                    <div className="col-span-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.quantity * item.rate)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 text-white p-3 rounded-lg flex justify-between font-bold">
                <span>Quoted Amount Total:</span>
                <span className="text-emerald-400 font-mono">{formatCurrency(grandTotal)}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white font-bold px-5 py-2 rounded-lg"
                >
                  Create & Print Quotation
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
