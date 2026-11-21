import React from 'react';
import { useData } from '../context/DataContext';

interface StatusIndicatorsProps {
    className?: string;
    showText?: boolean;
}

const StatusIndicators: React.FC<StatusIndicatorsProps> = ({ className = '', showText = true }) => {
    const { isOnline, isDbConfigured, pendingActionsCount } = useData();

    return (
        <div className={`flex items-center gap-1.5 shadow-xs text-xs ${className}`}>
            {/* Internet Status Indicator */}
            {isOnline ? (
                <div 
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 transition-all" 
                    title="مؤشر الإنترنت: متصل بالشبكة"
                >
                    <span className="w-1.5 h-1.5 animate-pulse"></span>
                    <i className="bi bi-wifi text-emerald-600 text-xs"></i>
                    {showText}
                </div>
            ) : (
                <div 
                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 animate-pulse transition-all" 
                    title="مؤشر الإنترنت: غير متصل بالشبكة"
                >
                    <span className="w-1.5 h-1.5 "></span>
                    <i className="bi bi-wifi-off text-rose-600 text-xs"></i>
                    {showText}
                </div>
            )}

            {/* Database Status Indicator */}
            {isDbConfigured && isOnline ? (
                <div 
                    className="flex items-center gap-1 text-[11px] font-semibold text-sky-700 transition-all" 
                    title="قاعدة البيانات: سحابية (مزامنة فورية مفعّلة)"
                >
                    <i className="bi bi-cloud-check-fill text-sky-600 text-xs"></i>
                    {showText}
                </div>
            ) : (
                <div 
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 transition-all" 
                    title="قاعدة البيانات: محلية (تخزين محلي)"
                >
                    <i className="bi bi-database-fill text-amber-600 text-xs"></i>
                    {showText}
                </div>
            )}

            {/* Pending Actions Count */}
            {pendingActionsCount > 0 && (
                <div 
                    className="flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-200/60 animate-pulse" 
                    title={`معاملات معلقة بانتظار المزامنة (${pendingActionsCount})`}
                >
                    <i className="bi bi-arrow-repeat animate-spin text-orange-600 text-xs"></i>
                    <span>{pendingActionsCount}</span>
                </div>
            )}
        </div>
    );
};

export default StatusIndicators;
