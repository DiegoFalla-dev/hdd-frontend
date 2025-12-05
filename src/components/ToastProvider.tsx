import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // ms
}

interface ToastContextValue {
  toasts: Toast[];
  show: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, message, type, duration }]);
  }, []);

  const success = useCallback((m: string, d?: number) => show(m, 'success', d), [show]);
  const error = useCallback((m: string, d?: number) => show(m, 'error', d), [show]);
  const warning = useCallback((m: string, d?: number) => show(m, 'warning', d), [show]);
  const info = useCallback((m: string, d?: number) => show(m, 'info', d), [show]);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map(t => setTimeout(() => dismiss(t.id), t.duration || 4000));
    return () => { timers.forEach(clearTimeout); };
  }, [toasts, dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, show, success, error, warning, info, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map(t => (
          <div
            key={t.id}
            className={
              'rounded shadow px-4 py-3 text-sm flex justify-between items-start animate-fade-in ' +
              (t.type === 'success' ? 'bg-green-600 text-white' :
               t.type === 'error' ? 'bg-red-600 text-white' :
               t.type === 'warning' ? 'bg-yellow-500 text-black' :
               'bg-blue-600 text-white')
            }
          >
            <span>{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="ml-3 text-xs opacity-70 hover:opacity-100">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Animación simple (puede moverse a CSS global)
// Se asume Tailwind o clases utilitarias; si no existe, se puede añadir en index.css