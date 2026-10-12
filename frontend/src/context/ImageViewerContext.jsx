import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { X, ZoomIn, Download, ExternalLink } from 'lucide-react';

const ImageViewerContext = createContext();

export const ImageViewerProvider = ({ children }) => {
  const [activeImage, setActiveImage] = useState(null); // { url, title }

  const openImage = useCallback((url, title = '') => {
    if (!url) return;
    setActiveImage({ url, title });
  }, []);

  const closeImage = useCallback(() => {
    setActiveImage(null);
  }, []);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!activeImage) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeImage, closeImage]);

  return (
    <ImageViewerContext.Provider value={{ openImage, closeImage, activeImage }}>
      {children}

      {/* Global Fullscreen Photo Lightbox Modal */}
      {activeImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 transition-all duration-300 animate-fade-in select-none"
          onClick={closeImage} // Clicking anywhere outside photo closes
          role="dialog"
          aria-modal="true"
          aria-label={activeImage.title || 'Full Photo View'}
        >
          {/* Top Bar with Title and Close Button */}
          <div 
            className="w-full max-w-4xl flex items-center justify-between pb-3 text-white px-2 sm:px-0"
            onClick={(e) => e.stopPropagation()} // Prevent closing when interacting with top bar
          >
            <div className="flex items-center gap-2 min-w-0 pr-4">
              <span className="font-serif font-bold text-base sm:text-lg text-yellow-400 truncate">
                {activeImage.title || 'ছবি'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Optional Open in new tab button */}
              <a
                href={activeImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white transition-all cursor-pointer"
                title="নতুন ট্যাবে দেখুন"
              >
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeImage}
                className="p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-red-600/80 text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                title="বন্ধ করুন (Esc বা বাইরে ক্লিক করুন)"
                aria-label="Close"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Photo Container */}
          <div 
            className="relative flex items-center justify-center max-w-full max-h-[85vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()} // Clicking directly on the photo does NOT close
          >
            <img
              src={activeImage.url}
              alt={activeImage.title || 'Profile Photo'}
              className="max-h-[82vh] max-w-[94vw] sm:max-w-[85vw] object-contain rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-white/20 ring-4 ring-black/50"
            />
          </div>

          {/* Bottom Hint */}
          <div className="pt-3 text-stone-400 text-xs sm:text-sm font-sans tracking-wide">
            ছবির বাইরে যেকোনো স্থানে ক্লিক করলে বন্ধ হবে
          </div>
        </div>
      )}
    </ImageViewerContext.Provider>
  );
};

export const useImageViewer = () => {
  const context = useContext(ImageViewerContext);
  if (!context) {
    throw new Error('useImageViewer must be used within an ImageViewerProvider');
  }
  return context;
};
