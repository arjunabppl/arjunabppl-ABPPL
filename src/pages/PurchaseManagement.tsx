import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  Supplier, PurchaseOrder, PurchaseRequisition, SupplierQuotationComparison,
  ImportShipment, LandedCostCalculation, GoodsReceiptNote, ThreeWayMatch,
  PurchaseReturn, SupplierPayment, Warehouse, Product, AuditLog
} from '../types/index.js';
import {
  Building2, FileText, ShoppingBag, Truck, Calculator, PackageCheck,
  FileCheck2, RotateCcw, CreditCard, History, LayoutDashboard,
  Layers, ChevronRight, AlertCircle, RefreshCw, CheckCircle2
} from 'lucide-react';

// Subcomponents
import { PurchaseOverview } from '../components/purchase/PurchaseOverview.js';
import { SupplierMasterTab } from '../components/purchase/SupplierMasterTab.js';
import { PurchaseRequisitionTab } from '../components/purchase/PurchaseRequisitionTab.js';
import { QuotationComparisonTab } from '../components/purchase/QuotationComparisonTab.js';
import { PurchaseOrdersTab } from '../components/purchase/PurchaseOrdersTab.js';
import { ImportShipmentsTab } from '../components/purchase/ImportShipmentsTab.js';
import { LandedCostTab } from '../components/purchase/LandedCostTab.js';
import { GoodsReceiptNotesTab } from '../components/purchase/GoodsReceiptNotesTab.js';
import { ThreeWayMatchTab } from '../components/purchase/ThreeWayMatchTab.js';
import { PurchaseReturnsTab } from '../components/purchase/PurchaseReturnsTab.js';
import { SupplierPaymentsTab } from '../components/purchase/SupplierPaymentsTab.js';
import { AuditLogsTab } from '../components/purchase/AuditLogsTab.js';

export type PurchaseTabKey =
  | 'overview'
  | 'suppliers'
  | 'requisitions'
  | 'quotations'
  | 'orders'
  | 'shipments'
  | 'landed-cost'
  | 'grn'
  | 'matching'
  | 'returns'
  | 'payments'
  | 'audit';

export const PurchaseManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<PurchaseTabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Core Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [quotations, setQuotations] = useState<SupplierQuotationComparison[]>([]);
  const [shipments, setShipments] = useState<ImportShipment[]>([]);
  const [landedCostCalcs, setLandedCostCalcs] = useState<LandedCostCalculation[]>([]);
  const [grns, setGrns] = useState<GoodsReceiptNote[]>([]);
  const [threeWayMatches, setThreeWayMatches] = useState<ThreeWayMatch[]>([]);
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Selection states for cross-tab workflows
  const [selectedShipmentForCalc, setSelectedShipmentForCalc] = useState<ImportShipment | null>(null);
  const [initialPoForGrn, setInitialPoForGrn] = useState<PurchaseOrder | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        suppliersRes,
        ordersRes,
        requisitionsRes,
        quotationsRes,
        shipmentsRes,
        landedRes,
        grnsRes,
        matchesRes,
        returnsRes,
        paymentsRes,
        auditRes,
        warehousesRes,
        productsRes
      ] = await Promise.all([
        api.getSuppliers().catch(() => []),
        api.getPurchaseOrders().catch(() => []),
        api.getPurchaseRequisitions().catch(() => []),
        api.getSupplierQuotations().catch(() => []),
        api.getImportShipments().catch(() => []),
        api.getLandedCostCalculations().catch(() => []),
        api.getGoodsReceiptNotes().catch(() => []),
        api.getThreeWayMatches().catch(() => []),
        api.getPurchaseReturns().catch(() => []),
        api.getSupplierPayments().catch(() => []),
        api.getPurchaseAuditLogs().catch(() => []),
        api.getWarehouses().catch(() => []),
        api.getProducts().catch(() => [])
      ]);

      setSuppliers(Array.isArray(suppliersRes) ? suppliersRes : []);
      setPurchaseOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setRequisitions(Array.isArray(requisitionsRes) ? requisitionsRes : []);
      setQuotations(Array.isArray(quotationsRes) ? quotationsRes : []);
      setShipments(Array.isArray(shipmentsRes) ? shipmentsRes : []);
      setLandedCostCalcs(Array.isArray(landedRes) ? landedRes : []);
      setGrns(Array.isArray(grnsRes) ? grnsRes : []);
      setThreeWayMatches(Array.isArray(matchesRes) ? matchesRes : []);
      setReturns(Array.isArray(returnsRes) ? returnsRes : []);
      setPayments(Array.isArray(paymentsRes) ? paymentsRes : []);
      setAuditLogs(Array.isArray(auditRes) ? auditRes : []);
      setWarehouses(Array.isArray(warehousesRes) ? warehousesRes : []);
      setProducts(Array.isArray(productsRes) ? productsRes : []);
    } catch (err: any) {
      console.error('Failed to load purchase data:', err);
      setError('Could not load complete purchase management dataset.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers
  const handleSaveSupplier = async (data: Partial<Supplier>) => {
    try {
      if (data.id) {
        await api.updateSupplier(data.id, data);
        showNotification('Supplier profile updated successfully.');
      } else {
        await api.createSupplier(data);
        showNotification('New supplier/mill registered successfully.');
      }
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save supplier', 'error');
    }
  };

  const handleSaveRequisition = async (data: Partial<PurchaseRequisition>) => {
    try {
      await api.createPurchaseRequisition(data);
      showNotification('Purchase requisition submitted successfully.');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to create requisition', 'error');
    }
  };

  const handleApproveRequisition = async (id: string) => {
    try {
      await api.approvePurchaseRequisition(id);
      showNotification('Purchase requisition approved.');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Approval failed', 'error');
    }
  };

  const handleRejectRequisition = async (id: string) => {
    try {
      await api.rejectPurchaseRequisition(id);
      showNotification('Purchase requisition rejected.');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Rejection failed', 'error');
    }
  };

  const handleSaveQuotation = async (data: Partial<SupplierQuotationComparison>) => {
    try {
      await api.createSupplierQuotation(data);
      showNotification('Supplier quotation recorded successfully.');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save quotation', 'error');
    }
  };

  const handleAwardQuotation = async (id: string) => {
    try {
      await api.awardSupplierQuotation(id);
      showNotification('Quotation awarded and Purchase Order automatically generated!');
      loadAllData();
      setActiveTab('orders');
    } catch (err: any) {
      showNotification(err.message || 'Awarding failed', 'error');
    }
  };

  const handleSavePurchaseOrder = async (data: Partial<PurchaseOrder>) => {
    try {
      await api.createPurchaseOrder(data);
      showNotification('Purchase Order created successfully.');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save Purchase Order', 'error');
    }
  };

  const handleApprovePurchaseOrder = async (id: string) => {
    try {
      await api.approvePurchaseOrder(id);
      showNotification('Purchase Order officially approved and released.');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'PO approval failed', 'error');
    }
  };

  const handleCancelPurchaseOrder = async (id: string) => {
    try {
      await api.cancelPurchaseOrder(id);
      showNotification('Purchase Order cancelled.');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'PO cancellation failed', 'error');
    }
  };

  const handleSaveShipment = async (data: Partial<ImportShipment>) => {
    try {
      if (data.id) {
        await api.updateImportShipment(data.id, data);
        showNotification('Import container shipment updated.');
      } else {
        await api.createImportShipment(data);
        showNotification('New import shipment & BL logged.');
      }
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save shipment', 'error');
    }
  };

  const handleUpdateShipmentTimeline = async (id: string, status: string, location: string, description: string) => {
    try {
      await api.updateShipmentTimeline(id, status, location, description);
      showNotification('Shipment tracking timeline updated.');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update timeline', 'error');
    }
  };

  const handleSaveLandedCost = async (data: Partial<LandedCostCalculation>) => {
    try {
      await api.createLandedCostCalculation(data);
      showNotification('Landed cost calculation saved successfully.');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save calculation', 'error');
    }
  };

  const handleFinalizeLandedCost = async (id: string) => {
    try {
      await api.finalizeLandedCostCalculation(id);
      showNotification('Landed cost finalized & synchronized to Product Master valuation!');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to finalize landed cost', 'error');
    }
  };

  const handleSaveGrn = async (data: Partial<GoodsReceiptNote>) => {
    try {
      await api.createGoodsReceiptNote(data);
      showNotification('GRN inspection recorded.');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save GRN', 'error');
    }
  };

  const handleConfirmGrn = async (id: string) => {
    try {
      await api.confirmGoodsReceiptNote(id);
      showNotification('GRN confirmed: Physical stock has been posted to warehouse inventory!');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to confirm GRN', 'error');
    }
  };

  const handlePerform3WayMatch = async (data: Partial<ThreeWayMatch>) => {
    try {
      await api.createThreeWayMatch(data);
      showNotification('3-Way Match audit completed.');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to perform 3-way match', 'error');
    }
  };

  const handleApprove3WayMatch = async (id: string, notes: string) => {
    try {
      await api.approveThreeWayMatch(id, notes);
      showNotification('Discrepancy approved and invoice released for payment.');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to approve 3-way match', 'error');
    }
  };

  const handleSavePurchaseReturn = async (data: Partial<PurchaseReturn>) => {
    try {
      await api.createPurchaseReturn(data);
      showNotification('Purchase return & Debit Note issued successfully.');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to issue return', 'error');
    }
  };

  const handleSaveSupplierPayment = async (data: Partial<SupplierPayment>) => {
    try {
      await api.createSupplierPayment(data);
      showNotification('Supplier payment voucher posted successfully.');
      loadAllData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to post payment', 'error');
    }
  };

  const tabsConfig = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'suppliers', label: 'Suppliers & Mills', icon: Building2, count: suppliers.length },
    { key: 'requisitions', label: 'Requisitions', icon: FileText, count: requisitions.filter(r => r.status === 'PENDING_APPROVAL').length },
    { key: 'quotations', label: 'Quotations / RFQ', icon: Layers, count: quotations.length },
    { key: 'orders', label: 'Purchase Orders', icon: ShoppingBag, count: purchaseOrders.length },
    { key: 'shipments', label: 'Import Shipments', icon: Truck, count: shipments.length },
    { key: 'landed-cost', label: 'Landed Cost Engine', icon: Calculator, count: landedCostCalcs.length },
    { key: 'grn', label: 'GRN & QC Inspection', icon: PackageCheck, count: grns.length },
    { key: 'matching', label: '3-Way Matching', icon: FileCheck2, count: threeWayMatches.filter(m => m.status === 'DISCREPANCY').length },
    { key: 'returns', label: 'Returns & Debit Notes', icon: RotateCcw, count: returns.length },
    { key: 'payments', label: 'Payments & SWIFT', icon: CreditCard, count: payments.length },
    { key: 'audit', label: 'Audit Trail', icon: History }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <span>Purchase & Import Management</span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ERP v2.5
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                End-to-end procurement lifecycle for ABPPL Paper Wholesalers Pvt Ltd • Domestic Mills & Global Imports
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/80 shadow-xs flex items-center space-x-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-lg text-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/80 border-red-500/40 text-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-200 text-xs">✕</button>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto shadow-inner">
        <div className="flex items-center space-x-1 min-w-max">
          {tabsConfig.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as PurchaseTabKey)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-medium transition flex items-center space-x-2 ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Renderer */}
      {loading && purchaseOrders.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-xs">Loading procurement records...</span>
        </div>
      ) : (
        <div>
          {activeTab === 'overview' && (
            <PurchaseOverview
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              requisitions={requisitions}
              shipments={shipments}
              grns={grns}
              threeWayMatches={threeWayMatches}
              landedCosts={landedCostCalcs}
              onNavigateTab={(tab) => setActiveTab(tab as PurchaseTabKey)}
            />
          )}

          {activeTab === 'suppliers' && (
            <SupplierMasterTab
              suppliers={suppliers}
              onSaveSupplier={handleSaveSupplier}
              currentUserRole={user?.role}
            />
          )}

          {activeTab === 'requisitions' && (
            <PurchaseRequisitionTab
              requisitions={requisitions}
              products={products}
              warehouses={warehouses}
              onSaveRequisition={handleSaveRequisition}
              onApproveRequisition={handleApproveRequisition}
              onRejectRequisition={handleRejectRequisition}
              currentUserRole={user?.role}
            />
          )}

          {activeTab === 'quotations' && (
            <QuotationComparisonTab
              quotations={quotations}
              suppliers={suppliers}
              products={products}
              requisitions={requisitions}
              onSaveQuotation={handleSaveQuotation}
              onAwardQuotation={handleAwardQuotation}
              currentUserRole={user?.role}
            />
          )}

          {activeTab === 'orders' && (
            <PurchaseOrdersTab
              purchaseOrders={purchaseOrders}
              suppliers={suppliers}
              products={products}
              warehouses={warehouses}
              onSavePurchaseOrder={handleSavePurchaseOrder}
              onApprovePurchaseOrder={handleApprovePurchaseOrder}
              onCancelPurchaseOrder={handleCancelPurchaseOrder}
              onCreateShipmentFromPo={(po) => {
                setActiveTab('shipments');
              }}
              onCreateGrnFromPo={(po) => {
                setInitialPoForGrn(po);
                setActiveTab('grn');
              }}
              currentUserRole={user?.role}
            />
          )}

          {activeTab === 'shipments' && (
            <ImportShipmentsTab
              shipments={shipments}
              purchaseOrders={purchaseOrders}
              suppliers={suppliers}
              warehouses={warehouses}
              onSaveShipment={handleSaveShipment}
              onUpdateTimeline={handleUpdateShipmentTimeline}
              onOpenLandedCost={(s) => {
                setSelectedShipmentForCalc(s);
                setActiveTab('landed-cost');
              }}
              currentUserRole={user?.role}
            />
          )}

          {activeTab === 'landed-cost' && (
            <LandedCostTab
              calculations={landedCostCalcs}
              shipments={shipments}
              purchaseOrders={purchaseOrders}
              products={products}
              onSaveCalculation={handleSaveLandedCost}
              onFinalizeCalculation={handleFinalizeLandedCost}
              selectedShipmentForCalc={selectedShipmentForCalc}
              currentUserRole={user?.role}
            />
          )}

          {activeTab === 'grn' && (
            <GoodsReceiptNotesTab
              grns={grns}
              purchaseOrders={purchaseOrders}
              shipments={shipments}
              warehouses={warehouses}
              products={products}
              onSaveGrn={handleSaveGrn}
              onConfirmGrn={handleConfirmGrn}
              currentUserRole={user?.role}
              initialPoForGrn={initialPoForGrn}
            />
          )}

          {activeTab === 'matching' && (
            <ThreeWayMatchTab
              matches={threeWayMatches}
              purchaseOrders={purchaseOrders}
              grns={grns}
              suppliers={suppliers}
              onPerformMatch={handlePerform3WayMatch}
              onApproveMatch={handleApprove3WayMatch}
              currentUserRole={user?.role}
            />
          )}

          {activeTab === 'returns' && (
            <PurchaseReturnsTab
              returns={returns}
              purchaseOrders={purchaseOrders}
              suppliers={suppliers}
              products={products}
              warehouses={warehouses}
              onSaveReturn={handleSavePurchaseReturn}
              currentUserRole={user?.role}
            />
          )}

          {activeTab === 'payments' && (
            <SupplierPaymentsTab
              payments={payments}
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              onSavePayment={handleSaveSupplierPayment}
              currentUserRole={user?.role}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogsTab logs={auditLogs} />
          )}
        </div>
      )}
    </div>
  );
};
