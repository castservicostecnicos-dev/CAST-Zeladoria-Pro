import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, ToastMessage } from '../components/ui/Toast';

interface ToastContextType {
  showToast: (text: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  success: (text: string) => void;
  error: (text: string) => void;
  warning: (text: string) => void;
  info: (text: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastMessage = { id, text, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  }, [dismissToast]);

  const success = useCallback((text: string) => showToast(text, 'success'), [showToast]);
  const error = useCallback((text: string) => showToast(text, 'error'), [showToast]);
  const warning = useCallback((text: string) => showToast(text, 'warning'), [showToast]);
  const info = useCallback((text: string) => showToast(text, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback so components don't crash if called outside provider
    return {
      showToast: (text: string) => console.log('[Toast]', text),
      success: (text: string) => console.log('[Toast Success]', text),
      error: (text: string) => console.warn('[Toast Error]', text),
      warning: (text: string) => console.warn('[Toast Warning]', text),
      info: (text: string) => console.log('[Toast Info]', text),
    };
  }
  return context;
};
