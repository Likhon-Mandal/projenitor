import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    MapPin, Phone, Mail, ChevronUp, BookOpen, Heart, Sparkles,
    Users, Compass, Shield, Award, HelpCircle, ExternalLink, ArrowRight,
    Crown, UserCheck, Copy, Check, User
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';
import AboutUsModal from './AboutUsModal';
import ContactUsModal from './ContactUsModal';
import Profile from '../pages/Profile';

const Footer = () => {
    const { t, isBn, formatNumber } = useLanguage();
    const year = formatNumber(new Date().getFullYear());

    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState(null);
    const [copiedPhone, setCopiedPhone] = useState(null);

    const [leaders, setLeaders] = useState({
        president: {
            role: 'সভাপতি',
            name_bangla: 'প্রিয়লাল কর্মকার',
            name_english: 'Priyalal Karmakar',
            village: 'বড় বাশাইল',
            upazila: 'আগৈলঝাড়া',
            district: 'বরিশাল',
            contact_number: '',
            member_id: 'd7082c11-16fa-4ce2-9c25-ddcea6577722'
        },
        secretary: {
            role: 'সাধারণ সম্পাদক',
            name_bangla: 'রণজিত মন্ডল',
            name_english: 'Ranajit Mandal',
            village: 'ভেন্নাবাড়ী',
            upazila: 'রাজৈর',
            district: 'মাদারীপুর',
            contact_number: '',
            member_id: '4c81add5-a0bb-488d-abed-96b7f502e41e'
        }
    });

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                const res = await api.get('/committee/leaders');
                if (res.data) {
                    setLeaders(prev => ({
                        president: res.data.president || prev.president,
                        secretary: res.data.secretary || prev.secretary
                    }));
                }
            } catch (err) {
                // Silently fallback to predefined leaders
            }
        };
        fetchLeaders();
    }, []);

    const formatLeaderAddress = (leader) => {
        if (!leader) return '';
        const parts = [leader.village, leader.upazila, leader.district].filter(Boolean);
        return parts.join(', ');
    };

    const getLeaderDisplayName = (leader, defaultBn, defaultEn) => {
        if (!leader) return isBn ? defaultBn : defaultEn;
        if (isBn) {
            if (leader.name_bangla) return leader.name_bangla;
            if (leader.full_name) {
                return leader.full_name.replace(/\s*\([A-Za-z0-9\s]+\)/, '').trim();
            }
            return defaultBn;
        } else {
            if (leader.name_english) return leader.name_english;
            if (leader.full_name) {
                const match = leader.full_name.match(/\(([A-Za-z0-9\s]+)\)/);
                if (match) return match[1].trim();
                if (!/[\u0980-\u09FF]/.test(leader.full_name)) return leader.full_name;
            }
            return defaultEn;
        }
    };

    const handleCopyPhone = (e, type, phone) => {
        e.stopPropagation();
        if (!phone) return;
        const cleanNumber = phone.split(/[,;\/]/)[0].trim();
        navigator.clipboard.writeText(cleanNumber);
        setCopiedPhone(type);
        setTimeout(() => setCopiedPhone(null), 2000);
    };

    const handleLeaderClick = (leader) => {
        if (!leader) return;
        if (leader.member_id) {
            setSelectedMemberId(leader.member_id);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <footer className="bg-gradient-to-b from-[#2d0e05] via-[#230b04] to-[#1a0803] text-orange-100/90 border-t border-orange-900/40 mt-auto relative">
            {/* Top Ornamental Accent Line */}
            <div className="h-1 bg-gradient-to-r from-orange-800 via-amber-500 to-red-900" />

            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

                    {/* Column 1: Brand & Heritage Story */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center text-stone-950 font-serif font-black text-xl shadow-md border border-amber-400/40">
                                ব
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-lg sm:text-xl text-white tracking-wide leading-tight">
                                    {isBn ? 'বাড়ৈ বংশের ইতিবৃত্ত' : 'The Barai Lineage'}
                                </h3>
                                <p className="text-[11px] text-amber-300/80 font-sans tracking-wider uppercase font-semibold">
                                    {isBn ? 'প্রোজেনিটর ডিজিটাল হেরিটেজ' : 'Projenitor Heritage Platform'}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-stone-300/90 leading-relaxed font-sans">
                            {isBn
                                ? 'ঐতিহাসিক "বাড়ৈ বংশের ইতিবৃত্ত" গ্রন্থের নির্ভরযোগ্য ডিজিটাল প্রতিরূপ। আমাদের পূর্বপুরুষদের গৌরবোজ্জ্বল শিকড়ের সন্ধান ও ভবিষ্যৎ প্রজন্মকে একই সূত্রে বাঁধার ডিজিটাল সেতুবন্ধন।'
                                : 'Digital archive of "The Barai Lineage" (বাড়ৈ বংশের ইতিবৃত্ত) heritage book. Preserving ancestral heritage and uniting family members across generations and continents.'}
                        </p>

                        <div className="pt-1">
                            <button
                                onClick={() => setIsAboutOpen(true)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline transition-colors group cursor-pointer"
                            >
                                <BookOpen size={13} className="text-amber-400 group-hover:scale-110 transition-transform" />
                                <span>{isBn ? 'আমাদের সম্পর্কে বিস্তারিত জানুন' : 'Learn more about us'}</span>
                                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Column 2: Quick Links / দ্রুত নেভিগেশন */}
                    <div className="space-y-3.5">
                        <h4 className="font-serif font-bold text-sm sm:text-base text-amber-400 tracking-wide flex items-center gap-2">
                            <Compass size={16} className="text-amber-500" />
                            <span>{isBn ? 'বংশধারা ও অন্বেষণ' : 'Lineage & Exploration'}</span>
                        </h4>

                        <ul className="space-y-2 text-xs sm:text-sm font-sans text-stone-300">
                            <li>
                                <Link
                                    to="/explorer"
                                    className="hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 group"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 group-hover:bg-amber-400 transition-colors" />
                                    <span>{isBn ? 'বংশধারা পরিভ্রমণ (Explorer)' : 'Lineage Explorer'}</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/directory"
                                    className="hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 group"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 group-hover:bg-amber-400 transition-colors" />
                                    <span>{isBn ? 'সদস্য তালিকা ও ডিরেক্টরি' : 'Member Directory'}</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/sammelan"
                                    className="hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 group"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 group-hover:bg-amber-400 transition-colors" />
                                    <span>{isBn ? 'সম্মেলনের ইতিহাস (Chronicles)' : 'Sammelan Chronicles'}</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/history"
                                    className="hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 group"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 group-hover:bg-amber-400 transition-colors" />
                                    <span>{isBn ? 'ইতিহাস ও ঐতিহ্য সম্ভার' : 'Historical Archives'}</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/committee"
                                    className="hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 group"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 group-hover:bg-amber-400 transition-colors" />
                                    <span>{isBn ? 'পরিচালনা পর্ষদ ও কমিটি' : 'Committee Board'}</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/board"
                                    className="hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 group"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 group-hover:bg-amber-400 transition-colors" />
                                    <span>{isBn ? 'বিজ্ঞপ্তি ও অনুষ্ঠানমালা' : 'Notices & Events'}</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Contact Us / যোগাযোগ ও তথ্যকেন্দ্র */}
                    <div className="space-y-3.5">
                        <h4 className="font-serif font-bold text-sm sm:text-base text-amber-400 tracking-wide flex items-center gap-2">
                            <Phone size={16} className="text-amber-500" />
                            <span>{isBn ? 'যোগাযোগ ও তথ্যকেন্দ্র' : 'Contact & Info'}</span>
                        </h4>

                        <div className="space-y-3 text-xs sm:text-sm text-stone-300/90 font-sans">
                            {/* Contact Person Name */}
                            <div
                                onClick={() => setSelectedMemberId('d31cf734-55d9-42a3-a39e-afe6112467a0')}
                                className="inline-flex items-center gap-2.5 cursor-pointer group/user py-0.5 rounded-lg transition-all"
                                title={isBn ? 'প্রোফাইল দেখতে ক্লিক করুন' : 'Click to view profile'}
                            >
                                <User size={15} className="text-amber-400 shrink-0 group-hover/user:scale-110 transition-transform" />
                                <span className="font-serif font-bold text-stone-100 group-hover/user:text-amber-300 text-xs sm:text-sm tracking-wide underline decoration-amber-500/40 hover:decoration-amber-300 transition-all">
                                    {isBn ? 'লিখন মন্ডল' : 'Likhon Mandal'}
                                </span>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <MapPin size={15} className="text-amber-400 shrink-0 mt-0.5" />
                                <span>
                                    {isBn
                                        ? 'ভেন্নাবাড়ী, রাজৈর, মাদারীপুর।'
                                        : 'Vennabari, Rajoir, Madaripur.'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <Phone size={15} className="text-emerald-400 shrink-0" />
                                <a
                                    href="tel:+8801861782004"
                                    className="hover:text-amber-300 transition-colors font-mono"
                                >
                                    +880 1861-782004
                                </a>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <Mail size={15} className="text-rose-400 shrink-0" />
                                <a
                                    href="mailto:likhon.cse9.bu@gmail.com"
                                    className="hover:text-amber-300 transition-colors font-mono truncate"
                                    title="likhon.cse9.bu@gmail.com"
                                >
                                    likhon.cse9.bu@gmail.com
                                </a>
                            </div>

                            <div className="pt-1.5">
                                <button
                                    onClick={() => setIsContactOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-800 to-amber-700 hover:from-orange-700 hover:to-amber-600 text-white font-medium text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer group"
                                >
                                    <Shield size={13} className="text-amber-300" />
                                    <span>{isBn ? 'দায়িত্বপ্রাপ্ত অ্যাডমিন তথ্যকেন্দ্র' : 'Platform Admins & Info'}</span>
                                    <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Column 4: Executive Leadership (সভাপতি ও সাধারণ সম্পাদক) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pb-0.5 gap-2">
                            <h4 className="font-serif font-bold text-sm sm:text-base text-amber-400 tracking-wide flex items-center gap-1.5 truncate">
                                <Award size={16} className="text-amber-400 shrink-0" />
                                <span className="truncate">{isBn ? 'কার্যনির্বাহী পরিষদ' : 'Executive Board'}</span>
                            </h4>
                            <Link
                                to="/committee"
                                className="text-[11px] text-amber-300/80 hover:text-amber-200 hover:underline flex items-center gap-0.5 font-sans transition-colors shrink-0"
                            >
                                <span>{isBn ? 'পূর্ণাঙ্গ কমিটি' : 'Full Board'}</span>
                                <ArrowRight size={11} />
                            </Link>
                        </div>

                        {/* Two balanced boxes with consistent height across languages */}
                        <div className="space-y-2.5 font-sans">
                            {/* Box 1: সভাপতি */}
                            <div
                                onClick={() => handleLeaderClick(leaders.president)}
                                className={`p-2.5 sm:p-3 rounded-xl bg-[#1d0702]/90 hover:bg-[#280c04] border border-orange-800/70 hover:border-amber-400/60 transition-all duration-200 shadow-sm ${leaders.president?.member_id ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''} group space-y-1`}
                                title={leaders.president?.member_id ? (isBn ? 'প্রোফাইল দেখতে ক্লিক করুন' : 'Click to view profile') : ''}
                            >
                                {/* Role & Name in ONE single line */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 shrink-0 whitespace-nowrap">
                                        <Crown size={10} className="text-amber-300 shrink-0" />
                                        <span>{isBn ? 'সভাপতি' : 'President'}</span>
                                    </span>
                                    <span className="font-serif font-bold text-xs sm:text-[13px] text-stone-100 group-hover:text-amber-300 transition-colors tracking-normal whitespace-nowrap truncate">
                                        {getLeaderDisplayName(leaders.president, 'প্রিয়লাল কর্মকার', 'Priyalal Karmakar')}
                                    </span>
                                </div>

                                {/* Address */}
                                <div className="flex items-start gap-1.5 text-xs text-stone-300/90 leading-snug">
                                    <MapPin size={12} className="text-amber-400 shrink-0 mt-0.5" />
                                    <span className="truncate">
                                        {formatLeaderAddress(leaders.president) || (isBn ? 'বড় বাশাইল, আগৈলঝাড়া, বরিশাল' : 'Bara Bashail, Agailjhara, Barishal')}
                                    </span>
                                </div>

                                {/* Contact Number */}
                                <div className="flex items-center justify-between text-xs text-stone-200 pt-0.5" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-1.5 font-mono">
                                        <Phone size={12} className="text-emerald-400 shrink-0" />
                                        {leaders.president?.contact_number ? (
                                            <a
                                                href={`tel:${leaders.president.contact_number}`}
                                                className="hover:text-emerald-300 hover:underline"
                                            >
                                                {leaders.president.contact_number}
                                            </a>
                                        ) : (
                                            <span className="text-stone-400 font-mono">
                                                +880 1712-345678
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => handleCopyPhone(e, 'president', leaders.president?.contact_number || '+8801712345678')}
                                        className="p-1 rounded hover:bg-white/10 text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
                                        title={isBn ? 'নম্বর কপি করুন' : 'Copy Number'}
                                    >
                                        {copiedPhone === 'president' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                    </button>
                                </div>
                            </div>

                            {/* Box 2: সাধারণ সম্পাদক */}
                            <div
                                onClick={() => handleLeaderClick(leaders.secretary)}
                                className={`p-2.5 sm:p-3 rounded-xl bg-[#1d0702]/90 hover:bg-[#280c04] border border-orange-800/70 hover:border-amber-400/60 transition-all duration-200 shadow-sm ${leaders.secretary?.member_id ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''} group space-y-1`}
                                title={leaders.secretary?.member_id ? (isBn ? 'প্রোফাইল দেখতে ক্লিক করুন' : 'Click to view profile') : ''}
                            >
                                {/* Role & Name in ONE single line */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-400/40 shrink-0 whitespace-nowrap">
                                        <UserCheck size={10} className="text-orange-300 shrink-0" />
                                        <span>{isBn ? 'সাধারণ সম্পাদক' : 'Secretary'}</span>
                                    </span>
                                    <span className="font-serif font-bold text-xs sm:text-[13px] text-stone-100 group-hover:text-amber-300 transition-colors tracking-normal whitespace-nowrap truncate">
                                        {getLeaderDisplayName(leaders.secretary, 'রণজিত মন্ডল', 'Ranajit Mandal')}
                                    </span>
                                </div>

                                {/* Address */}
                                <div className="flex items-start gap-1.5 text-xs text-stone-300/90 leading-snug">
                                    <MapPin size={12} className="text-amber-400 shrink-0 mt-0.5" />
                                    <span className="truncate">
                                        {formatLeaderAddress(leaders.secretary) || (isBn ? 'ভেন্নাবাড়ী, রাজৈর, মাদারীপুর' : 'Vennabari, Rajoir, Madaripur')}
                                    </span>
                                </div>

                                {/* Contact Number */}
                                <div className="flex items-center justify-between text-xs text-stone-200 pt-0.5" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-1.5 font-mono">
                                        <Phone size={12} className="text-emerald-400 shrink-0" />
                                        {leaders.secretary?.contact_number ? (
                                            <a
                                                href={`tel:${leaders.secretary.contact_number}`}
                                                className="hover:text-emerald-300 hover:underline"
                                            >
                                                {leaders.secretary.contact_number}
                                            </a>
                                        ) : (
                                            <span className="text-stone-400 font-mono">
                                                +880 1712-345678
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => handleCopyPhone(e, 'secretary', leaders.secretary?.contact_number || '+8801712345678')}
                                        className="p-1 rounded hover:bg-white/10 text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
                                        title={isBn ? 'নম্বর কপি করুন' : 'Copy Number'}
                                    >
                                        {copiedPhone === 'secretary' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Bar: Copyright, Motto & Back-to-Top */}
            <div className="border-t border-orange-900/60 bg-[#160602]/90">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">

                    {/* Copyright & Heritage note */}
                    <div className="text-center sm:text-left space-y-0.5">
                        <p className="text-stone-300 font-medium">
                            &copy; {year} {isBn ? 'বাড়ৈ বংশের ইতিবৃত্ত (Projenitor)।' : 'The Barai Lineage (Projenitor).'} {t('সর্বস্বত্ব সংরক্ষিত।', 'All rights reserved.')}
                        </p>
                        <p className="text-[11px] text-stone-400/80">
                            {isBn ? 'গর্বের সাথে সংরক্ষিত আমাদের শিকড় ও বংশধারা' : 'Proudly preserving our roots and ancestral lineage'}
                        </p>
                    </div>

                    {/* Action Links & Back to Top */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsAboutOpen(true)}
                            className="hover:text-amber-300 transition-colors cursor-pointer text-stone-400 hover:underline"
                        >
                            {isBn ? 'আমাদের সম্পর্কে' : 'About Us'}
                        </button>

                        <span className="text-stone-700">•</span>

                        <button
                            onClick={() => setIsContactOpen(true)}
                            className="hover:text-amber-300 transition-colors cursor-pointer text-stone-400 hover:underline"
                        >
                            {isBn ? 'যোগাযোগ' : 'Contact Us'}
                        </button>

                        <button
                            onClick={scrollToTop}
                            className="ml-2 w-8 h-8 rounded-xl bg-orange-900/80 hover:bg-orange-800 text-amber-300 hover:text-white flex items-center justify-center border border-orange-700/60 shadow-xs hover:shadow-md transition-all active:scale-90 cursor-pointer group"
                            title={isBn ? 'উপরে যান' : 'Back to Top'}
                        >
                            <ChevronUp size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>

                </div>
            </div>

            {/* Interactive Modals */}
            <AboutUsModal
                isOpen={isAboutOpen}
                onClose={() => setIsAboutOpen(false)}
            />

            <ContactUsModal
                isOpen={isContactOpen}
                onClose={() => setIsContactOpen(false)}
            />

            {/* Search section Profile Card Modal */}
            {selectedMemberId && (
                <Profile
                    memberId={selectedMemberId}
                    onClose={() => setSelectedMemberId(null)}
                    zIndex="z-[150]"
                />
            )}
        </footer>
    );
};

export default Footer;
