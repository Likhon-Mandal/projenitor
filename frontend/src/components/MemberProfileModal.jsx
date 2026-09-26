import React, { useState, useEffect } from 'react';
import { X, MapPin, Briefcase, Calendar, Droplet, User, Edit, Trash2, Heart, Plus, Building, Phone, Globe, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const MemberProfileModal = ({ member: initialMember, isOpen, onClose, onEdit, onDelete, onAddSpouse }) => {
    const { isAdmin } = useAuth();
    const [member, setMember] = useState(initialMember);
    const [loading, setLoading] = useState(false);
    const [activeSpouse, setActiveSpouse] = useState(null);
    const [spouseData, setSpouseData] = useState(null);
    const [loadingSpouse, setLoadingSpouse] = useState(false);

    useEffect(() => {
        if (initialMember) {
            setMember(initialMember);
        }
        if (isOpen && initialMember?.id) {
            fetchFullDetails(initialMember.id);
        }
        setActiveSpouse(null);
        setSpouseData(null);
    }, [isOpen, initialMember]);

    const handleOpenSpouse = async (s) => {
        setActiveSpouse(s);
        setSpouseData(s);
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

    const fetchFullDetails = async (id) => {
        try {
            setLoading(true);
            const res = await api.get(`/members/${id}`);
            setMember(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching member details:', err);
            setLoading(false);
        }
    };

    if (!isOpen || !member) return null;

    return (
        <div 
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-md"
                    title="Close"
                >
                    <X size={18} />
                </button>

                {/* Main Card Content (Blurred when activeSpouse is open) */}
                <div className={`transition-all duration-300 ${activeSpouse ? 'filter blur-[5px] opacity-35 pointer-events-none select-none scale-[0.98]' : ''}`}>
                    {/* Header / Cover */}
                    <div className="h-24 bg-gradient-to-br from-orange-800 via-orange-700 to-red-900 relative">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                    </div>

                    {/* Profile Content */}
                    <div className="px-6 pb-6 relative">
                        {/* Avatar */}
                        <div className="-mt-12 mb-4 flex justify-between items-end">
                            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-orange-50 overflow-hidden flex-shrink-0">
                                {member.profile_image_url ? (
                                    <img
                                        src={member.profile_image_url}
                                        alt={member.full_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-orange-800 opacity-50">
                                        <User size={40} />
                                    </div>
                                )}
                            </div>

                            {/* Actions Suite */}
                            <div className="flex gap-2 items-center mb-2">
                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={() => {
                                                onEdit(member);
                                                onClose();
                                            }}
                                            className="p-2 bg-stone-100 text-stone-600 rounded-full hover:bg-orange-100 hover:text-orange-700 transition-colors shadow-sm"
                                            title="Edit Profile"
                                        >
                                            <Edit size={16} />
                                        </button>

                                        {onDelete && (
                                            <button
                                                onClick={() => {
                                                    onDelete(member);
                                                    onClose();
                                                }}
                                                className="p-2 border border-red-100 text-red-500 bg-white rounded-full hover:bg-red-50 transition-colors shadow-sm"
                                                title="Delete Member"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="mb-4">
                            <h2 className="text-xl font-serif font-bold text-stone-900 leading-tight">
                                {member.name_bangla || member.full_name}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 text-orange-700 font-medium mt-1.5">
                                {member.occupation && (
                                    <span className="flex items-center gap-1 text-xs uppercase tracking-wide">
                                        <Briefcase size={12} /> {member.occupation}
                                    </span>
                                )}
                                {member.workplace && (
                                    <span className="flex items-center gap-1 text-xs text-stone-500 font-normal">
                                        <Building size={12} className="text-stone-400" /> {member.workplace}
                                    </span>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-4 text-center text-stone-400 text-sm animate-pulse">Updating details...</div>
                        ) : (
                            <>
                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                                        <div className="text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-0.5 flex items-center gap-1">
                                            <Droplet size={8} /> Blood
                                        </div>
                                        <div className="text-stone-800 font-bold text-sm">{member.blood_group || 'N/A'}</div>
                                    </div>
                                    <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                                        <div className="text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-0.5 flex items-center gap-1">
                                            <MapPin size={8} /> Location
                                        </div>
                                        <div className="text-stone-800 font-bold text-sm truncate" title={member.home_name}>
                                            {member.home_name || 'Unknown'}
                                        </div>
                                    </div>
                                    {member.contact_number && (
                                        <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                                            <div className="text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-0.5 flex items-center gap-1">
                                                <Phone size={8} /> Phone
                                            </div>
                                            <div className="text-stone-800 font-bold text-xs truncate">
                                                <a href={`tel:${member.contact_number}`} className="hover:text-orange-700 transition">
                                                    {member.contact_number}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {member.social_media && (
                                        <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                                            <div className="text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-0.5 flex items-center gap-1">
                                                <Globe size={8} /> Social Media
                                            </div>
                                            <div className="text-stone-800 font-bold text-xs truncate">
                                                <a
                                                    href={member.social_media.startsWith('http') ? member.social_media : `https://${member.social_media}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    Visit Profile
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    <div className="bg-stone-50 p-2 rounded-xl border border-stone-100 col-span-2">
                                        <div className="text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-0.5 flex items-center gap-1">
                                            <Calendar size={8} /> Born
                                        </div>
                                        <div className="text-stone-800 font-bold text-sm">
                                            {member.birth_date ? new Date(member.birth_date).toLocaleDateString() : 'Unknown'}
                                            {member.alive === false && member.death_date && (
                                                <span className="text-stone-400 font-normal"> — {new Date(member.death_date).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Spouses / Swami Section */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-[10px] uppercase font-bold text-stone-500 tracking-widest flex items-center gap-1">
                                            <Heart size={10} className="text-rose-500 fill-rose-500" /> {member.gender === 'Female' ? 'স্বামী' : 'সহধর্মিণী'}
                                        </h3>
                                        {isAdmin && onAddSpouse && member.gender !== 'Female' && (
                                            <button
                                                type="button"
                                                onClick={() => onAddSpouse(member)}
                                                className="text-[10px] text-orange-600 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                                            >
                                                <Plus size={10} /> ADD SPOUSE
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {((member.spouses && member.spouses.length > 0) ? member.spouses : (member.partners || [])).filter((s, i, a) => a.findIndex(t => String(t.id) === String(s.id)) === i).length > 0 ? (
                                            ((member.spouses && member.spouses.length > 0) ? member.spouses : (member.partners || [])).filter((s, i, a) => a.findIndex(t => String(t.id) === String(s.id)) === i).map(spouse => (
                                                <button
                                                    key={spouse.id}
                                                    type="button"
                                                    onClick={() => handleOpenSpouse(spouse)}
                                                    className="flex items-center gap-2 bg-pink-50/70 border border-pink-200/80 px-3 py-1.5 rounded-full hover:bg-pink-100 transition-colors group active:scale-95 shadow-2xs cursor-pointer"
                                                >
                                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-white ring-1 ring-pink-300">
                                                        {spouse.profile_image_url ? (
                                                            <img src={spouse.profile_image_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={12} className="m-auto text-pink-400" />
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-bold text-pink-900 group-hover:text-rose-700">{spouse.name_bangla || spouse.full_name}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <span className="text-xs text-stone-400 italic">
                                                {member.gender === 'Female' ? 'স্বামীর তথ্য নেই' : 'সহধর্মিণীর তথ্য নেই'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Bio */}
                                {member.bio && (
                                    <div className="text-xs text-stone-600 leading-relaxed italic border-t pt-3">
                                        "{member.bio}"
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Overlaid Cute Female Spouse Profile Card */}
                {activeSpouse && (
                    <div
                        className="fixed inset-0 z-[160] bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200"
                        onClick={() => setActiveSpouse(null)}
                    >
                        <div
                            className="w-full max-w-sm bg-gradient-to-b from-[#fff6f7] via-white to-[#fff0f3] rounded-3xl shadow-2xl border-2 border-pink-200 p-4 sm:p-5 relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto custom-scrollbar"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Decorative background glow */}
                            <div className="absolute -top-10 -right-10 w-28 h-28 bg-pink-300/25 rounded-full blur-xl pointer-events-none"></div>
                            <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-rose-200/25 rounded-full blur-xl pointer-events-none"></div>

                            {/* Close Button */}
                            <button
                                onClick={() => setActiveSpouse(null)}
                                className="absolute top-3 right-3 z-20 p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-100/70 rounded-full transition-all active:scale-90 shadow-2xs"
                                title="Close"
                            >
                                <X size={15} />
                            </button>

                            {/* Cute Female Profile Header */}
                            <div className="flex items-center gap-3 mb-3.5 relative z-10">
                                <div className="relative shrink-0">
                                    <div className="w-14 h-14 rounded-full p-1 bg-gradient-to-tr from-pink-400 via-rose-300 to-amber-200 shadow-md shadow-pink-500/15">
                                        <div className="w-full h-full rounded-full overflow-hidden bg-rose-50 flex items-center justify-center">
                                            {(spouseData?.profile_image_url || activeSpouse.profile_image_url) ? (
                                                <img
                                                    src={spouseData?.profile_image_url || activeSpouse.profile_image_url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-pink-100 to-rose-50 text-rose-400">
                                                    <User size={24} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-0.5 rounded-full shadow-md border-2 border-white">
                                        <Heart size={8} className="fill-white" />
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1 pr-5">
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-100/80 border border-pink-200 text-rose-700 text-[9px] font-bold tracking-wide mb-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                        <span>{(activeSpouse?.gender === 'Male' || member.gender === 'Female') ? 'স্বামী' : 'সহধর্মিণী'}</span>
                                    </div>
                                    <h3 className="text-lg font-serif font-bold text-stone-900 leading-tight truncate">
                                        {spouseData?.name_bangla || activeSpouse.name_bangla || spouseData?.full_name || activeSpouse.full_name}
                                    </h3>
                                </div>
                            </div>

                            {/* Info Items */}
                            <div className="space-y-2 relative z-10 text-xs">
                                {/* Profession & Workplace */}
                                <div className="grid grid-cols-2 gap-1.5">
                                    <div className="bg-white/90 p-2 rounded-xl border border-pink-100 shadow-2xs">
                                        <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1 mb-0.5">
                                            <Briefcase size={10} className="text-rose-500" /> পেশা
                                        </span>
                                        <p className="font-bold text-stone-800 truncate" title={spouseData?.occupation || 'N/A'}>
                                            {loadingSpouse && !spouseData ? 'Loading...' : (spouseData?.occupation || 'গৃহিণী / Housewife')}
                                        </p>
                                    </div>

                                    <div className="bg-white/90 p-2 rounded-xl border border-pink-100 shadow-2xs">
                                        <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1 mb-0.5">
                                            <Building size={10} className="text-rose-500" /> কর্মস্থল
                                        </span>
                                        <p className="font-bold text-stone-800 truncate" title={spouseData?.workplace || 'N/A'}>
                                            {loadingSpouse && !spouseData ? 'Loading...' : (spouseData?.workplace || 'N/A')}
                                        </p>
                                    </div>
                                </div>

                                {/* Contact & Social */}
                                <div className="grid grid-cols-2 gap-1.5">
                                    <div className="bg-white/90 p-2 rounded-xl border border-pink-100 shadow-2xs">
                                        <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1 mb-0.5">
                                            <Phone size={10} className="text-rose-500" /> যোগাযোগ
                                        </span>
                                        {spouseData?.contact_number ? (
                                            <a href={`tel:${spouseData.contact_number}`} className="font-bold text-rose-700 hover:underline truncate block text-[11px]">
                                                {spouseData.contact_number}
                                            </a>
                                        ) : (
                                            <p className="text-stone-400 font-medium text-[11px]">N/A</p>
                                        )}
                                    </div>

                                    <div className="bg-white/90 p-2 rounded-xl border border-pink-100 shadow-2xs">
                                        <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1 mb-0.5">
                                            <Globe size={10} className="text-rose-500" /> সোশ্যাল মিডিয়া
                                        </span>
                                        {spouseData?.social_media ? (
                                            <a
                                                href={spouseData.social_media.startsWith('http') ? spouseData.social_media : `https://${spouseData.social_media}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-rose-700 hover:text-rose-900 hover:underline truncate block text-[11px]"
                                            >
                                                Visit Profile
                                            </a>
                                        ) : (
                                            <p className="text-stone-400 font-medium text-[11px]">N/A</p>
                                        )}
                                    </div>
                                </div>

                                {/* Blood, Education, Birth Date */}
                                <div className="grid grid-cols-3 gap-1.5 text-center">
                                    <div className="bg-white/90 p-1.5 rounded-xl border border-pink-100 shadow-2xs">
                                        <span className="text-[8px] uppercase font-bold text-rose-400 tracking-wider block mb-0.5">
                                            Blood
                                        </span>
                                        <span className="font-extrabold text-rose-700 text-xs">
                                            {spouseData?.blood_group || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="bg-white/90 p-1.5 rounded-xl border border-pink-100 shadow-2xs">
                                        <span className="text-[8px] uppercase font-bold text-rose-400 tracking-wider block mb-0.5">
                                            Education
                                        </span>
                                        <span className="font-bold text-stone-800 text-[10px] truncate block" title={spouseData?.education || 'N/A'}>
                                            {spouseData?.education || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="bg-white/90 p-1.5 rounded-xl border border-pink-100 shadow-2xs">
                                        <span className="text-[8px] uppercase font-bold text-rose-400 tracking-wider block mb-0.5">
                                            Birth Date
                                        </span>
                                        <span className="font-bold text-stone-700 text-[9px] truncate block">
                                            {spouseData?.birth_date ? new Date(spouseData.birth_date).toLocaleDateString() : 'Unknown'}
                                        </span>
                                    </div>
                                </div>

                                {/* Address */}
                                {(spouseData?.present_address || spouseData?.village || spouseData?.location || spouseData?.home_name) && (
                                    <div className="bg-white/90 p-2 rounded-xl border border-pink-100 shadow-2xs flex items-center gap-1.5 text-stone-700">
                                        <MapPin size={11} className="text-rose-500 shrink-0" />
                                        <span className="truncate text-[11px]">
                                            {spouseData?.present_address || spouseData?.village || spouseData?.location || spouseData?.home_name}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-pink-100 relative z-10">
                                <button
                                    type="button"
                                    onClick={() => setActiveSpouse(null)}
                                    className="px-3 py-1 bg-pink-50 hover:bg-pink-100 text-rose-800 text-xs font-bold rounded-xl transition active:scale-95 flex items-center gap-1 border border-pink-200"
                                >
                                    <X size={12} />
                                    <span>Close</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const sp = spouseData || activeSpouse;
                                        setActiveSpouse(null);
                                        fetchFullDetails(sp.id);
                                    }}
                                    className="px-3 py-1 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-rose-900/10 active:scale-95 flex items-center gap-1"
                                >
                                    <span>Full Profile</span>
                                    <Sparkles size={11} />
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
