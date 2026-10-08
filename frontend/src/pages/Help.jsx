import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    HelpCircle, 
    Search, 
    MessageCircle, 
    PlusCircle, 
    Trash2, 
    Edit2, 
    ChevronDown, 
    User, 
    Calendar, 
    AlertTriangle, 
    Info, 
    Copy, 
    Check, 
    X, 
    Filter, 
    Phone
} from 'lucide-react';
import HelpRequestModal from '../components/HelpRequestModal';
import Profile from './Profile';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDateDDMMYYYY } from '../utils/dateUtils';
import api from '../api/api';

const Help = () => {
    const { user, isAdmin } = useAuth();
    const { t, formatName } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    const [helpRequests, setHelpRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [highlightedId, setHighlightedId] = useState(null);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [contactingPost, setContactingPost] = useState(null);
    const [copiedPostId, setCopiedPostId] = useState(null);

    // Profile card modal state for help seeker & poster (same as Search Members/Directory)
    const [selectedMemberId, setSelectedMemberId] = useState(null);

    const handleOpenProfile = (memberId, e) => {
        if (e) e.stopPropagation();
        if (!memberId) return;
        setSelectedMemberId(memberId);
    };

    const fetchHelpData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/help');
            setHelpRequests(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHelpData();
    }, []);

    // Deep link scroll & highlight effect from notification click
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const targetId = location.state?.targetId || params.get('highlight') || location.hash.replace('#', '');
        
        if (!targetId) return;

        // Auto-expand target if navigated from notification
        if (targetId.startsWith('help-')) {
            const rawId = parseInt(targetId.replace('help-', ''), 10);
            if (!isNaN(rawId)) {
                setExpandedIds(prev => new Set([...prev, rawId]));
            }
        }

        const timer = setTimeout(() => {
            const el = document.getElementById(targetId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightedId(targetId);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [location.search, location.hash, location.state, helpRequests]);

    // Clear highlight effect after 5 seconds
    useEffect(() => {
        if (!highlightedId) return;
        const timer = setTimeout(() => {
            setHighlightedId(null);
        }, 5000);
        return () => clearTimeout(timer);
    }, [highlightedId]);

    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const expandAll = (list) => {
        setExpandedIds(new Set(list.map(r => r.id)));
    };

    const collapseAll = () => {
        setExpandedIds(new Set());
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this specific request?")) return;
        try {
            await api.delete(`/help/${id}`);
            fetchHelpData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || error.message);
        }
    };

    const getSectorInfo = (tag) => {
        switch (tag?.toLowerCase()) {
            case 'medical':
                return {
                    label: t('চিকিৎসা', 'Medical'),
                    className: 'bg-rose-50 text-rose-800 border-rose-200',
                    icon: '🩺'
                };
            case 'financial':
                return {
                    label: t('আর্থিক', 'Financial'),
                    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    icon: '💰'
                };
            case 'advice':
                return {
                    label: t('পরামর্শ', 'Advice'),
                    className: 'bg-blue-50 text-blue-800 border-blue-200',
                    icon: '💡'
                };
            case 'research':
                return {
                    label: t('গবেষণা', 'Research'),
                    className: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                    icon: '🔬'
                };
            default:
                return {
                    label: t(tag || 'অন্যান্য', tag || 'Other'),
                    className: 'bg-amber-50 text-amber-900 border-amber-200',
                    icon: '📌'
                };
        }
    };

    const handleCopyDetails = (post) => {
        const sName = formatName({
            full_name: post.help_seeker || post.posted_by,
            name_bangla: post.seeker_name_bangla,
            name_english: post.seeker_name_english
        }) || formatName(post.help_seeker || post.posted_by) || 'N/A';
        const pName = formatName({
            full_name: post.posted_by,
            name_bangla: post.poster_name_bangla,
            name_english: post.poster_name_english
        }) || formatName(post.posted_by) || 'Admin';

        const text = `[Projenitor Help Request]\nTitle: ${post.title}\nSector: ${post.tag}\nHelp Seeker: ${sName}\nContact: ${post.contact_number || 'N/A'}\nPosted By: ${pName}\nDate: ${formatDateDDMMYYYY(post.created_at)}\n\nDetails:\n${post.content || ''}`;
        navigator.clipboard.writeText(text);
        setCopiedPostId(post.id);
        setTimeout(() => setCopiedPostId(null), 3000);
    };

    const categoryTabs = [
        { id: 'All', label: t('সব ক্যাটাগরি', 'All Categories') },
        { id: 'Medical', label: t('চিকিৎসা', 'Medical') },
        { id: 'Financial', label: t('আর্থিক', 'Financial') },
        { id: 'Advice', label: t('পরামর্শ', 'Advice') },
        { id: 'Research', label: t('গবেষণা', 'Research') },
        { id: 'Other', label: t('অন্যান্য', 'Other') },
    ];

    const filteredRequests = helpRequests.filter(req => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q || (
            req.title?.toLowerCase().includes(q) ||
            req.content?.toLowerCase().includes(q) ||
            req.tag?.toLowerCase().includes(q) ||
            req.contact_number?.toLowerCase().includes(q) ||
            req.help_seeker?.toLowerCase().includes(q) ||
            formatName(req.help_seeker)?.toLowerCase().includes(q) ||
            req.posted_by?.toLowerCase().includes(q) ||
            formatName(req.posted_by)?.toLowerCase().includes(q)
        );

        const matchesCategory = selectedCategory === 'All' || 
            req.tag?.toLowerCase() === selectedCategory.toLowerCase();

        return matchesQuery && matchesCategory;
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-up">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary flex items-center gap-3">
                        <HelpCircle className="h-9 w-9 sm:h-10 sm:w-10 text-secondary" />
                        {t('সহায়তা কেন্দ্র', 'Help Desk')}
                    </h1>
                    <p className="text-stone-500 mt-1.5 text-sm sm:text-base">
                        {t('সাহায্য চান বা সমাজের সদস্যদের সাহায্য করুন।', 'Ask for help or offer support to community members.')}
                    </p>
                </div>
                <button
                    onClick={() => { setEditingRequest(null); setIsModalOpen(true); }}
                    className="bg-primary text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-orange-900 transition-all flex items-center gap-2 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 duration-200 font-semibold cursor-pointer text-sm sm:text-base"
                >
                    <PlusCircle className="h-5 w-5" />
                    <span>{t('নতুন অনুরোধ', 'New Request')}</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-orange-100/90 space-y-3 animate-slide-up" style={{ animationDelay: '0.05s' }}>
                <div className="flex items-center gap-2 bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-orange-200 transition-all">
                    <Search className="h-5 w-5 text-stone-400 shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('শিরোনাম, সাহায্যপ্রার্থী, নম্বর বা বিবরণ লিখে খুঁজুন...', 'Search by title, seeker name, phone, or description...')}
                        className="flex-1 outline-none text-stone-700 bg-transparent text-sm sm:text-base placeholder-stone-400"
                    />
                    {searchQuery && (
                        <button 
                            type="button" 
                            onClick={() => setSearchQuery('')}
                            className="text-stone-400 hover:text-stone-600 p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Category Pill Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs sm:text-sm">
                    <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0 mr-1" />
                    {categoryTabs.map((tab) => {
                        const isActive = selectedCategory === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSelectedCategory(tab.id)}
                                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer font-medium ${
                                    isActive
                                        ? 'bg-primary text-white shadow-xs font-semibold'
                                        : 'bg-stone-50 hover:bg-orange-50/80 text-stone-600 hover:text-primary border border-stone-200/70'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* List Controls: Count and Expand/Collapse All */}
            <div className="flex items-center justify-between px-1 text-xs sm:text-sm text-stone-500">
                <span className="font-medium">
                    {t(`মোট ${filteredRequests.length} টি অনুরোধ প্রদর্শিত`, `Showing ${filteredRequests.length} help requests`)}
                </span>
                {filteredRequests.length > 0 && (
                    <div className="flex items-center gap-2 font-medium">
                        <button
                            type="button"
                            onClick={() => expandAll(filteredRequests)}
                            className="text-primary hover:text-orange-950 hover:underline cursor-pointer"
                        >
                            {t('সব বিস্তারিত দেখুন', 'Expand All')}
                        </button>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={collapseAll}
                            className="text-stone-500 hover:text-stone-800 hover:underline cursor-pointer"
                        >
                            {t('সব সংক্ষেপ করুন', 'Collapse All')}
                        </button>
                    </div>
                )}
            </div>

            {/* Posts List */}
            <div className="space-y-3.5">
                {loading ? (
                    <div className="bg-white p-10 rounded-2xl text-center shadow-xs border border-stone-100 text-stone-400 animate-pulse font-medium">
                        {t('অনুরোধ লোড হচ্ছে...', 'Loading help requests...')}
                    </div>
                ) : filteredRequests.length > 0 ? (
                    filteredRequests.map((post, index) => {
                        const isExpanded = expandedIds.has(post.id);
                        const isHighlighted = highlightedId === `help-${post.id}`;
                        const sector = getSectorInfo(post.tag);
                        
                        const seekerObj = {
                            full_name: post.help_seeker || post.posted_by,
                            name_bangla: post.seeker_name_bangla,
                            name_english: post.seeker_name_english
                        };
                        const seekerName = formatName(seekerObj) || formatName(post.help_seeker || post.posted_by) || t('সম্প্রদায়', 'Community');

                        const posterObj = {
                            full_name: post.posted_by,
                            name_bangla: post.poster_name_bangla,
                            name_english: post.poster_name_english
                        };
                        const posterName = formatName(posterObj) || formatName(post.posted_by) || t('সদস্য', 'Member');

                        return (
                            <div
                                key={post.id}
                                id={`help-${post.id}`}
                                className={`bg-white rounded-2xl transition-all duration-300 animate-slide-up group overflow-hidden ${
                                    isHighlighted
                                        ? 'border-2 border-orange-500 ring-4 ring-orange-400/40 shadow-xl bg-orange-50/30 -translate-y-0.5'
                                        : isExpanded
                                            ? 'border-2 border-orange-200 shadow-md ring-1 ring-orange-200/50'
                                            : 'border border-orange-100/90 hover:border-amber-300 hover:shadow-md shadow-xs'
                                }`}
                                style={{ animationDelay: `${0.05 * Math.min(index + 1, 10)}s` }}
                            >
                                {/* Minimal Card Header: Sector, Seeker, Contact, Heading & Expand Toggle */}
                                <div
                                    onClick={() => toggleExpand(post.id)}
                                    className="p-4 sm:p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 select-none hover:bg-orange-50/40 transition-colors"
                                >
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        {/* Minimal badges: Sector + Seeker + Contact + Urgency */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Help Sector */}
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${sector.className}`}>
                                                <span>{sector.icon}</span>
                                                <span>{sector.label}</span>
                                            </span>

                                            {/* Help Seeker Info - Clickable profile if in directory with highlighted oval box */}
                                            <div className="inline-flex items-center gap-1.5 text-xs text-stone-600">
                                                <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                                <span>{t('সাহায্যপ্রার্থী:', 'Seeker:')}</span>
                                                {post.help_seeker_id ? (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleOpenProfile(post.help_seeker_id, e)}
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-orange-950 bg-orange-200 hover:bg-orange-300 border border-orange-300 hover:border-orange-400 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-95"
                                                        title={t('ডিরেক্টরি থেকে প্রোফাইল কার্ড দেখুন', 'View profile card from directory')}
                                                    >
                                                        <span>{seekerName}</span>
                                                    </button>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-stone-800 bg-orange-100 border border-orange-200">
                                                        {seekerName}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Alert Badge if urgent */}
                                            {post.type === 'alert' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white shadow-2xs animate-pulse">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span>{t('জরুরি', 'Urgent')}</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Heading (Title) */}
                                        <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 group-hover:text-primary transition-colors leading-snug">
                                            {post.title}
                                        </h3>
                                    </div>

                                    {/* Action items: View Details toggle and Admin buttons */}
                                    <div className="flex items-center gap-2 shrink-0 self-start md:self-center pt-1 md:pt-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleExpand(post.id);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 hover:border-orange-300 transition-all hover:shadow-xs active:scale-95 cursor-pointer"
                                        >
                                            <span>{isExpanded ? t('সংক্ষেপ করুন', 'Show Less') : t('বিস্তারিত দেখুন', 'View Details')}</span>
                                            <ChevronDown className={`w-3.5 h-3.5 text-orange-800 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isAdmin && (
                                            <div className="flex items-center gap-1 border-l border-stone-200 pl-2 ml-1" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => { setEditingRequest(post); setIsModalOpen(true); }}
                                                    className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                                                    title={t('সম্পাদনা', 'Edit Request')}
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                    title={t('মুছুন', 'Delete Request')}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Full Information Revealed on Click/Expand */}
                                {isExpanded && (
                                    <div className="px-4 sm:px-6 pb-5 pt-3 border-t border-orange-100 bg-orange-50/20 space-y-4 rounded-b-2xl animate-fade-in">
                                        {/* Metadata row: Posted By, Contact Number, and Date */}
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-500 pt-0.5">
                                            {/* Posted by - Clickable profile if in directory */}
                                            {post.posted_by && (
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                                    <span>{t('পোস্ট করেছেন:', 'Posted by:')}</span>
                                                    {post.posted_by_member_id ? (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleOpenProfile(post.posted_by_member_id, e)}
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-orange-950 bg-orange-200 hover:bg-orange-300 border border-orange-300 hover:border-orange-400 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-95"
                                                            title={t('ডিরেক্টরি থেকে প্রোফাইল কার্ড দেখুন', 'View profile card from directory')}
                                                        >
                                                            <span>{posterName}</span>
                                                        </button>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-stone-800 bg-orange-100 border border-orange-200">
                                                            {posterName}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Contact Number - Prominently Highlighted */}
                                            {post.contact_number && (
                                                <div className="flex items-center gap-1.5">
                                                    <span>{t('যোগাযোগ নম্বর:', 'Contact No:')}</span>
                                                    <a
                                                        href={`tel:${post.contact_number.split(/[,;\/]+/)[0].trim()}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 hover:border-emerald-400 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-95 group/call"
                                                        title={t('কল করতে চাপুন', 'Click to call')}
                                                    >
                                                        <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0 group-hover/call:scale-110 transition-transform" />
                                                        <span>{post.contact_number}</span>
                                                    </a>
                                                </div>
                                            )}

                                            {/* Posting Date */}
                                            {post.created_at && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                                    <span>{t('তারিখ:', 'Date:')}</span>
                                                    <span className="font-semibold text-stone-800">{formatDateDDMMYYYY(post.created_at)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Full Details Content Box */}
                                        <div className="bg-white p-4 sm:p-5 rounded-xl border border-orange-100 shadow-2xs">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                                                {t('বিস্তারিত বিবরণ', 'Detailed Information')}
                                            </h4>
                                            <div className="text-stone-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                                                {post.content ? (
                                                    post.content
                                                ) : (
                                                    <span className="text-stone-400 italic">
                                                        {t('কোনো বিস্তারিত বিবরণ প্রদান করা হয়নি।', 'No additional description provided.')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action footer */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                                            <div className="text-xs text-stone-500 flex items-center gap-1.5">
                                                <Info className="w-4 h-4 text-orange-700 shrink-0" />
                                                <span>{t('সাহায্য করতে চাইলে নিচের বোতাম ব্যবহার করে যোগাযোগ করুন।', 'To offer help, please use the button to reach out.')}</span>
                                            </div>

                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyDetails(post)}
                                                    className="px-3.5 py-2 rounded-lg text-xs font-medium border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                                    title={t('অনুরোধের তথ্য কপি করুন', 'Copy Request Details')}
                                                >
                                                    {copiedPostId === post.id ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span className="text-emerald-700 font-semibold">{t('কপি হয়েছে!', 'Copied!')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3.5 h-3.5 text-stone-500" />
                                                            <span>{t('কপি করুন', 'Copy')}</span>
                                                        </>
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setContactingPost(post)}
                                                    className="flex-1 sm:flex-initial bg-gradient-to-r from-red-800 to-red-700 hover:from-red-900 hover:to-red-800 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                    <span>{t('সহায়তা দিতে যোগাযোগ করুন', 'Contact to Offer Help')}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-white p-10 rounded-2xl text-center shadow-xs border border-stone-100 text-stone-500 font-medium">
                        {t('কোনো সহায়তার অনুরোধ পাওয়া যায়নি।', 'No help requests found.')}
                    </div>
                )}
            </div>

            {/* Offer Assistance Modal */}
            {contactingPost && (
                <div 
                    className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex justify-center items-center z-[9999] px-4 animate-fade-in"
                    onClick={() => setContactingPost(null)}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up border border-orange-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - High contrast with explicit white title to prevent theme color clashing */}
                        <div className="px-6 py-4 bg-gradient-to-r from-orange-950 via-orange-900 to-red-950 text-white flex justify-between items-center shadow-xs">
                            <div className="flex items-center gap-2.5">
                                <MessageCircle className="w-5 h-5 text-yellow-400 shrink-0" />
                                <h3 className="text-lg font-serif font-bold text-white !text-white drop-shadow-sm tracking-wide">
                                    {t('সহায়তা প্রদানের যোগাযোগ', 'Offer Help & Support')}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setContactingPost(null)} 
                                className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white"
                                title={t('বন্ধ করুন', 'Close')}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div className="bg-orange-50/70 p-4 rounded-xl border border-orange-200/80 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-200 text-orange-900">
                                        {contactingPost.tag}
                                    </span>
                                    {contactingPost.type === 'alert' && (
                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-600 text-white">
                                            {t('জরুরি', 'Urgent')}
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-base font-bold text-stone-900 font-serif">
                                    {contactingPost.title}
                                </h4>
                                <div className="text-xs text-stone-600 flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                        <span>{t('সাহায্যপ্রার্থী:', 'Seeker:')}</span>
                                        {contactingPost.help_seeker_id ? (
                                            <button
                                                type="button"
                                                onClick={(e) => handleOpenProfile(contactingPost.help_seeker_id, e)}
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-orange-950 bg-orange-200 hover:bg-orange-300 border border-orange-300 hover:border-orange-400 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-95"
                                                title={t('প্রোফাইল কার্ড দেখুন', 'View Profile')}
                                            >
                                                <span>{formatName({
                                                    full_name: contactingPost.help_seeker || contactingPost.posted_by,
                                                    name_bangla: contactingPost.seeker_name_bangla,
                                                    name_english: contactingPost.seeker_name_english
                                                }) || formatName(contactingPost.help_seeker || contactingPost.posted_by)}</span>
                                            </button>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-stone-800 bg-orange-100 border border-orange-200">
                                                {formatName({
                                                    full_name: contactingPost.help_seeker || contactingPost.posted_by,
                                                    name_bangla: contactingPost.seeker_name_bangla,
                                                    name_english: contactingPost.seeker_name_english
                                                }) || formatName(contactingPost.help_seeker || contactingPost.posted_by)}
                                            </span>
                                        )}
                                    </div>
                                    {contactingPost.contact_number && (
                                        <div className="flex items-center gap-1.5 pl-2 border-l border-stone-300">
                                            <span>{t('নম্বর:', 'Phone:')}</span>
                                            <a
                                                href={`tel:${contactingPost.contact_number.split(/[,;\/]+/)[0].trim()}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 shadow-2xs transition-colors"
                                                title={t('কল করতে চাপুন', 'Click to call')}
                                            >
                                                <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                                <span>{contactingPost.contact_number}</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-stone-600 leading-relaxed">
                                {t(
                                    'এই অনুরোধে সহায়তা প্রদান করতে বা সরাসরি যোগাযোগ করতে নিচের বোতামগুলো ব্যবহার করুন।',
                                    'To offer help or reach out directly, please use the options below.'
                                )}
                            </p>

                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                {contactingPost.contact_number && (
                                    <a
                                        href={`tel:${contactingPost.contact_number.split(/[,;\/]+/)[0].trim()}`}
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xs hover:shadow-md cursor-pointer active:scale-95"
                                    >
                                        <Phone className="w-4 h-4" />
                                        <span>{t('সরাসরি কল করুন', 'Call Now')}</span>
                                    </a>
                                )}

                                <button
                                    type="button"
                                    onClick={() => handleCopyDetails(contactingPost)}
                                    className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-2xs"
                                >
                                    {copiedPostId === contactingPost.id ? (
                                        <>
                                            <Check className="w-4 h-4 text-emerald-600" />
                                            <span className="text-emerald-700 font-bold">{t('কপি সম্পন্ন হয়েছে!', 'Copied!')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 text-stone-600" />
                                            <span>{t('অনুরোধের তথ্য কপি করুন', 'Copy Details')}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setContactingPost(null)}
                                className="px-4 py-2 text-stone-600 hover:text-stone-800 font-semibold text-xs sm:text-sm hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
                            >
                                {t('বন্ধ করুন', 'Close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Help Request Create/Edit Modal */}
            <HelpRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchHelpData}
                initialData={editingRequest}
            />

            {/* Member Profile Modal (Identical to Directory / Search Members) */}
            {selectedMemberId && (
                <Profile
                    memberId={selectedMemberId}
                    onClose={() => setSelectedMemberId(null)}
                />
            )}
        </div>
    );
};

export default Help;

