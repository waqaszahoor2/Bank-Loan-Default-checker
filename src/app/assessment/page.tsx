'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilePlus,
  User,
  DollarSign,
  Briefcase,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { RiskGauge } from '@/components/risk-gauge';
import { api } from '@/lib/api';
import { CustomerInput, PredictionResult } from '@/lib/types';

const defaultFormData: CustomerInput = {
  customer_id: 'CUST-' + Math.floor(10000 + Math.random() * 90000),
  age: 32,
  monthly_income_pkr: 75000,
  employment_years: 5,
  employment_type: 'Salaried',
  existing_customer_years: 2,
  account_balance_pkr: 150000,
  loan_amount_pkr: 250000,
  loan_term_months: 12,
  interest_rate_pct: 13.5,
  credit_score: 680,
  debt_to_income_pct: 25,
  missed_payments_12m: 0,
  late_payments_24m: 0,
  number_of_open_loans: 1,
  savings_balance_pkr: 100000,
  avg_monthly_transactions: 30,
  avg_monthly_card_spend_pkr: 15000,
  digital_logins_30d: 12,
  city_tier: 'Tier 1',
  home_ownership: 'Own',
  loan_purpose: 'Personal',
  previous_default: 0,
};

export default function NewAssessmentPage() {
  const [formData, setFormData] = useState<CustomerInput>(defaultFormData);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.predict(formData);
      setResult(res);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to generate credit risk assessment prediction.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      ...defaultFormData,
      customer_id: 'CUST-' + Math.floor(10000 + Math.random() * 90000),
    });
    setResult(null);
    setStep(1);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FilePlus className="w-6 h-6 text-brand-500" />
            New Credit Risk Assessment
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manual customer input evaluation using Logistic Regression Champion Model
          </p>
        </div>

        {/* Step Indicator (Mobile + Desktop) */}
        <div className="flex items-center gap-2 bg-surface-card p-1.5 rounded-xl border border-surface-border self-start">
          <button
            onClick={() => setStep(1)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              step === 1 ? 'bg-brand-600 text-white shadow-glow-blue' : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Details
          </button>
          <button
            onClick={() => setStep(2)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              step === 2 ? 'bg-brand-600 text-white shadow-glow-blue' : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Financials
          </button>
          <button
            disabled={!result}
            onClick={() => result && setStep(3)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              step === 3
                ? 'bg-brand-600 text-white shadow-glow-blue'
                : 'text-slate-500 disabled:opacity-40'
            }`}
          >
            3. Result
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <AnimatePresence mode="wait">
        {step < 3 ? (
          <motion.form
            key={`step-${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2); }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Form Fields Card */}
            <div className="lg:col-span-2 glass-card p-6 space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-brand-400 flex items-center gap-2">
                    <User className="w-4 h-4" /> Step 1: Applicant Profile & Employment
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Customer ID</label>
                      <input
                        type="text"
                        name="customer_id"
                        value={formData.customer_id}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-brand-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Age (years)</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3.5 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Monthly Income (PKR)</label>
                      <input
                        type="number"
                        name="monthly_income_pkr"
                        value={formData.monthly_income_pkr}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3.5 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Employment Type</label>
                      <select
                        name="employment_type"
                        value={formData.employment_type}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                      >
                        <option value="Salaried">Salaried</option>
                        <option value="Self-Employed">Self-Employed</option>
                        <option value="Contract">Contract</option>
                        <option value="Unemployed">Unemployed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Employment Tenure (years)</label>
                      <input
                        type="number"
                        step="0.1"
                        name="employment_years"
                        value={formData.employment_years}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3.5 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Existing Customer Tenure (years)</label>
                      <input
                        type="number"
                        step="0.1"
                        name="existing_customer_years"
                        value={formData.existing_customer_years}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3.5 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">City Tier</label>
                      <select
                        name="city_tier"
                        value={formData.city_tier}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                      >
                        <option value="Tier 1">Tier 1</option>
                        <option value="Tier 2">Tier 2</option>
                        <option value="Tier 3">Tier 3</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Home Ownership</label>
                      <select
                        name="home_ownership"
                        value={formData.home_ownership}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                      >
                        <option value="Own">Own</option>
                        <option value="Rent">Rent</option>
                        <option value="Mortgage">Mortgage</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-brand-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Step 2: Loan Request & Credit Record
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Loan Amount Requested (PKR)</label>
                      <input
                        type="number"
                        name="loan_amount_pkr"
                        value={formData.loan_amount_pkr}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:border-brand-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Loan Term (months)</label>
                      <input
                        type="number"
                        name="loan_term_months"
                        value={formData.loan_term_months}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3.5 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Interest Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="interest_rate_pct"
                        value={formData.interest_rate_pct}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3.5 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Credit Score (300 - 850)</label>
                      <input
                        type="number"
                        name="credit_score"
                        value={formData.credit_score}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:border-brand-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Debt to Income Ratio (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        name="debt_to_income_pct"
                        value={formData.debt_to_income_pct}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3.5 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Savings Balance (PKR)</label>
                      <input
                        type="number"
                        name="savings_balance_pkr"
                        value={formData.savings_balance_pkr}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3.5 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Missed Payments (12m)</label>
                      <input
                        type="number"
                        name="missed_payments_12m"
                        value={formData.missed_payments_12m}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3.5 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Previous Default Event</label>
                      <select
                        name="previous_default"
                        value={formData.previous_default}
                        onChange={handleInputChange}
                        className="w-full bg-surface/80 border border-surface-border rounded-xl px-3 py-2.5 text-white focus:border-brand-500 focus:outline-none"
                      >
                        <option value={0}>No (0)</option>
                        <option value={1}>Yes (1)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="pt-4 border-t border-surface-border flex items-center justify-between">
                {step === 2 ? (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl bg-surface-hover text-slate-300 text-xs font-semibold flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Details
                  </button>
                ) : (
                  <div />
                )}

                {step === 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-glow-blue flex items-center gap-2 ml-auto"
                  >
                    Next: Financials <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-glow-blue flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Evaluating Model...' : 'Calculate ML Prediction'}
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Live Feature Overview Sidebar */}
            <div className="glass-card p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Summary Preview
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-surface-border pb-2">
                    <span className="text-slate-400">Monthly Income:</span>
                    <span className="font-bold text-white">{formData.monthly_income_pkr.toLocaleString()} PKR</span>
                  </div>
                  <div className="flex justify-between border-b border-surface-border pb-2">
                    <span className="text-slate-400">Loan Requested:</span>
                    <span className="font-bold text-brand-400">{formData.loan_amount_pkr.toLocaleString()} PKR</span>
                  </div>
                  <div className="flex justify-between border-b border-surface-border pb-2">
                    <span className="text-slate-400">Credit Score:</span>
                    <span className="font-bold text-indigo-400">{formData.credit_score}</span>
                  </div>
                  <div className="flex justify-between border-b border-surface-border pb-2">
                    <span className="text-slate-400">DTI Ratio:</span>
                    <span className="font-bold text-slate-200">{formData.debt_to_income_pct}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-brand-600/10 border border-brand-500/20 text-slate-300 text-xs space-y-1">
                <p className="font-bold text-brand-400">Logistic Regression Champion</p>
                <p className="text-[11px] text-slate-400">
                  Evaluates 25 financial & behavioral parameters simultaneously.
                </p>
              </div>
            </div>
          </motion.form>
        ) : (
          /* Step 3: Result View */
          result && (
            <motion.div
              key="step-3-result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Primary Gauge Card */}
              <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Assessment Result
                </h3>

                <RiskGauge
                  probability={result.default_probability}
                  riskLevel={result.risk_level}
                  size="lg"
                />

                <div className="w-full pt-4 border-t border-surface-border space-y-2">
                  <p className="text-xs text-slate-400 font-medium">Recommended Lending Action</p>
                  <p
                    className={`text-base font-extrabold ${
                      result.risk_level === 'Low Risk'
                        ? 'text-emerald-400'
                        : result.risk_level === 'Medium Risk'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {result.risk_level === 'Low Risk'
                      ? 'APPROVE LOAN APPLICATION'
                      : result.risk_level === 'Medium Risk'
                      ? 'REQUIRES MANUAL UNDERWRITING REVIEW'
                      : 'REJECT LOAN APPLICATION'}
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-2.5 rounded-xl bg-surface-hover hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-surface-border flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Start New Assessment
                </button>
              </div>

              {/* Detailed Breakdown Card */}
              <div className="lg:col-span-2 glass-card p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-brand-400 mb-1">
                    Key Risk Factors & Model Insights
                  </h3>
                  <p className="text-xs text-slate-400">
                    Primary contributors driving the default probability calculation
                  </p>
                </div>

                <div className="space-y-3">
                  {result.key_risk_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-surface/60 border border-surface-border flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              factor.severity === 'high'
                                ? 'bg-rose-500'
                                : factor.severity === 'medium'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <p className="text-xs font-bold text-white">{factor.factor}</p>
                        </div>
                        <p className="text-xs text-slate-400">{factor.description}</p>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          factor.impact.startsWith('+')
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {factor.impact}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-surface/80 border border-surface-border text-xs space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Model Name:</span>
                    <span className="font-semibold text-white">{result.model_name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Version:</span>
                    <span className="font-semibold text-brand-400">{result.model_version}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Customer Reference:</span>
                    <span className="font-mono text-indigo-400">{result.customer_id}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
