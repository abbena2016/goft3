import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import ConfirmActionModal from '../components/ConfirmActionModal';

interface ConfirmOptions {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

interface ConfirmContextType {
    confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ConfirmState | null>(null);

    const confirm = useCallback((message: string, options?: ConfirmOptions): Promise<boolean> => {
        return new Promise(resolve => {
            setState({
                isOpen: true,
                message,
                ...options,
                onConfirm: () => {
                    setState(null);
                    resolve(true);
                },
                onCancel: () => {
                    setState(null);
                    resolve(false);
                },
            });
        });
    }, []);

    // Replace the global window.confirm with the custom React modal.
    useEffect(() => {
        const originalConfirm = window.confirm;
        window.confirm = (message?: string) => {
            if (message === undefined) return false;
            // NOTE: synchronous confirm cannot await the async modal. We open the modal
            // and return false; callers that need the result should use useConfirm() instead.
            confirm(message);
            return false;
        };
        return () => {
            window.confirm = originalConfirm;
        };
    }, [confirm]);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {state && (
                <ConfirmActionModal
                    isOpen={state.isOpen}
                    title={state.title}
                    message={state.message}
                    confirmLabel={state.confirmLabel}
                    cancelLabel={state.cancelLabel}
                    danger={state.danger}
                    onConfirm={state.onConfirm}
                    onCancel={state.onCancel}
                />
            )}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = (): ConfirmContextType => {
    const context = useContext(ConfirmContext);
    if (context === undefined) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};
