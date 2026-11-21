import React, { useMemo, useState } from 'react';
import { Page } from '../types';
import { useData } from '../context/DataContext';
import { formatCurrency, parseCurrency } from '../utils/currencyUtils';

interface PrintBordereauRecettesPageProps {
    navigate: (page: Page, id?: number, tab?: string) => void;
    paiementId: number;
}

const numberToArabicWords = (number: number | null | undefined): string => {
    if (number === null || number === undefined || isNaN(number)) return 'صفر دينار';

    const num = parseFloat(Number(number).toFixed(2));
    if (isNaN(num)) return 'مبلغ غير صالح';

    const integerPart = Math.floor(Math.abs(num));
    const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

    const units = ['', 'واحد', 'إثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const teens = ['عشرة', 'أحد عشر', 'إثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

    const convertThreeDigits = (n: number): string => {
        if (n === 0) return '';
        let result = '';
        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (h > 0) {
            result += hundreds[h];
            if (t > 0 || u > 0) result += ' و ';
        }

        if (t === 1 && u > 0) {
            result += teens[u];
        } else {
            if (u > 0) {
                result += units[u];
            }
            if (t > 0) {
                if (u > 0) result += ' و ';
                result += tens[t];
            }
        }
        return result;
    };

    const convert = (n: number): string => {
        if (n === 0) return 'صفر';

        let result = '';
        const billion = Math.floor(n / 1000000000);
        const million = Math.floor((n % 1000000000) / 1000000);
        const thousand = Math.floor((n % 1000000) / 1000);
        const rest = n % 1000;

        if (billion > 0) {
            if (billion === 1) result += 'مليار';
            else if (billion === 2) result += 'ملياران';
            else if (billion >= 3 && billion <= 10) result += convertThreeDigits(billion) + ' مليارات';
            else result += convertThreeDigits(billion) + ' مليار';
            if (million > 0 || thousand > 0 || rest > 0) result += ' و ';
        }

        if (million > 0) {
            if (million === 1) result += 'مليون';
            else if (million === 2) result += 'مليونان';
            else if (million >= 3 && million <= 10) result += convertThreeDigits(million) + ' ملايين';
            else result += convertThreeDigits(million) + ' مليون';
            if (thousand > 0 || rest > 0) result += ' و ';
        }

        if (thousand > 0) {
            if (thousand === 1) result += 'ألف';
            else if (thousand === 2) result += 'ألفان';
            else if (thousand >= 3 && thousand <= 10) result += convertThreeDigits(thousand) + ' آلاف';
            else result += convertThreeDigits(thousand) + ' ألف';
            if (rest > 0) result += ' و ';
        }

        if (rest > 0) {
            result += convertThreeDigits(rest);
        }

        return result.trim();
    };

    let integerText = convert(integerPart);
    if (integerPart === 1) integerText = 'دينار واحد';
    else if (integerPart === 2) integerText = 'ديناران';
    else integerText = `${integerText} دينار`;

    if (decimalPart > 0) {
        return `${integerText} و ${decimalPart} سنتيم`;
    }

    return integerText;
};

const PrintBordereauRecettesPage: React.FC<PrintBordereauRecettesPageProps> = ({ navigate, paiementId }) => {
    const { db, loading } = useData();

    const baseData = useMemo(() => {
        if (loading || !paiementId) return null;

        const paiement = db.T_PAIEMENT.find(p => p.ID_PAIEMENT === paiementId);
        if (!paiement) return null;

        const operation = db.T_OPERATION.find(op => op.ID_OPERATION === paiement.ID_OPERATION);
        if (!operation) return null;

        const piece = db.T_PIECE.find(p => p.ID_PIECE === paiement.ID_PIECE);
        const beneficiary = piece?.ID_BENEFICIAIRE 
            ? db.T_BENEFICIAIRE.find(b => b.ID_BENEFICIAIRE === piece.ID_BENEFICIAIRE) 
            : null;

        const opCodeParts = operation.N_OPERATION.split('.');
        const actionCode = opCodeParts.length > 5 ? opCodeParts[5] : '';
        const direction = db.T_DIRECTION.find(d => d.ACTION === actionCode) || db.T_DIRECTION[0];

        const defaultMontant = (paiement.PENALITE_RETARD && paiement.PENALITE_RETARD > 0) 
            ? paiement.PENALITE_RETARD 
            : ((paiement.AUTRE_DEDUCTION && paiement.AUTRE_DEDUCTION > 0) ? paiement.AUTRE_DEDUCTION : (paiement.RETENUE_GARANTIE || paiement.MONTANT_PAI));

        return {
            paiement,
            operation,
            piece,
            beneficiary,
            direction,
            opCodeParts,
            defaultMontant,
        };
    }, [db, loading, paiementId]);

    // Customizable states
    const [numBordereau, setNumBordereau] = useState('');
    const [numCompte, setNumCompte] = useState('201.007');
    const [numOrdre, setNumOrdre] = useState('');
    const [dateOrdre, setDateOrdre] = useState('');
    const [montantInput, setMontantInput] = useState<string>('');
    const [montantPrecedentInput, setMontantPrecedentInput] = useState<string>('');
    const [remarques, setRemarques] = useState('');
    const [dateEtablissement, setDateEtablissement] = useState('');
    const [wilayaNom, setWilayaNom] = useState('');

    // Sync initial state once data is loaded
    React.useEffect(() => {
        if (baseData) {
            setNumOrdre(prev => prev || baseData.paiement.N_PAI || '01');
            setDateOrdre(prev => prev || baseData.paiement.DATE_PAI || '');
            setMontantInput(prev => prev || formatCurrency(baseData.defaultMontant));
            setDateEtablissement(prev => prev || baseData.paiement.DATE_PAI || new Date().toISOString().split('T')[0]);
            
            const wilaya = baseData.direction?.DIRECTION?.includes('غليزان') ? 'غلـــــيزان' : (baseData.direction?.DIRECTION || 'غلـــــيزان');
            setWilayaNom(prev => prev || wilaya);
        }
    }, [baseData]);

    if (loading) return <div className="p-8 text-center font-bold">جارٍ تحميل البيانات...</div>;
    if (!baseData) return <div className="p-8 text-center text-red-500 font-bold">لم يتم العثور على بيانات الدفع.</div>;

    const { paiement, operation, beneficiary, direction, opCodeParts } = baseData;

    const parsedMontant = parseCurrency(montantInput);
    const parsedMontantPrecedent = parseCurrency(montantPrecedentInput);
    const montantTotal = parsedMontant + parsedMontantPrecedent;
    const spelledOutAmount = numberToArabicWords(montantTotal);

    const codePortefeuille = direction?.PORTEFEUILLE || '024';
    const codeProgramme = opCodeParts[3] || '090';
    const codeSProgramme = opCodeParts[4] || '02';
    const codeActivite = opCodeParts[5] || direction?.ACTION || '2048';
    const codeSActivite = opCodeParts[6] || direction?.SACTION || '000';

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-gray-100 min-h-full py-4 print:py-0 print:bg-white" dir="rtl">
            {/* Control Bar - Hidden when printing */}
            <div className="max-w-[210mm] mx-auto mb-4 bg-white p-4 rounded-xl shadow-md border border-gray-200 print:hidden space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                        <i className="bi bi-printer text-xl text-emerald-600"></i>
                        <h2 className="text-base font-bold text-gray-800">
                            معاينة جدول إرسال أوامر الإيرادات (الملحق رقم: 05)
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => navigate('OPERATION_DETAILS', operation.ID_OPERATION, `PAIEMENTS:${paiement.ID_PAIEMENT}:blue`)} 
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <i className="bi bi-arrow-right"></i>
                            <span>رجوع</span>
                        </button>
                        <button 
                            onClick={handlePrint} 
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                        >
                            <i className="bi bi-printer"></i>
                            <span>طباعة المستند</span>
                        </button>
                    </div>
                </div>

                {/* Editable Options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                        <label className="block text-gray-600 font-semibold mb-1">رقم جدول الإرسال:</label>
                        <input 
                            type="text" 
                            value={numBordereau} 
                            onChange={e => setNumBordereau(e.target.value)}
                            placeholder="مثال: 01"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-1">رقم الحساب:</label>
                        <input 
                            type="text" 
                            value={numCompte} 
                            onChange={e => setNumCompte(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-1">رقم الأمر:</label>
                        <input 
                            type="text" 
                            value={numOrdre} 
                            onChange={e => setNumOrdre(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-1">تاريخ الأمر:</label>
                        <input 
                            type="text" 
                            value={dateOrdre} 
                            onChange={e => setDateOrdre(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-1">المبلغ المراد تحصيله:</label>
                        <input 
                            type="text" 
                            value={montantInput} 
                            onChange={e => setMontantInput(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500 text-left font-mono font-bold text-emerald-700"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-1">مجموع المبلغ السابق:</label>
                        <input 
                            type="text" 
                            value={montantPrecedentInput} 
                            onChange={e => setMontantPrecedentInput(e.target.value)}
                            placeholder="0,00"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500 text-left font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-1">تاريخ التحرير:</label>
                        <input 
                            type="text" 
                            value={dateEtablissement} 
                            onChange={e => setDateEtablissement(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-1">ملاحظات:</label>
                        <input 
                            type="text" 
                            value={remarques} 
                            onChange={e => setRemarques(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                </div>
            </div>

            {/* Document Print Area */}
            <div 
                id="print-content" 
                className="bg-white mx-auto w-[210mm] min-h-[297mm] p-[15mm] text-black shadow-lg print:shadow-none print:w-full print:p-0 print:m-0 font-serif"
                style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
            >
                {/* Top Annex Number */}
                <div className="text-right font-bold text-[12pt] mb-1">
                    الملحق رقم: 05
                </div>

                {/* Republic Header */}
                <div className="text-center font-bold mb-3">
                    <p className="text-[13pt] leading-tight mb-0.5">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                    <p className="text-[10pt] tracking-wider underline uppercase">REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE</p>
                </div>

                {/* Ordonnateur Box - Docked on the RIGHT in RTL */}
                <div className="flex justify-start mb-4">
                    <div className="border border-black p-2 w-[55%] text-center text-[10pt] leading-snug">
                        <p className="font-bold">الآمر بالصرف {direction?.DIRECTION || 'مديرية الأشغال العمومية ولاية غليزان'}</p>
                        <p className="font-bold mt-1">رمز الآمر بالصرف {direction?.ORDONATEUR || '1.024.2.00.048.001'}</p>
                    </div>
                </div>

                {/* Document Main Title */}
                <div className="text-center my-4">
                    <h1 className="text-[18pt] font-extrabold tracking-wide text-black">
                        جدول إرسال أوامر الإيرادات
                    </h1>
                </div>

                {/* Info Header Area */}
                <div className="flex justify-between items-center mb-5">
                    {/* Left: Bordereau & Account numbers */}
                    <div className="w-[45%] text-right font-bold text-[11pt] space-y-2">
                        <p>رقم جدول الإرسال : {numBordereau}</p>
                        <p>رقم الحساب : {numCompte}</p>
                    </div>

                    {/* Right: Budget Classification Box */}
                    <div className="w-[52%] border-2 border-black p-3 text-[11pt] leading-snug text-right font-bold space-y-1">
                        <p>السنة المالية : {paiement.ANNEE || '2026'}</p>
                        <p>محفظة البرنامج : {codePortefeuille}</p>
                        <p>البرنامج : {codeProgramme}</p>
                        <p>البرنامج الفرعي : {codeSProgramme}</p>
                        <p>النشاط : {codeActivite}</p>
                        <p>النشاط الفرعي : {codeSActivite}</p>
                    </div>
                </div>

                {/* Main Table: Ordre num & date on RIGHT, Debtor name, Amount, Observations on LEFT */}
                <table className="w-full border-2 border-black border-collapse text-[11pt] mb-4">
                    <thead>
                        <tr className="border-b-2 border-black bg-gray-50/50">
                            {/* Column 1 (Far Right in RTL): Num & Date */}
                            <th colSpan={2} className="border-l-2 border-black p-2 font-bold text-center w-[30%]">
                                رقم و تاريخ الأمر بالإيراد
                            </th>
                            {/* Column 2: Debtor name */}
                            <th rowSpan={2} className="border-l-2 border-black p-2 font-bold text-center w-[25%]">
                                اسم المدينين
                            </th>
                            {/* Column 3: Amount to recover */}
                            <th rowSpan={2} className="border-l-2 border-black p-2 font-bold text-center w-[23%]">
                                المبلغ المراد تحصيله
                            </th>
                            {/* Column 4 (Far Left in RTL): Observations */}
                            <th rowSpan={2} className="p-2 font-bold text-center w-[22%]">
                                ملاحظات
                            </th>
                        </tr>
                        <tr className="border-b-2 border-black bg-gray-50/50">
                            <th className="border-l-2 border-black p-1.5 font-bold text-center w-[12%]">
                                الرقم
                            </th>
                            <th className="border-l-2 border-black p-1.5 font-bold text-center w-[18%]">
                                التاريخ
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b-2 border-black align-top h-[180px]">
                            {/* Num */}
                            <td className="border-l-2 border-black p-2.5 text-center align-middle font-bold font-mono">
                                {numOrdre}
                            </td>

                            {/* Date */}
                            <td className="border-l-2 border-black p-2.5 text-center align-middle font-mono">
                                {dateOrdre}
                            </td>

                            {/* Debtor Name */}
                            <td className="border-l-2 border-black p-2.5 text-center align-middle font-bold leading-relaxed">
                                {beneficiary?.BENEFICIAIRE || ''}
                            </td>

                            {/* Montant */}
                            <td className="border-l-2 border-black p-2.5 text-center align-middle font-bold font-mono text-[11.5pt] tracking-tight">
                                {formatCurrency(parsedMontant)}
                            </td>

                            {/* Observations */}
                            <td className="p-2.5 text-center align-middle">
                                {remarques}
                            </td>
                        </tr>

                        {/* Summary Row 1: Total des ordres de recettes */}
                        <tr className="border-t-2 border-b border-black font-bold">
                            <td colSpan={3} className="border-l-2 border-black p-2 text-center text-[11pt]">
                                اجمالي أوامر الإيرادات
                            </td>
                            <td className="border-l-2 border-black p-2 text-center font-mono text-[11.5pt] tracking-tight">
                                {formatCurrency(parsedMontant)}
                            </td>
                            <td className="p-2"></td>
                        </tr>

                        {/* Summary Row 2: Montant précédent */}
                        <tr className="border-b border-black font-bold">
                            <td colSpan={3} className="border-l-2 border-black p-2 text-center text-[11pt]">
                                مجموع المبلغ السابق
                            </td>
                            <td className="border-l-2 border-black p-2 text-center font-mono text-[11.5pt] tracking-tight">
                                {parsedMontantPrecedent > 0 ? formatCurrency(parsedMontantPrecedent) : ''}
                            </td>
                            <td className="p-2"></td>
                        </tr>

                        {/* Summary Row 3: Total général */}
                        <tr className="border-b-2 border-black font-bold">
                            <td colSpan={3} className="border-l-2 border-black p-2 text-center text-[11pt]">
                                المبلغ الإجمالي
                            </td>
                            <td className="border-l-2 border-black p-2 text-center font-mono text-[11.5pt] tracking-tight bg-gray-50/30">
                                {formatCurrency(montantTotal)}
                            </td>
                            <td className="p-2"></td>
                        </tr>
                    </tbody>
                </table>

                {/* Amount in Words */}
                <div className="font-bold text-[11pt] leading-relaxed mb-6">
                    <p>يوقف الأمر بالإيراد على المبلغ : {spelledOutAmount}</p>
                </div>

                {/* Date & Signature Block */}
                <div className="flex justify-end pl-8 mb-8 text-[11pt]">
                    <div className="text-center space-y-4">
                        <p>حرر في: {wilayaNom} بتاريخ: {dateEtablissement}</p>
                        <p className="font-bold text-[12pt] pt-2">الآمــــر بالصرف</p>
                    </div>
                </div>
            </div>

            {/* Print Specific CSS */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm 12mm 10mm 12mm;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    #print-content {
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default PrintBordereauRecettesPage;
