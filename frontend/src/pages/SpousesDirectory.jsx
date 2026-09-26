import React, { useState } from 'react';
import { Heart, Sparkles, ChevronRight, Home as HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import SpousesDirectoryView from '../components/SpousesDirectoryView';
import MemberProfileModal from '../components/MemberProfileModal';

const SpousesDirectory = () => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-orange-800 via-rose-800 to-amber-900 text-white p-6 sm:p-8 rounded-3xl shadow-md border border-orange-700/50 relative overflow-hidden">
        {/* Background Decorative Rings */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-yellow-400/30 text-yellow-200 text-xs font-bold mb-3 shadow-inner">
              <Heart size={14} className="fill-yellow-400 text-yellow-400" />
              <span>বংশতালিকা ঐতিহ্য সম্ভার / Ancestral Spouses</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white mb-2 tracking-wide">
              সহধর্মিণী তালিকা
            </h1>
            <p className="text-orange-200/90 text-sm sm:text-base max-w-2xl font-light">
              বংশপরম্পরায় আমাদের সকল সহধর্মিণীর পরিচিতি, কর্মজীবন, রক্তের গ্রুপ ও পারিবারিক তথ্য প্রজন্ম অনুসারে সংরক্ষিত।
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto text-xs text-orange-200 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-xs">
            <Link to="/" className="hover:text-white transition flex items-center gap-1">
              <HomeIcon size={14} /> হোম
            </Link>
            <ChevronRight size={14} className="text-orange-300" />
            <Link to="/explorer" className="hover:text-white transition">
              এক্সপ্লোরার
            </Link>
            <ChevronRight size={14} className="text-orange-300" />
            <span className="text-white font-bold">সহধর্মিণী</span>
          </div>
        </div>
      </div>

      {/* Main View Component */}
      <SpousesDirectoryView 
        onViewProfile={(member) => {
          setSelectedMember(member);
          setIsProfileOpen(true);
        }}
      />

      {/* Member Profile Modal */}
      <MemberProfileModal
        isOpen={isProfileOpen}
        member={selectedMember}
        onClose={() => {
          setIsProfileOpen(false);
          setSelectedMember(null);
        }}
      />
    </div>
  );
};

export default SpousesDirectory;
