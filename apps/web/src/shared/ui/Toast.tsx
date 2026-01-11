import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Simple global store for toasts
const listeners = new Set<() => void>();
let toasts: Toast[] = [];

function notify() {
  listeners.forEach((listener) => listener());
}

export const toast = {
  success: (message: string) => {
    const id = `toast-${Date.now()}`;
    toasts = [...toasts, { id, message, type: 'success' }];
    notify();
    setTimeout(() => toast.remove(id), 3000);
  },
  error: (message: string) => {
    const id = `toast-${Date.now()}`;
    toasts = [...toasts, { id, message, type: 'error' }];
    notify();
    setTimeout(() => toast.remove(id), 4000);
  },
  info: (message: string) => {
    const id = `toast-${Date.now()}`;
    toasts = [...toasts, { id, message, type: 'info' }];
    notify();
    setTimeout(() => toast.remove(id), 3000);
  },
  remove: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
};

function useToasts() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return toasts;
}

export function ToastContainer() {
  const currentToasts = useToasts();

  if (currentToasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {currentToasts.map((t) => (
        <div
          key={t.id}
          className={`
            px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium
            animate-slide-in min-w-[200px] max-w-[320px]
            ${t.type === 'success' ? 'bg-success' : ''}
            ${t.type === 'error' ? 'bg-error' : ''}
            ${t.type === 'info' ? 'bg-primary' : ''}
          `}
          onClick={() => toast.remove(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>,
    document.body
  );
}
