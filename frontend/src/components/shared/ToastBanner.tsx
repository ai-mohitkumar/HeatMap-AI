import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, AlertOctagon, X } from 'lucide-react';
import type { InAppToastPayload } from '../../utils/notificationService';

export const ToastBanner: React.FC = () => {
  const [toasts, setToasts] = useState<InAppToastPayload[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<InAppToastPayload>;
      if (!customEvent.detail) return;

      const newToast = customEvent.detail;
      setToasts((prev) => {
        // Prevent exact duplicates within 1 second
        const isDuplicate = prev.some(
          (t) => t.title === newToast.title && Math.abs(t.timestamp - newToast.timestamp) < 1000
        );
        if (isDuplicate) return prev;
        return [newToast, ...prev].slice(0, 4); // Keep max 4 toasts
      });

      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4500);
    };

    window.addEventListener('heatshield:toast', handleToastEvent);
    return () => {
      window.removeEventListener('heatshield:toast', handleToastEvent);
    };
  }, []);

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <aside aria-label="Notifications" className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
      {toasts.map((toast) => {
        const isDanger = toast.type === 'danger';
        const isWarning = toast.type === 'warning';
        const isSuccess = toast.type === 'success';

        const borderColor = isDanger
          ? 'border-rose-500/50 bg-rose-950/90 text-rose-100 shadow-rose-950/50'
          : isWarning
          ? 'border-amber-500/50 bg-amber-950/90 text-amber-100 shadow-amber-950/50'
          : isSuccess
          ? 'border-emerald-500/50 bg-emerald-950/90 text-emerald-100 shadow-emerald-950/50'
          : 'border-blue-500/50 bg-[#0F172A]/95 text-slate-100 shadow-blue-950/50';

        const Icon = isDanger
          ? AlertOctagon
          : isWarning
          ? AlertTriangle
          : isSuccess
          ? CheckCircle2
          : Bell;

        const iconColor = isDanger
          ? 'text-rose-400'
          : isWarning
          ? 'text-amber-400'
          : isSuccess
          ? 'text-emerald-400'
          : 'text-cyan-400';

        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-3 duration-300 ${borderColor}`}
          >
            <div className={`p-1.5 rounded-xl bg-black/30 shrink-0 mt-0.5 ${iconColor}`}>
              <Icon className="w-4 h-4 animate-pulse" />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-black tracking-wide leading-tight text-white mb-0.5">
                {toast.title}
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-300 opacity-90 line-clamp-3">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => handleDismiss(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
