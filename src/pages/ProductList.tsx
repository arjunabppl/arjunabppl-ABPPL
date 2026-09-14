import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Product, PaperCategory, ProductUnit, PaperCategoryDefinition, PaperSizePreset } from '../types/index.js';
import { formatCurrency, formatNumber, calculateReamWeightKg, parseSizeInches } from '../utils/paperMath.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Layers, Plus, Search, Edit3, Trash2, AlertTriangle, X, Check,
  ArrowLeft, Calculator, Sparkles, Scale, Maximize2, Package,
  Save, RefreshCw, Grid, HelpCircle, FileText, FileSpreadsheet, Printer,
  FolderPlus, Settings2, Tag, CheckCircle2, ChevronRight
} from 'lucide-react';
import { exportToPdf, exportToExcel, ColumnDefinition, SummaryStat } from '../utils/exportUtils.js';

export const ProductList: React.FC = () => {
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<PaperCategoryDefinition[]>([]);
  const [sizePresets, setSizePresets] = useState<PaperSizePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // View Modes
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'BATCH_SIZE'>('LIST');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Category Management Modal
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [categoryForm, setCategoryForm] = useState<Partial<PaperCategoryDefinition>>({
    name: '',
    description: '',
    defaultHsnCode: '48025590',
    defaultGstRate: 12,
    standardGsmRange: '60 - 250 GSM'
  });
  const [savingCategory, setSavingCategory] = useState<boolean>(false);

  // Single Item Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    code: '',
    category: 'Kraft Paper',
    sizeName: 'Double Demy (23" × 36")',
    gsm: 120,
    sizeInches: '23x36',
    unit: 'Ream',
    ratePerUnit: 1450,
    purchaseRate: 1320,
    saleRate: 1450,
    openingStock: 100,
    currentStock: 100,
    minStockLevel: 20,
    hsnCode: '48041100',
    gstRate: 12,
    brand: 'Century Pulp & Paper',
    millBrand: 'Century Pulp & Paper',
    warehouse: 'Main Godown (Kalbadevi)',
    rackLocation: 'Rack A-01',
    packagingDetails: '500 sheets wrapped in waterproof poly kraft',
    notes: ''
  });

  // Custom Dimension Builder Helper
  const [customWidth, setCustomWidth] = useState<number>(23);
  const [customLength, setCustomLength] = useState<number>(36);
  const [customDimensionUnit, setCustomDimensionUnit] = useState<'INCHES' | 'CM' | 'MM'>('INCHES');
  const [sheetsPerReam, setSheetsPerReam] = useState<number>(500);

  // Standard GSM Quick Select Options
  const standardGsms = [
    45, 52, 58, 64, 70, 80, 90, 100, 115, 120, 130, 150, 170, 200, 230, 250, 280, 300, 350, 400, 450
  ];

  // Standard Mills
  const standardMills = [
    'Century Pulp & Paper',
    'ITC Ltd (PSPD)',
    'JK Paper Ltd',
    'BILT Graphic Paper',
    'Trident Paper Products',
    'Emami Paper Mills',
    'West Coast Paper Mills',
    'Khanna Paper Mills',
    'Naini Papers',
    'Orient Paper & Industries',
    'Shree Rama Newsprint',
    'Andhra Paper Ltd',
    'Star Paper Mills'
  ];

  // Batch Multi-Size Generator State
  const [batchCategory, setBatchCategory] = useState<string>('Kraft Paper');
  const [batchNamePrefix, setBatchNamePrefix] = useState<string>('Virgin Kraft Paper 20 BF');
  const [batchGsm, setBatchGsm] = useState<number>(120);
  const [batchRatePerKg, setBatchRatePerKg] = useState<number>(58);
  const [batchHsn, setBatchHsn] = useState<string>('48041100');
  const [batchGst, setBatchGst] = useState<number>(12);
  const [batchUnit, setBatchUnit] = useState<ProductUnit>('Ream');
  const [batchMill, setBatchMill] = useState<string>('Century Pulp & Paper');
  const [batchSizes, setBatchSizes] = useState<Array<{
    name: string;
    size: string;
    width: number;
    length: number;
    initialStock: number;
    enabled: boolean;
  }>>([
    { name: 'Double Demy', size: '23x36', width: 23, length: 36, initialStock: 250, enabled: true },
    { name: 'Double Crown', size: '20x30', width: 20, length: 30, initialStock: 200, enabled: true },
    { name: 'Quad Demy', size: '36x46', width: 36, length: 46, initialStock: 150, enabled: true },
    { name: 'Single Crown', size: '15x20', width: 15, length: 20, initialStock: 100, enabled: false },
    { name: 'Quad Crown', size: '30x40', width: 30, length: 40, initialStock: 80, enabled: false },
    { name: 'Packaging Board', size: '24x34', width: 24, length: 34, initialStock: 120, enabled: false }
  ]);

  const units: ProductUnit[] = ['Ream', 'Ton', 'Kg', 'Packet', 'Roll', 'Sheet', 'Bundle', 'Box'];

  const loadData = async () => {
    try {
      setLoading(true);
      const [productList, catList, sizeList] = await Promise.all([
        api.getProducts(),
        api.getPaperCategories(),
        api.getPaperSizes()
      ]);
      setProducts(productList || []);
      setCategories(catList || []);
      setSizePresets(sizeList || []);
    } catch (err) {
      console.error('Failed to load paper products or master data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync custom width/length whenever size changes
  const updateSizeFromDimensions = (w: number, l: number, unitType: 'INCHES' | 'CM' | 'MM', sizeNameLabel?: string) => {
    let widthInInches = w;
    let lengthInInches = l;
    if (unitType === 'CM') {
      widthInInches = Math.round((w / 2.54) * 100) / 100;
      lengthInInches = Math.round((l / 2.54) * 100) / 100;
    } else if (unitType === 'MM') {
      widthInInches = Math.round((w / 25.4) * 100) / 100;
      lengthInInches = Math.round((l / 25.4) * 100) / 100;
    }

    setCustomWidth(w);
    setCustomLength(l);
    const sizeStr = `${widthInInches}x${lengthInInches}`;
    setFormData(prev => ({
      ...prev,
      sizeInches: sizeStr,
      sizeName: sizeNameLabel || prev.sizeName || `${w}" × ${l}"`,
      width: widthInInches,
      length: lengthInInches
    }));
  };

  const handleSelectSizePreset = (preset: PaperSizePreset) => {
    setCustomWidth(preset.width);
    setCustomLength(preset.length);
    setCustomDimensionUnit('INCHES');
    setFormData(prev => ({
      ...prev,
      sizeName: preset.name,
      sizeInches: `${preset.width}x${preset.length}`,
      width: preset.width,
      length: preset.length
    }));
  };

  const handleSelectCategory = (catName: string) => {
    const matched = categories.find(c => c.name === catName);
    setFormData(prev => ({
      ...prev,
      category: catName,
      hsnCode: matched?.defaultHsnCode || prev.hsnCode || '48025590',
      gstRate: matched?.defaultGstRate ?? prev.gstRate ?? 12
    }));
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    const initialCode = `PP-${Math.floor(1000 + Math.random() * 9000)}`;
    setCustomWidth(23);
    setCustomLength(36);
    setCustomDimensionUnit('INCHES');
    setFormData({
      name: '',
      code: initialCode,
      category: categories[0]?.name || 'Kraft Paper',
      sizeName: 'Double Demy (23" × 36")',
      gsm: 120,
      sizeInches: '23x36',
      unit: 'Ream',
      purchaseRate: 1320,
      saleRate: 1450,
      ratePerUnit: 1450,
      openingStock: 100,
      currentStock: 100,
      minStockLevel: 20,
      hsnCode: categories[0]?.defaultHsnCode || '48041100',
      gstRate: categories[0]?.defaultGstRate || 12,
      brand: 'Century Pulp & Paper',
      millBrand: 'Century Pulp & Paper',
      warehouse: 'Main Godown (Kalbadevi)',
      rackLocation: 'Rack A-01',
      packagingDetails: '500 sheets wrapped in waterproof poly kraft',
      notes: ''
    });
    setViewMode('FORM');
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    const { length, width } = parseSizeInches(p.sizeInches || '23x36');
    setCustomWidth(width || 23);
    setCustomLength(length || 36);
    setCustomDimensionUnit('INCHES');
    setFormData({
      ...p,
      sizeName: p.sizeName || `${width || 23}" × ${length || 36}"`,
      purchaseRate: p.purchaseRate || p.ratePerUnit || 1000,
      saleRate: p.saleRate || p.ratePerUnit || 1200
    });
    setViewMode('FORM');
  };

  // Ream weight calculation
  const currentParsed = parseSizeInches(formData.sizeInches || '23x36');
  const liveReamWeightKg = calculateReamWeightKg(
    currentParsed.length || customLength,
    currentParsed.width || customWidth,
    formData.gsm || 0
  );

  // Additional Paper Metrics
  const weightPerSheetGrams = formData.gsm && currentParsed.length && currentParsed.width
    ? Number(((currentParsed.length * 0.0254 * currentParsed.width * 0.0254 * formData.gsm)).toFixed(2))
    : 0;
  const reamsPerTon = liveReamWeightKg > 0 ? Number((1000 / liveReamWeightKg).toFixed(1)) : 0;
  const ratePerKgCalculated = (formData.saleRate || formData.ratePerUnit || 0) > 0 && liveReamWeightKg > 0
    ? Number(((formData.saleRate || formData.ratePerUnit || 0) / liveReamWeightKg).toFixed(2))
    : 0;

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Product> = {
        ...formData,
        ratePerUnit: formData.saleRate || formData.ratePerUnit || 0,
        reamWeightKg: liveReamWeightKg,
        width: currentParsed.width || customWidth,
        length: currentParsed.length || customLength
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setViewMode('LIST');
      loadData();
    } catch (err) {
      console.error('Failed to save paper product:', err);
      alert('Failed to save paper product specification.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) return;
    setSavingCategory(true);
    try {
      const newCat = await api.createPaperCategory(categoryForm);
      setShowCategoryModal(false);
      setCategoryForm({
        name: '',
        description: '',
        defaultHsnCode: '48025590',
        defaultGstRate: 12,
        standardGsmRange: '60 - 250 GSM'
      });
      // reload categories
      const catList = await api.getPaperCategories();
      setCategories(catList);
      // Auto select newly created category if in form
      if (viewMode === 'FORM') {
        handleSelectCategory(newCat.name);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save paper category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm(`Delete paper category "${name}"? Existing items will retain their assigned category.`)) {
      await api.deletePaperCategory(id);
      const catList = await api.getPaperCategories();
      setCategories(catList);
    }
  };

  const handleCreateBatchSizes = async () => {
    const activeSizes = batchSizes.filter(s => s.enabled);
    if (activeSizes.length === 0) {
      alert('Please enable at least one size in the matrix.');
      return;
    }

    try {
      for (const item of activeSizes) {
        const reamKg = calculateReamWeightKg(item.length, item.width, batchGsm);
        const ratePerReam = Math.round(reamKg * batchRatePerKg);
        const code = `PP-${Math.floor(1000 + Math.random() * 9000)}`;

        await api.createProduct({
          name: `${batchNamePrefix} - ${item.name} (${item.size}") ${batchGsm} GSM`,
          code,
          category: batchCategory,
          sizeName: item.name,
          gsm: batchGsm,
          sizeInches: item.size,
          width: item.width,
          length: item.length,
          unit: batchUnit,
          purchaseRate: Math.round(ratePerReam * 0.9),
          saleRate: batchUnit === 'Ream' ? ratePerReam : batchRatePerKg,
          ratePerUnit: batchUnit === 'Ream' ? ratePerReam : batchRatePerKg,
          reamWeightKg: reamKg,
          openingStock: item.initialStock,
          currentStock: item.initialStock,
          minStockLevel: 25,
          hsnCode: batchHsn,
          gstRate: batchGst,
          brand: batchMill,
          millBrand: batchMill,
          warehouse: 'Main Godown (Kalbadevi)',
          notes: `Batch created master size for ${batchMill}`
        });
      }

      setViewMode('LIST');
      loadData();
    } catch (err) {
      console.error('Batch creation error:', err);
      alert('Error creating batch sizes.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Delete this paper product grade from catalog?')) {
      await api.deleteProduct(id);
      loadData();
    }
  };

  const filteredProducts = (products || []).filter(p => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = !q || (
      (p.name || '').toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.sizeName && (p.sizeName || '').toLowerCase().includes(q)) ||
      (p.millBrand && (p.millBrand || '').toLowerCase().includes(q)) ||
      (p.brand && (p.brand || '').toLowerCase().includes(q)) ||
      (p.sizeInches && (p.sizeInches || '').toLowerCase().includes(q)) ||
      (p.gsm && p.gsm.toString().includes(q))
    );
    
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleExportProductsPdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Product / Grade', dataKey: 'name', align: 'left' },
      { header: 'Code', dataKey: 'code', align: 'center' },
      { header: 'Category', dataKey: 'category', align: 'left' },
      { header: 'GSM', dataKey: 'gsm', align: 'center' },
      { header: 'Size Name / Spec', dataKey: 'sizeDisplay', align: 'left' },
      { header: 'Ream Wt (Kg)', dataKey: 'reamWeightKg', align: 'right' },
      { header: 'Unit', dataKey: 'unit', align: 'center' },
      { header: 'Sale Rate (₹)', dataKey: 'rateFormatted', align: 'right' },
      { header: 'Stock', dataKey: 'stockFormatted', align: 'right' },
      { header: 'Status', dataKey: 'status', align: 'center' }
    ];

    const data = filteredProducts.map(p => ({
      name: p.name,
      code: p.code,
      category: p.category,
      gsm: `${p.gsm} GSM`,
      sizeDisplay: p.sizeName ? `${p.sizeName} (${p.sizeInches}")` : `${p.sizeInches}"`,
      reamWeightKg: p.reamWeightKg ? `${p.reamWeightKg} Kg` : '-',
      unit: p.unit,
      rateFormatted: formatCurrency(p.saleRate || p.ratePerUnit || 0),
      stockFormatted: `${p.currentStock ?? p.openingStock ?? 0} ${p.unit}`,
      status: (p.currentStock ?? p.openingStock ?? 0) <= (p.minStockLevel || 10) ? 'LOW STOCK' : 'IN STOCK'
    }));

    const totalStockUnits = filteredProducts.reduce((sum, p) => sum + (p.currentStock ?? p.openingStock ?? 0), 0);
    const totalInventoryValue = filteredProducts.reduce((sum, p) => sum + ((p.currentStock ?? p.openingStock ?? 0) * (p.saleRate || p.ratePerUnit || 0)), 0);

    const summaryStats: SummaryStat[] = [
      { label: 'Total Paper Grades', value: filteredProducts.length },
      { label: 'Total Stock Quantity', value: `${totalStockUnits.toLocaleString('en-IN')} Units` },
      { label: 'Total Valuation', value: formatCurrency(totalInventoryValue) }
    ];

    exportToPdf({
      title: 'Paper Catalog & Master Inventory Report',
      subtitle: `Filter: ${selectedCategory} | Active Grades: ${filteredProducts.length}`,
      fileName: `Paper_Catalog_${new Date().toISOString().split('T')[0]}.pdf`,
      columns,
      data,
      summaryStats
    });
  };

  const handleExportProductsExcel = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Item Name', dataKey: 'name' },
      { header: 'Item Code', dataKey: 'code' },
      { header: 'Category', dataKey: 'category' },
      { header: 'Mill / Brand', dataKey: 'millBrand' },
      { header: 'GSM', dataKey: 'gsm' },
      { header: 'Size Name', dataKey: 'sizeName' },
      { header: 'Size (Inches)', dataKey: 'sizeInches' },
      { header: 'Ream Weight (Kg)', dataKey: 'reamWeightKg' },
      { header: 'Unit', dataKey: 'unit' },
      { header: 'Purchase Rate (₹)', dataKey: 'purchaseRate' },
      { header: 'Sale Rate (₹)', dataKey: 'saleRate' },
      { header: 'Current Stock', dataKey: 'currentStock' },
      { header: 'Min Stock Level', dataKey: 'minStockLevel' },
      { header: 'HSN Code', dataKey: 'hsnCode' },
      { header: 'GST %', dataKey: 'gstRate' },
      { header: 'Warehouse / Godown', dataKey: 'warehouse' },
      { header: 'Rack / Bin', dataKey: 'rackLocation' }
    ];

    const data = filteredProducts.map(p => ({
      name: p.name,
      code: p.code,
      category: p.category,
      millBrand: p.millBrand || p.brand || '',
      gsm: p.gsm,
      sizeName: p.sizeName || '',
      sizeInches: p.sizeInches,
      reamWeightKg: p.reamWeightKg || '',
      unit: p.unit,
      purchaseRate: p.purchaseRate || '',
      saleRate: p.saleRate || p.ratePerUnit || 0,
      currentStock: p.currentStock ?? p.openingStock ?? 0,
      minStockLevel: p.minStockLevel || 0,
      hsnCode: p.hsnCode || '',
      gstRate: p.gstRate || 12,
      warehouse: p.warehouse || '',
      rackLocation: p.rackLocation || ''
    }));

    exportToExcel({
      title: 'ABPPL Paper Catalog Master',
      subtitle: `Exported on ${new Date().toLocaleDateString('en-IN')}`,
      fileName: `Paper_Catalog_Master_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Paper Catalog',
      columns,
      data
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {isCustomer ? 'Paper Catalog & Available Grades' : 'Paper & Board Product Catalog'}
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
              {products.length} Grades
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isCustomer
              ? 'Browse certified paper grades, GSM specs, ream weights, and standard wholesale price list'
              : 'Master repository for paper categories, GSM specifications, size names, ream weight calculations & pricing'}
          </p>
        </div>

        {!isCustomer && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Manage Categories Button */}
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200"
            >
              <FolderPlus className="w-4 h-4 text-emerald-600" />
              <span>Manage Categories ({categories.length})</span>
            </button>

            {/* Batch Matrix Creator */}
            <button
              onClick={() => setViewMode('BATCH_SIZE')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition border border-blue-200"
            >
              <Grid className="w-4 h-4" />
              <span>Multi-Size Matrix</span>
            </button>

            {/* Add Single Item */}
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Paper Grade</span>
            </button>
          </div>
        )}
      </div>

      {/* ===================== VIEW 1: CATEGORY MANAGEMENT MODAL ===================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Paper Category Master</h3>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* CREATE CATEGORY FORM */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Create New Paper Category</span>
                </h4>
                <form onSubmit={handleCreateCategory} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                      <input
                        type="text"
                        required
                        value={categoryForm.name || ''}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        placeholder="e.g. Maplitho, Kraft Paper, Duplex Board"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Default HSN Code *</label>
                      <input
                        type="text"
                        required
                        value={categoryForm.defaultHsnCode || ''}
                        onChange={(e) => setCategoryForm({ ...categoryForm, defaultHsnCode: e.target.value })}
                        placeholder="e.g. 48025590"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Default GST Rate (%)</label>
                      <select
                        value={categoryForm.defaultGstRate || 12}
                        onChange={(e) => setCategoryForm({ ...categoryForm, defaultGstRate: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-medium focus:outline-none"
                      >
                        <option value={0}>0% (Exempt)</option>
                        <option value={5}>5% (Basic / Concessional)</option>
                        <option value={12}>12% (Standard Paper & Board)</option>
                        <option value={18}>18% (Specialty / Coated / Printed)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Standard GSM Range</label>
                      <input
                        type="text"
                        value={categoryForm.standardGsmRange || ''}
                        onChange={(e) => setCategoryForm({ ...categoryForm, standardGsmRange: e.target.value })}
                        placeholder="e.g. 60 - 250 GSM"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Description / Application</label>
                    <input
                      type="text"
                      value={categoryForm.description || ''}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="e.g. High tensile virgin kraft paper used in corrugation packaging"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-medium focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={savingCategory}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg transition shadow-xs flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingCategory ? 'Saving...' : 'Save Paper Category'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* LIST OF CATEGORIES */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-2">
                  All Active Paper Categories ({categories.length})
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {categories.map((c) => (
                    <div key={c.id} className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{c.name}</span>
                          <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                            HSN: {c.defaultHsnCode}
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">
                            GST: {c.defaultGstRate}%
                          </span>
                          {c.standardGsmRange && (
                            <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded font-medium">
                              {c.standardGsmRange}
                            </span>
                          )}
                        </div>
                        {c.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{c.description}</p>
                        )}
                      </div>

                      {c.isCustom && (
                        <button
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Custom Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW 2: FORM FOR SINGLE ITEM ===================== */}
      {viewMode === 'FORM' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('LIST')}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {editingProduct ? 'Edit Paper Grade Specification' : 'Create New Paper Grade'}
                </h2>
                <p className="text-xs text-slate-500">
                  Configure GSM, size dimensions, standard size name, mill brand, ream weight and rate
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Category</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveProduct} className="space-y-6 text-xs">
            {/* SECTION 1: BASIC GRADE DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Paper Grade / Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Century Star Gloss Art Paper"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">SKU / Item Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. AP-170-2336"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Paper Category *</label>
                <select
                  value={formData.category || 'Kraft Paper'}
                  onChange={(e) => handleSelectCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SECTION 2: MILL & BRAND */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mill / Manufacturer Brand *</label>
                <input
                  type="text"
                  required
                  list="mill-options"
                  value={formData.millBrand || formData.brand || ''}
                  onChange={(e) => setFormData({ ...formData, millBrand: e.target.value, brand: e.target.value })}
                  placeholder="Select or enter paper mill..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                />
                <datalist id="mill-options">
                  {standardMills.map((m, idx) => (
                    <option key={idx} value={m} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Packaging / Batch Details</label>
                <input
                  type="text"
                  value={formData.packagingDetails || ''}
                  onChange={(e) => setFormData({ ...formData, packagingDetails: e.target.value })}
                  placeholder="e.g. 500 sheets wrapped in moisture-proof poly"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Warehouse Godown & Rack</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.warehouse || ''}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    placeholder="Godown Name"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                  />
                  <input
                    type="text"
                    value={formData.rackLocation || ''}
                    onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                    placeholder="Rack / Bin A-01"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: GSM SELECTION & CHIPS */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-extrabold text-slate-900 text-xs">
                  Paper GSM (Grammage) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Exact GSM Value:</span>
                  <input
                    type="number"
                    required
                    min="10"
                    max="1500"
                    value={formData.gsm || ''}
                    onChange={(e) => setFormData({ ...formData, gsm: Number(e.target.value) })}
                    className="w-24 p-1.5 bg-white border border-slate-300 rounded-lg font-mono font-black text-center text-sm text-emerald-700 focus:outline-none"
                  />
                  <span className="font-bold text-slate-700">GSM</span>
                </div>
              </div>

              {/* Quick GSM Pills */}
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5 font-medium">Quick-select standard paper GSM:</p>
                <div className="flex flex-wrap gap-1.5">
                  {standardGsms.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gsm: g })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition ${
                        formData.gsm === g
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {g} GSM
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 4: SIZE NAME & DIMENSIONS */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4 text-emerald-600" />
                  <span>Size Specification & Standard Size Name</span>
                </label>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCustomDimensionUnit('INCHES')}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      customDimensionUnit === 'INCHES' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    Inches (")
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomDimensionUnit('CM')}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      customDimensionUnit === 'CM' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    CM
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomDimensionUnit('MM')}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      customDimensionUnit === 'MM' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    MM
                  </button>
                </div>
              </div>

              {/* Standard Size Presets Quick Select */}
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5 font-medium">Standard Paper Sizes:</p>
                <div className="flex flex-wrap gap-2">
                  {sizePresets.map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => handleSelectSizePreset(sp)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                        formData.sizeName === sp.name || formData.sizeInches === `${sp.width}x${sp.length}`
                          ? 'bg-emerald-700 text-white font-bold shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{sp.name}</span>
                      <span className="font-mono opacity-80 text-[10px]">({sp.width}" × {sp.length}")</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Standard Size Name / Label</label>
                  <input
                    type="text"
                    value={formData.sizeName || ''}
                    onChange={(e) => setFormData({ ...formData, sizeName: e.target.value })}
                    placeholder="e.g. Double Demy, Double Crown, A4, Custom Reel"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Width ({customDimensionUnit.toLowerCase()}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={customWidth}
                    onChange={(e) => updateSizeFromDimensions(Number(e.target.value), customLength, customDimensionUnit, formData.sizeName)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Length ({customDimensionUnit.toLowerCase()}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={customLength}
                    onChange={(e) => updateSizeFromDimensions(customWidth, Number(e.target.value), customDimensionUnit, formData.sizeName)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* LIVE REAM WEIGHT & PAPER CALCULATOR DISPLAY */}
              <div className="p-4 bg-emerald-900 text-white rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-300">Ream Weight (500 Sheets)</div>
                  <div className="text-xl font-black font-mono text-emerald-100 mt-0.5">
                    {liveReamWeightKg} <span className="text-xs font-normal">Kg</span>
                  </div>
                  <div className="text-[10px] text-emerald-300/80 font-mono">Formula: (L×W×GSM)/3100</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-300">Single Sheet Weight</div>
                  <div className="text-xl font-black font-mono text-emerald-100 mt-0.5">
                    {weightPerSheetGrams} <span className="text-xs font-normal">grams</span>
                  </div>
                  <div className="text-[10px] text-emerald-300/80 font-mono">1,000 Sheets: {(liveReamWeightKg * 2).toFixed(2)} Kg</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-300">Reams per Metric Ton</div>
                  <div className="text-xl font-black font-mono text-emerald-100 mt-0.5">
                    {reamsPerTon} <span className="text-xs font-normal">Reams/MT</span>
                  </div>
                  <div className="text-[10px] text-emerald-300/80 font-mono">1 MT = 1,000 Kg</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-300">Calculated Rate per Kg</div>
                  <div className="text-xl font-black font-mono text-emerald-100 mt-0.5">
                    ₹{ratePerKgCalculated} <span className="text-xs font-normal">/ Kg</span>
                  </div>
                  <div className="text-[10px] text-emerald-300/80 font-mono">Based on ₹{formData.saleRate || 0}/Ream</div>
                </div>
              </div>
            </div>

            {/* SECTION 5: RATES, TAX & INVENTORY */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Billing Unit *</label>
                <select
                  value={formData.unit || 'Ream'}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value as ProductUnit })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                >
                  {units.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Purchase Rate (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.purchaseRate || ''}
                  onChange={(e) => setFormData({ ...formData, purchaseRate: Number(e.target.value) })}
                  placeholder="1320"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Selling Rate (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.saleRate || ''}
                  onChange={(e) => setFormData({ ...formData, saleRate: Number(e.target.value), ratePerUnit: Number(e.target.value) })}
                  placeholder="1450"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Physical Stock</label>
                <input
                  type="number"
                  value={formData.currentStock ?? formData.openingStock ?? 0}
                  onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value), openingStock: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Minimum Stock Alert Level</label>
                <input
                  type="number"
                  value={formData.minStockLevel || 20}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">HSN Code *</label>
                <input
                  type="text"
                  required
                  value={formData.hsnCode || '48041100'}
                  onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">GST Rate (%) *</label>
                <select
                  value={formData.gstRate ?? 12}
                  onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Notes / Technical Specifications</label>
              <textarea
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Bulk caliper, brightness %, grain direction, coating specs..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingProduct ? 'Update Paper Grade' : 'Save Paper Grade'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== VIEW 3: BATCH MULTI-SIZE MATRIX ===================== */}
      {viewMode === 'BATCH_SIZE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('LIST')}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Batch Multi-Size Matrix Generator
                </h2>
                <p className="text-xs text-slate-500">
                  Generate multiple standard paper sizes in 1-click for a single paper quality & GSM
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Paper Grade Name Prefix</label>
              <input
                type="text"
                value={batchNamePrefix}
                onChange={(e) => setBatchNamePrefix(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={batchCategory}
                onChange={(e) => setBatchCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold focus:outline-none"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mill / Brand</label>
              <input
                type="text"
                list="mill-options-batch"
                value={batchMill}
                onChange={(e) => setBatchMill(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-medium focus:outline-none"
              />
              <datalist id="mill-options-batch">
                {standardMills.map((m, idx) => (
                  <option key={idx} value={m} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">GSM</label>
              <input
                type="number"
                value={batchGsm}
                onChange={(e) => setBatchGsm(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Base Rate per Kg (₹)</label>
              <input
                type="number"
                value={batchRatePerKg}
                onChange={(e) => setBatchRatePerKg(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono font-bold text-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">HSN Code</label>
              <input
                type="text"
                value={batchHsn}
                onChange={(e) => setBatchHsn(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">GST Rate (%)</label>
              <select
                value={batchGst}
                onChange={(e) => setBatchGst(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold focus:outline-none"
              >
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
              </select>
            </div>
          </div>

          {/* SIZES MATRIX TABLE */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="p-3 text-center">Enable</th>
                  <th className="p-3">Size Name</th>
                  <th className="p-3">Dimensions (Inches)</th>
                  <th className="p-3 text-right">Calculated Ream Wt</th>
                  <th className="p-3 text-right">Auto Rate / Ream</th>
                  <th className="p-3 text-right">Initial Stock (Reams)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batchSizes.map((row, idx) => {
                  const reamKg = calculateReamWeightKg(row.length, row.width, batchGsm);
                  const ratePerReam = Math.round(reamKg * batchRatePerKg);

                  return (
                    <tr key={idx} className={row.enabled ? 'bg-white' : 'bg-slate-50/50 opacity-60'}>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={(e) => {
                            const copy = [...batchSizes];
                            copy[idx].enabled = e.target.checked;
                            setBatchSizes(copy);
                          }}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                      </td>
                      <td className="p-3 font-bold text-slate-900">{row.name}</td>
                      <td className="p-3 font-mono">{row.size}"</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">{reamKg} Kg</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-700">₹{ratePerReam}</td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          value={row.initialStock}
                          onChange={(e) => {
                            const copy = [...batchSizes];
                            copy[idx].initialStock = Number(e.target.value);
                            setBatchSizes(copy);
                          }}
                          className="w-24 p-1.5 bg-slate-50 border rounded-lg text-right font-mono font-bold text-xs"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setViewMode('LIST')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBatchSizes}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate {batchSizes.filter(s => s.enabled).length} Paper Grades</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================== VIEW 4: PRODUCT CATALOG LIST ===================== */}
      {viewMode === 'LIST' && (
        <div className="space-y-4">
          {/* SEARCH, CATEGORY FILTER & EXPORT BAR */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search item, GSM, size, brand, SKU..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category Filter Pills */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Categories ({products.length})</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* EXPORT & PRINT BUTTONS */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportProductsPdf}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200"
                title="Export Catalog to PDF"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handleExportProductsExcel}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition border border-emerald-200"
                title="Export Catalog to Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition border border-slate-200"
                title="Print Catalog"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>

          {/* PRODUCTS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs">Loading paper catalog...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No paper grades found</p>
                <p className="text-xs text-slate-500">Try adjusting your search query or category filter</p>
                {!isCustomer && (
                  <button
                    onClick={handleOpenAdd}
                    className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Create New Paper Grade
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-3 px-4">Paper Grade & SKU</th>
                      <th className="py-3 px-4">Category & Mill</th>
                      <th className="py-3 px-4">GSM</th>
                      <th className="py-3 px-4">Size Name & Specs</th>
                      <th className="py-3 px-4 text-right">Ream Weight</th>
                      <th className="py-3 px-4 text-right">Selling Rate</th>
                      <th className="py-3 px-4 text-right">Available Stock</th>
                      <th className="py-3 px-4 text-center">{isCustomer ? 'Availability' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredProducts.map((p) => {
                      const isLowStock = (p.currentStock ?? p.openingStock ?? 0) <= (p.minStockLevel || 10);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-black text-slate-900 text-sm">{p.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                                {p.code}
                              </span>
                              {p.warehouse && !isCustomer && (
                                <span className="text-[10px] text-slate-500">
                                  • {p.warehouse}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-extrabold rounded">
                              {p.category}
                            </span>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {p.millBrand || p.brand || 'Standard Mill'}
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono font-extrabold text-slate-900">
                            {p.gsm} <span className="text-[10px] font-normal text-slate-500">GSM</span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{p.sizeName || `${p.sizeInches}"`}</div>
                            <div className="text-[11px] font-mono text-slate-500">{p.sizeInches}"</div>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                            {p.reamWeightKg ? `${p.reamWeightKg} Kg` : '-'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="font-black text-slate-900 text-sm">
                              {formatCurrency(p.saleRate || p.ratePerUnit || 0)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">per {p.unit}</div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className={`font-mono font-black ${isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
                              {p.currentStock ?? p.openingStock ?? 0} {p.unit}
                            </div>
                            {isLowStock && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded">
                                LOW STOCK
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            {isCustomer ? (
                              <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[10px]">
                                Ready to Order
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenEdit(p)}
                                  className="p-1.5 bg-slate-100 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                                  title="Edit Product"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-700 rounded-lg transition"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
