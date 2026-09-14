import React from 'react';
import { SalesOrder, CompanySettings } from '../../types/index.js';
import { formatCurrency, formatNumber, numberToWords } from '../../utils/paperMath.js';
import { Printer, ArrowLeft, Building, CheckCircle2, ShieldCheck } from 'lucide-react';

interface PrintableOrderSlipProps {
  order: SalesOrder;
  settings: CompanySettings;
  onBack: () => void;
}

export const PrintableOrderSlip: React.FC<PrintableOrderSlipProps> = ({ order, settings, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const totalWeightKgs = order.items.reduce((sum, it) => sum + (it.quantityKgs || 0), 0);
  const totalReams = order.items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-900/90 text-slate-900 p-4 md:p-8 flex flex-col items-center">
      
      {/* Top Action Bar (hidden on print) */}
      <div className="w-full max-w-4xl flex items-center justify-between bg-slate-800 text-white p-4 rounded-xl shadow-lg mb-6 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-bold bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Order Management</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-emerald-400 font-semibold">
            Sales Order Confirmation #{order.orderNo}
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Confirmation Slip</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div
        id="printable-order-slip"
        className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-2xl print:shadow-none print:p-0 border border-slate-200 print:border-none text-slate-800"
      >
        {/* Header */}
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
                <span>CIN: <strong className="text-slate-900">{settings.cin}</strong></span>
                <span>Phone: <strong className="text-slate-900">{settings.phone}</strong></span>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-emerald-900 text-white px-3 py-1.5 rounded-md text-xs font-extrabold tracking-wider uppercase mb-2">
                Sales Order Confirmation
              </div>
              <div className="text-xs space-y-1 text-slate-700">
                <div>Order No: <strong className="text-slate-950">{order.orderNo}</strong></div>
                <div>Date: <strong className="text-slate-950">{order.orderDate}</strong></div>
                <div>Expected Delivery: <strong className="text-slate-950">{order.expectedDeliveryDate || 'Immediate'}</strong></div>
                <div>Status: <span className="font-bold uppercase text-emerald-700">{order.status}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6 text-xs">
          <div>
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-700" />
              <span>Customer (Buyer / Bill To)</span>
            </div>
            <div className="font-bold text-sm text-slate-950">{order.customerName}</div>
            <div className="text-slate-600 mt-1">{order.customerAddress || order.billTo?.address}</div>
            <div className="mt-2 space-y-0.5 text-slate-700 font-medium">
              <div>GSTIN: <strong>{order.customerGstin || 'URP / Not Provided'}</strong></div>
              <div>Phone: <strong>{order.customerPhone || 'N/A'}</strong></div>
              <div>Email: <strong>{order.customerEmail || 'N/A'}</strong></div>
              <div>PO Number: <strong>{order.customerPoNumber || 'N/A'}</strong> ({order.customerPoDate || 'N/A'})</div>
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Delivery & Payment Terms</span>
            </div>
            <div className="space-y-1 text-slate-700">
              <div>Delivery Address: <strong className="text-slate-900">{order.deliveryAddress || order.shipTo?.address || 'Same as Billing'}</strong></div>
              <div>Payment Terms: <strong className="text-slate-900">{order.paymentTerms || 'Net 30 Days'}</strong></div>
              <div>Transporter / Delivery: <strong className="text-slate-900">{order.transporterName || 'ABPPL Dedicated Fleet'}</strong></div>
              <div>Vehicle No: <strong className="text-slate-900">{order.vehicleNumber || 'To be assigned'}</strong></div>
              <div>Payment Status: <strong className="text-emerald-700 uppercase">{order.paymentStatus || 'UNPAID'}</strong></div>
            </div>
          </div>
        </div>

        {/* Paper Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-900 text-white font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Paper Product / Grade</th>
                <th className="py-2.5 px-3">GSM & Size</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3 text-right">Approx Wt (Kg)</th>
                <th className="py-2.5 px-3 text-right">Rate / Unit</th>
                <th className="py-2.5 px-3 text-right">Disc %</th>
                <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                <th className="py-2.5 px-3 text-right">GST (18%)</th>
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500 font-semibold">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-950">
                    {item.productName}
                    {item.brand && <span className="block text-[10px] text-slate-500 font-normal">Brand: {item.brand}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    <span className="font-semibold">{item.gsm} GSM</span> | {item.sizeInches || 'A4'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {formatNumber(item.quantity)} {item.unit || 'Reams'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700 font-medium">
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
                    {formatCurrency(item.gstAmount)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-950">
                    {formatCurrency(item.netAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
              <tr>
                <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[11px]">Total Quantity & Weight:</td>
                <td className="py-2.5 px-3 text-right text-emerald-800 font-extrabold">{formatNumber(totalReams)} Reams</td>
                <td className="py-2.5 px-3 text-right text-emerald-800 font-extrabold">{formatNumber(totalWeightKgs)} Kg</td>
                <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-[11px]">Taxable Subtotal:</td>
                <td className="py-2.5 px-3 text-right text-slate-950">{formatCurrency(order.taxableAmount)}</td>
                <td className="py-2.5 px-3 text-right text-slate-950">{formatCurrency(order.gstTotal)}</td>
                <td className="py-2.5 px-3 text-right text-emerald-900 font-extrabold">{formatCurrency(order.grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Calculation Breakdown & Words */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mb-8 text-xs">
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Amount in Words:</span>
              <p className="font-bold text-slate-950 mt-0.5 capitalize">
                INR {numberToWords(order.grandTotal)} Only
              </p>
            </div>

            {order.notes && (
              <div>
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Order Notes / Special Instructions:</span>
                <p className="text-slate-700 mt-0.5">{order.notes}</p>
              </div>
            )}

            <div>
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Bank Transfer Details:</span>
              <p className="text-slate-700 mt-0.5">
                Bank: <strong>{settings.bankName}</strong> | A/C: <strong>{settings.accountNumber}</strong> | IFSC: <strong>{settings.ifscCode}</strong> | Branch: <strong>{settings.branchName}</strong>
              </p>
            </div>
          </div>

          <div className="space-y-2 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
            <div className="flex justify-between text-slate-700">
              <span>Gross Subtotal:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Total Trade Discount:</span>
                <span className="font-semibold">-{formatCurrency(order.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700">
              <span>Taxable Value:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>CGST (9%):</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.cgstTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>SGST (9%):</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.sgstTotal)}</span>
            </div>
            {order.freightCharges > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Transport / Freight Charges:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(order.freightCharges)}</span>
              </div>
            )}
            <div className="border-t-2 border-emerald-800 pt-2 flex justify-between text-sm font-black text-emerald-950">
              <span>Grand Total:</span>
              <span>{formatCurrency(order.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-[11px] pt-1 text-slate-600">
              <span>Paid: <strong className="text-emerald-700">{formatCurrency(order.paidAmount || 0)}</strong></span>
              <span>Balance Due: <strong className="text-rose-700">{formatCurrency(order.balanceDue || 0)}</strong></span>
            </div>
          </div>
        </div>

        {/* Footer & Signatures */}
        <div className="grid grid-cols-2 gap-8 border-t border-slate-300 pt-6 text-xs text-slate-700">
          <div>
            <p className="font-bold text-slate-900 mb-1">Standard Wholesale Terms:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
              <li>Goods once sold will only be accepted in case of manufacturer defect.</li>
              <li>Interest @ 18% p.a. will be charged on overdue payments beyond credit term.</li>
              <li>Subject to Mumbai Jurisdiction.</li>
            </ul>
          </div>

          <div className="text-right flex flex-col justify-between items-end">
            <div>
              <p className="font-bold text-slate-900">For {settings.companyName || 'ABPPL PAPER WHOLESALERS PVT LTD'}</p>
            </div>
            <div className="mt-12 pt-2 border-t border-slate-400 w-48 text-center text-[11px] font-bold text-slate-800">
              Authorized Signatory
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
