
import React, { useState, useMemo } from 'react';
import { Page, User } from '../types';
import { useData } from '../context/DataContext';
import PageWrapper from '../components/PageWrapper';
import { formatCurrency } from '../utils/currencyUtils';
import CustomDropdown from '../components/CustomDropdown';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import ExcelJS from 'exceljs';

interface FinancialStatusByStructurePageProps {
    navigate: (page: Page, id?: number, extra?: string) => void;
    onGoBack?: () => void;
    initialOperationId?: number | null;
    initialRubricId?: string;
    currentUser: User;
}

const FinancialStatusByStructurePage: React.FC<FinancialStatusByStructurePageProps> = ({ navigate, onGoBack, initialOperationId, initialRubricId, currentUser }) => {
    const { db, loading } = useData();
    const [selectedOperationId, setSelectedOperationId] = useState<string>(initialOperationId ? String(initialOperationId) : '');
    const [highlightRubricId, setHighlightRubricId] = useState<number | null>(initialRubricId ? parseInt(initialRubricId, 10) : null);

    // Effect to select rubric and operation if they are passed
    React.useEffect(() => {
        if (initialOperationId) {
            setSelectedOperationId(String(initialOperationId));
        }
        if (initialRubricId) {
            setHighlightRubricId(parseInt(initialRubricId, 10));
            // Optional: scroll to it
            setTimeout(() => {
                const element = document.getElementById(`rubric-row-${initialRubricId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
        } else {
            setHighlightRubricId(null);
        }
    }, [initialOperationId, initialRubricId]);

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
        return [{ value: '', label: 'اختر العملية' }, ...ops.map(op => ({ value: String(op.ID_OPERATION), label: op.INT_OPERATION }))];
    }, [db.T_OPERATION, currentUser]);

    const tableData = useMemo(() => {
        if (!selectedOperationId || loading) return { rows: [], totals: { initialAuth: 0, finalAuth: 0, commitment: 0, remainingAuth: 0, payment: 0, executionBalance: 0 } };

        const opId = parseInt(selectedOperationId, 10);
        const operationRubriques = db.T_RUBRIQUE_OP.filter(ro => ro.ID_OPERATION === opId);
        
        const rows = operationRubriques.map(ro => {
            const rubrique = db.T_RUBRIQUE.find(r => r.ID_RUBRIQUE === ro.ID_RUBRIQUE);
            
            // Find pieces related to this operation AND this rubrique
            const pieceIdsForRubrique = new Set(db.T_PIECE
                .filter(p => p.ID_OPERATION === opId && p.ID_RUBRIQUE === ro.ID_RUBRIQUE)
                .map(p => p.ID_PIECE)
            );

            // Filter engagements for this operation
            const operationEngagements = db.T_ENGAGEMENT.filter(e => e.ID_OPERATION === opId);
            
            let commitmentAmount = 0;

            operationEngagements.forEach(e => {
                // Check if engagement is linked to a piece in this rubrique
                if (pieceIdsForRubrique.has(e.ID_PIECE)) {
                    if (e.NATURE_ENG === 'التزام' || e.NATURE_ENG === 'ملحق' || e.NATURE_ENG === 'سحب') {
                        commitmentAmount += e.MONTANT_ENG;
                    } 
                }
            });

            // Calculate Payment for this rubrique
            const operationPayments = db.T_PAIEMENT.filter(p => p.ID_OPERATION === opId);
            let paymentAmount = 0;
            operationPayments.forEach(p => {
                if (pieceIdsForRubrique.has(p.ID_PIECE)) {
                    paymentAmount += p.MONTANT_PAI;
                }
            });

            const finalAuth = ro.MONTANT_FINALE ?? ro.MONTANT_INITIALE;
            const remainingAuth = finalAuth - commitmentAmount;
            const executionBalance = finalAuth - paymentAmount;

            return {
                id: ro.ID_RUBRIQUE,
                structure: rubrique?.RUBRIQUE || 'غير معروف',
                initialAuth: ro.MONTANT_INITIALE,
                finalAuth: finalAuth,
                commitment: commitmentAmount,
                remainingAuth: remainingAuth,
                payment: paymentAmount,
                executionBalance: executionBalance,
            };
        });

        const totals = rows.reduce((acc, row) => {
            acc.initialAuth += row.initialAuth;
            acc.finalAuth += row.finalAuth;
            acc.commitment += row.commitment;
            acc.remainingAuth += row.remainingAuth;
            acc.payment += row.payment;
            acc.executionBalance += row.executionBalance;
            return acc;
        }, { initialAuth: 0, finalAuth: 0, commitment: 0, remainingAuth: 0, payment: 0, executionBalance: 0 });

        return { rows, totals };

    }, [db, loading, selectedOperationId]);

    const handleExport = async () => {
        if (tableData.rows.length === 0) {
            alert('لا توجد بيانات للتصدير.');
            return;
        }

        const opId = parseInt(selectedOperationId, 10);
        const operation = db.T_OPERATION.find(op => op.ID_OPERATION === opId);
        const direction = db.T_DIRECTION[0] || {
            INT_PORTEFEUILLE: 'وزارة الأشغال العمومية و المنشآت القاعدية',
            DIRECTION: 'مديرية الأشغال العمومية لولاية غليزان'
        };

        const today = new Date();
        const formattedDateArabic = `${String(today.getDate()).padStart(2, '0')} / ${String(today.getMonth() + 1).padStart(2, '0')} / ${today.getFullYear()}`;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('الوضعية المالية حسب الهيكلة');
        
        // Enable right to left direction for proper Arabic rendering
        worksheet.views = [{ rightToLeft: true }];

        // Set column widths to accommodate data nicely and prevent overflow
        worksheet.getColumn('A').width = 22; // باقي رخصة الالتزام
        worksheet.getColumn('B').width = 22; // الالتزام
        worksheet.getColumn('C').width = 22; // رخصة الالتزام النهائية
        worksheet.getColumn('D').width = 22; // رخصة الالتزام الأولية
        worksheet.getColumn('E').width = 35; // هيكلة الكلفة

        // Borders helper
        const thinBorder: ExcelJS.Border = { style: 'thin', color: { argb: 'FF000000' } };
        const cellBorders: ExcelJS.Borders = {
            top: thinBorder,
            left: thinBorder,
            bottom: thinBorder,
            right: thinBorder,
            diagonal: { style: 'thin' }
        };

        // 1. Title block matching the image
        // Row 2: Republic Name (Centered)
        worksheet.mergeCells('A2:E2');
        const republicCell = worksheet.getCell('A2');
        republicCell.value = 'الجمهورية الجزائرية الديمقراطية الشعبية';
        republicCell.font = { name: 'Arial', bold: true, size: 14 };
        republicCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(2).height = 25;

        // Row 4: Ministry Name (Right Aligned in RTL, so visually on the right)
        worksheet.mergeCells('A4:E4');
        const ministryCell = worksheet.getCell('A4');
        ministryCell.value = direction.INT_PORTEFEUILLE;
        ministryCell.font = { name: 'Arial', bold: true, size: 11 };
        ministryCell.alignment = { horizontal: 'right', vertical: 'middle' };
        worksheet.getRow(4).height = 20;

        // Row 5: Direction Name (Right Aligned in RTL)
        worksheet.mergeCells('A5:E5');
        const directionCell = worksheet.getCell('A5');
        directionCell.value = direction.DIRECTION;
        directionCell.font = { name: 'Arial', bold: true, size: 11 };
        directionCell.alignment = { horizontal: 'right', vertical: 'middle' };
        worksheet.getRow(5).height = 20;

        // Row 7: Stopped Date (Centered, bold, underlined)
        worksheet.mergeCells('A7:E7');
        const dateCell = worksheet.getCell('A7');
        dateCell.value = `الوضعية المالية الموقوفة في: ${formattedDateArabic}`;
        dateCell.font = { name: 'Arial', bold: true, size: 12, underline: true };
        dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(7).height = 25;

        // Row 9: Operation Number (Centered, bold)
        worksheet.mergeCells('A9:E9');
        const opNumCell = worksheet.getCell('A9');
        opNumCell.value = `العملية رقم: ${operation?.N_OPERATION || ''}`;
        opNumCell.font = { name: 'Arial', bold: true, size: 11 };
        opNumCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(9).height = 20;

        // Row 11: Operation Title (Centered, bold)
        worksheet.mergeCells('A11:E11');
        const opTitleCell = worksheet.getCell('A11');
        opTitleCell.value = `عنوان العملية: ${operation?.INT_OPERATION || ''}`;
        opTitleCell.font = { name: 'Arial', bold: true, size: 11 };
        opTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(11).height = 20;

        // Row 13: Table Headers
        const headerRow = worksheet.getRow(13);
        headerRow.height = 30;

        const headers = [
            { col: 'A', value: 'باقي رخصة الالتزام' },
            { col: 'B', value: 'الالتزام' },
            { col: 'C', value: 'رخصة الالتزام النهائية' },
            { col: 'D', value: 'رخصة الالتزام الأولية' },
            { col: 'E', value: 'هيكلة الكلفة' }
        ];

        headers.forEach(h => {
            const cell = headerRow.getCell(h.col);
            cell.value = h.value;
            cell.font = { name: 'Arial', bold: true, size: 11 };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF2F2F2' } // Elegant light gray background matching image headers
            };
            cell.border = cellBorders;
        });

        // Row 14 onwards: Table Data
        let currentRowIndex = 14;

        tableData.rows.forEach(row => {
            const dataRow = worksheet.getRow(currentRowIndex);
            dataRow.height = 25;

            // Col A: remainingAuth
            const cellA = dataRow.getCell('A');
            cellA.value = row.remainingAuth;
            cellA.numFmt = '#,##0.00';
            cellA.alignment = { horizontal: 'center', vertical: 'middle' };
            cellA.font = { name: 'Arial', size: 11 };
            cellA.border = cellBorders;

            // Col B: commitment
            const cellB = dataRow.getCell('B');
            cellB.value = row.commitment;
            cellB.numFmt = '#,##0.00';
            cellB.alignment = { horizontal: 'center', vertical: 'middle' };
            cellB.font = { name: 'Arial', size: 11 };
            cellB.border = cellBorders;

            // Col C: finalAuth
            const cellC = dataRow.getCell('C');
            cellC.value = row.finalAuth;
            cellC.numFmt = '#,##0.00';
            cellC.alignment = { horizontal: 'center', vertical: 'middle' };
            cellC.font = { name: 'Arial', size: 11 };
            cellC.border = cellBorders;

            // Col D: initialAuth
            const cellD = dataRow.getCell('D');
            cellD.value = row.initialAuth;
            cellD.numFmt = '#,##0.00';
            cellD.alignment = { horizontal: 'center', vertical: 'middle' };
            cellD.font = { name: 'Arial', size: 11 };
            cellD.border = cellBorders;

            // Col E: structure
            const cellE = dataRow.getCell('E');
            cellE.value = row.structure;
            cellE.alignment = { horizontal: 'right', vertical: 'middle' };
            cellE.font = { name: 'Arial', size: 11 };
            cellE.border = cellBorders;

            currentRowIndex++;
        });

        // Total Row
        const totalRow = worksheet.getRow(currentRowIndex);
        totalRow.height = 25;

        // Col A: total remainingAuth
        const cellA = totalRow.getCell('A');
        cellA.value = tableData.totals.remainingAuth;
        cellA.numFmt = '#,##0.00';
        cellA.alignment = { horizontal: 'center', vertical: 'middle' };
        cellA.font = { name: 'Arial', bold: true, size: 11 };
        cellA.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEBF1F5' } // subtle highlight
        };
        cellA.border = cellBorders;

        // Col B: total commitment
        const cellB = totalRow.getCell('B');
        cellB.value = tableData.totals.commitment;
        cellB.numFmt = '#,##0.00';
        cellB.alignment = { horizontal: 'center', vertical: 'middle' };
        cellB.font = { name: 'Arial', bold: true, size: 11 };
        cellB.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEBF1F5' }
        };
        cellB.border = cellBorders;

        // Col C: total finalAuth
        const cellC = totalRow.getCell('C');
        cellC.value = tableData.totals.finalAuth;
        cellC.numFmt = '#,##0.00';
        cellC.alignment = { horizontal: 'center', vertical: 'middle' };
        cellC.font = { name: 'Arial', bold: true, size: 11 };
        cellC.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEBF1F5' }
        };
        cellC.border = cellBorders;

        // Col D: total initialAuth
        const cellD = totalRow.getCell('D');
        cellD.value = tableData.totals.initialAuth;
        cellD.numFmt = '#,##0.00';
        cellD.alignment = { horizontal: 'center', vertical: 'middle' };
        cellD.font = { name: 'Arial', bold: true, size: 11 };
        cellD.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEBF1F5' }
        };
        cellD.border = cellBorders;

        // Col E: "المجموع"
        const cellE = totalRow.getCell('E');
        cellE.value = 'المجموع';
        cellE.alignment = { horizontal: 'center', vertical: 'middle' };
        cellE.font = { name: 'Arial', bold: true, size: 11 };
        cellE.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEBF1F5' }
        };
        cellE.border = cellBorders;

        currentRowIndex += 3; // Leave room, then show signature lines

        const sigRow = worksheet.getRow(currentRowIndex);
        sigRow.height = 20;

        // Merge Columns A to B for left signature
        worksheet.mergeCells(`A${currentRowIndex}:B${currentRowIndex}`);
        const sigLeft = worksheet.getCell(`A${currentRowIndex}`);
        sigLeft.value = 'مسؤول النشاط';
        sigLeft.font = { name: 'Arial', bold: true, size: 11, underline: true };
        sigLeft.alignment = { horizontal: 'center', vertical: 'middle' };

        // Merge Columns D to E for right signature
        worksheet.mergeCells(`D${currentRowIndex}:E${currentRowIndex}`);
        const sigRight = worksheet.getCell(`D${currentRowIndex}`);
        sigRight.value = 'المراقب الميزانياتي';
        sigRight.font = { name: 'Arial', bold: true, size: 11, underline: true };
        sigRight.alignment = { horizontal: 'center', vertical: 'middle' };

        // Write buffer and download
        const buf = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `الوضعية_المالية_حسب_الهيكلة_${operation?.N_OPERATION || ''}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    const [pageSize, setPageSize] = useState<number | 'all'>(50);
    const [currentPage, setCurrentPage] = useState<number>(1);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedOperationId]);

    const totalRows = tableData.rows.length;
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalRows / (pageSize as number)) || 1;
    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const paginatedRows = useMemo(() => {
        if (pageSize === 'all') return tableData.rows;
        const start = (safeCurrentPage - 1) * (pageSize as number);
        return tableData.rows.slice(start, start + (pageSize as number));
    }, [tableData.rows, safeCurrentPage, pageSize]);

    const renderPaginationControls = () => {
        if (tableData.rows.length === 0) return null;
        const startIdx = pageSize === 'all' ? 1 : (safeCurrentPage - 1) * (pageSize as number) + 1;
        const endIdx = pageSize === 'all' ? totalRows : Math.min(safeCurrentPage * (pageSize as number), totalRows);

        return (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border-t border-blue-200 text-xs select-none">
                <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-medium text-[11px]">
                        عرض <span className="font-bold text-blue-700">{startIdx}</span> إلى <span className="font-bold text-blue-700">{endIdx}</span> من أصل <span className="font-bold text-gray-900">{totalRows}</span> عنصر
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
        <PageWrapper title="الوضعية المالية حسب الهيكلة" navigate={navigate} onGoBack={onGoBack} backPage='FINANCIAL_STATUS' currentUser={currentUser}>
            <div className="bg-indigo-100 p-4 rounded-lg shadow-md mb-6 border border-indigo-300">
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
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button onClick={() => navigate('PRINT_FINANCIAL_STATUS_BY_STRUCTURE', selectedOperationId ? parseInt(selectedOperationId) : 0)} disabled={!selectedOperationId} className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors w-full disabled:bg-gray-400 text-xs font-bold">
                            <i className="bi bi-printer mr-1"></i> طباعة (الالتزام و الدفع)
                        </button>
                        <button onClick={() => navigate('PRINT_FINANCIAL_STATUS_BY_STRUCTURE_COMMITMENT', selectedOperationId ? parseInt(selectedOperationId) : 0)} disabled={!selectedOperationId} className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-600 transition-colors w-full disabled:bg-gray-400 text-xs font-bold">
                            <i className="bi bi-printer mr-1"></i> طباعة (الالتزام)
                        </button>
                        <button onClick={handleExport} disabled={tableData.rows.length === 0} className="bg-teal-500 text-white px-3 py-2 rounded-lg shadow hover:bg-teal-600 transition-colors w-full disabled:bg-gray-400 text-xs font-bold">
                            <i className="bi bi-file-earmark-excel mr-1"></i> تصدير
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 w-full">
                <div className="overflow-auto max-h-[60vh] custom-scrollbar">
                    <table className="w-full text-right min-w-[900px] border-collapse text-xs">
                        <thead className="bg-sky-100 text-gray-700 sticky top-0 z-20 shadow-sm border-b border-blue-200 font-bold">
                            <tr>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600 w-[20%]">هيكلة الكلفة</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">رخصة الالتزام الأولية</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">رخصة الالتزام النهائية</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">الالتزام</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">باقي رخصة الالتزام</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">الدفع</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">باقي الانجاز</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedRows.length > 0 ? paginatedRows.map((row) => (
                                <tr 
                                    key={row.id} 
                                    id={`rubric-row-${row.id}`}
                                    className={`hover:bg-blue-50/60 transition-colors duration-150 text-xs ${highlightRubricId === row.id ? 'bg-amber-50 ring-2 ring-amber-300 ring-inset font-semibold' : ''}`}
                                >
                                    <td className="p-2 text-gray-900 font-bold">{row.structure}</td>
                                    <td className="p-2 text-gray-700 font-mono text-[11px]">{formatCurrency(row.initialAuth)}</td>
                                    <td className="p-2 text-gray-700 font-bold font-mono text-[11px]">{formatCurrency(row.finalAuth)}</td>
                                    <td className="p-2 text-blue-700 font-bold font-mono text-[11px]">{formatCurrency(row.commitment)}</td>
                                    <td className={`p-2 font-bold font-mono text-[11px] ${row.remainingAuth < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(row.remainingAuth)}</td>
                                    <td className="p-2 text-emerald-700 font-bold font-mono text-[11px]">{formatCurrency(row.payment)}</td>
                                    <td className="p-2 text-teal-700 font-bold font-mono text-[11px]">{formatCurrency(row.executionBalance)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-gray-500 font-medium">
                                        {selectedOperationId ? 'لا توجد بيانات لهذه العملية.' : 'يرجى اختيار عملية لعرض البيانات.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {tableData.rows.length > 0 && (
                            <tfoot className="bg-slate-200 font-bold text-gray-900 text-xs sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] border-t border-gray-300">
                                <tr>
                                    <td className="p-2 text-center font-bold">المجموع</td>
                                    <td className="p-2 font-mono">{formatCurrency(tableData.totals.initialAuth)}</td>
                                    <td className="p-2 font-mono">{formatCurrency(tableData.totals.finalAuth)}</td>
                                    <td className="p-2 font-mono">{formatCurrency(tableData.totals.commitment)}</td>
                                    <td className="p-2 font-mono">{formatCurrency(tableData.totals.remainingAuth)}</td>
                                    <td className="p-2 font-mono">{formatCurrency(tableData.totals.payment)}</td>
                                    <td className="p-2 font-mono">{formatCurrency(tableData.totals.executionBalance)}</td>
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

export default FinancialStatusByStructurePage;
