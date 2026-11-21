import React, { useMemo, useState, useEffect } from 'react';
import { Page, User, LotOperation, Ods } from '../types';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfirm } from '../context/ConfirmContext';
import { formatCurrency } from '../utils/currencyUtils';
import { parseDate, compareDates, calculateElapsedDays, getEffectiveDurationDays, isFinancialDuration, formatDurationArabic, formatDate } from '../utils/dateUtils';
import Modal from '../components/Modal';
import AddLotPieceForm from '../components/forms/AddLotPieceForm';
import AddOdsForm from '../components/forms/AddOdsForm';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DocumentDetailsPageProps {
    navigate: (page: Page, operationId?: number, extraId?: string) => void;
    pieceId: number;
    onGoBack?: () => void;
    currentUser: User;
}

const DocumentDetailsPage: React.FC<DocumentDetailsPageProps> = ({
    navigate,
    pieceId,
    onGoBack,
    currentUser
}) => {
    const { db, loading, addItem, updateItem, deleteItem } = useData();
    const { showToast } = useToast();
    const { dir } = useLanguage();
    const { confirm } = useConfirm();

    const [isLotModalOpen, setIsLotModalOpen] = useState(false);
    const [isOdsModalOpen, setIsOdsModalOpen] = useState(false);
    const [editingLot, setEditingLot] = useState<LotOperation | null>(null);
    const [editingOds, setEditingOds] = useState<Ods | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isViewer = currentUser.ROLE === 'viewer';

    // 1. الوثيقة الحالية
    const piece = useMemo(() => {
        return db.T_PIECE.find(p => p.ID_PIECE === pieceId) || null;
    }, [db.T_PIECE, pieceId]);

    // 2. العملية المرتبطة
    const operation = useMemo(() => {
        if (!piece) return null;
        return db.T_OPERATION.find(op => op.ID_OPERATION === piece.ID_OPERATION) || null;
    }, [db.T_OPERATION, piece]);

    // 3. المتعامل المتعاقد / المستفيد والحساب البنكي
    const beneficiary = useMemo(() => {
        if (!piece || !piece.ID_BENEFICIAIRE) return null;
        return db.T_BENEFICIAIRE.find(b => b.ID_BENEFICIAIRE === piece.ID_BENEFICIAIRE) || null;
    }, [db.T_BENEFICIAIRE, piece]);

    const bankAccount = useMemo(() => {
        if (!piece || !piece.ID_COMPTE) return null;
        return db.T_COMPTE_BANCAIRE.find(c => c.ID_COMPTE === piece.ID_COMPTE) || null;
    }, [db.T_COMPTE_BANCAIRE, piece]);

    // 4. الحصص المرتبطة
    const associatedLotPieces = useMemo(() => {
        if (!piece) return [];
        return db.T_LOT_PIECE.filter(lp => lp.ID_PIECE === piece.ID_PIECE);
    }, [piece, db.T_LOT_PIECE]);

    const associatedLots = useMemo(() => {
        return associatedLotPieces.map(lp => {
            const lot = db.T_LOT_OPERATION.find(l => l.ID_LOT === lp.ID_LOT);
            if (!lot) return null;
            return {
                ...lot,
                ID_LOT_PIECE: lp.ID_LOT_PIECE,
                DELAI_EX_JOURS: lp.DELAI_EX_JOURS
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null);
    }, [associatedLotPieces, db.T_LOT_OPERATION]);

    // 5. أوامر الخدمة (ODS)
    const odsList = useMemo(() => {
        if (!piece) return [];
        return db.T_ODS
            .filter(o => o.ID_PIECE === piece.ID_PIECE)
            .sort((a, b) => compareDates(a.DATE_ODS, b.DATE_ODS));
    }, [piece, db.T_ODS]);

    const [odsPageSize, setOdsPageSize] = useState<number | 'all'>(25);
    const [odsCurrentPage, setOdsCurrentPage] = useState<number>(1);

    useEffect(() => {
        setOdsCurrentPage(1);
    }, [pieceId]);

    const totalOdsRows = odsList.length;
    const totalOdsPages = odsPageSize === 'all' ? 1 : Math.ceil(totalOdsRows / (odsPageSize as number)) || 1;
    const safeOdsCurrentPage = Math.min(Math.max(odsCurrentPage, 1), totalOdsPages);

    const paginatedOdsList = useMemo(() => {
        if (odsPageSize === 'all') return odsList;
        const start = (safeOdsCurrentPage - 1) * (odsPageSize as number);
        return odsList.slice(start, start + (odsPageSize as number));
    }, [odsList, safeOdsCurrentPage, odsPageSize]);

    const renderOdsPaginationControls = () => {
        if (odsList.length === 0) return null;
        const startIdx = odsPageSize === 'all' ? 1 : (safeOdsCurrentPage - 1) * (odsPageSize as number) + 1;
        const endIdx = odsPageSize === 'all' ? totalOdsRows : Math.min(safeOdsCurrentPage * (odsPageSize as number), totalOdsRows);

        return (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border-t border-sky-200 text-xs select-none">
                <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-medium text-[11px]">
                        عرض <span className="font-bold text-sky-700">{startIdx}</span> إلى <span className="font-bold text-sky-700">{endIdx}</span> من أصل <span className="font-bold text-gray-900">{totalOdsRows}</span> أمر خدمة
                    </span>
                    <div className="flex items-center gap-1.5 border-r pr-3 border-gray-300">
                        <label className="text-gray-600 font-semibold text-[11px]">عدد الصفوف بالصفحة:</label>
                        <select
                            value={odsPageSize}
                            onChange={(e) => {
                                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                                setOdsPageSize(val);
                                setOdsCurrentPage(1);
                            }}
                            className="h-6 px-1.5 bg-white border border-gray-300 rounded text-[11px] font-bold outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value="all">الكل ({totalOdsRows})</option>
                        </select>
                    </div>
                </div>

                {odsPageSize !== 'all' && totalOdsPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setOdsCurrentPage(1); }}
                            disabled={safeOdsCurrentPage === 1}
                            className="p-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white text-gray-700 transition cursor-pointer disabled:cursor-not-allowed"
                            title="الصفحة الأولى"
                        >
                            <ChevronsRight size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setOdsCurrentPage(prev => Math.max(prev - 1, 1)); }}
                            disabled={safeOdsCurrentPage === 1}
                            className="p-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white text-gray-700 transition cursor-pointer disabled:cursor-not-allowed"
                            title="الصفحة السابقة"
                        >
                            <ChevronRight size={14} />
                        </button>

                        <div className="flex items-center px-1.5 gap-1">
                            <span className="text-gray-600 text-[11px]">صفحة</span>
                            <input
                                type="number"
                                min={1}
                                max={totalOdsPages}
                                value={safeOdsCurrentPage}
                                onChange={(e) => {
                                    const p = parseInt(e.target.value, 10);
                                    if (!isNaN(p) && p >= 1 && p <= totalOdsPages) {
                                        setOdsCurrentPage(p);
                                    }
                                }}
                                className="w-11 h-6 text-center border border-gray-300 rounded font-bold text-sky-700 text-[11px] outline-none focus:ring-1 focus:ring-sky-500"
                            />
                            <span className="text-gray-600 text-[11px]">من {totalOdsPages}</span>
                        </div>

                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setOdsCurrentPage(prev => Math.min(prev + 1, totalOdsPages)); }}
                            disabled={safeOdsCurrentPage === totalOdsPages}
                            className="p-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white text-gray-700 transition cursor-pointer disabled:cursor-not-allowed"
                            title="الصفحة التالية"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setOdsCurrentPage(totalOdsPages); }}
                            disabled={safeOdsCurrentPage === totalOdsPages}
                            className="p-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white text-gray-700 transition cursor-pointer disabled:cursor-not-allowed"
                            title="الصفحة الأخيرة"
                        >
                            <ChevronsLeft size={14} />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // 6. الملحقات المرتبطة بالوثيقة (Avenants)
    const childPieces = useMemo(() => {
        if (!piece) return [];
        return db.T_PIECE.filter(p => p.ID_PIECE_INIT === piece.ID_PIECE);
    }, [piece, db.T_PIECE]);

    const avenants = useMemo(() => {
        return childPieces.filter(p => p.NAT_PIECE === 'ملحق');
    }, [childPieces]);

    // المبلغ الجديد بعد احتساب الملحقات
    const newTotalAmount = useMemo(() => {
        if (!piece) return 0;
        const avenantSum = avenants.reduce((sum, av) => sum + (av.MONTANT_PIECE || 0), 0);
        return (piece.MONTANT_PIECE || 0) + avenantSum;
    }, [piece, avenants]);

    // 7. المعرفات المرتبطة بالوثيقة (الوثيقة الرئيسية + الملاحق ووضعيات الأشغال التابعة)
    const allRelatedPieceIds = useMemo(() => {
        if (!piece) return new Set<number>();
        const set = new Set<number>();
        const contractId = Number(piece.ID_PIECE);
        set.add(contractId);

        // المستوى الأول من الوثائق التابعة (ملاحق، وضعيات أشغال، فواتير...)
        const level1 = db.T_PIECE.filter(p => p.ID_PIECE_INIT && Number(p.ID_PIECE_INIT) === contractId);
        const level1Ids = level1.map(p => Number(p.ID_PIECE));
        level1Ids.forEach(id => set.add(id));

        // المستوى الثاني من الوثائق التابعة إن وجد
        if (level1Ids.length > 0) {
            const level2 = db.T_PIECE.filter(p => p.ID_PIECE_INIT && level1Ids.includes(Number(p.ID_PIECE_INIT)));
            level2.forEach(p => set.add(Number(p.ID_PIECE)));
        }

        return set;
    }, [piece, db.T_PIECE]);

    // الالتزامات والدفعات المسجلة للوثيقة والوثائق التابعة لها
    const engagements = useMemo(() => {
        if (!piece) return [];
        return db.T_ENGAGEMENT.filter(e => e.ID_PIECE && allRelatedPieceIds.has(Number(e.ID_PIECE)));
    }, [piece, allRelatedPieceIds, db.T_ENGAGEMENT]);

    // أحدث تأشيرة مراقب مالي للالتزام
    const lastVisaCb = useMemo(() => {
        const withVisa = engagements.filter(e => e.N_VISA_CB);
        if (withVisa.length === 0) return null;
        return withVisa[withVisa.length - 1];
    }, [engagements]);

    const paiements = useMemo(() => {
        if (!piece) return [];
        return db.T_PAIEMENT.filter(p => p.ID_PIECE && allRelatedPieceIds.has(Number(p.ID_PIECE)));
    }, [piece, allRelatedPieceIds, db.T_PAIEMENT]);

    // إجمالي المبالغ المدفوعة
    const totalPaid = useMemo(() => {
        return paiements.reduce((sum, p) => sum + (p.MONTANT_PAI || 0), 0);
    }, [paiements]);

    // نسبة التقدم المالي والمبلغ المتبقي
    const financialProgressPercent = useMemo(() => {
        const referenceAmount = newTotalAmount > 0 ? newTotalAmount : (piece?.MONTANT_PIECE || 0);
        if (referenceAmount <= 0) return 0;
        const pct = (totalPaid / referenceAmount) * 100;
        return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
    }, [newTotalAmount, piece, totalPaid]);

    const remainingAmount = useMemo(() => {
        const referenceAmount = newTotalAmount > 0 ? newTotalAmount : (piece?.MONTANT_PIECE || 0);
        return Math.max(0, referenceAmount - totalPaid);
    }, [newTotalAmount, piece, totalPaid]);

    // 8. حسابات آجال الإنجاز والتأخير وأيام التوقف (ODS calculations)
    const odsStats = useMemo(() => {
        if (!piece) return null;

        const useFinancialRule = isFinancialDuration(piece.DELAI_EX_JOURS);
        const baseDuration = getEffectiveDurationDays(piece.DELAI_EX_JOURS);

        const commencementOds = odsList.find(o => o.NATURE_ODS === 'انطلاق');
        if (!commencementOds) {
            return {
                baseDuration,
                startDate: null,
                totalSuspensionDays: 0,
                consumedDays: 0,
                delayDays: 0,
                stopDays: 0,
                expectedEndDate: null,
                isCompleted: false,
                isSuspended: false
            };
        }

        const startDate = parseDate(commencementOds.DATE_ODS);
        if (!startDate) {
            return {
                baseDuration,
                startDate: null,
                totalSuspensionDays: 0,
                consumedDays: 0,
                delayDays: 0,
                stopDays: 0,
                expectedEndDate: null,
                isCompleted: false,
                isSuspended: false
            };
        }

        const sortedOds = [...odsList]
            .map(o => ({ ...o, parsedDate: parseDate(o.DATE_ODS) }))
            .filter(o => o.parsedDate !== null)
            .sort((a, b) => a.parsedDate!.getTime() - b.parsedDate!.getTime());

        let consumedDays = 0;
        let totalStopDays = 0;

        let activeStartDate: Date | null = null;
        let stopStartDate: Date | null = null;
        let isSuspended = false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        sortedOds.forEach(ods => {
            const odsDate = ods.parsedDate!;

            if (ods.NATURE_ODS === 'انطلاق' || ods.NATURE_ODS === 'استئناف') {
                activeStartDate = odsDate;
                if (stopStartDate) {
                    totalStopDays += calculateElapsedDays(stopStartDate, odsDate, useFinancialRule);
                    stopStartDate = null;
                }
                isSuspended = false;
            } else if (ods.NATURE_ODS === 'ايقاف') {
                if (activeStartDate) {
                    consumedDays += calculateElapsedDays(activeStartDate, odsDate, useFinancialRule);
                    activeStartDate = null;
                }
                stopStartDate = odsDate;
                isSuspended = true;
            } else if (ods.NATURE_ODS === 'ختام') {
                if (activeStartDate) {
                    // من تاريخ الاستئناف/الانطلاق حتى (تاريخ الختام + 1)
                    const endDatePlusOne = new Date(odsDate);
                    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
                    consumedDays += calculateElapsedDays(activeStartDate, endDatePlusOne, useFinancialRule);
                    activeStartDate = null;
                }
                if (stopStartDate) {
                    totalStopDays += calculateElapsedDays(stopStartDate, odsDate, useFinancialRule);
                    stopStartDate = null;
                }
                isSuspended = false;
            }
        });

        // إذا كان العمل مستمراً ولم يوجد توقف أو ختام بعده
        if (activeStartDate) {
            consumedDays += calculateElapsedDays(activeStartDate, today, useFinancialRule);
        }

        // إذا كانت الوثيقة متوقفة حالياً
        if (isSuspended && stopStartDate) {
            totalStopDays += calculateElapsedDays(stopStartDate, today, useFinancialRule);
        }

        const isCompleted = sortedOds.some(o => o.NATURE_ODS === 'ختام');

        // تاريخ الانتهاء المتوقع = تاريخ البداية + مدة الإنجاز + أيام التوقف المغلقة
        const expectedEndDate = new Date(startDate);
        expectedEndDate.setDate(startDate.getDate() + baseDuration + totalStopDays);

        // أيام التأخير = الأيام المستهلكة - مدة الإنجاز (إذا تجاوزت الأيام المستهلكة مدة الإنجاز)
        const delayDays = Math.max(0, consumedDays - baseDuration);

        return {
            baseDuration,
            startDate,
            totalSuspensionDays: totalStopDays,
            consumedDays,
            delayDays,
            stopDays: totalStopDays,
            expectedEndDate,
            isCompleted,
            isSuspended
        };
    }, [piece, odsList]);

    // حذف حصة
    const handleDeleteLotPiece = async (idLotPiece: number) => {
        const confirmed = await confirm('هل أنت متأكد من حذف هذا الرابط للحصة؟');
        if (!confirmed) return;
        setIsDeleting(true);
        try {
            await deleteItem('T_LOT_PIECE', idLotPiece);
            showToast('تم حذف رابط الحصة بنجاح', 'success');
        } catch (_err) {
            showToast('حدث خطأ أثناء حذف الحصة', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    // حذف أمر خدمة
    const handleDeleteOds = async (idOds: number) => {
        const confirmed = await confirm('هل أنت متأكد من حذف أمر الخدمة هذا؟');
        if (!confirmed) return;
        setIsDeleting(true);
        try {
            await deleteItem('T_ODS', idOds);
            showToast('تم حذف أمر الخدمة بنجاح', 'success');
        } catch (_err) {
            showToast('حدث خطأ أثناء حذف أمر الخدمة', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading || !piece) {
        return (
            <div className="p-8 text-center text-gray-500 font-bold" dir={dir}>
                جاري تحميل تفاصيل الوثيقة...
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-5 w-full max-w-none bg-[#f1f5f9] min-h-full text-gray-800 space-y-4" dir={dir}>
            
            {/* 1. الشريط العلوي الرئاسي (Header Bar) */}
            <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 flex flex-col xl:flex-row items-center justify-between gap-4">
                
                {/* يمين الشريط العلوي في RTL: عنوان الوثيقة والبادجات */}
                <div className="flex flex-col items-start w-full xl:w-auto gap-1 text-right text-[9px]">
                    <div className="flex items-center gap-3">
                        <div className="bg-sky-600 text-white p-2 rounded-xl flex items-center justify-center shadow-sm">
                            <i className="bi bi-file-earmark-text-fill text-[9px]"></i>
                        </div>
                        <h1 className="text-base text-[9px] font-black text-slate-900 tracking-tight">
                            {piece.PIECE}
                        </h1>
                         {/* مبلغ الوثيقة */}
                        <span className="bg-sky-100 text-sky-700 border border-sky-200 font-bold px-2.5 py-0.5 rounded-md">
                            {formatCurrency(piece.MONTANT_PIECE)}
                        </span>
                        
                        <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-md font-bold shadow-xs">
                                <i className="bi bi-clock"></i>
                                <span>مدة الإنجاز: {formatDurationArabic(piece.DELAI_EX_JOURS)}</span>
                        </span>
                           
                        <span className="bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-md font-bold shadow-xs">
                                <i className="bi bi-shield-check"></i>
                                <span>كفالة ضمان: {piece.CAUTION}</span>
                        </span>
                    
                        
                    </div>
                     
                    
                </div>
                {/* رقم وعنوان العملية */}
                   {operation && (
                   <div className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-[9px] font-semibold max-w-md text-center text-start" title={`${operation.N_OPERATION} — ${operation.INT_OPERATION}`}>
                            <span className="font-bold text-slate-900">{operation.N_OPERATION}</span>
                            <span className="mx-2">—</span>
                            <span className="text-[9px]">{operation.INT_OPERATION}</span>
                   </div>
                   )}
                
                {/* يسار الشريط العلوي في RTL: أزرار التنقل والمبالغ   */}
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
                                     

                    {/* أزرار الرجوع والتنقل */}
                    <button
                        onClick={() => {
                            if (piece) {
                                navigate('DOCUMENTS', piece.ID_OPERATION, `${piece.ID_PIECE}:blue`);
                            } else if (onGoBack) {
                                onGoBack();
                            } else {
                                navigate('DOCUMENTS');
                            }
                        }}
                        className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-3 py-2 rounded-xl shadow-xs transition-colors text-[9px] cursor-pointer"
                        title="الرجوع إلى صفحة الوثائق وتحديد هذه الوثيقة"
                    >
                        <i className="bi bi-arrow-right"></i>
                        <span>الوثائق</span>
                    </button>

                    <button
                        onClick={() => {
                            if (operation && piece) {
                                const isPaymentDoc = ['وضعية الأشغال', 'فاتورة', 'وضعية التسبيق الجزافي', 'وضعية التسبيق على التموين'].includes(piece.NAT_PIECE);
                                
                                if (isPaymentDoc) {
                                    const linkedPaiement = db.T_PAIEMENT.find(p => Number(p.ID_PIECE) === Number(piece.ID_PIECE));
                                    const tabParam = linkedPaiement ? `PAIEMENTS:${linkedPaiement.ID_PAIEMENT}:blue` : 'PAIEMENTS';
                                    navigate('OPERATION_DETAILS', operation.ID_OPERATION, tabParam);
                                } else {
                                    const linkedEng = db.T_ENGAGEMENT.find(e => Number(e.ID_PIECE) === Number(piece.ID_PIECE) || (piece.ID_PIECE_INIT && Number(e.ID_PIECE) === Number(piece.ID_PIECE_INIT)));
                                    const tabParam = linkedEng ? `ENGAGEMENTS:${linkedEng.ID_ENGAGEMENT}:blue` : 'ENGAGEMENTS';
                                    navigate('OPERATION_DETAILS', operation.ID_OPERATION, tabParam);
                                }
                            } else if (onGoBack) {
                                onGoBack();
                            } else {
                                navigate('DOCUMENTS');
                            }
                        }}
                        className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-3 py-2 rounded-xl shadow-xs transition-colors text-[9px] cursor-pointer"
                        title="الرجوع إلى تفاصيل العملية (تبويب الدفعات للوضعية / تبويب الالتزامات للوثائق الأُخرى)"
                    >
                        <i className="bi bi-folder2-open"></i>
                        <span>العملية</span>
                    </button>
                </div>
            </header>

            {/* 2. جسم الصفحة المقسم (Main Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                
                {/* 1. القسم الأيمن في RTL (العرض 4 أعمدة): بطاقة تفاصيل الوثيقة والمستفيد والتأشيرات والتقدم المالي */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                        
                        
                        {/* معلومات المستفيد (التعريف الجبائي والسجل التجاري) */}
                        <div className="grid grid-cols-2 gap-3 text-[10px] border-b border-slate-100 pb-3">
                            <div>
                                <p className="text-slate-400 font-semibold mb-0.5 text-right">رقم التعريف الجبائي (NIF):</p>
                                <p className="font-bold text-slate-800 text-right">{beneficiary?.CODE_FISCALE || '---'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 font-semibold mb-0.5 text-right">رقم السجل التجاري (NRC):</p>
                                <p className="font-bold text-slate-800 text-right">{beneficiary?.RC || '---'}</p>
                            </div>
                        </div>

                        {/* عنوان المستفيد والحساب البنكي */}
                        <div className="space-y-2 text-[10px] border-b border-slate-100 pb-3">
                            <div className="flex justify-between items-center">
                                 <span className="text-slate-400 font-semibold">عنوان المستفيد:</span> 
                                <span className="font-bold text-slate-800">{beneficiary?.ADRESSE || '---'}</span>
                                
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-semibold">الحساب البنكي (RIB):</span>
                                <div className="flex items-center gap-1.5">
                                    {bankAccount?.BANQUE && (
                                        <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-1.5 py-0.5 rounded border border-blue-200">
                                            {bankAccount.BANQUE}
                                        </span>
                                    )}
                                    <span className="font-bold text-slate-900 text-[10px]">{bankAccount?.RIB || '---'}</span>
                                </div>
                                
                            </div>
                        </div>

                        {/* التأشيرات (لجنة الصفقات + المراقب المالي) */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] border-b border-slate-100 pb-3">
                            {/* تأشيرة لجنة الصفقات */}
                            <div className="bg-pink-50/70 border border-pink-200 p-2.5 rounded-xl text-center">
                                <p className="text-pink-800 text-[10px] font-bold mb-1">تأشيرة لجنة الصفقات:</p>
                                <p className="font-bold text-slate-900">{piece.N_VISA_CM ? `رقم: ${piece.N_VISA_CM}` : '---'}</p>
                                {piece.DATE_VISA_CM && (
                                    <p className="text-[10px] text-slate-500 mt-0.5">بتاريخ: {formatDate(piece.DATE_VISA_CM)}</p>
                                )}
                            </div>

                            {/* تأشيرة المراقب المالي */}
                            <div className="bg-blue-50/70 border border-blue-200 p-2.5 rounded-xl text-center">
                                <p className="text-blue-800 text-[10px] font-bold mb-1">تأشيرة المراقب المالي:</p>
                                <p className="font-bold text-slate-900">
                                    {lastVisaCb?.N_VISA_CB ? `رقم: ${lastVisaCb.N_VISA_CB}` : '---'}
                                    {lastVisaCb?.DATE_VISA_CB ? ` في: ${formatDate(lastVisaCb.DATE_VISA_CB)}` : ''}
                                </p>
                                {lastVisaCb?.N_ENG && (
                                    <p className="text-[10px] text-blue-600 mt-0.5">بطاقة: {lastVisaCb.N_ENG}</p>
                                )}
                            </div>
                        </div>

                        {/* الملحقات والمبلغ الجديد */}
                        <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-xl flex items-center justify-between">
                            
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sky-900 text-[10px]">المبلغ الجديد:</span>
                                
                            </div>
                            
                            <span className="font-black text-sky-800 text-[10px] sm:text-sm">
                                {formatCurrency(newTotalAmount)}
                            </span> 
                            <span className="bg-sky-200 text-sky-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                        {avenants.length} ملحق  
                            </span>
                                                             
                         
                        </div>

                        {/* إجمالي الدفع والوضعيات */}
                        <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between">
                            
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-amber-900 text-[10px]">إجمالي الدفع:</span>
                                
                            </div>
                            <span className="font-black text-amber-800 text-[10px] sm:text-sm">
                                {formatCurrency(totalPaid)}
                            </span>
                            <span className="bg-amber-200 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    {paiements.length} وضعية
                            </span>
                        </div>

                        {/* شريط نسبة التقدم المالي */}
                        <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                                <span>نسبة التقدم المالي:</span>
                                <span className="text-blue-600">{financialProgressPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${financialProgressPercent}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* المبلغ المتبقي */}
                        <div className="flex justify-between items-center text-[10px] font-bold pt-2 border-t border-slate-100">
                            
                            <span className="text-slate-500">المبلغ المتبقي:</span>
                            <span className="font-black text-slate-900">
                                {formatCurrency(remainingAmount)}
                            </span>
                            
                        </div>
                    </div>
                </div>

                {/* 2. القسم الأيسر في RTL (العرض 8 أعمدة): الحصص المرتبطة + أوامر الخدمة ODS + شريط الآجال */}
                <div className="lg:col-span-8 space-y-4">
                    
                    {/* جدول الحصص المرتبطة */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                            <h2 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5">
                                <i className="bi bi-paperclip text-indigo-600 text-base"></i>
                                <span>الحصص المرتبطة</span>
                            </h2>
                            
                            <div className="flex items-center gap-2">  
                                                          
                                <button
                                    onClick={() => {
                                        if (isViewer) return;
                                        setEditingLot(null);
                                        setIsLotModalOpen(true);
                                    }}
                                    disabled={isViewer}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-3 py-1 rounded-xl text-[10px] flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                                >
                                    <i className="bi bi-plus-circle"></i>
                                    <span>إضافة حصة</span>
                                </button>
                                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                    {associatedLots.length}
                                </span>
                            </div>

                            
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-center text-[9px]">
                                <thead>
                                    <tr className="bg-indigo-50/70 text-indigo-900 border-b border-indigo-100 font-bold">
                                        <th className="p-2.5 text-right">رقم الحصة</th>
                                        <th className="p-2.5 text-right">تسمية الحصة</th>
                                        <th className="p-2.5">المدة</th>
                                        <th className="p-2.5 text-left">المبلغ الأولي</th>
                                        <th className="p-2.5 text-left">المبلغ النهائي</th>
                                        <th className="p-2.5">الحالة</th>
                                        <th className="p-2.5 text-center w-24">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[10px]">
                                    {associatedLots.length > 0 ? (
                                        associatedLots.map(lot => (
                                            <tr key={lot.ID_LOT_PIECE} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-2.5 text-right font-black text-slate-900 ">
                                                    {lot.N_LOT}
                                                </td>
                                                <td className="p-2.5 text-right font-bold text-slate-700">
                                                    {lot.INTITULE_LOT}
                                                </td>
                                                <td className="p-2.5 text-slate-500 font-bold">
                                                    {lot.DELAI_EX_JOURS ? (
                                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                                                            {formatDurationArabic(lot.DELAI_EX_JOURS)}
                                                        </span>
                                                    ) : '---'}
                                                </td>
                                                <td className="p-2.5 text-left text-slate-600">
                                                    {formatCurrency(lot.MONTANT_INITIALE_LOT)}
                                                </td>
                                                <td className="p-2.5 text-left font-bold text-slate-900">
                                                    {formatCurrency(lot.MONTANT_FINALE_LOT)}
                                                </td>
                                                <td className="p-2.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        lot.ATTRIBUER 
                                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                                            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                    }`}>
                                                        {lot.ATTRIBUER ? 'ممنوحة' : 'ممنوحة'}
                                                    </span>
                                                </td>
                                                <td className="p-2.5">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {!isViewer && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingLot(lot);
                                                                        setIsLotModalOpen(true);
                                                                    }}
                                                                    className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                                    title="تعديل الحصة"
                                                                >
                                                                    <i className="bi bi-pencil-square text-sm"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteLotPiece(lot.ID_LOT_PIECE)}
                                                                    disabled={isDeleting}
                                                                    className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                                    title="حذف الحصة"
                                                                >
                                                                    <i className="bi bi-trash-fill text-sm"></i>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="p-4 text-center text-slate-400 font-bold">
                                                لا توجد حصص مرتبطة بهذه الوثيقة حالياً
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* جدول أوامر الخدمة ODS */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5">
                                <i className="bi bi-check2-square text-sky-600 text-sm"></i>
                                <span>أوامر الخدمة (ODS)</span>
                            </h2>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        if (isViewer) return;
                                        setEditingOds(null);
                                        setIsOdsModalOpen(true);
                                    }}
                                    disabled={isViewer}
                                    className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold px-3 py-1 rounded-xl text-[10px] flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                                >
                                    <i className="bi bi-plus-circle"></i>
                                    <span>إضافة أمر خدمة</span>
                                </button>
                                <span className="bg-sky-100 text-sky-700 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                    {odsList.length}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-center border-collapse text-[10px]">
                                <thead>
                                    <tr className="bg-sky-100 text-gray-700 border-b border-sky-200 font-bold">
                                        <th className="p-2 text-center text-[10px] uppercase font-bold text-gray-600">الطبيعة</th>
                                        <th className="p-2 text-center text-[10px] uppercase font-bold text-gray-600">التاريخ</th>
                                        <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">الموضوع</th>
                                        <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">الحصة</th>
                                        <th className="p-2 text-center text-[10px] uppercase font-bold text-gray-600 w-20">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedOdsList.length > 0 ? (
                                        paginatedOdsList.map(ods => {
                                            const linkedLot = ods.ID_LOT ? db.T_LOT_OPERATION.find(l => l.ID_LOT === ods.ID_LOT) : null;
                                            return (
                                                <tr key={ods.ID_ODS} className="hover:bg-blue-50/60 transition-colors text-xs">
                                                    <td className="p-2 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                                            ods.NATURE_ODS === 'انطلاق' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                                            ods.NATURE_ODS === 'ايقاف' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                                            ods.NATURE_ODS === 'استئناف' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                                            'bg-purple-100 text-purple-800 border-purple-300'
                                                        }`}>
                                                            {ods.NATURE_ODS}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 text-slate-800 font-bold font-mono text-[10px]">
                                                        {formatDate(ods.DATE_ODS)}
                                                    </td>
                                                    <td className="p-2 text-right font-medium text-slate-700 text-[10px]">
                                                        {ods.OBJET_ODS}
                                                    </td>
                                                    <td className="p-2 text-right text-slate-600 font-semibold text-[10px]">
                                                        {linkedLot ? `${linkedLot.N_LOT} - ${linkedLot.INTITULE_LOT}` : 'عام'}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {!isViewer && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingOds(ods);
                                                                            setIsOdsModalOpen(true);
                                                                        }}
                                                                        className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                                        title="تعديل أمر الخدمة"
                                                                    >
                                                                        <i className="bi bi-pencil-square text-xs"></i>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteOds(ods.ID_ODS)}
                                                                        disabled={isDeleting}
                                                                        className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                                        title="حذف أمر الخدمة"
                                                                    >
                                                                        <i className="bi bi-trash-fill text-xs"></i>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-slate-400 font-bold text-xs">
                                                لا توجد أوامر خدمة مسجلة لهذه الوثيقة
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {renderOdsPaginationControls()}
                    </div>

                    {/* 3. شريط إحصائيات الآجال والانتهاء المتوقع الأحمر المميز */}
                    {odsStats && (
                        <div className="bg-[#fff1f2] border border-rose-200 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold">
                            <div className="flex items-center gap-2 text-rose-700 font-black">
                                <i className="bi bi-exclamation-circle-fill text-rose-600 text-[10px]"></i>
                                <span>تاريخ الانتهاء المتوقع:</span>
                                <span className="text-rose-800 text-[10px]">
                                    {odsStats.expectedEndDate ? formatDate(odsStats.expectedEndDate) : '---'}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                <div className="flex items-center gap-1.5 text-indigo-900 text-[10px]">
                                    <span>الأيام المستهلكة:</span>
                                    <span className="text-[10px] font-black text-indigo-700">{odsStats.consumedDays} يوم</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-rose-800 text-[10px]">
                                    <span>أيام التأخير:</span>
                                    <span className="text-[10px] font-black text-rose-600">{odsStats.delayDays} يوم</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-amber-800 text-[10px]">
                                    <i className="bi bi-pause-circle-fill text-amber-600 text-[10px]"></i>
                                    <span>أيام التوقف:</span>
                                    <span className="text-[10px] font-black text-amber-700">{odsStats.stopDays} يوم</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* نوافذ إضافة/تعديل الحصص وأوامر الخدمة */}
            {isLotModalOpen && (
                <Modal isOpen={isLotModalOpen} onClose={() => setIsLotModalOpen(false)} title={editingLot ? "تعديل حصة" : "إضافة حصة للوثيقة"} maxWidth="md">
                    <AddLotPieceForm
                        onClose={() => setIsLotModalOpen(false)}
                        onSave={async (lotPiece) => {
                            try {
                                showToast('جاري حفظ الحصة...', 'loading');
                                const existingLink = db.T_LOT_PIECE.find(lp => lp.ID_LOT === lotPiece.ID_LOT && lp.ID_LOT_PIECE !== lotPiece.ID_LOT_PIECE);
                                if (existingLink) {
                                    showToast('هذه الحصة مرتبطة بالفعل بهذه الوثيقة.', 'error');
                                    return;
                                }
                                if (lotPiece.ID_LOT_PIECE) {
                                    await updateItem('T_LOT_PIECE', lotPiece.ID_LOT_PIECE, lotPiece);
                                } else {
                                    await addItem('T_LOT_PIECE', lotPiece);
                                }
                                if (lotPiece.ID_LOT) {
                                    const lot = db.T_LOT_OPERATION.find(l => l.ID_LOT === lotPiece.ID_LOT);
                                    if (lot && !lot.ATTRIBUER) {
                                        await updateItem('T_LOT_OPERATION', lot.ID_LOT, { ...lot, ATTRIBUER: true });
                                    }
                                }
                                setIsLotModalOpen(false);
                                setEditingLot(null);
                                showToast('تم حفظ الحصة بنجاح', 'success');
                            } catch (error) {
                                console.error('Error saving lot piece:', error);
                                showToast('حدث خطأ أثناء حفظ الحصة', 'error');
                            }
                        }}
                        pieceId={piece.ID_PIECE}
                        allLotsForOperation={db.T_LOT_OPERATION.filter(l => l.ID_OPERATION === piece.ID_OPERATION)}
                        alreadyAssociatedLotIds={associatedLotPieces.map(lp => lp.ID_LOT)}
                        initialData={editingLot ? { ID_LOT_PIECE: (editingLot as any).ID_LOT_PIECE, ID_LOT: editingLot.ID_LOT, ID_PIECE: piece.ID_PIECE, DELAI_EX_JOURS: (editingLot as any).DELAI_EX_JOURS ?? null } : undefined}
                    />
                </Modal>
            )}

            {isOdsModalOpen && (
                <Modal isOpen={isOdsModalOpen} onClose={() => setIsOdsModalOpen(false)} title={editingOds ? "تعديل أمر خدمة" : "إضافة أمر خدمة"} maxWidth="md">
                    <AddOdsForm
                        onClose={() => setIsOdsModalOpen(false)}
                        onSave={async (ods) => {
                            try {
                                showToast('جاري حفظ أمر الخدمة...', 'loading');
                                if (editingOds?.ID_ODS) {
                                    await updateItem('T_ODS', editingOds.ID_ODS, { ...editingOds, ...ods });
                                } else {
                                    await addItem('T_ODS', ods);
                                }
                                setIsOdsModalOpen(false);
                                setEditingOds(null);
                                showToast('تم حفظ أمر الخدمة بنجاح', 'success');
                            } catch (error) {
                                console.error('Error saving ODS:', error);
                                showToast('حدث خطأ أثناء حفظ أمر الخدمة', 'error');
                            }
                        }}
                        pieceId={piece.ID_PIECE}
                        associatedOds={odsList}
                        associatedLots={associatedLots}
                        initialData={editingOds || undefined}
                    />
                </Modal>
            )}

        </div>
    );
};

export default DocumentDetailsPage;
