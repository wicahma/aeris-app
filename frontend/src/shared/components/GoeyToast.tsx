import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { ToastMessage } from '../types';

interface GoeyToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const GoeyToast: React.FC<GoeyToastProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-teal-400 shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-emerald-950/80 shadow-emerald-500/10';
      case 'error':
        return 'border-red-500/40 bg-red-950/80 shadow-red-500/10';
      case 'warning':
        return 'border-amber-500/40 bg-amber-950/80 shadow-amber-500/10';
      default:
        return 'border-teal-500/40 bg-teal-950/80 shadow-teal-500/10';
    }
  };

  return (
    <>
      <svg className="hidden">
        <defs>
          <filter id="goey-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goey"
            />
            <feComposite in="SourceGraphic" in2="goey" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-up ${getBorderColor(
              toast.type
            )}`}
            style={{ filter: 'url(#goey-filter)' }}
          >
            {getIcon(toast.type)}
            <div className="flex-1 space-y-0.5">
              <h4 className="text-xs font-mono font-bold text-white tracking-tight leading-snug">
                {toast.title}
              </h4>
              {toast.message && (
                <p className="text-[11px] font-mono text-zinc-300 leading-relaxed">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-zinc-500 hover:text-white transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};