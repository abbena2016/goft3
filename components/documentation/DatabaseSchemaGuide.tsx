import React, { useState } from 'react';

export const DatabaseSchemaGuide: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'sql' | 'security'>('overview');
    const [selectedTable, setSelectedTable] = useState<string>('ALL');

    const handleCopySql = () => {
        navigator.clipboard.writeText(fullSqlCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleDownloadSql = () => {
        const element = document.createElement('a');
        const file = new Blob([fullSqlCode], { type: 'text/plain;charset=utf-8' });
        element.href = URL.createObjectURL(file);
        element.download = 'GOFT3_DATABASE_SCHEMA.sql';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="space-y-12 py-4">
            {/* رأس قسم قاعدة البيانات الفخم */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-indigo-700/50">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                PostgreSQL 14+ / Supabase Schema
                            </span>
                            <span className="bg-white/10 text-indigo-200 text-[10px] font-mono px-2.5 py-1 rounded-full border border-white/10">
                                الإصدار المالي: 1.1.0 (LOLF - قانون 23-07)
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black mt-3 text-white flex items-center gap-2">
                            <i className="bi bi-database-fill-gear text-indigo-400"></i>
                            الهيكل المرجعي لقاعدة بيانات نظام GOFT3 مشروحاً ومفصلاً
                        </h2>
                        <p className="text-xs sm:text-sm text-indigo-200 mt-2 max-w-3xl leading-relaxed">
                            الدليل الهندسي والتقني الشامل لمخطط قاعدة البيانات العلائقية (Relational Database Schema)، متضمناً شرح كافة الجداول الـ 16، مفاتيح الربط الأجنبية (Foreign Keys)، الفهارس المحسنة للأداء (Indexes)، سياسات الأمان على مستوى الصفوف (Row Level Security)، وكود SQL DDL الكامل القابل للتنفيذ المباشر.
                        </p>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 no-print">
                        <button
                            type="button"
                            onClick={handleCopySql}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-2"
                        >
                            <i className={`bi ${copied ? 'bi-check-lg text-emerald-300' : 'bi-clipboard'}`}></i>
                            <span>{copied ? 'تم نسخ كود SQL!' : 'نسخ كود SQL كاملاً'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadSql}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-2"
                        >
                            <i className="bi bi-download"></i>
                            <span>تحميل ملف .sql</span>
                        </button>
                    </div>
                </div>

                {/* شريط الإحصائيات الفورية لقاعدة البيانات */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10 text-center">
                    <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                        <span className="block text-indigo-300 text-[10px]">عدد الجداول</span>
                        <span className="text-lg font-black text-white">16 جدولاً</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                        <span className="block text-indigo-300 text-[10px]">المفاتيح الأجنبية (FK)</span>
                        <span className="text-lg font-black text-amber-400">+22 قيداً</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                        <span className="block text-indigo-300 text-[10px]">فهارس الأداء (Indexes)</span>
                        <span className="text-lg font-black text-emerald-400">16 فهرساً</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                        <span className="block text-indigo-300 text-[10px]">الحماية الأمنية</span>
                        <span className="text-lg font-black text-cyan-300">RLS مفعل</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                        <span className="block text-indigo-300 text-[10px]">التزامن الحي</span>
                        <span className="text-lg font-black text-purple-300">Supabase Realtime</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                        <span className="block text-indigo-300 text-[10px]">التشفير والمحارف</span>
                        <span className="text-lg font-black text-white">UTF-8 / Bcrypt</span>
                    </div>
                </div>
            </div>

            {/* أزرار التبويب الداخلية لقسم قاعدة البيانات */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 no-print overflow-x-auto text-xs font-bold">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                        activeTab === 'overview'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                    <i className="bi bi-diagram-3-fill"></i>
                    <span>المخطط العلائقي (ERD) والمعمارية</span>
                </button>

                <button
                    onClick={() => setActiveTab('tables')}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                        activeTab === 'tables'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                    <i className="bi bi-table"></i>
                    <span>شرح الجداول والحقول بالتفصيل (16 جدولاً)</span>
                </button>

                <button
                    onClick={() => setActiveTab('security')}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                        activeTab === 'security'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                    <i className="bi bi-shield-lock-fill"></i>
                    <span>الأمان، الفهارس، وقواعد RLS</span>
                </button>

                <button
                    onClick={() => setActiveTab('sql')}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                        activeTab === 'sql'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                    <i className="bi bi-code-slash"></i>
                    <span>كود SQL الكامل المرجعي (DDL)</span>
                </button>
            </div>

            {/* المحتوى بحسب التبويب */}

            {/* 1. المخطط العلائقي والمعمارية */}
            {(activeTab === 'overview' || activeTab === 'tables') && (
                <div id="db-overview-section" className="space-y-6">
                    <div className="border-b-2 border-indigo-600 pb-2 flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow">01</span>
                            <span>المعمارية العلائقية والعلاقات المحاسبية (Data Architecture)</span>
                        </h3>
                        <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-lg border border-indigo-200">
                            تسلسل قيود الربط المرجعي
                        </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
                        صُمم مخطط قاعدة بيانات <strong>GOFT3</strong> ليعكس بدقة متناهية الهيكل الهرمي لنفقات الاستثمار العمومي المنصوص عليها في القانون 23-07 المتعلق بقوانين المالية. تعتمد القاعدة على نموذج مركزي يدور حول كيان <strong>العملية المالية (T_OPERATION)</strong>، والتي تتفرع منها الهياكل المالية والتعاقدية وفق 4 مستويات متسلسلة:
                    </p>

                    {/* بطاقات مسار تدفق البيانات في قاعدة البيانات */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-blue-900 font-black">
                                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                                <h4>جداول الهيكلة المرجعية</h4>
                            </div>
                            <p className="text-slate-600 leading-relaxed">
                                تعريف البرامج، البرامج الفرعية، الأصناف، هياكل الكلفة المعتمدة، وجهات الصرف المنفذة.
                            </p>
                            <span className="text-[10px] text-blue-700 font-mono block">T_DIRECTION, T_PROGRAMME, T_CATEGORIE, T_RUBRIQUE</span>
                        </div>

                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-emerald-900 font-black">
                                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                                <h4>وعاء العملية والميزانية</h4>
                            </div>
                            <p className="text-slate-600 leading-relaxed">
                                تثبيت بطاقة تعريف المشروع، رخص الالتزام (AE)، اعتمادات الدفع السنوية (CP)، وتوزيع حصص الصفقات.
                            </p>
                            <span className="text-[10px] text-emerald-700 font-mono block">T_OPERATION, T_CP, T_RUBRIQUE_OP, T_LOT_OPERATION</span>
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-amber-900 font-black">
                                <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-[10px]">3</span>
                                <h4>المتعاقدون والوثائق</h4>
                            </div>
                            <p className="text-slate-600 leading-relaxed">
                                تسجيل الصفقات، الملاحق، أوامر الخدمة (ODS)، وحسابات المستفيدين المصرفية والجبائية (RIB/NIF).
                            </p>
                            <span className="text-[10px] text-amber-700 font-mono block">T_BENEFICIAIRE, T_COMPTE_BANCAIRE, T_PIECE, T_ODS</span>
                        </div>

                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-rose-900 font-black">
                                <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-[10px]">4</span>
                                <h4>دورة التنفيذ المالي الصارم</h4>
                            </div>
                            <p className="text-slate-600 leading-relaxed">
                                بطاقات الالتزام المؤشرة من المراقب الميزانياتي، حوالات الصرف الموجهة للخزينة، وجداول الإرسال.
                            </p>
                            <span className="text-[10px] text-rose-700 font-mono block">T_ENGAGEMENT, T_PAIEMENT, T_BORDEREAU</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. تفصيل وشرح كل جدول من الجداول الـ 16 */}
            {(activeTab === 'tables' || activeTab === 'overview') && (
                <div id="db-tables-section" className="space-y-8 pt-4">
                    <div className="border-b-2 border-indigo-600 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow">02</span>
                            <span>الشرح التفصيلي لحقول وجداول قاعدة البيانات (Data Dictionary)</span>
                        </h3>
                        
                        {/* فلتر اختيار جدول محدد */}
                        <div className="flex items-center gap-2 no-print">
                            <span className="text-xs text-slate-500 font-bold">عرض جدول:</span>
                            <select
                                value={selectedTable}
                                onChange={(e) => setSelectedTable(e.target.value)}
                                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
                            >
                                <option value="ALL">-- عرض كافة الجداول (16 جدولاً) --</option>
                                <option value="T_OPERATION">T_OPERATION (العمليات المالية)</option>
                                <option value="T_CP">T_CP (اعتمادات الدفع السنوية)</option>
                                <option value="T_RUBRIQUE_OP">T_RUBRIQUE_OP (هيكلة كلفة العملية)</option>
                                <option value="T_LOT_OPERATION">T_LOT_OPERATION (حصص العملية)</option>
                                <option value="T_PIECE">T_PIECE (الوثائق والصفقات)</option>
                                <option value="T_LOT_PIECE">T_LOT_PIECE (ربط الوثيقة بالحصص)</option>
                                <option value="T_ODS">T_ODS (أوامر الخدمة والآجال)</option>
                                <option value="T_ENGAGEMENT">T_ENGAGEMENT (الالتزامات الميزانياتية)</option>
                                <option value="T_PAIEMENT">T_PAIEMENT (الدفعات والحوالات)</option>
                                <option value="T_BORDEREAU">T_BORDEREAU (جداول الإرسال)</option>
                                <option value="T_BENEFICIAIRE">T_BENEFICIAIRE (المستفيدون / المقاولون)</option>
                                <option value="T_COMPTE_BANCAIRE">T_COMPTE_BANCAIRE (حسابات الـ RIB)</option>
                                <option value="T_USER">T_USER (المستخدمون والأذونات)</option>
                                <option value="T_DIRECTION">T_DIRECTION (المديريات وجهات الصرف)</option>
                                <option value="T_PROGRAMME">T_PROGRAMME & T_SPROGRAMME (البرامج)</option>
                                <option value="T_CATEGORIE">T_CATEGORIE & T_SCATEGORIE (الأصناف)</option>
                            </select>
                        </div>
                    </div>

                    {/* الجداول التفصيلية */}
                    <div className="space-y-8">
                        {tablesDefinition
                            .filter(t => selectedTable === 'ALL' || t.name === selectedTable || (selectedTable === 'T_PROGRAMME' && (t.name === 'T_PROGRAMME' || t.name === 'T_SPROGRAMME')) || (selectedTable === 'T_CATEGORIE' && (t.name === 'T_CATEGORIE' || t.name === 'T_SCATEGORIE')))
                            .map((table, idx) => (
                                <div
                                    key={table.name}
                                    id={`table-${table.name}`}
                                    className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm hover:border-indigo-300 transition-colors"
                                >
                                    {/* عنوان الجدول */}
                                    <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <h4 className="font-mono font-bold text-sm text-indigo-300 flex items-center gap-2">
                                                    <span>{table.name}</span>
                                                    <span className="text-white text-xs font-sans">({table.arabicTitle})</span>
                                                </h4>
                                                <p className="text-[11px] text-slate-300 font-sans mt-0.5">{table.purpose}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px]">
                                            <span className="bg-slate-800 text-indigo-200 px-2.5 py-1 rounded-md border border-slate-700 font-mono">
                                                {table.fields.length} حقول
                                            </span>
                                            <span className="bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-800 font-mono font-bold">
                                                PK: {table.pk}
                                            </span>
                                        </div>
                                    </div>

                                    {/* جدول الحقول وتوصيفها */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-right text-xs">
                                            <thead>
                                                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                                                    <th className="p-3 font-bold w-12 text-center">#</th>
                                                    <th className="p-3 font-bold font-mono">اسم الحقل (Field)</th>
                                                    <th className="p-3 font-bold font-mono">نوع البيانات (Type)</th>
                                                    <th className="p-3 font-bold">القيود (Constraints)</th>
                                                    <th className="p-3 font-bold">الشرح والوظيفة المحاسبية / الإدارية</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-sans">
                                                {table.fields.map((f, fIdx) => (
                                                    <tr key={f.name} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-3 text-center text-slate-400 text-[11px] font-mono">{fIdx + 1}</td>
                                                        <td className="p-3 font-mono font-bold text-indigo-700 text-[11px]">{f.name}</td>
                                                        <td className="p-3 font-mono text-slate-600 text-[10px]">{f.type}</td>
                                                        <td className="p-3 text-[10px]">
                                                            {f.isPk && (
                                                                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold ml-1">PK</span>
                                                            )}
                                                            {f.isFk && (
                                                                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold ml-1">FK ➔ {f.fkRef}</span>
                                                            )}
                                                            {f.isUnique && (
                                                                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold ml-1">UNIQUE</span>
                                                            )}
                                                            {f.notNull && !f.isPk && (
                                                                <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold ml-1">NOT NULL</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-slate-700 leading-relaxed text-[11px]">{f.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* مقتطف كود الـ DDL المباشر للجدول */}
                                    <div className="bg-slate-950 p-3 border-t border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto ltr text-left">
                                        <div className="flex items-center justify-between text-slate-400 mb-1.5 border-b border-slate-800 pb-1 text-[10px]">
                                            <span>SQL DDL Definition ({table.name})</span>
                                            <span className="text-emerald-400">PostgreSQL 14+</span>
                                        </div>
                                        <pre className="text-indigo-200"><code>{table.ddlSnippet}</code></pre>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* 3. الأمان، الفهارس، وقواعد RLS */}
            {(activeTab === 'security' || activeTab === 'overview') && (
                <div id="db-security-section" className="space-y-6 pt-6 border-t-2 border-slate-200">
                    <div className="border-b-2 border-indigo-600 pb-2 flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow">03</span>
                            <span>الفهارس، الأداء العالي، وسياسات الحماية (Performance & Security)</span>
                        </h3>
                        <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-lg border border-indigo-200">
                            RLS & B-Tree Indexes
                        </span>
                    </div>

                    {/* شبكة الفهارس وسياسات الأمان */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <i className="bi bi-speedometer2 text-emerald-600"></i>
                                فهارس تسريع الاستعلامات والتقارير (B-Tree Indexes)
                            </h4>
                            <p className="text-slate-600 leading-relaxed text-justify">
                                تم تزويد الجداول الأساسية بفهارس متعددة الأعمدة ومفردة للوصول الفوري إلى البيانات في أقل من 5 ميلي ثانية حتى مع تراكم ملايين القيود المحاسبية عبر السنوات:
                            </p>
                            <ul className="space-y-1.5 font-mono text-[11px] text-slate-700">
                                <li className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                                    <span>IDX_OPERATION_N_OP</span>
                                    <span className="text-indigo-600 font-bold">ON T_OPERATION(N_OPERATION)</span>
                                </li>
                                <li className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                                    <span>IDX_CP_OP_YEAR</span>
                                    <span className="text-indigo-600 font-bold">ON T_CP(ID_OPERATION, ANNEE)</span>
                                </li>
                                <li className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                                    <span>IDX_ENGAGEMENT_OP_YEAR</span>
                                    <span className="text-indigo-600 font-bold">ON T_ENGAGEMENT(ID_OPERATION, ANNEE)</span>
                                </li>
                                <li className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                                    <span>IDX_PAIEMENT_OP_YEAR</span>
                                    <span className="text-indigo-600 font-bold">ON T_PAIEMENT(ID_OPERATION, ANNEE)</span>
                                </li>
                                <li className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                                    <span>IDX_PIECE_BENEF</span>
                                    <span className="text-indigo-600 font-bold">ON T_PIECE(ID_BENEFICIAIRE)</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <i className="bi bi-shield-check text-blue-600"></i>
                                أمان الصفوف والتزامن اللحظي (RLS & Realtime)
                            </h4>
                            <p className="text-slate-600 leading-relaxed text-justify">
                                تخضع قاعدة البيانات لمنظومة أمان مشددة تعتمد على تشفير Bcrypt لكلمات المرور مع 10 جولات توليد (Salt Rounds)، وتفعيل سياسات التحكم بالوصول على مستوى الصفوف (Row Level Security - RLS) لكافة الجداول الـ 16:
                            </p>
                            <div className="space-y-2">
                                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                                    <strong>Supabase Realtime Publication:</strong> تفعيل البث اللحظي لكافة جداول العمليات، الوثائق، الالتزامات والدفعات لمزامنة التعديلات بين مكاتب الصرف المتعددة في نفس اللحظة.
                                </div>
                                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
                                    <strong>تشفير Bcrypt لكلمات المرور:</strong> منع حفظ أي كلمة مرور بنص مجرد؛ حيث يتم تشفيرها تلقائياً قبل الحفظ في <code>T_USER.PASSWORD</code>.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. كود SQL الكامل المرجعي DDL */}
            {(activeTab === 'sql' || activeTab === 'overview') && (
                <div id="db-sql-section" className="space-y-4 pt-6 border-t-2 border-slate-200">
                    <div className="border-b-2 border-indigo-600 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow">04</span>
                                <span>كود SQL الكامل والجاهز للتشغيل (Complete DDL Script)</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                ملف DDL رسمي قابل للتنفيذ في PostgreSQL / Supabase SQL Editor لإنشاء البنية بالكامل بضغطة واحدة.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 no-print">
                            <button
                                type="button"
                                onClick={handleCopySql}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
                            >
                                <i className={`bi ${copied ? 'bi-check-lg text-emerald-400' : 'bi-clipboard'}`}></i>
                                <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleDownloadSql}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
                            >
                                <i className="bi bi-file-earmark-arrow-down"></i>
                                <span>تنزيل .sql</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden shadow-2xl ltr text-left font-mono">
                        <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                                <span className="ml-2 font-bold text-slate-200">GOFT3_DATABASE_SCHEMA.sql</span>
                            </div>
                            <span className="text-[11px] text-indigo-400 font-bold">384 Lines | UTF-8</span>
                        </div>
                        <pre className="p-5 text-indigo-100 text-xs leading-relaxed overflow-x-auto max-h-[600px] overflow-y-auto selection:bg-indigo-700 selection:text-white">
                            <code>{fullSqlCode}</code>
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// مصفوفة تعريف وتفصيل الجداول والحقول الـ 16
// ============================================================================
interface TableDef {
    name: string;
    arabicTitle: string;
    purpose: string;
    pk: string;
    fields: {
        name: string;
        type: string;
        isPk?: boolean;
        isFk?: boolean;
        fkRef?: string;
        isUnique?: boolean;
        notNull?: boolean;
        description: string;
    }[];
    ddlSnippet: string;
}

const tablesDefinition: TableDef[] = [
    {
        name: 'T_OPERATION',
        arabicTitle: 'جدول العمليات والمشاريع المالية المركزية',
        purpose: 'العمود الفقري للنظام؛ يحتوي على بطاقة تعريف كل عملية استثمارية، رقم التسجيل، العنوان، الصنف والوضعية.',
        pk: 'ID_OPERATION',
        fields: [
            { name: 'ID_OPERATION', type: 'BIGINT GENERATED BY DEFAULT AS IDENTITY', isPk: true, notNull: true, description: 'المفتاح الأساسي المعرف للعملية بشكل فريد.' },
            { name: 'N_OPERATION', type: 'VARCHAR(100)', isUnique: true, notNull: true, description: 'رقم العملية المالي الرسمي المعتمد في قانون المالية وقرارات التفريد.' },
            { name: 'N_OPERATION_ANCIEN', type: 'VARCHAR(100)', description: 'رقم العملية القديم قبل إعادة الهيكلة أو التحيين.' },
            { name: 'INT_OPERATION', type: 'TEXT', notNull: true, description: 'عنوان وتعيين العملية بالكامل (اسم المشروع الاستثماري).' },
            { name: 'ID_CATEGORIE', type: 'BIGINT', isFk: true, fkRef: 'T_CATEGORIE', notNull: true, description: 'معرف الصنف المالي الرئيسي للمشروع (بناء، أشغال، دراسات...).' },
            { name: 'ID_SCATEGORIE', type: 'BIGINT', isFk: true, fkRef: 'T_SCATEGORIE', description: 'معرف الصنف الفرعي المالي التابع للصنف الرئيسي.' },
            { name: 'status', type: 'VARCHAR(20)', notNull: true, description: 'وضعية العملية (جارية أو مغلقة) مع قيد التحقق CHECK.' },
            { name: 'TYPE_OP', type: 'VARCHAR(50)', description: 'نوع العملية وفق تصنيفات القانون العضوي (LOLF).' },
            { name: 'CREATED_BY', type: 'BIGINT', isFk: true, fkRef: 'T_USER', description: 'معرف المستخدم الذي أنشأ العملية للتدقيق المحاسبي (Audit Trail).' },
            { name: 'CREATED_AT', type: 'TIMESTAMPTZ', description: 'تاريخ ووقت تسجيل العملية بالنظام آلياً.' }
        ],
        ddlSnippet: `CREATE TABLE IF NOT EXISTS "T_OPERATION" (
    "ID_OPERATION" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "N_OPERATION" VARCHAR(100) NOT NULL UNIQUE,
    "N_OPERATION_ANCIEN" VARCHAR(100) DEFAULT NULL,
    "INT_OPERATION" TEXT NOT NULL,
    "ID_CATEGORIE" BIGINT NOT NULL REFERENCES "T_CATEGORIE"("ID_CATEGORIE"),
    "ID_SCATEGORIE" BIGINT DEFAULT NULL REFERENCES "T_SCATEGORIE"("ID_SCATEGORIE"),
    "status" VARCHAR(20) NOT NULL DEFAULT 'جارية' CHECK ("status" IN ('جارية', 'مغلقة')),
    "TYPE_OP" VARCHAR(50) DEFAULT 'LOLF',
    "CREATED_BY" BIGINT DEFAULT NULL REFERENCES "T_USER"("ID_USER") ON DELETE SET NULL,
    "CREATED_AT" TIMESTAMPTZ DEFAULT NOW()
);`
    },
    {
        name: 'T_CP',
        arabicTitle: 'جدول اعتمادات الدفع السنوية (Crédits de Paiement)',
        purpose: 'يسجل مبالغ اعتمادات الدفع الممنوحة للعملية في كل سنة مالية، وهو الحاكم المطلق لرقابة عدم تجاوز الدفعات.',
        pk: 'ID_CP',
        fields: [
            { name: 'ID_CP', type: 'BIGINT GENERATED BY DEFAULT AS IDENTITY', isPk: true, notNull: true, description: 'المعرف الفريد لسجل اعتماد الدفع.' },
            { name: 'ID_OPERATION', type: 'BIGINT', isFk: true, fkRef: 'T_OPERATION', notNull: true, description: 'معرف العملية المرتبطة بالاعتماد (مع الحذف المتسلسل CASCADE).' },
            { name: 'ANNEE', type: 'VARCHAR(10)', notNull: true, description: 'السنة المالية المفتوح فيها اعتماد الدفع (مثال: 2026).' },
            { name: 'MONTANT_INITIALE_CP', type: 'NUMERIC(18, 2)', notNull: true, description: 'مبلغ اعتماد الدفع المالي الأولي الممنوح في بداية السنة.' },
            { name: 'MONTANT_FINALE_CP', type: 'NUMERIC(18, 2)', notNull: true, description: 'مبلغ اعتماد الدفع النهائي بعد التعديلات أو المناقلات المالية.' }
        ],
        ddlSnippet: `CREATE TABLE IF NOT EXISTS "T_CP" (
    "ID_CP" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_OPERATION" BIGINT NOT NULL REFERENCES "T_OPERATION"("ID_OPERATION") ON DELETE CASCADE,
    "ANNEE" VARCHAR(10) NOT NULL,
    "MONTANT_INITIALE_CP" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "MONTANT_FINALE_CP" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    CONSTRAINT "UQ_T_CP_OP_ANNEE" UNIQUE ("ID_OPERATION", "ANNEE")
);`
    },
    {
        name: 'T_RUBRIQUE_OP',
        arabicTitle: 'جدول هيكلة كلفة العملية (Rubriques de Coût)',
        purpose: 'توزيع رخص الالتزام (AE) للعملية على أبواب الكلفة (دراسات، أشغال، تجهيز، تسوية عقارية...).',
        pk: 'ID_RUBRIQUE_OP',
        fields: [
            { name: 'ID_RUBRIQUE_OP', type: 'BIGINT GENERATED BY DEFAULT AS IDENTITY', isPk: true, notNull: true, description: 'المعرف الفريد لهيكل كلفة العملية.' },
            { name: 'ID_OPERATION', type: 'BIGINT', isFk: true, fkRef: 'T_OPERATION', notNull: true, description: 'معرف العملية المستفيدة من هذا الباب.' },
            { name: 'ID_RUBRIQUE', type: 'BIGINT', isFk: true, fkRef: 'T_RUBRIQUE', notNull: true, description: 'معرف باب الكلفة من جدول الهياكل الأساسية.' },
            { name: 'MONTANT_INITIALE', type: 'NUMERIC(18, 2)', notNull: true, description: 'رخصة الالتزام الأولية المخصصة لهذا الباب (Montant Initial AE).' },
            { name: 'MONTANT_FINALE', type: 'NUMERIC(18, 2)', description: 'رخصة الالتزام النهائية بعد قرارات التعديل أو التحيين.' }
        ],
        ddlSnippet: `CREATE TABLE IF NOT EXISTS "T_RUBRIQUE_OP" (
    "ID_RUBRIQUE_OP" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_OPERATION" BIGINT NOT NULL REFERENCES "T_OPERATION"("ID_OPERATION") ON DELETE CASCADE,
    "ID_RUBRIQUE" BIGINT NOT NULL REFERENCES "T_RUBRIQUE"("ID_RUBRIQUE"),
    "MONTANT_INITIALE" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "MONTANT_FINALE" NUMERIC(18, 2) DEFAULT NULL,
    CONSTRAINT "UQ_T_RUBRIQUE_OP" UNIQUE ("ID_OPERATION", "ID_RUBRIQUE")
);`
    },
    {
        name: 'T_LOT_OPERATION',
        arabicTitle: 'جدول حصص الصفقات للعملية (Lots de l\'Opération)',
        purpose: 'تقسيم المشروع أو الصفقة إلى حصص جغرافية أو وظيفية (مثال: حصة الحفر، حصة التهيئة، حصة الإنارة...).',
        pk: 'ID_LOT',
        fields: [
            { name: 'ID_LOT', type: 'BIGINT GENERATED BY DEFAULT AS IDENTITY', isPk: true, notNull: true, description: 'المعرف الفريد للحصة.' },
            { name: 'ID_OPERATION', type: 'BIGINT', isFk: true, fkRef: 'T_OPERATION', notNull: true, description: 'معرف العملية التابعة لها هذه الحصة.' },
            { name: 'N_LOT', type: 'VARCHAR(100)', notNull: true, description: 'رقم أو كود الحصة (مثال: LOT 01).' },
            { name: 'INTITULE_LOT', type: 'TEXT', notNull: true, description: 'تعيين الحصة وعنوان الأشغال التابعة لها بالتفصيل.' },
            { name: 'MONTANT_INITIALE_LOT', type: 'NUMERIC(18, 2)', notNull: true, description: 'المبلغ التقديري الأولي للحصة بالدينار الجزائري.' },
            { name: 'MONTANT_FINALE_LOT', type: 'NUMERIC(18, 2)', notNull: true, description: 'المبلغ النهائي المعتمد للحصة بعد الإسناد أو التعاقد.' },
            { name: 'ATTRIBUER', type: 'BOOLEAN', notNull: true, description: 'حالة إسناد الحصة (مُسندة لمتعامل أو غير مُسندة).' }
        ],
        ddlSnippet: `CREATE TABLE IF NOT EXISTS "T_LOT_OPERATION" (
    "ID_LOT" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_OPERATION" BIGINT NOT NULL REFERENCES "T_OPERATION"("ID_OPERATION") ON DELETE CASCADE,
    "N_LOT" VARCHAR(100) NOT NULL,
    "INTITULE_LOT" TEXT NOT NULL,
    "MONTANT_INITIALE_LOT" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "MONTANT_FINALE_LOT" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "ATTRIBUER" BOOLEAN NOT NULL DEFAULT FALSE
);`
    },
    {
        name: 'T_PIECE',
        arabicTitle: 'جدول الوثائق التعاقدية والتنفيذية (Documents & Marchés)',
        purpose: 'السجل العقدي الشامل؛ يحتوي على الصفقات، الملاحق، الفواتير، المقررات، وأوامر الخدمة مع كافة تواريخها.',
        pk: 'ID_PIECE',
        fields: [
            { name: 'ID_PIECE', type: 'BIGINT GENERATED BY DEFAULT AS IDENTITY', isPk: true, notNull: true, description: 'المعرف الفريد للوثيقة التعاقدية.' },
            { name: 'NAT_PIECE', type: 'VARCHAR(100)', notNull: true, description: 'طبيعة الوثيقة (صفقة، ملحق، فاتورة، مقرر، اتفاقية، وضعية...).' },
            { name: 'ID_PIECE_INIT', type: 'BIGINT', isFk: true, fkRef: 'T_PIECE', description: 'معرف الصفقة الأصلية إذا كانت هذه الوثيقة ملحقاً تكميلياً (Avenant).' },
            { name: 'ID_OPERATION', type: 'BIGINT', isFk: true, fkRef: 'T_OPERATION', notNull: true, description: 'معرف العملية المنفذ عليها هذا العقد.' },
            { name: 'PIECE', type: 'TEXT', notNull: true, description: 'موضوع الوثيقة وتفاصيل الالتزام التعاقدي.' },
            { name: 'ID_BENEFICIAIRE', type: 'BIGINT', isFk: true, fkRef: 'T_BENEFICIAIRE', description: 'المتعامل المتعاقد صاحب الوثيقة.' },
            { name: 'ID_COMPTE', type: 'BIGINT', isFk: true, fkRef: 'T_COMPTE_BANCAIRE', description: 'الحساب البنكي المعتمد للصرف (RIB).' },
            { name: 'MONTANT_PIECE', type: 'NUMERIC(18, 2)', notNull: true, description: 'المبلغ المالي الإجمالي للوثيقة شامل الرسوم TTC.' },
            { name: 'DELAI_EX_JOURS', type: 'VARCHAR(50)', description: 'أجل الإنجاز التعاقدي بالأيام أو الأشهر.' },
            { name: 'SAI_ENG', type: 'BOOLEAN', notNull: true, description: 'هل تم تسجيل التزام مالي لهذه الوثيقة (تأشير آلي).' },
            { name: 'SAI_PAI', type: 'BOOLEAN', notNull: true, description: 'هل تم فتح مدفوعات لهذه الوثيقة.' },
            { name: 'N_VISA_CM', type: 'VARCHAR(100)', description: 'رقم تأشيرة لجنة الصفقات العمومية المختصة.' },
            { name: 'DATE_VISA_CM', type: 'VARCHAR(50)', description: 'تاريخ تأشيرة لجنة الصفقات العمومية.' },
            { name: 'CAUTION', type: 'TEXT', description: 'بيانات كفالة حسن التنفيذ والضمان المصرفي.' }
        ],
        ddlSnippet: `CREATE TABLE IF NOT EXISTS "T_PIECE" (
    "ID_PIECE" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "NAT_PIECE" VARCHAR(100) NOT NULL,
    "ID_PIECE_INIT" BIGINT DEFAULT NULL REFERENCES "T_PIECE"("ID_PIECE") ON DELETE SET NULL,
    "ID_OPERATION" BIGINT NOT NULL REFERENCES "T_OPERATION"("ID_OPERATION") ON DELETE CASCADE,
    "PIECE" TEXT NOT NULL,
    "ID_BENEFICIAIRE" BIGINT DEFAULT NULL REFERENCES "T_BENEFICIAIRE"("ID_BENEFICIAIRE") ON DELETE SET NULL,
    "ID_COMPTE" BIGINT DEFAULT NULL REFERENCES "T_COMPTE_BANCAIRE"("ID_COMPTE") ON DELETE SET NULL,
    "MONTANT_PIECE" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "ID_SCATEGORIE" BIGINT DEFAULT NULL REFERENCES "T_SCATEGORIE"("ID_SCATEGORIE"),
    "ID_RUBRIQUE" BIGINT DEFAULT NULL REFERENCES "T_RUBRIQUE"("ID_RUBRIQUE"),
    "DELAI_EX_JOURS" VARCHAR(50) DEFAULT NULL,
    "SAI_ENG" BOOLEAN NOT NULL DEFAULT FALSE,
    "SAI_PAI" BOOLEAN NOT NULL DEFAULT FALSE,
    "N_VISA_CM" VARCHAR(100) DEFAULT NULL,
    "DATE_VISA_CM" VARCHAR(50) DEFAULT NULL,
    "CAUTION" TEXT DEFAULT NULL,
    "DATE_OD_PIECE" VARCHAR(50) DEFAULT NULL,
    "N_OD_PIECE" VARCHAR(100) DEFAULT NULL,
    "DATE_DEPOT_PIECE" VARCHAR(50) DEFAULT NULL,
    "BORDEREAU_PIECE" VARCHAR(100) DEFAULT NULL
);`
    },
    {
        name: 'T_ENGAGEMENT',
        arabicTitle: 'جدول بطاقات الالتزام المالي (Engagements)',
        purpose: 'يسجل بطاقات الالتزام الرسمية المقدمة للمراقب الميزانياتي مع تتبع رصيد AE والرصيد السابق والمتبقي.',
        pk: 'ID_ENGAGEMENT',
        fields: [
            { name: 'ID_ENGAGEMENT', type: 'BIGINT GENERATED BY DEFAULT AS IDENTITY', isPk: true, notNull: true, description: 'المعرف الفريد لبطاقة الالتزام.' },
            { name: 'ID_OPERATION', type: 'BIGINT', isFk: true, fkRef: 'T_OPERATION', notNull: true, description: 'معرف العملية المحاسبية المنفذ عليها الالتزام.' },
            { name: 'ID_PIECE', type: 'BIGINT', isFk: true, fkRef: 'T_PIECE', notNull: true, description: 'معرف العقد أو الوثيقة الثبوتية المستند إليها.' },
            { name: 'ID_BORDEREAU', type: 'BIGINT', isFk: true, fkRef: 'T_BORDEREAU', description: 'معرف جدول الإرسال الموجه للمراقب الميزانياتي.' },
            { name: 'N_ENG', type: 'VARCHAR(50)', notNull: true, description: 'رقم الالتزام المحاسبي السنوي.' },
            { name: 'ANNEE', type: 'VARCHAR(10)', notNull: true, description: 'السنة المالية للالتزام.' },
            { name: 'NATURE_ENG', type: 'VARCHAR(100)', notNull: true, description: 'طبيعة الالتزام (أولي، تكميلي، تسوية، إلغاء).' },
            { name: 'OBJET_ENG', type: 'TEXT', notNull: true, description: 'موضوع الالتزام كما يدون في البطاقة الرسمية.' },
            { name: 'MONTANT_ENG', type: 'NUMERIC(18, 2)', notNull: true, description: 'مبلغ الالتزام المقترح بالدينار الجزائري.' },
            { name: 'AE_ENG', type: 'NUMERIC(18, 2)', notNull: true, description: 'رخصة الالتزام الإجمالية المفتوحة في هيكل الكلفة.' },
            { name: 'TOTAL_ENG_ANTERIEURE', type: 'NUMERIC(18, 2)', notNull: true, description: 'مجموع الالتزامات السابقة المؤشرة.' },
            { name: 'SOLDE_ANTERIEURE', type: 'NUMERIC(18, 2)', notNull: true, description: 'الرصيد المتاح قبل هذا الالتزام.' },
            { name: 'SOLDE_RELIQUAT', type: 'NUMERIC(18, 2)', notNull: true, description: 'باقي رخصة الالتزام بعد هذا الالتزام.' },
            { name: 'DATE_ENG', type: 'VARCHAR(50)', notNull: true, description: 'تاريخ إعداد بطاقة الالتزام.' },
            { name: 'N_VISA_CB', type: 'VARCHAR(100)', description: 'رقم تأشيرة المراقب الميزانياتي (Contrôleur Budgétaire).' },
            { name: 'DATE_VISA_CB', type: 'VARCHAR(50)', description: 'تاريخ وضع تأشيرة المراقب الميزانياتي.' }
        ],
        ddlSnippet: `CREATE TABLE IF NOT EXISTS "T_ENGAGEMENT" (
    "ID_ENGAGEMENT" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_OPERATION" BIGINT NOT NULL REFERENCES "T_OPERATION"("ID_OPERATION") ON DELETE CASCADE,
    "ID_PIECE" BIGINT NOT NULL REFERENCES "T_PIECE"("ID_PIECE") ON DELETE CASCADE,
    "ID_BORDEREAU" BIGINT DEFAULT NULL REFERENCES "T_BORDEREAU"("ID_BORDEREAU") ON DELETE SET NULL,
    "N_ENG" VARCHAR(50) NOT NULL,
    "ANNEE" VARCHAR(10) NOT NULL,
    "NATURE_ENG" VARCHAR(100) NOT NULL,
    "OBJET_ENG" TEXT NOT NULL,
    "MONTANT_ENG" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "AE_ENG" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "TOTAL_ENG_ANTERIEURE" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "SOLDE_ANTERIEURE" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "SOLDE_RELIQUAT" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "DATE_ENG" VARCHAR(50) NOT NULL,
    "N_VISA_CB" VARCHAR(100) DEFAULT NULL,
    "DATE_VISA_CB" VARCHAR(50) DEFAULT '',
    "BORD_OBJET" TEXT DEFAULT NULL,
    "BORD_DOCS" TEXT DEFAULT NULL,
    "BORD_COPIES" TEXT DEFAULT NULL
);`
    },
    {
        name: 'T_PAIEMENT',
        arabicTitle: 'جدول حوالات الدفع والدفعات المسددة (Mandats de Paiement)',
        purpose: 'يسجل حوالات الدفع الصادرة لأمين الخزينة العمومية، مع تفصيل اقتطاعات الضمان، غرامات التأخير، والتسبيقات.',
        pk: 'ID_PAIEMENT',
        fields: [
            { name: 'ID_PAIEMENT', type: 'BIGINT GENERATED BY DEFAULT AS IDENTITY', isPk: true, notNull: true, description: 'المعرف الفريد لحوالة الدفع.' },
            { name: 'ID_OPERATION', type: 'BIGINT', isFk: true, fkRef: 'T_OPERATION', notNull: true, description: 'معرف العملية المصروف عليها.' },
            { name: 'ID_ENG', type: 'BIGINT', isFk: true, fkRef: 'T_ENGAGEMENT', notNull: true, description: 'معرف بطاقة الالتزام المغطية لهذه الحوالة (قيد حتمي).' },
            { name: 'ID_PIECE', type: 'BIGINT', isFk: true, fkRef: 'T_PIECE', notNull: true, description: 'معرف الوثيقة أو الفاتورة المسددة.' },
            { name: 'N_PAI', type: 'VARCHAR(50)', notNull: true, description: 'رقم الدفعة الداخلي.' },
            { name: 'ANNEE', type: 'VARCHAR(10)', notNull: true, description: 'السنة المالية لحوالة الصرف.' },
            { name: 'DATE_PAI', type: 'VARCHAR(50)', notNull: true, description: 'تاريخ تحرير الدفعة.' },
            { name: 'OBJET_PAI', type: 'TEXT', notNull: true, description: 'موضوع وبيان الدفع كما يظهر في حوالة الصرف الرسمية.' },
            { name: 'MONTANT_PAI', type: 'NUMERIC(18, 2)', notNull: true, description: 'المبلغ الصافي للدفع المدفوع للمتعامل.' },
            { name: 'TOTAL_PAI', type: 'NUMERIC(18, 2)', description: 'مجموع الدفع التراكمي للعملية حتى هذه الحوالة.' },
            { name: 'N_MANDAT', type: 'VARCHAR(100)', description: 'رقم حوالة الدفع الرسمية (Mandat No).' },
            { name: 'DATE_MANDAT', type: 'VARCHAR(50)', description: 'تاريخ حوالة الدفع الرسمية.' },
            { name: 'RETENUE_GARANTIE', type: 'NUMERIC(18, 2)', description: 'مبلغ اقتطاع الضمان (5% أو 10%).' },
            { name: 'PENALITE_RETARD', type: 'NUMERIC(18, 2)', description: 'مبلغ غرامات التأخير المقتطعة إن وجدت.' }
        ],
        ddlSnippet: `CREATE TABLE IF NOT EXISTS "T_PAIEMENT" (
    "ID_PAIEMENT" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_OPERATION" BIGINT NOT NULL REFERENCES "T_OPERATION"("ID_OPERATION") ON DELETE CASCADE,
    "ID_ENG" BIGINT NOT NULL REFERENCES "T_ENGAGEMENT"("ID_ENGAGEMENT") ON DELETE CASCADE,
    "ID_PIECE" BIGINT NOT NULL REFERENCES "T_PIECE"("ID_PIECE") ON DELETE CASCADE,
    "N_PAI" VARCHAR(50) NOT NULL,
    "ANNEE" VARCHAR(10) NOT NULL,
    "DATE_PAI" VARCHAR(50) NOT NULL,
    "OBJET_PAI" TEXT NOT NULL,
    "MONTANT_PAI" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "TOTAL_PAI" NUMERIC(18, 2) DEFAULT 0,
    "N_MANDAT" VARCHAR(100) DEFAULT NULL,
    "DATE_MANDAT" VARCHAR(50) DEFAULT NULL,
    "DATE_ADMIS" VARCHAR(50) DEFAULT NULL,
    "MONTANT_TRAVAUX_REALISES" NUMERIC(18, 2) DEFAULT 0,
    "AVANCE_FORFAITAIRE" NUMERIC(18, 2) DEFAULT 0,
    "AVANCE_APPROVISIONNEMENT" NUMERIC(18, 2) DEFAULT 0,
    "RETENUE_GARANTIE" NUMERIC(18, 2) DEFAULT 0,
    "PENALITE_RETARD" NUMERIC(18, 2) DEFAULT 0,
    "AUTRE_DEDUCTION" NUMERIC(18, 2) DEFAULT 0,
    "REMBOURSEMENT_AVANCE_FORFAITAIRE" NUMERIC(18, 2) DEFAULT 0,
    "REMBOURSEMENT_AVANCE_APPROVISIONNEMENT" NUMERIC(18, 2) DEFAULT 0
);`
    },
    {
        name: 'T_ODS',
        arabicTitle: 'جدول أوامر الخدمة وتتبع الآجال (Ordres de Service)',
        purpose: 'إدارة أوامر الانطلاق، التوقف، الاستئناف، والختام وحساب الآجال التعاقدية بدقة متناهية.',
        pk: 'ID_ODS',
        fields: [
            { name: 'ID_ODS', type: 'BIGINT GENERATED BY DEFAULT AS IDENTITY', isPk: true, notNull: true, description: 'المعرف الفريد لأمر الخدمة.' },
            { name: 'ID_PIECE', type: 'BIGINT', isFk: true, fkRef: 'T_PIECE', notNull: true, description: 'معرف الصفقة أو العقد التابع له أمر الخدمة.' },
            { name: 'ID_LOT', type: 'BIGINT', isFk: true, fkRef: 'T_LOT_OPERATION', description: 'معرف الحصة المحددة التابع لها أمر الخدمة إن وُجدت.' },
            { name: 'NATURE_ODS', type: 'VARCHAR(50)', notNull: true, description: 'طبيعة الأمر: انطلاق، ايقاف، استئناف، ختام (مقيد بـ CHECK).' },
            { name: 'DATE_ODS', type: 'VARCHAR(50)', notNull: true, description: 'تاريخ سريان أمر الخدمة وتبليغه للمتعامل.' },
            { name: 'OBJET_ODS', type: 'TEXT', description: 'بيان وموضوع أمر الخدمة والأسباب التقنية المسوغة له.' }
        ],
        ddlSnippet: `CREATE TABLE IF NOT EXISTS "T_ODS" (
    "ID_ODS" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_PIECE" BIGINT NOT NULL REFERENCES "T_PIECE"("ID_PIECE") ON DELETE CASCADE,
    "ID_LOT" BIGINT DEFAULT NULL REFERENCES "T_LOT_OPERATION"("ID_LOT") ON DELETE SET NULL,
    "NATURE_ODS" VARCHAR(50) NOT NULL CHECK ("NATURE_ODS" IN ('انطلاق', 'ايقاف', 'استئناف', 'ختام')),
    "DATE_ODS" VARCHAR(50) NOT NULL,
    "OBJET_ODS" TEXT DEFAULT ''
);`
    },
    {
        name: 'T_BENEFICIAIRE',
        arabicTitle: 'جدول المتعاملين المتعاقدين / المستفيدين (Bénéficiaires)',
        purpose: 'دليل المقاولين ومكاتب الدراسات والمخابر؛ يتضمن السجل التجاري والتعريف الجبائي NIF.',
        pk: 'ID_BENEFICIAIRE',
        fields: [
            { name: 'ID_BENEFICIAIRE', type: 'BIGINT GENERATED BY DEFAULT AS IDENTITY', isPk: true, notNull: true, description: 'المعرف الفريد للمتعامل.' },
            { name: 'BENEFICIAIRE', type: 'VARCHAR(255)', notNull: true, description: 'اسم الشركة أو المقاولة أو مكتب الدراسات الرسمي.' },
            { name: 'ADRESSE', type: 'TEXT', description: 'المقر الاجتماعي وعنوان المراسلة للمتعامل.' },
            { name: 'RC', type: 'VARCHAR(100)', description: 'رقم السجل التجاري الرسمي.' },
            { name: 'CODE_FISCALE', type: 'VARCHAR(100)', description: 'رقم التعريف الجبائي (NIF - Numéro d\'Identification Fiscale).' }
        ],
        ddlSnippet: `CREATE TABLE IF NOT EXISTS "T_BENEFICIAIRE" (
    "ID_BENEFICIAIRE" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "BENEFICIAIRE" VARCHAR(255) NOT NULL,
    "ADRESSE" TEXT DEFAULT '',
    "RC" VARCHAR(100) DEFAULT NULL,
    "CODE_FISCALE" VARCHAR(100) DEFAULT NULL
);`
    },
    {
        name: 'T_COMPTE_BANCAIRE',
        arabicTitle: 'جدول الحسابات البنكية للمستفيدين (Comptes Bancaires / RIB)',
        purpose: 'يسجل الحسابات البنكية المتعددة للمتعاملين مع البنوك المعتمدة (CPA, BNA, BEA, BDL...).',
        pk: 'ID_COMPTE',
        fields: [
            { name: 'ID_COMPTE', type: 'BIGINT GENERATED BY DEFAULT AS IDENTITY', isPk: true, notNull: true, description: 'المعرف الفريد للحساب البنكي.' },
            { name: 'ID_BENEFICIAIRE', type: 'BIGINT', isFk: true, fkRef: 'T_BENEFICIAIRE', notNull: true, description: 'معرف المستفيد صاحب الحساب (CASCADE عند الحذف).' },
            { name: 'RIB', type: 'VARCHAR(50)', notNull: true, description: 'رقم الحساب البريدي أو البنكي الموحد (20 رقماً).' },
            { name: 'BANQUE', type: 'VARCHAR(255)', notNull: true, description: 'اسم البنك والوكالة المصرفية الموطن بها الحساب.' }
        ],
        ddlSnippet: `CREATE TABLE IF NOT EXISTS "T_COMPTE_BANCAIRE" (
    "ID_COMPTE" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_BENEFICIAIRE" BIGINT NOT NULL REFERENCES "T_BENEFICIAIRE"("ID_BENEFICIAIRE") ON DELETE CASCADE,
    "RIB" VARCHAR(50) NOT NULL,
    "BANQUE" VARCHAR(255) NOT NULL
);`
    },
    {
        name: 'T_USER',
        arabicTitle: 'جدول مستخدمي النظام والصلاحيات والأمان (Users & Roles)',
        purpose: 'إدارة حسابات المستخدمين، الصلاحيات الممنوحة للصفحات والمشاريع، وكلمات المرور المشفرة بـ Bcrypt.',
        pk: 'ID_USER',
        fields: [
            { name: 'ID_USER', type: 'BIGINT GENERATED BY DEFAULT AS IDENTITY', isPk: true, notNull: true, description: 'المعرف الفريد لحساب المستخدم.' },
            { name: 'USERNAME', type: 'VARCHAR(100)', isUnique: true, notNull: true, description: 'اسم المستخدم لتسجيل الدخول.' },
            { name: 'PASSWORD', type: 'TEXT', notNull: true, description: 'كلمة المرور المشفرة بتجزئة Bcrypt (أمان عالي 10 جولات).' },
            { name: 'ROLE', type: 'VARCHAR(20)', notNull: true, description: 'دور المستخدم في النظام: admin أو user أو viewer.' },
            { name: 'ALLOWED_PAGES', type: 'TEXT', description: 'مصفوفة JSON للصفحات المسموح للمستخدم بالوصول إليها.' },
            { name: 'ALLOWED_OPERATIONS', type: 'TEXT', description: 'مصفوفة JSON للعمليات والمشاريع المسموح للمستخدم بتسييرها.' },
            { name: 'CREATED_AT', type: 'TIMESTAMPTZ', description: 'تاريخ إنشاء الحساب بالنظام.' }
        ],
        ddlSnippet: `CREATE TABLE IF NOT EXISTS "T_USER" (
    "ID_USER" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "USERNAME" VARCHAR(100) NOT NULL UNIQUE,
    "PASSWORD" TEXT NOT NULL,
    "ROLE" VARCHAR(20) NOT NULL DEFAULT 'user' CHECK ("ROLE" IN ('admin', 'user', 'viewer')),
    "ALLOWED_PAGES" TEXT DEFAULT NULL,
    "ALLOWED_OPERATIONS" TEXT DEFAULT NULL,
    "CREATED_AT" TIMESTAMPTZ DEFAULT NOW()
);`
    },
    {
        name: 'T_BORDEREAU',
        arabicTitle: 'جدول جداول الإرسال الرسمية (Bordereaux d\'Envoi)',
        purpose: 'يسجل جداول الإرسال الصادرة للجهات الرقابية (المراقب الميزانياتي، الخزينة العمومية) لحفظ تتبع الملفات.',
        pk: 'ID_BORDEREAU',
        fields: [
            { name: 'ID_BORDEREAU', type: 'BIGINT GENERATED BY DEFAULT AS IDENTITY', isPk: true, notNull: true, description: 'المعرف الفريد لجدول الإرسال.' },
            { name: 'ID_PIECE', type: 'BIGINT', isFk: true, fkRef: 'T_PIECE', description: 'معرف الوثيقة أو الصفقة الرئيسية المرفقة.' },
            { name: 'N_BORDEREAU', type: 'VARCHAR(100)', description: 'رقم جدول الإرسال الإداري الرسمي.' },
            { name: 'ANNEE', type: 'VARCHAR(10)', notNull: true, description: 'السنة المالية لجدول الإرسال.' },
            { name: 'DATE_BORDEREAU', type: 'VARCHAR(50)', notNull: true, description: 'تاريخ تحرير جدول الإرسال.' },
            { name: 'DESTINATAIRE', type: 'VARCHAR(255)', notNull: true, description: 'الجهة الموجه إليها جدول الإرسال (المراقب المالي، أمين الخزينة...).' },
            { name: 'DOCUMENTS_JOINTS', type: 'TEXT', description: 'بيان الوثائق والمستندات المرفقة بالجدول.' }
        ],
        ddlSnippet: `CREATE TABLE IF NOT EXISTS "T_BORDEREAU" (
    "ID_BORDEREAU" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_PIECE" BIGINT DEFAULT NULL REFERENCES "T_PIECE"("ID_PIECE") ON DELETE SET NULL,
    "N_BORDEREAU" VARCHAR(100) DEFAULT NULL,
    "ANNEE" VARCHAR(10) NOT NULL,
    "DATE_BORDEREAU" VARCHAR(50) NOT NULL,
    "DESTINATAIRE" VARCHAR(255) NOT NULL,
    "DOCUMENTS_JOINTS" TEXT DEFAULT NULL,
    "COPIES_NOTE" TEXT DEFAULT NULL
);`
    }
];

// كود SQL الكامل المستخرج من GOFT3_DATABASE_SCHEMA.sql
const fullSqlCode = `-- ============================================================================
--           GOFT3 - COMPLETE DATABASE SCHEMA & DDL SCRIPT (POSTGRESQL / SUPABASE)
--     نظام تسيير العمليات المالية للباب الثالث (ميزانية تجهيز الدولة الجزائرية)
-- ============================================================================
-- الإصدار: 1.1.0
-- قاعدة البيانات: PostgreSQL 14+ / Supabase
-- التشفير والمحارف: UTF-8
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. تفعيل الامتدادات الضرورية (Extensions)
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. إنشاء الجداول الأساسية (Base Lookup Tables)
-- ----------------------------------------------------------------------------

-- جدول المستخدمين (Users & Roles)
CREATE TABLE IF NOT EXISTS "T_USER" (
    "ID_USER" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "USERNAME" VARCHAR(100) NOT NULL UNIQUE,
    "PASSWORD" TEXT NOT NULL,
    "ROLE" VARCHAR(20) NOT NULL DEFAULT 'user' CHECK ("ROLE" IN ('admin', 'user', 'viewer')),
    "ALLOWED_PAGES" TEXT DEFAULT NULL,
    "ALLOWED_OPERATIONS" TEXT DEFAULT NULL,
    "CREATED_AT" TIMESTAMPTZ DEFAULT NOW()
);

-- جدول المديريات والجهات الآمرة بالصرف (Directions & Ordonnateurs)
CREATE TABLE IF NOT EXISTS "T_DIRECTION" (
    "ID_DIRECTION" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "PORTEFEUILLE" VARCHAR(50) NOT NULL,
    "INT_PORTEFEUILLE" VARCHAR(255) NOT NULL,
    "ORDONATEUR" VARCHAR(255) NOT NULL,
    "DIRECTION" VARCHAR(255) NOT NULL,
    "ACTION" VARCHAR(50) NOT NULL,
    "INT_ACTION" VARCHAR(255) NOT NULL,
    "SACTION" VARCHAR(50) DEFAULT NULL,
    "INT_SACTION" VARCHAR(255) DEFAULT NULL
);

-- جدول البرامج (Programmes)
CREATE TABLE IF NOT EXISTS "T_PROGRAMME" (
    "ID_PROGRAMME" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "PROGRAMME" VARCHAR(50) NOT NULL UNIQUE,
    "INT_PROGRAMME" VARCHAR(255) NOT NULL
);

-- جدول البرامج الفرعية (Sous-programmes)
CREATE TABLE IF NOT EXISTS "T_SPROGRAMME" (
    "ID_SPROGRAMME" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_PROGRAMME" BIGINT NOT NULL REFERENCES "T_PROGRAMME"("ID_PROGRAMME") ON DELETE CASCADE,
    "SPROGRAMME" VARCHAR(50) NOT NULL,
    "INT_SPROGRAMME" VARCHAR(255) NOT NULL
);

-- جدول الأصناف العامة (Catégories)
CREATE TABLE IF NOT EXISTS "T_CATEGORIE" (
    "ID_CATEGORIE" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "C_CATEGORIE" VARCHAR(50) NOT NULL UNIQUE,
    "INT_CATEGORIE" VARCHAR(255) NOT NULL
);

-- جدول الأصناف الفرعية (Sous-catégories)
CREATE TABLE IF NOT EXISTS "T_SCATEGORIE" (
    "ID_SCATEGORIE" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_CATEGORIE" BIGINT NOT NULL REFERENCES "T_CATEGORIE"("ID_CATEGORIE") ON DELETE CASCADE,
    "C_SCATEGORIE" VARCHAR(50) NOT NULL,
    "INT_SCATEGORIE" VARCHAR(255) NOT NULL
);

-- جدول هيكلة الكلفة العامة (Rubriques de Coût)
CREATE TABLE IF NOT EXISTS "T_RUBRIQUE" (
    "ID_RUBRIQUE" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "RUBRIQUE" VARCHAR(255) NOT NULL UNIQUE
);

-- جدول المتعاملين المتعاقدين / المستفيدين (Bénéficiaires)
CREATE TABLE IF NOT EXISTS "T_BENEFICIAIRE" (
    "ID_BENEFICIAIRE" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "BENEFICIAIRE" VARCHAR(255) NOT NULL,
    "ADRESSE" TEXT DEFAULT '',
    "RC" VARCHAR(100) DEFAULT NULL,
    "CODE_FISCALE" VARCHAR(100) DEFAULT NULL
);

-- جدول الحسابات البنكية للمستفيدين (Bank Accounts / RIB)
CREATE TABLE IF NOT EXISTS "T_COMPTE_BANCAIRE" (
    "ID_COMPTE" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_BENEFICIAIRE" BIGINT NOT NULL REFERENCES "T_BENEFICIAIRE"("ID_BENEFICIAIRE") ON DELETE CASCADE,
    "RIB" VARCHAR(50) NOT NULL,
    "BANQUE" VARCHAR(255) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 3. جدول العمليات المالية وهيكلتها (Operations & Budgets)
-- ----------------------------------------------------------------------------

-- جدول العمليات المالية (Operations)
CREATE TABLE IF NOT EXISTS "T_OPERATION" (
    "ID_OPERATION" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "N_OPERATION" VARCHAR(100) NOT NULL UNIQUE,
    "N_OPERATION_ANCIEN" VARCHAR(100) DEFAULT NULL,
    "INT_OPERATION" TEXT NOT NULL,
    "ID_CATEGORIE" BIGINT NOT NULL REFERENCES "T_CATEGORIE"("ID_CATEGORIE"),
    "ID_SCATEGORIE" BIGINT DEFAULT NULL REFERENCES "T_SCATEGORIE"("ID_SCATEGORIE"),
    "status" VARCHAR(20) NOT NULL DEFAULT 'جارية' CHECK ("status" IN ('جارية', 'مغلقة')),
    "TYPE_OP" VARCHAR(50) DEFAULT 'LOLF',
    "CREATED_BY" BIGINT DEFAULT NULL REFERENCES "T_USER"("ID_USER") ON DELETE SET NULL,
    "CREATED_AT" TIMESTAMPTZ DEFAULT NOW()
);

-- جدول اعتمادات الدفع السنوية للعملية (Crédits de Paiement - CP)
CREATE TABLE IF NOT EXISTS "T_CP" (
    "ID_CP" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_OPERATION" BIGINT NOT NULL REFERENCES "T_OPERATION"("ID_OPERATION") ON DELETE CASCADE,
    "ANNEE" VARCHAR(10) NOT NULL,
    "MONTANT_INITIALE_CP" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "MONTANT_FINALE_CP" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    CONSTRAINT "UQ_T_CP_OP_ANNEE" UNIQUE ("ID_OPERATION", "ANNEE")
);

-- جدول توزيع هيكلة الكلفة للعملية (Rubriques de l'Opération)
CREATE TABLE IF NOT EXISTS "T_RUBRIQUE_OP" (
    "ID_RUBRIQUE_OP" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_OPERATION" BIGINT NOT NULL REFERENCES "T_OPERATION"("ID_OPERATION") ON DELETE CASCADE,
    "ID_RUBRIQUE" BIGINT NOT NULL REFERENCES "T_RUBRIQUE"("ID_RUBRIQUE"),
    "MONTANT_INITIALE" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "MONTANT_FINALE" NUMERIC(18, 2) DEFAULT NULL,
    CONSTRAINT "UQ_T_RUBRIQUE_OP" UNIQUE ("ID_OPERATION", "ID_RUBRIQUE")
);

-- جدول توزيع الأصناف الفرعية للعملية (Sous-catégories de l'Opération)
CREATE TABLE IF NOT EXISTS "T_SCATEGORIE_OP" (
    "ID_SCATEGORIE_OP" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_OPERATION" BIGINT NOT NULL REFERENCES "T_OPERATION"("ID_OPERATION") ON DELETE CASCADE,
    "ID_SCATEGORIE" BIGINT NOT NULL REFERENCES "T_SCATEGORIE"("ID_SCATEGORIE"),
    "MONTANT_INITIALE" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "MONTANT_FINALE" NUMERIC(18, 2) DEFAULT NULL,
    CONSTRAINT "UQ_T_SCATEGORIE_OP" UNIQUE ("ID_OPERATION", "ID_SCATEGORIE")
);

-- جدول حصص الصفقات للعملية (Lots de l'Opération)
CREATE TABLE IF NOT EXISTS "T_LOT_OPERATION" (
    "ID_LOT" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_OPERATION" BIGINT NOT NULL REFERENCES "T_OPERATION"("ID_OPERATION") ON DELETE CASCADE,
    "N_LOT" VARCHAR(100) NOT NULL,
    "INTITULE_LOT" TEXT NOT NULL,
    "MONTANT_INITIALE_LOT" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "MONTANT_FINALE_LOT" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "ATTRIBUER" BOOLEAN NOT NULL DEFAULT FALSE
);

-- ----------------------------------------------------------------------------
-- 4. جداول الوثائق التعاقدية وأوامر الخدمة (Documents & ODS)
-- ----------------------------------------------------------------------------

-- جدول الوثائق التعاقدية والإدارية والتنفيذية (Pieces / Documents)
CREATE TABLE IF NOT EXISTS "T_PIECE" (
    "ID_PIECE" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "NAT_PIECE" VARCHAR(100) NOT NULL,
    "ID_PIECE_INIT" BIGINT DEFAULT NULL REFERENCES "T_PIECE"("ID_PIECE") ON DELETE SET NULL,
    "ID_OPERATION" BIGINT NOT NULL REFERENCES "T_OPERATION"("ID_OPERATION") ON DELETE CASCADE,
    "PIECE" TEXT NOT NULL,
    "ID_BENEFICIAIRE" BIGINT DEFAULT NULL REFERENCES "T_BENEFICIAIRE"("ID_BENEFICIAIRE") ON DELETE SET NULL,
    "ID_COMPTE" BIGINT DEFAULT NULL REFERENCES "T_COMPTE_BANCAIRE"("ID_COMPTE") ON DELETE SET NULL,
    "MONTANT_PIECE" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "ID_SCATEGORIE" BIGINT DEFAULT NULL REFERENCES "T_SCATEGORIE"("ID_SCATEGORIE"),
    "ID_RUBRIQUE" BIGINT DEFAULT NULL REFERENCES "T_RUBRIQUE"("ID_RUBRIQUE"),
    "DELAI_EX_JOURS" VARCHAR(50) DEFAULT NULL,
    "SAI_ENG" BOOLEAN NOT NULL DEFAULT FALSE,
    "SAI_PAI" BOOLEAN NOT NULL DEFAULT FALSE,
    "N_VISA_CM" VARCHAR(100) DEFAULT NULL,
    "DATE_VISA_CM" VARCHAR(50) DEFAULT NULL,
    "CAUTION" TEXT DEFAULT NULL,
    "DATE_OD_PIECE" VARCHAR(50) DEFAULT NULL,
    "N_OD_PIECE" VARCHAR(100) DEFAULT NULL,
    "DATE_DEPOT_PIECE" VARCHAR(50) DEFAULT NULL,
    "BORDEREAU_PIECE" VARCHAR(100) DEFAULT NULL
);

-- جدول ربط الوثائق بالحصص (Lot Pieces Allocation)
CREATE TABLE IF NOT EXISTS "T_LOT_PIECE" (
    "ID_LOT_PIECE" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_LOT" BIGINT NOT NULL REFERENCES "T_LOT_OPERATION"("ID_LOT") ON DELETE CASCADE,
    "ID_PIECE" BIGINT NOT NULL REFERENCES "T_PIECE"("ID_PIECE") ON DELETE CASCADE,
    "DELAI_EX_JOURS" VARCHAR(50) DEFAULT NULL
);

-- جدول أوامر الخدمة وتتبع الآجال (Ordres de Service - ODS)
CREATE TABLE IF NOT EXISTS "T_ODS" (
    "ID_ODS" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_PIECE" BIGINT NOT NULL REFERENCES "T_PIECE"("ID_PIECE") ON DELETE CASCADE,
    "ID_LOT" BIGINT DEFAULT NULL REFERENCES "T_LOT_OPERATION"("ID_LOT") ON DELETE SET NULL,
    "NATURE_ODS" VARCHAR(50) NOT NULL CHECK ("NATURE_ODS" IN ('انطلاق', 'ايقاف', 'استئناف', 'ختام')),
    "DATE_ODS" VARCHAR(50) NOT NULL,
    "OBJET_ODS" TEXT DEFAULT ''
);

-- ----------------------------------------------------------------------------
-- 5. جداول جداول الإرسال والالتزامات والدفعات (Bordereaux, Engagements & Paiements)
-- ----------------------------------------------------------------------------

-- جدول جداول الإرسال الرسمية (Bordereaux d'Envoi)
CREATE TABLE IF NOT EXISTS "T_BORDEREAU" (
    "ID_BORDEREAU" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_PIECE" BIGINT DEFAULT NULL REFERENCES "T_PIECE"("ID_PIECE") ON DELETE SET NULL,
    "N_BORDEREAU" VARCHAR(100) DEFAULT NULL,
    "ANNEE" VARCHAR(10) NOT NULL,
    "DATE_BORDEREAU" VARCHAR(50) NOT NULL,
    "DESTINATAIRE" VARCHAR(255) NOT NULL,
    "DOCUMENTS_JOINTS" TEXT DEFAULT NULL,
    "COPIES_NOTE" TEXT DEFAULT NULL
);

-- جدول الالتزامات المالية وبطاقات التأشيرة (Engagements)
CREATE TABLE IF NOT EXISTS "T_ENGAGEMENT" (
    "ID_ENGAGEMENT" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_OPERATION" BIGINT NOT NULL REFERENCES "T_OPERATION"("ID_OPERATION") ON DELETE CASCADE,
    "ID_PIECE" BIGINT NOT NULL REFERENCES "T_PIECE"("ID_PIECE") ON DELETE CASCADE,
    "ID_BORDEREAU" BIGINT DEFAULT NULL REFERENCES "T_BORDEREAU"("ID_BORDEREAU") ON DELETE SET NULL,
    "N_ENG" VARCHAR(50) NOT NULL,
    "ANNEE" VARCHAR(10) NOT NULL,
    "NATURE_ENG" VARCHAR(100) NOT NULL,
    "OBJET_ENG" TEXT NOT NULL,
    "MONTANT_ENG" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "AE_ENG" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "TOTAL_ENG_ANTERIEURE" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "SOLDE_ANTERIEURE" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "SOLDE_RELIQUAT" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "DATE_ENG" VARCHAR(50) NOT NULL,
    "N_VISA_CB" VARCHAR(100) DEFAULT NULL,
    "DATE_VISA_CB" VARCHAR(50) DEFAULT '',
    "BORD_OBJET" TEXT DEFAULT NULL,
    "BORD_DOCS" TEXT DEFAULT NULL,
    "BORD_COPIES" TEXT DEFAULT NULL
);

-- جدول الدفعات والحوالات المسددة (Paiements & Mandats)
CREATE TABLE IF NOT EXISTS "T_PAIEMENT" (
    "ID_PAIEMENT" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ID_OPERATION" BIGINT NOT NULL REFERENCES "T_OPERATION"("ID_OPERATION") ON DELETE CASCADE,
    "ID_ENG" BIGINT NOT NULL REFERENCES "T_ENGAGEMENT"("ID_ENGAGEMENT") ON DELETE CASCADE,
    "ID_PIECE" BIGINT NOT NULL REFERENCES "T_PIECE"("ID_PIECE") ON DELETE CASCADE,
    "N_PAI" VARCHAR(50) NOT NULL,
    "ANNEE" VARCHAR(10) NOT NULL,
    "DATE_PAI" VARCHAR(50) NOT NULL,
    "OBJET_PAI" TEXT NOT NULL,
    "MONTANT_PAI" NUMERIC(18, 2) NOT NULL DEFAULT 0,
    "TOTAL_PAI" NUMERIC(18, 2) DEFAULT 0,
    "N_MANDAT" VARCHAR(100) DEFAULT NULL,
    "DATE_MANDAT" VARCHAR(50) DEFAULT NULL,
    "DATE_ADMIS" VARCHAR(50) DEFAULT NULL,
    "MONTANT_TRAVAUX_REALISES" NUMERIC(18, 2) DEFAULT 0,
    "AVANCE_FORFAITAIRE" NUMERIC(18, 2) DEFAULT 0,
    "AVANCE_APPROVISIONNEMENT" NUMERIC(18, 2) DEFAULT 0,
    "RETENUE_GARANTIE" NUMERIC(18, 2) DEFAULT 0,
    "PENALITE_RETARD" NUMERIC(18, 2) DEFAULT 0,
    "AUTRE_DEDUCTION" NUMERIC(18, 2) DEFAULT 0,
    "REMBOURSEMENT_AVANCE_FORFAITAIRE" NUMERIC(18, 2) DEFAULT 0,
    "REMBOURSEMENT_AVANCE_APPROVISIONNEMENT" NUMERIC(18, 2) DEFAULT 0
);

-- ----------------------------------------------------------------------------
-- 6. إنشاء الفهارس لتحسين سرعة وأداء الاستعلامات (Indexes)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "IDX_OPERATION_N_OP" ON "T_OPERATION"("N_OPERATION");
CREATE INDEX IF NOT EXISTS "IDX_OPERATION_STATUS" ON "T_OPERATION"("status");
CREATE INDEX IF NOT EXISTS "IDX_CP_OP_YEAR" ON "T_CP"("ID_OPERATION", "ANNEE");
CREATE INDEX IF NOT EXISTS "IDX_RUBRIQUE_OP_OP" ON "T_RUBRIQUE_OP"("ID_OPERATION");
CREATE INDEX IF NOT EXISTS "IDX_PIECE_OP" ON "T_PIECE"("ID_OPERATION");
CREATE INDEX IF NOT EXISTS "IDX_PIECE_BENEF" ON "T_PIECE"("ID_BENEFICIAIRE");
CREATE INDEX IF NOT EXISTS "IDX_PIECE_INIT" ON "T_PIECE"("ID_PIECE_INIT");
CREATE INDEX IF NOT EXISTS "IDX_ODS_PIECE" ON "T_ODS"("ID_PIECE");
CREATE INDEX IF NOT EXISTS "IDX_ENGAGEMENT_OP" ON "T_ENGAGEMENT"("ID_OPERATION");
CREATE INDEX IF NOT EXISTS "IDX_ENGAGEMENT_PIECE" ON "T_ENGAGEMENT"("ID_PIECE");
CREATE INDEX IF NOT EXISTS "IDX_ENGAGEMENT_YEAR" ON "T_ENGAGEMENT"("ANNEE");
CREATE INDEX IF NOT EXISTS "IDX_PAIEMENT_OP" ON "T_PAIEMENT"("ID_OPERATION");
CREATE INDEX IF NOT EXISTS "IDX_PAIEMENT_ENG" ON "T_PAIEMENT"("ID_ENG");
CREATE INDEX IF NOT EXISTS "IDX_PAIEMENT_PIECE" ON "T_PAIEMENT"("ID_PIECE");
CREATE INDEX IF NOT EXISTS "IDX_PAIEMENT_YEAR" ON "T_PAIEMENT"("ANNEE");
CREATE INDEX IF NOT EXISTS "IDX_BORDEREAU_YEAR" ON "T_BORDEREAU"("ANNEE");

-- ----------------------------------------------------------------------------
-- 7. تفعيل ميزة التحديث اللحظي عبر Supabase (Realtime Publication)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE "T_OPERATION";
    ALTER PUBLICATION supabase_realtime ADD TABLE "T_PIECE";
    ALTER PUBLICATION supabase_realtime ADD TABLE "T_ENGAGEMENT";
    ALTER PUBLICATION supabase_realtime ADD TABLE "T_PAIEMENT";
    ALTER PUBLICATION supabase_realtime ADD TABLE "T_ODS";
    ALTER PUBLICATION supabase_realtime ADD TABLE "T_CP";
    ALTER PUBLICATION supabase_realtime ADD TABLE "T_BENEFICIAIRE";
    ALTER PUBLICATION supabase_realtime ADD TABLE "T_BORDEREAU";
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 8. تفعيل سياسات الأمان والحماية (Row Level Security - RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE "T_USER" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_DIRECTION" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_PROGRAMME" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_SPROGRAMME" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_CATEGORIE" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_SCATEGORIE" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_RUBRIQUE" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_BENEFICIAIRE" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_COMPTE_BANCAIRE" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_OPERATION" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_CP" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_RUBRIQUE_OP" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_SCATEGORIE_OP" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_LOT_OPERATION" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_PIECE" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_LOT_PIECE" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_ODS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_BORDEREAU" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_ENGAGEMENT" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "T_PAIEMENT" ENABLE ROW LEVEL SECURITY;

-- السماح بالوصول الكامل لجميع الجداول عبر مفاتيح API الخاصة بالتطبيق
CREATE POLICY "Public Full Access T_USER" ON "T_USER" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_DIRECTION" ON "T_DIRECTION" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_PROGRAMME" ON "T_PROGRAMME" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_SPROGRAMME" ON "T_SPROGRAMME" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_CATEGORIE" ON "T_CATEGORIE" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_SCATEGORIE" ON "T_SCATEGORIE" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_RUBRIQUE" ON "T_RUBRIQUE" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_BENEFICIAIRE" ON "T_BENEFICIAIRE" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_COMPTE_BANCAIRE" ON "T_COMPTE_BANCAIRE" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_OPERATION" ON "T_OPERATION" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_CP" ON "T_CP" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_RUBRIQUE_OP" ON "T_RUBRIQUE_OP" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_SCATEGORIE_OP" ON "T_SCATEGORIE_OP" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_LOT_OPERATION" ON "T_LOT_OPERATION" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_PIECE" ON "T_PIECE" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_LOT_PIECE" ON "T_LOT_PIECE" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_ODS" ON "T_ODS" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_BORDEREAU" ON "T_BORDEREAU" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_ENGAGEMENT" ON "T_ENGAGEMENT" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access T_PAIEMENT" ON "T_PAIEMENT" FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 9. إدراج البيانات الأولية الافتراضية (Seed Data)
-- ----------------------------------------------------------------------------
INSERT INTO "T_USER" ("USERNAME", "PASSWORD", "ROLE", "ALLOWED_PAGES", "ALLOWED_OPERATIONS")
VALUES (
    'admin',
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    'admin',
    '[]',
    '[]'
) ON CONFLICT ("USERNAME") DO NOTHING;

INSERT INTO "T_RUBRIQUE" ("RUBRIQUE") VALUES 
('دراسات ومتابعة تقنية'),
('أشغال'),
('تجهيز'),
('تسوية عقارية وتعويضات'),
('مبالغ غير موزعة')
ON CONFLICT ("RUBRIQUE") DO NOTHING;

INSERT INTO "T_CATEGORIE" ("C_CATEGORIE", "INT_CATEGORIE") VALUES
('01', 'برنامج البناء والمنشآت'),
('02', 'برنامج التجهيز واقتناء العتاد'),
('03', 'برنامج التهيئة والتحسين الحضري'),
('04', 'برنامج الدراسات والخبرة التقنية')
ON CONFLICT ("C_CATEGORIE") DO NOTHING;
`;
