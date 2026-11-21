import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertModalProps {
    isOpen: boolean;
    message: string;
    title?: string;
    onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, message, title, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        dir="rtl"
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="h-1.5 bg-gradient-to-l from-amber-400 to-rose-500" />

                        <div className="p-6 flex flex-col items-center text-center">
                            <div className="relative w-16 h-16 mb-4">
                                <div className="absolute inset-0 rounded-full bg-amber-100 animate-pulse" />
                                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-200 flex items-center justify-center">
                                    <i className="bi bi-exclamation-triangle-fill text-3xl text-amber-500"></i>
                                </div>
                            </div>

                            <h3 className="text-base font-black text-slate-800 mb-2">
                                {title || 'تنبيه'}
                            </h3>

                            <p className="text-sm leading-relaxed text-slate-600 font-medium">
                                {message}
                            </p>

                            <button
                                onClick={onClose}
                                className="mt-6 w-full px-5 py-2.5 rounded-xl bg-gradient-to-l from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-sm font-bold shadow-lg shadow-amber-500/25 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                            >
                                حسناً
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AlertModal;
