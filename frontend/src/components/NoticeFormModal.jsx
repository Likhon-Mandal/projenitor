import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Megaphone, Calendar, AlignLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';
import { formatDateDDMMYYYY } from '../utils/dateUtils';

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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" onClick={onClose}>
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"></div>

            <div
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up border border-orange-100 my-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-800 to-amber-700 px-6 py-5 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <Megaphone size={20} className="text-yellow-300" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-serif font-bold">
                                {initialData ? t('বিজ্ঞপ্তি সম্পাদনা', 'Edit Notice') : t('নতুন বিজ্ঞপ্তি প্রকাশ করুন', 'Add New Notice')}
                            </h2>
                            <p className="text-xs text-orange-200">
                                {t('বংশের সদস্যদের জন্য অফিশিয়াল নোটিশ লিখুন', 'Official announcements for family members')}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-6">
                    <form id="notice-form" onSubmit={handleSubmit} className="space-y-4">
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
                <div className="border-t border-stone-100 p-4 bg-orange-50/40 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-stone-600 font-bold hover:bg-stone-200/80 border border-stone-200 rounded-xl transition-colors text-xs sm:text-sm"
                        disabled={loading}
                    >
                        {t('বাতিল', 'Cancel')}
                    </button>
                    <button
                        type="submit"
                        form="notice-form"
                        disabled={loading}
                        className="px-6 py-2 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 text-xs sm:text-sm"
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
