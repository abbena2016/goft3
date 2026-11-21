
import React, { useState, useMemo } from 'react';
import { Page, User } from '../types';
import { useData } from '../context/DataContext';
import PageWrapper from '../components/PageWrapper';
import { exportToFormattedExcel } from '../utils/exportToCsv';
import { formatCurrency } from '../utils/currencyUtils';
import CustomDropdown from '../components/CustomDropdown';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaymentClaimsPageProps {
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

const PaymentClaimsPage: React.FC<PaymentClaimsPageProps> = ({ navigate, onGoBack, currentUser }) => {
    const { db, loading } = useData();
    const [selectedOperationId, setSelectedOperationId] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

    // Filter data: Pieces that are payable BUT NOT in T_PAIEMENT
    // AND where Piece Amount > Remaining CP for that operation in the selected year
    const claimsData = useMemo(() => {
        if (loading) return [];

        const normalizeId = (val: any): number => {
            if (val === null || val === undefined) return -1;
            const n = Number(val);
            return isNaN(n) ? -1 : n;
        };

        const paidPieceIds = new Set(db.T_PAIEMENT.map(p => normalizeId(p.ID_PIECE)).filter(id => id !== -1));
        const payableTypes = ['فاتورة', 'وضعية الأشغال', 'وضعية التسبيق الجزافي', 'وضعية التسبيق على التموين'];

        // 1. Find Unpaid Pieces
        const unpaidPieces = db.T_PIECE.filter(p => {
            const pId = normalizeId(p.ID_PIECE);
            return payableTypes.includes(p.NAT_PIECE) && 
                   !paidPieceIds.has(pId);
        });

        // 2. Filter by Operation if selected
        let baseItems = unpaidPieces;
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

        // Group payments by operation and year once
        const opYearCPConsumedMap = new Map<string, number>();
        db.T_PAIEMENT.forEach(p => {
            const key = `${normalizeId(p.ID_OPERATION)}-${p.ANNEE}`;
            opYearCPConsumedMap.set(key, (opYearCPConsumedMap.get(key) || 0) + (p.MONTANT_PAI || 0));
        });

        // 3. Apply Insufficiency Logic: Amount > Remaining CP (for selected year)
        const insufficientCpPieces = piecesFilteredByOp.filter(piece => {
            const opIdNormalized = normalizeId(piece.ID_OPERATION);

            // Find CP for this operation and the selected year
            const cp = db.T_CP.find(c => 
                normalizeId(c.ID_OPERATION) === opIdNormalized && 
                c.ANNEE === selectedYear
            );

            // If no CP allocated for this year, then balance is 0, so any amount is insufficient
            if (!cp) return piece.MONTANT_PIECE > 0;

            const totalCP = cp.MONTANT_FINALE_CP || 0;
            const consumedCP = opYearCPConsumedMap.get(`${opIdNormalized}-${selectedYear}`) || 0;
            const remainingCP = totalCP - consumedCP;

            // Check if document amount exceeds remaining payment credit
            return piece.MONTANT_PIECE > remainingCP;
        });

        // Map to display format
        return insufficientCpPieces.map((piece, index) => {
            const operation = db.T_OPERATION.find(op => normalizeId(op.ID_OPERATION) === normalizeId(piece.ID_OPERATION));
            const beneficiary = db.T_BENEFICIAIRE.find(b => normalizeId(b.ID_BENEFICIAIRE) === normalizeId(piece.ID_BENEFICIAIRE));
            
            return {
                id: piece.ID_PIECE,
                serial: index + 1,
                operationName: operation ? operation.INT_OPERATION : '---',
                documentType: piece.NAT_PIECE,
                documentName: piece.PIECE,
                beneficiaryName: beneficiary ? beneficiary.BENEFICIAIRE : '---',
                amount: piece.MONTANT_PIECE
            };
        });

    }, [db, loading, selectedOperationId, selectedYear]);

    const totalAmount = useMemo(() => claimsData.reduce((sum, item) => sum + item.amount, 0), [claimsData]);

    const handleExport = () => {
        if (claimsData.length === 0) {
            alert('لا توجد بيانات للتصدير.');
            return;
        }

        const headers = ['الرقم التسلسلي', 'العملية', 'الوثيقة', 'المستفيد', 'المبلغ'];
        const styles = `<style> table, th, td { border: 1px solid black; border-collapse: collapse; text-align: right; padding: 5px; font-family: Arial, sans-serif; vertical-align: middle; } th { background-color: #DDEBF7; font-weight: bold; text-align: center; } .total { background-color: #A9D08E; font-weight: bold; } td { mso-number-format:"\\@"; } .currency { mso-number-format:"\\#\\,##0\\.00"; } </style>`;
        
        let tableHtml = `${styles}<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;

        claimsData.forEach(row => {
            tableHtml += `<tr>
                <td>${row.serial}</td>
                <td>${row.operationName}</td>
                <td>${row.documentName} (${row.documentType})</td>
                <td>${row.beneficiaryName}</td>
                <td class="currency">${formatCurrencyForExcel(row.amount)}</td>
            </tr>`;
        });

        tableHtml += `</tbody><tfoot><tr class="total">
            <td colspan="4" style="text-align:center;">المجموع</td>
            <td class="currency">${formatCurrencyForExcel(totalAmount)}</td>
        </tr></tfoot></table>`;

        exportToFormattedExcel(tableHtml, 'payment_claims_insufficiency.xls');
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

    // Available years from CP table
    const yearOptions = useMemo(() => {
        const years = new Set(db.T_CP.map(cp => cp.ANNEE));
        // Ensure current year is in list
        years.add(new Date().getFullYear().toString());
        return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)).map(y => ({ value: y, label: y }));
    }, [db.T_CP]);

    const [pageSize, setPageSize] = useState<number | 'all'>(50);
    const [currentPage, setCurrentPage] = useState<number>(1);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedOperationId, selectedYear]);

    const totalRows = claimsData.length;
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalRows / (pageSize as number)) || 1;
    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const paginatedClaimsData = useMemo(() => {
        if (pageSize === 'all') return claimsData;
        const start = (safeCurrentPage - 1) * (pageSize as number);
        return claimsData.slice(start, start + (pageSize as number));
    }, [claimsData, safeCurrentPage, pageSize]);

    const renderPaginationControls = () => {
        if (claimsData.length === 0) return null;
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
        <PageWrapper title="جدول مستحقات الدفع التي تفوق باقي الاعتماد (Insuffisance CP)" navigate={navigate} onGoBack={onGoBack} backPage='FINANCIAL_STATUS' currentUser={currentUser}>
            <div className="bg-blue-200 p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">السنة المالية</label>
                        <CustomDropdown
                            options={yearOptions}
                            value={selectedYear}
                            onChange={setSelectedYear}
                            placeholder="اختر السنة"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">تصفية حسب العملية</label>
                        <CustomDropdown
                            options={operationOptions}
                            value={selectedOperationId}
                            onChange={setSelectedOperationId}
                            placeholder="اختر العملية"
                        />
                    </div>
                    <div className="flex gap-2 md:col-span-1">
                        <button onClick={() => navigate('PRINT_PAYMENT_CLAIMS', selectedOperationId ? parseInt(selectedOperationId) : 0)} className="bg-blue-500 text-white text-[10px] px-1 py-1 rounded-[20px] shadow hover:bg-blue-600 transition-colors w-full h-8">
                            <i className="bi bi-printer mr-2 text-[12px]"></i> طباعة
                        </button>
                        <button onClick={handleExport} disabled={claimsData.length === 0} className="bg-teal-500 text-white text-[10px] px-1 py-1 rounded-[20px] shadow hover:bg-teal-600 transition-colors w-full disabled:bg-gray-400 h-8">
                            <i className="bi bi-file-earmark-excel mr-2 text-[12px]"></i> تصدير
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 w-full">
                <div className="overflow-auto max-h-[60vh] custom-scrollbar">
                    <table className="w-full text-right min-w-[900px] border-collapse text-xs">
                        <thead className="bg-sky-100 text-gray-700 sticky top-0 z-20 shadow-sm border-b border-blue-200 font-bold">
                            <tr>
                                <th className="p-2 text-center text-[10px] uppercase font-bold text-gray-600 w-[5%]">#</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600 w-[25%]">العملية</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600 w-[40%]">الوثيقة (التي تفوق الاعتماد المتبقي)</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600 w-[15%]">المستفيد</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600 w-[15%]">مبلغ الوثيقة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedClaimsData.length > 0 ? paginatedClaimsData.map((row) => (
                                <tr key={row.id} className="hover:bg-blue-50/60 transition-colors duration-150 text-xs">
                                    <td className="p-2 text-center font-mono text-gray-500 font-bold text-[10px]">{row.serial}</td>
                                    <td className="p-2 text-gray-700 font-medium text-[10px]">{row.operationName}</td>
                                    <td className="p-2 font-bold text-gray-900 text-[10px]">{row.documentName}</td>
                                    <td className="p-2 text-gray-700 text-[10px]">{row.beneficiaryName}</td>
                                    <td className="p-2 font-bold text-rose-600 font-mono text-[11px]">{formatCurrency(row.amount)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-gray-500 font-medium">لا توجد وثائق تفوق اعتمادات الدفع المتبقية لسنة {selectedYear}.</td>
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

export default PaymentClaimsPage;
