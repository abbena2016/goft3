import React, { useState, useEffect } from 'react';
import { User, Page } from '../../types';
import { useData } from '../../context/DataContext';

interface UserPermissionsFormProps {
    user: User;
    onClose: () => void;
    onSave: (updatedUser: User) => Promise<void>;
}

const PAGE_NAMES: { [key in Page]?: string } = {
    'HOME': 'الرئيسية',
    'OPERATIONS': 'العمليات',
    'DOCUMENTS': 'الوثائق',
    'BENEFICIARIES': 'المستفيدين',
    'FINANCIAL_STATUS': 'الوضعية المالية',
    'FINANCIAL_STATUS_BY_STRUCTURE': 'الوضعية المالية حسب الهيكل',
    'PROJECT_TRACKING': 'متابعة المشاريع',
    'PAYMENT_CLAIMS': 'مطالبات الدفع',
    'AE_INSUFFICIENCY': 'نقص اعتمادات الالتزام',
    'CUSTOM_REPORT': 'تقرير مخصص',
    'VISAED_ENGAGEMENTS': 'الالتزامات المؤشرة',
    'APPENDIX_01': 'الملحق 01',
    'SETTINGS': 'الإعدادات',
    'USERS': 'المستخدمين',
    'PROGRAMME': 'البرامج',
    'CATEGORIE': 'الأصناف',
    'DIRECTION': 'المديريات',
    'RUBRIQUE': 'هيكلة الكلفة',
};

const UserPermissionsForm: React.FC<UserPermissionsFormProps> = ({ user, onClose, onSave }) => {
    const { db } = useData();
    const [selectedPages, setSelectedPages] = useState<Page[]>([]);
    const [selectedOperations, setSelectedOperations] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Collapsible section toggles
    const [showPagesSection, setShowPagesSection] = useState(true);
    const [showOpsSection, setShowOpsSection] = useState(true);

    useEffect(() => {
        if (user.ALLOWED_PAGES) {
            try {
                setSelectedPages(JSON.parse(user.ALLOWED_PAGES));
            } catch (e) {
                setSelectedPages([]);
            }
        } else {
            setSelectedPages([]);
        }

        if (user.ALLOWED_OPERATIONS) {
            try {
                setSelectedOperations(JSON.parse(user.ALLOWED_OPERATIONS));
            } catch (e) {
                setSelectedOperations([]);
            }
        } else {
            setSelectedOperations([]);
        }
    }, [user]);

    const togglePage = (page: Page) => {
        setSelectedPages(prev =>
            prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]
        );
    };

    const selectAllPages = () => {
        setSelectedPages(Object.keys(PAGE_NAMES) as Page[]);
    };

    const clearPages = () => {
        setSelectedPages([]);
    };

    const toggleOperation = (id: number) => {
        setSelectedOperations(prev =>
            prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
        );
    };

    const selectAllOperations = () => {
        setSelectedOperations(db.T_OPERATION.map(op => op.ID_OPERATION));
    };

    const clearOperations = () => {
        setSelectedOperations([]);
    };

    const selectOwnedOperations = () => {
        const ownedIds = db.T_OPERATION
            .filter(op => op.CREATED_BY === user.USERNAME || String(op.CREATED_BY) === String(user.ID_USER))
            .map(op => op.ID_OPERATION);
        setSelectedOperations(prev => Array.from(new Set([...prev, ...ownedIds])));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSave({
                ...user,
                ALLOWED_PAGES: selectedPages.length > 0 ? JSON.stringify(selectedPages) : undefined,
                ALLOWED_OPERATIONS: selectedOperations.length > 0 ? JSON.stringify(selectedOperations) : undefined,
            });
            onClose();
        } catch (err) {
            console.error("Error saving permissions:", err);
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col text-xs text-right">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white z-10 pb-2.5 border-b border-gray-200 flex justify-between items-center mb-3">
                <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-700 text-xs">صلاحيات:</span>
                    <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md font-bold text-xs border border-blue-200">
                        {user.USERNAME}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                        ({user.ROLE === 'admin' ? 'مسؤول' : user.ROLE === 'viewer' ? 'ملاحظ' : 'مستخدم'})
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-xs font-medium"
                    >
                        إلغاء
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 font-bold text-xs shadow-sm"
                    >
                        {isSubmitting ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
                    </button>
                </div>
            </div>

            <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1 pl-1">
                {user.ROLE === 'admin' && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-md text-[11px] leading-relaxed">
                        <i className="bi bi-exclamation-triangle-fill ml-1"></i>
                        ملاحظة: هذا المستخدم له دور <strong>مسؤول</strong> (Admin)، ويمتلك الوصول الكامل افتراضياً.
                    </div>
                )}

                {/* Pages Customization Box */}
                <div className="bg-gray-50/80 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <div className="flex justify-between items-center bg-gray-100/80 px-3 py-2 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowPagesSection(prev => !prev)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 transition-colors font-bold text-xs"
                                title={showPagesSection ? "إخفاء" : "إظهار"}
                            >
                                <i className={`bi ${showPagesSection ? 'bi-dash-lg' : 'bi-plus-lg'}`}></i>
                            </button>
                            <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                <i className="bi bi-layout-text-window-reverse text-blue-600"></i>
                                تخصيص الوحدات (الصفحات المسموحة)
                            </h3>
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">
                                {selectedPages.length}
                            </span>
                        </div>
                        {showPagesSection && (
                            <div className="flex gap-1">
                                <button 
                                    type="button" 
                                    onClick={selectAllPages} 
                                    className="text-[10px] bg-white text-blue-600 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-50 transition-colors font-semibold"
                                >
                                    تحديد الكل
                                </button>
                                <button 
                                    type="button" 
                                    onClick={clearPages} 
                                    className="text-[10px] bg-white text-gray-600 px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors font-semibold"
                                >
                                    إلغاء الكل
                                </button>
                            </div>
                        )}
                    </div>

                    {showPagesSection && (
                        <div className="p-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {(Object.entries(PAGE_NAMES) as [Page, string][]).map(([page, name]) => {
                                    const isChecked = selectedPages.includes(page);
                                    return (
                                        <label 
                                            key={page} 
                                            className={`flex items-center gap-2 p-1.5 rounded border cursor-pointer transition-all text-[11px] ${
                                                isChecked 
                                                    ? 'bg-blue-50 border-blue-300 font-bold text-blue-900 shadow-2xs' 
                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100/70'
                                            }`}
                                        >
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked} 
                                                onChange={() => togglePage(page)}
                                                className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="truncate">{name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">إذا لم يتم اختيار أي صفحة، فسيتم السماح بالصفحات الافتراضية بحسب دور المستخدم.</p>
                        </div>
                    )}
                </div>

                {/* Operations Customization Box */}
                <div className="bg-gray-50/80 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <div className="flex justify-between items-center bg-gray-100/80 px-3 py-2 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowOpsSection(prev => !prev)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors font-bold text-xs"
                                title={showOpsSection ? "إخفاء" : "إظهار"}
                            >
                                <i className={`bi ${showOpsSection ? 'bi-dash-lg' : 'bi-plus-lg'}`}></i>
                            </button>
                            <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                                <i className="bi bi-kanban text-indigo-600"></i>
                                تخصيص العمليات المسموحة
                            </h3>
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-mono font-bold">
                                {selectedOperations.length}
                            </span>
                        </div>
                        {showOpsSection && (
                            <div className="flex gap-1">
                                <button 
                                    type="button" 
                                    onClick={selectOwnedOperations}
                                    className="text-[10px] bg-white text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-50 transition-colors font-bold"
                                    title="تحديد العمليات المسجلة باسم هذا المستخدم"
                                >
                                    عمليات المستخدم
                                </button>
                                <button 
                                    type="button" 
                                    onClick={selectAllOperations} 
                                    className="text-[10px] bg-white text-blue-600 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-50 transition-colors font-semibold"
                                >
                                    تحديد الكل
                                </button>
                                <button 
                                    type="button" 
                                    onClick={clearOperations} 
                                    className="text-[10px] bg-white text-gray-600 px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors font-semibold"
                                >
                                    إلغاء الكل
                                </button>
                            </div>
                        )}
                    </div>

                    {showOpsSection && (
                        <div className="p-3">
                            <div className="max-h-52 overflow-y-auto border border-gray-200 rounded bg-white">
                                {db.T_OPERATION.length === 0 ? (
                                    <p className="p-3 text-[11px] text-gray-500 text-center">لا توجد عمليات مسجلة حالياً</p>
                                ) : (
                                    <table className="w-full text-right border-collapse">
                                        <thead className="bg-gray-100 text-[10px] font-bold text-gray-600 uppercase tracking-wider sticky top-0 border-b">
                                            <tr>
                                                <th className="px-2 py-1.5 text-center w-10">تحديد</th>
                                                <th className="px-2 py-1.5">رقم العملية</th>
                                                <th className="px-2 py-1.5">منشئ العملية</th>
                                                <th className="px-2 py-1.5">تعيين العملية</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {db.T_OPERATION.map(op => {
                                                const creator = db.T_USER.find(u => u.USERNAME === op.CREATED_BY || String(u.ID_USER) === String(op.CREATED_BY));
                                                const creatorLabel = creator ? creator.USERNAME : (op.CREATED_BY || '---');
                                                const isSelected = selectedOperations.includes(op.ID_OPERATION);
                                                return (
                                                    <tr 
                                                        key={op.ID_OPERATION} 
                                                        onClick={() => toggleOperation(op.ID_OPERATION)}
                                                        className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                                                    >
                                                        <td className="px-2 py-1 text-center" onClick={e => e.stopPropagation()}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isSelected} 
                                                                onChange={() => toggleOperation(op.ID_OPERATION)}
                                                                className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1 text-[11px] font-mono font-bold text-blue-700 whitespace-nowrap">
                                                            {op.N_OPERATION}
                                                        </td>
                                                        <td className="px-2 py-1">
                                                            {creatorLabel !== '---' ? (
                                                                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                                                                    {creatorLabel}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-gray-400">---</span>
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-1 text-[11px] text-gray-700 leading-tight">
                                                            {op.INT_OPERATION}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">إذا لم يتم تحديد أي عملية، فسيتمكن المستخدم من الوصول لجميع العمليات المتاحة لدوره.</p>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
};

export default UserPermissionsForm;
