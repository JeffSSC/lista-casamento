'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onClose: (id: string) => void;
}

export default function Toast({ id, message, type, duration = 3000, onClose }: ToastProps) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onClose(id), 300); // Wait for exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, id, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300);
    };

    const bgColors = {
        success: 'bg-green-100/90 border-green-200 text-green-800',
        error: 'bg-red-100/90 border-red-200 text-red-800',
        info: 'bg-indigo-100/90 border-indigo-200 text-indigo-800',
    };

    const icons = {
        success: (
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        error: (
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        info: (
            <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    };

    return (
        <div
            className={`
        pointer-events-auto flex w-full max-w-sm overflow-hidden rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 transform
        ${bgColors[type]}
        ${isExiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0 animate-in slide-in-from-top-5'}
      `}
            role="alert"
        >
            <div className="p-4 flex items-start gap-4">
                <div className="shrink-0">
                    {icons[type]}
                </div>
                <div className="flex-1 pt-0.5">
                    <p className="font-bold text-sm">{message}</p>
                </div>
                <div className="shrink-0 flex">
                    <button
                        onClick={handleClose}
                        className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    >
                        <span className="sr-only">Fechar</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
