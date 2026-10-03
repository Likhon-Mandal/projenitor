import React from 'react';
import { User, MapPin, Briefcase } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getMemberIdentity, MEMBER_THEMES } from '../utils/memberIdentity';
import VerifiedBadge from './VerifiedBadge';

const MemberCard = ({ member, onViewProfile }) => {
  const { t, isBn, formatOccupation, formatName, formatNumber } = useLanguage();

  const identity = getMemberIdentity(member);
  const theme = MEMBER_THEMES[identity] || MEMBER_THEMES.default;

  const displayName = formatName(member);

  return (
    <div 
      className={`bg-white rounded-2xl shadow-xs border ${theme.cardBorder} p-3.5 sm:p-4 hover:shadow-md ${theme.cardGlow} ${theme.cardBgHover} transition-all duration-300 transform hover:-translate-y-0.5 group cursor-pointer relative flex flex-col justify-between h-full`}
      onClick={onViewProfile}
    >
      <div>
        <div className="flex items-start gap-3 sm:gap-3.5">
          {/* Avatar with responsive sizing */}
          <div className={`h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 ${theme.avatarBg} rounded-full flex items-center justify-center border-2 ${theme.avatarBorder} ${theme.avatarHoverBorder} overflow-hidden transition-all duration-300 shrink-0 group-hover:scale-105`}>
            {member.profile_image_url ? (
              <img src={member.profile_image_url} alt={displayName} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <User className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 ${theme.iconColor} group-hover:scale-110 transition-transform duration-300`} />
            )}
          </div>

          {/* Info Column */}
          <div className="flex-1 min-w-0">
            {/* Header: Name and Role Badge */}
            <div className="flex items-start justify-between gap-1.5 mb-1">
              <div className="flex items-center gap-1.5 min-w-0 pr-1">
                <h3 className={`text-sm sm:text-base md:text-lg font-serif font-bold ${theme.nameText} transition-colors truncate`}>
                  {displayName}
                </h3>
                {(member.is_active || member.user_status === 'active' || member.user_account?.status === 'active') && (
                  <VerifiedBadge size={15} />
                )}
              </div>

              {/* Role badge in header, never overlapping other lines */}
              <span className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border shadow-2xs shrink-0 whitespace-nowrap ${theme.badge}`}>
                <span>{theme.symbol}</span>
                <span>{isBn ? theme.labelBn : theme.labelEn}</span>
              </span>
            </div>

            {/* Location */}
            <div className="text-[11px] sm:text-xs text-stone-500 flex items-center mt-1">
              <MapPin className={`h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 ${theme.iconColor} shrink-0`} />
              <span className="truncate">{[member.village, member.upazila, member.district].filter(Boolean).join(', ') || t('অজানা স্থান', 'Unknown Location')}</span>
            </div>

            {/* Occupation */}
            {member.occupation && (
              <div className="text-[11px] sm:text-xs text-stone-500 flex items-center mt-0.5">
                <Briefcase className={`h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 ${theme.iconColor} shrink-0`} />
                <span className="truncate">{formatOccupation(member.occupation)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer Meta & Action */}
      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {member.blood_group && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-red-50 text-red-700 border border-red-200/80">
              🩸 {member.blood_group}
            </span>
          )}
          {member.generation && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80">
              {isBn ? `${formatNumber ? formatNumber(member.generation) : member.generation}ম প্রজন্ম` : `Gen ${member.generation}`}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile();
          }}
          className={`text-xs sm:text-sm font-medium border px-2.5 sm:px-3 py-1 rounded-lg transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer whitespace-nowrap ml-auto ${theme.button}`}
        >
          {t('প্রোফাইল দেখুন', 'View Profile')}
        </button>
      </div>
    </div>
  );
};

export default MemberCard;
