'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Award, CheckCircle2, Shield, BarChart3, Database } from 'lucide-react';
import { api } from '@/lib/api';
import { ModelMetrics } from '@/lib/types';
import { ModelPerformanceChart } from '@/components/model-performance-chart';

export default function ModelInfoPage() {
  const [info, setInfo] = useState<ModelMetrics | null>(null);

  useEffect(() => {
    async function loadInfo() {
      try {
        const data = await api.getModelInfo();
        setInfo(data);
      } catch (err) {
        console.error('Failed to load model metadata:', err);
      }
    }
    loadInfo();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-brand-400" />
            Champion Model Architecture & Performance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Production Model: Logistic Regression Champion (`credit_risk_pipeline.joblib`)
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold self-start">
          <Award className="w-4 h-4" /> Champion Deployed (v1.0.0)
        </div>
      </div>

      {/* Metrics Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-[11px] text-slate-400">Accuracy</p>
          <p className="text-2xl font-bold text-white mt-1">77.50%</p>
        </div>
        <div className="glass-card p-4 text-center border-brand-500/30">
          <p className="text-[11px] text-slate-400">ROC-AUC</p>
          <p className="text-2xl font-bold text-brand-400 mt-1">0.8342</p>
        </div>
        <div className="glass-card p-4 text-center border-indigo-500/30">
          <p className="text-[11px] text-slate-400">F1 Score</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">0.4000</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-[11px] text-slate-400">Precision</p>
          <p className="text-2xl font-bold text-slate-200 mt-1">30.77%</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-[11px] text-slate-400">Recall</p>
          <p className="text-2xl font-bold text-slate-200 mt-1">57.14%</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-[11px] text-slate-400">PR-AUC</p>
          <p className="text-2xl font-bold text-slate-200 mt-1">0.4194</p>
        </div>
      </div>

      {/* Performance Chart & Model Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            ROC-AUC & Validation Metrics Summary
          </h2>
          <div className="h-64 pt-2">
            <ModelPerformanceChart />
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            Model Pipeline Details
          </h2>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-brand-600/20 border border-brand-500/40">
              <p className="font-bold text-white">Algorithm</p>
              <p className="text-slate-300 mt-0.5">LogisticRegression (liblinear solver)</p>
            </div>
            <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
              <p className="font-bold text-slate-300">Class Weighting</p>
              <p className="text-slate-400 mt-0.5">Balanced (Cost-sensitive for default risk)</p>
            </div>
            <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
              <p className="font-bold text-slate-300">Preprocessing</p>
              <p className="text-slate-400 mt-0.5">SimpleImputer + StandardScaler + OneHotEncoder</p>
            </div>
            <div className="p-3 rounded-xl bg-surface/60 border border-surface-border">
              <p className="font-bold text-slate-300">Training Records</p>
              <p className="text-slate-400 mt-0.5">800 cleaned records (after deduplication)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Schema List */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          25 Input Features & Training Schema
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
          {(info?.input_features || [
            "age", "monthly_income_pkr", "employment_years", "employment_type",
            "existing_customer_years", "account_balance_pkr", "loan_amount_pkr", "loan_term_months",
            "interest_rate_pct", "credit_score", "debt_to_income_pct", "missed_payments_12m",
            "late_payments_24m", "number_of_open_loans", "savings_balance_pkr", "avg_monthly_transactions",
            "avg_monthly_card_spend_pkr", "digital_logins_30d", "city_tier", "home_ownership",
            "loan_purpose", "previous_default", "loan_to_income_ratio", "savings_to_income_ratio", "payment_stress"
          ]).map((feat) => (
            <div key={feat} className="p-2.5 rounded-xl bg-surface/60 border border-surface-border font-mono text-slate-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
