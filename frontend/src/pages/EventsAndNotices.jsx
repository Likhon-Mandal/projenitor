import React, { useState, useEffect, useMemo } from 'react';
import { 
    Calendar, HelpCircle, Plus, Trash2, Edit2, Megaphone, 
    ChevronDown, ChevronUp, MapPin, Clock, ArrowRight, ExternalLink,
    Sparkles, History as HistoryIcon, Image as ImageIcon, Video, Heart, CheckCircle2
} from 'lucide-react';
import NoticeFormModal from '../components/NoticeFormModal';
import EventFormModal from '../components/EventFormModal';
import EventDetailsModal from '../components/EventDetailsModal';
import ConfirmModal from '../components/ConfirmModal';
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

    // Confirmation Modal for Deletion (Centered Dialog)
    const [confirmDelete, setConfirmDelete] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmText: ''
    });

    const handleRequestDeleteNotice = (notice) => {
        setConfirmDelete({
            isOpen: true,
            title: t('বিজ্ঞপ্তি মুছে ফেলা নিশ্চিত করুন', 'Confirm Notice Deletion'),
            message: notice.title
                ? (isBn 
                    ? `আপনি কি নিশ্চিতভাবে "${notice.title}" বিজ্ঞপ্তিটি মুছে ফেলতে চান?` 
                    : `Are you sure you want to remove the announcement "${notice.title}"?`)
                : t('আপনি কি নিশ্চিতভাবে এই বিজ্ঞপ্তিটি মুছে ফেলতে চান?', 'Are you sure you want to remove this notice?'),
            confirmText: t('মুছে ফেলুন', 'Delete'),
            onConfirm: async () => {
                try {
                    await api.delete(`/notices/${notice.id}`);
                    fetchNotices();
                } catch (error) {
                    console.error(error);
                    alert(error.response?.data?.error || error.message);
                }
            }
        });
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

    const formatNoticeDate = (dStr) => {
        if (!dStr) return '';
        try {
            const datePart = dStr.includes('T') ? dStr.split('T')[0] : dStr;
            const [y, m, d] = datePart.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            return dateObj.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dStr;
        }
    };

    // ---- EVENTS LOGIC ----
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [selectedEventForDetails, setSelectedEventForDetails] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [eventTab, setEventTab] = useState('upcoming'); // 'upcoming' | 'previous'

    const fetchEvents = async () => {
        try {
            setLoadingEvents(true);
            const res = await api.get('/events');
            setEvents(res.data);

            // If selected event is open in details modal, refresh its data
            if (selectedEventForDetails) {
                const refreshed = res.data.find(e => e.id === selectedEventForDetails.id);
                if (refreshed) {
                    setSelectedEventForDetails(refreshed);
                }
            }
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

    // Helper: Determine if an event is in the past (due date passed)
    const isPreviousEvent = (event) => {
        if (!event || !event.date) return false;
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const dateStr = String(event.date).trim();
        
        // Exact YYYY-MM-DD comparison avoids timezone glitches
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr < todayStr;
        }

        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return parsed < today;
        }
        return false;
    };

    // Partition events into Upcoming and Previous
    const { upcomingEvents, previousEvents } = useMemo(() => {
        const upcoming = [];
        const previous = [];

        events.forEach(ev => {
            if (isPreviousEvent(ev)) {
                previous.push(ev);
            } else {
                upcoming.push(ev);
            }
        });

        // Upcoming sorted ascending (closest event first)
        upcoming.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        // Previous sorted descending (most recent past event first)
        previous.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        return { upcomingEvents: upcoming, previousEvents: previous };
    }, [events]);

    const handleRequestDeleteEvent = (eventOrId) => {
        const ev = typeof eventOrId === 'object' ? eventOrId : events.find(e => e.id === eventOrId);
        const eventId = ev?.id || eventOrId;
        const titleText = ev?.title || '';

        setConfirmDelete({
            isOpen: true,
            title: t('অনুষ্ঠান মুছে ফেলা নিশ্চিত করুন', 'Confirm Event Deletion'),
            message: titleText
                ? (isBn 
                    ? `আপনি কি নিশ্চিতভাবে "${titleText}" অনুষ্ঠানটি মুছে ফেলতে চান?` 
                    : `Are you sure you want to remove the event "${titleText}"?`)
                : t('আপনি কি নিশ্চিতভাবে এই অনুষ্ঠানটি মুছে ফেলতে চান?', 'Are you sure you want to remove this event?'),
            confirmText: t('মুছে ফেলুন', 'Delete'),
            onConfirm: async () => {
                try {
                    await api.delete(`/events/${eventId}`);
                    if (selectedEventForDetails?.id === eventId) {
                        setIsDetailsModalOpen(false);
                        setSelectedEventForDetails(null);
                    }
                    fetchEvents();
                } catch (error) {
                    console.error(error);
                    alert(error.response?.data?.error || error.message);
                }
            }
        });
    };

    const handleOpenDetails = (event) => {
        setSelectedEventForDetails(event);
        setIsDetailsModalOpen(true);
    };

    // Days remaining badge helper
    const getDaysRemainingBadge = (dateStr) => {
        if (!dateStr) return null;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const target = new Date(dateStr);
        target.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return (
                <span className="bg-red-500 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
                    {t('আজকেই অনুষ্ঠিত!', 'Happening Today!')}
                </span>
            );
        } else if (diffDays === 1) {
            return (
                <span className="bg-amber-500 text-stone-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                    {t('আগামীকাল', 'Tomorrow')}
                </span>
            );
        } else if (diffDays > 1) {
            return (
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm ${
                    diffDays <= 7 ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-stone-100 text-stone-700'
                }`}>
                    {t(`${diffDays} দিন বাকি`, `${diffDays} days left`)}
                </span>
            );
        }
        return null;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in font-sans pb-20 px-4">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-stone-100 gap-4 mt-6">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 shadow-inner text-orange-700">
                        <Megaphone className="h-6 w-6 text-orange-700" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-stone-800">{t('অনুষ্ঠান ও নোটিশবোর্ড', 'Events & Announcements')}</h1>
                        <p className="text-stone-500 text-sm">{t('বংশের অফিশিয়াল বিজ্ঞপ্তি, আসন্ন অনুষ্ঠানমালা ও স্মৃতি গ্যালারি।', 'Official updates, gatherings, and cherished memories.')}</p>
                    </div>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => { setEditingEvent(null); setIsEventModalOpen(true); }}
                        className="flex items-center gap-2 bg-gradient-to-r from-orange-800 to-amber-700 hover:from-orange-900 hover:to-amber-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 hover:shadow-lg"
                    >
                        <Plus size={18} /> {t('নতুন অনুষ্ঠান তৈরি করুন', 'Create New Event')}
                    </button>
                )}
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* ---------------- LEFT COLUMN: EVENTS (UPCOMING & PREVIOUS) ---------------- */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Event Section Sub-Navigation Tabs */}
                    <div className="bg-white p-2 rounded-2xl border border-orange-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex bg-stone-100/80 p-1 rounded-xl">
                            <button
                                onClick={() => setEventTab('upcoming')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
                                    eventTab === 'upcoming'
                                        ? 'bg-gradient-to-r from-orange-800 to-amber-700 text-white shadow-md'
                                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                                }`}
                            >
                                <Calendar size={15} />
                                <span>{t('আসন্ন অনুষ্ঠান', 'Upcoming Events')}</span>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${
                                    eventTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                                }`}>
                                    {upcomingEvents.length}
                                </span>
                            </button>

                            <button
                                onClick={() => setEventTab('previous')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
                                    eventTab === 'previous'
                                        ? 'bg-gradient-to-r from-orange-800 to-amber-700 text-white shadow-md'
                                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                                }`}
                            >
                                <HistoryIcon size={15} />
                                <span>{t('পূর্ববর্তী অনুষ্ঠান ও স্মৃতিমালা', 'Previous Events & Memories')}</span>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${
                                    eventTab === 'previous' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                                }`}>
                                    {previousEvents.length}
                                </span>
                            </button>
                        </div>

                        {isAdmin && (
                            <button
                                onClick={() => { setEditingEvent(null); setIsEventModalOpen(true); }}
                                className="hidden sm:inline-flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                            >
                                <Plus size={15} /> {t('অনুষ্ঠান যোগ করুন', 'Add Event')}
                            </button>
                        )}
                    </div>

                    {/* EVENTS LIST CONTAINER */}
                    <div className="space-y-4">
                        {loadingEvents ? (
                            <div className="bg-white p-10 rounded-2xl text-center shadow-sm border border-stone-100 text-stone-400 animate-pulse font-medium text-sm">
                                {t('অনুষ্ঠানমালা লোড হচ্ছে...', 'Loading events...')}
                            </div>
                        ) : eventTab === 'upcoming' ? (
                            /* ---------------- UPCOMING EVENTS VIEW ---------------- */
                            upcomingEvents.length > 0 ? (
                                upcomingEvents.map((event, index) => (
                                    <div
                                        key={event.id}
                                        onClick={() => handleOpenDetails(event)}
                                        className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-orange-100 hover:border-orange-300 flex flex-col sm:flex-row gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up relative group cursor-pointer"
                                        style={{ animationDelay: `${0.08 * (index + 1)}s` }}
                                    >
                                        {/* Admin Action Buttons */}
                                        {isAdmin && (
                                            <div className="absolute top-3.5 right-3.5 z-10 flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-stone-200">
                                                <button
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        setEditingEvent(event); 
                                                        setIsEventModalOpen(true); 
                                                    }}
                                                    className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title={t('অনুষ্ঠান সম্পাদনা', 'Edit Event')}
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        handleRequestDeleteEvent(event); 
                                                    }}
                                                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title={t('অনুষ্ঠান মুছুন', 'Delete Event')}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Date Block (Compact width) */}
                                        <div className="bg-gradient-to-br from-orange-100 to-amber-100 px-3 py-3 rounded-xl flex sm:flex-col items-center justify-center w-full sm:w-24 shrink-0 text-orange-950 group-hover:from-orange-200 group-hover:to-amber-200 transition-colors border border-orange-200/60 shadow-inner gap-2 sm:gap-1">
                                            <Calendar className="h-5 w-5 text-orange-800 group-hover:scale-110 transition-transform duration-300 shrink-0" />
                                            <span className="font-bold text-center leading-tight text-xs sm:text-xs">{event.date}</span>
                                        </div>

                                        {/* Content Preview */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2 pr-14">
                                                {getDaysRemainingBadge(event.date)}
                                                <span className="bg-yellow-100 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-yellow-200">
                                                    {t('আসন্ন', 'Upcoming')}
                                                </span>
                                            </div>

                                            <h3 className="text-base sm:text-lg font-serif font-bold text-stone-800 group-hover:text-orange-700 transition-colors pr-6">
                                                {event.title}
                                            </h3>

                                            {/* Details metadata pill row: Time, Location & Map Link */}
                                            <div className="flex flex-wrap gap-2 text-xs font-medium text-stone-600 pt-0.5">
                                                {event.time && (
                                                    <div className="flex items-center bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/60">
                                                        <Clock className="h-3 w-3 mr-1 text-orange-600 shrink-0" />
                                                        {event.time}
                                                    </div>
                                                )}
                                                {(event.location || event.map_link) && (
                                                    <div className="flex items-center bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/60">
                                                        <MapPin className="h-3 w-3 mr-1 text-orange-600 shrink-0" />
                                                        <span className="truncate max-w-[170px]" title={event.location}>{event.location || t('ম্যাপ লোকেশন', 'Map Location')}</span>
                                                        {event.map_link && (
                                                            <a
                                                                href={event.map_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="ml-1.5 text-orange-700 hover:text-orange-900 inline-flex items-center"
                                                                title={t('গুগল ম্যাপে দেখুন', 'Open in Google Maps')}
                                                            >
                                                                <ExternalLink size={11} />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Click prompt footer */}
                                            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-orange-700 font-bold group-hover:translate-x-1 transition-transform">
                                                <span>{t('বিস্তারিত দেখতে ক্লিক করুন', 'Click to view full details')}</span>
                                                <ArrowRight size={13} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white p-10 rounded-2xl text-center shadow-sm border border-stone-100 flex flex-col items-center">
                                    <div className="p-4 bg-orange-50 text-orange-600 rounded-full mb-3">
                                        <Calendar size={32} />
                                    </div>
                                    <h3 className="text-base font-bold text-stone-700 mb-1">{t('কোনো আসন্ন অনুষ্ঠান নেই', 'No Upcoming Events')}</h3>
                                    <p className="text-stone-400 text-xs max-w-sm mb-4">
                                        {t('এই মুহূর্তে কোনো আসন্ন অনুষ্ঠানের সূচি নেই। নতুন কোনো মিলনমেলা বা সভার আয়োজন হলে এখানে দেখা যাবে।', 'There are no upcoming events scheduled at this time.')}
                                    </p>
                                    {isAdmin && (
                                        <button
                                            onClick={() => { setEditingEvent(null); setIsEventModalOpen(true); }}
                                            className="inline-flex items-center gap-2 bg-orange-700 hover:bg-orange-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                                        >
                                            <Plus size={15} /> {t('নতুন অনুষ্ঠান তৈরি করুন', 'Create New Event')}
                                        </button>
                                    )}
                                </div>
                            )
                        ) : (
                            /* ---------------- PREVIOUS EVENTS VIEW ---------------- */
                            previousEvents.length > 0 ? (
                                previousEvents.map((event, index) => (
                                    <div
                                        key={event.id}
                                        onClick={() => handleOpenDetails(event)}
                                        className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-stone-200 hover:border-amber-400 flex flex-col sm:flex-row gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up relative group cursor-pointer"
                                        style={{ animationDelay: `${0.08 * (index + 1)}s` }}
                                    >
                                        {/* Admin Action Buttons */}
                                        {isAdmin && (
                                            <div className="absolute top-3.5 right-3.5 z-10 flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-stone-200">
                                                <button
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        setEditingEvent(event); 
                                                        setIsEventModalOpen(true); 
                                                    }}
                                                    className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title={t('অনুষ্ঠান সম্পাদনা', 'Edit Event')}
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        handleRequestDeleteEvent(event); 
                                                    }}
                                                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title={t('অনুষ্ঠান মুছুন', 'Delete Event')}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Date Block (Compact width) */}
                                        <div className="bg-stone-100 px-3 py-3 rounded-xl flex sm:flex-col items-center justify-center w-full sm:w-24 shrink-0 text-stone-700 group-hover:bg-amber-100 group-hover:text-amber-950 transition-colors border border-stone-200 shadow-inner gap-2 sm:gap-1">
                                            <HistoryIcon className="h-5 w-5 text-stone-500 group-hover:text-amber-700 group-hover:scale-110 transition-transform duration-300 shrink-0" />
                                            <span className="font-bold text-center leading-tight text-xs sm:text-xs">{event.date}</span>
                                        </div>

                                        {/* Content Preview */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2 pr-14">
                                                <span className="bg-stone-200 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                    {t('সম্পন্ন অনুষ্ঠান', 'Concluded')}
                                                </span>

                                                {/* Memories Count Badge */}
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                                    event.memory_count > 0 
                                                        ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                                        : 'bg-stone-100 text-stone-500'
                                                }`}>
                                                    <Heart size={11} className={event.memory_count > 0 ? 'text-red-500 fill-current' : 'text-stone-400'} />
                                                    {event.memory_count > 0 
                                                        ? t(`${event.memory_count}টি স্মৃতি`, `${event.memory_count} Memories`) 
                                                        : (isAdmin ? t('স্মৃতি যোগ করুন', 'Add Memories') : t('স্মৃতি সংরক্ষিত', 'Memories'))}
                                                </span>
                                            </div>

                                            <h3 className="text-base sm:text-lg font-serif font-bold text-stone-800 group-hover:text-amber-800 transition-colors pr-6">
                                                {event.title}
                                            </h3>

                                            {/* Details row: Time, Location & Map link */}
                                            <div className="flex flex-wrap gap-2 text-xs font-medium text-stone-600 pt-0.5">
                                                {event.time && (
                                                    <div className="flex items-center bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/60">
                                                        <Clock className="h-3 w-3 mr-1 text-stone-400 shrink-0" />
                                                        {event.time}
                                                    </div>
                                                )}
                                                {(event.location || event.map_link) && (
                                                    <div className="flex items-center bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/60">
                                                        <MapPin className="h-3 w-3 mr-1 text-stone-400 shrink-0" />
                                                        <span className="truncate max-w-[170px]" title={event.location}>{event.location || t('ম্যাপ লোকেশন', 'Map Location')}</span>
                                                        {event.map_link && (
                                                            <a
                                                                href={event.map_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="ml-1.5 text-orange-700 hover:text-orange-900 inline-flex items-center"
                                                                title={t('গুগল ম্যাপে দেখুন', 'Open in Google Maps')}
                                                            >
                                                                <ExternalLink size={11} />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Memories CTA footer */}
                                            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800 group-hover:text-orange-700">
                                                <span className="flex items-center gap-1.5">
                                                    <ImageIcon size={13} />
                                                    {isAdmin 
                                                        ? t('স্মৃতিমালা দেখুন ও ছবি/ভিডিও যোগ করুন', 'Explore memories & upload photos/videos')
                                                        : t('স্মৃতিমালা ও গ্যালারি দেখুন', 'Explore memories & gallery')}
                                                </span>
                                                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white p-10 rounded-2xl text-center shadow-sm border border-stone-100 flex flex-col items-center">
                                    <div className="p-4 bg-stone-50 text-stone-400 rounded-full mb-3">
                                        <HistoryIcon size={32} />
                                    </div>
                                    <h3 className="text-base font-bold text-stone-700 mb-1">{t('কোনো পূর্ববর্তী অনুষ্ঠান সংরক্ষিত নেই', 'No Previous Events Found')}</h3>
                                    <p className="text-stone-400 text-xs max-w-sm">
                                        {t('আসন্ন অনুষ্ঠানসমূহের নির্ধারিত দিন শেষ হলে সেগুলো স্বয়ংক্রিয়ভাবে এখানে স্থান পাবে এবং স্মৃতিমালা সংরক্ষিত থাকবে।', 'Events will automatically move here once their scheduled date passes.')}
                                    </p>
                                </div>
                            )
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
                                            <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-200/60">
                                                <Calendar className="h-3 w-3 text-orange-600" />
                                                {formatNoticeDate(notice.date)}
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
                                                        onClick={(e) => { e.stopPropagation(); handleRequestDeleteNotice(notice); }}
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
                                        <div className="mt-3.5 pt-3 border-t border-stone-100 animate-fade-in">
                                            <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                                            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-medium">
                                                <span className="flex items-center gap-1 text-stone-500">
                                                    <Calendar size={12} className="text-orange-600" />
                                                    {t('তৈরির তারিখ:', 'Created Date:')} {formatNoticeDate(notice.date)}
                                                </span>
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

            {/* Notice Modal */}
            <NoticeFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchNotices}
                initialData={editingNotice}
            />

            {/* Event Form Modal (Create / Edit) */}
            <EventFormModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSuccess={fetchEvents}
                initialData={editingEvent}
            />

            {/* Event Details & Memories Modal */}
            <EventDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                event={selectedEventForDetails}
                onEdit={(ev) => {
                    setEditingEvent(ev);
                    setIsEventModalOpen(true);
                }}
                onDelete={(id) => handleRequestDeleteEvent(id)}
                onEventUpdated={fetchEvents}
            />

            {/* Custom Centered Deletion Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDelete.onConfirm}
                title={confirmDelete.title}
                message={confirmDelete.message}
                confirmText={confirmDelete.confirmText}
            />
        </div>
    );
};

export default EventsAndNotices;
