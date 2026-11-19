import React, { useState, useEffect } from 'react';
import { X, BookOpen, Save, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

const FM_CSS = `
.fm-skin :is(input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]):not([type=color]):not(.bg-transparent), select:not(.bg-transparent), textarea:not(.bg-transparent)) {
    border-radius: .75rem;
    background-color: rgb(var(--surface));
    color: rgb(var(--tx-stone-800));
    transition: border-color .15s ease, box-shadow .15s ease;
}
.fm-skin :is(input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]):not([type=color]), select) { min-height: 44px; }
.fm-skin :is(input, select, textarea):focus { outline: none; border-color: rgb(var(--bd-orange-500)); box-shadow: 0 0 0 4px rgb(var(--bd-orange-500) / .16); }
.fm-skin :is(input, textarea)::placeholder { color: rgb(var(--tx-stone-400)); }
.fm-skin select {
    -webkit-appearance: none; appearance: none; padding-right: 2.25rem;
    background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);
    background-position: calc(100% - 18px) 52%, calc(100% - 13px) 52%;
    background-size: 5px 5px; background-repeat: no-repeat;
}
.fm-skin :is(input, select, textarea):disabled { opacity: .6; cursor: not-allowed; }
@keyframes fm-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.fm-rise { animation: fm-rise .35s ease-out both; }
@media (prefers-reduced-motion: reduce) { .fm-skin *, .fm-rise { transition: none !important; animation: none !important; } }
`;

const HistoryFormModal = ({ isOpen, onClose, onSuccess, initialData, nextOrder = 1 }) => {
    const { t, isBn } = useLanguage();
    const [titleBn, setTitleBn] = useState('');
    const [titleEn, setTitleEn] = useState('');
    const [contentBn, setContentBn] = useState('');
    const [contentEn, setContentEn] = useState('');
    const [displayOrder, setDisplayOrder] = useState(1);
    const [isLead, setIsLead] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            if (initialData) {
                setTitleBn(initialData.title_bn || '');
                setTitleEn(initialData.title_en || '');
                setContentBn(initialData.content_bn || '');
                setContentEn(initialData.content_en || '');
                setDisplayOrder(initialData.display_order ?? 1);
                setIsLead(Boolean(initialData.is_lead));
            } else {
                setTitleBn('');
                setTitleEn('');
                setContentBn('');
                setContentEn('');
                setDisplayOrder(nextOrder);
                setIsLead(false);
            }
        }
    }, [isOpen, initialData, nextOrder]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!contentBn.trim()) {
            setError(t('অনুচ্ছেদের বাংলা মূল লেখা আবশ্যক।', 'Bengali content text is required.'));
            return;
        }

        setLoading(true);
        const payload = {
            title_bn: titleBn.trim() || null,
            title_en: titleEn.trim() || null,
            content_bn: contentBn.trim(),
            content_en: contentEn.trim() || null,
            display_order: parseInt(displayOrder, 10) || 0,
            is_lead: isLead
        };

        try {
            if (initialData?.id) {
                await api.put(`/history/${initialData.id}`, payload);
            } else {
                await api.post('/history', payload);
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('History submit error:', err);
            setError(err.response?.data?.error || err.message || t('সংরক্ষণ ব্যর্থ হয়েছে।', 'Failed to save history section.'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 app-sheet z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity" />

            {/* Modal Dialog */}
            <div 
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-orange-100 my-8 animate-slide-up z-10 flex flex-col max-h-[92vh]"
                onClick={e => e.stopPropagation()}
            >
                <style>{FM_CSS}</style>
                {/* Header */}
                <div className="shrink-0 bg-gradient-to-r from-orange-900 via-orange-800 to-orange-950 px-5 sm:px-6 py-4 flex justify-between items-center gap-3 text-white border-b border-orange-700/50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <BookOpen size={20} className="text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-serif font-bold leading-tight text-white">
                                {initialData 
                                    ? t('ঐতিহাসিক অনুচ্ছেদ সম্পাদনা', 'Edit History Section')
                                    : t('নতুন ঐতিহাসিক অনুচ্ছেদ যোগ করুন', 'Add New History Section')
                                }
                            </h2>
                            <p className="text-xs text-orange-200/80 font-sans">
                                {t('বংশের ইতিহাস ও ঐতিহ্যের বিবরণ পরিচালনা', 'Manage clan history and ancestral narratives')}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        type="button"
                        className="shrink-0 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                        title={t('বন্ধ করুন', 'Close')}
                        aria-label={t('বন্ধ করুন', 'Close')}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body / Form */}
                <form onSubmit={handleSubmit} className="fm-skin fm-rise flex-1 min-h-0 p-5 sm:p-7 pb-0 sm:pb-0 space-y-4.5 overflow-y-auto overscroll-contain font-sans">
                    {error && (
                        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Titles (Bangla & English) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1.5">
                                {t('শিরোনাম (বাংলা) - ঐচ্ছিক', 'Section Title (Bangla) - Optional')}
                            </label>
                            <input
                                type="text"
                                value={titleBn}
                                onChange={e => setTitleBn(e.target.value)}
                                placeholder={t('যেমন: ২০১৩ সালের ঐতিহাসিক কুলগ্রন্থ', 'e.g. ২০১৩ সালের ঐতিহাসিক কুলগ্রন্থ')}
                                className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all placeholder:text-stone-400 font-sans"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1.5">
                                {t('শিরোনাম (English) - Optional', 'Section Title (English) - Optional')}
                            </label>
                            <input
                                type="text"
                                value={titleEn}
                                onChange={e => setTitleEn(e.target.value)}
                                placeholder="e.g. The 2013 Ancestral Book"
                                className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all placeholder:text-stone-400 font-sans"
                            />
                        </div>
                    </div>

                    {/* Content (Bangla) * Required */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs sm:text-sm font-bold text-stone-700">
                                {t('মূল বিবরণ / লেখা (বাংলা) *', 'Narrative / Content (Bangla) *')}
                            </label>
                            <span className="text-[11px] text-orange-800 font-medium">
                                {t('আবশ্যক', 'Required')}
                            </span>
                        </div>
                        <textarea
                            rows={5}
                            value={contentBn}
                            onChange={e => setContentBn(e.target.value)}
                            placeholder={t('এখানে বিস্তারিত ইতিহাস বা অনুচ্ছেদের মূল বক্তব্য লিখুন...', 'Write the historical narrative in Bengali here...')}
                            required
                            className="w-full border border-stone-200 rounded-xl p-3.5 text-sm leading-relaxed focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all placeholder:text-stone-400 font-sans resize-y"
                        />
                    </div>

                    {/* Content (English) - Optional */}
                    <div>
                        <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1.5">
                            {t('মূল বিবরণ / লেখা (English) - ঐচ্ছিক', 'Narrative / Content (English) - Optional')}
                        </label>
                        <textarea
                            rows={4}
                            value={contentEn}
                            onChange={e => setContentEn(e.target.value)}
                            placeholder="Write the English translation or narrative here..."
                            className="w-full border border-stone-200 rounded-xl p-3.5 text-sm leading-relaxed focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all placeholder:text-stone-400 font-sans resize-y"
                        />
                    </div>

                    {/* Settings: Display Order & Lead Format */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 items-center">
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1.5">
                                {t('প্রদর্শনের ক্রম (Display Order)', 'Display Order')}
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={displayOrder}
                                onChange={e => setDisplayOrder(e.target.value)}
                                className="w-full border border-stone-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all font-sans"
                            />
                            <p className="text-[11px] text-stone-500 mt-1">
                                {t('ছোট ক্রমের অনুচ্ছেদ আগে প্রদর্শিত হবে (১, ২, ৩...)', 'Lower numbers are displayed first (1, 2, 3...)')}
                            </p>
                        </div>

                        <div className="sm:pt-4">
                            <label className="flex items-center gap-3 p-3 rounded-xl border border-orange-100 bg-orange-50/60 hover:bg-orange-50 cursor-pointer transition-colors select-none">
                                <input
                                    type="checkbox"
                                    checked={isLead}
                                    onChange={e => setIsLead(e.target.checked)}
                                    className="w-4 h-4 rounded text-orange-800 focus:ring-orange-600 accent-orange-800 cursor-pointer"
                                />
                                <div>
                                    <span className="text-xs sm:text-sm font-bold text-stone-800 block">
                                        {t('মূল ভূমিকা / সারাংশ অনুচ্ছেদ', 'Lead / Summary Paragraph')}
                                    </span>
                                    <span className="text-[11px] text-stone-500 block">
                                        {t('বড় ফন্ট ও প্রধান ভূমিকা হিসেবে বিশেষ প্রদর্শন', 'Render with larger emphasis as intro lead')}
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-7 mt-6 px-4 sm:px-7 py-3 sm:py-4 border-t border-stone-100 bg-white/95 backdrop-blur grid grid-cols-2 sm:flex sm:justify-end gap-2.5 sm:gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="min-h-[46px] sm:min-h-0 justify-center flex items-center px-5 py-2 text-stone-600 font-bold bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors text-sm cursor-pointer"
                        >
                            {t('বাতিল', 'Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="min-h-[46px] sm:min-h-0 justify-center px-6 py-2 bg-gradient-to-r from-orange-700 to-red-800 hover:brightness-110 text-white font-bold rounded-xl shadow-md shadow-orange-900/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 text-sm cursor-pointer disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>{t('সংরক্ষণ হচ্ছে...', 'Saving...')}</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>{t('সংরক্ষণ করুন', 'Save Section')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HistoryFormModal;
