'use client';

import React from 'react';
import { HelpCircle, Code, ShieldCheck, Database, Layers, ArrowRight, Server, Terminal } from 'lucide-react';

export default function HowItWorksPage() {
  const apiEndpoints = [
    { method: 'GET', path: '/health', desc: 'Root health check & model readiness status' },
    { method: 'GET', path: '/model-info', desc: 'Get champion model metrics, features & challenger info' },
    { method: 'POST', path: '/predict', desc: 'Single customer credit risk evaluation' },
    { method: 'POST', path: '/predict-batch', desc: 'Upload CSV/JSON for bulk portfolio prediction' },
    { method: 'POST', path: '/data/preview', desc: 'Preview records from enterprise connectors' },
    { method: 'POST', path: '/data/validate', desc: 'Validate schema mapping against model features' },
    { method: 'POST', path: '/data/merge', desc: 'Merge external data source by customer_id' },
    { method: 'POST', path: '/data-source/test', desc: 'Backend connection testing' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-surface-border pb-4">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-brand-400" />
          How CreditRisk AI Works
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          System architecture, end-to-end inference flow, and backend REST API documentation
        </p>
      </div>

      {/* 4-Step Visual Workflow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-3 relative border-brand-500/30">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm">
            01
          </div>
          <h3 className="font-bold text-sm text-white">Data Ingestion</h3>
          <p className="text-xs text-slate-400">
            Manual customer form inputs or enterprise connectors (PostgreSQL, BigQuery, S3).
          </p>
        </div>

        <div className="glass-card p-5 space-y-3 relative border-indigo-500/30">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
            02
          </div>
          <h3 className="font-bold text-sm text-white">Feature Preprocessing</h3>
          <p className="text-xs text-slate-400">
            Imputation, scaling, one-hot encoding, and auto-calculating derived ratios (DTI, stress).
          </p>
        </div>

        <div className="glass-card p-5 space-y-3 relative border-purple-500/30">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">
            03
          </div>
          <h3 className="font-bold text-sm text-white">Champion ML Inference</h3>
          <p className="text-xs text-slate-400">
            Real ML prediction executed by `credit_risk_pipeline.joblib` (Logistic Regression).
          </p>
        </div>

        <div className="glass-card p-5 space-y-3 relative border-emerald-500/30">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
            04
          </div>
          <h3 className="font-bold text-sm text-white">Risk Gauge & Factors</h3>
          <p className="text-xs text-slate-400">
            Calculates exact probability, risk level badge, and key factor impact breakdown.
          </p>
        </div>
      </div>

      {/* API Reference Table */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-brand-400" />
            Backend REST API Reference
          </h2>
          <span className="text-xs font-mono text-emerald-400">FastAPI Serverless Endpoints</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 uppercase bg-surface/80 border-b border-surface-border">
              <tr>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Endpoint Path</th>
                <th className="py-3 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50 text-slate-200">
              {apiEndpoints.map((ep) => (
                <tr key={ep.path} className="hover:bg-surface-hover/50 transition">
                  <td className="py-3.5 px-3">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        ep.method === 'GET'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
                      }`}
                    >
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-semibold text-white">{ep.path}</td>
                  <td className="py-3.5 px-3 text-slate-400">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
