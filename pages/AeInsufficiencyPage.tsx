
import React, { useState, useMemo } from 'react';
import { Page, User } from '../types';
import { useData } from '../context/DataContext';
import PageWrapper from '../components/PageWrapper';
import { exportToFormattedExcel } from '../utils/exportToCsv';
import { formatCurrency } from '../utils/currencyUtils';
import CustomDropdown from '../components/CustomDropdown';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface AeInsufficiencyPageProps {
    navigate: (page: Page, operationId?: number) => void;
    onGoBack?: () => void;
    currentUser: User;
}

const formatCurrencyForExcel = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '0,00';
    return new Intl.NumberFormat('ar-DZ', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

const AeInsufficiencyPage: React.FC<AeInsufficiencyPageProps> = ({ navigate, onGoBack, currentUser }) => {
    const { db, loading } = useData();
    const [selectedOperationId, setSelectedOperationId] = useState<string>('');

    // Filter data: Pieces that are commitments (Contract/Convention/Addendum/Invoice) BUT NOT in T_ENGAGEMENT
    // AND where Piece Amount > Remaining AE for that Rubrique
    const insufficientData = useMemo(() => {
        if (loading) return [];

        const normalizeId = (val: any): number => {
            if (val === null || val === undefined) return -1;
            const n = Number(val);
            return isNaN(n) ? -1 : n;
        };

        const committedPieceIds = new Set(db.T_ENGAGEMENT.map(e => normalizeId(e.ID_PIECE)).filter(id => id !== -1));
        const commitmentTypes = ['صفقة', 'اتفاقية', 'ملحق', 'فاتورة'];

        // 1. Find Uncommitted Pieces
        const uncommittedPieces = db.T_PIECE.filter(p => {
            const pId = normalizeId(p.ID_PIECE);
            return commitmentTypes.includes(p.NAT_PIECE) && 
                   !committedPieceIds.has(pId);
        });

        // 2. Filter by Operation if selected
        let baseItems = uncommittedPieces;
        if (currentUser.ROLE !== 'admin' && currentUser.ALLOWED_OPERATIONS) {
            try {
                const allowedOps = JSON.parse(currentUser.ALLOWED_OPERATIONS) as number[];
                if (allowedOps.length > 0) {
                    baseItems = baseItems.filter(p => allowedOps.includes(normalizeId(p.ID_OPERATION)));
                }
            } catch (e) {
                console.error("Error parsing allowed operations", e);
            }
        }

        const piecesFilteredByOp = selectedOperationId 
            ? baseItems.filter(p => normalizeId(p.ID_OPERATION) === parseInt(selectedOperationId))
            : baseItems;

        // Group engagements by Operation and Rubric once for efficiency
        const rubOpAEConsumedMap = new Map<string, number>();
        db.T_ENGAGEMENT.forEach(eng => {
            const piece = db.T_PIECE.find(p => normalizeId(p.ID_PIECE) === normalizeId(eng.ID_PIECE));
            if (!piece || !piece.ID_RUBRIQUE) return;
            
            const key = `${normalizeId(eng.ID_OPERATION)}-${normalizeId(piece.ID_RUBRIQUE)}`;
            let amount = eng.MONTANT_ENG || 0;
            if (eng.NATURE_ENG === 'سحب' || eng.NATURE_ENG === 'إنخفاض التقييم') {
                amount = -amount;
            }
            rubOpAEConsumedMap.set(key, (rubOpAEConsumedMap.get(key) || 0) + amount);
        });

        // 3. Apply Insufficiency Logic: Amount > Remaining AE
        const insufficientPieces = piecesFilteredByOp.filter(piece => {
            // Must have a rubric to calculate specific AE balance
            if (!piece.ID_RUBRIQUE) return false;

            const opIdNormalized = normalizeId(piece.ID_OPERATION);
            const rubIdNormalized = normalizeId(piece.ID_RUBRIQUE);

            const rubOp = db.T_RUBRIQUE_OP.find(ro => 
                normalizeId(ro.ID_OPERATION) === opIdNormalized && 
                normalizeId(ro.ID_RUBRIQUE) === rubIdNormalized
            );

            // If no rubric allocated, balance is 0, so any amount is insufficient
            if (!rubOp) return true;

            const totalAllocatedAE = rubOp.MONTANT_FINALE ?? rubOp.MONTANT_INITIALE ?? 0;
            const consumedAE = rubOpAEConsumedMap.get(`${opIdNormalized}-${rubIdNormalized}`) || 0;
            const remainingAE = totalAllocatedAE - consumedAE;

            // Only show if Piece Amount > Remaining Balance
            return piece.MONTANT_PIECE > remainingAE;
        });

        // Map to display format
        return insufficientPieces.map((piece, index) => {
            const operation = db.T_OPERATION.find(op => normalizeId(op.ID_OPERATION) === normalizeId(piece.ID_OPERATION));
            const rubrique = db.T_RUBRIQUE.find(r => normalizeId(r.ID_RUBRIQUE) === normalizeId(piece.ID_RUBRIQUE));
            
            return {
                id: piece.ID_PIECE,
                serial: index + 1,
                operationName: operation ? operation.INT_OPERATION : '---',
                rubriqueName: rubrique ? rubrique.RUBRIQUE : '---',
                documentType: piece.NAT_PIECE,
                documentName: piece.PIECE,
                amount: piece.MONTANT_PIECE
            };
        });

    }, [db, loading, selectedOperationId]);

    const totalAmount = useMemo(() => insufficientData.reduce((sum, item) => sum + item.amount, 0), [insufficientData]);

    const handleExport = () => {
        if (insufficientData.length === 0) {
            alert('لا توجد بيانات للتصدير.');
            return;
        }

        const headers = ['الرقم التسلسلي', 'العملية', 'الهيكلة', 'الوثيقة', 'المبلغ'];
        const styles = `<style> table, th, td { border: 1px solid black; border-collapse: collapse; text-align: right; padding: 5px; font-family: Arial, sans-serif; vertical-align: middle; } th { background-color: #DDEBF7; font-weight: bold; text-align: center; } .total { background-color: #A9D08E; font-weight: bold; } td { mso-number-format:"\\@"; } .currency { mso-number-format:"\\#\\,##0\\.00"; } </style>`;
        
        let tableHtml = `${styles}<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;

        insufficientData.forEach(row => {
            tableHtml += `<tr>
                <td>${row.serial}</td>
                <td>${row.operationName}</td>
                <td>${row.rubriqueName}</td>
                <td>${row.documentName}</td>
                <td class="currency">${formatCurrencyForExcel(row.amount)}</td>
            </tr>`;
        });

        tableHtml += `</tbody><tfoot><tr class="total">
            <td colspan="4" style="text-align:center;">المجموع</td>
            <td class="currency">${formatCurrencyForExcel(totalAmount)}</td>
        </tr></tfoot></table>`;

        exportToFormattedExcel(tableHtml, 'ae_insufficiency.xls');
    };

    const operationOptions = useMemo(() => {
        let ops = db.T_OPERATION;
        if (currentUser.ROLE !== 'admin' && currentUser.ALLOWED_OPERATIONS) {
            try {
                const allowedOps = JSON.parse(currentUser.ALLOWED_OPERATIONS) as number[];
                if (allowedOps.length > 0) {
                    ops = ops.filter(op => allowedOps.includes(op.ID_OPERATION));
                }
            } catch (e) {
                console.error("Error parsing allowed operations", e);
            }
        }
        return [{ value: '', label: 'كل العمليات' }, ...ops.map(op => ({ value: String(op.ID_OPERATION), label: op.INT_OPERATION }))];
    }, [db.T_OPERATION, currentUser]);

    const [pageSize, setPageSize] = useState<number | 'all'>(50);
    const [currentPage, setCurrentPage] = useState<number>(1);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedOperationId]);

    const totalRows = insufficientData.length;
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalRows / (pageSize as number)) || 1;
    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const paginatedInsufficientData = useMemo(() => {
        if (pageSize === 'all') return insufficientData;
        const start = (safeCurrentPage - 1) * (pageSize as number);
        return insufficientData.slice(start, start + (pageSize as number));
    }, [insufficientData, safeCurrentPage, pageSize]);

    const renderPaginationControls = () => {
        if (insufficientData.length === 0) return null;
        const startIdx = pageSize === 'all' ? 1 : (safeCurrentPage - 1) * (pageSize as number) + 1;
        const endIdx = pageSize === 'all' ? totalRows : Math.min(safeCurrentPage * (pageSize as number), totalRows);

        return (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border-t border-blue-200 text-xs select-none">
                <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-medium text-[11px]">
                        عرض <span className="font-bold text-blue-700">{startIdx}</span> إلى <span className="font-bold text-blue-700">{endIdx}</span> من أصل <span className="font-bold text-gray-900">{totalRows}</span> وثيقة
                    </span>
                    <div className="flex items-center gap-1.5 border-r pr-3 border-gray-300">
                        <label className="text-gray-600 font-semibold text-[11px]">عدد الصفوف بالصفحة:</label>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                                setPageSize(val);
                                setCurrentPage(1);
                            }}
                            className="h-6 px-1.5 bg-white border border-gray-300 rounded text-[11px] font-bold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                            <option value="all">الكل ({totalRows})</option>
                        </select>
                    </div>
                </div>

                {pageSize !== 'all' && totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setCurrentPage(1); }}
                            disabled={safeCurrentPage === 1}
                            className="p-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white text-gray-700 transition cursor-pointer disabled:cursor-not-allowed"
                            title="الصفحة الأولى"
                        >
                            <ChevronsRight size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setCurrentPage(prev => Math.max(prev - 1, 1)); }}
                            disabled={safeCurrentPage === 1}
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
                                max={totalPages}
                                value={safeCurrentPage}
                                onChange={(e) => {
                                    const p = parseInt(e.target.value, 10);
                                    if (!isNaN(p) && p >= 1 && p <= totalPages) {
                                        setCurrentPage(p);
                                    }
                                }}
                                className="w-11 h-6 text-center border border-gray-300 rounded font-bold text-blue-700 text-[11px] outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-gray-600 text-[11px]">من {totalPages}</span>
                        </div>

                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setCurrentPage(prev => Math.min(prev + 1, totalPages)); }}
                            disabled={safeCurrentPage === totalPages}
                            className="p-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white text-gray-700 transition cursor-pointer disabled:cursor-not-allowed"
                            title="الصفحة التالية"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setCurrentPage(totalPages); }}
                            disabled={safeCurrentPage === totalPages}
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

    if (loading) return <div>جار التحميل...</div>;

    return (
        <PageWrapper title="جدول نقص رخصة الالتزام حسب الهيكلة (Insuffisance d'AE sur rubrique)" navigate={navigate} onGoBack={onGoBack} backPage='FINANCIAL_STATUS' currentUser={currentUser}>
            <div className="bg-red-100 p-4 rounded-lg shadow-md mb-6 border border-red-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">تصفية حسب العملية</label>
                        <CustomDropdown
                            options={operationOptions}
                            value={selectedOperationId}
                            onChange={setSelectedOperationId}
                            placeholder="اختر العملية"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('PRINT_AE_INSUFFICIENCY', selectedOperationId ? parseInt(selectedOperationId) : 0)} className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition-colors w-full">
                            <i className="bi bi-printer mr-2"></i> طباعة
                        </button>
                        <button onClick={handleExport} disabled={insufficientData.length === 0} className="bg-teal-500 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-600 transition-colors w-full disabled:bg-gray-400">
                            <i className="bi bi-file-earmark-excel mr-2"></i> تصدير
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 w-full">
                <div className="overflow-auto max-h-[60vh] custom-scrollbar">
                    <table className="w-full text-right min-w-[900px] border-collapse text-xs">
                        <thead className="bg-sky-100 text-gray-700 sticky top-0 z-20 shadow-sm border-b border-blue-200 font-bold">
                            <tr>
                                <th className="p-2 text-center text-[10px] uppercase font-bold text-gray-600 w-[10%]">#</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600 w-[30%]">العملية</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600 w-[20%]">الهيكلة</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600 w-[25%]">الوثيقة (التي تفوق الرصيد)</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600 w-[15%]">مبلغ الوثيقة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedInsufficientData.length > 0 ? paginatedInsufficientData.map((row) => (
                                <tr key={row.id} className="hover:bg-blue-50/60 transition-colors duration-150 text-xs">
                                    <td className="p-2 text-center font-mono text-gray-500 font-bold text-[10px]">{row.serial}</td>
                                    <td className="p-2 text-gray-700 font-medium text-[10px]">{row.operationName}</td>
                                    <td className="p-2 text-gray-700 font-medium text-[10px]">{row.rubriqueName}</td>
                                    <td className="p-2 font-bold text-gray-900 text-[10px]">{row.documentName}</td>
                                    <td className="p-2 font-bold text-rose-600 font-mono text-[11px]">{formatCurrency(row.amount)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-gray-500 font-medium">لا توجد وثائق تفوق رخصة الالتزام المتبقية.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-200 font-bold text-gray-900 text-xs sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] border-t border-gray-300">
                            <tr>
                                <td colSpan={4} className="p-2 text-center font-bold">المجموع</td>
                                <td className="p-2 font-mono text-rose-700 font-bold">{formatCurrency(totalAmount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                {renderPaginationControls()}
            </div>
        </PageWrapper>
    );
};

export default AeInsufficiencyPage;
