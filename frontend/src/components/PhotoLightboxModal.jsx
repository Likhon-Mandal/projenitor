import React, { useState, useEffect, useCallback } from 'react';
import { 
    X, ChevronLeft, ChevronRight, ExternalLink, Download, 
    Maximize2, Camera, Images 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const toBnDigits = (num) => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num ?? '').replace(/[0-9]/g, d => bnDigits[d]);
};

const PhotoLightboxModal = ({
    isOpen,
    photos = [],
    initialIndex = 0,
    title = '',
    onClose
}) => {
    const { t, language } = useLanguage();
    const isBn = language === 'bn';
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Sync index when initialIndex changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(Math.min(Math.max(0, initialIndex), Math.max(0, photos.length - 1)));
        }
    }, [isOpen, initialIndex, photos.length]);

    // Navigation callbacks
    const handlePrev = useCallback(() => {
        setCurrentIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
    }, [photos.length]);

    const handleNext = useCallback(() => {
        setCurrentIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
    }, [photos.length]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, handlePrev, handleNext]);

    if (!isOpen || !photos || photos.length === 0) return null;

    const currentPhoto = photos[currentIndex];

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fadeIn"
            onClick={onClose}
        >
            {/* Top Bar Header */}
            <div 
                className="w-full px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white shrink-0 z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-orange-600/30 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                        <Camera className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold font-serif truncate text-orange-100">
                            {title || t('স্মৃতি স্থিরচিত্র অ্যালবাম', 'Photo Memory Album')}
                        </h3>
                        <p className="text-xs text-stone-400">
                            {t('ছবি', 'Photo')} {isBn ? toBnDigits(currentIndex + 1) : currentIndex + 1} {t('এর', 'of')} {isBn ? toBnDigits(photos.length) : photos.length}
                        </p>
                    </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2">
                    {currentPhoto && (
                        <a
                            href={currentPhoto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                            title={t('মূল ছবি নতুন ট্যাবে দেখুন', 'Open original in new tab')}
                        >
                            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-stone-300 hover:text-white hover:bg-red-500/30 rounded-full transition-colors cursor-pointer"
                        title={t('বন্ধ করুন (Esc)', 'Close (Esc)')}
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>
            </div>

            {/* Main Center Image Stage */}
            <div 
                className="relative flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden min-h-0"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Previous Button */}
                {photos.length > 1 && (
                    <button
                        type="button"
                        onClick={handlePrev}
                        className="absolute left-2 sm:left-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-orange-600 text-white flex items-center justify-center transition-all duration-200 border border-white/20 shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
                        title={t('পূর্ববর্তী ছবি', 'Previous Photo')}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}

                {/* Central Photo */}
                <div className="relative max-w-full max-h-full flex items-center justify-center">
                    <img
                        key={currentPhoto}
                        src={currentPhoto}
                        alt={`${title} - Photo ${currentIndex + 1}`}
                        className="max-h-[70vh] sm:max-h-[76vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-xl shadow-2xl transition-all duration-300 animate-fadeIn"
                    />
                </div>

                {/* Next Button */}
                {photos.length > 1 && (
                    <button
                        type="button"
                        onClick={handleNext}
                        className="absolute right-2 sm:right-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-orange-600 text-white flex items-center justify-center transition-all duration-200 border border-white/20 shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
                        title={t('পরবর্তী ছবি', 'Next Photo')}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Bottom Thumbnail Strip */}
            {photos.length > 1 && (
                <div 
                    className="w-full px-4 py-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-center shrink-0 z-10"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-2 max-w-full overflow-x-auto py-1 px-2 no-scrollbar">
                        {photos.map((url, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setCurrentIndex(idx)}
                                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-200 cursor-pointer ${
                                    idx === currentIndex 
                                        ? 'border-yellow-400 scale-105 shadow-md shadow-yellow-500/20' 
                                        : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/60'
                                }`}
                            >
                                <img
                                    src={url}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoLightboxModal;
