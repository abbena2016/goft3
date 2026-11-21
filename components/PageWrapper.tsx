
import React, { ReactNode, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Page, User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PageWrapperProps {
    title: string;
    navigate?: (page: Page, operationId?: number, tab?: string) => void;
    backPage?: Page;
    onGoBack?: () => void;
    breadcrumb?: { label: string; page: Page; operationId?: number }[];
    children: ReactNode;
    actions?: ReactNode;
    currentUser?: User;
    className?: string;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ title, children, actions, className }) => {
    const { dir } = useLanguage();

    // Transmet le titre de la page à la barre de titre personnalisée
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('app-title', { detail: { title } }));
    }, [title]);

    return (
        <div className={`p-2 sm:p-4 w-full max-w-none mx-auto min-h-full ${className || ''}`} dir={dir}>
            {actions && (
                <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-wrap items-center justify-between gap-2 mb-3"
                >
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {actions}
                    </div>
                </motion.div>
            )}
            <main>
                {children}
            </main>
        </div>
    );
};

export default PageWrapper;
