import React from 'react';
import { User, MapPin, Briefcase } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getMemberIdentity, MEMBER_THEMES } from '../utils/memberIdentity';

const MemberCard = ({ member, onViewProfile }) => {
  const { t, isBn, formatOccupation, formatName } = useLanguage();

  const identity = getMemberIdentity(member);
  const theme = MEMBER_THEMES[identity] || MEMBER_THEMES.default;

  const displayName = formatName(member);

  return (
    <div 
      className={`bg-white rounded-xl shadow-xs border ${theme.cardBorder} p-4 hover:shadow-md ${theme.cardGlow} ${theme.cardBgHover} transition-all duration-300 transform hover:-translate-y-0.5 group cursor-pointer relative`}
      onClick={onViewProfile}
    >
      {/* Subtle identity role badge in corner */}
      <div className="absolute top-3.5 right-3.5">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${theme.badge}`}>
          <span>{theme.symbol}</span>
          <span>{isBn ? theme.labelBn : theme.labelEn}</span>
        </span>
      </div>

      <div className="flex items-center space-x-4 pr-16">
        <div className={`h-16 w-16 ${theme.avatarBg} rounded-full flex items-center justify-center border-2 ${theme.avatarBorder} ${theme.avatarHoverBorder} overflow-hidden transition-colors duration-300 shrink-0`}>
          {member.profile_image_url ? (
            <img src={member.profile_image_url} alt={displayName} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <User className={`h-8 w-8 ${theme.iconColor} group-hover:scale-110 transition-transform duration-300`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-base sm:text-lg font-serif font-bold ${theme.nameText} transition-colors truncate`}>
            {displayName}
          </h3>
          <div className="text-xs sm:text-sm text-stone-500 flex items-center mt-1">
            <MapPin className={`h-3.5 w-3.5 mr-1 ${theme.iconColor} flex-shrink-0`} />
            <span className="truncate">{[member.village, member.upazila, member.district].filter(Boolean).join(', ') || t('অজানা স্থান', 'Unknown Location')}</span>
          </div>
          {member.occupation && (
            <div className="text-xs sm:text-sm text-stone-500 flex items-center mt-0.5">
              <Briefcase className={`h-3.5 w-3.5 mr-1 ${theme.iconColor} flex-shrink-0`} />
              <span className="truncate">{formatOccupation(member.occupation)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onViewProfile}
          className={`text-xs sm:text-sm font-medium border px-3 py-1 rounded-lg transition duration-300 shadow-2xs hover:shadow-xs active:scale-95 ${theme.button}`}
        >
          {t('প্রোফাইল দেখুন', 'View Profile')}
        </button>
      </div>
    </div>
  );
};

export default MemberCard;
