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
  { id: 'postgresql', name: 'PostgreSQL', icon: Database, connected: false, status: 'Not Connected' },
  { id: 'mysql', name: 'MySQL', icon: Database, connected: false, status: 'Not Connected' },
  { id: 'bigquery', name: 'BigQuery', icon: Cloud, connected: false, status: 'Not Connected' },
  { id: 's3', name: 'AWS S3', icon: Cloud, connected: false, status: 'Not Connected' },
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
      setError(err?.response?.data?.detail || 'Cloud connector not implemented (HTTP 501). Google Cloud integration pending.');
    } finally {
      setTesting(false);
    }
  };

  // Step 2: Fetch Preview Data
  const handleFetchPreview = async () => {
    try {
      const res = await api.previewData({ source_type: selectedConnector.id });
      setPreviewData(res);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Cloud data integration pending (HTTP 501).');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400" />
            Enterprise Data Integration Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connect external data sources & merge records into Champion ML pipeline
          </p>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {connectors.map((c) => {
          const Icon = c.icon;
          const isSelected = selectedConnector.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedConnector(c)}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between h-28 ${
                isSelected
                  ? 'bg-brand-600/20 border-brand-500 text-white'
                  : 'bg-surface-card border-surface-border hover:border-slate-600 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-5 h-5 ${c.connected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span
                  className={`w-2 h-2 rounded-full ${
                    c.connected ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
              </div>
              <div>
                <p className="text-xs font-bold truncate">{c.name}</p>
                <p className={`text-[10px] ${c.connected ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {c.status}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Connection & Workflow Step Content */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-brand-400" />
              Connector Configuration: {selectedConnector.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Target source: <code className="font-mono text-brand-300">{selectedConnector.id}</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
              Not Connected
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Action Button */}
        <div className="p-8 text-center border border-dashed border-surface-border rounded-xl space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-surface/80 border border-surface-border flex items-center justify-center text-slate-400">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Google Cloud Integration Pending</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Live BigQuery, PostgreSQL, and GCS connection handlers are pending cloud environment key configuration. HTTP 501 is returned until credentials are hooked up.
            </p>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-glow-blue inline-flex items-center gap-2"
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Test Cloud Connector
          </button>
        </div>
      </div>
    </div>
  );
}
