import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { DueReminder } from '../types/index.js';
import {
  AlertCircle, Clock, Phone, DollarSign, Filter, RefreshCw,
  Search, ArrowUpRight, ArrowDownRight, CheckCircle2, FileText, FileSpreadsheet, Printer
} from 'lucide-react';
import { exportToPdf, exportToExcel, ColumnDefinition, SummaryStat } from '../utils/exportUtils.js';

export const DueRemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<DueReminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadReminders = async () => {
    setLoading(true);
    try {
      const data = await api.getDueReminders();
      setReminders(data);
    } catch (err: any) {
      console.error('Error loading due reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const filteredReminders = (reminders || []).filter(item => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
    const q = (searchQuery || '').toLowerCase();
    const matchesQuery = !q ||
      (item.partyName || '').toLowerCase().includes(q) ||
      (item.invoiceNo || '').toLowerCase().includes(q) ||
      (item.phone && item.phone.includes(q));
    return matchesStatus && matchesType && matchesQuery;
  });

  const totalOverdueAmount = (reminders || [])
    .filter(r => r.status === 'OVERDUE')
    .reduce((sum, r) => sum + (r.dueAmount || 0), 0);

  const totalDueSoonAmount = (reminders || [])
    .filter(r => r.status === 'DUE_SOON' || r.status === 'DUE_TODAY')
    .reduce((sum, r) => sum + (r.dueAmount || 0), 0);

  const handleExportPdf = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Party Name', dataKey: 'partyName', align: 'left' },
      { header: 'Type', dataKey: 'type', align: 'center' },
      { header: 'Invoice No', dataKey: 'invoiceNo', align: 'left' },
      { header: 'Due Date', dataKey: 'dueDate', align: 'center' },
      { header: 'Overdue Days', dataKey: 'daysOverdue', align: 'center', format: v => v > 0 ? `${v} Days` : 'Due Today' },
      { header: 'Phone', dataKey: 'phone', align: 'center', format: v => v || '-' },
      { header: 'Due Amount (₹)', dataKey: 'dueAmount', align: 'right', format: v => `₹${Number(v).toLocaleString('en-IN')}` },
      { header: 'Status', dataKey: 'status', align: 'center' }
    ];

    const stats: SummaryStat[] = [
      { label: 'Critical Overdue', value: `₹${totalOverdueAmount.toLocaleString('en-IN')}` },
      { label: 'Due Soon / Today', value: `₹${totalDueSoonAmount.toLocaleString('en-IN')}` },
      { label: 'Total Tracked Dues', value: `₹${(totalOverdueAmount + totalDueSoonAmount).toLocaleString('en-IN')}` },
      { label: 'Total Parties', value: filteredReminders.length }
    ];

    exportToPdf({
      title: 'Payment Due Reminders & Overdue Aging Report',
      subtitle: 'Tracking unpaid invoices and overdue customer dues with contact details',
      fileName: `Due_Reminders_Aging_${new Date().toISOString().split('T')[0]}`,
      summaryStats: stats,
      columns,
      data: filteredReminders,
      orientation: 'landscape'
    });
  };

  const handleExportExcel = () => {
    const columns: ColumnDefinition[] = [
      { header: 'Party Name', dataKey: 'partyName', width: 28 },
      { header: 'Party Type', dataKey: 'type' },
      { header: 'Invoice No', dataKey: 'invoiceNo' },
      { header: 'Invoice Date', dataKey: 'invoiceDate' },
      { header: 'Due Date', dataKey: 'dueDate' },
      { header: 'Days Overdue', dataKey: 'daysOverdue' },
      { header: 'Contact Phone', dataKey: 'phone' },
      { header: 'Total Invoice Amount (₹)', dataKey: 'totalAmount' },
      { header: 'Due Balance (₹)', dataKey: 'dueAmount' },
      { header: 'Status', dataKey: 'status' }
    ];

    const stats: SummaryStat[] = [
      { label: 'Total Critical Overdue (₹)', value: totalOverdueAmount },
      { label: 'Total Due Soon (₹)', value: totalDueSoonAmount },
      { label: 'Total Tracked Receivables (₹)', value: totalOverdueAmount + totalDueSoonAmount }
    ];

    exportToExcel({
      fileName: `Payment_Due_Reminders_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Due Reminders',
      title: 'Payment Due Reminders & Credit Aging Register',
      subtitle: 'Amriteshwar Balaji Paper Pvt. Ltd. - Recovery & Due Tracking',
      summaryStats: stats,
      columns,
      data: filteredReminders,
      totalsRow: {
        partyName: 'TOTAL',
        dueAmount: totalOverdueAmount + totalDueSoonAmount
      }
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Payment Due Reminders & Aging Analysis</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated tracking for unpaid customer sales invoices & supplier purchase bills grouped by overdue status.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={handleExportPdf}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={loadReminders}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Overdue Card */}
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-rose-800 uppercase">
            <span>Critical Overdue Receivables</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900">
            ₹{totalOverdueAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-rose-700 font-medium">
            {reminders.filter(r => r.status === 'OVERDUE').length} Invoices past due date
          </p>
        </div>

        {/* Due Today / Soon Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 uppercase">
            <span>Due Soon / Due Today</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">
            ₹{totalDueSoonAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-amber-700 font-medium">
            {reminders.filter(r => r.status === 'DUE_SOON' || r.status === 'DUE_TODAY').length} Bills upcoming within terms
          </p>
        </div>

        {/* Total Outstanding Summary */}
        <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Total Tracked Dues</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ₹{(totalOverdueAmount + totalDueSoonAmount).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400">
            Active credit monitoring across all parties
          </p>
        </div>

      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search party name, invoice #, phone..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <div className="md:col-span-4 flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
          {['ALL', 'OVERDUE', 'DUE_TODAY', 'DUE_SOON'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 py-1 rounded-md text-[10px] font-extrabold uppercase transition ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {(st || '').replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="md:col-span-3 flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
          {[
            { id: 'ALL', label: 'ALL' },
            { id: 'CUSTOMER_RECEIVABLE', label: 'RECEIVABLE' },
            { id: 'SUPPLIER_PAYABLE', label: 'PAYABLE' }
          ].map((tp) => (
            <button
              key={tp.id}
              onClick={() => setTypeFilter(tp.id)}
              className={`flex-1 py-1 rounded-md text-[10px] font-extrabold uppercase transition ${
                typeFilter === tp.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tp.label}
            </button>
          ))}
        </div>

      </div>

      {/* Reminders List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Checking overdue payment schedules...</div>
        ) : filteredReminders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No payment reminders match your selected criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <th className="py-3 px-4">Party & Contact</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Bill / Invoice #</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status Badge</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredReminders.map((rem) => {
                  const isOverdue = rem.status === 'OVERDUE';
                  const isReceivable = rem.type === 'CUSTOMER_RECEIVABLE';

                  return (
                    <tr key={rem.id} className="hover:bg-slate-50 transition">
                      
                      {/* Party */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{rem.partyName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{rem.phone || 'No Phone Recorded'}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                          isReceivable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isReceivable ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          <span>{isReceivable ? 'Receivable' : 'Payable'}</span>
                        </span>
                      </td>

                      {/* Bill / Invoice # */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {rem.invoiceNo}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div>{rem.dueDate}</div>
                        {isOverdue && (
                          <div className="text-[10px] font-bold text-rose-600">{rem.daysOverdue} Days Overdue</div>
                        )}
                      </td>

                      {/* Due Amount */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-black text-sm text-slate-900">
                          ₹{rem.dueAmount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Total: ₹{rem.totalAmount.toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          rem.status === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-800'
                            : rem.status === 'DUE_TODAY'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {rem.status === 'OVERDUE' && <AlertCircle className="w-3 h-3" />}
                          {rem.status === 'DUE_TODAY' && <Clock className="w-3 h-3" />}
                          {rem.status === 'DUE_SOON' && <CheckCircle2 className="w-3 h-3" />}
                          <span>{(rem.status || '').replace(/_/g, ' ')}</span>
                        </span>
                      </td>

                      {/* Quick Action */}
                      <td className="py-3 px-4 text-right">
                        {rem.phone ? (
                          <a
                            href={`tel:${rem.phone}`}
                            className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-emerald-200 transition"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call Party</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">N/A</span>
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
  );
};
