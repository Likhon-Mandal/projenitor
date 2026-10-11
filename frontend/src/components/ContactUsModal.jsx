import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
    X, Phone, MapPin, Copy, Check, 
    Users, ShieldCheck, UserCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';
import Profile from '../pages/Profile';

const ContactUsModal = ({ isOpen, onClose }) => {
    const { t, isBn } = useLanguage();
    const navigate = useNavigate();

    // Admins list & Profile modal state
    const [admins, setAdmins] = useState([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState(null);
    const [copiedAdminId, setCopiedAdminId] = useState(null);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !selectedMemberId) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, selectedMemberId]);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            fetchPublicAdmins();
        } else {
            document.body.style.overflow = 'unset';
            setSelectedMemberId(null);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const fetchPublicAdmins = async () => {
        try {
            setLoadingAdmins(true);
            const res = await api.get('/admin/public-admins');
            if (Array.isArray(res.data)) {
                setAdmins(res.data);
            } else {
                setAdmins([]);
            }
        } catch (err) {
            console.error('Failed to load public admins:', err);
            setAdmins([]);
        } finally {
            setLoadingAdmins(false);
        }
    };

    if (!isOpen) return null;

    const handleCopyAdminPhone = (e, adminId, phone) => {
        e.stopPropagation();
        if (!phone) return;
        const cleanNumber = phone.split(/[,;\/]/)[0].trim();
        navigator.clipboard.writeText(cleanNumber);
        setCopiedAdminId(adminId);
        setTimeout(() => setCopiedAdminId(null), 2000);
    };

    const getAdminNames = (admin) => {
        let bn = admin.name_bangla;
        let en = admin.name_english;
        const rawName = admin.full_name || admin.name || '';
        
        // Extract "বাংলা নাম (English Name)" pattern if present
        const match = rawName.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
            if (!bn) bn = match[1].trim();
            if (!en) en = match[2].trim();
        } else {
            const hasBn = /[\u0980-\u09FF]/.test(rawName);
            if (hasBn) {
                if (!bn) bn = rawName;
            } else {
                if (!en) en = rawName;
            }
        }
        return {
            bn: bn || rawName,
            en: en || (bn !== rawName ? rawName : '')
        };
    };

    const formatAdminAddress = (admin) => {
        const parts = [admin.home_name, admin.village, admin.upazila, admin.district].filter(Boolean);
        if (parts.length === 0) {
            return isBn ? 'ঠিকানা সংরক্ষিত নেই' : 'Address not recorded';
        }
        return parts.join(', ');
    };

    const handleOpenProfile = (admin) => {
        const memberId = admin.member_id || (admin.id === '958ec665-3b91-4eaf-b860-4b614eeeb3c5' ? 'd31cf734-55d9-42a3-a39e-afe6112467a0' : null);
        if (memberId) {
            setSelectedMemberId(memberId);
        }
    };

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-[200] flex items-center justify-center p-2.5 sm:p-5 bg-stone-950/70 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            >
                <div
                    className="relative w-full max-w-4xl max-h-[88dvh] sm:max-h-[92vh] bg-[#fffcf7] rounded-2xl sm:rounded-3xl shadow-2xl border border-orange-200/90 flex flex-col overflow-hidden animate-slide-up"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-800 via-rose-800 to-red-950 text-white px-4 sm:px-7 py-3 sm:py-4 flex items-center justify-between gap-2.5 sm:gap-4 shadow-md relative z-10 border-b border-orange-950/20">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
                                <ShieldCheck size={20} className="text-amber-300 sm:w-[22px] sm:h-[22px]" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm sm:text-lg font-serif font-bold text-white tracking-wide leading-tight line-clamp-1 sm:line-clamp-none">
                                    {isBn ? 'যোগাযোগ ও তথ্যকেন্দ্র' : 'Contact & Information Hub'}
                                </h3>
                                <p className="text-[11px] sm:text-xs text-orange-200/90 font-medium leading-snug line-clamp-1 sm:line-clamp-none mt-0.5">
                                    {isBn ? 'বাড়ৈ বংশ কল্যাণ পরিষদ ও কেন্দ্রীয় পরিচালনা পরিষদ' : 'Barai Clan Coordination & Committee Office'}
                                </p>
                            </div>
                        </div>

                        {/* High-visibility mobile-friendly close button */}
                        <button
                            onClick={onClose}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center border border-white/25 shadow-md shrink-0 transition-all cursor-pointer"
                            title={t('বন্ধ করুন', 'Close')}
                            aria-label={t('বন্ধ করুন', 'Close')}
                        >
                            <X size={18} className="stroke-[2.5]" />
                        </button>
                    </div>

                    {/* Subtitle Banner */}
                    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border-b border-orange-200/70 px-5 sm:px-7 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-750 font-medium">
                        <span>
                            {isBn 
                                ? 'বংশলতিকা হালনাগাদ, যেকোনো প্রশ্ন বা তথ্যের জন্য দায়িত্বপ্রাপ্তদের সাথে যোগাযোগ করুন'
                                : 'Reach out to the clan administration and coordination team for inquiries'}
                        </span>
                        <button
                            onClick={() => {
                                onClose();
                                navigate('/committee');
                            }}
                            className="text-orange-900 hover:text-orange-950 font-bold inline-flex items-center gap-1 hover:underline shrink-0 text-xs cursor-pointer"
                        >
                            <Users size={13} />
                            <span>{isBn ? 'কমিটি তালিকা' : 'Committee Board'}</span>
                        </button>
                    </div>

                    {/* Content Section: Dedicated Admins & Superadmins Table */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-7 custom-scrollbar text-stone-750 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h4 className="font-serif font-bold text-stone-900 text-base sm:text-lg flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-900 flex items-center justify-center shrink-0 shadow-2xs">
                                        <ShieldCheck size={16} className="text-orange-850" />
                                    </span>
                                    <span>{isBn ? 'অ্যাডমিন ও পরিচালনা পরিষদ' : 'Platform Administrators'}</span>
                                </h4>
                                <p className="text-xs text-stone-500 mt-0.5">
                                    {isBn 
                                        ? 'প্রশাসনিক ও বংশলতিকা তথ্য সংরক্ষণে নিয়োজিত সদস্যবৃন্দ। প্রোফাইল দেখতে যেকোনো সারিতে ক্লিক করুন।'
                                        : 'Lineage administrators & coordinators. Click any row to view full member profile.'}
                                </p>
                            </div>
                            {admins.length > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100/90 text-orange-950 border border-orange-250 shadow-2xs">
                                    <UserCheck size={13} className="text-orange-800" />
                                    <span>{isBn ? `মোট ${admins.length} জন দায়িত্বপ্রাপ্ত` : `Total ${admins.length} Admins`}</span>
                                </span>
                            )}
                        </div>

                        {loadingAdmins ? (
                            <div className="p-6 bg-white rounded-2xl border border-stone-200 animate-pulse space-y-3">
                                <div className="h-6 bg-stone-200 rounded w-1/4" />
                                <div className="h-10 bg-stone-100 rounded" />
                                <div className="h-10 bg-stone-100 rounded" />
                            </div>
                        ) : admins.length === 0 ? (
                            <div className="p-6 bg-white rounded-2xl border border-stone-200 text-center text-xs text-stone-500">
                                {isBn ? 'কোনো অ্যাডমিন তথ্য পাওয়া যায়নি।' : 'No admin contact records available.'}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-orange-250/90 shadow-2xs overflow-hidden">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left text-xs border-collapse min-w-[580px]">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-orange-100/80 via-amber-50 to-orange-100/60 border-b border-orange-200 text-stone-800 font-serif font-bold text-[11px] sm:text-xs">
                                                <th className="py-3 px-4 w-36 whitespace-nowrap">{isBn ? 'পদবী / দায়িত্ব' : 'Role'}</th>
                                                <th className="py-3 px-4 min-w-[160px] whitespace-nowrap">{isBn ? 'নাম (বাংলা ও ইংরেজি)' : 'Name'}</th>
                                                <th className="py-3 px-4 min-w-[200px]">{isBn ? 'ঠিকানা (বাড়ি, গ্রাম, উপজেলা, জেলা)' : 'Address'}</th>
                                                <th className="py-3 px-4 min-w-[170px] whitespace-nowrap">{isBn ? 'যোগাযোগ নম্বর' : 'Contact Number'}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-150">
                                            {admins.map((admin) => {
                                                const names = getAdminNames(admin);
                                                const addressText = formatAdminAddress(admin);
                                                const rawPhone = admin.contact_number;
                                                const primaryPhone = rawPhone ? rawPhone.split(/[,;\/]/)[0].trim() : null;
                                                const isSuper = admin.role === 'superadmin';

                                                return (
                                                    <tr
                                                        key={admin.id}
                                                        onClick={() => handleOpenProfile(admin)}
                                                        className="group hover:bg-orange-50/70 transition-colors duration-150 cursor-pointer"
                                                        title={isBn ? 'সম্পূর্ণ প্রোফাইল দেখতে ক্লিক করুন' : 'Click to view full profile'}
                                                    >
                                                        {/* Role Column */}
                                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${
                                                                    isSuper
                                                                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                                                                        : 'bg-orange-100 text-orange-950 border-orange-300'
                                                                }`}
                                                            >
                                                                <ShieldCheck size={12} className={isSuper ? 'text-amber-800' : 'text-orange-800'} />
                                                                <span>{isSuper ? (isBn ? 'সুপার অ্যাডমিন' : 'Super Admin') : (isBn ? 'অ্যাডমিন' : 'Admin')}</span>
                                                            </span>
                                                        </td>

                                                        {/* Name Column (Both Bangla & English) */}
                                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                                            <div className="flex flex-col justify-center">
                                                                <span className="font-serif font-bold text-stone-900 group-hover:text-orange-900 text-xs sm:text-sm tracking-wide">
                                                                    {names.bn}
                                                                </span>
                                                                {names.en && names.en !== names.bn && (
                                                                    <span className="font-sans text-[11px] text-stone-500 font-medium tracking-tight">
                                                                        {names.en}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Address Column */}
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center gap-1.5 text-stone-700 text-xs">
                                                                <MapPin size={13} className="text-orange-700 shrink-0 mt-0.5" />
                                                                <span className="leading-relaxed">{addressText}</span>
                                                            </div>
                                                        </td>

                                                        {/* Contact Number Column */}
                                                        <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                            {primaryPhone ? (
                                                                <div className="inline-flex items-center gap-1.5 bg-stone-50 group-hover:bg-white px-2.5 py-1 rounded-lg border border-stone-200 transition-colors">
                                                                    <Phone size={12} className="text-emerald-700 shrink-0" />
                                                                    <a
                                                                        href={`tel:${primaryPhone}`}
                                                                        className="font-mono text-xs font-bold text-stone-800 hover:text-emerald-700 hover:underline"
                                                                        title={isBn ? 'সরাসরি কল করুন' : 'Call directly'}
                                                                    >
                                                                        {primaryPhone}
                                                                    </a>
                                                                    <button
                                                                        onClick={(e) => handleCopyAdminPhone(e, admin.id, primaryPhone)}
                                                                        className="p-1 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                                                                        title={isBn ? 'নম্বর কপি করুন' : 'Copy Number'}
                                                                    >
                                                                        {copiedAdminId === admin.id ? (
                                                                            <Check size={12} className="text-emerald-600" />
                                                                        ) : (
                                                                            <Copy size={12} />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            ) : admin.email ? (
                                                                <a
                                                                    href={`mailto:${admin.email}`}
                                                                    className="font-mono text-xs text-amber-700 hover:underline"
                                                                >
                                                                    {admin.email}
                                                                </a>
                                                            ) : (
                                                                <span className="text-stone-400 text-xs italic">
                                                                    {isBn ? 'যুক্ত নেই' : 'N/A'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="bg-stone-50 border-t border-orange-200/80 px-4 sm:px-7 py-3 sm:py-3.5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 text-xs">
                        <p className="text-stone-500 text-[11px] text-center sm:text-left">
                            {isBn ? 'জরুরি রক্ত বা সহায়তার জন্য সাহায্য মেনুতে যোগাযোগ করুন' : 'For blood emergency or community aid, visit the Help section'}
                        </p>

                        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 shrink-0">
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/help');
                                }}
                                className="px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-rose-800 hover:text-rose-950 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer text-center"
                            >
                                {isBn ? 'সাহায্য কেন্দ্র' : 'Help Center'}
                            </button>

                            <button
                                onClick={onClose}
                                className="px-4 py-2 sm:py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl transition-colors cursor-pointer active:scale-95 text-center shadow-2xs"
                            >
                                {t('বন্ধ করুন', 'Close')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search section Profile Card Modal Overlaid */}
            {selectedMemberId && (
                <Profile
                    memberId={selectedMemberId}
                    onClose={() => setSelectedMemberId(null)}
                    zIndex="z-[250]"
                />
            )}
        </>,
        document.body
    );
};

export default ContactUsModal;
