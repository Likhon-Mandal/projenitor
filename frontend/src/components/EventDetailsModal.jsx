import React, { useState, useEffect } from 'react';
import {
    X, Calendar, Clock, MapPin, ExternalLink, Image as ImageIcon,
    Video, Upload, Trash2, Heart, Sparkles, ChevronRight, Edit2,
    CheckCircle2, AlertCircle, Play, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';
import ConfirmModal from './ConfirmModal';
import { formatDateDDMMYYYY } from '../utils/dateUtils';

const EventDetailsModal = ({ isOpen, onClose, event, onEdit, onDelete, onEventUpdated }) => {
    const { isAdmin, user } = useAuth();
    const { t, isBn } = useLanguage();

    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'memories'
    const [memories, setMemories] = useState([]);
    const [loadingMemories, setLoadingMemories] = useState(false);

    // Upload state
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadType, setUploadType] = useState('file'); // 'file' | 'url'
    const [mediaType, setMediaType] = useState('photo'); // 'photo' | 'video'
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [caption, setCaption] = useState('');
    const [uploaderName, setUploaderName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    // Lightbox state
    const [lightboxImage, setLightboxImage] = useState(null);
    const [confirmDeleteMemoryId, setConfirmDeleteMemoryId] = useState(null);

    // Reset and fetch memories when event opens
    useEffect(() => {
        if (isOpen && event?.id) {
            setUploaderName(user?.name || user?.username || '');
            setShowUploadForm(false);
            setUploadError('');
            setSelectedFile(null);
            setPreviewUrl('');
            setVideoUrl('');
            setCaption('');
            fetchMemories(event.id);
        }
    }, [isOpen, event?.id, user]);

    // Cleanup object URL
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const fetchMemories = async (eventId) => {
        try {
            setLoadingMemories(true);
            const res = await api.get(`/events/${eventId}/memories`);
            setMemories(res.data);
        } catch (err) {
            console.error('Error fetching memories:', err);
        } finally {
            setLoadingMemories(false);
        }
    };

    if (!isOpen || !event) return null;

    // Check if event is in the past
    const isPreviousEvent = () => {
        if (!event.date) return false;
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const dateStr = String(event.date).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr < todayStr;
        }
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return parsed < today;
        }
        return false;
    };

    const isPast = isPreviousEvent();

    // Days remaining calculation
    const getDaysRemainingText = () => {
        if (!event.date) return null;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const target = new Date(event.date);
        target.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return { text: t('আজকে অনুষ্ঠিত হচ্ছে!', 'Happening Today!'), isToday: true };
        } else if (diffDays === 1) {
            return { text: t('আগামীকাল অনুষ্ঠিত হবে', 'Happening Tomorrow'), isSoon: true };
        } else if (diffDays > 1) {
            return { text: t(`${diffDays} দিন বাকি`, `${diffDays} days left`), isSoon: diffDays <= 7 };
        } else {
            const pastDays = Math.abs(diffDays);
            return { text: t(`${pastDays} দিন আগে সম্পন্ন`, `Concluded ${pastDays} days ago`), isPast: true };
        }
    };

    const remaining = getDaysRemainingText();

    // YouTube parser
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    };

    // File selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Determine type
        if (file.type.startsWith('video/')) {
            setMediaType('video');
        } else {
            setMediaType('photo');
        }

        setSelectedFile(file);
        setUploadError('');
        const objUrl = URL.createObjectURL(file);
        setPreviewUrl(objUrl);
    };

    // Handle memory submission
    const handleUploadMemory = async (e) => {
        e.preventDefault();
        setUploadError('');

        let finalMediaUrl = '';
        let finalMediaType = mediaType;

        if (uploadType === 'url') {
            if (!videoUrl.trim()) {
                setUploadError(t('দয়া করে একটি বৈধ ভিডিও লিংক দিন', 'Please enter a valid video URL'));
                return;
            }
            finalMediaUrl = videoUrl.trim();
            finalMediaType = 'video';
        } else {
            if (!selectedFile) {
                setUploadError(t('দয়া করে একটি ছবি বা ভিডিও ফাইল নির্বাচন করুন', 'Please select a photo or video file'));
                return;
            }

            try {
                setIsUploading(true);
                const formData = new FormData();
                formData.append('file', selectedFile);

                const uploadRes = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                finalMediaUrl = uploadRes.data.filePath;
                if (uploadRes.data.mediaType) {
                    finalMediaType = uploadRes.data.mediaType;
                }
            } catch (err) {
                console.error('File upload error:', err);
                setIsUploading(false);
                setUploadError(err.response?.data?.error || t('ফাইল আপলোড করতে সমস্যা হয়েছে', 'File upload failed'));
                return;
            }
        }

        // Save memory record
        try {
            setIsUploading(true);
            const memoryPayload = {
                media_type: finalMediaType,
                media_url: finalMediaUrl,
                caption: caption.trim(),
                uploaded_by: uploaderName.trim() || t('পরিবারের সদস্য', 'Family Member')
            };

            await api.post(`/events/${event.id}/memories`, memoryPayload);

            // Reset form
            setSelectedFile(null);
            setPreviewUrl('');
            setVideoUrl('');
            setCaption('');
            setShowUploadForm(false);

            // Refetch
            await fetchMemories(event.id);
            if (onEventUpdated) onEventUpdated();
        } catch (err) {
            console.error('Error saving memory:', err);
            setUploadError(err.response?.data?.error || t('স্মৃতি সংরক্ষণ করতে ব্যর্থ হয়েছে', 'Failed to save memory'));
        } finally {
            setIsUploading(false);
        }
    };

    // Handle delete memory
    const performDeleteMemory = async (memoryId) => {
        try {
            await api.delete(`/events/${event.id}/memories/${memoryId}`);
            setMemories(prev => prev.filter(m => m.id !== memoryId));
            if (onEventUpdated) onEventUpdated();
        } catch (err) {
            console.error('Error deleting memory:', err);
            alert(err.response?.data?.error || t('স্মৃতি মুছতে ব্যর্থ হয়েছে', 'Failed to delete memory'));
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in" onClick={onClose}>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-sm transition-opacity"></div>

            {/* Modal Dialog */}
            <div
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col border border-orange-200 animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Warm Indian/Saffron Theme */}
                <div className="bg-gradient-to-r from-orange-800 via-orange-700 to-amber-700 text-white p-5 sm:p-6 relative shrink-0">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2 flex-1 pr-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${isPast
                                        ? 'bg-amber-900/60 text-amber-200 border border-amber-600/40'
                                        : 'bg-yellow-400 text-stone-900 font-extrabold border border-yellow-300'
                                    }`}>
                                    <Sparkles size={13} />
                                    {isPast ? t('পূর্ববর্তী অনুষ্ঠান', 'Previous Event') : t('আসন্ন অনুষ্ঠান', 'Upcoming Event')}
                                </span>

                                {remaining && (
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${remaining.isToday
                                            ? 'bg-red-500 text-white animate-pulse'
                                            : remaining.isSoon
                                                ? 'bg-orange-500/80 text-white'
                                                : 'bg-black/25 text-white/90'
                                        }`}>
                                        {remaining.text}
                                    </span>
                                )}
                            </div>

                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white tracking-wide leading-snug">
                                {event.title}
                            </h2>
                        </div>

                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors shrink-0"
                            title={t('বন্ধ করুন', 'Close')}
                        >
                            <X size={22} />
                        </button>
                    </div>

                    {/* Three Justified Options: Event Details, Memories & Gallery, View Map */}
                    {isPast && (
                        <div className="w-full mt-4 pt-4 border-t border-white/15">
                            <div className={`grid gap-2 sm:gap-3 w-full ${(event.map_link || event.location) ? 'grid-cols-3' : 'grid-cols-2'
                                }`}>
                                {/* Option 1: Event Details */}
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`w-full py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-xs border ${activeTab === 'details'
                                            ? 'bg-white text-orange-950 border-white shadow-md font-extrabold scale-[1.02]'
                                            : 'bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border-white/15'
                                        }`}
                                >
                                    <Calendar size={15} className={`shrink-0 ${activeTab === 'details' ? 'text-orange-800' : 'text-orange-200'}`} />
                                    <span className="truncate">
                                        <span className="hidden sm:inline">{t('অনুষ্ঠানের বিবরণ', 'Event Details')}</span>
                                        <span className="sm:hidden">{t('বিবরণ', 'Details')}</span>
                                    </span>
                                </button>

                                {/* Option 2: Memories & Gallery */}
                                <button
                                    onClick={() => setActiveTab('memories')}
                                    className={`w-full py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 relative cursor-pointer shadow-xs border ${activeTab === 'memories'
                                            ? 'bg-yellow-400 text-stone-900 border-yellow-300 shadow-md font-extrabold scale-[1.02]'
                                            : 'bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border-white/15'
                                        }`}
                                >
                                    <Heart size={15} className={`shrink-0 ${activeTab === 'memories' ? 'fill-current text-red-600' : 'text-red-400'}`} />
                                    <span className="truncate">
                                        <span className="hidden sm:inline">{t('স্মৃতিমালা ও গ্যালারি', 'Memories & Gallery')}</span>
                                        <span className="sm:hidden">{t('স্মৃতিমালা', 'Memories')}</span>
                                    </span>
                                    {memories.length > 0 && (
                                        <span className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${activeTab === 'memories' ? 'bg-red-600 text-white' : 'bg-white/20 text-white'
                                            }`}>
                                            {memories.length}
                                        </span>
                                    )}
                                </button>

                                {/* Option 3: View on Map */}
                                {(event.map_link || event.location) && (
                                    <a
                                        href={event.map_link ? event.map_link : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-xs bg-white/10 hover:bg-white/25 text-white hover:text-yellow-300 border border-white/15 hover:border-yellow-400/40 group scale-[1] hover:scale-[1.02] active:scale-95"
                                        title={t('ম্যাপ খুলুন', 'Open Map')}
                                    >
                                        <MapPin size={15} className="text-yellow-300 group-hover:text-yellow-200 transition-colors shrink-0" />
                                        <span className="truncate">
                                            <span className="hidden sm:inline">{t('ম্যাপ খুলুন', 'Open Map')}</span>
                                            <span className="sm:hidden">{t('ম্যাপ', 'Map')}</span>
                                        </span>
                                        <ExternalLink size={12} className="text-white/60 group-hover:text-yellow-300 transition-colors shrink-0 hidden sm:inline" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Upcoming event map link if applicable */}
                    {!isPast && (event.map_link || event.location) && (
                        <div className="flex justify-end mt-4 pt-4 border-t border-white/15">
                            <a
                                href={event.map_link ? event.map_link : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white hover:text-yellow-300 border border-white/15 hover:border-yellow-400/40 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer group"
                            >
                                <MapPin size={15} className="text-yellow-300 group-hover:text-yellow-200 transition-colors shrink-0" />
                                <span>{t('গুগল ম্যাপে দেখুন', 'View on Google Maps')}</span>
                                <ExternalLink size={12} className="text-white/60 group-hover:text-yellow-300 transition-colors shrink-0" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Modal Body with Scrolling */}
                <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6 bg-orange-50/30">
                    {/* DETAILS VIEW */}
                    {(!isPast || activeTab === 'details') && (
                        <div className="space-y-6">
                            {/* Key info pill row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-white p-3.5 rounded-2xl border border-orange-100 shadow-sm flex items-center gap-3">
                                    <div className="p-2.5 bg-orange-100 text-orange-800 rounded-xl">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{t('তারিখ', 'Date')}</p>
                                        <p className="text-sm font-bold text-stone-800">{formatDateDDMMYYYY(event.date)}</p>
                                    </div>
                                </div>

                                <div className="bg-white p-3.5 rounded-2xl border border-orange-100 shadow-sm flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{t('সময়', 'Time')}</p>
                                        <p className="text-sm font-bold text-stone-800">{event.time || t('অনির্ধারিত', 'Not specified')}</p>
                                    </div>
                                </div>

                                <div className="bg-white p-3.5 rounded-2xl border border-orange-100 shadow-sm flex items-center gap-3">
                                    <div className="p-2.5 bg-red-100 text-red-800 rounded-xl">
                                        <MapPin size={20} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{t('স্থান', 'Location')}</p>
                                        <p className="text-sm font-bold text-stone-800 truncate" title={event.location}>{event.location || t('অনির্ধারিত', 'Not specified')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description Section */}
                            <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm space-y-3">
                                <h3 className="text-sm font-serif font-bold text-stone-800 uppercase tracking-wide text-orange-900 border-b border-orange-50 pb-2">
                                    {t('অনুষ্ঠানের বিস্তারিত বিবরণ', 'Full Description & Agenda')}
                                </h3>
                                {event.description ? (
                                    <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                        {event.description}
                                    </p>
                                ) : (
                                    <p className="text-stone-400 text-sm italic">
                                        {t('কোনো অতিরিক্ত বিবরণ প্রদান করা হয়নি।', 'No additional details provided.')}
                                    </p>
                                )}
                            </div>

                            {/* Quick teaser to memories for past events */}
                            {isPast && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-yellow-400 text-stone-900 rounded-xl shadow-sm">
                                            <Heart size={20} className="fill-current text-red-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-stone-800">{t('অনুষ্ঠানের রঙিন স্মৃতিমালা', 'Cherished Event Memories')}</h4>
                                            <p className="text-xs text-stone-500">
                                                {memories.length > 0
                                                    ? t(`${memories.length}টি ছবি ও ভিডিও স্মৃতি সংরক্ষিত রয়েছে।`, `${memories.length} photo & video memories saved.`)
                                                    : t('এই অনুষ্ঠানের ছবি বা ভিডিও স্মৃতি সংরক্ষিত থাকবে।', 'Photos & videos from this gathering are preserved here.')}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('memories')}
                                        className="w-full sm:w-auto px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5"
                                    >
                                        {isAdmin
                                            ? t('স্মৃতিমালা দেখুন ও যোগ করুন', 'Explore & Add Memories')
                                            : t('স্মৃতিমালা দেখুন', 'Explore Memories')}
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MEMORIES VIEW (Only available for past events) */}
                    {isPast && activeTab === 'memories' && (
                        <div className="space-y-6">
                            {/* Action Bar */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-orange-100 shadow-sm">
                                <div>
                                    <h3 className="text-base font-serif font-bold text-stone-800 flex items-center gap-2">
                                        <Sparkles size={18} className="text-yellow-500" />
                                        {t('অনুষ্ঠানের স্মৃতিমালা (ছবি ও ভিডিও)', 'Event Memories (Photos & Videos)')}
                                    </h3>
                                    <p className="text-xs text-stone-500">
                                        {isAdmin
                                            ? t('অ্যাডমিন হিসেবে আপনি ছবি ও ভিডিও স্মৃতি আপলোড করতে পারেন।', 'As admin, you can upload photo and video memories.')
                                            : t('অনুষ্ঠানের স্মৃতিময় মুহূর্তগুলোর সংরক্ষিত গ্যালারি।', 'A preserved gallery of cherished moments from this gathering.')}
                                    </p>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowUploadForm(prev => !prev)}
                                        className="px-4 py-2 bg-gradient-to-r from-orange-700 to-amber-600 hover:from-orange-800 hover:to-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
                                    >
                                        {showUploadForm ? <X size={16} /> : <Upload size={16} />}
                                        {showUploadForm ? t('ফর্ম বন্ধ করুন', 'Cancel') : t('স্মৃতি যোগ করুন', 'Add Memory')}
                                    </button>
                                )}
                            </div>

                            {/* Upload Form Card (Admin Only) */}
                            {isAdmin && showUploadForm && (
                                <form
                                    onSubmit={handleUploadMemory}
                                    className="bg-white p-5 rounded-2xl border-2 border-orange-300 shadow-md space-y-4 animate-slide-up"
                                >
                                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                                        <h4 className="text-sm font-serif font-bold text-stone-800 flex items-center gap-1.5">
                                            <Upload size={16} className="text-orange-600" />
                                            {t('নতুন স্মৃতি আপলোড করুন', 'Upload New Memory')}
                                        </h4>

                                        {/* Upload Mode Pill */}
                                        <div className="flex bg-stone-100 p-0.5 rounded-lg text-xs">
                                            <button
                                                type="button"
                                                onClick={() => { setUploadType('file'); setVideoUrl(''); }}
                                                className={`px-2.5 py-1 rounded-md font-bold transition-all ${uploadType === 'file' ? 'bg-white text-orange-800 shadow-sm' : 'text-stone-500'
                                                    }`}
                                            >
                                                {t('ফাইল আপলোড', 'Direct File')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setUploadType('url'); setSelectedFile(null); setPreviewUrl(''); }}
                                                className={`px-2.5 py-1 rounded-md font-bold transition-all ${uploadType === 'url' ? 'bg-white text-orange-800 shadow-sm' : 'text-stone-500'
                                                    }`}
                                            >
                                                {t('ভিডিও লিংক', 'Video Link')}
                                            </button>
                                        </div>
                                    </div>

                                    {uploadError && (
                                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                                            <AlertCircle size={16} className="shrink-0" />
                                            <span>{uploadError}</span>
                                        </div>
                                    )}

                                    {/* Direct File Picker */}
                                    {uploadType === 'file' ? (
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-stone-700">
                                                {t('ছবি অথবা ভিডিও ফাইল বেছে নিন *', 'Choose Photo or Video File *')}
                                            </label>
                                            <div className="border-2 border-dashed border-orange-200 hover:border-orange-400 bg-orange-50/40 rounded-xl p-4 text-center cursor-pointer transition-colors relative">
                                                <input
                                                    type="file"
                                                    accept="image/*,video/*"
                                                    onChange={handleFileChange}
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                />
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <div className="p-3 bg-white rounded-full shadow-sm text-orange-600">
                                                        <Upload size={22} />
                                                    </div>
                                                    <p className="text-xs font-bold text-stone-700">
                                                        {selectedFile ? selectedFile.name : t('ছবি বা ভিডিও ড্রপ করুন অথবা ক্লিক করে নির্বাচন করুন', 'Click to choose or drag & drop photo/video')}
                                                    </p>
                                                    <p className="text-[11px] text-stone-400">
                                                        {t('সমর্থিত ফরম্যাট: JPG, PNG, WEBP, MP4, MOV, WEBM (সর্বোচ্চ ১০০ মেগাবাইট)', 'Formats: JPG, PNG, WEBP, MP4, MOV, WEBM (Max 100MB)')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Preview */}
                                            {previewUrl && (
                                                <div className="mt-3 p-2 bg-stone-50 rounded-xl border border-stone-200">
                                                    <p className="text-[11px] font-bold text-stone-500 mb-1">{t('প্রিভিউ:', 'Preview:')}</p>
                                                    {mediaType === 'video' ? (
                                                        <video src={previewUrl} controls className="max-h-48 w-full rounded-lg bg-black object-contain" />
                                                    ) : (
                                                        <img src={previewUrl} alt="Preview" className="max-h-48 w-full rounded-lg object-contain bg-stone-100" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-stone-700">
                                                {t('ভিডিও লিংক (YouTube / Vimeo ইত্যাদি) *', 'Video Link (YouTube / Vimeo etc.) *')}
                                            </label>
                                            <input
                                                type="url"
                                                value={videoUrl}
                                                onChange={e => setVideoUrl(e.target.value)}
                                                placeholder="https://www.youtube.com/watch?v=..."
                                                className="w-full border border-stone-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                required
                                            />
                                            {getYouTubeEmbedUrl(videoUrl) && (
                                                <div className="aspect-video w-full max-h-48 rounded-xl overflow-hidden mt-2 border border-stone-200">
                                                    <iframe
                                                        src={getYouTubeEmbedUrl(videoUrl)}
                                                        title="YouTube preview"
                                                        className="w-full h-full"
                                                        allowFullScreen
                                                    ></iframe>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Caption & Uploader */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-stone-700 mb-1">
                                                {t('ক্যাপশন / স্মৃতিচারণ (ঐচ্ছিক)', 'Caption / Notes (Optional)')}
                                            </label>
                                            <input
                                                type="text"
                                                value={caption}
                                                onChange={e => setCaption(e.target.value)}
                                                placeholder={t('যেমন: অনুষ্ঠানের সমাপ্তি গ্রুপ ফটো', 'e.g., Grand reunion group picture')}
                                                className="w-full border border-stone-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-orange-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-stone-700 mb-1">
                                                {t('আপলোডকারীর নাম', 'Your Name')}
                                            </label>
                                            <input
                                                type="text"
                                                value={uploaderName}
                                                onChange={e => setUploaderName(e.target.value)}
                                                placeholder={t('আপনার নাম লিখুন', 'Your name')}
                                                className="w-full border border-stone-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-orange-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                                        <button
                                            type="button"
                                            onClick={() => setShowUploadForm(false)}
                                            className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-100"
                                            disabled={isUploading}
                                        >
                                            {t('বাতিল', 'Cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="px-5 py-2 bg-orange-700 hover:bg-orange-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                                        >
                                            {isUploading ? (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>{t('আপলোড হচ্ছে...', 'Uploading...')}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={15} />
                                                    <span>{t('স্মৃতি প্রকাশ করুন', 'Publish Memory')}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Memories Gallery Grid */}
                            {loadingMemories ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-stone-100 text-stone-400 text-xs animate-pulse">
                                    {t('স্মৃতিমালা লোড হচ্ছে...', 'Loading memories...')}
                                </div>
                            ) : memories.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {memories.map((mem) => {
                                        const ytEmbed = mem.media_type === 'video' ? getYouTubeEmbedUrl(mem.media_url) : null;
                                        return (
                                            <div
                                                key={mem.id}
                                                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-orange-100 group transition-all duration-300 flex flex-col"
                                            >
                                                {/* Media Container */}
                                                <div className="relative aspect-video w-full bg-stone-900 flex items-center justify-center overflow-hidden">
                                                    {mem.media_type === 'video' ? (
                                                        ytEmbed ? (
                                                            <iframe
                                                                src={ytEmbed}
                                                                title={mem.caption || 'Video memory'}
                                                                className="w-full h-full"
                                                                allowFullScreen
                                                            ></iframe>
                                                        ) : (
                                                            <video
                                                                src={mem.media_url}
                                                                controls
                                                                className="w-full h-full object-contain"
                                                                preload="metadata"
                                                            />
                                                        )
                                                    ) : (
                                                        <div
                                                            className="w-full h-full cursor-pointer relative group/img overflow-hidden"
                                                            onClick={() => setLightboxImage(mem.media_url)}
                                                        >
                                                            <img
                                                                src={mem.media_url}
                                                                alt={mem.caption || 'Event memory'}
                                                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                                                                loading="lazy"
                                                            />
                                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                <Eye size={24} />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Badge for Type */}
                                                    <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                        {mem.media_type === 'video' ? <Video size={10} /> : <ImageIcon size={10} />}
                                                        {mem.media_type === 'video' ? t('ভিডিও', 'Video') : t('ছবি', 'Photo')}
                                                    </span>

                                                    {/* Admin delete button */}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => setConfirmDeleteMemoryId(mem.id)}
                                                            className="absolute top-2 right-2 p-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-lg shadow-md transition-colors opacity-0 group-hover:opacity-100"
                                                            title={t('স্মৃতি মুছুন', 'Delete Memory')}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Caption and Info */}
                                                <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                                                    {mem.caption && (
                                                        <p className="text-xs font-medium text-stone-800 leading-snug line-clamp-2">
                                                            {mem.caption}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-50">
                                                        <span className="font-bold text-stone-600 truncate max-w-[140px]">
                                                            {mem.uploaded_by || t('পরিবারের সদস্য', 'Family Member')}
                                                        </span>
                                                        <span>
                                                            {formatDateDDMMYYYY(mem.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 px-4 bg-white rounded-2xl border border-stone-100 space-y-3">
                                    <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                        <Heart size={26} className="fill-current text-red-500" />
                                    </div>
                                    <h4 className="text-sm font-bold text-stone-700">
                                        {t('এখনও কোনো ছবি বা ভিডিও স্মৃতি যোগ করা হয়নি', 'No Memories Uploaded Yet')}
                                    </h4>
                                    <p className="text-xs text-stone-400 max-w-sm mx-auto">
                                        {isAdmin
                                            ? t('এই অনুষ্ঠানের স্মরণীয় মুহূর্তগুলো সংরক্ষিত রাখতে প্রথম স্মৃতিটি আপনি যোগ করুন!', 'Be the first to share photos or videos from this cherished family gathering!')
                                            : t('এই অনুষ্ঠানের কোনো স্মৃতি এখনও সংরক্ষিত হয়নি।', 'No memories have been archived for this event yet.')}
                                    </p>
                                    {isAdmin && (
                                        <button
                                            onClick={() => setShowUploadForm(true)}
                                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                        >
                                            <Upload size={14} />
                                            {t('প্রথম স্মৃতি আপলোড করুন', 'Upload First Memory')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-white border-t border-orange-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        {isAdmin && onEdit && (
                            <button
                                onClick={() => { onClose(); onEdit(event); }}
                                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                                <Edit2 size={13} />
                                {t('সম্পাদনা', 'Edit')}
                            </button>
                        )}
                        {isAdmin && onDelete && (
                            <button
                                onClick={() => { onClose(); onDelete(event.id); }}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                                <Trash2 size={13} />
                                {t('মুছুন', 'Delete')}
                            </button>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                    >
                        {t('বন্ধ করুন', 'Close')}
                    </button>
                </div>
            </div>

            {/* Photo Lightbox Popup */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-orange-400 p-2 rounded-full bg-white/10"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Enlarged memory"
                        className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
                    />
                </div>
            )}

            {/* Custom Centered Deletion Confirmation Modal */}
            <ConfirmModal
                isOpen={!!confirmDeleteMemoryId}
                onClose={() => setConfirmDeleteMemoryId(null)}
                onConfirm={() => performDeleteMemory(confirmDeleteMemoryId)}
                title={t('স্মৃতি মুছে ফেলা নিশ্চিত করুন', 'Confirm Memory Deletion')}
                message={t('আপনি কি নিশ্চিতভাবে এই স্মৃতিটি মুছে ফেলতে চান?', 'Are you sure you want to remove this memory?')}
                confirmText={t('মুছে ফেলুন', 'Delete')}
            />
        </div>
    );
};

export default EventDetailsModal;
