
import React, { useState } from 'react';
import { Page, User } from '../types';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import PageWrapper from '../components/PageWrapper';
import Modal from '../components/Modal';
import AddUserForm from '../components/forms/AddUserForm';
import UserPermissionsForm from '../components/forms/UserPermissionsForm';

const UsersPage: React.FC<{ navigate: (page: Page) => void, onGoBack?: () => void, currentUser: User }> = ({ navigate, onGoBack, currentUser }) => {
    const { db, loading, addItem, updateItem, deleteItem } = useData();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    const [formKey, setFormKey] = useState(0);

    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
    const [permissionsUser, setPermissionsUser] = useState<User | undefined>(undefined);

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
            setIsModalOpen(false);
            setEditingUser(undefined);
        } catch (error: any) {
            console.error("Error saving user:", error);
            let errorMessage = "حدث خطأ أثناء حفظ المستخدم.";
            if (error && typeof error === 'object') {
                if (error.code === '23505') {
                    errorMessage = "اسم المستخدم موجود بالفعل.";
                } else if (error.message) {
                    errorMessage += ` التفاصيل: ${error.message}`;
                }
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
            } catch (error) {
                console.error("Error deleting user", error);
                showToast("حدث خطأ أثناء حذف المستخدم.", 'error');
            }
        }
    };

    const openAddModal = () => {
        if (loading) {
            alert("يجب الانتظار حتى يتم تحديث النافذة");
            return;
        }
        setEditingUser(undefined);
        setFormKey(prev => prev + 1);
        setIsModalOpen(true);
    };

    const openEditModalForUser = (user: User) => {
        setEditingUser(user);
        setFormKey(prev => prev + 1);
        setIsModalOpen(true);
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

    return (
        <PageWrapper
            title="إدارة المستخدمين"
            navigate={navigate}
            onGoBack={onGoBack}
            backPage="SETTINGS"
            currentUser={currentUser}
            actions={
                <div className="flex items-center gap-2">
                    <button onClick={openAddModal} className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 font-bold text-sm flex items-center gap-1">
                        <i className="bi bi-plus-circle"></i> إضافة مستخدم جديد
                    </button>
                </div>
            }
        >
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 overflow-auto">
                <table className="w-full text-right min-w-[600px] border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-3 text-sm font-bold text-gray-700">اسم المستخدم</th>
                            <th className="p-3 text-sm font-bold text-gray-700">الدور والنوع</th>
                            <th className="p-3 text-sm font-bold text-gray-700 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {db.T_USER.slice().sort((a, b) => a.ID_USER - b.ID_USER).map(user => (
                            <tr key={user.ID_USER} className="hover:bg-blue-50/50 transition-colors text-sm">
                                <td className="p-3 font-semibold text-gray-800">{user.USERNAME}</td>
                                <td className="p-3 text-gray-700">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                        user.ROLE === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                        user.ROLE === 'viewer' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                        'bg-green-100 text-green-700 border-green-200'
                                    }`}>
                                        {getRoleName(user.ROLE)}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => openEditModalForUser(user)}
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}>
                <AddUserForm key={formKey} onClose={() => setIsModalOpen(false)} onSave={handleSaveUser} initialData={editingUser} />
            </Modal>

            {permissionsUser && (
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

export default UsersPage;
