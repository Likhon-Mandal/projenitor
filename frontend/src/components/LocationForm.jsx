import React, { useState } from 'react';
import { X, Save, MapPin } from 'lucide-react';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';

const LocationForm = ({ isOpen, onClose, level, parentName, onSuccess }) => {
    const { t, isBn } = useLanguage();
    const [name, setName] = useState('');
    const [mapLink, setMapLink] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const levelDisplayName = () => {
        if (level === 'country') return t('দেশ', 'Country');
        if (level === 'district') return t('জেলা', 'District');
        if (level === 'upazila') return t('উপজেলা', 'Upazila');
        if (level === 'village') return t('গ্রাম', 'Village');
        if (level === 'home') return t('বাড়ি', 'Home');
        return level;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) return;

        try {
            setLoading(true);
            await api.post('/family/location', {
                level,
                name: name.trim(),
                parentName,
                map_link: level === 'home' ? mapLink.trim() : null
            });
            setName('');
            setMapLink('');
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || t('যুক্ত করতে সমস্যা হয়েছে', 'Failed to add location'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-left border border-orange-100 animate-slide-up">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-serif text-orange-950 font-bold capitalize">
                        {t(`নতুন ${levelDisplayName()} যোগ করুন`, `Add New ${levelDisplayName()}`)}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {parentName && (
                    <p className="text-xs text-stone-500 mb-4 bg-orange-50/60 p-2.5 rounded-xl border border-orange-100">
                        {t('অন্তর্ভুক্ত অঞ্চল:', 'Under:')} <span className="font-bold text-orange-900">{parentName}</span>
                    </p>
                )}

                {error && <p className="text-red-600 text-xs mb-3 bg-red-50 p-2 rounded border border-red-200">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                            {t(`${levelDisplayName()} এর নাম *`, `${levelDisplayName()} Name *`)}
                        </label>
                        <input
                            type="text"
                            required
                            autoFocus
                            className="w-full px-3 py-2 border rounded-xl border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm transition-all"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={t(`${levelDisplayName()} এর নাম লিখুন`, `Enter ${levelDisplayName()} name`)}
                        />
                    </div>

                    {level === 'home' && (
                        <div>
                            <label className="block text-xs font-bold text-stone-600 uppercase mb-1 flex items-center gap-1.5">
                                <MapPin size={13} className="text-orange-700" />
                                <span>{t('গুগল ম্যাপ লিংক (ঐচ্ছিক)', 'Google Map Link (Optional)')}</span>
                            </label>
                            <input
                                type="url"
                                className="w-full px-3 py-2 border rounded-xl border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-xs transition-all"
                                value={mapLink}
                                onChange={e => setMapLink(e.target.value)}
                                placeholder="https://maps.app.goo.gl/..."
                            />
                            <p className="text-[10px] text-stone-400 mt-1">
                                {t('গুগল ম্যাপের শেয়ার লিংক পেস্ট করুন', 'Paste Google Maps share link')}
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-orange-700 to-red-700 text-white font-bold py-2.5 rounded-xl hover:from-orange-800 hover:to-red-800 transition-all flex justify-center gap-2 items-center text-sm shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        <Save size={16} /> 
                        <span>{loading ? t('সংরক্ষণ হচ্ছে...', 'Saving...') : t(`${levelDisplayName()} সংরক্ষণ করুন`, `Save ${levelDisplayName()}`)}</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LocationForm;

