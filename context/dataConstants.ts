import { Database } from '../types';

export const LOCAL_DB_KEY = 'goft3_local_backup';
export const PENDING_ACTIONS_KEY = 'goft3_pending_actions';

export interface PendingAction {
    id: string;
    type: 'ADD' | 'UPDATE' | 'DELETE' | 'DELETE_OP';
    table: keyof Database | 'T_OPERATION_CASCADE';
    payload: any;
    timestamp: number;
    tempId?: number;
}

export const emptyDb: Database = {
    T_USER: [], T_BENEFICIAIRE: [], T_CATEGORIE: [], T_CP: [], T_DIRECTION: [], T_ENGAGEMENT: [],
    T_LOT_OPERATION: [], T_LOT_PIECE: [], T_ODS: [], T_OPERATION: [], T_PAIEMENT: [],
    T_PIECE: [], T_PROGRAMME: [], T_RUBRIQUE: [], T_RUBRIQUE_OP: [], T_SCATEGORIE: [],
    T_SCATEGORIE_OP: [], T_SPROGRAMME: [], T_COMPTE_BANCAIRE: [],
    T_BORDEREAU: [],
};

export const TABLE_ID_FIELDS: { [key: string]: string } = {
    T_USER: 'ID_USER', T_BENEFICIAIRE: 'ID_BENEFICIAIRE', T_CATEGORIE: 'ID_CATEGORIE', T_CP: 'ID_CP',
    T_DIRECTION: 'ID_DIRECTION', T_ENGAGEMENT: 'ID_ENGAGEMENT', T_LOT_OPERATION: 'ID_LOT',
    T_LOT_PIECE: 'ID_LOT_PIECE', T_ODS: 'ID_ODS', T_OPERATION: 'ID_OPERATION', T_PAIEMENT: 'ID_PAIEMENT',
    T_PIECE: 'ID_PIECE', T_PROGRAMME: 'ID_PROGRAMME', T_RUBRIQUE: 'ID_RUBRIQUE', T_RUBRIQUE_OP: 'ID_RUBRIQUE_OP',
    T_SCATEGORIE: 'ID_SCATEGORIE', T_SCATEGORIE_OP: 'ID_SCATEGORIE_OP', T_SPROGRAMME: 'ID_SPROGRAMME',
    T_COMPTE_BANCAIRE: 'ID_COMPTE', T_BORDEREAU: 'ID_BORDEREAU',
};

export const TABLE_AR_NAMES: { [key: string]: string } = {
    T_USER: 'مستخدم', T_BENEFICIAIRE: 'مستفيد', T_CATEGORIE: 'صنف', T_CP: 'اعتماد دفع',
    T_DIRECTION: 'مديرية', T_ENGAGEMENT: 'التزام', T_LOT_OPERATION: 'حصة',
    T_LOT_PIECE: 'رابط حصة', T_ODS: 'أمر خدمة', T_OPERATION: 'عملية', T_PAIEMENT: 'دفع',
    T_PIECE: 'وثيقة', T_PROGRAMME: 'برنامج', T_RUBRIQUE: 'هيكلة كلفة', T_RUBRIQUE_OP: 'هيكلة عملية',
    T_SCATEGORIE: 'صنف فرعي', T_SCATEGORIE_OP: 'صنف فرعي لعملية', T_SPROGRAMME: 'برنامج فرعي',
    T_COMPTE_BANCAIRE: 'حساب بنكي', T_BORDEREAU: 'جدول إرسال',
};

export const isNetworkError = (error: any): boolean => {
    if (!error) return false;
    const msg = (error.message || '').toLowerCase();
    const code = error.code;
    return (
        error instanceof TypeError ||
        msg.includes('fetch') ||
        msg.includes('network') ||
        msg.includes('timeout') ||
        msg.includes('cors') ||
        msg.includes('failed to reach') ||
        msg.includes('unreachable') ||
        code === 'PGRST000' ||
        error.status === 0 ||
        error.status === 502 ||
        error.status === 503 ||
        error.status === 504
    );
};

export const PIECE_ALLOWED_KEYS = [
    'NAT_PIECE', 'ID_PIECE_INIT', 'ID_OPERATION', 'PIECE',
    'ID_BENEFICIAIRE', 'ID_COMPTE', 'MONTANT_PIECE', 'ID_SCATEGORIE', 'ID_RUBRIQUE',
    'DELAI_EX_JOURS', 'SAI_ENG', 'SAI_PAI', 'N_VISA_CM', 'DATE_VISA_CM', 'CAUTION',
    'DATE_OD_PIECE', 'N_OD_PIECE', 'DATE_DEPOT_PIECE', 'BORDEREAU_PIECE'
];

export const RESET_TABLES: (keyof Database)[] = [
    'T_COMPTE_BANCAIRE', 'T_PAIEMENT', 'T_ENGAGEMENT', 'T_ODS', 'T_LOT_PIECE',
    'T_PIECE', 'T_RUBRIQUE_OP', 'T_SCATEGORIE_OP', 'T_LOT_OPERATION',
    'T_CP', 'T_OPERATION', 'T_SPROGRAMME', 'T_PROGRAMME', 'T_SCATEGORIE',
    'T_CATEGORIE', 'T_RUBRIQUE', 'T_BENEFICIAIRE', 'T_DIRECTION', 'T_USER'
];

export const IMPORT_TABLE_ORDER: (keyof Database)[] = [
    'T_USER', 'T_BENEFICIAIRE', 'T_CATEGORIE', 'T_DIRECTION', 'T_PROGRAMME', 'T_RUBRIQUE',
    'T_SCATEGORIE', 'T_SPROGRAMME', 'T_OPERATION', 'T_CP', 'T_LOT_OPERATION',
    'T_RUBRIQUE_OP', 'T_SCATEGORIE_OP', 'T_PIECE', 'T_ENGAGEMENT', 'T_ODS',
    'T_LOT_PIECE', 'T_PAIEMENT', 'T_COMPTE_BANCAIRE'
];
