'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FilePlus,
  Users,
  Grid,
  Layers,
  Database,
  History,
  BrainCircuit,
  HelpCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const mainTabs = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Assessments', href: '/assessment', icon: FilePlus },
    { name: 'Customers', href: '/customers', icon: Users },
  ];

  const moreItems = [
    { name: 'Batch Prediction', href: '/batch', icon: Layers },
    { name: 'Data Integration', href: '/integration', icon: Database },
    { name: 'Results History', href: '/results', icon: History },
    { name: 'Model Info', href: '/model-info', icon: BrainCircuit },
    { name: 'How It Works', href: '/how-it-works', icon: HelpCircle },
  ];

  return (
    <>
      {/* More Modal Drawer for Mobile */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden flex flex-col justify-end"
            onClick={() => setMoreOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-surface-card border-t border-surface-border rounded-t-3xl p-6 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <h3 className="font-bold text-white text-base">Navigation Menu</h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                        isActive
                          ? 'bg-brand-600/20 border-brand-500 text-brand-400'
                          : 'bg-surface border-surface-border text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-brand-400" />
                      <span className="text-xs font-semibold">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sticky Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-card/95 backdrop-blur-lg border-t border-surface-border z-40 px-4 flex items-center justify-around">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 transition ${
                isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-col items-center justify-center gap-1 transition ${
            moreOpen ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </>
  );
};
