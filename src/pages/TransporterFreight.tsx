import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Transporter, FreightRecord, FreightRateType, GtaGstScheme, FreightPaidBy } from '../types/index.js';
import {
  Navigation, Plus, Search, Edit, Trash2, Truck, FileText,
  DollarSign, CheckCircle, Clock, AlertTriangle, ShieldCheck,
  FileSpreadsheet, Printer, Eye, X, Check, Calculator, MapPin,
  ArrowRight, UserCheck, Phone, Hash, Calendar, Layers, CheckCircle2
} from 'lucide-react';
import { exportToPdf, exportToExcel, ColumnDefinition, SummaryStat } from '../utils/exportUtils.js';

export const TransporterFreight: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'freight' | 'transporters'>('freight');
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [freights, setFreights] = useState<FreightRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Transporter Modal
  const [showTrModal, setShowTrModal] = useState<boolean>(false);
  const [selectedTr, setSelectedTr] = useState<Transporter | null>(null);
  const [trForm, setTrForm] = useState<Partial<Transporter>>({});
  const [savingTr, setSavingTr] = useState<boolean>(false);

  // Freight Bill Modal
  const [showFrModal, setShowFrModal] = useState<boolean>(false);
  const [editingFr, setEditingFr] = useState<FreightRecord | null>(null);
  const [frForm, setFrForm] = useState<Partial<FreightRecord>>({});
  const [savingFr, setSavingFr] = useState<boolean>(false);

  // View / Print Voucher Modal
  const [viewingBilty, setViewingBilty] = useState<FreightRecord | null>(null);

  // Delete Confirmation Modal
  const [deleteId, setDeleteId] = useState<{ type: 'transporter' | 'freight'; id: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trList, frList] = await Promise.all([
        api.getTransporters(),
        api.getFreights()
      ]);
      setTransporters(trList || []);
      setFreights(frList || []);
    } catch (err: any) {
      console.error('Error loading transporters or freight:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Transporter handlers
  const handleOpenCreateTr = () => {
    setSelectedTr(null);
    setTrForm({
      name: '',
      companyName: '',
      contactPerson: '',
      phone: '',
      address: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      gstin: '',
      vehicleNumber: '',
      freightTerms: 'To Pay',
      status: 'ACTIVE'
    });
    setShowTrModal(true);
  };

  const handleOpenEditTr = (tr: Transporter) => {
    setSelectedTr(tr);
    setTrForm({ ...tr });
    setShowTrModal(true);
  };

  const handleSaveTr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trForm.companyName || !trForm.phone) return;
    setSavingTr(true);
    try {
      if (selectedTr) {
        await api.updateTransporter(selectedTr.id, trForm);
      } else {
        await api.createTransporter(trForm);
      }
      setShowTrModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save transporter');
    } finally {
      setSavingTr(false);
    }
  };

  // Freight Bill Calculations
  const calculateFreightTotals = (f: Partial<FreightRecord>) => {
    const weightMt = Number(f.weightMt || 0);
    const weightKg = Number(f.weightKg || (weightMt > 0 ? weightMt * 1000 : 0));
    const packagesCount = Number(f.packagesCount || 0);
    const rateType = f.rateType || 'PER_MT';

    let baseFreight = 0;
    if (rateType === 'PER_MT') {
      baseFreight = Number((weightMt * Number(f.ratePerMt || 0)).toFixed(2));
    } else if (rateType === 'PER_KG') {
      baseFreight = Number((weightKg * Number(f.ratePerKg || 0)).toFixed(2));
    } else if (rateType === 'FIXED_DELIVERY') {
      baseFreight = Number(f.fixedTripRate || 0);
    } else if (rateType === 'PER_PACKAGE') {
      baseFreight = Number((packagesCount * Number(f.ratePerPackage || 0)).toFixed(2));
    }

    const loading = Number(f.loadingCharges || 0);
    const unloading = Number(f.unloadingCharges || 0);
    const toll = Number(f.tollCharges || 0);
    const detention = Number(f.detentionCharges || 0);
    const doorDelivery = Number(f.doorDeliveryCharge || 0);
    const ins = Number(f.insuranceCharges || 0);
    const other = Number(f.otherCharges || 0);

    const taxable = baseFreight + loading + unloading + toll + detention + doorDelivery + ins + other;

    const gtaScheme = f.gtaGstScheme || 'RCM_5_PERCENT';
    const isRcm = gtaScheme === 'RCM_5_PERCENT';
    const gstRate = gtaScheme === 'FORWARD_12_PERCENT' ? 12 : (gtaScheme === 'RCM_5_PERCENT' ? 5 : 0);

    let gstAmount = 0;
    if (!isRcm && gstRate > 0) {
      gstAmount = Number(((taxable * gstRate) / 100).toFixed(2));
    }

    const totalFreight = isRcm ? taxable : (taxable + gstAmount);
    const advancePaid = Number(f.advancePaidToDriver || f.paidAmount || 0);
    const dueAmount = Math.max(0, totalFreight - advancePaid);

    return {
      baseFreight,
      taxable,
      gstRate,
      gstAmount,
      isRcm,
      totalFreight,
      dueAmount
    };
  };

  const handleOpenCreateFr = () => {
    setEditingFr(null);
    const defaultTr = transporters[0];
    const initialForm: Partial<FreightRecord> = {
      freightType: 'OUTWARD',
      transporterId: defaultTr?.id || '',
      transporterName: defaultTr?.companyName || 'Self Transport',
      transporterGstin: defaultTr?.gstin || '',
      transporterPhone: defaultTr?.phone || '',
      vehicleNumber: defaultTr?.vehicleNumber || '',
      driverName: '',
      driverPhone: '',
      lrGrNo: `LR-${Math.floor(100000 + Math.random() * 900000)}`,
      lrGrDate: new Date().toISOString().split('T')[0],
      ewayBillNo: '',
      invoiceNo: '',
      deliveryChallanNo: '',
      consignorName: 'ABPPL Central Godown',
      consignorCity: 'Mumbai',
      consigneeName: '',
      consigneeCity: '',
      cargoDescription: 'Paper Reams / Packaging Board',
      weightMt: 12.5,
      weightKg: 12500,
      packagesCount: 250,
      packageType: 'Reams',
      rateType: 'PER_MT',
      ratePerMt: 1200,
      fixedTripRate: 6500,
      ratePerKg: 1.2,
      ratePerPackage: 45,
      loadingCharges: 500,
      unloadingCharges: 500,
      tollCharges: 350,
      detentionCharges: 0,
      doorDeliveryCharge: 0,
      insuranceCharges: 0,
      otherCharges: 0,
      gtaGstScheme: 'RCM_5_PERCENT',
      paidBy: 'BUYER',
      advancePaidToDriver: 2000,
      paymentMode: 'BANK_TRANSFER',
      deliveryStatus: 'DISPATCHED',
      notes: ''
    };

    setFrForm(initialForm);
    setShowFrModal(true);
  };

  const handleOpenEditFr = (fr: FreightRecord) => {
    setEditingFr(fr);
    setFrForm({ ...fr });
    setShowFrModal(true);
  };

  const handleTransporterSelect = (trId: string) => {
    const found = transporters.find(t => t.id === trId);
    if (found) {
      setFrForm(prev => ({
        ...prev,
        transporterId: found.id,
        transporterName: found.companyName,
        transporterGstin: found.gstin || '',
        transporterPhone: found.phone || '',
        vehicleNumber: found.vehicleNumber || prev.vehicleNumber || ''
      }));
    }
  };

  const handleWeightMtChange = (mt: number) => {
    setFrForm(prev => ({
      ...prev,
      weightMt: mt,
      weightKg: Math.round(mt * 1000)
    }));
  };

  const handleWeightKgChange = (kg: number) => {
    setFrForm(prev => ({
      ...prev,
      weightKg: kg,
      weightMt: Number((kg / 1000).toFixed(3))
    }));
  };

  const handleSaveFr = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFr(true);
    try {
      const calc = calculateFreightTotals(frForm);
      const payload: Partial<FreightRecord> = {
        ...frForm,
        baseFreightAmount: calc.baseFreight,
        taxableAmount: calc.taxable,
        gstRate: calc.gstRate,
        gstAmount: calc.gstAmount,
        isRcmApplicable: calc.isRcm,
        freightAmount: calc.totalFreight,
        paidAmount: Number(frForm.advancePaidToDriver || frForm.paidAmount || 0),
        dueAmount: calc.dueAmount
      };

      if (editingFr) {
        await api.updateFreight(editingFr.id, payload);
      } else {
        await api.createFreight(payload);
      }
      setShowFrModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save freight bill record');
    } finally {
      setSavingFr(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      if (deleteId.type === 'transporter') {
        await api.deleteTransporter(deleteId.id);
      } else {
        await api.deleteFreight(deleteId.id);
      }
      setDeleteId(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
    }
  };

  const liveTotals = calculateFreightTotals(frForm);

  const filteredTransporters = (transporters || []).filter(t => {
    const q = (searchQuery || '').toLowerCase();
    return !q || (
      (t.companyName || '').toLowerCase().includes(q) ||
      (t.phone || '').toLowerCase().includes(q) ||
      (t.vehicleNumber || '').toLowerCase().includes(q) ||
      (t.city || '').toLowerCase().includes(q)
    );
  });

  const filteredFreights = (freights || []).filter(f => {
    const q = (searchQuery || '').toLowerCase();
    const matchesQuery = !q || (
      (f.billNo || '').toLowerCase().includes(q) ||
      (f.lrGrNo || '').toLowerCase().includes(q) ||
      (f.vehicleNumber || '').toLowerCase().includes(q) ||
      (f.transporterName || '').toLowerCase().includes(q) ||
      (f.consignorCity || '').toLowerCase().includes(q) ||
      (f.consigneeCity || '').toLowerCase().includes(q) ||
      (f.consigneeName || '').toLowerCase().includes(q) ||
      (f.invoiceNo || '').toLowerCase().includes(q) ||
      (f.ewayBillNo || '').toLowerCase().includes(q)
    );

    const matchesStatus = statusFilter === 'ALL' || f.paymentStatus === statusFilter || f.deliveryStatus === statusFilter;
    return matchesQuery && matchesStatus;
  });

  // Export Freight to PDF
  const handleExportFreightPdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Bill / LR No', dataKey: 'lrDisplay', align: 'left' },
      { header: 'Date', dataKey: 'lrGrDate', align: 'center' },
      { header: 'Type', dataKey: 'freightType', align: 'center' },
      { header: 'Transporter', dataKey: 'transporterName', align: 'left' },
      { header: 'Vehicle No', dataKey: 'vehicleNumber', align: 'left' },
      { header: 'Route', dataKey: 'route', align: 'left' },
      { header: 'Weight (MT)', dataKey: 'weightMt', align: 'right' },
      { header: 'Freight (₹)', dataKey: 'freightFormatted', align: 'right' },
      { header: 'Paid By', dataKey: 'paidBy', align: 'center' },
      { header: 'Status', dataKey: 'paymentStatus', align: 'center' }
    ];

    const data = filteredFreights.map(f => ({
      lrDisplay: `${f.billNo || 'FB'} / ${f.lrGrNo}`,
      lrGrDate: f.lrGrDate,
      freightType: f.freightType,
      transporterName: f.transporterName,
      vehicleNumber: f.vehicleNumber || '-',
      route: `${f.consignorCity || 'Origin'} -> ${f.consigneeCity || 'Dest'}`,
      weightMt: `${f.weightMt || 0} MT`,
      freightFormatted: `₹${(f.freightAmount || 0).toLocaleString('en-IN')}`,
      paidBy: f.paidBy || 'BUYER',
      paymentStatus: f.paymentStatus || 'UNPAID'
    }));

    const totalAmount = filteredFreights.reduce((sum, f) => sum + (f.freightAmount || 0), 0);
    const totalWeight = filteredFreights.reduce((sum, f) => sum + (f.weightMt || 0), 0);

    const summaryStats: SummaryStat[] = [
      { label: 'Total Freight Bills', value: filteredFreights.length },
      { label: 'Total Dispatched Weight', value: `${totalWeight.toFixed(2)} MT` },
      { label: 'Total Freight Amount', value: `₹${totalAmount.toLocaleString('en-IN')}` }
    ];

    exportToPdf({
      title: 'Freight & LR Bills Register',
      subtitle: `Generated on ${new Date().toLocaleDateString('en-IN')}`,
      fileName: `Freight_Register_${new Date().toISOString().split('T')[0]}.pdf`,
      columns,
      data,
      summaryStats
    });
  };

  const handleExportFreightExcel = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Freight Bill No', dataKey: 'billNo' },
      { header: 'LR / GR No', dataKey: 'lrGrNo' },
      { header: 'LR Date', dataKey: 'lrGrDate' },
      { header: 'Type', dataKey: 'freightType' },
      { header: 'Transporter Name', dataKey: 'transporterName' },
      { header: 'Vehicle Number', dataKey: 'vehicleNumber' },
      { header: 'Driver Name', dataKey: 'driverName' },
      { header: 'Driver Phone', dataKey: 'driverPhone' },
      { header: 'E-Way Bill No', dataKey: 'ewayBillNo' },
      { header: 'Origin / Consignor', dataKey: 'consignor' },
      { header: 'Destination / Consignee', dataKey: 'consignee' },
      { header: 'Cargo Description', dataKey: 'cargoDescription' },
      { header: 'Weight (MT)', dataKey: 'weightMt' },
      { header: 'Packages Count', dataKey: 'packagesCount' },
      { header: 'Rate Type', dataKey: 'rateType' },
      { header: 'Total Freight Amount (₹)', dataKey: 'freightAmount' },
      { header: 'Paid Amount (₹)', dataKey: 'paidAmount' },
      { header: 'Due Amount (₹)', dataKey: 'dueAmount' },
      { header: 'Paid By', dataKey: 'paidBy' },
      { header: 'Payment Status', dataKey: 'paymentStatus' },
      { header: 'Delivery Status', dataKey: 'deliveryStatus' }
    ];

    const data = filteredFreights.map(f => ({
      billNo: f.billNo || '',
      lrGrNo: f.lrGrNo,
      lrGrDate: f.lrGrDate,
      freightType: f.freightType,
      transporterName: f.transporterName,
      vehicleNumber: f.vehicleNumber || '',
      driverName: f.driverName || '',
      driverPhone: f.driverPhone || '',
      ewayBillNo: f.ewayBillNo || '',
      consignor: `${f.consignorName || ''} (${f.consignorCity || ''})`,
      consignee: `${f.consigneeName || ''} (${f.consigneeCity || ''})`,
      cargoDescription: f.cargoDescription || '',
      weightMt: f.weightMt || 0,
      packagesCount: f.packagesCount || 0,
      rateType: f.rateType || '',
      freightAmount: f.freightAmount || 0,
      paidAmount: f.paidAmount || 0,
      dueAmount: f.dueAmount || 0,
      paidBy: f.paidBy || '',
      paymentStatus: f.paymentStatus || '',
      deliveryStatus: f.deliveryStatus || ''
    }));

    exportToExcel({
      title: 'ABPPL Logistics Freight Register',
      subtitle: `Exported on ${new Date().toLocaleDateString('en-IN')}`,
      fileName: `Logistics_Freight_Register_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Freight Register',
      columns,
      data
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Logistics & Freight Management</h1>
            <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
              {freights.length} Freight Bills
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete freight billing with LR/GR tracking, MT rate charges, fixed delivery rates, driver advance, and GTA GST
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'freight' ? (
            <button
              onClick={handleOpenCreateFr}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Record Freight Bill / Bilty</span>
            </button>
          ) : (
            <button
              onClick={handleOpenCreateTr}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transporter</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER & TAB BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('freight')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition ${
              activeTab === 'freight' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Freight & LR Bills ({freights.length})
          </button>
          <button
            onClick={() => setActiveTab('transporters')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition ${
              activeTab === 'transporters' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transporters Directory ({transporters.length})
          </button>
        </div>

        {/* Search & Exports */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search LR #, Vehicle #, City..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {activeTab === 'freight' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportFreightPdf}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200"
                title="Export Freight Register to PDF"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handleExportFreightExcel}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition border border-emerald-200"
                title="Export Freight Register to Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition border border-slate-200"
                title="Print Freight Register"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===================== TAB 1: FREIGHT & LR BILLS TABLE ===================== */}
      {activeTab === 'freight' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading logistics & freight bills...</div>
          ) : filteredFreights.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Truck className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No freight bills found</p>
              <p className="text-xs text-slate-500">Record freight bilty charges with weight MT, delivery rate, or trip fixed charges</p>
              <button
                onClick={handleOpenCreateFr}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Record First Freight Bill
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-3 px-4">Bill & LR / GR Details</th>
                    <th className="py-3 px-4">Route & Cargo</th>
                    <th className="py-3 px-4">Transporter & Vehicle</th>
                    <th className="py-3 px-4">Weight / Rate Model</th>
                    <th className="py-3 px-4 text-right">Freight Amount</th>
                    <th className="py-3 px-4 text-center">Paid By / Status</th>
                    <th className="py-3 px-4 text-center">Delivery</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredFreights.map((fr) => (
                    <tr key={fr.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-slate-900 text-xs">{fr.billNo || 'FB-REC'}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                            fr.freightType === 'OUTWARD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {fr.freightType}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                          LR: <span className="font-bold">{fr.lrGrNo}</span> • {fr.lrGrDate}
                        </div>
                        {fr.ewayBillNo && (
                          <div className="text-[10px] font-mono text-slate-400">EWB: {fr.ewayBillNo}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-900 font-bold">
                          <span>{fr.consignorCity || 'Origin'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span>{fr.consigneeCity || 'Destination'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {fr.consigneeName || fr.cargoDescription || 'Paper Shipment'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{fr.transporterName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-bold text-slate-700 text-[11px] bg-slate-100 px-1.5 py-0.2 rounded">
                            {fr.vehicleNumber || 'Vehicle N/A'}
                          </span>
                          {fr.driverName && (
                            <span className="text-[10px] text-slate-500 truncate max-w-[100px]">
                              {fr.driverName}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-extrabold text-slate-900">
                          {fr.weightMt ? `${fr.weightMt} MT` : (fr.weightKg ? `${fr.weightKg} Kg` : `${fr.packagesCount || 0} Pkgs`)}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500">
                          {fr.rateType === 'PER_MT' && `₹${fr.ratePerMt}/MT`}
                          {fr.rateType === 'FIXED_DELIVERY' && `Fixed ₹${fr.fixedTripRate}`}
                          {fr.rateType === 'PER_KG' && `₹${fr.ratePerKg}/Kg`}
                          {fr.rateType === 'PER_PACKAGE' && `₹${fr.ratePerPackage}/Pkg`}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="font-black text-slate-900 text-sm">
                          ₹{(fr.freightAmount || 0).toLocaleString('en-IN')}
                        </div>
                        {fr.dueAmount !== undefined && fr.dueAmount > 0 && (
                          <div className="text-[10px] font-mono text-rose-600 font-bold">
                            Due: ₹{fr.dueAmount.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="text-[10px] font-bold text-slate-600 mb-0.5">
                          By: <span className="font-black text-slate-800">{fr.paidBy || 'BUYER'}</span>
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          fr.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : (fr.paymentStatus === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                        }`}>
                          {fr.paymentStatus || 'UNPAID'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          fr.deliveryStatus === 'DELIVERED' || fr.deliveryStatus === 'POD_RECEIVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {fr.deliveryStatus || 'DISPATCHED'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => setViewingBilty(fr)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          title="View / Print Freight Bilty Voucher"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditFr(fr)}
                          className="p-1.5 bg-slate-100 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                          title="Edit Freight Record"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId({ type: 'freight', id: fr.id })}
                          className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-700 rounded-lg transition"
                          title="Delete Freight Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: TRANSPORTERS DIRECTORY ===================== */}
      {activeTab === 'transporters' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading transporters...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-3 px-4">Transporter Company</th>
                    <th className="py-3 px-4">Contact & Phone</th>
                    <th className="py-3 px-4">Default Vehicle #</th>
                    <th className="py-3 px-4">GSTIN / Tax ID</th>
                    <th className="py-3 px-4">Location / Address</th>
                    <th className="py-3 px-4">Freight Terms</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTransporters.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-black text-slate-900 text-sm">{tr.companyName}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div>{tr.contactPerson || 'Office'}</div>
                        <div className="text-[11px] font-mono text-slate-500">{tr.phone}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{tr.vehicleNumber || 'N/A'}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{tr.gstin || 'Unregistered'}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {tr.city}, {tr.state}
                      </td>
                      <td className="py-3 px-4 font-medium">{tr.freightTerms}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          {tr.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditTr(tr)}
                          className="p-1.5 bg-slate-100 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId({ type: 'transporter', id: tr.id })}
                          className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-700 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================== MODAL: RECORD FREIGHT BILL / BILTY ===================== */}
      {showFrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingFr ? 'Edit Freight Transport Bill' : 'Record New Freight Transport Bill'}
                </h3>
              </div>
              <button
                onClick={() => setShowFrModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveFr} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* SECTION 1: LOGISTICS & DOCUMENT REFERENCES */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>1. LR / GR & Document Reference</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Freight Type *</label>
                    <select
                      value={frForm.freightType || 'OUTWARD'}
                      onChange={(e) => setFrForm({ ...frForm, freightType: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                    >
                      <option value="OUTWARD">OUTWARD (Sales Dispatch to Customer)</option>
                      <option value="INWARD">INWARD (Purchase Inflow from Mill)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">LR / GR Number *</label>
                    <input
                      type="text"
                      required
                      value={frForm.lrGrNo || ''}
                      onChange={(e) => setFrForm({ ...frForm, lrGrNo: e.target.value })}
                      placeholder="e.g. LR-984210"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">LR Date *</label>
                    <input
                      type="date"
                      required
                      value={frForm.lrGrDate || ''}
                      onChange={(e) => setFrForm({ ...frForm, lrGrDate: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">E-Way Bill Number</label>
                    <input
                      type="text"
                      value={frForm.ewayBillNo || ''}
                      onChange={(e) => setFrForm({ ...frForm, ewayBillNo: e.target.value })}
                      placeholder="e.g. 541098234567"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Invoice Reference No</label>
                    <input
                      type="text"
                      value={frForm.invoiceNo || ''}
                      onChange={(e) => setFrForm({ ...frForm, invoiceNo: e.target.value })}
                      placeholder="e.g. INV-2526-0042"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Delivery Challan No</label>
                    <input
                      type="text"
                      value={frForm.deliveryChallanNo || ''}
                      onChange={(e) => setFrForm({ ...frForm, deliveryChallanNo: e.target.value })}
                      placeholder="e.g. DC-2526-0019"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PO / Purchase Ref</label>
                    <input
                      type="text"
                      value={frForm.purchaseNo || ''}
                      onChange={(e) => setFrForm({ ...frForm, purchaseNo: e.target.value })}
                      placeholder="e.g. PO-2526-0012"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: TRANSPORTER, VEHICLE & DRIVER */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>2. Transporter, Vehicle & Driver Information</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Transporter Name *</label>
                    <select
                      value={frForm.transporterId || ''}
                      onChange={(e) => handleTransporterSelect(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none"
                    >
                      {transporters.map(t => (
                        <option key={t.id} value={t.id}>{t.companyName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vehicle Registration # *</label>
                    <input
                      type="text"
                      required
                      value={frForm.vehicleNumber || ''}
                      onChange={(e) => setFrForm({ ...frForm, vehicleNumber: e.target.value.toUpperCase() })}
                      placeholder="e.g. MH-04-GP-8890"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Transporter GSTIN</label>
                    <input
                      type="text"
                      value={frForm.transporterGstin || ''}
                      onChange={(e) => setFrForm({ ...frForm, transporterGstin: e.target.value })}
                      placeholder="27AABCT8890C1Z5"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Driver Name</label>
                    <input
                      type="text"
                      value={frForm.driverName || ''}
                      onChange={(e) => setFrForm({ ...frForm, driverName: e.target.value })}
                      placeholder="e.g. Ramesh Yadav"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Driver Mobile Number</label>
                    <input
                      type="text"
                      value={frForm.driverPhone || ''}
                      onChange={(e) => setFrForm({ ...frForm, driverPhone: e.target.value })}
                      placeholder="e.g. +91 98201 55432"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: ROUTE & SHIPMENT DETAILS */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>3. Origin, Destination & Cargo Quantity</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Consignor / Origin</label>
                    <input
                      type="text"
                      value={frForm.consignorName || ''}
                      onChange={(e) => setFrForm({ ...frForm, consignorName: e.target.value })}
                      placeholder="ABPPL Central Godown"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Origin City *</label>
                    <input
                      type="text"
                      required
                      value={frForm.consignorCity || ''}
                      onChange={(e) => setFrForm({ ...frForm, consignorCity: e.target.value })}
                      placeholder="Mumbai / Bhiwandi"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Consignee / Customer</label>
                    <input
                      type="text"
                      value={frForm.consigneeName || ''}
                      onChange={(e) => setFrForm({ ...frForm, consigneeName: e.target.value })}
                      placeholder="Apex Packaging / Mill Godown"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Destination City *</label>
                    <input
                      type="text"
                      required
                      value={frForm.consigneeCity || ''}
                      onChange={(e) => setFrForm({ ...frForm, consigneeCity: e.target.value })}
                      placeholder="Pune / Ahmedabad"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cargo Description</label>
                    <input
                      type="text"
                      value={frForm.cargoDescription || ''}
                      onChange={(e) => setFrForm({ ...frForm, cargoDescription: e.target.value })}
                      placeholder="120 GSM Kraft Paper / Duplex Boards"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Weight in Metric Tons (MT)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={frForm.weightMt ?? ''}
                      onChange={(e) => handleWeightMtChange(Number(e.target.value))}
                      placeholder="12.5"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Weight in Kilograms (Kg)</label>
                    <input
                      type="number"
                      value={frForm.weightKg ?? ''}
                      onChange={(e) => handleWeightKgChange(Number(e.target.value))}
                      placeholder="12500"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Packages Count & Unit</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        value={frForm.packagesCount || ''}
                        onChange={(e) => setFrForm({ ...frForm, packagesCount: Number(e.target.value) })}
                        placeholder="250"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none"
                      />
                      <select
                        value={frForm.packageType || 'Reams'}
                        onChange={(e) => setFrForm({ ...frForm, packageType: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                      >
                        <option value="Reams">Reams</option>
                        <option value="Rolls">Rolls / Reels</option>
                        <option value="Bundles">Bundles</option>
                        <option value="Pallets">Pallets</option>
                        <option value="Boxes">Boxes</option>
                        <option value="Loose Sheets">Loose Sheets</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: FREIGHT CHARGES & RATE MODEL */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>4. Freight Rate Calculation Model & Surcharges</span>
                </h4>

                {/* RATE TYPE SELECTOR */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Rate Charging Model *</label>
                    <select
                      value={frForm.rateType || 'PER_MT'}
                      onChange={(e) => setFrForm({ ...frForm, rateType: e.target.value as FreightRateType })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="PER_MT">Rate per Metric Ton (₹/MT)</option>
                      <option value="FIXED_DELIVERY">Fixed Delivery Rate (Flat Trip)</option>
                      <option value="PER_KG">Rate per Kilogram (₹/Kg)</option>
                      <option value="PER_PACKAGE">Rate per Package / Ream (₹/Pkg)</option>
                    </select>
                  </div>

                  {frForm.rateType === 'PER_MT' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Rate per MT (₹) *</label>
                      <input
                        type="number"
                        required
                        value={frForm.ratePerMt || ''}
                        onChange={(e) => setFrForm({ ...frForm, ratePerMt: Number(e.target.value) })}
                        placeholder="1200"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-emerald-700 focus:outline-none"
                      />
                    </div>
                  )}

                  {frForm.rateType === 'FIXED_DELIVERY' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Fixed Trip / Delivery Charge (₹) *</label>
                      <input
                        type="number"
                        required
                        value={frForm.fixedTripRate || ''}
                        onChange={(e) => setFrForm({ ...frForm, fixedTripRate: Number(e.target.value) })}
                        placeholder="6500"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-emerald-700 focus:outline-none"
                      />
                    </div>
                  )}

                  {frForm.rateType === 'PER_KG' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Rate per Kg (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={frForm.ratePerKg || ''}
                        onChange={(e) => setFrForm({ ...frForm, ratePerKg: Number(e.target.value) })}
                        placeholder="1.20"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-emerald-700 focus:outline-none"
                      />
                    </div>
                  )}

                  {frForm.rateType === 'PER_PACKAGE' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Rate per Ream / Package (₹) *</label>
                      <input
                        type="number"
                        required
                        value={frForm.ratePerPackage || ''}
                        onChange={(e) => setFrForm({ ...frForm, ratePerPackage: Number(e.target.value) })}
                        placeholder="45"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-emerald-700 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GTA GST Scheme *</label>
                    <select
                      value={frForm.gtaGstScheme || 'RCM_5_PERCENT'}
                      onChange={(e) => setFrForm({ ...frForm, gtaGstScheme: e.target.value as GtaGstScheme })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:outline-none"
                    >
                      <option value="RCM_5_PERCENT">5% GST - Reverse Charge (RCM by Recipient)</option>
                      <option value="FORWARD_12_PERCENT">12% GST - Forward Charge (Transporter Pays)</option>
                      <option value="EXEMPT">Exempt / Nil GST</option>
                    </select>
                  </div>
                </div>

                {/* Surcharges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Loading Charges (₹)</label>
                    <input
                      type="number"
                      value={frForm.loadingCharges || 0}
                      onChange={(e) => setFrForm({ ...frForm, loadingCharges: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Unloading Charges (₹)</label>
                    <input
                      type="number"
                      value={frForm.unloadingCharges || 0}
                      onChange={(e) => setFrForm({ ...frForm, unloadingCharges: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Toll / Border Tax (₹)</label>
                    <input
                      type="number"
                      value={frForm.tollCharges || 0}
                      onChange={(e) => setFrForm({ ...frForm, tollCharges: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Detention / Door Del (₹)</label>
                    <input
                      type="number"
                      value={frForm.detentionCharges || 0}
                      onChange={(e) => setFrForm({ ...frForm, detentionCharges: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* LIVE FREIGHT CALCULATION BOX */}
                <div className="p-4 bg-slate-900 text-white rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Base Freight</div>
                    <div className="text-lg font-black font-mono text-slate-100 mt-0.5">
                      ₹{liveTotals.baseFreight.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Taxable Subtotal</div>
                    <div className="text-lg font-black font-mono text-slate-100 mt-0.5">
                      ₹{liveTotals.taxable.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      GST ({liveTotals.gstRate}%) {liveTotals.isRcm ? '(RCM)' : ''}
                    </div>
                    <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                      {liveTotals.isRcm ? '₹0 (RCM)' : `₹${liveTotals.gstAmount.toLocaleString('en-IN')}`}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase font-bold text-emerald-400">Total Freight Payable</div>
                    <div className="text-xl font-black font-mono text-emerald-300 mt-0.5">
                      ₹{liveTotals.totalFreight.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: PAYMENT & SETTLEMENT */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>5. Payment, Driver Advance & POD Status</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Freight Paid By *</label>
                    <select
                      value={frForm.paidBy || 'BUYER'}
                      onChange={(e) => setFrForm({ ...frForm, paidBy: e.target.value as FreightPaidBy })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                    >
                      <option value="BUYER">BUYER (To Pay by Customer)</option>
                      <option value="SELLER">SELLER (Paid / Added in Invoice)</option>
                      <option value="SELF">SELF (Wholesaler Company)</option>
                      <option value="SUPPLIER">SUPPLIER (Mill Paid)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Advance Paid to Driver (₹)</label>
                    <input
                      type="number"
                      value={frForm.advancePaidToDriver ?? frForm.paidAmount ?? 0}
                      onChange={(e) => setFrForm({ ...frForm, advancePaidToDriver: Number(e.target.value), paidAmount: Number(e.target.value) })}
                      placeholder="2000"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                    <select
                      value={frForm.paymentMode || 'BANK_TRANSFER'}
                      onChange={(e) => setFrForm({ ...frForm, paymentMode: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                      <option value="UPI">UPI / Fastag</option>
                      <option value="CASH">Cash Advance</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="LEDGER_CREDIT">Transporter Ledger Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Delivery Status</label>
                    <select
                      value={frForm.deliveryStatus || 'DISPATCHED'}
                      onChange={(e) => setFrForm({ ...frForm, deliveryStatus: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                    >
                      <option value="DISPATCHED">DISPATCHED</option>
                      <option value="IN_TRANSIT">IN TRANSIT</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="POD_RECEIVED">POD RECEIVED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">POD Document / Ack No</label>
                    <input
                      type="text"
                      value={frForm.podDocumentNo || ''}
                      onChange={(e) => setFrForm({ ...frForm, podDocumentNo: e.target.value })}
                      placeholder="e.g. POD-ACK-8841"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Special Delivery Remarks / Instructions</label>
                    <input
                      type="text"
                      value={frForm.notes || ''}
                      onChange={(e) => setFrForm({ ...frForm, notes: e.target.value })}
                      placeholder="Ensure tarpaulin cover against rain; call before delivery"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFrModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFr}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingFr ? 'Saving...' : 'Save Freight Bill'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: VIEW / PRINT BILTY VOUCHER ===================== */}
      {viewingBilty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Consignment Note & Freight Bilty Voucher
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={() => setViewingBilty(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
              {/* VOUCHER HEADER */}
              <div className="border-b-2 border-slate-900 pb-4 text-center">
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  AMBICA BOARD & PAPER PRODUCTS PVT. LTD.
                </h2>
                <p className="text-[11px] text-slate-600">
                  Central Godown, 45 Paper Traders Complex, Kalbadevi Road, Mumbai - 400002
                </p>
                <p className="text-[10px] font-mono text-slate-500">
                  GSTIN: 27AABCA1234F1Z5 | Phone: +91 22 2345 6789
                </p>
                <div className="mt-2 inline-block bg-slate-900 text-white text-[11px] font-mono font-extrabold px-3 py-0.5 rounded">
                  LORRY RECEIPT / FREIGHT CONSIGNMENT NOTE
                </div>
              </div>

              {/* VOUCHER DETAILS GRID */}
              <div className="grid grid-cols-2 gap-4 border border-slate-200 p-4 rounded-xl">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Bill & LR Number</div>
                  <div className="font-mono font-black text-slate-900 text-sm">
                    {viewingBilty.billNo || 'FB-REC'} / {viewingBilty.lrGrNo}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">Date: {viewingBilty.lrGrDate}</div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Vehicle & E-Way Bill</div>
                  <div className="font-mono font-black text-slate-900 text-sm">
                    {viewingBilty.vehicleNumber || 'N/A'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">EWB: {viewingBilty.ewayBillNo || 'N/A'}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Consignor (From)</div>
                  <div className="font-bold text-slate-900">{viewingBilty.consignorName || 'ABPPL Godown'}</div>
                  <div className="text-slate-600">{viewingBilty.consignorCity || 'Mumbai'}</div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Consignee (To)</div>
                  <div className="font-bold text-slate-900">{viewingBilty.consigneeName || 'Direct Customer'}</div>
                  <div className="text-slate-600">{viewingBilty.consigneeCity || 'Destination City'}</div>
                </div>
              </div>

              {/* TRANSPORTER & DRIVER */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-600">Transporter:</span>{' '}
                  <span className="font-bold text-slate-900">{viewingBilty.transporterName}</span>
                  {viewingBilty.transporterGstin && (
                    <div className="text-[10px] font-mono text-slate-500">GST: {viewingBilty.transporterGstin}</div>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-600">Driver:</span>{' '}
                  <span className="font-bold text-slate-900">{viewingBilty.driverName || 'Driver N/A'}</span>
                  {viewingBilty.driverPhone && (
                    <div className="text-[10px] font-mono text-slate-500">Ph: {viewingBilty.driverPhone}</div>
                  )}
                </div>
              </div>

              {/* CHARGES BREAKDOWN TABLE */}
              <table className="w-full border-collapse border border-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-center">Qty / Weight</th>
                    <th className="p-2 text-center">Rate Specification</th>
                    <th className="p-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="p-2">
                      <div className="font-bold text-slate-900">{viewingBilty.cargoDescription || 'Paper Consignment'}</div>
                      <div className="text-[10px] text-slate-500">{viewingBilty.packageType || 'Reams'}</div>
                    </td>
                    <td className="p-2 text-center font-mono font-bold">
                      {viewingBilty.weightMt ? `${viewingBilty.weightMt} MT` : `${viewingBilty.weightKg || 0} Kg`}
                    </td>
                    <td className="p-2 text-center font-mono">
                      {viewingBilty.rateType === 'PER_MT' && `₹${viewingBilty.ratePerMt}/MT`}
                      {viewingBilty.rateType === 'FIXED_DELIVERY' && `Fixed Trip`}
                      {viewingBilty.rateType === 'PER_KG' && `₹${viewingBilty.ratePerKg}/Kg`}
                      {viewingBilty.rateType === 'PER_PACKAGE' && `₹${viewingBilty.ratePerPackage}/Pkg`}
                    </td>
                    <td className="p-2 text-right font-mono font-bold">
                      ₹{(viewingBilty.baseFreightAmount || viewingBilty.freightAmount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  {(viewingBilty.loadingCharges || 0) > 0 && (
                    <tr>
                      <td colSpan={3} className="p-2 text-slate-600">Loading / Origin Hamali</td>
                      <td className="p-2 text-right font-mono">₹{viewingBilty.loadingCharges?.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                  {(viewingBilty.unloadingCharges || 0) > 0 && (
                    <tr>
                      <td colSpan={3} className="p-2 text-slate-600">Unloading / Destination Hamali</td>
                      <td className="p-2 text-right font-mono">₹{viewingBilty.unloadingCharges?.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                  {(viewingBilty.tollCharges || 0) > 0 && (
                    <tr>
                      <td colSpan={3} className="p-2 text-slate-600">Toll & Border Entry Charges</td>
                      <td className="p-2 text-right font-mono">₹{viewingBilty.tollCharges?.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-black text-slate-900 text-sm">
                    <td colSpan={3} className="p-2.5">Total Freight Charge (Paid by {viewingBilty.paidBy || 'BUYER'})</td>
                    <td className="p-2.5 text-right font-mono text-emerald-700">
                      ₹{(viewingBilty.freightAmount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* ADVANCE & BALANCE */}
              <div className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-200 rounded-xl font-bold">
                <div>
                  <span className="text-slate-600">Advance Paid to Driver:</span>{' '}
                  <span className="font-mono text-slate-900">₹{(viewingBilty.paidAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-600">Balance Due Amount:</span>{' '}
                  <span className="font-mono text-rose-700 font-black">₹{(viewingBilty.dueAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* SIGNATURE BOXES */}
              <div className="grid grid-cols-3 gap-4 pt-8 text-center text-[10px] text-slate-500 font-bold border-t border-slate-200">
                <div>
                  <div className="border-b border-dashed border-slate-300 pb-8"></div>
                  <div className="mt-1">Prepared By</div>
                </div>
                <div>
                  <div className="border-b border-dashed border-slate-300 pb-8"></div>
                  <div className="mt-1">Driver / Transporter Signature</div>
                </div>
                <div>
                  <div className="border-b border-dashed border-slate-300 pb-8"></div>
                  <div className="mt-1">Receiver Seal & Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE / EDIT TRANSPORTER ===================== */}
      {showTrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {selectedTr ? 'Edit Transporter Company' : 'Add New Transporter'}
              </h3>
              <button onClick={() => setShowTrModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveTr} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Transport Company Name *</label>
                <input
                  type="text"
                  required
                  value={trForm.companyName || ''}
                  onChange={(e) => setTrForm({ ...trForm, companyName: e.target.value, name: e.target.value })}
                  placeholder="e.g. Navkar Roadlines / Patel Logistics"
                  className="w-full p-2.5 bg-slate-50 border rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={trForm.contactPerson || ''}
                    onChange={(e) => setTrForm({ ...trForm, contactPerson: e.target.value })}
                    placeholder="e.g. Mukesh Bhai"
                    className="w-full p-2.5 bg-slate-50 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={trForm.phone || ''}
                    onChange={(e) => setTrForm({ ...trForm, phone: e.target.value })}
                    placeholder="+91 98200 12345"
                    className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Default Vehicle #</label>
                  <input
                    type="text"
                    value={trForm.vehicleNumber || ''}
                    onChange={(e) => setTrForm({ ...trForm, vehicleNumber: e.target.value.toUpperCase() })}
                    placeholder="MH-04-AB-1234"
                    className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={trForm.gstin || ''}
                    onChange={(e) => setTrForm({ ...trForm, gstin: e.target.value.toUpperCase() })}
                    placeholder="27AABCT1234F1Z5"
                    className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    value={trForm.city || ''}
                    onChange={(e) => setTrForm({ ...trForm, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Freight Terms</label>
                  <select
                    value={trForm.freightTerms || 'To Pay'}
                    onChange={(e) => setTrForm({ ...trForm, freightTerms: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-lg focus:outline-none"
                  >
                    <option value="To Pay">To Pay (Paid by Consignee)</option>
                    <option value="Paid">Paid (Prepaid by Consignor)</option>
                    <option value="Monthly Account">Monthly Ledger Account</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTrModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTr}
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Transporter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRM MODAL ===================== */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Confirm Delete</h3>
            <p className="text-xs text-slate-500">Are you sure you want to permanently delete this logistics record?</p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
