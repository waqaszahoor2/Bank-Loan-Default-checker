'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FilePlus,
  Layers,
  Database,
  Users,
  History,
  BrainCircuit,
  HelpCircle,
  ShieldCheck,
  UserCheck,
  Cpu
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'New Assessment', href: '/assessment', icon: FilePlus },
  { name: 'Batch Prediction', href: '/batch', icon: Layers },
  { name: 'Universal AutoML', href: '/automl', icon: Cpu },
  { name: 'Data Integration', href: '/integration', icon: Database },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Results History', href: '/results', icon: History },
  { name: 'Model Info', href: '/model-info', icon: BrainCircuit },
  { name: 'How It Works', href: '/how-it-works', icon: HelpCircle },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface-card border-r border-surface-border min-h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-surface-border">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-glow-blue">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white tracking-tight leading-none">
            CreditRisk <span className="text-brand-500">AI</span>
          </h1>
          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
            Champion ML System
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-glow-blue'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-hover'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-surface-border bg-surface/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300">
            <UserCheck className="w-5 h-5 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">John Smith</p>
            <p className="text-[11px] text-slate-400 truncate">Risk Analyst</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
