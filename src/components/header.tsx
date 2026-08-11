'use client';

import React from 'react';
import { Search, Bell, Sun, User } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 border-b border-surface-border bg-surface-card/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="relative w-72 lg:w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search customer, assessment, etc..."
          className="w-full bg-surface-hover/80 border border-surface-border rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Model Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Champion Online
        </div>

        {/* Theme Toggle Button */}
        <button className="w-9 h-9 rounded-xl bg-surface-hover border border-surface-border flex items-center justify-center text-slate-400 hover:text-white transition">
          <Sun className="w-4 h-4" />
        </button>

        {/* Notification Icon */}
        <div className="relative">
          <button className="w-9 h-9 rounded-xl bg-surface-hover border border-surface-border flex items-center justify-center text-slate-400 hover:text-white transition">
            <Bell className="w-4 h-4" />
          </button>
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 border border-surface-card"></span>
        </div>

        {/* Profile Avatar */}
        <div className="w-9 h-9 rounded-full bg-brand-600 border border-brand-500 flex items-center justify-center text-white font-bold text-xs shadow-glow-blue cursor-pointer">
          JS
        </div>
      </div>
    </header>
  );
};
