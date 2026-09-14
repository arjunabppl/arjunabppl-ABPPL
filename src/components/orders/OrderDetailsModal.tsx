import React, { useState, useEffect } from 'react';
import { SalesOrder, CompanySettings, Transporter, Warehouse, OrderStatusHistoryEntry, User } from '../../types/index.js';
import { formatCurrency, formatNumber } from '../../utils/paperMath.js';
import { api } from '../../services/api.js';
import {
  X, CheckCircle2, Clock, Truck, Package, DollarSign,
  Printer, FileText, AlertCircle, Building, Calendar, ShieldCheck,
  ChevronRight, ArrowRight, UserCheck, RefreshCw, Layers
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: SalesOrder;
  currentUser: User;
  settings: CompanySettings;
  transporters: Transporter[];
  warehouses: Warehouse[];
  onClose: () => void;
  onRefresh: () => void;
  onOpenPackingModal: (order: SalesOrder) => void;
  onOpenDispatchModal: (order: SalesOrder) => void;
  onOpenDeliverModal: (order: SalesOrder) => void;
  onOpenPaymentModal: (order: SalesOrder) => void;
  onOpenOrderSlip: (order: SalesOrder) => void;
  onOpenDeliveryChallanSlip: (challanId: string) => void;
  onOpenReceiptSlip: (receiptId: string) => void;
  onOpenInvoiceView: (invoiceId: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  currentUser,
  settings,
  transporters,
  warehouses,
  onClose,
  onRefresh,
  onOpenPackingModal,
  onOpenDispatchModal,
  onOpenDeliverModal,
  onOpenPaymentModal,
  onOpenOrderSlip,
  onOpenDeliveryChallanSlip,
  onOpenReceiptSlip,
  onOpenInvoiceView
}) => {
  const [timeline, setTimeline] = useState<OrderStatusHistoryEntry[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const userRole = currentUser?.role || 'customer';
  const isAdminOrTeam = ['admin', 'superadmin', 'manager', 'sales', 'inventory', 'accounts'].includes(userRole);
  const isCustomerOrDistributor = ['customer', 'distributor'].includes(userRole);

  useEffect(() => {
    loadTimeline();
  }, [order.id]);

  const loadTimeline = async () => {
    try {
      setLoadingTimeline(true);
      const data = await api.getOrderTimeline(order.id);
      setTimeline(data || []);
    } catch (err) {
      console.error('Error fetching order timeline', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      setErrorMessage(null);
      await api.approveSalesOrder(order.id);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to approve order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setErrorMessage('Please specify reason for rejection/cancellation');
      return;
    }
    try {
      setActionLoading(true);
      setErrorMessage(null);
      await api.rejectSalesOrder(order.id, rejectReason);
      setShowRejectBox(false);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reject order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      setActionLoading(true);
      setErrorMessage(null);
      const inv = await api.createInvoiceFromSalesOrder(order.id);
      onRefresh();
      if (inv && inv.id) {
        onOpenInvoiceView(inv.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to convert to Tax Invoice');
    } finally {
      setActionLoading(false);
    }
  };

  // Status step progression
  const steps = [
    { label: 'Submitted', key: 'SUBMITTED' },
    { label: 'Approved', key: 'APPROVED' },
    { label: 'Stock Reserved', key: 'STOCK_RESERVED' },
    { label: 'Packed', key: 'PACKED' },
    { label: 'Dispatched', key: 'DISPATCHED' },
    { label: 'Delivered', key: 'DELIVERED' }
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'DRAFT': return 0;
      case 'SUBMITTED': return 1;
      case 'APPROVED': return 2;
      case 'STOCK_RESERVED':
      case 'PROCESSING': return 3;
      case 'PACKED': return 4;
      case 'DISPATCHED':
      case 'IN_TRANSIT':
      case 'PARTIALLY_DELIVERED': return 5;
      case 'DELIVERED': return 6;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);
  const totalWeightKgs = order.items.reduce((sum, it) => sum + (it.quantityKgs || 0), 0);
  const totalReams = order.items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-150">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight">Sales Order #{order.orderNo}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                  order.status === 'DELIVERED' ? 'bg-emerald-500 text-white' :
                  order.status === 'DISPATCHED' ? 'bg-indigo-600 text-white' :
                  order.status === 'PACKED' ? 'bg-blue-600 text-white' :
                  order.status === 'APPROVED' ? 'bg-teal-600 text-white' :
                  order.status === 'CANCELLED' || order.status === 'REJECTED' ? 'bg-rose-600 text-white' :
                  'bg-amber-500 text-slate-950'
                }`}>
                  {(order.status || '').replace(/_/g, ' ')}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  order.paymentStatus === 'PAID' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' :
                  order.paymentStatus === 'PARTIAL' ? 'bg-amber-950 text-amber-300 border border-amber-500' :
                  'bg-rose-950 text-rose-300 border border-rose-500'
                }`}>
                  Payment: {order.paymentStatus || 'UNPAID'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ordered on {order.orderDate} • Customer: <strong className="text-emerald-400">{order.customerName}</strong>
                {order.customerPoNumber && ` • PO #${order.customerPoNumber}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onOpenOrderSlip(order)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition border border-slate-700"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Progress Tracker (Step pipeline) */}
          {order.status !== 'CANCELLED' && order.status !== 'REJECTED' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                Order Fulfillment Pipeline
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {steps.map((st, idx) => {
                  const isDone = currentStepIdx > idx;
                  const isCurrent = currentStepIdx === idx + 1;
                  return (
                    <div
                      key={st.key}
                      className={`p-2 rounded-lg border text-center transition ${
                        isDone
                          ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950 font-bold'
                          : isCurrent
                          ? 'bg-emerald-600 border-emerald-700 text-white font-black shadow-xs'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider">{idx + 1}. {st.label}</div>
                      <div className="text-[11px] font-bold mt-0.5">
                        {isDone ? '✓ Completed' : isCurrent ? '● Active' : 'Pending'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Action Bar for Roles */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-bold text-emerald-950 uppercase tracking-wider block text-[10px]">Available Workflow Actions:</span>
              <span className="text-slate-600">Perform state transitions and trigger logistics or accounting records.</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              
              {/* Admin Actions */}
              {isAdminOrTeam && (
                <>
                  {['DRAFT', 'SUBMITTED'].includes(order.status) && (
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Reserve Stock</span>
                    </button>
                  )}

                  {['APPROVED', 'STOCK_RESERVED', 'PROCESSING'].includes(order.status) && (
                    <button
                      onClick={() => onOpenPackingModal(order)}
                      disabled={actionLoading}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center space-x-1.5"
                    >
                      <Package className="w-4 h-4" />
                      <span>Pack in Godown</span>
                    </button>
                  )}

                  {['PACKED', 'APPROVED', 'STOCK_RESERVED', 'PROCESSING'].includes(order.status) && (
                    <button
                      onClick={() => onOpenDispatchModal(order)}
                      disabled={actionLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center space-x-1.5"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Dispatch Truck (Issue Challan)</span>
                    </button>
                  )}

                  {['DISPATCHED', 'IN_TRANSIT', 'PARTIALLY_DELIVERED'].includes(order.status) && (
                    <button
                      onClick={() => onOpenDeliverModal(order)}
                      disabled={actionLoading}
                      className="bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Delivery</span>
                    </button>
                  )}

                  {order.balanceDue !== 0 && (
                    <button
                      onClick={() => onOpenPaymentModal(order)}
                      disabled={actionLoading}
                      className="bg-emerald-800 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center space-x-1.5"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Record Payment</span>
                    </button>
                  )}

                  {!order.invoiceId && (
                    <button
                      onClick={handleCreateInvoice}
                      disabled={actionLoading}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs flex items-center space-x-1.5"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Create GST Invoice</span>
                    </button>
                  )}

                  {order.status !== 'CANCELLED' && order.status !== 'REJECTED' && order.status !== 'DELIVERED' && (
                    <button
                      onClick={() => setShowRejectBox(!showRejectBox)}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-800 px-3 py-2 rounded-xl text-xs font-bold transition"
                    >
                      Cancel / Reject
                    </button>
                  )}
                </>
              )}

              {/* Customer / Distributor Actions */}
              {isCustomerOrDistributor && (
                <>
                  {order.status === 'DRAFT' && (
                    <button
                      onClick={handleApprove}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black transition shadow-xs"
                    >
                      Submit Order Now
                    </button>
                  )}
                  {order.invoiceId && (
                    <button
                      onClick={() => onOpenInvoiceView(order.invoiceId!)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Download Tax Invoice</span>
                    </button>
                  )}
                </>
              )}

            </div>
          </div>

          {/* Cancellation Reason Dialog */}
          {showRejectBox && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  Cancellation / Rejection Reason
                </span>
                <button onClick={() => setShowRejectBox(false)} className="text-rose-500 hover:text-rose-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (e.g., Customer requested change, out of stock, credit limit exceeded)..."
                className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-rose-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowRejectBox(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Back
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition"
                >
                  Confirm Rejection & Release Stock
                </button>
              </div>
            </div>
          )}

          {/* Customer & Shipping Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-700" />
                <span>Customer Details</span>
              </div>
              <div className="font-bold text-sm text-slate-950">{order.customerName}</div>
              <div className="text-slate-600">{order.customerAddress || 'Address on file'}</div>
              <div className="text-slate-700 pt-1">
                <div>GSTIN: <strong>{order.customerGstin || 'URP'}</strong></div>
                <div>Phone: <strong>{order.customerPhone || 'N/A'}</strong></div>
                <div>Email: <strong>{order.customerEmail || 'N/A'}</strong></div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Dispatch & Logistics</span>
              </div>
              <div className="text-slate-700 space-y-1">
                <div>Delivery Address: <strong className="text-slate-900">{order.deliveryAddress || 'Standard Delivery Address'}</strong></div>
                <div>Transporter: <strong className="text-slate-900">{order.transporterName || 'Pending Assignment'}</strong></div>
                <div>Vehicle No: <strong className="text-slate-900">{order.vehicleNumber || 'Unassigned'}</strong></div>
                <div>LR / GR No: <strong className="text-emerald-800 font-extrabold">{order.lrGrNo || 'Pending'}</strong></div>
                <div>Expected Delivery: <strong className="text-slate-900">{order.expectedDeliveryDate || 'Standard Schedule'}</strong></div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Commercial & Accounting</span>
              </div>
              <div className="text-slate-700 space-y-1">
                <div>Payment Terms: <strong className="text-slate-900">{order.paymentTerms || 'Net 30 Days'}</strong></div>
                <div>PO Number: <strong className="text-slate-900">{order.customerPoNumber || 'N/A'}</strong></div>
                <div>Grand Total: <strong className="text-slate-950 font-black">{formatCurrency(order.grandTotal)}</strong></div>
                <div>Paid: <strong className="text-emerald-700 font-bold">{formatCurrency(order.paidAmount || 0)}</strong></div>
                <div>Balance Due: <strong className="text-rose-700 font-extrabold">{formatCurrency(order.balanceDue || 0)}</strong></div>
              </div>
            </div>
          </div>

          {/* Paper Products Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between text-xs font-bold">
              <span>Paper Items & Technical Specifications</span>
              <span className="text-emerald-400">Total: {formatNumber(totalReams)} Reams ({formatNumber(totalWeightKgs)} Kg)</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Product / Grade</th>
                  <th className="py-2.5 px-3">GSM & Size</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Weight (Kg)</th>
                  <th className="py-2.5 px-3 text-right">Rate / Ream</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-3 text-right">Taxable</th>
                  <th className="py-2.5 px-3 text-right">GST</th>
                  <th className="py-2.5 px-3 text-right">Net Total</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-950">{item.productName}</div>
                      {item.brand && <div className="text-[10px] text-slate-500">Brand: {item.brand}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <span className="font-semibold">{item.gsm} GSM</span> | {item.sizeInches || 'A4'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatNumber(item.quantity)} {item.unit || 'Reams'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {formatNumber(item.quantityKgs || 0)} Kg
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {item.discountPct ? `${item.discountPct}%` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                      {formatCurrency(item.taxableValue)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {formatCurrency(item.gstAmount)} ({item.gstRate || 18}%)
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-950">
                      {formatCurrency(item.netAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {item.stockReserved ? 'Reserved' : 'Available'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Amount Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Notes & Special Instructions:</span>
              <p className="text-slate-700">{order.notes || 'Standard B2B paper wholesale order. Packaging in water-resistant poly-wrap bundles.'}</p>
              
              {order.creditLimitExceeded && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                  <span><strong>Credit Limit Warning:</strong> Order value exceeded customer credit limit during placement. Approved under manager authorization.</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Gross Subtotal:</span>
                <span className="font-bold text-slate-900">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Trade Discount:</span>
                  <span className="font-bold">-{formatCurrency(order.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-700">
                <span>Taxable Amount:</span>
                <span className="font-bold text-slate-900">{formatCurrency(order.taxableAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>CGST (9%):</span>
                <span className="font-bold text-slate-900">{formatCurrency(order.cgstTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>SGST (9%):</span>
                <span className="font-bold text-slate-900">{formatCurrency(order.sgstTotal)}</span>
              </div>
              {order.freightCharges > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Freight / Transport:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(order.freightCharges)}</span>
                </div>
              )}
              <div className="border-t-2 border-emerald-700 pt-2 flex justify-between text-sm font-black text-emerald-950">
                <span>Grand Total:</span>
                <span>{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline & Audit Logs */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Chronological Order Activity Timeline & Audit Trail
                </h3>
              </div>
              <button
                onClick={loadTimeline}
                className="text-slate-400 hover:text-slate-700 text-xs p-1"
                title="Refresh Timeline"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingTimeline ? (
              <div className="py-4 text-center text-xs text-slate-500">Loading activity history...</div>
            ) : timeline.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400">No activity recorded yet.</div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {timeline.map((entry, idx) => (
                  <div key={entry.id || idx} className="relative text-xs">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white shadow-xs" />
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-950 uppercase">{(entry.toStatus || '').replace(/_/g, ' ')}</span>
                      <span className="text-[11px] text-slate-500">by <strong className="text-slate-800">{entry.changedByName}</strong> ({entry.changedByRole})</span>
                      <span className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    {entry.notes && (
                      <p className="text-slate-600 mt-0.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-between items-center text-xs shrink-0">
          <div className="text-slate-500">
            Order Reference: <strong className="text-slate-800">ABPPL-{order.orderNo}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};
