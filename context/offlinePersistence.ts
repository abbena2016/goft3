import { useCallback } from 'react';
import { Database, Operation, Paiement } from '../types';
import { PendingAction, TABLE_ID_FIELDS } from './dataConstants';

interface OfflinePersistenceDeps {
    db: Database;
    addLocalItem: (table: keyof Database, item: any) => void;
    updateLocalItem: (table: keyof Database, id: number, updatedFields: any) => void;
    deleteLocalItem: (table: keyof Database, id: number, reorderedPaiements?: any[]) => void;
    setDbMetadata: React.Dispatch<React.SetStateAction<Partial<Database>>>;
    setOperations: React.Dispatch<React.SetStateAction<Operation[]>>;
    setPendingActions: React.Dispatch<React.SetStateAction<PendingAction[]>>;
}

export function useOfflinePersistence({
    db,
    addLocalItem,
    updateLocalItem,
    deleteLocalItem,
    setDbMetadata,
    setOperations,
    setPendingActions,
}: OfflinePersistenceDeps) {
    const saveOfflineAddItem = useCallback(async (tableName: keyof Database, _item: any, tempId: number, newItem: any) => {
        addLocalItem(tableName, newItem);

        const action: PendingAction = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'ADD',
            table: tableName,
            payload: newItem,
            timestamp: Date.now(),
            tempId: tempId
        };

        if (tableName === 'T_ENGAGEMENT' && (newItem as any).ID_PIECE) {
            const pieceId = (newItem as any).ID_PIECE;
            const isWithdrawn = (newItem as any).NATURE_ENG === 'سحب';
            setDbMetadata(prev => {
                const T_PIECE = (prev.T_PIECE || []).map(p => p.ID_PIECE === pieceId ? { ...p, SAI_ENG: !isWithdrawn } : p);
                return { ...prev, T_PIECE };
            });
        } else if (tableName === 'T_PAIEMENT' && (newItem as any).ID_PIECE) {
            const pieceId = (newItem as any).ID_PIECE;
            setDbMetadata(prev => {
                const T_PIECE = (prev.T_PIECE || []).map(p => p.ID_PIECE === pieceId ? { ...p, SAI_PAI: true } : p);
                return { ...prev, T_PIECE };
            });
        }

        setPendingActions(prev => [...prev, action]);

        return newItem;
    }, [addLocalItem, setDbMetadata, setPendingActions]);

    const saveOfflineUpdateItem = useCallback(async (tableName: keyof Database, id: number, item: any) => {
        const idField = TABLE_ID_FIELDS[tableName];
        updateLocalItem(tableName, id, item);

        if (tableName === 'T_ENGAGEMENT' && item.ID_PIECE) {
            const pieceId = item.ID_PIECE;
            const isWithdrawn = (item as any).NATURE_ENG === 'سحب';
            setDbMetadata(prev => {
                const T_PIECE = (prev.T_PIECE || []).map(p => p.ID_PIECE === pieceId ? { ...p, SAI_ENG: !isWithdrawn } : p);
                return { ...prev, T_PIECE };
            });
        } else if (tableName === 'T_PAIEMENT' && item.ID_PIECE) {
            const pieceId = item.ID_PIECE;
            setDbMetadata(prev => {
                const T_PIECE = (prev.T_PIECE || []).map(p => p.ID_PIECE === pieceId ? { ...p, SAI_PAI: true } : p);
                return { ...prev, T_PIECE };
            });
        }

        const action: PendingAction = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'UPDATE',
            table: tableName,
            payload: { ...item, [idField]: id },
            timestamp: Date.now()
        };
        setPendingActions(prev => [...prev, action]);
        return item;
    }, [updateLocalItem, setDbMetadata, setPendingActions]);

    const saveOfflineDeleteItem = useCallback(async (tableName: keyof Database, id: number) => {
        const idField = TABLE_ID_FIELDS[tableName];
        let reorderedPaiements: any[] | null = null;
        if (tableName === 'T_PAIEMENT') {
            const itemToDelete = (db.T_PAIEMENT || []).find(p => Number(p.ID_PAIEMENT) === Number(id));
            if (itemToDelete) {
                const opId = itemToDelete.ID_OPERATION;
                const year = itemToDelete.ANNEE;
                const sameContextPaiements = db.T_PAIEMENT
                    .filter(p => Number(p.ID_OPERATION) === Number(opId) && p.ANNEE === year && Number(p.ID_PAIEMENT) !== Number(id))
                    .sort((a, b) => (parseInt(a.N_PAI, 10) || 0) - (parseInt(b.N_PAI, 10) || 0));

                const updatedInContext: Paiement[] = [];
                for (let i = 0; i < sameContextPaiements.length; i++) {
                    const p = sameContextPaiements[i];
                    const newNPai = (i + 1).toString().padStart(2, '0');
                    updatedInContext.push({ ...p, N_PAI: newNPai });
                }

                reorderedPaiements = (db.T_PAIEMENT || [])
                    .filter(p => Number(p.ID_PAIEMENT) !== Number(id))
                    .map(p => {
                        const updated = updatedInContext.find(u => Number(u.ID_PAIEMENT) === Number(p.ID_PAIEMENT));
                        return updated || p;
                    });
            }
        }

        deleteLocalItem(tableName, id, reorderedPaiements || undefined);

        if (tableName === 'T_ENGAGEMENT' || tableName === 'T_PAIEMENT') {
            const itemToDelete = (db[tableName] as any[]).find((row: any) => row[idField] === id);
            if (itemToDelete && itemToDelete.ID_PIECE) {
                const pieceId = itemToDelete.ID_PIECE;
                if (tableName === 'T_ENGAGEMENT') {
                    const remaining = db.T_ENGAGEMENT.filter(e => e.ID_PIECE === pieceId && e.ID_ENGAGEMENT !== id)
                        .sort((a, b) => b.ID_ENGAGEMENT - a.ID_ENGAGEMENT);
                    const latest = remaining[0];
                    const effectivelyEngaged = latest ? (latest as any).NATURE_ENG !== 'سحب' : false;
                    const updatedPieces = db.T_PIECE.map(p => p.ID_PIECE === pieceId ? { ...p, SAI_ENG: effectivelyEngaged } : p);
                    setDbMetadata(prev => ({ ...prev, T_PIECE: updatedPieces }));
                } else {
                    const others = db.T_PAIEMENT.filter(p => p.ID_PIECE === pieceId && p.ID_PAIEMENT !== id);
                    if (others.length === 0) {
                        const updatedPieces = db.T_PIECE.map(p => p.ID_PIECE === pieceId ? { ...p, SAI_PAI: false } : p);
                        setDbMetadata(prev => ({ ...prev, T_PIECE: updatedPieces }));
                    }
                }
            }
        }

        const action: PendingAction = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'DELETE',
            table: tableName,
            payload: { id },
            timestamp: Date.now()
        };
        setPendingActions(prev => [...prev, action]);
        return { message: 'Item deleted locally' };
    }, [db, deleteLocalItem, setDbMetadata, setPendingActions]);

    const saveOfflineDeleteOperation = useCallback(async (id: number) => {
        const newOps = db.T_OPERATION.filter(op => op.ID_OPERATION !== id);
        setOperations(newOps);
        const action: PendingAction = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'DELETE_OP',
            table: 'T_OPERATION_CASCADE' as any,
            payload: { id },
            timestamp: Date.now()
        };
        setPendingActions(prev => [...prev, action]);
        return { message: 'Operation deleted locally' };
    }, [db, setOperations, setPendingActions]);

    return {
        saveOfflineAddItem,
        saveOfflineUpdateItem,
        saveOfflineDeleteItem,
        saveOfflineDeleteOperation,
    };
}
