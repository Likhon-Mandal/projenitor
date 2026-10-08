import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, Megaphone, HelpCircle, ExternalLink, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';

const SEEN_STORAGE_KEY = 'projenitor_seen_notifications';

const NotificationBell = ({ className = '', inNavbar = false }) => {
    const { t, isBn, formatNumber } = useLanguage();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [seenIds, setSeenIds] = useState(() => {
        try {
            const saved = localStorage.getItem(SEEN_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const dropdownRef = useRef(null);

    // Fetch public notifications (events, notices, help requests)
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/system/notifications');
            if (res.data && Array.isArray(res.data.items)) {
                setNotifications(res.data.items);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Unseen notification count
    const unseenNotifications = notifications.filter(item => !seenIds.includes(item.id));
    const unseenCount = unseenNotifications.length;

    // Mark single notification as seen & navigate to targeted section
    const handleNotificationClick = (item) => {
        if (!seenIds.includes(item.id)) {
            const nextSeen = [...seenIds, item.id];
            setSeenIds(nextSeen);
            try {
                localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(nextSeen));
            } catch (e) {
                console.error(e);
            }
        }
        setIsOpen(false);
        if (item.target) {
            let targetPath = item.target;
            const elementId = item.id;
            if (!targetPath.includes('highlight=') && elementId) {
                const [pathAndQuery] = targetPath.split('#');
                const [basePath, queryStr = ''] = pathAndQuery.split('?');
                const params = new URLSearchParams(queryStr);
                params.set('highlight', elementId);
                targetPath = `${basePath}?${params.toString()}#${elementId}`;
            }
            navigate(targetPath, { state: { targetId: elementId, timestamp: Date.now() } });
        }
    };

    // Mark all currently fetched notifications as seen
    const handleMarkAllAsRead = () => {
        const allIds = Array.from(new Set([...seenIds, ...notifications.map(n => n.id)]));
        setSeenIds(allIds);
        try {
            localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(allIds));
        } catch (e) {
            console.error(e);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'event':
                return <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
            case 'notice':
                return <Megaphone className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
            case 'help':
                return <HelpCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
            default:
                return <Bell className="w-3.5 h-3.5 text-stone-500 shrink-0" />;
        }
    };

    const getTypeBadge = (type) => {
        switch (type) {
            case 'event':
                return {
                    label: isBn ? 'অনুষ্ঠান' : 'Event',
                    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
                };
            case 'notice':
                return {
                    label: isBn ? 'বিজ্ঞপ্তি' : 'Notice',
                    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
                };
            case 'help':
                return {
                    label: isBn ? 'সহায়তা' : 'Help Request',
                    badgeClass: 'bg-red-50 text-red-700 border-red-200'
                };
            default:
                return {
                    label: isBn ? 'তথ্য' : 'Update',
                    badgeClass: 'bg-stone-50 text-stone-700 border-stone-200'
                };
        }
    };

    return (
        <div className={`relative inline-block ${className}`} ref={dropdownRef}>
            {/* Bell Icon Button */}
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className={`relative border transition-all duration-300 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 ${
                    inNavbar
                        ? `p-1.5 sm:p-2 rounded-xl ${
                            isOpen 
                                ? 'bg-orange-950 border-yellow-400 text-yellow-400 ring-2 ring-yellow-400/30' 
                                : 'bg-orange-900/60 hover:bg-orange-700/80 border-orange-700/60 hover:border-yellow-400/50 text-orange-100 hover:text-yellow-400'
                        }`
                        : `p-2.5 rounded-2xl ${
                            isOpen 
                                ? 'bg-orange-100/80 border-orange-400 text-orange-950 ring-2 ring-orange-200' 
                                : 'bg-white hover:bg-orange-50/80 border-stone-200 hover:border-orange-300 text-stone-700 hover:text-orange-900 hover:shadow-md'
                        }`
                }`}
                title={t('বিজ্ঞপ্তি', 'Notifications')}
                aria-label={t('বিজ্ঞপ্তি', 'Notifications')}
            >
                <Bell className={`${inNavbar ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5'} transition-transform duration-300 ${isOpen ? 'rotate-12 ' + (inNavbar ? 'text-yellow-400' : 'text-orange-800') : ''}`} />

                {/* Badge representing unseen notification count */}
                {unseenCount > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-5 px-1 sm:px-1.5 rounded-full bg-red-600 text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-md animate-pulse border-2 ${
                        inNavbar ? 'border-orange-800' : 'border-white'
                    }`}>
                        {unseenCount > 99 ? '99+' : formatNumber(unseenCount)}
                    </span>
                )}
            </button>

            {/* Simplistic Small Floating Box */}
            {isOpen && (
                <div className="absolute right-0 mt-2.5 w-72 sm:w-88 md:w-96 max-w-[calc(100vw-1.5rem)] bg-white text-stone-800 border border-orange-200 rounded-2xl shadow-2xl z-[150] overflow-hidden animate-fade-in origin-top-right">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-orange-50 via-amber-50/40 to-white border-b border-orange-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-orange-800" />
                            <h4 className="font-serif font-bold text-stone-900 text-sm">
                                {t('বিজ্ঞপ্তি ও আপডেট', 'Notifications & Updates')}
                            </h4>
                            {unseenCount > 0 && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-800 text-white">
                                    {formatNumber(unseenCount)}
                                </span>
                            )}
                        </div>

                        {unseenCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                className="text-[11px] font-semibold text-orange-800 hover:text-orange-950 flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                                title={t('সব পঠিত হিসেবে চিহ্নিত করুন', 'Mark all as read')}
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>{t('পঠিত', 'Mark read')}</span>
                            </button>
                        )}
                    </div>

                    {/* Notification Items List - Only unseen notifications are shown */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                        {loading && notifications.length === 0 ? (
                            <div className="p-8 text-center text-xs text-stone-500 animate-pulse">
                                {t('বিজ্ঞপ্তি লোড হচ্ছে...', 'Loading notifications...')}
                            </div>
                        ) : unseenNotifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-2.5">
                                    <CheckCheck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <p className="text-xs font-bold text-stone-700" style={{ color: '#374151' }}>
                                    {t('কোনো নতুন বিজ্ঞপ্তি নেই', 'No new notifications')}
                                </p>
                                <p className="text-[11px] text-stone-400 mt-0.5">
                                    {t('সব নোটিফিকেশন পঠিত হিসেবে সম্পন্ন হয়েছে', 'All notifications have been read')}
                                </p>
                            </div>
                        ) : (
                            unseenNotifications.map((item) => {
                                const badgeInfo = getTypeBadge(item.type);

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleNotificationClick(item)}
                                        className="w-full text-left p-3.5 flex items-start gap-3 transition-all duration-200 hover:bg-orange-50/70 group cursor-pointer bg-white"
                                        style={{ color: '#1c1917' }}
                                    >
                                        {/* Icon bubble */}
                                        <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform shadow-2xs">
                                            {getTypeIcon(item.type)}
                                        </div>

                                        {/* Title link & metadata */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${badgeInfo.badgeClass}`}>
                                                    {badgeInfo.label}
                                                </span>
                                                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title={t('নতুন', 'New')} />
                                            </div>

                                            {/* Clickable Heading */}
                                            <p 
                                                className="text-xs font-bold line-clamp-2 leading-snug group-hover:text-orange-950 transition-colors"
                                                style={{ color: '#1c1917' }}
                                            >
                                                {item.title}
                                            </p>
                                        </div>

                                        <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-orange-700 shrink-0 mt-1 transition-colors" />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
