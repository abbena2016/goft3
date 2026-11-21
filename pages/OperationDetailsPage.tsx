import React, { useState, useMemo, useEffect } from 'react';
import { Page, Database, Operation, Categorie, Cp, RubriqueOp, ScategorieOp, LotOperation, Engagement, Paiement, User } from '../types';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfirm } from '../context/ConfirmContext';
import PageWrapper from '../components/PageWrapper';
import Modal from '../components/Modal';
import Card from '../components/Card';
import AddCpForm from '../components/forms/AddCpForm';
import AddRubriqueOpForm from '../components/forms/AddRubriqueOpForm';
import AddScategorieOpForm from '../components/forms/AddScategorieOpForm';
import AddLotForm from '../components/forms/AddLotForm';
import AddEngagementForm from '../components/forms/AddEngagementForm';
import AddPaiementForm from '../components/forms/AddPaiementForm';
import AddBordereauForm from '../components/forms/AddBordereauForm';
import { formatCurrency } from '../utils/currencyUtils';
import { isOperationCreator } from '../utils/authUtils';
import { normalizeDate } from '../utils/dateUtils';
import { exportToFormattedExcel } from '../utils/exportToCsv';
import CustomDropdown from '../components/CustomDropdown';

// Arabic normalization helper to handle flexible text matching
const normalizeArabic = (text: string): string => {
    if (!text) return '';
    return text
        .trim()
        .replace(/[\u064B-\u0652]/g, '') // remove diacritics
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/\s+/g, ' ');
};

const isUnallocatedText = (text: string): boolean => {
    const normalizedText = normalizeArabic(text);
    const normalizedKeywords = [
        'غير موزع',
        'غير موزعة',
        'مبالغ غير موزعة',
        'مبلغ العملية غير الموزع',
        'غير الموزع',
        'مبلغ غير موزع'
    ].map(normalizeArabic);
    return normalizedKeywords.some(keyword => normalizedText.includes(keyword));
};

interface OperationDetailsPageProps {
    navigate: (page: Page, id?: number, tab?: string) => void;
    operationId: number;
    initialTab?: string;
    onGoBack?: () => void;
    currentUser: User;
}

const OperationDetailsPage: React.FC<OperationDetailsPageProps> = ({ navigate, operationId, initialTab, onGoBack, currentUser }) => {
    const { db, loading, addItem, updateItem, deleteItem, runInTransaction, broadcastEvent } = useData();
    const { showToast } = useToast();
    const { t } = useLanguage();
    const { confirm } = useConfirm();

    const operation: Operation | undefined = db.T_OPERATION.find(op => Number(op.ID_OPERATION) === Number(operationId));

    // Safety check: if operationId is missing or operation doesn't exist, go back to list entirely
    // Also check if current user is allowed to see this operation
    useEffect(() => {
        if (!loading) {
            if (!operationId || !operation) {
                navigate('OPERATIONS');
                return;
            }

            if (currentUser.ROLE !== 'admin' && currentUser.ALLOWED_OPERATIONS) {
                try {
                    const allowedOps = JSON.parse(currentUser.ALLOWED_OPERATIONS) as number[];
                    if (allowedOps.length > 0 && !allowedOps.includes(operationId)) {
                        navigate('HOME');
                    }
                } catch (e) {
                    console.error("Error parsing allowed operations", e);
                }
            }
        }
    }, [operationId, operation, loading, navigate, currentUser]);

    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'STRUCTURE' | 'LOTS' | 'ENGAGEMENTS' | 'PAIEMENTS' | 'BORDEREAUX'>('OVERVIEW');
    
    useEffect(() => {
        if (initialTab) {
            const [tabName, subId, color, action, pieceId] = initialTab.split(':');
            setActiveTab(tabName as any);
            
            if (subId && subId !== '0') {
                const parsedSubId = parseInt(subId, 10);
                if (tabName === 'ENGAGEMENTS') {
                    setSelectedengagementId(parsedSubId);
                    setSelectedEngObject('');
                    setSelectedEngYear('');
                    setSelectedEngBeneficiaryId('');
                }
                if (tabName === 'PAIEMENTS') {
                    setSelectedpaiementId(parsedSubId);
                    // Clear filters so the selected payment row is visible and rendered in the table
                    setSelectedPaiObject('');
                    setSelectedPaiYear('');
                    setSelectedPaiBeneficiaryId('');
                }
            }

            if (action === 'DIRECT_CREATE' && pieceId) {
                const parsedPieceId = parseInt(pieceId, 10);
                if (tabName === 'ENGAGEMENTS') {
                    setModalState({ type: 'ENGAGEMENT', extraData: { defaultPieceId: parsedPieceId }, timestamp: Date.now() });
                } else if (tabName === 'PAIEMENTS') {
                    setModalState({ type: 'PAIEMENT', extraData: { defaultPieceId: parsedPieceId }, timestamp: Date.now() });
                }
            }
            
            // Auto-scroll to section and highlight target row
            if (!loading) {
                const tryScrollAndHighlight = () => {
                    const sectionId = tabName === 'ENGAGEMENTS' ? 'engagements-section' : 
                                    tabName === 'PAIEMENTS' ? 'paiements-section' : 
                                    tabName === 'LOTS' ? 'lots-section' : 
                                    tabName === 'OVERVIEW' ? 'overview-section' : null;
                    if (sectionId) {
                        const element = document.getElementById(sectionId);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }

                    if (subId && subId !== '0') {
                        const rowId = `${tabName.toLowerCase()}-row-${subId}`;
                        const rowElement = document.getElementById(rowId);
                        if (rowElement) {
                            rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            // Apply animated highlight
                            const highlightClass = color === 'red' ? 'animate-highlight-red' : 
                                                 color === 'amber' ? 'animate-highlight-amber' : 
                                                 'animate-highlight-blue';
                            
                            rowElement.classList.remove('animate-highlight-red', 'animate-highlight-amber', 'animate-highlight-blue');
                            void rowElement.offsetWidth; // Force reflow
                            rowElement.classList.add(highlightClass);
                            setTimeout(() => rowElement.classList.remove(highlightClass), 3500);
                            return true;
                        }
                    } else if (sectionId) {
                        const element = document.getElementById(sectionId);
                        if (element) {
                            const highlightRing = color === 'red' ? 'ring-red-500' : 
                                                  color === 'amber' ? 'ring-amber-500' : 
                                                  'ring-blue-500';
                            
                            element.classList.add('ring-4', highlightRing, 'ring-opacity-30', 'transition-all', 'duration-500');
                            setTimeout(() => element.classList.remove('ring-4', highlightRing, 'ring-opacity-30'), 3000);
                        }
                    }
                    return false;
                };

                const timer1 = setTimeout(() => {
                    const success = tryScrollAndHighlight();
                    if (!success && subId && subId !== '0') {
                        setTimeout(tryScrollAndHighlight, 300);
                    }
                }, 150);

                return () => clearTimeout(timer1);
            }
        }
    }, [initialTab, loading]);

    const [modalState, setModalState] = useState<{
        type: 'CP' | 'RUBRIQUE_OP' | 'SCATEGORIE_OP' | 'LOT' | 'ENGAGEMENT' | 'PAIEMENT' | 'BORDEREAU' | null;
        data?: any;
        extraData?: any;
        timestamp?: number;
    }>({ type: null });

    const [printMenu, setPrintMenu] = useState<{ id: number, top: number, left: number } | null>(null);

    // Filter states for Engagements
    const [selectedEngObject, setSelectedEngObject] = useState<string>('');
    const [selectedEngYear, setSelectedEngYear] = useState<string>('');
    const [selectedEngBeneficiaryId, setSelectedEngBeneficiaryId] = useState<string>('');

    // Filter states for Payments
    const [selectedPaiObject, setSelectedPaiObject] = useState<string>('');
    const [selectedPaiYear, setSelectedPaiYear] = useState<string>('');
    const [selectedPaiBeneficiaryId, setSelectedPaiBeneficiaryId] = useState<string>('');

    const [selectedpaiementId, setSelectedpaiementId] = useState<number | null>(null);
    const [selectedengagementId, setSelectedengagementId] = useState<number | null>(null);
    const [selectedPaymentYear] = useState<string>(() => sessionStorage.getItem('goft3_selectedYear') || new Date().getFullYear().toString());

    // Lots display pagination
    const [lotsPageSize, setLotsPageSize] = useState<number | 'all'>(15);
    const [lotsCurrentPage, setLotsCurrentPage] = useState<number>(1);

    useEffect(() => {
        setLotsCurrentPage(1);
    }, [operationId]);

    const isViewer = currentUser.ROLE === 'viewer';

    useEffect(() => {
        const handleClickOutside = () => {
            setPrintMenu(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handlePrintClick = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
        e.stopPropagation();
        setSelectedpaiementId(id);
        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const menuHeight = 200;
        let top = rect.bottom;
        if (spaceBelow < menuHeight) {
            top = rect.top - menuHeight;
        }
        setPrintMenu({ id, top, left: rect.left });
    };

    const categorie: Categorie | undefined = operation ? db.T_CATEGORIE.find(c => c.ID_CATEGORIE === operation.ID_CATEGORIE) : undefined;

    const canEdit = useMemo(() => {
        if (!operation) return false;
        return isOperationCreator(operation.CREATED_BY, currentUser) || currentUser.ROLE === 'admin';
    }, [operation, currentUser]);

    const handlePermissionCheck = (action: () => void) => {
        if (loading) {
            alert("يجب الانتظار حتى يتم تحديث النافذة");
            return;
        }
        if (canEdit && !isViewer) {
            action();
        } else {
            alert('ليس لديك صلاحية التعديل على هذه العملية.');
        }
    };

    const cps: Cp[] = useMemo(() => {
        if (!operationId) return [];
        return db.T_CP.filter(cp => Number(cp.ID_OPERATION) === Number(operationId)).sort((a, b) => parseInt(a.ANNEE) - parseInt(b.ANNEE));
    }, [db.T_CP, operationId]);

    const rubriquesOp: RubriqueOp[] = useMemo(() => {
        if (!operationId) return [];
        return db.T_RUBRIQUE_OP
            .filter(r => Number(r.ID_OPERATION) === Number(operationId))
            .sort((a, b) => {
                const rubNameA = db.T_RUBRIQUE.find(r => Number(r.ID_RUBRIQUE) === Number(a.ID_RUBRIQUE))?.RUBRIQUE || '';
                const rubNameB = db.T_RUBRIQUE.find(r => Number(r.ID_RUBRIQUE) === Number(b.ID_RUBRIQUE))?.RUBRIQUE || '';
                const aIsUnallocated = isUnallocatedText(rubNameA);
                const bIsUnallocated = isUnallocatedText(rubNameB);

                if (aIsUnallocated && !bIsUnallocated) return 1;
                if (!aIsUnallocated && bIsUnallocated) return -1;
                return a.ID_RUBRIQUE_OP - b.ID_RUBRIQUE_OP;
            });
    }, [db.T_RUBRIQUE_OP, db.T_RUBRIQUE, operationId]);

    const scategoriesOp: ScategorieOp[] = useMemo(() => {
        if (!operationId) return [];
        return db.T_SCATEGORIE_OP
            .filter(s => Number(s.ID_OPERATION) === Number(operationId))
            .sort((a, b) => {
                const scatA = db.T_SCATEGORIE.find(s => Number(s.ID_SCATEGORIE) === Number(a.ID_SCATEGORIE));
                const scatB = db.T_SCATEGORIE.find(s => Number(s.ID_SCATEGORIE) === Number(b.ID_SCATEGORIE));
                const aIsUnallocated = scatA ? isUnallocatedText(scatA.INT_SCATEGORIE) : false;
                const bIsUnallocated = scatB ? isUnallocatedText(scatB.INT_SCATEGORIE) : false;

                if (aIsUnallocated && !bIsUnallocated) return 1;
                if (!aIsUnallocated && bIsUnallocated) return -1;
                return a.ID_SCATEGORIE_OP - b.ID_SCATEGORIE_OP;
            });
    }, [db.T_SCATEGORIE_OP, db.T_SCATEGORIE, operationId]);
    const lots: LotOperation[] = useMemo(() => db.T_LOT_OPERATION.filter(l => Number(l.ID_OPERATION) === Number(operationId)).sort((a,b) => a.ID_LOT - b.ID_LOT), [db.T_LOT_OPERATION, operationId]);
    const lotsTotalPages = lotsPageSize === 'all' ? 1 : Math.ceil(lots.length / (lotsPageSize as number)) || 1;
    const safeLotsPage = Math.min(Math.max(lotsCurrentPage, 1), lotsTotalPages);
    const paginatedLots = useMemo(() => {
        if (lotsPageSize === 'all') return lots;
        const start = (safeLotsPage - 1) * (lotsPageSize as number);
        return lots.slice(start, start + (lotsPageSize as number));
    }, [lots, safeLotsPage, lotsPageSize]);
    const engagements: Engagement[] = useMemo(() => db.T_ENGAGEMENT.filter(e => Number(e.ID_OPERATION) === Number(operationId)), [db.T_ENGAGEMENT, operationId]);
    const paiements: Paiement[] = useMemo(() => db.T_PAIEMENT.filter(p => Number(p.ID_OPERATION) === Number(operationId)), [db.T_PAIEMENT, operationId]);
    const bordereaux = useMemo(() => {
        const opBordereauIds = new Set(
            db.T_ENGAGEMENT
                .filter(e => Number(e.ID_OPERATION) === Number(operationId) && e.ID_BORDEREAU)
                .map(e => e.ID_BORDEREAU)
        );
        return (db.T_BORDEREAU || [])
            .filter(b => opBordereauIds.has(b.ID_BORDEREAU))
            .sort((a, b) => Number(b.ID_BORDEREAU) - Number(a.ID_BORDEREAU));
    }, [db.T_BORDEREAU, db.T_ENGAGEMENT, operationId]);
    
    const operationPieces = useMemo(() => db.T_PIECE.filter(p => Number(p.ID_OPERATION) === Number(operationId)), [db.T_PIECE, operationId]);

    // Data for Engagements Filtering
    const engYears = useMemo(() => [...new Set(engagements.map(e => e.ANNEE))].sort((a, b) => b.localeCompare(a)), [engagements]);
    const engBeneficiaries = useMemo(() => {
        const benIds = new Set(engagements.map(e => {
            const p = db.T_PIECE.find(piece => piece.ID_PIECE === e.ID_PIECE);
            return p?.ID_BENEFICIAIRE;
        }).filter(id => id !== null && id !== undefined));
        return db.T_BENEFICIAIRE.filter(b => benIds.has(b.ID_BENEFICIAIRE)).sort((a, b) => a.BENEFICIAIRE.localeCompare(b.BENEFICIAIRE));
    }, [engagements, db.T_PIECE, db.T_BENEFICIAIRE]);
    
    const engObjects = useMemo(() => {
        const objects = new Set(engagements.map(e => e.OBJET_ENG));
        return Array.from(objects).sort();
    }, [engagements]);

    // Data for Payments Filtering
    const paiYears = useMemo(() => [...new Set(paiements.map(p => p.ANNEE))].sort((a, b) => b.localeCompare(a)), [paiements]);
    const paiBeneficiaries = useMemo(() => {
        const benIds = new Set(paiements.map(p => {
            const piece = db.T_PIECE.find(pc => pc.ID_PIECE === p.ID_PIECE);
            return piece?.ID_BENEFICIAIRE;
        }).filter(id => id !== null && id !== undefined));
        return db.T_BENEFICIAIRE.filter(b => benIds.has(b.ID_BENEFICIAIRE)).sort((a, b) => a.BENEFICIAIRE.localeCompare(b.BENEFICIAIRE));
    }, [paiements, db.T_PIECE, db.T_BENEFICIAIRE]);

    const paiObjects = useMemo(() => {
        const objects = new Set(paiements.map(p => p.OBJET_PAI));
        return Array.from(objects).sort();
    }, [paiements]);

    const filteredEngagements = useMemo(() => {
        return engagements.filter(e => {
            const matchesObject = !selectedEngObject || e.OBJET_ENG === selectedEngObject;
            const matchesYear = !selectedEngYear || e.ANNEE === selectedEngYear;
            let matchesBeneficiary = true;
            if (selectedEngBeneficiaryId) {
                const piece = db.T_PIECE.find(p => p.ID_PIECE === e.ID_PIECE);
                matchesBeneficiary = Number(piece?.ID_BENEFICIAIRE) === Number(selectedEngBeneficiaryId);
            }
            return matchesObject && matchesYear && matchesBeneficiary;
        }).sort((a, b) => a.ID_ENGAGEMENT - b.ID_ENGAGEMENT);
    }, [engagements, selectedEngObject, selectedEngYear, selectedEngBeneficiaryId, db.T_PIECE]);

    const totalEngAmount = useMemo(() => {
        return filteredEngagements.reduce((sum, e) => {
            // Include all relevant natures: Commitment, Addendum, Invoice, Cancellation, Withdrawal
            if (['التزام', 'ملحق', 'فاتورة'].includes(e.NATURE_ENG)) {
                return sum + e.MONTANT_ENG;
            }
            if (['سحب', 'فسخ'].includes(e.NATURE_ENG)) {
                // Withdrawal reduces the total. Ensure it's treated as negative regardless of stored sign.
                return sum + (e.MONTANT_ENG < 0 ? e.MONTANT_ENG : -e.MONTANT_ENG);
            }
            return sum;
        }, 0);
    }, [filteredEngagements]);

    const filteredPaiements = useMemo(() => {
        return paiements.filter(p => {
            const matchesObject = !selectedPaiObject || p.OBJET_PAI === selectedPaiObject;
            const matchesYear = !selectedPaiYear || p.ANNEE === selectedPaiYear;
            let matchesBeneficiary = true;
            if (selectedPaiBeneficiaryId) {
                const piece = db.T_PIECE.find(pc => pc.ID_PIECE === p.ID_PIECE);
                matchesBeneficiary = Number(piece?.ID_BENEFICIAIRE) === Number(selectedPaiBeneficiaryId);
            }
            return matchesObject && matchesYear && matchesBeneficiary;
        }).sort((a, b) => a.ID_PAIEMENT - b.ID_PAIEMENT);
    }, [paiements, selectedPaiObject, selectedPaiYear, selectedPaiBeneficiaryId, db.T_PIECE]);

    const totalPaiAmount = useMemo(() => {
        return filteredPaiements.reduce((sum, p) => sum + p.MONTANT_PAI, 0);
    }, [filteredPaiements]);

    const availableRubriques = useMemo(() => {
        const usedIds = new Set(rubriquesOp.map(r => r.ID_RUBRIQUE));
        if (modalState.type === 'RUBRIQUE_OP' && modalState.data) {
            usedIds.delete(Number(modalState.data.ID_RUBRIQUE));
        }
        return db.T_RUBRIQUE
            .filter(r => !usedIds.has(r.ID_RUBRIQUE))
            .sort((a, b) => {
                const aIsUnallocated = isUnallocatedText(a.RUBRIQUE);
                const bIsUnallocated = isUnallocatedText(b.RUBRIQUE);
                if (aIsUnallocated && !bIsUnallocated) return 1;
                if (!aIsUnallocated && bIsUnallocated) return -1;
                return a.RUBRIQUE.localeCompare(b.RUBRIQUE, 'ar');
            });
    }, [db.T_RUBRIQUE, rubriquesOp, modalState]);

    const availableScategories = useMemo(() => {
        const usedIds = new Set(scategoriesOp.map(s => s.ID_SCATEGORIE));
        if (modalState.type === 'SCATEGORIE_OP' && modalState.data) {
            usedIds.delete(Number(modalState.data.ID_SCATEGORIE));
        }
        return db.T_SCATEGORIE
            .filter(s => s.ID_CATEGORIE === operation?.ID_CATEGORIE && !usedIds.has(s.ID_SCATEGORIE))
            .sort((a, b) => {
                const aIsUnallocated = isUnallocatedText(a.INT_SCATEGORIE);
                const bIsUnallocated = isUnallocatedText(b.INT_SCATEGORIE);
                if (aIsUnallocated && !bIsUnallocated) return 1;
                if (!aIsUnallocated && bIsUnallocated) return -1;
                return a.INT_SCATEGORIE.localeCompare(b.INT_SCATEGORIE, 'ar');
            });
    }, [db.T_SCATEGORIE, scategoriesOp, operation, modalState]);

    const totalAE = useMemo(() => rubriquesOp.reduce((sum, r) => sum + (r.MONTANT_FINALE ?? r.MONTANT_INITIALE), 0), [rubriquesOp]);
    const totalCP = useMemo(() => cps.reduce((sum, c) => sum + c.MONTANT_FINALE_CP, 0), [cps]);
    const totalEngagedTotal = useMemo(() => 
        engagements.reduce((sum, e) => {
            if (['التزام', 'ملحق', 'فاتورة', 'فسخ', 'حكم قضائي'].includes(e.NATURE_ENG)) {
                return sum + e.MONTANT_ENG;
            }
            if (e.NATURE_ENG === 'سحب') {
                return sum + (e.MONTANT_ENG < 0 ? e.MONTANT_ENG : -e.MONTANT_ENG);
            }
            return sum;
        }, 0)
    , [engagements]);
    const totalPaidTotal = useMemo(() => paiements.reduce((sum, p) => sum + p.MONTANT_PAI, 0), [paiements]);

    const remainingAE = totalAE - totalEngagedTotal;
    const totalCpInitial = useMemo(() => cps.reduce((sum, item) => sum + item.MONTANT_INITIALE_CP, 0), [cps]);
    const totalCpFinal = useMemo(() => cps.reduce((sum, item) => sum + item.MONTANT_FINALE_CP, 0), [cps]);
    const totalRubriqueAmount = useMemo(() => rubriquesOp.reduce((sum, item) => sum + (item.MONTANT_FINALE ?? item.MONTANT_INITIALE), 0), [rubriquesOp]);
    const totalScatAmount = useMemo(() => scategoriesOp.reduce((sum, item) => sum + (item.MONTANT_FINALE ?? item.MONTANT_INITIALE), 0), [scategoriesOp]);
    const totalLotInitial = useMemo(() => lots.reduce((sum, item) => sum + item.MONTANT_INITIALE_LOT, 0), [lots]);
    const totalLotFinal = useMemo(() => lots.reduce((sum, item) => sum + item.MONTANT_FINALE_LOT, 0), [lots]);

    const { cpYearAmount, paidYearAmount, remainingCpYear } = useMemo(() => {
        const cpForYear = cps.find(c => c.ANNEE === selectedPaymentYear);
        const amountCP = cpForYear ? cpForYear.MONTANT_FINALE_CP : 0;
        const paymentsForYear = paiements.filter(p => p.ANNEE === selectedPaymentYear);
        const amountPaid = paymentsForYear.reduce((sum, p) => sum + p.MONTANT_PAI, 0);
        return { cpYearAmount: amountCP, paidYearAmount: amountPaid, remainingCpYear: amountCP - amountPaid };
    }, [cps, paiements, selectedPaymentYear]);

    const getTabForTable = (table: keyof Database) => {
        if (['T_CP', 'T_RUBRIQUE_OP', 'T_SCATEGORIE_OP'].includes(table)) return 'STRUCTURE';
        if (table === 'T_LOT_OPERATION') return 'LOTS';
        if (table === 'T_ENGAGEMENT') return 'ENGAGEMENTS';
        if (table === 'T_PAIEMENT') return 'PAIEMENTS';
        if (table === 'T_BORDEREAU') return 'BORDEREAUX';
        return 'OVERVIEW';
    };

    const syncStructureTables = async (rubriquesOverride?: RubriqueOp[], operationOverride?: Operation) => {
        if (!operationId || (!operation && !operationOverride)) return;

        const currentOperation = operationOverride || operation;
        if (!currentOperation) return;

        // 1. Get rubriques (use override if provided to avoid stale db state)
        const currentRubriquesOp = rubriquesOverride || db.T_RUBRIQUE_OP.filter(r => Number(r.ID_OPERATION) === Number(operationId));
        
        // 2. Identify unallocated rubriques
        const unallocatedRubriques = db.T_RUBRIQUE.filter(r => isUnallocatedText(r.RUBRIQUE));
        const unallocatedRubriqueIds = unallocatedRubriques.map(r => Number(r.ID_RUBRIQUE));
        
        // Find unallocated scategorie specifically in the current operation's category
        let unallocatedScat = db.T_SCATEGORIE.find(s => 
            Number(s.ID_CATEGORIE) === Number(currentOperation.ID_CATEGORIE) && isUnallocatedText(s.INT_SCATEGORIE)
        );
        
        const roadScat = db.T_SCATEGORIE.find(s => s.INT_SCATEGORIE.includes('المنشآت القاعدية للطرقات'));
        
        const unallocatedScatId = unallocatedScat ? Number(unallocatedScat.ID_SCATEGORIE) : undefined;
        const roadScatId = roadScat ? Number(roadScat.ID_SCATEGORIE) : undefined;
        
        // 3. Calculate totals:
        let initAllocated = 0;
        let finalAllocated = 0;
        let hasFinalAllocated = false;
        
        let initUnallocated = 0;
        let finalUnallocated = 0;
        let hasFinalUnallocated = false;
        
        currentRubriquesOp.forEach(rop => {
            const rubName = db.T_RUBRIQUE.find(r => Number(r.ID_RUBRIQUE) === Number(rop.ID_RUBRIQUE))?.RUBRIQUE || '';
            const isUnallocated = unallocatedRubriqueIds.some(id => Number(id) === Number(rop.ID_RUBRIQUE)) || isUnallocatedText(rubName);
            const rInit = rop.MONTANT_INITIALE || 0;
            const rFinal = rop.MONTANT_FINALE;
            
            if (isUnallocated) {
                initUnallocated += rInit;
                const effectiveFinal = (rFinal !== null && rFinal !== undefined) ? rFinal : rInit;
                finalUnallocated += effectiveFinal;
                if (rFinal !== null && rFinal !== undefined) hasFinalUnallocated = true;
            } else {
                initAllocated += rInit;
                const effectiveFinal = (rFinal !== null && rFinal !== undefined) ? rFinal : rInit;
                finalAllocated += effectiveFinal;
                if (rFinal !== null && rFinal !== undefined) hasFinalAllocated = true;
            }
        });
        
        // 4. Update ScatOps inside transaction
        await runInTransaction(async () => {
            let activeUnallocatedScatId = unallocatedScatId;
            
            // If the unallocated scategorie doesn't exist, automatically create it
            if (!activeUnallocatedScatId && initUnallocated > 0) {
                const currentCat = db.T_CATEGORIE.find(c => Number(c.ID_CATEGORIE) === Number(currentOperation.ID_CATEGORIE));
                const rawCatCode = currentCat?.C_CATEGORIE || '00';
                const cleanCatCode = rawCatCode.replace(/\s+/g, '');
                
                const newScat = await addItem('T_SCATEGORIE', {
                    ID_CATEGORIE: Number(currentOperation.ID_CATEGORIE),
                    C_SCATEGORIE: `${cleanCatCode}-00`,
                    INT_SCATEGORIE: 'مبلغ العملية غير الموزع'
                });
                activeUnallocatedScatId = Number(newScat.ID_SCATEGORIE);
            }
            
            // Determine main scategorie
            let mainScatId: number | undefined = undefined;
            if (Number(currentOperation.ID_SCATEGORIE || 0) !== Number(activeUnallocatedScatId || 0) && currentOperation.ID_SCATEGORIE !== null && currentOperation.ID_SCATEGORIE !== undefined) {
                mainScatId = Number(currentOperation.ID_SCATEGORIE);
            } else if (roadScatId) {
                mainScatId = Number(roadScatId);
            }
            
            if (!mainScatId) {
                const matchedScat = scategoriesOp.find(s => Number(s.ID_SCATEGORIE) !== Number(activeUnallocatedScatId));
                mainScatId = matchedScat ? Number(matchedScat.ID_SCATEGORIE) : undefined;
            }
            
            if (!mainScatId) {
                const otherScat = db.T_SCATEGORIE.find(s => Number(s.ID_CATEGORIE) === Number(currentOperation.ID_CATEGORIE) && !isUnallocatedText(s.INT_SCATEGORIE));
                mainScatId = otherScat ? Number(otherScat.ID_SCATEGORIE) : undefined;
            }
            
            const existingScatOps = db.T_SCATEGORIE_OP.filter(s => Number(s.ID_OPERATION) === Number(operationId));
            
            // Update Main Scategorie Op
            if (mainScatId) {
                const existingMainScatOp = existingScatOps.find(s => Number(s.ID_SCATEGORIE) === Number(mainScatId));
                const mainData = {
                    ID_OPERATION: Number(operationId),
                    ID_SCATEGORIE: Number(mainScatId),
                    MONTANT_INITIALE: initAllocated,
                    MONTANT_FINALE: hasFinalAllocated ? finalAllocated : null
                };
                
                if (existingMainScatOp) {
                    await updateItem('T_SCATEGORIE_OP', existingMainScatOp.ID_SCATEGORIE_OP, {
                        ...existingMainScatOp,
                        ...mainData
                    });
                } else if (initAllocated > 0) {
                    await addItem('T_SCATEGORIE_OP', mainData as any);
                }
            }
            
            // Update Unallocated Scategorie Op
            if (activeUnallocatedScatId && Number(activeUnallocatedScatId) !== Number(mainScatId)) {
                const existingUnallocatedScatOp = existingScatOps.find(s => Number(s.ID_SCATEGORIE) === Number(activeUnallocatedScatId));
                const unallocData = {
                    ID_OPERATION: Number(operationId),
                    ID_SCATEGORIE: Number(activeUnallocatedScatId),
                    MONTANT_INITIALE: initUnallocated,
                    MONTANT_FINALE: hasFinalUnallocated ? finalUnallocated : null
                };
                
                if (existingUnallocatedScatOp) {
                    await updateItem('T_SCATEGORIE_OP', existingUnallocatedScatOp.ID_SCATEGORIE_OP, {
                        ...existingUnallocatedScatOp,
                        ...unallocData
                    });
                } else if (initUnallocated > 0) {
                    await addItem('T_SCATEGORIE_OP', unallocData as any);
                }
            }

            // Reset other scat ops to preserve consistency
            for (const scatOp of existingScatOps) {
                if (Number(scatOp.ID_SCATEGORIE) !== Number(mainScatId) && Number(scatOp.ID_SCATEGORIE) !== Number(activeUnallocatedScatId)) {
                    await updateItem('T_SCATEGORIE_OP', scatOp.ID_SCATEGORIE_OP, {
                        ...scatOp,
                        MONTANT_INITIALE: 0,
                        MONTANT_FINALE: null
                    });
                }
            }
        });
    };

    const handleSave = async (table: keyof Database, data: any, idField: string) => {
        const targetTab = getTabForTable(table);
        navigate('OPERATION_DETAILS', operationId, targetTab);
        showToast('جاري الحفظ...', 'loading');
        try {
            let savedItem = data;
            if (data[idField]) {
                savedItem = await updateItem(table, data[idField], data);
                showToast('تم التعديل بنجاح', 'success');
            } else {
                savedItem = await addItem(table, data);
                showToast('تمت الإضافة بنجاح', 'success');
            }

            // Auto-update piece registration status
            if (table === 'T_ENGAGEMENT' && savedItem.ID_PIECE) {
                const piece = db.T_PIECE.find(p => p.ID_PIECE === Number(savedItem.ID_PIECE));
                if (piece && !piece.SAI_ENG) {
                    await updateItem('T_PIECE', piece.ID_PIECE, { ...piece, SAI_ENG: true });
                }
            } else if (table === 'T_PAIEMENT' && savedItem.ID_PIECE) {
                const piece = db.T_PIECE.find(p => p.ID_PIECE === Number(savedItem.ID_PIECE));
                if (piece && !piece.SAI_PAI) {
                    await updateItem('T_PIECE', piece.ID_PIECE, { ...piece, SAI_PAI: true });
                }
            }

            // Sync scategories if rubrique structure changed
            if (table === 'T_RUBRIQUE_OP' || table === 'T_OPERATION') {
                let currentRubriques = [...db.T_RUBRIQUE_OP.filter(r => Number(r.ID_OPERATION) === Number(operationId))];
                if (table === 'T_RUBRIQUE_OP') {
                    const idValue = (savedItem as any)[idField];
                    const existingIdx = idValue ? currentRubriques.findIndex(r => Number((r as any)[idField]) === Number(idValue)) : -1;
                    
                    if (existingIdx >= 0) {
                        currentRubriques[existingIdx] = savedItem;
                    } else {
                        currentRubriques.push(savedItem);
                    }

                    // Scan to detect if this rubrique represents 'Non-distributed amounts'
                    const rubrique = db.T_RUBRIQUE.find(r => Number(r.ID_RUBRIQUE) === Number(savedItem.ID_RUBRIQUE));
                    if (rubrique && isUnallocatedText(rubrique.RUBRIQUE)) {
                        console.log("رصد تعديل/إدخال في بند 'المبالغ غير الموزعة'. يتم الآن إرسال أمر تحديث ومزامنة تلقائي لجدول الأصناف الفرعية T_SCATEGORIE_OP.");
                    }
                }
                const opOverride = table === 'T_OPERATION' ? savedItem : operation;
                await syncStructureTables(currentRubriques, opOverride);
            }

            setModalState({ type: null }); 
        } catch (error) {
            console.error('Save error:', error);
            showToast('حدث خطأ أثناء الحفظ', 'error');
        }
    };

    const handleDelete = async (table: keyof Database, id: number, confirmMsg: string) => {
        if (canEdit && !isViewer) {
            const confirmed = await confirm(confirmMsg);
            if (confirmed) {
                const targetTab = getTabForTable(table);
                navigate('OPERATION_DETAILS', operationId, targetTab);
                showToast('جاري الحذف...', 'loading');
                try {
                    await deleteItem(table, id);
                    showToast('تم الحذف بنجاح', 'success');
                    
                    // Sync scategories if a rubrique was deleted
                    if (table === 'T_RUBRIQUE_OP') {
                        const remainingRubriques = db.T_RUBRIQUE_OP.filter(r => Number(r.ID_OPERATION) === Number(operationId) && Number(r.ID_RUBRIQUE_OP) !== Number(id));
                        await syncStructureTables(remainingRubriques);
                    }
                } catch (error) {
                    showToast('حدث خطأ أثناء الحذف', 'error');
                }
            }
        } else {
            alert('ليس لديك صلاحية الحذف.');
        }
    };

    const handleDeleteBordereau = async (id: number) => {
        if (canEdit && !isViewer) {
            const confirmed = await confirm('هل أنت متأكد من حذف جدول الإرسال هذا؟');
            if (confirmed) {
                showToast('جاري الحذف...', 'loading');
                try {
                    // Unlink engagements first
                    const linkedEngs = db.T_ENGAGEMENT.filter(eng => eng.ID_BORDEREAU === id);
                    for (const eng of linkedEngs) {
                        await updateItem('T_ENGAGEMENT', eng.ID_ENGAGEMENT, { ...eng, ID_BORDEREAU: null });
                    }
                    
                    await deleteItem('T_BORDEREAU', id);
                    showToast('تم حذف جدول الإرسال بنجاح', 'success');
                } catch (error) {
                    console.error(error);
                    showToast('حدث خطأ أثناء الحذف', 'error');
                }
            }
        } else {
            alert('ليس لديك صلاحية الحذف.');
        }
    };

    const handlePrintNavigate = (page: Page, id: number, description: string) => {
        broadcastEvent('print', description);
        navigate(page, id);
    };

    const exportTableToExcel = (tableId: string, filename: string) => {
        const tableElement = document.getElementById(tableId);
        if (!tableElement) return;
        exportToFormattedExcel(tableElement.outerHTML, filename);
    };

    const handleExportLots = () => {
        const rowsHtml = lots.map(lot => `
            <tr>
                <td style="text-align:right text[10px];">${lot.N_LOT}</td>
                <td style="text-align:right text[10px];">${lot.INTITULE_LOT}</td>
                <td style="text-align:right;">${lot.MONTANT_INITIALE_LOT}</td>
                <td style="text-align:right;">${lot.MONTANT_FINALE_LOT}</td>
                <td style="text-align:center;">${lot.ATTRIBUER ? 'مسندة' : 'غير مسندة'}</td>
            </tr>
        `).join('');

        const tableHtml = `
            <table border="1" dir="rtl">
                <thead>
                    <tr style="background-color:#f3f4f6;font-weight:bold;">
                        <th>رقم الحصة</th>
                        <th>عنوان الحصة</th>
                        <th>المبلغ الأولي</th>
                        <th>المبلغ النهائي</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
                <tfoot>
                    <tr style="background-color:#111827;color:#ffffff;font-weight:bold;">
                        <td colspan="2" style="text-align:center;">المجموع الإجمالي للحصص</td>
                        <td>${totalLotInitial}</td>
                        <td>${totalLotFinal}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        `;
        exportToFormattedExcel(tableHtml, `lots_op_${operationId}.xls`);
    };

    if (loading) return <div className="p-8 text-center">جار تحميل البيانات...</div>;
    if (!operation) return null; // Component will unmount soon due to the navigate() in useEffect

    return (
        <PageWrapper 
            title={operation.N_OPERATION} 
            navigate={navigate} 
            onGoBack={onGoBack}
            currentUser={currentUser}
            breadcrumb={[
                { label: t('page.operations'), page: 'OPERATIONS' }
            ]}
        >
            <div className="sticky top-0 z-20 bg-[#f8fafc] pb-2.5">
                {/* Header Info */}
                <div className="bg-white p-2.5 px-3.5 rounded-xl shadow-xs border border-gray-200 mb-2 flex flex-col sm:flex-row justify-between items-center gap-2.5">
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 shrink-0">
                            {operation.N_OPERATION}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                            operation.status === 'جارية' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                                : 'bg-rose-50 text-rose-700 border-rose-200/60'
                        }`}>
                            {operation.status === 'جارية' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1 inline-block animate-pulse"></span>}
                            {operation.status}
                        </span>
                        <span className="text-gray-300 hidden sm:inline">•</span>
                        <h2 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight truncate" title={operation.INT_OPERATION}>
                            {operation.INT_OPERATION}
                        </h2>
                    </div>
                    {categorie && (
                        <div className="flex items-center gap-1.5 text-xs shrink-0 self-start sm:self-auto">
                            <span className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/80 flex items-center gap-1 font-medium text-[11px]">
                                <i className="bi bi-folder-fill text-blue-500 text-xs"></i>
                                <span>الصنف:</span>
                                <span className="font-bold text-gray-800">{categorie.INT_CATEGORIE}</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-1 flex space-x-1 space-x-reverse overflow-x-auto no-scrollbar">
                    {[
                        { id: 'OVERVIEW', label: 'نظرة عامة', icon: 'bi-grid-1x2' },
                        { id: 'STRUCTURE', label: 'الهيكلة', icon: 'bi-diagram-3' },
                        { id: 'LOTS', label: 'الحصص', icon: 'bi-layers' },
                        { id: 'ENGAGEMENTS', label: 'الإلتزامات', icon: 'bi-pen' },
                        { id: 'PAIEMENTS', label: 'الدفعات', icon: 'bi-cash-stack' },
                        { id: 'BORDEREAUX', label: 'جداول الإرسال', icon: 'bi-send' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-200 flex items-center justify-center whitespace-nowrap shrink-0 flex-1
                                ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            <i className={`bi ${tab.icon} ml-1.5`}></i>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Areas */}
            {activeTab === 'OVERVIEW' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card title="رخصة الإلتزام" value={formatCurrency(totalAE)} icon="bi-journal-check" color="bg-blue-600" isLargeValue />
                        <Card title="مجموع الإلتزامات" value={formatCurrency(totalEngagedTotal)} icon="bi-pen" color="bg-amber-600" isLargeValue />
                        <Card title="مجموع اعتمادات الدفع" value={formatCurrency(totalCP)} icon="bi-calendar-check" color="bg-indigo-600" isLargeValue />
                        <Card title="مجموع الدفعات" value={formatCurrency(totalPaidTotal)} icon="bi-cash-coin" color="bg-emerald-600" isLargeValue />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <i className="bi bi-activity text-blue-500"></i>
                                    مؤشرات الإستهلاك الإجمالية
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-xs font-bold text-gray-600">إستهلاك رخصة الإلتزام (AE)</span>
                                            <span className="text-sm font-black text-blue-600">
                                                {totalAE > 0 ? ((totalEngagedTotal / totalAE) * 100).toFixed(1) : '0.0'}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3 border border-gray-200 overflow-hidden shadow-inner">
                                            <div className="bg-blue-600 h-full rounded-full transition-all duration-1000 shadow-lg shadow-blue-200" style={{ width: `${Math.min(100, (totalEngagedTotal / (totalAE || 1)) * 100)}%` }}></div>
                                        </div>
                                        <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-bold">
                                            <span>إجمالي الإلتزامات: {formatCurrency(totalEngagedTotal)}</span>
                                            <span>رخصة AE المتبقية: {formatCurrency(remainingAE)}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-xs font-bold text-gray-600">إستهلاك إعتمادات الدفع الكلية (CP)</span>
                                            <span className="text-sm font-black text-emerald-600">
                                                {totalCP > 0 ? ((totalPaidTotal / totalCP) * 100).toFixed(1) : '0.0'}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3 border border-gray-200 overflow-hidden shadow-inner">
                                            <div className="bg-emerald-600 h-full rounded-full transition-all duration-1000 shadow-lg shadow-emerald-200" style={{ width: `${Math.min(100, (totalPaidTotal / (totalCP || 1)) * 100)}%` }}></div>
                                        </div>
                                        <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-bold">
                                            <span>إجمالي المدفوعات: {formatCurrency(totalPaidTotal)}</span>
                                            <span>إعتمادات CP المتبقية: {formatCurrency(totalCP - totalPaidTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-full">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <i className="bi bi-calendar3 text-indigo-500"></i>
                                    مؤشرات السنة المالية {selectedPaymentYear}
                                </h3>
                                <div className="space-y-2">
                                    <div className="p-1 bg-gray-50 rounded-lg border border-gray-100">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">إعتماد الدفع (CP) للسنة</p>
                                        <p className="text-lg font-black text-indigo-700">{formatCurrency(cpYearAmount)}</p>
                                    </div>
                                    <div className="p-1 bg-emerald-50 rounded-lg border border-emerald-100">
                                        <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">مدفوعات السنة</p>
                                        <p className="text-lg font-black text-emerald-700">{formatCurrency(paidYearAmount)}</p>
                                    </div>
                                    <div className={`p-1 rounded-lg border ${remainingCpYear < 0 ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                                        <p className="text-[10px] font-bold uppercase mb-1">الرصيد المتبقي (CP) للسنة</p>
                                        <p className="text-lg font-black">{formatCurrency(remainingCpYear)}</p>
                                    </div>
                                    
                                    <div className="pt-1">
                                         <div className="flex justify-between items-end mb-1">
                                            <span className="text-[10px] font-bold text-gray-400">كفاءة استغلال CP السنة</span>
                                            <span className="text-xs font-black text-indigo-600">
                                                {cpYearAmount > 0 ? ((paidYearAmount / cpYearAmount) * 100).toFixed(1) : '0.0'}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (paidYearAmount / (cpYearAmount || 1)) * 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'STRUCTURE' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* CP Section */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                        <div className="py-2.5 px-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                                <i className="bi bi-calendar-check text-blue-500"></i>
                                اعتمادات الدفع (CP)
                            </h3>
                            {!isViewer && (
                                <button onClick={() => handlePermissionCheck(() => setModalState({ type: 'CP', timestamp: Date.now() }))} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-[10px] font-bold shadow-xs">
                                    <i className="bi bi-plus-lg ml-1"></i> إضافة CP
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right" id="table-cp">
                                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-3 py-2 border-b">السنة</th>
                                        <th className="px-3 py-2 border-b">المبلغ الأولي</th>
                                        <th className="px-3 py-2 border-b">المبلغ النهائي</th>
                                        {!isViewer && <th className="px-3 py-2 border-b text-center w-20">إجراءات</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {cps.map(cp => (
                                        <tr key={cp.ID_CP} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-3 py-1.5 text-xs font-mono font-bold text-gray-700">{cp.ANNEE}</td>
                                            <td className="px-3 py-1.5 text-xs font-mono font-medium text-gray-600">{formatCurrency(cp.MONTANT_INITIALE_CP)}</td>
                                            <td className="px-3 py-1.5 text-xs font-mono font-bold text-emerald-600">{formatCurrency(cp.MONTANT_FINALE_CP)}</td>
                                            {!isViewer && (
                                                <td className="px-3 py-1.5">
                                                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handlePermissionCheck(() => setModalState({ type: 'CP', data: cp, timestamp: Date.now() }))} className="p-1 text-amber-500 hover:bg-amber-50 rounded" title="تعديل"><i className="bi bi-pencil-square text-xs"></i></button>
                                                        <button onClick={() => handleDelete('T_CP', cp.ID_CP, 'حذف CP؟')} className="p-1 text-rose-500 hover:bg-rose-50 rounded" title="حذف"><i className="bi bi-trash3 text-xs"></i></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-900 text-white font-bold text-xs">
                                    <tr>
                                        <td className="px-3 py-2">المجموع</td>
                                        <td className="px-3 py-2 font-mono">{formatCurrency(totalCpInitial)}</td>
                                        <td className="px-3 py-2 font-mono text-emerald-400">{formatCurrency(totalCpFinal)}</td>
                                        {!isViewer && <td></td>}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Rubriques Section */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                        <div className="py-2.5 px-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                                <i className="bi bi-collection text-indigo-500"></i>
                                هيكلة الكلفة (Rubriques)
                            </h3>
                            {!isViewer && (
                                <button onClick={() => handlePermissionCheck(() => setModalState({ type: 'RUBRIQUE_OP', timestamp: Date.now() }))} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-[10px] font-bold shadow-xs">
                                    <i className="bi bi-plus-lg ml-1"></i> إضافة هيكل
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right" id="table-rubrique">
                                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-3 py-2 border-b">الهيكل</th>
                                        <th className="px-3 py-2 border-b">المبلغ الأولي</th>
                                        <th className="px-3 py-2 border-b">المبلغ النهائي</th>
                                        {!isViewer && <th className="px-3 py-2 border-b text-center w-20">إجراءات</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rubriquesOp.map(ro => (
                                        <tr key={ro.ID_RUBRIQUE_OP} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-3 py-1.5 text-xs font-bold text-gray-800">{db.T_RUBRIQUE.find(r => r.ID_RUBRIQUE === ro.ID_RUBRIQUE)?.RUBRIQUE}</td>
                                            <td className="px-3 py-1.5 text-xs font-mono font-medium text-gray-600">{formatCurrency(ro.MONTANT_INITIALE)}</td>
                                            <td className="px-3 py-1.5 text-xs font-mono font-bold text-blue-600">{formatCurrency(ro.MONTANT_FINALE ?? ro.MONTANT_INITIALE)}</td>
                                            {!isViewer && (
                                                <td className="px-3 py-1.5">
                                                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handlePermissionCheck(() => setModalState({ type: 'RUBRIQUE_OP', data: ro, timestamp: Date.now() }))} className="p-1 text-amber-500 hover:bg-amber-50 rounded" title="تعديل"><i className="bi bi-pencil-square text-xs"></i></button>
                                                        <button onClick={() => handleDelete('T_RUBRIQUE_OP', ro.ID_RUBRIQUE_OP, 'حذف هيكل؟')} className="p-1 text-rose-500 hover:bg-rose-50 rounded" title="حذف"><i className="bi bi-trash3 text-xs"></i></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-900 text-white font-bold text-xs">
                                    <tr>
                                        <td className="px-3 py-2">المجموع</td>
                                        <td className="px-3 py-2"></td>
                                        <td className="px-3 py-2 font-mono text-blue-400">{formatCurrency(totalRubriqueAmount)}</td>
                                        {!isViewer && <td></td>}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Scategories Section */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                        <div className="py-2.5 px-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                                <i className="bi bi-diagram-2 text-purple-500"></i>
                                الأصناف الفرعية (Sous-catégories)
                            </h3>
                            {!isViewer && (
                                <button onClick={() => handlePermissionCheck(() => setModalState({ type: 'SCATEGORIE_OP', timestamp: Date.now() }))} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-[10px] font-bold shadow-xs">
                                    <i className="bi bi-plus-lg ml-1"></i> إضافة صنف
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right" id="table-scat">
                                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-3 py-2 border-b">الرمز</th>
                                        <th className="px-3 py-2 border-b">العنوان</th>
                                        <th className="px-3 py-2 border-b">المبلغ الأولي</th>
                                        <th className="px-3 py-2 border-b">المبلغ النهائي</th>
                                        {!isViewer && <th className="px-3 py-2 border-b text-center w-20">إجراءات</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {scategoriesOp.map(so => {
                                        const scat = db.T_SCATEGORIE.find(s => s.ID_SCATEGORIE === so.ID_SCATEGORIE);
                                        return (
                                            <tr key={so.ID_SCATEGORIE_OP} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-3 py-1.5 text-xs font-mono font-bold text-gray-500">{scat?.C_SCATEGORIE}</td>
                                                <td className="px-3 py-1.5 text-xs font-bold text-gray-800">{scat?.INT_SCATEGORIE}</td>
                                                <td className="px-3 py-1.5 text-xs font-mono font-medium text-gray-600">{formatCurrency(so.MONTANT_INITIALE)}</td>
                                                <td className="px-3 py-1.5 text-xs font-mono font-bold text-purple-600">{formatCurrency(so.MONTANT_FINALE ?? so.MONTANT_INITIALE)}</td>
                                                {!isViewer && (
                                                    <td className="px-3 py-1.5">
                                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handlePermissionCheck(() => setModalState({ type: 'SCATEGORIE_OP', data: so, timestamp: Date.now() }))} className="p-1 text-amber-500 hover:bg-amber-50 rounded" title="تعديل"><i className="bi bi-pencil-square text-xs"></i></button>
                                                            <button onClick={() => handleDelete('T_SCATEGORIE_OP', so.ID_SCATEGORIE_OP, 'حذف صنف فرعي؟')} className="p-1 text-rose-500 hover:bg-rose-50 rounded" title="حذف"><i className="bi bi-trash3 text-xs"></i></button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-gray-900 text-white font-bold text-xs">
                                    <tr>
                                        <td colSpan={2} className="px-3 py-2 text-center">المجموع</td>
                                        <td className="px-3 py-2"></td>
                                        <td className="px-3 py-2 font-mono text-purple-400">{formatCurrency(totalScatAmount)}</td>
                                        {!isViewer && <td></td>}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'LOTS' && (
                <div id="lots-section" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="px-3.5 py-2.5 border-b border-gray-100 flex flex-wrap justify-between items-center bg-gray-50/50 gap-2.5">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                                <i className="bi bi-layers text-blue-500"></i>
                                إدارة الحصص
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {lots.length} {lots.length === 1 ? 'حصة' : 'حصص'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {lots.length > 5 && (
                                <div className="flex items-center gap-2 text-[11px] bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-xs">
                                    <label className="text-[10px] font-bold text-gray-500"> عدد الصفوف : </label>
                                    <select
                                        value={lotsPageSize}
                                        onChange={(e) => {
                                            const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                                            setLotsPageSize(val);
                                            setLotsCurrentPage(1);
                                        }}
                                        className="h-5 px-1 bg-transparent text-[10px] font-bold text-blue-700 outline-none cursor-pointer"
                                    >
                                        <option value={3}>3 صفوف</option>
                                        <option value={5}>5 صفوف</option>
                                        <option value={10}>10 صفوف</option>
                                        <option value="all">الكل ({lots.length})</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                {!isViewer && (
                                    <button onClick={() => handlePermissionCheck(() => setModalState({ type: 'LOT', timestamp: Date.now() }))} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-[10px] font-bold shadow-xs flex items-center">
                                        <i className="bi bi-plus-lg ml-1"></i> إضافة
                                    </button>
                                )}
                                <button onClick={handleExportLots} className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-[10px] font-bold flex items-center">
                                    <i className="bi bi-file-earmark-excel ml-1"></i> تصدير
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
                        <table className="w-full text-right" id="table-lots">
                            <thead className="bg-gray-50 text-gray-600 text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-2 border-b whitespace-nowrap">رقم الحصة</th>
                                    <th className="px-3 py-2 border-b min-w-[200px]">عنوان الحصة</th>
                                    <th className="px-3 py-2 border-b whitespace-nowrap">المبلغ الأولي</th>
                                    <th className="px-3 py-2 border-b whitespace-nowrap">المبلغ النهائي</th>
                                    <th className="px-3 py-2 border-b text-center whitespace-nowrap">الحالة</th>
                                    {!isViewer && <th className="px-3 py-2 border-b text-center w-20 whitespace-nowrap">إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedLots.length === 0 ? (
                                    <tr>
                                        <td colSpan={isViewer ? 5 : 6} className="px-3 py-6 text-center text-gray-400 italic text-xs">لا توجد حصص مسجلة لهذه العملية.</td>
                                    </tr>
                                ) : (
                                    paginatedLots.map(lot => (
                                        <tr 
                                            key={lot.ID_LOT} 
                                            id={`lots-row-${lot.ID_LOT}`}
                                            className="hover:bg-blue-50/30 transition-colors group"
                                        >
                                            <td className="px-3 py-1.5 text-xs font-mono font-bold text-gray-900 whitespace-nowrap">{lot.N_LOT}</td>
                                            <td className="px-3 py-1.5 text-xs font-bold text-gray-800">{lot.INTITULE_LOT}</td>
                                            <td className="px-3 py-1.5 text-xs font-mono font-medium text-gray-600 whitespace-nowrap">{formatCurrency(lot.MONTANT_INITIALE_LOT)}</td>
                                            <td className="px-3 py-1.5 text-xs font-mono font-bold text-blue-600 whitespace-nowrap">{formatCurrency(lot.MONTANT_FINALE_LOT)}</td>
                                            <td 
                                                className="px-3 py-1.5 text-center cursor-pointer hover:scale-105 transition-transform whitespace-nowrap"
                                                onClick={() => {
                                                    if (lot.ATTRIBUER) {
                                                        const lotPiece = db.T_LOT_PIECE.find(lp => lp.ID_LOT === lot.ID_LOT);
                                                        if (lotPiece) {
                                                            navigate('DOCUMENTS', lot.ID_OPERATION, lotPiece.ID_PIECE.toString());
                                                        }
                                                    }
                                                }}
                                            >
                                                {lot.ATTRIBUER ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100" title="انقر للتوجه للوثيقة">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        مسندة
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                                        غير مسندة
                                                    </span>
                                                )}
                                            </td>
                                            {!isViewer && (
                                                <td className="px-3 py-1.5 whitespace-nowrap">
                                                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handlePermissionCheck(() => setModalState({ type: 'LOT', data: lot, timestamp: Date.now() }))} className="p-1 text-amber-500 hover:bg-amber-50 rounded" title="تعديل"><i className="bi bi-pencil-square text-xs"></i></button>
                                                        <button onClick={() => handleDelete('T_LOT_OPERATION', lot.ID_LOT, 'حذف حصة؟')} className="p-1 text-rose-500 hover:bg-rose-50 rounded" title="حذف"><i className="bi bi-trash3 text-xs"></i></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-gray-900 text-white font-bold text-xs sticky bottom-0 z-10 shadow-xs">
                                <tr>
                                    <td colSpan={2} className="px-3 py-2 text-center whitespace-nowrap">المجموع الإجمالي للحصص</td>
                                    <td className="px-3 py-2 font-mono whitespace-nowrap">{formatCurrency(totalLotInitial)}</td>
                                    <td className="px-3 py-2 font-mono text-blue-400 whitespace-nowrap">{formatCurrency(totalLotFinal)}</td>
                                    <td colSpan={isViewer ? 1 : 2}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {lotsPageSize !== 'all' && lotsTotalPages > 1 && (
                        <div className="px-3.5 py-1.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs select-none">
                            <span className="text-[11px] text-gray-500">
                                عرض <span className="font-bold text-blue-700">{(safeLotsPage - 1) * (lotsPageSize as number) + 1}</span> إلى <span className="font-bold text-blue-700">{Math.min(safeLotsPage * (lotsPageSize as number), lots.length)}</span> من أصل <span className="font-bold text-gray-900">{lots.length}</span> حصة
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setLotsCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={safeLotsPage === 1}
                                    className="px-2 py-0.5 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white text-gray-700 text-[10px] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                                >
                                    السابق
                                </button>
                                <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold">
                                    {safeLotsPage} / {lotsTotalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setLotsCurrentPage(prev => Math.min(prev + 1, lotsTotalPages))}
                                    disabled={safeLotsPage === lotsTotalPages}
                                    className="px-2 py-0.5 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white text-gray-700 text-[10px] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                                >
                                    التالي
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'ENGAGEMENTS' && (
                <div id="engagements-section" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="px-3.5 py-2 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                            <h3 className="font-bold text-xs text-gray-800 flex items-center gap-1.5 whitespace-nowrap pl-2 border-l border-gray-200 flex-shrink-0">
                                <i className="bi bi-pen text-blue-500"></i>
                                سجل الإلتزامات
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mr-1">
                                    {filteredEngagements.length}
                                </span>
                            </h3>

                            {/* Dropdowns inline next to the title */}
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 min-w-0">
                                <div className="w-28 sm:w-32 flex-shrink-0">
                                    <CustomDropdown
                                        options={[{ value: '', label: 'كل السنوات' }, ...engYears.map(y => ({ value: y, label: y }))]}
                                        value={selectedEngYear}
                                        onChange={setSelectedEngYear}
                                        placeholder="السنة المالية"
                                        className="bg-white text-xs font-medium"
                                    />
                                </div>
                                <div className="min-w-[100px] sm:min-w-[120px] md:min-w-[160px] flex-1">
                                    <CustomDropdown
                                        options={[{ value: '', label: 'كل المستفيدين' }, ...engBeneficiaries.map(b => ({ value: b.ID_BENEFICIAIRE, label: b.BENEFICIAIRE }))]}
                                        value={selectedEngBeneficiaryId}
                                        onChange={setSelectedEngBeneficiaryId}
                                        placeholder="المستفيد"
                                        className="bg-white text-xs font-medium"
                                    />
                                </div>
                                <div className="min-w-[100px] sm:min-w-[120px] md:min-w-[160px] flex-1">
                                    <CustomDropdown
                                        options={[{ value: '', label: 'كل المواضيع' }, ...engObjects.map(o => ({ value: o, label: o }))]}
                                        value={selectedEngObject}
                                        onChange={setSelectedEngObject}
                                        placeholder="موضوع الإلتزام"
                                        className="bg-white text-xs font-medium"
                                    />
                                </div>
                                {(selectedEngYear || selectedEngBeneficiaryId || selectedEngObject) && (
                                    <button
                                        onClick={() => {
                                            setSelectedEngYear('');
                                            setSelectedEngBeneficiaryId('');
                                            setSelectedEngObject('');
                                        }}
								className="h-6 px-2.5 text-rose-600 hover:bg-rose-50 rounded-lg text-[8px] font-bold border border-rose-200 transition-colors flex items-center gap-1 flex-shrink-0"
                                        title="إلغاء التصفية"
                                    >
                                        <i className="bi bi-x-lg text-[8px]"></i>
                                        إلغاء
                                    </button>
                                )}
							<div className="flex items-end gap-1.5 flex-shrink-0">
                          {!isViewer && (
                           <button onClick={() => handlePermissionCheck(() => setModalState({ type: 'ENGAGEMENT', timestamp: Date.now() }))} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-[10px] font-bold shadow-xs flex items-center">
                                 <i className="bi bi-plus-lg ml-1"></i> إضافة
                              </button>
                          )}
                           <button onClick={() => exportTableToExcel('table-eng', 'engagements.xls')} className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-[10px] font-bold flex items-center">
                               <i className="bi bi-file-earmark-excel ml-1"></i> تصدير
                           </button>
                        </div>	
								
                      </div>
											
							
							
                    </div>

                       
                    </div>

                    <div className="overflow-x-auto max-h-[60vh]">
                        <table className="w-full text-right" id="table-eng">
                            <thead className="bg-gray-50 text-gray-600 text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10 border-b border-gray-200">
                                <tr>
                                    <th className="px-2.5 py-2 border-b whitespace-nowrap">رقم / سنة</th>
                                    <th className="px-2.5 py-2 border-b whitespace-nowrap">التاريخ</th>
                                    <th className="px-2.5 py-2 border-b whitespace-nowrap">الطبيعة</th>
                                    <th className="px-2.5 py-2 border-b min-w-[200px]">الموضوع</th>
                                    <th className="px-2.5 py-2 border-b min-w-[140px]">المستفيد</th>
                                    <th className="px-2.5 py-2 border-b whitespace-nowrap">المبلغ</th>
                                    <th className="px-2.5 py-2 border-b whitespace-nowrap">التأشيرة</th>
                                    <th className="px-2.5 py-2 border-b text-center whitespace-nowrap">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredEngagements.map(eng => {
                                    const piece = operationPieces.find(p => p.ID_PIECE === eng.ID_PIECE);
                                    const beneficiary = piece?.ID_BENEFICIAIRE ? db.T_BENEFICIAIRE.find(b => b.ID_BENEFICIAIRE === piece.ID_BENEFICIAIRE) : null;
                                    
                                    return (
                                        <tr 
                                            key={eng.ID_ENGAGEMENT} 
                                            id={`engagements-row-${eng.ID_ENGAGEMENT}`}
                                            onClick={() => { setSelectedengagementId(eng.ID_ENGAGEMENT); }} 
                                            className={`cursor-pointer transition-all duration-200 group ${selectedengagementId === eng.ID_ENGAGEMENT ? 'bg-blue-100/90 ring-2 ring-inset ring-blue-500 font-semibold' : 'hover:bg-blue-50/50'}`}
                                        >
                                            <td className="px-2.5 py-1.5 whitespace-nowrap">
                                                <span className="font-mono text-xs font-bold text-gray-900">{eng.N_ENG} / {eng.ANNEE}</span>
                                            </td>
                                            <td className="px-2.5 py-1.5 text-[11px] font-medium text-gray-500 whitespace-nowrap" dir="ltr">{normalizeDate(eng.DATE_ENG)}</td>
                                            <td className="px-2.5 py-1.5 whitespace-nowrap">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${
                                                    (eng.NATURE_ENG === 'سحب' || eng.NATURE_ENG === 'إلغاء')
                                                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                                        : (eng.NATURE_ENG === 'إعادة التقييم' || eng.NATURE_ENG === 'إنخفاض التقييم')
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                    {eng.NATURE_ENG === 'التزام' && <i className="bi bi-check-circle-fill text-emerald-500 text-[9px]"></i>}
                                                    {(eng.NATURE_ENG === 'سحب' || eng.NATURE_ENG === 'إلغاء') && <i className="bi bi-x-circle-fill text-rose-500 text-[9px]"></i>}
                                                    {(eng.NATURE_ENG === 'إعادة التقييم' || eng.NATURE_ENG === 'إنخفاض التقييم') && <i className="bi bi-exclamation-triangle-fill text-amber-500 text-[9px]"></i>}
                                                    {eng.NATURE_ENG}
                                                </span>
                                            </td>
                                            <td className="px-2.5 py-1.5 text-[11px] font-medium text-gray-700 leading-tight">
                                                <div className="flex items-center gap-1.5 group/subj">
                                                    <span className="line-clamp-2">{eng.OBJET_ENG}</span>
                                                    <button 
                                                        onClick={(e) => { 
                                                             e.stopPropagation(); 
                                                             navigate('DOCUMENTS', operationId, eng.ID_PIECE.toString() + ':blue'); 
                                                        }}
                                                        className="h-5 w-5 flex-shrink-0 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-full opacity-0 group-hover/subj:opacity-100 transition-opacity"
                                                        title="انتقل إلى الوثيقة"
                                                    >
                                                        <i className="bi bi-box-arrow-up-right text-[10px]"></i>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-2.5 py-1.5 text-[11px] font-bold text-gray-700">{beneficiary?.BENEFICIAIRE || '---'}</td>
                                            <td className={`px-2.5 py-1.5 text-xs font-mono font-bold whitespace-nowrap ${eng.NATURE_ENG === 'سحب' ? 'text-rose-700' : 'text-blue-900'}`}>{formatCurrency(eng.MONTANT_ENG)}</td>
                                            <td className="px-2.5 py-1.5 whitespace-nowrap">
                                                {eng.N_VISA_CB ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                                                            <i className="bi bi-patch-check-fill text-[9px]"></i> {eng.N_VISA_CB}
                                                        </span>
                                                        <span className="text-[9px] text-emerald-600/70 font-semibold" dir="ltr">{normalizeDate(eng.DATE_VISA_CB)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-rose-500 text-[10px] font-semibold flex items-center gap-1">
                                                        <i className="bi bi-hourglass-split text-[9px]"></i> قيد التأشير
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2.5 py-1.5 whitespace-nowrap">
                                                <div className="flex justify-center gap-1">
                                                    {!isViewer && (
                                                        <>
                                                            <button onClick={() => handlePermissionCheck(() => setModalState({ type: 'ENGAGEMENT', data: eng, timestamp: Date.now() }))} className="p-1 text-amber-500 hover:bg-amber-50 rounded" title="تعديل"><i className="bi bi-pencil-square text-xs"></i></button>
                                                            <button onClick={() => handleDelete('T_ENGAGEMENT', eng.ID_ENGAGEMENT, 'حذف التزام؟')} className="p-1 text-rose-500 hover:bg-rose-50 rounded" title="حذف"><i className="bi bi-trash3 text-xs"></i></button>
                                                        </>
                                                    )}
                                                    <button onClick={(e) => { e.stopPropagation(); handlePrintNavigate('PRINT_ENGAGEMENT', eng.ID_ENGAGEMENT, `بطاقة التزام رقم ${eng.N_ENG}`); }} className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="طباعة">
                                                        <i className="bi bi-printer text-xs"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-3.5 py-2 bg-gray-900 text-white font-bold text-xs flex justify-between items-center">
                        <span className="text-gray-400">إجمالي الالتزامات المعروضة:</span>
                        <span className="text-blue-400 text-xs font-mono tracking-wide" dir="ltr">{formatCurrency(totalEngAmount)}</span>
                    </div>
                </div>
            )}

            {activeTab === 'PAIEMENTS' && (
                <div id="paiements-section" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="px-3.5 py-2 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                            <h3 className="font-bold text-xs text-gray-800 flex items-center gap-1.5 whitespace-nowrap pl-2 border-l border-gray-200 flex-shrink-0">
                                <i className="bi bi-wallet2 text-emerald-500"></i>
                                سجل المدفوعات
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mr-1">
                                    {filteredPaiements.length}
                                </span>
                            </h3>

                            {/* Dropdowns inline next to the title */}
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 min-w-0">
                                <div className="w-28 sm:w-32 flex-shrink-0 items-center">
                                    <CustomDropdown
                                        options={[{ value: '', label: 'كل السنوات' }, ...paiYears.map(y => ({ value: y, label: y }))]}
                                        value={selectedPaiYear}
                                        onChange={setSelectedPaiYear}
                                        placeholder="السنة المالية"
                                        className="bg-white text-xs font-medium"
                                    />
                                </div>
                                <div className="min-w-[100px] sm:min-w-[120px] md:min-w-[160px] flex-1 items-center">
                                    <CustomDropdown
                                        options={[{ value: '', label: 'كل المستفيدين' }, ...paiBeneficiaries.map(b => ({ value: b.ID_BENEFICIAIRE, label: b.BENEFICIAIRE }))]}
                                        value={selectedPaiBeneficiaryId}
                                        onChange={setSelectedPaiBeneficiaryId}
                                        placeholder="المستفيد"
                                        className="bg-white text-xs font-medium"
                                    />
                                </div>
                                <div className="min-w-[100px] sm:min-w-[120px] md:min-w-[160px] flex-1 items-center">
                                    <CustomDropdown
                                        options={[{ value: '', label: 'كل المواضيع' }, ...paiObjects.map(o => ({ value: o, label: o }))]}
                                        value={selectedPaiObject}
                                        onChange={setSelectedPaiObject}
                                        placeholder="موضوع الدفع"
                                        className="bg-white text-xs font-medium"
                                    />
                                </div>
                                {(selectedPaiYear || selectedPaiBeneficiaryId || selectedPaiObject) && (
                                    <button
                                        onClick={() => {
                                            setSelectedPaiYear('');
                                            setSelectedPaiBeneficiaryId('');
                                            setSelectedPaiObject('');
                                        }}
                                        className="h-8 px-2.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1 flex-shrink-0"
                                        title="إلغاء التصفية"
                                    >
                                        <i className="bi bi-x-lg text-[10px]"></i>
                                        مسح
                                    </button>
                                )}
							<div className="flex items-center gap-1.5 flex-shrink-0">
                            {!isViewer && (
                                <button onClick={() => handlePermissionCheck(() => setModalState({ type: 'PAIEMENT', timestamp: Date.now() }))} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-[10px] font-bold shadow-xs flex items-center">
                                    <i className="bi bi-plus-lg ml-1"></i> إضافة
                                </button>
                            )}
                            <button onClick={() => exportTableToExcel('table-pai', 'paiements.xls')} className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-[10px] font-bold flex items-center">
                                <i className="bi bi-file-earmark-excel ml-1"></i> تصدير
                            </button>
                        </div>
                            </div>
                        </div>

                        
                    </div>

                    <div className="overflow-x-auto max-h-[60vh]" onScroll={() => setPrintMenu(null)}>
                        <table className="w-full text-right" id="table-pai">
                            <thead className="bg-gray-50 text-gray-600 text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10 border-b border-gray-200">
                                <tr>
                                    <th className="px-2.5 py-2 border-b whitespace-nowrap">رقم / سنة</th>
                                    <th className="px-2.5 py-2 border-b whitespace-nowrap">التاريخ</th>
                                    <th className="px-2.5 py-2 border-b min-w-[200px]">الموضوع</th>
                                    <th className="px-2.5 py-2 border-b min-w-[140px]">المستفيد</th>
                                    <th className="px-2.5 py-2 border-b whitespace-nowrap">المبلغ</th>
                                    <th className="px-2.5 py-2 border-b whitespace-nowrap">بيانات الحوالة</th>
                                    <th className="px-2.5 py-2 border-b text-center whitespace-nowrap">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPaiements.map(pai => {
                                    const piece = operationPieces.find(p => p.ID_PIECE === pai.ID_PIECE);
                                    const beneficiary = piece?.ID_BENEFICIAIRE ? db.T_BENEFICIAIRE.find(b => b.ID_BENEFICIAIRE === piece.ID_BENEFICIAIRE) : null;

                                    return (
                                        <tr 
                                            key={pai.ID_PAIEMENT} 
                                            id={`paiements-row-${pai.ID_PAIEMENT}`}
                                            onClick={() => { setSelectedpaiementId(pai.ID_PAIEMENT); }} 
                                            className={`cursor-pointer transition-all duration-200 group ${selectedpaiementId === pai.ID_PAIEMENT ? 'bg-blue-100/90 ring-2 ring-inset ring-blue-500 font-semibold' : 'hover:bg-blue-50/50'}`}
                                        >
                                            <td className="px-2.5 py-1.5 text-xs font-mono font-bold text-gray-900 whitespace-nowrap">{pai.N_PAI} / {pai.ANNEE}</td>
                                            <td className="px-2.5 py-1.5 text-[11px] font-medium text-gray-500 whitespace-nowrap" dir="ltr">{normalizeDate(pai.DATE_PAI)}</td>
                                            <td className="px-2.5 py-1.5 text-[11px] font-medium text-gray-700 leading-tight">
                                                <div className="flex items-center gap-1.5 group/subj">
                                                    <span className="line-clamp-2">{pai.OBJET_PAI}</span>
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            navigate('DOCUMENTS', operationId, pai.ID_PIECE.toString() + ':blue'); 
                                                        }}
                                                        className="h-5 w-5 flex-shrink-0 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-full opacity-0 group-hover/subj:opacity-100 transition-opacity"
                                                        title="انتقل إلى الوثيقة"
                                                    >
                                                        <i className="bi bi-box-arrow-up-right text-[10px]"></i>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-2.5 py-1.5 text-[11px] font-bold text-gray-700">{beneficiary?.BENEFICIAIRE || '---'}</td>
                                            <td className="px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700 whitespace-nowrap">{formatCurrency(pai.MONTANT_PAI)}</td>
                                            <td className="px-2.5 py-1.5 whitespace-nowrap">
                                                {pai.N_MANDAT ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-700 text-[10px] font-bold flex items-center gap-1">
                                                            <i className="bi bi-file-earmark-text-fill text-[9px]"></i> {pai.N_MANDAT}
                                                        </span>
                                                        <span className="text-[9px] text-blue-600/70 font-semibold" dir="ltr">{normalizeDate(pai.DATE_MANDAT)}</span>
                                                        {pai.DATE_ADMIS && (
                                                            <span className="text-[9px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                                                                <i className="bi bi-check-circle-fill text-[8px]"></i> مقبول {normalizeDate(pai.DATE_ADMIS)}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-[10px]">---</span>
                                                )}
                                            </td>
                                            <td className="px-2.5 py-1.5 whitespace-nowrap">
                                                <div className="flex justify-center gap-1">
                                                    {!isViewer && (
                                                        <>
                                                            <button onClick={() => handlePermissionCheck(() => setModalState({ type: 'PAIEMENT', data: pai, timestamp: Date.now() }))} className="p-1 text-amber-500 hover:bg-amber-50 rounded" title="تعديل"><i className="bi bi-pencil-square text-xs"></i></button>
                                                            <button onClick={() => handleDelete('T_PAIEMENT', pai.ID_PAIEMENT, 'حذف دفع؟')} className="p-1 text-rose-500 hover:bg-rose-50 rounded" title="حذف"><i className="bi bi-trash3 text-xs"></i></button>
                                                        </>
                                                    )}
                                                    <button onClick={(e) => handlePrintClick(e, pai.ID_PAIEMENT)} className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="طباعة">
                                                        <i className="bi bi-printer text-xs"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-3.5 py-2 bg-gray-900 text-white font-bold text-xs flex justify-between items-center">
                        <span className="text-gray-400">إجمالي المدفوعات المعروضة:</span>
                        <span className="text-emerald-400 text-xs font-mono tracking-wide" dir="ltr">{formatCurrency(totalPaiAmount)}</span>
                    </div>
                </div>
            )}

            {activeTab === 'BORDEREAUX' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="px-3.5 py-2.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                            <i className="bi bi-send-check text-blue-500"></i>
                            جداول الإرسال (Bordereaux)
                        </h3>
                        {!isViewer && (
                            <button 
                                onClick={() => handlePermissionCheck(() => setModalState({ type: 'BORDEREAU', timestamp: Date.now() }))}
                                className="px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-[10px] font-bold shadow-sm"
                            >
                                <i className="bi bi-plus-lg ml-1"></i> إضافة
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right" id="table-bordereaux">
                            <thead className="bg-gray-50 text-gray-600 text-[10px] uppercase font-bold tracking-wider border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-2 border-b whitespace-nowrap">رقم جدول الإرسال</th>
                                    <th className="px-3 py-2 border-b whitespace-nowrap">السنة</th>
                                    <th className="px-3 py-2 border-b whitespace-nowrap">التاريخ</th>
                                    <th className="px-3 py-2 border-b whitespace-nowrap">المرسل إليه</th>
                                    <th className="px-3 py-2 border-b min-w-[220px]">الوثائق المرفقة</th>
                                    <th className="px-3 py-2 border-b text-center whitespace-nowrap">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bordereaux.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-3 py-6 text-center text-gray-400 italic text-xs">لا توجد جداول إرسال مسجلة لهذه العملية.</td>
                                    </tr>
                                ) : (
                                    bordereaux.map((bor) => {
                                        const linkedEngs = db.T_ENGAGEMENT.filter(e => e.ID_BORDEREAU === bor.ID_BORDEREAU);
                                        const docsList = linkedEngs.map(eng => {
                                            const piece = db.T_PIECE.find(p => p.ID_PIECE === eng.ID_PIECE);
                                            return {
                                                n_eng: eng.N_ENG,
                                                annee: eng.ANNEE,
                                                pieceStr: piece?.PIECE || eng.BORD_OBJET || 'التزام'
                                            };
                                        });

                                        return (
                                            <tr key={bor.ID_BORDEREAU} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-3 py-1.5 text-xs font-mono font-bold text-gray-900 whitespace-nowrap">{bor.N_BORDEREAU}</td>
                                                <td className="px-3 py-1.5 text-xs font-bold text-gray-500 whitespace-nowrap">{bor.ANNEE}</td>
                                                <td className="px-3 py-1.5 text-[11px] font-medium text-gray-500 whitespace-nowrap" dir="ltr">{normalizeDate(bor.DATE_BORDEREAU)}</td>
                                                <td className="px-3 py-1.5 text-[11px] font-bold text-gray-700 whitespace-nowrap">{bor.DESTINATAIRE}</td>
                                                <td className="px-3 py-1.5 text-[11px] text-gray-700">
                                                    {docsList.length === 0 ? (
                                                        <span className="text-gray-400 italic">-- بدون وثائق --</span>
                                                    ) : (
                                                        <div className="flex flex-col gap-1 max-w-[320px] max-h-[120px] overflow-y-auto text-right font-medium">
                                                            {docsList.map((doc, idx) => (
                                                                <div key={idx} className="bg-sky-50/65 border border-sky-100 rounded px-2 py-0.5 text-gray-800 leading-normal shadow-xs">
                                                                    <span className="font-bold text-blue-700 block text-[9px]">بطاقة: {doc.n_eng}/{doc.annee}</span>
                                                                    <span className="text-[10px] text-gray-700 break-words">{doc.pieceStr}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-1.5 whitespace-nowrap">
                                                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handlePrintNavigate('PRINT_BORDEREAU', bor.ID_BORDEREAU, 'جدول إرسال')}
                                                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                                            title="طباعة"
                                                        >
                                                            <i className="bi bi-printer text-xs"></i>
                                                        </button>
                                                        {!isViewer && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handlePermissionCheck(() => setModalState({ type: 'BORDEREAU', data: bor, timestamp: Date.now() }))}
                                                                    className="p-1 text-amber-500 hover:bg-amber-50 rounded"
                                                                    title="تعديل"
                                                                >
                                                                    <i className="bi bi-pencil-square text-xs"></i>
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteBordereau(bor.ID_BORDEREAU)}
                                                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                                                    title="حذف"
                                                                >
                                                                    <i className="bi bi-trash3 text-xs"></i>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {printMenu && ( activeTab === 'PAIEMENTS' ) && (() => {
                const currentPaiement = db.T_PAIEMENT.find(p => p.ID_PAIEMENT === printMenu.id);
                const hasDeduction = currentPaiement ? Boolean(
                    (currentPaiement.PENALITE_RETARD && currentPaiement.PENALITE_RETARD > 0) ||
                    (currentPaiement.RETENUE_GARANTIE && currentPaiement.RETENUE_GARANTIE > 0) ||
                    (currentPaiement.AUTRE_DEDUCTION && currentPaiement.AUTRE_DEDUCTION > 0) ||
                    (currentPaiement.REMBOURSEMENT_AVANCE_FORFAITAIRE && currentPaiement.REMBOURSEMENT_AVANCE_FORFAITAIRE > 0) ||
                    (currentPaiement.REMBOURSEMENT_AVANCE_APPROVISIONNEMENT && currentPaiement.REMBOURSEMENT_AVANCE_APPROVISIONNEMENT > 0) ||
                    (currentPaiement.AVANCE_FORFAITAIRE && currentPaiement.AVANCE_FORFAITAIRE > 0) ||
                    (currentPaiement.AVANCE_APPROVISIONNEMENT && currentPaiement.AVANCE_APPROVISIONNEMENT > 0)
                ) : false;

                return (
                    <div 
                        className="fixed bg-white border border-gray-200 shadow-xl rounded-md z-[100] py-1 w-60"
                        style={{ top: printMenu.top, left: printMenu.left }}
                    >
                        <button onClick={() => handlePrintNavigate('PRINT_PAIEMENT', printMenu.id, 'بطاقة دفع')} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                            <i className="bi bi-card-heading ml-2 text-blue-600"></i> بطاقة الدفع
                        </button>
                        <button onClick={() => handlePrintNavigate('PRINT_CERTIFICAT', printMenu.id, 'شهادة دفع')} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                            <i className="bi bi-patch-check ml-2 text-indigo-600"></i> شهادة الدفع
                        </button>
                        <button onClick={() => handlePrintNavigate('PRINT_MANDAT', printMenu.id, 'حوالة دفع')} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                            <i className="bi bi-file-text ml-2 text-amber-600"></i> حوالة الدفع
                        </button>
                        <button onClick={() => handlePrintNavigate('PRINT_DECLARATION', printMenu.id, 'إعلان دفع')} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                            <i className="bi bi-megaphone ml-2 text-purple-600"></i> إعلان بالدفع
                        </button>
                        <button onClick={() => handlePrintNavigate('PRINT_MANDAT_TABLE', printMenu.id, 'جدول حوالة')} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                            <i className="bi bi-table ml-2 text-cyan-600"></i> جدول الحوالة
                        </button>
                        {hasDeduction && (
                            <>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button onClick={() => handlePrintNavigate('PRINT_ORDRE_RECETTE', printMenu.id, 'أمر بالإيراد')} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium">
                                    <i className="bi bi-receipt-cutoff ml-2 text-emerald-600"></i> أمر بالإيراد
                                </button>
                                <button onClick={() => handlePrintNavigate('PRINT_AVIS_ORDRE_RECETTE', printMenu.id, 'إشعار إصدار أمر بالإيراد')} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium">
                                    <i className="bi bi-bell ml-2 text-emerald-600"></i> إشعار إصدار أمر بالإيراد
                                </button>
                                <button onClick={() => handlePrintNavigate('PRINT_BORDEREAU_RECETTES', printMenu.id, 'جدول إرسال أوامر الإيرادات')} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium">
                                    <i className="bi bi-send ml-2 text-emerald-600"></i> جدول إرسال أوامر الإيرادات
                                </button>
                            </>
                        )}
                    </div>
                );
            })()}

            <Modal isOpen={modalState.type === 'CP'} onClose={() => setModalState({ type: null })} title={modalState.data ? "تعديل اعتمادات الدفع" : "إضافة اعتمادات الدفع"}>
                <AddCpForm 
                    key={modalState.timestamp ? `cp-${modalState.timestamp}` : 'add-cp'}
                    onClose={() => setModalState({ type: null })} 
                    onSave={(data) => handleSave('T_CP', data, 'ID_CP')} 
                    operationId={operationId} 
                    initialData={modalState.data} 
                    selectedYear={selectedPaymentYear}
                />
            </Modal>
            <Modal isOpen={modalState.type === 'RUBRIQUE_OP'} onClose={() => setModalState({ type: null })} title={modalState.data ? "تعديل هيكل الكلفة" : "إضافة هيكل الكلفة"}>
                <AddRubriqueOpForm 
                    key={modalState.timestamp ? `rub-${modalState.timestamp}` : 'add-rub'}
                    onClose={() => setModalState({ type: null })} 
                    onSave={(data) => handleSave('T_RUBRIQUE_OP', data, 'ID_RUBRIQUE_OP')} 
                    operationId={operationId} 
                    rubriques={availableRubriques} 
                    initialData={modalState.data} 
                />
            </Modal>
            <Modal isOpen={modalState.type === 'SCATEGORIE_OP'} onClose={() => setModalState({ type: null })} title={modalState.data ? "تعديل صنف فرعي" : "إضافة صنف فرعي"}>
                <AddScategorieOpForm 
                    key={modalState.timestamp ? `scat-${modalState.timestamp}` : 'add-scat'}
                    onClose={() => setModalState({ type: null })} 
                    onSave={(data) => handleSave('T_SCATEGORIE_OP', data, 'ID_SCATEGORIE_OP')} 
                    operationId={operationId} 
                    scategories={availableScategories} 
                    initialData={modalState.data} 
                />
            </Modal>
            <Modal isOpen={modalState.type === 'LOT'} onClose={() => setModalState({ type: null })} title={modalState.data ? "تعديل حصة" : "إضافة حصة"}>
                <AddLotForm 
                    key={modalState.timestamp ? `lot-${modalState.timestamp}` : 'add-lot'}
                    onClose={() => setModalState({ type: null })} 
                    onSave={(data) => handleSave('T_LOT_OPERATION', data, 'ID_LOT')} 
                    operationId={operationId} 
                    initialData={modalState.data} 
                />
            </Modal>
            <Modal isOpen={modalState.type === 'ENGAGEMENT'} onClose={() => setModalState({ type: null })} title={modalState.data ? "تعديل التزام" : "إضافة التزام"} maxWidth="2xl">
                <AddEngagementForm 
                    key={modalState.timestamp ? `eng-${modalState.timestamp}` : 'add-eng'}
                    onClose={() => setModalState({ type: null })} 
                    onSave={(data) => handleSave('T_ENGAGEMENT', data, 'ID_ENGAGEMENT')} 
                    operationId={operationId} 
                    pieces={operationPieces} 
                    rubriqueOps={rubriquesOp} 
                    initialData={modalState.data}
                    allEngagementsForOp={engagements}
                    selectedYear={selectedPaymentYear}
                    defaultPieceId={modalState.extraData?.defaultPieceId}
                />
            </Modal>
            <Modal isOpen={modalState.type === 'PAIEMENT'} onClose={() => setModalState({ type: null })} title={modalState.data ? "تعديل دفع" : "إضافة دفع"} maxWidth="2xl">
                <AddPaiementForm 
                    key={modalState.timestamp ? `pai-${modalState.timestamp}` : 'add-pai'}
                    onClose={() => setModalState({ type: null })} 
                    onSave={(data) => handleSave('T_PAIEMENT', data, 'ID_PAIEMENT')} 
                    operationId={operationId} 
                    engagements={engagements} 
                    pieces={operationPieces} 
                    cpItems={db.T_CP}
                    initialData={modalState.data} 
                    allPaiementsForOp={paiements}
                    selectedYear={selectedPaymentYear}
                    defaultPieceId={modalState.extraData?.defaultPieceId}
                />
            </Modal>
            <Modal isOpen={modalState.type === 'BORDEREAU'} onClose={() => setModalState({ type: null })} title={modalState.data ? "تعديل جدول إرسال" : "إضافة جدول إرسال"}>
                <AddBordereauForm 
                    key={modalState.timestamp ? `bor-${modalState.timestamp}` : 'add-bor'}
                    operationId={operationId}
                    onClose={() => setModalState({ type: null })}
                    editItem={modalState.data}
                />
            </Modal>
        </PageWrapper>
    );
};

export default OperationDetailsPage;
