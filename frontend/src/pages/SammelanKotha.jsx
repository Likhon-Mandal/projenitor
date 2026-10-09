import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { 
    Calendar, MapPin, Home as HomeIcon, Clock, Sparkles, 
    Plus, Pencil, Trash2, Search, ArrowUpDown, ExternalLink, 
    User, BookOpen, Star, Eye, X, CheckCircle2, AlertCircle,
    ChevronRight, ChevronDown, ChevronUp, Map, Info, Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';
import SammelanFormModal from '../components/SammelanFormModal';
import ConfirmModal from '../components/ConfirmModal';

// Helper to convert English digits to Bengali digits
const toBnDigits = (num) => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num || '').replace(/[0-9]/g, d => bnDigits[d]);
};

// Calculate English Year from Edition (Anchor: 95th in 2027)
const getEnglishYear = (edition) => {
    const ed = parseInt(edition, 10);
    if (isNaN(ed)) return '';
    return 1977 + (ed - 45);
};

// ── Main SammelanKotha Component ──────────────────────────────────────────────
const SammelanKotha = () => {
    const { user, isAdmin, isSuperAdmin } = useAuth();
    const { t, isBn, formatNumber } = useLanguage();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [sammelans, setSammelans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('desc'); // Default desc: newest/highest edition on top
    const [error, setError] = useState('');

    // Accordion state: only one sammelan details can be open at a time
    const [expandedId, setExpandedId] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingSammelan, setEditingSammelan] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '' });

    const fetchSammelans = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchQuery.trim()) params.search = searchQuery.trim();
            if (sortOrder) params.sort = sortOrder;

            const res = await api.get('/sammelans', { params });
            setSammelans(res.data || []);
            setError('');
        } catch (err) {
            console.error('Error fetching sammelans:', err);
            setError(t('সম্মেলন তালিকা লোড করতে সমস্যা হয়েছে', 'Failed to load sammelans'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSammelans();
    }, [sortOrder]);

    // Auto-expand detail inline if navigated with specific detailId or edition
    useEffect(() => {
        const targetId = location.state?.openDetailId || searchParams.get('detailId');
        const targetEdition = searchParams.get('edition');
        if (sammelans.length > 0) {
            let found = null;
            if (targetId) {
                found = sammelans.find(s => String(s.id) === String(targetId));
            } else if (targetEdition) {
                found = sammelans.find(s => String(s.edition) === String(targetEdition));
            }
            if (found) {
                setExpandedId(found.id);
                setTimeout(() => {
                    const el = document.getElementById(`sammelan-item-${found.id}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 150);
            }
        }
    }, [sammelans, location.state, searchParams]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchSammelans();
    };

    const handleSetNext = async (id) => {
        try {
            await api.patch(`/sammelans/${id}/set-next`);
            fetchSammelans();
        } catch (err) {
            console.error('Error setting next sammelan:', err);
            alert(err.response?.data?.error || t('কার্যক্রম ব্যর্থ হয়েছে', 'Operation failed'));
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.id) return;
        try {
            await api.delete(`/sammelans/${deleteModal.id}`);
            setDeleteModal({ isOpen: false, id: null, title: '' });
            fetchSammelans();
        } catch (err) {
            console.error('Error deleting sammelan:', err);
            alert(err.response?.data?.error || t('সম্মেলন মুছতে সমস্যা হয়েছে', 'Failed to delete sammelan'));
        }
    };

    const nextSammelan = sammelans.find(s => s.is_next);

    return (
        <div className="min-h-screen bg-[#fffcf5] text-stone-800 font-sans pb-24">
            
            {/* HERITAGE HERO HEADER */}
            <div className="relative bg-gradient-to-b from-orange-900 via-orange-950 to-stone-900 text-white py-14 px-4 md:px-8 border-b-4 border-amber-500 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
                
                <div className="max-w-6xl mx-auto text-center relative z-10 space-y-3.5">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-widest shadow-inner">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t('৪৫তম থেকে ১০০তম ঐতিহাসিক সম্মেলন', '45th to 100th Annual Lineage Gatherings')}</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight text-amber-50 drop-shadow-md">
                        {t('সম্মেলন কথা', 'Sammelan Katha')}
                    </h1>

                    <p className="text-orange-200/90 text-xs sm:text-sm max-w-3xl mx-auto font-light leading-relaxed">
                        {t(
                            'ইংরেজি ১৯৩৩ (বাংলা ১৩৩৯) থেকে অনুষ্ঠিত বাড়ৈ বংশের ঐতিহাসিক বার্ষিক সম্মেলন। ৪৫তম সম্মেলন (১৯৭৭) থেকে শুরু করে ১০০তম সম্মেলন (২০৩২) পর্যন্ত সকল সম্মেলনের সংক্ষিপ্ত রূপরেখা ও অবস্থান।',
                            'Chronicle of the Barai annual conferences from the 45th Gathering (1977) to the historic 100th Gathering (2032).'
                        )}
                    </p>

                    {/* Admin Add Button */}
                    {(isAdmin || isSuperAdmin) && (
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => { setEditingSammelan(null); setIsFormModalOpen(true); }}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-full font-bold text-xs shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
                            >
                                <Plus className="w-4 h-4 stroke-[2.5]" />
                                <span>{t('নতুন সম্মেলন যোগ করুন', 'Add New Sammelan')}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 mt-8 space-y-6">

                {/* SCROLLABLE BOX CONTAINER */}
                <div className="bg-white rounded-3xl border border-orange-200/80 shadow-xl shadow-orange-950/5 overflow-hidden flex flex-col">
                    
                    {/* Header Controls Bar */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-50 via-amber-50/50 to-orange-50 border-b border-orange-100 flex flex-col sm:flex-row items-center justify-between gap-3.5 shrink-0">
                        
                        {/* Title & Count */}
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                            <div className="w-8 h-8 rounded-xl bg-orange-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 leading-none">
                                    {t('সম্মেলন তালিকা (৪৫তম – ১০০তম)', 'Sammelan Directory (45th – 100th)')}
                                </h3>
                                <p className="text-[11px] text-stone-500 mt-0.5">
                                    {t('মোট অন্তর্ভুক্তি', 'Total Entries')}: <strong className="text-orange-900">{isBn ? toBnDigits(sammelans.length) : sammelans.length}</strong> {t('টি সম্মেলন', 'gatherings')}
                                </p>
                            </div>
                        </div>

                        {/* Search & Sort Controls */}
                        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-60">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('সংখ্যা, বাড়ি বা সাল...', 'Search edition, bari, year...')}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                />
                                <button type="submit" className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-stone-400 hover:text-orange-700 cursor-pointer">
                                    <Search className="w-3.5 h-3.5" />
                                </button>
                            </form>

                            <button
                                type="button"
                                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-orange-50 text-stone-700 rounded-xl text-xs font-bold border border-orange-200 shadow-2xs transition-colors cursor-pointer shrink-0"
                                title={t('ক্রমবিন্যাস পরিবর্তন করুন', 'Toggle Sort Order')}
                            >
                                <ArrowUpDown className="w-3.5 h-3.5 text-orange-700" />
                                <span>{sortOrder === 'desc' ? t('নতুন আগে (১০০→৪৫)', 'Newest First (100→45)') : t('পুরাতন আগে (৪৫→১০০)', 'Oldest First (45→100)')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Box Listing (Inline Accordion Details, Mobile-Friendly) */}
                    <div className="max-h-[640px] overflow-y-auto space-y-2 p-2 sm:p-3 scroll-smooth">
                        {loading ? (
                            <div className="space-y-2.5 p-2">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="h-16 bg-orange-50/60 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : sammelans.length === 0 ? (
                            <div className="text-center py-16 px-4 space-y-2">
                                <BookOpen className="w-10 h-10 text-orange-200 mx-auto" />
                                <p className="text-sm font-bold text-stone-700">
                                    {t('কোনো সম্মেলন পাওয়া যায়নি', 'No sammelan found')}
                                </p>
                                <p className="text-xs text-stone-400">
                                    {t('অন্য কোনো সংখ্যা বা নাম লিখে পুনরায় অনুসন্ধান করুন।', 'Try searching with a different edition number or name.')}
                                </p>
                            </div>
                        ) : (
                            sammelans.map((item) => {
                                const engYear = getEnglishYear(item.edition);
                                const isNext = Boolean(item.is_next);
                                const isExpanded = expandedId === item.id;
                                const mapUrl = item.map_link || item.home_map_link || (item.venue_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.venue_address)}` : null);

                                return (
                                    <div
                                        key={item.id}
                                        id={`sammelan-item-${item.id}`}
                                        className={`rounded-2xl transition-all duration-200 border overflow-hidden ${
                                            isExpanded
                                                ? 'bg-orange-50/70 border-orange-300 shadow-md ring-1 ring-orange-400/30'
                                                : isNext
                                                    ? 'bg-amber-50/60 border-amber-300 hover:bg-amber-50 hover:shadow-xs'
                                                    : 'bg-white hover:bg-orange-50/60 border-orange-100 hover:border-orange-200 hover:shadow-2xs'
                                        }`}
                                    >
                                        {/* Clickable Header Row */}
                                        <div
                                            onClick={() => setExpandedId(prev => prev === item.id ? null : item.id)}
                                            className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none"
                                        >
                                            {/* Two Compact Lines - Optimized to avoid breaking unnecessarily */}
                                            <div className="min-w-0 flex-1 space-y-0.5">
                                                {/* LINE 1: Edition Badge, Title, English Year, Upcoming Badge */}
                                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-sans ${
                                                        isNext 
                                                            ? 'bg-amber-500 text-stone-950 font-black shadow-2xs' 
                                                            : 'bg-orange-800 text-white'
                                                    }`}>
                                                        {isBn ? `${toBnDigits(item.edition)}তম` : `${item.edition}th`}
                                                    </span>

                                                    <h4 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                                                        {isBn ? `${toBnDigits(item.edition)}তম বংশীয় সম্মেলন` : `${item.edition}th Gathering`}
                                                    </h4>

                                                    <span className="text-[11px] sm:text-xs font-bold text-orange-800 bg-orange-100/80 px-1.5 py-0.5 rounded-md">
                                                        {isBn ? `${toBnDigits(engYear)} খ্রিঃ` : `${engYear}`}
                                                    </span>

                                                    {item.bengali_date && (
                                                        <span className="text-xs text-stone-500 font-medium hidden md:inline">
                                                            • {item.bengali_date}
                                                        </span>
                                                    )}

                                                    {isNext && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-950 text-[10px] font-bold border border-amber-400">
                                                            <Sparkles className="w-3 h-3 text-amber-800" />
                                                            <span>{t('আসন্ন', 'Upcoming')}</span>
                                                        </span>
                                                    )}
                                                </div>

                                                {/* LINE 2: Venue and Address compactly joined */}
                                                <div className="flex items-center gap-2 text-xs text-stone-600 truncate pt-0.5">
                                                    <div className="flex items-center gap-1 truncate shrink-0 max-w-[50%] sm:max-w-none">
                                                        <HomeIcon className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                                                        <span className="font-semibold text-stone-800 truncate">
                                                            {item.venue_name || t('স্থান অনির্ধারিত', 'Venue TBD')}
                                                        </span>
                                                    </div>

                                                    <span className="text-stone-300">•</span>

                                                    <div className="flex items-center gap-1 truncate text-stone-500">
                                                        <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                                        <span className="truncate">
                                                            {item.venue_address || t('ঠিকানা পরবর্তীতে যুক্ত হবে', 'Address to be added')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action / Toggle Buttons */}
                                            <div
                                                className="flex items-center gap-2 shrink-0 self-end sm:self-center"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* Details Toggle Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedId(prev => prev === item.id ? null : item.id)}
                                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                                                        isExpanded
                                                            ? 'bg-orange-800 text-white shadow-xs'
                                                            : 'bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200'
                                                    }`}
                                                >
                                                    <span>{isExpanded ? t('আড়াল করুন', 'Hide') : t('বিস্তারিত', 'Details')}</span>
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    )}
                                                </button>

                                                {/* Admin Controls */}
                                                {(isAdmin || isSuperAdmin) && (
                                                    <div className="flex items-center gap-1 pl-1 border-l border-orange-200">
                                                        {!isNext && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetNext(item.id)}
                                                                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                                                                title={t('হোমপেজের আসন্ন সম্মেলন হিসেবে নির্ধারণ করুন', 'Set as Next Sammelan')}
                                                            >
                                                                <Star className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => { setEditingSammelan(item); setIsFormModalOpen(true); }}
                                                            className="p-1.5 text-stone-500 hover:text-orange-800 hover:bg-orange-100/60 rounded-lg transition-colors cursor-pointer"
                                                            title={t('সম্পাদনা', 'Edit')}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteModal({ isOpen: true, id: item.id, title: item.title || `${toBnDigits(item.edition)}তম সম্মেলন` })}
                                                            className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                            title={t('মুছে ফেলুন', 'Delete')}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* INLINE EXPANDED DETAILS (Below clicked item, only 1 open at a time) */}
                                        {isExpanded && (
                                            <div className="px-3 pb-3 sm:px-4 sm:pb-3.5 pt-1 border-t border-orange-200/80 space-y-2 animate-fadeIn text-stone-800">
                                                {/* Date & Time Compact Inline Box */}
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs bg-white/95 p-2.5 rounded-xl border border-orange-100">
                                                    <span className="inline-flex items-center gap-1 font-bold text-orange-950 shrink-0">
                                                        <Calendar className="w-3.5 h-3.5 text-orange-700 shrink-0" />
                                                        <span>{t('তারিখ ও সময়:', 'Date & Time:')}</span>
                                                    </span>

                                                    <span className="font-semibold text-stone-800">
                                                        {item.bengali_date || (isBn ? '১০ ফাল্গুন' : '10 Falgun')}
                                                    </span>

                                                    <span className="text-orange-800 font-bold bg-orange-100/70 px-2 py-0.5 rounded-md">
                                                        {isBn ? `২৩ ফেব্রুয়ারি, ${toBnDigits(engYear)} খ্রিঃ` : `23 Feb, ${engYear}`}
                                                    </span>

                                                    {item.time && (
                                                        <span className="inline-flex items-center gap-1 text-stone-600 font-medium">
                                                            <Clock className="w-3 h-3 text-stone-400" />
                                                            <span>{item.time}</span>
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Host Bari & Address Compact Inline Box */}
                                                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-xs bg-white/95 p-2.5 rounded-xl border border-orange-100">
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                                                        <span className="inline-flex items-center gap-1 font-bold text-orange-950 shrink-0">
                                                            <HomeIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                                            <span>{t('স্বাগতিক বাড়ি ও স্থান:', 'Host Bari & Venue:')}</span>
                                                        </span>
                                                        <span className="font-bold text-stone-900">
                                                            {item.venue_name || t('স্থান নির্ধারিত হয়নি', 'Venue not set')}
                                                        </span>
                                                        {item.venue_address && (
                                                            <>
                                                                <span className="text-stone-300 hidden sm:inline">•</span>
                                                                <span className="inline-flex items-center gap-1 text-stone-600">
                                                                    <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                                                                    <span>{item.venue_address}</span>
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>

                                                    {mapUrl && (
                                                        <a 
                                                            href={mapUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 hover:bg-orange-200 text-orange-900 rounded-lg font-bold text-[11px] transition-colors shrink-0"
                                                        >
                                                            <Map className="w-3 h-3 text-red-600" />
                                                            <span>{t('গুগল ম্যাপ', 'Google Map')}</span>
                                                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                                        </a>
                                                    )}
                                                </div>

                                                {/* Leadership (President & Secretary) if available */}
                                                {(item.president || item.secretary) && (
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs bg-white/90 p-2.5 rounded-xl border border-orange-100">
                                                        {item.president && (
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <User className="w-3.5 h-3.5 text-orange-700" />
                                                                <span className="text-stone-500 font-medium">{t('সভাপতি:', 'President:')}</span>
                                                                <span className="font-bold text-stone-800">{item.president}</span>
                                                            </span>
                                                        )}
                                                        {item.secretary && (
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <User className="w-3.5 h-3.5 text-amber-700" />
                                                                <span className="text-stone-500 font-medium">{t('সম্পাদক:', 'Secretary:')}</span>
                                                                <span className="font-bold text-stone-800">{item.secretary}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Memoirs / History / Description */}
                                                {item.description ? (
                                                    <div className="bg-amber-50/60 p-2.5 sm:p-3 rounded-xl border border-amber-200/80 text-xs text-stone-800 leading-relaxed font-sans">
                                                        <span className="font-bold text-orange-900 block sm:inline mr-2">
                                                            📜 {t('কার্যবিবরণী ও ইতিহাস:', 'Memoirs & History:')}
                                                        </span>
                                                        <span>{item.description}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-2 text-stone-400 text-xs italic bg-white/50 rounded-xl border border-dashed border-orange-100">
                                                        {t('সম্মেলনের বিস্তারিত কার্যবিবরণী এখনো সংরক্ষিত করা হয়নি।', 'Detailed memoirs for this gathering have not been archived yet.')}
                                                    </div>
                                                )}

                                                {/* Admin Edit Link inside details */}
                                                {(isAdmin || isSuperAdmin) && (
                                                    <div className="flex justify-end pt-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setEditingSammelan(item); setIsFormModalOpen(true); }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                                        >
                                                            <Pencil className="w-3 h-3 text-orange-700" />
                                                            <span>{t('তথ্য সম্পাদনা করুন', 'Edit Information')}</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Bottom Status / Footer of Box */}
                    <div className="p-3 bg-stone-50 border-t border-orange-100 text-center text-xs text-stone-500">
                        {t(
                            '💡 যে সকল সম্মেলনের বিস্তারিত বিবরণ নেই, এডমিন "সম্পাদনা" থেকে পরবর্তীতে স্বাগতিক বাড়ি ও কার্যবিবরণী সংযোজন করতে পারবেন।',
                            '💡 For sammelans without full details, admins can click "Edit" anytime to link homesteads and update memoirs.'
                        )}
                    </div>
                </div>
            </div>

            {/* Admin Add / Edit Modal */}
            <SammelanFormModal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setEditingSammelan(null); }}
                sammelan={editingSammelan}
                onSave={fetchSammelans}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null, title: '' })}
                onConfirm={handleDeleteConfirm}
                title={t('সম্মেলন মুছে ফেলা নিশ্চিত করুন', 'Confirm Delete Sammelan')}
                message={t(
                    `আপনি কি নিশ্চিত যে আপনি "${deleteModal.title}"-এর তথ্য মুছে ফেলতে চান?`,
                    `Are you sure you want to delete "${deleteModal.title}"?`
                )}
                confirmText={t('মুছে ফেলুন', 'Delete')}
                type="danger"
            />
        </div>
    );
};

export default SammelanKotha;
