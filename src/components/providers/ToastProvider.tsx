'use client';

import React, { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { ToastContainer } from '@/components/Toast';
import { ToastMessage, ToastType } from '@/lib/optimisticUpdates';

interface ToastContextValue {
    showToast: (options: Omit<ToastMessage, 'id'>) => string;
    dismissToast: (id: string) => void;
    updateToast: (id: string, updates: Partial<ToastMessage>) => void;
    // Convenience methods
    success: (title: string, description?: string) => string;
    error: (title: string, description?: string) => string;
    info: (title: string, description?: string) => string;
    pending: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

interface ToastProviderProps {
    children: ReactNode;
    maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const generateId = useCallback(() => {
        return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    const showToast = useCallback((options: Omit<ToastMessage, 'id'>): string => {
        const id = generateId();
        const newToast: ToastMessage = { ...options, id };

        setToasts((prev) => {
            const updated = [...prev, newToast];
            // Limit the number of visible toasts
            if (updated.length > maxToasts) {
                return updated.slice(-maxToasts);
            }
            return updated;
        });

        return id;
    }, [generateId, maxToasts]);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const updateToast = useCallback((id: string, updates: Partial<ToastMessage>) => {
        setToasts((prev) =>
            prev.map((toast) =>
                toast.id === id ? { ...toast, ...updates } : toast
            )
        );
    }, []);

    // Convenience methods
    const createConvenienceMethod = useCallback(
        (type: ToastType) => (title: string, description?: string) => {
            return showToast({ type, title, description });
        },
        [showToast]
    );

    const value: ToastContextValue = {
        showToast,
        dismissToast,
        updateToast,
        success: createConvenienceMethod('success'),
        error: createConvenienceMethod('error'),
        info: createConvenienceMethod('info'),
        pending: createConvenienceMethod('pending'),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    );
}
