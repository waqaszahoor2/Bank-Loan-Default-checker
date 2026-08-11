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
        setHistory(res || []);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-amber-400" />
            Results History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical record of all single and batch predictions performed
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-card border border-surface-border rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* History Table or Empty State */}
      <div className="glass-card p-6">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading history logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-surface-border rounded-xl space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-surface/80 border border-surface-border flex items-center justify-center text-slate-400">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">No assessments yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Run a single assessment or batch prediction to log historical predictions here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-surface/80 border-b border-surface-border">
                <tr>
                  <th className="py-3 px-3">Customer ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Default Prob</th>
                  <th className="py-3 px-3">Risk Level</th>
                  <th className="py-3 px-3">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50 text-slate-200">
                {filtered.map((item) => (
                  <tr key={item.customer_id} className="hover:bg-surface-hover/50 transition">
                    <td className="py-3.5 px-3 font-semibold text-brand-400">{item.customer_id}</td>
                    <td className="py-3.5 px-3 text-slate-400">{item.date}</td>
                    <td className="py-3.5 px-3 font-bold">{item.default_probability_pct}%</td>
                    <td className="py-3.5 px-3">
                      <span className={item.risk_level === 'High Risk' ? 'badge-high-risk' : item.risk_level === 'Medium Risk' ? 'badge-medium-risk' : 'badge-low-risk'}>
                        {item.risk_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-medium">{item.decision}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
