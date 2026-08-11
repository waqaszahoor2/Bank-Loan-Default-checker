'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Search,
  Eye,
  Filter,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { BatchPredictionResponse, PredictionResult } from '@/lib/types';

export default function BatchPredictionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [batchData, setBatchData] = useState<BatchPredictionResponse | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<PredictionResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith('.csv') || dropped.name.endsWith('.json')) {
        setFile(dropped);
        setError(null);
      } else {
        setError('Please upload a valid CSV or JSON file.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleProcessBatch = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.predictBatchCSV(file);
      setBatchData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to process batch predictions.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSampleDataset = async () => {
    setLoading(true);
    setError(null);

    try {
      const sample = await api.getSampleCustomers();
      if (sample.customers && sample.customers.length > 0) {
        const preds: PredictionResult[] = sample.customers.map((c) => c.prediction_details);
        let high = 0, med = 0, low = 0, totalP = 0;
        preds.forEach((p) => {
          totalP += p.default_probability;
          if (p.risk_level === 'High Risk') high++;
          else if (p.risk_level === 'Medium Risk') med++;
          else low++;
        });
        const avg = totalP / preds.length;

        setBatchData({
          summary: {
            total_records: preds.length,
            high_risk_count: high,
            medium_risk_count: med,
            low_risk_count: low,
            average_default_probability: avg,
            average_default_probability_pct: Math.round(avg * 10000) / 100,
          },
          predictions: preds,
        });
      }
    } catch (err: any) {
      setError('Failed to load sample dataset.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPredictions = batchData?.predictions.filter(
    (p) =>
      p.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.risk_level.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-400" />
            Batch CSV Prediction
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload CSV/JSON portfolio datasets to evaluate credit risk in bulk
          </p>
        </div>

        <button
          onClick={handleLoadSampleDataset}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition flex items-center gap-2 self-start"
        >
          <FileSpreadsheet className="w-4 h-4" /> Load Sample Excel Data
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Upload Container */}
      {!batchData && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 text-center border-dashed border-2 border-surface-border hover:border-purple-500/50 transition cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
        >
          <input
            type="file"
            id="csv-file-input"
            accept=".csv, .json"
            className="hidden"
            onChange={handleFileSelect}
          />
          <label htmlFor="csv-file-input" className="cursor-pointer block space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 mx-auto flex items-center justify-center text-purple-400 glow-purple">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-white">
                {file ? file.name : 'Upload CSV or Drag & Drop File'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports CSV/JSON datasets up to 10MB (25 training features)
              </p>
            </div>
          </label>

          {file && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleProcessBatch}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 text-white text-xs font-bold transition shadow-glow-purple flex items-center gap-2"
              >
                {loading ? 'Executing ML Predictions...' : 'Process Batch Dataset'}
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Batch Results View */}
      {batchData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Batch Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="glass-card p-4">
              <p className="text-[11px] text-slate-400">Total Portfolio Records</p>
              <p className="text-2xl font-bold text-white mt-1">{batchData.summary.total_records}</p>
            </div>

            <div className="glass-card p-4 border-emerald-500/30">
              <p className="text-[11px] text-slate-400">Low Risk Approved</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{batchData.summary.low_risk_count}</p>
            </div>

            <div className="glass-card p-4 border-amber-500/30">
              <p className="text-[11px] text-slate-400">Medium Risk Review</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{batchData.summary.medium_risk_count}</p>
            </div>

            <div className="glass-card p-4 border-rose-500/30">
              <p className="text-[11px] text-slate-400">High Risk Rejected</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">{batchData.summary.high_risk_count}</p>
            </div>

            <div className="glass-card p-4 border-brand-500/30">
              <p className="text-[11px] text-slate-400">Avg Default Probability</p>
              <p className="text-2xl font-bold text-brand-400 mt-1">
                {batchData.summary.average_default_probability_pct}%
              </p>
            </div>
          </div>

          {/* Table Header Controls */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer ID or risk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface/80 border border-surface-border rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setBatchData(null)}
                  className="px-3.5 py-2 rounded-xl bg-surface-hover text-slate-300 text-xs font-medium border border-surface-border"
                >
                  Upload New File
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase bg-surface/80 border-b border-surface-border">
                  <tr>
                    <th className="py-3 px-3">Customer ID</th>
                    <th className="py-3 px-3">Default Probability</th>
                    <th className="py-3 px-3">Risk Level</th>
                    <th className="py-3 px-3">Model</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-slate-200">
                  {filteredPredictions.map((row) => (
                    <tr key={row.customer_id} className="hover:bg-surface-hover/50 transition">
                      <td className="py-3.5 px-3 font-semibold text-brand-400">{row.customer_id}</td>
                      <td className="py-3.5 px-3 font-bold">
                        {row.default_probability_pct.toFixed(2)}%
                      </td>
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
                      <td className="py-3.5 px-3 text-slate-400">{row.model_name}</td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedCustomer(row)}
                          className="px-2.5 py-1 rounded-lg bg-surface-hover hover:bg-slate-700 text-slate-200 border border-surface-border text-[11px] font-semibold transition flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-bold text-white">
                Customer Breakdown: {selectedCustomer.customer_id}
              </h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-surface-border">
                <span className="text-slate-400">Default Probability:</span>
                <span className="font-bold text-white">{selectedCustomer.default_probability_pct}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-border">
                <span className="text-slate-400">Risk Level:</span>
                <span
                  className={
                    selectedCustomer.risk_level === 'High Risk'
                      ? 'badge-high-risk'
                      : selectedCustomer.risk_level === 'Medium Risk'
                      ? 'badge-medium-risk'
                      : 'badge-low-risk'
                  }
                >
                  {selectedCustomer.risk_level}
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <p className="font-bold text-slate-300">Top Contributor Risk Factors:</p>
                {selectedCustomer.key_risk_factors.map((f, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-surface/60 border border-surface-border">
                    <p className="font-semibold text-white">{f.factor} ({f.impact})</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
