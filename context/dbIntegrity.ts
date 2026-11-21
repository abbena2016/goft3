import { Database } from '../types';

export interface IntegrityIssues {
    brokenPieces: { piece: any; error: string; id_piece: number; id_operation: number }[];
    brokenEngagements: { engagement: any; error: string; id_engagement: number; id_piece: number; id_operation: number }[];
    brokenPaiements: { paiement: any; error: string; id_paiement: number; id_piece: number; id_operation: number }[];
}

export const emptyIntegrityIssues = (): IntegrityIssues => ({
    brokenPieces: [],
    brokenEngagements: [],
    brokenPaiements: [],
});

export const validateDatabaseIntegrity = (targetDb: Database): IntegrityIssues => {
    const issues = emptyIntegrityIssues();

    const ops = targetDb.T_OPERATION || [];
    const pieces = targetDb.T_PIECE || [];
    const engs = targetDb.T_ENGAGEMENT || [];
    const pais = targetDb.T_PAIEMENT || [];
    const scats = targetDb.T_SCATEGORIE || [];
    const rubrics = targetDb.T_RUBRIQUE || [];

    // 1. Check Pieces (T_PIECE)
    if (ops.length > 0) {
        pieces.forEach(p => {
            const opExists = ops.some(op => Number(op.ID_OPERATION) === Number(p.ID_OPERATION));
            if (!opExists) {
                const errMsg = `الوثيقة "${p.PIECE}" (ID: ${p.ID_PIECE}) ترتبط بعملية غير موجودة (ID_OPERATION: ${p.ID_OPERATION})`;
                console.warn(`[Data Integrity - Foreign Key Broken] ${errMsg}`);
                issues.brokenPieces.push({
                    piece: p,
                    error: errMsg,
                    id_piece: Number(p.ID_PIECE),
                    id_operation: Number(p.ID_OPERATION)
                });
            }

            if (p.ID_SCATEGORIE && scats.length > 0) {
                const scatExists = scats.some(sc => Number(sc.ID_SCATEGORIE) === Number(p.ID_SCATEGORIE));
                if (!scatExists) {
                    const errMsg = `الوثيقة "${p.PIECE}" (ID: ${p.ID_PIECE}) ترتبط بصنف فرعي غير موجود (ID_SCATEGORIE: ${p.ID_SCATEGORIE})`;
                    console.warn(`[Data Integrity - Foreign Key Broken] ${errMsg}`);
                    issues.brokenPieces.push({
                        piece: p,
                        error: errMsg,
                        id_piece: Number(p.ID_PIECE),
                        id_operation: Number(p.ID_OPERATION)
                    });
                }
            }

            if (p.ID_RUBRIQUE && rubrics.length > 0) {
                const rubExists = rubrics.some(rub => Number(rub.ID_RUBRIQUE) === Number(p.ID_RUBRIQUE));
                if (!rubExists) {
                    const errMsg = `الوثيقة "${p.PIECE}" (ID: ${p.ID_PIECE}) ترتبط بتفصيل هيكلة غير موجود (ID_RUBRIQUE: ${p.ID_RUBRIQUE})`;
                    console.warn(`[Data Integrity - Foreign Key Broken] ${errMsg}`);
                    issues.brokenPieces.push({
                        piece: p,
                        error: errMsg,
                        id_piece: Number(p.ID_PIECE),
                        id_operation: Number(p.ID_OPERATION)
                    });
                }
            }
        });
    }

    // 2. Check Engagements (T_ENGAGEMENT)
    if (pieces.length > 0 && ops.length > 0) {
        engs.forEach(e => {
            const pExists = pieces.some(p => Number(p.ID_PIECE) === Number(e.ID_PIECE));
            if (!pExists) {
                const errMsg = `الالتزام رقم "${e.N_ENG}" (ID: ${e.ID_ENGAGEMENT}) يرتبط بوثيقة غير موجودة (ID_PIECE: ${e.ID_PIECE})`;
                console.warn(`[Data Integrity - Foreign Key Broken] ${errMsg}`);
                issues.brokenEngagements.push({
                    engagement: e,
                    error: errMsg,
                    id_engagement: Number(e.ID_ENGAGEMENT),
                    id_piece: Number(e.ID_PIECE),
                    id_operation: Number(e.ID_OPERATION)
                });
            }

            const opExists = ops.some(op => Number(op.ID_OPERATION) === Number(e.ID_OPERATION));
            if (!opExists) {
                const errMsg = `الالتزام رقم "${e.N_ENG}" (ID: ${e.ID_ENGAGEMENT}) يرتبط بعملية غير موجودة (ID_OPERATION: ${e.ID_OPERATION})`;
                console.warn(`[Data Integrity - Foreign Key Broken] ${errMsg}`);
                issues.brokenEngagements.push({
                    engagement: e,
                    error: errMsg,
                    id_engagement: Number(e.ID_ENGAGEMENT),
                    id_piece: Number(e.ID_PIECE),
                    id_operation: Number(e.ID_OPERATION)
                });
            }
        });
    }

    // 3. Check Paiements (T_PAIEMENT)
    if (pieces.length > 0 && ops.length > 0) {
        pais.forEach(pai => {
            const pExists = pieces.some(p => Number(p.ID_PIECE) === Number(pai.ID_PIECE));
            if (!pExists) {
                const errMsg = `الدفع رقم "${pai.N_PAI}" (ID: ${pai.ID_PAIEMENT}) يرتبط بوثيقة غير موجودة (ID_PIECE: ${pai.ID_PIECE})`;
                console.warn(`[Data Integrity - Foreign Key Broken] ${errMsg}`);
                issues.brokenPaiements.push({
                    paiement: pai,
                    error: errMsg,
                    id_paiement: Number(pai.ID_PAIEMENT),
                    id_piece: Number(pai.ID_PIECE),
                    id_operation: Number(pai.ID_OPERATION)
                });
            }

            const opExists = ops.some(op => Number(op.ID_OPERATION) === Number(pai.ID_OPERATION));
            if (!opExists) {
                const errMsg = `الدفع رقم "${pai.N_PAI}" (ID: ${pai.ID_PAIEMENT}) يرتبط بعملية غير موجودة (ID_OPERATION: ${pai.ID_OPERATION})`;
                console.warn(`[Data Integrity - Foreign Key Broken] ${errMsg}`);
                issues.brokenPaiements.push({
                    paiement: pai,
                    error: errMsg,
                    id_paiement: Number(pai.ID_PAIEMENT),
                    id_piece: Number(pai.ID_PIECE),
                    id_operation: Number(pai.ID_OPERATION)
                });
            }
        });
    }

    return issues;
};
