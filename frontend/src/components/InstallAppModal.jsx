import React from 'react';
import { X, Share, PlusSquare, Smartphone, CheckCircle, Sparkles } from 'lucide-react';
import { usePWA } from '../context/PWAContext';
import { useLanguage } from '../context/LanguageContext';

const InstallAppModal = () => {
  const { showIOSModal, setShowIOSModal, isIOS } = usePWA();
  const { t } = useLanguage();

  if (!showIOSModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-orange-50 dark:bg-stone-900 border-2 border-orange-700/60 dark:border-orange-600/50 rounded-3xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-orange-900 via-orange-800 to-red-900 p-5 text-white flex items-center justify-between border-b border-orange-700/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-950/80 p-1 border border-yellow-400/40 shadow-md flex items-center justify-center shrink-0">
              <img src="/pwa-192x192.png" alt="Projenitor Icon" className="w-full h-full object-cover rounded-xl" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-yellow-400 flex items-center gap-1.5">
                {t('ফোনে অ্যাপ হিসেবে যুক্ত করুন', 'Add to Your Phone')}
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              </h3>
              <p className="text-xs text-orange-200/80">
                {t('বাড়ৈ বংশের ইতিবৃত্ত | Projenitor', 'Ancestral Records | Projenitor')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowIOSModal(false)}
            className="p-2 rounded-xl text-orange-200 hover:text-white hover:bg-orange-700/50 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-stone-800 dark:text-stone-200 font-sans">
          <div className="flex items-center gap-3 p-3.5 bg-orange-100/70 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800/60 rounded-2xl">
            <Smartphone className="w-6 h-6 text-orange-700 dark:text-yellow-400 shrink-0" />
            <p className="text-xs sm:text-sm font-medium leading-relaxed">
              {t(
                'অ্যাপ স্টোর বা প্লে স্টোর ছাড়াই সরাসরি আপনার ফোনের হোম স্ক্রিনে অ্যাপ আইকন তৈরি হয়ে যাবে!',
                'Install directly onto your home screen without needing an app store download!'
              )}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3.5">
            {isIOS ? (
              /* iOS Safari Instructions */
              <>
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm transition-all hover:border-yellow-500/60">
                  <div className="w-7 h-7 rounded-full bg-yellow-500 text-orange-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    ১
                  </div>
                  <div className="flex-1 text-xs sm:text-sm">
                    <span className="font-bold text-orange-900 dark:text-yellow-400">
                      {t('Safari ব্রাউজারের নিচে Share বোতামে চাপুন', 'Tap the Share button in Safari')}
                    </span>
                    <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5 flex items-center gap-1">
                      <Share className="w-3.5 h-3.5 text-blue-500 inline" /> {t('স্ক্রিনের নিচের দিকে Share (শেয়ার) আইকনটি খুঁজুন', 'Look for the share icon at the bottom')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm transition-all hover:border-yellow-500/60">
                  <div className="w-7 h-7 rounded-full bg-yellow-500 text-orange-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    ২
                  </div>
                  <div className="flex-1 text-xs sm:text-sm">
                    <span className="font-bold text-orange-900 dark:text-yellow-400">
                      {t('"Add to Home Screen" অপশনটি বেছে নিন', 'Select "Add to Home Screen"')}
                    </span>
                    <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5 flex items-center gap-1">
                      <PlusSquare className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 inline" /> {t('তালিকা থেকে "Add to Home Screen" এ চাপুন', 'Scroll down and tap "Add to Home Screen"')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm transition-all hover:border-yellow-500/60">
                  <div className="w-7 h-7 rounded-full bg-yellow-500 text-orange-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    ৩
                  </div>
                  <div className="flex-1 text-xs sm:text-sm">
                    <span className="font-bold text-orange-900 dark:text-yellow-400">
                      {t('উপরে ডানে "Add" এ চাপুন', 'Tap "Add" at top right')}
                    </span>
                    <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 inline" /> {t('হোম স্ক্রিনে Projenitor অ্যাপের আইকন যুক্ত হবে', 'The Projenitor icon will now appear on your phone')}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* Android Chrome or Desktop Browser Fallback Instructions */
              <>
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm transition-all hover:border-yellow-500/60">
                  <div className="w-7 h-7 rounded-full bg-yellow-500 text-orange-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    ১
                  </div>
                  <div className="flex-1 text-xs sm:text-sm">
                    <span className="font-bold text-orange-900 dark:text-yellow-400">
                      {t('ব্রাউজারের ৩-ডট মেন্যুতে (⋮) চাপুন', 'Tap the 3-dot browser menu (⋮)')}
                    </span>
                    <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5">
                      {t('উপরে বা নিচে ডান কোণায় তিনটি ডট পাবেন', 'Found at top or bottom right of your browser')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm transition-all hover:border-yellow-500/60">
                  <div className="w-7 h-7 rounded-full bg-yellow-500 text-orange-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    ২
                  </div>
                  <div className="flex-1 text-xs sm:text-sm">
                    <span className="font-bold text-orange-900 dark:text-yellow-400">
                      {t('"Install App" বা "Add to Home Screen" চাপুন', 'Tap "Install App" or "Add to Home Screen"')}
                    </span>
                    <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5">
                      {t('অপশনে ক্লিক করে সম্মতি দিন', 'Select the install option and confirm')}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 bg-orange-100/50 dark:bg-stone-950/60 border-t border-orange-200 dark:border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={() => setShowIOSModal(false)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-orange-800 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            {t('বুঝেছি, ধন্যবাদ', 'Got it, Thanks')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallAppModal;
