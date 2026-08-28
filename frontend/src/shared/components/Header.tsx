import React from 'react';
import { useAerisStore } from '../store/useAerisStore';
import { ActiveTab } from '../types';
import { DatabaseSwitcher } from './DatabaseSwitcher';
import {
  Code2,
  TableProperties,
  LayoutGrid,
  Activity,
  Search,
  Zap,
  Terminal,
  Cpu,
  Shield,
  Menu,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, toggleCommandPalette, currentMetrics, toggleMobileSidebar } = useAerisStore();

  const navTabs: { id: ActiveTab; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'query-editor', label: 'Console', icon: <Code2 className="w-4 h-4" />, shortcut: '⌘1' },
    { id: 'schema-builder', label: 'Schema', icon: <TableProperties className="w-4 h-4" />, shortcut: '⌘2' },
    { id: 'data-explorer', label: 'Explorer', icon: <LayoutGrid className="w-4 h-4" />, shortcut: '⌘3' },
    { id: 'dashboard', label: 'Metrics', icon: <Activity className="w-4 h-4" />, shortcut: '⌘4' },
    { id: 'session-manager', label: 'Sessions', icon: <Shield className="w-4 h-4" />, shortcut: '⌘5' },
  ];

  return (
    <header className="h-14 bg-[#0d131f] border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between shrink-0 select-none backdrop-blur-md gap-2">
      {/* Brand & Active Database */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={toggleMobileSidebar}
          className="p-1.5 md:hidden text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950 font-bold shrink-0">
            <Terminal className="w-4 h-4 text-slate-950" />
          </div>
          <div className="hidden xs:block sm:block">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white">AERIS</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded font-mono font-medium hidden sm:inline-block">
                v1.0.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 hidden sm:block">SQLite DBMS & Web Console</p>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        <div className="max-w-[140px] sm:max-w-none">
          <DatabaseSwitcher />
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center p-1 bg-slate-900/80 rounded-xl border border-slate-800 overflow-x-auto max-w-full no-scrollbar">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-teal-500 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Command Palette & Performance Pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live metric mini pill */}
        {currentMetrics && (
          <div className="hidden xl:flex items-center gap-3 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono">
            <div className="flex items-center gap-1 text-slate-300" title="Queries Per Second">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{currentMetrics.qps} QPS</span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="flex items-center gap-1 text-slate-300" title="CPU Load">
              <Cpu className="w-3 h-3 text-teal-400" />
              <span>{currentMetrics.cpuUsage}%</span>
            </div>
          </div>
        )}

        {/* Cmd+K Search trigger */}
        <button
          onClick={toggleCommandPalette}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition group"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-400 transition" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono hidden sm:inline-block">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
};