import React, { useState } from 'react';
import { useAerisStore } from '../store/useAerisStore';
import { Database, Plus, Check, Server, HardDrive, MemoryStick } from 'lucide-react';

export const DatabaseSwitcher: React.FC = () => {
  const { databases, activeDatabase, setActiveDatabase, createDatabase } = useAerisStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [isInMemory, setIsInMemory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeDbInfo = databases.find((d) => d.name === activeDatabase);

  const handleSelect = async (dbName: string) => {
    setIsOpen(false);
    if (dbName !== activeDatabase) {
      await setActiveDatabase(dbName);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbName.trim()) return;
    setIsSubmitting(true);
    try {
      await createDatabase(newDbName, isInMemory);
      setNewDbName('');
      setShowNewModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      {/* Active Database Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/80 text-zinc-200 text-xs font-medium transition group"
      >
        <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
          {activeDbInfo?.isInMemory ? <MemoryStick className="w-3.5 h-3.5 text-amber-400" /> : <Database className="w-3.5 h-3.5" />}
        </div>
        <div className="flex flex-col items-start leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-100">{activeDatabase}</span>
            {activeDbInfo?.walMode && (
              <span className="px-1 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded text-[9px] font-mono">
                WAL
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
            {activeDbInfo ? `${activeDbInfo.size} • ${activeDbInfo.tableCount} tables` : 'SQLite Active'}
          </span>
        </div>
      </button>

      {/* Dropdown Menu Anchored Under Navbar */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-72 z-50 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl p-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-2 border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Hot-Swap SQLite Engine
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowNewModal(true);
                }}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition"
              >
                <Plus className="w-3 h-3" /> New .db
              </button>
            </div>

            <div className="py-1 max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
              {databases.map((db) => {
                const isActive = db.name === activeDatabase;
                return (
                  <button
                    key={db.name}
                    onClick={() => handleSelect(db.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-300 font-medium border border-emerald-500/30'
                        : 'hover:bg-zinc-900 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {db.isInMemory ? (
                        <MemoryStick className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <HardDrive className="w-4 h-4 text-zinc-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-mono text-xs font-semibold text-white">{db.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {db.size} • {db.tableCount} tables
                        </div>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* New Database Modal Anchored Relative to Navbar Header */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <h3 className="font-mono font-bold text-white text-sm">Create SQLite Database</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-zinc-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-zinc-300 mb-1.5 font-semibold">
                  Database File Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. ecommerce.db"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  autoFocus
                  required
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Extension .db will be automatically appended if omitted.
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <input
                  type="checkbox"
                  id="inMemory"
                  checked={isInMemory}
                  onChange={(e) => setIsInMemory(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="inMemory" className="text-xs cursor-pointer select-none">
                  <span className="font-bold text-white block">Ephemeral In-Memory Mode</span>
                  <span className="text-zinc-400 text-[11px]">
                    Fast volatile storage in RAM. Data resets on engine restart.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newDbName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Initializing...' : 'Create Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};