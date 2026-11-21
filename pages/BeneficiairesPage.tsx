import React, { useState, useMemo, useRef } from 'react';
import { Page, Beneficiaire, CompteBancaire, User } from '../types';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfirm } from '../context/ConfirmContext';
import PageWrapper from '../components/PageWrapper';
import Modal from '../components/Modal';
import AddBeneficiaryForm from '../components/forms/AddBeneficiaryForm';
import BeneficiaryDetailsModal from '../components/BeneficiaryDetailsModal';
import { exportToFormattedExcel } from '../utils/exportToCsv';
import CustomDropdown from '../components/CustomDropdown';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import ExcelJS from 'exceljs';

interface BeneficiairesPageProps {
    navigate: (page: Page, operationId?: number) => void;
    onGoBack?: () => void;
    currentUser: User;
    initialBeneficiaryId?: number | null;
}

const BeneficiairesPage: React.FC<BeneficiairesPageProps> = ({ navigate, onGoBack, currentUser, initialBeneficiaryId }) => {
    const { db, loading, addItem, updateItem, deleteItem, runInTransaction } = useData();
    const { showToast } = useToast();
    const { t } = useLanguage();
    const { confirm } = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [detailsBeneficiaryId, setDetailsBeneficiaryId] = useState<number | null>(null);
    const [editingBeneficiary, setEditingBeneficiary] = useState<{ beneficiary: Beneficiaire, accounts: CompteBancaire[] } | undefined>(undefined);
    const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<number | null>(null);
    const [highlightId, setHighlightId] = useState<number | null>(null);
    const [filterId, setFilterId] = useState<string>('');
    const [formKey, setFormKey] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isViewer = currentUser.ROLE === 'viewer';

    React.useEffect(() => {
        if (initialBeneficiaryId) {
            setSelectedBeneficiaryId(initialBeneficiaryId);
            setHighlightId(initialBeneficiaryId);
            setFilterId('');
            
            setTimeout(() => {
                const element = document.getElementById(`beneficiary-row-${initialBeneficiaryId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);

            const timer = setTimeout(() => {
                setHighlightId(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [initialBeneficiaryId]);



    const beneficiaryOptions = useMemo(() => {
        return db.T_BENEFICIAIRE.map(b => ({ value: b.ID_BENEFICIAIRE, label: b.BENEFICIAIRE }));
    }, [db.T_BENEFICIAIRE]);

    const filteredBeneficiaries = useMemo(() => {
        if (!filterId) return db.T_BENEFICIAIRE.slice().sort((a, b) => a.ID_BENEFICIAIRE - b.ID_BENEFICIAIRE);
        return db.T_BENEFICIAIRE.filter(b => b.ID_BENEFICIAIRE.toString() === filterId).sort((a, b) => a.ID_BENEFICIAIRE - b.ID_BENEFICIAIRE);
    }, [db.T_BENEFICIAIRE, filterId]);

    const handleSaveBeneficiary = async (data: { beneficiaryData: Omit<Beneficiaire, 'ID_BENEFICIAIRE'> | Beneficiaire; accounts: Array<{ rib: string; banque: string }> }) => {
        const { beneficiaryData, accounts } = data;
        
        showToast('جاري حفظ البيانات...', 'loading');

        try {
            await runInTransaction(async () => {
                if ('ID_BENEFICIAIRE' in beneficiaryData) {
                    const beneficiaryId = beneficiaryData.ID_BENEFICIAIRE;
                    await updateItem('T_BENEFICIAIRE', beneficiaryId, beneficiaryData);
                    
                    const oldAccounts = db.T_COMPTE_BANCAIRE.filter(acc => acc.ID_BENEFICIAIRE === beneficiaryId);
                    for (const acc of oldAccounts) {
                        await deleteItem('T_COMPTE_BANCAIRE', acc.ID_COMPTE);
                    }
                    for (const acc of accounts) {
                        await addItem('T_COMPTE_BANCAIRE', { ID_BENEFICIAIRE: beneficiaryId, RIB: acc.rib, BANQUE: acc.banque });
                    }
                    showToast('تم تعديل المستفيد بنجاح', 'success');
                } else {
                    const newBeneficiary = await addItem('T_BENEFICIAIRE', beneficiaryData);
                    const beneficiaryId = newBeneficiary.ID_BENEFICIAIRE;

                    for (const acc of accounts) {
                        await addItem('T_COMPTE_BANCAIRE', { ID_BENEFICIAIRE: beneficiaryId, RIB: acc.rib, BANQUE: acc.banque });
                    }
                    showToast('تمت إضافة المستفيد بنجاح', 'success');
                }
            });
            
            setIsModalOpen(false);
            setEditingBeneficiary(undefined);
        } catch {
            showToast('حدث خطأ أثناء الحفظ', 'error');
        }
    };

    const handleEditSpecificBeneficiary = (id: number) => {
        if (loading) {
            alert("يجب الانتظار حتى يتم تحديث النافذة");
            return;
        }
        const beneficiaryToEdit = db.T_BENEFICIAIRE.find(b => b.ID_BENEFICIAIRE === id);
        const accountsForBeneficiary = db.T_COMPTE_BANCAIRE.filter(acc => acc.ID_BENEFICIAIRE === id);
        if (beneficiaryToEdit) {
            setSelectedBeneficiaryId(id);
            setEditingBeneficiary({ beneficiary: beneficiaryToEdit, accounts: accountsForBeneficiary });
            setFormKey(prev => prev + 1);
            setIsModalOpen(true);
        }
    };

    const handleDeleteSpecificBeneficiary = async (id: number) => {
        if (isViewer) return;
        const ben = db.T_BENEFICIAIRE.find(b => b.ID_BENEFICIAIRE === id);
        if (!ben) return;
        const confirmed = await confirm(`هل أنت متأكد أنك تريد حذف المستفيد "${ben.BENEFICIAIRE}"؟ سيتم حذف جميع حساباته البنكية المرتبطة به.`);
        if (confirmed) {
            showToast('جاري الحذف...', 'loading');
            try {
                await deleteItem('T_BENEFICIAIRE', id);
                showToast('تم حذف المستفيد بنجاح', 'success');
                if (selectedBeneficiaryId === id) setSelectedBeneficiaryId(null);
            } catch {
                showToast('حدث خطأ أثناء الحذف', 'error');
            }
        }
    };
    
    const openAddModal = () => {
        if (loading) {
            alert("يجب الانتظار حتى يتم تحديث النافذة");
            return;
        }
        setEditingBeneficiary(undefined);
        setFormKey(prev => prev + 1);
        setIsModalOpen(true);
    };



    const handleExport = () => {
        if (db.T_BENEFICIAIRE.length === 0) {
            alert('لا توجد بيانات للتصدير.');
            return;
        }
    
        const beneficiariesWithAccounts = filteredBeneficiaries.map(ben => ({
            ...ben,
            accounts: db.T_COMPTE_BANCAIRE.filter(acc => acc.ID_BENEFICIAIRE === ben.ID_BENEFICIAIRE)
        }));
    
        const maxAccounts = Math.max(0, ...beneficiariesWithAccounts.map(b => b.accounts.length));
    
        const headers = [t('col.beneficiary'), 'النشاط التجاري', t('col.address'), t('col.rc'), t('col.tax_id')];
        for (let i = 1; i <= maxAccounts; i++) {
            headers.push(`رقم الحساب ${i}`, `البنك ${i}`);
        }
    
        const styles = `<style> table, th, td { border: 1px solid black; border-collapse: collapse; text-align: right; padding: 5px; font-family: Arial, sans-serif; vertical-align: middle; } th { background-color: #DDEBF7; font-weight: bold; text-align: center; } td { mso-number-format:"\\@"; } </style>`;
        let tableHtml = `${styles}<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
    
        beneficiariesWithAccounts.forEach(ben => {
            let rowHtml = `<tr>
                <td>${ben.BENEFICIAIRE}</td>
                <td>${ben.ACTIVITE || ''}</td>
                <td>${ben.ADRESSE}</td>
                <td>${ben.RC || ''}</td>
                <td>${ben.CODE_FISCALE || ''}</td>`;
            
            for (let i = 0; i < maxAccounts; i++) {
                if (ben.accounts[i]) {
                    rowHtml += `<td>${ben.accounts[i].RIB}</td><td>${ben.accounts[i].BANQUE}</td>`;
                } else {
                    rowHtml += `<td></td><td></td>`;
                }
            }
            rowHtml += `</tr>`;
            tableHtml += rowHtml;
        });
    
        tableHtml += `</tbody></table>`;
        exportToFormattedExcel(tableHtml, 'beneficiaires.xls');
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                showToast('جاري استيراد البيانات...', 'loading');
                const buffer = e.target?.result as ArrayBuffer;
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer);
                
                const worksheet = workbook.getWorksheet(1);
                if (!worksheet) {
                    showToast("الملف فارغ أو بصيغة غير صحيحة", 'error');
                    return;
                }

                const json: any[] = [];
                const headers: string[] = [];
                
                worksheet.getRow(1).eachCell((cell, colNumber) => {
                    headers[colNumber] = String(cell.value || '');
                });

                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return;
                    const rowData: any = {};
                    row.eachCell((cell, colNumber) => {
                        const header = headers[colNumber];
                        if (header) {
                            rowData[header] = cell.value;
                        }
                    });
                    json.push(rowData);
                });

                if (json.length === 0) {
                    showToast("الملف فارغ أو بصيغة غير صحيحة", 'error');
                    return;
                }

                let successCount = 0;
                let skippedCount = 0;
                let errorCount = 0;
                const errors: string[] = [];
                const skipped: string[] = [];

                await runInTransaction(async () => {
                    for (const [index, row] of (json as any[]).entries()) {
                        try {
                            const beneficiaire = row['الإسم المستفيد']?.trim();
                            const adresse = row['العنوان']?.trim();

                            if (!beneficiaire || !adresse) {
                                errors.push(`السطر ${index + 2}: الحقول المطلوبة (الإسم المستفيد, العنوان) مفقودة.`);
                                errorCount++;
                                continue;
                            }

                            const existingBeneficiary = db.T_BENEFICIAIRE.find(b => b.BENEFICIAIRE.trim().toLowerCase() === beneficiaire.toLowerCase());
                            if (existingBeneficiary) {
                                skipped.push(`السطر ${index + 2}: المستفيد '${beneficiaire}' موجود بالفعل، تم تخطيه.`);
                                skippedCount++;
                                continue;
                            }

                            const beneficiaryData = {
                                BENEFICIAIRE: beneficiaire,
                                ACTIVITE: row['النشاط التجاري'] || null,
                                ADRESSE: adresse,
                                RC: row['رقم السجل'] || null,
                                CODE_FISCALE: row['التعريف الجبائي'] || null,
                            };

                            const accounts: { rib: string, banque: string }[] = [];
                            let hasAccount = false;
                            for (let i = 1; i <= 10; i++) {
                                const rib = row[`رقم الحساب ${i}`];
                                const banque = row[`البنك ${i}`];
                                if (rib && banque) {
                                    accounts.push({ rib: String(rib).trim(), banque: String(banque).trim() });
                                    hasAccount = true;
                                }
                            }

                            if (!hasAccount) {
                                errors.push(`السطر ${index + 2}: يجب توفير حساب بنكي واحد على الأقل للمستفيد '${beneficiaire}'.`);
                                errorCount++;
                                continue;
                            }

                            const newBeneficiary = await addItem('T_BENEFICIAIRE', beneficiaryData);
                            const beneficiaryId = newBeneficiary.ID_BENEFICIAIRE;

                            for (const acc of accounts) {
                                await addItem('T_COMPTE_BANCAIRE', { ID_BENEFICIAIRE: beneficiaryId, RIB: acc.rib, BANQUE: acc.banque });
                            }
                            
                            successCount++;
                        } catch (innerError) {
                            console.error("Error processing row:", row, innerError);
                            errors.push(`السطر ${index + 2}: خطأ غير متوقع أثناء المعالجة.`);
                            errorCount++;
                        }
                    }
                });
                
                let summaryMessage = `اكتمل الاستيراد.\n\n- تمت إضافة ${successCount} مستفيدين جدد بنجاح.\n- تم تخطي ${skippedCount} مستفيدين لأنهم موجودون بالفعل.\n- فشلت معالجة ${errorCount} من السجلات.`;
                const details = [...skipped, ...errors];
                if (details.length > 0) {
                    summaryMessage += "\n\nالتفاصيل:\n" + details.slice(0, 10).join('\n');
                    if (details.length > 10) summaryMessage += `\n... و ${details.length - 10} ملاحظات أخرى.`;
                }
                
                if (successCount > 0) showToast(`تم استيراد ${successCount} مستفيدين`, 'success');
                else if (errorCount > 0) showToast('فشل الاستيراد، راجع التفاصيل', 'error');

                alert(summaryMessage);

            } catch (error) {
                console.error('Failed to import data:', error);
                showToast('فشل استيراد البيانات', 'error');
            } finally {
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const [pageSize, setPageSize] = useState<number | 'all'>(50);
    const [currentPage, setCurrentPage] = useState<number>(1);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [filterId]);

    const totalRows = filteredBeneficiaries.length;
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalRows / (pageSize as number)) || 1;
    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const paginatedBeneficiaries = useMemo(() => {
        if (pageSize === 'all') return filteredBeneficiaries;
        const start = (safeCurrentPage - 1) * (pageSize as number);
        return filteredBeneficiaries.slice(start, start + (pageSize as number));
    }, [filteredBeneficiaries, safeCurrentPage, pageSize]);

    const renderPaginationControls = () => {
        if (filteredBeneficiaries.length === 0) return null;
        const startIdx = pageSize === 'all' ? 1 : (safeCurrentPage - 1) * (pageSize as number) + 1;
        const endIdx = pageSize === 'all' ? totalRows : Math.min(safeCurrentPage * (pageSize as number), totalRows);

        return (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border-t border-blue-200 text-xs select-none">
                <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-medium text-[11px]">
                        عرض <span className="font-bold text-blue-700">{startIdx}</span> إلى <span className="font-bold text-blue-700">{endIdx}</span> من أصل <span className="font-bold text-gray-900">{totalRows}</span> مستفيد
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

    if (loading) return <div>{t('loading')}</div>;

    return (
        <PageWrapper
            title={t('page.beneficiaries')}
            navigate={navigate}
            onGoBack={onGoBack}
            backPage='HOME'
            currentUser={currentUser}
            actions={
                <div className="flex flex-wrap items-center gap-2">
                    <div className="w-full sm:w-64 ml-0 sm:ml-4 mb-2 sm:mb-0">
                        <CustomDropdown
                            options={[{ value: '', label: t('filter.all_beneficiaries') }, ...beneficiaryOptions]}
                            value={filterId}
                            onChange={setFilterId}
                            placeholder={t('filter.beneficiary')}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={handleExport} className="bg-teal-600 text-white px-3 py-1.5 rounded-[20px] hover:bg-teal-700 transition-colors text-xs font-bold whitespace-nowrap cursor-pointer shadow-sm">
                            <i className="bi bi-file-earmark-excel mr-1"></i> {t('btn.export_excel')}
                        </button>
                        {!isViewer && (
                            <button onClick={openAddModal} className="bg-green-600 text-white px-3 py-1.5 rounded-[20px] hover:bg-green-700 transition-colors text-xs font-bold whitespace-nowrap cursor-pointer shadow-sm">
                                <i className="bi bi-plus-circle mr-1"></i> {t('btn.add')}
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 w-full">
                <div className="overflow-auto max-h-[calc(100vh-220px)] custom-scrollbar">
                    <table className="w-full text-right border-collapse text-xs">
                        <thead className="bg-sky-100 sticky top-0 z-20 shadow-sm font-bold text-gray-700 border-b border-blue-200">
                            <tr>
                                <th className="p-2 text-center w-10 text-[10px] uppercase font-bold text-gray-600">#</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">{t('col.beneficiary')}</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">النشاط التجاري</th>
                                <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">{t('col.address')}</th>
                                <th className="p-2 text-center text-[10px] uppercase font-bold text-gray-600">{t('col.bank_accounts')}</th>
                                <th className="p-2 text-center text-[10px] uppercase font-bold text-gray-600">{t('col.rc')}</th>
                                <th className="p-2 text-center text-[10px] uppercase font-bold text-gray-600">{t('col.tax_id')}</th>
                                <th className="p-2 text-center w-36 text-[10px] uppercase font-bold text-gray-600">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedBeneficiaries.map((b, idx) => (
                                <tr 
                                    key={b.ID_BENEFICIAIRE} 
                                    id={`beneficiary-row-${b.ID_BENEFICIAIRE}`}
                                    onClick={() => setSelectedBeneficiaryId(b.ID_BENEFICIAIRE)} 
                                    className={`hover:bg-blue-50/60 cursor-pointer text-xs transition-colors duration-150 
                                        ${selectedBeneficiaryId === b.ID_BENEFICIAIRE ? 'bg-blue-100/90 ring-2 ring-inset ring-blue-500 font-semibold' : ''}
                                        ${highlightId === b.ID_BENEFICIAIRE ? 'bg-green-100 ring-2 ring-green-500 font-bold' : ''}
                                    `}
                                >
                                    <td className="p-2 text-center font-mono text-gray-500 text-[10px]">{pageSize === 'all' ? idx + 1 : (safeCurrentPage - 1) * (pageSize as number) + idx + 1}</td>
                                    <td className="p-2 font-bold text-gray-900">{b.BENEFICIAIRE}</td>
                                    <td className="p-2 text-gray-700">{b.ACTIVITE || '---'}</td>
                                    <td className="p-2 text-gray-700 max-w-[200px] truncate" title={b.ADRESSE}>{b.ADRESSE}</td>
                                    <td className="p-2 text-center">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                            {db.T_COMPTE_BANCAIRE.filter(acc => acc.ID_BENEFICIAIRE === b.ID_BENEFICIAIRE).length} حسابات
                                        </span>
                                    </td>
                                    <td className="p-2 text-center font-mono text-gray-700 text-[11px]">{b.RC || '---'}</td>
                                    <td className="p-2 text-center font-mono text-gray-700 text-[11px]">{b.CODE_FISCALE || '---'}</td>
                                    <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDetailsBeneficiaryId(b.ID_BENEFICIAIRE);
                                                }}
                                                className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-xs"
                                                title="تفاصيل المستفيد"
                                            >
                                                <i className="bi bi-eye-fill text-[10px]"></i>
                                                <span>تفاصيل</span>
                                            </button>

                                            {!isViewer && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditSpecificBeneficiary(b.ID_BENEFICIAIRE);
                                                        }}
                                                        className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors cursor-pointer"
                                                        title="تعديل"
                                                    >
                                                        <i className="bi bi-pencil-fill text-xs"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteSpecificBeneficiary(b.ID_BENEFICIAIRE);
                                                        }}
                                                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors cursor-pointer"
                                                        title="حذف"
                                                    >
                                                        <i className="bi bi-trash-fill text-xs"></i>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {renderPaginationControls()}
            </div>



            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingBeneficiary(undefined); }} title={editingBeneficiary ? "تعديل مستفيد" : "إضافة مستفيد"}>
                <AddBeneficiaryForm key={formKey} onClose={() => { setIsModalOpen(false); setEditingBeneficiary(undefined); }} onSave={handleSaveBeneficiary} initialData={editingBeneficiary} />
            </Modal>

            <BeneficiaryDetailsModal
                isOpen={detailsBeneficiaryId !== null}
                beneficiaryId={detailsBeneficiaryId}
                onClose={() => setDetailsBeneficiaryId(null)}
            />
        </PageWrapper>
    );
};

export default BeneficiairesPage;
