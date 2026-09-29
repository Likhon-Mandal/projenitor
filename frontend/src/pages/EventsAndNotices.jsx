import React, { useState, useEffect } from 'react';
import { Calendar, HelpCircle, Plus, Trash2, Edit2, Megaphone, ChevronDown, ChevronUp, MapPin, Clock } from 'lucide-react';
import NoticeFormModal from '../components/NoticeFormModal';
import EventFormModal from '../components/EventFormModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

const EventsAndNotices = () => {
    const { isAdmin } = useAuth();
    const { t, isBn } = useLanguage();
    // ---- NOTICES LOGIC ----
    const [notices, setNotices] = useState([]);
    const [loadingNotices, setLoadingNotices] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState(null);
    const [expandedNoticeId, setExpandedNoticeId] = useState(null);

    const toggleNotice = (id) => {
        setExpandedNoticeId(prev => prev === id ? null : id);
    };

    const fetchNotices = async () => {
        try {
            setLoadingNotices(true);
            const res = await api.get('/notices');
            setNotices(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingNotices(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm(t("আপনি কি নিশ্চিতভাবে এই বিজ্ঞপ্তিটি মুছে ফেলতে চান?", "Are you sure you want to remove this notice?"))) return;
        try {
            await api.delete(`/notices/${id}`);
            fetchNotices();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || error.message);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Death': return 'bg-stone-200 text-stone-800 border-stone-300';
            case 'New Born': return 'bg-pink-100 text-pink-800 border-pink-200';
            case 'Good Result': return 'bg-green-100 text-green-800 border-green-200';
            case 'Invitation': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Event': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-orange-100 text-orange-800 border-orange-200';
        }
    };

    // ---- EVENTS LOGIC ----
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const fetchEvents = async () => {
        try {
            setLoadingEvents(true);
            const res = await api.get('/events');
            setEvents(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingEvents(false);
        }
    };

    useEffect(() => {
        fetchNotices();
        fetchEvents();
    }, []);

    const handleDeleteEvent = async (id) => {
        if (!window.confirm(t("আপনি কি নিশ্চিতভাবে এই অনুষ্ঠানটি মুছে ফেলতে চান?", "Are you sure you want to remove this event?"))) return;
        try {
            await api.delete(`/events/${id}`);
            fetchEvents();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || error.message);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in font-sans pb-20 px-4">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 justify-center rounded-2xl shadow-sm border border-stone-100 gap-4 mt-6">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                        <Megaphone className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-stone-800">{t('অনুষ্ঠান ও নোটিশবোর্ড', 'Events & Announcements')}</h1>
                        <p className="text-stone-500 text-sm">{t('বংশের অফিশিয়াল বিজ্ঞপ্তি, অনুষ্ঠান ও মিলনমেলার খবর।', 'Official updates, gatherings, and community news.')}</p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* ---------------- LEFT COLUMN: EVENTS ---------------- */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex justify-between items-center border-b border-stone-200 pb-2 mb-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="text-orange-700 h-5 w-5" />
                            <h2 className="text-xl font-serif font-bold text-stone-800">{t('আসন্ন অনুষ্ঠানসমূহ', 'Upcoming Events')}</h2>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => { setEditingEvent(null); setIsEventModalOpen(true); }}
                                className="flex items-center gap-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                            >
                                <Plus size={16} /> {t('অনুষ্ঠান তৈরি করুন', 'Create Event')}
                            </button>
                        )}
                    </div>

                    <div className="grid gap-6">
                        {loadingEvents ? (
                            <div className="bg-white p-8 rounded-2xl text-center shadow-sm border border-stone-100 text-stone-400 animate-pulse font-medium text-sm">
                                {t('অনুষ্ঠান লোড হচ্ছে...', 'Loading events...')}
                            </div>
                        ) : events.length > 0 ? (
                            events.map((event, index) => (
                                <div
                                    key={event.id}
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition duration-300 animate-slide-up relative group"
                                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                                >
                                    {isAdmin && (
                                        <div className="absolute top-4 right-4 z-10 flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingEvent(event); setIsEventModalOpen(true); }}
                                                className="p-1.5 text-stone-300 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100"
                                                title={t('অনুষ্ঠান সম্পাদনা', 'Edit Event')}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                                                className="p-1.5 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100"
                                                title={t('অনুষ্ঠান মুছুন', 'Delete Event')}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="bg-orange-100 p-6 rounded-xl flex flex-col items-center justify-center min-w-[140px] text-orange-900 group-hover:bg-orange-200 transition-colors">
                                        <Calendar className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform duration-300" />
                                        <span className="font-bold text-center leading-tight">{event.date}</span>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <h3 className="text-xl font-serif font-bold text-stone-800 hover:text-orange-700 transition-colors cursor-pointer pr-6">{event.title}</h3>
                                        {event.description && <p className="text-stone-600 text-sm leading-relaxed">{event.description}</p>}
                                        <div className="flex flex-wrap gap-4 text-xs font-medium text-stone-500 pt-2 border-t border-stone-50">
                                            {event.time && (
                                                <div className="flex items-center bg-stone-50 px-2 py-1 rounded-md">
                                                    <Clock className="h-3 w-3 mr-1 text-stone-400" />
                                                    {event.time}
                                                </div>
                                            )}
                                            {event.location && (
                                                <div className="flex items-center bg-stone-50 px-2 py-1 rounded-md">
                                                    <MapPin className="h-3 w-3 mr-1 text-stone-400" />
                                                    {event.location}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white p-8 rounded-2xl text-center shadow-sm border border-stone-100 flex flex-col items-center">
                                <Calendar size={32} className="text-stone-200 mb-3" />
                                <h3 className="text-[15px] font-bold text-stone-600 mb-1">{t('কোনো আসন্ন অনুষ্ঠান নেই', 'No Upcoming Events')}</h3>
                                <p className="text-stone-400 text-xs">{t('এই মুহূর্তে কোনো অনুষ্ঠানের সূচি নেই।', 'There are no events scheduled at this time.')}</p>
                            </div>
                        )}
                    </div>
                </div>


                {/* ---------------- RIGHT COLUMN: NOTICES ---------------- */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="flex justify-between items-center border-b border-stone-200 pb-2 mb-4">
                        <div className="flex items-center gap-2">
                            <Megaphone className="text-orange-700 h-5 w-5" />
                            <h2 className="text-xl font-serif font-bold text-stone-800">{t('বিজ্ঞপ্তি ও নোটিশ', 'Notice Board')}</h2>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => { setEditingNotice(null); setIsModalOpen(true); }}
                                className="flex items-center gap-1.5 bg-orange-700 hover:bg-orange-800 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                            >
                                <Plus size={16} /> {t('বিজ্ঞপ্তি দিন', 'Add Notice')}
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {loadingNotices ? (
                            <div className="bg-white p-8 rounded-2xl text-center shadow-sm border border-stone-100 text-stone-400 animate-pulse font-medium text-sm">
                                {t('বিজ্ঞপ্তি লোড হচ্ছে...', 'Loading latest announcements...')}
                            </div>
                        ) : notices.length > 0 ? (
                            notices.map((notice) => (
                                <div
                                    key={notice.id}
                                    className="group bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-stone-100 hover:shadow-md transition-all duration-300 relative overflow-hidden"
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${getTypeColor(notice.type).split(' ')[0]}`}></div>

                                    <div
                                        className="flex justify-between items-center cursor-pointer group/title"
                                        onClick={() => toggleNotice(notice.id)}
                                    >
                                        <h3 className="text-[15px] font-serif font-bold text-stone-800 truncate group-hover/title:text-orange-700 transition-colors pr-4 flex-1">
                                            {notice.title}
                                        </h3>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-md">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(notice.date).toLocaleDateString()}
                                            </span>
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingNotice(notice); setIsModalOpen(true); }}
                                                        className="p-1.5 text-stone-300 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors opacity-0 group-hover/title:opacity-100"
                                                        title={t('বিজ্ঞপ্তি সম্পাদনা', 'Edit Notice')}
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(notice.id); }}
                                                        className="p-1.5 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover/title:opacity-100"
                                                        title={t('বিজ্ঞপ্তি মুছুন', 'Delete Notice')}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                            <div className="text-stone-400 group-hover/title:text-orange-600 ml-1">
                                                {expandedNoticeId === notice.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </div>
                                        </div>
                                    </div>

                                    {expandedNoticeId === notice.id && (
                                        <div className="mt-4 animate-fade-in">
                                            <p className="text-stone-600 mb-4 text-sm leading-relaxed whitespace-pre-wrap">{notice.content}</p>

                                            <div className="text-xs font-medium text-stone-400 border-t border-stone-100 pt-3 flex justify-between">
                                                <span>{t('প্রকাশক: ', 'Posted by ')}<span className="text-stone-600 font-bold">{notice.posted_by}</span></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="bg-white p-8 rounded-2xl text-center shadow-sm border border-stone-100 flex flex-col items-center">
                                <Megaphone size={32} className="text-stone-200 mb-3" />
                                <h3 className="text-[15px] font-bold text-stone-600 mb-1">{t('কোনো বিজ্ঞপ্তি নেই', 'No Announcements')}</h3>
                                <p className="text-stone-400 text-xs">{t('বর্তমানে কোনো সক্রিয় বিজ্ঞপ্তি নেই।', 'There are currently no active notices.')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <NoticeFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchNotices}
                initialData={editingNotice}
            />

            <EventFormModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSuccess={fetchEvents}
                initialData={editingEvent}
            />
        </div>
    );
};

export default EventsAndNotices;
