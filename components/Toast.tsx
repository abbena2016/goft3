import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info' | 'loading' | 'event';
    onClose: () => void;
}

const playNotificationSound = (type: string) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (type === 'error') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.3);
        } else if (type === 'event') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.4);
        } else {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.2);
        }
    } catch (e) {
        console.warn('Audio playback failed', e);
    }
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        if (type !== 'loading') {
            playNotificationSound(type);
        }
    }, [type]);

    const isLoading = type === 'loading';

    let icon = 'bi-info-circle-fill';
    let iconBg = 'bg-blue-50 text-blue-600 border-blue-200/60';
    let accentBar = 'bg-blue-500';
    let categoryLabel = 'تنبيه';

    if (type === 'success') {
        icon = 'bi-check-circle-fill';
        iconBg = 'bg-emerald-50 text-emerald-600 border-emerald-200/60';
        accentBar = 'bg-emerald-500';
        categoryLabel = 'نجاح العملية';
    } else if (type === 'error') {
        icon = 'bi-exclamation-triangle-fill';
        iconBg = 'bg-rose-50 text-rose-600 border-rose-200/60';
        accentBar = 'bg-rose-500';
        categoryLabel = 'تنبيه خطأ';
    } else if (type === 'info') {
        icon = 'bi-info-circle-fill';
        iconBg = 'bg-sky-50 text-sky-600 border-sky-200/60';
        accentBar = 'bg-sky-500';
        categoryLabel = 'معلومات';
    } else if (type === 'loading') {
        icon = 'bi-arrow-repeat animate-spin';
        iconBg = 'bg-blue-50 text-blue-600 border-blue-200/60';
        accentBar = 'bg-blue-500';
        categoryLabel = 'جاري المعالجة...';
    } else if (type === 'event') {
        icon = 'bi-broadcast';
        iconBg = 'bg-indigo-50 text-indigo-600 border-indigo-200/60';
        accentBar = 'bg-indigo-500';
        categoryLabel = 'نشاط مباشر';
    }

    return (
        <div 
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto min-w-[300px] max-w-[90vw] sm:max-w-[480px] no-print"
            dir="rtl"
        >
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="relative bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Top Accent Line */}
                <div className={`h-1 w-full ${accentBar} ${isLoading ? 'animate-pulse' : ''}`} />

                <div className="p-3 sm:p-3.5 flex items-center gap-3">
                    {/* Icon Container */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${iconBg}`}>
                        <i className={`bi ${icon} text-lg`}></i>
                    </div>

                    {/* Text Container */}
                    <div className="flex-grow flex flex-col justify-center min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
                            {categoryLabel}
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-tight break-words">
                            {message}
                        </p>
                    </div>

                    {/* Close Button */}
                    {!isLoading && (
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="إغلاق"
                        >
                            <i className="bi bi-x-lg text-xs"></i>
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Toast;
