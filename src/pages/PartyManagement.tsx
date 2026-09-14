import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Party, PartyType, LedgerEntry } from '../types/index.js';
import {
  Users, Plus, Search, Filter, Edit, Trash2, Eye, Building,
  Phone, Mail, MapPin, CreditCard, RefreshCw, FileText, CheckCircle,
  XCircle, ArrowUpRight, ArrowDownRight, AlertTriangle
} from 'lucide-react';

export const PartyManagement: React.FC = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [formData, setFormData] = useState<Partial<Party>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Ledger Modal State
  const [showLedgerModal, setShowLedgerModal] = useState<boolean>(false);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState<boolean>(false);
  const [ledgerParty, setLedgerParty] = useState<Party | null>(null);

  // Delete Confirmation Modal State
  const [deletePartyId, setDeletePartyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const loadParties = async () => {
    setLoading(true);
    try {
      const data = await api.getParties();
      setParties(data);
    } catch (err: any) {
      console.error('Error loading parties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, []);

  const handleOpenCreate = () => {
    setSelectedParty(null);
    setFormData({
      partyType: 'CUSTOMER',
      name: '',
      companyName: '',
      contactPerson: '',
      phone: '',
      altPhone: '',
      email: '',
      address: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      gstin: '',
      pan: '',
      creditLimit: 500000,
      openingBalance: 0,
      balanceType: 'RECEIVABLE',
      paymentTerms: 'Net 30 Days',
      bankName: '',
      bankAccountNo: '',
      bankIfsc: '',
      bankBranch: '',
      notes: '',
      status: 'ACTIVE'
    });
    setFormError('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (party: Party) => {
    setSelectedParty(party);
    setFormData({ ...party });
    setFormError('');
    setShowFormModal(true);
  };

  const handleSaveParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.phone) {
      setFormError('Company Name and Phone number are required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (selectedParty) {
        await api.updateParty(selectedParty.id, formData);
      } else {
        await api.createParty(formData);
      }
      setShowFormModal(false);
      loadParties();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save party record');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletePartyId) return;
    setDeleting(true);
    try {
      await api.deleteParty(deletePartyId);
      setDeletePartyId(null);
      loadParties();
    } catch (err: any) {
      alert(err.message || 'Failed to delete party');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewLedger = async (party: Party) => {
    setLedgerParty(party);
    setShowLedgerModal(true);
    setLedgerLoading(true);
    try {
      const data = await api.getPartyLedger(party.id);
      setLedgerEntries(data);
    } catch (err: any) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const filteredParties = (parties || []).filter(party => {
    const matchesFilter = filterType === 'ALL' || party.partyType === filterType || party.partyType === 'BOTH';
    const q = (searchQuery || '').toLowerCase();
    const matchesQuery = !q ||
      (party.companyName || '').toLowerCase().includes(q) ||
      (party.name || '').toLowerCase().includes(q) ||
      (party.phone && party.phone.includes(q)) ||
      (party.gstin && (party.gstin || '').toLowerCase().includes(q)) ||
      (party.city || '').toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Building className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Party Management & Accounting Ledgers</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage Paper Wholesaler Customers, Mill Suppliers, GSTIN details, credit limits, and step-by-step financial ledgers.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Party</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search party by Company, Contact Name, GSTIN, Phone, City..."
            className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Type Filter */}
        <div className="md:col-span-4 flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          {['ALL', 'CUSTOMER', 'SUPPLIER', 'BOTH'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition ${
                filterType === type ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <div className="md:col-span-2 flex justify-end">
          <button
            onClick={loadParties}
            className="w-full flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Parties Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading Party directory...</span>
          </div>
        ) : filteredParties.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <Building className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">No parties found</p>
            <p className="text-[11px]">Try adjusting your search query or filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Party & Company</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">GSTIN & Terms</th>
                  <th className="py-3 px-4 text-right">Outstanding Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredParties.map((party) => {
                  const isCustomer = party.partyType === 'CUSTOMER' || party.partyType === 'BOTH';
                  return (
                    <tr key={party.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Name & Company */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{party.companyName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>Contact: {party.contactPerson || party.name}</span>
                        </div>
                      </td>

                      {/* Party Type Tag */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                          party.partyType === 'CUSTOMER'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : party.partyType === 'SUPPLIER'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {party.partyType}
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="flex items-center space-x-1 text-slate-800 font-medium">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{party.phone}</span>
                        </div>
                        {party.email && (
                          <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{party.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{party.city}, {party.state}</span>
                        </div>
                      </td>

                      {/* GSTIN & Credit Terms */}
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="font-mono text-[11px] text-slate-800 font-semibold">
                          {party.gstin || 'NO GSTIN'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Terms: <span className="font-medium text-slate-700">{party.paymentTerms}</span>
                        </div>
                      </td>

                      {/* Outstanding Balance */}
                      <td className="py-3 px-4 text-right">
                        <div className={`font-black text-sm ${
                          party.outstandingBalance > 0
                            ? (isCustomer ? 'text-rose-600' : 'text-amber-600')
                            : 'text-emerald-600'
                        }`}>
                          ₹{party.outstandingBalance.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          {isCustomer ? 'Receivable' : 'Payable'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          party.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {party.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{party.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* View Ledger */}
                          <button
                            onClick={() => handleViewLedger(party)}
                            className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded-lg transition"
                            title="View Account Ledger"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Edit Party */}
                          <button
                            onClick={() => handleOpenEdit(party)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-lg transition"
                            title="Edit Party Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Party */}
                          <button
                            onClick={() => setDeletePartyId(party.id)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 rounded-lg transition"
                            title="Delete Party"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT PARTY MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {selectedParty ? 'Edit Party Record' : 'Create New Party'}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveParty} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Party Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Party Type *
                  </label>
                  <select
                    value={formData.partyType || 'CUSTOMER'}
                    onChange={(e) => setFormData({ ...formData, partyType: e.target.value as PartyType })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="CUSTOMER">Customer (Buyer)</option>
                    <option value="SUPPLIER">Supplier (Mill / Vendor)</option>
                    <option value="BOTH">Both (Customer & Supplier)</option>
                  </select>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value, name: e.target.value })}
                    placeholder="e.g. Apex Printpack Pvt Ltd"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Anil Gupta"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98200 12345"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="billing@company.com"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* GSTIN */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={formData.gstin || ''}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="27AABCA1234F1Z1"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Billing & Plant Address
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Unit No., Industrial Area, Road Name"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Payment Credit Terms
                  </label>
                  <select
                    value={formData.paymentTerms || 'Net 30 Days'}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Advance">Advance / Immediate Cash</option>
                    <option value="Net 7 Days">Net 7 Days</option>
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 30 Days">Net 30 Days</option>
                    <option value="Net 45 Days">Net 45 Days</option>
                    <option value="Net 60 Days">Net 60 Days</option>
                  </select>
                </div>

                {/* Credit Limit */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Credit Limit Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.creditLimit || 0}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Opening Balance */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.openingBalance || 0}
                    onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status || 'ACTIVE'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE / BLOCKED</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {saving ? 'Saving Record...' : 'Save Party Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACCOUNT LEDGER STATEMENT MODAL */}
      {showLedgerModal && ledgerParty && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 space-y-4 my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">{ledgerParty.companyName}</h2>
                <p className="text-xs text-slate-500">
                  Statement of Account Ledger • GSTIN: <span className="font-mono text-slate-800 font-bold">{ledgerParty.gstin || 'N/A'}</span>
                </p>
              </div>
              <button
                onClick={() => setShowLedgerModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Ledger Table Container */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              {ledgerLoading ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  Calculating step-by-step running ledger balances...
                </div>
              ) : ledgerEntries.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No ledger entries found for this party.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white text-[11px] font-bold uppercase">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Ref No</th>
                      <th className="py-2.5 px-3">Particulars / Description</th>
                      <th className="py-2.5 px-3 text-right">Debit (Dr)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Cr)</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {ledgerEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 font-medium">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{entry.date}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-900">{entry.referenceNo}</td>
                        <td className="py-2.5 px-3 text-slate-700">{entry.description}</td>
                        <td className="py-2.5 px-3 text-right text-rose-600 font-semibold">
                          {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                          {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          ₹{entry.runningBalance.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
              <div className="text-slate-500 font-semibold">
                Closing Outstanding Balance: <span className="text-emerald-700 font-black text-sm">₹{ledgerParty.outstandingBalance.toLocaleString('en-IN')}</span>
              </div>
              <button
                onClick={() => setShowLedgerModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Close Statement
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletePartyId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Confirm Party Deletion</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete this party? If this party has linked invoices or purchases, it will be safely deactivated to preserve accounting records.
            </p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setDeletePartyId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Party'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
