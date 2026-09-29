import React, { useState, useEffect } from 'react';
import { X, MapPin, ExternalLink, Save, Trash2, Clipboard, Check, AlertCircle, Globe } from 'lucide-react';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const BariMapModal = ({ isOpen, onClose, homeName, villageName, currentLink, onSaved }) => {
    const { t, isBn } = useLanguage();
    const { isAdmin } = useAuth();
    const [mapUrl, setMapUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMapUrl(currentLink || '');
            setError('');
            setCopied(false);
        }
    }, [isOpen, currentLink]);

    if (!isOpen || !isAdmin) return null;

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setMapUrl(text.trim());
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch {
            // Clipboard access not allowed or unavailable
        }
    };

    const validateUrl = (url) => {
        if (!url || !url.trim()) return true;
        const trimmed = url.trim();
        return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('maps.app.goo.gl') || trimmed.includes('google.com/maps');
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setError('');

        const cleanedUrl = mapUrl.trim();

        if (cleanedUrl && !validateUrl(cleanedUrl)) {
            setError(t('অনুগ্রহ করে সঠিক গুগল ম্যাপ লিংক দিন (যেমন: https://maps.app.goo.gl/...)', 'Please enter a valid Google Maps URL (e.g. https://maps.app.goo.gl/...)'));
            return;
        }

        try {
            setLoading(true);
            const res = await api.put('/family/home-map', {
                home_name: homeName,
                village: villageName,
                map_link: cleanedUrl
            });

            if (onSaved) {
                onSaved(cleanedUrl, res.data);
            }
            onClose();
        } catch (err) {
            console.error('Error saving map link:', err);
            setError(err.response?.data?.error || t('ম্যাপ লিংক সংরক্ষণ করতে সমস্যা হয়েছে।', 'Failed to save Google Map link.'));
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        if (!window.confirm(t('আপনি কি নিশ্চিত যে এই বাড়ির গুগল ম্যাপ লিংকটি মুছে ফেলতে চান?', 'Are you sure you want to remove the Google Map link for this home?'))) {
            return;
        }

        try {
            setLoading(true);
            await api.put('/family/home-map', {
                home_name: homeName,
                village: villageName,
                map_link: ''
            });

            if (onSaved) {
                onSaved('', null);
            }
            onClose();
        } catch (err) {
            console.error('Error clearing map link:', err);
            setError(err.response?.data?.error || t('ম্যাপ লিংক মুছতে সমস্যা হয়েছে।', 'Failed to remove Google Map link.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-orange-100 overflow-hidden transform transition-all animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-800 via-orange-900 to-red-900 text-white p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shadow-inner">
                            <MapPin size={22} className="animate-bounce" />
                        </div>
                        <div>
                            <h3 className="text-lg font-serif font-bold text-white tracking-wide">
                                {t('গুগল ম্যাপে বাড়ির অবস্থান', 'Bari Google Map Location')}
                            </h3>
                            <p className="text-orange-200/80 text-xs truncate max-w-[240px]">
                                {homeName} {villageName ? `• ${villageName}` : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-orange-200 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSave} className="p-6 space-y-4 text-left">
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Globe size={14} className="text-orange-700" />
                                <span>{t('গুগল ম্যাপ লিংক (URL)', 'Google Map Link (URL)')}</span>
                            </label>
                            <button
                                type="button"
                                onClick={handlePaste}
                                className="text-[11px] font-semibold text-orange-700 hover:text-orange-800 flex items-center gap-1 hover:underline cursor-pointer"
                            >
                                {copied ? <Check size={12} className="text-green-600" /> : <Clipboard size={12} />}
                                <span>{copied ? t('পেস্ট হয়েছে!', 'Pasted!') : t('ক্লিপবোর্ড থেকে পেস্ট', 'Paste')}</span>
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                type="url"
                                autoFocus
                                value={mapUrl}
                                onChange={e => {
                                    setMapUrl(e.target.value);
                                    if (error) setError('');
                                }}
                                placeholder="https://maps.app.goo.gl/... বা https://goo.gl/maps/..."
                                className="w-full px-3.5 py-2.5 text-sm bg-orange-50/30 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-stone-400"
                            />
                            {mapUrl && (
                                <button
                                    type="button"
                                    onClick={() => setMapUrl('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                            {t('গুগল ম্যাপ অ্যাপ বা ওয়েবসাইট থেকে বাড়ির লোকেশনে গিয়ে "Share" এ ক্লিক করে লিংক কপি করুন এবং এখানে পেস্ট করুন।', 'Open Google Maps, find this Bari, tap "Share" and copy the link, then paste it here.')}
                        </p>
                    </div>

                    {/* Test Link Button */}
                    {mapUrl.trim() && (
                        <div className="pt-1">
                            <a
                                href={mapUrl.trim().startsWith('http') ? mapUrl.trim() : `https://${mapUrl.trim()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <ExternalLink size={13} />
                                <span>{t('লিংকটি টেস্ট করে দেখুন (নতুন ট্যাবে খুলবে)', 'Test Link (Opens in new tab)')}</span>
                            </a>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl animate-fade-in">
                            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                        {currentLink ? (
                            <button
                                type="button"
                                disabled={loading}
                                onClick={handleRemove}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 size={14} />
                                <span>{t('লিংক মুছুন', 'Remove')}</span>
                            </button>
                        ) : (
                            <div></div>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                            >
                                {t('বাতিল', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-700 to-red-700 hover:from-orange-800 hover:to-red-800 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                <Save size={14} />
                                <span>{loading ? t('সংরক্ষণ হচ্ছে...', 'Saving...') : t('সংরক্ষণ করুন', 'Save Link')}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BariMapModal;
