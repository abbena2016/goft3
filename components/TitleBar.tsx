import React, { useEffect, useState } from 'react';
import { Minus, Square, Copy, Home, ArrowRight, Search, LogOut } from 'lucide-react';
import { logoDataUrl, Page, User } from '../types';
import { minimizeWindow, toggleMaximizeWindow, isMaximized } from '../utils/windowControls';
import { getCurrentWindow } from '@tauri-apps/api/window';
import NotificationBell from './NotificationBell';
import StatusIndicators from './StatusIndicators';
import { useLanguage } from '../context/LanguageContext';

interface TitleBarProps {
    navigate?: (page: Page, id?: number, tab?: string) => void;
    currentUser?: User | null;
    onLogout?: () => void;
    onGoBack?: () => void;
    canGoBack?: boolean;
}

const TitleBar: React.FC<TitleBarProps> = ({ navigate, currentUser, onLogout, onGoBack, canGoBack }) => {
    const { t } = useLanguage();
    const [maximized, setMaximized] = useState(false);
    const [pageTitle, setPageTitle] = useState<string>('');

    useEffect(() => {
        let mounted = true;
        isMaximized().then(v => {
            if (mounted) setMaximized(v);
        });
        const onResize = () => {
            isMaximized().then(v => {
                if (mounted) setMaximized(v);
            });
        };
        window.addEventListener('resize', onResize);

        const onTitleChange = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail && typeof detail.title === 'string') {
                setPageTitle(detail.title);
            }
        };
        window.addEventListener('app-title', onTitleChange);

        return () => {
            mounted = false;
            window.removeEventListener('resize', onResize);
            window.removeEventListener('app-title', onTitleChange);
        };
    }, []);

    const handleToggleMaximize = async () => {
        await toggleMaximizeWindow();
        setMaximized(await isMaximized());
    };

    // Déplacement fiable de la fenêtre (chrome = surface non-interactive)
    const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;
        const w = window as any;
        if (w.__TAURI_INTERNALS__ || w.__TAURI__ || navigator.userAgent.includes('Tauri')) {
            getCurrentWindow().startDragging();
        }
    };

    const isAuthenticated = !!currentUser;

    return (
        <div
            onMouseDown={handleDragStart}
            className="sticky top-0 z-[70] h-11 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-2 gap-2 select-none no-print"
        >
            {/* Logo + titre */}
            <div className="flex items-center gap-2 h-full">
                <img src={logoDataUrl} alt="Logo" className="w-5 h-5 rounded" />
                <span className="text-sm font-medium text-slate-800 tracking-tight">GOFT3</span>
            </div>

            {/* Titre de la page courante */}
            <div className="flex-1 flex items-center justify-center min-w-0 px-2">
                <span className="text-sm font-medium text-slate-700 truncate">{pageTitle}</span>
            </div>

            {/* Contrôles principaux (seulement quand connecté) */}
            {isAuthenticated && (
                <div className="flex items-center gap-1 h-full">
                    <button
                        type="button"
                        onClick={() => navigate?.('HOME')}
                        title={`${t('menu.home')} (Ctrl+H)`}
                        className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                        <Home size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onGoBack?.()}
                        disabled={!canGoBack}
                        title={`${t('btn.back')} (Alt+←)`}
                        className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                    >
                        <ArrowRight size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
                        title={`${t('menu.home')} — بحث شامل (Ctrl+K)`}
                        className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                        <Search size={16} />
                    </button>
                    <NotificationBell navigate={navigate!} currentUser={currentUser!} />
                </div>
            )}

            {/* Statut + utilisateur + sortie + contrôles fenêtre */}
            <div className="flex items-center gap-1.5 h-full">
                {isAuthenticated && (
                    <>
                        <StatusIndicators className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 text-xs" />
                        <div
                            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-xs"
                            title={`المستخدم: ${currentUser.USERNAME}`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="font-medium text-slate-700">{currentUser.USERNAME}</span>
                        </div>
                        {onLogout && (
                            <button
                                type="button"
                                onClick={onLogout}
                                title={t('btn.logout')}
                                className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                                <LogOut size={16} />
                            </button>
                        )}
                    </>
                )}
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <button
                    type="button"
                    onClick={minimizeWindow}
                    title="تصغير"
                    aria-label="تصغير"
                    className="flex items-center justify-center w-9 h-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                >
                    <Minus size={15} />
                </button>
                <button
                    type="button"
                    onClick={handleToggleMaximize}
                    title={maximized ? 'استعادة الحجم' : 'تكبير'}
                    aria-label={maximized ? 'استعادة الحجم' : 'تكبير'}
                    className="flex items-center justify-center w-9 h-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                >
                    {maximized ? <Copy size={13} /> : <Square size={12} />}
                </button>
            </div>
        </div>
    );
};

export default TitleBar;
