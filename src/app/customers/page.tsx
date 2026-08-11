'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Eye, Filter, Sparkles, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

      {/* Customers Table or Empty State */}
      <div className="glass-card p-6">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading portfolio data...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-surface-border rounded-xl space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-surface/80 border border-surface-border flex items-center justify-center text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">No customer data connected yet.</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Live customer database sync will populate records once cloud integrations (PostgreSQL / BigQuery) are active.
            </p>
          </div>
        ) : (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50 text-slate-200">
                {filtered.map((item) => (
                  <tr key={item.customer_id} className="hover:bg-surface-hover/50 transition">
                    <td className="py-3.5 px-3 font-semibold text-brand-400">{item.customer_id}</td>
                    <td className="py-3.5 px-3">{item.age}</td>
                    <td className="py-3.5 px-3">PKR {item.monthly_income_pkr?.toLocaleString()}</td>
                    <td className="py-3.5 px-3 font-semibold">PKR {item.loan_amount_pkr?.toLocaleString()}</td>
                    <td className="py-3.5 px-3">{item.credit_score}</td>
                    <td className="py-3.5 px-3 font-bold">{item.default_probability_pct}%</td>
                    <td className="py-3.5 px-3">
                      <span className={item.risk_level === 'High Risk' ? 'badge-high-risk' : item.risk_level === 'Medium Risk' ? 'badge-medium-risk' : 'badge-low-risk'}>
                        {item.risk_level}
                      </span>
                    </td>
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
