import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import MemberSelector from './MemberSelector';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

const EminentFormModal = ({ isOpen, onClose, onSuccess, initialData, categories, activeCategory }) => {
    const { t, isBn, formatName } = useLanguage();
    const [categoryId, setCategoryId] = useState('');
    const [title, setTitle] = useState('');
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(false);

    const targetCategory = initialData?.category || activeCategory || (categories && categories.length > 0 ? categories[0].id : 'কৃতি শিক্ষার্থী');
    const categoryInfo = categories?.find(c => c.id === (categoryId || targetCategory));
    const categoryLabel = categoryInfo ? (isBn ? categoryInfo.bnLabel : categoryInfo.enLabel) : (categoryId || targetCategory);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setCategoryId(initialData.category);
                setTitle(initialData.title || '');
                setMember({
                    id: initialData.member_id,
                    full_name: initialData.full_name,
                    name_bangla: initialData.name_bangla,
                    name_english: initialData.name_english
                });
            } else {
                setCategoryId(activeCategory || (categories && categories.length > 0 ? categories[0].id : ''));
                setTitle('');
                setMember(null);
            }
            setLoading(false);
        }
    }, [isOpen, initialData, categories, activeCategory]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!member) return alert(t('অনুগ্রহ করে একজন সদস্য নির্বাচন করুন।', 'Please select a member.'));
        const finalCategory = categoryId || targetCategory;
        if (!finalCategory) return alert(t('অনুগ্রহ করে একটি ক্যাটাগরি নির্বাচন করুন।', 'Please select a category.'));

        setLoading(true);

        const payload = {
            member_id: member.id,
            category: finalCategory,
            title: title.trim()
        };

        try {
            if (initialData) {
                await api.put(`/eminent/${initialData.id}`, payload);
            } else {
                await api.post('/eminent', payload);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"></div>

            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-stone-800 to-stone-600 px-6 py-4 flex justify-between items-center text-white">
                    <h2 className="text-xl font-serif font-bold">
                        {initialData ? t('স্বীকৃতি সম্পাদনা করুন', 'Edit Recognition') : t('বিশিষ্ট ব্যক্তিত্ব যোগ করুন', 'Add Eminent Figure')}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-6">
                    <form id="eminent-form" onSubmit={handleSubmit} className="space-y-5">

                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">{t('সদস্য *', 'Target Member *')}</label>
                            {initialData ? (
                                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 font-bold">
                                    {formatName(member)}
                                </div>
                            ) : (
                                <MemberSelector
                                    onSelect={(m) => setMember(m)}
                                    selectedMember={member}
                                    placeholder={t('নাম বা আইডি দিয়ে খুঁজুন...', 'Search by name or ID...')}
                                />
                            )}
                        </div>

                        {/* Category Display - Auto determined by current active tab */}
                        <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
                            <div>
                                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                                    {t('সম্মাননার বিভাগ (ক্যাটাগরি)', 'Recognition Category')}
                                </span>
                                <span className="font-serif font-bold text-orange-950 text-base">
                                    {categoryLabel}
                                </span>
                            </div>
                            <span className="text-xs bg-orange-200/60 text-orange-900 font-semibold px-2.5 py-1 rounded-full border border-orange-300/40">
                                {t('স্বয়ংক্রিয় নির্ধারিত', 'Current Tab')}
                            </span>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">{t('কারণ বা বিবরণ (ঐচ্ছিক)', 'Sub-Title or Reason (Optional)')}</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full border border-stone-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm"
                            />
                        </div>

                    </form>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-stone-100 p-4 bg-stone-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-stone-600 font-bold hover:bg-stone-200 rounded-lg transition-colors border border-stone-300"
                        disabled={loading}
                    >
                        {t('বাতিল', 'Cancel')}
                    </button>
                    <button
                        type="submit"
                        form="eminent-form"
                        disabled={loading}
                        className="px-6 py-2 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? t('সংরক্ষণ হচ্ছে...', 'Saving...') : <><CheckCircle2 size={18} /> {initialData ? t('হালনাগাদ করুন', 'Update Record') : t('সংরক্ষণ করুন', 'Add Recognition')}</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EminentFormModal;
