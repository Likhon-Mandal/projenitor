import React, { useState, useEffect } from 'react';
import { 
    X, ArrowLeft, MapPin, Briefcase, Calendar, Droplet, User, Edit, Trash2, Heart,
    Building, Phone, Globe, GraduationCap, Award, Facebook, Twitter, 
    Instagram, Linkedin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

/* ─── Theme Definitions ─────────────────────────────────────────────────────── */
// relationType: 'son' | 'daughter' | 'spouse' | 'default'
const THEMES = {
    son: {
        // Deep navy blue & steel — strength, heritage
        panel: 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950',
        panelDot: 'white',
        avatarBorder: 'border-blue-300/40',
        avatarBg: 'bg-blue-700/30',
        genBadge: 'bg-white text-blue-900',
        nameSub: 'text-blue-200/90',
        idText: 'text-blue-300',
        divider: 'bg-blue-400/40',
        infoHover: 'hover:bg-blue-50/40 hover:border-blue-200',
        iconBgDefault: 'bg-blue-100 text-blue-700',
        headingColor: 'text-blue-800',
        headingBorder: 'border-blue-100',
        categoryBadge: 'bg-blue-400/20 text-blue-200 border-blue-400/40',
        backBtn: 'hover:bg-blue-50 hover:text-blue-900 border-blue-200',
        backIcon: 'text-blue-700',
        accent: '#1e40af',
        label: 'পুত্র',
        labelEn: 'Son',
        labelIcon: '♂',
    },
    daughter: {
        // Warm rose & burgundy — grace, warmth
        panel: 'bg-gradient-to-br from-rose-700 via-rose-800 to-pink-950',
        panelDot: 'white',
        avatarBorder: 'border-rose-300/40',
        avatarBg: 'bg-rose-700/30',
        genBadge: 'bg-white text-rose-900',
        nameSub: 'text-rose-200/90',
        idText: 'text-rose-300',
        divider: 'bg-rose-400/40',
        infoHover: 'hover:bg-rose-50/40 hover:border-rose-200',
        iconBgDefault: 'bg-rose-100 text-rose-700',
        headingColor: 'text-rose-800',
        headingBorder: 'border-rose-100',
        categoryBadge: 'bg-rose-400/20 text-rose-200 border-rose-400/40',
        backBtn: 'hover:bg-rose-50 hover:text-rose-900 border-rose-200',
        backIcon: 'text-rose-700',
        accent: '#9f1239',
        label: 'কন্যা',
        labelEn: 'Daughter',
        labelIcon: '♀',
    },
    spouse: {
        // Classic saffron & amber — normal project theme
        panel: 'bg-gradient-to-br from-orange-700 via-orange-800 to-red-950',
        panelDot: 'white',
        avatarBorder: 'border-orange-300/40',
        avatarBg: 'bg-orange-700/20',
        genBadge: 'bg-white text-orange-900',
        nameSub: 'text-orange-200/90',
        idText: 'text-orange-300',
        divider: 'bg-orange-400/40',
        infoHover: 'hover:bg-orange-50/40 hover:border-orange-200',
        iconBgDefault: 'bg-orange-100 text-orange-700',
        headingColor: 'text-orange-800',
        headingBorder: 'border-orange-100',
        categoryBadge: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
        backBtn: 'hover:bg-orange-50 hover:text-orange-900 border-orange-200',
        backIcon: 'text-orange-700',
        accent: '#9a3412',
        label: 'সহধর্মিণী',
        labelEn: 'Spouse',
        labelIcon: '❤',
    },
    default: {
        // Classic saffron & amber — brand identity, heritage
        panel: 'bg-gradient-to-br from-orange-700 via-orange-800 to-red-950',
        panelDot: 'white',
        avatarBorder: 'border-orange-300/40',
        avatarBg: 'bg-orange-700/20',
        genBadge: 'bg-white text-orange-900',
        nameSub: 'text-orange-200/90',
        idText: 'text-orange-300',
        divider: 'bg-orange-400/40',
        infoHover: 'hover:bg-orange-50/40 hover:border-orange-200',
        iconBgDefault: 'bg-orange-100 text-orange-700',
        headingColor: 'text-orange-800',
        headingBorder: 'border-orange-100',
        categoryBadge: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
        backBtn: 'hover:bg-orange-50 hover:text-orange-900 border-orange-200',
        backIcon: 'text-orange-700',
        accent: '#9a3412',
        label: '',
        labelEn: '',
        labelIcon: '',
    },
};

/* Resolve theme key from props / member data */
const resolveThemeKey = (relationType, member) => {
    if (relationType === 'son') return 'son';
    if (relationType === 'daughter') return 'daughter';
    if (relationType === 'spouse') return 'spouse';
    if (member?.gender === 'Male') return 'son';
    if (member?.gender === 'Female') return 'daughter';
    return 'default';
};

/* ─── InfoItem ──────────────────────────────────────────────────────────────── */
const InfoItem = ({ icon, label, value, highlight, theme }) => {
    const iconBg = highlight ? 'bg-red-100 text-red-700' : (theme?.iconBgDefault || 'bg-orange-100 text-orange-700');
    return (
        <div className={`flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-100 transition-all duration-200 ${theme?.infoHover || 'hover:bg-orange-50/40 hover:border-orange-200'}`}>
            <div className={`p-2 rounded-xl shrink-0 ${iconBg}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">{label}</p>
                <div className={`text-xs sm:text-sm font-bold break-words ${highlight ? 'text-red-700' : 'text-stone-800'}`}>
                    {value || 'N/A'}
                </div>
            </div>
        </div>
    );
};

/* ─── Main Component ─────────────────────────────────────────────────────────── */
const MemberProfileModal = ({ member: initialMember, isOpen, onClose, onEdit, onDelete, onAddSpouse, relationType: initialRelationType, showActions = true }) => {
    const { isAdmin } = useAuth();
    const { t, isBn, formatOccupation, formatName } = useLanguage();
    const [member, setMember] = useState(initialMember);
    const [loading, setLoading] = useState(false);
    // history stores { member, relationType } tuples
    const [history, setHistory] = useState([]);
    // current active relationType (may change when navigating to spouse/parent)
    const [activeRelationType, setActiveRelationType] = useState(initialRelationType || null);
    // Overlaid small profile card state for husband / spouse / father / mother
    const [activeOverlayMember, setActiveOverlayMember] = useState(null);
    const [overlayData, setOverlayData] = useState(null);
    const [loadingOverlay, setLoadingOverlay] = useState(false);

    useEffect(() => {
        if (initialMember) {
            setMember(initialMember);
        }
        if (isOpen && initialMember?.id) {
            fetchFullDetails(initialMember.id);
        }
        setHistory([]);
        setActiveRelationType(initialRelationType || null);
        setActiveOverlayMember(null);
        setOverlayData(null);
        setLoadingOverlay(false);
    }, [isOpen, initialMember, initialRelationType]);

    // Handle Escape key to dismiss overlay or close modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (activeOverlayMember) {
                    setActiveOverlayMember(null);
                    setOverlayData(null);
                } else if (isOpen && onClose) {
                    onClose();
                }
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeOverlayMember, onClose]);

    const fetchFullDetails = async (id) => {
        try {
            setLoading(true);
            const res = await api.get(`/members/${id}`);
            if (res.data) {
                setMember(res.data);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching member details:', err);
            setLoading(false);
        }
    };

    const handleOpenOverlayMember = async (target, role = null) => {
        if (!target?.id) return;
        const targetWithRole = { ...target, overlayRole: role };
        setActiveOverlayMember(targetWithRole);
        setOverlayData(targetWithRole);
        try {
            setLoadingOverlay(true);
            const res = await api.get(`/members/${target.id}`);
            if (res.data) {
                setOverlayData({ ...res.data, overlayRole: role });
            }
        } catch (err) {
            console.error('Error fetching overlay member details:', err);
        } finally {
            setLoadingOverlay(false);
        }
    };

    const handleNavigateToMember = (targetMember, nextRelationType = null) => {
        if (!targetMember?.id) return;
        setHistory(prev => [...prev, { member, relationType: activeRelationType }]);
        setActiveRelationType(nextRelationType);
        fetchFullDetails(targetMember.id);
    };

    const handleBack = () => {
        if (history.length === 0) return;
        const prevEntry = history[history.length - 1];
        setHistory(h => h.slice(0, -1));
        setActiveRelationType(prevEntry.relationType || null);
        if (prevEntry.member?.id) {
            fetchFullDetails(prevEntry.member.id);
        } else {
            setMember(prevEntry.member);
        }
    };

    if (!isOpen || !member) return null;

    const themeKey = resolveThemeKey(activeRelationType, member);
    const theme = THEMES[themeKey];

    const displayName = formatName(member);
    const isFemale = member.gender === 'Female';

    // Data for overlay small card
    const overlayTarget = overlayData || activeOverlayMember;
    const overlayRole = overlayTarget?.overlayRole;
    const overlayIsMale = overlayTarget ? (
        overlayRole === 'father' ? true :
        overlayRole === 'mother' ? false :
        overlayRole === 'husband' ? true :
        overlayRole === 'wife' ? false :
        overlayRole === 'spouse' ? (overlayTarget.gender === 'Male') :
        (overlayTarget.gender === 'Male' || (!overlayTarget.gender && isFemale))
    ) : true;
    const overlayDisplayName = formatName(overlayTarget);

    const getOverlayTheme = () => {
        if (overlayRole === 'father') {
            return {
                label: isBn ? 'পিতা' : 'Father',
                badgeCls: 'bg-blue-100/90 border-blue-200 text-blue-800',
                dotCls: 'bg-blue-600',
                cardTheme: 'bg-gradient-to-b from-[#f0f7ff] via-white to-[#f8fafc] border-blue-200',
                glowTop: 'bg-blue-400/20',
                glowBottom: 'bg-sky-300/20',
                avatarRing: 'bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-500 shadow-blue-500/15',
                avatarBg: 'bg-blue-50 text-blue-600',
                textAccent: 'text-blue-600',
                textLink: 'text-blue-700 hover:text-blue-900',
                borderItem: 'border-blue-100',
                genBadge: 'bg-blue-700',
                closeBtnHover: 'hover:text-blue-800 hover:bg-blue-100/70',
                footerBtn: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
            };
        }
        if (overlayRole === 'mother') {
            return {
                label: isBn ? 'মাতা' : 'Mother',
                badgeCls: 'bg-rose-100/90 border-rose-200 text-rose-800',
                dotCls: 'bg-rose-500',
                cardTheme: 'bg-gradient-to-b from-[#fff5f6] via-white to-[#fff0f3] border-rose-200',
                glowTop: 'bg-rose-400/20',
                glowBottom: 'bg-pink-300/20',
                avatarRing: 'bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-200 shadow-rose-500/15',
                avatarBg: 'bg-rose-50 text-rose-500',
                textAccent: 'text-rose-500',
                textLink: 'text-rose-700 hover:text-rose-900',
                borderItem: 'border-rose-100',
                genBadge: 'bg-rose-600',
                closeBtnHover: 'hover:text-rose-800 hover:bg-rose-100/70',
                footerBtn: 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
            };
        }
        if (overlayRole === 'husband' || overlayIsMale) {
            return {
                label: isBn ? 'স্বামী' : 'Husband',
                badgeCls: 'bg-sky-100/90 border-sky-200 text-sky-800',
                dotCls: 'bg-sky-600',
                cardTheme: 'bg-gradient-to-b from-[#f0f9ff] via-white to-[#f8fafc] border-sky-200',
                glowTop: 'bg-sky-300/20',
                glowBottom: 'bg-blue-200/20',
                avatarRing: 'bg-gradient-to-tr from-sky-500 via-blue-400 to-indigo-500 shadow-sky-500/15',
                avatarBg: 'bg-sky-50 text-sky-500',
                textAccent: 'text-sky-600',
                textLink: 'text-sky-700 hover:text-sky-900',
                borderItem: 'border-sky-100',
                genBadge: 'bg-sky-700',
                closeBtnHover: 'hover:text-sky-800 hover:bg-sky-100/70',
                footerBtn: 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200'
            };
        }
        return {
            label: isBn ? 'সহধর্মিণী' : 'Spouse',
            badgeCls: 'bg-pink-100/80 border-pink-200 text-rose-700',
            dotCls: 'bg-rose-500',
            cardTheme: 'bg-gradient-to-b from-[#fff6f7] via-white to-[#fff0f3] border-pink-200',
            glowTop: 'bg-pink-300/25',
            glowBottom: 'bg-rose-200/25',
            avatarRing: 'bg-gradient-to-tr from-pink-400 via-rose-300 to-amber-200 shadow-pink-500/15',
            avatarBg: 'bg-rose-50 text-rose-400',
            textAccent: 'text-rose-400',
            textLink: 'text-rose-700 hover:text-rose-900',
            borderItem: 'border-pink-100',
            genBadge: 'bg-rose-500',
            closeBtnHover: 'hover:text-rose-600 hover:bg-rose-100/70',
            footerBtn: 'bg-pink-50 hover:bg-pink-100 text-rose-800 border-pink-200'
        };
    };
    const overlayTheme = getOverlayTheme();

    return (
        <div 
            className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-md transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 relative max-h-[92vh] md:h-[640px] flex flex-col md:flex-row border border-stone-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Main Card Content (Blurred when activeOverlayMember is open) */}
                <div className={`w-full h-full flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden transition-all duration-300 ${activeOverlayMember ? 'filter blur-[6px] opacity-30 pointer-events-none select-none scale-[0.98]' : ''}`}>
                    {/* Back button */}
                    {history.length > 0 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className={`absolute top-4 sm:top-6 left-4 sm:left-6 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 text-stone-700 text-xs font-bold transition-all active:scale-95 shadow-md border cursor-pointer backdrop-blur-sm ${theme.backBtn}`}
                            title={t('পূর্ববর্তী প্রোফাইলে ফিরুন', 'Go back to previous profile')}
                        >
                            <ArrowLeft size={14} className={theme.backIcon} />
                            <span>{t('পূর্ববর্তী প্রোফাইল', 'Back')}</span>
                        </button>
                    )}

                {/* ── Left Panel ───────────────────────────────────────── */}
                <div className={`md:w-[38%] ${theme.panel} p-6 sm:p-8 text-white flex flex-col items-center justify-center relative overflow-hidden shrink-0`}>
                    {/* Dot pattern overlay */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                    {/* Role badge */}
                    {(themeKey !== 'default') && (
                        <div className={`mb-3 z-20 flex items-center gap-1.5 border rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] shadow-xl whitespace-nowrap ${theme.categoryBadge}`}>
                            <span className="text-[11px]">{theme.labelIcon}</span>
                            {isBn ? theme.label : theme.labelEn}
                        </div>
                    )}

                    {/* Eminent / Category badge */}
                    {(member.eminent_category || member.category) && (
                        <div className={`mb-3 z-20 flex items-center gap-1.5 border rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[0.15em] shadow-xl whitespace-nowrap ${theme.categoryBadge}`}>
                            <Award size={10} />
                            {member.eminent_category || member.category}
                        </div>
                    )}

                    {/* Avatar */}
                    <div className="relative mb-4 sm:mb-6 flex flex-col items-center">
                        <div className="relative">
                            <div className={`w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full border-4 p-1.5 shadow-2xl relative z-10 mx-auto ${theme.avatarBorder}`}>
                                <div className={`w-full h-full rounded-full overflow-hidden ${theme.avatarBg} backdrop-blur-md flex items-center justify-center`}>
                                    {loading ? (
                                        <div className="w-8 h-8 border-3 border-white/50 border-t-white rounded-full animate-spin" />
                                    ) : member.profile_image_url ? (
                                        <img src={member.profile_image_url} alt={displayName} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={68} className="sm:size-24 text-white/40" />
                                    )}
                                </div>
                            </div>
                            {(member.level || member.generation_level) && (
                                <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[9px] sm:text-[11px] font-black px-3 sm:px-3.5 py-1 rounded-full shadow-lg uppercase tracking-tighter z-20 whitespace-nowrap ${theme.genBadge}`}>
                                    Gen {member.level || member.generation_level}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name & ID */}
                    <div className="text-center relative z-10">
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-2 text-white leading-tight">
                            {displayName}
                        </h2>
                        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
                            <div className={`h-px w-4 sm:w-6 ${theme.divider}`} />
                            <p className={`text-[8px] sm:text-[9px] uppercase tracking-[0.2em] ${theme.idText}`}>
                                ID: {String(member.id).slice(0, 8)}
                            </p>
                            <div className={`h-px w-4 sm:w-6 ${theme.divider}`} />
                        </div>
                        {member.alive === false && (
                            <span className="inline-block text-[10px] font-semibold text-stone-200 bg-stone-900/60 border border-white/20 px-2.5 py-0.5 rounded-full">
                                {t('স্বর্গীয়', 'Deceased')}
                            </span>
                        )}
                    </div>

                    {/* Admin Buttons */}
                    {showActions && isAdmin && (onEdit || onDelete) && (
                        <div className="flex items-center gap-2 mt-4 relative z-10">
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={() => { onClose(); onEdit(member); }}
                                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all active:scale-95 shadow-xs cursor-pointer"
                                    title={t('প্রোফাইল সম্পাদনা', 'Edit Profile')}
                                >
                                    <Edit size={15} />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={() => { onClose(); onDelete(member); }}
                                    className="p-2 bg-red-600/30 hover:bg-red-600/50 text-red-200 rounded-full transition-all active:scale-95 shadow-xs cursor-pointer border border-red-400/30"
                                    title={t('সদস্য মুছুন', 'Delete Member')}
                                >
                                    <Trash2 size={15} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Right Panel ──────────────────────────────────────── */}
                <div className="md:w-[62%] p-5 sm:p-8 bg-white relative flex flex-col min-h-0 overflow-hidden">
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-all z-10 cursor-pointer"
                        title="Close"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-3.5 sm:gap-y-4 mt-2 sm:mt-4 overflow-y-auto pr-2 custom-scrollbar">
                        {/* ── Column 1: Personal Info ── */}
                        <div className="space-y-4">
                            <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] border-b pb-2 mb-4 ${theme.headingColor} ${theme.headingBorder}`}>
                                {t('ব্যক্তিগত তথ্য', 'Personal Info')}
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                <InfoItem 
                                    theme={theme}
                                    icon={<Calendar size={14} />} 
                                    label={t('জন্ম তারিখ', 'Birth Date')} 
                                    value={
                                        <React.Fragment>
                                            {member.birth_date ? new Date(member.birth_date).toLocaleDateString() : t('অজানা', 'Unknown')}
                                            {member.alive === false && member.death_date && (
                                                <span className="text-stone-400 font-normal"> — {new Date(member.death_date).toLocaleDateString()}</span>
                                            )}
                                        </React.Fragment>
                                    } 
                                />
                                <InfoItem theme={theme} icon={<Briefcase size={14} />} label={t('পেশা', 'Occupation')} value={formatOccupation(member.occupation)} />
                                <InfoItem theme={theme} icon={<Building size={14} />} label={t('কর্মস্থল', 'Workplace')} value={member.workplace} />
                                <InfoItem theme={theme} icon={<GraduationCap size={14} />} label={t('শিক্ষাগত যোগ্যতা', 'Educational Background')} value={member.education} />
                                <InfoItem theme={theme} icon={<Droplet size={14} />} label={t('রক্তের গ্রুপ', 'Blood Group')} value={member.blood_group} highlight />
                                <InfoItem theme={theme} icon={<MapPin size={14} />} label={t('আদি গ্রাম', 'Ancestral Village')} value={member.village || member.location || member.ancestral_village} />
                                <InfoItem theme={theme} icon={<MapPin size={14} />} label={t('বর্তমান ঠিকানা', 'Current Location')} value={member.present_address} />
                            </div>
                        </div>

                        {/* ── Column 2: Contact & Family ── */}
                        <div className="space-y-4">
                            <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] border-b pb-2 mb-4 ${theme.headingColor} ${theme.headingBorder}`}>
                                {t('যোগাযোগ ও পরিবার', 'Contact & Family')}
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                <InfoItem 
                                    theme={theme}
                                    icon={<Phone size={14} />} 
                                    label={t('যোগাযোগ নম্বর', 'Contact Number')} 
                                    value={
                                        member.contact_number ? (
                                            <a href={`tel:${member.contact_number}`} className="text-orange-900 hover:underline font-bold">
                                                {member.contact_number}
                                            </a>
                                        ) : 'N/A'
                                    } 
                                />
                                {member.social_media && member.social_media.trim() ? (
                                    <InfoItem
                                        theme={theme}
                                        icon={
                                            member.social_media.toLowerCase().includes('facebook') ? <Facebook size={14} /> :
                                            member.social_media.toLowerCase().includes('instagram') ? <Instagram size={14} /> :
                                            member.social_media.toLowerCase().includes('twitter') || member.social_media.toLowerCase().includes('x.com') ? <Twitter size={14} /> :
                                            member.social_media.toLowerCase().includes('linkedin') ? <Linkedin size={14} /> :
                                            <Globe size={14} />
                                        }
                                        label={t('সামাজিক যোগাযোগ', 'Social Media')}
                                        value={
                                            <a 
                                                href={member.social_media.startsWith('http') ? member.social_media : `https://${member.social_media}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {t('প্রোফাইল দেখুন', 'Visit Profile')}
                                            </a>
                                        }
                                    />
                                ) : (
                                    <InfoItem theme={theme} icon={<Globe size={14} />} label={t('সামাজিক যোগাযোগ', 'Social Media')} value="N/A" />
                                )}

                                {/* Spouse / Husband */}
                                <InfoItem
                                    theme={theme}
                                    icon={<Heart size={14} className={isFemale ? "text-orange-700 fill-orange-700" : "text-rose-600 fill-rose-600"} />}
                                    label={isFemale ? t('স্বামী', 'Husband') : t('সহধর্মিণী', 'Spouse')}
                                    value={
                                        ((member.spouses && member.spouses.length > 0) ? member.spouses : (member.partners || [])).filter((s, i, a) => a.findIndex(t => String(t.id) === String(s.id)) === i).length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {((member.spouses && member.spouses.length > 0) ? member.spouses : (member.partners || [])).filter((s, i, a) => a.findIndex(t => String(t.id) === String(s.id)) === i).map(s => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenOverlayMember(s, isFemale ? 'husband' : 'spouse');
                                                        }}
                                                        className={`font-bold hover:underline px-2.5 py-1 rounded-xl text-xs transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer ${
                                                            isFemale
                                                                ? 'text-orange-950 bg-orange-50 hover:bg-orange-100 border border-orange-200'
                                                                : 'text-stone-800 bg-stone-50 hover:bg-orange-50 border border-stone-200'
                                                        }`}
                                                        title={isFemale ? t('স্বামীর সংক্ষিপ্ত পরিচিতি দেখুন', 'View Husband Card') : t('সহধর্মিণীর সংক্ষিপ্ত পরিচিতি দেখুন', 'View Spouse Card')}
                                                    >
                                                        <div className="w-4 h-4 rounded-full overflow-hidden bg-white shrink-0 ring-1 ring-orange-200">
                                                            {s.profile_image_url ? (
                                                                <img src={s.profile_image_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User size={10} className="m-auto opacity-40 text-stone-600" />
                                                            )}
                                                        </div>
                                                        <span>{formatName(s)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : "N/A"
                                    }
                                />

                                {/* Parents */}
                                <InfoItem
                                    theme={theme}
                                    icon={<User size={14} />}
                                    label={t('পিতা-মাতা', 'Parents')}
                                    value={
                                        <div className="flex flex-col gap-1.5 mt-0.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded font-black shrink-0">{isBn ? 'পিতা' : 'F'}</span>
                                                {member.father_id ? (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenOverlayMember({
                                                                id: member.father_id,
                                                                full_name: member.father_name,
                                                                name_bangla: member.father_name_bangla,
                                                                gender: 'Male'
                                                            }, 'father');
                                                        }}
                                                        className="truncate font-medium text-stone-700 hover:text-blue-800 hover:underline text-left cursor-pointer"
                                                        title={t('পিতার পরিচিতি কার্ড দেখুন', 'View Father Card')}
                                                    >
                                                        {formatName({ full_name: member.father_name, name_bangla: member.father_name_bangla }) || t('অজানা', 'Unknown')}
                                                    </button>
                                                ) : (
                                                    <span className="truncate text-stone-700">
                                                        {formatName({ full_name: member.father_name, name_bangla: member.father_name_bangla }) || t('অজানা', 'Unknown')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-[8px] bg-rose-100 text-rose-700 px-1 rounded font-black shrink-0">{isBn ? 'মাতা' : 'M'}</span>
                                                {member.mother_id ? (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenOverlayMember({
                                                                id: member.mother_id,
                                                                full_name: member.mother_name,
                                                                name_bangla: member.mother_name_bangla,
                                                                gender: 'Female'
                                                            }, 'mother');
                                                        }}
                                                        className="truncate font-medium text-stone-700 hover:text-rose-800 hover:underline text-left cursor-pointer"
                                                        title={t('মাতার পরিচিতি কার্ড দেখুন', 'View Mother Card')}
                                                    >
                                                        {formatName({ full_name: member.mother_name, name_bangla: member.mother_name_bangla }) || t('অজানা', 'Unknown')}
                                                    </button>
                                                ) : (
                                                    <span className="truncate text-stone-700">
                                                        {formatName({ full_name: member.mother_name, name_bangla: member.mother_name_bangla }) || t('অজানা', 'Unknown')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    }
                                />
                            </div>

                            {member.bio && (
                                <div className="text-xs text-stone-600 leading-relaxed italic border-t border-stone-100 pt-3">
                                    "{member.bio}"
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

                {/* Overlaid Small Husband/Spouse Profile Card */}
                {activeOverlayMember && (
                    <div
                        className="fixed inset-0 z-[160] bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveOverlayMember(null);
                            setOverlayData(null);
                        }}
                    >
                        <div
                            className={`w-full max-w-sm sm:max-w-md ${overlayTheme.cardTheme} rounded-3xl shadow-2xl border-2 p-4 sm:p-6 relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto custom-scrollbar`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative background glow */}
                            <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl pointer-events-none ${overlayTheme.glowTop}`}></div>
                            <div className={`absolute -bottom-12 -left-12 w-36 h-36 rounded-full blur-2xl pointer-events-none ${overlayTheme.glowBottom}`}></div>

                            {/* Close Button (Cross on top) */}
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveOverlayMember(null);
                                    setOverlayData(null);
                                }}
                                className={`absolute top-3.5 right-3.5 z-20 p-2 text-stone-400 rounded-full transition-all active:scale-90 cursor-pointer shadow-2xs ${overlayTheme.closeBtnHover}`}
                                title={t('বন্ধ করুন', 'Close')}
                            >
                                <X size={16} />
                            </button>

                            {/* Header Info */}
                            <div className="flex items-center gap-3.5 mb-4 relative z-10">
                                <div className="relative shrink-0">
                                    <div className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full p-1 shadow-md ${overlayTheme.avatarRing}`}>
                                        <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center ${overlayTheme.avatarBg}`}>
                                            {loadingOverlay && !overlayData ? (
                                                <div className="w-5 h-5 border-2 border-stone-400 border-t-stone-700 rounded-full animate-spin" />
                                            ) : overlayTarget?.profile_image_url ? (
                                                <img
                                                    src={overlayTarget.profile_image_url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center ${overlayTheme.avatarBg}`}>
                                                    <User size={30} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {overlayTarget?.level && (
                                        <div className={`absolute -bottom-1 -right-1 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md border-2 border-white ${overlayTheme.genBadge}`}>
                                            G{overlayTarget.level}
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1 pr-6">
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide mb-1 border ${overlayTheme.badgeCls}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${overlayTheme.dotCls}`}></span>
                                        <span>{overlayTheme.label}</span>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 leading-tight truncate">
                                        {overlayDisplayName}
                                    </h3>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="space-y-2.5 relative z-10">
                                {/* Profession & Workplace */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className={`bg-white/90 p-2.5 rounded-2xl border shadow-2xs ${overlayTheme.borderItem}`}>
                                        <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 mb-0.5 ${overlayTheme.textAccent}`}>
                                            <Briefcase size={11} /> {t('পেশা', 'Occupation')}
                                        </span>
                                        <p className="font-bold text-stone-800 truncate" title={overlayTarget?.occupation || 'N/A'}>
                                            {loadingOverlay && !overlayData ? (isBn ? 'লোড হচ্ছে...' : 'Loading...') : (overlayTarget?.occupation ? formatOccupation(overlayTarget.occupation) : 'N/A')}
                                        </p>
                                    </div>

                                    <div className={`bg-white/90 p-2.5 rounded-2xl border shadow-2xs ${overlayTheme.borderItem}`}>
                                        <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 mb-0.5 ${overlayTheme.textAccent}`}>
                                            <Building size={11} /> {t('কর্মস্থল', 'Workplace')}
                                        </span>
                                        <p className="font-bold text-stone-800 truncate" title={overlayTarget?.workplace || 'N/A'}>
                                            {loadingOverlay && !overlayData ? (isBn ? 'লোড হচ্ছে...' : 'Loading...') : (overlayTarget?.workplace || 'N/A')}
                                        </p>
                                    </div>
                                </div>

                                {/* Contact & Social Media */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className={`bg-white/90 p-2.5 rounded-2xl border shadow-2xs ${overlayTheme.borderItem}`}>
                                        <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 mb-0.5 ${overlayTheme.textAccent}`}>
                                            <Phone size={11} /> {t('যোগাযোগ', 'Contact')}
                                        </span>
                                        {overlayTarget?.contact_number ? (
                                            <a href={`tel:${overlayTarget.contact_number}`} className={`font-bold hover:underline truncate block ${overlayTheme.textLink}`}>
                                                {overlayTarget.contact_number}
                                            </a>
                                        ) : (
                                            <p className="text-stone-400 font-medium">N/A</p>
                                        )}
                                    </div>

                                    <div className={`bg-white/90 p-2.5 rounded-2xl border shadow-2xs ${overlayTheme.borderItem}`}>
                                        <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 mb-0.5 ${overlayTheme.textAccent}`}>
                                            <Globe size={11} /> {t('সামাজিক যোগাযোগ', 'Social Media')}
                                        </span>
                                        {overlayTarget?.social_media ? (
                                            <a
                                                href={overlayTarget.social_media.startsWith('http') ? overlayTarget.social_media : `https://${overlayTarget.social_media}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`font-bold hover:underline truncate block ${overlayTheme.textLink}`}
                                            >
                                                {t('প্রোফাইল দেখুন', 'Visit Profile')}
                                            </a>
                                        ) : (
                                            <p className="text-stone-400 font-medium">N/A</p>
                                        )}
                                    </div>
                                </div>

                                {/* Blood, Education, Birth Date */}
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className={`bg-white/90 p-2 rounded-2xl border shadow-2xs text-center ${overlayTheme.borderItem}`}>
                                        <span className={`text-[9px] uppercase font-bold tracking-wider block mb-0.5 ${overlayTheme.textAccent}`}>
                                            {t('রক্তের গ্রুপ', 'Blood')}
                                        </span>
                                        <span className="font-extrabold text-red-600 text-xs">
                                            {overlayTarget?.blood_group || 'N/A'}
                                        </span>
                                    </div>

                                    <div className={`bg-white/90 p-2 rounded-2xl border shadow-2xs text-center ${overlayTheme.borderItem}`}>
                                        <span className={`text-[9px] uppercase font-bold tracking-wider block mb-0.5 ${overlayTheme.textAccent}`}>
                                            {t('শিক্ষাগত যোগ্যতা', 'Education')}
                                        </span>
                                        <span className="font-bold text-stone-800 text-[11px] truncate block" title={overlayTarget?.education || 'N/A'}>
                                            {overlayTarget?.education || 'N/A'}
                                        </span>
                                    </div>

                                    <div className={`bg-white/90 p-2 rounded-2xl border shadow-2xs text-center ${overlayTheme.borderItem}`}>
                                        <span className={`text-[9px] uppercase font-bold tracking-wider block mb-0.5 ${overlayTheme.textAccent}`}>
                                            {t('জন্ম তারিখ', 'Birth Date')}
                                        </span>
                                        <span className="font-bold text-stone-700 text-[10px] truncate block">
                                            {overlayTarget?.birth_date ? new Date(overlayTarget.birth_date).toLocaleDateString() : t('অজানা', 'Unknown')}
                                        </span>
                                    </div>
                                </div>

                                {/* Location / Village */}
                                {(overlayTarget?.present_address || overlayTarget?.village || overlayTarget?.location) && (
                                    <div className={`bg-white/90 p-2.5 rounded-2xl border shadow-2xs text-xs flex items-center gap-2 text-stone-700 ${overlayTheme.borderItem}`}>
                                        <MapPin size={12} className={`shrink-0 ${overlayTheme.textAccent}`} />
                                        <span className="truncate">
                                            {overlayTarget?.present_address || overlayTarget?.village || overlayTarget?.location}
                                        </span>
                                    </div>
                                )}

                                {/* Parents */}
                                {(overlayTarget?.father_name || overlayTarget?.mother_name) && (
                                    <div className={`bg-white/90 p-2.5 rounded-2xl border shadow-2xs text-xs ${overlayTheme.borderItem}`}>
                                        <span className={`text-[9px] uppercase font-bold tracking-wider block mb-1 ${overlayTheme.textAccent}`}>
                                            {t('পিতা-মাতা', 'Parents')}
                                        </span>
                                        <div className="flex flex-col gap-1 text-[11px] text-stone-700">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded font-bold">{isBn ? 'পিতা' : 'F'}</span>
                                                <span className="truncate font-medium">
                                                    {formatName({ full_name: overlayTarget.father_name, name_bangla: overlayTarget.father_name_bangla }) || t('অজানা', 'Unknown')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] bg-rose-100 text-rose-700 px-1 rounded font-bold">{isBn ? 'মাতা' : 'M'}</span>
                                                <span className="truncate font-medium">
                                                    {formatName({ full_name: overlayTarget.mother_name, name_bangla: overlayTarget.mother_name_bangla }) || t('অজানা', 'Unknown')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Spouse Section - CRITICAL: NOT A LINK */}
                                <div className={`bg-white/90 p-2.5 rounded-2xl border shadow-2xs text-xs ${overlayTheme.borderItem}`}>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 mb-1.5 ${overlayTheme.textAccent}`}>
                                        <Heart size={11} className={overlayIsMale ? 'text-rose-500 fill-rose-500' : 'text-sky-600 fill-sky-600'} />
                                        {overlayIsMale ? t('সহধর্মিণী', 'Wife') : t('স্বামী', 'Husband')}
                                    </span>
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        {(() => {
                                            let spousesList = [];
                                            if (overlayTarget?.spouses && overlayTarget.spouses.length > 0) {
                                                spousesList = overlayTarget.spouses;
                                            } else if (overlayRole === 'father' && (member.mother_name || member.mother_name_bangla)) {
                                                spousesList = [{
                                                    id: 'father-spouse-mother',
                                                    full_name: member.mother_name,
                                                    name_bangla: member.mother_name_bangla,
                                                    gender: 'Female'
                                                }];
                                            } else if (overlayRole === 'mother' && (member.father_name || member.father_name_bangla)) {
                                                spousesList = [{
                                                    id: 'mother-spouse-father',
                                                    full_name: member.father_name,
                                                    name_bangla: member.father_name_bangla,
                                                    gender: 'Male'
                                                }];
                                            } else if (overlayRole === 'husband' || overlayRole === 'spouse') {
                                                spousesList = [member];
                                            } else if (overlayTarget?.spouse_name) {
                                                spousesList = [{
                                                    id: 'spouse-name',
                                                    full_name: overlayTarget.spouse_name,
                                                    name_bangla: overlayTarget.spouse_name_bangla,
                                                    gender: overlayIsMale ? 'Female' : 'Male'
                                                }];
                                            }

                                            if (spousesList.length === 0) {
                                                return <p className="text-stone-400 font-medium text-xs">N/A</p>;
                                            }

                                            const uniqueSpouses = spousesList.filter((s, i, a) => a.findIndex(t => String(t.id || t.full_name) === String(s.id || s.full_name)) === i);
                                            return uniqueSpouses.map(s => {
                                                const sIsFemale = s.gender === 'Female' || (!s.gender && overlayIsMale);
                                                return (
                                                    <div
                                                        key={s.id || s.full_name || 'current-spouse'}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border select-none cursor-default ${
                                                            sIsFemale
                                                                ? 'bg-rose-50 border-rose-200/80 text-rose-900'
                                                                : 'bg-sky-50 border-sky-200/80 text-sky-900'
                                                        }`}
                                                    >
                                                        <div className="w-4 h-4 rounded-full overflow-hidden bg-white shrink-0 ring-1 ring-stone-200">
                                                            {s.profile_image_url ? (
                                                                <img src={s.profile_image_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User size={9} className="m-auto opacity-40 text-stone-600" />
                                                            )}
                                                        </div>
                                                        <span>{formatName(s)}</span>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Close Button */}
                            <div className={`flex items-center justify-end pt-3 mt-3 border-t relative z-10 ${overlayTheme.borderItem}`}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveOverlayMember(null);
                                        setOverlayData(null);
                                    }}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-xl transition active:scale-95 flex items-center gap-1 border cursor-pointer shadow-2xs ${overlayTheme.footerBtn}`}
                                >
                                    <X size={13} />
                                    <span>{t('বন্ধ করুন', 'Close')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberProfileModal;
