import React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useToastStore, ToastMessage } from '@/store/useToastStore';
import { cn } from '@/utils/cn';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col gap-2 max-w-xs pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const icons = {
    info: <Info className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />,
    warning: <TriangleAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />,
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-2.5 p-3 rounded-md bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-elevated text-xs animate-slide-down'
      )}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        {toast.title && <div className="font-medium text-zinc-100 text-xs">{toast.title}</div>}
        <div className="text-zinc-300 text-2xs leading-relaxed">{toast.message}</div>
      </div>
      <button
        onClick={onDismiss}
        className="text-zinc-400 hover:text-zinc-200 transition-colors p-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
