
import React, { useState } from 'react';
import { Page, Programme, Sprogramme, User } from '../types';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import PageWrapper from '../components/PageWrapper';
import Modal from '../components/Modal';
import AddProgrammeForm from '../components/forms/AddProgrammeForm';
import AddSProgrammeForm from '../components/forms/AddSProgrammeForm';

interface ProgrammePageProps {
    navigate: (page: Page) => void;
    onGoBack?: () => void;
    currentUser: User;
}

const ProgrammePage: React.FC<ProgrammePageProps> = ({ navigate, onGoBack, currentUser }) => {
    const { db, loading, addItem, updateItem, deleteItem } = useData();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [selectedProgrammeId, setSelectedProgrammeId] = useState<number | null>(db.T_PROGRAMME[0]?.ID_PROGRAMME || null);
    const [selectedSProgrammeId, setSelectedSProgrammeId] = useState<number | null>(null);

    const [isProgrammeModalOpen, setIsProgrammeModalOpen] = useState(false);
    const [editingProgramme, setEditingProgramme] = useState<Programme | undefined>(undefined);
    const [isSProgrammeModalOpen, setIsSProgrammeModalOpen] = useState(false);
    const [editingSProgramme, setEditingSProgramme] = useState<Sprogramme | undefined>(undefined);
    const [progFormKey, setProgFormKey] = useState(0);
    const [sprogFormKey, setSprogFormKey] = useState(0);

    // Programme CRUD
    const handleSaveProgramme = async (data: Omit<Programme, 'ID_PROGRAMME'> | Programme) => {
        showToast('جاري حفظ البرنامج...', 'loading');
        try {
            if ('ID_PROGRAMME' in data) {
                await updateItem('T_PROGRAMME', data.ID_PROGRAMME, data);
                showToast('تم تعديل البرنامج بنجاح', 'success');
            } else {
                await addItem('T_PROGRAMME', data);
                showToast('تمت إضافة البرنامج بنجاح', 'success');
            }
            setIsProgrammeModalOpen(false);
            setEditingProgramme(undefined);
        } catch (error) {
            showToast('حدث خطأ أثناء الحفظ', 'error');
        }
    };

    const handleDeleteProgramme = async () => {
        if (selectedProgrammeId === null) return;
        const confirmed = await confirm('هل أنت متأكد أنك تريد حذف هذا البرنامج؟ سيتم حذف جميع البرامج الفرعية المرتبطة به.');
        if (confirmed) {
            showToast('جاري الحذف...', 'loading');
            try {
                await deleteItem('T_PROGRAMME', selectedProgrammeId);
                const newProgrammes = db.T_PROGRAMME.filter(p => p.ID_PROGRAMME !== selectedProgrammeId);
                setSelectedProgrammeId(newProgrammes[0]?.ID_PROGRAMME || null);
                setSelectedSProgrammeId(null);
                showToast('تم حذف البرنامج بنجاح', 'success');
            } catch (error) {
                showToast('حدث خطأ أثناء الحذف', 'error');
            }
        }
    };

    // SProgramme CRUD
    const handleSaveSProgramme = async (data: Omit<Sprogramme, 'ID_SPROGRAMME'> | Sprogramme) => {
        showToast('جاري حفظ البرنامج الفرعي...', 'loading');
        try {
            if ('ID_SPROGRAMME' in data) {
                await updateItem('T_SPROGRAMME', data.ID_SPROGRAMME, data);
                showToast('تم تعديل البرنامج الفرعي بنجاح', 'success');
            } else {
                await addItem('T_SPROGRAMME', data);
                showToast('تمت إضافة البرنامج الفرعي بنجاح', 'success');
            }
            setIsSProgrammeModalOpen(false);
            setEditingSProgramme(undefined);
        } catch (error) {
            showToast('حدث خطأ أثناء الحفظ', 'error');
        }
    };

    const handleDeleteSProgramme = async () => {
        if (selectedSProgrammeId === null) return;
        const confirmed = await confirm('هل أنت متأكد أنك تريد حذف هذا البرنامج الفرعي؟');
        if (confirmed) {
            showToast('جاري الحذف...', 'loading');
            try {
                await deleteItem('T_SPROGRAMME', selectedSProgrammeId);
                setSelectedSProgrammeId(null);
                showToast('تم حذف البرنامج الفرعي بنجاح', 'success');
            } catch (error) {
                showToast('حدث خطأ أثناء الحذف', 'error');
            }
        }
    };

    // Pagination states for Main Programmes
    const [progPageSize] = useState<number | 'all'>(50);
    const [progCurrentPage] = useState<number>(1);

    // Pagination states for Sub Programmes
    const [sprogPageSize] = useState<number | 'all'>(50);
    const [sprogCurrentPage, setSprogCurrentPage] = useState<number>(1);

    const sortedProgrammes = React.useMemo(() => {
        return db.T_PROGRAMME.slice().sort((a, b) => a.ID_PROGRAMME - b.ID_PROGRAMME);
    }, [db.T_PROGRAMME]);

    const filteredSProgrammes = React.useMemo(() => {
        return db.T_SPROGRAMME.filter(sprog => sprog.ID_PROGRAMME === selectedProgrammeId).sort((a, b) => a.ID_SPROGRAMME - b.ID_SPROGRAMME);
    }, [db.T_SPROGRAMME, selectedProgrammeId]);

    const paginatedProgrammes = React.useMemo(() => {
        if (progPageSize === 'all') return sortedProgrammes;
        const start = (progCurrentPage - 1) * (progPageSize as number);
        return sortedProgrammes.slice(start, start + (progPageSize as number));
    }, [sortedProgrammes, progCurrentPage, progPageSize]);

    const paginatedSProgrammes = React.useMemo(() => {
        if (sprogPageSize === 'all') return filteredSProgrammes;
        const start = (sprogCurrentPage - 1) * (sprogPageSize as number);
        return filteredSProgrammes.slice(start, start + (sprogPageSize as number));
    }, [filteredSProgrammes, sprogCurrentPage, sprogPageSize]);

    if (loading) return <div>جار التحميل...</div>;

    return (
        <PageWrapper
            title="إدارة البرامج"
            navigate={navigate}
            onGoBack={onGoBack}
            currentUser={currentUser}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                    <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-base font-bold text-gray-800">البرامج الرئيسية</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => { if(loading) { alert("يجب الانتظار حتى يتم تحديث النافذة"); return; } setEditingProgramme(undefined); setProgFormKey(p => p + 1); setIsProgrammeModalOpen(true); }} className="bg-green-600 text-white px-2.5 py-1 rounded-lg shadow-xs hover:bg-green-700 text-xs font-bold transition cursor-pointer"><i className="bi bi-plus-circle mr-1"></i> إضافة</button>
                            <button onClick={() => { if(loading) { alert("يجب الانتظار حتى يتم تحديث النافذة"); return; } const item = db.T_PROGRAMME.find(i=>i.ID_PROGRAMME === selectedProgrammeId); if(item) { setEditingProgramme(item); setProgFormKey(p => p + 1); setIsProgrammeModalOpen(true); } }} disabled={selectedProgrammeId === null} className="bg-amber-500 text-white px-2.5 py-1 rounded-lg shadow-xs hover:bg-amber-600 text-xs font-bold transition disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"><i className="bi bi-pencil-fill mr-1"></i> تعديل</button>
                            <button onClick={handleDeleteProgramme} disabled={selectedProgrammeId === null} className="bg-rose-600 text-white px-2.5 py-1 rounded-lg shadow-xs hover:bg-rose-700 text-xs font-bold transition disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"><i className="bi bi-trash-fill mr-1"></i> حذف</button>
                        </div>
                    </div>
                     <div className="overflow-auto max-h-96 custom-scrollbar">
                        <table className="w-full text-right border-collapse text-xs">
                             <thead className="bg-sky-100 text-gray-700 sticky top-0 z-20 shadow-sm border-b border-blue-200 font-bold">
                                <tr>
                                    <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">الرمز</th>
                                    <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">العنوان</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedProgrammes.map(prog => (
                                    <tr 
                                        key={prog.ID_PROGRAMME} 
                                        className={`hover:bg-blue-50/60 cursor-pointer text-xs transition-colors duration-150 ${prog.ID_PROGRAMME === selectedProgrammeId ? 'bg-blue-100/90 ring-2 ring-inset ring-blue-500 font-semibold' : ''}`}
                                        onClick={() => { setSelectedProgrammeId(prog.ID_PROGRAMME); setSelectedSProgrammeId(null); setSprogCurrentPage(1); }}
                                    >
                                        <td className="p-2 text-gray-900 font-bold font-mono">{prog.PROGRAMME}</td>
                                        <td className="p-2 text-gray-700 font-medium">{prog.INT_PROGRAMME}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {sortedProgrammes.length > 0 && (
                        <div className="p-2 bg-slate-50 border-t border-blue-200 text-xs flex justify-between items-center text-gray-700 font-medium">
                            <span>عدد البرامج الرئيسية: <strong className="text-blue-700">{sortedProgrammes.length}</strong></span>
                        </div>
                    )}
                </div>

                 <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                    <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-base font-bold text-gray-800">البرامج الفرعية</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => { if(loading) { alert("يجب الانتظار حتى يتم تحديث النافذة"); return; } setEditingSProgramme(undefined); setSprogFormKey(p => p + 1); setIsSProgrammeModalOpen(true); }} disabled={selectedProgrammeId === null} className="bg-green-600 text-white px-2.5 py-1 rounded-lg shadow-xs hover:bg-green-700 text-xs font-bold transition disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"><i className="bi bi-plus-circle mr-1"></i> إضافة</button>
                            <button onClick={() => { if(loading) { alert("يجب الانتظار حتى يتم تحديث النافذة"); return; } const item = db.T_SPROGRAMME.find(i=>i.ID_SPROGRAMME === selectedSProgrammeId); if(item) { setEditingSProgramme(item); setSprogFormKey(p => p + 1); setIsSProgrammeModalOpen(true); } }} disabled={selectedSProgrammeId === null} className="bg-amber-500 text-white px-2.5 py-1 rounded-lg shadow-xs hover:bg-amber-600 text-xs font-bold transition disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"><i className="bi bi-pencil-fill mr-1"></i> تعديل</button>
                            <button onClick={handleDeleteSProgramme} disabled={selectedSProgrammeId === null} className="bg-rose-600 text-white px-2.5 py-1 rounded-lg shadow-xs hover:bg-rose-700 text-xs font-bold transition disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"><i className="bi bi-trash-fill mr-1"></i> حذف</button>
                        </div>
                    </div>
                     <div className="overflow-auto max-h-96 custom-scrollbar">
                        <table className="w-full text-right border-collapse text-xs">
                             <thead className="bg-sky-100 text-gray-700 sticky top-0 z-20 shadow-sm border-b border-blue-200 font-bold">
                                <tr>
                                    <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">الرمز</th>
                                    <th className="p-2 text-right text-[10px] uppercase font-bold text-gray-600">العنوان</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedSProgrammes.map(sprog => (
                                    <tr key={sprog.ID_SPROGRAMME} onClick={() => setSelectedSProgrammeId(sprog.ID_SPROGRAMME)} className={`hover:bg-blue-50/60 cursor-pointer text-xs transition-colors duration-150 ${sprog.ID_SPROGRAMME === selectedSProgrammeId ? 'bg-blue-100/90 ring-2 ring-inset ring-blue-500 font-semibold' : ''}`}>
                                        <td className="p-2 text-gray-900 font-bold font-mono">{sprog.SPROGRAMME}</td>
                                        <td className="p-2 text-gray-700 font-medium">{sprog.INT_SPROGRAMME}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredSProgrammes.length > 0 && (
                        <div className="p-2 bg-slate-50 border-t border-blue-200 text-xs flex justify-between items-center text-gray-700 font-medium">
                            <span>عدد البرامج الفرعية: <strong className="text-blue-700">{filteredSProgrammes.length}</strong></span>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isProgrammeModalOpen} onClose={() => setIsProgrammeModalOpen(false)} title={editingProgramme ? "تعديل برنامج" : "إضافة برنامج جديد"}>
                <AddProgrammeForm key={progFormKey} onClose={() => setIsProgrammeModalOpen(false)} onSave={handleSaveProgramme} initialData={editingProgramme} />
            </Modal>
            <Modal isOpen={isSProgrammeModalOpen} onClose={() => setIsSProgrammeModalOpen(false)} title={editingSProgramme ? "تعديل برنامج فرعي" : "إضافة برنامج فرعي جديد"}>
                <AddSProgrammeForm key={sprogFormKey} onClose={() => setIsSProgrammeModalOpen(false)} onSave={handleSaveSProgramme} initialData={editingSProgramme} programmes={db.T_PROGRAMME} selectedProgrammeId={selectedProgrammeId} />
            </Modal>
        </PageWrapper>
    );
};

export default ProgrammePage;
