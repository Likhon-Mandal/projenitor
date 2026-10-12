import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PWAContext = createContext();

const DISMISS_KEY = 'projenitor_pwa_dismissed_until';
const SNOOZE_DURATION_DAYS = 0.15; // Show again after ~3.5 hours if dismissed

export const PWAProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Check standalone mode (already installed as PWA)
  const checkIsInstalled = useCallback(() => {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');
    return Boolean(isStandalone);
  }, []);

  useEffect(() => {
    const installed = checkIsInstalled();
    setIsInstalled(installed);

    // Device detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || ('ontouchstart' in window);
    const isMobileDevice = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || (window.innerWidth <= 640);
    const isTabletDevice = /ipad|tablet/i.test(userAgent) || (isTouch && window.innerWidth > 640 && window.innerWidth <= 1024);
    const isMobileOrTabletDevice = isMobileDevice || isTabletDevice || (isTouch && window.innerWidth <= 1024) || (window.innerWidth <= 1024);

    setIsIOS(isIOSDevice);
    setIsMobile(isMobileDevice);
    setIsTablet(isTabletDevice);
    setIsMobileOrTablet(isMobileOrTabletDevice);

    // If already installed, don't show prompts
    if (installed) {
      setShowBanner(false);
      return;
    }

    // Check if dismissed previously
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    const isDismissed = dismissedUntil && Date.now() < parseInt(dismissedUntil, 10);

    // Capture standard PWA beforeinstallprompt (Chrome, Edge, Samsung Internet, Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Only show banner automatically on mobile and tablet devices, never on desktop/laptop
      if (!isDismissed && isMobileOrTabletDevice) {
        // Small delay so page loads gracefully before popping up banner
        setTimeout(() => setShowBanner(true), 1500);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowBanner(false);
      setShowIOSModal(false);
      console.log('PWA was installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS users on Safari (no beforeinstallprompt event available)
    if (isIOSDevice && !installed && !isDismissed && isMobileOrTabletDevice) {
      setIsInstallable(true);
      // Wait a moment before showing iOS install banner on mobile/tablet
      setTimeout(() => setShowBanner(true), 2500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkIsInstalled]);

  // Trigger installation flow
  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error during PWA installation prompt:', err);
      }
    } else if (isIOS) {
      // Show iOS step-by-step installation instructions modal
      setShowIOSModal(true);
    } else {
      // General fallback guide (e.g. desktop Chrome / other browser)
      setShowIOSModal(true);
    }
  }, [deferredPrompt, isIOS]);

  // Dismiss banner with snooze
  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    const snoozeUntil = Date.now() + SNOOZE_DURATION_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, snoozeUntil.toString());
  }, []);

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIOS,
        isMobile,
        isTablet,
        isMobileOrTablet,
        showBanner,
        setShowBanner,
        showIOSModal,
        setShowIOSModal,
        promptInstall,
        dismissBanner,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
