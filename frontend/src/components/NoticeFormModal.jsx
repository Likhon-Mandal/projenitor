import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Megaphone, Calendar, AlignLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';
import { formatDateDDMMYYYY } from '../utils/dateUtils';

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

const getTodayDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatDisplayDate = (dStr) => {
    return formatDateDDMMYYYY(dStr);
};

const NoticeFormModal = ({ isOpen, onClose, onSuccess, initialData }) => {
    const { t, isBn } = useLanguage();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [date, setDate] = useState(getTodayDate());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setContent(initialData.content || '');
                const cleanDate = initialData.date 
                    ? (initialData.date.includes('T') ? initialData.date.split('T')[0] : initialData.date)
                    : getTodayDate();
                setDate(cleanDate);
            } else {
                setTitle('');
                setContent('');
                setDate(getTodayDate());
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            return alert(t('বিজ্ঞপ্তির শিরোনাম এবং বিষয়বস্তু আবশ্যক।', 'Title and Content are required.'));
        }

        setLoading(true);

        const payload = {
            title: title.trim(),
            type: 'General',
            content: content.trim(),
            date: date || getTodayDate(),
            posted_by: 'Admin'
        };

        try {
            if (initialData?.id) {
                await api.put(`/notices/${initialData.id}`, payload);
            } else {
                await api.post('/notices', payload);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 app-sheet z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" onClick={onClose}>
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"></div>

            <div
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up border border-orange-100 my-auto flex flex-col max-h-[92vh]"
                onClick={e => e.stopPropagation()}
            >
                <style>{FM_CSS}</style>
                {/* Header */}
                <div className="shrink-0 bg-gradient-to-r from-orange-800 to-amber-700 px-5 sm:px-6 py-4 sm:py-5 flex justify-between items-center gap-3 text-white">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <Megaphone size={20} className="text-yellow-300" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-serif font-bold text-white">
                                {initialData ? t('বিজ্ঞপ্তি সম্পাদনা', 'Edit Notice') : t('নতুন বিজ্ঞপ্তি প্রকাশ করুন', 'Add New Notice')}
                            </h2>
                            <p className="text-xs text-orange-200">
                                {t('বংশের সদস্যদের জন্য অফিশিয়াল নোটিশ লিখুন', 'Official announcements for family members')}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        type="button"
                        aria-label={t('বন্ধ করুন', 'Close')}
                        className="shrink-0 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="fm-skin flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">
                    <form id="notice-form" onSubmit={handleSubmit} className="space-y-4 fm-rise">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                                <Megaphone size={14} className="text-orange-600" />
                                {t('বিজ্ঞপ্তির শিরোনাম *', 'Notice Title *')}
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder={t('যেমন: আসন্ন বার্ষিক সাধারণ সভা ও ভোজনের সূচি', 'e.g. 94th Annual Gathering Announced')}
                                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm font-medium"
                                required
                            />
                        </div>

                        {/* Creation Date Display (Non-editable) */}
                        <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-stone-700 text-xs font-semibold">
                                <Calendar size={14} className="text-orange-700 shrink-0" />
                                <span>{initialData ? t('বিজ্ঞপ্তি তৈরির তারিখ:', 'Created Date:') : t('বিজ্ঞপ্তি তৈরির তারিখ (আজকের দিন):', 'Creation Date (Today):')}</span>
                            </div>
                            <span className="font-bold text-xs text-orange-950 bg-white px-3 py-1 rounded-lg border border-orange-200 shadow-xs">
                                {formatDisplayDate(date, isBn)}
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                                <AlignLeft size={14} className="text-orange-600" />
                                {t('বিজ্ঞপ্তির বিস্তারিত বিবরণ *', 'Notice Content *')}
                            </label>
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder={t('বিজ্ঞপ্তির বিস্তারিত তথ্য ও বার্তা এখানে লিখুন...', 'Provide the details of the announcement here...')}
                                rows="5"
                                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm resize-none"
                                required
                            ></textarea>
                        </div>
                    </form>
                </div>

                {/* Footer Controls */}
                <div className="shrink-0 border-t border-stone-100 px-4 py-3 sm:p-4 bg-orange-50/60 grid grid-cols-2 sm:flex sm:justify-end gap-2.5 sm:gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-[46px] sm:min-h-0 justify-center flex items-center px-5 py-2 text-stone-600 font-bold bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors text-sm cursor-pointer"
                        disabled={loading}
                    >
                        {t('বাতিল', 'Cancel')}
                    </button>
                    <button
                        type="submit"
                        form="notice-form"
                        disabled={loading}
                        className="min-h-[46px] sm:min-h-0 justify-center px-6 py-2 bg-gradient-to-r from-orange-700 to-red-800 hover:brightness-110 text-white font-bold rounded-xl shadow-md shadow-orange-900/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                {t('সংরক্ষণ হচ্ছে...', 'Saving...')}
                            </span>
                        ) : (
                            <>
                                <CheckCircle2 size={16} /> 
                                {initialData ? t('পরিবর্তন সংরক্ষণ করুন', 'Save Changes') : t('বিজ্ঞপ্তি প্রকাশ করুন', 'Publish Notice')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoticeFormModal;
