import React from 'react';
import { DeliveryChallan, CompanySettings } from '../../types/index.js';
import { formatNumber } from '../../utils/paperMath.js';
import { Printer, ArrowLeft, Truck, Package, Building, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface PrintableDeliveryChallanProps {
  challan: DeliveryChallan;
  settings: CompanySettings;
  onBack: () => void;
}

export const PrintableDeliveryChallan: React.FC<PrintableDeliveryChallanProps> = ({ challan, settings, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const totalOrdered = challan.items.reduce((sum, it) => sum + (it.orderedQty || 0), 0);
  const totalDispatched = challan.items.reduce((sum, it) => sum + (it.dispatchedQty || 0), 0);
  const totalWeight = challan.totalWeightKgs || challan.items.reduce((sum, it) => sum + (it.weightKg || 0), 0);

  return (
    <div className="min-h-screen bg-slate-900/90 text-slate-900 p-4 md:p-8 flex flex-col items-center">
      
      {/* Top Action Bar (hidden on print) */}
      <div className="w-full max-w-4xl flex items-center justify-between bg-slate-800 text-white p-4 rounded-xl shadow-lg mb-6 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-bold bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Deliveries</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-emerald-400 font-semibold">
            Delivery Challan & Packing Slip #{challan.challanNo}
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Challan & Packing Slip</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div
        id="printable-delivery-challan"
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
                Central Godown: {challan.warehouseName || 'Bhiwandi Central Godown, Warehouse Complex C-12, Bhiwandi, Thane, MH'}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700 font-semibold mt-2">
                <span>GSTIN: <strong className="text-slate-900">{settings.gstin}</strong></span>
                <span>PAN: <strong className="text-slate-900">{settings.pan}</strong></span>
                <span>Godown Contact: <strong className="text-slate-900">{settings.phone}</strong></span>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-emerald-900 text-white px-3 py-1.5 rounded-md text-xs font-extrabold tracking-wider uppercase mb-2">
                GST DELIVERY CHALLAN & PACKING SLIP
              </div>
              <div className="text-xs space-y-1 text-slate-700">
                <div>Challan No: <strong className="text-slate-950">{challan.challanNo}</strong></div>
                <div>Packing Slip No: <strong className="text-slate-950">{challan.packingSlipNo || challan.challanNo}</strong></div>
                <div>Dispatch Date: <strong className="text-slate-950">{challan.dispatchDate}</strong></div>
                <div>Sales Order Ref: <strong className="text-emerald-800 font-extrabold">{challan.orderNo}</strong></div>
                {challan.invoiceNo && <div>Invoice Ref: <strong className="text-slate-900">{challan.invoiceNo}</strong></div>}
              </div>
            </div>
          </div>
        </div>

        {/* Consignee & Transport Metadata */}
        <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6 text-xs">
          <div>
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-700" />
              <span>Consignee / Deliver To</span>
            </div>
            <div className="font-bold text-sm text-slate-950">{challan.customerName}</div>
            <div className="text-slate-700 mt-2 space-y-1">
              <div>Destination / Godown: <strong className="text-slate-900">Buyer Delivery Address</strong></div>
              <div>Dispatch Godown: <strong className="text-slate-900">{challan.warehouseName || 'Central Warehouse'}</strong></div>
              <div>Delivery Status: <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase text-[10px]">{challan.status}</span></div>
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Transporter & Vehicle Dispatch Info</span>
            </div>
            <div className="space-y-1 text-slate-700">
              <div>Transporter Name: <strong className="text-slate-950">{challan.transporterName}</strong></div>
              <div>Vehicle / Truck No: <strong className="text-slate-950">{challan.vehicleNumber || 'MH-04-AB-8821'}</strong></div>
              <div>LR / GR No: <strong className="text-emerald-900 font-extrabold">{challan.lrGrNo || 'LR-ABPPL-902'}</strong></div>
              <div>LR Date: <strong className="text-slate-900">{challan.lrGrDate || challan.dispatchDate}</strong></div>
              <div>Driver Contact: <strong className="text-slate-900">{challan.driverPhone || 'Driver on Duty'}</strong></div>
              <div>Total Packages / Bundles: <strong className="text-slate-900">{challan.totalPackages || 1} {challan.packageType || 'Bundles'}</strong></div>
            </div>
          </div>
        </div>

        {/* Dispatched Paper Items */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-900 text-white font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Paper Description & Grade</th>
                <th className="py-2.5 px-3">GSM & Size</th>
                <th className="py-2.5 px-3 text-right">Ordered Qty</th>
                <th className="py-2.5 px-3 text-right">Dispatched Qty</th>
                <th className="py-2.5 px-3 text-right">Unit</th>
                <th className="py-2.5 px-3 text-right">Approx Weight (Kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {challan.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500 font-semibold">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-950">{item.productName}</td>
                  <td className="py-2.5 px-3 text-slate-700">
                    <span className="font-semibold">{item.gsm} GSM</span> | {item.sizeInches || 'A4'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                    {formatNumber(item.orderedQty)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-emerald-900">
                    {formatNumber(item.dispatchedQty)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700">
                    {item.unit || 'Ream'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {formatNumber(item.weightKg || 0)} Kg
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
              <tr>
                <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[11px]">Total Summary:</td>
                <td className="py-2.5 px-3 text-right text-slate-600">{formatNumber(totalOrdered)}</td>
                <td className="py-2.5 px-3 text-right text-emerald-900 font-black">{formatNumber(totalDispatched)} Units</td>
                <td className="py-2.5 px-3 text-right">{challan.totalPackages || 1} {challan.packageType || 'Pkgs'}</td>
                <td className="py-2.5 px-3 text-right text-emerald-950 font-black">{formatNumber(totalWeight)} Kg</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Remarks & Transport Instructions */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-8 text-xs space-y-2">
          <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Dispatch & Handling Notes:</div>
          <p className="text-slate-700">
            {challan.deliveryRemarks || 'Moisture-proof shrink wrap applied. Store in dry flat condition. Inspect ream count before signing LR copy.'}
          </p>
          <div className="text-[11px] text-slate-500 font-medium">
            Dispatched by: <strong className="text-slate-800">{challan.dispatchedBy || 'Warehouse Incharge'}</strong> on {challan.dispatchDate}
          </div>
        </div>

        {/* Verification & Receiver Stamps */}
        <div className="grid grid-cols-3 gap-6 border-t border-slate-300 pt-6 text-xs text-slate-700 text-center">
          <div className="border border-slate-200 p-4 rounded-xl flex flex-col justify-between h-32">
            <span className="font-bold text-slate-900 text-[11px]">Warehouse Dispatcher</span>
            <div className="text-[10px] text-slate-500">Checked & Loaded</div>
          </div>

          <div className="border border-slate-200 p-4 rounded-xl flex flex-col justify-between h-32">
            <span className="font-bold text-slate-900 text-[11px]">Transporter / Driver Sign</span>
            <div className="text-[10px] text-slate-500">Received Goods in Good Condition</div>
          </div>

          <div className="border-2 border-dashed border-emerald-600 bg-emerald-50/30 p-4 rounded-xl flex flex-col justify-between h-32">
            <span className="font-bold text-emerald-950 text-[11px]">Customer Receiving Stamp & Sign</span>
            <div className="text-[10px] text-emerald-800 font-semibold">
              {challan.receivedBy ? `Received by: ${challan.receivedBy}` : 'Signature & Rubber Stamp'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
