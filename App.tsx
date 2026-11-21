
import React, { useState, useCallback, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPage = lazy(() => import('./pages/LoginPage'));
import HomePage from './pages/HomePage';
import OperationsPage from './pages/OperationsPage';
import OperationDetailsPage from './pages/OperationDetailsPage';
import DocumentDetailsPage from './pages/DocumentDetailsPage';
import DocumentsPage from './pages/DocumentsPage';
import BeneficiairesPage from './pages/BeneficiairesPage';
import FinancialStatusPage from './pages/FinancialStatusPage';
import FinancialStatusByStructurePage from './pages/FinancialStatusByStructurePage';
import ProjectTrackingPage from './pages/ProjectTrackingPage';
import SettingsPage from './pages/SettingsPage';
import ProgrammePage from './pages/ProgrammePage';
import CategoriePage from './pages/CategoriePage';
import DirectionPage from './pages/DirectionPage';
import RubriquePage from './pages/RubriquePage';
import UsersPage from './pages/UsersPage';
import PrintEngagementPage from './pages/PrintEngagementPage';
import PrintPaiementPage from './pages/PrintPaiementPage';
import PrintCertificatPage from './pages/PrintCertificatPage';
import PrintMandatPage from './pages/PrintMandatPage';
import PrintDeclarationPage from './pages/PrintDeclarationPage';
import PrintMandatTablePage from './pages/PrintMandatTablePage';
import PrintFinancialStatusByStructurePage from './pages/PrintFinancialStatusByStructurePage';
import PrintFinancialStatusByStructureCommitmentPage from './pages/PrintFinancialStatusByStructureCommitmentPage';
import PrintOperationsTablePage from './pages/PrintOperationsTablePage';
import PrintFinancialStatusPage from './pages/PrintFinancialStatusPage';
import PrintProjectTrackingPage from './pages/PrintProjectTrackingPage';
import PaymentClaimsPage from './pages/PaymentClaimsPage';
import PrintPaymentClaimsPage from './pages/PrintPaymentClaimsPage';
import AeInsufficiencyPage from './pages/AeInsufficiencyPage';
import LotsReportPage from './pages/LotsReportPage';
import PrintAeInsufficiencyPage from './pages/PrintAeInsufficiencyPage';
import PrintBordereauPage from './pages/PrintBordereauPage';
import CustomReportPage from './pages/CustomReportPage';
import VisaedEngagementsPage from './pages/VisaedEngagementsPage';
import Appendix01Page from './pages/Appendix01Page';
import MonthlyCommitmentsPage from './pages/MonthlyCommitmentsPage';
import MonthlyPaymentsPage from './pages/MonthlyPaymentsPage';
import PrintMonthlyCommitmentsPage from './pages/PrintMonthlyCommitmentsPage';
import PrintMonthlyPaymentsPage from './pages/PrintMonthlyPaymentsPage';
import PrintOrdreRecettePage from './pages/PrintOrdreRecettePage';
import PrintAvisOrdreRecettePage from './pages/PrintAvisOrdreRecettePage';
import PrintBordereauRecettesPage from './pages/PrintBordereauRecettesPage';
import SystemDocumentationPage from './pages/SystemDocumentationPage';
import SplashScreen from './components/SplashScreen';
import Modal from './components/Modal';
import { DataProvider, useData } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { AlertProvider } from './context/AlertContext';
import GlobalSearch from './components/GlobalSearch';
import TitleBar from './components/TitleBar';
import { Page, User, APP_VERSION } from './types';
import { checkForUpdates, UpdateInfo } from './utils/updateService';
import { setWindowSize, showWindow } from './utils/windowControls';

const AuthenticatedApp: React.FC<{
    currentPage: Page;
    navigate: (page: Page, id?: number, tab?: string) => void;
    onLogout: () => void;
    onGoBack?: () => void;
    onUpdateUser: (user: User) => void;
    canGoBack?: boolean;
    currentUser: User;
    selectedOperationId: number | null;
    selectedEngagementId: number | null;
    selectedPaiementId: number | null;
    selectedTab?: string;
}> = ({ currentPage, navigate, onLogout, onGoBack, onUpdateUser, currentUser, selectedOperationId, selectedEngagementId, selectedPaiementId, selectedTab }) => {
    const { isInitialLoad, joinPresence, leavePresence, refreshData } = useData();
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const onGoBackRef = useRef(onGoBack);
    useEffect(() => {
        onGoBackRef.current = onGoBack;
    }, [onGoBack]);

    // Presence lifecycle is kept in its own effect so it is not torn down on
    // navigation. It only re-runs when the current user changes or on unmount,
    // so the presence channel stays alive across navigation. Reconnect retries
    // are handled inside DataContext (joinPresence re-tracks when online).
    useEffect(() => {
        joinPresence(currentUser);
        return () => {
            leavePresence();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    useEffect(() => {
        // Chargement réseau complet après connexion (le backup local a déjà affiché le login)
        refreshData();

        // Auto check for updates on mount
        const runUpdateCheck = async () => {
            const result = await checkForUpdates();
            if (result?.hasUpdate) {
                setUpdateInfo(result);
            }
        };
        runUpdateCheck();

        // Keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const isCtrl = e.ctrlKey || e.metaKey;

            if (isCtrl && key === 'k') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
                return;
            }
            if (e.altKey && key === 's') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
                return;
            }
            if (isCtrl && key === 'o') {
                e.preventDefault();
                navigate('OPERATIONS');
                return;
            }
            if (isCtrl && key === 'd') {
                e.preventDefault();
                navigate('DOCUMENTS');
                return;
            }
            if (isCtrl && key === 'b') {
                e.preventDefault();
                navigate('BENEFICIARIES');
                return;
            }
            if (isCtrl && key === 's') {
                e.preventDefault();
                navigate('SETTINGS');
                return;
            }
            if (isCtrl && key === 'h') {
                e.preventDefault();
                navigate('HOME');
                return;
            }
            if (isCtrl && key === 'f') {
                e.preventDefault();
                navigate('FINANCIAL_STATUS');
                return;
            }
            if (isCtrl && key === 'p') {
                e.preventDefault();
                navigate('PROGRAMME');
                return;
            }
            if (e.altKey && key === 'c') {
                e.preventDefault();
                navigate('CATEGORIE');
                return;
            }
            if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'ArrowRight' || e.key === 'Right')) {
                e.preventDefault();
                if (onGoBackRef.current) {
                    onGoBackRef.current();
                }
                return;
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        const handleOpenSearch = () => setIsSearchOpen(true);
        window.addEventListener('open-global-search', handleOpenSearch);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('open-global-search', handleOpenSearch);
        };
    }, [currentUser, navigate, refreshData]);

    const renderPage = useMemo(() => {
        const isAdmin = currentUser.ROLE === 'admin';
        const isViewer = currentUser.ROLE === 'viewer';

        const adminOnlyPages: Page[] = ['SETTINGS', 'USERS', 'PROGRAMME', 'CATEGORIE', 'DIRECTION', 'RUBRIQUE'];

        const viewerAllowedPages: Page[] = [
            'HOME',
            'OPERATIONS',
            'OPERATION_DETAILS',
            'DOCUMENT_DETAILS',
            'DOCUMENTS',
            'BENEFICIARIES',
            'FINANCIAL_STATUS',
            'FINANCIAL_STATUS_BY_STRUCTURE',
            'PROJECT_TRACKING',
            'PAYMENT_CLAIMS',
            'AE_INSUFFICIENCY',
            'LOTS_REPORT',
            'PRINT_ENGAGEMENT', 'PRINT_PAIEMENT', 'PRINT_CERTIFICAT',
            'PRINT_MANDAT', 'PRINT_DECLARATION', 'PRINT_MANDAT_TABLE',
            'PRINT_FINANCIAL_STATUS_BY_STRUCTURE', 'PRINT_FINANCIAL_STATUS_BY_STRUCTURE_COMMITMENT', 'PRINT_OPERATIONS_TABLE',
            'PRINT_FINANCIAL_STATUS', 'PRINT_PROJECT_TRACKING',
            'PRINT_PAYMENT_CLAIMS',
            'PRINT_AE_INSUFFICIENCY',
            'PRINT_BORDEREAU',
            'CUSTOM_REPORT',
            'VISAED_ENGAGEMENTS',
            'APPENDIX_01',
            'MONTHLY_COMMITMENTS_REPORT',
            'MONTHLY_PAYMENTS_REPORT',
            'PRINT_MONTHLY_COMMITMENTS',
            'PRINT_MONTHLY_PAYMENTS',
            'PRINT_ORDRE_RECETTE',
            'PRINT_AVIS_ORDRE_RECETTE',
            'PRINT_BORDEREAU_RECETTES',
            'SYSTEM_DOCUMENTATION'
        ];

        // Custom restrictions based on ALLOWED_PAGES
        if (!isAdmin && currentUser.ALLOWED_PAGES) {
            try {
                const allowedPages = JSON.parse(currentUser.ALLOWED_PAGES) as Page[];
                // Always allow HOME and LOGIN
                const essentialPages: Page[] = ['HOME', 'LOGIN'];
                if (allowedPages.length > 0 && !allowedPages.includes(currentPage) && !essentialPages.includes(currentPage)) {
                    // Check if it's a sub-page or print page that might be allowed implicitly?
                    // For now, if not in list, redirect to HOME
                    if (!currentPage.startsWith('PRINT_') && currentPage !== 'OPERATION_DETAILS' && currentPage !== 'DOCUMENT_DETAILS') {
                         return <HomePage navigate={navigate} currentUser={currentUser} />;
                    }
                }
            } catch (e) {
                console.error("Error parsing allowed pages", e);
            }
        }

        if (isViewer && !viewerAllowedPages.includes(currentPage)) {
            return <HomePage navigate={navigate} currentUser={currentUser} />;
        }

        if (adminOnlyPages.includes(currentPage) && !isAdmin) {
            return <HomePage navigate={navigate} currentUser={currentUser} />;
        }

        switch (currentPage) {
            case 'HOME':
                return <HomePage navigate={navigate} currentUser={currentUser} />;
            case 'OPERATIONS':
                return <OperationsPage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} onUpdateUser={onUpdateUser} />;
            case 'OPERATION_DETAILS':
                // Record-level safety check for OPERATION_DETAILS
                if (!isAdmin && currentUser.ALLOWED_OPERATIONS && selectedOperationId) {
                    try {
                        const allowedOps = JSON.parse(currentUser.ALLOWED_OPERATIONS) as any[];
                        if (allowedOps.length > 0 && !allowedOps.map(Number).includes(Number(selectedOperationId))) {
                             return <HomePage navigate={navigate} currentUser={currentUser} />;
                        }
                    } catch (e) {
                         console.error("Error parsing allowed operations in App.tsx", e);
                    }
                }
                return <OperationDetailsPage navigate={navigate} operationId={selectedOperationId!} initialTab={selectedTab} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'DOCUMENTS':
                return <DocumentsPage navigate={navigate} initialOperationId={selectedOperationId} initialPieceId={selectedTab} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'DOCUMENT_DETAILS':
                return <DocumentDetailsPage navigate={navigate} pieceId={selectedOperationId!} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'BENEFICIARIES':
                return <BeneficiairesPage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} initialBeneficiaryId={selectedOperationId} />;
            case 'FINANCIAL_STATUS':
                return <FinancialStatusPage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'FINANCIAL_STATUS_BY_STRUCTURE':
                return <FinancialStatusByStructurePage 
                    navigate={navigate} 
                    currentUser={currentUser} 
                    onGoBack={onGoBack} 
                    initialOperationId={selectedOperationId}
                    initialRubricId={selectedTab}
                />;
            case 'PROJECT_TRACKING':
                return <ProjectTrackingPage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'PAYMENT_CLAIMS':
                return <PaymentClaimsPage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'AE_INSUFFICIENCY':
                return <AeInsufficiencyPage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'LOTS_REPORT':
                return <LotsReportPage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'CUSTOM_REPORT':
                return <CustomReportPage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'VISAED_ENGAGEMENTS':
                return <VisaedEngagementsPage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'APPENDIX_01':
                return <Appendix01Page navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'MONTHLY_COMMITMENTS_REPORT':
                return <MonthlyCommitmentsPage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'MONTHLY_PAYMENTS_REPORT':
                return <MonthlyPaymentsPage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'SETTINGS':
                return <SettingsPage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'USERS':
                return <UsersPage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'PROGRAMME':
                return <ProgrammePage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'CATEGORIE':
                return <CategoriePage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'DIRECTION':
                return <DirectionPage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'RUBRIQUE':
                return <RubriquePage navigate={navigate} currentUser={currentUser} onGoBack={onGoBack} />;
            case 'PRINT_ENGAGEMENT':
                return <PrintEngagementPage navigate={navigate} engagementId={selectedEngagementId!} />;
            case 'PRINT_PAIEMENT':
                return <PrintPaiementPage navigate={navigate} paiementId={selectedPaiementId!} />;
            case 'PRINT_CERTIFICAT':
                return <PrintCertificatPage navigate={navigate} paiementId={selectedPaiementId!} />;
            case 'PRINT_MANDAT':
                return <PrintMandatPage navigate={navigate} paiementId={selectedPaiementId!} />;
            case 'PRINT_DECLARATION':
                return <PrintDeclarationPage navigate={navigate} paiementId={selectedPaiementId!} />;
            case 'PRINT_MANDAT_TABLE':
                return <PrintMandatTablePage navigate={navigate} paiementId={selectedPaiementId!} />;
            case 'PRINT_FINANCIAL_STATUS_BY_STRUCTURE':
                return <PrintFinancialStatusByStructurePage navigate={navigate} operationId={selectedOperationId!} />;
            case 'PRINT_FINANCIAL_STATUS_BY_STRUCTURE_COMMITMENT':
                return <PrintFinancialStatusByStructureCommitmentPage navigate={navigate} operationId={selectedOperationId!} />;
            case 'PRINT_OPERATIONS_TABLE':
                return <PrintOperationsTablePage navigate={navigate} />;
            case 'PRINT_FINANCIAL_STATUS':
                return <PrintFinancialStatusPage navigate={navigate} />;
            case 'PRINT_PROJECT_TRACKING':
                return <PrintProjectTrackingPage navigate={navigate} operationId={selectedOperationId!} />;
            case 'PRINT_PAYMENT_CLAIMS':
                return <PrintPaymentClaimsPage navigate={navigate} operationId={selectedOperationId!} />;
            case 'PRINT_AE_INSUFFICIENCY':
                return <PrintAeInsufficiencyPage navigate={navigate} operationId={selectedOperationId!} />;
            case 'PRINT_BORDEREAU':
                return <PrintBordereauPage navigate={navigate} operationId={selectedOperationId!} />;
            case 'PRINT_MONTHLY_COMMITMENTS':
                return <PrintMonthlyCommitmentsPage navigate={navigate} />;
            case 'PRINT_MONTHLY_PAYMENTS':
                return <PrintMonthlyPaymentsPage navigate={navigate} />;
            case 'PRINT_ORDRE_RECETTE':
                return <PrintOrdreRecettePage navigate={navigate} paiementId={selectedPaiementId!} variant="ORDRE" />;
            case 'PRINT_AVIS_ORDRE_RECETTE':
                return <PrintAvisOrdreRecettePage navigate={navigate} paiementId={selectedPaiementId!} />;
            case 'PRINT_BORDEREAU_RECETTES':
                return <PrintBordereauRecettesPage navigate={navigate} paiementId={selectedPaiementId!} />;
            case 'SYSTEM_DOCUMENTATION':
                return <SystemDocumentationPage navigate={navigate} onGoBack={onGoBack} currentUser={currentUser} />;
            default:
                return <HomePage navigate={navigate} currentUser={currentUser} />;
        }
    }, [currentUser, currentPage, navigate, onLogout, selectedEngagementId, selectedOperationId, selectedPaiementId, selectedTab, onGoBack, onUpdateUser]);

    if (isInitialLoad) {
        return (
            <div className="flex items-center justify-center min-h-full bg-gray-100">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-xl font-semibold text-gray-700">جار تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    {renderPage}
                </motion.div>
            </AnimatePresence>

            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} navigate={navigate} />

            {/* New Update Found Modal */}
            {updateInfo && (
                <Modal isOpen={!!updateInfo} onClose={() => setUpdateInfo(null)} title="تحديث جديد متوفر" maxWidth="md">
                    <div className="p-2 text-center">
                        <div className="mb-3">
                            <i className="bi bi-cloud-arrow-down-fill text-5xl text-blue-600"></i>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 mb-1">يتوفر إصدار جديد!</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            الإصدار الحالي: <span className="font-mono font-bold">{APP_VERSION}</span> <br />
                            الإصدار الجديد: <span className="font-mono font-bold text-green-600">{updateInfo.latestVersion}</span>
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                            هل ترغب في تحميل التحديث الآن؟ سيتم فتح رابط التحميل في المتصفح.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setUpdateInfo(null)}
                                className="px-4 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                            >
                                لاحقاً
                            </button>
                            <a
                                href={updateInfo.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm inline-block"
                            >
                                نعم، حدث الآن
                            </a>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};


const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        // Clear any old localstorage user to enforce session-only auth
        localStorage.removeItem('goft3_user');
        
        const storedUser = sessionStorage.getItem('goft3_user');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch (e) {
                sessionStorage.removeItem('goft3_user');
                return null;
            }
        }
        return null;
    });

    const [currentPage, setCurrentPage] = useState<Page>(() => {
        if (!sessionStorage.getItem('goft3_user')) {
            return 'LOGIN';
        }
        const page = localStorage.getItem('goft3_page') as Page;
        const printPages: Page[] = [
            'PRINT_ENGAGEMENT', 'PRINT_PAIEMENT', 'PRINT_CERTIFICAT',
            'PRINT_MANDAT', 'PRINT_DECLARATION', 'PRINT_MANDAT_TABLE',
            'PRINT_FINANCIAL_STATUS_BY_STRUCTURE', 'PRINT_FINANCIAL_STATUS_BY_STRUCTURE_COMMITMENT', 'PRINT_OPERATIONS_TABLE',
            'PRINT_FINANCIAL_STATUS', 'PRINT_PROJECT_TRACKING', 'PRINT_PAYMENT_CLAIMS',
            'PRINT_AE_INSUFFICIENCY', 'PRINT_BORDEREAU', 'PRINT_MONTHLY_COMMITMENTS', 'PRINT_MONTHLY_PAYMENTS',
            'PRINT_ORDRE_RECETTE', 'PRINT_AVIS_ORDRE_RECETTE', 'PRINT_BORDEREAU_RECETTES'
        ];
        if (printPages.includes(page)) {
            return 'HOME';
        }
        return page || 'HOME';
    });

    const [selectedOperationId, setSelectedOperationId] = useState<number | null>(() => {
        const stored = localStorage.getItem('goft3_operation_id');
        return stored ? parseInt(stored, 10) : null;
    });
    const [selectedEngagementId, setSelectedEngagementId] = useState<number | null>(() => {
        const stored = localStorage.getItem('goft3_engagement_id');
        return stored ? parseInt(stored, 10) : null;
    });
    const [selectedPaiementId, setSelectedPaiementId] = useState<number | null>(() => {
        const stored = localStorage.getItem('goft3_paiement_id');
        return stored ? parseInt(stored, 10) : null;
    });
    const [selectedTab, setSelectedTab] = useState<string | undefined>(() => {
        return localStorage.getItem('goft3_tab') || undefined;
    });

    const [navigationHistory, setNavigationHistory] = useState<{page: Page, id: number | null, tab?: string}[]>([]);

    // Redimensionne la fenêtre selon l'état de connexion :
    // - non connecté : petite fenêtre de connexion centrée
    // - connecté : grande fenêtre principale
    // Puis affiche la fenêtre une fois l'interface prête (évite le flash blanc).
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentUser) {
                setWindowSize(1280, 850);
            } else {
                setWindowSize(560, 720);
            }
            showWindow();
        }, 100);
        return () => clearTimeout(timer);
    }, [currentUser]);

    useEffect(() => {
        const printPages: Page[] = [
            'PRINT_ENGAGEMENT', 'PRINT_PAIEMENT', 'PRINT_CERTIFICAT',
            'PRINT_MANDAT', 'PRINT_DECLARATION', 'PRINT_MANDAT_TABLE',
            'PRINT_FINANCIAL_STATUS_BY_STRUCTURE', 'PRINT_FINANCIAL_STATUS_BY_STRUCTURE_COMMITMENT', 'PRINT_OPERATIONS_TABLE',
            'PRINT_FINANCIAL_STATUS', 'PRINT_PROJECT_TRACKING', 'PRINT_PAYMENT_CLAIMS',
            'PRINT_AE_INSUFFICIENCY', 'PRINT_BORDEREAU', 'PRINT_MONTHLY_COMMITMENTS', 'PRINT_MONTHLY_PAYMENTS',
            'PRINT_ORDRE_RECETTE', 'PRINT_AVIS_ORDRE_RECETTE', 'PRINT_BORDEREAU_RECETTES'
        ];
        if (currentUser && !printPages.includes(currentPage)) {
            localStorage.setItem('goft3_page', currentPage);
        }
        
        // Persist IDs
        if (selectedOperationId !== null) localStorage.setItem('goft3_operation_id', selectedOperationId.toString());
        else localStorage.removeItem('goft3_operation_id');
        
        if (selectedEngagementId !== null) localStorage.setItem('goft3_engagement_id', selectedEngagementId.toString());
        else localStorage.removeItem('goft3_engagement_id');
        
        if (selectedPaiementId !== null) localStorage.setItem('goft3_paiement_id', selectedPaiementId.toString());
        else localStorage.removeItem('goft3_paiement_id');
        
        if (selectedTab) localStorage.setItem('goft3_tab', selectedTab);
        else localStorage.removeItem('goft3_tab');
        
    }, [currentPage, currentUser, selectedOperationId, selectedEngagementId, selectedPaiementId, selectedTab]);


    const handleLogin = useCallback((user: User) => {
        setCurrentUser(user);
        sessionStorage.setItem('goft3_user', JSON.stringify(user));
        
        // Restore previous page if exists, otherwise default to HOME
        const savedPage = localStorage.getItem('goft3_page') as Page;
        setCurrentPage(savedPage || 'HOME');
    }, []);

    const handleUpdateUser = useCallback((user: User) => {
        setCurrentUser(user);
        sessionStorage.setItem('goft3_user', JSON.stringify(user));
    }, []);

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
        sessionStorage.removeItem('goft3_user');
        localStorage.removeItem('goft3_page');
        localStorage.removeItem('goft3_operation_id');
        localStorage.removeItem('goft3_engagement_id');
        localStorage.removeItem('goft3_paiement_id');
        localStorage.removeItem('goft3_tab');
        setCurrentPage('LOGIN');
    }, []);

    const navigate = useCallback((page: Page, id?: number, tab?: string) => {
        setNavigationHistory(prev => {
            // Avoid duplicates at the top of the stack
            if (prev.length > 0 && prev[prev.length - 1].page === currentPage && prev[prev.length - 1].id === selectedOperationId) {
                return prev;
            }
            return [...prev, { page: currentPage, id: selectedOperationId, tab: selectedTab }];
        });

        setCurrentPage(page);
        setSelectedTab(tab);

        const opId = (id !== undefined && id !== null && !isNaN(id)) ? id : null;

        if (page === 'OPERATION_DETAILS' || page === 'DOCUMENT_DETAILS' || page === 'DOCUMENTS' || page === 'BENEFICIARIES' || page === 'FINANCIAL_STATUS_BY_STRUCTURE' || page === 'PRINT_FINANCIAL_STATUS_BY_STRUCTURE' || page === 'PRINT_FINANCIAL_STATUS_BY_STRUCTURE_COMMITMENT' || page === 'PRINT_PROJECT_TRACKING' || page === 'PRINT_PAYMENT_CLAIMS' || page === 'PRINT_AE_INSUFFICIENCY' || page === 'PRINT_BORDEREAU' || page === 'CUSTOM_REPORT') {
            setSelectedOperationId(opId);
        } else if (page === 'PRINT_ENGAGEMENT') {
            setSelectedEngagementId(opId);
        } else if (page === 'PRINT_PAIEMENT' || page === 'PRINT_CERTIFICAT' || page === 'PRINT_MANDAT' || page === 'PRINT_DECLARATION' || page === 'PRINT_MANDAT_TABLE' || page === 'PRINT_ORDRE_RECETTE' || page === 'PRINT_AVIS_ORDRE_RECETTE' || page === 'PRINT_BORDEREAU_RECETTES') {
            setSelectedPaiementId(opId);
        }
    }, [currentPage, selectedOperationId, selectedTab]);

    const goBack = useCallback(() => {
        setNavigationHistory(prev => {
            if (prev.length === 0) {
                setCurrentPage('HOME');
                return prev;
            }

            const newHistory = [...prev];
            const lastPage = newHistory.pop();
            
            if (lastPage) {
                setCurrentPage(lastPage.page);
                setSelectedOperationId(lastPage.id);
                setSelectedTab(lastPage.tab);
            }
            return newHistory;
        });
    }, []);

    return (
        <LanguageProvider>
                <DataProvider>
                    <ToastProvider>
                        <ConfirmProvider>
                        <AlertProvider>
                        <div className="bg-gray-100 h-screen text-gray-800 transition-colors duration-300 overflow-hidden flex flex-col">
                        <TitleBar
                            navigate={navigate}
                            currentUser={currentUser}
                            onLogout={handleLogout}
                            onGoBack={goBack}
                            canGoBack={navigationHistory.length > 0}
                        />
                        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
                        <AnimatePresence mode="wait">
                            {!currentUser ? (
                                <motion.div
                                    key="login"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full"
                                >
                                    <Suspense fallback={<SplashScreen />}>
                                        <LoginPage onLogin={handleLogin} />
                                    </Suspense>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="app"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full"
                                >
                                    <AuthenticatedApp
                                        currentPage={currentPage}
                                        navigate={navigate}
                                        onLogout={handleLogout}
                                        onGoBack={goBack}
                                        onUpdateUser={handleUpdateUser}
                                        canGoBack={navigationHistory.length > 0}
                                        currentUser={currentUser}
                                        selectedOperationId={selectedOperationId}
                                        selectedEngagementId={selectedEngagementId}
                                        selectedPaiementId={selectedPaiementId}
                                        selectedTab={selectedTab}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        </div>
                    </div>
                    </AlertProvider>
                    </ConfirmProvider>
                </ToastProvider>
            </DataProvider>
        </LanguageProvider>
    );
};

export default App;
