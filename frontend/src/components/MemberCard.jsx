import React from 'react';
import { User, MapPin, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

const MemberCard = ({ member, onViewProfile }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer" onClick={onViewProfile}>
      <div className="flex items-center space-x-4">
        <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center text-secondary border-2 border-orange-200 overflow-hidden group-hover:border-accent transition-colors duration-300">
          {member.profile_image_url ? (
            <img src={member.profile_image_url} alt={member.full_name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <User className="h-8 w-8 group-hover:scale-110 transition-transform duration-300" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-serif font-bold text-primary group-hover:text-red-900 transition-colors">
            {member.name_bangla || member.full_name}
          </h3>
          <div className="text-sm text-stone-500 flex items-center mt-1">
            <MapPin className="h-3.5 w-3.5 mr-1 text-orange-600 flex-shrink-0" />
            <span className="truncate">{[member.village, member.upazila, member.district].filter(Boolean).join(', ') || 'অজানা স্থান'}</span>
          </div>
          {member.occupation && (
            <div className="text-sm text-stone-500 flex items-center mt-0.5">
              <Briefcase className="h-3.5 w-3.5 mr-1 text-secondary flex-shrink-0" />
              <span className="truncate">{member.occupation}</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onViewProfile}
          className="text-sm text-secondary font-medium hover:text-white border border-secondary px-3 py-1 rounded-lg hover:bg-secondary transition duration-300 shadow-sm hover:shadow"
        >
          প্রোফাইল দেখুন
        </button>
      </div>
    </div>
  );
};

export default MemberCard;
