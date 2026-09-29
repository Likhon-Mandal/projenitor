import React, { useState, useEffect } from 'react';
import { X, BookOpen, Save, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

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
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity" />

            {/* Modal Dialog */}
            <div 
                className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-orange-100 my-8 animate-slide-up z-10"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-900 via-orange-800 to-orange-950 px-6 py-4.5 flex justify-between items-center text-white border-b border-orange-700/50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <BookOpen size={20} className="text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-serif font-bold leading-tight">
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
                        className="p-1.5 text-orange-200 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                        title={t('বন্ধ করুন', 'Close')}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body / Form */}
                <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-4.5 max-h-[75vh] overflow-y-auto font-sans">
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
                    <div className="border-t border-stone-100 pt-5 mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-5 py-2.5 text-stone-600 font-bold hover:bg-stone-100 rounded-xl transition-all border border-stone-200 text-sm cursor-pointer active:scale-95"
                        >
                            {t('বাতিল', 'Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-orange-800 hover:bg-orange-900 active:scale-95 text-white font-bold rounded-xl shadow-md shadow-orange-900/20 hover:shadow-lg transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
