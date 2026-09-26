import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Plus, X, GraduationCap, Briefcase, MapPin, Droplet, Calendar, Phone, Mail, Award, Landmark, Edit2, Trash2, Building, Link, Facebook, Twitter, Instagram, Linkedin, Globe, Heart, Sparkles } from 'lucide-react';
import api from '../api/api';

/* ANIMATION STYLES */
const AnimationStyles = () => (
    <style>{`
        @keyframes drawVertical {
            from { height: 0; opacity: 0; }
            to { height: 100%; opacity: 1; }
        }
        @keyframes expandWidth {
            from { width: 0; opacity: 0; }
            to { width: 100%; opacity: 1; }
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
const PersonDetailsModal = ({ person, onClose, onEditNode, onDeleteNode, onViewDetails, memberMap }) => {
    const [activeSpouse, setActiveSpouse] = useState(null);
    const [spouseData, setSpouseData] = useState(null);
    const [loadingSpouse, setLoadingSpouse] = useState(false);

    useEffect(() => {
        setActiveSpouse(null);
        setSpouseData(null);
    }, [person]);

    if (!person) return null;

    const handleOpenSpouse = async (s) => {
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-stone-950/80 backdrop-blur-md" onClick={onClose}>
            <div
                className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-modal relative max-h-[90vh] md:h-[620px] flex flex-col md:flex-row"
                onClick={e => e.stopPropagation()}
            >
                {/* Main Card Content (Blurred when activeSpouse is open) */}
                <div className={`w-full h-full flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden transition-all duration-300 ${activeSpouse ? 'filter blur-[6px] opacity-30 pointer-events-none select-none scale-[0.98]' : ''}`}>
                <div className="md:w-1/3 bg-gradient-to-br from-orange-700 to-orange-900 p-5 sm:p-8 text-white flex flex-col items-center justify-center relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                    <div className="relative mb-4 sm:mb-6 flex flex-col items-center">
                        {person.eminent_category && (
                            <div className="mb-3 sm:mb-4 z-20 flex items-center gap-1.5 bg-green-100 text-green-800 border-2 border-white rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] shadow-xl whitespace-nowrap">
                                <Award size={10} className="sm:size-3 text-green-600" />
                                {person.eminent_category}
                            </div>
                        )}
                        <div className="relative">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white/30 p-1 shadow-2xl relative z-10 mx-auto">
                                <div className="w-full h-full rounded-full overflow-hidden bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    {person.profile_image_url ? (
                                        <img src={person.profile_image_url} alt={person.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={48} className="sm:size-16 text-white/40" />
                                    )}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-orange-900 text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-full shadow-lg uppercase tracking-tighter z-20 whitespace-nowrap">
                                Gen {person.level}
                            </div>
                        </div>
                    </div>
                    <div className="text-center relative z-10">
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-2 text-white leading-tight">
                            {person.name_bangla || person.full_name}
                        </h2>
                        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-6">
                            <div className="h-px w-4 sm:w-6 bg-orange-300/50"></div>
                            <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-orange-200">ID: {person.id}</p>
                            <div className="h-px w-4 sm:w-6 bg-orange-300/50"></div>
                        </div>
                    </div>
                </div>

                <div className="md:w-2/3 p-5 sm:p-8 md:p-10 bg-white relative flex flex-col min-h-0 overflow-hidden">
                    <button onClick={onClose} className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-all z-10">
                        <X size={18} />
                    </button>

                    <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-3.5 sm:gap-y-4 mt-2 sm:mt-4 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Left Column: Personal Info */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9a3412] border-b border-stone-100 pb-2 mb-4">Personal Info</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <InfoItem icon={<Calendar size={14} />} label="Birth Date" value={
                                    <React.Fragment>
                                        {person.birth_date ? new Date(person.birth_date).toLocaleDateString() : 'Unknown'}
                                        {person.alive === false && person.death_date && (
                                            <span className="text-stone-400 font-normal"> — {new Date(person.death_date).toLocaleDateString()}</span>
                                        )}
                                    </React.Fragment>
                                } color="orange" />
                                <InfoItem icon={<Briefcase size={14} />} label="Current Occupation" value={person.occupation} color="orange" />
                                <InfoItem icon={<Building size={14} />} label="Workplace" value={person.workplace} color="orange" />
                                <InfoItem icon={<GraduationCap size={14} />} label="Educational background" value={person.education} color="orange" />
                                <InfoItem icon={<Droplet size={14} />} label="Blood Group" value={person.blood_group} highlight color="red" />
                                <InfoItem icon={<MapPin size={14} />} label="Ancestral Village" value={person.village || person.location} color="orange" />
                                <InfoItem icon={<MapPin size={14} />} label="Current Location" value={person.present_address} color="orange" />
                            </div>
                        </div>

                        {/* Right Column: Contact & Family */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9a3412] border-b border-stone-100 pb-2 mb-4">Contact & Family</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <InfoItem icon={<Phone size={14} />} label="Contact Number" value={person.contact_number} color="yellow" />
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
                                        label="Social Media"
                                        value={<a href={person.social_media.startsWith('http') ? person.social_media : `https://${person.social_media}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">Visit Profile</a>}
                                    />
                                ) : (
                                    <InfoItem icon={<Link size={14} />} label="Social Media" value="N/A" color="yellow" />
                                )}

                                {/* Spouse Field */}
                                <InfoItem
                                    icon={<Heart size={14} />}
                                    label="Spouse"
                                    color="pink"
                                    value={
                                        person.spouses && person.spouses.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {person.spouses.filter((s, i, a) => a.findIndex(t => String(t.id) === String(s.id)) === i).map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => handleOpenSpouse(s)}
                                                        className="text-pink-700 hover:text-pink-900 font-bold hover:underline bg-pink-50 border border-pink-100 hover:border-pink-300 px-2 py-0.5 rounded-lg text-[9px] transition-all flex items-center gap-1 active:scale-95 shadow-2xs hover:shadow-xs"
                                                    >
                                                        <div className="w-4 h-4 rounded-full overflow-hidden bg-white shrink-0 ring-1 ring-pink-300">
                                                            {s.profile_image_url ? (
                                                                <img src={s.profile_image_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User size={8} className="m-auto opacity-30 text-pink-500" />
                                                            )}
                                                        </div>
                                                        <span>{s.name_bangla || s.full_name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : "N/A"
                                    }
                                />

                                <InfoItem
                                    icon={<User size={14} />}
                                    label="Parents"
                                    color="stone"
                                    value={
                                        <div className="flex flex-col gap-1.5 mt-0.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded font-black shrink-0">F</span>
                                                <span className="truncate text-stone-700">
                                                    {(person.father_id && memberMap && memberMap[String(person.father_id)]?.name_bangla) || person.father_name_bangla || (person.father_id && memberMap && memberMap[String(person.father_id)]?.full_name) || person.father_name || 'Unknown'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-[8px] bg-pink-100 text-pink-700 px-1 rounded font-black shrink-0">M</span>
                                                <span className="truncate text-stone-700">
                                                    {(person.mother_id && memberMap && memberMap[String(person.mother_id)]?.name_bangla) || person.mother_name_bangla || (person.mother_id && memberMap && memberMap[String(person.mother_id)]?.full_name) || person.mother_name || 'Unknown'}
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

                {/* Overlaid Cute Female Spouse Profile Card */}
                {activeSpouse && (
                    <div
                        className="fixed inset-0 z-[120] bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
                        onClick={() => setActiveSpouse(null)}
                    >
                        <div
                            className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#fff6f7] via-white to-[#fff0f3] rounded-3xl shadow-2xl border-2 border-pink-200 p-4 sm:p-6 relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto custom-scrollbar"
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
                                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full p-1 bg-gradient-to-tr from-pink-400 via-rose-300 to-amber-200 shadow-md shadow-pink-500/15">
                                        <div className="w-full h-full rounded-full overflow-hidden bg-rose-50 flex items-center justify-center">
                                            {(spouseData?.profile_image_url || activeSpouse.profile_image_url) ? (
                                                <img
                                                    src={spouseData?.profile_image_url || activeSpouse.profile_image_url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-pink-100 to-rose-50 text-rose-400">
                                                    <User size={30} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-1 rounded-full shadow-md border-2 border-white">
                                        <Heart size={9} className="fill-white" />
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1 pr-6">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-100/80 border border-pink-200 text-rose-700 text-[10px] font-bold tracking-wide mb-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                        <span>সহধর্মিণী / Spouse</span>
                                    </div>
                                    <h3 className="text-xl font-serif font-bold text-stone-900 leading-tight truncate">
                                        {spouseData?.name_bangla || activeSpouse.name_bangla || spouseData?.full_name || activeSpouse.full_name}
                                    </h3>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="space-y-2.5 relative z-10">
                                {/* Profession & Workplace */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white/90 p-2.5 rounded-2xl border border-pink-100 shadow-2xs">
                                        <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1 mb-0.5">
                                            <Briefcase size={11} className="text-rose-500" /> পেশা
                                        </span>
                                        <p className="font-bold text-stone-800 truncate" title={spouseData?.occupation || 'N/A'}>
                                            {loadingSpouse && !spouseData ? 'Loading...' : (spouseData?.occupation || 'গৃহিণী / Housewife')}
                                        </p>
                                    </div>

                                    <div className="bg-white/90 p-2.5 rounded-2xl border border-pink-100 shadow-2xs">
                                        <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1 mb-0.5">
                                            <Building size={11} className="text-rose-500" /> কর্মস্থল
                                        </span>
                                        <p className="font-bold text-stone-800 truncate" title={spouseData?.workplace || 'N/A'}>
                                            {loadingSpouse && !spouseData ? 'Loading...' : (spouseData?.workplace || 'N/A')}
                                        </p>
                                    </div>
                                </div>

                                {/* Contact & Social Media */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white/90 p-2.5 rounded-2xl border border-pink-100 shadow-2xs">
                                        <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1 mb-0.5">
                                            <Phone size={11} className="text-rose-500" /> যোগাযোগ
                                        </span>
                                        {spouseData?.contact_number ? (
                                            <a href={`tel:${spouseData.contact_number}`} className="font-bold text-rose-700 hover:underline truncate block">
                                                {spouseData.contact_number}
                                            </a>
                                        ) : (
                                            <p className="text-stone-400 font-medium">N/A</p>
                                        )}
                                    </div>

                                    <div className="bg-white/90 p-2.5 rounded-2xl border border-pink-100 shadow-2xs">
                                        <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1 mb-0.5">
                                            <Globe size={11} className="text-rose-500" /> সোশ্যাল মিডিয়া
                                        </span>
                                        {spouseData?.social_media ? (
                                            <a
                                                href={spouseData.social_media.startsWith('http') ? spouseData.social_media : `https://${spouseData.social_media}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-rose-700 hover:text-rose-900 hover:underline truncate block"
                                            >
                                                Visit Profile
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
                                            Blood
                                        </span>
                                        <span className="font-extrabold text-rose-700 text-xs">
                                            {spouseData?.blood_group || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="bg-white/90 p-2 rounded-2xl border border-pink-100 shadow-2xs text-center">
                                        <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider block mb-0.5">
                                            Education
                                        </span>
                                        <span className="font-bold text-stone-800 text-[11px] truncate block" title={spouseData?.education || 'N/A'}>
                                            {spouseData?.education || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="bg-white/90 p-2 rounded-2xl border border-pink-100 shadow-2xs text-center">
                                        <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider block mb-0.5">
                                            Birth Date
                                        </span>
                                        <span className="font-bold text-stone-700 text-[10px] truncate block">
                                            {spouseData?.birth_date ? new Date(spouseData.birth_date).toLocaleDateString() : 'Unknown'}
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
                                            পিতা-মাতা / Parents
                                        </span>
                                        <div className="flex flex-col gap-1 text-[11px] text-stone-700">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded font-bold">F</span>
                                                <span className="truncate font-medium">
                                                    {spouseData.father_name || memberMap?.[String(spouseData.father_id)]?.full_name || 'Unknown'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] bg-pink-100 text-pink-700 px-1 rounded font-bold">M</span>
                                                <span className="truncate font-medium">
                                                    {spouseData.mother_name || memberMap?.[String(spouseData.mother_id)]?.full_name || 'Unknown'}
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
                                    className="px-3.5 py-1.5 bg-pink-50 hover:bg-pink-100 text-rose-800 text-xs font-bold rounded-xl transition active:scale-95 flex items-center gap-1 border border-pink-200"
                                >
                                    <X size={13} />
                                    <span>Close</span>
                                </button>
                                {onViewDetails && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const sp = spouseData || activeSpouse;
                                            setActiveSpouse(null);
                                            onViewDetails(sp);
                                        }}
                                        className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-700 hover:to-pink-800 text-white text-xs font-bold rounded-xl transition shadow-md shadow-rose-900/10 active:scale-95 flex items-center gap-1.5"
                                    >
                                        <span>Full Profile</span>
                                        <Sparkles size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* SPOUSE DETAILS MODAL (Screenshot Style) */
const SpouseDetailsModal = ({ person: initialPerson, onClose, onViewTree, onViewDetails, memberMap }) => {
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

    const fatherName = person.father_id && memberMap ? memberMap[String(person.father_id)]?.full_name : person.father_name;
    const motherName = person.mother_id && memberMap ? memberMap[String(person.mother_id)]?.full_name : person.mother_name;

    const SpouseInfoItem = ({ icon, label, value, onClick }) => (
        <div className={`flex items-start gap-4 mb-6 ${onClick ? 'cursor-pointer group' : ''}`} onClick={onClick}>
            <div className={`mt-1 text-[#9a3412] shrink-0 ${onClick ? 'group-hover:scale-110 transition-transform' : ''}`}>
                {icon}
            </div>
            <div>
                <p className="text-stone-400 text-xs font-semibold mb-0.5">{label}</p>
                <p className={`text-stone-800 font-bold text-sm leading-tight ${onClick ? 'group-hover:text-[#9a3412]' : ''}`}>
                    {value || (loading ? 'Loading...' : 'N/A')}
                </p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-[#9a3412] h-28 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                    <button
                        onClick={() => onViewTree(person)}
                        className="absolute top-4 right-14 bg-white text-[#9a3412] px-3 py-1 rounded-full text-[10px] font-bold shadow-md hover:bg-orange-50 transition-colors uppercase tracking-wider"
                    >
                        View Tree
                    </button>
                    <div className="absolute top-10 left-1/2 -translate-x-1/2">
                        <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden bg-orange-100 shadow-xl">
                            {person.profile_image_url ? (
                                <img src={person.profile_image_url} alt={person.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User size={48} className="text-[#9a3412]/30" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Name and Location */}
                <div className="mt-14 text-center px-6">
                    <h2 className="text-2xl font-serif font-bold text-[#9a3412]">{person.name_bangla || person.full_name}</h2>
                    <div className="flex items-center justify-center gap-1.5 text-stone-500 text-sm mt-1">
                        <MapPin size={14} className="text-[#9a3412]" />
                        <span>{person.village || person.location || 'N/A'}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 grid grid-cols-2 gap-8 mt-4">
                    {/* Left Column: Personal Info */}
                    <div>
                        <h3 className="text-[#9a3412] font-serif font-bold text-lg border-b border-stone-100 pb-2 mb-6">Personal Info</h3>
                        <SpouseInfoItem icon={<Briefcase size={18} />} label="Occupation" value={person.occupation} />
                        <SpouseInfoItem icon={<Building size={18} />} label="Workplace" value={person.workplace} />
                        <SpouseInfoItem icon={<GraduationCap size={18} />} label="Education" value={person.education} />
                        <SpouseInfoItem icon={<Droplet size={18} />} label="Blood Group" value={person.blood_group} />
                        <SpouseInfoItem icon={<Calendar size={18} />} label="Birth Date" value={person.dob || person.birth_date} />
                    </div>

                    {/* Right Column: Contact & Family */}
                    <div>
                        <h3 className="text-[#9a3412] font-serif font-bold text-lg border-b border-stone-100 pb-2 mb-6">Contact & Family</h3>
                        <SpouseInfoItem icon={<Phone size={18} />} label="Phone" value={person.contact_number} />
                        <SpouseInfoItem icon={<MapPin size={18} />} label="Address" value={person.present_address} />
                        {person.social_media && (
                            <SpouseInfoItem
                                icon={<Globe size={18} />}
                                label="Social Media"
                                value={
                                    <a
                                        href={person.social_media.startsWith('http') ? person.social_media : `https://${person.social_media}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                    >
                                        Visit Profile
                                    </a>
                                }
                            />
                        )}
                        {/* Partner Link */}
                        {person.spouses && person.spouses.length > 0 && (
                            <div className="mb-6">
                                <p className="text-stone-400 text-xs font-semibold mb-2 uppercase tracking-wider">Partner</p>
                                <div className="flex flex-wrap gap-2">
                                    {person.spouses.filter((s, i, a) => a.findIndex(t => String(t.id) === String(s.id)) === i).map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                const fullPartner = memberMap && memberMap[String(s.id)];
                                                onViewDetails(fullPartner || s, 'member');
                                            }}
                                            className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-all group"
                                        >
                                            <div className="w-5 h-5 rounded-full overflow-hidden bg-white shrink-0 group-hover:scale-110 transition-transform">
                                                {s.profile_image_url ? (
                                                    <img src={s.profile_image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={12} className="m-auto opacity-30" />
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-orange-900">{s.full_name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <SpouseInfoItem
                            icon={<User size={18} />}
                            label="Parents"
                            value={
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1 rounded font-black shrink-0">Father</span>
                                        <span className="truncate">{fatherName || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] bg-pink-50 text-pink-600 px-1 rounded font-black shrink-0">Mother</span>
                                        <span className="truncate">{motherName || 'Unknown'}</span>
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

/* TreeNode Component */
const TreeNode = ({ node, isActive, isDimmed, onClick, onAddChild, onViewDetails, onEditNode, onDeleteNode, level, index, className, isAdmin }) => {
    const nodeRef = useRef(null);
    const hasChildren = node.children && node.children.length > 0;
    const childrenCount = node.children ? node.children.length : 0;

    useEffect(() => {
        if (isActive && nodeRef.current) {
            setTimeout(() => {
                nodeRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
            }, 300);
        }
    }, [isActive]);

    const staggerStyle = {
        animationDelay: `${0.2 + (index * 0.05)}s`,
        opacity: 0
    };

    return (
        <div
            ref={nodeRef}
            className={`flex flex-col items-center relative ${level > 1 ? 'pt-12' : 'pt-2'} pb-6 animate-unfold origin-top shrink-0 ${className || ''}`}
            style={staggerStyle}
        >
            {/* Connector Line UP - Extends up to meet the horizontal bus */}
            {level > 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-[1px] w-[2px] h-full bg-orange-300 origin-top z-0 max-h-8 sm:max-h-12"></div>
            )}

            {/* CARD */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                className={`
                    group relative z-30 flex flex-col items-center w-32 sm:w-44 pt-2.5 sm:pt-4 pb-3 sm:pb-6
                    bg-white rounded-xl sm:rounded-2xl cursor-pointer 
                    transition-all duration-400 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                    border mb-0
                    ${isActive
                        ? 'border-orange-500 ring-4 ring-orange-500/10 shadow-xl -translate-y-2 scale-105 z-50'
                        : isDimmed
                            ? 'border-stone-200 opacity-50 scale-95 grayscale-[0.8] hover:grayscale-0 hover:opacity-100 hover:scale-100'
                            : 'border-stone-200 shadow-sm hover:border-orange-300 hover:shadow-md hover:-translate-y-1'
                    }
                `}
            >
                {/* Active Indicator Top Strip - ONLY for Level > 1 */}
                {isActive && level > 1 && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-1 bg-orange-500 rounded-b-full"></div>
                )}

                {/* Edit & Delete Actions (Always Visible on Top Right) */}
                <div className="absolute top-1.5 right-1.5 flex gap-0.5 sm:gap-1 z-50">
                    {isAdmin && onDeleteNode && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNode(node);
                            }}
                            className="p-1 sm:p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Member"
                        >
                            <Trash2 size={12} className="sm:size-[14px]" />
                        </button>
                    )}
                    {isAdmin && onEditNode && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditNode(node);
                            }}
                            className="p-1 sm:p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                            title="Edit Member"
                        >
                            <Edit2 size={12} className="sm:size-[14px]" />
                        </button>
                    )}
                </div>

                {/* Profile Picture */}
                <div
                    className="relative mb-2 sm:mb-3 group/avatar"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onViewDetails) onViewDetails(node, 'member');
                    }}
                >
                    <div className={`
                        relative w-10 h-10 sm:w-16 sm:h-16 rounded-full p-1 transition-all duration-500
                        ${isActive ? 'bg-gradient-to-tr from-orange-500 to-yellow-500' : 'bg-stone-100 group-hover/avatar:bg-orange-200'}
                    `}>
                        <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white">
                            {node.profile_image_url ? (
                                <img src={node.profile_image_url} alt={node.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-stone-50 text-stone-300">
                                    <User size={18} className="sm:size-6" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={`
                        absolute -bottom-2 left-1/2 -translate-x-1/2 text-[6px] sm:text-[9px] font-bold px-1 sm:px-2 py-0.5 rounded-full border shadow-sm whitespace-nowrap z-10 transition-colors
                        ${isActive ? 'bg-orange-600 text-white border-orange-500' : 'bg-white text-stone-500 border-stone-200'}
                    `}>
                        G{node.level || level}
                    </div>
                </div>

                {/* Basic Identity Info */}
                <div className="w-full flex flex-col items-center text-center px-1.5">
                    <h3 className={`text-xs sm:text-sm font-serif font-bold leading-tight w-full truncate mb-0.5 transition-colors ${isActive ? 'text-orange-900' : 'text-stone-800'}`}>
                        {node.name_bangla || node.full_name}
                    </h3>
                    <div className="text-[9px] font-medium text-stone-400 uppercase tracking-wide">
                        {childrenCount > 0 ? `${childrenCount} Children` : 'No Children'}
                    </div>
                </div>

                {node.eminent_category && (
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-yellow-50 text-yellow-700 border border-yellow-200 text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap z-20">
                        <Award size={8} className="text-yellow-600" />
                        {node.eminent_category}
                    </div>
                )}

                {/* Centered Add Button */}
                {isAdmin && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onAddChild) onAddChild(node);
                        }}
                        className={`
                        absolute -bottom-4 left-1/2 -translate-x-1/2
                        w-8 h-8 rounded-full flex items-center justify-center
                        border-2 border-white shadow-md transition-transform duration-300 hover:scale-110 active:scale-95
                        ${isActive ? 'bg-orange-600 text-white' : 'bg-stone-50 text-stone-400 hover:bg-orange-100 hover:text-orange-600'}
                    `}
                        title="Add Child"
                    >
                        <Plus size={16} strokeWidth={3} />
                    </button>
                )}
            </div>

            {/* Connector Line DOWN - Extends down to touch the horizontal bus of next layer */}
            {isActive && hasChildren && (
                <div className="absolute bottom-0 left-1/2 -translate-x-[1px] w-[2px] h-10 bg-orange-400 z-0 animate-draw-v origin-top"></div>
            )}
        </div>
    );
};

/* Main Component */
const FamilyTree = ({ members, onAddChild, onAddRoot, onEditNode, onDeleteNode, onViewDetails, isAdmin }) => {
    const [activePathIds, setActivePathIds] = useState([]);
    const [selectedPerson, setSelectedPerson] = useState(null);

    // Transform Flat List to Hierarchy
    const { roots, map } = useMemo(() => {
        if (!members) {
            return { roots: [], map: {} };
        }

        const map = {};
        const roots = [];
        const spouseIds = new Set();

        members.forEach(member => {
            map[String(member.id)] = { ...member, children: [] };
            // Collect all IDs that are spouses or mothers (should not be roots)
            if (member.spouse_id) spouseIds.add(String(member.spouse_id));
            if (member.mother_id) spouseIds.add(String(member.mother_id));
            if (member.motherId) spouseIds.add(String(member.motherId));
            if (member.spouses) {
                member.spouses.forEach(s => {
                    if (s && s.id) spouseIds.add(String(s.id));
                });
            }
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

        // Now sort the constructed arrays chronologically by created_at to guarantee left-to-right order
        members.forEach(member => {
            const memberNode = map[String(member.id)];
            if (memberNode && memberNode.children.length > 0) {
                // Sort children by created_at to maintain insertion order left-to-right
                memberNode.children.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            }
        });

        return {
            roots: roots.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
            map: map
        };
    }, [members]);

    const handleNodeClick = (node, depth) => {
        const isSameNode = activePathIds[depth] === node.id;
        if (isSameNode) {
            setActivePathIds(activePathIds.slice(0, depth));
        } else {
            const newPath = activePathIds.slice(0, depth);
            newPath.push(node.id);
            setActivePathIds(newPath);
        }
    };

    const layers = useMemo(() => {
        const _layers = [roots];
        let currentNodes = roots;

        activePathIds.forEach((activeId) => {
            const activeNode = currentNodes?.find(n => n.id === activeId);
            if (activeNode && activeNode.children && activeNode.children.length > 0) {
                _layers.push(activeNode.children);
                currentNodes = activeNode.children;
            } else {
                currentNodes = [];
            }
        });
        return _layers;
    }, [roots, activePathIds]);

    return (
        <div className="min-h-screen bg-[#fffcf5] p-2 sm:p-4 md:p-8 font-sans flex flex-col items-center overflow-x-hidden">
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
                />
            )}

            {/* Background Pattern */}
            <div className="fixed inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#9a3412 1px, transparent 1px), linear-gradient(90deg, #9a3412 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Header */}
            <div className="relative z-10 text-center mb-6 sm:mb-10 mt-2 sm:mt-4 animate-unfold">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/50 border border-orange-200 text-orange-800 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mb-2 sm:mb-3 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span>
                    Ancestral Record System
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-1 sm:mb-2">Ancestral Lineage</h1>
                <p className="text-stone-500 text-xs sm:text-sm max-w-[280px] sm:max-w-md mx-auto mb-6 sm:mb-8 tracking-tight">Explore the living history across generations.</p>

                {isAdmin && (
                    <button
                        onClick={() => onAddRoot && onAddRoot()}
                        className="group relative inline-flex items-center gap-2 px-8 py-3 bg-orange-800 hover:bg-orange-700 text-white font-bold rounded-full shadow-lg transition-all active:scale-95 text-sm uppercase tracking-widest overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <Plus size={18} strokeWidth={3} className="relative z-10" />
                        <span className="relative z-10">Add Root Member</span>
                    </button>
                )}
            </div>

            {/* Tree Content Area */}
            <div className="w-full flex flex-col gap-0 pb-32">
                {layers.map((layerNodes, layerIndex) => {
                    const activeNodeId = activePathIds[layerIndex];
                    const hasActiveNode = !!activeNodeId;

                    return (
                        <div key={layerIndex} className="flex flex-col items-center relative w-full mb-0 overflow-visible">

                            {/* Horizontal Bus Line - Fixed 80% Width across screen */}
                            {layerIndex > 0 && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-orange-300 z-0 opacity-80 rounded-full animate-expand-w"></div>
                            )}

                            {/* Gen Row Container */}
                            <div className="w-full relative group p-0 overflow-visible">
                                <div className="gen-row-scroll flex flex-nowrap justify-start overflow-x-auto p-0 min-h-[160px] relative z-10 scroll-smooth px-8 sm:px-16">

                                    {/* Content Wrapper - w-fit mx-auto for centering, flex-nowrap for row */}
                                    <div className="w-fit mx-auto flex flex-nowrap gap-x-6 items-start relative pt-0">

                                        {layerNodes.map((node, index) => (
                                            <TreeNode
                                                key={node.id}
                                                node={node}
                                                index={index}
                                                isActive={activeNodeId === node.id}
                                                isDimmed={hasActiveNode && node.id !== activeNodeId}
                                                onClick={() => handleNodeClick(node, layerIndex)}
                                                onAddChild={onAddChild}
                                                onViewDetails={setSelectedPerson}
                                                onEditNode={onEditNode}
                                                onDeleteNode={onDeleteNode}
                                                level={node.level || (layerIndex + 1)}
                                                isAdmin={isAdmin}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FamilyTree;