import React from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { usePWA } from '../context/PWAContext';
import { useLanguage } from '../context/LanguageContext';

const InstallAppBanner = () => {
  const { showBanner, isInstalled, promptInstall, dismissBanner } = usePWA();
  const { t } = useLanguage();

  if (!showBanner || isInstalled) return null;

  return (
    <div 
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-up"
      role="region"
      aria-label="Install Projenitor App Banner"
    >
      <div className="relative bg-gradient-to-r from-orange-900 via-orange-950 to-red-950 text-white p-4 rounded-2xl shadow-2xl border-2 border-yellow-500/40 backdrop-blur-xl flex items-center gap-3.5 ring-4 ring-black/10 overflow-hidden">
        {/* Subtle Decorative Golden Glow in Corner */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* App Icon */}
        <div className="relative w-12 h-12 rounded-2xl bg-orange-950 p-1 border border-yellow-400/60 shadow-lg shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
          <img 
            src="/pwa-192x192.png" 
            alt="Projenitor App" 
            className="w-full h-full object-cover rounded-xl"
          />
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 rounded-full border-2 border-orange-950 flex items-center justify-center">
            <Sparkles className="w-2 h-2 text-orange-950" />
          </div>
        </div>

        {/* Text Info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h4 className="font-serif font-black text-sm text-yellow-400 truncate tracking-wide">
              {t('ফোনে অ্যাপ ব্যবহার করুন', 'Use as an App')}
            </h4>
            <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
              PWA
            </span>
          </div>
          <p className="text-[11px] text-orange-200/90 leading-tight line-clamp-2 mt-0.5 font-sans">
            {t(
              'ব্রাউজার ছাড়াই ফোনের হোম স্ক্রিন থেকে দ্রুত ও সহজে ব্যবহার করুন',
              'Add to home screen for faster, full-screen native app experience'
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={promptInstall}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-orange-950 font-bold text-xs shadow-md hover:shadow-yellow-400/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            title={t('হোম স্ক্রিনে যুক্ত করুন', 'Add to Home Screen')}
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t('ইনস্টল', 'Install')}</span>
          </button>

          <button
            type="button"
            onClick={dismissBanner}
            className="p-1.5 rounded-xl text-orange-300 hover:text-white hover:bg-orange-800/60 transition-colors cursor-pointer"
            aria-label={t('বন্ধ করুন', 'Dismiss')}
            title={t('পরে মনে করিয়ে দিন', 'Remind me later')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallAppBanner;
