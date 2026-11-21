
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Page, Operation, User } from '../types';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfirm } from '../context/ConfirmContext';
import PageWrapper from '../components/PageWrapper';
import Modal from '../components/Modal';
import AddOperationForm from '../components/forms/AddOperationForm';
import { exportToFormattedExcel } from '../utils/exportToCsv';
import { formatCurrency } from '../utils/currencyUtils';
import { isOperationCreator } from '../utils/authUtils';
import CustomDropdown from '../components/CustomDropdown';
import ExcelJS from 'exceljs';
import { Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import OperationRow from '../components/OperationRow';

interface OperationsPageProps {
    navigate: (page: Page, operationId?: number) => void;
    onGoBack?: () => void;
    onUpdateUser: (user: User) => void;
    currentUser: User;
}

const OperationsPage: React.FC<OperationsPageProps> = ({ navigate, onGoBack, onUpdateUser, currentUser }) => {
    const { db, loading, addItem, updateItem, deleteOperation, runInTransaction } = useData();
    const { showToast } = useToast();
    const { t } = useLanguage();
    const { confirm } = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOperation, setEditingOperation] = useState<Operation | undefined>(undefined);
    const [selectedOperationId, setSelectedOperationId] = useState<number | null>(null);
    const [formKey, setFormKey] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isViewer = currentUser.ROLE === 'viewer';

    const availableYears = useMemo(() => {
        const years = new Set(db.T_CP.map(cp => cp.ANNEE));
        const currentYearStr = new Date().getFullYear().toString();
        if (!years.has(currentYearStr)) {
            years.add(currentYearStr);
        }
        return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    }, [db.T_CP]);

    const [selectedYear, setSelectedYear] = useState<string>(() => sessionStorage.getItem('goft3_selectedYear') || availableYears[0] || new Date().getFullYear().toString());
    const [selectedActivity, setSelectedActivity] = useState<string>(() => sessionStorage.getItem('goft3_selectedActivity') || '');
    const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('goft3_searchQuery') || '');
    const [showSearchQuery, setShowSearchQuery] = useState(() => !!sessionStorage.getItem('goft3_searchQuery'));
    const [selectedStatus, setSelectedStatus] = useState<string>(() => sessionStorage.getItem('goft3_selectedStatus') || 'all');
    const [selectedTypeOp, setSelectedTypeOp] = useState<string>(() => sessionStorage.getItem('goft3_selectedTypeOp') || 'all');

    useEffect(() => {
        sessionStorage.setItem('goft3_selectedYear', selectedYear);
        sessionStorage.setItem('goft3_selectedActivity', selectedActivity);
        sessionStorage.setItem('goft3_searchQuery', searchQuery);
        sessionStorage.setItem('goft3_selectedStatus', selectedStatus);
        sessionStorage.setItem('goft3_selectedTypeOp', selectedTypeOp);
    }, [selectedYear, selectedActivity, searchQuery, selectedStatus, selectedTypeOp]);

    const activities = useMemo(() => {
        const activityMap = new Map<string, string>();
        db.T_DIRECTION.forEach(d => {
            if (d.ACTION && d.INT_ACTION && !activityMap.has(d.ACTION)) {
                activityMap.set(d.ACTION, d.INT_ACTION);
            }
        });
        const operationActivityCodes = [...new Set(db.T_OPERATION.map(op => op.N_OPERATION.split('.')[5]).filter(Boolean))];
        return operationActivityCodes.map((code: string) => {
            const name = activityMap.get(code) || `(${code})`;
            return {
                code,
                name,
                value: code,
                label: `${code} - ${name}`
            };
        }).sort((a, b) => a.code.localeCompare(b.code));
    }, [db.T_DIRECTION, db.T_OPERATION]);

    const uniqueTypeOps = useMemo(() => {
        const types = new Set<string>();
        db.T_OPERATION.forEach(op => {
            if (op.TYPE_OP) {
                types.add(op.TYPE_OP);
            }
        });
        
        const stored = localStorage.getItem('goft3_operation_types');
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as string[];
                parsed.forEach(t => types.add(t));
            } catch (e) {
                console.error("Error parsing stored operation types", e);
            }
        }
        
        return Array.from(types).sort();
    }, [db.T_OPERATION]);



    const calculatedOperations = useMemo(() => {
        // PRE-GROUPING for performance (avoid filtering large arrays inside map)
        const engGroups = new Map<number, typeof db.T_ENGAGEMENT>();
        db.T_ENGAGEMENT.forEach(eng => {
            const list = engGroups.get(eng.ID_OPERATION) || [];
            list.push(eng);
            engGroups.set(eng.ID_OPERATION, list);
        });

        const paiGroups = new Map<number, typeof db.T_PAIEMENT>();
        db.T_PAIEMENT.forEach(pai => {
            const list = paiGroups.get(pai.ID_OPERATION) || [];
            list.push(pai);
            paiGroups.set(pai.ID_OPERATION, list);
        });

        const cpGroups = new Map<number, typeof db.T_CP>();
        db.T_CP.forEach(cp => {
            const list = cpGroups.get(cp.ID_OPERATION) || [];
            list.push(cp);
            cpGroups.set(cp.ID_OPERATION, list);
        });

        const rubOpGroups = new Map<number, typeof db.T_RUBRIQUE_OP>();
        db.T_RUBRIQUE_OP.forEach(rop => {
            const list = rubOpGroups.get(rop.ID_OPERATION) || [];
            list.push(rop);
            rubOpGroups.set(rop.ID_OPERATION, list);
        });

        const scatOpGroups = new Map<number, typeof db.T_SCATEGORIE_OP>();
        db.T_SCATEGORIE_OP.forEach(sop => {
            const list = scatOpGroups.get(sop.ID_OPERATION) || [];
            list.push(sop);
            scatOpGroups.set(sop.ID_OPERATION, list);
        });

        const operationStartYears = new Map<number, number>();
        db.T_ENGAGEMENT.forEach(item => {
            const year = parseInt(item.ANNEE);
            if (!isNaN(year)) {
                const existingMinYear = operationStartYears.get(item.ID_OPERATION);
                if (!existingMinYear || year < existingMinYear) operationStartYears.set(item.ID_OPERATION, year);
            }
        });
        db.T_CP.forEach(item => {
            const year = parseInt(item.ANNEE);
            if (!isNaN(year)) {
                const existingMinYear = operationStartYears.get(item.ID_OPERATION);
                if (!existingMinYear || year < existingMinYear) operationStartYears.set(item.ID_OPERATION, year);
            }
        });

        const selYearInt = parseInt(selectedYear);

        return db.T_OPERATION.filter(op => {
            const startYear = operationStartYears.get(op.ID_OPERATION);
            if (startYear && startYear > selYearInt) return false;

            // Authorization
            if (currentUser.ROLE !== 'admin' && currentUser.ALLOWED_OPERATIONS) {
                try {
                    const allowedOps = JSON.parse(currentUser.ALLOWED_OPERATIONS) as number[];
                    if (allowedOps.length > 0 && !allowedOps.includes(op.ID_OPERATION)) return false;
                } catch (e) {
                    console.error("Error parsing allowed operations", e);
                }
            }
            
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!op.N_OPERATION.toLowerCase().includes(query) && !op.INT_OPERATION.toLowerCase().includes(query)) return false;
            }
            
            if (selectedStatus !== 'all' && op.status !== selectedStatus) {
                return false;
            }
            
            if (selectedTypeOp !== 'all' && op.TYPE_OP !== selectedTypeOp) {
                return false;
            }
            
            return true;
        }).map(op => {
            const opEngs = engGroups.get(op.ID_OPERATION) || [];
            const opPais = paiGroups.get(op.ID_OPERATION) || [];
            const opCps = cpGroups.get(op.ID_OPERATION) || [];
            const opRops = rubOpGroups.get(op.ID_OPERATION) || [];
            const opScatOps = scatOpGroups.get(op.ID_OPERATION) || [];

            const aeFinale = opRops.reduce((sum, item) => sum + (item.MONTANT_FINALE ?? item.MONTANT_INITIALE), 0);
            
            const totalEngagements = opEngs
                .filter(eng => (eng.NATURE_ENG === 'التزام' || eng.NATURE_ENG === 'سحب') && parseInt(eng.ANNEE) <= selYearInt)
                .reduce((sum, item) => sum + item.MONTANT_ENG, 0);
            
            const totalEngagementsCurrentYear = opEngs
                .filter(eng => (eng.NATURE_ENG === 'التزام' || eng.NATURE_ENG === 'سحب') && eng.ANNEE === selectedYear)
                .reduce((sum, item) => sum + item.MONTANT_ENG, 0);
            
            const totalPaiements = opPais
                .filter(pai => parseInt(pai.ANNEE) <= selYearInt)
                .reduce((sum, item) => sum + item.MONTANT_PAI, 0);
            
            const cpFinaleCurrentYear = opCps
                .filter(cp => cp.ANNEE === selectedYear)
                .reduce((sum, item) => sum + item.MONTANT_FINALE_CP, 0);
            
            const paiementsCurrentYear = opPais
                .filter(pai => pai.ANNEE === selectedYear)
                .reduce((sum, item) => sum + item.MONTANT_PAI, 0);

            const remainingAE = aeFinale - totalEngagements;
            const remainingCP = cpFinaleCurrentYear - paiementsCurrentYear;
            const opStartYear = operationStartYears.get(op.ID_OPERATION) || 9999;

            const cat = db.T_CATEGORIE.find(c => c.ID_CATEGORIE === op.ID_CATEGORIE);
            const scatId = op.ID_SCATEGORIE || opScatOps[0]?.ID_SCATEGORIE; // Use ScatOps as fallback if op.ID_SCATEGORIE is missing
            const scat = scatId ? db.T_SCATEGORIE.find(sc => sc.ID_SCATEGORIE === scatId) : null;

            return { 
                ...op, 
                aeFinale, totalEngagements, totalEngagementsCurrentYear, remainingAE, 
                totalPaiements, cpFinaleCurrentYear, paiementsCurrentYear, remainingCP, 
                opStartYear, 
                catCode: cat?.C_CATEGORIE || 'NO_CAT', catInt: cat?.INT_CATEGORIE || 'بدون صنف',
                scatCode: scat?.C_SCATEGORIE || 'NO_SCAT', scatInt: scat?.INT_SCATEGORIE || 'غير موزع'
            };
        }).sort((a, b) => {
            const partsA = a.N_OPERATION.split('.');
            const partsB = b.N_OPERATION.split('.');
            let cmp = a.catCode.localeCompare(b.catCode, undefined, { numeric: true });
            if (cmp !== 0) return cmp;
            cmp = a.scatCode.localeCompare(b.scatCode, undefined, { numeric: true });
            if (cmp !== 0) return cmp;

            // Sort by operation type (TYPE_OP) - non-empty first, then alphabetically in Arabic
            const typeA = a.TYPE_OP || '';
            const typeB = b.TYPE_OP || '';
            if (typeA && !typeB) return -1;
            if (!typeA && typeB) return 1;
            cmp = typeA.localeCompare(typeB, 'ar', { numeric: true });
            if (cmp !== 0) return cmp;

            for (let i of [5, 3, 4, 8, 9]) {
                const valA = partsA[i] || '';
                const valB = partsB[i] || '';
                let cmp = valA.localeCompare(valB, undefined, { numeric: true });
                if (cmp !== 0) return cmp;
            }
            return 0;
        });
    }, [db, selectedYear, searchQuery, selectedStatus, selectedTypeOp, currentUser.ROLE, currentUser.ALLOWED_OPERATIONS]);


    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number | 'all'>(50);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedYear, selectedActivity, searchQuery, selectedStatus, selectedTypeOp]);

    const filteredOps = useMemo(() => {
        return calculatedOperations.filter(op => !selectedActivity || op.N_OPERATION.split('.')[5] === selectedActivity);
    }, [calculatedOperations, selectedActivity]);

    const totalRows = filteredOps.length;
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalRows / (pageSize as number)) || 1;
    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const paginatedOps = useMemo(() => {
        if (pageSize === 'all') return filteredOps;
        const start = (safeCurrentPage - 1) * (pageSize as number);
        return filteredOps.slice(start, start + (pageSize as number));
    }, [filteredOps, safeCurrentPage, pageSize]);

    const displayData = useMemo(() => {
        const opsToDisplay = paginatedOps;
        if (!opsToDisplay.length) return { rows: [], grandTotal: null };

        // Group by Category -> Sub-category -> Program -> Sub-program
        const grouped = opsToDisplay.reduce((acc, op) => {
            const parts = op.N_OPERATION.split('.');
            const catCode = op.catCode || 'NO_CAT';
            const scatCode = op.scatCode || 'NO_SCAT';
            const prgCode = parts[3] || '---';
            const sprgCode = parts[4] || '---';

            if (!acc[catCode]) acc[catCode] = {};
            if (!acc[catCode][scatCode]) acc[catCode][scatCode] = {};
            if (!acc[catCode][scatCode][prgCode]) acc[catCode][scatCode][prgCode] = {};
            if (!acc[catCode][scatCode][prgCode][sprgCode]) acc[catCode][scatCode][prgCode][sprgCode] = [];
            
            acc[catCode][scatCode][prgCode][sprgCode].push(op);
            return acc;
        }, {} as Record<string, Record<string, Record<string, Record<string, typeof calculatedOperations>>>>);

        const tableRows: (any)[] = [];

        Object.keys(grouped).sort().forEach(catCode => {
            const scatsInCat = grouped[catCode];
            const catName = scatsInCat[Object.keys(scatsInCat)[0]][Object.keys(scatsInCat[Object.keys(scatsInCat)[0]])[0]][Object.keys(scatsInCat[Object.keys(scatsInCat)[0]][Object.keys(scatsInCat[Object.keys(scatsInCat)[0]])[0]])[0]][0].catInt || catCode;
            
            tableRows.push({ type: 'catHeader', id: `cat-${catCode}`, catCode, catName });

            Object.keys(scatsInCat).sort().forEach(scatCode => {
                const programsInScat = scatsInCat[scatCode];
                const scatName = scatCode === 'NO_SCAT' ? 'مبالغ غير موزعة' : (programsInScat[Object.keys(programsInScat)[0]][Object.keys(programsInScat[Object.keys(programsInScat)[0]])[0]][0].scatInt || scatCode);
                
                tableRows.push({ type: 'scatHeader', id: `scat-${catCode}-${scatCode}`, scatCode, scatName });

                Object.keys(programsInScat).sort().forEach(prgCode => {
                    const sprogramsInPrg = programsInScat[prgCode];

                    Object.keys(sprogramsInPrg).sort().forEach(sprgCode => {
                        const opsInSprg = sprogramsInPrg[sprgCode];
                        
                        // Optional: Sub-program Header
                        tableRows.push({ type: 'sprgHeader', id: `sprg-${catCode}-${scatCode}-${prgCode}-${sprgCode}`, prgCode, sprgCode });

                        tableRows.push(...opsInSprg);
                        
                        const sprgSubtotal = opsInSprg.reduce((acc, op) => {
                            acc.aeFinale += op.aeFinale;
                            acc.totalEngagements += op.totalEngagements;
                            acc.totalEngagementsCurrentYear += op.totalEngagementsCurrentYear;
                            acc.remainingAE += op.remainingAE;
                            acc.totalPaiements += op.totalPaiements;
                            acc.cpFinaleCurrentYear += op.cpFinaleCurrentYear;
                            acc.paiementsCurrentYear += op.paiementsCurrentYear;
                            acc.remainingCP += op.remainingCP;
                            return acc;
                        }, { aeFinale: 0, totalEngagements: 0, totalEngagementsCurrentYear: 0, remainingAE: 0, totalPaiements: 0, cpFinaleCurrentYear: 0, paiementsCurrentYear: 0, remainingCP: 0 });
                        
                        tableRows.push({ 
                            type: 'sprgSubtotal', 
                            id: `subtotal-sprg-${catCode}-${scatCode}-${prgCode}-${sprgCode}`, 
                            label: `مجموع البرنامج الفرعي: ${sprgCode}`, 
                            ...sprgSubtotal 
                        });
                    });
                });

                // Overall Category Subtotal in this Category/Sub-category group
                const scatOps = Object.values(programsInScat).flatMap(prg => Object.values(prg).flat());
                const scatSubtotal = scatOps.reduce((acc, op) => {
                    acc.aeFinale += op.aeFinale;
                    acc.totalEngagements += op.totalEngagements;
                    acc.totalEngagementsCurrentYear += op.totalEngagementsCurrentYear;
                    acc.remainingAE += op.remainingAE;
                    acc.totalPaiements += op.totalPaiements;
                    acc.cpFinaleCurrentYear += op.cpFinaleCurrentYear;
                    acc.paiementsCurrentYear += op.paiementsCurrentYear;
                    acc.remainingCP += op.remainingCP;
                    return acc;
                }, { aeFinale: 0, totalEngagements: 0, totalEngagementsCurrentYear: 0, remainingAE: 0, totalPaiements: 0, cpFinaleCurrentYear: 0, paiementsCurrentYear: 0, remainingCP: 0 });

                tableRows.push({ 
                    type: 'subtotal', 
                    id: `subtotal-scat-${catCode}-${scatCode}`, 
                    label: `مجموع ${scatName}`, 
                    ...scatSubtotal 
                });
            });
        });
        
        const grandTotal = filteredOps.reduce((acc, op) => {
             acc.aeFinale += op.aeFinale;
             acc.totalEngagements += op.totalEngagements;
             acc.totalEngagementsCurrentYear += op.totalEngagementsCurrentYear;
             acc.remainingAE += op.remainingAE;
             acc.totalPaiements += op.totalPaiements;
             acc.cpFinaleCurrentYear += op.cpFinaleCurrentYear;
             acc.paiementsCurrentYear += op.paiementsCurrentYear;
             acc.remainingCP += op.remainingCP;
             return acc;
        }, { aeFinale: 0, totalEngagements: 0, totalEngagementsCurrentYear: 0, remainingAE: 0, totalPaiements: 0, cpFinaleCurrentYear: 0, paiementsCurrentYear: 0, remainingCP: 0 });

        return { rows: tableRows, grandTotal };
    }, [paginatedOps, filteredOps]);

    const handleSaveOperation = async (data: { 
        operationData: Omit<Operation, 'ID_OPERATION'> | Operation; 
        scategorieOpData?: { idScat: number; montant: number }[];
        rubriqueOps?: { idRubrique: number; montant: number }[];
    }) => {
        const { operationData, scategorieOpData, rubriqueOps } = data;

        try {
            await runInTransaction(async () => {
                let operationId: number;
                if ('ID_OPERATION' in operationData) {
                    operationId = operationData.ID_OPERATION;
                    await updateItem('T_OPERATION', operationId, operationData);
                    showToast('تم تعديل العملية بنجاح', 'success');
                } else {
                    const newOperationData = {
                        ...operationData,
                        CREATED_BY: currentUser.USERNAME
                    };
                    const newOperation = await addItem('T_OPERATION', newOperationData);
                    operationId = newOperation.ID_OPERATION;

                    // Select the newly created operation
                    setSelectedOperationId(operationId);

                    // Auto-assign to user if not admin
                    // If ALLOWED_OPERATIONS is null/undefined, it means they see everything.
                    // Usually we only auto-assign if they are already in a restricted list mode
                    // OR if the system wants to enforce starting a list when they add one.
                    // Given the user request: "Automatic permissions when adding an operation", we will ensure it's added.
                    if (currentUser.ROLE !== 'admin') {
                        try {
                            const currentAllowed = currentUser.ALLOWED_OPERATIONS ? JSON.parse(currentUser.ALLOWED_OPERATIONS) : null;
                            
                            // If it's already a list (even empty []), add to it.
                            // If it's null, it depends. But user said "Automatic", so let's ensure it's there.
                            const allowedOps = currentAllowed || [];
                            if (!allowedOps.includes(operationId)) {
                                const newAllowed = [...allowedOps, operationId];
                                const updatedAllowedString = JSON.stringify(newAllowed);
                                await updateItem('T_USER', currentUser.ID_USER, { ALLOWED_OPERATIONS: updatedAllowedString });
                                onUpdateUser({ ...currentUser, ALLOWED_OPERATIONS: updatedAllowedString });
                            }
                        } catch (e) {
                            console.error("Error updating user permissions", e);
                        }
                    }
                    
                    if (scategorieOpData && scategorieOpData.length > 0) {
                        for (const scatOp of scategorieOpData) {
                            const newScategorieOp = {
                                ID_OPERATION: operationId,
                                ID_SCATEGORIE: scatOp.idScat,
                                MONTANT_INITIALE: scatOp.montant,
                                MONTANT_FINALE: null
                            };
                            await addItem('T_SCATEGORIE_OP', newScategorieOp);
                        }
                    }

                    if (rubriqueOps && rubriqueOps.length > 0) {
                        for (const rop of rubriqueOps) {
                            await addItem('T_RUBRIQUE_OP', {
                                ID_OPERATION: operationId,
                                ID_RUBRIQUE: rop.idRubrique,
                                MONTANT_INITIALE: rop.montant,
                                MONTANT_FINALE: null
                            });
                        }
                    }

                    showToast('تمت إضافة العملية بنجاح', 'success');
                }
            });
            
            setIsModalOpen(false);
            setEditingOperation(undefined);
        } catch (error) {
            showToast('حدث خطأ أثناء حفظ العملية', 'error');
        }
    };

    const handleDeleteOperation = async (opId?: number) => {
        const targetId = opId !== undefined ? opId : selectedOperationId;
        if (targetId === null || targetId === undefined) return;
        const op = db.T_OPERATION.find(o => o.ID_OPERATION === targetId);
        
        if (op) {
            if (!isOperationCreator(op.CREATED_BY, currentUser) && currentUser.ROLE === 'admin') {
                alert('ليس لديك صلاحية حذف هذه العملية. فقط المستخدم الذي أضافها يمكنه حذفها.');
                return;
            }
        }

        const confirmed = await confirm('هل أنت متأكد أنك تريد حذف هذه العملية وجميع البيانات المرتبطة بها؟ لا يمكن التراجع عن هذا الإجراء.');
        if (confirmed) {
            showToast('جاري الحذف...', 'loading');
            try {
                await deleteOperation(targetId);
                showToast('تم حذف العملية بنجاح', 'success');
                if (selectedOperationId === targetId) setSelectedOperationId(null);
            } catch (error) {
                console.error("Delete operation failed", error);
                showToast('حدث خطأ أثناء حذف العملية', 'error');
            }
        }
    };
    
    const openAddModal = () => { 
        if (loading) {
            alert("يجب الانتظار حتى يتم تحديث النافذة");
            return;
        }
        setEditingOperation(undefined); 
        setFormKey(prev => prev + 1);
        setIsModalOpen(true); 
    };
    
    const openEditModal = (operationToEdit?: Operation) => { 
        if (loading) {
            alert("يجب الانتظار حتى يتم تحديث النافذة");
            return;
        }
        const op = operationToEdit || db.T_OPERATION.find(o => o.ID_OPERATION === selectedOperationId); 
        if (op) { 
            if (!isOperationCreator(op.CREATED_BY, currentUser) && currentUser.ROLE !== 'admin') {
                alert('ليس لديك صلاحية تعديل هذه العملية. فقط المستخدم الذي أضافها يمكنه تعديلها.');
                return;
            }
            setEditingOperation(op); 
            setFormKey(prev => prev + 1);
            setIsModalOpen(true); 
        } 
    };

    const handleExportOperations = () => {
        if (displayData.rows.length === 0) {
            alert('لا توجد بيانات للتصدير.');
            return;
        }
    
        const headers = [
            t('col.status'),
            t('col.operation_info'), 
            t('col.ae'), 
            t('col.total_engagements'), 
            t('col.engagements_year', {year: selectedYear}), 
            t('col.remaining_ae'), 
            t('col.total_payments'), 
            t('col.cp_year', {year: selectedYear}), 
            "دفع السنة", 
            "باقي اعتماد الدفع"
        ];
    
        const styles = `
            <style>
                table, th, td {
                    border: 1px solid black;
                    border-collapse: collapse;
                    text-sm;
                    text-align: center;
                    padding: 5px;
                    font-family: Arial, sans-serif;
                    vertical-align: middle;
                }
                th {
                    background-color: #b3cee6;
                    font-light; text-align: center;
                }
                .subtotal {
                    background-color: #F8CBAD;
                    font-light: bold;
                }
                .grandtotal {
                    background-color: #A9D08E;
                    font-light: bold;
                }
                td {
                     mso-number-format:"\\#\\,##0\\.00";
                }
            </style>
        `;
    
        let tableHtml = `${styles}<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
    
        displayData.rows.forEach(item => {
            if (item.type === 'catHeader') {
                tableHtml += `<tr style="background-color: #1e3a8a; color: white; font-weight: bold;">
                    <td colspan="10">الصنف: ${item.catName} (${item.catCode})</td>
                </tr>`;
            } else if (item.type === 'activityHeader') {
                tableHtml += `<tr style="background-color: #1e40af; color: white; font-weight: bold;">
                    <td colspan="10">النشاط: ${item.activityName}</td>
                </tr>`;
            } else if (item.type === 'scatHeader') {
                tableHtml += `<tr style="background-color: #bbd7fc; font-weight: bold;">
                    <td colspan="10">الصنف الفرعي: ${item.scatName} ${item.scatCode !== 'NO_SCAT' ? `(${item.scatCode})` : ''}</td>
                </tr>`;
            } else if (item.type === 'sprgHeader') {
                tableHtml += `<tr style="background-color: #9ba7de; font-weight: bold;">
                    <td colspan="10">البرنامج: ${item.prgCode} | البرنامج الفرعي: ${item.sprgCode}</td>
                </tr>`;
            } else if (item.type === 'sprgSubtotal') {
                tableHtml += `<tr class="subtotal" style="font-weight: bold;">
                    <td colspan="2">${item.label}</td>
                    <td>${formatCurrency(item.aeFinale)}</td>
                    <td>${formatCurrency(item.totalEngagements)}</td>
                    <td>${formatCurrency(item.totalEngagementsCurrentYear)}</td>
                    <td>${formatCurrency(item.remainingAE)}</td>
                    <td>${formatCurrency(item.totalPaiements)}</td>
                    <td>${formatCurrency(item.cpFinaleCurrentYear)}</td>
                    <td>${formatCurrency(item.paiementsCurrentYear)}</td>
                    <td>${formatCurrency(item.remainingCP)}</td>
                </tr>`;
            } else if (item.type === 'subtotal') {
                tableHtml += `<tr style="background-color: #e2e8f0; font-weight: bold;">
                    <td colspan="2">${item.label}</td>
                    <td>${formatCurrency(item.aeFinale)}</td>
                    <td>${formatCurrency(item.totalEngagements)}</td>
                    <td>${formatCurrency(item.totalEngagementsCurrentYear)}</td>
                    <td>${formatCurrency(item.remainingAE)}</td>
                    <td>${formatCurrency(item.totalPaiements)}</td>
                    <td>${formatCurrency(item.cpFinaleCurrentYear)}</td>
                    <td>${formatCurrency(item.paiementsCurrentYear)}</td>
                    <td>${formatCurrency(item.remainingCP)}</td>
                </tr>`;
            } else {
                const op = item;
                tableHtml += `<tr>
                    <td>${op.status || 'جارية'}</td>
                    <td style="text-align:right; text-[10px];"><b>${op.N_OPERATION}</b><br/>${op.INT_OPERATION}</td>
                    <td>${formatCurrency(op.aeFinale)}</td>
                    <td>${formatCurrency(op.totalEngagements)}</td>
                    <td>${formatCurrency(op.totalEngagementsCurrentYear)}</td>
                    <td>${formatCurrency(op.remainingAE)}</td>
                    <td>${formatCurrency(op.totalPaiements)}</td>
                    <td>${formatCurrency(op.cpFinaleCurrentYear)}</td>
                    <td>${formatCurrency(op.paiementsCurrentYear)}</td>
                    <td>${formatCurrency(op.remainingCP)}</td>
                </tr>`;
            }
        });
        
        tableHtml += `</tbody>`;
    
        if (displayData.grandTotal) {
            const total = displayData.grandTotal;
            tableHtml += `<tfoot><tr class="grandtotal">
                <td colspan="2">${t('lbl.total_general')}</td>
                <td>${formatCurrency(total.aeFinale)}</td>
                <td>${formatCurrency(total.totalEngagements)}</td>
                <td>${formatCurrency(total.totalEngagementsCurrentYear)}</td>
                <td>${formatCurrency(total.remainingAE)}</td>
                <td>${formatCurrency(total.totalPaiements)}</td>
                <td>${formatCurrency(total.cpFinaleCurrentYear)}</td>
                <td>${formatCurrency(total.paiementsCurrentYear)}</td>
                <td>${formatCurrency(total.remainingCP)}</td>
            </tr></tfoot>`;
        }
        tableHtml += `</table>`;
        exportToFormattedExcel(tableHtml, `operations_${selectedYear}_${selectedActivity || 'all'}.xls`);
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
                let errorCount = 0;
                const errors: string[] = [];
                const newOperationIds: number[] = [];

                await runInTransaction(async () => {
                    for (const [index, row] of (json as any[]).entries()) {
                        try {
                            const nOperation = String(row['رقم العملية'] || '').trim();
                            const intOperation = String(row['عنوان العملية'] || '').trim();
                            const cCategorie = String(row['رمز الصنف'] || '').trim();
                            const status: 'جارية' | 'مغلقة' = String(row['الحالة'] || 'جارية').trim() === 'مغلقة' ? 'مغلقة' : 'جارية';
                            const cScategorie = String(row['رمز الصنف الفرعي الأولي'] || '').trim();
                            const montantInitiale = parseFloat(row['المبلغ الأولي']);

                            if (!nOperation || !intOperation || !cCategorie || !cScategorie || isNaN(montantInitiale)) {
                                errors.push(`السطر ${index + 2}: الحقول الأساسية مفقودة أو غير صالحة.`);
                                errorCount++; continue;
                            }
                            
                            const categorie = db.T_CATEGORIE.find(c => c.C_CATEGORIE === cCategorie);
                            if (!categorie) {
                                errors.push(`السطر ${index + 2}: لم يتم العثور على الصنف بالرمز '${cCategorie}'.`);
                                errorCount++; continue;
                            }
                            
                            const scategorie = db.T_SCATEGORIE.find(sc => sc.C_SCATEGORIE === cScategorie && sc.ID_CATEGORIE === categorie.ID_CATEGORIE);
                            if (!scategorie) {
                                errors.push(`السطر ${index + 2}: لم يتم العثور على الصنف الفرعي بالرمز '${cScategorie}' ضمن الصنف '${cCategorie}'.`);
                                errorCount++; continue;
                            }

                            const operationData = {
                                N_OPERATION: nOperation,
                                N_OPERATION_ANCIEN: String(row['رقم العملية القديم'] || '').trim() || null,
                                INT_OPERATION: intOperation,
                                ID_CATEGORIE: categorie.ID_CATEGORIE,
                                status: status,
                                CREATED_BY: currentUser.USERNAME // Assign current user as creator
                            };

                            const scategorieOpData = {
                                idScat: scategorie.ID_SCATEGORIE,
                                montant: montantInitiale,
                            };

                            // Replicating handleSaveOperation logic manually to avoid state updates during transaction
                            const newOperation = await addItem('T_OPERATION', operationData);
                            newOperationIds.push(newOperation.ID_OPERATION);

                            const newScategorieOp = {
                                ID_OPERATION: newOperation.ID_OPERATION,
                                ID_SCATEGORIE: scategorieOpData.idScat,
                                MONTANT_INITIALE: scategorieOpData.montant,
                                MONTANT_FINALE: null
                            };
                            await addItem('T_SCATEGORIE_OP', newScategorieOp);
                            
                            successCount++;

                        } catch (innerError) {
                            console.error("Error processing row:", row, innerError);
                            errors.push(`السطر ${index + 2}: خطأ غير متوقع أثناء المعالجة.`);
                            errorCount++;
                        }
                    }

                    // Update user permissions after all imports
                    if (currentUser.ROLE !== 'admin' && newOperationIds.length > 0) {
                        try {
                            const currentAllowed = currentUser.ALLOWED_OPERATIONS ? JSON.parse(currentUser.ALLOWED_OPERATIONS) : [];
                            const updatedAllowed = Array.from(new Set([...currentAllowed, ...newOperationIds]));
                            const updatedAllowedString = JSON.stringify(updatedAllowed);
                            await updateItem('T_USER', currentUser.ID_USER, { ALLOWED_OPERATIONS: updatedAllowedString });
                            onUpdateUser({ ...currentUser, ALLOWED_OPERATIONS: updatedAllowedString });
                        } catch (e) {
                            console.error("Error updating user permissions after import", e);
                        }
                    }
                });
                
                let summaryMessage = `اكتمل الاستيراد.\nتمت إضافة ${successCount} عمليات بنجاح.\nفشلت إضافة ${errorCount} من السجلات.`;
                if (errors.length > 0) {
                    summaryMessage += "\n\nالأخطاء:\n" + errors.slice(0, 5).join('\n');
                    if (errors.length > 5) summaryMessage += `\n... و ${errors.length - 5} أخطاء أخرى.`
                }
                
                if (successCount > 0) showToast(`تم استيراد ${successCount} عمليات بنجاح`, 'success');
                else if (errorCount > 0) showToast('فشل الاستيراد، راجع التفاصيل', 'error');
                
                alert(summaryMessage);

            } catch (error) {
                alert('فشل استيراد البيانات. يرجى التحقق من أن الملف بصيغة Excel صحيحة وأن الأعمدة مطابقة للنموذج المطلوب.');
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    if (loading) return <div className="p-8 text-center">{t('loading')}</div>;
    
    return (
        <PageWrapper title={t('page.operations')} navigate={navigate} onGoBack={onGoBack} currentUser={currentUser} breadcrumb={[]} className="max-w-none px-2 sm:px-4">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
            <div className="sticky top-0 z-40 bg-[#f8fafc] pb-2">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 mb-1">
                    <div className="flex flex-col xl:flex-row gap-2 py-0 items-center justify-between">
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label htmlFor="year-filter" className="flex items-center text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                                    {t('filter.year')}
                                </label>
                                <CustomDropdown
                                    options={availableYears.map(year => ({ value: year, label: year }))}
                                    value={selectedYear}
                                    onChange={setSelectedYear}
                                    placeholder={t('filter.select_year')}
                                    className="h-9"
                                />
                            </div>
                            <div>
                                <label htmlFor="activity-filter" className="flex items-center text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                                    {t('filter.activity')}
                                </label>
                                <CustomDropdown
                                    options={[{ value: '', label: t('filter.all_activities') }, ...activities]}
                                    value={selectedActivity}
                                    onChange={setSelectedActivity}
                                    placeholder={t('filter.select_activity')}
                                    className="h-9 w-full"
                                />
                            </div>
                            <div>
                                <label htmlFor="typeop-filter" className="flex items-center text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                                    نوع العملية
                                </label>
                                <CustomDropdown
                                    options={[
                                        { value: 'all', label: 'كل الأنواع' },
                                        ...uniqueTypeOps.map(t => ({ value: t, label: t }))
                                    ]}
                                    value={selectedTypeOp}
                                    onChange={setSelectedTypeOp}
                                    placeholder="اختر نوع العملية"
                                    className="h-9 w-full"
                                />
                            </div>
                        </div>
                        
                        <div className="flex-none flex flex-wrap gap-2 items-center pt-2 xl:pt-4">
                            <button onClick={() => navigate('PRINT_OPERATIONS_TABLE')} className="bg-blue-50 text-blue-600 border border-blue-400 px-3 py-1.5 rounded-[20px] shadow-sm hover:bg-blue-100 transition-all flex items-center justify-center text-xs font-bold h-8">
                                <i className="bi bi-printer ml-1.5"></i> {t('btn.print')}
                            </button>
                            <button onClick={handleExportOperations} className="bg-teal-50 text-teal-600 border border-teal-400 px-3 py-1.5 rounded-[20px] shadow-sm hover:bg-teal-100 transition-all flex items-center justify-center text-xs font-bold h-8">
                                <i className="bi bi-file-earmark-excel ml-1.5"></i> {t('btn.export')}
                            </button>
                            
                            {!isViewer && (
                                <div className="flex gap-2 items-center">
                                    <button onClick={openAddModal} className="bg-sky-50 text-blue-600 px-3 py-1.5 border border-blue-400 rounded-[20px] shadow-md hover:bg-sky-100 transition-all flex items-center justify-center text-xs font-bold h-8">
                                        <i className="bi bi-plus-circle ml-1.5"></i> {t('btn.add')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 mt-1 flex-1 flex flex-col">
                <div className="overflow-auto max-h-[calc(95vh-280px)] min-h-[450px] custom-scrollbar">
                    <table className="w-full text-center min-w-full border-collapse relative text-[11px]">
                        <thead className="bg-sky-100 text-gray-700 sticky top-0 z-20 shadow-xs">
                            <tr className="border-b border-gray-200">
                                <th className="py-2 px-1 text-[10px] font-bold uppercase tracking-wider text-center w-10 sticky top-0 bg-sky-100 z-20">{t('col.details')}</th>
                                <th className="py-2 px-1 text-[10px] font-bold uppercase tracking-wider text-center w-20 sticky top-0 bg-sky-100 z-20">
                                    <div className="flex flex-col gap-0.5 items-center justify-center">
                                        <span>{t('col.status')}</span>
                                        <select
                                            className="text-[9px] bg-white border border-blue-200 rounded px-1 py-0.5 font-bold outline-none cursor-pointer focus:border-blue-400 w-full h-5 text-center normal-case shadow-xs"
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                        >
                                            <option value="all">الكل</option>
                                            <option value="جارية">جارية</option>
                                            <option value="مغلقة">مغلقة</option>
                                        </select>
                                    </div>
                                </th>
                                 <th className="py-2 px-1.5 text-[10px] font-bold uppercase tracking-wider text-right min-w-[170px] max-w-[260px] sticky top-0 bg-sky-100 z-20">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between text-right">
                                            <span>{t('col.operation_info')}</span>
                                            <div className="flex gap-1 rounded bg-blue-100">
                                                <button 
                                                    onClick={() => setShowSearchQuery(!showSearchQuery)}
                                                    className={`p-0.5 rounded transition-colors ${showSearchQuery || searchQuery ? 'bg-blue-300 text-blue-600' : 'hover:bg-blue-200 text-gray-400'}`}
                                                    title="بحث برقم أو عنوان العملية"
                                                >
                                                    <Search size={11} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {(showSearchQuery || searchQuery) && (
                                            <div className="relative animate-in slide-in-from-top-1 duration-200">
                                                <input
                                                    type="text"
                                                    placeholder="رقم أو عنوان العملية..."
                                                    className="w-full h-6 px-1.5 py-0.5 bg-white border border-blue-200 rounded text-[9px] font-medium normal-case focus:border-blue-400 outline-none"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    autoFocus
                                                />
                                                {searchQuery && (
                                                    <button onClick={() => setSearchQuery('')} className="absolute left-1 top-1 text-gray-400 hover:text-red-500">
                                                        <X size={9} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </th>
                                <th className="py-2 px-1 text-[10px] font-bold uppercase tracking-wider sticky top-0 bg-sky-100 z-20 whitespace-nowrap">{t('col.ae')}</th>
                                <th className="py-2 px-1 text-[10px] font-bold uppercase tracking-wider sticky top-0 bg-sky-100 z-20 whitespace-nowrap">{t('col.total_engagements')}</th>
                                <th className="py-2 px-1 text-[10px] font-bold uppercase tracking-wider sticky top-0 bg-sky-100 z-20 whitespace-nowrap">{t('col.engagements_year', {year: selectedYear})}</th>
                                <th className="py-2 px-1 text-[10px] font-bold uppercase tracking-wider sticky top-0 bg-sky-100 z-20 whitespace-nowrap">{t('col.remaining_ae')}</th>
                                <th className="py-2 px-1 text-[10px] font-bold uppercase tracking-wider sticky top-0 bg-sky-100 z-20 whitespace-nowrap">{t('col.total_payments')}</th>
                                <th className="py-2 px-1 text-[10px] font-bold uppercase tracking-wider sticky top-0 bg-sky-100 z-20 whitespace-nowrap">{t('col.cp_year', {year: selectedYear})}</th>
                                <th className="py-2 px-1 text-[10px] font-bold uppercase tracking-wider sticky top-0 bg-sky-100 z-20 whitespace-nowrap">{t('col.payments_year', {year: selectedYear})}</th>
                                <th className="py-2 px-1 text-[10px] font-bold uppercase tracking-wider sticky top-0 bg-sky-100 z-20 whitespace-nowrap">باقي اعتماد</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayData.rows.map(item => {
                                if (item.type === 'catHeader') {
                                    return (
                                        <tr key={item.id} className="bg-blue-600 text-white font-bold text-xs">
                                            <td colSpan={11} className="py-1.5 px-3 text-right shadow-inner">
                                                <div className="flex items-center gap-1.5">
                                                    <i className="bi bi-folder-fill text-xs"></i>
                                                    <span>الصنف: {item.catName}</span>
                                                    <span className="opacity-80 text-[10px] px-1.5 py-0.2 bg-blue-500 rounded ml-2 font-mono">{item.catCode}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }
                                if (item.type === 'scatHeader') {
                                    return (
                                        <tr key={item.id} className="bg-blue-100 text-blue-800 font-bold text-[11px] border-y border-blue-100 italic">
                                            <td colSpan={11} className="py-1 px-5 text-right underline decoration-blue-200 decoration-2 underline-offset-2">
                                                <i className="bi bi-arrow-return-left ml-1.5 text-blue-400"></i>
                                                الصنف الفرعي: {item.scatName} {item.scatCode !== 'NO_SCAT' ? `(${item.scatCode})` : ''}
                                            </td>
                                        </tr>
                                    );
                                }
                                if (item.type === 'sprgHeader') {
                                    return (
                                        <tr key={item.id} className="bg-gray-300 text-gray-500 font-medium text-[9px] uppercase tracking-wider border-b border-gray-200">
                                            <td colSpan={11} className="py-0.5 px-8 text-right">
                                                <span className="inline-flex items-center">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1.5"></span>
                                                    البرنامج: {item.prgCode} <i className="bi bi-dot mx-1"></i> البرنامج الفرعي: {item.sprgCode}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                }
                                if (item.type === 'sprgSubtotal' || item.type === 'subtotal') {
                                    const isScat = item.type === 'subtotal';
                                    return (
                                        <tr key={item.id} className={`${isScat ? 'bg-gray-300' : 'bg-gray-200'} font-bold text-[11px] border-b border-gray-200`}>
                                            <td colSpan={3} className="py-1.5 px-3 text-left pl-6">{item.label}</td>
                                            <td className="py-1.5 px-1 whitespace-nowrap text-center">{formatCurrency(item.aeFinale)}</td>
                                            <td className="py-1.5 px-1 whitespace-nowrap text-center">{formatCurrency(item.totalEngagements)}</td>
                                            <td className="py-1.5 px-1 text-amber-700 whitespace-nowrap text-center">{formatCurrency(item.totalEngagementsCurrentYear)}</td>
                                            <td className="py-1.5 px-1 text-rose-600 font-bold whitespace-nowrap text-center">{formatCurrency(item.remainingAE)}</td>
                                            <td className="py-1.5 px-1 whitespace-nowrap text-center">{formatCurrency(item.totalPaiements)}</td>
                                            <td className="py-1.5 px-1 text-indigo-700 whitespace-nowrap text-center">{formatCurrency(item.cpFinaleCurrentYear)}</td>
                                            <td className="py-1.5 px-1 text-emerald-600 font-bold whitespace-nowrap text-center">{formatCurrency(item.paiementsCurrentYear)}</td>
                                            <td className="py-1.5 px-1 text-rose-600 font-bold whitespace-nowrap text-center">{formatCurrency(item.remainingCP)}</td>
                                        </tr>
                                    );
                                }

                                return (
                                    <OperationRow 
                                        key={item.ID_OPERATION}
                                        op={item}
                                        isSelected={selectedOperationId === item.ID_OPERATION}
                                        onSelect={setSelectedOperationId}
                                        navigate={navigate}
                                        onEdit={openEditModal}
                                        onDelete={handleDeleteOperation}
                                        currentUser={currentUser}
                                        isViewer={isViewer}
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls (matching Documents table style) */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border-y border-blue-200 text-xs select-none">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-700 font-medium text-[11px]">
                            عرض <span className="font-bold text-blue-700">{pageSize === 'all' ? 1 : (safeCurrentPage - 1) * (pageSize as number) + 1}</span> إلى <span className="font-bold text-blue-700">{pageSize === 'all' ? totalRows : Math.min(safeCurrentPage * (pageSize as number), totalRows)}</span> من أصل <span className="font-bold text-gray-900">{totalRows}</span> عملية
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
                                className="h-6 px-1.5 bg-white border border-gray-300 rounded text-[11px] font-bold outline-none focus:ring-1 focus:ring-blue-500"
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
                                onClick={() => { setCurrentPage(1); }}
                                disabled={safeCurrentPage === 1}
                                className="p-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white text-gray-700 transition cursor-pointer disabled:cursor-not-allowed"
                                title="الصفحة الأولى"
                            >
                                <ChevronsRight size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={safeCurrentPage === totalPages}
                                className="p-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white text-gray-700 transition cursor-pointer disabled:cursor-not-allowed"
                                title="الصفحة التالية"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={safeCurrentPage === totalPages}
                                className="p-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white text-gray-700 transition cursor-pointer disabled:cursor-not-allowed"
                                title="الصفحة الأخيرة"
                            >
                                <ChevronsLeft size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {displayData.grandTotal && (
                    <div className="py-2.5 px-4 bg-slate-900 text-white flex flex-wrap justify-between items-center gap-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] relative z-10 text-xs">
                        <div className="flex items-center gap-2">
                            <i className="bi bi-info-circle text-blue-400"></i>
                            <span className="font-bold text-xs">{t('lbl.total_general')}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-2">
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-400 uppercase tracking-tighter">إجمالي AE</span>
                                <span className="text-xs font-bold text-blue-400 font-mono">{formatCurrency(displayData.grandTotal.aeFinale)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-400 uppercase tracking-tighter">إجمالي الإلتزامات</span>
                                <span className="text-xs font-bold text-amber-400 font-mono">{formatCurrency(displayData.grandTotal.totalEngagements)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-400 uppercase tracking-tighter">رخصة AE المتبقية</span>
                                <span className="text-xs font-bold text-rose-400 font-mono">{formatCurrency(displayData.grandTotal.remainingAE)}</span>
                            </div>
                            <div className="flex flex-col border-r border-gray-700 pr-5">
                                <span className="text-[9px] text-gray-400 uppercase tracking-tighter">إجمالي CP السنة</span>
                                <span className="text-xs font-bold text-indigo-400 font-mono">{formatCurrency(displayData.grandTotal.cpFinaleCurrentYear)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-400 uppercase tracking-tighter">إجمالي الدفع السنة</span>
                                <span className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(displayData.grandTotal.paiementsCurrentYear)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-400 uppercase tracking-tighter">متبقي CP السنة</span>
                                <span className="text-xs font-bold text-rose-400 font-mono">{formatCurrency(displayData.grandTotal.remainingCP)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
             <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingOperation(undefined); }} title={editingOperation ? "تعديل عملية" : "إضافة عملية جديدة"} maxWidth="lg">
                <AddOperationForm 
                    key={formKey}
                    onClose={() => { setIsModalOpen(false); setEditingOperation(undefined); }} 
                    onSave={handleSaveOperation}
                    categories={db.T_CATEGORIE}
                    scategories={db.T_SCATEGORIE}
                    rubriques={db.T_RUBRIQUE}
                    initialData={editingOperation}
                />
            </Modal>
        </PageWrapper>
    );
};

export default OperationsPage;
