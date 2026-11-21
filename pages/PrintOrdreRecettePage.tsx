import React, { useMemo, useState } from 'react';
import { Page } from '../types';
import { useData } from '../context/DataContext';
import { formatCurrency, parseCurrency } from '../utils/currencyUtils';

interface PrintOrdreRecettePageProps {
    navigate: (page: Page, id?: number, tab?: string) => void;
    paiementId: number;
    variant?: 'ORDRE' | 'AVIS';
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

const PrintOrdreRecettePage: React.FC<PrintOrdreRecettePageProps> = ({ navigate, paiementId, variant = 'ORDRE' }) => {
    const { db, loading } = useData();

    const isAvis = variant === 'AVIS';
    const documentAnnex = isAvis ? 'الملحق رقم: 02' : 'الملحق رقم: 01';
    const documentTitle = isAvis ? 'إشعار إصدار أمر بالإيراد' : 'أمــــر بـالإيـــــراد';

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

        const account = piece?.ID_COMPTE 
            ? db.T_COMPTE_BANCAIRE.find(acc => acc.ID_COMPTE === piece.ID_COMPTE) 
            : (beneficiary ? db.T_COMPTE_BANCAIRE.find(acc => acc.ID_BENEFICIAIRE === beneficiary.ID_BENEFICIAIRE) : null);

        const opCodeParts = operation.N_OPERATION.split('.');
        const actionCode = opCodeParts.length > 5 ? opCodeParts[5] : '';
        const direction = db.T_DIRECTION.find(d => d.ACTION === actionCode) || db.T_DIRECTION[0];

        const scategorie = piece ? db.T_SCATEGORIE.find(sc => sc.ID_SCATEGORIE === piece.ID_SCATEGORIE) : null;
        const categorie = scategorie ? db.T_CATEGORIE.find(c => c.ID_CATEGORIE === scategorie.ID_CATEGORIE) : null;

        const defaultMontantBrut = (piece?.MONTANT_PIECE != null && piece.MONTANT_PIECE > 0)
            ? piece.MONTANT_PIECE 
            : (paiement.MONTANT_TRAVAUX_REALISES || paiement.MONTANT_PAI || 0);
        const defaultMontantARecouvrer = (paiement.PENALITE_RETARD && paiement.PENALITE_RETARD > 0) 
            ? paiement.PENALITE_RETARD 
            : ((paiement.AUTRE_DEDUCTION && paiement.AUTRE_DEDUCTION > 0) ? paiement.AUTRE_DEDUCTION : (paiement.RETENUE_GARANTIE || paiement.MONTANT_PAI));

        return {
            paiement,
            operation,
            piece,
            beneficiary,
            account,
            direction,
            scategorie,
            categorie,
            opCodeParts,
            defaultMontantBrut,
            defaultMontantARecouvrer,
        };
    }, [db, loading, paiementId]);

    // Customizable states
    const [numOrdre, setNumOrdre] = useState('');
    const [compteImputation, setCompteImputation] = useState('');
    const [numCompteTresor, setNumCompteTresor] = useState('201.007');
    const [ligneBudget, setLigneBudget] = useState('');
    const [intituleLigne, setIntituleLigne] = useState('');
    const [motifRecouvrement, setMotifRecouvrement] = useState('لتحصيل مبلغ عقوبة التأخير');
    const [montantBrutInput, setMontantBrutInput] = useState<string>('');
    const [montantARecouvrerInput, setMontantARecouvrerInput] = useState<string>('');
    const [dateEtablissement, setDateEtablissement] = useState('');
    const [wilayaNom, setWilayaNom] = useState('');

    // Sync initial state once data is loaded
    React.useEffect(() => {
        if (baseData) {
            setNumOrdre(prev => prev || baseData.paiement.N_PAI || '01');
            setMontantBrutInput(prev => prev || formatCurrency(baseData.defaultMontantBrut));
            setMontantARecouvrerInput(prev => prev || formatCurrency(baseData.defaultMontantARecouvrer));
            setDateEtablissement(prev => prev || baseData.paiement.DATE_PAI || new Date().toISOString().split('T')[0]);
            
            const wilaya = baseData.direction?.DIRECTION?.includes('غليزان') ? 'غلـــــيزان' : (baseData.direction?.DIRECTION || 'غلـــــيزان');
            setWilayaNom(prev => prev || wilaya);
        }
    }, [baseData]);

    if (loading) return <div className="p-8 text-center font-bold">جارٍ تحميل البيانات...</div>;
    if (!baseData) return <div className="p-8 text-center text-red-500 font-bold">لم يتم العثور على بيانات الدفع.</div>;

    const { paiement, operation, beneficiary, account, direction, scategorie, categorie, opCodeParts } = baseData;

    const parsedMontantBrut = parseCurrency(montantBrutInput);
    const parsedMontantARecouvrer = parseCurrency(montantARecouvrerInput);
    const spelledOutAmount = numberToArabicWords(parsedMontantARecouvrer);

    const codePortefeuille = direction?.PORTEFEUILLE || '024';
    const codeProgramme = opCodeParts[3] || '090';
    const codeSProgramme = opCodeParts[4] || '02';
    const codeActivite = opCodeParts[5] || direction?.ACTION || '2048';
    const codeSActivite = opCodeParts[6] || direction?.SACTION || '000';

    const codeCategorie = categorie ? `${categorie.C_CATEGORIE} ${categorie.INT_CATEGORIE}` : '31000 تثبيتات عينية';
    const codeSCategorie = scategorie ? `${scategorie.C_SCATEGORIE} ${scategorie.INT_SCATEGORIE}` : '31412 المنشآت القاعدية للطرقات';

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
                            معاينة {documentTitle} ({documentAnnex})
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
                        <label className="block text-gray-600 font-semibold mb-1">رقم الأمر:</label>
                        <input 
                            type="text" 
                            value={numOrdre} 
                            onChange={e => setNumOrdre(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-1">حساب القيد:</label>
                        <input 
                            type="text" 
                            value={compteImputation} 
                            onChange={e => setCompteImputation(e.target.value)}
                            placeholder="مثال: ..."
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-1">رقم حساب الخزينة:</label>
                        <input 
                            type="text" 
                            value={numCompteTresor} 
                            onChange={e => setNumCompteTresor(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
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
                        <label className="block text-gray-600 font-semibold mb-1">مبلغ الحوالة الخام:</label>
                        <input 
                            type="text" 
                            value={montantBrutInput} 
                            onChange={e => setMontantBrutInput(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500 text-left font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-1">المبلغ المراد تحصيله:</label>
                        <input 
                            type="text" 
                            value={montantARecouvrerInput} 
                            onChange={e => setMontantARecouvrerInput(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500 text-left font-mono font-bold text-emerald-700"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-1">السطر:</label>
                        <input 
                            type="text" 
                            value={ligneBudget} 
                            onChange={e => setLigneBudget(e.target.value)}
                            placeholder="مثال: ..."
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-1">المعنون:</label>
                        <input 
                            type="text" 
                            value={intituleLigne} 
                            onChange={e => setIntituleLigne(e.target.value)}
                            placeholder="مثال: ..."
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div className="col-span-2 sm:col-span-4">
                        <label className="block text-gray-600 font-semibold mb-1">سبب التحصيل:</label>
                        <input 
                            type="text" 
                            value={motifRecouvrement} 
                            onChange={e => setMotifRecouvrement(e.target.value)}
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
                    {documentAnnex}
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
                    <h1 className="text-[18pt] font-extrabold tracking-wide text-black underline decoration-1 underline-offset-4">
                        {documentTitle}
                    </h1>
                </div>

                {/* Financial Nomenclature Box */}
                <div className="border-2 border-black p-3 mb-4 text-[11pt] leading-relaxed">
                    <div className="space-y-1">
                        {/* Row 1: Année financière on right, Compte d'imputation on left */}
                        <div className="flex justify-between items-center font-bold">
                            <span>السنة المالية : {paiement.ANNEE || '2026'}</span>
                            <span>حساب القيد : {compteImputation}</span>
                        </div>

                        {/* Programme breakdown */}
                        <p className="font-bold">محفظة البرنامج : {codePortefeuille}</p>
                        <p className="font-bold">البرنامج : {codeProgramme}</p>
                        <p className="font-bold">البرنامج الفرعي : {codeSProgramme}</p>
                        <p className="font-bold">النشاط : {codeActivite}</p>
                        <p className="font-bold">النشاط الفرعي : {codeSActivite}</p>
                        <p className="font-bold">العنوان : 3 نفقات الإستثمار</p>

                        {/* Row: Categorie on right, Scategorie facing it directly on left */}
                        <div className="flex justify-between items-center font-bold pt-0.5">
                            <span>الصنف : {codeCategorie}</span>
                            <span>الصنف الفرعي : {codeSCategorie}</span>
                        </div>

                        {/* Row: Numéro d'ordre */}
                        <p className="font-bold pt-0.5">رقم الأمر : {numOrdre}</p>
                    </div>
                </div>

                {/* Directive Paragraph */}
                <div className="text-[11pt] leading-relaxed mb-3 space-y-1 font-medium">
                    <p>
                        يطلب من السيد <span className="font-bold">{beneficiary?.BENEFICIAIRE || '................................'}</span> ان يدفع لصندوق امين الخزينة ولاية <span className="font-bold">{wilayaNom}</span>
                    </p>
                    <p>
                        وهو مؤهل وفقا لأحكام المرسوم التنفيذي رقم 46.93 المؤرخ في 1993.02.06 لتحصيل إيرادات في حساب رقم <span className="font-bold font-mono">{numCompteTresor}</span>
                    </p>
                    <p className="text-[10pt] text-gray-800">
                        ................................................... السطر ( {ligneBudget} ) ، المعنون {intituleLigne || '...................................................'}
                    </p>
                    <p className="pt-1">
                        المبلغ المشار اليه للأسباب المذكورة ادناه :
                    </p>
                </div>

                {/* Main 3-Column Table: Debtor on RIGHT, Reasons in CENTER, Liquidation on LEFT */}
                <table className="w-full border-2 border-black border-collapse text-[10.5pt] mb-4">
                    <thead>
                        <tr className="border-b-2 border-black bg-gray-50/50">
                            {/* Column 1 (Far Right in RTL): Debtor */}
                            <th className="border-l-2 border-black p-2 font-bold text-center w-[48%]">
                                الـمـــديــن
                            </th>
                            {/* Column 2 (Center): Reasons */}
                            <th className="border-l-2 border-black p-2 font-bold text-center w-[30%]">
                                الأسباب
                            </th>
                            {/* Column 3 (Far Left in RTL): Liquidation */}
                            <th className="p-2 font-bold text-center w-[22%]">
                                أسـاس الـتـصفـيـة
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b-2 border-black align-top min-h-[140px]">
                            {/* Column 1 (Right): Debtor info */}
                            <td className="border-l-2 border-black p-2.5 text-right space-y-1.5 leading-snug align-top">
                                <p><span className="font-bold">الإسم و اللقب: </span>{beneficiary?.BENEFICIAIRE || ''}</p>
                                <p><span className="font-bold">النشاط/ الإسم التجاري للمدين: </span>{beneficiary?.ACTIVITE || beneficiary?.BENEFICIAIRE || ''}</p>
                                <p><span className="font-bold">عنوان المدين: </span>{beneficiary?.ADRESSE || ''}</p>
                                <p><span className="font-bold">الحساب الجاري: </span><span className="font-mono text-[9.5pt]">{account ? `${account.BANQUE || ''} ${account.RIB || ''}` : ''}</span></p>
                                <p><span className="font-bold">السجل التجاري: </span><span className="font-mono text-[9.5pt]">{beneficiary?.RC || ''}</span></p>
                                <p><span className="font-bold">رقم التعريف الجبائي: </span><span className="font-mono text-[9.5pt]">{beneficiary?.CODE_FISCALE || ''}</span></p>
                            </td>

                            {/* Column 2 (Center): Motifs */}
                            <td className="border-l-2 border-black p-2.5 text-center align-middle font-bold leading-normal">
                                {motifRecouvrement}
                            </td>

                            {/* Column 3 (Left): Assiette de liquidation */}
                            <td className="p-2.5 text-center leading-normal align-top">
                                <p className="font-bold mb-1">مبلغ الحوالة</p>
                                <p className="font-bold mb-2">الخام =</p>
                                <p className="font-bold font-mono text-[11pt] tracking-tight">{formatCurrency(parsedMontantBrut)}</p>
                            </td>
                        </tr>

                        {/* Summary Bottom Row: Title spanning right & center, amount on left under اساس التصفية */}
                        <tr className="border-t-2 border-black font-bold">
                            <td colSpan={2} className="border-l-2 border-black p-2 text-right pr-4 text-[11.5pt]">
                                المبلغ المراد تحصيله
                            </td>
                            <td className="p-2 text-center font-mono text-[11.5pt] tracking-tight bg-gray-50/30">
                                {formatCurrency(parsedMontantARecouvrer)}
                            </td>
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

                {/* Footnote on the RIGHT */}
                <div className="text-[8.5pt] text-gray-700 mt-12 text-right" dir="rtl">
                    <p>1، 2 في حالة عملية استرداد الإعتمادات</p>
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

export default PrintOrdreRecettePage;
