import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { logoDataUrl, User } from '../types';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import StatusIndicators from '../components/StatusIndicators';
import { hashPassword, verifyPassword, DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD_HASH } from '../utils/authUtils';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface LoginPageProps {
    onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const { db, loading, isOnline, updateItem, addItem, refreshData } = useData();
    const { t, dir } = useLanguage();
	useEffect(() => {
        window.dispatchEvent(new CustomEvent('app-title', { detail: { title: t('page.login') } }));
    }, [t]);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Forced password-change state (for default/flagged accounts)
    const [pendingForceChangeUser, setPendingForceChangeUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [forceChangeError, setForceChangeError] = useState('');
    const [isSavingChange, setIsSavingChange] = useState(false);

    const handleForcePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pendingForceChangeUser) return;

        const pass = newPassword;
        if (!pass) {
            setForceChangeError('يرجى إدخال كلمة مرور جديدة.');
            return;
        }
        if (pass.length < 6) {
            setForceChangeError('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
            return;
        }
        if (pass !== confirmPassword) {
            setForceChangeError('كلمتا المرور غير متطابقتين.');
            return;
        }

        setIsSavingChange(true);
        setForceChangeError('');
        try {
            const hashed = await hashPassword(pass);
            const updatedUser: User = {
                ...pendingForceChangeUser,
                PASSWORD: hashed,
                MUST_CHANGE_PASSWORD: false
            };
            try {
                await updateItem('T_USER', updatedUser.ID_USER, updatedUser);
            } catch (err) {
                console.warn("Could not persist password change to DB, continuing locally:", err);
            }
            setPendingForceChangeUser(null);
            setNewPassword('');
            setConfirmPassword('');
            onLogin(updatedUser);
        } catch (err) {
            console.error("Password change error:", err);
            setForceChangeError('خطأ في حفظ كلمة المرور الجديدة.');
        } finally {
            setIsSavingChange(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loading || isLoggingIn) {
            setError('جارٍ تحميل البيانات... يرجى الانتظار.');
            return;
        }

        const targetUsername = username.trim();
        const targetPassword = password;

        if (!targetUsername) {
            setError('يرجى إدخال اسم المستخدم.');
            return;
        }

        setIsLoggingIn(true);
        setError('');

        try {
            let user = db.T_USER.find(u => u.USERNAME.trim().toLowerCase() === targetUsername.toLowerCase());

            // First-run support: if no users in db yet OR user is trying default admin on first launch
            if (!user && (db.T_USER.length === 0 || targetUsername.toLowerCase() === DEFAULT_ADMIN_USERNAME)) {
                if (targetUsername.toLowerCase() === DEFAULT_ADMIN_USERNAME && (targetPassword === 'admin' || targetPassword.trim() === '')) {
                    const defaultAdmin: User = {
                        ID_USER: 1,
                        USERNAME: DEFAULT_ADMIN_USERNAME,
                        PASSWORD: DEFAULT_ADMIN_PASSWORD_HASH,
                        ROLE: 'admin',
                        MUST_CHANGE_PASSWORD: true
                    };

                    try {
                        await addItem('T_USER', {
                            USERNAME: DEFAULT_ADMIN_USERNAME,
                            PASSWORD: DEFAULT_ADMIN_PASSWORD_HASH,
                            ROLE: 'admin',
                            MUST_CHANGE_PASSWORD: true
                        });
                    } catch (e) {
                        console.warn("Could not insert default admin to DB, continuing with local login:", e);
                    }

                    if (defaultAdmin.MUST_CHANGE_PASSWORD) {
                        setPendingForceChangeUser(defaultAdmin);
                        return;
                    }
                    onLogin(defaultAdmin);
                    return;
                }
            }

            if (user) {
                const { valid, needsRehash } = await verifyPassword(targetPassword, user.PASSWORD);

                if (valid) {
                    if (needsRehash) {
                        try {
                            const newBcryptHash = await hashPassword(targetPassword);
                            // Auto-migrate legacy password to Bcrypt seamlessly in DB & cache
                            updateItem('T_USER', user.ID_USER, {
                                ...user,
                                PASSWORD: newBcryptHash
                            }).catch(err => {
                                console.warn("Background auto-migration to Bcrypt deferred:", err);
                            });
                            user.PASSWORD = newBcryptHash;
                        } catch (rehashErr) {
                            console.warn("Could not rehash password on login:", rehashErr);
                        }
                    }
                    if (navigator.onLine) {
                        refreshData().catch(err => console.warn("Background database refresh on login deferred:", err));
                    }
                    if (user.MUST_CHANGE_PASSWORD) {
                        setPendingForceChangeUser(user);
                        return;
                    }
                    onLogin(user);
                } else {
                    setError(t('login.error'));
                }
            } else {
                setError(t('login.error'));
            }
        } catch (err) {
            console.error("Login verification error:", err);
            setError("خطأ في التحقق من كلمة المرور.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleExitApp = async () => {
        if (navigator.onLine) {
            try {
                await refreshData();
            } catch (e) {
                console.warn("Background database sync on exit deferred:", e);
            }
        }

        // 1. Electron IPC
        if ((window as any).electron?.ipcRenderer?.send) {
            (window as any).electron.ipcRenderer.send('app:quit');
            return;
        }

        // 2. Tauri: close the current window via the official API.
        // Uses destroy() so it works even when the native X is disabled (closable:false).
        // Requires the "core:window:allow-destroy" capability (see src-tauri/capabilities/default.json).
        const w = window as any;
        const isTauri = navigator.userAgent.includes('Tauri') || !!w.__TAURI_INTERNALS__ || !!w.__TAURI__;
        if (isTauri) {
            try {
                await getCurrentWindow().destroy();
                return;
            } catch (e) {
                console.warn("Tauri window destroy failed:", e);
            }
            try {
                await getCurrentWindow().close();
                return;
            } catch (e) {
                console.warn("Tauri window close failed:", e);
            }
        }

        // 3. Standard Browser Fallback (works only for script-opened windows)
        try {
            window.close();
        } catch (e) {
            console.warn("Browser window close fallback warning:", e);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-full bg-[#fafafa] relative p-4 selection:bg-blue-600 selection:text-white" dir={dir}>
            
            {/* Status Indicators (Network & DB) */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <StatusIndicators className="border border-slate-200 bg-white rounded-lg px-2 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative w-full max-w-sm sm:max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-slate-200/70"
            >
                <div className="text-center">
                    <div className="inline-block p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                        <img src={logoDataUrl} alt="App Logo" className="w-14 h-14 mx-auto" />
                    </div>
                    <h1 className="text-xl font-medium text-slate-900 tracking-tight">GOFT3</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('login.title')}</p>
                    
                    {/* Offline Indicator */}
                    {!isOnline && (
                        <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1 rounded-lg text-xs font-medium border border-amber-200">
                            <i className="bi bi-wifi-off"></i>
                            <span>وضع غير متصل (نسخة محلية)</span>
                        </div>
                    )}
                </div>

                {pendingForceChangeUser ? (
                    <form className="space-y-4" onSubmit={handleForcePasswordChange}>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs text-amber-800 font-medium">
                                يجب عليك تعيين كلمة مرور جديدة قبل متابعة استخدام التطبيق (الحساب الافتراضي).
                            </p>
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 text-start mb-1.5">
                                كلمة المرور الجديدة
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                required
                                disabled={isSavingChange}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="6 أحرف على الأقل"
                                className="w-full h-10 px-3 text-sm font-normal text-slate-800 bg-white border border-slate-300 rounded-lg focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors outline-none disabled:bg-slate-100 normal-case"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 text-start mb-1.5">
                                تأكيد كلمة المرور
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                required
                                disabled={isSavingChange}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full h-10 px-3 text-sm font-normal text-slate-800 bg-white border border-slate-300 rounded-lg focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors outline-none disabled:bg-slate-100 normal-case"
                            />
                        </div>

                        {forceChangeError && (
                            <div className="text-center p-2 bg-rose-50 border border-rose-200 rounded-lg">
                                <p className="text-xs text-rose-600 font-medium">{forceChangeError}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSavingChange}
                            className="w-full h-10 px-4 rounded-lg font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors flex items-center justify-center gap-1.5 disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <i className={`bi ${isSavingChange ? 'bi-arrow-repeat animate-spin' : 'bi-shield-lock'} text-sm`}></i>
                            <span>{isSavingChange ? 'جاري الحفظ...' : 'حفظ كلمة المرور والدخول'}</span>
                        </button>
                    </form>
                ) : (
                <form className="space-y-4" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-700 text-start mb-1.5">
                            {t('login.username')}
                        </label>
                        <div className="relative flex items-center">
                            <i className="bi bi-person text-slate-400 text-sm absolute right-3 pointer-events-none rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto"></i>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                disabled={loading || isLoggingIn}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="اسم المستخدم"
                                className="w-full h-10 pr-9 pl-3 text-sm font-normal text-slate-800 bg-white border border-slate-300 rounded-lg focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors outline-none disabled:bg-slate-100 normal-case rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-slate-700 text-start mb-1.5">
                            {t('login.password')}
                        </label>
                        <div className="relative flex items-center">
                            <i className="bi bi-lock text-slate-400 text-sm absolute right-3 pointer-events-none rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto"></i>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                disabled={loading || isLoggingIn}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••"
                                className="w-full h-10 pr-9 pl-3 text-sm font-normal text-slate-800 bg-white border border-slate-300 rounded-lg focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors outline-none disabled:bg-slate-100 normal-case rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3"
                            />
                        </div>
                    </div>
                    
                    {loading && (
                        <div className="text-center text-slate-500 text-xs py-1">
                            <i className="bi bi-arrow-repeat animate-spin mr-1.5"></i>
                            جاري تهيئة قاعدة البيانات...
                        </div>
                    )}

                    {error && (
                        <div className="text-center p-2 bg-rose-50 border border-rose-200 rounded-lg">
                            <p className="text-xs text-rose-600 font-medium">{error}</p>
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                        <button
                            type="submit"
                            disabled={loading || isLoggingIn}
                            className="flex-1 h-10 px-4 rounded-lg font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors flex items-center justify-center gap-1.5 disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <i className={`bi ${isLoggingIn ? 'bi-arrow-repeat animate-spin' : 'bi-box-arrow-in-left'} text-sm`}></i>
                            <span>{isLoggingIn ? 'جارٍ التحقق...' : (loading ? 'انتظر قليلاً...' : t('login.btn'))}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleExitApp}
                            className="h-10 px-3.5 rounded-lg font-medium text-sm text-slate-700 hover:bg-slate-100 bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            title="إغلاق والخروج من التطبيق"
                        >
                            <i className="bi bi-power text-sm"></i>
                            <span>إغلاق التطبيق</span>
                        </button>
                    </div>
                </form>
                )}
            </motion.div>
        </div>
    );
};

export default LoginPage;