import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <div style={{ flex: 1, fontSize: '0.9rem', lineHeight: 1.3 }}>{toast.text}</div>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.7 }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
