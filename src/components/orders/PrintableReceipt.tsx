import React from 'react';
import { PaymentReceipt, CompanySettings } from '../../types/index.js';
import { formatCurrency, numberToWords } from '../../utils/paperMath.js';
import { Printer, ArrowLeft, Building, CreditCard, CheckCircle2, ShieldCheck } from 'lucide-react';

interface PrintableReceiptProps {
  receipt: PaymentReceipt;
  settings: CompanySettings;
  onBack: () => void;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ receipt, settings, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900/90 text-slate-900 p-4 md:p-8 flex flex-col items-center">
      
      {/* Top Action Bar (hidden on print) */}
      <div className="w-full max-w-3xl flex items-center justify-between bg-slate-800 text-white p-4 rounded-xl shadow-lg mb-6 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-bold bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Receipts</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-emerald-400 font-semibold">
            Official Payment Receipt #{receipt.receiptNo}
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Money Receipt</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div
        id="printable-payment-receipt"
        className="w-full max-w-3xl bg-white p-8 rounded-xl shadow-2xl print:shadow-none print:p-0 border border-slate-200 print:border-none text-slate-800"
      >
        {/* Receipt Header */}
        <div className="border-b-2 border-emerald-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-emerald-950">
                {settings.companyName || 'ABPPL PAPER WHOLESALERS PVT LTD'}
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-1">
                {settings.address}, {settings.city}, {settings.state} - {settings.pincode}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700 font-semibold mt-2">
                <span>GSTIN: <strong className="text-slate-900">{settings.gstin}</strong></span>
                <span>PAN: <strong className="text-slate-900">{settings.pan}</strong></span>
                <span>Accounts Dept: <strong className="text-slate-900">{settings.phone}</strong></span>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-emerald-900 text-white px-3 py-1.5 rounded-md text-xs font-extrabold tracking-wider uppercase mb-2">
                OFFICIAL PAYMENT RECEIPT
              </div>
              <div className="text-xs space-y-1 text-slate-700">
                <div>Receipt No: <strong className="text-slate-950">{receipt.receiptNo}</strong></div>
                <div>Date: <strong className="text-slate-950">{receipt.paymentDate}</strong></div>
                <div>Sales Order: <strong className="text-emerald-800 font-extrabold">{receipt.orderNo || 'N/A'}</strong></div>
                {receipt.invoiceNo && <div>Invoice Ref: <strong className="text-slate-900">{receipt.invoiceNo}</strong></div>}
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="space-y-6 text-xs text-slate-800">
          
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <span className="text-slate-600 font-medium">Received with thanks from:</span>
              <strong className="text-sm font-bold text-slate-950">{receipt.customerName}</strong>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <span className="text-slate-600 font-medium">The sum of Rupees (in words):</span>
              <span className="font-extrabold text-emerald-950 capitalize">
                INR {numberToWords(receipt.amount)} Only
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Payment Mode</span>
                <span className="font-bold text-slate-900 uppercase">{receipt.paymentMode}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Reference / UTR No</span>
                <span className="font-bold text-slate-900">{receipt.referenceNo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Bank / Channel</span>
                <span className="font-bold text-slate-900">{receipt.bankName || 'Direct Transfer'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Status</span>
                <span className="inline-flex items-center text-emerald-700 font-extrabold">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  SUCCESS
                </span>
              </div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="flex justify-between items-center p-5 bg-emerald-50 rounded-xl border-2 border-emerald-600">
            <div>
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">Amount Received</span>
              <span className="text-xs text-emerald-700">Credited to ABPPL Wholesalers A/C</span>
            </div>
            <div className="text-2xl font-black text-emerald-950">
              {formatCurrency(receipt.amount)}
            </div>
          </div>

          {receipt.notes && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 block mb-0.5">Remarks / Settlement Note:</span>
              <p className="text-slate-600">{receipt.notes}</p>
            </div>
          )}

          {/* Footer & Signature */}
          <div className="grid grid-cols-2 gap-8 border-t border-slate-300 pt-8 mt-8">
            <div className="text-slate-500 text-[11px] space-y-1">
              <p>• Computer-generated payment receipt, verified against bank statement.</p>
              <p>• Subject to realisation of cheque / NEFT clearance.</p>
              <p>• Collected / Processed by: <strong className="text-slate-800">{receipt.collectedBy || 'Accounts Team'}</strong></p>
            </div>

            <div className="text-right flex flex-col justify-between items-end">
              <p className="font-bold text-slate-900">For {settings.companyName || 'ABPPL PAPER WHOLESALERS PVT LTD'}</p>
              <div className="mt-12 pt-2 border-t border-slate-400 w-48 text-center text-[11px] font-bold text-slate-800">
                Accounts Officer / Cashier
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
