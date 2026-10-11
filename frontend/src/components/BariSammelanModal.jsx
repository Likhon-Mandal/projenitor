import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Calendar, MapPin, ExternalLink, ArrowRight, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const toBnDigits = (num) => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num ?? '').replace(/[0-9]/g, d => bnDigits[d]);
};

// Compute English year fallback from edition (Anchor: 45th in 1977, 95th in 2027)
const getEnglishYear = (edition) => {
    const ed = parseInt(edition, 10);
    if (isNaN(ed)) return '';
    return 1977 + (ed - 45);
};

// Format English date into readable string
const formatDisplayDate = (dateStr, edition, isBn) => {
    if (!dateStr) {
        const ey = getEnglishYear(edition);
        return ey ? (isBn ? `${toBnDigits(ey)} খ্রিঃ` : `${ey}`) : '';
    }
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const monthsBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
        const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = d.getDate();
        const month = d.getMonth();
        const year = d.getFullYear();
        if (isBn) {
            return `${toBnDigits(day)} ${monthsBn[month]}, ${toBnDigits(year)}`;
        }
        return `${day} ${monthsEn[month]} ${year}`;
    } catch {
        return dateStr;
    }
};

// Clean Date String: remove redundant parenthesized years, 'বঙ্গাব্দ', 'খ্রিঃ'
const cleanDateString = (str) => {
    if (!str) return '';
    return str
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/\s*বঙ্গাব্দ\s*/g, ' ')
        .replace(/\s*(খ্রিঃ|খ্রিস্টাব্দ)\s*/g, ' ')
        .replace(/,\s*$/, '')
        .trim();
};

const BariSammelanModal = ({
    isOpen,
    onClose,
    homeName = '',
    villageName = '',
    upazilaName = '',
    districtName = '',
    sammelans = []
}) => {
    const { t, isBn } = useLanguage();
    const navigate = useNavigate();

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const count = sammelans.length;
    const locationString = [villageName, upazilaName, districtName].filter(Boolean).join(', ');

    const handleNavigateToSammelan = (sammelanId) => {
        onClose();
        navigate(`/sammelan?detailId=${sammelanId}`);
    };

    const handleNavigateToAllSammelans = () => {
        onClose();
        navigate('/sammelan');
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-2.5 sm:p-5 bg-stone-950/70 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl max-h-[88dvh] sm:max-h-[90vh] bg-[#fffcf7] rounded-2xl sm:rounded-3xl shadow-2xl border border-orange-200/90 flex flex-col overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-800 via-rose-800 to-red-950 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2.5 sm:gap-4 shadow-md relative z-10 border-b border-orange-950/20">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
                            <Sparkles size={18} className="fill-amber-300 text-amber-300 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm sm:text-lg font-serif font-bold text-white tracking-wide truncate">
                                    {isBn ? 'সম্মেলনের ইতিহাস ও তালিকা' : 'Sammelan History & Gatherings'}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-stone-950 shadow-2xs">
                                    {isBn ? `${toBnDigits(count)}টি সম্মেলন` : `${count} Gathering${count === 1 ? '' : 's'}`}
                                </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-orange-200/90 font-medium truncate mt-0.5" title={`${homeName} • ${locationString}`}>
                                <span className="font-semibold text-white">{homeName}</span>
                                {locationString && ` • ${locationString}`}
                            </p>
                        </div>
                    </div>

                    {/* High-visibility mobile-friendly close button */}
                    <button
                        onClick={onClose}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center border border-white/25 shadow-md shrink-0 transition-all cursor-pointer"
                        title={t('বন্ধ করুন', 'Close')}
                        aria-label={t('বন্ধ করুন', 'Close')}
                    >
                        <X size={18} className="stroke-[2.5]" />
                    </button>
                </div>

                {/* Sub-header Highlight Banner */}
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border-b border-orange-200/70 px-5 py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-stone-750 font-medium">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span>
                            {count > 0 ? (
                                isBn
                                    ? `এই বাড়িতে সর্বমোট ${toBnDigits(count)}টি ঐতিহাসিক বংশীয় সম্মেলন অনুষ্ঠিত হয়েছে`
                                    : `A total of ${count} ancestral gathering${count === 1 ? ' was' : 's were'} held at this residence`
                            ) : (
                                isBn
                                    ? 'এই বাড়িতে এখনও কোনো সম্মেলন অনুষ্ঠিত হওয়ার রেকর্ড নেই'
                                    : 'No sammelan record found for this residence yet'
                            )}
                        </span>
                    </div>

                    {count > 0 && (
                        <button
                            onClick={handleNavigateToAllSammelans}
                            className="text-orange-900 hover:text-orange-950 font-semibold inline-flex items-center gap-1 hover:underline shrink-0 text-xs cursor-pointer"
                        >
                            <span>{isBn ? 'সব সম্মেলন' : 'All Gatherings'}</span>
                            <ArrowRight size={12} />
                        </button>
                    )}
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 custom-scrollbar">
                    {count === 0 ? (
                        <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 text-stone-500">
                            <div className="w-14 h-14 rounded-full bg-orange-100/70 text-orange-700 flex items-center justify-center border border-orange-200 shadow-2xs">
                                <BookOpen size={26} />
                            </div>
                            <div className="max-w-md">
                                <h4 className="text-stone-800 font-serif font-bold text-base">
                                    {isBn ? 'সম্মেলনের কোনো রেকর্ড পাওয়া যায়নি' : 'No Sammelan Records Found'}
                                </h4>
                                <p className="text-xs text-stone-500 mt-1">
                                    {isBn
                                        ? `"${homeName}" প্রাঙ্গণে এখন পর্যন্ত কোনো বংশীয় সম্মেলন অনুষ্ঠিত হওয়ার তথ্য ডাটাবেজে লিপিবদ্ধ নেই। অন্যান্য সম্মেলন দেখতে সম্মেলনের ইতিহাস পাতায় যান।`
                                        : `No sammelan was recorded for "${homeName}". Check the main Sammelan Chronicles page to explore all gatherings.`}
                                </p>
                            </div>
                            <button
                                onClick={handleNavigateToAllSammelans}
                                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-800 hover:bg-orange-700 text-white font-medium text-xs shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
                            >
                                <Sparkles size={14} className="text-amber-300" />
                                <span>{isBn ? 'সম্মেলনের ইতিহাস পাতা দেখুন' : 'View Sammelan Chronicles'}</span>
                            </button>
                        </div>
                    ) : (
                        sammelans.map((item, idx) => {
                            const formattedDate = formatDisplayDate(item.date, item.edition, isBn);
                            const hasCover = Boolean(item.cover_image_url && item.cover_image_url.trim());

                            return (
                                <div
                                    key={item.id || idx}
                                    className="group relative bg-white hover:bg-orange-50/40 rounded-2xl border border-orange-200/80 hover:border-orange-400 p-4 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                >
                                    {/* Left: Thumbnail & Main Info */}
                                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                        {hasCover ? (
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-orange-200 shadow-2xs bg-stone-100">
                                                <img
                                                    src={item.cover_image_url}
                                                    alt={item.title || 'Sammelan Cover'}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 text-white flex flex-col items-center justify-center shrink-0 shadow-xs border border-orange-700/40 font-serif">
                                                <span className="text-xs font-bold leading-none">
                                                    {isBn ? toBnDigits(item.edition) : item.edition}
                                                </span>
                                                <span className="text-[9px] uppercase tracking-wider font-sans opacity-90 mt-0.5">
                                                    {isBn ? 'তম' : 'th'}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            {/* Edition badge & Next badge */}
                                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                                    <Sparkles size={10} className="text-amber-600" />
                                                    <span>{isBn ? `${toBnDigits(item.edition)}তম সম্মেলন` : `${item.edition}th Gathering`}</span>
                                                </span>

                                                {item.is_next && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                                                        {isBn ? 'আসন্ন সম্মেলন' : 'Upcoming'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Sammelan Title */}
                                            <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-orange-950 transition-colors">
                                                {item.title || (isBn ? `${toBnDigits(item.edition)}তম বংশীয় সম্মেলন` : `${item.edition}th Gathering`)}
                                            </h4>

                                            {/* Dates & Venue Info */}
                                            <div className="mt-1.5 space-y-1 text-xs text-stone-600">
                                                {(item.bengali_date || formattedDate) && (
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <Calendar size={12} className="text-orange-700 shrink-0" />
                                                        {cleanDateString(item.bengali_date) ? (
                                                            <span className="font-medium text-stone-850">
                                                                {cleanDateString(item.bengali_date)}
                                                            </span>
                                                        ) : (
                                                            item.bengali_date && (
                                                                <span className="font-medium text-stone-850">{item.bengali_date}</span>
                                                            )
                                                        )}
                                                        {formattedDate && (
                                                            <span className="text-stone-600 font-medium text-[11px]">
                                                                • {formattedDate}
                                                            </span>
                                                        )}
                                                        {item.time && (
                                                            <span className="inline-flex items-center gap-1 text-stone-500 text-[11px] ml-1">
                                                                <Clock size={10} className="text-stone-400" />
                                                                {item.time}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-1.5 text-stone-500 truncate" title={item.venue_name || item.venue_address || homeName}>
                                                    <MapPin size={12} className="text-red-700 shrink-0" />
                                                    <span className="truncate">
                                                        {item.venue_name || item.venue_address || homeName}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Action Buttons */}
                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-orange-100">
                                        {item.map_link && (
                                            <a
                                                href={item.map_link.startsWith('http') ? item.map_link : `https://${item.map_link}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-xl text-stone-600 hover:text-emerald-800 bg-stone-100/80 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 transition-all cursor-pointer text-xs"
                                                title={t('গুগল ম্যাপে স্থানটি দেখুন', 'View venue on Google Maps')}
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        )}

                                        <button
                                            onClick={() => handleNavigateToSammelan(item.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-800 via-rose-800 to-red-900 hover:from-orange-700 hover:to-red-800 text-white font-medium text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer group/btn"
                                            title={t('এই সম্মেলনের পূর্ণ বিবরণ দেখুন', 'View full details of this sammelan')}
                                        >
                                            <span>{isBn ? 'বিস্তারিত দেখুন' : 'View Details'}</span>
                                            <ArrowRight size={13} className="text-yellow-300 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Modal Footer */}
                <div className="bg-stone-50 border-t border-orange-200/80 px-4 sm:px-6 py-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
                    <p className="text-stone-500 text-[11px] text-center sm:text-left">
                        {isBn ? 'যেকোনো সম্মেলনে ক্লিক করে ছবি, ইতিহাস ও আলোচকবৃন্দ দেখুন' : 'Click on any gathering to view photos, speeches & participants'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 shrink-0">
                        <button
                            onClick={handleNavigateToAllSammelans}
                            className="px-3 py-2 sm:py-1.5 text-xs font-semibold text-orange-900 hover:text-orange-950 bg-orange-100/70 hover:bg-orange-200/80 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1 active:scale-95 text-center"
                        >
                            <BookOpen size={13} className="shrink-0" />
                            <span className="truncate">{isBn ? 'সম্মেলনের ইতিহাস পাতা' : 'Chronicles Page'}</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="px-3.5 py-2 sm:py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl transition-colors cursor-pointer active:scale-95 text-center shadow-2xs"
                        >
                            {t('বন্ধ করুন', 'Close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BariSammelanModal;
