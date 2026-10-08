import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, Phone, User, AlertTriangle, Lock, LogIn } from 'lucide-react';
import MemberSelector from './MemberSelector';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
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
    const { user } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [tag, setTag] = useState('Advice');
    const [type, setType] = useState('alert');
    const [content, setContent] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [helpSeeker, setHelpSeeker] = useState('');
    const [helpSeekerId, setHelpSeekerId] = useState(null);
    const [selectedSeeker, setSelectedSeeker] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setTag(initialData.tag || 'Advice');
                setType(initialData.type || 'alert');
                setContent(initialData.content || '');
                setContactNumber(initialData.contact_number || '');
                setHelpSeeker(initialData.help_seeker || '');
                setHelpSeekerId(initialData.help_seeker_id || null);
                if (initialData.help_seeker_id) {
                    setSelectedSeeker({
                        id: initialData.help_seeker_id,
                        full_name: initialData.help_seeker
                    });
                } else {
                    setSelectedSeeker(null);
                }
            } else {
                setTitle('');
                setTag('Advice');
                setType('alert');
                setContent('');
                setContactNumber('');
                setHelpSeeker('');
                setHelpSeekerId(null);
                setSelectedSeeker(null);
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert(t('অনুরোধ জমা দিতে লগইন করা আবশ্যক।', 'You must be logged in to submit a request.'));
            return;
        }

        if (!title.trim() || !tag) {
            alert(t('শিরোনাম এবং ক্যাটাগরি আবশ্যক।', 'Title and Category are required.'));
            return;
        }

        if (!contactNumber.trim()) {
            alert(t('যোগাযোগের নম্বর প্রদান করুন।', 'Please provide a contact number.'));
            return;
        }

        setLoading(true);

        const posterName = formatName(user) || user.name || user.full_name || 'Member';

        const payload = {
            title: title.trim(),
            tag,
            type,
            content: content.trim(),
            contact_number: contactNumber.trim(),
            help_seeker: formatName(helpSeeker.trim()) || helpSeeker.trim() || posterName,
            help_seeker_id: helpSeekerId || selectedSeeker?.id || null,
            posted_by: posterName,
            posted_by_member_id: user.member_id || null
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
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex justify-center items-center z-[9999] px-4 animate-fade-in">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up border border-orange-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header - High contrast with explicit white title to prevent theme color clashing */}
                <div className={`px-6 py-4 flex justify-between items-center text-white shadow-xs ${
                    type === 'alert' 
                        ? 'bg-gradient-to-r from-red-950 via-red-900 to-red-800' 
                        : 'bg-gradient-to-r from-orange-950 via-orange-900 to-red-950'
                }`}>
                    <div className="flex items-center gap-2.5">
                        {type === 'alert' && <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />}
                        <h2 className="text-xl font-serif font-bold text-white !text-white tracking-wide drop-shadow-sm">
                            {initialData ? t('অনুরোধ সম্পাদনা করুন', 'Edit Request') : t('নতুন সহায়তার অনুরোধ', 'Create New Request')}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                        title={t('বন্ধ করুন', 'Close')}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* If user is not logged in, show clean authentication prompt */}
                {!user ? (
                    <div className="p-8 text-center space-y-4">
                        <div className="w-14 h-14 bg-orange-100 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                            <Lock size={28} />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-stone-900">
                            {t('লগইন আবশ্যক', 'Login Required')}
                        </h3>
                        <p className="text-stone-600 text-sm max-w-sm mx-auto leading-relaxed">
                            {t(
                                'সহায়তার অনুরোধ প্রদান করতে আপনাকে ইউজার, অ্যাডমিন বা সুপারঅ্যাডমিন অ্যাকাউন্টে লগইন করতে হবে।',
                                'To submit a help request, you must be logged in as a user, admin, or superadmin.'
                            )}
                        </p>
                        <div className="pt-3 flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-stone-600 hover:text-stone-800 font-semibold text-sm border border-stone-200 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
                            >
                                {t('বাতিল', 'Cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    navigate('/auth', { state: { from: '/help' } });
                                }}
                                className="px-6 py-2.5 bg-primary hover:bg-orange-900 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                            >
                                <LogIn size={16} />
                                <span>{t('লগইন করুন', 'Login Now')}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Authenticated Form */
                    <form onSubmit={handleSubmit} autoComplete="off" className="p-6 space-y-4.5 max-h-[85vh] overflow-y-auto custom-scrollbar">
                        {/* Poster notification bar */}
                        <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-3 flex items-center justify-between text-xs text-stone-700">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-orange-800 shrink-0" />
                                <span>
                                    {t('অনুরোধকারী:', 'Posting as:')}{' '}
                                    <strong className="text-stone-900 font-bold">{formatName(user) || user.name || user.full_name || 'Member'}</strong>
                                </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-900 border border-orange-200">
                                {user.role || 'user'}
                            </span>
                        </div>

                        {/* Title Input */}
                        <div>
                            <label className="block text-sm font-bold text-stone-800 mb-1.5">
                                {t('অনুরোধের শিরোনাম *', 'Request Title *')}
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-stone-900 placeholder-stone-400 bg-white shadow-2xs font-medium"
                                placeholder={t('যেমন: জরুরি ভিত্তিতে রক্তের প্রয়োজন...', 'e.g. Urgent: B+ Blood Donor needed in Dhaka')}
                                required
                            />
                        </div>

                        {/* Contact Number Input - Strictly manual entry without auto-fill */}
                        <div>
                            <label className="block text-sm font-bold text-stone-800 mb-1.5">
                                {t('যোগাযোগের নম্বর *', 'Contact Number *')}
                            </label>
                            <div className="relative">
                                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    id="manual_contact_number"
                                    name="manual_contact_number"
                                    value={contactNumber}
                                    onChange={(e) => setContactNumber(e.target.value)}
                                    autoComplete="off"
                                    data-lpignore="true"
                                    data-form-type="other"
                                    className="w-full border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-stone-900 placeholder-stone-400 bg-white shadow-2xs font-medium text-sm"
                                    placeholder={t('যেমন: 017XXXXXXXX বা একাধিক নম্বর...', 'e.g. 017XXXXXXXX or multiple numbers...')}
                                    required
                                />
                            </div>
                        </div>

                        {/* Help Seeker Selection */}
                        <div>
                            <label className="block text-sm font-bold text-stone-800 mb-1.5">
                                {t('সাহায্যপ্রার্থী (ডিরেক্টরি থেকে সদস্য নির্বাচন করুন)', 'Help Seeker (Select Member from Directory)')}
                            </label>
                            <MemberSelector
                                label=""
                                onSelect={(member) => {
                                    setSelectedSeeker(member);
                                    if (member) {
                                        setHelpSeeker(formatName(member));
                                        setHelpSeekerId(member.id);
                                    } else {
                                        setHelpSeeker('');
                                        setHelpSeekerId(null);
                                    }
                                }}
                                selectedMember={selectedSeeker}
                                placeholder={t('পরিবারের সদস্য খুঁজুন ও নির্বাচন করুন...', 'Search and select a family member...')}
                            />
                            <div className="mt-2">
                                <input
                                    type="text"
                                    value={helpSeeker}
                                    onChange={(e) => {
                                        setHelpSeeker(e.target.value);
                                        if (selectedSeeker) {
                                            setSelectedSeeker(null);
                                            setHelpSeekerId(null);
                                        }
                                    }}
                                    className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none text-stone-800 placeholder-stone-400 bg-stone-50 text-xs sm:text-sm"
                                    placeholder={t('...বা তালিকায় না থাকলে ম্যানুয়ালি নাম লিখুন', '...or manually type a name if not in directory')}
                                />
                            </div>
                        </div>

                        {/* Category & Severity Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Tag / Category */}
                            <div>
                                <label className="block text-sm font-bold text-stone-800 mb-1.5">
                                    {t('ক্যাটাগরি / বিভাগ', 'Category / Sector')}
                                </label>
                                <select
                                    value={tag}
                                    onChange={(e) => setTag(e.target.value)}
                                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none text-stone-800 bg-white font-medium text-sm shadow-2xs"
                                >
                                    {tagsList.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {t(item.bn, item.en)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Severity Level */}
                            <div>
                                <label className="block text-sm font-bold text-stone-800 mb-1.5">
                                    {t('জরুরিতা স্তর', 'Severity Level')}
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none text-stone-800 bg-white font-medium text-sm shadow-2xs"
                                >
                                    <option value="info">{t('সাধারণ তথ্য (তথ্যমূলক)', 'Standard (Info)')}</option>
                                    <option value="alert">{t('জরুরি প্রয়োজন (লাল সতর্কবার্তা)', 'Urgent (Red Alert)')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-bold text-stone-800 mb-1.5">
                                {t('বিস্তারিত বিবরণ', 'Details')}
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none text-stone-900 placeholder-stone-400 bg-white shadow-2xs h-28 resize-none text-sm"
                                placeholder={t('পরিস্থিতি, প্রয়োজনীয় সাহায্য ও বিস্তারিত বিবরণ লিখুন...', 'Describe the situation, required assistance, and details...')}
                            />
                        </div>

                        {/* Form Actions */}
                        <div className="pt-3 flex justify-end gap-3 border-t border-stone-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2 text-stone-600 hover:text-stone-800 font-semibold hover:bg-stone-100 rounded-xl transition-colors cursor-pointer text-sm"
                            >
                                {t('বাতিল', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-6 py-2.5 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer text-sm ${
                                    type === 'alert' ? 'bg-red-700 hover:bg-red-800' : 'bg-primary hover:bg-orange-900'
                                }`}
                            >
                                {loading ? (
                                    t('সংরক্ষণ হচ্ছে...', 'Submitting...')
                                ) : (
                                    <>
                                        <CheckCircle2 size={18} />
                                        <span>{initialData ? t('সংরক্ষণ করুন', 'Save Changes') : t('অনুরোধ জমা দিন', 'Submit Request')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default HelpRequestModal;

