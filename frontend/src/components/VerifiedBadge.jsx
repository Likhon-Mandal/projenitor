import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const VerifiedBadge = ({ size = 18, className = '', showLabel = false }) => {
  const { isBn } = useLanguage();
  const tooltip = isBn ? 'সক্রিয় সদস্য প্রোফাইল' : 'Active Member Profile';

  return (
    <span
      className={`inline-flex items-center gap-1 align-middle select-none shrink-0 ${className}`}
      title={tooltip}
      aria-label={tooltip}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-xs"
      >
        {/* Scalloped Blue Badge */}
        <path
          d="M22.5 12.5C22.5 13.9 21.6 15.1 21.3 16.4C21 17.7 21.3 19.3 20.3 20.3C19.3 21.3 17.7 21 16.4 21.3C15.1 21.6 13.9 22.5 12.5 22.5C11.1 22.5 9.9 21.6 8.6 21.3C7.3 21 5.7 21.3 4.7 20.3C3.7 19.3 4 17.7 3.7 16.4C3.4 15.1 2.5 13.9 2.5 12.5C2.5 11.1 3.4 9.9 3.7 8.6C4 7.3 3.7 5.7 4.7 4.7C5.7 3.7 7.3 4 8.6 3.7C9.9 3.4 11.1 2.5 12.5 2.5C13.9 2.5 15.1 3.4 16.4 3.7C17.7 4 19.3 3.7 20.3 4.7C21.3 5.7 21 7.3 21.3 8.6C21.6 9.9 22.5 11.1 22.5 12.5Z"
          fill="#2563EB"
        />
        {/* Crisp White Checkmark */}
        <path
          d="M7.75 12.25L10.5 15L16.25 9.25"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showLabel && (
        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
          {isBn ? 'সক্রিয়' : 'Active'}
        </span>
      )}
    </span>
  );
};

export default VerifiedBadge;
