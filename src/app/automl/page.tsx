'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  UploadCloud,
  Layers,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Download,
  HelpCircle,
  Play,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Target,
  FileSpreadsheet,
  Check,
  Zap
} from 'lucide-react';
import { api } from '@/lib/api';
import { DatasetInspectionResult, ColumnSummary, AutoMLResult } from '@/lib/types';

function parseCSVToJSON(text: string, maxRows = 2000): { records: any[]; totalRows: number } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return { records: [], totalRows: 0 };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const totalRows = lines.length - 1;
  const targetLines = lines.slice(1, maxRows + 1);

  const records = targetLines.map((line) => {
    const values: string[] = [];
    let insideQuote = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));

    const rowObj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      if (h) {
        const val = values[idx] ?? '';
        const num = Number(val);
        rowObj[h] = val !== '' && !isNaN(num) ? num : val;
      }
    });
    return rowObj;
  });

  return { records, totalRows };
}

export default function UniversalAutoMLPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRecords, setParsedRecords] = useState<any[]>([]);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inspection, setInspection] = useState<DatasetInspectionResult | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<'binary' | 'multiclass' | 'regression' | 'unsupervised'>('binary');
  const [autoMLResult, setAutoMLResult] = useState<AutoMLResult | null>(null);

  const handleFileUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setError(null);

    try {
      let records: any[] = [];
      if (selectedFile.name.endsWith('.csv')) {
        const text = await selectedFile.text();
        const parsed = parseCSVToJSON(text, 2000);
        records = parsed.records;
      } else if (selectedFile.name.endsWith('.json')) {
        const text = await selectedFile.text();
        const rawJson = JSON.parse(text);
        records = Array.isArray(rawJson) ? rawJson.slice(0, 2000) : (rawJson.records || []).slice(0, 2000);
      } else {
        throw new Error('Please upload a valid CSV or JSON dataset file.');
      }

      if (records.length === 0) {
        throw new Error('Uploaded dataset file contains no readable data records.');
      }

      setParsedRecords(records);
      const res = await api.inspectAutoMLDataset(records, selectedFile.name);
      setInspection(res);
      
      if (res.target_candidates && res.target_candidates.length > 0) {
        setSelectedTarget(res.target_candidates[0].name);
      } else {
        setSelectedTarget(null);
      }
      setSelectedTask(res.suggested_task || 'unsupervised');
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to inspect dataset.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAutoML = async () => {
    if (parsedRecords.length === 0) return;
    setLoading(true);
    setError(null);
    setStep(3);

    try {
      const res = await api.trainAndPredictAutoML({
        records: parsedRecords,
        target_column: selectedTarget,
        task_type: selectedTask,
      });
      setAutoMLResult(res);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'AutoML model training failed.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!autoMLResult || !autoMLResult.csv_content) return;
    const blob = new Blob([autoMLResult.csv_content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `automl_predictions_${file?.name || 'dataset'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Cpu className="w-6 h-6 text-brand-400" />
              Universal Dataset Analyzer & AutoML Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase tracking-wide">
              Universal Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyze any CSV/JSON dataset, confirm prediction target, auto-detect task, train dynamic models & export predictions
          </p>
        </div>
      </div>

      {/* Stepper Progress */}
      <div className="glass-card p-4 flex items-center justify-between text-xs border-surface-border overflow-x-auto">
        {[
          { step: 1, label: '1. Upload Dataset' },
          { step: 2, label: '2. Target & Task Confirmation' },
          { step: 3, label: '3. AutoML Training' },
          { step: 4, label: '4. Evaluation & Export' },
        ].map((s) => (
          <div key={s.step} className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === s.step
                  ? 'bg-brand-500 text-white shadow-glow-blue'
                  : step > s.step
                  ? 'bg-emerald-500 text-white'
                  : 'bg-surface border border-surface-border text-slate-400'
              }`}
            >
              {s.step}
            </span>
            <span className={step === s.step ? 'font-bold text-white' : 'text-slate-400'}>{s.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Upload Dataset */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 text-center border-dashed border-2 border-surface-border hover:border-brand-500/50 transition cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
        >
          <input
            type="file"
            id="automl-file-input"
            accept=".csv, .json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          <label htmlFor="automl-file-input" className="cursor-pointer block space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 mx-auto flex items-center justify-center text-brand-400 shadow-glow-blue">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-white">Upload Any CSV / JSON Dataset</p>
              <p className="text-xs text-slate-400 mt-1">
                Upload banking, churn, fraud, pricing, sales, or customer data files
              </p>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-brand-400 text-xs font-semibold pt-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Inspecting dataset schema & target candidates...
              </div>
            )}
          </label>
        </motion.div>
      )}

      {/* STEP 2: Confirm Target & Task Selection */}
      {step === 2 && inspection && (
        <div className="space-y-6">
          {/* Dataset Quality Overview */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-brand-400" />
                  Dataset Inspection Summary: {inspection.filename}
                </h3>
                <p className="text-xs text-slate-400">Smart Schema Analysis & Target Detection</p>
              </div>

              {inspection.is_credit_risk_schema && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                  Matches CreditRisk Champion Schema
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                <p className="text-[10px] text-slate-400">Total Records</p>
                <p className="font-bold text-white mt-0.5">{inspection.total_rows.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                <p className="text-[10px] text-slate-400">Total Columns</p>
                <p className="font-bold text-white mt-0.5">{inspection.total_columns}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                <p className="text-[10px] text-slate-400">Duplicate Rows</p>
                <p className="font-bold text-slate-300 mt-0.5">{inspection.duplicate_rows}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                <p className="text-[10px] text-slate-400">Suggested Task</p>
                <p className="font-bold text-brand-400 uppercase mt-0.5">{inspection.suggested_task}</p>
              </div>
            </div>
          </div>

          {/* Target Column Selection Form */}
          <div className="glass-card p-6 space-y-4 border-brand-500/30 bg-brand-500/5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-400" />
                Confirm Prediction Target Column
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                The analyzer detected potential target columns below. Confirm your intended prediction target or choose Unsupervised Analysis.
              </p>
            </div>

            <div className="space-y-2">
              {inspection.columns.map((col) => (
                <label
                  key={col.name}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition text-xs ${
                    selectedTarget === col.name
                      ? 'bg-brand-600/20 border-brand-500 text-white'
                      : 'bg-surface/60 border-surface-border text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="target_col"
                      checked={selectedTarget === col.name}
                      onChange={() => {
                        setSelectedTarget(col.name);
                        if (col.unique_count === 2) setSelectedTask('binary');
                        else if (col.unique_count <= 15) setSelectedTask('multiclass');
                        else if (col.data_type === 'numeric') setSelectedTask('regression');
                      }}
                      className="accent-brand-500"
                    />
                    <div>
                      <p className="font-mono font-bold">{col.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {col.data_type.toUpperCase()} • {col.unique_count} unique values • Missing: {col.missing_pct}%
                      </p>
                    </div>
                  </div>

                  {col.is_target_candidate && (
                    <span className="px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-semibold border border-brand-500/30">
                      Likely Target ({col.target_score} pts)
                    </span>
                  )}
                </label>
              ))}

              {/* Option for Unsupervised / No Target */}
              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition text-xs ${
                  selectedTarget === null
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-surface/60 border-surface-border text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="target_col"
                    checked={selectedTarget === null}
                    onChange={() => {
                      setSelectedTarget(null);
                      setSelectedTask('unsupervised');
                    }}
                    className="accent-purple-500"
                  />
                  <div>
                    <p className="font-bold text-purple-300">No Target / Unsupervised Analysis</p>
                    <p className="text-[11px] text-slate-400">Run K-Means Clustering & Anomaly Detection on feature columns</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                  Clustering Mode
                </span>
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleRunAutoML}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white text-xs font-bold transition shadow-glow-blue flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Train AutoML Pipeline & Predict
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Training Progress */}
      {step === 3 && (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-500/20 border border-brand-500/40 mx-auto flex items-center justify-center text-brand-400 animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AutoML Model Training in Progress</h3>
            <p className="text-xs text-slate-400 mt-1">
              Imputing missing values, encoding features, training cross-validated models & evaluating metrics...
            </p>
          </div>
        </div>
      )}

      {/* STEP 4: Results & Download */}
      {step === 4 && autoMLResult && (
        <div className="space-y-6">
          {/* Results Summary Header */}
          <div className="glass-card p-6 space-y-4 border-emerald-500/30">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  AutoML Training & Prediction Completed
                </h3>
                <p className="text-xs text-slate-400">Algorithm: {autoMLResult.best_algorithm}</p>
              </div>

              <button
                onClick={handleDownloadCSV}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-glow-emerald flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Predictions CSV
              </button>
            </div>

            {/* Record Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                <p className="text-[10px] text-slate-400">Total Uploaded</p>
                <p className="font-bold text-white mt-0.5">{autoMLResult.total_uploaded_rows || autoMLResult.predictions.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                <p className="text-[10px] text-slate-400">Analyzed Rows</p>
                <p className="font-bold text-white mt-0.5">{autoMLResult.total_analyzed_rows || autoMLResult.predictions.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                <p className="text-[10px] text-slate-400">Train Rows (X_train)</p>
                <p className="font-bold text-brand-300 mt-0.5">{autoMLResult.train_rows}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                <p className="text-[10px] text-slate-400">Test Rows (X_test)</p>
                <p className="font-bold text-brand-300 mt-0.5">{autoMLResult.test_rows}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
                <p className="text-[10px] text-slate-400">Predicted Rows</p>
                <p className="font-bold text-emerald-400 mt-0.5">{autoMLResult.predicted_rows || autoMLResult.predictions.length}</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {Object.entries(autoMLResult.metrics).map(([key, val]) => (
                <div key={key} className="p-3.5 rounded-xl bg-surface/60 border border-surface-border">
                  <p className="text-[10px] text-slate-400 uppercase">{key}</p>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">{String(val)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Model Comparison Table */}
          {autoMLResult.compared_models && autoMLResult.compared_models.length > 0 && (
            <div className="glass-card p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-400" />
                AutoML Algorithm Comparison & Evaluation
              </h4>

              <div className="overflow-x-auto rounded-xl border border-surface-border">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 uppercase bg-surface/80 border-b border-surface-border">
                    <tr>
                      <th className="py-2.5 px-3">Algorithm Model</th>
                      <th className="py-2.5 px-3">Evaluation Metric</th>
                      <th className="py-2.5 px-3">Test Score</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/50 text-slate-200">
                    {autoMLResult.compared_models.map((cand) => (
                      <tr key={cand.model} className={cand.selected ? 'bg-brand-500/10 font-bold' : ''}>
                        <td className="py-2.5 px-3">{cand.model}</td>
                        <td className="py-2.5 px-3 font-mono">{cand.metric}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{cand.score}</td>
                        <td className="py-2.5 px-3 text-right">
                          {cand.selected ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-extrabold">
                              ★ Champion Selected
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Evaluated</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Feature Importance */}
          {autoMLResult.feature_importances && autoMLResult.feature_importances.length > 0 && (
            <div className="glass-card p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                Top Feature Importance Rankings
              </h4>

              <div className="space-y-2">
                {autoMLResult.feature_importances.map((item) => (
                  <div key={item.feature} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-mono text-slate-300">{item.feature}</span>
                      <span className="font-bold text-brand-300">{(item.importance * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface">
                      <div
                        className="h-2 rounded-full bg-brand-500"
                        style={{ width: `${Math.min(100, item.importance * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Predictions Table Preview */}
          <div className="glass-card p-5 space-y-3">
            <h4 className="text-sm font-bold text-white">Prediction Table Preview (First 10 Records)</h4>

            <div className="overflow-x-auto rounded-xl border border-surface-border">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase bg-surface/80 border-b border-surface-border">
                  <tr>
                    {Object.keys(autoMLResult.predictions[0] || {}).map((col) => (
                      <th key={col} className="py-3 px-3 font-mono">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-slate-200">
                  {autoMLResult.predictions.slice(0, 10).map((rec, idx) => (
                    <tr key={idx} className="hover:bg-surface-hover/50 transition">
                      {Object.keys(autoMLResult.predictions[0] || {}).map((col) => (
                        <td key={col} className="py-2.5 px-3 font-mono text-[11px]">{String(rec[col] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
