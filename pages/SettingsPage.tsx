
import React, { useState, useRef } from 'react';
import { Page, User, APP_VERSION } from '../types';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfirm } from '../context/ConfirmContext';
import PageWrapper from '../components/PageWrapper';
import { createTablesSQL } from '../services/dbSchema';
import Modal from '../components/Modal';
import AddUserForm from '../components/forms/AddUserForm';
import UserPermissionsForm from '../components/forms/UserPermissionsForm';
import { checkForUpdates, performUpdate } from '../utils/updateService';
import { saveFileWithDialog } from '../utils/saveFileWithDialog';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsPageProps {
    navigate: (page: Page, operationId?: number) => void;
    onGoBack?: () => void;
    currentUser: User;
}

type SettingsTab = 'general' | 'users' | 'tables';

const SettingsPage: React.FC<SettingsPageProps> = ({ navigate, onGoBack, currentUser }) => {
    const { db, loading, addItem, updateItem, deleteItem, resetDatabase, importDatabase, saveConfig, resetConfig } = useData();
    const { showToast } = useToast();
    const { t } = useLanguage();
    const { confirm } = useConfirm();
    
    const [activeTab, setActiveTab ] = useState<SettingsTab>('general');
    
    // System Settings States
    const [showSchema, setShowSchema] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [setupUrl, setSetupUrl] = useState('');
    const [setupKey, setSetupKey] = useState('');
    const [checkingUpdate, setCheckingUpdate] = useState(false);
    const [isExportingSqlite, setIsExportingSqlite] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // User Management States
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [formKey, setFormKey] = useState(0);

    // Permissions Modal States
    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
    const [permissionsUser, setPermissionsUser] = useState<User | undefined>(undefined);

    const isAdmin = currentUser.ROLE === 'admin';

    // User Actions
    const handleSaveUser = async (userData: Omit<User, 'ID_USER'> | User) => {
        showToast('جاري حفظ البيانات...', 'loading');
        try {
            if ('ID_USER' in userData) {
                await updateItem('T_USER', userData.ID_USER, userData);
                showToast('تم تعديل المستخدم بنجاح', 'success');
            } else {
                await addItem('T_USER', userData);
                showToast('تمت إضافة المستخدم بنجاح', 'success');
            }
            setIsUserModalOpen(false);
            setEditingUser(undefined);
        } catch (error: any) {
            console.error("Error saving user:", error);
            let errorMessage = "حدث خطأ أثناء حفظ المستخدم.";
            if (error && typeof error === 'object') {
                if (error.code === '23505') errorMessage = "اسم المستخدم موجود بالفعل.";
                else if (error.code === '23514') errorMessage = "تنبيه: قاعدة البيانات ترفض إضافة دور 'ملاحظ'. يرجى تحديث SQL.";
                else if (error.message) errorMessage += ` التفاصيل: ${error.message}`;
            }
            showToast(errorMessage, 'error');
        }
    };

    const handleSavePermissions = async (updatedUser: User) => {
        showToast('جاري حفظ الصلاحيات...', 'loading');
        try {
            await updateItem('T_USER', updatedUser.ID_USER, updatedUser);
            showToast('تم تحديث صلاحيات المستخدم بنجاح', 'success');
        } catch (error) {
            console.error("Error saving permissions:", error);
            showToast('حدث خطأ أثناء حفظ الصلاحيات.', 'error');
            throw error;
        }
    };

    const handleDeleteSpecificUser = async (userToDelete: User) => {
        const adminCount = db.T_USER.filter(u => u.ROLE === 'admin').length;
        if (userToDelete.ROLE === 'admin' && adminCount <= 1) {
            alert('لا يمكن حذف آخر مسؤول في النظام.');
            return;
        }
        const confirmed = await confirm(`هل أنت متأكد أنك تريد حذف المستخدم "${userToDelete.USERNAME}"؟`);
        if (confirmed) {
            showToast('جاري الحذف...', 'loading');
            try {
                await deleteItem('T_USER', userToDelete.ID_USER);
                showToast('تم حذف المستخدم بنجاح', 'success');
                if (selectedUserId === userToDelete.ID_USER) {
                    setSelectedUserId(null);
                }
            } catch (error) {
                showToast("حدث خطأ أثناء حذف المستخدم.", 'error');
            }
        }
    };

    const openAddUserModal = () => {
        if (loading) return;
        setEditingUser(undefined);
        setFormKey(prev => prev + 1);
        setIsUserModalOpen(true);
    };

    const openEditUserModalForUser = (user: User) => {
        setEditingUser(user);
        setFormKey(prev => prev + 1);
        setIsUserModalOpen(true);
    };

    const openPermissionsModalForUser = (user: User) => {
        setPermissionsUser(user);
        setIsPermissionsModalOpen(true);
    };

    const getRoleName = (role: string) => {
        switch (role) {
            case 'admin': return 'مسؤول';
            case 'viewer': return 'ملاحظ';
            default: return 'مستخدم';
        }
    };

    // System Config Logic
    const copyToClipboard = () => {
        navigator.clipboard.writeText(createTablesSQL);
        showToast("تم النسخ إلى الحافظة!", 'info');
    };

    const handleCheckUpdate = async () => {
        setCheckingUpdate(true);
        try {
            const updateInfo = await checkForUpdates();
            if (updateInfo === null) {
                showToast(`فشل التحقق من التحديثات (خطأ في الاتصال بالشبكة)`, 'error');
            } else if (updateInfo.hasUpdate) {
                const goToDownload = await confirm(`يوجد إصدار جديد متاح (${updateInfo.latestVersion}). هل تريد الانتقال لصفحة التحميل؟`, { danger: false });
                if (goToDownload) {
                    performUpdate(updateInfo.downloadUrl);
                }
            } else {
                showToast(`أنت تستخدم أحدث إصدار حالياً (${APP_VERSION})`, 'success');
            }
        } catch (_error) {
            showToast(`فشل التحقق من التحديثات`, 'error');
        } finally {
            setCheckingUpdate(false);
        }
    };

    const handleExport = async () => {
        const dataStr = JSON.stringify(db, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        await saveFileWithDialog(blob, `goft3_backup_${new Date().toISOString().split('T')[0]}.json`);
        showToast("تم تصدير قاعدة البيانات بنجاح", 'success');
    };

    const handleExportSqlite = async () => {
        setIsExportingSqlite(true);
        showToast("جاري نسخ وتصدير قاعدة البيانات بصيغة SQLite (goft3.db)...", 'loading');
        try {
            const { exportDatabaseToSqlite } = await import('../utils/sqliteExport');
            const { blob, totalRecords } = await exportDatabaseToSqlite(db, 'goft3.db');
            await saveFileWithDialog(blob, 'gft3.db');
            showToast(`تم نسخ قاعدة البيانات بنجاح (${totalRecords} سجل) إلى ملف gft3.db`, 'success');
        } catch (error: any) {
            console.error("Error exporting to SQLite:", error);
            showToast(`فشل تصدير SQLite: ${error.message || error}`, 'error');
        } finally {
            setIsExportingSqlite(false);
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                await importDatabase(json);
                showToast("تم استيراد قاعدة البيانات بنجاح", 'success');
            } catch (_error) {
                showToast("فشل استيراد الملف. تأكد من أنه ملف JSON صالح.", 'error');
            }
            if (event.target) event.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleResetDatabase = async () => {
        const confirmed = await confirm('خطر! سيؤدي هذا لتفريغ كافة الجداول. هل أنت متأكد؟');
        if (!confirmed) return;
        try {
            await resetDatabase();
            showToast("تم مسح قاعدة البيانات بنجاح", 'success');
        } catch (_error) {
            showToast("حدث خطأ أثناء مسح قاعدة البيانات", 'error');
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        const confirmed = await confirm('سيتم إعادة تحميل التطبيق لحفظ الإعدادات. هل أنت متأكد؟', { danger: false });
        if (!confirmed) return;
        const err = saveConfig(setupUrl, setupKey);
        if (err) {
            showToast(err, 'error');
            return;
        }
        setIsConfigOpen(false);
    };

    const tabs: {id: SettingsTab, label: string, icon: string}[] = [
        { id: 'general', label: 'الإعدادات العامة', icon: 'bi-gear-wide-connected' },
        { id: 'users', label: 'إدارة المستخدمين', icon: 'bi-people-fill' },
        { id: 'tables', label: 'الجداول الأساسية', icon: 'bi-table' }
    ];

    return (
        <PageWrapper title={t('page.settings')} navigate={navigate} onGoBack={onGoBack} currentUser={currentUser} breadcrumb={[]}>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                            activeTab === tab.id 
                                ? 'border-blue-600 text-blue-600 bg-blue-50' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <i className={`bi ${tab.icon}`}></i>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[50vh]">
                <AnimatePresence mode="wait">
                    {activeTab === 'general' && (
                        <motion.div 
                            key="general" 
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
                                    <i className="bi bi-cloud-check-fill"></i>
                                    {t('btn.cloud_management')}
                                </h3>
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                                        يعمل التطبيق حالياً بنظام المزامنة السحابية. يتم حفظ التغييرات فورياً وآلياً.
                                    </p>

                                    <div className="grid grid-cols-1 gap-2">
                                        <button onClick={() => setIsConfigOpen(true)} className="flex items-center gap-2 w-full bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                                            <i className="bi bi-link-45deg text-blue-600"></i> {t('btn.db_settings')}
                                        </button>

                                        <button onClick={handleExport} className="flex items-center gap-2 w-full bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                                            <i className="bi bi-cloud-download text-teal-600"></i> {t('btn.backup')} (JSON)
                                        </button>

                                        <button 
                                            onClick={handleExportSqlite} 
                                            disabled={isExportingSqlite}
                                            className="flex items-center gap-2 w-full bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-bold shadow-sm"
                                        >
                                            <i className="bi bi-database-fill-down text-emerald-600 text-base"></i>
                                            {isExportingSqlite ? 'جاري تجهيز ملف SQLite...' : 'تصدير كامل قاعدة البيانات إلى SQLite (تحميل goft3.db)'}
                                        </button>
                                        
                                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 w-full bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                                            <i className="bi bi-cloud-upload text-amber-600"></i> {t('btn.restore')} (JSON)
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />

                                        <div className="pt-4 border-t mt-2">
                                            <button onClick={handleResetDatabase} className="flex items-center gap-2 w-full bg-red-50 text-red-700 border border-red-100 px-4 py-2.5 rounded-lg hover:bg-red-100 transition-colors text-sm font-bold">
                                                <i className="bi bi-trash3-fill"></i> {t('btn.reset_db')}
                                            </button>
                                            <button onClick={resetConfig} className="flex items-center gap-2 w-full mt-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                                                <i className="bi bi-door-open-fill"></i> {t('btn.disconnect')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-800">
                                    <i className="bi bi-arrow-up-circle-fill"></i>
                                    تحديث البرنامج
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div className="text-sm font-medium text-gray-500">الإصدار الحالي للنظام:</div>
                                        <div className="font-mono font-bold text-indigo-600 bg-white px-3 py-1 rounded shadow-sm border">{APP_VERSION}</div>
                                    </div>
                                    
                                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                        <p className="text-xs text-indigo-700 leading-relaxed mb-4">
                                            ننصح بالتحقق بشكل دوري من وجود تحديثات لضمان الحصول على أحدث الإصلاحات والمميزات.
                                        </p>
                                        <button 
                                            onClick={handleCheckUpdate} 
                                            disabled={checkingUpdate}
                                            className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center font-bold disabled:bg-gray-300"
                                        >
                                            {checkingUpdate ? (
                                                <><i className="bi bi-arrow-repeat animate-spin ml-2"></i> جاري فحص المستودع...</>
                                            ) : (
                                                <><i className="bi bi-cloud-arrow-down-fill ml-2"></i> جاري فحص التحديثات</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'users' && isAdmin && (
                        <motion.div 
                            key="users" 
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <i className="bi bi-people-fill text-blue-600"></i>
                                    قائمة المستخدمين المسجلين
                                </h3>
                                <button onClick={openAddUserModal} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition-colors font-bold text-sm">
                                    <i className="bi bi-plus-lg"></i> إضافة مستخدم جديد
                                </button>
                            </div>

                            <div className="overflow-hidden border border-gray-200 rounded-lg">
                                <table className="w-full text-right border-collapse">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="p-4 text-sm font-bold text-gray-600">اسم المستخدم</th>
                                            <th className="p-4 text-sm font-bold text-gray-600">الدور والنوع</th>
                                            <th className="p-4 text-sm font-bold text-gray-600">المعرف</th>
                                            <th className="p-4 text-sm font-bold text-gray-600 text-center">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {db.T_USER.slice().sort((a, b) => a.ID_USER - b.ID_USER).map(user => (
                                            <tr 
                                                key={user.ID_USER} 
                                                className="hover:bg-blue-50/50 transition-colors"
                                            >
                                                <td className="p-4 font-semibold text-gray-800">{user.USERNAME}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                        user.ROLE === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                        user.ROLE === 'viewer' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                                        'bg-green-100 text-green-700 border-green-200'
                                                    }`}>
                                                        {getRoleName(user.ROLE)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-400 font-mono text-xs">{user.ID_USER}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => openEditUserModalForUser(user)}
                                                            className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-bold flex items-center gap-1 transition-colors"
                                                            title="تعديل حساب المستخدم"
                                                        >
                                                            <i className="bi bi-pencil-square"></i> تعديل
                                                        </button>
                                                        <button 
                                                            onClick={() => openPermissionsModalForUser(user)}
                                                            className="px-3 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-md text-xs font-bold flex items-center gap-1 transition-colors"
                                                            title="تخصيص صلاحيات المستخدم"
                                                        >
                                                            <i className="bi bi-shield-lock-fill"></i> التخصيص
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteSpecificUser(user)}
                                                            className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-md text-xs font-bold flex items-center gap-1 transition-colors"
                                                            title="حذف المستخدم"
                                                        >
                                                            <i className="bi bi-trash3-fill"></i> حذف
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'tables' && (
                        <motion.div 
                            key="tables" 
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                        >
                            <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                                <i className="bi bi-journal-bookmark-fill text-indigo-600"></i>
                                إدارة البيانات المرجعية
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <button onClick={() => navigate('PROGRAMME')} className="group flex flex-col items-center gap-3 p-6 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-md hover:border-blue-200 transition-all text-sm font-bold text-gray-700">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <i className="bi bi-folder-fill"></i>
                                    </div>
                                    <span>{t('btn.manage_programmes')}</span>
                                </button>

                                <button onClick={() => navigate('CATEGORIE')} className="group flex flex-col items-center gap-3 p-6 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-md hover:border-blue-200 transition-all text-sm font-bold text-gray-700">
                                    <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                        <i className="bi bi-tags-fill"></i>
                                    </div>
                                    <span>{t('btn.manage_categories')}</span>
                                </button>

                                <button onClick={() => navigate('RUBRIQUE')} className="group flex flex-col items-center gap-3 p-6 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-md hover:border-blue-200 transition-all text-sm font-bold text-gray-700">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <i className="bi bi-diagram-3-fill"></i>
                                    </div>
                                    <span>{t('btn.manage_rubriques')}</span>
                                </button>

                                <button onClick={() => navigate('DIRECTION')} className="group flex flex-col items-center gap-3 p-6 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-md hover:border-blue-200 transition-all text-sm font-bold text-gray-700">
                                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                        <i className="bi bi-geo-alt-fill"></i>
                                    </div>
                                    <span>{t('btn.manage_directions')}</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals from original code + New User Modal + Permissions Modal */}
            <Modal isOpen={showSchema} onClose={() => setShowSchema(false)} title="كود إنشاء قاعدة البيانات (SQL)">
                <div className="space-y-4" dir="ltr">
                    <p className="text-right text-gray-600 text-sm mb-2">
                        انسخ هذا الكود وقم بتشغيله في Supabase SQL Editor لإصلاح أو إنشاء الجداول.
                    </p>
                    <textarea 
                        readOnly 
                        value={createTablesSQL} 
                        className="w-full h-96 p-4 bg-gray-900 text-green-400 font-mono text-xs rounded-md shadow-inner ring-1 ring-white/10"
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={copyToClipboard} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">نسخ الكود</button>
                        <button onClick={() => setShowSchema(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-300">إلغاء</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} title="إعدادات قاعدة البيانات (Supabase)">
                <form onSubmit={handleSaveConfig} className="space-y-4" dir="ltr">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2 text-left">رابط المشروع (Project URL)</label>
                        <input 
                            type="url" 
                            value={setupUrl} 
                            onChange={e => setSetupUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                            placeholder="https://xyz.supabase.co"
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2 text-left">مفتاح API (anon/public)</label>
                        <input 
                            type="password" 
                            value={setupKey} 
                            onChange={e => setSetupKey(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            required 
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4" dir="rtl">
                        <button type="button" onClick={() => setIsConfigOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">حفظ واتصال</button>
                    </div>
                </form>
            </Modal>

            {isAdmin && (
                <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}>
                    <AddUserForm key={formKey} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} initialData={editingUser} />
                </Modal>
            )}

            {isAdmin && permissionsUser && (
                <Modal isOpen={isPermissionsModalOpen} onClose={() => setIsPermissionsModalOpen(false)} title={`تخصيص صلاحيات المستخدم: ${permissionsUser.USERNAME}`} maxWidth="xl">
                    <UserPermissionsForm 
                        user={permissionsUser} 
                        onClose={() => setIsPermissionsModalOpen(false)} 
                        onSave={handleSavePermissions} 
                    />
                </Modal>
            )}

        </PageWrapper>
    );
};

export default SettingsPage;
