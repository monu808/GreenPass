'use client';

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, Loader2, X } from 'lucide-react';
import { ToastMessage, ToastType } from '@/lib/optimisticUpdates';

interface ToastProps {
    toast: ToastMessage;
    onDismiss: (id: string) => void;
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
    success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />,
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />,
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: <Info className="h-5 w-5 text-blue-600" aria-hidden="true" />,
    },
    pending: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" aria-hidden="true" />,
    },
};

export function Toast({ toast, onDismiss }: ToastProps) {
    const style = toastStyles[toast.type];
    const duration = toast.duration ?? (toast.type === 'pending' ? 0 : 5000);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onDismiss(toast.id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [toast.id, duration, onDismiss]);

    return (
        <div
            role="alert"
            aria-live="polite"
            className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg
        ${style.bg} ${style.border}
        animate-in slide-in-from-right-full fade-in duration-300
      `}
        >
            <div className="flex-shrink-0">{style.icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
                {toast.description && (
                    <p className="mt-1 text-sm text-gray-600">{toast.description}</p>
                )}
            </div>
            {toast.type !== 'pending' && (
                <button
                    onClick={() => onDismiss(toast.id)}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
                    aria-label="Dismiss notification"
                >
                    <X className="h-4 w-4 text-gray-500" aria-hidden="true" />
                </button>
            )}
        </div>
    );
}

interface ToastContainerProps {
    toasts: ToastMessage[];
    onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
            aria-label="Notifications"
        >
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast toast={toast} onDismiss={onDismiss} />
                </div>
            ))}
        </div>
    );
}
