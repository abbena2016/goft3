
import React, { useState } from 'react';
import { Page, Rubrique, User } from '../types';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import PageWrapper from '../components/PageWrapper';
import Modal from '../components/Modal';
import AddRubriqueForm from '../components/forms/AddRubriqueForm';

interface RubriquePageProps {
    navigate: (page: Page) => void;
    onGoBack?: () => void;
    currentUser: User;
}

const RubriquePage: React.FC<RubriquePageProps> = ({ navigate, onGoBack, currentUser }) => {
    const { db, loading, addItem, updateItem, deleteItem } = useData();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRubrique, setEditingRubrique] = useState<Rubrique | undefined>(undefined);
    const [selectedRubriqueId, setSelectedRubriqueId] = useState<number | null>(null);
    const [formKey, setFormKey] = useState(0);

    const handleSaveRubrique = async (rubriqueData: Omit<Rubrique, 'ID_RUBRIQUE'> | Rubrique) => {
        showToast('جاري حفظ البيانات...', 'loading');
        try {
            if ('ID_RUBRIQUE' in rubriqueData) {
                await updateItem('T_RUBRIQUE', rubriqueData.ID_RUBRIQUE, rubriqueData);
                showToast('تم تعديل الهيكل بنجاح', 'success');
            } else {
                await addItem('T_RUBRIQUE', rubriqueData);
                showToast('تمت إضافة الهيكل بنجاح', 'success');
            }
            setIsModalOpen(false);
            setEditingRubrique(undefined);
        } catch (error) {
            showToast('حدث خطأ أثناء الحفظ', 'error');
        }
    };

    const handleDeleteRubrique = async () => {
        if (selectedRubriqueId === null) return;
        const confirmed = await confirm('هل أنت متأكد أنك تريد حذف هذا الهيكل؟');
        if (confirmed) {
            showToast('جاري الحذف...', 'loading');
            try {
                await deleteItem('T_RUBRIQUE', selectedRubriqueId);
                setSelectedRubriqueId(null);
                showToast('تم حذف الهيكل بنجاح', 'success');
            } catch (error) {
                showToast('حدث خطأ أثناء الحذف', 'error');
            }
        }
    };

    const openAddModal = () => {
        if (loading) {
            alert("يجب الانتظار حتى يتم تحديث النافذة");
            return;
        }
        setEditingRubrique(undefined);
        setFormKey(prev => prev + 1);
        setIsModalOpen(true);
    };

    const openEditModal = () => {
        if (loading) {
            alert("يجب الانتظار حتى يتم تحديث النافذة");
            return;
        }
        if (selectedRubriqueId === null) return;
        const rubriqueToEdit = db.T_RUBRIQUE.find(r => r.ID_RUBRIQUE === selectedRubriqueId);
        if (rubriqueToEdit) {
            setEditingRubrique(rubriqueToEdit);
            setFormKey(prev => prev + 1);
            setIsModalOpen(true);
        }
    };

    if (loading) return <div>جار التحميل...</div>;

    return (
        <PageWrapper
            title="إدارة هيكلة الكلفة"
            navigate={navigate}
            onGoBack={onGoBack}
            backPage="SETTINGS"
            currentUser={currentUser}
            actions={
                <div className="flex items-center gap-2">
                    <button onClick={openAddModal} className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition-colors">
                        <i className="bi bi-plus-circle mr-2"></i> إضافة هيكل
                    </button>
                    <button onClick={openEditModal} disabled={selectedRubriqueId === null} className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow hover:bg-yellow-600 transition-colors disabled:bg-gray-400">
                        <i className="bi bi-pencil-fill mr-2"></i> تعديل
                    </button>
                    <button onClick={handleDeleteRubrique} disabled={selectedRubriqueId === null} className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition-colors disabled:bg-gray-400">
                        <i className="bi bi-trash-fill mr-2"></i> حذف
                    </button>
                </div>
            }
        >
            <div className="bg-white p-4 rounded-lg shadow-md overflow-auto max-h-[60vh]">
                <table className="w-full text-right">
                    <thead className="bg-blue-100">
                        <tr>
                            <th className="p-3 text-sm font-semibold text-gray-700 uppercase tracking-wider">المعرف</th>
                            <th className="p-3 text-sm font-semibold text-gray-700 uppercase tracking-wider">العنوان</th>
                        </tr>
                    </thead>
                    <tbody>
                        {db.T_RUBRIQUE.slice().sort((a, b) => a.ID_RUBRIQUE - b.ID_RUBRIQUE).map(r => (
                            <tr key={r.ID_RUBRIQUE} onClick={() => setSelectedRubriqueId(r.ID_RUBRIQUE)} className={`border-b hover:bg-gray-50 cursor-pointer text-sm ${selectedRubriqueId === r.ID_RUBRIQUE ? 'bg-blue-50' : ''}`}>
                                <td className="p-3 text-gray-700">{r.ID_RUBRIQUE}</td>
                                <td className="p-3 font-semibold text-gray-800">{r.RUBRIQUE}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRubrique(undefined); }} title={editingRubrique ? "تعديل هيكل" : "إضافة هيكل جديد"}>
                <AddRubriqueForm key={formKey} onClose={() => { setIsModalOpen(false); setEditingRubrique(undefined); }} onSave={handleSaveRubrique} initialData={editingRubrique} />
            </Modal>
        </PageWrapper>
    );
};

export default RubriquePage;
