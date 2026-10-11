import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
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
import SammelanPhotoCollage from '../components/SammelanPhotoCollage';
import PhotoLightboxModal from '../components/PhotoLightboxModal';

// Extract all unique photos for a sammelan item
const getSammelanPhotos = (item) => {
    if (!item) return [];
    const list = [];
    if (item.cover_image_url && typeof item.cover_image_url === 'string' && item.cover_image_url.trim()) {
        list.push(item.cover_image_url.trim());
    }
    if (item.images) {
        let arr = [];
        if (Array.isArray(item.images)) {
            arr = item.images;
        } else if (typeof item.images === 'string') {
            try {
                arr = JSON.parse(item.images);
            } catch (e) {
                arr = [];
            }
        }
        if (Array.isArray(arr)) {
            arr.forEach(img => {
                if (img && typeof img === 'string' && img.trim() && !list.includes(img.trim())) {
                    list.push(img.trim());
                }
            });
        }
    }
    return list;
};

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

// Clean Date String: remove 'বঙ্গাব্দ', 'খ্রিঃ', 'খ্রিস্টাব্দ', and parenthesized years
const cleanDateString = (str) => {
    if (!str) return '';
    return str
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/\s*বঙ্গাব্দ\s*/g, ' ')
        .replace(/\s*(খ্রিঃ|খ্রিস্টাব্দ)\s*/g, ' ')
        .replace(/,\s*$/, '')
        .trim();
};

// Extract Bangla Year Only (e.g. ১৩৮৬)
const getBanglaYear = (edition, bengaliDate) => {
    if (bengaliDate) {
        // Look specifically for 4-digit Bengali year starting with ১ and ৩-৪ (i.e. ১৩০০ to ১৪৯৯)
        const bnMatch = bengaliDate.match(/[১][৩-৪][০-৯]{2}/);
        if (bnMatch) return bnMatch[0];
        // Or English digits 1300-1499
        const enMatch = bengaliDate.match(/\b(1[3-4]\d{2})\b/);
        if (enMatch) return toBnDigits(enMatch[0]);
    }
    const ey = getEnglishYear(edition);
    return ey ? toBnDigits(ey - 594) : '';
};

// Bangla Year in English digits for English view
const getBanglaYearEn = (edition, bengaliDate) => {
    const byBn = getBanglaYear(edition, bengaliDate);
    const bnToEnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
    return String(byBn).replace(/[০-৯]/g, d => bnToEnMap[d] || d);
};

// Format Full English Date (e.g. ২৩ ফেব্রুয়ারি, ১৯৮০ / 23 February, 1980)
const getFullEnglishDate = (dateVal, engYear, isBn) => {
    const monthsBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    if (dateVal) {
        if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
            const parts = dateVal.split('T')[0].split('-');
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 0 && m < 12) {
                return isBn
                    ? `${toBnDigits(d)} ${monthsBn[m]}, ${toBnDigits(y)}`
                    : `${d} ${monthsEn[m]}, ${y}`;
            }
        }
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
            const day = d.getDate();
            return isBn
                ? `${toBnDigits(day)} ${monthsBn[d.getMonth()]}, ${toBnDigits(d.getFullYear())}`
                : `${day} ${monthsEn[d.getMonth()]}, ${d.getFullYear()}`;
        }
    }
    
    // Fallback if no exact date is available: 10th Falgun logic
    // Before 2020, 10th Falgun was 22 February. 2020 onwards, it's 23 February.
    const isLeapYearFallBack = engYear < 2020;
    const defaultDay = isLeapYearFallBack ? 22 : 23;
    const defaultDayBn = isLeapYearFallBack ? '২২' : '২৩';

    return isBn ? `${defaultDayBn} ফেব্রুয়ারি, ${toBnDigits(engYear)}` : `${defaultDay} February, ${engYear}`;
};

// Extract area address without repeating the bari/venue name
const getAreaAddressWithoutBari = (venueName, venueAddress) => {
    let addr = (venueAddress || '').trim();
    const vName = (venueName || '').trim();
    if (vName && addr) {
        if (addr.startsWith(vName)) {
            addr = addr.slice(vName.length).replace(/^[, \s]+/, '').trim();
        } else {
            addr = addr.replace(vName, '').replace(/^[, \s]+/, '').trim();
        }
    }
    return addr;
};

// ── Main SammelanKotha Component ──────────────────────────────────────────────
const SammelanKotha = () => {
    const { user, isAdmin, isSuperAdmin } = useAuth();
    const { t, isBn, formatNumber } = useLanguage();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [sammelans, setSammelans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('desc'); // Default desc: newest/highest edition on top
    const [error, setError] = useState('');

    // Full-screen photo lightbox state
    const [lightbox, setLightbox] = useState({
        isOpen: false,
        photos: [],
        index: 0,
        title: ''
    });

    const handleOpenPhoto = (photos, index, title) => {
        setLightbox({
            isOpen: true,
            photos,
            index: index || 0,
            title: title || ''
        });
    };

    // Open host bari in Lineage Explorer
    const handleOpenBariInExplorer = async (item, e) => {
        if (e) e.stopPropagation();

        // 1. Direct match with joined hierarchy
        if (item.district_name && item.village_name && (item.home_name || item.venue_name)) {
            const country = 'Bangladesh';
            const district = item.district_name;
            const upazila = item.upazila_name || '';
            const village = item.village_name;
            const home = item.home_name || item.venue_name;
            navigate(`/explorer/${encodeURIComponent(country)}/${encodeURIComponent(district)}/${encodeURIComponent(upazila)}/${encodeURIComponent(village)}/${encodeURIComponent(home)}`);
            return;
        }

        // 2. Lookup matching home from listed baris
        const queryName = (item.home_name || item.venue_name || '').trim();
        if (queryName && !queryName.includes('অনির্ধারিত') && !queryName.toLowerCase().includes('tbd')) {
            try {
                const res = await api.get(`/sammelans/homes-lookup?q=${encodeURIComponent(queryName)}`);
                if (res.data && res.data.length > 0) {
                    const match = res.data.find(h => h.id === item.home_id) || res.data.find(h => h.home_name === queryName) || res.data[0];
                    if (match && match.district_name && match.village_name) {
                        navigate(`/explorer/Bangladesh/${encodeURIComponent(match.district_name)}/${encodeURIComponent(match.upazila_name || '')}/${encodeURIComponent(match.village_name)}/${encodeURIComponent(match.home_name)}`);
                        return;
                    }
                }
            } catch (err) {
                console.error('Error opening home in lineage explorer:', err);
            }
        }

        // 3. Fallback: navigate to Lineage Explorer root
        navigate('/explorer');
    };

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

            {/* HERITAGE HERO HEADER - Clean, Colorful & Simple */}
            <div className="relative bg-gradient-to-r from-orange-700 via-amber-600 to-red-700 text-white py-8 sm:py-10 px-4 text-center shadow-md border-b-4 border-amber-400/60 overflow-hidden">
                <div className="max-w-4xl mx-auto relative z-10 space-y-2">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight text-white drop-shadow-md">
                        {t('সম্মেলনের ইতিহাস', 'সম্মেলনের ইতিহাস')}
                    </h1>

                    <p className="text-amber-100/95 text-xs sm:text-sm md:text-base font-medium max-w-xl mx-auto">
                        {t('৪৫তম থেকে ১০০তম ঐতিহাসিক বার্ষিক জ্ঞাতি সম্মেলন (১৯৭৭ – ২০৩২)', '45th to 100th Annual Lineage Gatherings (1977 – 2032)')}
                    </p>

                    {/* Admin Add Button */}
                    {(isAdmin || isSuperAdmin) && (
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => { setEditingSammelan(null); setIsFormModalOpen(true); }}
                                className="inline-flex items-center gap-1.5 px-5 py-2 bg-white hover:bg-amber-50 text-stone-900 rounded-full font-bold text-xs shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                            >
                                <Plus className="w-4 h-4 stroke-[2.5] text-orange-700" />
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
                                const cleanBnDate = cleanDateString(item.bengali_date);
                                const banglaYear = getBanglaYear(item.edition, item.bengali_date);
                                const banglaYearEn = getBanglaYearEn(item.edition, item.bengali_date);
                                const fullEngDate = getFullEnglishDate(item.date, engYear, isBn);
                                const areaAddress = getAreaAddressWithoutBari(item.venue_name, item.venue_address);
                                const mapUrl = item.map_link || item.home_map_link || (item.venue_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.venue_address)}` : null);

                                return (
                                    <div
                                        key={item.id}
                                        id={`sammelan-item-${item.id}`}
                                        className={`rounded-2xl transition-all duration-200 border overflow-hidden ${isExpanded
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
                                            {/* Two Compact Lines - Non-duplicate & Clean Dates */}
                                            <div className="min-w-0 flex-1 space-y-0.5">
                                                {/* LINE 1: Edition Badge, Title, Bangla Year Only, Full English Date, Upcoming Badge */}
                                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-sans ${isNext
                                                            ? 'bg-amber-500 text-stone-950 font-black shadow-2xs'
                                                            : 'bg-orange-800 text-white'
                                                        }`}>
                                                        {isBn ? `${toBnDigits(item.edition)}তম` : `${item.edition}th`}
                                                    </span>

                                                    <h4 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                                                        {isBn ? `${toBnDigits(item.edition)}তম বংশীয় সম্মেলন` : `${item.edition}th Gathering`}
                                                    </h4>

                                                    {/* Bangla Year Only */}
                                                    <span className="text-[11px] sm:text-xs font-bold text-orange-950 bg-orange-100/90 px-2 py-0.5 rounded-md">
                                                        {isBn ? banglaYear : banglaYearEn}
                                                    </span>

                                                    {/* Full English Date */}
                                                    <span className="text-xs text-stone-600 font-semibold">
                                                        • {fullEngDate}
                                                    </span>

                                                    {isNext && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-950 text-[10px] font-bold border border-amber-400">
                                                            <Sparkles className="w-3 h-3 text-amber-800" />
                                                            <span>{t('আসন্ন', 'Upcoming')}</span>
                                                        </span>
                                                    )}
                                                </div>

                                                {/* LINE 2: Venue and Area Address (without repeating homestead!) */}
                                                <div className="flex items-center gap-2 text-xs text-stone-600 truncate pt-0.5">
                                                    {item.venue_name && (
                                                        <div
                                                            onClick={(e) => handleOpenBariInExplorer(item, e)}
                                                            className="flex items-center gap-1 truncate shrink-0 max-w-[50%] sm:max-w-none hover:text-orange-950 group/line2 cursor-pointer"
                                                            title={t('বংশতালিকায় বাড়িটি দেখুন', 'Open in Lineage Explorer')}
                                                        >
                                                            <HomeIcon className="w-3.5 h-3.5 text-amber-800 shrink-0 group-hover/line2:scale-110 transition-transform" />
                                                            <span className="font-semibold text-stone-800 truncate group-hover/line2:underline">
                                                                {item.venue_name}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {item.venue_name && areaAddress && (
                                                        <span className="text-stone-300">•</span>
                                                    )}

                                                    {areaAddress && (
                                                        <div className="flex items-center gap-1 truncate text-stone-500">
                                                            <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                                            <span className="truncate">
                                                                {areaAddress}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {!item.venue_name && !areaAddress && (
                                                        <span className="text-stone-400 italic text-xs">
                                                            {t('স্থান ও ঠিকানা পরবর্তীতে যুক্ত হবে', 'Venue & address to be added')}
                                                        </span>
                                                    )}
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
                                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${isExpanded
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

                                        {/* INLINE EXPANDED DETAILS (Compact Box Design) */}
                                        {isExpanded && (
                                            <div className="px-3 pb-3 sm:px-4 sm:pb-3.5 pt-2 border-t border-orange-200/80 space-y-2.5 animate-fadeIn text-stone-800">
                                                {/* Photo Memories & Collage Section */}
                                                {(() => {
                                                    const photos = getSammelanPhotos(item);
                                                    if (photos.length === 0) return null;
                                                    return (
                                                        <div className="pt-0.5 pb-1">
                                                            <SammelanPhotoCollage
                                                                photos={photos}
                                                                title={item.title || `${toBnDigits(item.edition)}তম বংশীয় সম্মেলন`}
                                                                onOpenPhoto={(idx) => handleOpenPhoto(photos, idx, item.title || `${toBnDigits(item.edition)}তম বংশীয় সম্মেলন`)}
                                                            />
                                                        </div>
                                                    );
                                                })()}

                                                {/* 2-Box Highlights Grid: Host Bari (Clickable -> Lineage Explorer) | Address & Map */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">

                                                    {/* Box 1: Host Bari (Clickable to open in Lineage Explorer) */}
                                                    <div
                                                        onClick={(e) => handleOpenBariInExplorer(item, e)}
                                                        className="bg-white/95 p-2.5 sm:p-3 rounded-xl border border-orange-100 shadow-2xs hover:shadow-xs hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200 cursor-pointer flex items-center justify-between gap-2.5 group/bari"
                                                        title={t('বংশতালিকায় বাড়িটি দেখুন', 'Open Bari in Lineage Explorer')}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                            <div className="w-8 h-8 rounded-lg bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-850 shrink-0 group-hover/bari:scale-105 group-hover/bari:bg-amber-200/80 transition-all">
                                                                <HomeIcon className="w-4 h-4 text-amber-800" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                                                                    {t('স্বাগতিক বাড়ি', 'Host Bari')}
                                                                </p>
                                                                <p className="text-xs sm:text-sm font-bold text-stone-900 leading-snug truncate group-hover/bari:text-orange-950 transition-colors">
                                                                    {item.venue_name || t('স্থান নির্ধারিত হয়নি', 'Venue not set')}
                                                                </p>
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-800 group-hover/bari:underline mt-0.5">
                                                                    <Compass className="w-3 h-3 text-orange-700" />
                                                                    <span>{t('বংশতালিকায় বাড়িটি দেখুন', 'Open in Lineage Explorer')}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="w-6 h-6 rounded-lg bg-orange-100/60 flex items-center justify-center text-orange-800 shrink-0 group-hover/bari:bg-orange-800 group-hover/bari:text-white transition-colors">
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </div>
                                                    </div>

                                                    {/* Box 2: Address & Map (Without repeating bari name) */}
                                                    <div
                                                        onClick={() => mapUrl && window.open(mapUrl, '_blank', 'noopener,noreferrer')}
                                                        className={`bg-white/95 p-2.5 sm:p-3 rounded-xl border border-orange-100 shadow-2xs transition-all duration-200 flex items-center justify-between gap-2.5 ${mapUrl
                                                                ? 'hover:border-amber-400 hover:bg-orange-50/50 hover:shadow-xs cursor-pointer group/map'
                                                                : 'hover:border-amber-300'
                                                            }`}
                                                        title={mapUrl ? t('গুগল ম্যাপে দেখুন', 'View on Google Maps') : undefined}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                            <div className="w-8 h-8 rounded-lg bg-red-100/80 border border-red-200 flex items-center justify-center text-red-800 shrink-0 group-hover/map:scale-105 group-hover/map:bg-red-200/80 transition-all">
                                                                <MapPin className="w-4 h-4 text-red-700" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                                                                    {t('ঠিকানা ও অবস্থান', 'Address & Location')}
                                                                </p>
                                                                <p className="text-xs sm:text-sm font-bold text-stone-900 leading-snug truncate group-hover/map:text-orange-950 transition-colors">
                                                                    {areaAddress || t('ঠিকানা পরবর্তীতে যুক্ত হবে', 'Address to be announced')}
                                                                </p>
                                                                {mapUrl ? (
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-800 group-hover/map:underline mt-0.5">
                                                                        <Map className="w-3 h-3 text-red-600" />
                                                                        <span>{t('গুগল ম্যাপে লোকেশন দেখুন', 'View on Google Maps')}</span>
                                                                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[11px] text-stone-400 italic">
                                                                        {t('ম্যাপ লিংক যুক্ত নেই', 'No map link')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {mapUrl && (
                                                            <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-red-700 shrink-0 group-hover/map:bg-red-700 group-hover/map:text-white transition-colors">
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>



                                                {/* Box 3: Memoirs / History / Description */}
                                                <div className="bg-amber-50/60 p-2.5 sm:p-3 rounded-xl border border-amber-200/80 shadow-2xs text-xs text-stone-800 leading-relaxed font-sans">
                                                    <div className="flex items-center gap-1.5 font-bold text-orange-900 mb-0.5">
                                                        <BookOpen className="w-3.5 h-3.5 text-orange-800 shrink-0" />
                                                        <span>{t('সম্মেলনের কার্যবিবরণী ও ইতিহাস', 'Memoirs & History')}</span>
                                                    </div>
                                                    <p className="text-stone-700 whitespace-pre-line leading-relaxed text-xs">
                                                        {item.description || (
                                                            <span className="text-stone-400 italic">
                                                                {t('সম্মেলনের বিস্তারিত কার্যবিবরণী এখনো সংরক্ষিত করা হয়নি।', 'Detailed memoirs for this gathering have not been archived yet.')}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>

                                                {/* Admin Edit Link inside details */}
                                                {(isAdmin || isSuperAdmin) && (
                                                    <div className="flex justify-end pt-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setEditingSammelan(item); setIsFormModalOpen(true); }}
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-900 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5 text-orange-700" />
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

            {/* Full-Screen Interactive Lightbox Viewer */}
            <PhotoLightboxModal
                isOpen={lightbox.isOpen}
                photos={lightbox.photos}
                initialIndex={lightbox.index}
                title={lightbox.title}
                onClose={() => setLightbox({ isOpen: false, photos: [], index: 0, title: '' })}
            />
        </div>
    );
};

export default SammelanKotha;
