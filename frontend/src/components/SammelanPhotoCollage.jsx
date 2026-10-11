import React from 'react';
import { Camera, Maximize2, Images } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const toBnDigits = (num) => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num ?? '').replace(/[0-9]/g, d => bnDigits[d]);
};

// Reusable Photo Tile covering maximum available space without empty letterboxing
const PhotoCoverTile = ({ src, alt, onClick, overlay }) => (
    <div
        onClick={onClick}
        className="relative w-full h-full group overflow-hidden rounded-xl bg-stone-900 cursor-pointer border border-orange-200/80 shadow-2xs hover:shadow-xs transition-all"
    >
        {/* Photo covers full tile space; anchored at top 20% to keep heads/faces in frame */}
        <img
            src={src}
            alt={alt}
            style={{ objectPosition: 'center 20%' }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Overlay (e.g. +x badge or hover expand icon) */}
        {overlay ? (
            <div className="absolute inset-0 z-10">
                {overlay}
            </div>
        ) : (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center z-5">
                <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
            </div>
        )}
    </div>
);

const SammelanPhotoCollage = ({ photos = [], onOpenPhoto, title = '' }) => {
    const { t, language } = useLanguage();
    const isBn = language === 'bn';

    if (!photos || photos.length === 0) return null;

    const total = photos.length;

    return (
        <div className="w-full space-y-1.5">
            {/* Header / Caption */}
            <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-950 font-serif">
                    <Camera className="w-3.5 h-3.5 text-orange-800 shrink-0" />
                    <span>{t('স্মৃতি অ্যালবাম ও স্থিরচিত্র', 'Photo Memories & Album')}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-orange-100 text-[10px] font-bold text-orange-800 border border-orange-200">
                        {isBn ? toBnDigits(total) : total}
                    </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-stone-500 font-medium hidden xs:inline">
                    {t('সম্পূর্ণ দেখতে যেকোনো ছবিতে ক্লিক করুন', 'Click any photo to view full size')}
                </span>
            </div>

            {/* ADAPTIVE COLLAGES: FITS AS MANY PHOTOS AS POSSIBLE, COVERS FULL SPACE */}

            {/* 1 Photo: Full single banner covering container */}
            {total === 1 && (
                <div className="h-52 sm:h-68 rounded-xl overflow-hidden">
                    <PhotoCoverTile
                        src={photos[0]}
                        alt={title || "সম্মেলনের স্মৃতিচিত্র"}
                        onClick={() => onOpenPhoto?.(0)}
                    />
                </div>
            )}

            {/* 2 Photos: 2 full columns covering width */}
            {total === 2 && (
                <div className="grid grid-cols-2 gap-2 h-44 sm:h-56 rounded-xl overflow-hidden">
                    {photos.map((img, idx) => (
                        <PhotoCoverTile
                            key={idx}
                            src={img}
                            alt={`${title} ${idx + 1}`}
                            onClick={() => onOpenPhoto?.(idx)}
                        />
                    ))}
                </div>
            )}

            {/* 3 Photos: 3 full columns covering width */}
            {total === 3 && (
                <div className="grid grid-cols-3 gap-2 h-40 sm:h-52 rounded-xl overflow-hidden">
                    {photos.map((img, idx) => (
                        <PhotoCoverTile
                            key={idx}
                            src={img}
                            alt={`${title} ${idx + 1}`}
                            onClick={() => onOpenPhoto?.(idx)}
                        />
                    ))}
                </div>
            )}

            {/* 4 Photos: 2x2 grid covering width and height */}
            {total === 4 && (
                <div className="grid grid-cols-2 gap-2 h-48 sm:h-64 rounded-xl overflow-hidden">
                    {photos.map((img, idx) => (
                        <PhotoCoverTile
                            key={idx}
                            src={img}
                            alt={`${title} ${idx + 1}`}
                            onClick={() => onOpenPhoto?.(idx)}
                        />
                    ))}
                </div>
            )}

            {/* 5 Photos: Fits all 5 photos! (2 prominent top + 3 balanced bottom) */}
            {total === 5 && (
                <div className="space-y-2 rounded-xl overflow-hidden">
                    {/* Row 1: 2 photos taking full width */}
                    <div className="grid grid-cols-2 gap-2 h-36 sm:h-48">
                        {photos.slice(0, 2).map((img, idx) => (
                            <PhotoCoverTile
                                key={idx}
                                src={img}
                                alt={`${title} ${idx + 1}`}
                                onClick={() => onOpenPhoto?.(idx)}
                            />
                        ))}
                    </div>

                    {/* Row 2: 3 photos taking full width */}
                    <div className="grid grid-cols-3 gap-2 h-30 sm:h-40">
                        {photos.slice(2, 5).map((img, idx) => (
                            <PhotoCoverTile
                                key={idx + 2}
                                src={img}
                                alt={`${title} ${idx + 3}`}
                                onClick={() => onOpenPhoto?.(idx + 2)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 6 Photos: Fits all 6 photos! (3 top + 3 bottom) */}
            {total === 6 && (
                <div className="space-y-2 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-3 gap-2 h-32 sm:h-42">
                        {photos.slice(0, 3).map((img, idx) => (
                            <PhotoCoverTile
                                key={idx}
                                src={img}
                                alt={`${title} ${idx + 1}`}
                                onClick={() => onOpenPhoto?.(idx)}
                            />
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 h-32 sm:h-42">
                        {photos.slice(3, 6).map((img, idx) => (
                            <PhotoCoverTile
                                key={idx + 3}
                                src={img}
                                alt={`${title} ${idx + 4}`}
                                onClick={() => onOpenPhoto?.(idx + 3)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 7 or More Photos: Fits 6 photos across 2 rows, with "+x" overlay on the 6th photo */}
            {total >= 7 && (
                <div className="space-y-2 rounded-xl overflow-hidden">
                    {/* Top Row: 3 photos */}
                    <div className="grid grid-cols-3 gap-2 h-32 sm:h-42">
                        {photos.slice(0, 3).map((img, idx) => (
                            <PhotoCoverTile
                                key={idx}
                                src={img}
                                alt={`${title} ${idx + 1}`}
                                onClick={() => onOpenPhoto?.(idx)}
                            />
                        ))}
                    </div>

                    {/* Bottom Row: 2 photos + 6th photo with +x badge */}
                    <div className="grid grid-cols-3 gap-2 h-32 sm:h-42">
                        {photos.slice(3, 5).map((img, idx) => (
                            <PhotoCoverTile
                                key={idx + 3}
                                src={img}
                                alt={`${title} ${idx + 4}`}
                                onClick={() => onOpenPhoto?.(idx + 3)}
                            />
                        ))}

                        {/* 6th Tile with +x Overlay */}
                        <PhotoCoverTile
                            src={photos[5]}
                            alt={`${title} 6`}
                            onClick={() => onOpenPhoto?.(5)}
                            overlay={
                                <div className="w-full h-full bg-black/65 group-hover:bg-black/75 backdrop-blur-xs transition-all flex flex-col items-center justify-center text-white p-2 text-center">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center mb-0.5 group-hover:scale-110 transition-transform shadow-xs">
                                        <Images className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300" />
                                    </div>
                                    <span className="text-base sm:text-xl font-black tracking-wide text-white drop-shadow-md leading-none mt-0.5">
                                        +{isBn ? toBnDigits(total - 5) : total - 5}
                                    </span>
                                    <span className="text-[10px] sm:text-[11px] font-semibold text-orange-200 mt-0.5">
                                        {isBn ? `${toBnDigits(total - 5)}টি ছবি` : `${total - 5} more`}
                                    </span>
                                </div>
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SammelanPhotoCollage;
