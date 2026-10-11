import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Sparkles, MapPin, Calendar, Clock, Home as HomeIcon, 
    User, AlertCircle, Search, CheckCircle2, ExternalLink, Image as ImageIcon,
    Upload, Trash2, Camera, Loader2, Lock 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

const SammelanFormModal = ({ isOpen, onClose, sammelan, onSave }) => {
    const { t, formatNumber } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const fileInputRef = useRef(null);

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
        images: [],
        is_next: false
    });

    // High-quality smart client-side compression:
    // Reduces huge camera photos (e.g. 10MB) to ~350KB-600KB without dropping visible quality
    const compressImageFile = async (file) => {
        if (!file || !file.type.startsWith('image/') || file.size < 300 * 1024) {
            return file;
        }

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let { width, height } = img;
                    const maxDim = 2048;

                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob && blob.size < file.size) {
                                const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                                    type: 'image/jpeg',
                                    lastModified: Date.now()
                                });
                                resolve(compressed);
                            } else {
                                resolve(file);
                            }
                        },
                        'image/jpeg',
                        0.86 // High perceptual quality
                    );
                };
                img.onerror = () => resolve(file);
                img.src = e.target.result;
            };
            reader.onerror = () => resolve(file);
            reader.readAsDataURL(file);
        });
    };

    // Handle direct device file upload (supports single or multiple files!)
    const handleImageFileChange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        for (const file of files) {
            if (file.size > 20 * 1024 * 1024) {
                setError(t('প্রতিটি ছবির সাইজ সর্বোচ্চ ২০ মেগাবাইট হতে পারে', 'Each image size must be under 20MB'));
                return;
            }
        }

        try {
            setUploadingImage(true);
            setError('');
            const newUrls = [];

            for (const originalFile of files) {
                const file = await compressImageFile(originalFile);
                const data = new FormData();
                data.append('file', file);
                data.append('category', 'sammelan');

                const res = await api.post('/upload', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const uploadedUrl = res.data.filePath || res.data.fileUrl;
                if (uploadedUrl) {
                    newUrls.push(uploadedUrl);
                }
            }

            if (newUrls.length > 0) {
                setFormData(prev => {
                    const currentImages = Array.isArray(prev.images) ? [...prev.images] : [];
                    newUrls.forEach(url => {
                        if (!currentImages.includes(url)) currentImages.push(url);
                    });
                    return {
                        ...prev,
                        images: currentImages,
                        cover_image_url: prev.cover_image_url || currentImages[0] || ''
                    };
                });
            }
        } catch (err) {
            console.error('Image upload failed:', err);
            setError(err.response?.data?.error || t('ছবি আপলোড করতে সমস্যা হয়েছে', 'Failed to upload image(s)'));
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAddUrlImage = () => {
        if (!urlInput || !urlInput.trim()) return;
        const trimmed = urlInput.trim();
        setFormData(prev => {
            const currentImages = Array.isArray(prev.images) ? [...prev.images] : [];
            if (!currentImages.includes(trimmed)) {
                currentImages.push(trimmed);
            }
            return {
                ...prev,
                images: currentImages,
                cover_image_url: prev.cover_image_url || trimmed
            };
        });
        setUrlInput('');
    };

    const handleRemoveImage = (indexToRemove) => {
        setFormData(prev => {
            const currentImages = Array.isArray(prev.images) ? [...prev.images] : [];
            const removed = currentImages[indexToRemove];
            const updated = currentImages.filter((_, idx) => idx !== indexToRemove);
            let nextCover = prev.cover_image_url;
            if (nextCover === removed) {
                nextCover = updated[0] || '';
            }
            return {
                ...prev,
                images: updated,
                cover_image_url: nextCover
            };
        });
    };

    const handleSetCoverImage = (imgUrl) => {
        setFormData(prev => ({
            ...prev,
            cover_image_url: imgUrl
        }));
    };

    // Home / Bari search autocomplete state
    const [homeQuery, setHomeQuery] = useState('');
    const [homeResults, setHomeResults] = useState([]);
    const [searchingHomes, setSearchingHomes] = useState(false);
    const [showHomeDropdown, setShowHomeDropdown] = useState(false);
    const [selectedHomeName, setSelectedHomeName] = useState('');
    const [isBariMapLocked, setIsBariMapLocked] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (sammelan) {
            let initialImages = [];
            if (sammelan.images) {
                if (Array.isArray(sammelan.images)) {
                    initialImages = [...sammelan.images];
                } else if (typeof sammelan.images === 'string') {
                    try {
                        const parsed = JSON.parse(sammelan.images);
                        if (Array.isArray(parsed)) initialImages = parsed;
                    } catch (e) {
                        initialImages = [];
                    }
                }
            }
            if (sammelan.cover_image_url && !initialImages.includes(sammelan.cover_image_url)) {
                initialImages = [sammelan.cover_image_url, ...initialImages];
            }

            const hasLockedMap = Boolean(sammelan.home_id && sammelan.home_map_link && sammelan.home_map_link.trim());
            setIsBariMapLocked(hasLockedMap);

            setFormData({
                edition: sammelan.edition || '',
                title: sammelan.title || '',
                bengali_date: sammelan.bengali_date || '',
                date: sammelan.date ? sammelan.date.split('T')[0] : '',
                time: sammelan.time || 'সকাল ১০:০০ ঘটিকা',
                home_id: sammelan.home_id || null,
                venue_name: sammelan.venue_name || '',
                venue_address: sammelan.venue_address || '',
                map_link: hasLockedMap ? sammelan.home_map_link.trim() : (sammelan.map_link || ''),
                president_name: sammelan.president_name || '',
                secretary_name: sammelan.secretary_name || '',
                description: sammelan.description || '',
                special_notes: sammelan.special_notes || '',
                cover_image_url: sammelan.cover_image_url || initialImages[0] || '',
                images: initialImages,
                is_next: Boolean(sammelan.is_next)
            });
            setSelectedHomeName(sammelan.home_name || sammelan.venue_name || '');
            setHomeQuery('');
        } else {
            setIsBariMapLocked(false);
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
                images: [],
                is_next: false
            });
            setSelectedHomeName('');
            setHomeQuery('');
        }
        setUrlInput('');
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
        const hasBariMap = Boolean(home.map_link && home.map_link.trim());
        setFormData(prev => ({
            ...prev,
            home_id: home.id,
            venue_name: home.home_name,
            venue_address: home.full_address,
            // If the bari already has a map link, show it. If not, the box is empty!
            map_link: hasBariMap ? home.map_link.trim() : ''
        }));
        setIsBariMapLocked(hasBariMap);
        setSelectedHomeName(home.home_name);
        setHomeQuery('');
        setShowHomeDropdown(false);
    };

    const handleUnlinkHome = () => {
        setFormData(prev => ({
            ...prev,
            home_id: null,
            map_link: ''
        }));
        setSelectedHomeName('');
        setIsBariMapLocked(false);
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
                                <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>{t('বাড়ি সংযুক্ত', 'Linked')}: {selectedHomeName}</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleUnlinkHome}
                                        className="text-[10px] text-stone-500 hover:text-red-700 hover:underline px-1 py-0.5 cursor-pointer font-bold"
                                        title={t('বাড়ি সংযোগ বিচ্ছিন্ন করুন', 'Unlink Bari')}
                                    >
                                        ✕ {t('মুছুন', 'Remove')}
                                    </button>
                                </div>
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

                        {/* Google Map Link (Synced with Bari) */}
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-semibold text-stone-600 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-orange-700" />
                                    <span>{t('গুগল ম্যাপ লিংক', 'Google Map Link')}</span>
                                    {isBariMapLocked && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                            <Lock className="w-2.5 h-2.5" />
                                            <span>{t('বংশতালিকার লিংক (অপরিবর্তনযোগ্য)', 'Lineage Link (Locked)')}</span>
                                        </span>
                                    )}
                                </label>

                                {formData.map_link && (
                                    <a
                                        href={formData.map_link.startsWith('http') ? formData.map_link : `https://${formData.map_link}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 hover:text-orange-900 hover:underline cursor-pointer"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        <span>{t('ম্যাপে দেখুন', 'Open Map')}</span>
                                    </a>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    type="url"
                                    name="map_link"
                                    value={formData.map_link}
                                    onChange={handleChange}
                                    readOnly={isBariMapLocked}
                                    disabled={isBariMapLocked}
                                    placeholder={isBariMapLocked ? '' : "https://maps.google.com/..."}
                                    className={`w-full px-3 py-2 text-sm rounded-lg transition-all ${
                                        isBariMapLocked
                                            ? 'bg-amber-50/80 border-amber-300 text-stone-700 font-mono text-xs cursor-not-allowed select-all'
                                            : 'bg-white border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30'
                                    }`}
                                />
                                {isBariMapLocked && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-amber-700">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            {/* Status Notices */}
                            {isBariMapLocked ? (
                                <p className="text-[11px] text-amber-800 mt-1 flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>
                                        {t(
                                            'এই বাড়ির ম্যাপ লিংকটি বংশতালিকায় পূর্বনির্ধারিত রয়েছে, তাই এটি পরিবর্তনযোগ্য নয়।',
                                            'This Bari already has a Google Map link in Lineage Explorer and cannot be changed here.'
                                        )}
                                    </span>
                                </p>
                            ) : formData.home_id ? (
                                <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>
                                        {t(
                                            '💡 এই বাড়িতে পূর্বে কোনো ম্যাপ লিংক ছিল না (বক্সটি ফাঁকা রয়েছে)। এখানে লিংক দিলে তা স্বয়ংক্রিয়ভাবে বংশতালিকায় এই বাড়ির তথ্যেও সংরক্ষিত হয়ে যাবে।',
                                            '💡 This Bari had no map link (box is kept empty). Providing a link here will automatically update and sync to this Bari in Lineage Explorer.'
                                        )}
                                    </span>
                                </p>
                            ) : null}
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


                    {/* Row 7: Photo Memory / Gallery Album Upload */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5 text-stone-400" />
                                <span>{t('স্মৃতি অ্যালবাম ও স্থিরচিত্র (ঐচ্ছিক)', 'Photo Memories & Album (Optional)')}</span>
                                {formData.images?.length > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-orange-100 text-[10px] font-bold text-orange-800">
                                        {formData.images.length}
                                    </span>
                                )}
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowUrlInput(!showUrlInput)}
                                className="text-[11px] font-semibold text-orange-800 hover:text-orange-950 hover:underline cursor-pointer"
                            >
                                {showUrlInput ? t('ফাইল আপলোড মোড', 'Upload Files Mode') : t('বা ছবির লিংক দিন', 'Or Paste URL')}
                            </button>
                        </div>

                        {/* Hidden File Input (multiple allowed!) */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageFileChange}
                            accept="image/*"
                            multiple
                            className="hidden"
                        />

                        {/* URL input field if toggled */}
                        {showUrlInput && (
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="https://example.com/photo.jpg"
                                    className="flex-1 px-3.5 py-2 text-sm bg-orange-50/50 border border-orange-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddUrlImage();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddUrlImage}
                                    disabled={!urlInput.trim()}
                                    className="px-4 py-2 bg-orange-800 hover:bg-orange-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                                >
                                    {t('যুক্ত করুন', 'Add URL')}
                                </button>
                            </div>
                        )}

                        {/* Upload Dropzone / Button */}
                        <div
                            onClick={() => !uploadingImage && fileInputRef.current?.click()}
                            className={`w-full py-4 px-4 border-2 border-dashed border-orange-200 hover:border-orange-400 bg-orange-50/40 hover:bg-orange-50/80 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${uploadingImage ? 'opacity-70 pointer-events-none' : ''
                                }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-orange-100 group-hover:bg-orange-200 text-orange-800 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                                {uploadingImage ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-orange-800" />
                                ) : (
                                    <Upload className="w-5 h-5 text-orange-800" />
                                )}
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-stone-800">
                                {uploadingImage
                                    ? t('ছবি আপলোড হচ্ছে...', 'Uploading image(s)...')
                                    : t('কম্পিউটার বা মোবাইল থেকে ছবি নির্বাচন করুন (এক বা একাধিক)', 'Browse photos from device (single or multiple)')}
                            </p>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                                {t('JPG, PNG, WebP (সর্বোচ্চ ১৫ মেগাবাইট প্রতি ছবি)', 'JPG, PNG, WebP (Max 15MB each)')}
                            </p>
                        </div>

                        {/* Thumbnails of Added Photos */}
                        {formData.images && formData.images.length > 0 && (
                            <div className="pt-2">
                                <div className="text-[11px] font-semibold text-stone-500 mb-1.5 flex items-center justify-between">
                                    <span>{t('নির্বাচিত ছবির অ্যালবাম:', 'Selected Photo Album:')}</span>
                                    <span className="text-[10px] text-amber-800">
                                        {t('★ চিহ্নিত ছবিটি মূল ব্যানার হিসেবে প্রদর্শিত হবে', '★ Marked photo is the main cover')}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {formData.images.map((imgUrl, idx) => {
                                        const isCover = formData.cover_image_url === imgUrl;
                                        return (
                                            <div
                                                key={idx}
                                                className={`relative group rounded-xl overflow-hidden border-2 bg-stone-100 shadow-2xs aspect-4/3 transition-all ${isCover ? 'border-amber-500 ring-2 ring-amber-400/30' : 'border-stone-200 hover:border-orange-300'
                                                    }`}
                                            >
                                                <img
                                                    src={imgUrl}
                                                    alt={`Upload ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                {/* Cover Badge */}
                                                {isCover && (
                                                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 font-black text-[9px] shadow-sm flex items-center gap-1">
                                                        <span>★</span>
                                                        <span>{t('মূল ছবি', 'Cover')}</span>
                                                    </div>
                                                )}
                                                {/* Hover Overlay Controls */}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveImage(idx);
                                                            }}
                                                            className="p-1 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer transition-transform hover:scale-110"
                                                            title={t('মুছে ফেলুন', 'Remove')}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    {!isCover && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSetCoverImage(imgUrl);
                                                            }}
                                                            className="w-full py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 text-[10px] font-bold rounded-md shadow-xs cursor-pointer transition-colors"
                                                        >
                                                            {t('মূল ছবি করুন', 'Set as Cover')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
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
