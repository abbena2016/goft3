import React, { useRef, useState } from 'react';
import { Page, User, APP_VERSION, logoDataUrl } from '../types';
import { useData } from '../context/DataContext';
import { ScreensGuide } from '../components/documentation/ScreensGuide';
import { DatabaseSchemaGuide } from '../components/documentation/DatabaseSchemaGuide';

interface SystemDocumentationPageProps {
    navigate: (page: Page) => void;
    onGoBack?: () => void;
    currentUser: User;
}

type ViewMode = 'screens' | 'report' | 'schema' | 'all';

const SystemDocumentationPage: React.FC<SystemDocumentationPageProps> = ({ navigate, onGoBack, currentUser: _currentUser }) => {
    const { db } = useData();
    const printAreaRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('screens');

    const handlePrint = () => {
        window.print();
    };

    // Calculate real live stats for the report
    const stats = {
        operationsCount: db.T_OPERATION.length,
        documentsCount: db.T_PIECE.length,
        engagementsCount: db.T_ENGAGEMENT.length,
        paiementsCount: db.T_PAIEMENT.length,
        beneficiariesCount: db.T_BENEFICIAIRE.length,
        lotsCount: db.T_LOT_OPERATION.length,
        totalAE: db.T_RUBRIQUE_OP.reduce((sum, r) => sum + (r.MONTANT_FINALE ?? r.MONTANT_INITIALE ?? 0), 0),
        totalEngaged: db.T_ENGAGEMENT.reduce((sum, e) => {
            if (['التزام', 'ملحق', 'فاتورة', 'فسخ', 'حكم قضائي'].includes(e.NATURE_ENG)) return sum + (e.MONTANT_ENG || 0);
            if (e.NATURE_ENG === 'سحب') return sum - Math.abs(e.MONTANT_ENG || 0);
            return sum;
        }, 0),
        totalPaid: db.T_PAIEMENT.reduce((sum, p) => sum + (p.MONTANT_PAI || 0), 0),
    };

    return (
        <div className="min-h-full bg-slate-100 py-6 px-4 sm:px-6 lg:px-8 text-right font-sans" dir="rtl">
            {/* Top Navigation & View Controller Bar - Hidden on Print */}
            <div className="max-w-6xl mx-auto mb-6 bg-white rounded-2xl shadow-md border border-slate-200 p-4 space-y-4 no-print sticky top-3 z-30">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img src={logoDataUrl} alt="Logo" className="w-11 h-11 rounded-xl shadow-sm border border-blue-100" />
                        <div>
                            <h1 className="text-base font-black text-slate-800">الدليل الشامل والتوثيق الرسمي لنظام GOFT3</h1>
                            <p className="text-xs text-slate-500 font-medium">الإصدار {APP_VERSION} - دليل استخدام مصور وشامل لجميع الصفحات والنوافذ</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                            title="طباعة الدليل أو حفظه كملف PDF عالي الجودة"
                        >
                            <i className="bi bi-file-earmark-pdf-fill text-base text-rose-300"></i>
                            <span>تصدير كملف PDF / طباعة</span>
                        </button>
                        {onGoBack ? (
                            <button
                                onClick={onGoBack}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 transition-colors"
                            >
                                رجوع
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('HOME')}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 transition-colors"
                            >
                                الرئيسية
                            </button>
                        )}
                    </div>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setViewMode('screens')}
                            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                viewMode === 'screens'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            <i className="bi bi-window-stack"></i>
                            <span>الدليل المصور للنوافذ والصفحات</span>
                            <span className="bg-blue-200/30 text-[10px] px-1.5 py-0.2 rounded-full">+20 واجهة</span>
                        </button>

                        <button
                            onClick={() => setViewMode('report')}
                            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                viewMode === 'report'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            <i className="bi bi-journal-text"></i>
                            <span>التقرير الإداري والتقني الشامل</span>
                        </button>

                        <button
                            onClick={() => setViewMode('schema')}
                            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                viewMode === 'schema'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            <i className="bi bi-database-fill-gear"></i>
                            <span>كود قاعدة البيانات المشروح (SQL)</span>
                            <span className="bg-indigo-200/30 text-[10px] px-1.5 py-0.2 rounded-full">16 جدولاً</span>
                        </button>

                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                viewMode === 'all'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                            title="عرض الدليل المصور والتقرير وكود قاعدة البيانات معاً لتصدير ملف PDF كامل ومتكامل"
                        >
                            <i className="bi bi-collection"></i>
                            <span>عرض الكل (طباعة كاملة)</span>
                        </button>
                    </div>

                    {/* Quick Jump Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">انتقال سريع:</span>
                        <select
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                    const el = document.getElementById(val);
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700 cursor-pointer"
                        >
                            <option value="">-- اختر صفحة أو نافذة للانتقال إليها --</option>
                            <optgroup label="الدليل المصور الشامل (34 واجهة حقيقية)">
                                <option value="screen-login-section">الباب 1: تسجيل الدخول والشاشة الرئيسية</option>
                                <option value="screen-operations-section">الباب 2: تسيير العمليات وهيكلة الكلفة</option>
                                <option value="screen-lots-section">الباب 3: إدارة حصص العملية (Lots)</option>
                                <option value="screen-engagements-section">الباب 4: الالتزامات وتأشيرة المراقب المالي</option>
                                <option value="screen-payments-section">الباب 5: مسار الدفع، الحوالات، وجداول الإرسال</option>
                                <option value="screen-documents-section">الباب 6: الوثائق والصفقات والمستفيدين</option>
                                <option value="screen-status-section">الباب 7: الوضعيات المالية الرقابية والإعدادات</option>
                                <option value="screen-prints-section">الباب 8: النماذج والمطبوعات الرسمية A4 (PDF)</option>
                            </optgroup>
                            <optgroup label="كود وتصميم قاعدة البيانات (SQL Schema)">
                                <option value="db-overview-section">المعمارية والمخطط العلائقي (ERD)</option>
                                <option value="db-tables-section">الشرح التفصيلي لجداول وحقول قاعدة البيانات</option>
                                <option value="db-security-section">الفهارس وسياسات الحماية والأمان RLS</option>
                                <option value="db-sql-section">كود SQL الكامل المرجعي (DDL)</option>
                            </optgroup>
                            <optgroup label="فصول التقرير الإداري">
                                <option value="section-1">فصل 1: التعريف بالنظام والأهداف القانونية</option>
                                <option value="section-2">فصل 2: المعمارية التقنية وأمن البيانات</option>
                                <option value="section-3">فصل 3: الدليل الوظيفي لمميزات النظام</option>
                                <option value="section-4">فصل 4: الرقابة المحاسبية وقواعد العمل</option>
                                <option value="section-5">فصل 5: شرح الواجهات وتجربة المستخدم</option>
                                <option value="section-6">فصل 6: نماذج المطبوعات الرسمية</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
            </div>

            {/* Document Printable Area */}
            <div ref={printAreaRef} className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-w-full">
                
                {/* 1. الغلاف الرسمي الفخم (Official Cover Page) */}
                <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-10 sm:p-14 relative overflow-hidden border-b-8 border-amber-500">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="text-center space-y-2 relative z-10">
                        <p className="text-amber-400 font-bold tracking-widest text-xs uppercase">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                        <p className="text-slate-300 font-medium text-xs">وزارة الأشغال العمومية و المنشآت القاعدية - مديرية الأشغال العمومية</p>
                        <div className="w-24 h-0.5 bg-amber-400/60 mx-auto my-2"></div>
                    </div>

                    <div className="my-8 text-center relative z-10 space-y-3">
                        <div className="inline-block p-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl mb-2">
                            <img src={logoDataUrl} alt="GOFT3 Logo" className="w-20 h-20 mx-auto" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
                            نظام GOFT3
                        </h1>
                        <p className="text-lg sm:text-xl text-blue-200 font-bold">
                            الدليل الشامل لشرح استخدام التطبيق والتقرير التقني والمحاسبي
                        </p>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            دليل ميداني متكامل مدعوم بالصور والمخططات الواقعية لجميع الصفحات والنوافذ،
                            وفق مقتضيات القانون 23-07 وقانون الصفقات العمومية.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10 text-xs text-center relative z-10">
                        <div className="bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
                            <span className="block text-slate-400 text-[10px]">إصدار النظام</span>
                            <span className="font-bold text-amber-400 text-sm">{APP_VERSION}</span>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
                            <span className="block text-slate-400 text-[10px]">البيئة التشغيلية</span>
                            <span className="font-bold text-white text-xs">Web & Desktop (Win/Linux)</span>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
                            <span className="block text-slate-400 text-[10px]">تشفير الحسابات</span>
                            <span className="font-bold text-emerald-400 text-xs">Bcrypt (10 Rounds)</span>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
                            <span className="block text-slate-400 text-[10px]">تاريخ الإصدار</span>
                            <span className="font-bold text-white text-xs">{new Date().toLocaleDateString('ar-DZ')}</span>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 sm:p-10 space-y-12 text-slate-800 leading-relaxed text-sm">

                    {/* إحصائيات حية من النظام لهذه النسخة */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
                        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <i className="bi bi-activity text-blue-600"></i>
                            مؤشرات الأداء اللحظية للبيانات المسجلة بقاعدة بيانات التطبيق
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                            <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm">
                                <span className="text-[10px] text-slate-500 block">إجمالي العمليات</span>
                                <span className="text-base font-black text-blue-700">{stats.operationsCount}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm">
                                <span className="text-[10px] text-slate-500 block">الوثائق والصفقات</span>
                                <span className="text-base font-black text-indigo-700">{stats.documentsCount}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm">
                                <span className="text-[10px] text-slate-500 block">بطاقات الالتزام</span>
                                <span className="text-base font-black text-amber-700">{stats.engagementsCount}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm">
                                <span className="text-[10px] text-slate-500 block">حوالات الدفع</span>
                                <span className="text-base font-black text-emerald-700">{stats.paiementsCount}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm">
                                <span className="text-[10px] text-slate-500 block">المتعاملون المسجلون</span>
                                <span className="text-base font-black text-slate-700">{stats.beneficiariesCount}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm">
                                <span className="text-[10px] text-slate-500 block">الحصص المسندة</span>
                                <span className="text-base font-black text-purple-700">{stats.lotsCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* عرض الدليل المصور للنوافذ والصفحات */}
                    {(viewMode === 'screens' || viewMode === 'all') && (
                        <div className="space-y-6">
                            <div className="border-b-2 border-blue-600 pb-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow">
                                        <i className="bi bi-images"></i>
                                    </span>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">
                                            الجزء الأول: الدليل المصور لشرح استخدام التطبيق (الصفحات والنوافذ)
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            معاينة بصرية واقعية وتفصيل دقيق لكل حقل، زر، وإجراء في منظومة GOFT3
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold border border-blue-200 hidden sm:inline">
                                    دليل تشغيلي خطوة بخطوة
                                </span>
                            </div>

                            <ScreensGuide />
                        </div>
                    )}

                    {/* عرض التقرير الإداري والتقني الشامل */}
                    {(viewMode === 'report' || viewMode === 'all') && (
                        <div className="space-y-8 pt-8">
                            <div className="border-b-2 border-indigo-600 pb-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow">
                                        <i className="bi bi-file-earmark-text-fill"></i>
                                    </span>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">
                                            الجزء الثاني: التقرير الإداري والتقني الشامل لنظام GOFT3
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            التوصيف المعماري، المطابقة القانونية، والرقابة المحاسبية وقواعد العمل الصارمة
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold border border-indigo-200 hidden sm:inline">
                                    وثيقة إدارية رسمية
                                </span>
                            </div>

                            {/* الفصل الأول */}
                            <section id="section-1" className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow">1</span>
                                    <h3 className="text-lg font-black text-slate-900">التعريف بالنظام والأهداف الاستراتيجية والقانونية</h3>
                                </div>
                                <p className="text-justify leading-relaxed">
                                    نظام <strong>GOFT3</strong> (اختصاراً لـ: <em>Gestion des Opérations Financières Titre 3</em>) هو منظومة برمجية متقدمة ومتخصصة في الرقابة الميزانياتية والتسيير المالي لنفقات الاستثمار العمومي بالدولة الجزائرية، المعروفة محاسبياً بـ <strong>الباب الثالث (Titre 3)</strong>.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                        <h4 className="font-bold text-blue-900 flex items-center gap-2 text-xs">
                                            <i className="bi bi-shield-check text-blue-600"></i>
                                            المطابقة القانونية والتنظيمية
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-relaxed text-justify">
                                            تم تصميم المنظومة لتتوافق بدقة 100% مع أحكام <strong>القانون رقم 23-07 المتعلق بقواعد المحاسبة العمومية والتسيير المالي</strong> وقانون الصفقات العمومية وتفويضات المرفق العام (المرسوم الرئاسي 15-247)، بما يضمن الشفافية والرقابة الصارمة على رخص الالتزام (AE) واعتمادات الدفع (CP).
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                        <h4 className="font-bold text-indigo-900 flex items-center gap-2 text-xs">
                                            <i className="bi bi-diagram-3 text-indigo-600"></i>
                                            الجهات المستهدفة بالاستخدام
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-relaxed text-justify">
                                            يخدم النظام المديريات التنفيذية للولايات، الوزارات، الإدارات العمومية الآمرة بالصرف (Ordonnateurs)، مصالح البرمجة ومتابعة الاستثمارات، بالإضافة إلى توفير بيئة عمل ميسرة تضمن تجهيز الملفات للمراقب المالي (Contrôleur Budgétaire) وأمين الخزينة العمومية.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* الفصل الثاني */}
                            <section id="section-2" className="space-y-4 pt-4 border-t border-slate-200">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow">2</span>
                                    <h3 className="text-lg font-black text-slate-900">المعمارية التقنية وأمن البيانات والتشفير الحديث</h3>
                                </div>
                                <p className="text-justify leading-relaxed">
                                    تم بناء المنظومة باستخدام أحدث معايير هندسة البرمجيات الحديثة (Full-Stack Desktop & Web SPA)، مع إعطاء الأولوية القصوى لسرعة الأداء، وحماية البيانات، والعمل المستمر في حال انقطاع شبكة الإنترنت.
                                </p>
                                
                                <div className="overflow-x-auto border border-slate-200 rounded-xl my-4">
                                    <table className="w-full text-right text-xs">
                                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="p-3">المكون التقني</th>
                                                <th className="p-3">التقنية المستخدمة</th>
                                                <th className="p-3">الدور والفائدة العملية</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            <tr>
                                                <td className="p-3 font-bold text-blue-900">واجهة المستخدم (Frontend)</td>
                                                <td className="p-3 font-mono">React 18 + TypeScript + Vite 5</td>
                                                <td className="p-3 text-slate-600">أداء فائق، تجاوب فوري، بدون تحميل صفحات تقليدي مع نمط SPA المحدث.</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 font-bold text-blue-900">تطبيق سطح المكتب (Desktop)</td>
                                                <td className="p-3 font-mono">Electron 39 + electron-builder</td>
                                                <td className="p-3 text-slate-600">تطبيق مستقل يعمل على Windows 10/11 وتوزيعات Linux مع حماية Context Isolation.</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 font-bold text-blue-900">التصميم والمظهر (Styling)</td>
                                                <td className="p-3 font-mono">Tailwind CSS 3.4 (RTL Native)</td>
                                                <td className="p-3 text-slate-600">واجهة عربية أصيلة من اليمين لليسار، خطوط مدمجة، وتناسق بصري تام.</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 font-bold text-blue-900">قاعدة البيانات السحابية</td>
                                                <td className="p-3 font-mono">PostgreSQL / Supabase (numeric 18,2)</td>
                                                <td className="p-3 text-slate-600">دقة محاسبية مطلقة بدون أخطاء الفواصل، مزامنة حية، وفهارس مسرعة (Indexes).</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 font-bold text-blue-900">العمل بدون إنترنت (Offline-First)</td>
                                                <td className="p-3 font-mono">localStorage Cache + Pending Queue</td>
                                                <td className="p-3 text-slate-600">حفظ محلي فوري لكل العمليات، ومزامنة تلقائية عند عودة الاتصال السحابي.</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 font-bold text-blue-900">أمن كلمات المرور (Security)</td>
                                                <td className="p-3 font-mono">Bcrypt (bcrypt-ts) + 10 Rounds Salt</td>
                                                <td className="p-3 text-slate-600">تشفير حديث عالمي يحمي من هجمات القوة الغاشمة مع ترقية ذاتية للحسابات القديمة.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* الفصل الرابع */}
                            <section id="section-4" className="space-y-4 pt-4 border-t border-slate-200">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow">4</span>
                                    <h3 className="text-lg font-black text-slate-900">الرقابة المحاسبية وقواعد العمل الصارمة (Business Rules)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                                        <h4 className="font-bold text-amber-900 text-xs">رقابة رخصة الالتزام (AE Sufficiency)</h4>
                                        <p className="text-xs text-amber-800 leading-relaxed text-justify">
                                            يمنع النظام حجز أي التزام مالي يتجاوز الرصيد المتاح في هيكل الكلفة المرتبط، ويصدر تنبيهاً صريحاً يوضح الرصيد المتاح والمبلغ المطلوب.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                                        <h4 className="font-bold text-emerald-900 text-xs">رقابة اعتمادات الدفع (CP Sufficiency)</h4>
                                        <p className="text-xs text-emerald-800 leading-relaxed text-justify">
                                            تنبيه وحظر صرف أي دفعة لوثائق الدفع إذا تجاوز مبلغ الدفع رصيد اعتمادات الدفع الإجمالية المتاحة للعملية في السنة المعتمدة.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                                        <h4 className="font-bold text-blue-900 text-xs">سلسلة وضعيات الأشغال (Sequencing)</h4>
                                        <p className="text-xs text-blue-800 leading-relaxed text-justify">
                                            فحص ترقيم وضعيات الأشغال لنفس الصفقة والمستفيد (01، 02، 03...)، والتأكد من أن تاريخ كل وضعية لاحق أو مساوٍ لتاريخ الوضعية السابقة.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                                        <h4 className="font-bold text-purple-900 text-xs">رقابة رفع اليد عن الضمان (Caution Release)</h4>
                                        <p className="text-xs text-purple-800 leading-relaxed text-justify">
                                            منع تسجيل وثيقة رفع اليد عن الضمان ما لم يمر عام كامل ويوم واحد من تاريخ أمر خدمة الختام (الاستلام المؤقت للأشغال).
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* الفصل الخامس: شرح واجهة المستخدم وتجربة الاستخدام */}
                            <section id="section-5" className="space-y-4 pt-4 border-t border-slate-200">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow">5</span>
                                    <h3 className="text-lg font-black text-slate-900">شرح الواجهات وتجربة المستخدم (UI/UX) والتفاعل البصري</h3>
                                </div>
                                <div className="space-y-3 my-4">
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                        <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2 text-xs">
                                            <i className="bi bi-window-sidebar text-blue-600"></i>
                                            شريط التنقل ولوحة القيادة العلوية
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            تتيح لوحة التحكم التنقل السريع بين الوحدات ببطاقات ملونة متباينة، مع عرض فوري لعدد المستخدمين المتصلين في نفس اللحظة (Realtime Presence)، وشريط الأحداث الحي المتنقل (Event Ticker) الذي يُظهر آخر التعديلات والإضافات التي تمت على النظام فورياً.
                                        </p>
                                    </div>

                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                        <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2 text-xs">
                                            <i className="bi bi-command text-indigo-600"></i>
                                            البحث الشامل والاختصارات السريعة (Keyboard Shortcuts)
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            بمجرد الضغط على <kbd className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-[10px] text-blue-700 shadow-sm mx-1">Ctrl + K</kbd> تفتح نافذة البحث السريع الفوري للوصول إلى أي عملية، وثيقة، التزام، أو مستفيد خلال أجزاء من الثانية.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* الفصل السادس: نماذج المطبوعات الرسمية */}
                            <section id="section-6" className="space-y-4 pt-4 border-t border-slate-200">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow">6</span>
                                    <h3 className="text-lg font-black text-slate-900">نماذج المطبوعات الرسمية والكشوفات المعتمدة</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-4 text-xs">
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                                        <span className="font-bold text-blue-900 block">بطاقة الالتزام (Fiche d'Engagement)</span>
                                        <span className="text-slate-500 text-[11px] block">النموذج الرسمي المقدم للمراقب المالي متضمناً الرصيد السابق والمتبقي.</span>
                                    </div>
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                                        <span className="font-bold text-blue-900 block">حوالة الدفع (Mandat de Paiement)</span>
                                        <span className="text-slate-500 text-[11px] block">حوالة الصرف الرسمية الموجهة لأمين الخزينة العمومية.</span>
                                    </div>
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                                        <span className="font-bold text-blue-900 block">شهادة الدفع (Certificat de Paiement)</span>
                                        <span className="text-slate-500 text-[11px] block">كشف تفصيلي بتسوية الوضعية مع تفقيط المبالغ بالدينار الجزائري.</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* عرض كود وتصميم قاعدة البيانات المشروح */}
                    {(viewMode === 'schema' || viewMode === 'all') && (
                        <div className="space-y-6 pt-8 border-t-2 border-slate-300">
                            <div className="border-b-2 border-indigo-600 pb-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow">
                                        <i className="bi bi-database-fill-gear"></i>
                                    </span>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">
                                            {viewMode === 'all' ? 'الجزء الثالث: ' : ''}كود قاعدة البيانات وتصميم الجداول المشروح (SQL Schema)
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            المعمارية الهيكلية، شرح الحقول والقيود المحاسبية، الفهارس، وقواعد الأمان RLS
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold border border-indigo-200 hidden sm:inline">
                                    PostgreSQL / Supabase DDL
                                </span>
                            </div>

                            <DatabaseSchemaGuide />
                        </div>
                    )}

                    {/* الخاتمة والتوقيع */}
                    <div className="mt-12 pt-8 border-t-2 border-slate-200 text-center space-y-2 text-xs text-slate-500">
                        <p className="font-bold text-slate-800">نظام GOFT3 - أداة الإدارة الرقمية الذكية لنفقات ميزانية التجهيز العمومي</p>
                        <p>تطوير: عبد اللطيف بن كثيرة | حقوق الملكية الفكرية مرخصة ومحمية | النسخة {APP_VERSION}</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SystemDocumentationPage;
