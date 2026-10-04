import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Map, Home, X, MapPin, ExternalLink } from 'lucide-react';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import VerifiedBadge from './VerifiedBadge';

const LocationSelectionModal = ({ isOpen, onClose, onSelectMember, disableActive = false }) => {
    const { formatName, t, isBn } = useLanguage();
    const [options, setOptions] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Path history for breadcrumbs
    const [pathSegments, setPathSegments] = useState([]);

    // level map skipping division
    const levelMap = ['country', 'district', 'upazila', 'village', 'home', 'details'];

    const currentLevelIndex = pathSegments.length;
    const currentLevel = levelMap[currentLevelIndex] || 'country';

    const breadcrumbs = ['বিশ্ব', ...pathSegments];

    useEffect(() => {
        if (!isOpen) {
            // Reset when closed ONLY if not already empty to prevent infinite loop
            if (pathSegments.length > 0) setPathSegments([]);
            if (options.length > 0) setOptions([]);
            if (members.length > 0) setMembers([]);
            return;
        }

        if (currentLevel === 'details') {
            const homeName = pathSegments[4];
            const village = pathSegments[3];
            if (homeName && village) {
                fetchHouseholdMembers(homeName, village);
            }
        } else {
            const parent = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
            fetchOptions(currentLevel, parent);
        }
    }, [isOpen, pathSegments]);

    const fetchOptions = async (level, parent) => {
        try {
            setLoading(true);
            const params = { level };
            if (parent && level !== 'country') {
                params.parent = parent;
            }

            const response = await api.get('/family/hierarchy', { params });
            setOptions(response.data);
        } catch (error) {
            console.error('Error fetching options:', error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchHouseholdMembers = async (homeName, village) => {
        try {
            setLoading(true);
            const response = await api.get('/family/household', {
                params: {
                    home_name: homeName,
                    village
                }
            });
            setMembers(response.data);
        } catch (error) {
            console.error('Error fetching members:', error);
            setMembers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (item) => {
        setPathSegments([...pathSegments, item]);
    };

    const resetToLevel = (index) => {
        if (index === 0) {
            setPathSegments([]);
        } else {
            setPathSegments(pathSegments.slice(0, index));
        }
    };

    const handleMemberSelect = (member) => {
        onSelectMember(member);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-unfold">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-orange-100 bg-orange-50/50">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-orange-900">পরিবারের সদস্য নির্বাচন করুন</h2>
                        <p className="text-stone-500 text-sm">কাউকে খুঁজে বের করতে ভৌগলিক স্তরে নেভিগেট করুন।</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-orange-100 rounded-full text-stone-500 hover:text-orange-900 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Breadcrumbs */}
                <div className="flex flex-wrap items-center gap-2 text-sm px-6 py-4 bg-white border-b border-stone-100">
                    {breadcrumbs.map((item, index) => (
                        <React.Fragment key={index}>
                            <button
                                onClick={() => resetToLevel(index)}
                                className={`hover:text-orange-600 font-medium transition-colors duration-200 ${index === breadcrumbs.length - 1 ? 'text-orange-800 font-bold' : 'text-stone-500'}`}
                            >
                                {item}
                            </button>
                            {index < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4 text-stone-300" />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 min-h-[300px] bg-stone-50/50">
                    {loading ? (
                        <div className="flex justify-center items-center h-full animate-pulse text-stone-400">
                            তথ্য লোড হচ্ছে...
                        </div>
                    ) : currentLevel !== 'details' ? (
                        /* Geographic Options Grid */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {options.length > 0 ? (
                                options.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectOption(item)}
                                        className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 hover:border-orange-300 hover:shadow-md hover:-translate-y-1 transition duration-200 flex flex-col items-center justify-center text-center space-y-2 group"
                                    >
                                        {currentLevel === 'home' ? (
                                            <Home className="h-6 w-6 text-red-800/80 group-hover:scale-110 transition-transform duration-300" />
                                        ) : (
                                            <Map className="h-6 w-6 text-yellow-500/80 group-hover:scale-110 transition-transform duration-300" />
                                        )}
                                        <span className="font-serif font-medium text-stone-800 group-hover:text-orange-800 transition-colors">{item}</span>
                                    </button>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10 text-stone-400 bg-white rounded-lg border border-dashed border-stone-200">
                                    কোন বিকল্প পাওয়া যায়নি।
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Household Members Grid */
                        <div>
                            <div className="mb-6 flex items-center justify-center gap-3">
                                <Home className="h-8 w-8 text-orange-600" />
                                <h3 className="text-2xl font-serif font-bold text-stone-800">{pathSegments[pathSegments.length - 1]} Household</h3>
                            </div>

                            {members.length > 0 && members[0].home_map_link && (
                                <div className="flex justify-center -mt-4 mb-5">
                                    <a
                                        href={members[0].home_map_link.startsWith('http') ? members[0].home_map_link : `https://${members[0].home_map_link}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 shadow-2xs transition-colors"
                                    >
                                        <MapPin size={13} className="text-emerald-600" />
                                        <span>Google Map</span>
                                        <ExternalLink size={11} className="text-emerald-500" />
                                    </a>
                                </div>
                            )}

                            <div className="space-y-6">
                                {members.length > 0 ? (
                                    Object.keys(members.reduce((acc, member) => {
                                        const hasParentsInHousehold = members.some(m => m.id === member.father_id || m.id === member.mother_id);
                                        let level = member.level || 'Unknown';
                                        
                                        // If a member has no parents in this household and is not the root (Level 1), classify them as Spouses
                                        if (!hasParentsInHousehold && parseInt(member.level) !== 1) {
                                            level = 'Spouses';
                                        }

                                        if (!acc[level]) acc[level] = [];
                                        acc[level].push(member);
                                        return acc;
                                    }, {})).sort((a, b) => {
                                        if (a === 'Spouses') return 1;
                                        if (b === 'Spouses') return -1;
                                        if (a === 'Unknown') return 1;
                                        if (b === 'Unknown') return -1;
                                        return parseInt(a) - parseInt(b);
                                    }).map(level => {
                                        const levelMembers = members.filter(member => {
                                            const hasParentsInHousehold = members.some(m => m.id === member.father_id || m.id === member.mother_id);
                                            let memberLevel = member.level || 'Unknown';
                                            if (!hasParentsInHousehold && parseInt(member.level) !== 1) {
                                                memberLevel = 'Spouses';
                                            }
                                            return memberLevel.toString() === level;
                                        });
                                        return (
                                            <div key={level} className="mb-2">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="h-px flex-1 bg-orange-200"></div>
                                                    <h4 className="text-orange-900 font-bold uppercase tracking-widest text-sm">
                                                        {level === 'Spouses' ? 'Spouses' : (level === 'Unknown' ? 'Unknown Generation' : `Generation ${level}`)}
                                                    </h4>
                                                    <div className="h-px flex-1 bg-orange-200"></div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                    {levelMembers.map(member => {
                                                        const memberDisplayName = formatName(member);
                                                        const isActive = member.is_active || member.user_status === 'active';
                                                        const isDisabled = disableActive && isActive;
                                                        return (
                                                        <button
                                                            key={member.id}
                                                            disabled={isDisabled}
                                                            onClick={() => !isDisabled && handleMemberSelect(member)}
                                                            className={`p-4 rounded-xl border transition-all flex items-center gap-4 text-left group ${
                                                                isDisabled
                                                                    ? 'bg-stone-50/80 border-stone-200 opacity-70 cursor-not-allowed'
                                                                    : 'bg-white border-stone-200 shadow-sm hover:border-orange-400 hover:ring-2 hover:ring-orange-100 cursor-pointer'
                                                            }`}
                                                        >
                                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-100 shrink-0 border border-orange-200">
                                                                {member.profile_image_url ? (
                                                                    <img src={member.profile_image_url} alt={memberDisplayName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-orange-800 font-bold font-serif text-lg">
                                                                        {(memberDisplayName || '?').charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <h4 className="font-bold text-stone-800 group-hover:text-orange-800 transition-colors truncate">{memberDisplayName}</h4>
                                                                    {isActive && <VerifiedBadge size={16} />}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-xs text-stone-500 uppercase tracking-widest opacity-70">
                                                                        Level {member.level}
                                                                    </span>
                                                                    {isActive && (
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                            isDisabled
                                                                                ? 'text-blue-700 bg-blue-100 border border-blue-200'
                                                                                : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                                                        }`}>
                                                                            {isDisabled ? (isBn ? 'ইতিমধ্যে সক্রিয়' : 'Already Active') : (isBn ? 'সক্রিয়' : 'Active')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-10 text-stone-400 bg-white rounded-lg border border-dashed border-stone-200">
                                        এই বাড়িতে কোন সদস্য পাওয়া যায়নি।
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LocationSelectionModal;
