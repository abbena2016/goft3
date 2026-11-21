
import React, { useState, useEffect, useRef } from 'react';
import { Beneficiaire, CompteBancaire } from '../../types';

interface AddBeneficiaryFormProps {
    onClose: () => void;
    onSave: (data: { beneficiaryData: Omit<Beneficiaire, 'ID_BENEFICIAIRE'> | Beneficiaire; accounts: Array<{ rib: string; banque: string }> }) => void;
    initialData?: { beneficiary: Beneficiaire; accounts: CompteBancaire[] };
}

const AddBeneficiaryForm: React.FC<AddBeneficiaryFormProps> = ({ onClose, onSave, initialData }) => {
    const [beneficiaire, setBeneficiaire] = useState('');
    const [activite, setActivite] = useState('');
    const [adresse, setAdresse] = useState('');
    const [rc, setRc] = useState('');
    const [codeFiscale, setCodeFiscale] = useState('');
    const [accounts, setAccounts] = useState([{ rib: '', banque: '' }]);

    const isDirty = useRef(false);
    const isEditLoaded = useRef(false);
    const markDirty = () => { isDirty.current = true; };

    useEffect(() => {
        if (initialData && !isEditLoaded.current) {
            setBeneficiaire(initialData.beneficiary.BENEFICIAIRE);
            setActivite(initialData.beneficiary.ACTIVITE || '');
            setAdresse(initialData.beneficiary.ADRESSE);
            setRc(initialData.beneficiary.RC || '');
            setCodeFiscale(initialData.beneficiary.CODE_FISCALE || '');
            if (initialData.accounts.length > 0) {
                setAccounts(initialData.accounts.map(acc => ({ rib: acc.RIB, banque: acc.BANQUE })));
            } else {
                setAccounts([{ rib: '', banque: '' }]);
            }
            isEditLoaded.current = true;
            isDirty.current = true;
        } else if (!initialData && !isDirty.current) {
            // New Entry Default - ensure clean state
            setBeneficiaire('');
            setActivite('');
            setAdresse('');
            setRc('');
            setCodeFiscale('');
            setAccounts([{ rib: '', banque: '' }]);
        }
    }, [initialData]);
    
    const handleAccountChange = (index: number, field: 'rib' | 'banque', value: string) => {
        markDirty();
        const newAccounts = [...accounts];
        const isSpecialAccount = ['الخزينة العمومية', 'حضيرة العتاد', 'حضير العتاد'].includes(beneficiaire.trim());
        
        if (field === 'rib') {
            const digitsOnly = value.replace(/\D/g, '').slice(0, 20);
            
            if (isSpecialAccount) {
                 // For Special account, no spacing format
                 newAccounts[index][field] = digitsOnly;
            } else {
                // Format for display as RIB
                const parts = [];
                if (digitsOnly.length > 0) parts.push(digitsOnly.slice(0, 3));
                if (digitsOnly.length > 3) parts.push(digitsOnly.slice(3, 8));
                if (digitsOnly.length > 8) parts.push(digitsOnly.slice(8, 18));
                if (digitsOnly.length > 18) parts.push(digitsOnly.slice(18, 20));
                newAccounts[index][field] = parts.join(' ');
            }
        } else {
            newAccounts[index][field] = value.toUpperCase();
        }
        
        setAccounts(newAccounts);
    };

    const addAccount = () => {
        markDirty();
        setAccounts([...accounts, { rib: '', banque: '' }]);
    };
    
    const removeAccount = (index: number) => {
        if (accounts.length <= 1) return; // Must have at least one account
        markDirty();
        const newAccounts = accounts.filter((_, i) => i !== index);
        setAccounts(newAccounts);
    };


    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (accounts.some(acc => !acc.rib.trim() || !acc.banque.trim())) {
            alert('يرجى ملء جميع حقول الحسابات البنكية (رقم الحساب والبنك).');
            return;
        }

        if (!['الخزينة العمومية', 'حضيرة العتاد', 'حضير العتاد'].includes(beneficiaire.trim()) && accounts.some(acc => acc.rib.replace(/\s/g, '').length !== 20)) {
            alert('رقم الحساب (RIB) يجب أن يتكون من 20 رقمًا.');
            return;
        }

        setIsSubmitting(true);
        const processedAccounts = accounts.map(acc => ({
            ...acc,
            rib: acc.rib.replace(/\s/g, '')
        }));

        const beneficiaryData: Omit<Beneficiaire, 'ID_BENEFICIAIRE'> | Beneficiaire = {
            ...(initialData?.beneficiary ? { ID_BENEFICIAIRE: initialData.beneficiary.ID_BENEFICIAIRE } : {}),
            BENEFICIAIRE: beneficiaire,
            ACTIVITE: activite || undefined,
            ADRESSE: adresse,
            RC: rc || null,
            CODE_FISCALE: codeFiscale || null,
        };
        
        onSave({
            beneficiaryData,
            accounts: processedAccounts,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
            <div className="sticky top-0 bg-white z-10 pb-2 border-b border-gray-200 flex items-center justify-between pt-0.5 mb-3">
                <span className="text-xs font-bold text-gray-700">بيانات المتعامل / المستفيد</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-semibold"
                    >
                        إلغاء
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-xs font-bold shadow-xs"
                    >
                        {isSubmitting ? 'جاري الحفظ...' : (initialData ? 'حفظ التغييرات' : 'إضافة')}
                    </button>
                </div>
            </div>

            <div className="space-y-3 overflow-y-auto px-0.5 pb-1 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                    <div className="md:col-span-2">
                        <label htmlFor="beneficiaire" className="block text-[11px] font-bold text-gray-700 text-right mb-0.5">اسم المستفيد</label>
                        <input
                            id="beneficiaire"
                            type="text"
                            value={beneficiaire}
                            onChange={e => { setBeneficiaire(e.target.value.toUpperCase()); markDirty(); }}
                            required
                            className="w-full h-8 px-2.5 text-xs text-gray-800 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase"
                        />
                    </div>
                    <div>
                        <label htmlFor="activite" className="block text-[11px] font-bold text-gray-700 text-right mb-0.5">النشاط التجاري</label>
                        <input
                            id="activite"
                            type="text"
                            value={activite}
                            onChange={e => { setActivite(e.target.value.toUpperCase()); markDirty(); }}
                            className="w-full h-8 px-2.5 text-xs text-gray-800 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase"
                        />
                    </div>
                    <div>
                        <label htmlFor="adresse" className="block text-[11px] font-bold text-gray-700 text-right mb-0.5">العنوان</label>
                        <input
                            id="adresse"
                            type="text"
                            value={adresse}
                            onChange={e => { setAdresse(e.target.value.toUpperCase()); markDirty(); }}
                            required
                            className="w-full h-8 px-2.5 text-xs text-gray-800 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase"
                        />
                    </div>
                </div>
                
                <div className="space-y-2.5 p-3 border border-slate-200 rounded-xl bg-slate-50/70">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-gray-800">الحسابات البنكية</h4>
                        <button
                            type="button"
                            onClick={addAccount}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[11px] font-bold hover:bg-emerald-700 transition flex items-center gap-1 shadow-xs"
                        >
                            <i className="bi bi-plus"></i> إضافة حساب
                        </button>
                    </div>
                    {accounts.map((account, index) => (
                        <div key={index} className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                <div>
                                    <label htmlFor={`rib-${index}`} className="block text-[11px] font-bold text-gray-700 text-right mb-0.5">
                                        {['الخزينة العمومية', 'حضيرة العتاد', 'حضير العتاد'].includes(beneficiaire.trim()) ? 'رقم الحساب الخاص (COMPTE SPECIAL)' : 'رقم الحساب (RIB)'}
                                    </label>
                                    <div className="relative">
                                        <input 
                                            id={`rib-${index}`} 
                                            type="text" 
                                            inputMode="numeric" 
                                            value={account.rib} 
                                            onChange={e => handleAccountChange(index, 'rib', e.target.value)} 
                                            required 
                                            maxLength={['الخزينة العمومية', 'حضيرة العتاد', 'حضير العتاد'].includes(beneficiaire.trim()) ? 20 : 23} 
                                            placeholder={['الخزينة العمومية', 'حضيرة العتاد', 'حضير العتاد'].includes(beneficiaire.trim()) ? "000000..." : "000 00000 0000000000 00"} 
                                            className={`w-full h-8 px-2.5 text-xs font-mono bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition tracking-wider ${['الخزينة العمومية', 'حضير العتاد', 'حضيرة العتاد'].includes(beneficiaire.trim()) ? 'text-right' : 'text-left'}`}
                                            dir={['الخزينة العمومية', 'حضيرة العتاد', 'حضير العتاد'].includes(beneficiaire.trim()) ? 'rtl' : 'ltr'}
                                        />
                                        <p className="text-[9px] text-blue-600 mt-0.5 text-right font-semibold">
                                            {account.rib.replace(/\s/g, '').length} / {['الخزينة العمومية', 'حضيرة العتاد', 'حضير العتاد'].includes(beneficiaire.trim()) ? 'أقصى 20' : '20'} رقم
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor={`banque-${index}`} className="block text-[11px] font-bold text-gray-700 text-right mb-0.5">البنك / الوكالة</label>
                                    <input 
                                        id={`banque-${index}`} 
                                        type="text" 
                                        value={account.banque} 
                                        onChange={e => handleAccountChange(index, 'banque', e.target.value.toUpperCase())} 
                                        required 
                                        placeholder="مثلا: BNA RELIZANE . أو بنك الوطني الجزائري غليزان"
                                        className="w-full h-8 px-2.5 text-xs bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition uppercase"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeAccount(index)}
                                disabled={accounts.length <= 1}
                                className="mt-4 p-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs hover:bg-rose-100 disabled:opacity-40 disabled:hover:bg-rose-50"
                            >
                                <i className="bi bi-trash"></i>
                            </button>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                    <div>
                        <label htmlFor="rc" className="block text-[11px] font-bold text-gray-700 text-right mb-0.5">رقم السجل التجاري</label>
                        <input
                            id="rc"
                            type="text"
                            value={rc}
                            onChange={e => { setRc(e.target.value.toUpperCase()); markDirty(); }}
                            className="w-full h-8 px-2.5 text-xs text-gray-800 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-left font-mono uppercase"
                            dir="ltr"
                        />
                    </div>
                    <div>
                        <label htmlFor="codeFiscale" className="block text-[11px] font-bold text-gray-700 text-right mb-0.5">التعريف الجبائي (NIF)</label>
                        <input
                            id="codeFiscale"
                            type="text"
                            value={codeFiscale}
                            onChange={e => { setCodeFiscale(e.target.value.toUpperCase()); markDirty(); }}
                            required
                            className="w-full h-8 px-2.5 text-xs text-gray-800 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-left font-mono uppercase"
                            dir="ltr"
                        />
                    </div>
                </div>
            </div>
        </form>
    );
};

export default AddBeneficiaryForm;
