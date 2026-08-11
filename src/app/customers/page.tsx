'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Eye, Filter, Sparkles, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getSampleCustomers();
        setCustomers(res.customers || []);
      } catch (err) {
        console.error('Failed to load customer records:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.customer_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.risk_level?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
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

        <div className="relative w-full sm:w-72">
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

      {/* Customers Table */}
      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 uppercase bg-surface/80 border-b border-surface-border">
              <tr>
                <th className="py-3 px-3">Customer ID</th>
                <th className="py-3 px-3">Age</th>
                <th className="py-3 px-3">Monthly Income</th>
                <th className="py-3 px-3">Loan Amount</th>
                <th className="py-3 px-3">Credit Score</th>
                <th className="py-3 px-3">Default Prob</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50 text-slate-200">
              {filtered.map((c) => (
                <tr key={c.customer_id} className="hover:bg-surface-hover/50 transition">
                  <td className="py-3.5 px-3 font-mono font-semibold text-brand-400">{c.customer_id}</td>
                  <td className="py-3.5 px-3">{c.age} yrs</td>
                  <td className="py-3.5 px-3">{c.monthly_income_pkr?.toLocaleString()} PKR</td>
                  <td className="py-3.5 px-3 font-semibold text-white">
                    {c.loan_amount_pkr?.toLocaleString()} PKR
                  </td>
                  <td className="py-3.5 px-3 font-bold text-indigo-400">{c.credit_score}</td>
                  <td className="py-3.5 px-3 font-bold">{c.default_probability_pct?.toFixed(2)}%</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={
                        c.risk_level === 'High Risk'
                          ? 'badge-high-risk'
                          : c.risk_level === 'Medium Risk'
                          ? 'badge-medium-risk'
                          : 'badge-low-risk'
                      }
                    >
                      {c.risk_level}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="px-2.5 py-1 rounded-lg bg-brand-600/20 hover:bg-brand-600/40 text-brand-400 border border-brand-500/30 text-[11px] font-semibold transition"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-brand-400" />
                Customer: {selectedCustomer.customer_id}
              </h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-surface-border">
                <span className="text-slate-400">Default Probability:</span>
                <span className="font-bold text-white">{selectedCustomer.default_probability_pct}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-border">
                <span className="text-slate-400">Risk Assessment Level:</span>
                <span className="font-bold text-brand-400">{selectedCustomer.risk_level}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-surface-border">
                <span className="text-slate-400">Lending Decision:</span>
                <span className="font-bold text-emerald-400">{selectedCustomer.decision}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="w-full py-2 rounded-xl bg-surface-hover text-slate-200 text-xs font-semibold border border-surface-border mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
