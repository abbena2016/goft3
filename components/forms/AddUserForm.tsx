
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { hashPassword } from '../../utils/authUtils';

interface AddUserFormProps {
    onClose: () => void;
    onSave: (user: Omit<User, 'ID_USER'> | User) => void;
    initialData?: User;
}

const AddUserForm: React.FC<AddUserFormProps> = ({ onClose, onSave, initialData }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'user' | 'viewer'>('user');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setUsername(initialData.USERNAME);
            setPassword(initialData.PASSWORD);
            setRole(initialData.ROLE);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!username.trim() || !password.trim()) {
            alert('يرجى ملء جميع الحقول.');
            return;
        }

        setIsSubmitting(true);
        try {
            let finalPassword = password;
            // Only hash if new user or password was changed manually
            if (!initialData || password !== initialData.PASSWORD) {
                finalPassword = await hashPassword(password);
            }

            onSave({
                ...(initialData || {}),
                USERNAME: username,
                PASSWORD: finalPassword,
                ROLE: role,
                ALLOWED_PAGES: initialData?.ALLOWED_PAGES,
                ALLOWED_OPERATIONS: initialData?.ALLOWED_OPERATIONS,
            });
        } catch (err) {
            console.error("Hashing error:", err);
            alert("خطأ في تشفير كلمة المرور");
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="sticky top-0 bg-white z-10 pb-2 border-b border-gray-200 flex justify-end gap-3 pt-1 mb-4">
                <button type="button" onClick={onClose} className="px-5 py-1.5 bg-gray-200 text-gray-800 rounded-[20px] hover:bg-gray-300 transition-colors text-sm">إلغاء</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-1.5 bg-blue-600 text-white rounded-[20px] hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-bold">
                    {isSubmitting ? 'جاري الحفظ...' : (initialData ? 'حفظ التغييرات' : 'إضافة')}
                </button>
            </div>
            <div className="space-y-4 text-right">
                <div>
                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">اسم المستخدم</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 normal-case" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">كلمة المرور</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 normal-case" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">الدور</label>
                    <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'user' | 'viewer')} required className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                        <option value="user">مستخدم</option>
                        <option value="admin">مسؤول</option>
                        <option value="viewer">ملاحظ</option>
                    </select>
                </div>
            </div>
        </form>
    );
};

export default AddUserForm;
