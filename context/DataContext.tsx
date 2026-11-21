import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { Database, User, OnlineUser, AppEvent, Operation, Engagement, Paiement } from '../types';
import { supabase, saveConfiguration, resetConfiguration, isConfigured, checkSupabaseConnection } from '../services/supabaseClient';
import { hashPassword, DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD_HASH } from '../utils/authUtils';
import { saveBackupToIndexedDb, loadBackupFromIndexedDb } from '../utils/indexedDb';
import {
    PENDING_ACTIONS_KEY,
    PendingAction,
    emptyDb,
    TABLE_ID_FIELDS,
    TABLE_AR_NAMES,
    isNetworkError,
    PIECE_ALLOWED_KEYS,
    RESET_TABLES,
    IMPORT_TABLE_ORDER,
} from './dataConstants';
import { IntegrityIssues, validateDatabaseIntegrity } from './dbIntegrity';
import { useOfflinePersistence } from './offlinePersistence';

interface DataContextType {
    db: Database;
    loading: boolean;
    isInitialLoad: boolean;
    isDbConfigured: boolean;
    onlineUsers: OnlineUser[];
    recentEvents: AppEvent[];
    isOnline: boolean; // New: Connection status
    pendingActionsCount: number; // New: Number of unsynced actions
    refreshData: () => Promise<void>;
    addItem: <T extends { [key: string]: any }>(tableName: keyof Database, item: Omit<T, keyof T & `ID_${string}`>) => Promise<any>;
    updateItem: <T extends { [key: string]: any }>(tableName: keyof Database, id: number, item: T) => Promise<any>;
    deleteItem: (tableName: keyof Database, id: number) => Promise<any>;
    deleteOperation: (id: number) => Promise<any>;
    resetDatabase: () => Promise<void>;
    importDatabase: (data: Database) => Promise<void>;
    runInTransaction: (callback: () => Promise<void>) => Promise<void>;
    joinPresence: (user: User) => void;
    leavePresence: () => void;
    broadcastEvent: (actionType: AppEvent['actionType'], description: string) => void;
    saveConfig: (url: string, key: string) => string | null;
    resetConfig: () => void;
    connectionError: string | null;
    integrityIssues: {
        brokenPieces: { piece: any; error: string; id_piece: number; id_operation: number }[];
        brokenEngagements: { engagement: any; error: string; id_engagement: number; id_piece: number; id_operation: number }[];
        brokenPaiements: { paiement: any; error: string; id_paiement: number; id_piece: number; id_operation: number }[];
    } | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 1. Core State (Light tables)
    const [dbMetadata, setDbMetadata] = useState<Partial<Database>>({});
    // 2. Heavy State (Separate for better reactivity)
    const [operations, setOperations] = useState<Operation[]>([]);
    const [engagements, setEngagements] = useState<Engagement[]>([]);
    const [paiements, setPaiements] = useState<Paiement[]>([]);
    
    // Derived full DB for compatibility
    const db = useMemo(() => ({
        ...emptyDb,
        ...dbMetadata,
        T_OPERATION: operations,
        T_ENGAGEMENT: engagements,
        T_PAIEMENT: paiements,
    } as Database), [dbMetadata, operations, engagements, paiements]);

    const [integrityIssues, setIntegrityIssues] = useState<IntegrityIssues | null>(null);

    const autoHealIdsTried = useRef<{
        T_ENGAGEMENT: Set<number>;
        T_PAIEMENT: Set<number>;
        T_PIECE: Set<number>;
    }>({
        T_ENGAGEMENT: new Set<number>(),
        T_PAIEMENT: new Set<number>(),
        T_PIECE: new Set<number>()
    });

    const validateIntegrity = useCallback((targetDb: Database) => {
        const issues = validateDatabaseIntegrity(targetDb);
        setIntegrityIssues(prev => {
            const hasNoIssues = issues.brokenPieces.length === 0 &&
                               issues.brokenEngagements.length === 0 &&
                               issues.brokenPaiements.length === 0;

            if (!prev) {
                return hasNoIssues ? null : issues;
            }

            if (hasNoIssues) {
                return null;
            }

            const piecesEqual = prev.brokenPieces.length === issues.brokenPieces.length &&
                prev.brokenPieces.every((p, i) => p.id_piece === issues.brokenPieces[i].id_piece);
            const engsEqual = prev.brokenEngagements.length === issues.brokenEngagements.length &&
                prev.brokenEngagements.every((e, i) => e.id_engagement === issues.brokenEngagements[i].id_engagement);
            const paisEqual = prev.brokenPaiements.length === issues.brokenPaiements.length &&
                prev.brokenPaiements.every((p, i) => p.id_paiement === issues.brokenPaiements[i].id_paiement);

            if (piecesEqual && engsEqual && paisEqual) {
                return prev;
            }
            return issues;
        });
        return issues;
    }, []);


    const [loading, setLoading] = useState<boolean>(true);
    const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [recentEvents, setRecentEvents] = useState<AppEvent[]>([]);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
    
    // Action Queue
    const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

    const presenceChannelRef = useRef<any | null>(null);
    const eventChannelRef = useRef<any | null>(null);
    const dbChangesChannelRef = useRef<any | null>(null);
    const currentUserRef = useRef<User | null>(null);
    const isBatchMode = useRef(false);
    const syncInProgress = useRef(false);
    const isOnlineRef = useRef(isOnline);

    // Keep a live mirror of `isOnline` for use inside async callbacks without
    // stale-closure issues.
    useEffect(() => {
        isOnlineRef.current = isOnline;
    }, [isOnline]);

    const addLocalItem = useCallback((table: keyof Database, item: any) => {
        if (table === 'T_OPERATION') setOperations(prev => {
            if (prev.some(x => x.ID_OPERATION === item.ID_OPERATION)) return prev;
            return [...prev, item];
        });
        else if (table === 'T_ENGAGEMENT') setEngagements(prev => {
            if (prev.some(x => x.ID_ENGAGEMENT === item.ID_ENGAGEMENT)) return prev;
            return [...prev, item];
        });
        else if (table === 'T_PAIEMENT') setPaiements(prev => {
            if (prev.some(x => x.ID_PAIEMENT === item.ID_PAIEMENT)) return prev;
            return [...prev, item];
        });
        else setDbMetadata(prev => {
            const list = (prev[table] || []) as any[];
            const idField = TABLE_ID_FIELDS[table];
            if (list.some(x => x[idField] === item[idField])) return prev;
            return { ...prev, [table]: [...list, item] };
        });
    }, []);

    const updateLocalItem = useCallback((table: keyof Database, id: number, updatedFields: any) => {
        const idField = TABLE_ID_FIELDS[table];
        if (table === 'T_OPERATION') {
            setOperations(prev => prev.map(x => x.ID_OPERATION === id ? { ...x, ...updatedFields } : x));
        } else if (table === 'T_ENGAGEMENT') {
            setEngagements(prev => prev.map(x => x.ID_ENGAGEMENT === id ? { ...x, ...updatedFields } : x));
        } else if (table === 'T_PAIEMENT') {
            setPaiements(prev => prev.map(x => x.ID_PAIEMENT === id ? { ...x, ...updatedFields } : x));
        } else {
            setDbMetadata(prev => {
                const list = (prev[table] || []) as any[];
                return {
                    ...prev,
                    [table]: list.map(x => x[idField] === id ? { ...x, ...updatedFields } : x)
                };
            });
        }
    }, []);

    const deleteLocalItem = useCallback((table: keyof Database, id: number, reorderedPaiements?: any[]) => {
        const idField = TABLE_ID_FIELDS[table];
        if (table === 'T_OPERATION') {
            setOperations(prev => prev.filter(x => x.ID_OPERATION !== id));
        } else if (table === 'T_ENGAGEMENT') {
            setEngagements(prev => prev.filter(x => x.ID_ENGAGEMENT !== id));
        } else if (table === 'T_PAIEMENT') {
            setPaiements(prev => {
                if (reorderedPaiements) return reorderedPaiements;
                return prev.filter(x => x.ID_PAIEMENT !== id);
            });
        } else {
            setDbMetadata(prev => {
                const list = (prev[table] || []) as any[];
                return {
                    ...prev,
                    [table]: list.filter(x => x[idField] !== id)
                };
            });
        }
    }, []);

    // Save Backup Helper (IndexedDB; falls back to localStorage)
    const saveToBackup = useCallback(async (data: Database) => {
        await saveBackupToIndexedDb(data);
    }, []);

    // Load Backup Helper (IndexedDB with localStorage fallback)
    const loadFromBackup = useCallback(async () => {
        const parsedDb = await loadBackupFromIndexedDb();
        if (parsedDb) {
            try {
                // Update Split States
                setOperations(parsedDb.T_OPERATION || []);
                setEngagements(parsedDb.T_ENGAGEMENT || []);
                setPaiements(parsedDb.T_PAIEMENT || []);
                
                const metadata = { ...parsedDb };
                delete (metadata as any).T_OPERATION;
                delete (metadata as any).T_ENGAGEMENT;
                delete (metadata as any).T_PAIEMENT;

                // Ensure initial default admin user exists if T_USER is empty on first run.
                // Password is stored as a bcrypt hash, never plaintext. The default account
                // forces a password change on first login (MUST_CHANGE_PASSWORD).
                if (!metadata.T_USER || metadata.T_USER.length === 0) {
                    metadata.T_USER = [{
                        ID_USER: 1,
                        USERNAME: DEFAULT_ADMIN_USERNAME,
                        PASSWORD: DEFAULT_ADMIN_PASSWORD_HASH,
                        ROLE: 'admin',
                        MUST_CHANGE_PASSWORD: true
                    }];
                }

                setDbMetadata(metadata);
                
                console.log("Loaded data from local backup.");
                return true;
            } catch (e) {
                console.error("Failed to load backup", e);
                return false;
            }
        } else {
            // First run without backup: initialize default admin in memory and local storage
            const initialUsers: User[] = [{
                ID_USER: 1,
                USERNAME: DEFAULT_ADMIN_USERNAME,
                PASSWORD: DEFAULT_ADMIN_PASSWORD_HASH,
                ROLE: 'admin',
                MUST_CHANGE_PASSWORD: true
            }];
            setDbMetadata(prev => ({
                ...prev,
                T_USER: initialUsers
            }));
            const starterDb: Database = {
                ...emptyDb,
                T_USER: initialUsers
            };
            saveToBackup(starterDb);
            return true;
        }
    }, [saveToBackup]);

    const refreshData = useCallback(async () => {
        const sb = supabase;
        if (!sb) {
            await loadFromBackup();
            setLoading(false);
            setIsInitialLoad(false);
            return;
        }

        const fetchAllRows = async (table: string) => {
            let allData: any[] = [];
            let from = 0;
            const limit = 1000;
            let hasMore = true;
            const idField = TABLE_ID_FIELDS[table];
            
            try {
                while (hasMore) {
                    let query = sb.from(table).select('*').range(from, from + limit - 1);
                    if (idField) {
                        query = query.order(idField, { ascending: true });
                    }
                    const { data, error } = await query;
                    
                    if (error) {
                        return { data: null, error };
                    }
                    if (data && data.length > 0) {
                        allData = [...allData, ...data];
                        if (data.length < limit) {
                            hasMore = false;
                        } else {
                            from += limit;
                        }
                    } else {
                        hasMore = false;
                    }
                }
                return { data: allData, error: null };
            } catch (err: any) {
                return { data: null, error: err };
            }
        };

        try {
            setConnectionError(null);
            
            const results = await Promise.all(Object.keys(emptyDb).map(table => 
                fetchAllRows(table)
            ));

            const newDb = { ...emptyDb };
            const errors: string[] = [];
            let isNetworkFailure = false;

            results.forEach((res, index) => {
                const table = Object.keys(emptyDb)[index];
                if (res.error) {
                    if (isNetworkError(res.error)) {
                        isNetworkFailure = true;
                    } else {
                        console.error(`Error fetching ${table}:`, res.error);
                    }
                    errors.push(table);
                } else {
                    (newDb as any)[table] = res.data;
                }
            });

            if (isNetworkFailure) {
                console.warn("[Offline Mode] Remote database unavailable. Loading local offline database.");
                setIsOnline(false);
                await loadFromBackup();
                setConnectionError(null);
            } else if (errors.length > 0) {
                setConnectionError(`خطأ في تحميل بعض الجداول: ${errors.map(e => TABLE_AR_NAMES[e] || e).join(', ')}`);
                if (isInitialLoad) await loadFromBackup();
            } else {
                setIsOnline(true);
                // Pre-repair the status flags in memory so they are instantly correct for the client
                const repairedPieces = newDb.T_PIECE.map(piece => {
                    // Find latest engagement for this piece
                    const pieceEngs = newDb.T_ENGAGEMENT
                        .filter(e => Number(e.ID_PIECE) === piece.ID_PIECE)
                        .sort((a, b) => b.ID_ENGAGEMENT - a.ID_ENGAGEMENT);
                    
                    const latestEng = pieceEngs[0];
                    const hasEffectiveEng = latestEng ? (latestEng as any).NATURE_ENG !== 'سحب' : false;
                    
                    const hasPai = newDb.T_PAIEMENT.some(p => Number(p.ID_PIECE) === piece.ID_PIECE);
                    
                    const needsUpdate = piece.SAI_ENG !== hasEffectiveEng || piece.SAI_PAI !== hasPai;
                    if (needsUpdate) {
                        // Asynchronously update database in background safely
                        (async () => {
                            try {
                                await sb.from('T_PIECE')
                                    .update({ SAI_ENG: hasEffectiveEng, SAI_PAI: hasPai } as any)
                                    .eq('ID_PIECE', piece.ID_PIECE);
                            } catch (err: any) {
                                if (!isNetworkError(err)) {
                                    console.error(`Error repairing piece ${piece.ID_PIECE} in DB:`, err);
                                }
                            }
                        })();
                        
                        return { ...piece, SAI_ENG: hasEffectiveEng, SAI_PAI: hasPai };
                    }
                    return piece;
                });

                newDb.T_PIECE = repairedPieces;

                // Update Split States
                setOperations(newDb.T_OPERATION);
                setEngagements(newDb.T_ENGAGEMENT);
                setPaiements(newDb.T_PAIEMENT);
                
                const metadata = { ...newDb };
                delete (metadata as any).T_OPERATION;
                delete (metadata as any).T_ENGAGEMENT;
                delete (metadata as any).T_PAIEMENT;

                if (!metadata.T_USER || metadata.T_USER.length === 0) {
                    metadata.T_USER = [{
                        ID_USER: 1,
                        USERNAME: DEFAULT_ADMIN_USERNAME,
                        PASSWORD: DEFAULT_ADMIN_PASSWORD_HASH,
                        ROLE: 'admin',
                        MUST_CHANGE_PASSWORD: true
                    }];
                    newDb.T_USER = metadata.T_USER;
                }

                setDbMetadata(metadata);
                await saveToBackup(newDb);
            }
        } catch (e: any) {
            if (isNetworkError(e)) {
                console.warn("[Offline Mode] Remote connection failed. Switching to local backup.");
                setIsOnline(false);
            } else {
                console.error("Fetch failed", e);
            }
            setConnectionError(null);
            if (isInitialLoad) await loadFromBackup();
        } finally {
            setLoading(false);
            setIsInitialLoad(false);
        }
    }, [isInitialLoad, saveToBackup, loadFromBackup]);

    const syncData = useCallback(async () => {
        const sb = supabase;
        if (syncInProgress.current || !sb) return;
        syncInProgress.current = true;

        // 1. Process Pending Actions
        if (pendingActions.length > 0) {
            console.log(`Syncing ${pendingActions.length} pending actions...`);
            let actionsProcessed = 0;
            const newActions = [...pendingActions];

            for (const action of pendingActions) {
                try {
                    if (action.type === 'ADD') {
                        // Remove temp ID before sending to Supabase
                        const idField = TABLE_ID_FIELDS[action.table as keyof Database];
                        const { [idField]: _tempId, ...payload } = action.payload;
                        
                        const result = await sb.from(action.table as string).insert(payload).select();
                        if (result.error) throw result.error;

                        const serverItem = result.data ? result.data[0] : null;
                        if (serverItem && action.tempId) {
                            const newId = serverItem[idField];
                            const tempId = action.tempId;

                            // Cascading ID replacement inside subsequent pending actions queue
                            newActions.forEach(act => {
                                if (act.type === 'ADD' || act.type === 'UPDATE') {
                                    // 1. Primary key
                                    if (act.payload[idField] === tempId) {
                                        act.payload[idField] = newId;
                                    }
                                    // 2. Foreign keys and reference fields
                                    Object.keys(act.payload).forEach(key => {
                                        if (act.payload[key] === tempId) {
                                            act.payload[key] = newId;
                                        }
                                    });
                                }
                            });
                        }
                    } else if (action.type === 'UPDATE') {
                        const idField = TABLE_ID_FIELDS[action.table as keyof Database];
                        const idValue = action.payload[idField];
                        
                        // Strip the primary key field from update payload to avoid Supabase primary key update errors
                        const { [idField]: _, ...updatePayload } = action.payload;
                        
                        const result = await sb.from(action.table as string).update(updatePayload).eq(idField, idValue);
                        if (result.error) throw result.error;
                    } else if (action.type === 'DELETE') {
                        const idField = TABLE_ID_FIELDS[action.table as keyof Database];
                        const result = await sb.from(action.table as string).delete().eq(idField, action.payload.id);
                        if (result.error) throw result.error;
                    } else if (action.type === 'DELETE_OP') {
                        const result = await sb.from('T_OPERATION').delete().eq('ID_OPERATION', action.payload.id);
                        if (result.error) throw result.error;
                    }
                    
                    // Remove executed action
                    newActions.shift(); 
                    actionsProcessed++;
                } catch (e: any) {
                    console.error("Sync failed for action:", action, e);
                    if (isNetworkError(e)) {
                        setIsOnline(false);
                        setConnectionError("تعذر الاتصال بالسيرفر أثناء المزامنة. سيتم المحاولة لاحقاً عند استعادة الاتصال.");
                        // Stop syncing on connection error to preserve order
                        break; 
                    } else {
                        // Permanent database error - discard to prevent blocking the queue forever
                        console.error("Permanent database error during sync. Discarding action to prevent queue blockage:", action, e);
                        newActions.shift();
                        actionsProcessed++;
                    }
                }
            }
            setPendingActions(newActions);
            if (actionsProcessed > 0) {
                console.log(`Successfully synced ${actionsProcessed} actions.`);
            }
        }

        // 2. Fetch fresh data
        await refreshData();
        syncInProgress.current = false;
    }, [supabase, pendingActions, refreshData]);

    // Distinguish real cloud-database reachability from mere Internet availability.
    // The app only switches to the cloud backend when the cloud database truly
    // responds; otherwise it stays on the local database.
    const attemptCloudSync = useCallback(async () => {
        const reachable = await checkSupabaseConnection();
        if (reachable) {
            if (!isOnlineRef.current) {
                setIsOnline(true);
                setConnectionError(null);
                await syncData();
            }
        } else {
            if (isOnlineRef.current) {
                setIsOnline(false);
                setConnectionError("الاتصال بالإنترنت متوفر لكن قاعدة البيانات السحابية لا تستجيب. جاري العمل بالنسخة الاحتياطية المحلية.");
            }
        }
    }, [syncData]);

    // Initial Load
    // - Toujours charger le backup local en premier (rapide) pour que l'écran de
    //   connexion s'affiche immédiatement.
    // - Le chargement réseau complet (refreshData) n'est déclenché qu'une fois un
    //   utilisateur connecté, afin de ne pas ralentir le démarrage.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            await loadFromBackup();
            if (cancelled) return;
            setLoading(false);
            setIsInitialLoad(false);

            const isAuthenticated = !!sessionStorage.getItem('goft3_user');
            if (isAuthenticated) {
                refreshData();
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize Pending Actions from Local Storage
    useEffect(() => {
        const storedActions = localStorage.getItem(PENDING_ACTIONS_KEY);
        if (storedActions) {
            try {
                setPendingActions(JSON.parse(storedActions));
            } catch (e) {
                console.error("Failed to parse pending actions", e);
            }
        }
    }, []);

    // Save Pending Actions to Local Storage whenever they change
    useEffect(() => {
        localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pendingActions));
    }, [pendingActions]);

    // Local-first durability: whenever there are unsynced local changes, persist the
    // local database backup so edits survive a restart even while offline. The cloud
    // sync then replays these actions on the next successful connection.
    useEffect(() => {
        if (pendingActions.length > 0 && !loading && !isInitialLoad) {
            saveToBackup(db);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, pendingActions, loading, isInitialLoad]);

    // When connectivity is restored, re-track the current user's presence so they
    // reappear in the "online users" list even if the presence channel was not
    // subscribed while offline.
    useEffect(() => {
        if (isOnline && currentUserRef.current && presenceChannelRef.current) {
            try {
                presenceChannelRef.current.track({
                    user_id: currentUserRef.current.ID_USER,
                    username: currentUserRef.current.USERNAME,
                    role: currentUserRef.current.ROLE,
                    online_at: new Date().toISOString(),
                }).catch(() => {});
            } catch {
                // ignore
            }
        }
    }, [isOnline]);

    // Handle Online/Offline Status
    useEffect(() => {
        const handleOnline = () => {
            console.log("App is Online - Verifying cloud database reachability...");
            attemptCloudSync();
        };
        const handleOffline = () => {
            setIsOnline(false);
            setConnectionError("لا يوجد اتصال بالإنترنت. جاري العمل بالنسخة الاحتياطية المحلية.");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncData, attemptCloudSync]);

    // Automatically trigger Sync when transitioning online or when pending actions are loaded on mount
    useEffect(() => {
        if (isOnline && pendingActions.length > 0 && !loading && !isInitialLoad) {
            console.log("Auto-trigger sync: App is online with pending actions.");
            syncData();
        }
    }, [isOnline, pendingActions.length, loading, isInitialLoad, syncData]);

    // Periodic check to retry syncing if online (e.g. recovering from network dropout)
    useEffect(() => {
        if (!isOnline || pendingActions.length === 0) return;

        const interval = setInterval(() => {
            console.log("Periodic sync: retry check...");
            syncData();
        }, 15000); // Check every 15 seconds

        return () => clearInterval(interval);
    }, [isOnline, pendingActions.length, syncData]);

    // Periodic cloud-database reachability probe. When the Internet is up but the
    // cloud DB is unreachable the app stays on the local database; as soon as the
    // cloud DB really responds it switches back automatically.
    useEffect(() => {
        if (!navigator.onLine) return;
        const interval = setInterval(() => {
            attemptCloudSync();
        }, 20000); // Probe every 20 seconds

        return () => clearInterval(interval);
    }, [attemptCloudSync]);



    // Realtime subscriptions
    useEffect(() => {
        if (supabase && isOnline && !dbChangesChannelRef.current) {
            const channel = supabase
                .channel('schema-db-changes')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public' },
                    (payload: any) => {
                        if (!isOnline) return;
                        
                        const tableName = (payload.table as string).toUpperCase() as keyof Database;
                        const eventType = payload.eventType;
                        
                        if (isBatchMode.current) return;
                        
                        const idField = TABLE_ID_FIELDS[tableName];
                        if (!idField) return;

                        if (eventType === 'INSERT') {
                            const newRecord = payload.new;
                            if (tableName === 'T_OPERATION') {
                                setOperations(prev => {
                                    if (prev.some(x => (x as any)[idField] === newRecord[idField])) return prev;
                                    return [...prev, newRecord as any];
                                });
                            } else if (tableName === 'T_ENGAGEMENT') {
                                setEngagements(prev => {
                                    if (prev.some(x => (x as any)[idField] === newRecord[idField])) return prev;
                                    return [...prev, newRecord as any];
                                });
                            } else if (tableName === 'T_PAIEMENT') {
                                setPaiements(prev => {
                                    if (prev.some(x => (x as any)[idField] === newRecord[idField])) return prev;
                                    return [...prev, newRecord as any];
                                });
                            } else {
                                setDbMetadata(prev => {
                                    const list = (prev[tableName] || []) as any[];
                                    if (list.some(x => (x as any)[idField] === newRecord[idField])) return prev;
                                    return {
                                        ...prev,
                                        [tableName]: [...list, newRecord]
                                    };
                                });
                            }
                        } else if (eventType === 'UPDATE') {
                            const updatedRecord = payload.new;
                            if (tableName === 'T_OPERATION') {
                                setOperations(prev => prev.map(x => (x as any)[idField] === updatedRecord[idField] ? { ...x, ...updatedRecord } : x));
                            } else if (tableName === 'T_ENGAGEMENT') {
                                setEngagements(prev => prev.map(x => (x as any)[idField] === updatedRecord[idField] ? { ...x, ...updatedRecord } : x));
                            } else if (tableName === 'T_PAIEMENT') {
                                setPaiements(prev => prev.map(x => (x as any)[idField] === updatedRecord[idField] ? { ...x, ...updatedRecord } : x));
                            } else {
                                setDbMetadata(prev => {
                                    const list = (prev[tableName] || []) as any[];
                                    return {
                                        ...prev,
                                        [tableName]: list.map(x => (x as any)[idField] === updatedRecord[idField] ? { ...x, ...updatedRecord } : x)
                                    };
                                });
                            }
                        } else if (eventType === 'DELETE') {
                            const oldRecord = payload.old;
                            if (tableName === 'T_OPERATION') {
                                setOperations(prev => prev.filter(x => (x as any)[idField] !== oldRecord[idField]));
                            } else if (tableName === 'T_ENGAGEMENT') {
                                setEngagements(prev => prev.filter(x => (x as any)[idField] !== oldRecord[idField]));
                            } else if (tableName === 'T_PAIEMENT') {
                                setPaiements(prev => prev.filter(x => (x as any)[idField] !== oldRecord[idField]));
                            } else {
                                setDbMetadata(prev => {
                                    const list = (prev[tableName] || []) as any[];
                                    return {
                                        ...prev,
                                        [tableName]: list.filter(x => (x as any)[idField] !== oldRecord[idField])
                                    };
                                });
                            }
                        }
                    }
                )
                .subscribe();
            dbChangesChannelRef.current = channel;
        }
        return () => {
            if (dbChangesChannelRef.current) {
                dbChangesChannelRef.current.unsubscribe();
                dbChangesChannelRef.current = null;
            }
        };
    }, [isOnline]);

    const broadcastEvent = useCallback((actionType: AppEvent['actionType'], description: string, detail?: string) => {
        if (!supabase || !currentUserRef.current || !eventChannelRef.current || !isOnline) return;

        const event: AppEvent = {
            id: Math.random().toString(36).substr(2, 9),
            username: currentUserRef.current.USERNAME,
            actionType,
            description: detail ? `${description} (${detail})` : description,
            timestamp: new Date().toISOString()
        };

        // Update local state immediately so the sender also sees it and gets notified
        setRecentEvents(prev => {
            if (prev.some(e => e.id === event.id)) return prev;
            return [event, ...prev].slice(0, 10);
        });

        eventChannelRef.current.send({
            type: 'broadcast',
            event: 'app-activity',
            payload: event
        }).catch(() => {});
    }, [isOnline]);

    const joinPresence = useCallback((user: User) => {
        currentUserRef.current = user;

        if (!supabase) return;

        // Create (or reuse) the presence channel. We subscribe even while offline:
        // the Supabase realtime client will queue and connect once reachable. The
        // current user is tracked on subscription so they always appear too.
        if (!presenceChannelRef.current) {
            const channel = supabase.channel('online-users', {
                config: { presence: { key: user.ID_USER.toString() } },
            });

            channel.on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const users: OnlineUser[] = [];
                for (const presenceKey in state) {
                    const presenceList = state[presenceKey];
                    const presence = (Array.isArray(presenceList) ? presenceList[0] : presenceList) as any;
                    if (presence && presence.user_id) {
                        users.push({
                            userId: presence.user_id,
                            username: presence.username,
                            role: presence.role,
                            onlineAt: presence.online_at
                        });
                    }
                }
                setOnlineUsers(Array.from(new Map(users.map(u => [u.userId, u])).values()));
            });

            channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const current = currentUserRef.current;
                    if (current) {
                        await channel.track({
                            user_id: current.ID_USER,
                            username: current.USERNAME,
                            role: current.ROLE,
                            online_at: new Date().toISOString(),
                        });
                    }
                }
            });

            presenceChannelRef.current = channel;
        } else if (isOnline) {
            // Already subscribed; re-track to refresh the current user's presence.
            const channel = presenceChannelRef.current;
            channel.track({
                user_id: user.ID_USER,
                username: user.USERNAME,
                role: user.ROLE,
                online_at: new Date().toISOString(),
            }).catch(() => {});
        }

        if (!eventChannelRef.current) {
            const evChannel = supabase.channel('app-events');
            evChannel.on('broadcast', { event: 'app-activity' }, ({ payload }) => {
                setRecentEvents(prev => [payload as AppEvent, ...prev].slice(0, 10));
            }).subscribe();
            eventChannelRef.current = evChannel;
        }
    }, [isOnline]);

    const leavePresence = useCallback(async () => {
        if (presenceChannelRef.current) {
            await presenceChannelRef.current.unsubscribe();
            presenceChannelRef.current = null;
        }
        if (eventChannelRef.current) {
            await eventChannelRef.current.unsubscribe();
            eventChannelRef.current = null;
        }
        setOnlineUsers([]);
        currentUserRef.current = null;
    }, []);

    const runInTransaction = async (callback: () => Promise<void>) => {
        isBatchMode.current = true;
        setLoading(true);
        try {
            await callback();
        } catch (e) {
            console.error("Batch operation failed:", e);
            throw e;
        } finally {
            isBatchMode.current = false;
            // Only refresh if online, otherwise the local updates in callback should stick
            if (isOnline) await refreshData(); 
            else setLoading(false);
        }
    };

    const {
        saveOfflineAddItem,
        saveOfflineUpdateItem,
        saveOfflineDeleteItem,
        saveOfflineDeleteOperation,
    } = useOfflinePersistence({
        db,
        addLocalItem,
        updateLocalItem,
        deleteLocalItem,
        setDbMetadata,
        setOperations,
        setPendingActions,
    });

    const addItem = async <T extends { [key: string]: any }>(tableName: keyof Database, item: Omit<T, keyof T & `ID_${string}`>) => {
        const idField = TABLE_ID_FIELDS[tableName];
        
        // Optimistic UI / Offline Logic
        // Generate a temporary negative ID
        const tempId = -Date.now() - Math.floor(Math.random() * 1000); 
        const newItem = { ...item, [idField]: tempId } as T;

        if (isOnline && supabase) {
            let insertPayload = { ...item };
            if (tableName === 'T_PIECE') {
                insertPayload = Object.keys(insertPayload).reduce((acc: any, key) => {
                    if (PIECE_ALLOWED_KEYS.includes(key)) {
                        acc[key] = (insertPayload as any)[key];
                    }
                    return acc;
                }, {});
            }
            try {
                let result = await supabase.from(tableName as string).insert(insertPayload as any).select();
                if (result.error) {
                    // If special error handling needed
                    if (result.error.code === 'PGRST204' && result.error.message.includes('CREATED_BY') && 'CREATED_BY' in item) {
                        const { CREATED_BY: _cb, ...rest } = item as any;
                        result = await supabase.from(tableName as string).insert(rest as any).select();
                    }
                }
                if (result.error) throw result.error;
                
                const serverItem = result.data ? result.data[0] : null;
                
                // Automatic field updates for Piece status
                if (serverItem) {
                    if (tableName === 'T_ENGAGEMENT' && serverItem.ID_PIECE) {
                        const isWithdrawn = (serverItem as any).NATURE_ENG === 'سحب';
                        await supabase.from('T_PIECE').update({ SAI_ENG: !isWithdrawn } as any).eq('ID_PIECE', serverItem.ID_PIECE);
                        
                        // Update local state for piece
                        setDbMetadata(prev => ({ 
                            ...prev, 
                            T_PIECE: (prev.T_PIECE || []).map(p => p.ID_PIECE === serverItem.ID_PIECE ? { ...p, SAI_ENG: !isWithdrawn } : p) 
                        }));
                    } else if (tableName === 'T_PAIEMENT' && serverItem.ID_PIECE) {
                        await supabase.from('T_PIECE').update({ SAI_PAI: true } as any).eq('ID_PIECE', serverItem.ID_PIECE);
                        
                        // Update local state for piece
                        setDbMetadata(prev => ({ 
                            ...prev, 
                            T_PIECE: (prev.T_PIECE || []).map(p => p.ID_PIECE === serverItem.ID_PIECE ? { ...p, SAI_PAI: true } : p) 
                        }));
                    }
                }

                if (!isBatchMode.current && serverItem) {
                    addLocalItem(tableName, serverItem);
                    const itemDetail = (item as any).PIECE || (item as any).BENEFICIAIRE || (item as any).INT_OPERATION || (item as any).USERNAME || (item as any).N_ENG || '';
                    broadcastEvent('add', `${TABLE_AR_NAMES[tableName] || tableName}`, itemDetail);
                }
                return serverItem;
            } catch (err: any) {
                if (isNetworkError(err)) {
                    console.warn("Network error during addItem, falling back to offline save:", err);
                    setIsOnline(false);
                    setConnectionError("تعذر الاتصال بالسيرفر. تم حفظ البيانات محلياً وسيتم مزامنتها تلقائياً عند استعادة الاتصال.");
                    return await saveOfflineAddItem(tableName, item, tempId, newItem);
                } else {
                    throw err;
                }
            }
        } else {
            return await saveOfflineAddItem(tableName, item, tempId, newItem);
        }
    };

    const updateItem = async <T extends { [key: string]: any }>(tableName: keyof Database, id: number, item: T) => {
        const idField = TABLE_ID_FIELDS[tableName];

        if (isOnline && supabase) {
            let updatePayload = { ...item };
            // Strip primary key/identity column from update payload to prevent updates key database error
            delete (updatePayload as any)[idField];

            if (tableName === 'T_PIECE') {
                updatePayload = Object.keys(updatePayload).reduce((acc: any, key) => {
                    if (PIECE_ALLOWED_KEYS.includes(key)) {
                        acc[key] = (updatePayload as any)[key];
                    }
                    return acc;
                }, {});
            }
            try {
                const { error } = await supabase.from(tableName as string).update(updatePayload as any).eq(idField, id);
                if (error) throw error;

                // Automatic field updates for Piece status if piece ID changed or confirmed
                if (tableName === 'T_ENGAGEMENT' && item.ID_PIECE) {
                    const isWithdrawn = (item as any).NATURE_ENG === 'سحب';
                    await supabase.from('T_PIECE').update({ SAI_ENG: !isWithdrawn } as any).eq('ID_PIECE', item.ID_PIECE);
                    
                    // Update local state
                    setDbMetadata(prev => ({ 
                        ...prev, 
                        T_PIECE: (prev.T_PIECE || []).map(p => p.ID_PIECE === item.ID_PIECE ? { ...p, SAI_ENG: !isWithdrawn } : p) 
                    }));
                } else if (tableName === 'T_PAIEMENT' && item.ID_PIECE) {
                    await supabase.from('T_PIECE').update({ SAI_PAI: true } as any).eq('ID_PIECE', item.ID_PIECE);
                    
                    // Update local state
                    setDbMetadata(prev => ({ 
                        ...prev, 
                        T_PIECE: (prev.T_PIECE || []).map(p => p.ID_PIECE === item.ID_PIECE ? { ...p, SAI_PAI: true } : p) 
                    }));
                }

                if (!isBatchMode.current) {
                    updateLocalItem(tableName, id, item);
                    const itemDetail = (item as any).PIECE || (item as any).BENEFICIAIRE || (item as any).INT_OPERATION || (item as any).USERNAME || (item as any).N_ENG || '';
                    broadcastEvent('update', `${TABLE_AR_NAMES[tableName] || tableName}`, itemDetail);
                }
                return item;
            } catch (err: any) {
                if (isNetworkError(err)) {
                    console.warn("Network error during updateItem, falling back to offline save:", err);
                    setIsOnline(false);
                    setConnectionError("تعذر الاتصال بالسيرفر. تم تعديل البيانات محلياً وسيتم مزامنتها تلقائياً عند استعادة الاتصال.");
                    return await saveOfflineUpdateItem(tableName, id, item);
                } else {
                    throw err;
                }
            }
        } else {
            return await saveOfflineUpdateItem(tableName, id, item);
        }
    };

    const deleteItem = async (tableName: keyof Database, id: number) => {
        const idField = TABLE_ID_FIELDS[tableName];

        if (isOnline && supabase) {
            try {
                const { error } = await supabase.from(tableName as string).delete().eq(idField, id);
                if (error) throw error;

                let reorderedPaiements: Paiement[] | null = null;

                // Reset Piece status flags on deletion
                if (tableName === 'T_ENGAGEMENT' || tableName === 'T_PAIEMENT') {
                    const itemToDelete = (db[tableName] as any[]).find((row: any) => row[idField] === id);
                    if (itemToDelete && itemToDelete.ID_PIECE) {
                        const pieceId = itemToDelete.ID_PIECE;
                        
                        if (tableName === 'T_ENGAGEMENT') {
                            // Recalculate SAI_ENG based on remaining engagements
                            const remaining = db.T_ENGAGEMENT.filter(e => e.ID_PIECE === pieceId && e.ID_ENGAGEMENT !== id)
                                .sort((a, b) => b.ID_ENGAGEMENT - a.ID_ENGAGEMENT);
                            const latest = remaining[0];
                            const effectivelyEngaged = latest ? (latest as any).NATURE_ENG !== 'سحب' : false;
                            await supabase.from('T_PIECE').update({ SAI_ENG: effectivelyEngaged } as any).eq('ID_PIECE', pieceId);
                            
                            // Update local state
                            setDbMetadata(prev => ({ 
                                ...prev, 
                                T_PIECE: (prev.T_PIECE || []).map(p => p.ID_PIECE === pieceId ? { ...p, SAI_ENG: effectivelyEngaged } : p) 
                            }));
                        } else {
                            // Simple existence for SAI_PAI
                            const others = db.T_PAIEMENT.filter(p => p.ID_PIECE === pieceId && p.ID_PAIEMENT !== id);
                            const effectivelyPaid = others.length > 0;
                            await supabase.from('T_PIECE').update({ SAI_PAI: effectivelyPaid } as any).eq('ID_PIECE', pieceId);
                            
                            // Update local state for piece status
                            setDbMetadata(prev => ({ 
                                ...prev, 
                                T_PIECE: (prev.T_PIECE || []).map(p => p.ID_PIECE === pieceId ? { ...p, SAI_PAI: effectivelyPaid } : p) 
                            }));

                            // Re-order payments for SAME Operation and SAME Year
                            const opId = itemToDelete.ID_OPERATION;
                            const year = itemToDelete.ANNEE;
                            
                            const sameContextPaiements = db.T_PAIEMENT
                                .filter(p => Number(p.ID_OPERATION) === Number(opId) && p.ANNEE === year && Number(p.ID_PAIEMENT) !== Number(id))
                                .sort((a, b) => {
                                    const nA = parseInt(a.N_PAI, 10) || 0;
                                    const nB = parseInt(b.N_PAI, 10) || 0;
                                    if (nA !== nB) return nA - nB;
                                    return Number(a.ID_PAIEMENT) - Number(b.ID_PAIEMENT);
                                });

                            const updatedPaiementsInContext: Paiement[] = [];
                            for (let i = 0; i < sameContextPaiements.length; i++) {
                                const p = sameContextPaiements[i];
                                const newNPai = (i + 1).toString().padStart(2, '0');
                                if (p.N_PAI !== newNPai) {
                                    await supabase.from('T_PAIEMENT').update({ N_PAI: newNPai } as any).eq('ID_PAIEMENT', p.ID_PAIEMENT);
                                    updatedPaiementsInContext.push({ ...p, N_PAI: newNPai });
                                } else {
                                    updatedPaiementsInContext.push(p);
                                }
                            }

                            if (updatedPaiementsInContext.length > 0) {
                                reorderedPaiements = (db.T_PAIEMENT as Paiement[])
                                    .filter(p => Number(p.ID_PAIEMENT) !== Number(id))
                                    .map(p => {
                                        const updated = updatedPaiementsInContext.find(u => Number(u.ID_PAIEMENT) === Number(p.ID_PAIEMENT));
                                        return updated || p;
                                    });
                            }
                        }
                    }
                }

                if (!isBatchMode.current) {
                    const existingItem = (db as any)[tableName]?.find((row: any) => row[idField] === id);
                    const itemDetail = existingItem ? (existingItem.PIECE || existingItem.BENEFICIAIRE || existingItem.INT_OPERATION || existingItem.USERNAME || existingItem.N_ENG || '') : '';
                    
                    deleteLocalItem(tableName, id, reorderedPaiements || undefined);
                    
                    broadcastEvent('delete', `${TABLE_AR_NAMES[tableName] || tableName}`, itemDetail);
                }
                return { message: 'Item deleted' };
            } catch (err: any) {
                if (isNetworkError(err)) {
                    console.warn("Network error during deleteItem, falling back to offline save:", err);
                    setIsOnline(false);
                    setConnectionError("تعذر الاتصال بالسيرفر. تم حذف البيانات محلياً وسيتم مزامنتها تلقائياً عند استعادة الاتصال.");
                    return await saveOfflineDeleteItem(tableName, id);
                } else {
                    throw err;
                }
            }
        } else {
            return await saveOfflineDeleteItem(tableName, id);
        }
    };

    useEffect(() => {
        if (loading || isInitialLoad) return;

        if (operations.length > 0 || engagements.length > 0 || paiements.length > 0 || Object.keys(dbMetadata).length > 0) {
            const results = validateIntegrity(db);
            
            if (results) {
                const brokenEngs = results.brokenEngagements.filter(item => !autoHealIdsTried.current.T_ENGAGEMENT.has(item.id_engagement));
                const brokenPais = results.brokenPaiements.filter(item => !autoHealIdsTried.current.T_PAIEMENT.has(item.id_paiement));
                const brokenPieces = results.brokenPieces.filter(item => !autoHealIdsTried.current.T_PIECE.has(item.id_piece));

                if (brokenEngs.length > 0 || brokenPais.length > 0 || brokenPieces.length > 0) {
                    console.warn("[Data Integrity Auto-Heal] Detected references to non-existent rows. Starting repair...");

                    brokenEngs.forEach(item => autoHealIdsTried.current.T_ENGAGEMENT.add(item.id_engagement));
                    brokenPais.forEach(item => autoHealIdsTried.current.T_PAIEMENT.add(item.id_paiement));
                    brokenPieces.forEach(item => autoHealIdsTried.current.T_PIECE.add(item.id_piece));

                    const executeAutoHeal = async () => {
                        // 1. Broken Engagements
                        for (const item of brokenEngs) {
                            try {
                                const pStillExists = db.T_PIECE.some(p => Number(p.ID_PIECE) === Number(item.id_piece));
                                if (db.T_PIECE.length > 0 && !pStillExists) {
                                    console.warn(`[Data Integrity Auto-Heal] Automatically cleaning orphaned engagement ID: ${item.id_engagement} N_ENG: ${item.engagement.N_ENG}`);
                                    await deleteItem('T_ENGAGEMENT', item.id_engagement);
                                }
                            } catch (err) {
                                console.warn("[Data Integrity Auto-Heal] Failed to auto-delete engagement", err);
                            }
                        }

                        // 2. Broken Paiements
                        for (const item of brokenPais) {
                            try {
                                const pStillExists = db.T_PIECE.some(p => Number(p.ID_PIECE) === Number(item.id_piece));
                                if (db.T_PIECE.length > 0 && !pStillExists) {
                                    console.warn(`[Data Integrity Auto-Heal] Automatically cleaning orphaned paiement ID: ${item.id_paiement} N_PAI: ${item.paiement.N_PAI}`);
                                    await deleteItem('T_PAIEMENT', item.id_paiement);
                                }
                            } catch (err) {
                                console.warn("[Data Integrity Auto-Heal] Failed to auto-delete paiement", err);
                            }
                        }

                        // 3. Broken Pieces
                        for (const item of brokenPieces) {
                            try {
                                const opStillExists = db.T_OPERATION.some(op => Number(op.ID_OPERATION) === Number(item.id_operation));
                                if (db.T_OPERATION.length > 0 && !opStillExists) {
                                    console.warn(`[Data Integrity Auto-Heal] Automatically cleaning orphaned piece ID: ${item.id_piece} Name: ${item.piece.PIECE}`);
                                    await deleteItem('T_PIECE', item.id_piece);
                                }
                            } catch (err) {
                                console.warn("[Data Integrity Auto-Heal] Failed to auto-delete piece", err);
                            }
                        }
                    };

                    executeAutoHeal();
                }
            }
        }
    }, [db, validateIntegrity, deleteItem, loading, isInitialLoad]);
    
    const deleteOperation = async (id: number) => {
        if (isOnline && supabase) {
            try {
                const { error } = await supabase.from('T_OPERATION').delete().eq('ID_OPERATION', id);
                if (error) throw error;
                if (!isBatchMode.current) {
                    const op = db.T_OPERATION.find(o => o.ID_OPERATION === id);
                    
                    const newOps = db.T_OPERATION.filter(o => o.ID_OPERATION !== id);
                    setOperations(newOps);
                    
                    broadcastEvent('delete', 'عملية وكافة ملحقاتها', op?.INT_OPERATION);
                }
                return { message: 'Operation deleted' };
            } catch (err: any) {
                if (isNetworkError(err)) {
                    console.warn("Network error during deleteOperation, falling back to offline save:", err);
                    setIsOnline(false);
                    setConnectionError("تعذر الاتصال بالسيرفر. تم حذف العملية محلياً وسيتم مزامنتها تلقائياً عند استعادة الاتصال.");
                    return await saveOfflineDeleteOperation(id);
                } else {
                    throw err;
                }
            }
        } else {
            return await saveOfflineDeleteOperation(id);
        }
    };
    
    const resetDatabase = async () => {
        if (!supabase || !isOnline) {
            alert("لا يمكن مسح قاعدة البيانات في وضع عدم الاتصال.");
            return;
        }
        if (window.confirm('تحذير: هذا الإجراء سيحذف جميع البيانات من قاعدة البيانات السحابية. هل أنت متأكد؟')) {
            isBatchMode.current = true;
            setLoading(true);
            try {
                for (const table of RESET_TABLES) {
                    await supabase.from(table as string).delete().neq(TABLE_ID_FIELDS[table], 0); 
                }
                
                const hashedAdmin = await hashPassword('admin');
                await supabase.from('T_USER').insert({ USERNAME: 'admin', PASSWORD: hashedAdmin, ROLE: 'admin' });
                broadcastEvent('reset', 'قاعدة البيانات بالكامل');

            } catch (e) {
                console.error("Reset failed", e);
            } finally {
                isBatchMode.current = false;
                await refreshData();
            }
        }
    };

    const importDatabase = async (importedDb: Database) => {
        if (!supabase || !isOnline) {
            alert("لا يمكن استيراد قاعدة البيانات في وضع عدم الاتصال.");
            return;
        }
        if (!window.confirm('استيراد قاعدة بيانات جديدة سيحذف البيانات الحالية. هل أنت متأكد؟')) return;

        isBatchMode.current = true;
        setLoading(true);
        try {
            for (const table of RESET_TABLES) {
                await supabase.from(table as string).delete().neq(TABLE_ID_FIELDS[table], 0); 
            }

            for (const tableName of IMPORT_TABLE_ORDER) {
                const rows = importedDb[tableName];
                if (rows && rows.length > 0) {
                    const { error } = await (supabase as any).from(tableName as string).insert(rows as any);
                    if (error) throw error;
                }
            }
            broadcastEvent('import', 'قاعدة بيانات كاملة من ملف');
            alert('تم استيراد البيانات بنجاح!');
        } catch (e) {
            console.error("Import failed:", e);
            alert('فشل استيراد البيانات. راجع وحدة التحكم للتفاصيل.');
        } finally {
            isBatchMode.current = false;
            await refreshData();
        }
    };


    return (
        <DataContext.Provider value={{ 
            db, 
            loading, 
            isInitialLoad,
            isDbConfigured: !!isConfigured,
            onlineUsers, 
            recentEvents,
            connectionError,
            integrityIssues,
            isOnline,
            pendingActionsCount: pendingActions.length,
            refreshData, 
            addItem, 
            updateItem, 
            deleteItem, 
            deleteOperation, 
            resetDatabase, 
            importDatabase, 
            runInTransaction, 
            joinPresence, 
            leavePresence,
            broadcastEvent,
            saveConfig: saveConfiguration,
            resetConfig: resetConfiguration
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};