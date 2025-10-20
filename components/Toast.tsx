import React from 'react';

export type ToastType = 'info' | 'error' | 'success';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

const Toast: React.FC<{ message: ToastMessage; onDismiss: () => void }> = ({ message, onDismiss }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`toast glass card ${message.type}`}>
      {message.message}
    </div>
  );
};

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div id="toasts">
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

export default ToastContainer;
