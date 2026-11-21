import React, { useState, useEffect, useRef } from 'react';
import { Ods, LotOperation } from '../../types';
import { normalizeDate, compareDates, getCurrentDate } from '../../utils/dateUtils';
import { DateInputField } from '../DateInputField';

interface AddOdsFormProps {
    onClose: () => void;
    onSave: (ods: any) => void | Promise<void>;
    pieceId: number;
    initialData?: Ods;
    associatedOds: Ods[];
    associatedLots?: LotOperation[]; // Pass linked lots to select from
}

const natureOdsOptions = ["انطلاق", "ايقاف", "استئناف", "ختام"];

const AddOdsForm: React.FC<AddOdsFormProps> = ({ onClose, onSave, pieceId, initialData, associatedOds, associatedLots = [] }) => {
    const [objetOds, setObjetOds] = useState('');
    const [natureOds, setNatureOds] = useState(natureOdsOptions[0]);
    const [dateOds, setDateOds] = useState('');
    const [selectedLotId, setSelectedLotId] = useState<number | ''>(''); // Empty means "Global" / "Piece"
    const [notification, setNotification] = useState<{ message: string; type: 'error' | 'info' } | null>(null);

    // Protection Refs
    const isDirty = useRef(false);
    const isEditLoaded = useRef(false);

    const markDirty = () => { isDirty.current = true; };

    useEffect(() => {
        if (initialData && !isEditLoaded.current) {
            setObjetOds(initialData.OBJET_ODS);
            setNatureOds(initialData.NATURE_ODS);
            setDateOds(normalizeDate(initialData.DATE_ODS));
            setSelectedLotId(initialData.ID_LOT || '');
            isEditLoaded.current = true;
            isDirty.current = true;
        } else if (!initialData && !isDirty.current) {
            setDateOds(getCurrentDate());
        }
    }, [initialData]);

    useEffect(() => {
        if (!dateOds || dateOds.length < 10) { // Simple check for completeness
            setNotification(null);
            return;
        }

        // Filter ODS history based on the current scope (Global or specific Lot)
        const currentScopeOds = associatedOds.filter(o => 
            (selectedLotId === '' && !o.ID_LOT) || (o.ID_LOT === selectedLotId)
        );

        const sortedOds = [...currentScopeOds]
            .filter(ods => ods.ID_ODS !== initialData?.ID_ODS)
            .sort((a, b) => compareDates(a.DATE_ODS, b.DATE_ODS));

        const lastOds = sortedOds.length > 0 ? sortedOds[sortedOds.length - 1] : null;

        setNotification(null); // Reset on each change

        if (lastOds) {
            // Allow 'Conclusion' (ختام) on the same day as 'Resumption' (استئناف)
            const isClosingOnResumptionDay = (natureOds === 'ختام' && lastOds.NATURE_ODS === 'استئناف' && compareDates(dateOds, lastOds.DATE_ODS) === 0);

            if (compareDates(dateOds, lastOds.DATE_ODS) < 0 || (compareDates(dateOds, lastOds.DATE_ODS) === 0 && !isClosingOnResumptionDay)) {
                setNotification({ message: `التاريخ الجديد يجب أن يكون بعد تاريخ آخر أمر خدمة (${lastOds.DATE_ODS}) لهذا النطاق.`, type: 'error' });
                return;
            }

            const lastNature = lastOds.NATURE_ODS;

            if (lastNature === 'انطلاق' || lastNature === 'استئناف') {
                if (!['ايقاف', 'ختام'].includes(natureOds)) {
                    setNotification({ message: 'بعد الإنطلاق أو الإستئناف، يجب أن يكون الأمر التالي "ايقاف" أو "ختام".', type: 'error' });
                }
            } else if (lastNature === 'ايقاف') {
                if (natureOds !== 'استئناف') {
                    setNotification({ message: 'بعد الإيقاف، يجب أن يكون الأمر التالي "استئناف".', type: 'error' });
                }
            } else if (lastNature === 'ختام') {
                setNotification({ message: 'لا يمكن إضافة أمر خدمة جديد بعد الختام.', type: 'error' });
            }
        } else {
            if (natureOds !== 'انطلاق') {
                setNotification({ message: 'أول أمر خدمة لهذا النطاق يجب أن يكون "انطلاق".', type: 'error' });
            }
        }
    }, [dateOds, natureOds, associatedOds, initialData, selectedLotId]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (notification?.type === 'error') {
            alert(`خطأ في الإدخال: ${notification.message}`);
            return;
        }

        // Check for duplicates in the current scope
        const currentScopeOds = associatedOds.filter(o => 
            (selectedLotId === '' && !o.ID_LOT) || (o.ID_LOT === selectedLotId)
        );

        // 1. منع تكرار نفس النوع بنفس التاريخ
        const isExactDuplicate = currentScopeOds.some(o => 
            o.NATURE_ODS === natureOds && 
            normalizeDate(o.DATE_ODS) === normalizeDate(dateOds) && 
            o.ID_ODS !== initialData?.ID_ODS
        );

        if (isExactDuplicate) {
            alert('يوجد أمر خدمة بنفس الطبيعة والتاريخ مسجل بالفعل لهذا النطاق.');
            return;
        }

        // 2. منع تكرار "انطلاق" أو "ختام"
        if (['انطلاق', 'ختام'].includes(natureOds)) {
            const hasExistingType = currentScopeOds.some(o => 
                o.NATURE_ODS === natureOds && 
                o.ID_ODS !== initialData?.ID_ODS
            );
            if (hasExistingType) {
                alert(`لا يمكن إضافة أكثر من أمر "${natureOds}" لنفس النطاق.`);
                return;
            }
        }

        setIsSubmitting(true);
        const { ...validInitialData } = (initialData || {}) as any;

        const payload = {
            ...validInitialData,
            OBJET_ODS: objetOds,
            NATURE_ODS: natureOds,
            DATE_ODS: dateOds,
            ID_PIECE: pieceId,
            ID_LOT: selectedLotId || null,
        };

        Promise.resolve(onSave(payload)).finally(() => {
            setIsSubmitting(false);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
            <div className="sticky top-0 bg-white z-10 pb-2 border-b border-gray-200 flex items-center justify-between pt-0.5 mb-3">
                <span className="text-xs font-bold text-gray-700">بيانات أمر الخدمة (ODS)</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-semibold"
                    >
                        إلغاء
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-xs font-bold shadow-xs"
                    >
                        {isSubmitting ? 'جاري الحفظ...' : (initialData ? 'حفظ التغييرات' : 'إضافة')}
                    </button>
                </div>
            </div>

            <div className="space-y-3 overflow-y-auto px-0.5 pb-1 text-xs text-right">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                    <div className="md:col-span-2">
                        <label htmlFor="idLot" className="block text-[11px] font-bold text-gray-700 text-right mb-0.5">النطاق (حصة أو عام)</label>
                        <select
                            id="idLot"
                            value={selectedLotId}
                            onChange={(e) => { setSelectedLotId(e.target.value ? Number(e.target.value) : ''); markDirty(); }}
                            className="w-full h-8 px-2 text-xs text-gray-800 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                        >
                            <option value="">الصفقة ككل (عام)</option>
                            {associatedLots.map(lot => (
                                <option key={lot.ID_LOT} value={lot.ID_LOT}>
                                    حصة {lot.N_LOT}: {lot.INTITULE_LOT}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label htmlFor="objetOds" className="block text-[11px] font-bold text-gray-700 text-right mb-0.5">موضوع أمر الخدمة</label>
                        <input
                            id="objetOds"
                            type="text"
                            value={objetOds}
                            onChange={(e) => { setObjetOds(e.target.value); markDirty(); }}
                            required
                            className="w-full h-8 px-2.5 text-xs text-gray-800 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="natureOds" className="block text-[11px] font-bold text-gray-700 text-right mb-0.5">طبيعة الأمر</label>
                        <select
                            id="natureOds"
                            value={natureOds}
                            onChange={(e) => { 
                                const val = e.target.value;
                                setNatureOds(val); 
                                if (val === 'ختام') setObjetOds('محضر استلام مؤقت');
                                markDirty(); 
                            }}
                            required
                            className="w-full h-8 px-2 text-xs text-gray-800 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                        >
                            {natureOdsOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <div>
                        <DateInputField
                            id="dateOds"
                            label="تاريخ الأمر"
                            value={dateOds}
                            onChange={(val) => { setDateOds(val); markDirty(); }}
                            required
                        />
                    </div>
                </div>
                
                {notification && (
                    <div className={`p-2.5 rounded-lg text-xs font-semibold text-right flex items-center gap-2 border ${
                        notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`} role="alert">
                        <i className={`bi ${
                            notification.type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'
                        }`}></i>
                        <span>{notification.message}</span>
                    </div>
                )}
            </div>
        </form>
    );
};

export default AddOdsForm;