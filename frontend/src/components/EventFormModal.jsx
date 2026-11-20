import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Calendar, Clock, MapPin, AlignLeft, Sparkles, Link as LinkIcon } from 'lucide-react';
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

const EventFormModal = ({ isOpen, onClose, onSuccess, initialData }) => {
    const { t } = useLanguage();
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [mapLink, setMapLink] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setDate(initialData.date || '');
                setTime(initialData.time || '');
                setLocation(initialData.location || '');
                setMapLink(initialData.map_link || '');
                setDescription(initialData.description || '');
            } else {
                // Default to today's date for upcoming event creation
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                setTitle('');
                setDate(todayStr);
                setTime('');
                setLocation('');
                setMapLink('');
                setDescription('');
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !date.trim()) {
            return alert(t('অনুষ্ঠানের নাম এবং তারিখ আবশ্যক।', 'Title and Date are required.'));
        }

        setLoading(true);

        const payload = {
            title: title.trim(),
            date: date.trim(),
            time: time.trim(),
            location: location.trim(),
            map_link: mapLink.trim(),
            description: description.trim()
        };

        try {
            if (initialData?.id) {
                await api.put(`/events/${initialData.id}`, payload);
            } else {
                await api.post('/events', payload);
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
                            <Calendar size={20} className="text-yellow-300" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-serif font-bold text-white">
                                {initialData ? t('অনুষ্ঠান সম্পাদনা', 'Edit Event') : t('নতুন অনুষ্ঠান তৈরি করুন', 'Create New Event')}
                            </h2>
                            <p className="text-xs text-orange-200">
                                {t('আসন্ন মিলনমেলা বা সভার তথ্য পূরণ করুন', 'Fill in gathering or event details')}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        type="button"
                        aria-label={t('বন্ধ করুন', 'Close')}
                        className="shrink-0 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body (scrolls; header and actions stay put) */}
                <div className="fm-skin flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">
                    <form id="event-form" onSubmit={handleSubmit} className="space-y-4 fm-rise">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-orange-600" />
                                {t('অনুষ্ঠানের নাম / শিরোনাম *', 'Event Title *')}
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder={t('যেমন: ৯৪তম বার্ষিক পারিবারিক মিলনমেলা', 'e.g. 94th Annual Family Gathering')}
                                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm font-medium"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                                    <Calendar size={14} className="text-orange-600" />
                                    {t('তারিখ *', 'Date *')}
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 transition-all text-sm font-medium"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                                    <Clock size={14} className="text-orange-600" />
                                    {t('সময়', 'Time')}
                                </label>
                                <input
                                    type="text"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                    placeholder={t('যেমন: সকাল ১০:০০', 'e.g. 10:00 AM')}
                                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                                <MapPin size={14} className="text-orange-600" />
                                {t('অনুষ্ঠানের স্থান / ঠিকানা', 'Location / Venue')}
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder={t('যেমন: লাউসার, মাদারীপুর পূর্বের বাড়ি', 'e.g. Madaripur Ancestral Home')}
                                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500 transition-all text-sm font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                                <LinkIcon size={14} className="text-orange-600" />
                                {t('গুগল ম্যাপ লিংক (ঐচ্ছিক)', 'Google Maps Link (Optional)')}
                            </label>
                            <input
                                type="url"
                                value={mapLink}
                                onChange={e => setMapLink(e.target.value)}
                                placeholder="https://maps.google.com/?q=... or https://maps.app.goo.gl/..."
                                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500 transition-all text-sm font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                                <AlignLeft size={14} className="text-orange-600" />
                                {t('অনুষ্ঠানের বিস্তারিত বিবরণ', 'Description / Agenda')}
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder={t('অনুষ্ঠানের উদ্দেশ্য, কার্যসূচি বা বিশেষ নির্দেশাবলি এখানে লিখুন...', 'Provide details, instructions or agenda here...')}
                                rows="3"
                                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm resize-none"
                            ></textarea>
                        </div>
                    </form>
                </div>

                {/* Footer Controls */}
                <div className="shrink-0 border-t border-stone-100 px-4 py-3 sm:p-4 bg-orange-50/60 grid grid-cols-2 sm:flex sm:justify-end gap-2.5 sm:gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-[46px] sm:min-h-0 justify-center flex items-center px-5 py-2 text-stone-600 font-bold bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors text-sm"
                        disabled={loading}
                    >
                        {t('বাতিল', 'Cancel')}
                    </button>
                    <button
                        type="submit"
                        form="event-form"
                        disabled={loading}
                        className="min-h-[46px] sm:min-h-0 justify-center px-6 py-2 bg-gradient-to-r from-orange-700 to-red-800 hover:brightness-110 text-white font-bold rounded-xl shadow-md shadow-orange-900/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 text-sm"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                {t('সংরক্ষণ হচ্ছে...', 'Saving...')}
                            </span>
                        ) : (
                            <>
                                <CheckCircle2 size={16} /> 
                                {initialData ? t('পরিবর্তন সংরক্ষণ করুন', 'Save Changes') : t('অনুষ্ঠান প্রকাশ করুন', 'Create Event')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventFormModal;
