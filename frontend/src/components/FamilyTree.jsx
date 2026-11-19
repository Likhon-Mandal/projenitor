import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { User, Plus, X, GraduationCap, Briefcase, MapPin, Droplet, Calendar, Phone, Mail, Award, Landmark, Edit2, Edit, Trash2, Building, Link, Facebook, Twitter, Instagram, Linkedin, Globe, Heart, Sparkles, ZoomIn, Flower2, ChevronRight, Users, GitBranch } from 'lucide-react';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useImageViewer } from '../context/ImageViewerContext';
import { getMemberIdentity, MEMBER_THEMES } from '../utils/memberIdentity';
import VerifiedBadge from './VerifiedBadge';

/* ANIMATION STYLES */
const AnimationStyles = () => (
    <style>{`
        @keyframes drawVertical {
            from { transform: scaleY(0); opacity: 0; }
            to { transform: scaleY(1); opacity: 1; }
        }
        @keyframes expandWidth {
            from { transform: scaleX(0); opacity: 0; }
            to { transform: scaleX(1); opacity: 1; }
        }
        @keyframes unfoldNode {
            from { opacity: 0; transform: translateY(-20px) scale(0.9); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseGlow {
            0% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(234, 88, 12, 0); }
            100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0); }
        }
        @keyframes fadeInModal {
            from { opacity: 0; transform: scale(0.98) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-draw-v { animation: drawVertical 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .animate-expand-w { animation: expandWidth 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards; }
        .animate-unfold { animation: unfoldNode 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-modal { animation: fadeInModal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        /* Hide Horizontal Scrollbar but keep functionality */
        .gen-row-scroll {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
        .gen-row-scroll::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
        }
    `}</style>
);

/* Helper Component for Modal Info Items */
const InfoItem = ({ icon, label, value, highlight, color = 'orange' }) => {
    const colorClasses = {
        orange: 'bg-orange-100 text-orange-600',
        red: 'bg-red-100 text-red-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        pink: 'bg-pink-100 text-pink-600',
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        stone: 'bg-stone-100 text-stone-600'
    };
    const activeColor = highlight ? colorClasses.red : (colorClasses[color] || colorClasses.orange);

    return (
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-100 hover:bg-white hover:shadow-sm transition-all duration-300">
            <div className={`p-2 rounded-xl shrink-0 ${activeColor}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">{label}</p>
                <div className={`text-sm font-bold break-words ${highlight ? 'text-red-700' : 'text-stone-700'}`}>
                    {value || 'N/A'}
                </div>
            </div>
        </div>
    );
};

/* DETAILS MODAL COMPONENT */
const PersonDetailsModal = ({ person: initialPerson, onClose, onEditNode, onDeleteNode, onViewDetails, memberMap, isAdmin: propIsAdmin }) => {
    const { t, isBn, formatOccupation, formatName } = useLanguage();
    const { isAdmin: authIsAdmin } = useAuth();
    const { openImage } = useImageViewer();
    const isAdmin = propIsAdmin !== undefined ? propIsAdmin : authIsAdmin;
    const [person, setPerson] = useState(initialPerson);
    const [activeSpouse, setActiveSpouse] = useState(null);
    const [spouseData, setSpouseData] = useState(null);
    const [loadingSpouse, setLoadingSpouse] = useState(false);

    useEffect(() => {
        setPerson(initialPerson);
        setActiveSpouse(null);
        setSpouseData(null);
        if (initialPerson?.id) {
            api.get(`/members/${initialPerson.id}`)
                .then(res => {
                    if (res.data) setPerson(res.data);
                })
                .catch(err => console.error('Error fetching member details in modal:', err));
        }
    }, [initialPerson]);

    if (!person) return null;

    // Identity-based theming for son/daughter only (spouse card unchanged)
    const _identity = getMemberIdentity(person);
    const _useTheme = _identity === 'son' || _identity === 'daughter';
    const _theme = MEMBER_THEMES[_useTheme ? _identity : 'default'];

    // Header gradient classes per identity
    const headerGradient = _identity === 'son'
        ? 'bg-gradient-to-br from-sky-700 via-blue-700 to-indigo-900'
        : _identity === 'daughter'
            ? 'bg-gradient-to-br from-rose-700 via-pink-700 to-rose-900'
            : 'bg-gradient-to-br from-orange-700 to-orange-900';

    // Gen badge text color
    const genBadgeText = _identity === 'son'
        ? 'text-sky-900'
        : _identity === 'daughter'
            ? 'text-rose-900'
            : 'text-orange-900';

    const handleOpenSpouse = async (s) => {
        if (!s) return;
        setActiveSpouse(s);
        const cached = memberMap && memberMap[String(s.id)];
        setSpouseData(cached || s);

        try {
            setLoadingSpouse(true);
            const res = await api.get(`/members/${s.id}`);
            if (res.data) {
                setSpouseData(res.data);
            }
        } catch (err) {
            console.error('Error fetching spouse details:', err);
        } finally {
            setLoadingSpouse(false);
        }
    };

    return (
        <React.Fragment>
            <div className="fixed inset-0 app-sheet z-[100] flex items-center justify-center p-4 sm:p-6 bg-stone-950/80 backdrop-blur-md" onClick={onClose}>
                <div
                    className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-modal relative max-h-[90vh] md:h-[620px] flex flex-col md:flex-row"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Mobile Close Button: placed at top-right of modal for mobile screens only */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="md:hidden absolute top-3.5 right-3.5 z-30 p-2 text-white/90 hover:text-white bg-black/25 hover:bg-black/40 active:scale-95 rounded-full transition-all backdrop-blur-md border border-white/20 shadow-md cursor-pointer"
                        title={t('বন্ধ করুন', 'Close')}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>

                    {/* Main Card Content (Blurred when activeSpouse is open) */}
                    <div className={`w-full h-full flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden transition-all duration-300 ${activeSpouse ? 'filter blur-[6px] opacity-30 pointer-events-none select-none scale-[0.98]' : ''}`}>
                <div className={`md:w-1/3 ${headerGradient} p-5 pt-8 sm:p-8 text-white flex flex-col items-center justify-center relative overflow-hidden shrink-0`}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                    
                    {/* Identity & Eminent badges: on mobile sit side-by-side with gap to prevent overlap; on desktop preserved exactly */}
                    {(_useTheme || person.eminent_category) && (
                        <div className="flex md:contents flex-wrap items-center justify-center gap-2 mb-3 px-12 md:px-0 z-20">
                            {_useTheme && (
                                <div className="md:absolute md:top-3 md:left-1/2 md:-translate-x-1/2 z-20 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 text-white/90 text-[8px] font-bold uppercase tracking-widest whitespace-nowrap">
                                    <span>{_theme.symbol}</span>
                                    <span>{isBn ? _theme.labelBn : _theme.labelEn}</span>
                                </div>
                            )}
                            {person.eminent_category && (
                                <div className="md:hidden z-20 flex items-center gap-1.5 bg-green-100 text-green-800 border-2 border-white rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[0.15em] shadow-xl whitespace-nowrap">
                                    <Award size={10} className="text-green-600" />
                                    <span>{person.eminent_category}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative mb-4 sm:mb-6 flex flex-col items-center">
                        {person.eminent_category && (
                            <div className="hidden md:flex mb-3 sm:mb-4 z-20 items-center gap-1.5 bg-green-100 text-green-800 border-2 border-white rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] shadow-xl whitespace-nowrap">
                                <Award size={10} className="sm:size-3 text-green-600" />
                                <span>{person.eminent_category}</span>
                            </div>
                        )}
                        <div className="relative">
                            <div 
                                onClick={() => person.profile_image_url && openImage(person.profile_image_url, formatName(person))}
                                className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white/30 p-1 shadow-2xl relative z-10 mx-auto ${
                                    person.profile_image_url ? 'cursor-pointer group/avatar hover:scale-105 active:scale-95 transition-all duration-300' : ''
                                }`}
                                title={person.profile_image_url ? t('সম্পূর্ণ ছবি দেখতে ক্লিক করুন', 'Click to view full photo') : ''}
                            >
                                <div className="w-full h-full rounded-full overflow-hidden bg-white/20 backdrop-blur-md flex items-center justify-center relative">
                                    {person.profile_image_url ? (
                                        <>
                                            <img 
                                                src={person.profile_image_url} 
                                                alt={person.full_name} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110" 
                                            />
                                            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <ZoomIn className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
                                            </div>
                                        </>
                                    ) : (
                                        <User size={48} className="sm:size-16 text-white/40" />
                                    )}
                                </div>
                            </div>
                            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white ${genBadgeText} text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-full shadow-lg uppercase tracking-tighter z-20 whitespace-nowrap pointer-events-none`}>
                                Gen {person.level}
                            </div>
                        </div>
                    </div>
                    <div className="text-center relative z-10">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
                                {formatName(person)}
                            </h2>
                            {(person.is_active || person.user_status === 'active' || person.user_account?.status === 'active') && (
                                <VerifiedBadge size={22} />
                            )}
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-6">
                            <div className="h-px w-4 sm:w-6 bg-white/30"></div>
                            <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-white/70">ID: {person.id}</p>
                            <div className="h-px w-4 sm:w-6 bg-white/30"></div>
                        </div>
                    </div>
                </div>

                <div className="md:w-2/3 p-5 sm:p-8 md:p-10 bg-white relative flex flex-col min-h-0 overflow-hidden">
                    {/* Desktop Close Button: only shown on md+ screens */}
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="hidden md:block absolute top-4 sm:top-6 right-4 sm:right-6 p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-all z-10 cursor-pointer"
                        title="Close"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-3.5 sm:gap-y-4 mt-2 sm:mt-4 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Left Column: Personal Info */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-800 border-b border-stone-100 pb-2 mb-4">{t('ব্যক্তিগত তথ্য', 'Personal Info')}</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <InfoItem icon={<Calendar size={14} />} label={t('জন্ম তারিখ', 'Birth Date')} value={
                                    <React.Fragment>
                                        {person.birth_date ? new Date(person.birth_date).toLocaleDateString() : t('অজানা', 'Unknown')}
                                        {person.alive === false && person.death_date && (
                                            <span className="text-stone-400 font-normal"> — {new Date(person.death_date).toLocaleDateString()}</span>
                                        )}
                                    </React.Fragment>
                                } color="orange" />
                                <InfoItem icon={<Briefcase size={14} />} label={t('পেশা', 'Occupation')} value={formatOccupation(person.occupation)} color="orange" />
                                <InfoItem icon={<Building size={14} />} label={t('কর্মস্থল', 'Workplace')} value={person.workplace} color="orange" />
                                <InfoItem icon={<GraduationCap size={14} />} label={t('শিক্ষাগত যোগ্যতা', 'Educational Background')} value={person.education} color="orange" />
                                <InfoItem icon={<Droplet size={14} />} label={t('রক্তের গ্রুপ', 'Blood Group')} value={person.blood_group} highlight color="red" />
                                <InfoItem icon={<MapPin size={14} />} label={t('আদি গ্রাম', 'Ancestral Village')} value={person.village || person.location} color="orange" />
                                <InfoItem icon={<MapPin size={14} />} label={t('বর্তমান ঠিকানা', 'Current Location')} value={person.present_address} color="orange" />
                            </div>
                        </div>

                        {/* Right Column: Contact & Family */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-800 border-b border-stone-100 pb-2 mb-4">{t('যোগাযোগ ও পরিবার', 'Contact & Family')}</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <InfoItem icon={<Phone size={14} />} label={t('যোগাযোগ নম্বর', 'Contact Number')} value={person.contact_number} color="yellow" />
                                {person.social_media ? (
                                    <InfoItem
                                        color="yellow"
                                        icon={
                                            person.social_media.toLowerCase().includes('facebook') ? <Facebook size={14} /> :
                                                person.social_media.toLowerCase().includes('instagram') ? <Instagram size={14} /> :
                                                    person.social_media.toLowerCase().includes('twitter') || person.social_media.toLowerCase().includes('x.com') ? <Twitter size={14} /> :
                                                        person.social_media.toLowerCase().includes('linkedin') ? <Linkedin size={14} /> :
                                                            <Globe size={14} />
                                        }
                                        label={t('সামাজিক যোগাযোগ', 'Social Media')}
                                        value={<a href={person.social_media.startsWith('http') ? person.social_media : `https://${person.social_media}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">{t('প্রোফাইল দেখুন', 'Visit Profile')}</a>}
                                    />
                                ) : (
                                    <InfoItem icon={<Link size={14} />} label={t('সামাজিক যোগাযোগ', 'Social Media')} value="N/A" color="yellow" />
                                )}

                                {/* Spouse Field */}
                                <InfoItem
                                    icon={<Heart size={14} />}
                                    label={t('সহধর্মিণী', 'Spouse')}
                                    color="pink"
                                    value={
                                        person.spouses && person.spouses.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {person.spouses.filter((s, i, a) => a.findIndex(t => String(t.id) === String(s.id)) === i).map(s => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenSpouse(s);
                                                        }}
                                                        className="text-pink-700 hover:text-pink-900 font-bold hover:underline bg-pink-50 border border-pink-100 hover:border-pink-300 px-2 py-0.5 rounded-lg text-[9px] transition-all flex items-center gap-1 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer"
                                                    >
                                                        <div className="w-4 h-4 rounded-full overflow-hidden bg-white shrink-0 ring-1 ring-pink-300">
                                                            {s.profile_image_url ? (
                                                                <img src={s.profile_image_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User size={8} className="m-auto opacity-30 text-pink-500" />
                                                            )}
                                                        </div>
                                                        <span>{formatName(s)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : "N/A"
                                    }
                                />

                                <InfoItem
                                    icon={<User size={14} />}
                                    label={t('পিতা-মাতা', 'Parents')}
                                    color="stone"
                                    value={
                                        <div className="flex flex-col gap-1.5 mt-0.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded font-black shrink-0">{isBn ? 'পিতা' : 'F'}</span>
                                                <span className="truncate text-stone-700">
                                                    {formatName((person.father_id && memberMap && memberMap[String(person.father_id)]) || { full_name: person.father_name, name_bangla: person.father_name_bangla, name_english: person.father_name_english }) || t('অজানা', 'Unknown')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-[8px] bg-pink-100 text-pink-700 px-1 rounded font-black shrink-0">{isBn ? 'মাতা' : 'M'}</span>
                                                <span className="truncate text-stone-700">
                                                    {(() => {
                                                        if (person.mother_id && memberMap && memberMap[String(person.mother_id)]) {
                                                            return formatName(memberMap[String(person.mother_id)]);
                                                        }
                                                        if (person.mother_name || person.mother_name_bangla || person.mother_name_english) {
                                                            return formatName({ full_name: person.mother_name, name_bangla: person.mother_name_bangla, name_english: person.mother_name_english });
                                                        }
                                                        if (person.father_id && memberMap && memberMap[String(person.father_id)]) {
                                                            const fatherSpouses = memberMap[String(person.father_id)].spouses || [];
                                                            if (fatherSpouses.length === 1) {
                                                                return formatName(fatherSpouses[0]);
                                                            } else if (fatherSpouses.length > 1) {
                                                                return t('একাধিক মাতা সম্ভাব্য (আপডেট করুন)', 'Multiple Possible (Update Required)');
                                                            }
                                                        }
                                                        return t('অজানা', 'Unknown');
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {/* Overlaid Cute Female Spouse Profile Card */}
        {activeSpouse && (
            <div
                className="fixed inset-0 app-sheet z-[140] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
                onClick={() => setActiveSpouse(null)}
            >
                        <div
                            className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-rose-50 via-white to-rose-50 rounded-3xl shadow-2xl border-2 border-pink-200 p-4 sm:p-6 relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto custom-scrollbar"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Decorative background glow */}
                            <div className="absolute -top-12 -right-12 w-36 h-36 bg-pink-300/25 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-rose-200/25 rounded-full blur-2xl pointer-events-none"></div>

                            {/* Close Button */}
                            <button
                                onClick={() => setActiveSpouse(null)}
                                className="absolute top-3.5 right-3.5 z-20 p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-100/70 rounded-full transition-all active:scale-90 shadow-2xs"
                                title="Close"
                            >
                                <X size={16} />
                            </button>

                            {/* Cute Female Profile Header */}
                            <div className="flex items-center gap-3.5 mb-4 relative z-10">
                                <div className="relative shrink-0">
                                    <div 
                                        onClick={() => (spouseData?.profile_image_url || activeSpouse.profile_image_url) && openImage(spouseData?.profile_image_url || activeSpouse.profile_image_url, formatName(spouseData || activeSpouse))}
                                        className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full p-1 bg-gradient-to-tr from-pink-400 via-rose-300 to-amber-200 shadow-md shadow-pink-500/15 ${
                                            (spouseData?.profile_image_url || activeSpouse.profile_image_url) ? 'cursor-pointer group/spouse-avatar hover:scale-105 active:scale-95 transition-all duration-300' : ''
                                        }`}
                                        title={(spouseData?.profile_image_url || activeSpouse.profile_image_url) ? t('সম্পূর্ণ ছবি দেখতে ক্লিক করুন', 'Click to view full photo') : ''}
                                    >
                                        <div className="w-full h-full rounded-full overflow-hidden bg-rose-50 flex items-center justify-center relative">
                                            {(spouseData?.profile_image_url || activeSpouse.profile_image_url) ? (
                                                <>
                                                    <img
                                                        src={spouseData?.profile_image_url || activeSpouse.profile_image_url}
                                                        alt=""
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/spouse-avatar:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/spouse-avatar:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                        <ZoomIn className="w-5 h-5 text-white drop-shadow-md" />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-pink-100 to-rose-50 text-rose-400">
                                                    <User size={30} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-1 rounded-full shadow-md border-2 border-white pointer-events-none">
                                        <Heart size={9} className="fill-white" />
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1 pr-6">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-100/80 border border-pink-200 text-rose-700 text-[10px] font-bold tracking-wide mb-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                        <span>{t('সহধর্মিণী', 'Spouse')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <h3 className="text-xl font-serif font-bold text-stone-900 leading-tight truncate">
                                            {formatName(spouseData || activeSpouse)}
                                        </h3>
                                        {(spouseData?.is_active || activeSpouse?.is_active || spouseData?.user_status === 'active' || activeSpouse?.user_status === 'active') && (
                                            <VerifiedBadge size={16} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="space-y-2.5 relative z-10">
                                {/* Profession & Workplace */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white/90 p-2.5 rounded-2xl border border-pink-100 shadow-2xs">
                                        <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1 mb-0.5">
                                            <Briefcase size={11} className="text-rose-500" /> {t('পেশা', 'Occupation')}
                                        </span>
                                        <p className="font-bold text-stone-800 truncate" title={spouseData?.occupation || 'N/A'}>
                                            {loadingSpouse && !spouseData ? (isBn ? 'লোড হচ্ছে...' : 'Loading...') : (spouseData?.occupation ? formatOccupation(spouseData.occupation) : t('গৃহিণী', 'Housewife'))}
                                        </p>
                                    </div>

                                    <div className="bg-white/90 p-2.5 rounded-2xl border border-pink-100 shadow-2xs">
                                        <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1 mb-0.5">
                                            <Building size={11} className="text-rose-500" /> {t('কর্মস্থল', 'Workplace')}
                                        </span>
                                        <p className="font-bold text-stone-800 truncate" title={spouseData?.workplace || 'N/A'}>
                                            {loadingSpouse && !spouseData ? (isBn ? 'লোড হচ্ছে...' : 'Loading...') : (spouseData?.workplace || 'N/A')}
                                        </p>
                                    </div>
                                </div>

                                {/* Contact & Social Media */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white/90 p-2.5 rounded-2xl border border-pink-100 shadow-2xs">
                                        <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1 mb-0.5">
                                            <Phone size={11} className="text-rose-500" /> {t('যোগাযোগ', 'Contact')}
                                        </span>
                                        {spouseData?.contact_number ? (
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                {spouseData.contact_number.split(/[,;\/\n\r]+/).map((num, i) => {
                                                    const cleanNum = num.trim();
                                                    if (!cleanNum) return null;
                                                    return (
                                                        <a key={i} href={`tel:${cleanNum}`} className="font-bold text-rose-700 hover:underline text-xs bg-rose-50 px-1.5 py-0.5 rounded">
                                                            {cleanNum}
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-stone-400 font-medium">N/A</p>
                                        )}
                                    </div>

                                    <div className="bg-white/90 p-2.5 rounded-2xl border border-pink-100 shadow-2xs">
                                        <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1 mb-0.5">
                                            <Globe size={11} className="text-rose-500" /> {t('সামাজিক যোগাযোগ', 'Social Media')}
                                        </span>
                                        {spouseData?.social_media ? (
                                            <a
                                                href={spouseData.social_media.startsWith('http') ? spouseData.social_media : `https://${spouseData.social_media}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-rose-700 hover:text-rose-900 hover:underline truncate block"
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
                                    <div className="bg-white/90 p-2 rounded-2xl border border-pink-100 shadow-2xs text-center">
                                        <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider block mb-0.5">
                                            {t('রক্তের গ্রুপ', 'Blood')}
                                        </span>
                                        <span className="font-extrabold text-rose-700 text-xs">
                                            {spouseData?.blood_group || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="bg-white/90 p-2 rounded-2xl border border-pink-100 shadow-2xs text-center">
                                        <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider block mb-0.5">
                                            {t('শিক্ষাগত যোগ্যতা', 'Education')}
                                        </span>
                                        <span className="font-bold text-stone-800 text-[11px] truncate block" title={spouseData?.education || 'N/A'}>
                                            {spouseData?.education || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="bg-white/90 p-2 rounded-2xl border border-pink-100 shadow-2xs text-center">
                                        <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider block mb-0.5">
                                            {t('জন্ম তারিখ', 'Birth Date')}
                                        </span>
                                        <span className="font-bold text-stone-700 text-[10px] truncate block">
                                            {spouseData?.birth_date ? new Date(spouseData.birth_date).toLocaleDateString() : t('অজানা', 'Unknown')}
                                        </span>
                                    </div>
                                </div>

                                {/* Location / Village */}
                                {(spouseData?.present_address || spouseData?.village || spouseData?.location) && (
                                    <div className="bg-white/90 p-2.5 rounded-2xl border border-pink-100 shadow-2xs text-xs flex items-center gap-2 text-stone-700">
                                        <MapPin size={12} className="text-rose-500 shrink-0" />
                                        <span className="truncate">
                                            {spouseData?.present_address || spouseData?.village || spouseData?.location}
                                        </span>
                                    </div>
                                )}

                                {/* Parents */}
                                {(spouseData?.father_name || spouseData?.mother_name || (spouseData?.father_id && memberMap) || (spouseData?.mother_id && memberMap)) && (
                                    <div className="bg-white/90 p-2.5 rounded-2xl border border-pink-100 shadow-2xs text-xs">
                                        <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider block mb-1">
                                            {t('পিতা-মাতা', 'Parents')}
                                        </span>
                                        <div className="flex flex-col gap-1 text-[11px] text-stone-700">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded font-bold">{isBn ? 'পিতা' : 'F'}</span>
                                                <span className="truncate font-medium">
                                                    {formatName((spouseData.father_id && memberMap && memberMap[String(spouseData.father_id)]) || { full_name: spouseData.father_name, name_bangla: spouseData.father_name_bangla, name_english: spouseData.father_name_english }) || t('অজানা', 'Unknown')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] bg-pink-100 text-pink-700 px-1 rounded font-bold">{isBn ? 'মাতা' : 'M'}</span>
                                                <span className="truncate font-medium">
                                                    {formatName((spouseData.mother_id && memberMap && memberMap[String(spouseData.mother_id)]) || { full_name: spouseData.mother_name, name_bangla: spouseData.mother_name_bangla, name_english: spouseData.mother_name_english }) || t('অজানা', 'Unknown')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-pink-100 relative z-10">
                                <button
                                    type="button"
                                    onClick={() => setActiveSpouse(null)}
                                    className="px-3.5 py-1.5 bg-pink-50 hover:bg-pink-100 text-rose-800 text-xs font-bold rounded-xl transition active:scale-95 flex items-center gap-1 border border-pink-200 cursor-pointer"
                                >
                                    <X size={13} />
                                    <span>{t('বন্ধ করুন', 'Close')}</span>
                                </button>
                                {isAdmin && onEditNode && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const sp = spouseData || activeSpouse;
                                            setActiveSpouse(null);
                                            onEditNode({ ...sp, isSpouseFlag: true, role: 'spouse', husband: person });
                                        }}
                                        className="px-3 py-1.5 bg-stone-100 hover:bg-orange-100 text-stone-600 hover:text-orange-700 text-xs font-bold rounded-xl transition active:scale-95 flex items-center gap-1 border border-stone-200 cursor-pointer"
                                    >
                                        <Edit size={12} />
                                        <span>{t('সম্পাদনা', 'Edit')}</span>
                                    </button>
                                )}
                                {onViewDetails && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const sp = spouseData || activeSpouse;
                                            setActiveSpouse(null);
                                            onViewDetails(sp);
                                        }}
                                        className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-700 hover:to-pink-800 text-white text-xs font-bold rounded-xl transition shadow-md shadow-rose-900/10 active:scale-95 flex items-center gap-1.5 cursor-pointer ml-auto"
                                    >
                                        <span>{t('সম্পূর্ণ প্রোফাইল', 'Full Profile')}</span>
                                        <Sparkles size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
        </React.Fragment>
    );
};

/* SPOUSE DETAILS MODAL (Screenshot Style) */
const SpouseDetailsModal = ({ person: initialPerson, onClose, onViewTree, onViewDetails, memberMap }) => {
    const { t, isBn, formatOccupation, formatName } = useLanguage();
    const { openImage } = useImageViewer();
    const [person, setPerson] = useState(initialPerson);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialPerson?.id && !initialPerson.occupation) {
            fetchFullData(initialPerson.id);
        } else {
            setPerson(initialPerson);
        }
    }, [initialPerson]);

    const fetchFullData = async (id) => {
        try {
            setLoading(true);
            const res = await api.get(`/members/${id}`);
            setPerson(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching spouse details:', err);
            setLoading(false);
        }
    };

    if (!person) return null;

    const fatherName = formatName(
        (person.father_id && memberMap && memberMap[String(person.father_id)]) ||
        { full_name: person.father_name, name_bangla: person.father_name_bangla, name_english: person.father_name_english }
    );

    const motherName = formatName(
        (person.mother_id && memberMap && memberMap[String(person.mother_id)]) ||
        { full_name: person.mother_name, name_bangla: person.mother_name_bangla, name_english: person.mother_name_english }
    );

    const SpouseInfoItem = ({ icon, label, value, onClick }) => (
        <div className={`flex items-start gap-4 mb-6 ${onClick ? 'cursor-pointer group' : ''}`} onClick={onClick}>
            <div className={`mt-1 text-orange-800 shrink-0 ${onClick ? 'group-hover:scale-110 transition-transform' : ''}`}>
                {icon}
            </div>
            <div>
                <p className="text-stone-400 text-xs font-semibold mb-0.5">{label}</p>
                <p className={`text-stone-800 font-bold text-sm leading-tight ${onClick ? 'group-hover:text-orange-800' : ''}`}>
                    {value || (loading ? (isBn ? 'লোড হচ্ছে...' : 'Loading...') : 'N/A')}
                </p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 app-sheet z-[110] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-orange-800 h-28 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors cursor-pointer">
                        <X size={24} />
                    </button>
                    <button
                        onClick={() => onViewTree(person)}
                        className="absolute top-4 right-14 bg-white text-orange-800 px-3 py-1 rounded-full text-[10px] font-bold shadow-md hover:bg-orange-50 transition-colors uppercase tracking-wider cursor-pointer"
                    >
                        {t('ট্রি দেখুন', 'View Tree')}
                    </button>
                    <div className="absolute top-10 left-1/2 -translate-x-1/2">
                        <div 
                            onClick={() => person.profile_image_url && openImage(person.profile_image_url, formatName(person))}
                            className={`w-28 h-28 rounded-full border-4 border-white overflow-hidden bg-orange-100 shadow-xl ${
                                person.profile_image_url ? 'cursor-pointer group/spouse-modal hover:scale-105 active:scale-95 transition-all duration-300' : ''
                            }`}
                            title={person.profile_image_url ? t('সম্পূর্ণ ছবি দেখতে ক্লিক করুন', 'Click to view full photo') : ''}
                        >
                            {person.profile_image_url ? (
                                <div className="w-full h-full relative">
                                    <img 
                                        src={person.profile_image_url} 
                                        alt={person.full_name} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/spouse-modal:scale-110" 
                                    />
                                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/spouse-modal:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <ZoomIn className="w-6 h-6 text-white drop-shadow-lg" />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User size={48} className="text-orange-800/30" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Name and Location */}
                <div className="mt-14 text-center px-6">
                    <div className="flex items-center justify-center gap-1.5">
                        <h2 className="text-2xl font-serif font-bold text-orange-800">
                            {formatName(person)}
                        </h2>
                        {(person.is_active || person.user_status === 'active' || person.user_account?.status === 'active') && (
                            <VerifiedBadge size={18} />
                        )}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-stone-500 text-sm mt-1">
                        <MapPin size={14} className="text-orange-800" />
                        <span>{person.village || person.location || 'N/A'}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 grid grid-cols-2 gap-8 mt-4">
                    {/* Left Column: Personal Info */}
                    <div>
                        <h3 className="text-orange-800 font-serif font-bold text-lg border-b border-stone-100 pb-2 mb-6">{t('ব্যক্তিগত তথ্য', 'Personal Info')}</h3>
                        <SpouseInfoItem icon={<Briefcase size={18} />} label={t('পেশা', 'Occupation')} value={formatOccupation(person.occupation)} />
                        <SpouseInfoItem icon={<Building size={18} />} label={t('কর্মস্থল', 'Workplace')} value={person.workplace} />
                        <SpouseInfoItem icon={<GraduationCap size={18} />} label={t('শিক্ষাগত যোগ্যতা', 'Education')} value={person.education} />
                        <SpouseInfoItem icon={<Droplet size={18} />} label={t('রক্তের গ্রুপ', 'Blood Group')} value={person.blood_group} />
                        <SpouseInfoItem icon={<Calendar size={18} />} label={t('জন্ম তারিখ', 'Birth Date')} value={person.dob || person.birth_date} />
                    </div>

                    {/* Right Column: Contact & Family */}
                    <div>
                        <h3 className="text-orange-800 font-serif font-bold text-lg border-b border-stone-100 pb-2 mb-6">{t('যোগাযোগ ও পরিবার', 'Contact & Family')}</h3>
                        <SpouseInfoItem icon={<Phone size={18} />} label={t('যোগাযোগ নম্বর', 'Phone')} value={person.contact_number} />
                        <SpouseInfoItem icon={<MapPin size={18} />} label={t('বর্তমান ঠিকানা', 'Address')} value={person.present_address} />
                        {person.social_media && (
                            <SpouseInfoItem
                                icon={<Globe size={18} />}
                                label={t('সামাজিক যোগাযোগ', 'Social Media')}
                                value={
                                    <a
                                        href={person.social_media.startsWith('http') ? person.social_media : `https://${person.social_media}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                    >
                                        {t('প্রোফাইল দেখুন', 'Visit Profile')}
                                    </a>
                                }
                            />
                        )}
                        {/* Partner Link */}
                        {person.spouses && person.spouses.length > 0 && (
                            <div className="mb-6">
                                <p className="text-stone-400 text-xs font-semibold mb-2 uppercase tracking-wider">{t('জীবনসঙ্গী', 'Partner')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {person.spouses.filter((s, i, a) => a.findIndex(t => String(t.id) === String(s.id)) === i).map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                const fullPartner = memberMap && memberMap[String(s.id)];
                                                onViewDetails(fullPartner || s, 'member');
                                            }}
                                            className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-all group cursor-pointer"
                                        >
                                            <div className="w-5 h-5 rounded-full overflow-hidden bg-white shrink-0 group-hover:scale-110 transition-transform">
                                                {s.profile_image_url ? (
                                                    <img src={s.profile_image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={12} className="m-auto opacity-30" />
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-orange-900">{formatName(s)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <SpouseInfoItem
                            icon={<User size={18} />}
                            label={t('পিতা-মাতা', 'Parents')}
                            value={
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1 rounded font-black shrink-0">{isBn ? 'পিতা' : 'Father'}</span>
                                        <span className="truncate">{fatherName || t('অজানা', 'Unknown')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] bg-pink-50 text-pink-600 px-1 rounded font-black shrink-0">{isBn ? 'মাতা' : 'Mother'}</span>
                                        <span className="truncate">{motherName || t('অজানা', 'Unknown')}</span>
                                    </div>
                                </div>
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────────────────────────────────
 * Household family tree — generation rows
 *
 * Each generation is a horizontally scrollable row. Tapping a person opens
 * their children in the next row; branches are drawn as animated SVG curves
 * measured from the real card positions (re-measured on row scroll/resize),
 * and the selected lineage carries a flowing "diya-light" pulse.
 * ────────────────────────────────────────────────────────────────────────── */
const TreeStyles = () => (
    <style>{`
        @keyframes ft-pop   { 0% { opacity: 0; transform: translateY(14px) scale(.94); filter: blur(4px); } 60% { opacity: 1; filter: blur(0); } 100% { opacity: 1; transform: none; filter: none; } }
        @keyframes ft-draw  { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @keyframes ft-flow  { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -40; } }
        @keyframes ft-fade  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ft-halo  { 0%, 100% { opacity: .5; transform: scale(1); } 50% { opacity: .15; transform: scale(1.05); } }
        @keyframes ft-row   { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .ft-pop   { animation: ft-pop .55s cubic-bezier(.2,.9,.3,1.15) both; }
        .ft-row   { animation: ft-row .4s ease-out both; }
        .ft-edge  { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ft-draw .7s cubic-bezier(.65,0,.35,1) forwards; }
        .ft-flow  { stroke-dasharray: 4 16; animation: ft-fade .4s ease .7s both, ft-flow 1.1s linear infinite; }
        .ft-dot   { animation: ft-fade .35s ease-out both; }
        .ft-halo  { animation: ft-halo 2.4s ease-in-out infinite; }
        .ft-scroll { scrollbar-width: none; -ms-overflow-style: none; overscroll-behavior-x: contain; }
        .ft-scroll::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) {
            .ft-pop, .ft-row, .ft-dot, .ft-halo { animation: none !important; }
            .ft-edge { animation: none !important; stroke-dashoffset: 0; }
            .ft-flow { animation: none !important; }
        }
    `}</style>
);

const yearOf = (d) => {
    if (!d) return null;
    const y = new Date(d).getFullYear();
    return Number.isFinite(y) ? y : null;
};

const TreeNode = ({ node, isActive, isDimmed, isHovered, onClick, onAddChild, onViewDetails, onEditNode, onDeleteNode, level, index, isAdmin, memberMap, slotRef, onHover }) => {
    const { t, isBn, formatNumber, formatName } = useLanguage();
    const childrenCount = node.children ? node.children.length : 0;
    const identity = getMemberIdentity(node);
    const isDeceased = node.is_alive === false || Boolean(node.death_date);
    const born = yearOf(node.birth_date);
    const died = yearOf(node.death_date);
    const spouses = Array.isArray(node.spouses) ? node.spouses.filter(Boolean) : [];
    const firstSpouse = spouses[0];

    const accent = identity === 'son'
        ? { ring: 'from-sky-500 via-orange-500 to-amber-400', soft: 'bg-sky-50 text-sky-700', pill: 'bg-sky-600' }
        : identity === 'daughter'
            ? { ring: 'from-rose-500 via-orange-500 to-amber-400', soft: 'bg-rose-50 text-rose-700', pill: 'bg-rose-600' }
            : { ring: 'from-orange-500 via-red-600 to-amber-400', soft: 'bg-orange-50 text-orange-700', pill: 'bg-orange-600' };

    const openSpouse = (e) => {
        e.stopPropagation();
        const full = firstSpouse && memberMap?.[String(firstSpouse.id)];
        onViewDetails?.(full || { ...firstSpouse, gender: 'Female', relationType: 'spouse' });
    };

    return (
        <div
            id={`node-${node.id}`}
            ref={slotRef}
            className="relative shrink-0 snap-center pt-1 pb-6"
            onMouseEnter={() => onHover?.(node.id)}
            onMouseLeave={() => onHover?.(null)}
        >
            <div className="ft-pop relative" style={{ animationDelay: `${Math.min(index, 10) * 55}ms` }}>
                {isActive && (
                    <div className={`ft-halo pointer-events-none absolute -inset-2 rounded-[26px] bg-gradient-to-br ${accent.ring} opacity-40 blur-lg`} />
                )}

                {/* Gradient frame when selected */}
                <div className={`relative rounded-[22px] p-[1.5px] transition-all duration-300 ${isActive ? `bg-gradient-to-br ${accent.ring} shadow-xl shadow-orange-900/15` : 'bg-transparent'}`}>
                    <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={isActive}
                        aria-label={formatName(node)}
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
                        className={`group relative flex flex-col items-center w-[136px] sm:w-[176px] px-2 pt-3 pb-3.5 sm:pb-4 rounded-[20.5px] border cursor-pointer select-none
                            transition-all duration-300 ease-out active:scale-[0.98]
                            ${isActive
                                ? 'bg-white border-transparent'
                                : isDimmed
                                    ? 'bg-white/80 border-stone-200 opacity-55 saturate-50 hover:opacity-100 hover:saturate-100'
                                    : `bg-white border-stone-200 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-900/10 ${isHovered ? 'border-orange-300' : 'hover:border-orange-300'}`}
                            ${isDeceased && !isActive ? 'bg-stone-50' : ''}`}
                    >
                        {/* Admin actions */}
                        {isAdmin && (onDeleteNode || onEditNode) && (
                            <div className="absolute top-1.5 right-1.5 flex gap-0.5 z-20">
                                {onEditNode && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); onEditNode(node); }}
                                        className="p-1 rounded-md text-stone-400 hover:text-orange-700 hover:bg-orange-50 transition-colors" title={t('সদস্য সম্পাদনা', 'Edit Member')}>
                                        <Edit2 size={12} />
                                    </button>
                                )}
                                {onDeleteNode && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteNode(node); }}
                                        className="p-1 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors" title={t('সদস্য মুছুন', 'Delete Member')}>
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Eminent tag */}
                        {node.eminent_category && (
                            <div className="absolute top-1.5 left-1.5 z-20 max-w-[52%] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-900 text-[8px] font-bold"
                                title={node.eminent_category}>
                                <Award size={9} className="shrink-0 text-amber-600" />
                                <span className="truncate leading-none">{node.eminent_category}</span>
                            </div>
                        )}

                        {/* Avatar */}
                        <div
                            className="relative mt-3 mb-2.5 group/avatar"
                            onClick={(e) => { e.stopPropagation(); onViewDetails?.(node, 'member'); }}
                            title={t('বিস্তারিত দেখুন', 'View details')}
                        >
                            <div className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full p-[3px] transition-all duration-500
                                ${isActive ? `bg-gradient-to-tr ${accent.ring}` : isDeceased ? 'bg-stone-200' : identity === 'son' ? 'bg-sky-100' : identity === 'daughter' ? 'bg-rose-100' : 'bg-orange-100'}
                                group-hover/avatar:scale-105`}>
                                <div className={`w-full h-full rounded-full overflow-hidden border-2 border-white ${isDeceased ? 'grayscale-[0.6]' : ''}`}>
                                    {node.profile_image_url ? (
                                        <img src={node.profile_image_url} alt={formatName(node)} className="w-full h-full object-cover" loading="lazy" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center font-serif font-bold text-lg sm:text-2xl ${isDeceased ? 'bg-stone-100 text-stone-400' : accent.soft}`}>
                                            {(formatName(node) || '?').trim().charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Generation pill */}
                            <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-full text-[8.5px] sm:text-[9.5px] font-bold whitespace-nowrap border shadow-sm
                                ${isActive ? `${accent.pill} text-white border-transparent` : 'bg-white text-stone-500 border-stone-200'}`}>
                                {isBn ? `প্রজন্ম ${formatNumber(node.level || level)}` : `Gen ${node.level || level}`}
                            </span>
                            {/* Remembrance mark */}
                            {isDeceased && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shadow-sm" title={t('প্রয়াত', 'Late')}>
                                    <Flower2 size={11} className="text-amber-600" />
                                </span>
                            )}
                        </div>

                        {/* Name */}
                        <div className="w-full flex items-start justify-center gap-1 px-0.5">
                            <h3 className={`text-center font-serif font-bold text-[13px] sm:text-sm leading-snug line-clamp-2 break-words ${isActive ? 'text-orange-900' : isDeceased ? 'text-stone-600' : 'text-stone-800'}`}>
                                {formatName(node)}
                            </h3>
                            {(node.is_active || node.user_status === 'active') && (
                                <span className="shrink-0 mt-0.5"><VerifiedBadge size={12} /></span>
                            )}
                        </div>

                        {/* Life years / children */}
                        <div className="mt-1 text-[10px] sm:text-[11px] font-medium text-stone-400 text-center leading-tight">
                            {isDeceased
                                ? <span>{t('প্রয়াত', 'Late')}{(born || died) ? ` · ${born ? formatNumber(born) : '…'}–${died ? formatNumber(died) : '…'}` : ''}</span>
                                : born ? <span>{t('জন্ম', 'Born')} {formatNumber(born)}</span> : null}
                        </div>
                        <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${childrenCount > 0 ? (isActive ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-800') : 'bg-stone-100 text-stone-400'}`}>
                            <Users size={10} />
                            {childrenCount > 0
                                ? (isBn ? `${formatNumber(childrenCount)} সন্তান` : `${childrenCount} ${childrenCount === 1 ? 'child' : 'children'}`)
                                : t('সন্তান নেই', 'No children')}
                        </div>

                        {/* Spouse */}
                        {firstSpouse && (
                            <button
                                type="button"
                                onClick={openSpouse}
                                className="mt-2 w-full flex items-center gap-1.5 px-1.5 py-1 rounded-xl bg-rose-50/80 border border-rose-100 hover:border-rose-300 hover:bg-rose-50 transition-colors text-left"
                                title={t('সহধর্মিণীর বিস্তারিত', 'Spouse details')}
                            >
                                <span className="w-5 h-5 rounded-full overflow-hidden bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 text-[10px] font-bold">
                                    {firstSpouse.profile_image_url
                                        ? <img src={firstSpouse.profile_image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        : <Heart size={10} className="fill-rose-400 text-rose-400" />}
                                </span>
                                <span className="min-w-0 flex-1 text-[10.5px] font-semibold text-rose-800 truncate">{formatName(firstSpouse)}</span>
                                {spouses.length > 1 && (
                                    <span className="text-[9px] font-bold text-rose-500 shrink-0">+{formatNumber(spouses.length - 1)}</span>
                                )}
                            </button>
                        )}

                        {/* Add child (sons only — daughters are leaf nodes) */}
                        {isAdmin && node.gender !== 'Female' && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onAddChild?.(node); }}
                                className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-transform hover:scale-110 active:scale-95
                                    ${isActive ? 'bg-orange-600 text-white' : 'bg-white text-stone-400 hover:bg-orange-100 hover:text-orange-700'}`}
                                title={t('সন্তান যোগ করুন', 'Add Child')}
                            >
                                <Plus size={14} strokeWidth={3} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* Main Component */
const FamilyTree = ({ members, onAddChild, onAddRoot, onEditNode, onDeleteNode, onViewDetails, isAdmin, autoExpandId }) => {
    const { t, isBn, formatNumber, formatName } = useLanguage();
    const [activePathIds, setActivePathIds] = useState([]);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [hoverId, setHoverId] = useState(null);
    const [edges, setEdges] = useState({ list: [], w: 0, h: 0 });
    const wrapRef = useRef(null);
    const rowRefs = useRef({});
    const slotRefs = useRef({});
    const rafRef = useRef(0);

    // Transform Flat List to Hierarchy
    const { roots, map, spouseIds } = useMemo(() => {
        if (!members) {
            return { roots: [], map: {}, spouseIds: new Set() };
        }

        const map = {};
        const roots = [];
        const spouseIds = new Set();

        members.forEach(member => {
            map[String(member.id)] = { ...member, children: [] };

            // Collect IDs that act as spouses so they are not treated as independent roots.
            // Since member_spouses is bidirectional, we only want the wives (females) to be in spouseIds
            // so that the husbands (males) can properly be roots if they have no father.
            if (member.gender === 'Male') {
                if (member.spouse_id) spouseIds.add(String(member.spouse_id));
                if (member.spouses) {
                    member.spouses.forEach(s => {
                        if (s && s.id) spouseIds.add(String(s.id));
                    });
                }
            } else if (member.gender === 'Female') {
                // If a female has a spouse_id, that's likely her husband. She herself is a spouse.
                if (member.spouse_id) {
                    spouseIds.add(String(member.id));
                }
            }

            if (member.mother_id) spouseIds.add(String(member.mother_id));
            if (member.motherId) spouseIds.add(String(member.motherId));
        });

        members.forEach(member => {
            const memberId = String(member.id);
            const parentId = member.father_id || member.fatherId || member.mother_id || member.motherId;
            if (parentId && map[parentId]) {
                map[parentId].children.push(map[memberId]);
            } else if (!spouseIds.has(memberId)) {
                // Only a root if no parent AND not identified as someone's spouse
                roots.push(map[memberId]);
            }
        });

        const getGenderWeight = (gender) => {
            if (gender === 'Male') return 1;
            if (gender === 'Female') return 2;
            return 3;
        };

        const sortNodes = (a, b) => {
            const weightA = getGenderWeight(a.gender);
            const weightB = getGenderWeight(b.gender);
            if (weightA !== weightB) {
                return weightA - weightB;
            }
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        };

        // Now sort the constructed arrays by gender and chronologically
        members.forEach(member => {
            const memberNode = map[String(member.id)];
            if (memberNode && memberNode.children.length > 0) {
                memberNode.children.sort(sortNodes);
            }
        });

        return {
            roots: roots.sort(sortNodes),
            map: map,
            spouseIds: spouseIds
        };
    }, [members]);

    useEffect(() => {
        if (!autoExpandId || !members || members.length === 0 || Object.keys(map).length === 0 || roots.length === 0) return;

        const targetId = String(autoExpandId);

        // DFS path finder — uses String() on both sides to avoid number/string mismatch
        const findPath = (nodes, target, currentPath) => {
            for (const node of nodes) {
                const nodeId = String(node.id);
                const newPath = [...currentPath, nodeId];
                if (nodeId === target) return newPath;
                if (node.children && node.children.length > 0) {
                    const found = findPath(node.children, target, newPath);
                    if (found) return found;
                }
            }
            return null;
        };

        // Resolve spouse target → main member's ID in tree hierarchy
        let resolvedTargetId = targetId;
        const targetMember = map[targetId];

        // If target acts as a spouse of a member in the tree, expand their partner's tree instead
        const partner = members.find(m => String(m.id) !== targetId && (
            String(m.spouse_id) === targetId ||
            (m.spouses && m.spouses.some(s => String(s?.id) === targetId)) ||
            (targetMember && String(targetMember.spouse_id) === String(m.id)) ||
            (targetMember?.spouses && targetMember.spouses.some(s => String(s?.id) === String(m.id)))
        ));

        if (partner && (spouseIds.has(targetId) || !findPath(roots, targetId, []))) {
            resolvedTargetId = String(partner.id);
        }

        // Strategy 1: DFS from roots (works when member is properly in hierarchy)
        let path = findPath(roots, resolvedTargetId, []);

        // Strategy 2: If DFS fails (member may be orphaned or mis-classified),
        // walk up via father_id in flat map, then filter to only IDs that exist in the hierarchy
        if (!path || path.length === 0) {
            // Build ancestor chain from flat map
            const ancestorChain = [];
            let curr = map[resolvedTargetId];
            const visited = new Set();
            while (curr && !visited.has(String(curr.id))) {
                visited.add(String(curr.id));
                ancestorChain.unshift(String(curr.id));
                const parentId = String(curr.father_id || curr.fatherId || '');
                curr = parentId && parentId !== '0' ? map[parentId] : null;
            }

            // Now simulate the layer walk — only keep ancestor IDs that the tree can actually render
            if (ancestorChain.length > 0) {
                const validPath = [];
                let currentNodes = roots;
                for (const id of ancestorChain) {
                    const found = currentNodes?.find(n => String(n.id) === id);
                    if (found) {
                        validPath.push(id);
                        currentNodes = found.children || [];
                    }
                    // If not found at this level, skip it (ancestor may be in spouseIds)
                }
                if (validPath.length > 0) path = validPath;
            }
        }

        if (!path || path.length === 0) {
            console.warn('[FamilyTree] autoExpand: could not build path for id=', resolvedTargetId);
            return;
        }

        setActivePathIds(path);

        setTimeout(() => {
            const el = document.getElementById(`node-${resolvedTargetId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
            }
        }, 700);
    }, [autoExpandId, map, members, spouseIds, roots]);

    const handleNodeClick = (node, depth) => {
        const nodeId = String(node.id);
        const isSameNode = String(activePathIds[depth]) === nodeId;
        if (isSameNode) {
            setActivePathIds(activePathIds.slice(0, depth));
        } else {
            const newPath = activePathIds.slice(0, depth);
            newPath.push(nodeId);
            setActivePathIds(newPath);
        }
    };

    const layers = useMemo(() => {
        const _layers = [roots];
        let currentNodes = roots;

        activePathIds.forEach((activeId) => {
            // Use String() on both sides to handle number vs string ID mismatch from API
            const activeNode = currentNodes?.find(n => String(n.id) === String(activeId));
            if (activeNode && activeNode.children && activeNode.children.length > 0) {
                _layers.push(activeNode.children);
                currentNodes = activeNode.children;
            } else {
                currentNodes = [];
            }
        });
        return _layers;
    }, [roots, activePathIds]);

    // Lineage trail (breadcrumb) for the selected path
    const trail = useMemo(() => activePathIds.map((id) => map[String(id)]).filter(Boolean), [activePathIds, map]);

    /* ── Branch curves: parent (bottom-centre) → each child (top-centre) ── */
    const measure = useCallback(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        const base = wrap.getBoundingClientRect();
        const list = [];
        layers.forEach((layerNodes, i) => {
            if (i === 0) return;
            const parentId = String(activePathIds[i - 1]);
            const pEl = slotRefs.current[parentId];
            if (!pEl) return;
            const p = pEl.getBoundingClientRect();
            const sx = p.left + p.width / 2 - base.left;
            const sy = p.bottom - base.top - 10;
            layerNodes.forEach((child, j) => {
                const cEl = slotRefs.current[String(child.id)];
                if (!cEl) return;
                const c = cEl.getBoundingClientRect();
                const ex = c.left + c.width / 2 - base.left;
                const ey = c.top - base.top + 4;
                const dy = Math.max(16, (ey - sy) * 0.6);
                list.push({
                    key: `${parentId}->${child.id}`,
                    d: `M ${sx} ${sy} C ${sx} ${sy + dy}, ${ex} ${ey - dy}, ${ex} ${ey}`,
                    start: { x: sx, y: sy },
                    end: { x: ex, y: ey },
                    onPath: String(activePathIds[i]) === String(child.id),
                    hovered: String(hoverId) === String(child.id),
                    delay: Math.min(j, 10) * 55,
                });
            });
        });
        setEdges({ list, w: wrap.offsetWidth, h: wrap.offsetHeight });
    }, [layers, activePathIds, hoverId]);

    const scheduleMeasure = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(measure);
    }, [measure]);

    useLayoutEffect(() => { measure(); }, [measure]);

    useEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap) return undefined;
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleMeasure) : null;
        ro?.observe(wrap);
        window.addEventListener('resize', scheduleMeasure);
        // Cards settle after their pop-in animation; re-measure once they land
        const late = window.setTimeout(scheduleMeasure, 650);
        return () => {
            ro?.disconnect();
            window.removeEventListener('resize', scheduleMeasure);
            window.clearTimeout(late);
            cancelAnimationFrame(rafRef.current);
        };
    }, [scheduleMeasure]);

    // Centre the selected person in each row, and bring a newly opened row into view
    const prevDepth = useRef(0);
    useEffect(() => {
        activePathIds.forEach((id, i) => {
            const row = rowRefs.current[i];
            const slot = slotRefs.current[String(id)];
            if (row && slot) {
                const left = slot.offsetLeft + slot.offsetWidth / 2 - row.clientWidth / 2;
                row.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
            }
        });
        if (layers.length > prevDepth.current && layers.length > 1) {
            const newRow = rowRefs.current[layers.length - 1];
            window.setTimeout(() => newRow?.closest('[data-ft-row]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 180);
        }
        prevDepth.current = layers.length;
    }, [activePathIds, layers.length]);

    const genOf = (layerNodes, i) => layerNodes[0]?.level || i + 1;

    return (
        <div className="w-full font-sans">
            <TreeStyles />
            <AnimationStyles />

            {/* Person Detail Modal */}
            {selectedPerson && (
                <PersonDetailsModal
                    person={selectedPerson}
                    onClose={() => setSelectedPerson(null)}
                    onEditNode={onEditNode}
                    onDeleteNode={onDeleteNode}
                    onViewDetails={setSelectedPerson}
                    memberMap={map}
                    isAdmin={isAdmin}
                />
            )}

            <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-background shadow-inner">
                {/* Background: dotted grid + warm glow */}
                <div className="absolute inset-0 pointer-events-none text-orange-900/[0.08]"
                    style={{ backgroundImage: 'radial-gradient(currentColor 1.2px, transparent 1.2px)', backgroundSize: '22px 22px' }} />
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[28rem] h-64 rounded-full bg-orange-300/20 blur-3xl pointer-events-none" />

                {/* Toolbar: lineage trail + add root */}
                <div className="relative z-20 flex items-center gap-2 px-3 sm:px-5 pt-3 sm:pt-4">
                    <div className="ft-scroll flex-1 min-w-0 flex items-center gap-1 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActivePathIds([])}
                            className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors
                                ${trail.length === 0 ? 'bg-orange-700 text-white border-transparent' : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300 hover:text-orange-800'}`}
                        >
                            <GitBranch size={12} />
                            {t('বংশধারা', 'Lineage')}
                        </button>
                        {trail.map((p, i) => (
                            <React.Fragment key={p.id}>
                                <ChevronRight size={12} className="shrink-0 text-stone-300" />
                                <button
                                    type="button"
                                    onClick={() => setActivePathIds(activePathIds.slice(0, i + 1))}
                                    className={`shrink-0 max-w-[9rem] truncate px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors
                                        ${i === trail.length - 1 ? 'bg-orange-100 text-orange-900 border-orange-200' : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300'}`}
                                >
                                    {formatName(p)}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                    {isAdmin && onAddRoot && (
                        <button
                            type="button"
                            onClick={() => onAddRoot && onAddRoot()}
                            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-700 to-red-800 text-white text-[11px] sm:text-xs font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all"
                        >
                            <Plus size={13} strokeWidth={2.6} />
                            <span className="hidden sm:inline">{t('মূল সদস্য যোগ করুন', 'Add Root Member')}</span>
                            <span className="sm:hidden">{t('মূল সদস্য', 'Root')}</span>
                        </button>
                    )}
                </div>

                {/* Tree */}
                <div ref={wrapRef} className="relative z-10 pb-6 sm:pb-10">
                    <svg className="absolute left-0 top-0 pointer-events-none" width={edges.w} height={edges.h} aria-hidden="true">
                        <defs>
                            <linearGradient id="ft-grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" style={{ stopColor: 'rgb(var(--tx-orange-500))' }} />
                                <stop offset="100%" style={{ stopColor: 'rgb(var(--tx-amber-400))' }} />
                            </linearGradient>
                            <filter id="ft-glow" x="-50%" y="-20%" width="200%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="b" />
                                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </defs>
                        {edges.list.map((e) => (
                            <g key={e.key}>
                                <path
                                    d={e.d}
                                    pathLength={1}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeWidth={e.onPath ? 2.5 : e.hovered ? 2.2 : 1.5}
                                    stroke={e.onPath ? 'url(#ft-grad)' : undefined}
                                    className={`ft-edge transition-[stroke-width] ${e.onPath ? '' : e.hovered ? 'stroke-orange-500' : 'stroke-orange-300/80'}`}
                                    style={{ animationDelay: `${e.delay}ms` }}
                                />
                                {e.onPath && (
                                    <path d={e.d} fill="none" strokeWidth={3} strokeLinecap="round" className="ft-flow stroke-yellow-300" filter="url(#ft-glow)" />
                                )}
                                <circle cx={e.end.x} cy={e.end.y} r={e.onPath ? 3.5 : 2.5}
                                    className={`ft-dot ${e.onPath ? 'fill-orange-600' : 'fill-orange-300'}`}
                                    style={{ animationDelay: `${e.delay + 450}ms` }} />
                            </g>
                        ))}
                        {edges.list.filter((e, i, arr) => arr.findIndex((x) => x.start.x === e.start.x && x.start.y === e.start.y) === i).map((e) => (
                            <circle key={`o-${e.key}`} cx={e.start.x} cy={e.start.y} r={4} className="ft-dot fill-orange-600" style={{ stroke: 'rgb(var(--surface))' }} strokeWidth={2} />
                        ))}
                    </svg>

                    {roots.length === 0 && (
                        <div className="relative flex flex-col items-center justify-center gap-2 py-16 text-center text-stone-400">
                            <Users className="w-9 h-9 text-orange-200" />
                            <p className="text-sm font-semibold">{t('এই বাড়িতে এখনো কোনো সদস্য যুক্ত হয়নি', 'No members have been added to this home yet')}</p>
                        </div>
                    )}

                    {roots.length > 0 && layers.map((layerNodes, layerIndex) => {
                        const activeNodeId = activePathIds[layerIndex];
                        const hasActiveNode = !!activeNodeId;
                        const gen = genOf(layerNodes, layerIndex);
                        return (
                            <div key={`${layerIndex}-${layerNodes[0]?.id}`} data-ft-row className={`relative ${layerIndex > 0 ? 'mt-5 sm:mt-8' : 'mt-3'}`}>
                                {/* Generation label */}
                                <div className="ft-row relative z-10 flex justify-center mb-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 border border-orange-100 shadow-sm text-[10.5px] sm:text-[11px] font-bold text-stone-500 backdrop-blur-sm">
                                        <Sparkles size={11} className="text-orange-600" />
                                        {isBn ? `প্রজন্ম ${formatNumber(gen)}` : `Generation ${gen}`}
                                        <span className="text-orange-700">· {isBn ? `${formatNumber(layerNodes.length)} জন` : layerNodes.length}</span>
                                    </span>
                                </div>

                                {/* Row (scrolls horizontally on its own) */}
                                <div
                                    ref={(el) => { rowRefs.current[layerIndex] = el; }}
                                    onScroll={scheduleMeasure}
                                    className="ft-scroll relative overflow-x-auto snap-x snap-proximity"
                                >
                                    <div className="flex w-max min-w-full justify-center items-start gap-3 sm:gap-6 px-4 sm:px-8 pt-3">
                                        {layerNodes.map((node, index) => (
                                            <TreeNode
                                                key={node.id}
                                                node={node}
                                                index={index}
                                                isActive={String(activeNodeId) === String(node.id)}
                                                isDimmed={hasActiveNode && String(node.id) !== String(activeNodeId)}
                                                isHovered={String(hoverId) === String(node.id)}
                                                onHover={setHoverId}
                                                slotRef={(el) => { slotRefs.current[String(node.id)] = el; }}
                                                onClick={() => handleNodeClick(node, layerIndex)}
                                                onAddChild={onAddChild}
                                                onViewDetails={setSelectedPerson}
                                                onEditNode={onEditNode}
                                                onDeleteNode={onDeleteNode}
                                                level={node.level || (layerIndex + 1)}
                                                isAdmin={isAdmin}
                                                memberMap={map}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Hint under the deepest row */}
                    {roots.length > 0 && (
                        <p className="relative mt-2 text-center text-[11px] text-stone-400 px-4">
                            {t('কার্ডে চাপ দিলে পরবর্তী প্রজন্ম খুলবে · ছবিতে চাপ দিলে বিস্তারিত', 'Tap a card to open the next generation · tap the photo for details')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FamilyTree;