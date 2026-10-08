import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, GraduationCap, Building2 } from 'lucide-react';
import MemberSelector from './MemberSelector';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

const BRILLIANT_ACHIEVEMENT_OPTIONS = [
    { id: 'এসএসসি (GPA-5.00)', bn: 'এসএসসি (GPA 5.00)', en: 'Got GPA-5 in SSC' },
    { id: 'এইচএসসি (GPA-5.00)', bn: 'এইচএসসি (GPA 5.00)', en: 'Got GPA-5 in HSC' },
    { id: 'জেএসসি (বৃত্তি / GPA-5)', bn: 'জেএসসি (বৃত্তি / GPA 5.00)', en: 'Got GPA-5 in JSC' },
    { id: 'পাবলিক বিশ্ববিদ্যালয়ে ভর্তি', bn: 'পাবলিক বিশ্ববিদ্যালয়ে ভর্তি', en: 'Got Chance in Public University' },
    { id: 'প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (বুয়েট/কুয়েট/রুয়েট ইত্যাদি)', bn: 'প্রকৌশল বিশ্ববিদ্যালয় (বুয়েট/ইত্যাদি)', en: 'Got Chance in Engineering University (BUET/etc.)' },
    { id: 'সরকারি মেডিকেল কলেজে ভর্তি', bn: 'সরকারি মেডিকেল কলেজে ভর্তি', en: 'Got Chance in Medical College' },
    { id: 'জাতীয় / আন্তর্জাতিক বৃত্তিপ্রাপ্ত', bn: 'জাতীয় / আন্তর্জাতিক মেধা বৃত্তিপ্রাপ্ত', en: 'National / International Scholarship' },
    { id: 'পিএসসি / সমাপনী (বৃত্তি / GPA-5)', bn: 'পিএসসি / সমাপনী (বৃত্তি / GPA 5.00)', en: 'Got GPA-5 in PSC / Primary' },
    { id: 'অন্যান্য বিশেষ মেধা ও স্বীকৃতি', bn: 'অন্যান্য বিশেষ মেধা ও স্বীকৃতি', en: 'Other Academic Excellence' }
];

const EminentFormModal = ({ isOpen, onClose, onSuccess, initialData, categories, activeCategory }) => {
    const { t, isBn, formatName } = useLanguage();
    const [categoryId, setCategoryId] = useState('');
    const [title, setTitle] = useState('');
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [institution, setInstitution] = useState('');
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(false);

    const targetCategory = initialData?.category || activeCategory || (categories && categories.length > 0 ? categories[0].id : 'কৃতি শিক্ষার্থী');
    const categoryInfo = categories?.find(c => c.id === (categoryId || targetCategory));
    const categoryLabel = categoryInfo ? (isBn ? categoryInfo.bnLabel : categoryInfo.enLabel) : (categoryId || targetCategory);
    const isBrilliantCategory = (categoryId || targetCategory) === 'কৃতি শিক্ষার্থী';

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

                if (initialData.reason) {
                    const matched = BRILLIANT_ACHIEVEMENT_OPTIONS.find(opt => 
                        opt.id === initialData.reason ||
                        (opt.id.includes('জেএসসি') && (initialData.reason.includes('জেএসসি') || initialData.reason.includes('জেডিসি') || /jsc|jdc/i.test(initialData.reason))) ||
                        (opt.id.includes('এসএসসি') && initialData.reason.includes('এসএসসি')) ||
                        (opt.id.includes('এইচএসসি') && initialData.reason.includes('এইচএসসি')) ||
                        (opt.id.includes('পাবলিক') && initialData.reason.includes('পাবলিক')) ||
                        (opt.id.includes('মেডিকেল') && initialData.reason.includes('মেডিকেল')) ||
                        (opt.id.includes('প্রকৌশল') && initialData.reason.includes('প্রকৌশল'))
                    );
                    if (matched) {
                        setReason(matched.id);
                        setCustomReason('');
                    } else {
                        setReason('অন্যান্য বিশেষ মেধা ও স্বীকৃতি');
                        setCustomReason(initialData.reason);
                    }
                    setInstitution(initialData.institution || '');
                } else if (initialData.category === 'কৃতি শিক্ষার্থী' && initialData.title) {
                    const parts = initialData.title.split(' - ').map(s => s.trim());
                    const matched = BRILLIANT_ACHIEVEMENT_OPTIONS.find(opt => 
                        opt.id === parts[0] || 
                        initialData.title.includes(opt.id) ||
                        (opt.id.includes('জেএসসি') && (initialData.title.includes('জেএসসি') || initialData.title.includes('জেডিসি') || /jsc|jdc/i.test(initialData.title)))
                    );
                    if (matched) {
                        setReason(matched.id);
                        setCustomReason('');
                    } else if (parts[0]) {
                        setReason('অন্যান্য বিশেষ মেধা ও স্বীকৃতি');
                        setCustomReason(parts[0]);
                    } else {
                        setReason('');
                        setCustomReason('');
                    }
                    setInstitution(parts.slice(1).join(' - '));
                } else {
                    setReason('');
                    setCustomReason('');
                    setInstitution(initialData.institution || '');
                }
            } else {
                setCategoryId(activeCategory || (categories && categories.length > 0 ? categories[0].id : ''));
                setTitle('');
                setReason('');
                setCustomReason('');
                setInstitution('');
                setMember(null);
            }
            setLoading(false);
        }
    }, [isOpen, initialData, categories, activeCategory]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!member) {
            return alert(t('অনুগ্রহ করে একজন সদস্য নির্বাচন করুন।', 'Please select a member.'));
        }
        const finalCategory = categoryId || targetCategory;
        if (!finalCategory) {
            return alert(t('অনুগ্রহ করে একটি ক্যাটাগরি নির্বাচন করুন।', 'Please select a category.'));
        }

        const isBrilliant = finalCategory === 'কৃতি শিক্ষার্থী';

        let finalReason = reason;
        if (isBrilliant) {
            if (!finalReason || !finalReason.trim()) {
                return alert(t('কৃতি শিক্ষার্থীর অর্জনের কারণ নির্বাচন করা বাধ্যতামূলক।', 'Achievement reason is required for Brilliant Students.'));
            }
            if (finalReason === 'অন্যান্য বিশেষ মেধা ও স্বীকৃতি') {
                if (!customReason.trim()) {
                    return alert(t('অনুগ্রহ করে নির্দিষ্ট অর্জনের বিবরণ লিখুন।', 'Please enter specific achievement details.'));
                }
                finalReason = customReason.trim();
            }
            if (!institution || !institution.trim()) {
                return alert(t('শিক্ষা প্রতিষ্ঠানের নাম দেওয়া বাধ্যতামূলক।', 'Institution name is required for Brilliant Students.'));
            }
        }

        setLoading(true);

        const computedTitle = isBrilliant
            ? [finalReason.trim(), institution.trim()].filter(Boolean).join(' - ')
            : title.trim();

        const payload = {
            member_id: member.id,
            category: finalCategory,
            title: computedTitle,
            reason: isBrilliant ? finalReason.trim() : null,
            institution: isBrilliant ? institution.trim() : null
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
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm animate-fade-in"></div>

            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up border border-stone-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-900 to-amber-900 px-6 py-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-yellow-400" />
                        <h2 className="text-lg sm:text-xl font-serif font-bold tracking-wide">
                            {initialData ? t('স্বীকৃতি সম্পাদনা করুন', 'Edit Recognition') : t('বিশিষ্ট ব্যক্তিত্ব যোগ করুন', 'Add Eminent Figure')}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-stone-200 hover:text-white"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
                    <form id="eminent-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

                        {/* Member Selection */}
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1.5">
                                {t('সদস্য *', 'Target Member *')}
                            </label>
                            {initialData ? (
                                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 font-bold flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                                    <span>{formatName(member)}</span>
                                </div>
                            ) : (
                                <MemberSelector
                                    onSelect={(m) => setMember(m)}
                                    selectedMember={member}
                                    placeholder={t('নাম বা আইডি দিয়ে খুঁজুন...', 'Search by name or ID...')}
                                />
                            )}
                        </div>

                        {/* Category Display */}
                        <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
                            <div>
                                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                                    {t('সম্মাননার বিভাগ (ক্যাটাগরি)', 'Recognition Category')}
                                </span>
                                <span className="font-serif font-bold text-orange-950 text-base">
                                    {categoryLabel}
                                </span>
                            </div>
                            <span className="text-xs bg-orange-200/80 text-orange-900 font-semibold px-2.5 py-1 rounded-full border border-orange-300/50">
                                {t('বর্তমান বিভাগ', 'Active Category')}
                            </span>
                        </div>

                        {/* Brilliant Student Specific Inputs: Dropdown Reason + Institution */}
                        {isBrilliantCategory ? (
                            <>
                                {/* Reason Dropdown (Mandatory) */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-bold text-stone-700 mb-1.5">
                                        <GraduationCap size={16} className="text-orange-700" />
                                        <span>{t('অর্জনের কারণ (বাধ্যতামূলক) *', 'Achievement Reason (Required) *')}</span>
                                    </label>
                                    <select
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        required
                                        className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-stone-800 text-sm font-medium transition-all shadow-2xs cursor-pointer hover:border-orange-400"
                                    >
                                        <option value="">
                                            {t('-- অর্জনের কারণ নির্বাচন করুন --', '-- Select Achievement Reason --')}
                                        </option>
                                        {BRILLIANT_ACHIEVEMENT_OPTIONS.map(opt => (
                                            <option key={opt.id} value={opt.id}>
                                                {isBn ? opt.bn : opt.en}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Custom Reason if 'Other' is chosen */}
                                {reason === 'অন্যান্য বিশেষ মেধা ও স্বীকৃতি' && (
                                    <div className="animate-fade-in">
                                        <label className="block text-xs font-bold text-stone-600 mb-1">
                                            {t('নির্দিষ্ট অর্জনের বিবরণ *', 'Specific Achievement Detail *')}
                                        </label>
                                        <input
                                            type="text"
                                            value={customReason}
                                            onChange={e => setCustomReason(e.target.value)}
                                            placeholder={t('যেমন: গণিত অলিম্পিয়াড রানার্সআপ, আন্তর্জাতিক ফেলোশিপ...', 'e.g. Math Olympiad runner-up, Research fellowship...')}
                                            required
                                            className="w-full border border-stone-300 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium transition-all"
                                        />
                                    </div>
                                )}

                                {/* Institution Name (Mandatory) */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-bold text-stone-700 mb-1.5">
                                        <Building2 size={16} className="text-orange-700" />
                                        <span>{t('শিক্ষা প্রতিষ্ঠান / বিশ্ববিদ্যালয়ের নাম *', 'Institution / University Name *')}</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={institution}
                                        onChange={e => setInstitution(e.target.value)}
                                        placeholder={t('যেমন: ঢাকা বিশ্ববিদ্যালয়, বুয়েট, নটর ডেম কলেজ...', 'e.g. Dhaka University, BUET, Notre Dame College...')}
                                        required
                                        className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium transition-all shadow-2xs hover:border-orange-400"
                                    />
                                </div>
                            </>
                        ) : (
                            /* Other Categories: Sub-Title or General Reason */
                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-1.5">
                                    {t('কারণ বা বিবরণ (ঐচ্ছিক)', 'Sub-Title or Reason (Optional)')}
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder={t('যেমন: সমাজসেবক, প্রতিষ্ঠাতা সদস্য...', 'e.g. Social worker, Founder member...')}
                                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium transition-all shadow-2xs hover:border-orange-400"
                                />
                            </div>
                        )}

                    </form>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-stone-100 p-4 bg-stone-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-stone-600 font-bold hover:bg-stone-200 rounded-xl transition-all border border-stone-300 cursor-pointer active:scale-95"
                        disabled={loading}
                    >
                        {t('বাতিল', 'Cancel')}
                    </button>
                    <button
                        type="submit"
                        form="eminent-form"
                        disabled={loading}
                        className="px-6 py-2 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? (
                            t('সংরক্ষণ হচ্ছে...', 'Saving...')
                        ) : (
                            <>
                                <CheckCircle2 size={18} />
                                {initialData ? t('হালনাগাদ করুন', 'Update Record') : t('সংরক্ষণ করুন', 'Add Recognition')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EminentFormModal;
