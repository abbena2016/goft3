
import React, { useState, useMemo, useEffect } from 'react';
import { Page, User } from '../types';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { normalizeDate } from '../utils/dateUtils';
import PageWrapper from '../components/PageWrapper';
import { exportToFormattedExcel } from '../utils/exportToCsv';
import { formatCurrency } from '../utils/currencyUtils';
import CustomDropdown from '../components/CustomDropdown';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface FinancialStatusPageProps {
    navigate: (page: Page, operationId?: number, tab?: string) => void;
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

const FinancialStatusPage: React.FC<FinancialStatusPageProps> = ({ navigate, onGoBack, currentUser }) => {
    const { db, loading } = useData();
    const { t } = useLanguage();
    const [selectedYear, setSelectedYear] = useState(sessionStorage.getItem('goft3_selectedYear') || new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState(sessionStorage.getItem('goft3_fs_month') || (new Date().getMonth() + 1).toString());
    const [selectedAction, setSelectedAction] = useState(sessionStorage.getItem('goft3_fs_action') || '');

    const years = useMemo(() => [...new Set(db.T_CP.map(cp => cp.ANNEE))].sort((a, b) => parseInt(b) - parseInt(a)), [db.T_CP]);

    useEffect(() => {
        sessionStorage.setItem('goft3_selectedYear', selectedYear);
        sessionStorage.setItem('goft3_fs_month', selectedMonth);
        sessionStorage.setItem('goft3_fs_action', selectedAction);
        // Sync activity for Operations Table print page
        sessionStorage.setItem('goft3_selectedActivity', selectedAction);

        // Save filters for print page
        sessionStorage.setItem('goft3_fs_filters', JSON.stringify({
            year: selectedYear,
            month: selectedMonth,
            action: selectedAction
        }));

    }, [selectedYear, selectedMonth, selectedAction]);

    const activities = useMemo(() => {
        const actionCodesInUse = [...new Set(db.T_OPERATION.map(op => op.N_OPERATION.split('.')[5]).filter(Boolean))];
        const actionCodeToNameMap = new Map(db.T_DIRECTION.map(d => [d.ACTION, d.INT_ACTION]));
        const inUseActivities = actionCodesInUse.map((code: string) => {
            const name = actionCodeToNameMap.get(code) || `(${code})`;
            return { value: code, label: `${code} - ${name}` };
        });
        inUseActivities.sort((a, b) => a.value.localeCompare(b.value));
        return inUseActivities;
    }, [db.T_OPERATION, db.T_DIRECTION]);

    const { data: financialStatusData, totals: financialStatusTotals } = useMemo(() => {
        if (loading) return { data: [], totals: null };

        const openOperations = db.T_OPERATION.filter(op => {
            if (op.status !== 'جارية') return false;

            // Authorization: Filter by specifically assigned operations
            if (currentUser.ROLE !== 'admin' && currentUser.ALLOWED_OPERATIONS) {
                try {
                    const allowedOps = JSON.parse(currentUser.ALLOWED_OPERATIONS) as number[];
                    if (allowedOps.length > 0 && !allowedOps.includes(op.ID_OPERATION)) {
                        return false;
                    }
                } catch (e) {
                    console.error("Error parsing allowed operations", e);
                }
            }

            if (selectedAction) {
                const opActionCode = op.N_OPERATION.split('.')[5];
                return opActionCode === selectedAction;
            }
            return true;
        });

        const data = openOperations.map(op => {
            const cpFinale = db.T_CP
                .filter(cp => cp.ID_OPERATION === op.ID_OPERATION && cp.ANNEE === selectedYear)
                .reduce((sum, cp) => sum + cp.MONTANT_FINALE_CP, 0);

            const paiementsCurrentYearList = db.T_PAIEMENT
                .filter(p => p.ID_OPERATION === op.ID_OPERATION && p.ANNEE === selectedYear);

            const selectedMonthInt = parseInt(selectedMonth, 10);

            let paiementsCurrentMonth = 0;
            let paiementsFuture = 0;
            let totalPaiementsYear = 0;

            paiementsCurrentYearList.forEach(p => {
                totalPaiementsYear += p.MONTANT_PAI;

                const normDate = normalizeDate(p.DATE_PAI);
                const dateParts = normDate.split('/');

                let paymentMonth = 0;
                if (dateParts.length === 3) {
                    paymentMonth = parseInt(dateParts[1], 10);
                }

                if (paymentMonth === selectedMonthInt) {
                    paiementsCurrentMonth += p.MONTANT_PAI;
                } else if (paymentMonth > selectedMonthInt) {
                    paiementsFuture += p.MONTANT_PAI;
                }
            });

            const totalPaiementsForPeriod = totalPaiementsYear - paiementsFuture;
            const paiementsPrevious = totalPaiementsForPeriod - paiementsCurrentMonth;

            const remainingBalance = cpFinale - totalPaiementsForPeriod;

            return {
                ...op,
                cpFinale,
                paiementsPrevious,
                paiementsCurrentMonth,
                totalPaiementsCurrentYear: totalPaiementsForPeriod,
                remainingBalance
            };
        }).filter(item => item.cpFinale > 0 || item.totalPaiementsCurrentYear > 0);

        const totals = data.reduce((acc, row) => {
            acc.cpFinale += row.cpFinale;
            acc.paiementsPrevious += row.paiementsPrevious;
            acc.paiementsCurrentMonth += row.paiementsCurrentMonth;
            acc.totalPaiementsCurrentYear += row.totalPaiementsCurrentYear;
            acc.remainingBalance += row.remainingBalance;
            return acc;
        }, { cpFinale: 0, paiementsPrevious: 0, paiementsCurrentMonth: 0, totalPaiementsCurrentYear: 0, remainingBalance: 0 });

        return { data, totals };
    }, [db, loading, selectedYear, selectedMonth, selectedAction]);

    const handleExport = () => {
        if (financialStatusData.length === 0) {
            alert('لا توجد بيانات للتصدير.');
            return;
        }

        const headers = [
            t('col.operation_info'), t('col.cp_year', { year: selectedYear }),
            t('col.previous_payment'), t('col.monthly_payment'),
            t('col.total_payments'), t('col.balance')
        ];

        const styles = `<style> table, th, td { border: 1px solid black; border-collapse: collapse; text-align: right; padding: 5px; font-family: Arial, sans-serif; vertical-align: middle; } th { background-color: #DDEBF7; font-weight: bold; text-align: center; } .total { background-color: #A9D08E; font-weight: bold; } td { mso-number-format:"\\@"; } .currency { mso-number-format:"\\#\\,##0\\.00"; } </style>`;

        let tableHtml = `${styles}<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;

        financialStatusData.forEach(row => {
            tableHtml += `<tr>
                <td>${row.N_OPERATION}<br/>${row.INT_OPERATION}</td>
                <td class="currency">${formatCurrencyForExcel(row.cpFinale)}</td>
                <td class="currency">${formatCurrencyForExcel(row.paiementsPrevious)}</td>
                <td class="currency">${formatCurrencyForExcel(row.paiementsCurrentMonth)}</td>
                <td class="currency">${formatCurrencyForExcel(row.totalPaiementsCurrentYear)}</td>
                <td class="currency">${formatCurrencyForExcel(row.remainingBalance)}</td>
            </tr>`;
        });

        if (financialStatusTotals) {
            tableHtml += `</tbody><tfoot class="total"><tr>
                <td>${t('lbl.total')}</td>
                <td class="currency">${formatCurrencyForExcel(financialStatusTotals.cpFinale)}</td>
                <td class="currency">${formatCurrencyForExcel(financialStatusTotals.paiementsPrevious)}</td>
                <td class="currency">${formatCurrencyForExcel(financialStatusTotals.paiementsCurrentMonth)}</td>
                <td class="currency">${formatCurrencyForExcel(financialStatusTotals.totalPaiementsCurrentYear)}</td>
                <td class="currency">${formatCurrencyForExcel(financialStatusTotals.remainingBalance)}</td>
            </tr></tfoot></table>`;
        } else {
            tableHtml += `</tbody></table>`;
        }

        exportToFormattedExcel(tableHtml, `financial_status_${selectedYear}_${selectedMonth}.xls`);
    };

    const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: t(`month.${i + 1}`) })), [t]);

    const [pageSize, setPageSize] = useState<number | 'all'>(50);
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedYear, selectedMonth, selectedAction]);

    const totalRows = financialStatusData.length;
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalRows / (pageSize as number)) || 1;
    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const paginatedFinancialData = useMemo(() => {
        if (pageSize === 'all') return financialStatusData;
        const start = (safeCurrentPage - 1) * (pageSize as number);
        return financialStatusData.slice(start, start + (pageSize as number));
    }, [financialStatusData, safeCurrentPage, pageSize]);

    if (loading) return <div className="p-4 text-center">{t('loading')}</div>;

    const renderPaginationControls = () => {
        if (financialStatusData.length === 0) return null;
        const startIdx = pageSize === 'all' ? 1 : (safeCurrentPage - 1) * (pageSize as number) + 1;
        const endIdx = pageSize === 'all' ? totalRows : Math.min(safeCurrentPage * (pageSize as number), totalRows);

        return (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border-t border-blue-200 text-xs select-none">
                <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-medium text-[11px]">
                        عرض <span className="font-bold text-blue-700">{startIdx}</span> إلى <span className="font-bold text-blue-700">{endIdx}</span> من أصل <span className="font-bold text-gray-900">{totalRows}</span> عملية
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

    return (
        <PageWrapper
            title={t('print.title.financial_status', { month: t(`month.${parseInt(selectedMonth)}`), year: selectedYear })}
            navigate={navigate}
            onGoBack={onGoBack}
            backPage='HOME'
            currentUser={currentUser}
            actions={
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => navigate('FINANCIAL_STATUS_BY_STRUCTURE')} className="bg-indigo-500 text-white px-2 py-0.5 rounded-[20px] hover:bg-indigo-600 transition-colors text-xs">
                        <i className="bi bi-diagram-3 mr-1"></i> {t('btn.structure_status')}
                    </button>
                    <button onClick={() => navigate('PROJECT_TRACKING')} className="bg-purple-500 text-white px-2 py-0.5 rounded-[20px] hover:bg-purple-600 transition-colors text-xs">
                        <i className="bi bi-list-check mr-1"></i> {t('btn.project_tracking')}
                    </button>
                    <button onClick={() => navigate('PAYMENT_CLAIMS')} className="bg-orange-500 text-white px-2 py-0.5 rounded-[20px] hover:bg-orange-600 transition-colors text-xs">
                        <i className="bi bi-cash-stack mr-1"></i> {t('btn.payment_claims')}
                    </button>
                    <button onClick={() => navigate('AE_INSUFFICIENCY')} className="bg-red-500 text-white px-2 py-0.5 rounded-[20px] hover:bg-red-600 transition-colors text-xs">
                        <i className="bi bi-exclamation-triangle mr-1"></i> {t('btn.ae_insufficiency')}
                    </button>
                    <button onClick={() => navigate('VISAED_ENGAGEMENTS')} className="bg-teal-500 text-white px-2 py-0.5 rounded-[20px] hover:bg-teal-600 transition-colors text-xs">
                        <i className="bi bi-table mr-1"></i> جدول الإلتزامات المؤشرة
                    </button>
                    <button onClick={() => navigate('MONTHLY_COMMITMENTS_REPORT')} className="bg-blue-600 text-white px-2 py-0.5 rounded-[20px] hover:bg-blue-700 transition-colors text-xs">
                        <i className="bi bi-calendar-check mr-1"></i> الالتزامات حسب الشهر
                    </button>
                    <button onClick={() => navigate('MONTHLY_PAYMENTS_REPORT')} className="bg-emerald-600 text-white px-2 py-0.5 rounded-[20px] hover:bg-emerald-700 transition-colors text-xs">
                        <i className="bi bi-calendar-event mr-1"></i> الدفوعات حسب الشهر
                    </button>
                    <button onClick={() => navigate('LOTS_REPORT')} className="bg-cyan-600 text-white px-2 py-0.5 rounded-[20px] hover:bg-cyan-700 transition-colors text-xs">
                        <i className="bi bi-grid-3x3 mr-1"></i> جدول حصص العمليات
                    </button>
                    <button onClick={() => navigate('APPENDIX_01')} className="bg-blue-700 text-white px-2 py-0.5 rounded-[20px] hover:bg-blue-800 transition-colors text-xs">
                        <i className="bi bi-file-earmark-spreadsheet mr-1"></i> ملحق رقم 01
                    </button>
                </div>
            }
        >
            <div className="bg-blue-200 p-3 rounded-lg shadow-md mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('filter.year')}</label>
                        <CustomDropdown
                            options={years.map(y => ({ value: y, label: y }))}
                            value={selectedYear}
                            onChange={setSelectedYear}
                            placeholder={t('filter.select_year')}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('filter.month')}</label>
                        <CustomDropdown
                            options={monthOptions}
                            value={selectedMonth}
                            onChange={setSelectedMonth}
                            placeholder={t('filter.month')}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('filter.activity')}</label>
                        <CustomDropdown
                            options={[{ value: '', label: t('filter.all_activities') }, ...activities]}
                            value={selectedAction}
                            onChange={setSelectedAction}
                            placeholder={t('filter.select_activity')}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('PRINT_FINANCIAL_STATUS')} className="bg-blue-500 text-white px-2 py-0.5 rounded-[20px] shadow hover:bg-blue-600 transition-colors w-full h-8 text-xs">
                            <i className="bi bi-printer mr-2"></i> {t('btn.print')}
                        </button>
                        <button onClick={handleExport} disabled={financialStatusData.length === 0} className="bg-teal-500 text-white px-2 py-0.5 rounded-[20px] shadow hover:bg-teal-600 transition-colors w-full disabled:bg-gray-400 h-8 text-xs">
                            <i className="bi bi-file-earmark-excel mr-2"></i> {t('btn.export')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 w-full">
                <div className="overflow-auto max-h-[60vh] custom-scrollbar">
                    <table className="w-full text-right min-w-[1000px] relative border-collapse text-xs">
                        <thead className="bg-sky-100 text-gray-700 sticky top-0 z-20 shadow-sm border-b border-blue-200 font-bold">
                            <tr>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600 w-1/3">{t('col.operation_info')}</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">{t('col.cp_year', { year: selectedYear })}</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">{t('col.previous_payment')}</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">{t('col.monthly_payment')}</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">{t('col.total_payments')}</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">{t('col.balance')}</th>
                                <th className="p-2 text-center text-[10px] uppercase font-bold text-gray-600">{t('col.details')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedFinancialData.map(row => (
                                <tr key={row.ID_OPERATION} className="hover:bg-blue-50/60 transition-colors text-xs">
                                    <td className="p-2 font-bold text-gray-900 text-[11px]">{row.N_OPERATION}<br /><span className="text-[10px] font-medium text-gray-500">{row.INT_OPERATION}</span></td>
                                    <td className="p-2 text-gray-700 font-mono text-[10px]">{formatCurrency(row.cpFinale)}</td>
                                    <td className="p-2 text-gray-700 font-mono text-[10px]">{formatCurrency(row.paiementsPrevious)}</td>
                                    <td className="p-2 text-gray-900 font-bold font-mono text-[10px]">{formatCurrency(row.paiementsCurrentMonth)}</td>
                                    <td className="p-2 text-gray-700 font-mono text-[10px]">{formatCurrency(row.totalPaiementsCurrentYear)}</td>
                                    <td className={`p-2 font-bold font-mono text-[10px] ${row.remainingBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(row.remainingBalance)}</td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => navigate('OPERATION_DETAILS', row.ID_OPERATION, 'PAIEMENTS')} className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors" title="التفاصيل">
                                            <i className="bi bi-eye-fill text-sm"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {financialStatusTotals && (
                            <tfoot className="bg-slate-200 font-bold text-gray-900 text-xs sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] border-t border-gray-300">
                                <tr>
                                    <td className="p-2 text-center font-bold">{t('lbl.total')}</td>
                                    <td className="p-2 font-mono text-[10px] font-bold">{formatCurrency(financialStatusTotals.cpFinale)}</td>
                                    <td className="p-2 font-mono text-[10px] font-bold">{formatCurrency(financialStatusTotals.paiementsPrevious)}</td>
                                    <td className="p-2 font-mono text-[10px] font-bold">{formatCurrency(financialStatusTotals.paiementsCurrentMonth)}</td>
                                    <td className="p-2 font-mono text-[10px] font-bold">{formatCurrency(financialStatusTotals.totalPaiementsCurrentYear)}</td>
                                    <td className="p-2 font-mono text-[10px] font-bold">{formatCurrency(financialStatusTotals.remainingBalance)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
                {renderPaginationControls()}
            </div>
        </PageWrapper>
    );
};

export default FinancialStatusPage;
