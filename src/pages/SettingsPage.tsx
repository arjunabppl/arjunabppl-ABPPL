import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  Settings, Building, CreditCard, Shield, Save, Check
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, refreshSettings } = useAuth();
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    companyName: settings?.companyName || 'Amrit Board & Paper Pvt. Ltd.',
    gstin: settings?.gstin || '27AABCA1234F1Z8',
    pan: settings?.pan || 'AABCA1234F',
    address: settings?.address || '102, Bhiwandi Paper Market, Thane',
    city: settings?.city || 'Mumbai',
    state: settings?.state || 'Maharashtra',
    phone: settings?.phone || '+91 98200 11223',
    email: settings?.email || 'accounts@amritpaper.com',
    bankName: settings?.bankName || 'HDFC Bank Ltd.',
    accountNo: settings?.accountNo || '50200012345678',
    ifscCode: settings?.ifscCode || 'HDFC0000123',
    termsAndConditions: settings?.termsAndConditions || '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if bill is not paid within due date.\n3. Subject to Mumbai Jurisdiction.'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(formData);
      await refreshSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Admin & Business Settings</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure company legal info, GSTIN, bank details for invoice printing and default terms
          </p>
        </div>

        {saved && (
          <div className="flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-300">
            <Check className="w-4 h-4" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
        
        {/* Section 1: Firm Master */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 text-slate-900 font-extrabold text-sm">
            <Building className="w-4 h-4 text-emerald-600" />
            <h2>Firm Identity & Legal Master</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Company Trade Name</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">GSTIN Number</label>
              <input
                type="text"
                required
                value={formData.gstin}
                onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Phone / Mobile</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Registered Address</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-3 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Section 2: Banking Master */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 text-slate-900 font-extrabold text-sm">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h2>Bank Account Details (Printed on Invoices)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Account Number</label>
              <input
                type="text"
                value={formData.accountNo}
                onChange={e => setFormData({ ...formData, accountNo: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">IFSC Code</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={e => setFormData({ ...formData, ifscCode: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Terms & Conditions */}
        <div className="space-y-2">
          <label className="font-semibold text-slate-700 block">Default Invoice Terms & Conditions</label>
          <textarea
            rows={3}
            value={formData.termsAndConditions}
            onChange={e => setFormData({ ...formData, termsAndConditions: e.target.value })}
            className="w-full border border-slate-300 rounded-lg p-3 text-xs font-sans focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-lg transition shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Company Settings</span>
          </button>
        </div>

      </form>

    </div>
  );
};
