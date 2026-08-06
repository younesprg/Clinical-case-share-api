"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Coins, X } from 'lucide-react';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'token';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    tokenAmount?: number; // +5 MED, +50 MED etc.
}

interface ToastContextType {
    showToast: (toast: Omit<Toast, 'id'>) => void;
    showTokenToast: (amount: number, reason: string) => void;
    showError: (title: string, message?: string) => void;
    showSuccess: (title: string, message?: string) => void;
}

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────

const ToastContext = createContext<ToastContextType>({} as ToastContextType);

export const useToast = () => useContext(ToastContext);

// ─────────────────────────────────────────────
// SINGLE TOAST COMPONENT
// ─────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Slide in
        const showTimer = setTimeout(() => setVisible(true), 10);
        // Auto dismiss after 4s
        const dismissTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onDismiss(toast.id), 350);
        }, 4000);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(dismissTimer);
        };
    }, [toast.id, onDismiss]);

    const styles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode; badge?: string }> = {
        token: {
            bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
            border: 'border-amber-300/60',
            icon: <Coins size={18} className="text-amber-500 shrink-0" />,
            badge: 'bg-amber-500',
        },
        success: {
            bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
            border: 'border-emerald-300/60',
            icon: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
        },
        error: {
            bg: 'bg-gradient-to-r from-red-50 to-rose-50',
            border: 'border-red-300/60',
            icon: <XCircle size={18} className="text-red-500 shrink-0" />,
        },
        warning: {
            bg: 'bg-gradient-to-r from-orange-50 to-amber-50',
            border: 'border-orange-300/60',
            icon: <AlertCircle size={18} className="text-orange-500 shrink-0" />,
        },
    };

    const s = styles[toast.type];

    return (
        <div
            className={`
                flex items-start gap-3 min-w-[280px] max-w-[340px] p-4 rounded-2xl
                ${s.bg} border ${s.border}
                shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl
                transition-all duration-350 ease-out
                ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
            `}
        >
            {/* Icon */}
            <div className="mt-0.5">{s.icon}</div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 leading-snug">{toast.title}</p>
                {toast.message && (
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{toast.message}</p>
                )}
                {/* Token amount badge */}
                {toast.type === 'token' && toast.tokenAmount !== undefined && (
                    <span
                        className={`
                            inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full
                            text-[11px] font-bold text-white ${s.badge}
                            animate-bounce
                        `}
                        style={{ animationDuration: '0.8s', animationIterationCount: '3' }}
                    >
                        <Coins size={10} />
                        {toast.tokenAmount > 0 ? `+${toast.tokenAmount}` : toast.tokenAmount} MED
                    </span>
                )}
            </div>

            {/* Dismiss button */}
            <button
                onClick={() => {
                    setVisible(false);
                    setTimeout(() => onDismiss(toast.id), 350);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-all shrink-0"
            >
                <X size={13} />
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { ...toast, id }]);
    }, []);

    const showTokenToast = useCallback((amount: number, reason: string) => {
        showToast({
            type: 'token',
            title: amount > 0 ? '🪙 MedToken Kazandınız!' : '🪙 MedToken Gönderildi',
            message: reason,
            tokenAmount: amount,
        });
    }, [showToast]);

    const showError = useCallback((title: string, message?: string) => {
        showToast({ type: 'error', title, message });
    }, [showToast]);

    const showSuccess = useCallback((title: string, message?: string) => {
        showToast({ type: 'success', title, message });
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showTokenToast, showError, showSuccess }}>
            {children}
            {/* Toast Container — fixed bottom-right */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
                {toasts.map((t) => (
                    <div key={t.id} className="pointer-events-auto">
                        <ToastItem toast={t} onDismiss={dismiss} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
