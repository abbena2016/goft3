import React from 'react';
import { FileText } from 'lucide-react';
import { Page, User } from '../types';
import { formatCurrency } from '../utils/currencyUtils';

interface OperationRowProps {
    op: any;
    isSelected: boolean;
    onSelect: (id: number | null) => void;
    navigate: (page: Page, id?: number) => void;
    onEdit?: (op: any) => void;
    onDelete?: (id: number) => void;
    currentUser?: User;
    isViewer?: boolean;
}

const OperationRow: React.FC<OperationRowProps> = ({ op, isSelected, onSelect, navigate, onEdit, onDelete, currentUser, isViewer }) => {
    return (
        <tr 
            data-testid={`operation-row-${op.ID_OPERATION}`}
            className={`hover:bg-blue-50/50 transition-colors cursor-pointer group ${isSelected ? 'bg-blue-100 ring-2 ring-blue-400 ring-inset' : ''}`}
            onClick={() => onSelect(isSelected ? null : op.ID_OPERATION)}
        >
            <td className="py-1.5 px-1 text-center">
                <div className="flex items-center justify-center gap-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); navigate('OPERATION_DETAILS', op.ID_OPERATION); }}
                        className="bg-white border text-gray-600 hover:text-blue-600 hover:border-blue-300 p-1 rounded-md transition-all shadow-xs group-hover:scale-105 active:scale-95"
                        title="عرض التفاصيل"
                    >
                        <i className="bi bi-eye-fill text-xs"></i>
                    </button>
                    {isSelected && !isViewer && currentUser && (op.CREATED_BY === currentUser.ID_USER || currentUser.ROLE === 'admin') && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit?.(op); }}
                                className="bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 p-1 rounded-md transition-all shadow-xs"
                                title="تعديل"
                            >
                                <i className="bi bi-pencil-fill text-xs"></i>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete?.(op.ID_OPERATION); }}
                                className="bg-red-50 border border-red-300 text-red-800 hover:bg-red-100 p-1 rounded-md transition-all shadow-xs"
                                title="حذف"
                            >
                                <i className="bi bi-trash-fill text-xs"></i>
                            </button>
                        </>
                    )}
                </div>
            </td>
            <td className="py-1.5 px-1 text-center">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                    op.status === 'جارية' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                    {op.status === 'جارية' ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1 animate-pulse"></span> : null}
                    {op.status}
                </span>
            </td>
            <td className="py-1.5 px-1.5 text-right">
                <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap gap-1 items-center">
                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
                            {op.N_OPERATION}
                        </span>
                        {op.TYPE_OP && (
                            <span className="text-[9px] font-bold text-sky-800 bg-sky-50 px-1 py-0.5 rounded border border-sky-100 uppercase tracking-wide">
                                {op.TYPE_OP}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 group/name">
                        <span className="operation-name text-[11px] font-medium text-gray-800 leading-tight group-hover:text-blue-900 transition-colors line-clamp-2" title={op.INT_OPERATION}>
                            {op.INT_OPERATION}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('DOCUMENTS', op.ID_OPERATION);
                            }}
                            className="p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                            title="عرض الوثائق"
                        >
                            <FileText size={12} />
                        </button>
                    </div>
                </div>
            </td>
            <td className="py-1.5 px-1 text-[11px] font-semibold text-gray-700 whitespace-nowrap text-center">{formatCurrency(op.aeFinale)}</td>
            <td className="py-1.5 px-1 text-[11px] font-semibold text-gray-700 whitespace-nowrap text-center">{formatCurrency(op.totalEngagements)}</td>
            <td className="py-1.5 px-1 text-[11px] font-bold text-amber-700 whitespace-nowrap text-center">{formatCurrency(op.totalEngagementsCurrentYear)}</td>
            <td className="py-1.5 px-1 text-[11px] font-bold text-rose-600 whitespace-nowrap text-center">{formatCurrency(op.remainingAE)}</td>
            <td className="py-1.5 px-1 text-[11px] font-semibold text-gray-700 whitespace-nowrap text-center">{formatCurrency(op.totalPaiements)}</td>
            <td className="py-1.5 px-1 text-[11px] font-bold text-indigo-700 whitespace-nowrap text-center">{formatCurrency(op.cpFinaleCurrentYear)}</td>
            <td className="py-1.5 px-1 text-[11px] font-bold text-emerald-600 whitespace-nowrap text-center">{formatCurrency(op.paiementsCurrentYear)}</td>
            <td className="py-1.5 px-1 text-[11px] font-bold text-rose-600 whitespace-nowrap text-center">{formatCurrency(op.remainingCP)}</td>
        </tr>
    );
};

export default React.memo(OperationRow);
