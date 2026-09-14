import React from 'react';
import { Invoice, CompanySettings } from '../../types/index.js';
import { formatCurrency, formatNumber, calculateGst } from '../../utils/paperMath.js';
import { Printer, ArrowLeft, Download } from 'lucide-react';

interface PrintableInvoiceProps {
  invoice: Invoice;
  settings: CompanySettings;
  onBack: () => void;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  invoice,
  settings,
  onBack
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isQuotation = invoice.type === 'QUOTATION';

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 text-slate-900">
      
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to List</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-lg transition shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print {isQuotation ? 'Quotation' : 'Tax Invoice'}</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Canvas */}
      <div
        id="printable-document"
        className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 text-slate-800 font-sans"
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-emerald-700 text-white font-black text-xl flex items-center justify-center">
                A
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-wider">
                {settings.companyName || 'ABPPL'}
              </h1>
            </div>
            <p className="text-xs font-bold text-emerald-800 mt-1">{settings.tagline}</p>
            <p className="text-xs text-slate-600 mt-0.5">{settings.address}, {settings.city}, {settings.state} - {settings.pincode}</p>
            <p className="text-xs text-slate-600">Phone: {settings.phone} | Email: {settings.email}</p>
            <p className="text-xs font-bold text-slate-900 mt-1">GSTIN: <span className="font-mono text-emerald-900">{settings.gstin}</span></p>
          </div>

          <div className="text-right">
            <div className="inline-block bg-slate-900 text-white font-black text-sm uppercase px-4 py-1.5 rounded tracking-widest">
              {isQuotation ? 'QUOTATION' : 'TAX INVOICE'}
            </div>
            <div className="mt-3 space-y-1 text-xs">
              <p className="font-bold text-slate-900">Doc No: <span className="font-mono text-emerald-900">{invoice.invoiceNo}</span></p>
              <p className="text-slate-600">Date: <span className="font-medium text-slate-900">{invoice.date}</span></p>
              <p className="text-slate-600">Payment Due: <span className="font-medium text-slate-900">{invoice.dueDate}</span></p>
              {!isQuotation && (
                <div className="mt-1">
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                    invoice.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    invoice.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    Status: {invoice.paymentStatus}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Billed To, Shipped To & Dispatch Reference */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-5 text-xs">
          {/* Bill To */}
          <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
            <h3 className="font-bold uppercase text-emerald-800 tracking-wider text-[10px] mb-1 flex items-center justify-between">
              <span>Bill To (Buyer)</span>
              <span className="text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-700 font-mono">GST INVOICE</span>
            </h3>
            <p className="font-extrabold text-sm text-slate-900">{invoice.billTo?.companyName || invoice.customerName}</p>
            {invoice.billTo?.contactPerson && (
              <p className="text-slate-600 text-[11px]">Attn: {invoice.billTo.contactPerson}</p>
            )}
            <p className="text-slate-700 mt-1 whitespace-pre-line leading-tight text-[11px]">{invoice.billTo?.address || invoice.customerAddress || 'Address not provided'}</p>
            <p className="text-slate-700 text-[11px] mt-0.5">{invoice.billTo?.city ? `${invoice.billTo.city}, ${invoice.billTo.state || ''} - ${invoice.billTo.pincode || ''}` : ''}</p>
            <p className="text-slate-700 text-[11px] mt-1">Phone: <span className="font-medium">{invoice.billTo?.phone || invoice.customerPhone || 'N/A'}</span></p>
            <p className="font-bold text-slate-900 mt-1 text-[11px]">GSTIN: <span className="font-mono text-emerald-900">{invoice.billTo?.gstin || invoice.customerGstin || 'URP'}</span></p>
          </div>

          {/* Ship To */}
          <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
            <h3 className="font-bold uppercase text-blue-800 tracking-wider text-[10px] mb-1 flex items-center justify-between">
              <span>Ship To (Consignee)</span>
              <span className="text-[9px] bg-blue-50 px-1.5 py-0.5 rounded text-blue-700">DELIVERY DESTINATION</span>
            </h3>
            <p className="font-extrabold text-sm text-slate-900">{invoice.shipTo?.companyName || invoice.shipTo?.name || invoice.customerName}</p>
            {invoice.shipTo?.contactPerson && (
              <p className="text-slate-600 text-[11px]">Contact: {invoice.shipTo.contactPerson}</p>
            )}
            <p className="text-slate-700 mt-1 whitespace-pre-line leading-tight text-[11px]">{invoice.shipTo?.address || invoice.customerAddress || 'Same as Billing Address'}</p>
            <p className="text-slate-700 text-[11px] mt-0.5">{invoice.shipTo?.city ? `${invoice.shipTo.city}, ${invoice.shipTo.state || ''} - ${invoice.shipTo.pincode || ''}` : ''}</p>
            <p className="text-slate-700 text-[11px] mt-1">Phone: <span className="font-medium">{invoice.shipTo?.phone || invoice.customerPhone || 'N/A'}</span></p>
            <p className="font-bold text-slate-900 mt-1 text-[11px]">GSTIN: <span className="font-mono text-blue-900">{invoice.shipTo?.gstin || invoice.customerGstin || 'URP'}</span></p>
          </div>

          {/* Logistics & References */}
          <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs space-y-1 text-[11px]">
            <h3 className="font-bold uppercase text-slate-600 tracking-wider text-[10px] mb-1">
              Order & Logistics Info
            </h3>
            <div className="flex justify-between border-b border-slate-100 pb-0.5">
              <span className="text-slate-500">Sales Order Ref:</span>
              <span className="font-bold text-slate-900">{invoice.orderReference || invoice.salesOrderNo || invoice.poNumber || 'Direct Sale'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-0.5">
              <span className="text-slate-500">Dispatch / Challan Ref:</span>
              <span className="font-bold text-slate-900">{invoice.deliveryDispatchRef || 'CH-DIRECT'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-0.5">
              <span className="text-slate-500">Transporter:</span>
              <span className="font-semibold text-slate-900">{invoice.transporterName || 'Vijay Logistics'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-0.5">
              <span className="text-slate-500">Truck / Vehicle No:</span>
              <span className="font-mono font-bold text-slate-900">{invoice.vehicleNumber || 'MH-04-FK-9921'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-0.5">
              <span className="text-slate-500">LR / GR No:</span>
              <span className="font-mono font-semibold text-slate-800">{invoice.lrGrNo || 'VL-9982'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-0.5">
              <span className="text-slate-500">Payment Terms:</span>
              <span className="font-semibold text-emerald-800">{invoice.paymentTerms || 'Net 30 Days'}</span>
            </div>
            {invoice.ewayBillNo && (
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-500">E-Way Bill:</span>
                <span className="font-mono text-slate-900">{invoice.ewayBillNo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Item Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase">
                <th className="p-2 border border-slate-800 text-center">#</th>
                <th className="p-2 border border-slate-800">Paper Item Description</th>
                <th className="p-2 border border-slate-800 text-center">GSM / Size</th>
                <th className="p-2 border border-slate-800 text-right">Quantity</th>
                <th className="p-2 border border-slate-800 text-right">Total (Kgs)</th>
                <th className="p-2 border border-slate-800 text-right">Rate (₹)</th>
                <th className="p-2 border border-slate-800 text-right">Disc %</th>
                <th className="p-2 border border-slate-800 text-right">Taxable (₹)</th>
                <th className="p-2 border border-slate-800 text-right">GST 18%</th>
                <th className="p-2 border border-slate-800 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => {
                const disc = ((item.quantity * item.rate) * (item.discountPct || 0)) / 100;
                const taxable = item.taxableValue || ((item.quantity * item.rate) - disc);
                return (
                  <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-2 border border-slate-200 font-medium text-slate-500 text-center">{idx + 1}</td>
                    <td className="p-2 border border-slate-200 font-bold text-slate-900">
                      {item.productName}
                      <div className="text-[10px] text-slate-500 font-normal">Brand: {item.brand || item.category || 'Standard'} {item.code ? `| Code: ${item.code}` : ''}</div>
                    </td>
                    <td className="p-2 border border-slate-200 text-center font-mono">
                      {item.gsm ? `${item.gsm} GSM` : '-'} {item.sizeInches ? `(${item.sizeInches}")` : ''}
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-bold text-slate-900">
                      {formatNumber(item.quantity)} {item.unit || 'Ream'}
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-mono font-medium text-emerald-800">
                      {item.quantityKgs ? `${formatNumber(item.quantityKgs)} kg` : '-'}
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-medium">
                      {formatNumber(item.rate)}
                    </td>
                    <td className="p-2 border border-slate-200 text-right text-slate-600">
                      {item.discountPct ? `${item.discountPct}%` : '0%'}
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-mono text-slate-800">
                      {formatNumber(taxable)}
                    </td>
                    <td className="p-2 border border-slate-200 text-right text-slate-700">
                      <span className="font-semibold">{item.gstRate || 18}%</span>
                      <div className="text-[9px] text-slate-500 font-mono">₹{formatNumber(item.gstAmount || 0)}</div>
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-bold text-slate-900">
                      {formatNumber(item.netAmount || item.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Bank Details */}
        <div className="grid grid-cols-2 gap-6 items-start text-xs border-t border-slate-200 pt-4">
          {/* Bank Account Details */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <h4 className="font-extrabold uppercase text-slate-700 text-[10px] tracking-wider mb-1">
              Bank Payment Account Details
            </h4>
            <p className="text-slate-700"><span className="font-semibold">Bank:</span> {settings.bankName}</p>
            <p className="text-slate-700"><span className="font-semibold">Account Name:</span> {settings.accountName}</p>
            <p className="text-slate-700"><span className="font-semibold">Account No:</span> <span className="font-mono font-bold">{settings.accountNumber}</span></p>
            <p className="text-slate-700"><span className="font-semibold">IFSC Code:</span> <span className="font-mono font-bold">{settings.ifscCode}</span></p>
            <p className="text-slate-700"><span className="font-semibold">Branch:</span> {settings.branch}</p>
          </div>

          {/* Totals Box */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-bold text-slate-800">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                <span>Discount Allowed:</span>
                <span className="font-bold">- {formatCurrency(invoice.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">GST (CGST + SGST @ 12% / 18%):</span>
              <span className="font-bold text-slate-800">{formatCurrency(invoice.gstTotal)}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-black text-slate-900 bg-slate-100 px-3 rounded">
              <span>Grand Total:</span>
              <span className="text-emerald-900 font-mono">{formatCurrency(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions & Signatory */}
        <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-slate-200 text-[11px] text-slate-600">
          <div>
            <h5 className="font-bold uppercase text-slate-700 text-[10px] mb-1">Terms & Conditions:</h5>
            <p className="whitespace-pre-line text-slate-500 leading-relaxed">
              {invoice.terms || settings.defaultTerms}
            </p>
          </div>

          <div className="text-right flex flex-col justify-between items-end h-28">
            <span className="font-bold text-slate-900 text-xs">For {settings.companyName}</span>
            <div className="border-t border-slate-400 pt-1 text-[10px] font-semibold text-slate-600 w-48 text-center">
              Authorized Signatory
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
