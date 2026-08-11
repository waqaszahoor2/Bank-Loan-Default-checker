'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Search, Download, Filter, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { RecentAssessmentItem } from '@/lib/types';

export default function ResultsHistoryPage() {
  const [history, setHistory] = useState<RecentAssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getRecentAssessments();
        setHistory(res);
      } catch (err) {
        console.error('Failed to load assessment history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = history.filter((item) => {
    const matchesSearch =
      item.customer_id.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = filterRisk === 'ALL' || item.risk_level === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const exportCSV = () => {
    const headers = ['Customer ID', 'Name', 'Date', 'Default Prob %', 'Risk Level', 'Decision', 'Loan Amount'];
    const rows = filtered.map((i) => [
      i.customer_id,
      i.name,
      i.date,
      i.default_probability_pct,
      i.risk_level,
      i.decision,
      i.loan_amount,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'credit_risk_results_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-amber-400" />
            Results History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete historical audit trail of all generated credit risk evaluations
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-slate-200 text-xs font-semibold flex items-center gap-2 self-start"
        >
          <Download className="w-4 h-4 text-brand-400" /> Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/80 border border-surface-border rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5" /> Risk Filter:
          </span>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-surface/80 border border-surface-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="Low Risk">Low Risk</option>
            <option value="Medium Risk">Medium Risk</option>
            <option value="High Risk">High Risk</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 uppercase bg-surface/80 border-b border-surface-border">
              <tr>
                <th className="py-3 px-3">Customer ID</th>
                <th className="py-3 px-3">Applicant Name</th>
                <th className="py-3 px-3">Assessment Date</th>
                <th className="py-3 px-3">Default Probability</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3">Decision</th>
                <th className="py-3 px-3">Loan Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50 text-slate-200">
              {filtered.map((row) => (
                <tr key={row.customer_id} className="hover:bg-surface-hover/50 transition">
                  <td className="py-3.5 px-3 font-mono font-semibold text-brand-400">{row.customer_id}</td>
                  <td className="py-3.5 px-3 font-medium text-white">{row.name}</td>
                  <td className="py-3.5 px-3 text-slate-400">{row.date}</td>
                  <td className="py-3.5 px-3 font-bold">{row.default_probability_pct}%</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={
                        row.risk_level === 'High Risk'
                          ? 'badge-high-risk'
                          : row.risk_level === 'Medium Risk'
                          ? 'badge-medium-risk'
                          : 'badge-low-risk'
                      }
                    >
                      {row.risk_level}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-emerald-400">{row.decision}</td>
                  <td className="py-3.5 px-3 text-slate-300 font-mono">{row.loan_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
