import React, { useState } from 'react';
import { Terminal, Shield, Lock, User, KeyRound, ArrowRight } from 'lucide-react';
import type { UserInfo } from '../../shared/types';

interface AuthPagesProps {
  onLoginSuccess: (token: string, user: UserInfo) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'developer' | 'viewer'>('developer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
    const payload = mode === 'login' ? { username, password } : { username, password, role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (mode === 'login') {
        localStorage.setItem('aeris_token', data.token);
        localStorage.setItem('aeris_user', JSON.stringify(data.user));
        onLoginSuccess(data.token, data.user);
      } else {
        setMode('login');
        setError('Account registered successfully! Please log in.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-2xl shadow-teal-500/20 text-zinc-950 font-bold mx-auto">
            <Terminal className="w-6 h-6 text-zinc-950" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-mono font-bold tracking-tight text-white uppercase">Project Aeris</h1>
            <p className="text-xs font-mono text-zinc-400">Single-Binary DBMS & Web Console Management</p>
          </div>
        </div>

        {/* Auth Form Card */}
        <div className="p-8 bg-zinc-900/80 border border-zinc-800 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 font-mono text-xs">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`pb-2 font-bold transition-all ${
                mode === 'login' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); }}
              className={`pb-2 font-bold transition-all ${
                mode === 'register' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className={`p-3 rounded-xl border font-mono text-xs ${
              error.includes('successfully') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-emerald-400" /> Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors"
              />
            </div>

            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-semibold flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors"
                >
                  <option value="developer">Developer</option>
                  <option value="viewer">Viewer (Read-only)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Studio' : 'Register Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-[11px] font-mono text-zinc-400 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Default Admin: <code className="text-white">admin</code> / <code className="text-white">admin123</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};