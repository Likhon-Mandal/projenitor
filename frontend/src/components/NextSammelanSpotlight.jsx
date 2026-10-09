import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Calendar, MapPin, Home as HomeIcon, Clock, Sparkles, 
    ArrowRight, Map, ChevronRight 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

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

const NextSammelanSpotlight = () => {
    const { t, isBn, formatNumber } = useLanguage();
    const [sammelan, setSammelan] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchNext = async () => {
            try {
                setLoading(true);
                const res = await api.get('/sammelans/next');
                if (isMounted && res.data) {
                    setSammelan(res.data);
                }
            } catch (err) {
                console.error('Error fetching next sammelan:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchNext();
        return () => { isMounted = false; };
    }, []);

    if (loading) {
        return (
            <div className="w-full max-w-3xl mx-auto px-4 mt-6 mb-3">
                <div className="bg-white/90 rounded-3xl border border-orange-200/80 p-6 shadow-lg shadow-orange-900/5 animate-pulse">
                    <div className="h-5 bg-orange-100 rounded-full w-40 mb-3 mx-auto" />
                    <div className="h-7 bg-orange-100 rounded-xl w-2/3 mb-5 mx-auto" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="h-14 bg-orange-50 rounded-2xl" />
                        <div className="h-14 bg-orange-50 rounded-2xl" />
                        <div className="h-14 bg-orange-50 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!sammelan) return null;

    const engYear = getEnglishYear(sammelan.edition);
    const rawBnDate = sammelan.bengali_date || (sammelan.date ? new Date(sammelan.date).toLocaleDateString('bn-BD') : t('১০ ফাল্গুন', '10 Falgun'));
    const bnDateDisplay = rawBnDate
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/\s*বঙ্গাব্দ\s*/g, ' ')
        .replace(/\s*(খ্রিঃ|খ্রিস্টাব্দ)\s*/g, ' ')
        .replace(/\s*,\s*$/, '')
        .trim();

    const mapUrl = sammelan.map_link || sammelan.home_map_link || (sammelan.venue_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sammelan.venue_address)}` : null);

    // Full Address for Host Bari box
    const fullAddress = sammelan.venue_address || [
        sammelan.venue_name, 
        sammelan.village_name, 
        sammelan.upazila_name, 
        sammelan.district_name
    ].filter(Boolean).join(', ');

    // Area Address without mentioning the bari for Address box
    const getAreaAddressWithoutBari = () => {
        let addr = (sammelan.venue_address || '').trim();
        const venueName = (sammelan.venue_name || sammelan.home_name || '').trim();
        
        if (venueName && addr) {
            if (addr.startsWith(venueName)) {
                addr = addr.slice(venueName.length).replace(/^[, \s]+/, '').trim();
            } else {
                addr = addr.replace(venueName, '').replace(/^[, \s]+/, '').trim();
            }
        }

        if (!addr) {
            addr = [sammelan.village_name, sammelan.upazila_name, sammelan.district_name].filter(Boolean).join(', ');
        }

        return addr || sammelan.village_name || t('ঠিকানা শীঘ্রই দেওয়া হবে', 'Address to be announced');
    };

    const areaAddress = getAreaAddressWithoutBari();

    return (
        <div className="w-full max-w-3xl mx-auto px-4 mt-6 mb-3 relative z-20">
            {/* Ambient Background Glow Effect */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-[2.2rem] opacity-30 blur-lg group-hover:opacity-50 transition duration-1000 animate-pulse pointer-events-none" />

            {/* Spotlight Card */}
            <div className="relative bg-gradient-to-b from-white via-orange-50/40 to-amber-50/50 rounded-3xl p-5 sm:p-6 md:p-7 border-2 border-amber-400/70 shadow-2xl shadow-orange-950/15 backdrop-blur-md transition-all duration-300 hover:shadow-orange-950/20 hover:border-amber-500">
                
                {/* Traditional Decorative Top Accent (Single line with high-contrast beating dot & larger font) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 sm:px-6 sm:py-2 bg-gradient-to-r from-orange-800 via-amber-600 to-orange-800 rounded-full border-2 border-amber-300 shadow-lg flex items-center justify-center whitespace-nowrap z-10">
                    <span className="relative flex h-2.5 w-2.5 mr-2 shrink-0 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-700 animate-live-dot" />
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-white tracking-wide font-sans drop-shadow-sm whitespace-nowrap">
                        {t('আসন্ন বার্ষিক জ্ঞাতি সম্মেলন', 'NEXT ANNUAL GATHERING')}
                    </span>
                </div>

                {/* Main Content */}
                <div className="text-center mt-2.5 space-y-3.5">
                    
                    {/* Pill Badge (Shows ONLY English date) */}
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-100/80 border border-orange-200 text-orange-900 text-xs sm:text-sm font-bold font-sans">
                            <span className="w-2 h-2 rounded-full bg-orange-700" />
                            <span>
                                {isBn ? `২৩ ফেব্রুয়ারি, ${toBnDigits(engYear)}` : `23 February, ${engYear}`}
                            </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-black text-stone-900 tracking-tight leading-snug">
                            {sammelan.title || (isBn ? `${toBnDigits(sammelan.edition)}তম বার্ষিক জ্ঞাতি সম্মেলন` : `${sammelan.edition}th Annual Barai Gathering`)}
                        </h3>
                    </div>

                    {/* Venue & Location Highlights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-left">
                        
                        {/* 1. Date & Time (Bengali date & matching English date, no bongabdo/khistabdo) */}
                        <div className="bg-white/80 p-3.5 rounded-2xl border border-orange-100 shadow-xs flex items-start gap-3 hover:border-amber-300 transition-colors">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-100/80 border border-orange-200 flex items-center justify-center text-orange-800 shrink-0">
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                                    {t('তারিখ ও সময়', 'Date & Time')}
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-stone-900 leading-snug mt-0.5 truncate">
                                    {bnDateDisplay}
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-orange-800 leading-snug mt-0.5 truncate">
                                    {isBn ? `২৩ ফেব্রুয়ারি, ${toBnDigits(engYear)}` : `23 February, ${engYear}`}
                                </p>
                                {sammelan.time && (
                                    <p className="text-[11px] text-stone-600 flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3 text-stone-500 shrink-0" />
                                        <span>{sammelan.time}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 2. Host Bari (Shows Host Bari name and address below without repeating bari name) */}
                        <div className="bg-white/80 p-3.5 rounded-2xl border border-orange-100 shadow-xs flex items-start gap-3 hover:border-amber-300 transition-colors">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-900 shrink-0">
                                <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                                    {t('স্বাগতিক বাড়ি', 'Host Bari')}
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-stone-900 mt-0.5">
                                    {sammelan.venue_name || t('স্থান নির্ধারিত হয়নি', 'Venue not set')}
                                </p>
                                {areaAddress && (
                                    <p className="text-[11px] sm:text-xs text-stone-600 mt-1 leading-relaxed">
                                        {areaAddress}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 3. Address & Map (Only shows area/address and bottom map link - NO bari, NO top map symbol) */}
                        {(() => {
                            const CardWrapper = mapUrl ? 'a' : 'div';
                            const wrapperProps = mapUrl ? {
                                href: mapUrl,
                                target: '_blank',
                                rel: 'noopener noreferrer',
                                title: t('গুগল ম্যাপে এই অবস্থান দেখুন', 'View this location on Google Maps')
                            } : {};

                            return (
                                <CardWrapper
                                    {...wrapperProps}
                                    className={`bg-white/80 p-3.5 rounded-2xl border border-orange-100 shadow-xs flex items-start gap-3 transition-all duration-200 text-left ${
                                        mapUrl 
                                            ? 'hover:border-amber-400 hover:bg-orange-50/70 hover:shadow-md cursor-pointer group/addr' 
                                            : 'hover:border-amber-300'
                                    }`}
                                >
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-100/80 border border-red-200 flex items-center justify-center text-red-800 shrink-0 group-hover/addr:scale-105 transition-transform">
                                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                                            {t('ঠিকানা ও ম্যাপ', 'Address & Map')}
                                        </p>
                                        <p className="text-xs sm:text-sm font-bold text-stone-800 mt-0.5 leading-snug group-hover/addr:text-orange-950 transition-colors">
                                            {areaAddress}
                                        </p>
                                        {mapUrl && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-800 hover:underline mt-1.5">
                                                <Map className="w-3 h-3" />
                                                <span>{t('গুগল ম্যাপে দেখুন', 'Open in Google Maps')}</span>
                                            </span>
                                        )}
                                    </div>
                                </CardWrapper>
                            );
                        })()}
                    </div>

                    {/* Explore Sammelan Katha Button (Navigates and opens details modal) */}
                    <div className="pt-1.5 flex flex-wrap items-center justify-center gap-4">
                        <Link
                            to={`/sammelan?detailId=${sammelan.id}`}
                            state={{ openDetailId: sammelan.id }}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-800 via-orange-700 to-red-800 hover:from-orange-900 hover:to-red-900 text-white rounded-full font-bold text-xs sm:text-sm shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                            <span>{t('সম্মেলন কথা ঘুরে দেখুন (সকল পূর্ববর্তী সম্মেলন)', 'Explore Sammelan Katha (Previous Gatherings)')}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NextSammelanSpotlight;
