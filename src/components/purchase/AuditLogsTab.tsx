import React, { useState } from 'react';
import { AuditLog } from '../../types/index.js';
import { ShieldAlert, Search, ShieldCheck, History, ArrowRight, User } from 'lucide-react';

interface AuditLogsTabProps {
  logs?: AuditLog[];
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ logs = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const filtered = (logs || []).filter(l => {
    if (entityFilter !== 'ALL' && l.entityType !== entityFilter) return false;
    const q = (searchTerm || '').toLowerCase();
    if (q) {
      return (
        (l.entityId || '').toLowerCase().includes(q) ||
        (l.userName || '').toLowerCase().includes(q) ||
        (l.action || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4" id="purchase-audit-logs-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Purchase & Import Audit Trail</h3>
            <p className="text-xs text-slate-400">
              Immutable activity log tracking PO approvals, landed cost adjustments, GRN stock postings, and role actions
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Action, User, Document ID, or Details..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Filter Module:</span>
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Modules</option>
            <option value="PURCHASE_ORDER">Purchase Orders</option>
            <option value="PURCHASE_REQUISITION">Requisitions</option>
            <option value="RFQ">Quotations / RFQ</option>
            <option value="IMPORT_SHIPMENT">Import Shipments</option>
            <option value="LANDED_COST">Landed Cost Engine</option>
            <option value="GRN">Goods Receipt Notes</option>
            <option value="THREE_WAY_MATCH">3-Way Matching</option>
          </select>
        </div>
      </div>

      {/* Logs Timeline Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User & Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module & Document</th>
                <th className="px-4 py-3">Audit Details / Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No audit logs found for the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-750/40 transition">
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200 flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.userName}</span>
                      </div>
                      <div className="text-[10px] text-indigo-400 uppercase font-mono">{log.userRole}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-700 text-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[11px] text-slate-300 font-medium">{log.entityType}</span>
                      <div className="font-mono text-[10px] text-slate-400">{log.entityId}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
