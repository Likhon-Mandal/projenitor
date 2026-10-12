import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, BookOpen, Sparkles, Users, Award, Shield, Compass, Heart, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const AboutUsModal = ({ isOpen, onClose }) => {
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

    // Lock body scroll
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

    const handleNavigate = (path) => {
        onClose();
        navigate(path);
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-2.5 sm:p-5 bg-stone-950/70 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-3xl max-h-[88dvh] sm:max-h-[90vh] bg-[#fffcf7] rounded-2xl sm:rounded-3xl shadow-2xl border border-orange-200/90 flex flex-col overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-800 via-rose-800 to-red-950 text-white px-4 sm:px-7 py-3 sm:py-4 flex items-center justify-between gap-2.5 sm:gap-4 shadow-md relative z-10 border-b border-orange-950/20">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
                            <BookOpen size={18} className="fill-amber-300 text-amber-300 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm sm:text-lg font-serif font-bold text-white tracking-wide leading-tight line-clamp-1 sm:line-clamp-none">
                                {isBn ? 'আমাদের সম্পর্কে • বাড়ৈ বংশের ইতিবৃত্ত' : 'About Us • The Barai Lineage'}
                            </h3>
                            <p className="text-[11px] sm:text-xs text-orange-200/90 font-medium leading-snug line-clamp-1 sm:line-clamp-none mt-0.5">
                                {isBn ? 'ঐতিহাসিক "বাড়ৈ বংশের ইতিবৃত্ত" গ্রন্থের ডিজিটাল প্রতিরূপ' : 'Digital Archive of "The Barai Lineage" Heritage Book'}
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

                {/* Subtitle Banner */}
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border-b border-orange-200/70 px-4 sm:px-6 py-2 sm:py-2.5 flex items-center gap-2 text-[11px] sm:text-xs text-stone-750 font-medium">
                    <Sparkles size={13} className="text-amber-600 shrink-0" />
                    <span className="leading-tight">
                        {isBn
                            ? 'শিকড়ের সন্ধান, রক্তের বন্ধন ও প্রজন্মের ঐতিহ্যের মিলনমেলা'
                            : 'Rediscovering Roots, Bloodlines, and Generational Heritage'}
                    </span>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-4 sm:space-y-5 custom-scrollbar text-stone-750 text-sm leading-relaxed">
                    {/* Hero Introduction */}
                    <div className="bg-orange-50/60 rounded-2xl p-4 sm:p-5 border border-orange-200/80 shadow-2xs">
                        <h4 className="font-serif font-bold text-base sm:text-lg text-orange-950 mb-2">
                            {isBn ? 'আমাদের অনুপ্রেরণা ও যাত্রার প্রেক্ষাপট' : 'Our Inspiration & Journey'}
                        </h4>
                        <p className="text-xs sm:text-sm text-stone-700">
                            {isBn ? (
                                <>
                                    <strong>"বাড়ৈ বংশের ইতিবৃত্ত"</strong> কেবল একটি ডাটাবেজ নয়; এটি শত শত বছরের রক্তধারা, ত্যাগ এবং সম্পর্কের এক জীবন্ত প্রামাণ্য দলিল। আমাদের শ্রদ্ধেয় প্রবীণ ও গবেষকগণের অক্লান্ত পরিশ্রমে সংকলিত ঐতিহাসিক <strong>"বাড়ৈ বংশের ইতিবৃত্ত"</strong> গ্রন্থকে ডিজিটাল যুগে চিরভাস্বর রাখতে এবং ভবিষ্যৎ প্রজন্মের কাছে নিখুঁতভাবে তুলে ধরতেই এই প্ল্যাটফর্মের সূচনা।
                                </>
                            ) : (
                                <>
                                    <strong>"The Barai Lineage"</strong> is more than a digital database; it is a living chronicle of centuries of shared ancestry, sacrifice, and family bonds. Originating from the cherished <strong>"The Barai Lineage" (বাড়ৈ বংশের ইতিবৃত্ত)</strong> heritage book compiled by our dedicated elders, this platform brings ancestral history into the digital age for all generations.
                                </>
                            )}
                        </p>
                    </div>

                    {/* Mission Pillars Grid */}
                    <div>
                        <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base mb-3 flex items-center gap-2">
                            <Compass size={17} className="text-orange-700" />
                            <span>{isBn ? 'আমাদের মূল লক্ষ্য ও উদ্দেশ্য' : 'Our Core Missions'}</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 hover:border-orange-300 transition-all shadow-2xs hover:shadow-xs group">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <Users size={16} />
                                    </div>
                                    <h5 className="font-serif font-bold text-stone-900 text-sm">
                                        {isBn ? 'বংশলতিকা ও আত্মপরিচয়' : 'Genealogy & Identity'}
                                    </h5>
                                </div>
                                <p className="text-xs text-stone-600">
                                    {isBn
                                        ? 'প্রতিটি পরিবারের আদিপুরুষ থেকে শুরু করে বর্তমান বংশধরদের পারস্পরিক আত্মীয়তার সম্পর্ক নিখুঁতভাবে দৃশ্যমান করা।'
                                        : 'Mapping kinship trees from founding patriarchs to today’s descendants across generations.'}
                                </p>
                            </div>

                            <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 hover:border-orange-300 transition-all shadow-2xs hover:shadow-xs group">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <Sparkles size={16} />
                                    </div>
                                    <h5 className="font-serif font-bold text-stone-900 text-sm">
                                        {isBn ? 'ঐতিহাসিক সম্মেলন সংকলন' : 'Annual Gathering Chronicles'}
                                    </h5>
                                </div>
                                <p className="text-xs text-stone-600">
                                    {isBn
                                        ? '১৯৭৭ সাল থেকে শুরু হওয়া প্রতিটি ঐতিহাসিক বার্ষিক সম্মেলনের স্থান, স্মৃতি, আলোকচিত্র ও রেজুলেশন সংরক্ষণ।'
                                        : 'Archiving records, photos, memories, and host homes for every annual gathering since 1977.'}
                                </p>
                            </div>

                            <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 hover:border-orange-300 transition-all shadow-2xs hover:shadow-xs group">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <Heart size={16} />
                                    </div>
                                    <h5 className="font-serif font-bold text-stone-900 text-sm">
                                        {isBn ? 'পারস্পরিক ভ্রাতৃত্ব ও সহায়তা' : 'Community Welfare'}
                                    </h5>
                                </div>
                                <p className="text-xs text-stone-600">
                                    {isBn
                                        ? 'জরুরি রক্তদান নেটওয়ার্ক, আর্থিক ও শিক্ষামূলক সহায়তা দিয়ে জ্ঞাতি পরিবারের সুখে-দুঃখে পাশে থাকা।'
                                        : 'Providing emergency blood donation matching and education aid to support clan members.'}
                                </p>
                            </div>

                            <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 hover:border-orange-300 transition-all shadow-2xs hover:shadow-xs group">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <Award size={16} />
                                    </div>
                                    <h5 className="font-serif font-bold text-stone-900 text-sm">
                                        {isBn ? 'কৃতি সংবর্ধনা ও ভবিষ্যৎ' : 'Honoring Achievements'}
                                    </h5>
                                </div>
                                <p className="text-xs text-stone-600">
                                    {isBn
                                        ? 'বংশের গুণী ব্যক্তিত্ব, বীর মুক্তিযোদ্ধা ও কৃতী শিক্ষার্থীদের সাফল্য লিপিবদ্ধ করে অনুপ্রাণিত করা।'
                                        : 'Celebrating eminent elders, freedom fighters, and brilliant young achievers.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Geographical Footprint Note */}
                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60 text-xs text-stone-700">
                        <div className="flex items-start gap-2.5">
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-semibold text-stone-900">
                                    {isBn ? 'ভৌগোলিক পরিধি ও বিস্তার:' : 'Geographical Coverage:'}
                                </strong>{' '}
                                {isBn
                                    ? 'মাদারীপুর (রাজৈর, ভেন্নাবাড়ী, শাখারপাড়, কদমবাড়ী), গোপালগঞ্জ (কোটালীপাড়া, বটবাড়ি), বরিশালসহ দেশ-বিদেশে বিস্তৃত সকল জ্ঞাতি পরিবারকে এক প্লাটফর্মে নিয়ে আসা হয়েছে।'
                                    : 'Covering ancestral roots from Madaripur (Rajoir, Vennabari, Shakharpar), Gopalganj (Kotalipara), Barishal, and global diaspora.'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-stone-50 border-t border-orange-200/80 px-4 sm:px-7 py-3 sm:py-3.5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
                        <button
                            onClick={() => handleNavigate('/explorer')}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-1.5 rounded-xl bg-orange-800 hover:bg-orange-700 text-white font-medium shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 text-center"
                        >
                            <span className="truncate">{isBn ? 'বংশধারা দেখুন' : 'Explore Lineage'}</span>
                            <ArrowRight size={12} className="shrink-0" />
                        </button>

                        <button
                            onClick={() => handleNavigate('/sammelan')}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-semibold border border-amber-300 transition-all cursor-pointer active:scale-95 text-center"
                        >
                            <span className="truncate">{isBn ? 'সম্মেলনের ইতিহাস' : 'Chronicles'}</span>
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2 sm:py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl transition-colors cursor-pointer active:scale-95 text-center shadow-2xs"
                    >
                        {t('বন্ধ করুন', 'Close')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AboutUsModal;
