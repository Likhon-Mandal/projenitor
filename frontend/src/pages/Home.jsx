import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Bell, HelpCircle, Star, ArrowRight, User, Calendar, MapPin,
    Activity, ChevronRight, AlertCircle, Edit2, Trash2, Users, Home as HomeIcon
} from 'lucide-react';
import ImageSlider from '../components/ImageSlider';
import HelpRequestModal from '../components/HelpRequestModal';
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

        /* Custom Scrollbar for Lists */
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
    `}</style>
);

/* List Item Component */
const ListItem = ({ icon: Icon, title, date, tag, type, to }) => (
    <Link to={to || "/board"} className="block group mb-2">
        <div className="glass-item p-3 rounded-xl flex items-start gap-3 cursor-pointer">
            <div className={`p-2 rounded-xl shrink-0 ${type === 'alert' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${type === 'alert' ? 'text-red-500' : 'text-orange-500'}`}>{tag}</span>
                    <span className="text-[10px] text-stone-400 font-medium">{date}</span>
                </div>
                <h4 className="text-base font-bold text-stone-800 leading-snug group-hover:text-orange-700 transition-colors line-clamp-2">
                    {title}
                </h4>
            </div>
            <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                <ChevronRight size={16} className="text-stone-400" />
            </div>
        </div>
    </Link>
);

/* Pillar Card */
const PillarCard = ({ member }) => (
    <div className="bg-white rounded-[2rem] p-8 border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-500 text-center group relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        <div className="relative mb-6 inline-block">
            <div className="w-28 h-28 rounded-full border-4 border-stone-50 overflow-hidden group-hover:scale-105 transition-transform duration-300 mx-auto shadow-inner">
                <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                    <User size={48} />
                </div>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap shadow-xl">
                {member.role}
            </div>
        </div>
        <h3 className="text-2xl font-serif font-bold text-stone-800 mb-2 group-hover:text-orange-800 transition-colors">{member.name}</h3>
        <p className="text-stone-500 italic px-4 leading-relaxed">"{member.achievement}"</p>
    </div>
);

const Home = () => {
    const { t, isBn, formatNumber } = useLanguage();
    const [announcements, setAnnouncements] = useState([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

    const { isAdmin } = useAuth();
    const [helpRequests, setHelpRequests] = useState([]);
    const [loadingHelp, setLoadingHelp] = useState(true);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [editingHelp, setEditingHelp] = useState(null);
    const [publicStats, setPublicStats] = useState({ totalMembers: 0, totalHomes: 0, totalVillages: 0 });

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
            const data = res.data;

            const formattedHelp = data.map(h => {
                const diffTime = Math.abs(new Date() - new Date(h.created_at));
                const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                const timeAgo = diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours / 24)}d ago`;

                return {
                    id: h.id,
                    title: h.title,
                    date: timeAgo,
                    tag: h.tag,
                    type: h.type,
                    posted_by: h.posted_by,
                    content: h.content
                };
            });

            setHelpRequests(formattedHelp.slice(0, 3)); // Show top 3
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingHelp(false);
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoadingAnnouncements(true);
                const [noticesRes, eventsRes] = await Promise.all([
                    api.get('/notices'),
                    api.get('/events')
                ]);

                const noticesData = noticesRes.data || [];
                const eventsData = eventsRes.data || [];

                const formattedNotices = noticesData.map(n => ({
                    id: `n-${n.id}`,
                    title: n.title,
                    date: new Date(n.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                    tag: 'Notice',
                    timestamp: new Date(n.created_at || Date.now()).getTime()
                }));

                const formattedEvents = eventsData.map(e => ({
                    id: `e-${e.id}`,
                    title: e.title,
                    date: new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                    tag: 'Event',
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
        fetchDashboardData();
        fetchHelpData();
        fetchPublicStats();
    }, []);

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

    const featuredMembers = [
        { 
            id: 1, 
            name: isBn ? 'ডাঃ অনুপম বাড়ৈ' : 'Dr. Anupam Barai', 
            role: isBn ? 'হৃদরোগ বিশেষজ্ঞ' : 'Cardiologist', 
            achievement: isBn ? 'জাতীয় স্বাস্থ্যসেবা পুরস্কার ২০২৫ প্রাপক' : 'National Healthcare Award 2025 Recipient' 
        },
        { 
            id: 2, 
            name: isBn ? 'শুভ্রা বাড়ৈ' : 'Shubra Barai', 
            role: isBn ? 'শিক্ষাবিদ' : 'Educator', 
            achievement: isBn ? 'জেলা শ্রেষ্ঠ শিক্ষক পদক' : 'District Best Teacher Award' 
        }
    ];

    return (
        <div className="min-h-screen bg-[#fffcf5] text-stone-800 font-sans pb-20">
            <AnimationStyles />

            {/* HERO SECTION - 50vh Centered Design (Light Theme) */}
            <div className="relative w-full h-[50vh] min-h-[500px] mb-16 group bg-[#fffcf5]">

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
                            {t('৮+ প্রজন্মের সংযোগ। ভবিষ্যৎ প্রজন্মের জন্য আমাদের ঐতিহ্য, গল্প ও রক্তের বন্ধন সংরক্ষণ।', 'Connecting 8+ generations. Preserving our shared history, stories, and bloodline for the future.')}
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
                            <Link to="/explorer" className="px-10 py-4 bg-orange-700 hover:bg-orange-800 text-white rounded-full font-bold shadow-lg shadow-orange-900/10 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 text-sm uppercase tracking-wider">
                                {t('জ্ঞাতিবর্গদের খুঁজুন', 'Find Relatives')} <ArrowRight size={18} />
                            </Link>
                            <Link to="/history" className="px-10 py-4 bg-white hover:bg-orange-50 text-stone-800 border-2 border-orange-100/50 rounded-full font-bold transition-all duration-300 text-sm uppercase tracking-wider hover:border-orange-200 shadow-sm hover:shadow-md">
                                {t('ইতিহাস জানুন', 'Explore History')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* SYSTEM OVERVIEW / STATS BAR */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 mb-16 -mt-12 relative z-20">
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
            <div className="max-w-7xl mx-auto px-6 md:px-8">

                {/* NOTICES & HELP DESK SECTION - Grid Layout Below Hero */}
                <div className="grid lg:grid-cols-2 gap-6 mb-16 mt-8 relative">

                    {/* Notices Panel */}
                    <div className="glass-panel rounded-[1.5rem] p-6 animate-fade-up delay-100">
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-200/50">
                            <h2 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Bell size={20} /></div>
                                {t('বিজ্ঞপ্তি ও আয়োজন', 'Community Notices')}
                            </h2>
                            <Link to="/board" className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-orange-600 transition-colors bg-white px-3 py-1 rounded-full shadow-sm border border-stone-100">
                                {t('সব দেখুন', 'View All')}
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {loadingAnnouncements ? (
                                <div className="text-center p-4 text-sm text-stone-400 font-medium">
                                    {t('সর্বশেষ তথ্য লোড হচ্ছে...', 'Loading latest updates...')}
                                </div>
                            ) : announcements.length > 0 ? (
                                announcements.map(item => (
                                    <ListItem key={item.id} icon={Calendar} to="/board" {...item} />
                                ))
                            ) : (
                                <div className="text-center p-4 text-sm text-stone-400 font-medium">
                                    {t('কোনো সাম্প্রতিক বিজ্ঞপ্তি নেই।', 'No recent announcements.')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Desk Panel */}
                    <div className="glass-panel rounded-[1.5rem] p-6 animate-fade-up delay-200">
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-200/50">
                            <h2 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg text-red-600"><HelpCircle size={20} /></div>
                                {t('সহায়তা কেন্দ্র', 'Help & Support')}
                            </h2>
                            <Link to="/help" className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-orange-600 transition-colors bg-white px-3 py-1 rounded-full shadow-sm border border-stone-100">
                                {t('সব দেখুন', 'View All')}
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {loadingHelp ? (
                                <div className="text-center p-4 text-sm text-stone-400 font-medium">
                                    {t('অনুরোধ লোড হচ্ছে...', 'Loading requests...')}
                                </div>
                            ) : helpRequests.length > 0 ? (
                                helpRequests.map(item => (
                                    <div key={item.id} className="relative group/helpitem">
                                        <ListItem icon={AlertCircle} type={item.type} to="/help" {...item} />
                                        {isAdmin && (
                                            <div className="absolute top-4 right-10 z-10 flex gap-1 opacity-0 group-hover/helpitem:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingHelp(item); setIsHelpModalOpen(true); }}
                                                    className="p-1.5 text-stone-300 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title={t('আবেদন সম্পাদনা', 'Edit Request')}
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteHelp(item.id); }}
                                                    className="p-1.5 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title={t('আবেদন মুছুন', 'Delete Request')}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-4 text-sm text-stone-400 font-medium">
                                    {t('কোনো সক্রিয় সহায়তার আবেদন নেই।', 'No active help requests.')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pillars Section */}
                <section className="mb-24">
                    <div className="text-center mb-16">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-stone-100 text-stone-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-4 border border-stone-200">
                            {t('স্মরণীয় ব্যক্তিত্ব', 'Hall of Fame')}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-4">{t('বংশের আলোকবর্তিকা', 'Community Pillars')}</h2>
                        <p className="text-stone-500 max-w-xl mx-auto text-lg">{t('যাঁরা আমাদের আদর্শকে ধারণ করেন এবং উজ্জ্বল দৃষ্টান্ত স্থাপন করেছেন।', 'Celebrating those who uphold our values and lead by example.')}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {featuredMembers.map(member => (
                            <PillarCard key={member.id} member={member} />
                        ))}
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

        </div>
    );
};

export default Home;
