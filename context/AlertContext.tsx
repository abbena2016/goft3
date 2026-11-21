import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AlertModal from '../components/AlertModal';

interface AlertContextType {
    showAlert: (message: string, title?: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<{ message: string; title?: string } | null>(null);

    const showAlert = useCallback((message: string, title?: string) => {
        setState({ message, title });
    }, []);

    const handleClose = useCallback(() => {
        setState(null);
        // Restore focus to the underlying app after the modal closes
        setTimeout(() => {
            window.focus();
            if (document.activeElement && 'blur' in document.activeElement) {
                (document.activeElement as HTMLElement).blur();
            }
            document.body.focus();
        }, 50);
    }, []);

    // Replace the global window.alert with the custom React modal.
    useEffect(() => {
        const originalAlert = window.alert;
        window.alert = (message?: any) => {
            showAlert(String(message ?? ''));
        };
        return () => {
            window.alert = originalAlert;
        };
    }, [showAlert]);

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <AlertModal
                isOpen={!!state}
                title={state?.title}
                message={state?.message ?? ''}
                onClose={handleClose}
            />
        </AlertContext.Provider>
    );
};

export const useAlert = (): AlertContextType => {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
