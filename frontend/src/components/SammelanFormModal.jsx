import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Sparkles, MapPin, Calendar, Clock, Home as HomeIcon, 
    User, AlertCircle, Search, CheckCircle2, ExternalLink, Image as ImageIcon 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

const SammelanFormModal = ({ isOpen, onClose, sammelan, onSave }) => {
    const { t, formatNumber } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        edition: '',
        title: '',
        bengali_date: '',
        date: '',
        time: 'সকাল ১০:০০ ঘটিকা',
        home_id: null,
        venue_name: '',
        venue_address: '',
        map_link: '',
        president_name: '',
        secretary_name: '',
        description: '',
        special_notes: '',
        cover_image_url: '',
        is_next: false
    });

    // Home / Bari search autocomplete state
    const [homeQuery, setHomeQuery] = useState('');
    const [homeResults, setHomeResults] = useState([]);
    const [searchingHomes, setSearchingHomes] = useState(false);
    const [showHomeDropdown, setShowHomeDropdown] = useState(false);
    const [selectedHomeName, setSelectedHomeName] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (sammelan) {
            setFormData({
                edition: sammelan.edition || '',
                title: sammelan.title || '',
                bengali_date: sammelan.bengali_date || '',
                date: sammelan.date ? sammelan.date.split('T')[0] : '',
                time: sammelan.time || 'সকাল ১০:০০ ঘটিকা',
                home_id: sammelan.home_id || null,
                venue_name: sammelan.venue_name || '',
                venue_address: sammelan.venue_address || '',
                map_link: sammelan.map_link || '',
                president_name: sammelan.president_name || '',
                secretary_name: sammelan.secretary_name || '',
                description: sammelan.description || '',
                special_notes: sammelan.special_notes || '',
                cover_image_url: sammelan.cover_image_url || '',
                is_next: Boolean(sammelan.is_next)
            });
            setSelectedHomeName(sammelan.home_name || sammelan.venue_name || '');
            setHomeQuery('');
        } else {
            setFormData({
                edition: '',
                title: '',
                bengali_date: '১০ ফাল্গুন',
                date: '',
                time: 'সকাল ১০:০০ ঘটিকা',
                home_id: null,
                venue_name: '',
                venue_address: '',
                map_link: '',
                president_name: '',
                secretary_name: '',
                description: '',
                special_notes: '',
                cover_image_url: '',
                is_next: false
            });
            setSelectedHomeName('');
            setHomeQuery('');
        }
        setError('');
    }, [sammelan, isOpen]);

    // Live search for listed homes in lineage data
    useEffect(() => {
        if (!homeQuery || homeQuery.trim().length < 1) {
            setHomeResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearchingHomes(true);
                const res = await api.get(`/sammelans/homes-lookup?q=${encodeURIComponent(homeQuery.trim())}`);
                setHomeResults(res.data || []);
                setShowHomeDropdown(true);
            } catch (err) {
                console.error('Error looking up homes:', err);
            } finally {
                setSearchingHomes(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [homeQuery]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowHomeDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // When a listed home is picked, auto-populate venue and address!
    const handleSelectHome = (home) => {
        setFormData(prev => ({
            ...prev,
            home_id: home.id,
            venue_name: home.home_name,
            venue_address: home.full_address,
            map_link: home.map_link || prev.map_link
        }));
        setSelectedHomeName(home.home_name);
        setHomeQuery('');
        setShowHomeDropdown(false);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.edition) {
            setError(t('সম্মেলনের সংস্করণ/সংখ্যা আবশ্যক', 'Edition number is required'));
            return;
        }

        if (!formData.venue_name || !formData.venue_name.trim()) {
            setError(t('সম্মেলনের স্থান বা বাড়ির নাম প্রদান করুন', 'Venue or house name is required'));
            return;
        }

        try {
            setLoading(true);
            if (sammelan && sammelan.id) {
                await api.put(`/sammelans/${sammelan.id}`, formData);
            } else {
                await api.post('/sammelans', formData);
            }
            onSave();
            onClose();
        } catch (err) {
            console.error('Error saving sammelan:', err);
            setError(err.response?.data?.error || t('সম্মেলন তথ্য সংরক্ষণ করা যায়নি', 'Failed to save sammelan'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-3xl my-8 bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-900 via-orange-800 to-red-900 px-6 py-5 text-white flex items-center justify-between shrink-0 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center text-yellow-300">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="font-serif text-xl sm:text-2xl font-bold">
                                {sammelan ? t('সম্মেলন তথ্য সম্পাদনা', 'Edit Sammelan') : t('নতুন সম্মেলন সংযোজন', 'Add New Sammelan')}
                            </h2>
                            <p className="text-xs text-orange-200">
                                {t('বার্ষিক জ্ঞাতি সম্মেলনের ইতিহাস ও তথ্য সংরক্ষণ', 'Preserve ancestral conference records')}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-orange-200 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 font-sans">
                    {error && (
                        <div className="flex items-center gap-2 p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl">
                            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Next Sammelan Highlight Toggle */}
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <label htmlFor="is_next" className="text-sm font-bold text-stone-900 cursor-pointer block">
                                    {t('আসন্ন সম্মেলন হিসেবে চিহ্নিত করুন', 'Set as Next / Upcoming Sammelan')}
                                </label>
                                <p className="text-xs text-stone-500">
                                    {t('হোমপেজের হাইলাইট বক্সে এই সম্মেলনটি প্রদর্শিত হবে', 'This will be prominently highlighted in the homepage box')}
                                </p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            id="is_next"
                            name="is_next"
                            checked={formData.is_next}
                            onChange={handleChange}
                            className="w-5 h-5 text-orange-700 rounded border-orange-300 focus:ring-orange-500 cursor-pointer accent-orange-700"
                        />
                    </div>

                    {/* Row 1: Edition & Title */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                                {t('সম্মেলন সংস্করণ (যেমন: ৪৫ বা ৯৪)', 'Edition Number *')}
                            </label>
                            <input
                                type="number"
                                name="edition"
                                value={formData.edition}
                                onChange={handleChange}
                                placeholder="45"
                                required
                                className="w-full px-3.5 py-2.5 text-sm bg-orange-50/50 border border-orange-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-bold"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                                {t('শিরোনাম (ঐচ্ছিক)', 'Title (Optional)')}
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder={t('যেমন: ৪৫তম ঐতিহাসিক বার্ষিক জ্ঞাতি সম্মেলন', 'e.g. 45th Annual Gathering')}
                                className="w-full px-3.5 py-2.5 text-sm bg-orange-50/50 border border-orange-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                            />
                        </div>
                    </div>

                    {/* Row 2: Bengali Date, Gregorian Date & Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                                {t('বাংলা তারিখ', 'Bengali Date')}
                            </label>
                            <input
                                type="text"
                                name="bengali_date"
                                value={formData.bengali_date}
                                onChange={handleChange}
                                placeholder={t('১০ ফাল্গুন, ১৩৮৩ বঙ্গাব্দ', '10 Falgun, 1383 BE')}
                                className="w-full px-3.5 py-2.5 text-sm bg-orange-50/50 border border-orange-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                                {t('ইংরেজি তারিখ', 'Gregorian Date')}
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full px-3.5 py-2.5 text-sm bg-orange-50/50 border border-orange-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                                {t('সময়', 'Time')}
                            </label>
                            <input
                                type="text"
                                name="time"
                                value={formData.time}
                                onChange={handleChange}
                                placeholder={t('সকাল ১০:০০ ঘটিকা', '10:00 AM')}
                                className="w-full px-3.5 py-2.5 text-sm bg-orange-50/50 border border-orange-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                            />
                        </div>
                    </div>

                    {/* Row 3: AUTO-ADDRESS LINEAGE BARI SELECTOR */}
                    <div className="p-4 bg-orange-50/80 border border-orange-200 rounded-2xl relative" ref={dropdownRef}>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                                <HomeIcon className="w-4 h-4 text-orange-700" />
                                <span>{t('বংশতালিকার তালিকাভুক্ত বাড়ি নির্বাচন (স্বয়ংক্রিয় ঠিকানা)', 'Select Listed Bari from Lineage Data (Auto-Address)')}</span>
                            </label>
                            {selectedHomeName && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{t('বাড়ি সংযুক্ত', 'Linked')}: {selectedHomeName}</span>
                                </span>
                            )}
                        </div>

                        {/* Search Input for Bari */}
                        <div className="relative mb-3">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={homeQuery}
                                onChange={(e) => setHomeQuery(e.target.value)}
                                onFocus={() => { if (homeResults.length > 0) setShowHomeDropdown(true); }}
                                placeholder={t('বংশতালিকার বাড়ি বা গ্রামের নাম দিয়ে খুঁজুন (যেমন: পুলিন, নিরঞ্জন, বটবাড়ি, ভেন্নাবাড়ী...)', 'Search by Bari or Village name (e.g. Niranjan, Botbari, Vennabari)...')}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                            />
                            {searchingHomes && (
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}

                            {/* Dropdown Results */}
                            {showHomeDropdown && homeResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-orange-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-orange-50">
                                    {homeResults.map((home) => (
                                        <button
                                            key={home.id}
                                            type="button"
                                            onClick={() => handleSelectHome(home)}
                                            className="w-full px-4 py-2.5 text-left hover:bg-orange-50 flex items-start justify-between gap-3 transition-colors cursor-pointer"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                                                    <HomeIcon className="w-3.5 h-3.5 text-orange-700 shrink-0" />
                                                    <span>{home.home_name}</span>
                                                </p>
                                                <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                                    <span>{home.full_address}</span>
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full shrink-0">
                                                {t('নির্বাচন করুন', 'Select')}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Venue Name & Full Address Inputs (Auto-populated, still editable) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                                    {t('স্থানের নাম / বাড়ির নাম *', 'Venue / House Name *')}
                                </label>
                                <input
                                    type="text"
                                    name="venue_name"
                                    value={formData.venue_name}
                                    onChange={handleChange}
                                    placeholder={t('যেমন: পুলিন বাড়ৈ এর বাড়ি প্রাঙ্গণ', 'e.g. Pulin Barai Bari')}
                                    required
                                    className="w-full px-3 py-2 text-sm bg-white border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                                    {t('সম্পূর্ণ ঠিকানা (গ্রাম, উপজেলা, জেলা)', 'Full Address (Auto-filled)')}
                                </label>
                                <input
                                    type="text"
                                    name="venue_address"
                                    value={formData.venue_address}
                                    onChange={handleChange}
                                    placeholder={t('যেমন: বটবাড়ি, কোটালীপাড়া, গোপালগঞ্জ', 'e.g. Botbari, Kotalipara, Gopalganj')}
                                    className="w-full px-3 py-2 text-sm bg-white border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                />
                            </div>
                        </div>

                        <div className="mt-3">
                            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                                {t('গুগল ম্যাপ লিংক (ঐচ্ছিক)', 'Google Map Link (Optional)')}
                            </label>
                            <input
                                type="url"
                                name="map_link"
                                value={formData.map_link}
                                onChange={handleChange}
                                placeholder="https://maps.google.com/..."
                                className="w-full px-3 py-2 text-sm bg-white border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                            />
                        </div>
                    </div>

                    {/* Row 4: President & Secretary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-stone-400" />
                                <span>{t('সভাপতি / প্রতিষ্ঠাতা সভাপতি', 'President / Chairperson')}</span>
                            </label>
                            <input
                                type="text"
                                name="president_name"
                                value={formData.president_name}
                                onChange={handleChange}
                                placeholder={t('শ্রী গোবিন্দ চন্দ্র বাড়ৈ', 'e.g. Sri Gobinda Chandra Barai')}
                                className="w-full px-3.5 py-2.5 text-sm bg-orange-50/50 border border-orange-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-stone-400" />
                                <span>{t('সম্পাদক / সমন্বয়ক', 'Secretary / Coordinator')}</span>
                            </label>
                            <input
                                type="text"
                                name="secretary_name"
                                value={formData.secretary_name}
                                onChange={handleChange}
                                placeholder={t('শ্রী পুলিন বিহারী বাড়ৈ', 'e.g. Sri Pulin Bihari Barai')}
                                className="w-full px-3.5 py-2.5 text-sm bg-orange-50/50 border border-orange-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                            />
                        </div>
                    </div>

                    {/* Row 5: Description / Notes */}
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                            {t('সম্মেলনের কার্যবিবরণী ও বিস্তারিত ইতিহাস', 'Conference Memoirs & Detailed History')}
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder={t('সম্মেলনের বিস্তারিত বিবরণ, উল্লেখযোগ্য উপস্থিতি, প্রস্তাবনা ও সিদ্ধান্তসমূহ...', 'Summary of conference, guestbook notes, resolutions, key attendees...')}
                            className="w-full px-3.5 py-2.5 text-sm bg-orange-50/50 border border-orange-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                        />
                    </div>

                    {/* Row 6: Special Notes */}
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                            {t('বিশেষ স্মৃতি ও তাৎপর্য', 'Special Memories & Highlights')}
                        </label>
                        <textarea
                            name="special_notes"
                            rows={2}
                            value={formData.special_notes}
                            onChange={handleChange}
                            placeholder={t('ঐতিহাসিক মন্তব্য বহির উদ্ধৃতি বা বিশেষ তাৎপর্যপূর্ণ কোনো ঘটনা...', 'Special quotes from historical register or memorable milestones...')}
                            className="w-full px-3.5 py-2.5 text-sm bg-orange-50/50 border border-orange-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                        />
                    </div>

                    {/* Row 7: Cover Image URL */}
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-stone-400" />
                            <span>{t('স্মৃতিচিত্র / ব্যানার ছবির লিংক (ঐচ্ছিক)', 'Cover Image / Banner URL (Optional)')}</span>
                        </label>
                        <input
                            type="url"
                            name="cover_image_url"
                            value={formData.cover_image_url}
                            onChange={handleChange}
                            placeholder="https://images.unsplash.com/... or cloudinary url"
                            className="w-full px-3.5 py-2.5 text-sm bg-orange-50/50 border border-orange-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                        />
                        {formData.cover_image_url && (
                            <div className="mt-2 w-32 h-20 rounded-xl overflow-hidden border border-orange-200">
                                <img src={formData.cover_image_url} alt="Cover preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-orange-100 flex items-center justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                        >
                            {t('বাতিল', 'Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-orange-800 hover:bg-orange-900 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            <span>{sammelan ? t('আপডেট করুন', 'Update Sammelan') : t('সংরক্ষণ করুন', 'Save Sammelan')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SammelanFormModal;
