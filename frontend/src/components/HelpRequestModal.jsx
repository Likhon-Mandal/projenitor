import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import MemberSelector from './MemberSelector';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

const tagsList = [
    { id: 'Research', bn: 'গবেষণা', en: 'Research' },
    { id: 'Medical', bn: 'চিকিৎসা', en: 'Medical' },
    { id: 'Financial', bn: 'আর্থিক', en: 'Financial' },
    { id: 'Advice', bn: 'পরামর্শ', en: 'Advice' },
    { id: 'Other', bn: 'অন্যান্য', en: 'Other' }
];

const HelpRequestModal = ({ isOpen, onClose, onSuccess, initialData }) => {
    const { t, formatName } = useLanguage();
    const [title, setTitle] = useState('');
    const [tag, setTag] = useState('Advice');
    const [type, setType] = useState('alert');
    const [content, setContent] = useState('');
    const [helpSeeker, setHelpSeeker] = useState('');
    const [selectedSeeker, setSelectedSeeker] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setTag(initialData.tag || 'Advice');
                setType(initialData.type || 'alert');
                setContent(initialData.content || '');
                setHelpSeeker(initialData.help_seeker || '');
            } else {
                setTitle('');
                setTag('Advice');
                setType('alert');
                setContent('');
                setHelpSeeker('');
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !tag) {
            alert('Title and Tag are required');
            return;
        }

        setLoading(true);

        const payload = {
            title: title.trim(),
            tag,
            type,
            content: content.trim(),
            help_seeker: helpSeeker.trim(),
            posted_by: helpSeeker.trim() || 'Anonymous'
        };

        try {
            if (initialData?.id) {
                await api.put(`/help/${initialData.id}`, payload);
            } else {
                await api.post('/help', payload);
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
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex justify-center items-center z-[9999] px-4 animate-fade-in">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-6 py-4 flex justify-between items-center text-white ${type === 'alert' ? 'bg-gradient-to-r from-red-800 to-red-600' : 'bg-gradient-to-r from-stone-800 to-stone-600'}`}>
                    <h2 className="text-xl font-serif font-bold">
                        {initialData ? t('অনুরোধ সম্পাদনা করুন', 'Edit Request') : t('নতুন সহায়তার অনুরোধ', 'Create New Request')}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">{t('অনুরোধের শিরোনাম *', 'Request Title *')}</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-stone-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none text-stone-800 placeholder-stone-400 bg-stone-50"
                            placeholder={t('যেমন: জরুরি ভিত্তিতে রক্তের প্রয়োজন...', 'e.g. Urgent: B+ Blood Donor needed in Dhaka')}
                            required
                        />
                    </div>

                    {/* Help Seeker Selection */}
                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">{t('সাহায্যপ্রার্থী (সদস্য নির্বাচন করুন)', 'Help Seeker (Select Member)')}</label>
                        <MemberSelector
                            label=""
                            onSelect={(member) => {
                                setSelectedSeeker(member);
                                if (member) {
                                    setHelpSeeker(formatName(member));
                                } else {
                                    setHelpSeeker('');
                                }
                            }}
                            selectedMember={selectedSeeker}
                            placeholder={t('পরিবারের সদস্য খুঁজুন ও নির্বাচন করুন...', 'Search and select a family member...')}
                        />
                        <input
                            type="text"
                            value={helpSeeker}
                            onChange={(e) => {
                                setHelpSeeker(e.target.value);
                                if (selectedSeeker) setSelectedSeeker(null); // Clear selection if manually edited
                            }}
                            className="mt-2 w-full border border-stone-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none text-stone-800 placeholder-stone-400 bg-stone-50 text-sm"
                            placeholder={t('...বা তালিকায় না থাকলে ম্যানুয়ালি নাম লিখুন', '...or manually type a name if not in directory')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Tag */}
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">{t('ক্যাটাগরি', 'Category')}</label>
                            <select
                                value={tag}
                                onChange={(e) => setTag(e.target.value)}
                                className="w-full border border-stone-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none text-stone-800 bg-stone-50"
                            >
                                {tagsList.map(item => <option key={item.id} value={item.id}>{t(item.bn, item.en)}</option>)}
                            </select>
                        </div>
                        {/* Type */}
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">{t('জরুরিতা স্তর', 'Severity Level')}</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full border border-stone-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none text-stone-800 bg-stone-50"
                            >
                                <option value="info">{t('সাধারণ তথ্য (তথ্যমূলক)', 'Standard (Info)')}</option>
                                <option value="alert">{t('জরুরি প্রয়োজন (লাল সতর্কবার্তা)', 'Urgent (Red Alert)')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">{t('বিস্তারিত বিবরণ', 'Details')}</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full border border-stone-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none text-stone-800 placeholder-stone-400 bg-stone-50 h-32 resize-none"
                            placeholder={t('প্রয়োজনীয় বিবরণ ও যোগাযোগের নম্বর প্রদান করুন...', 'Provide any additional details or contact information...')}
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-stone-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-stone-500 hover:text-stone-700 font-bold hover:bg-stone-100 rounded-lg transition-colors"
                        >
                            {t('বাতিল', 'Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-6 py-2 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 ${type === 'alert' ? 'bg-red-700 hover:bg-red-800' : 'bg-orange-700 hover:bg-orange-800'}`}
                        >
                            {loading ? t('সংরক্ষণ হচ্ছে...', 'Submitting...') : <><CheckCircle2 size={18} /> {initialData ? t('সংরক্ষণ করুন', 'Save Changes') : t('অনুরোধ জমা দিন', 'Submit Request')}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HelpRequestModal;
