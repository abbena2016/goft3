export type Page = 'LOGIN' | 'HOME' | 'OPERATIONS' | 'OPERATION_DETAILS' | 'DOCUMENTS' | 'DOCUMENT_DETAILS' | 'BENEFICIARIES' | 'FINANCIAL_STATUS' | 'FINANCIAL_STATUS_BY_STRUCTURE' | 'SETTINGS' | 'PROGRAMME' | 'CATEGORIE' | 'DIRECTION' | 'RUBRIQUE' | 'PRINT_ENGAGEMENT' | 'PRINT_PAIEMENT' | 'PRINT_CERTIFICAT' | 'PRINT_MANDAT' | 'PRINT_DECLARATION' | 'PRINT_MANDAT_TABLE' | 'PRINT_FINANCIAL_STATUS_BY_STRUCTURE' | 'PRINT_FINANCIAL_STATUS_BY_STRUCTURE_COMMITMENT' | 'PRINT_OPERATIONS_TABLE' | 'PRINT_FINANCIAL_STATUS' | 'PRINT_PROJECT_TRACKING' | 'USERS' | 'PROJECT_TRACKING' | 'PAYMENT_CLAIMS' | 'PRINT_PAYMENT_CLAIMS' | 'AE_INSUFFICIENCY' | 'PRINT_AE_INSUFFICIENCY' | 'CUSTOM_REPORT' | 'VISAED_ENGAGEMENTS' | 'APPENDIX_01' | 'PRINT_BORDEREAU' | 'LOTS_REPORT' | 'MONTHLY_COMMITMENTS_REPORT' | 'MONTHLY_PAYMENTS_REPORT' | 'PRINT_MONTHLY_COMMITMENTS' | 'PRINT_MONTHLY_PAYMENTS' | 'SYSTEM_DOCUMENTATION' | 'PRINT_ORDRE_RECETTE' | 'PRINT_AVIS_ORDRE_RECETTE' | 'PRINT_BORDEREAU_RECETTES';

// إصدار التطبيق الحالي
export const APP_VERSION = '1.2.0';

// استخدام صيغة Data URL لضمان ظهور الصورة دائماً بغض النظر عن مشاكل المسارات في Vite أو Electron
export const logoDataUrl = 'data:image/png;base64,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';
export interface User {
    ID_USER: number;
    USERNAME: string;
    PASSWORD: string;
    ROLE: 'admin' | 'user' | 'viewer';
    ALLOWED_PAGES?: string; // JSON string of Page[]
    ALLOWED_OPERATIONS?: string; // JSON string of number[]
    MUST_CHANGE_PASSWORD?: boolean; // When true, the user must set a new password on next login
}

export interface AppEvent {
    id: string;
    username: string;
    actionType: 'add' | 'update' | 'delete' | 'print' | 'reset' | 'import';
    description: string;
    timestamp: string;
}

export interface Beneficiaire {
    ID_BENEFICIAIRE: number;
    BENEFICIAIRE: string;
    ACTIVITE?: string;
    ADRESSE: string;
    RC: string | null;
    CODE_FISCALE: string | null;
}

export interface CompteBancaire {
    ID_COMPTE: number;
    ID_BENEFICIAIRE: number;
    RIB: string;
    BANQUE: string;
}

export interface Categorie {
    ID_CATEGORIE: number;
    C_CATEGORIE: string;
    INT_CATEGORIE: string;
}

export interface Scategorie {
    ID_SCATEGORIE: number;
    ID_CATEGORIE: number;
    C_SCATEGORIE: string;
    INT_SCATEGORIE: string;
}

export interface Operation {
    ID_OPERATION: number;
    N_OPERATION: string;
    N_OPERATION_ANCIEN: string | null;
    INT_OPERATION: string;
    ID_CATEGORIE: number;
    ID_SCATEGORIE: number | null;
    status: 'جارية' | 'مغلقة';
    TYPE_OP?: string | null;
    CREATED_BY: string | null;
}

export interface Rubrique {
    ID_RUBRIQUE: number;
    RUBRIQUE: string;
}

export interface Direction {
    ID_DIRECTION: number;
    PORTEFEUILLE: string;
    INT_PORTEFEUILLE: string;
    ORDONATEUR: string;
    DIRECTION: string;
    ACTION: string;
    INT_ACTION: string;
    SACTION: string | null;
    INT_SACTION: string | null;
}

export interface Programme {
    ID_PROGRAMME: number;
    PROGRAMME: string;
    INT_PROGRAMME: string;
}

export interface Sprogramme {
    ID_SPROGRAMME: number;
    ID_PROGRAMME: number;
    SPROGRAMME: string;
    INT_SPROGRAMME: string;
}

export interface Cp {
    ID_CP: number;
    ID_OPERATION: number;
    ANNEE: string;
    MONTANT_INITIALE_CP: number;
    MONTANT_FINALE_CP: number;
}

export interface RubriqueOp {
    ID_RUBRIQUE_OP: number;
    ID_OPERATION: number;
    ID_RUBRIQUE: number;
    MONTANT_INITIALE: number;
    MONTANT_FINALE: number | null;
}

export interface ScategorieOp {
    ID_SCATEGORIE_OP: number;
    ID_OPERATION: number;
    ID_SCATEGORIE: number;
    MONTANT_INITIALE: number;
    MONTANT_FINALE: number | null;
}

export interface LotOperation {
    ID_LOT: number;
    ID_OPERATION: number;
    N_LOT: string;
    INTITULE_LOT: string;
    MONTANT_INITIALE_LOT: number;
    MONTANT_FINALE_LOT: number;
    ATTRIBUER: boolean;
}

export interface Piece {
    ID_PIECE: number;
    NAT_PIECE: string;
    ID_PIECE_INIT: number | null;
    ID_OPERATION: number;
    PIECE: string;
    ID_BENEFICIAIRE: number | null;
    ID_COMPTE: number | null;
    MONTANT_PIECE: number;
    ID_SCATEGORIE: number;
    ID_RUBRIQUE: number | null;
    DELAI_EX_JOURS: string | null;
    SAI_ENG: boolean;
    SAI_PAI: boolean;
    N_VISA_CM: string | null;
    DATE_VISA_CM: string | null;
    CAUTION?: string | null;
    TYPE_CAUTION?: string | null;
    DATE_OD_PIECE?: string | null;
    N_OD_PIECE?: string | null;
    DATE_DEPOT_PIECE?: string | null;
    BORDEREAU_PIECE?: string | null;
}

export interface LotPiece {
    ID_LOT_PIECE: number;
    ID_LOT: number;
    ID_PIECE: number;
    DELAI_EX_JOURS: string | null;
}

export interface Ods {
    ID_ODS: number;
    OBJET_ODS: string;
    NATURE_ODS: string;
    DATE_ODS: string;
    ID_PIECE: number;
    ID_LOT: number | null;
}

export interface Engagement {
    ID_ENGAGEMENT: number;
    ID_OPERATION: number;
    ID_PIECE: number;
    ID_BORDEREAU: number | null;
    N_ENG: string;
    ANNEE: string;
    NATURE_ENG: string;
    OBJET_ENG: string;
    MONTANT_ENG: number;
    AE_ENG: number;
    TOTAL_ENG_ANTERIEURE: number;
    SOLDE_ANTERIEURE: number;
    SOLDE_RELIQUAT: number;
    DATE_ENG: string;
    N_VISA_CB: string | null;
    DATE_VISA_CB: string;
    BORD_OBJET?: string;
    BORD_DOCS?: string;
    BORD_COPIES?: string;
}

export interface Bordereau {
    ID_BORDEREAU: number;
    ID_PIECE?: number;
    N_BORDEREAU: string | null;
    ANNEE: string;
    DATE_BORDEREAU: string;
    DESTINATAIRE: string;
    DOCUMENTS_JOINTS: string | null;
    COPIES_NOTE: string | null;
}

export interface Paiement {
    ID_PAIEMENT: number;
    ID_OPERATION: number;
    ID_ENG: number;
    ID_PIECE: number;
    N_PAI: string;
    ANNEE: string;
    DATE_PAI: string;
    OBJET_PAI: string;
    MONTANT_PAI: number;
    TOTAL_PAI: number;
    N_MANDAT: string | null;
    DATE_MANDAT: string | null;
    DATE_ADMIS: string | null;
    MONTANT_TRAVAUX_REALISES: number | null;
    AVANCE_FORFAITAIRE: number | null;
    AVANCE_APPROVISIONNEMENT: number | null;
    RETENUE_GARANTIE: number | null;
    PENALITE_RETARD: number | null;
    AUTRE_DEDUCTION: number | null;
    REMBOURSEMENT_AVANCE_FORFAITAIRE: number | null;
    REMBOURSEMENT_AVANCE_APPROVISIONNEMENT: number | null;
}

export interface OnlineUser {
    userId: string | number;
    username: string;
    role: string;
    onlineAt: string;
}

export interface Notification {
    id: string;
    type: 'overdue' | 'upcoming' | 'financial_alert' | 'unapproved_engagement' | 'unaccepted_payment' | 'overdue_service_order' | 'approaching_service_order' | 'missing_bordereau' | 'consumption_alert' | 'long_delays' | 'payment_claim_alert' | 'ae_structure_insufficiency' | 'unregistered_document';
    message: string;
    pieceId?: number;
    operationId?: number;
    engagementId?: number;
    paiementId?: number;
    deadline?: Date;
    days?: number;
}

export interface Database {
    T_USER: User[];
    T_BENEFICIAIRE: Beneficiaire[];
    T_CATEGORIE: Categorie[];
    T_CP: Cp[];
    T_DIRECTION: Direction[];
    T_ENGAGEMENT: Engagement[];
    T_LOT_OPERATION: LotOperation[];
    T_LOT_PIECE: LotPiece[];
    T_ODS: Ods[];
    T_OPERATION: Operation[];
    T_PAIEMENT: Paiement[];
    T_PIECE: Piece[];
    T_PROGRAMME: Programme[];
    T_RUBRIQUE: Rubrique[];
    T_RUBRIQUE_OP: RubriqueOp[];
    T_SCATEGORIE: Scategorie[];
    T_SCATEGORIE_OP: ScategorieOp[];
    T_SPROGRAMME: Sprogramme[];
    T_COMPTE_BANCAIRE: CompteBancaire[];
    T_BORDEREAU: Bordereau[];
}