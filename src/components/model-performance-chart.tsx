'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const performanceData = [
  { date: 'Apr 25', AUC: 0.812, F1: 0.380 },
  { date: 'May 01', AUC: 0.825, F1: 0.388 },
  { date: 'May 08', AUC: 0.828, F1: 0.392 },
  { date: 'May 15', AUC: 0.831, F1: 0.396 },
  { date: 'May 22', AUC: 0.834, F1: 0.400 },
];

export const ModelPerformanceChart: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col justify-between">
      {/* Metrics Banner */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-surface/60 p-2.5 rounded-xl border border-surface-border">
          <p className="text-[11px] text-slate-400">Accuracy</p>
          <p className="text-lg font-bold text-white">77.50%</p>
        </div>
        <div className="bg-surface/60 p-2.5 rounded-xl border border-surface-border">
          <p className="text-[11px] text-slate-400">ROC-AUC</p>
          <p className="text-lg font-bold text-brand-400">0.8342</p>
        </div>
        <div className="bg-surface/60 p-2.5 rounded-xl border border-surface-border">
          <p className="text-[11px] text-slate-400">F1 Score</p>
          <p className="text-lg font-bold text-indigo-400">0.4000</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="aucGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="f1Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis domain={[0.3, 0.9]} stroke="#64748B" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#161F33',
                borderColor: '#23304B',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Area type="monotone" dataKey="AUC" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#aucGrad)" />
            <Area type="monotone" dataKey="F1" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#f1Grad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-brand-500 rounded-full" />
          <span className="text-slate-400">ROC-AUC</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-indigo-500 rounded-full" />
          <span className="text-slate-400">F1 Score</span>
        </div>
      </div>
    </div>
  );
};
