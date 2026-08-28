import React, { useState, useEffect } from 'react';
import { Shield, Laptop, Smartphone, Trash2, LogOut, RefreshCw, Clock, Globe } from 'lucide-react';
import type { SessionInfo } from '../../shared/types';

export const SessionManager: React.FC = () => {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('aeris_token') || ''}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch active sessions');
      const data = await res.json();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || 'Error loading sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/auth/sessions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('aeris_token') || ''}`,
        },
      });
      if (!res.ok) throw new Error('Failed to revoke session');
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to revoke session');
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!confirm('Are you sure you want to log out all other devices?')) return;
    try {
      const res = await fetch('/api/v1/auth/logout-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('aeris_token') || ''}`,
        },
      });
      if (!res.ok) throw new Error('Failed to revoke all other sessions');
      await fetchSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke other sessions');
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (/mobile|android|iphone|ipad/i.test(userAgent)) {
      return <Smartphone className="w-5 h-5 text-indigo-400" />;
    }
    return <Laptop className="w-5 h-5 text-emerald-400" />;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-semibold">
            <Shield className="w-4 h-4" />
            <span>Stateful Token Security</span>
          </div>
          <h1 className="text-2xl font-mono font-bold text-white tracking-tight">Active Sessions & Device Manager</h1>
          <p className="text-zinc-400 text-sm">
            Manage your active sessions stored in <code className="text-emerald-400 font-mono text-xs bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">_system_sessions</code> database table.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSessions}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleRevokeAllOthers}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold text-white bg-red-600/20 border border-red-500/40 rounded-lg hover:bg-red-600/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            Revoke All Other Devices
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-mono">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-zinc-500 font-mono text-sm">
          Loading active session data...
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-12 text-center border border-zinc-800 rounded-2xl bg-zinc-900/50 space-y-2">
          <Shield className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-zinc-400 font-mono text-sm">No active sessions found or server restarted.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sessions.map((session, idx) => (
            <div
              key={session.id}
              className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-zinc-800/80 border border-zinc-700/50 rounded-xl mt-0.5">
                  {getDeviceIcon(session.user_agent)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">
                      {session.user_agent.split(' ')[0] || 'Browser Client'}
                    </span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
                        Current Session
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-zinc-500" />
                      {session.ip_address}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      Active: {new Date(session.last_activity_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 font-mono truncate max-w-lg">
                    {session.user_agent}
                  </p>
                </div>
              </div>

              {idx !== 0 && (
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg hover:bg-red-500/20 hover:border-red-500/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};