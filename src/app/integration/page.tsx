'use client';

import React, { useEffect, useState } from 'react';
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
  ShieldCheck,
  Server,
  Layers,
  ChevronRight,
  ShieldAlert,
  Play
} from 'lucide-react';
import { api } from '@/lib/api';

interface ConnectorCardItem {
  id: string;
  name: string;
  category: 'database' | 'cloud_storage' | 'data_warehouse';
  icon: any;
  configured: boolean;
  status: 'Not Configured' | 'Connecting' | 'Connected' | 'Connection Failed' | 'Not Connected';
  errorMessage?: string;
  envVarsRequired: string[];
}

const initialConnectors: ConnectorCardItem[] = [
  {
    id: 'bigquery',
    name: 'Google BigQuery',
    category: 'data_warehouse',
    icon: Cloud,
    configured: false,
    status: 'Not Configured',
    envVarsRequired: ['GCP_PROJECT_ID', 'GCP_SERVICE_ACCOUNT_JSON'],
  },
  {
    id: 'gcs',
    name: 'Google Cloud Storage',
    category: 'cloud_storage',
    icon: Cloud,
    configured: false,
    status: 'Not Configured',
    envVarsRequired: ['GCP_GCS_BUCKET', 'GCP_SERVICE_ACCOUNT_JSON'],
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    category: 'database',
    icon: Database,
    configured: false,
    status: 'Not Configured',
    envVarsRequired: ['POSTGRES_URL'],
  },
  {
    id: 'mysql',
    name: 'MySQL',
    category: 'database',
    icon: Database,
    configured: false,
    status: 'Not Configured',
    envVarsRequired: ['MYSQL_HOST', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD'],
  },
  {
    id: 's3',
    name: 'AWS S3',
    category: 'cloud_storage',
    icon: Cloud,
    configured: false,
    status: 'Not Configured',
    envVarsRequired: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'],
  },
  {
    id: 'azure-blob',
    name: 'Azure Blob Storage',
    category: 'cloud_storage',
    icon: Cloud,
    configured: false,
    status: 'Not Configured',
    envVarsRequired: ['AZURE_STORAGE_ACCOUNT_URL', 'AZURE_STORAGE_CONTAINER'],
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    category: 'data_warehouse',
    icon: Server,
    configured: false,
    status: 'Not Configured',
    envVarsRequired: ['SNOWFLAKE_ACCOUNT', 'SNOWFLAKE_USER', 'SNOWFLAKE_DATABASE'],
  },
];

export default function DataIntegrationPage() {
  const [connectors, setConnectors] = useState<ConnectorCardItem[]>(initialConnectors);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorCardItem>(initialConnectors[0]);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [testing, setTesting] = useState(false);
  const [sources, setSources] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [schemaResult, setSchemaResult] = useState<any>(null);
  const [predictionResults, setPredictionResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load connector configuration statuses on mount
  useEffect(() => {
    async function loadStatuses() {
      try {
        const res = await fetch('/api/integrations/status');
        if (res.ok) {
          const statusMap = await res.json();
          setConnectors((prev) =>
            prev.map((c) => {
              const info = statusMap[c.id];
              if (info) {
                return {
                  ...c,
                  configured: info.configured,
                  status: info.configured ? 'Not Connected' : 'Not Configured',
                };
              }
              return c;
            })
          );
        }
      } catch (err) {
        console.error('Failed to load connector statuses:', err);
      }
    }
    loadStatuses();
  }, []);

  // Step 1: Test Connection
  const handleTestConnection = async () => {
    setTesting(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_type: selectedConnector.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Connection failed.');
        setConnectors((prev) =>
          prev.map((c) => (c.id === selectedConnector.id ? { ...c, status: 'Connection Failed' } : c))
        );
        return;
      }

      setConnectors((prev) =>
        prev.map((c) => (c.id === selectedConnector.id ? { ...c, status: 'Connected', configured: true } : c))
      );
      setActiveStep(2);
      handleDiscoverSources();
    } catch (err: any) {
      setError(err.message || 'Connection test failed.');
    } finally {
      setTesting(false);
    }
  };

  // Step 2: Discover Sources
  const handleDiscoverSources = async () => {
    try {
      const res = await fetch('/api/integrations/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_type: selectedConnector.id }),
      });
      const data = await res.json();
      if (res.ok && data.sources) {
        setSources(data.sources);
        if (data.sources.length > 0) {
          setSelectedSource(data.sources[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to discover sources:', err);
    }
  };

  // Step 3: Preview Data
  const handleFetchPreview = async () => {
    setTesting(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_type: selectedConnector.id, source: selectedSource }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Data preview failed.');
        return;
      }
      setPreviewData(data);
      setActiveStep(3);
    } catch (err: any) {
      setError(err.message || 'Data preview failed.');
    } finally {
      setTesting(false);
    }
  };

  // Step 4 & 5: Validate Schema
  const handleValidateSchema = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/integrations/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_type: selectedConnector.id, source: selectedSource }),
      });
      const data = await res.json();
      setSchemaResult(data);
      setActiveStep(5);
    } catch (err) {
      setError('Schema validation failed.');
    } finally {
      setTesting(false);
    }
  };

  // Step 6: Import & Predict with Champion ML Model
  const handleImportAndPredict = async () => {
    setTesting(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_type: selectedConnector.id, source: selectedSource, limit: 100 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Import and ML modeling failed.');
        return;
      }
      setPredictionResults(data);
      setActiveStep(6);
    } catch (err: any) {
      setError(err.message || 'Import execution failed.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400" />
            Enterprise Data Integration Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connect enterprise cloud databases & storage directly to Champion ML Risk Engine
          </p>
        </div>
      </div>

      {/* Connector Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {connectors.map((c) => {
          const Icon = c.icon;
          const isSelected = selectedConnector.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => {
                setSelectedConnector(c);
                setActiveStep(1);
                setError(null);
                setPreviewData(null);
                setSchemaResult(null);
                setPredictionResults(null);
              }}
              className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between h-36 ${
                isSelected
                  ? 'bg-brand-600/20 border-brand-500 shadow-glow-blue'
                  : 'bg-surface-card border-surface-border hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.status === 'Connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface/80 text-slate-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    c.status === 'Connected'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : c.status === 'Connection Failed'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-white">{c.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wider">{c.category.replace('_', ' ')}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stepper Wizard Progress */}
      <div className="glass-card p-4 flex items-center justify-between text-xs border-surface-border overflow-x-auto">
        {[
          { step: 1, label: '1. Test Connection' },
          { step: 2, label: '2. Select Source' },
          { step: 3, label: '3. Data Preview' },
          { step: 4, label: '4. Map Columns' },
          { step: 5, label: '5. Validate Schema' },
          { step: 6, label: '6. Predict Risk' },
        ].map((s) => (
          <div key={s.step} className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                activeStep === s.step
                  ? 'bg-brand-500 text-white'
                  : activeStep > s.step
                  ? 'bg-emerald-500 text-white'
                  : 'bg-surface border border-surface-border text-slate-400'
              }`}
            >
              {s.step}
            </span>
            <span className={activeStep === s.step ? 'font-bold text-white' : 'text-slate-400'}>{s.label}</span>
            {s.step < 6 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 ml-1" />}
          </div>
        ))}
      </div>

      {/* Step Action Container */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-brand-400" />
              Connector Configuration: {selectedConnector.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Required Server Env Vars: <code className="font-mono text-brand-300">{selectedConnector.envVarsRequired.join(', ')}</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Configuration Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                selectedConnector.configured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {selectedConnector.configured ? 'Configured in Environment' : 'Not Configured'}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Connect / Test */}
        {activeStep === 1 && (
          <div className="p-8 text-center border border-dashed border-surface-border rounded-2xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Server className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Test Connection to {selectedConnector.name}</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Verifies server environment variables ({selectedConnector.envVarsRequired.join(', ')}) and performs low-cost authentication test.
              </p>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-glow-blue inline-flex items-center gap-2"
            >
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Test Backend Connection
            </button>
          </div>
        )}

        {/* STEP 2: Select Source */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Discovered Tables / Objects</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {sources.map((src) => (
                <button
                  key={src.name}
                  onClick={() => setSelectedSource(src.name)}
                  className={`p-3.5 rounded-xl border text-left text-xs transition ${
                    selectedSource === src.name
                      ? 'bg-brand-600/20 border-brand-500 text-white'
                      : 'bg-surface/60 border-surface-border text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <p className="font-mono font-bold truncate">{src.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase">{src.type}</p>
                </button>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleFetchPreview}
                disabled={testing || !selectedSource}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Fetch Data Preview'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview Data */}
        {activeStep === 3 && previewData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Data Preview: {previewData.source}</h3>
              <span className="text-xs text-slate-400">Sample Records: {previewData.sample_records?.length || 0}</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-surface-border">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase bg-surface/80 border-b border-surface-border">
                  <tr>
                    {previewData.columns?.map((col: string) => (
                      <th key={col} className="py-3 px-3 font-mono">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-slate-200">
                  {previewData.sample_records?.map((rec: any, idx: number) => (
                    <tr key={idx} className="hover:bg-surface-hover/50 transition">
                      {previewData.columns?.map((col: string) => (
                        <td key={col} className="py-2.5 px-3 font-mono text-[11px]">{String(rec[col] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setActiveStep(4)}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition flex items-center gap-2"
              >
                Proceed to Column Mapping <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Column Mapping */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Auto Column Alias Mapping</h3>
            <p className="text-xs text-slate-400">
              Source columns are automatically mapped to standard ML features (`monthly_income_pkr`, `loan_amount_pkr`, `credit_score`, etc.). Derived ratio features are computed by the backend.
            </p>

            <div className="p-4 rounded-xl bg-surface/60 border border-surface-border text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-surface-border/50">
                <span className="text-slate-400">Required Source Columns:</span>
                <span className="font-bold text-white">21 Features + customer_id</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-border/50">
                <span className="text-slate-400">Backend Derived Features:</span>
                <span className="font-mono text-brand-300">loan_to_income_ratio, savings_to_income_ratio, payment_stress</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleValidateSchema}
                disabled={testing}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Validate Schema Compliance'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Validate Schema */}
        {activeStep === 5 && schemaResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Schema Validation Summary</h3>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                Match Score: {schemaResult.match_percentage}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                <p className="text-[10px] text-slate-400">Required Features</p>
                <p className="font-bold text-white mt-0.5">{schemaResult.required_source_columns?.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                <p className="text-[10px] text-slate-400">Matched Columns</p>
                <p className="font-bold text-emerald-400 mt-0.5">{schemaResult.matched_columns?.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                <p className="text-[10px] text-slate-400">Derived Features</p>
                <p className="font-bold text-brand-400 mt-0.5">{schemaResult.derived_columns?.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                <p className="text-[10px] text-slate-400">Missing Columns</p>
                <p className="font-bold text-slate-300 mt-0.5">{schemaResult.missing_columns?.length || 0}</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleImportAndPredict}
                disabled={testing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-brand-600 hover:from-emerald-500 hover:to-brand-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-glow-blue flex items-center gap-2"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Execute Champion Model Inference
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Predictions Result */}
        {activeStep === 6 && predictionResults && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Champion Model Prediction Completed
                </h3>
                <p className="text-xs text-slate-400">Source: {predictionResults.source}</p>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                {predictionResults.summary?.valid_records || 0} Records Evaluated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="glass-card p-4 border-emerald-500/30">
                <p className="text-slate-400">Low Risk Approved</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{predictionResults.summary?.low_risk_count}</p>
              </div>

              <div className="glass-card p-4 border-amber-500/30">
                <p className="text-slate-400">Medium Risk Review</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{predictionResults.summary?.medium_risk_count}</p>
              </div>

              <div className="glass-card p-4 border-rose-500/30">
                <p className="text-slate-400">High Risk Rejected</p>
                <p className="text-2xl font-bold text-rose-400 mt-1">{predictionResults.summary?.high_risk_count}</p>
              </div>

              <div className="glass-card p-4 border-brand-500/30">
                <p className="text-slate-400">Avg Default Probability</p>
                <p className="text-2xl font-bold text-brand-400 mt-1">
                  {predictionResults.summary?.average_default_probability_pct}%
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setActiveStep(1);
                  setPredictionResults(null);
                }}
                className="px-4 py-2 rounded-xl bg-surface-hover text-slate-300 text-xs font-medium border border-surface-border"
              >
                Run Another Integration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
