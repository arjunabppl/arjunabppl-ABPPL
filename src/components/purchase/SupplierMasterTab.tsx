import React, { useState } from 'react';
import { Supplier } from '../../types/index.js';
import { formatCurrency } from '../../utils/paperMath.js';
import {
  Building2, Plus, Search, Globe, Phone, Mail, FileText, CheckCircle2,
  ShieldCheck, MapPin, CreditCard, Award, ExternalLink, Trash2, Edit2
} from 'lucide-react';

interface SupplierMasterTabProps {
  suppliers: Supplier[];
  onSaveSupplier: (supplier: Partial<Supplier>) => Promise<void>;
  currentUserRole?: string;
}

export const SupplierMasterTab: React.FC<SupplierMasterTabProps> = ({
  suppliers = [],
  onSaveSupplier,
  currentUserRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [supplierType, setSupplierType] = useState<'DOMESTIC_MILL' | 'INTERNATIONAL_MILL' | 'IMPORTER_TRADER' | 'CONVERTER'>('DOMESTIC_MILL');
  const [country, setCountry] = useState('India');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [gstin, setGstin] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [paymentTerms, setPaymentTerms] = useState('30 Days Credit');
  const [portOfLoading, setPortOfLoading] = useState('');
  const [incoterms, setIncoterms] = useState('FOR Destination');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscOrSwift, setIfscOrSwift] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [paperGradesSupplied, setPaperGradesSupplied] = useState('Copier Paper, Printing Paper');

  const filtered = (suppliers || []).filter(s => {
    if (countryFilter !== 'ALL') {
      const sCountry = (s.country || 'India').toLowerCase();
      if (countryFilter === 'INDIA' && sCountry !== 'india') return false;
      if (countryFilter === 'INTERNATIONAL' && sCountry === 'india') return false;
    }
    const q = (searchTerm || '').toLowerCase();
    if (q) {
      return (
        (s.companyName || '').toLowerCase().includes(q) ||
        (s.contactPerson || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.gstin && (s.gstin || '').toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setCompanyName('');
    setSupplierType('DOMESTIC_MILL');
    setCountry('India');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setGstin('');
    setCurrency('INR');
    setPaymentTerms('30 Days Credit');
    setPortOfLoading('');
    setIncoterms('FOR Destination');
    setBankName('HDFC Bank');
    setAccountNumber('');
    setIfscOrSwift('HDFC0001234');
    setLeadTimeDays(7);
    setPaperGradesSupplied('Copier Paper, Printing Paper');
    setShowModal(true);
  };

  const handleEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setCompanyName(s.companyName);
    setSupplierType(s.supplierType || 'DOMESTIC_MILL');
    setCountry(s.country || 'India');
    setContactPerson(s.contactPerson);
    setEmail(s.email);
    setPhone(s.phone);
    setAddress(s.address);
    setCity(s.city);
    setGstin(s.gstin || '');
    setCurrency(s.currency || 'INR');
    setPaymentTerms(s.paymentTerms);
    setPortOfLoading(s.portOfLoading || '');
    setIncoterms(s.incoterms || 'FOR Destination');
    setBankName(s.bankName || '');
    setAccountNumber(s.accountNumber || '');
    setIfscOrSwift(s.ifscOrSwift || '');
    setLeadTimeDays(s.leadTimeDays || 7);
    setPaperGradesSupplied(s.paperGradesSupplied ? s.paperGradesSupplied.join(', ') : '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSupplier({
      id: editingSupplier?.id,
      companyName,
      supplierType,
      country,
      contactPerson,
      email,
      phone,
      address,
      city,
      gstin,
      currency,
      paymentTerms,
      portOfLoading,
      incoterms,
      bankName,
      accountNumber,
      ifscOrSwift,
      leadTimeDays,
      paperGradesSupplied: paperGradesSupplied.split(',').map(s => s.trim()).filter(Boolean),
      status: 'ACTIVE'
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-4" id="supplier-master-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Supplier Master & Mill Directory</h3>
            <p className="text-xs text-slate-400">
              Manage domestic paper mills and global import manufacturers, banking details, incoterms, and certifications
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier / Mill</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Supplier Name, Contact Person, City, or GSTIN..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Origin:</span>
          <select
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Origins</option>
            <option value="INDIA">Domestic (India)</option>
            <option value="INTERNATIONAL">International Import Mills</option>
          </select>
        </div>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const isImport = (s.country || 'India').toLowerCase() !== 'india';
          return (
            <div
              key={s.id}
              className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-600 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{s.companyName}</h4>
                    <div className="flex items-center space-x-1.5 text-slate-400 text-xs mt-0.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span>{s.city}, {s.country}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isImport ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {isImport ? `IMPORT (${s.currency})` : 'DOMESTIC'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-700/40">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contact:</span>
                    <span className="font-medium text-slate-200">{s.contactPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-slate-200">{s.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="text-slate-200">{s.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">GST / Tax ID:</span>
                    <span className="font-mono text-slate-200">{s.gstin || 'N/A (Overseas)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Terms:</span>
                    <span className="text-amber-400 font-semibold">{s.paymentTerms}</span>
                  </div>
                  {isImport && s.portOfLoading && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Port of Loading:</span>
                      <span className="text-blue-400 font-medium">{s.portOfLoading} ({s.incoterms})</span>
                    </div>
                  )}
                </div>

                {s.paperGradesSupplied && s.paperGradesSupplied.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.paperGradesSupplied.map((g, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-slate-700/60 text-slate-300 rounded text-[10px]">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  Lead Time: <strong className="text-slate-200">{s.leadTimeDays || 7} Days</strong>
                </div>

                <button
                  onClick={() => handleEdit(s)}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-medium flex items-center space-x-1 transition"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add / Edit Supplier */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {editingSupplier ? 'Edit Supplier Profile' : 'Add New Paper Mill / Supplier'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Company / Mill Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supplier Type</label>
                  <select
                    value={supplierType}
                    onChange={e => setSupplierType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="DOMESTIC_MILL">Domestic Paper Mill (India)</option>
                    <option value="INTERNATIONAL_MILL">International Mill / Manufacturer</option>
                    <option value="IMPORTER_TRADER">Importer / Master Trader</option>
                    <option value="CONVERTER">Paper Converter / Slitter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={e => {
                      setCountry(e.target.value);
                      if (e.target.value.toLowerCase() !== 'india') {
                        setCurrency('USD');
                        setIncoterms('FOB');
                      } else {
                        setCurrency('INR');
                        setIncoterms('FOR Destination');
                      }
                    }}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="AED">AED</option>
                    <option value="SGD">SGD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GSTIN / VAT #</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={e => setGstin(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Port of Loading (For Imports)</label>
                  <input
                    type="text"
                    placeholder="e.g. Kotka, Helsinki, Shanghai"
                    value={portOfLoading}
                    onChange={e => setPortOfLoading(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Incoterms</label>
                  <select
                    value={incoterms}
                    onChange={e => setIncoterms(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    <option value="FOR Destination">FOR Destination</option>
                    <option value="Ex-Mill">Ex-Mill</option>
                    <option value="FOB">FOB (Free on Board)</option>
                    <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                    <option value="CFR">CFR (Cost & Freight)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Account / IBAN Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">IFSC / SWIFT Code</label>
                  <input
                    type="text"
                    value={ifscOrSwift}
                    onChange={e => setIfscOrSwift(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Paper Grades Supplied (comma-separated)</label>
                <input
                  type="text"
                  value={paperGradesSupplied}
                  onChange={e => setPaperGradesSupplied(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                />
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                >
                  {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
