import React, { useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import SpousesDirectoryView from './SpousesDirectoryView';
import Profile from '../pages/Profile';

const SpousesDirectoryModal = ({
  isOpen,
  onClose,
  currentHome = null,
  currentVillage = null,
  onSelectMember,
  onEdit
}) => {
  const [selectedProfileMemberId, setSelectedProfileMemberId] = useState(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedProfileMemberId) {
          setSelectedProfileMemberId(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedProfileMemberId, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-5xl max-h-[90vh] bg-[#fffcf7] rounded-3xl shadow-2xl border border-orange-200 flex flex-col overflow-hidden animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-orange-800 via-rose-800 to-orange-950 text-white px-5 sm:px-7 py-4 flex items-center justify-between shadow-md relative z-10 border-b border-orange-950/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm border border-yellow-400/40 flex items-center justify-center text-yellow-400 shadow-inner">
                <Heart size={20} className="fill-yellow-400 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-white tracking-wide">
                  সহধর্মিণী তালিকা
                </h3>
                <p className="text-xs text-orange-200/90 font-medium">
                  বংশতালিকার সকল সহধর্মিণীর পরিচিতি ও তথ্য সম্ভার
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95 cursor-pointer"
              title="বন্ধ করুন (Close)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Modal Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-thin">
            <SpousesDirectoryView
              currentHome={currentHome}
              currentVillage={currentVillage}
              onViewProfile={(member) => {
                setSelectedProfileMemberId(member.id);
                if (onSelectMember) {
                  onSelectMember(member);
                }
              }}
              isModal={true}
            />
          </div>
        </div>
      </div>

      {/* Profile Card from Search Section */}
      {selectedProfileMemberId && (
        <Profile
          memberId={selectedProfileMemberId}
          onClose={() => setSelectedProfileMemberId(null)}
          zIndex="z-[120]"
          onEdit={onEdit}
        />
      )}
    </>
  );
};

export default SpousesDirectoryModal;
