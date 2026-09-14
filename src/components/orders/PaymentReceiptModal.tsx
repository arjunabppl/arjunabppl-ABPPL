import React, { useState } from 'react';
import { SalesOrder } from '../../types/index.js';
import { formatCurrency } from '../../utils/paperMath.js';
import { CreditCard, X, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';

interface PaymentReceiptModalProps {
  order: SalesOrder;
  onClose: () => void;
  onConfirmPayment: (data: {
    amount: number;
    paymentDate: string;
    paymentMode: string;
    referenceNo: string;
    bankName: string;
    notes: string;
  }) => Promise<void>;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  order,
  onClose,
  onConfirmPayment
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balance = order.balanceDue !== undefined ? order.balanceDue : Math.max(0, order.grandTotal - (order.paidAmount || 0));

  const [amount, setAmount] = useState<number>(balance > 0 ? balance : order.grandTotal);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<string>('BANK_TRANSFER');
  const [referenceNo, setReferenceNo] = useState<string>(`NEFT-${Date.now().toString().slice(-6)}`);
  const [bankName, setBankName] = useState<string>('HDFC Bank');
  const [notes, setNotes] = useState<string>(`Full settlement for Sales Order #${order.orderNo}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      await onConfirmPayment({
        amount: Number(amount),
        paymentDate,
        paymentMode,
        referenceNo,
        bankName,
        notes
      });
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Record Payment & Issue Receipt</h2>
              <p className="text-xs text-slate-400">
                Order: <strong className="text-emerald-400">#{order.orderNo}</strong> • {order.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Outstanding Snapshot */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Grand Total</span>
              <span className="font-extrabold text-slate-900">{formatCurrency(order.grandTotal)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Paid So Far</span>
              <span className="font-extrabold text-emerald-700">{formatCurrency(order.paidAmount || 0)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Balance Due</span>
              <span className="font-extrabold text-rose-700">{formatCurrency(balance)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Amount to Receive (₹) *
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-emerald-950 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="CHEQUE">Bank Cheque</option>
                <option value="UPI">UPI / QR Payment</option>
                <option value="CASH">Cash Deposit</option>
                <option value="CREDIT_NOTE">Credit Note Adjustment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reference / UTR / Cheque No *
              </label>
              <input
                type="text"
                required
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="E.g. CMS982173"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Bank / Gateway Name
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="E.g. HDFC Bank, ICICI, SBI..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Receipt Remarks / Internal Note
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-emerald-500"
              placeholder="E.g. Received via RTGS..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition shadow-md flex items-center space-x-2"
            >
              {submitting ? <span>Recording...</span> : <span>Generate Official Receipt</span>}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
