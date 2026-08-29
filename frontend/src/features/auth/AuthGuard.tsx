import React, { useState, useEffect } from 'react';
import { AuthPages } from './AuthPages';
import type { UserInfo } from '../../shared/types';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('aeris_token');
    const savedUser = localStorage.getItem('aeris_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('aeris_token');
        localStorage.removeItem('aeris_user');
      }
    }
    setChecking(false);
  }, []);

  const handleLoginSuccess = (newToken: string, newUser: UserInfo) => {
    setToken(newToken);
    setUser(newUser);
  };

  if (checking) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center font-mono text-xs text-zinc-400">
        Verifying stateful authentication token...
      </div>
    );
  }

  if (!token || !user) {
    return <AuthPages onLoginSuccess={handleLoginSuccess} />;
  }

  return <>{children}</>;
};