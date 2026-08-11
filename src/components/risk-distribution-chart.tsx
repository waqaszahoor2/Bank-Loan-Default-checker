'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface RiskDistributionChartProps {
  highCount?: number;
  mediumCount?: number;
  lowCount?: number;
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({
  highCount = 32,
  mediumCount = 56,
  lowCount = 40,
}) => {
  const total = highCount + mediumCount + lowCount;

  const data = [
    { name: 'High Risk', value: highCount, color: '#EF4444', pct: Math.round((highCount / total) * 100) },
    { name: 'Medium Risk', value: mediumCount, color: '#F59E0B', pct: Math.round((mediumCount / total) * 100) },
    { name: 'Low Risk', value: lowCount, color: '#10B981', pct: Math.round((lowCount / total) * 100) },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
      {/* Recharts Pie */}
      <div className="w-44 h-44 relative flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#161F33',
                borderColor: '#23304B',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-slate-400 font-medium">Total</span>
          <span className="text-xl font-bold text-white leading-none">{total}</span>
        </div>
      </div>

      {/* Legend Breakdown */}
      <div className="space-y-2.5 flex-1 w-full">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-slate-300 font-medium">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-white font-bold">{item.value}</span>
              <span className="text-slate-400 ml-1 font-normal">({item.pct}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
