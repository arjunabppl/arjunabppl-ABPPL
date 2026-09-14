import React from 'react';
import {
  PurchaseStats, PurchaseOrder, ImportShipment, GoodsReceiptNote,
  PurchaseRequisition, Supplier, ThreeWayMatch, LandedCostCalculation
} from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import {
  ShoppingCart, Globe, FileCheck, AlertTriangle, TrendingUp,
  ArrowUpRight, Truck
} from 'lucide-react';

interface PurchaseOverviewProps {
  stats?: PurchaseStats | null;
  purchaseOrders?: PurchaseOrder[];
  recentOrders?: PurchaseOrder[];
  shipments?: ImportShipment[];
  recentShipments?: ImportShipment[];
  grns?: GoodsReceiptNote[];
  recentGrns?: GoodsReceiptNote[];
  requisitions?: PurchaseRequisition[];
  suppliers?: Supplier[];
  threeWayMatches?: ThreeWayMatch[];
  landedCosts?: LandedCostCalculation[];
  onNavigateTab: (tabId: string) => void;
}

export const PurchaseOverview: React.FC<PurchaseOverviewProps> = ({
  stats,
  purchaseOrders = [],
  recentOrders = [],
  shipments = [],
  recentShipments = [],
  grns = [],
  recentGrns = [],
  requisitions = [],
  suppliers = [],
  threeWayMatches = [],
  landedCosts = [],
  onNavigateTab
}) => {
  const ordersList = purchaseOrders.length > 0 ? purchaseOrders : recentOrders;
  const shipmentsList = shipments.length > 0 ? shipments : recentShipments;
  const grnsList = grns.length > 0 ? grns : recentGrns;
  const reqsList = requisitions || [];

  // Compute live fallbacks if stats is null or incomplete
  const totalPurchaseValue = stats?.totalPurchaseValueInr ?? ordersList.reduce((s, p) => s + (p.grandTotal || 0), 0);
  const totalImportValue = stats?.totalImportValueInr ?? ordersList.filter(p => p.isImport).reduce((s, p) => s + (p.grandTotal || 0), 0);
  const totalDomesticValue = stats?.totalDomesticValueInr ?? ordersList.filter(p => !p.isImport).reduce((s, p) => s + (p.grandTotal || 0), 0);
  const totalOrdersCount = stats?.totalOrders ?? ordersList.length;
  const activeContainersCount = stats?.activeImportShipments ?? shipmentsList.filter(s => s.status !== 'DELIVERED_TO_WAREHOUSE' && s.status !== 'CLOSED').length;
  const clearedContainersCount = stats?.customsClearedShipments ?? shipmentsList.filter(s => s.status === 'CUSTOMS_CLEARED' || s.status === 'DELIVERED_TO_WAREHOUSE').length;
  const dutyPaid = stats?.totalCustomsDutyPaidInr ?? shipmentsList.reduce((s, sh) => s + (sh.customsDutyAmountInr || 0), 0);
  const avgVariance = stats?.averageLandedCostVariancePct ?? (landedCosts.length > 0 ? Number((landedCosts.reduce((s, l) => s + (l.variancePercentage || 0), 0) / landedCosts.length).toFixed(1)) : 0);

  const pendingPOs = stats?.pendingApprovalOrders ?? ordersList.filter(p => p.approvalStatus === 'PENDING').length;
  const pendingGRNs = stats?.pendingGrnCount ?? grnsList.filter(g => g.status === 'DRAFT' || !g.stockUpdated).length;
  const pendingPRs = stats?.pendingRequisitions ?? reqsList.filter(r => r.status === 'PENDING_APPROVAL').length;
  const totalActionItems = pendingPOs + pendingGRNs + pendingPRs;

  return (
    <div className="space-y-6" id="purchase-overview-section">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-sm hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Procurement</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-100">
              {formatCurrency(totalPurchaseValue)}
            </h3>
            <div className="flex items-center space-x-2 mt-1.5 text-xs">
              <span className="text-emerald-400 font-medium">{totalOrdersCount} Total Orders</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{formatCurrency(totalDomesticValue)} Domestic</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-sm hover:border-blue-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Imports & Shipments</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-100">
              {formatCurrency(totalImportValue)}
            </h3>
            <div className="flex items-center space-x-2 mt-1.5 text-xs">
              <span className="text-blue-400 font-medium">{activeContainersCount} Active Containers</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{clearedContainersCount} Cleared</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-sm hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customs & Landed Costs</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-100">
              {formatCurrency(dutyPaid)}
            </h3>
            <div className="flex items-center space-x-2 mt-1.5 text-xs">
              <span className="text-amber-400 font-medium">Customs Duty Paid</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{avgVariance}% Avg Variance</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-sm hover:border-purple-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Action Items</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-purple-400">
              {totalActionItems}
            </h3>
            <div className="flex items-center space-x-2 mt-1.5 text-xs text-slate-400">
              <span>{pendingPOs} POs</span>
              <span>•</span>
              <span>{pendingGRNs} GRNs</span>
              <span>•</span>
              <span>{pendingPRs} PRs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-slate-800/80 to-blue-900/40 border border-emerald-500/30 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-semibold text-emerald-300">Purchase & Import Lifecycle Operations</h4>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Execute complete procurement workflows from Requisition & RFQ Comparison to Import Container Clearance,
              Landed Cost Allocation (FOB to Landed Rate sync), GRN Stock Verification, and 3-Way Matching.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateTab('requisitions')}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-medium rounded-lg border border-slate-600 transition flex items-center space-x-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>New Requisition</span>
            </button>
            <button
              onClick={() => onNavigateTab('orders')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Create Purchase Order</span>
            </button>
            <button
              onClick={() => onNavigateTab('shipments')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Track Import Container</span>
            </button>
            <button
              onClick={() => onNavigateTab('landed-cost')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Landed Cost Engine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Active Import Containers & Recent POs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Import Containers */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-semibold text-slate-100">Active Import Shipments & Containers</h4>
            </div>
            <button
              onClick={() => onNavigateTab('shipments')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
            >
              <span>View All ({(shipmentsList || []).length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {(shipmentsList || []).slice(0, 4).map(ship => (
              <div
                key={ship.id}
                className="p-3 bg-slate-900/60 border border-slate-700/50 rounded-lg hover:border-slate-600 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-400">{ship.shipmentNo}</span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-300 rounded border border-blue-500/20">
                      {ship.containerNumber}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400">
                    {ship.commercialInvoiceCurrency} {formatNumber(ship.commercialInvoiceAmountForeign || 0)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>{ship.supplierName} ({ship.originCountry})</span>
                  <span>ETA: {ship.eta}</span>
                </div>

                <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Truck className="w-3 h-3 text-slate-500" />
                    <span>{ship.destinationPort}</span>
                  </span>
                  <span className="font-semibold px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                    {(ship.status || '').replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
            {(shipmentsList || []).length === 0 && (
              <p className="text-xs text-slate-500 py-4 text-center">No active import containers found.</p>
            )}
          </div>
        </div>

        {/* Recent Purchase Orders */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-semibold text-slate-100">Recent Purchase Orders</h4>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
            >
              <span>View All ({(ordersList || []).length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {(ordersList || []).slice(0, 4).map(po => {
              const poItems = po.items || [];
              const totalQty = poItems.reduce((s, it) => s + (it.quantity || 0), 0);
              return (
                <div
                  key={po.id}
                  className="p-3 bg-slate-900/60 border border-slate-700/50 rounded-lg hover:border-slate-600 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-emerald-400">{po.purchaseNo}</span>
                      {po.isImport ? (
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                          IMPORT
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                          DOMESTIC
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-100">
                      {formatCurrency(po.grandTotal || 0)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[200px]">{po.supplierName}</span>
                    <span>{po.date}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-400">
                      {poItems.length} item(s) • Recv: {po.totalReceivedQty || 0} / {totalQty}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        po.approvalStatus === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : po.approvalStatus === 'REJECTED'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {po.approvalStatus}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {po.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {(ordersList || []).length === 0 && (
              <p className="text-xs text-slate-500 py-4 text-center">No recent purchase orders logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
