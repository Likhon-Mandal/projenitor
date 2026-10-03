import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Calendar, Clock, MapPin, AlignLeft, Sparkles, Link as LinkIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

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
                            <Calendar size={20} className="text-yellow-300" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-serif font-bold">
                                {initialData ? t('অনুষ্ঠান সম্পাদনা', 'Edit Event') : t('নতুন অনুষ্ঠান তৈরি করুন', 'Create New Event')}
                            </h2>
                            <p className="text-xs text-orange-200">
                                {t('আসন্ন মিলনমেলা বা সভার তথ্য পূরণ করুন', 'Fill in gathering or event details')}
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
                    <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
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
                        form="event-form"
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
