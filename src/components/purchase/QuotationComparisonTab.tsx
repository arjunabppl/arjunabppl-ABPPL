import React, { useState } from 'react';
import { SupplierQuotationComparison, SupplierQuoteEntry, Supplier, Product, PurchaseRequisition } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import {
  FileSpreadsheet, Plus, Search, Trophy, CheckCircle2, Globe, Truck,
  DollarSign, ArrowRight, Eye, Calendar, Sparkles, Building2
} from 'lucide-react';

interface QuotationComparisonTabProps {
  quotations: SupplierQuotationComparison[];
  suppliers: Supplier[];
  products: Product[];
  requisitions: PurchaseRequisition[];
  onSaveQuotation: (data: Partial<SupplierQuotationComparison>) => Promise<void>;
  onSelectQuote: (comparisonId: string, supplierId: string, decisionNotes: string) => Promise<void>;
  onCreatePoFromQuote?: (comp: SupplierQuotationComparison, quote: SupplierQuoteEntry) => void;
  currentUserRole?: string;
}

export const QuotationComparisonTab: React.FC<QuotationComparisonTabProps> = ({
  quotations = [],
  suppliers = [],
  products = [],
  requisitions = [],
  onSaveQuotation,
  onSelectQuote,
  onCreatePoFromQuote,
  currentUserRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [viewDetailModal, setViewDetailModal] = useState<SupplierQuotationComparison | null>(null);
  const [awardModal, setAwardModal] = useState<{ comp: SupplierQuotationComparison; quote: SupplierQuoteEntry } | null>(null);
  const [awardNotes, setAwardNotes] = useState('Offered lowest total cost with quickest delivery lead time');

  // Form State
  const [selectedReqId, setSelectedReqId] = useState('');
  const [productName, setProductName] = useState('Virgin SBS Board 300 GSM');
  const [gsm, setGsm] = useState(300);
  const [sizeInches, setSizeInches] = useState('25x36');
  const [requiredQuantity, setRequiredQuantity] = useState(400);
  const [unit, setUnit] = useState('Ream');
  const [quotes, setQuotes] = useState<SupplierQuoteEntry[]>([
    {
      supplierId: suppliers?.[0]?.id || 's-1',
      supplierName: suppliers?.[0]?.companyName || 'Stora Enso Oyj (Finland)',
      supplierCountry: 'Finland',
      currency: 'USD',
      unitRateForeign: 14.50,
      exchangeRate: 86.80,
      unitRateInr: 1258.60,
      freightInr: 45000,
      paymentTerms: 'LC at 60 Days',
      deliveryLeadDays: 28,
      totalInr: 1258.60 * 400 + 45000,
      isSelected: false
    },
    {
      supplierId: suppliers?.[1]?.id || 's-2',
      supplierName: suppliers?.[1]?.companyName || 'ITC Limited - PSPD (India)',
      supplierCountry: 'India',
      currency: 'INR',
      unitRateForeign: 1320,
      exchangeRate: 1.0,
      unitRateInr: 1320,
      freightInr: 15000,
      paymentTerms: 'Net 30 Days',
      deliveryLeadDays: 10,
      totalInr: 1320 * 400 + 15000,
      isSelected: false
    }
  ]);

  const filtered = (quotations || []).filter(q => {
    if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
    const s = (searchTerm || '').toLowerCase();
    if (s) {
      return (
        (q.comparisonNo || '').toLowerCase().includes(s) ||
        (q.productName || '').toLowerCase().includes(s) ||
        (q.quotes || []).some(sub => (sub.supplierName || '').toLowerCase().includes(s))
      );
    }
    return true;
  });

  const handleOpenNew = () => {
    setShowModal(true);
  };

  const handleAddSupplierColumn = () => {
    const s = suppliers[quotes.length % suppliers.length] || suppliers[0];
    if (!s) return;
    setQuotes([
      ...quotes,
      {
        supplierId: s.id,
        supplierName: s.companyName,
        supplierCountry: 'India',
        currency: 'INR',
        unitRateForeign: 1200,
        exchangeRate: 1.0,
        unitRateInr: 1200,
        freightInr: 12000,
        paymentTerms: 'Net 30 Days',
        deliveryLeadDays: 14,
        totalInr: 1200 * requiredQuantity + 12000,
        isSelected: false
      }
    ]);
  };

  const handleQuoteChange = (index: number, field: keyof SupplierQuoteEntry, value: any) => {
    const newQuotes = [...quotes];
    const item = { ...newQuotes[index], [field]: value };
    if (field === 'supplierId') {
      const sup = suppliers.find(s => s.id === value);
      if (sup) {
        item.supplierName = sup.companyName;
      }
    }
    if (field === 'unitRateForeign' || field === 'exchangeRate' || field === 'currency') {
      const ex = item.currency === 'INR' ? 1.0 : Number(item.exchangeRate || 86.80);
      item.exchangeRate = ex;
      item.unitRateInr = Number((Number(item.unitRateForeign || 0) * ex).toFixed(2));
    }
    item.totalInr = Number(((item.unitRateInr * requiredQuantity) + Number(item.freightInr || 0)).toFixed(2));
    newQuotes[index] = item;
    setQuotes(newQuotes);
  };

  const handleRemoveQuote = (index: number) => {
    if (quotes.length <= 1) return;
    setQuotes(quotes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selReq = requisitions.find(r => r.id === selectedReqId);
    await onSaveQuotation({
      requisitionId: selectedReqId || undefined,
      requisitionNo: selReq ? selReq.reqNo : undefined,
      productName,
      gsm,
      sizeInches,
      requiredQuantity,
      unit,
      quotes,
      status: 'IN_REVIEW'
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-4" id="quotation-comparison-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Supplier Quotation Matrix (RFQ)</h3>
            <p className="text-xs text-slate-400">Multi-supplier comparison with foreign exchange, freight, and landing evaluation</p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation Matrix</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search RFQ #, product, or supplier name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="AWARDED">Awarded</option>
          </select>
        </div>
      </div>

      {/* Grid of Quotation Comparisons */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400 text-xs">
            No supplier quotation comparisons found. Click "New Quotation Matrix" to evaluate bids.
          </div>
        ) : (
          filtered.map(comp => {
            const minQuote = comp.quotes.reduce((min, q) => (q.totalInr < min.totalInr ? q : min), comp.quotes[0]);

            return (
              <div
                key={comp.id}
                className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-600 transition"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-400 text-sm">{comp.comparisonNo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        comp.status === 'AWARDED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {comp.status}
                      </span>
                      {comp.requisitionNo && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Linked PR: {comp.requisitionNo}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mt-1">
                      {comp.productName} ({comp.gsm} GSM • {comp.sizeInches}) — Required: {comp.requiredQuantity} {comp.unit}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewDetailModal(comp)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Full Matrix</span>
                    </button>
                  </div>
                </div>

                {/* Side-by-side Supplier Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {comp.quotes.map((q, idx) => {
                    const isLowest = minQuote && q.supplierId === minQuote.supplierId;
                    const isAwarded = comp.selectedSupplierId === q.supplierId;

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border relative transition ${
                          isAwarded
                            ? 'bg-emerald-950/40 border-emerald-500/60 shadow-xs'
                            : isLowest
                            ? 'bg-blue-950/30 border-blue-500/40'
                            : 'bg-slate-900/60 border-slate-700/50'
                        }`}
                      >
                        {isAwarded && (
                          <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 shadow-xs">
                            <Trophy className="w-3 h-3" />
                            <span>Awarded Quote</span>
                          </span>
                        )}

                        {isLowest && !isAwarded && (
                          <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 shadow-xs">
                            <Sparkles className="w-3 h-3" />
                            <span>Lowest Price</span>
                          </span>
                        )}

                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-100">{q.supplierName}</h4>
                            <span className="text-[10px] text-slate-400">{q.supplierCountry} • {q.paymentTerms}</span>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1 text-xs">
                          <div className="flex justify-between text-slate-300">
                            <span>Quoted Rate:</span>
                            <span className="font-semibold text-slate-100">
                              {q.currency} {formatNumber(q.unitRateForeign)}
                              {q.currency !== 'INR' && ` (₹${q.unitRateInr})`}
                            </span>
                          </div>

                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Freight / Transit:</span>
                            <span>{formatCurrency(q.freightInr || 0)}</span>
                          </div>

                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Lead Time:</span>
                            <span>{q.deliveryLeadDays} days</span>
                          </div>

                          <div className="pt-2 border-t border-slate-700/60 flex justify-between font-bold">
                            <span className="text-slate-300">Total Landed INR:</span>
                            <span className={`text-sm ${isAwarded ? 'text-emerald-400' : isLowest ? 'text-blue-400' : 'text-slate-200'}`}>
                              {formatCurrency(q.totalInr)}
                            </span>
                          </div>
                        </div>

                        {comp.status !== 'AWARDED' && (currentUserRole === 'superadmin' || currentUserRole === 'purchase' || currentUserRole === 'admin') && (
                          <div className="mt-3 pt-2 border-t border-slate-800 flex justify-end">
                            <button
                              onClick={() => {
                                setAwardModal({ comp, quote: q });
                                setAwardNotes(`Selected ${q.supplierName} for best cost/lead time terms.`);
                              }}
                              className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold flex items-center space-x-1"
                            >
                              <Trophy className="w-3 h-3" />
                              <span>Select & Award</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {comp.decisionNotes && (
                  <div className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-lg text-xs text-slate-300">
                    <span className="font-semibold text-emerald-400">Award Decision Notes: </span>
                    {comp.decisionNotes} (Evaluated by {comp.evaluatedBy})
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: New Quotation Matrix */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-slate-100">Create Supplier Quotation Matrix (RFQ)</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Paper Grade / Product</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GSM & Size</label>
                  <div className="flex space-x-1.5">
                    <input
                      type="number"
                      value={gsm}
                      onChange={e => setGsm(Number(e.target.value))}
                      placeholder="GSM"
                      className="w-1/2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-slate-100 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={sizeInches}
                      onChange={e => setSizeInches(e.target.value)}
                      placeholder="Size"
                      className="w-1/2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Required Quantity ({unit})</label>
                  <input
                    type="number"
                    min="1"
                    value={requiredQuantity}
                    onChange={e => setRequiredQuantity(Number(e.target.value))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Quotations Matrix Columns */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-200">Supplier Quotes Received</h4>
                  <button
                    type="button"
                    onClick={handleAddSupplierColumn}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded border border-blue-500/30 font-semibold text-[11px] flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Supplier Quote</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {quotes.map((q, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-xl space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-4">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Supplier</label>
                          <select
                            value={q.supplierId}
                            onChange={e => handleQuoteChange(idx, 'supplierId', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                          >
                            {suppliers.map(s => (
                              <option key={s.id} value={s.id}>{s.companyName}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Currency</label>
                          <select
                            value={q.currency}
                            onChange={e => handleQuoteChange(idx, 'currency', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                          >
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="SGD">SGD ($)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Quoted Rate ({q.currency})</label>
                          <input
                            type="number"
                            step="0.01"
                            value={q.unitRateForeign}
                            onChange={e => handleQuoteChange(idx, 'unitRateForeign', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                          />
                        </div>

                        {q.currency !== 'INR' && (
                          <div className="sm:col-span-2">
                            <label className="text-[10px] text-slate-400 block mb-0.5">Ex. Rate (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={q.exchangeRate}
                              onChange={e => handleQuoteChange(idx, 'exchangeRate', Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                            />
                          </div>
                        )}

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Freight (₹)</label>
                          <input
                            type="number"
                            value={q.freightInr}
                            onChange={e => handleQuoteChange(idx, 'freightInr', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
                        <div className="flex items-center space-x-4 text-slate-400 text-[11px]">
                          <span>INR Rate: <strong className="text-slate-200">₹{q.unitRateInr}</strong></span>
                          <span>Total Landed: <strong className="text-emerald-400">{formatCurrency(q.totalInr)}</strong></span>
                        </div>
                        {quotes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuote(idx)}
                            className="text-red-400 hover:text-red-300 text-[11px]"
                          >
                            Remove Quote
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  Save Quotation Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Award Modal */}
      {awardModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Award Quotation to {awardModal.quote.supplierName}</span>
            </h3>
            <p className="text-xs text-slate-300">
              Total Landed Amount: <strong>{formatCurrency(awardModal.quote.totalInr)}</strong>
            </p>
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Decision / Approval Justification</label>
              <textarea
                rows={3}
                value={awardNotes}
                onChange={e => setAwardNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setAwardModal(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onSelectQuote(awardModal.comp.id, awardModal.quote.supplierId, awardNotes);
                  setAwardModal(null);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
              >
                Confirm Award
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
