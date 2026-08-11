'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RiskGaugeProps {
  probability: number; // 0 to 1 or 0 to 100
  riskLevel?: 'Low Risk' | 'Medium Risk' | 'High Risk';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  probability,
  riskLevel,
  size = 'md',
  showLabel = true,
}) => {
  // Normalize probability to percentage (0 - 100)
  const pct = probability > 1 ? probability : probability * 100;
  const clampedPct = Math.min(Math.max(pct, 0), 100);

  // Derived risk level if not provided
  const derivedRiskLevel =
    riskLevel || (clampedPct < 35 ? 'Low Risk' : clampedPct <= 65 ? 'Medium Risk' : 'High Risk');

  // Angle range: -90 degrees (0%) to +90 degrees (100%)
  const needleAngle = -90 + (clampedPct / 100) * 180;

  // Dimensions based on size
  const dimensions = {
    sm: { width: 160, height: 95, radius: 65, stroke: 12, fontSize: 'text-xl' },
    md: { width: 220, height: 130, radius: 90, stroke: 16, fontSize: 'text-3xl' },
    lg: { width: 280, height: 165, radius: 115, stroke: 20, fontSize: 'text-4xl' },
  }[size];

  const { width, height, radius, stroke, fontSize } = dimensions;
  const center = width / 2;
  const centerY = height - 15;

  // Color config based on risk
  const getBadgeStyle = () => {
    switch (derivedRiskLevel) {
      case 'Low Risk':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 glow-green';
      case 'Medium Risk':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40 glow-amber';
      case 'High Risk':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40 glow-red';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
          <radialGradient id="needleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background Arc Track */}
        <path
          d={`M ${center - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${center + radius} ${centerY}`}
          fill="none"
          stroke="#1E293B"
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {/* Colored Gradient Arc */}
        <path
          d={`M ${center - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${center + radius} ${centerY}`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${Math.PI * radius}`}
          strokeDashoffset={0}
        />

        {/* Animated Needle */}
        <motion.g
          initial={{ rotate: -90 }}
          animate={{ rotate: needleAngle }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          style={{ originX: `${center}px`, originY: `${centerY}px` }}
        >
          {/* Needle Shaft */}
          <line
            x1={center}
            y1={centerY}
            x2={center}
            y2={centerY - radius + stroke + 4}
            stroke="#FFFFFF"
            strokeWidth={3}
            strokeLinecap="round"
          />
          {/* Center Hub */}
          <circle cx={center} cy={centerY} r={7} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={2} />
        </motion.g>
      </svg>

      {/* Percentage Text Display */}
      <div className="mt-2 text-center">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-0.5">
          Default Probability
        </span>
        <motion.span
          key={clampedPct}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${fontSize} font-extrabold tracking-tight text-white drop-shadow-md`}
        >
          {clampedPct.toFixed(2)}%
        </motion.span>

        {showLabel && (
          <div className="mt-2">
            <span className={`inline-block border px-3 py-1 rounded-full text-xs font-bold ${getBadgeStyle()}`}>
              {derivedRiskLevel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
