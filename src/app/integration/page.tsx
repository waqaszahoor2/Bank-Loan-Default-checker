'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sliders,
  Sparkles,
  Link as LinkIcon,
  ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';

const connectors = [
  { id: 'postgresql', name: 'PostgreSQL', icon: Database, connected: true, status: 'Connected' },
  { id: 'mysql', name: 'MySQL', icon: Database, connected: false, status: 'Not Connected' },
  { id: 'bigquery', name: 'BigQuery', icon: Cloud, connected: true, status: 'Connected' },
  { id: 's3', name: 'AWS S3', icon: Cloud, connected: true, status: 'Connected' },
  { id: 'gcs', name: 'Google Cloud Storage', icon: Cloud, connected: false, status: 'Not Connected' },
  { id: 'azure', name: 'Azure Storage', icon: Cloud, connected: false, status: 'Not Connected' },
  { id: 'snowflake', name: 'Snowflake', icon: Database, connected: false, status: 'Not Connected' },
];

export default function DataIntegrationPage() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedConnector, setSelectedConnector] = useState(connectors[0]);
  const [testing, setTesting] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [mergeResult, setMergeResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Connect / Test Source
  const handleTestConnection = async () => {
    setTesting(true);
    setError(null);
    try {
      const res = await api.testDataSource({ source_type: selectedConnector.id });
      if (res.success) {
        setActiveStep(2);
        handleFetchPreview();
      }
    } catch (err: any) {
      setError('Connection failed. Verify backend environment credentials.');
    } finally {
      setTesting(false);
    }
  };

  // Step 2: Fetch Preview Data
  const handleFetchPreview = async () => {
    try {
      const res = await api.previewData({ source_type: selectedConnector.id });
      setPreviewData(res);
    } catch (err) {
      setError('Failed to preview data from integration source.');
    }
  };

  // Step 3 & 4: Validate Mappings
  const handleValidateSchema = async () => {
    setTesting(true);
    try {
      const mappings = {
        customer_id: 'customer_id',
        age: 'age',
        monthly_income: 'monthly_income_pkr',
        loan_amt: 'loan_amount_pkr',
        score: 'credit_score',
        dti: 'debt_to_income_pct',
      };
      const res = await api.validateData(selectedConnector.id, mappings, previewData?.sample_records || []);
      setValidationResult(res);
      setActiveStep(4);
    } catch (err) {
      setError('Schema validation failed.');
    } finally {
      setTesting(false);
    }
  };

  // Step 5: Merge by customer_id & Predict
  const handleMergeAndPredict = async () => {
    setTesting(true);
    try {
      const res = await api.mergeData(previewData?.sample_records || [], [], 'customer_id');
      setMergeResult(res);
      setActiveStep(5);
    } catch (err) {
      setError('Merge execution failed.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400" />
            External Data Integration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connect enterprise databases & cloud storage. Credentials stay strictly backend-only.
          </p>
        </div>

        {/* Wizard Flow Progress */}
        <div className="flex items-center gap-1.5 bg-surface-card p-1.5 rounded-xl border border-surface-border self-start text-xs font-semibold">
          <span className={`px-2.5 py-1 rounded-lg ${activeStep === 1 ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>
            1. Connect
          </span>
          <span className="text-slate-600">→</span>
          <span className={`px-2.5 py-1 rounded-lg ${activeStep === 2 ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>
            2. Preview
          </span>
          <span className="text-slate-600">→</span>
          <span className={`px-2.5 py-1 rounded-lg ${activeStep === 3 || activeStep === 4 ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>
            3. Map & Validate
          </span>
          <span className="text-slate-600">→</span>
          <span className={`px-2.5 py-1 rounded-lg ${activeStep === 5 ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>
            4. Merge & Predict
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Wizard Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Connector Selection Grid */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Available Data Connectors
          </h3>

          <div className="space-y-2.5">
            {connectors.map((c) => {
              const Icon = c.icon;
              const isSelected = selectedConnector.id === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedConnector(c)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-brand-600/20 border-brand-500 shadow-glow-blue'
                      : 'bg-surface/60 border-surface-border hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center text-brand-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{c.name}</p>
                      <p className="text-[10px] text-slate-400">Enterprise Connector</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      c.connected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Step Execution Workspace */}
        <div className="lg:col-span-2 glass-card p-6 space-y-6 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {/* Step 1: Connect */}
            {activeStep === 1 && (
              <motion.div key="step-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Step 1: Authenticate Connection</h3>
                    <p className="text-xs text-slate-400">Testing connection to {selectedConnector.name}</p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="p-4 rounded-xl bg-surface/60 border border-surface-border space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Connector Target:</span>
                    <span className="font-semibold text-white">{selectedConnector.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Security Mode:</span>
                    <span className="font-mono text-emerald-400">Environment Credentials Only</span>
                  </div>
                </div>

                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-glow-blue flex items-center justify-center gap-2"
                >
                  {testing ? 'Establishing Connection...' : `Connect & Test ${selectedConnector.name}`}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Preview */}
            {activeStep === 2 && previewData && (
              <motion.div key="step-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Step 2: Preview Source Records</h3>
                    <p className="text-xs text-slate-400">
                      Detected {previewData.total_rows_detected} records from {selectedConnector.name}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface border-b border-surface-border text-slate-400 uppercase">
                      <tr>
                        {previewData.columns.slice(0, 5).map((col: string) => (
                          <th key={col} className="p-2.5">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border text-slate-200">
                      {previewData.sample_records.map((rec: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-mono text-brand-400">{rec.customer_id}</td>
                          <td className="p-2.5">{rec.age}</td>
                          <td className="p-2.5">{rec.monthly_income_pkr}</td>
                          <td className="p-2.5">{rec.loan_amount_pkr}</td>
                          <td className="p-2.5">{rec.credit_score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="px-4 py-2 rounded-xl bg-surface-hover text-slate-300 text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center gap-2"
                  >
                    Proceed to Column Mapping <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Map Columns & Step 4: Validate */}
            {(activeStep === 3 || activeStep === 4) && (
              <motion.div key="step-3-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Step 3 & 4: Map & Validate Schema</h3>
                    <p className="text-xs text-slate-400">Validate against 25 Logistic Regression training features</p>
                  </div>
                </div>

                {validationResult ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-2">
                    <p className="font-bold">✓ Schema Validation Complete ({validationResult.match_percentage}% match)</p>
                    <p className="text-slate-300 text-[11px]">
                      Derived features (loan_to_income_ratio, payment_stress) auto-calculated by backend.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-surface/60 border border-surface-border flex justify-between">
                      <span className="text-slate-400">customer_id → customer_id</span>
                      <span className="text-emerald-400 font-bold">Matched ✓</span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface/60 border border-surface-border flex justify-between">
                      <span className="text-slate-400">monthly_income → monthly_income_pkr</span>
                      <span className="text-emerald-400 font-bold">Matched ✓</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 rounded-xl bg-surface-hover text-slate-300 text-xs font-semibold"
                  >
                    Back
                  </button>
                  {!validationResult ? (
                    <button
                      onClick={handleValidateSchema}
                      className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center gap-2"
                    >
                      Run Schema Validation <Sliders className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleMergeAndPredict}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-brand-600 text-white text-xs font-bold flex items-center gap-2 shadow-glow-green"
                    >
                      Merge by customer_id & Predict <Sparkles className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 5: Merge & Predict Complete */}
            {activeStep === 5 && mergeResult && (
              <motion.div key="step-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">Integration Flow Completed</h3>
                  <p className="text-xs text-slate-300">
                    Successfully merged {mergeResult.total_merged_records} records by `customer_id` and executed champion model risk predictions!
                  </p>
                  <button
                    onClick={() => setActiveStep(1)}
                    className="px-4 py-2 rounded-xl bg-surface-hover text-slate-300 text-xs font-semibold border border-surface-border mt-2"
                  >
                    Start New Integration
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
