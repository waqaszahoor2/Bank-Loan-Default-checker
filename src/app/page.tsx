'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FilePlus,
  Layers,
  Database,
  History,
  TrendingUp,
  ArrowRight,
  Database as DbIcon,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { RiskGauge } from '@/components/risk-gauge';
import { RiskDistributionChart } from '@/components/risk-distribution-chart';
import { ModelPerformanceChart } from '@/components/model-performance-chart';
import { api } from '@/lib/api';
import { RecentAssessmentItem } from '@/lib/types';

export default function DashboardPage() {
  const [assessments, setAssessments] = useState<RecentAssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getRecentAssessments();
        setAssessments(data);
      } catch (err) {
        console.error('Failed to load recent assessments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Mobile Top Greeting Banner (Visible on mobile screens) */}
      <div className="lg:hidden glass-card p-5 mb-2 relative overflow-hidden bg-gradient-to-r from-brand-900/40 via-surface-card to-surface-card border-brand-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Hello, John 👋</h2>
            <p className="text-xs text-slate-400 mt-0.5">Let's assess credit risk</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center glow-blue">
            <Sparkles className="w-6 h-6 text-brand-400" />
          </div>
        </div>
      </div>

      {/* Hero Header + Primary Risk Gauge Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Banner Hero Card */}
        <div className="lg:col-span-2 glass-card p-6 lg:p-8 relative overflow-hidden flex flex-col justify-between bg-gradient-to-r from-surface-card via-surface-card to-brand-950/40 border-surface-border">
          {/* Subtle Background Glow Accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Logistic Regression Champion Model Active
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Smarter Decisions. <br />
              <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
                Lower Risk.
              </span>
            </h1>
            <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
              AI-powered credit risk prediction engine trained on early-warning banking features to help you make faster, safer lending decisions.
            </p>
          </div>

          <div className="relative z-10 pt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/assessment"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-glow-blue flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" />
              New Risk Assessment
            </Link>
            <Link
              href="/batch"
              className="px-5 py-2.5 rounded-xl bg-surface-hover hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-surface-border transition flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-brand-400" />
              Batch CSV Processing
            </Link>
          </div>
        </div>

        {/* Primary Risk Gauge Widget */}
        <div className="glass-card p-6 flex flex-col items-center justify-between bg-surface-card border-surface-border">
          <div className="w-full flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Live Champion Gauge
            </h3>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          <RiskGauge probability={0.2435} riskLevel="Medium Risk" size="md" />

          {/* Quick Metrics Under Gauge */}
          <div className="w-full grid grid-cols-3 gap-2 pt-4 mt-2 border-t border-surface-border text-center">
            <div>
              <p className="text-[10px] text-slate-400">Today</p>
              <p className="text-sm font-bold text-white">128</p>
              <span className="text-[10px] text-emerald-400 font-medium">↑ 12%</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">High Risk</p>
              <p className="text-sm font-bold text-rose-400">32</p>
              <span className="text-[10px] text-rose-400 font-medium">↑ 8%</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Approved</p>
              <p className="text-sm font-bold text-emerald-400">96</p>
              <span className="text-[10px] text-emerald-400 font-medium">↑ 15%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Action Shortcut Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Link href="/assessment" className="group glass-card p-5 glass-card-hover border-surface-border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 group-hover:scale-110 transition">
              <FilePlus className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-sm text-white group-hover:text-brand-400 transition">New Assessment</h3>
          <p className="text-xs text-slate-400 mt-1">Predict credit risk for a single customer</p>
        </Link>

        <Link href="/batch" className="group glass-card p-5 glass-card-hover border-surface-border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
              <Layers className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-sm text-white group-hover:text-purple-400 transition">Batch Prediction</h3>
          <p className="text-xs text-slate-400 mt-1">Upload CSV and evaluate credit risk in bulk</p>
        </Link>

        <Link href="/integration" className="group glass-card p-5 glass-card-hover border-surface-border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <Database className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition">Data Integration</h3>
          <p className="text-xs text-slate-400 mt-1">Connect & merge external databases</p>
        </Link>

        <Link href="/results" className="group glass-card p-5 glass-card-hover border-surface-border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
              <History className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition">Results History</h3>
          <p className="text-xs text-slate-400 mt-1">View all past risk assessment predictions</p>
        </Link>
      </motion.div>

      {/* Middle Section: Recent Assessments Table + Risk Distribution Donut Chart */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Recent Assessments Table */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Recent Assessments</h2>
              <p className="text-xs text-slate-400">Latest credit evaluations performed by Champion model</p>
            </div>
            <Link
              href="/results"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-surface/80 border-b border-surface-border">
                <tr>
                  <th className="py-3 px-3">Customer ID</th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Default Prob</th>
                  <th className="py-3 px-3">Risk Level</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50 text-slate-200">
                {assessments.slice(0, 4).map((item) => (
                  <tr key={item.customer_id} className="hover:bg-surface-hover/50 transition">
                    <td className="py-3.5 px-3 font-semibold text-brand-400">{item.customer_id}</td>
                    <td className="py-3.5 px-3 font-medium text-white">{item.name}</td>
                    <td className="py-3.5 px-3 text-slate-400">{item.date}</td>
                    <td className="py-3.5 px-3 font-bold">
                      {item.default_probability_pct.toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={
                          item.risk_level === 'High Risk'
                            ? 'badge-high-risk'
                            : item.risk_level === 'Medium Risk'
                            ? 'badge-medium-risk'
                            : 'badge-low-risk'
                        }
                      >
                        {item.risk_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/results?id=${item.customer_id}`}
                        className="px-2.5 py-1 rounded-lg bg-brand-600/20 hover:bg-brand-600/40 text-brand-400 border border-brand-500/30 text-[11px] font-semibold transition"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Distribution Donut Chart */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-white">Risk Distribution</h2>
            <span className="text-xs text-slate-400">806 Dataset Samples</span>
          </div>

          <div className="my-auto py-2">
            <RiskDistributionChart highCount={32} mediumCount={56} lowCount={40} />
          </div>
        </div>
      </motion.div>

      {/* Bottom Row: Data Integration Status + Latest Activity + Model Performance */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Data Integration Status */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Data Integration Status</h2>
            <Link href="/integration" className="text-xs text-brand-400 hover:underline">
              Manage
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface/60 border border-emerald-500/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DbIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">PostgreSQL</p>
                <p className="text-[10px] text-emerald-400 font-medium">Connected</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface/60 border border-emerald-500/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">BigQuery</p>
                <p className="text-[10px] text-emerald-400 font-medium">Connected</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface/60 border border-emerald-500/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">AWS S3</p>
                <p className="text-[10px] text-emerald-400 font-medium">Connected</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface/60 border border-surface-border opacity-60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                <DbIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-300">Snowflake</p>
                <p className="text-[10px] text-rose-400 font-medium">Not Connected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Activity Feed */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Latest Activity</h2>
            <span className="text-xs text-slate-400">Live</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-surface-hover/50 transition">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">Batch prediction completed</p>
                <p className="text-[11px] text-brand-400 font-mono">customers_may_24.csv</p>
              </div>
              <span className="text-[10px] text-slate-500 flex-shrink-0">2 min ago</span>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-surface-hover/50 transition">
              <DbIcon className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">Data integration successful</p>
                <p className="text-[11px] text-slate-400 font-mono">postgresql://bank_db</p>
              </div>
              <span className="text-[10px] text-slate-500 flex-shrink-0">15 min ago</span>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-surface-hover/50 transition">
              <FilePlus className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">New assessment created</p>
                <p className="text-[11px] text-slate-400 font-mono">CUST-10005</p>
              </div>
              <span className="text-[10px] text-slate-500 flex-shrink-0">32 min ago</span>
            </div>
          </div>
        </div>

        {/* Model Performance (Champion) */}
        <div className="glass-card p-6 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Model Performance (Champion)</h2>
            <Link href="/model-info" className="text-xs text-brand-400 hover:underline">
              Details
            </Link>
          </div>

          <div className="flex-1 py-1">
            <ModelPerformanceChart />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
