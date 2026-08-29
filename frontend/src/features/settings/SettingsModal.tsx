import React, { useState, useEffect } from 'react';
import { User, Shield, HardDrive, Key, Plus, Trash2, Check, RefreshCw, Cpu, Layers } from 'lucide-react';
import { DraggableModal } from '../../shared/components/DraggableModal';
import { SessionManager } from '../auth/SessionManager';
import type { UserInfo } from '../../shared/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'rbac' | 'storage'>('profile');
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  const [roles, setRoles] = useState<any[]>([]);
  const [subordinates, setSubordinates] = useState<any[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>(['query:execute', 'schema:read']);

  const [subUsername, setSubUsername] = useState('');
  const [subPassword, setSubPassword] = useState('');
  const [subRole, setSubRole] = useState<'developer' | 'viewer'>('developer');

  const [mountDbPath, setSubMountDbPath] = useState('');
  const [walMode, setWalMode] = useState(true);
  const [busyTimeoutMs, setBusyTimeoutMs] = useState(5000);

  const availablePermissions = [
    { id: 'query:execute', label: 'Execute Raw SQL Queries' },
    { id: 'schema:migrate', label: 'Modify Tables & Schema DDL' },
    { id: 'db:create', label: 'Create & Drop Databases' },
    { id: 'data:edit', label: 'Inline Cell Edit in Explorer' },
    { id: 'users:manage', label: 'Manage Subordinate Users & RBAC' },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('aeris_user');
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch (e) {}
    }
    fetchRolesAndSubordinates();
  }, [isOpen]);

  const fetchRolesAndSubordinates = async () => {
    const token = localStorage.getItem('aeris_token') || '';
    try {
      const resRoles = await fetch('/api/v1/auth/roles', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resRoles.ok) setRoles(await resRoles.json());

      const resSubs = await fetch('/api/v1/auth/subordinates', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resSubs.ok) setSubordinates(await resSubs.json());
    } catch (e) {}
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('aeris_token') || '';
    try {
      const res = await fetch('/api/v1/auth/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newRoleName, description: newRoleDesc, permissions: selectedPerms }),
      });
      if (!res.ok) throw new Error('Failed to create role');
      setNewRoleName('');
      setNewRoleDesc('');
      await fetchRolesAndSubordinates();
    } catch (err: any) {
      alert(err.message || 'Failed to create role');
    }
  };

  const handleCreateSubordinate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('aeris_token') || '';
    try {
      const res = await fetch('/api/v1/auth/subordinates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username: subUsername, password: subPassword, role: subRole }),
      });
      if (!res.ok) throw new Error('Failed to create subordinate user');
      setSubUsername('');
      setSubPassword('');
      await fetchRolesAndSubordinates();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const togglePerm = (id: string) => {
    if (selectedPerms.includes(id)) {
      setSelectedPerms(selectedPerms.filter((p) => p !== id));
    } else {
      setSelectedPerms([...selectedPerms, id]);
    }
  };

  const handleMountDatabasePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mountDbPath.trim()) return;
    try {
      const res = await fetch('/api/v1/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: mountDbPath.trim(), in_memory: false }),
      });
      if (!res.ok) throw new Error('Failed to mount database path');
      alert(`Database mounted successfully: ${mountDbPath}`);
      setSubMountDbPath('');
    } catch (err: any) {
      alert(err.message || 'Failed to mount database');
    }
  };

  return (
    <DraggableModal
      title="User Profile, RBAC & Database Storage Settings"
      isOpen={isOpen}
      onClose={onClose}
      initialWidth={780}
      initialHeight={560}
      icon={<Shield className="w-4 h-4 text-emerald-400" />}
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 font-mono text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'profile' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Profile & Sessions
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'rbac' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            RBAC & Subordinates
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'storage' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            Plug & Play Storage
          </button>
        </div>

        {/* Tab 1: Profile & Active Stateful Sessions */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {currentUser && (
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center justify-between font-mono">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{currentUser.username}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">User ID: <code className="text-zinc-300">{currentUser.id}</code></p>
                </div>
              </div>
            )}

            <SessionManager />
          </div>
        )}

        {/* Tab 2: RBAC Role Creation & Subordinate User Assignment */}
        {activeTab === 'rbac' && (
          <div className="space-y-8 font-sans">
            {/* Create Subordinate User Form */}
            <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4 font-mono">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" /> Create Subordinate User
                </h3>
                <p className="text-xs text-zinc-400">
                  Supervisors and admins can create new users with subordinate permissions directly under their account.
                </p>
              </div>

              <form onSubmit={handleCreateSubordinate} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Subordinate Username"
                  value={subUsername}
                  onChange={(e) => setSubUsername(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={subPassword}
                  onChange={(e) => setSubPassword(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={subRole}
                    onChange={(e) => setSubRole(e.target.value as any)}
                    className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-white focus:outline-none flex-1"
                  >
                    <option value="developer">Developer</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-colors shrink-0"
                  >
                    Add User
                  </button>
                </div>
              </form>

              {subordinates.length > 0 && (
                <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                  <span className="text-xs font-semibold text-zinc-400">Created Subordinates ({subordinates.length}):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {subordinates.map((sub: any) => (
                      <div key={sub.id} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-white font-bold">{sub.username}</span>
                        <span className="text-[10px] text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{sub.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Role Creation Form */}
            <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4 font-mono">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Create Custom RBAC Role
                </h3>
                <p className="text-xs text-zinc-400">Define custom roles and select permission matrices.</p>
              </div>

              <form onSubmit={handleCreateRole} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Role Name (e.g. Data Analyst)"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Role Description"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-zinc-300">Permission Matrix Checkboxes:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availablePermissions.map((perm) => (
                      <label key={perm.id} className="flex items-center gap-2.5 p-2 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700">
                        <input
                          type="checkbox"
                          checked={selectedPerms.includes(perm.id)}
                          onChange={() => togglePerm(perm.id)}
                          className="accent-emerald-500 rounded"
                        />
                        <span className="text-xs text-zinc-300">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-colors"
                >
                  Create Custom Role
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Plug and Play Storage Settings */}
        {activeTab === 'storage' && (
          <div className="space-y-6 font-mono">
            <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" /> Mount External SQLite File
                </h3>
                <p className="text-xs text-zinc-400">
                  Hot-swap and mount any external SQLite database file path (`.db`) directly into the Aeris engine.
                </p>
              </div>

              <form onSubmit={handleMountDatabasePath} className="flex items-center gap-2 text-xs">
                <input
                  type="text"
                  required
                  placeholder="/home/diama/repos/my_external_db.db"
                  value={mountDbPath}
                  onChange={(e) => setSubMountDbPath(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 rounded-xl text-white focus:outline-none focus:border-emerald-500 flex-1"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-colors shrink-0"
                >
                  Mount Database
                </button>
              </form>
            </div>

            <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" /> SQLite Engine PRAGMA Tuning
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold block">WAL Journal Mode</span>
                    <span className="text-[11px] text-zinc-500">Write-Ahead Logging for high concurrency</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={walMode}
                    onChange={(e) => setWalMode(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4"
                  />
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-white font-bold block">Busy Timeout (ms)</span>
                  <input
                    type="number"
                    value={busyTimeoutMs}
                    onChange={(e) => setBusyTimeoutMs(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DraggableModal>
  );
};