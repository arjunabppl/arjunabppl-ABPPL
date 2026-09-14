import React from 'react';
import {
  HelpCircle, Calculator, BookOpen, Layers, CheckCircle2
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center space-x-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Paper Merchant Knowledge Base & Formula Guide</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard trade formulas for paper ream weight, GSM conversion, burst factor and ERP user workflows
          </p>
        </div>
      </div>

      {/* Grid of Formulas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Ream Weight Formula */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-sm">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <h3>1. Paper Ream Weight Formula (500 Sheets)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            In paper wholesale trade, ream weight (in Kg) for 500 sheets of paper is calculated using standard size in inches and GSM:
          </p>
          <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs font-bold leading-loose">
            Ream Weight (Kg) = [Length(inch) × Width(inch) × GSM] ÷ 3100
          </div>
          <div className="text-[11px] text-slate-500 space-y-1">
            <p><span className="font-bold text-slate-800">Example:</span> 23" × 36" size paper @ 120 GSM</p>
            <p className="font-mono text-slate-700 bg-slate-100 p-2 rounded">
              (23 × 36 × 120) / 3100 = 828 / 25 = <strong className="text-emerald-700">32.05 Kg / Ream</strong>
            </p>
          </div>
        </div>

        {/* GSM Formula */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-sm">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h3>2. Substance Calculation (GSM from Ream Weight)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            When you know the ream weight and paper size, calculate the substance GSM as follows:
          </p>
          <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs font-bold leading-loose">
            GSM = [Ream Weight (Kg) × 3100] ÷ [Length(inch) × Width(inch)]
          </div>
          <div className="text-[11px] text-slate-500 space-y-1">
            <p><span className="font-bold text-slate-800">Example:</span> 32.05 Kg ream weight @ 23" × 36" size</p>
            <p className="font-mono text-slate-700 bg-slate-100 p-2 rounded">
              (32.05 × 3100) / (23 × 36) = 99,355 / 828 = <strong className="text-emerald-700">120 GSM</strong>
            </p>
          </div>
        </div>

        {/* Trade Unit Definitions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3>3. Paper Wholesaler Trade Units</h3>
          </div>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div><strong className="text-slate-900">Ream:</strong> Standard packaging unit consisting of 500 full-size sheets.</div>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div><strong className="text-slate-900">Packet:</strong> Small packaging unit, usually 250 or 500 sheets for copier/maplitho.</div>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div><strong className="text-slate-900">Ton / Metric Ton:</strong> 1,000 Kg bulk mill dispatch quantity.</div>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div><strong className="text-slate-900">Burst Factor (BF):</strong> Kraft paper strength metric (e.g., 18 BF, 22 BF, 28 BF).</div>
            </li>
          </ul>
        </div>

        {/* Workflow Cheat Sheet */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3>4. ERP Workflow Cheat Sheet</h3>
          </div>
          <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
            <li><strong>Add Paper Master:</strong> Create grades under <span className="font-semibold text-slate-900">Paper Master</span> specifying GSM and size.</li>
            <li><strong>Receive Mill Arrivals:</strong> Log mill receipts in <span className="font-semibold text-slate-900">Purchases</span> or <span className="font-semibold text-slate-900">Stock-In</span>.</li>
            <li><strong>Issue Quotations:</strong> Prepare price estimates with 15-day validity under <span className="font-semibold text-slate-900">Quotations</span>.</li>
            <li><strong>Generate Tax Invoices:</strong> Create sales bills; auto-deducts godown stock and posts to customer ledger.</li>
            <li><strong>Track Payments & Dues:</strong> Monitor receivables with UTR reference numbers in <span className="font-semibold text-slate-900">Payments</span>.</li>
          </ol>
        </div>

      </div>

    </div>
  );
};
