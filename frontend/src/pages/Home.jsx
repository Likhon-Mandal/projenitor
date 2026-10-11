import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Bell, HelpCircle, Star, ArrowRight, User, Calendar, MapPin,
    Activity, ChevronRight, AlertCircle, Edit2, Trash2, Users, Home as HomeIcon,
    ChevronLeft, Briefcase, Award, ShieldCheck, UserCheck, Sparkles, Pause, Play, Crown, LogIn
} from 'lucide-react';
import ImageSlider from '../components/ImageSlider';
import HelpRequestModal from '../components/HelpRequestModal';
import NextSammelanSpotlight from '../components/NextSammelanSpotlight';
import Profile from './Profile';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

/* ANIMATION STYLES */
const AnimationStyles = () => (
    <style>{`
        @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeSlideUp 0.8s ease-out forwards; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        
        .glass-panel {
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(16px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 8px 32px 0 rgba(154, 52, 18, 0.1);
        }
        
        .glass-item {
            background: rgba(255, 255, 255, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
        }
        .glass-item:hover {
            background: white;
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            border-color: rgba(234, 88, 12, 0.2);
        }

        @keyframes pillarFadeIn {
            from {
                opacity: 0;
                transform: translateY(10px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        .animate-pillar {
            animation: pillarFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Custom Scrollbar for Lists */
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
    `}</style>
);

/* Compact List Item Component */
const CompactListItem = ({ title, date, tag, type, to, targetId, isBn, adminActions }) => {
    const displayTag = tag ? (
        isBn ? (
            tag === 'Event' ? 'আয়োজন' :
            tag === 'Notice' ? 'বিজ্ঞপ্তি' :
            tag
        ) : tag
    ) : (isBn ? (type === 'alert' ? 'জরুরি' : 'সহায়তা') : (type === 'alert' ? 'Alert' : 'Help'));

    const isAlert = type === 'alert' || (tag && /রক্ত|blood|জরুরি|emergency/i.test(tag));

    return (
        <div className="relative group/item">
            <Link
                to={to || "/board"}
                state={targetId ? { targetId, timestamp: Date.now() } : undefined}
                className="flex items-center justify-between gap-2.5 py-2 px-2.5 rounded-xl hover:bg-orange-50/80 transition-all duration-200 border border-transparent hover:border-orange-200/60 cursor-pointer"
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Badge */}
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase transition-colors ${
                        isAlert
                            ? 'bg-rose-100 text-rose-900 border border-rose-200/80'
                            : tag === 'Event' || tag === 'আয়োজন'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200/80'
                            : 'bg-orange-100 text-orange-900 border border-orange-200/80'
                    }`}>
                        {displayTag}
                    </span>

                    {/* Title */}
                    <span className="text-xs sm:text-sm font-medium text-stone-800 group-hover/item:text-orange-900 transition-colors truncate">
                        {title}
                    </span>
                </div>

                {/* Right metadata & arrow */}
                <div className="flex items-center gap-1.5 shrink-0 text-stone-400 group-hover/item:text-orange-700 transition-colors">
                    <span className="text-[11px] font-normal whitespace-nowrap">
                        {date}
                    </span>
                    <ChevronRight size={13} className="shrink-0 group-hover/item:translate-x-0.5 transition-transform" />
                </div>
            </Link>

            {/* Admin actions (floated subtly on hover without breaking layout) */}
            {adminActions && (
                <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity bg-white/95 px-1 py-0.5 rounded-md border border-stone-200 shadow-xs z-10">
                    {adminActions}
                </div>
            )}
        </div>
    );
};


/* Pillar Card - Gorgeous Royal Heritage Design */
const PillarCard = ({ person, onOpenProfile, isBn, t, formatName, formatOccupation }) => {
    if (!person) return null;

    const displayName = formatName(person) || person.full_name || person.name || (isBn ? 'সম্মানিত সদস্য' : 'Honored Member');
    const isClickable = Boolean(person.member_id);

    // Format address simplistic (only if available)
    const addressParts = [person.village, person.upazila, person.district].filter(Boolean);
    const displayAddress = addressParts.length > 0 ? addressParts.join(', ') : null;

    // Format occupation simplistic (only if available)
    const rawOccupation = person.occupation ? formatOccupation(person.occupation) : null;
    const displayOccupation = (rawOccupation && rawOccupation !== 'null' && rawOccupation.trim()) ? rawOccupation.trim() : null;

    const isCommittee = person.type === 'committee';
    const isPresident = person.rolePriority === 1 || (person.badge && (person.badge.includes('সভাপতি') || person.badge.toLowerCase().includes('president')) && !person.badge.includes('সহ') && !person.badge.toLowerCase().includes('vice'));
    const isVicePresident = person.rolePriority === 2 || (person.badge && (person.badge.includes('সহ-সভাপতি') || person.badge.toLowerCase().includes('vice president')));

    return (
        <div className="relative overflow-hidden rounded-[2rem] p-5 sm:p-6 text-center group flex flex-col justify-between h-full transition-all duration-300 bg-gradient-to-b from-[#fffefc] via-[#fffbf4] to-[#faf1e1] border-2 border-amber-200/80 hover:border-amber-400 shadow-[0_6px_25px_rgba(154,52,18,0.06)] hover:shadow-[0_20px_45px_rgba(154,52,18,0.15)] hover:-translate-y-1.5 before:absolute before:inset-1.5 before:rounded-[1.7rem] before:border before:border-amber-300/30 before:pointer-events-none">
            {/* Ambient Heritage Blur Glows */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-orange-500/15 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-tr from-red-400/15 to-amber-300/20 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    {/* Avatar with Radiant Halo Ring */}
                    <div className="relative mb-2 inline-block">
                        <div className="p-[4px] rounded-full bg-gradient-to-tr from-amber-500 via-orange-400 to-red-600 shadow-md group-hover:shadow-[0_0_24px_rgba(234,179,8,0.45)] group-hover:scale-105 transition-all duration-300">
                            <div className="p-[2.5px] bg-[#fffcf7] rounded-full">
                                <div
                                    onClick={() => isClickable && onOpenProfile(person.member_id)}
                                    title={isClickable ? t('প্রোফাইল দেখতে ক্লিক করুন', 'Click to view profile') : ''}
                                    className={`w-28 h-28 sm:w-30 sm:h-30 rounded-full overflow-hidden bg-stone-100 relative group/avatar ${isClickable ? 'cursor-pointer' : ''
                                        }`}
                                >
                                    {person.profile_image_url ? (
                                        <img
                                            src={person.profile_image_url}
                                            alt={displayName}
                                            className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-orange-50 via-amber-50 to-stone-100 flex items-center justify-center text-stone-400 group-hover/avatar:text-orange-600 transition-colors">
                                            <User size={46} />
                                        </div>
                                    )}

                                    {isClickable && (
                                        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                                            <UserCheck size={14} className="text-amber-300" />
                                            <span>{t('প্রোফাইল', 'Profile')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Specific Tag Badge Placed at Avatar's Lower Side */}
                    <div className="flex items-center justify-center -mt-3 mb-3 relative z-20">
                        <span className={`inline-flex items-center px-3.5 py-0.5 rounded-full text-xs font-bold leading-snug shadow-sm tracking-wide transition-transform group-hover:scale-105 duration-300 ${isPresident
                                ? 'bg-gradient-to-r from-red-900 via-amber-800 to-yellow-700 text-amber-100 border border-amber-300/60 shadow-amber-900/20'
                                : isCommittee
                                    ? 'bg-gradient-to-r from-red-900 via-orange-800 to-amber-900 text-amber-100 border border-amber-300/40 shadow-red-950/20'
                                    : 'bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 text-white border border-yellow-200/50 shadow-amber-800/20'
                            }`}>
                            <span>{person.badge}</span>
                        </span>
                    </div>

                    {/* Name - Clickable with Serif elegance */}
                    <h3
                        onClick={() => isClickable && onOpenProfile(person.member_id)}
                        title={isClickable ? t('প্রোফাইল দেখতে ক্লিক করুন', 'Click to view profile') : ''}
                        className={`text-xl sm:text-2xl font-serif font-bold text-stone-900 group-hover:text-orange-950 transition-colors line-clamp-1 mb-2 ${isClickable ? 'cursor-pointer hover:underline decoration-amber-400 decoration-2 underline-offset-4' : ''
                            }`}
                    >
                        {displayName}
                    </h3>
                </div>

                {/* Info Capsules: Profession & Address */}
                {(displayOccupation || displayAddress) && (
                    <div className="flex flex-col items-center gap-1.5 mt-3 pt-3 border-t border-amber-200/60 text-center">
                        {displayOccupation && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200/80 text-stone-800 shadow-2xs max-w-full">
                                <Briefcase size={12} className="text-orange-800 shrink-0" />
                                <span className="truncate max-w-[210px]">{displayOccupation}</span>
                            </div>
                        )}

                        {displayAddress && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/90 border border-stone-200/80 text-stone-700 shadow-2xs max-w-full">
                                <MapPin size={12} className="text-red-700 shrink-0" />
                                <span className="truncate max-w-[210px]">{displayAddress}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const Home = () => {
    const { t, isBn, formatNumber, formatName, formatOccupation } = useLanguage();
    const [announcements, setAnnouncements] = useState([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

    const { user = null, isAdmin = false, isSuperAdmin = false } = useAuth() || {};
    const [helpRequests, setHelpRequests] = useState([]);
    const [loadingHelp, setLoadingHelp] = useState(true);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [editingHelp, setEditingHelp] = useState(null);
    const [publicStats, setPublicStats] = useState({ totalMembers: 0, totalHomes: 0, totalVillages: 0 });

    // Dynamic Pillars (Committee First, Then Eminent Figures)
    const [pillars, setPillars] = useState([]);
    const [loadingPillars, setLoadingPillars] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [isPillarsPaused, setIsPillarsPaused] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState(null);

    const fallbackPillars = [
        {
            id: 'fb-1',
            name_bangla: 'প্রিয়লাল কর্মকার',
            name_english: 'Priyolal Karmakar',
            badge: isBn ? 'সভাপতি' : 'President',
            type: 'committee',
            occupation: isBn ? 'ডিপ্লোমা প্রকৌশলী' : 'Diploma Engineer',
            village: isBn ? 'বড় বাশাইল' : 'Boro Bashail',
            upazila: isBn ? 'আগৈলঝাড়া' : 'Agailjhara',
            district: isBn ? 'বরিশাল' : 'Barishal'
        },
        {
            id: 'fb-2',
            name_bangla: 'রণজিত মন্ডল',
            name_english: 'Ronjit Mandal',
            badge: isBn ? 'সাধারণ সম্পাদক' : 'General Secretary',
            type: 'committee',
            occupation: isBn ? 'সমাজসেবী' : 'Social Worker',
            village: isBn ? 'ভেন্নাবাড়ী' : 'Vennabari',
            upazila: isBn ? 'রাজৈর' : 'Rajoir',
            district: isBn ? 'মাদারীপুর' : 'Madaripur'
        },
        {
            id: 'fb-3',
            name_bangla: 'নৃপেন মন্ডল',
            name_english: 'Nripen Mandal',
            badge: isBn ? 'আজীবন জ্ঞাতি' : 'Lifetime Honor',
            type: 'eminent',
            occupation: isBn ? 'শিক্ষক' : 'Teacher',
            village: isBn ? 'ভেন্নাবাড়ী' : 'Vennabari',
            upazila: isBn ? 'রাজৈর' : 'Rajoir',
            district: isBn ? 'মাদারীপুর' : 'Madaripur'
        }
    ];

    const fetchPublicStats = async () => {
        try {
            const res = await api.get('/system/stats');
            setPublicStats(res.data);
        } catch (error) {
            console.error("Error fetching public stats:", error);
        }
    };

    const fetchHelpData = async () => {
        try {
            setLoadingHelp(true);
            const res = await api.get('/help');
            const rawData = res.data;
            const data = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.requests) ? rawData.requests : []);

            const formattedHelp = data.map(h => {
                const diffTime = Math.abs(new Date() - new Date(h.created_at));
                const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                const timeAgo = diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours / 24)}d ago`;

                return {
                    id: `help-${h.id}`,
                    rawId: h.id,
                    title: h.title,
                    date: timeAgo,
                    tag: h.tag,
                    type: h.type,
                    posted_by: h.posted_by,
                    content: h.content,
                    to: `/help?highlight=help-${h.id}#help-${h.id}`,
                    targetId: `help-${h.id}`
                };
            });

            setHelpRequests(formattedHelp.slice(0, 4)); // Show top 4
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingHelp(false);
        }
    };

    const fetchDashboardData = async () => {
        try {
            setLoadingAnnouncements(true);
            const [noticesRes, eventsRes] = await Promise.all([
                api.get('/notices'),
                api.get('/events')
            ]);

            const noticesData = Array.isArray(noticesRes?.data) ? noticesRes.data : [];
            const eventsData = Array.isArray(eventsRes?.data) ? eventsRes.data : [];

            const formattedNotices = noticesData.map(n => ({
                id: `notice-${n.id}`,
                rawId: n.id,
                title: n.title,
                date: new Date(n.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                tag: 'Notice',
                type: 'notice',
                to: `/board?tab=notices&highlight=notice-${n.id}#notice-${n.id}`,
                targetId: `notice-${n.id}`,
                timestamp: new Date(n.created_at || Date.now()).getTime()
            }));

            const formattedEvents = eventsData.map(e => ({
                id: `event-${e.id}`,
                rawId: e.id,
                title: e.title,
                date: new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                tag: 'Event',
                type: 'event',
                to: `/board?tab=events&highlight=event-${e.id}#event-${e.id}`,
                targetId: `event-${e.id}`,
                timestamp: new Date(e.created_at || Date.now()).getTime()
            }));

            const combined = [...formattedEvents, ...formattedNotices]
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 4);

            setAnnouncements(combined);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoadingAnnouncements(false);
        }
    };

    const fetchPillarsData = async () => {
        try {
            setLoadingPillars(true);
            const [committeeRes, eminentRes] = await Promise.allSettled([
                api.get('/committee'),
                api.get('/eminent')
            ]);

            // Committee Role Ranking Helper (Top rank to bottom rank hierarchy)
            const getRolePriority = (role) => {
                if (!role) return 99;
                const r = role.toLowerCase().trim();
                if (r.includes('সভাপতি') && !r.includes('সহ')) return 1;
                if (r.includes('president') && !r.includes('vice')) return 1;
                if (r.includes('সহ-সভাপতি') || r.includes('vice president') || r.includes('সহ সভাপতি')) return 2;
                if (r.includes('সাধারণ সম্পাদক') && !r.includes('যুগ্ম') && !r.includes('সহ')) return 3;
                if (r.includes('general secretary') && !r.includes('joint') && !r.includes('assistant')) return 3;
                if (r.includes('যুগ্ম-সাধারণ') || r.includes('যুগ্ম সাধারণ') || r.includes('joint')) return 4;
                if (r.includes('সহ-সাধারণ') || r.includes('সহ সাধারণ') || r.includes('assistant')) return 4;
                if (r.includes('সাংগঠনিক') || r.includes('organizing')) return 5;
                if (r.includes('কোষাধ্যক্ষ') || r.includes('অর্থ') || r.includes('treasurer')) return 6;
                if (r.includes('দপ্তর') || r.includes('office')) return 7;
                if (r.includes('প্রচার') || r.includes('publicity')) return 8;
                if (r.includes('সদস্য') || r.includes('member')) return 10;
                return 20;
            };

            const committeeList = [];
            if (committeeRes.status === 'fulfilled' && Array.isArray(committeeRes.value?.data)) {
                const currentCommittee = committeeRes.value.data.find(c => c.is_current) || committeeRes.value.data[0];
                if (currentCommittee && Array.isArray(currentCommittee.members)) {
                    currentCommittee.members.forEach((m, idx) => {
                        const rawRole = (m.role || '').trim();
                        const priority = getRolePriority(rawRole);

                        let badge = rawRole || (isBn ? 'কার্যনির্বাহী সদস্য' : 'Executive Member');
                        if (!isBn) {
                            if (priority === 1) badge = 'President';
                            else if (priority === 2) badge = 'Vice President';
                            else if (priority === 3) badge = 'General Secretary';
                            else if (priority === 4) badge = 'Joint General Secretary';
                            else if (priority === 5) badge = 'Organizing Secretary';
                            else if (priority === 6) badge = 'Treasurer';
                            else if (priority === 7) badge = 'Office Secretary';
                            else if (priority === 8) badge = 'Publicity Secretary';
                            else if (priority === 10) badge = 'Executive Member';
                        } else {
                            if (rawRole.toLowerCase().includes('president') && !rawRole.toLowerCase().includes('vice')) badge = 'সভাপতি';
                            else if (rawRole.toLowerCase().includes('vice president')) badge = 'সহ-সভাপতি';
                            else if (rawRole.toLowerCase().includes('general secretary')) badge = 'সাধারণ সম্পাদক';
                            else if (rawRole.toLowerCase().includes('member')) badge = 'সদস্য';
                        }

                        committeeList.push({
                            id: `comm-${m.member_id || idx}`,
                            member_id: m.member_id,
                            full_name: m.full_name,
                            name_bangla: m.name_bangla,
                            name_english: m.name_english,
                            type: 'committee',
                            badge: badge,
                            rolePriority: priority,
                            occupation: m.occupation,
                            village: m.village,
                            upazila: m.upazila,
                            district: m.district,
                            profile_image_url: m.profile_image_url,
                            contact_number: m.contact_number,
                            order_index: m.order_index ?? idx
                        });
                    });
                }
            }

            // Sort committee strictly from up to down hierarchy
            committeeList.sort((a, b) => {
                if (a.rolePriority !== b.rolePriority) return a.rolePriority - b.rolePriority;
                return (a.order_index ?? 0) - (b.order_index ?? 0);
            });

            const eminentList = [];
            if (eminentRes.status === 'fulfilled' && Array.isArray(eminentRes.value?.data)) {
                eminentRes.value.data.forEach((ef, idx) => {
                    let badge = (ef.category || '').trim() || (isBn ? 'কৃতি ব্যক্তিত্ব' : 'Distinguished Figure');
                    if (!isBn) {
                        if (badge.includes('আজীবন জ্ঞাতি')) badge = 'Lifetime Honor';
                        else if (badge.includes('কৃতি শিক্ষার্থী')) badge = 'Meritorious Student';
                        else if (badge.includes('বিশিষ্ট ব্যক্তিত্ব')) badge = 'Distinguished Figure';
                    }

                    eminentList.push({
                        id: `em-${ef.id || ef.member_id || idx}`,
                        member_id: ef.member_id,
                        full_name: ef.full_name,
                        name_bangla: ef.name_bangla,
                        name_english: ef.name_english,
                        type: 'eminent',
                        badge: badge,
                        rolePriority: 99,
                        occupation: ef.occupation,
                        village: ef.village,
                        upazila: ef.upazila,
                        district: ef.district,
                        profile_image_url: ef.profile_image_url,
                        education: ef.education
                    });
                });
            }

            // Sequentially: firstly committee from up to down, then eminent figures
            const merged = [...committeeList, ...eminentList];

            if (merged.length > 0) {
                setPillars(merged);
            } else {
                setPillars(fallbackPillars);
            }
        } catch (error) {
            console.error("Error fetching pillars:", error);
            setPillars(fallbackPillars);
        } finally {
            setLoadingPillars(false);
        }
    };

    // Load all initial page data
    useEffect(() => {
        fetchDashboardData();
        fetchHelpData();
        fetchPublicStats();
        fetchPillarsData();
    }, [isBn]);

    // Check if mobile screen (< 768px)
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const pageSize = isMobile ? 1 : 3;
    const totalPages = Math.max(1, Math.ceil(pillars.length / pageSize));

    // Auto-advance carousel every 4 seconds reliably
    useEffect(() => {
        if (pillars.length <= pageSize || isPillarsPaused) return;
        const interval = setInterval(() => {
            setCurrentPage(prev => (prev + 1) % totalPages);
        }, 4000);
        return () => clearInterval(interval);
    }, [pillars.length, isPillarsPaused, isMobile, totalPages, pageSize]);

    const handleNextPillar = () => {
        if (totalPages <= 1) return;
        setCurrentPage(prev => (prev + 1) % totalPages);
    };

    const handlePrevPillar = () => {
        if (totalPages <= 1) return;
        setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
    };

    // Compute the 3 items (desktop) or 1 item (mobile) displayed together
    const currentItems = [];
    if (pillars.length > 0) {
        for (let i = 0; i < pageSize; i++) {
            const itemIndex = (currentPage * pageSize + i) % pillars.length;
            if (pillars[itemIndex]) {
                currentItems.push(pillars[itemIndex]);
            }
        }
    }

    const handleDeleteHelp = async (id) => {
        if (!window.confirm("Are you sure you want to delete this specific request?")) return;
        try {
            await api.delete(`/help/${id}`);
            fetchHelpData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || "Failed to delete request");
        }
    };

    return (
        <div className="min-h-screen bg-[#fffcf5] text-stone-800 font-sans pb-20">
            <AnimationStyles />

            {/* HERO SECTION - 50vh Centered Design (Light Theme) */}
            <div className="relative w-full h-[50vh] min-h-[500px] mb-8 group bg-[#fffcf5]">

                {/* 1. Background Slider - Light Theme */}
                <div className="absolute inset-0 z-0 overflow-hidden opacity-30">
                    <ImageSlider className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-[20s]" showOverlay={false} />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-[#fffcf5]"></div>
                </div>

                {/* 2. Content Container - Centered */}
                <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col justify-center items-center text-center">

                    <div className="space-y-4 max-w-4xl mx-auto animate-fade-up relative z-10">

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold leading-none tracking-tight text-stone-900 drop-shadow-sm">
                            বাড়ৈ বংশের
                        </h1>

                        <h1 className="text-5xl p-2 md:text-7xl lg:text-8xl font-serif font-bold leading-none tracking-tight text-stone-900 drop-shadow-sm">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-700 to-red-700"> ইতিবৃত্ত</span>
                        </h1>

                        <p className="text-xl text-stone-500 font-light leading-relaxed max-w-2xl mx-auto">
                            {t('ভবিষ্যৎ প্রজন্মের জন্য আমাদের ঐতিহ্য, গল্প ও রক্তের বন্ধন সংরক্ষণ।', 'Connecting 8+ generations. Preserving our shared history, stories, and bloodline for the future.')}
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
                            <Link to="/explorer" className="px-10 py-4 bg-orange-700 hover:bg-orange-800 text-white rounded-full font-bold shadow-lg shadow-orange-900/10 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 text-sm uppercase tracking-wider">
                                {t('জ্ঞাতিবর্গদের খুঁজুন', 'Find Relatives')} <ArrowRight size={18} />
                            </Link>
                            <Link to="/relation" className="px-10 py-4 bg-orange-50 hover:bg-orange-100 text-orange-800 border-2 border-orange-200 rounded-full font-bold transition-all duration-300 text-sm uppercase tracking-wider hover:border-orange-300 shadow-sm hover:shadow-md hover:-translate-y-1 flex items-center gap-2">
                                <Activity size={16} />
                                {t('সম্পর্ক নির্ণয়', 'Find Relationship')}
                            </Link>
                            <Link to="/history" className="px-10 py-4 bg-white hover:bg-orange-50 text-stone-800 border-2 border-orange-100/50 rounded-full font-bold transition-all duration-300 text-sm uppercase tracking-wider hover:border-orange-200 shadow-sm hover:shadow-md">
                                {t('ইতিহাস জানুন', 'Explore History')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* NEXT SAMMELAN SPOTLIGHT BANNER */}
            <NextSammelanSpotlight />

            {/* SYSTEM OVERVIEW / STATS BAR */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 mb-16 relative z-20">
                <div className="glass-panel rounded-[1.5rem] p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 text-center shadow-xl shadow-orange-900/5">
                    <div className="relative space-y-1 group">
                        <div className="flex items-center justify-center gap-2 text-orange-700/70 mb-0.5">
                            <Users size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{isAdmin ? t('যাচাইকৃত সদস্য', 'Verified Members') : t('মোট সদস্য', 'Total Members')}</span>
                        </div>
                        <p className="text-5xl font-serif font-black text-stone-900 leading-none">{formatNumber(publicStats.totalMembers)}</p>
                        <div className="w-12 h-1 bg-orange-200 mx-auto rounded-full group-hover:w-20 transition-all duration-500"></div>
                    </div>
                    <div className="relative space-y-1 group">
                        <div className="flex items-center justify-center gap-2 text-orange-700/70 mb-0.5">
                            <HomeIcon size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('গ্রামের বাড়ি', 'Village Homes')}</span>
                        </div>
                        <p className="text-5xl font-serif font-black text-stone-900 leading-none">{formatNumber(publicStats.totalHomes)}</p>
                        <div className="w-12 h-1 bg-orange-200 mx-auto rounded-full group-hover:w-20 transition-all duration-500"></div>
                    </div>
                    <div className="relative space-y-1 group">
                        <div className="flex items-center justify-center gap-2 text-orange-700/70 mb-0.5">
                            <MapPin size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('গ্রামসমূহ', 'Villages')}</span>
                        </div>
                        <p className="text-5xl font-serif font-black text-stone-900 leading-none">{formatNumber(publicStats.totalVillages)}</p>
                        <div className="w-12 h-1 bg-orange-200 mx-auto rounded-full group-hover:w-20 transition-all duration-500"></div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">

                {/* Pillars Section - 2 Boxes displayed one after another */}
                <section className="mb-20 sm:mb-24">
                    <div className="text-center mb-12">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-stone-100 text-stone-600 text-[11px] font-bold uppercase tracking-[0.2em] mb-4 border border-stone-200">
                            {t('স্মরণীয় ব্যক্তিত্ব ও নেতৃত্ব', 'Hall of Fame & Leadership')}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-4">{t('বংশের আলোকবর্তিকা', 'Community Pillars')}</h2>
                        <p className="text-stone-500 max-w-2xl mx-auto text-base sm:text-lg">
                            {t('বর্তমান কার্যনির্বাহী পরিষদ এবং বিশিষ্ট ব্যক্তিত্ব যাঁদের অবদান আমাদের সমাজের গর্ব ও অনুপ্রেরণা।', 'Honoring our current executive committee leadership and distinguished community figures.')}
                        </p>
                    </div>

                    {loadingPillars ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {[1, 2].map(n => (
                                <div key={n} className="bg-white/80 rounded-[2.2rem] p-9 border border-orange-100 animate-pulse text-center">
                                    <div className="w-28 h-28 bg-stone-200 rounded-full mx-auto mb-4"></div>
                                    <div className="h-6 bg-stone-200 rounded w-1/2 mx-auto mb-3"></div>
                                    <div className="h-4 bg-stone-100 rounded w-3/4 mx-auto mb-2"></div>
                                    <div className="h-4 bg-stone-100 rounded w-2/3 mx-auto"></div>
                                </div>
                            ))}
                        </div>
                    ) : pillars.length === 0 ? (
                        <div className="text-center py-12 text-stone-400 bg-white/60 rounded-3xl max-w-md mx-auto border border-stone-200">
                            {t('কোনো তথ্য পাওয়া যায়নি।', 'No figures found.')}
                        </div>
                    ) : (
                        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
                            {/* The 3 Boxes Grid (Desktop: 3, Mobile: 1) - Changing All 3 Together */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-7 lg:gap-8 justify-center">
                                {currentItems.map((person, idx) => (
                                    <div
                                        key={`pillar-page-${currentPage}-item-${person.id || idx}-${idx}`}
                                        className="animate-pillar h-full max-w-[310px] w-full mx-auto"
                                        style={{ animationDelay: `${idx * 0.08}s` }}
                                        onMouseEnter={() => setIsPillarsPaused(true)}
                                        onMouseLeave={() => setIsPillarsPaused(false)}
                                    >
                                        <PillarCard
                                            person={person}
                                            onOpenProfile={setSelectedMemberId}
                                            isBn={isBn}
                                            t={t}
                                            formatName={formatName}
                                            formatOccupation={formatOccupation}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Indicator Dots */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-7">
                                    {Array.from({ length: totalPages }).map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentPage(idx)}
                                            className={`transition-all duration-300 rounded-full ${currentPage === idx
                                                    ? 'w-7 h-2.5 bg-gradient-to-r from-orange-700 to-amber-600 shadow-sm'
                                                    : 'w-2.5 h-2.5 bg-stone-300 hover:bg-stone-400'
                                                }`}
                                            title={`${t('পৃষ্ঠা', 'Page')} ${formatNumber(idx + 1)}`}
                                            aria-label={`Go to page ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* COMMUNITY BULLETIN & MUTUAL SUPPORT (COMPACT, SIMPLE & RESPONSIVE) */}
                <section className="mb-16 sm:mb-20 animate-fade-up">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-2 pb-3 border-b border-orange-200/50">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/80 text-orange-900 text-[11px] font-bold uppercase tracking-wider mb-2 border border-orange-200/60">
                                <Sparkles size={12} className="text-orange-700" />
                                <span>{t('সমাজের খবরাখবর ও সংহতি', 'Community Updates & Solidarity')}</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                                {t('বিজ্ঞপ্তি ও পারস্পরিক সহায়তা', 'Notices & Mutual Support')}
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm text-stone-500 max-w-md">
                            {t('সাম্প্রতিক ঘোষণা, সামাজিক আয়োজন এবং জ্ঞাতিবর্গের যেকোনো প্রয়োজনে পাশে দাঁড়ানোর প্রয়াস।', 'Latest announcements, gatherings, and mutual aid across our community.')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Notices Panel */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-orange-100/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-orange-100/90 flex items-center justify-center text-orange-800 shadow-xs shrink-0">
                                            <Bell size={16} />
                                        </div>
                                        <div>
                                            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 leading-tight">
                                                {t('বিজ্ঞপ্তি ও আয়োজন', 'Community Notices')}
                                            </h3>
                                            <p className="text-[11px] text-stone-400 font-sans">
                                                {t('বংশের সাম্প্রতিক ঘোষণা ও অনুষ্ঠান', 'Latest notices & clan events')}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        to="/board"
                                        className="text-xs font-semibold text-orange-700 hover:text-orange-900 flex items-center gap-1 transition-colors group/link px-2.5 py-1 rounded-full hover:bg-orange-50 shrink-0"
                                    >
                                        <span>{t('সব দেখুন', 'View All')}</span>
                                        <ArrowRight size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                                    </Link>
                                </div>

                                <div className="space-y-1">
                                    {loadingAnnouncements ? (
                                        <div className="py-8 text-center text-xs text-stone-400 animate-pulse font-medium">
                                            {t('সর্বশেষ তথ্য লোড হচ্ছে...', 'Loading updates...')}
                                        </div>
                                    ) : announcements.length > 0 ? (
                                        announcements.map(item => (
                                            <CompactListItem
                                                key={item.id}
                                                title={item.title}
                                                date={item.date}
                                                tag={item.tag}
                                                type={item.type}
                                                to={item.to}
                                                targetId={item.targetId}
                                                isBn={isBn}
                                            />
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-xs text-stone-400 font-medium">
                                            {t('কোনো সাম্প্রতিক বিজ্ঞপ্তি নেই।', 'No recent announcements.')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                                <span>{t('সর্বশেষ আপডেট প্রদর্শিত', 'Latest updates shown')}</span>
                                <Link
                                    to="/board"
                                    className="font-medium text-orange-700 hover:text-orange-900 flex items-center gap-1 transition-colors hover:underline"
                                >
                                    {t('বিজ্ঞপ্তি বোর্ডে যান', 'Go to Notice Board')} &rarr;
                                </Link>
                            </div>
                        </div>

                        {/* Help Desk Panel */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-red-100/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-red-100/90 flex items-center justify-center text-red-800 shadow-xs shrink-0">
                                            <HelpCircle size={16} />
                                        </div>
                                        <div>
                                            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 leading-tight">
                                                {t('সহায়তা কেন্দ্র', 'Help & Mutual Aid')}
                                            </h3>
                                            <p className="text-[11px] text-stone-400 font-sans">
                                                {t('জরুরি প্রয়োজনে রক্তের সন্ধান ও পাশে দাঁড়ানো', 'Emergency assistance & clan solidarity')}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        to="/help"
                                        className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1 transition-colors group/link px-2.5 py-1 rounded-full hover:bg-red-50 shrink-0"
                                    >
                                        <span>{t('সব দেখুন', 'View All')}</span>
                                        <ArrowRight size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                                    </Link>
                                </div>

                                <div className="space-y-1">
                                    {loadingHelp ? (
                                        <div className="py-8 text-center text-xs text-stone-400 animate-pulse font-medium">
                                            {t('অনুরোধ লোড হচ্ছে...', 'Loading requests...')}
                                        </div>
                                    ) : helpRequests.length > 0 ? (
                                        helpRequests.map(item => (
                                            <CompactListItem
                                                key={item.id}
                                                title={item.title}
                                                date={item.date}
                                                tag={item.tag}
                                                type={item.type}
                                                to={item.to}
                                                targetId={item.targetId}
                                                isBn={isBn}
                                                adminActions={isAdmin ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setEditingHelp(item);
                                                                setIsHelpModalOpen(true);
                                                            }}
                                                            className="p-1 text-stone-400 hover:text-orange-600 transition-colors"
                                                            title={t('সম্পাদনা', 'Edit')}
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDeleteHelp(item.id);
                                                            }}
                                                            className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                                                            title={t('মুছুন', 'Delete')}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </>
                                                ) : null}
                                            />
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-xs text-stone-400 font-medium">
                                            {t('কোনো সক্রিয় সহায়তার আবেদন নেই।', 'No active help requests.')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                                {user ? (
                                    <button
                                        onClick={() => {
                                            setEditingHelp(null);
                                            setIsHelpModalOpen(true);
                                        }}
                                        className="font-semibold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>+</span> {t('সহায়তার আবেদন করুন', 'Request Help')}
                                    </button>
                                ) : (
                                    <Link
                                        to="/login"
                                        state={{ from: '/help' }}
                                        className="font-semibold text-stone-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer border border-orange-200/60"
                                        title={t('সহায়তার আবেদন করতে লগইন আবশ্যক', 'Login required to request help')}
                                    >
                                        <LogIn size={11} className="text-orange-700" />
                                        <span>{t('লগইন করে আবেদন', 'Login to Request')}</span>
                                    </Link>
                                )}
                                <Link
                                    to="/help"
                                    className="font-medium text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors hover:underline"
                                >
                                    {t('সহায়তা কেন্দ্রে যান', 'Go to Help Desk')} &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Simple Footer/Quote */}
                <div className="text-center max-w-3xl mx-auto pb-12 border-t border-stone-200/50 pt-16">
                    <p className="font-serif text-3xl text-stone-400 leading-tight italic">
                        "{t('রক্তের বাঁধনে এক, হৃদয়ের স্পন্দনে যুক্ত।', 'United by blood, connected by heart.')}"
                    </p>
                </div>

            </div>
            <HelpRequestModal
                isOpen={isHelpModalOpen}
                onClose={() => setIsHelpModalOpen(false)}
                onSuccess={fetchHelpData}
                initialData={editingHelp}
            />

            {/* Profile Modal */}
            {selectedMemberId && (
                <Profile
                    memberId={selectedMemberId}
                    onClose={() => setSelectedMemberId(null)}
                    zIndex="z-[150]"
                />
            )}

        </div>
    );
};

export default Home;
