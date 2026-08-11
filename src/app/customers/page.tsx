'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Eye, Filter, Sparkles, UserCheck, RefreshCw, ChevronLeft, ChevronRight, X, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(search);
      setOffset(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSampleCustomers(debouncedQuery, limit, offset);
      setCustomers(res.customers || []);
      setTotal(res.total || res.customers?.length || 0);
    } catch (err: any) {
      console.error('Failed to load customer records:', err);
      setError(err?.message || 'Failed to load customer records.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, limit, offset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            Customer Portfolio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Managed customer credit records with real-time risk scores
          </p>
        </div>

        {/* Server-Side Debounced Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-card border border-surface-border rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Customers List */}
      <div className="glass-card p-4 sm:p-6">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-brand-400" />
            <span>Fetching portfolio records from backend...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-surface-border rounded-xl space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-surface/80 border border-surface-border flex items-center justify-center text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">No customer data connected yet.</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Live customer database sync will populate records once cloud integrations (BigQuery / GCS) are active or local CSV batch predictions are run.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View (Hidden on mobile/tablet) */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-surface-border">
              <table className="w-full text-left text-xs table-auto">
                <thead className="text-slate-400 uppercase bg-surface/90 border-b border-surface-border">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Customer ID</th>
                    <th className="py-3.5 px-4 font-semibold">Age</th>
                    <th className="py-3.5 px-4 font-semibold">Monthly Income</th>
                    <th className="py-3.5 px-4 font-semibold">Loan Amount</th>
                    <th className="py-3.5 px-4 font-semibold">Credit Score</th>
                    <th className="py-3.5 px-4 font-semibold">Default Prob</th>
                    <th className="py-3.5 px-4 font-semibold">Risk Level</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-slate-200">
                  {customers.map((item) => (
                    <tr key={item.customer_id} className="hover:bg-surface-hover/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-brand-400 font-mono">{item.customer_id}</td>
                      <td className="py-3.5 px-4">{item.age}</td>
                      <td className="py-3.5 px-4">PKR {item.monthly_income_pkr?.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-semibold">PKR {item.loan_amount_pkr?.toLocaleString()}</td>
                      <td className="py-3.5 px-4">{item.credit_score}</td>
                      <td className="py-3.5 px-4 font-bold">{item.default_probability_pct}%</td>
                      <td className="py-3.5 px-4">
                        <span className={item.risk_level === 'High Risk' ? 'badge-high-risk' : item.risk_level === 'Medium Risk' ? 'badge-medium-risk' : 'badge-low-risk'}>
                          {item.risk_level}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedCustomer(item)}
                          className="px-3 py-1 rounded-lg bg-brand-600/20 hover:bg-brand-600/40 text-brand-400 border border-brand-500/30 text-[11px] font-semibold transition"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tablet/Mobile Responsive Cards (Visible on screens < 768px) */}
            <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customers.map((item) => (
                <div key={item.customer_id} className="p-4 rounded-xl bg-surface/70 border border-surface-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand-400">{item.customer_id}</span>
                    <span className={item.risk_level === 'High Risk' ? 'badge-high-risk' : item.risk_level === 'Medium Risk' ? 'badge-medium-risk' : 'badge-low-risk'}>
                      {item.risk_level}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-surface-border/40 py-2.5">
                    <div>
                      <p className="text-[10px] text-slate-400">Credit Score</p>
                      <p className="font-bold text-white mt-0.5">{item.credit_score}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Default Probability</p>
                      <p className="font-bold text-brand-400 mt-0.5">{item.default_probability_pct}%</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCustomer(item)}
                    className="w-full py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/40 text-brand-400 border border-brand-500/30 text-xs font-semibold transition text-center"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {total > limit && (
              <div className="flex items-center justify-between pt-4 border-t border-surface-border text-xs text-slate-400">
                <span>
                  Showing {offset + 1} - {Math.min(offset + limit, total)} of {total} customers
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    className="p-1.5 rounded-lg bg-surface border border-surface-border hover:bg-surface-hover disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={offset + limit >= total}
                    onClick={() => setOffset(offset + limit)}
                    className="p-1.5 rounded-lg bg-surface border border-surface-border hover:bg-surface-hover disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Profile Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="glass-card max-w-lg w-full p-6 space-y-4 border-brand-500/30 relative"
            >
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                    {selectedCustomer.customer_id}
                  </h3>
                  <p className="text-xs text-slate-400">Profile Details & Prediction Breakdown</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 rounded-lg bg-surface hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                  <p className="text-[10px] text-slate-400">Age</p>
                  <p className="font-bold text-white mt-0.5">{selectedCustomer.age}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                  <p className="text-[10px] text-slate-400">Credit Score</p>
                  <p className="font-bold text-white mt-0.5">{selectedCustomer.credit_score}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                  <p className="text-[10px] text-slate-400">Monthly Income</p>
                  <p className="font-bold text-white mt-0.5">PKR {selectedCustomer.monthly_income_pkr?.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                  <p className="text-[10px] text-slate-400">Loan Amount</p>
                  <p className="font-bold text-white mt-0.5">PKR {selectedCustomer.loan_amount_pkr?.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400">Default Probability</p>
                  <p className="text-xl font-bold text-brand-400 mt-0.5">{selectedCustomer.default_probability_pct}%</p>
                </div>
                <span className={selectedCustomer.risk_level === 'High Risk' ? 'badge-high-risk' : selectedCustomer.risk_level === 'Medium Risk' ? 'badge-medium-risk' : 'badge-low-risk'}>
                  {selectedCustomer.risk_level}
                </span>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-full py-2 rounded-xl bg-surface-hover hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Close Profile
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
