import React, { useState } from 'react';

interface VisualWindowProps {
    title: string;
    subtitle?: string;
    badge?: string;
    badgeColor?: string;
    imageSrc?: string;
    imageAlt?: string;
    children?: React.ReactNode;
    callouts?: { number: number; text: string; position?: string }[];
}

export const VisualWindow: React.FC<VisualWindowProps> = ({
    title,
    subtitle,
    badge,
    badgeColor = 'bg-blue-100 text-blue-800 border-blue-200',
    imageSrc,
    imageAlt,
    children,
    callouts
}) => {
    const cleanName = imageSrc ? imageSrc.replace(/^\/+/, '').replace(/^images\//, '').replace(/^image\//, '') : '';
    const candidateUrls = React.useMemo(() => {
        if (!cleanName) return [];
        return [
            `/images/${cleanName}`,
            `/image/${cleanName}`,
            `/${cleanName}`,
            `/images/${encodeURIComponent(cleanName)}`,
            `/image/${encodeURIComponent(cleanName)}`,
            `/${encodeURIComponent(cleanName)}`,
            imageSrc || ''
        ];
    }, [cleanName, imageSrc]);

    const [currentCandidateIdx, setCurrentCandidateIdx] = useState(0);
    const [imageError, setImageError] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    const handleImgError = () => {
        if (currentCandidateIdx < candidateUrls.length - 1) {
            setCurrentCandidateIdx(prev => prev + 1);
        } else {
            setImageError(true);
        }
    };

    const activeSrc = candidateUrls[currentCandidateIdx];

    return (
        <div className="my-6 rounded-2xl border-2 border-slate-300 bg-white shadow-xl overflow-hidden print:shadow-none print:border-slate-400 print:break-inside-avoid">
            {/* Desktop Window Title Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-2.5 flex items-center justify-between text-white border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
                    <span className="text-slate-400 font-mono text-[11px] mr-3">GOFT3 - العنوان الثالث</span>
                </div>
                <div className="flex items-center gap-2 text-center">
                    <i className="bi bi-window-desktop text-blue-400 text-xs"></i>
                    <span className="font-bold text-xs tracking-wide text-slate-100">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    {imageSrc && !imageError && (
                        <button
                            type="button"
                            onClick={() => setIsZoomed(true)}
                            className="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 p-1 px-2 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                            title="تكبير الصورة بالحجم الكامل"
                        >
                            <i className="bi bi-zoom-in"></i>
                            <span className="hidden sm:inline">تكبير</span>
                        </button>
                    )}
                    {badge ? (
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${badgeColor}`}>
                            {badge}
                        </span>
                    ) : (
                        <span className="text-slate-400 text-[10px] font-mono">واجهة رسمية</span>
                    )}
                </div>
            </div>

            {/* Subtitle / Path Bar */}
            {subtitle && (
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs text-slate-600 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                        <i className="bi bi-folder2-open text-blue-600"></i>
                        <span>{subtitle}</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                        صورة حقيقية من النظام
                    </span>
                </div>
            )}

            {/* Real Screenshot Area */}
            {imageSrc && !imageError && (
                <div className="bg-slate-950 p-2 sm:p-3 relative group text-center overflow-hidden">
                    <img
                        src={activeSrc}
                        alt={imageAlt || title}
                        className="w-full h-auto max-h-[580px] object-contain rounded-xl mx-auto shadow-md transition-transform duration-200 group-hover:scale-[1.005] cursor-pointer"
                        onClick={() => setIsZoomed(true)}
                        onError={handleImgError}
                        loading="lazy"
                    />
                    <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1">
                        <i className="bi bi-arrows-fullscreen"></i>
                        <span>انقر لتكبير الصورة</span>
                    </div>
                </div>
            )}

            {/* Render children (fallback or additional interactive UI elements) */}
            {(!imageSrc || imageError || children) && (
                <div className="bg-slate-50 p-3 sm:p-5 text-right font-sans overflow-x-auto border-t border-slate-200">
                    {children}
                </div>
            )}

            {/* Callout Legend */}
            {callouts && callouts.length > 0 && (
                <div className="bg-white border-t border-slate-200 p-3 sm:p-4 text-xs">
                    <h5 className="font-bold text-slate-800 mb-2.5 flex items-center gap-1.5 text-xs">
                        <i className="bi bi-pin-map-fill text-blue-600"></i>
                        الدليل التوضيحي لحقول وأزرار الواجهة:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {callouts.map((c) => (
                            <div key={c.number} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                    {c.number}
                                </span>
                                <span className="text-slate-700 leading-snug text-[11px] font-medium">{c.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Fullscreen Lightbox Modal */}
            {isZoomed && imageSrc && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 flex flex-col items-center justify-center no-print"
                    onClick={() => setIsZoomed(false)}
                >
                    <div className="w-full max-w-6xl flex items-center justify-between text-white mb-2 px-2">
                        <h4 className="font-bold text-sm flex items-center gap-2">
                            <i className="bi bi-image text-blue-400"></i>
                            <span>{title}</span>
                        </h4>
                        <button
                            onClick={() => setIsZoomed(false)}
                            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                            <span>إغلاق</span>
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <div className="max-w-6xl max-h-[85vh] overflow-auto p-1 bg-slate-900 rounded-2xl border border-white/20 shadow-2xl">
                        <img
                            src={activeSrc}
                            alt={imageAlt || title}
                            className="w-full h-auto object-contain rounded-xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export const ScreenTag: React.FC<{ number: number }> = ({ number }) => (
    <span className="inline-flex w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] items-center justify-center shadow-md align-middle mx-1">
        {number}
    </span>
);
