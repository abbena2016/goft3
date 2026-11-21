import React from 'react';
import { VisualWindow } from './VisualWindow';

export const ScreensGuide: React.FC = () => {
    return (
        <div className="space-y-16 py-4">
            
            {/* المقدمة التوضيحية للدليل المصور */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-blue-700/50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                            الدليل التشغيلي الميداني بالصور الحقيقية
                        </span>
                        <h2 className="text-2xl font-black mt-2 text-white">الدليل الشامل المصور لنظام GOFT3</h2>
                        <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
                            شرح تفصيلي ودقيق لكيفية استخدام النظام خطوة بخطوة، مدعوماً بالصور الحقيقية لجميع الشاشات والنوافذ والمطبوعات الرسمية الـ 34، مع بيان المسارات المحاسبية والقواعد الرقابية وفق القانون 23-07.
                        </p>
                    </div>
                    <div className="flex sm:flex-col items-center gap-2 shrink-0">
                        <span className="text-center px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-xs font-bold text-amber-300">
                            34 صورة وواجهة حقيقية
                        </span>
                        <span className="text-center px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-xs font-bold text-blue-200">
                            8 أبواب تفصيلية
                        </span>
                    </div>
                </div>
            </div>

            {/* الباب الأول: شاشة تسجيل الدخول والشاشة الرئيسية */}
            <div id="screen-login-section" className="space-y-8 pt-4">
                <div className="border-b-2 border-blue-600 pb-2 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shadow">01</span>
                        <span>الباب الأول: تسجيل الدخول ولوحة القيادة المركزية</span>
                    </h3>
                    <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-lg border border-blue-200">
                        المدخل الآمن والرقابة الاستباقية
                    </span>
                </div>

                {/* 1. نافذة تسجيل الدخول */}
                <div id="screen-login" className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-shield-lock-fill text-blue-600"></i>
                        <span>1. نافذة تسجيل الدخول إلى النظام (Connexion)</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                        بوابة التحقق الأمنية الأولى للنظام. تدعم تشفير كلمات المرور بأحدث معايير الأمان العالمية <strong>Bcrypt</strong> مع 10 جولات توليد (Salt Rounds).
                    </p>

                    <VisualWindow
                        title="GOFT3 - تسجيل الدخول"
                        subtitle="النافذة المنبثقة لتسجيل الدخول والتحقق من حساب المستخدم"
                        badge="Bcrypt Encrypted"
                        badgeColor="bg-emerald-100 text-emerald-800 border-emerald-300"
                        imageSrc="نافذة تسجيل الدخول.PNG"
                        imageAlt="نافذة تسجيل الدخول"
                        callouts={[
                            { number: 1, text: "شعار العنوان الثالث (T3): الرمز الرسمي لنفقات الاستثمار في الميزانية العامة." },
                            { number: 2, text: "حقل اسم المستخدم: إدخال المعرف المعتمد للموظف (مثال: admin)." },
                            { number: 3, text: "حقل كلمة المرور: تشفير آمن يحمي من هجمات القوة الغاشمة والجداول المعكوسة." },
                            { number: 4, text: "زر دخول: فحص الاعتماد مع الترقية التلقائية الفورية للحسابات القديمة." }
                        ]}
                    >
                        <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                            <span className="font-bold text-blue-900 block">خطوات الاستخدام:</span>
                            <ol className="list-decimal list-inside space-y-1 text-slate-700">
                                <li>كتابة اسم المستخدم وكلمة المرور في الحقول المخصصة.</li>
                                <li>الضغط على زر «دخول» للولوج إلى بيئة العمل وفق الصلاحيات المقررة لدورك (مدير، مستخدم، أو ملاحظ).</li>
                                <li>في حال انقطاع الإنترنت، يتحول النظام تلقائياً وبسلاسة إلى وضع العمل دون اتصال (Offline Mode).</li>
                            </ol>
                        </div>
                    </VisualWindow>
                </div>

                {/* 2. الشاشة الرئيسية */}
                <div id="screen-home" className="space-y-3 pt-6 border-t border-slate-200">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-speedometer2 text-blue-600"></i>
                        <span>2. الشاشة الرئيسية ولوحة القيادة ومركز التنبيهات الميزانياتية</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                        مركز المراقبة اللحظية الشامل الذي يربط كافة أقسام التطبيق ويعرض التنبيهات الاستباقية والمستخدمين المتصلين في نفس اللحظة.
                    </p>

                    <VisualWindow
                        title="تسيير العمليات المالية لنفقات الإستثمار - الشاشة الرئيسية"
                        subtitle="لوحة القيادة المركزية، بطاقات الأقسام الـ 5، ومركز التنبيهات الميزانياتية"
                        badge="مزامنة حية Realtime"
                        badgeColor="bg-blue-100 text-blue-800 border-blue-300"
                        imageSrc="الشاشة الرئيسية.PNG"
                        imageAlt="الشاشة الرئيسية"
                        callouts={[
                            { number: 1, text: "بطاقة العمليات (أزرق): فتح سجل العمليات الاستثمارية ومتابعة الهيكلة." },
                            { number: 2, text: "بطاقة الوثائق (أزرق داكن): تسيير الصفقات، الملاحق، والفواتير (+1097 وثيقة)." },
                            { number: 3, text: "بطاقة المستفيدين (أخضر تيل): سجل المقاولين ومكاتب الدراسات والـ RIB." },
                            { number: 4, text: "بطاقة الوضعية المالية (سماوي): الكشوفات الشهرية والسنوية الموقوفة." },
                            { number: 5, text: "بطاقة الإعدادات (رمادي): النسخ الاحتياطي، تحديث البرنامج، والصلاحيات." },
                            { number: 6, text: "شريط التنبيهات الملون: تنبيهات مالية (3)، نقص رخصة (21)، التزامات غير مؤشرة (19)، دفعات غير مقبولة (10)، وثائق غير مسجلة (31)، آجال متجاوزة (13)." },
                            { number: 7, text: "المستخدمون المتصلون الآن: عرض فوري للمتصلين (admin مسؤول، haloui مستخدم)." },
                            { number: 8, text: "مؤشر الربط السحابي: شارة 'متصل' خضراء تبين سلامة الاتصال بقاعدة البيانات." }
                        ]}
                    >
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                            <strong>ميزة البحث الفوري الشامل (Ctrl + K):</strong> عند الضغط على اختصار لوحة المفاتيح <kbd className="bg-white px-2 py-0.5 rounded border border-blue-300 font-mono text-[11px] shadow-sm">Ctrl + K</kbd> أو أيقونة العدسة، تنبثق نافذة البحث السريع للوصول إلى أي عملية، صفقة، أو مقاول خلال أجزاء من الثانية.
                        </div>
                    </VisualWindow>
                </div>
            </div>

            {/* الباب الثاني: تسيير العمليات الاستثمارية وهيكلة الكلفة */}
            <div id="screen-operations-section" className="space-y-8 pt-8 border-t-2 border-slate-300">
                <div className="border-b-2 border-indigo-600 pb-2 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow">02</span>
                        <span>الباب الثاني: تسيير العمليات الاستثمارية وتفاصيلها وهيكلة الكلفة</span>
                    </h3>
                    <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-lg border border-indigo-200">
                        إدارة الغلاف المالي والرخص
                    </span>
                </div>

                {/* 3. صفحة العمليات */}
                <div id="screen-operations" className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-kanban text-indigo-600"></i>
                        <span>3. صفحة العمليات المالية وسجل المتابعة</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                        سجل العمليات الاستثمارية المفتوحة بالولاية، مع إحصائيات مالية إجمالية مجمعة تبرز رخص الالتزام، الالتزامات الصادرة، المدفوعات، وباقي اعتمادات الدفع.
                    </p>

                    <VisualWindow
                        title="صفحة العمليات - جدول المتابعة الميزانياتي"
                        subtitle="تصفية حسب السنة والنشاط، أزرار الإضافة والتصدير، والمؤشرات المجمعة"
                        badge="سجل مركزي"
                        badgeColor="bg-indigo-100 text-indigo-800 border-indigo-300"
                        imageSrc="صفحة العمليات.PNG"
                        imageAlt="صفحة العمليات"
                        callouts={[
                            { number: 1, text: "شريط الفلاتر: تصفية حسب السنة المالية (2026)، النشاط (النشاط 2048 - 26 عملية)، ونوع العملية." },
                            { number: 2, text: "أزرار التحكم: إضافة، استيراد، تصدير إلى Excel، طباعة، تعديل، وحذف." },
                            { number: 3, text: "بطاقة رخصة الالتزام النهائية الإجمالية: 10.385.293.661,62 دج." },
                            { number: 4, text: "بطاقة إجمالي الالتزامات: 6.161.815.226,77 دج." },
                            { number: 5, text: "بطاقة إجمالي المدفوعات: 3.588.958.058,55 دج." },
                            { number: 6, text: "بطاقة إعتماد الدفع للسنة: 814.649.642,00 دج." },
                            { number: 7, text: "شريط المجموع العام السفلي الداكن: ملخص البواقي المالية المحدث تلقائياً." }
                        ]}
                    />
                </div>

                {/* 4 & 5. نوافذ إضافة وتعديل عملية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div id="modal-add-operation" className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <i className="bi bi-plus-circle-fill text-blue-600"></i>
                            <span>4. نافذة إضافة عملية جديدة</span>
                        </h4>
                        <VisualWindow
                            title="إضافة عملية جديدة"
                            subtitle="حجز المعرف الميزانياتي والبيانات التأسيسية"
                            imageSrc="نافذة اضافة عملية.PNG"
                            imageAlt="نافذة اضافة عملية"
                            callouts={[
                                { number: 1, text: "رقم العملية (إلزامي): الترميز الموحد مثل N.1.024.090.01.2048.000.048.24.002." },
                                { number: 2, text: "عنوان العملية: التسمية القانونية المعتمدة بالعربية والفرنسية." },
                                { number: 3, text: "الصنف والصنف الفرعي: تثبيتات عينية / 31412 المنشآت القاعدية للطرقات." },
                                { number: 4, text: "قسم هيكلة العملية (المدونات): زر + إضافة هيكلة لتوزيع الغلاف المالي." }
                            ]}
                        />
                    </div>

                    <div id="modal-edit-operation" className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <i className="bi bi-pencil-square text-amber-600"></i>
                            <span>5. نافذة تعديل بيانات العملية</span>
                        </h4>
                        <VisualWindow
                            title="تعديل عملية"
                            subtitle="تحيين المراجع والعناوين والتصنيفات للعملية المسجلة"
                            imageSrc="نافذة تعديل العملية.PNG"
                            imageAlt="نافذة تعديل العملية"
                            callouts={[
                                { number: 1, text: "حقل رقم العملية القابل للتعديل عند حدوث إعادة ترميز." },
                                { number: 2, text: "تحيين العنوان، نوع العملية (LOLF)، والحالة (جارية)." },
                                { number: 3, text: "زر حفظ التغييرات الأزرق لاعتماد التعديلات فورياً." }
                            ]}
                        />
                    </div>
                </div>

                {/* 6. صفحة تفاصيل العملية - نظرة عامة */}
                <div id="screen-operation-details" className="space-y-3 pt-6 border-t border-slate-200">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-card-checklist text-blue-600"></i>
                        <span>6. صفحة تفاصيل العملية - النظرة العامة ومؤشرات الاستهلاك</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                        اللوحة التحليلية للعملية الاستثمارية المحددة. تعرض كروت المبالغ الأربعة الكبرى، ونسب استهلاك رخص الالتزام واعتمادات الدفع بدقة متناهية.
                    </p>

                    <VisualWindow
                        title="تفاصيل العملية - النظرة العامة"
                        subtitle="التبويبات الستة، بطاقات المبالغ الكبرى، ورسوم بيانية لنسب الاستهلاك"
                        badge="مؤشرات تفاعلية"
                        badgeColor="bg-blue-100 text-blue-800 border-blue-300"
                        imageSrc="صفحة تفاصيل العملية.PNG"
                        imageAlt="صفحة تفاصيل العملية"
                        callouts={[
                            { number: 1, text: "التبويبات الـ 6: نظرة عامة، الهيكلة، الحصص، الإلتزامات، الدفعات، جداول الإرسال." },
                            { number: 2, text: "رخصة الالتزام الإجمالية: 250.000.636,72 دج." },
                            { number: 3, text: "مجموع الالتزامات المؤشرة: 150.018.739,33 دج." },
                            { number: 4, text: "مجموع اعتمادات الدفع: 122.919.878,87 دج." },
                            { number: 5, text: "مجموع الدفعات المسددة: 121.605.804,89 دج." },
                            { number: 6, text: "شريط استهلاك رخصة الالتزام (AE): 60.0% مع رصيد متبقي 99.981.897,39 دج." },
                            { number: 7, text: "شريط استهلاك اعتمادات الدفع (CP): 98.9% مع رصيد متبقي 1.314.073,98 دج." },
                            { number: 8, text: "مؤشرات السنة المالية 2026: كفاءة استغلال CP للسنة الحالية تبلغ 79.9%." }
                        ]}
                    />
                </div>

                {/* 7. صفحة تفاصيل العملية - جدول الهيكلة والـ CP */}
                <div id="screen-operation-structure" className="space-y-3 pt-6 border-t border-slate-200">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-diagram-3-fill text-teal-600"></i>
                        <span>7. صفحة تفاصيل العملية - جدول الهيكلة واعتمادات الدفع (CP)</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                        إدارة الغلاف المالي للعملية من خلال جدولين متكاملين: جدول اعتمادات الدفع السنوية (CP)، وجدول هيكلة الكلفة (Rubriques) مع التطبيق الصارم لقاعدة «مبلغ العملية غير الموزع».
                    </p>

                    <VisualWindow
                        title="تفاصيل العملية - جدول الهيكلة واعتمادات الدفع"
                        subtitle="توزيع اعتمادات الدفع حسب السنوات وهيكل الكلفة حسب الأبواب"
                        badge="قاعدة التوازن الصارمة"
                        badgeColor="bg-teal-100 text-teal-800 border-teal-300"
                        imageSrc="صفحة تفاصيل العملية (جدول الهيكلة).PNG"
                        imageAlt="صفحة تفاصيل العملية جدول الهيكلة"
                        callouts={[
                            { number: 1, text: "جدول اعتمادات الدفع (CP): تفصيل السنوات 2024، 2025، 2026 مع زر + إضافة CP." },
                            { number: 2, text: "إجمالي اعتمادات الدفع النهائية: 122.919.878,87 دج." },
                            { number: 3, text: "جدول هيكلة الكلفة (Rubriques): توزيع المبالغ على الأشغال، المراقبة، والإشهار مع زر + إضافة هيكل." },
                            { number: 4, text: "مبلغ العملية غير الموزع: 80.067.900,00 دج مثبت آلياً في الصف الأخير لمنع أي خلل توازني." }
                        ]}
                    />
                </div>

                {/* 8 & 9 & 10. نوافذ الهيكلة والـ CP الفرعية */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <VisualWindow
                        title="إضافة هيكل الكلفة"
                        subtitle="اختيار الباب وإدخال مبالغه"
                        imageSrc="نافذة اضافة هيكلة الكلفة.PNG"
                        imageAlt="نافذة اضافة هيكلة الكلفة"
                        callouts={[
                            { number: 1, text: "تفصيل الهيكلة (الدراسة، الأشغال...)" },
                            { number: 2, text: "المبلغ الأولي والمبلغ النهائي." }
                        ]}
                    />
                    <VisualWindow
                        title="تعديل صنف فرعي"
                        subtitle="تحيين المبالغ للصنف الفرعي"
                        imageSrc="نافذة اضافة و تعدبل صنف فرعي للعملية.PNG"
                        imageAlt="نافذة تعديل صنف فرعي"
                        callouts={[
                            { number: 1, text: "الصنف الفرعي: 31412 المنشآت القاعدية للطرقات." },
                            { number: 2, text: "المبلغ الأولي 167.179.000 والنهائي 169.932.736." }
                        ]}
                    />
                    <VisualWindow
                        title="إضافة اعتمادات الدفع"
                        subtitle="تسجيل الـ CP الممنوح للسنة"
                        imageSrc="نافذة اضافة اعتماد الدفع.PNG"
                        imageAlt="نافذة اضافة اعتماد الدفع"
                        callouts={[
                            { number: 1, text: "تحديد السنة المالية (2026)." },
                            { number: 2, text: "حقل المبلغ الأولي والمبلغ النهائي." }
                        ]}
                    />
                </div>
            </div>

            {/* الباب الثالث: إدارة الحصص والمقاطع */}
            <div id="screen-lots-section" className="space-y-8 pt-8 border-t-2 border-slate-300">
                <div className="border-b-2 border-purple-600 pb-2 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center text-sm shadow">03</span>
                        <span>الباب الثالث: إدارة حصص العملية (Lots Management)</span>
                    </h3>
                    <span className="text-xs bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-lg border border-purple-200">
                        تجزئة الصفقات والإسناد
                    </span>
                </div>

                <div id="screen-lots" className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-boxes text-purple-600"></i>
                        <span>11. صفحة تفاصيل العملية - جدول الحصص (Lots)</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                        تقسيم المشروع إلى مقاطع وحصص مستقلة (المنشأة الفنية، الإنارة بالطاقة الشمسية، الإنارة بـ LED، مخبر المراقبة C0102، ومكتب الدراسات S010203) مع بيان مبالغها وحالة الإسناد.
                    </p>

                    <VisualWindow
                        title="إدارة حصص العملية (Lots)"
                        subtitle="أزرار إضافة حصة ونموذج واستيراد، جدول الحصص مع شارة مسندة، والمجموع الإجمالي"
                        badge="الحصص التعاقدية"
                        badgeColor="bg-purple-100 text-purple-800 border-purple-300"
                        imageSrc="صفحة تفاصيل العملية (جدول الحصص).PNG"
                        imageAlt="صفحة تفاصيل العملية جدول الحصص"
                        callouts={[
                            { number: 1, text: "رقم الحصة: 01، 02، 03، 04، C0102، S010203." },
                            { number: 2, text: "عنوان الحصة: التوصيف الدقيق للأشغال أو المتابعة." },
                            { number: 3, text: "المبلغ النهائي لكل حصة (مثال: المنشأة الفنية 107.307.000,00 دج)." },
                            { number: 4, text: "شارة الحالة: 'مسندة' خضراء تدل على تمام التعاقد والإسناد." },
                            { number: 5, text: "المجموع الإجمالي للحصص أسفل الجدول: 166.120.070,00 دج." }
                        ]}
                    />
                </div>

                <div id="modal-lot" className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-pencil-fill text-purple-600"></i>
                        <span>12. نافذة إضافة وتعديل الحصة للعملية</span>
                    </h4>
                    <VisualWindow
                        title="تعديل حصة"
                        subtitle="إدخال رقم الحصة، عنوانها، مبالغها، وتفعيل خيار الإسناد"
                        imageSrc="نافذة اضافة و تعديل الحصة للعملية.PNG"
                        imageAlt="نافذة تعديل حصة"
                        callouts={[
                            { number: 1, text: "رقم الحصة (04)." },
                            { number: 2, text: "عنوان الحصة: RÉALISATION DES TRAVAUX D'ECLAIRAGE PUBLIC PAR LUMINAIRE LED." },
                            { number: 3, text: "المبلغ النهائي (7.740.000,00 دج)." },
                            { number: 4, text: "مربع خيار '☑ تم الإسناد' لاعتماد الحصة كحصة مسندة رسمياً." }
                        ]}
                    />
                </div>
            </div>

            {/* الباب الرابع: مسار بطاقات الالتزام المالي وتأشيرة المراقب الميزانياتي */}
            <div id="screen-engagements-section" className="space-y-8 pt-8 border-t-2 border-slate-300">
                <div className="border-b-2 border-amber-600 pb-2 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center text-sm shadow">04</span>
                        <span>الباب الرابع: مسار بطاقات الالتزام وتأشيرة المراقب الميزانياتي</span>
                    </h3>
                    <span className="text-xs bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-lg border border-amber-200">
                        الرقابة الميزانياتية المسبقة
                    </span>
                </div>

                <div id="screen-engagements" className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-pen-fill text-amber-600"></i>
                        <span>13. صفحة تفاصيل العملية - سجل الالتزامات المالية</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                        السجل الرسمي للارتباطات المالية المبرمة على عاتق رخصة الالتزام للعملية، مع شارات التأشيرة الخضراء للمراقب الميزانياتي، وشارات "قيد التأشير"، وزر الطباعة المباشرة لكل بطاقة.
                    </p>

                    <VisualWindow
                        title="سجل الإلتزامات المالية"
                        subtitle="فلاتر السنوات والمستفيدين، تفاصيل التأشيرات، والمجموع الإجمالي 150.018.739,33 دج"
                        badge="رقابة رخصة AE"
                        badgeColor="bg-amber-100 text-amber-800 border-amber-300"
                        imageSrc="صفحة تفاصيل العملية (جدول الالتزامات).PNG"
                        imageAlt="صفحة تفاصيل العملية جدول الالتزامات"
                        callouts={[
                            { number: 1, text: "أزرار التحكم: + إضافة إلتزام، استيراد، وتصدير." },
                            { number: 2, text: "فلاتر البحث السريعة: السنة المالية، اسم المستفيد، وموضوع الإلتزام." },
                            { number: 3, text: "الطبيعة: شارات زرقاء تبين نوع الالتزام (التزام، تغيير هيكلة الكلفة...)." },
                            { number: 4, text: "شارة التأشيرة الخضراء: تظهر رقم وتاريخ تأشيرة المراقب المالي (مثال: التأشيرة 534 في 03/07/2024)." },
                            { number: 5, text: "شارة قيد التأشير الحمراء: للبطاقات المودعة التي لم تؤشر بعد." },
                            { number: 6, text: "أيقونة الطابعة السريعة لاستخراج بطاقة الالتزام الرسمية فورياً." },
                            { number: 7, text: "شريط إجمالي الالتزامات المعروضة أسفل الجدول: 150.018.739,33 دج." }
                        ]}
                    />
                </div>

                <div id="modal-engagement" className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-file-earmark-check-fill text-amber-600"></i>
                        <span>14. نافذة إضافة وتعديل التزام مالي</span>
                    </h4>
                    <VisualWindow
                        title="تعديل التزام مالي"
                        subtitle="ربط الوثيقة، احتساب الرصيد، وتسجيل تأشيرة المراقب الميزانياتي"
                        imageSrc="نافذة اضافة و تعديل التزام.PNG"
                        imageAlt="نافذة تعديل التزام"
                        callouts={[
                            { number: 1, text: "رقم الالتزام والسنة: 05 / 2024." },
                            { number: 2, text: "الوثيقة المرفقة: صفقة رقم 04/2024 في 12/02/2024." },
                            { number: 3, text: "تاريخ البطاقة (30/06/2024) والمبلغ الملتزم به (43.631.350,00 دج)." },
                            { number: 4, text: "تأشيرة المراقب الميزانياتي: رقم التأشيرة (534) وتاريخها (03/07/2024)." }
                        ]}
                    />
                </div>
            </div>

            {/* الباب الخامس: مسار الدفع وحوالات الصرف وتسوية وضعيات الأشغال */}
            <div id="screen-payments-section" className="space-y-8 pt-8 border-t-2 border-slate-300">
                <div className="border-b-2 border-emerald-600 pb-2 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm shadow">05</span>
                        <span>الباب الخامس: مسار الدفع وحوالات الصرف وتسوية وضعيات الأشغال</span>
                    </h3>
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-lg border border-emerald-200">
                        الصرف والمطابقة مع الخزينة
                    </span>
                </div>

                <div id="screen-payments" className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-cash-stack text-emerald-600"></i>
                        <span>15. صفحة تفاصيل العملية - سجل المدفوعات (Paiements)</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                        سجل الحوالات الصادرة ووضعيات الأشغال المسددة للمقاولين ومكاتب الدراسات ومؤسسات الإشهار، متضمناً مراجع الحوالات وقبول الخزينة العمومية.
                    </p>

                    <VisualWindow
                        title="سجل المدفوعات (Paiements)"
                        subtitle="بيانات الحوالات، مبالغ التسوية، وشارات القبول بالخزينة العمومية"
                        badge="تصفية الحوالات"
                        badgeColor="bg-emerald-100 text-emerald-800 border-emerald-300"
                        imageSrc="صفحة تفاصيل العملية (جدول الدفعات).PNG"
                        imageAlt="صفحة تفاصيل العملية جدول الدفعات"
                        callouts={[
                            { number: 1, text: "رقم وسنة الدفعة: 01/2024، 02/2024، 01/2025..." },
                            { number: 2, text: "الموضوع: فواتير إشهارية أو وضعيات أشغال تراكمية (وضعية الأشغال رقم 01، 02...)." },
                            { number: 3, text: "بيانات الحوالة: رقم الحوالة (Mandat)، تاريخها، وشارة 'مقبول' الخضراء بالخزينة." },
                            { number: 4, text: "إجمالي المدفوعات المعروضة أسفل الجدول: 121.605.804,89 دج." }
                        ]}
                    />
                </div>

                <div id="modal-payment" className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-calculator-fill text-emerald-600"></i>
                        <span>16. نافذة تعديل وإضافة دفع (محرك تصفية الوضعيات)</span>
                    </h4>
                    <VisualWindow
                        title="تعديل دفع - تصفية وضعية الأشغال والحوالة"
                        subtitle="احتساب اقتطاع الضمان والتسبيقات وصافي الدفع الحالي بدقة سنتيمية"
                        imageSrc="نافذة تعديل و اضافة دفع.PNG"
                        imageAlt="نافذة تعديل و اضافة دفع"
                        callouts={[
                            { number: 1, text: "وثيقة الدفع: وضعية الأشغال رقم 03 بتاريخ 11/05/2025." },
                            { number: 2, text: "مجموع الدفعات السابقة (تراكمي): 67.381.179,60 دج." },
                            { number: 3, text: "مبلغ الأشغال (تراكمي): 140.925.476,30 دج." },
                            { number: 4, text: "حقول التسبيقات واسترجاعها والاقتطاعات (الضمان، التأخير، بالزيادة)." },
                            { number: 5, text: "بطاقة النتيجة الآلية البارزة: صافي الدفع الحالي: 73.544.296,70 دج." },
                            { number: 6, text: "بيانات الحوالة والخزينة: الحوالة رقم 199، تاريخ الحوالة 31/12/2025، وتاريخ القبول 22/02/2026." }
                        ]}
                    />
                </div>

                {/* 17 & 18. جداول الإرسال */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                    <div id="screen-bordereaux" className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <i className="bi bi-send-fill text-blue-600"></i>
                            <span>17. سجل جداول الإرسال بالعملية</span>
                        </h4>
                        <VisualWindow
                            title="جداول الإرسال (Bordereaux)"
                            subtitle="كشوفات الإرسال الموجهة للمراقب الميزانياتي"
                            imageSrc="صفحة تفاصيل العملية (جدول الارسال).PNG"
                            imageAlt="صفحة تفاصيل العملية جدول الارسال"
                            callouts={[
                                { number: 1, text: "زر + إضافة جدول إرسال." },
                                { number: 2, text: "بيانات الإرساليات (01/2026، 02/2026، 03/2026) والوثائق المرفقة بها." }
                            ]}
                        />
                    </div>

                    <div id="modal-bordereau" className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <i className="bi bi-file-earmark-plus-fill text-blue-600"></i>
                            <span>18. نافذة إعداد وتعديل جدول إرسال</span>
                        </h4>
                        <VisualWindow
                            title="تعديل جدول إرسال"
                            subtitle="اختيار العملية والالتزامات المرفقة وتحديد عدد النسخ"
                            imageSrc="نافذة اضافة تعديل جدول ارسال.PNG"
                            imageAlt="نافذة تعديل جدول ارسال"
                            callouts={[
                                { number: 1, text: "المرسل إليه: المراقب الميزانياتي لدى ولاية غليزان." },
                                { number: 2, text: "جدول البطاقات المرفقة مع سلة الحذف وملاحظات النسخ (02 نسختين)." }
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* الباب السادس: سجل الوثائق والصفقات والمستفيدين */}
            <div id="screen-documents-section" className="space-y-8 pt-8 border-t-2 border-slate-300">
                <div className="border-b-2 border-cyan-600 pb-2 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center text-sm shadow">06</span>
                        <span>الباب السادس: سجل الوثائق والصفقات وقاعدة بيانات المستفيدين</span>
                    </h3>
                    <span className="text-xs bg-cyan-50 text-cyan-700 font-bold px-3 py-1 rounded-lg border border-cyan-200">
                        العقود والشركاء الاقتصاديون
                    </span>
                </div>

                <div id="screen-documents-main" className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-file-earmark-text-fill text-cyan-600"></i>
                        <span>19. صفحة الوثائق والصفقات والعقود (+1097 وثيقة مسجلة)</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                        السجل العقدي الشامل لكافة الصفقات والملاحق والفواتير. يتميز بالربط الشبكي الذكي مع أوامر الخدمة (ODS)، وحساب الأيام المتبقية للإنجاز، ومتابعة مدفوعات العقد المحددة.
                    </p>

                    <VisualWindow
                        title="صفحة الوثائق - السجل العقدي العام"
                        subtitle="جدول الوثائق بتصنيفاته، اللوحة الجانبية لأوامر الخدمة ODS، والحصص المرتبطة"
                        badge="1097 وثيقة"
                        badgeColor="bg-cyan-100 text-cyan-800 border-cyan-300"
                        imageSrc="صفحة الوثائق.PNG"
                        imageAlt="صفحة الوثائق"
                        callouts={[
                            { number: 1, text: "شارة عدد الوثائق الإجمالية المسجلة بالنظام (1097 وثيقة)." },
                            { number: 2, text: "جدول الوثائق بترميزه اللوني وتصنيفاته (صفقة، ملحق، وضعية، فاتورة)." },
                            { number: 3, text: "كارت الحصص المرتبطة بالوثيقة المحددة." },
                            { number: 4, text: "كارت أوامر الخدمة للمشروع (انطلاق، إيقاف، استئناف، وحساب الأيام المتبقية)." },
                            { number: 5, text: "كارت تفاصيل الوثيقة: تأشيرة لجنة الصفقات، المبلغ الجديد، وإجمالي الدفع (83.716.500,00 دج)." }
                        ]}
                    />
                </div>

                <div id="modal-document" className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-plus-square-fill text-cyan-600"></i>
                        <span>20. نافذة إضافة وثيقة جديدة</span>
                    </h4>
                    <VisualWindow
                        title="إضافة وثيقة جديدة"
                        subtitle="تحديد طبيعة الوثيقة، المتعاقد، الحساب البنكي، والرقابة على CP"
                        imageSrc="نافذة اضافة وثيقة.PNG"
                        imageAlt="نافذة اضافة وثيقة"
                        callouts={[
                            { number: 1, text: "اختيار العملية وطبيعة الوثيقة (فاتورة، صفقة...)." },
                            { number: 2, text: "موضوع الوثيقة ومبلغها المالي." },
                            { number: 3, text: "اختيار المستفيد وتفصيل الهيكلة (الإشهار)." },
                            { number: 4, text: "مربعات خيارات التسجيل الآلي بجدول الالتزام أو جدول الدفع." }
                        ]}
                    />
                </div>

                {/* 21 & 22 & 23. المستفيدون */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div id="screen-beneficiaries" className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <i className="bi bi-people-fill text-teal-600"></i>
                            <span>21. صفحة المستفيدين (المقاولون ومكاتب الدراسات)</span>
                        </h4>
                        <VisualWindow
                            title="صفحة المستفيدين"
                            subtitle="دليل المقاولين والمخابر، أرقام السجلات التجارية، والـ NIF"
                            imageSrc="صفحة المستفيذين.PNG"
                            imageAlt="صفحة المستفيدين"
                            callouts={[
                                { number: 1, text: "أزرار التحكم: إضافة، تصدير إلى Excel، واستيراد من Excel." },
                                { number: 2, text: "أعمدة الجدول: المستفيد، العنوان، عدد الحسابات البنكية، رقم السجل، والـ NIF." }
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <VisualWindow
                            title="إضافة مستفيد جديد"
                            subtitle="حجز الاسم والعنوان وحسابات الـ RIB والـ NIF"
                            imageSrc="نافذة اضافة مستفيذ.PNG"
                            imageAlt="نافذة اضافة مستفيد"
                            callouts={[
                                { number: 1, text: "اسم المستفيد وعنوانه." },
                                { number: 2, text: "قسم الحسابات البنكية مع زر + إضافة حساب (20 رقماً للـ RIB)." },
                                { number: 3, text: "رقم التعريف الجبائي (NIF) ورقم السجل التجاري." }
                            ]}
                        />
                        <VisualWindow
                            title="تعديل مستفيد"
                            subtitle="إدارة الحسابات البنكية المتعددة (CPA, BNA...)"
                            imageSrc="نافذة تعديل مستفيذ.PNG"
                            imageAlt="نافذة تعديل مستفيد"
                            callouts={[
                                { number: 1, text: "المستفيد: SARL MOUSSA OMAR CONSTRUCTION." },
                                { number: 2, text: "حسابات بنكية متعددة مع أزرار الحذف الحمراء المستقلة." }
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* الباب السابع: الوضعيات المالية الرقابية وصفحة الإعدادات */}
            <div id="screen-status-section" className="space-y-8 pt-8 border-t-2 border-slate-300">
                <div className="border-b-2 border-rose-600 pb-2 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-sm shadow">07</span>
                        <span>الباب السابع: الوضعيات المالية الرقابية وإعدادات النظام</span>
                    </h3>
                    <span className="text-xs bg-rose-50 text-rose-700 font-bold px-3 py-1 rounded-lg border border-rose-200">
                        التقارير الدورية والنسخ الاحتياطي
                    </span>
                </div>

                <div id="screen-financial-status" className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-bar-chart-line-fill text-rose-600"></i>
                        <span>24. صفحة الوضعية المالية (Situation Financière Mensuelle)</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                        كشف شامل دوري موقوف في نهاية كل شهر (مثال: الوضعية المالية لشهر أكتوبر 2026)، مزود بشريط الانتقال الفوري للتقارير المتخصصة الـ 10.
                    </p>

                    <VisualWindow
                        title="الوضعية المالية لشهر أكتوبر 2026"
                        subtitle="شريط الأزرار السريعة للكشوفات العشرة، وجدول تتبع استهلاك CP الشهري والتراكمي"
                        badge="كشف دوري رسمي"
                        badgeColor="bg-rose-100 text-rose-800 border-rose-300"
                        imageSrc="صفحة الوضعية المالية.PNG"
                        imageAlt="صفحة الوضعية المالية"
                        callouts={[
                            { number: 1, text: "شريط الكشوفات الـ 10: المشاريع، الهيكلة، مستحقات الدفع، نقص AE، وثائق غير مسجلة، التزامات مؤشرة، الالتزامات الشهرية، المدفوعات الشهرية، الحصص، وملحق 01." },
                            { number: 2, text: "أعمدة الاستهلاك: إعتماد الدفع للسنة، الدفع السابق، دفع الشهر، مجموع الدفع، والرصيد المتبقي." }
                        ]}
                    />
                </div>

                <div id="screen-settings" className="space-y-3 pt-6 border-t border-slate-200">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-gear-fill text-slate-600"></i>
                        <span>25. صفحة الإعدادات والنسخ الاحتياطي وتحديث البرنامج</span>
                    </h4>
                    <VisualWindow
                        title="صفحة الإعدادات"
                        subtitle="إدارة البيانات السحابية (Backup & Restore)، فحص التحديثات، وإدارة الجداول"
                        imageSrc="صفحة الإعدادات.PNG"
                        imageAlt="صفحة الإعدادات"
                        callouts={[
                            { number: 1, text: "تبويبات: الإعدادات العامة، إدارة المستخدمين، الجداول الأساسية." },
                            { number: 2, text: "إدارة البيانات السحابية: تصدير واستيراد النسخ الاحتياطية (Backup/Restore)." },
                            { number: 3, text: "فحص التحديثات: التحقق الآلي من وجود إصدارات برمجية جديدة." }
                        ]}
                    />
                </div>
            </div>

            {/* الباب الثامن: النماذج والمطبوعات الميزانياتية الرسمية A4 */}
            <div id="screen-prints-section" className="space-y-8 pt-8 border-t-2 border-slate-300">
                <div className="border-b-2 border-red-600 pb-2 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center text-sm shadow">08</span>
                        <span>الباب الثامن: النماذج والمطبوعات الميزانياتية الرسمية A4 الجاهزة للـ PDF</span>
                    </h3>
                    <span className="text-xs bg-red-50 text-red-700 font-bold px-3 py-1 rounded-lg border border-red-200">
                        نماذج وزارة المالية والخزينة
                    </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed text-justify">
                    يوفر GOFT3 تسعة نماذج رسمية مطابقة بنسبة 100% للوثائق المعتمدة لدى وزارة المالية والخزينة العمومية والمراقب الميزانياتي:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 26. بطاقة الالتزام */}
                    <VisualWindow
                        title="بطاقة الالتزام المالي الرسمية (Fiche d'Engagement)"
                        subtitle="النموذج المعتمد لدى المراقب الميزانياتي متضمناً الرصيد السابق والمتبقي"
                        imageSrc="صفحة طباعة التزام.PNG"
                        imageAlt="صفحة طباعة التزام"
                    />

                    {/* 27. بطاقة الدفع */}
                    <VisualWindow
                        title="بطاقة الدفع الرسمية (Fiche de Paiement)"
                        subtitle="كشف الدفع المقترح ومجموع الدفع التراكمي"
                        imageSrc="صفحة طباعة بطاقة الدفع.PNG"
                        imageAlt="صفحة طباعة بطاقة الدفع"
                    />

                    {/* 28. حوالة الدفع */}
                    <VisualWindow
                        title="حوالة الدفع ع2، ع3، ع4، ع5 و ع6 (Mandat de Paiement)"
                        subtitle="حوالة الصرف الموجهة لأمين الخزينة العمومية بمبالغها المفقطة"
                        imageSrc="صفحة طباعة حوالة الدفع.PNG"
                        imageAlt="صفحة طباعة حوالة الدفع"
                    />

                    {/* 29. شهادة الدفع */}
                    <VisualWindow
                        title="شهادة الدفع (Certificat de Paiement)"
                        subtitle="الكشف الحسابي لتسوية وضعية الأشغال والاقتطاعات"
                        imageSrc="صفحة طباعة شهادة الدفع.PNG"
                        imageAlt="صفحة طباعة شهادة الدفع"
                    />

                    {/* 30. إعلان بالدفع */}
                    <VisualWindow
                        title="إعلان بالدفع (Avis de Paiement)"
                        subtitle="وثيقة التحويل المصرفي إلى حساب المقاول RIB / RIP"
                        imageSrc="صفحة طباعة اعلان بالدفع.PNG"
                        imageAlt="صفحة طباعة اعلان بالدفع"
                    />

                    {/* 31. جدول الإرسال */}
                    <VisualWindow
                        title="جدول الإرسال للمراقب الميزانياتي (Bordereau d'Envoi)"
                        subtitle="جدول إرسال الملفات والبطاقات والوثائق الثبوتية"
                        imageSrc="صفحة طباعة جدول الارسال.PNG"
                        imageAlt="صفحة طباعة جدول الارسال"
                    />

                    {/* 32. جدول متابعة العمليات */}
                    <VisualWindow
                        title="جدول متابعة العمليات لسنة 2026"
                        subtitle="الكشف السنوي الشامل لرخص الالتزام واعتمادات الدفع"
                        imageSrc="صفحة طباعة جدول العمليات.PNG"
                        imageAlt="صفحة طباعة جدول العمليات"
                    />

                    {/* 33. جدول حوالات الدفع */}
                    <VisualWindow
                        title="جدول حوالات الدفع (Bordereau des Mandats)"
                        subtitle="الكشف الإجمالي للحوالات الصادرة والمسلمة للخزينة"
                        imageSrc="صفحة طباعة جدول حولات الدفع.PNG"
                        imageAlt="صفحة طباعة جدول حولات الدفع"
                    />

                    {/* 34. الوضعية المالية حسب الهيكلة */}
                    <VisualWindow
                        title="الوضعية المالية حسب الهيكلة (الالتزام)"
                        subtitle="توزيع رخص الالتزام والالتزامات على أبواب الكلفة"
                        imageSrc="صفحة طباعة الوضعية المالية حسب الهيكلة.PNG"
                        imageAlt="صفحة طباعة الوضعية المالية حسب الهيكلة"
                    />
                </div>
            </div>

        </div>
    );
};
