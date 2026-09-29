import React, { useState, useEffect, useRef } from 'react';
import { Search, Map, X, Check } from 'lucide-react';
import LocationSelectionModal from './LocationSelectionModal';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';

const MemberSelector = ({ label, onSelect, selectedMember }) => {
    const { formatName } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Debounced Search Effect
    useEffect(() => {
        const fetchResults = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                setIsDropdownOpen(false);
                return;
            }

            try {
                setIsSearching(true);
                // Search up to 5 results to keep dropdown clean
                const response = await api.get('/members', { params: { name: searchQuery } });
                setSearchResults(response.data.slice(0, 5)); // Limit to 5 for the dropdown
                setIsDropdownOpen(true);
            } catch (error) {
                console.error("Failed to fetch search results:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const debounceTimer = setTimeout(fetchResults, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    // Close Dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = async (member) => {
        try {
            // Fetch full member data (includes children, siblings, spouses with father_id/mother_id)
            const response = await api.get(`/members/${member.id}`);
            onSelect(response.data);
        } catch (error) {
            console.error('Failed to fetch full member details:', error);
            onSelect(member); // fallback to partial data
        }
        setSearchQuery('');
        setIsDropdownOpen(false);
    };

    const handleClear = () => {
        onSelect(null);
        setSearchQuery('');
    };

    return (
        <div className="w-full relative" ref={dropdownRef}>
            <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-wider">{label}</label>

            {selectedMember ? (
                // Selected State
                <div className="flex items-center justify-between p-4 bg-orange-50 border-2 border-orange-200 rounded-xl shadow-inner animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-orange-300 shadow-sm shrink-0 flex items-center justify-center">
                            {selectedMember.profile_image_url ? (
                                <img src={selectedMember.profile_image_url} alt={selectedMember.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-serif font-bold text-xl text-orange-800">{selectedMember.full_name.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-stone-900">
                                {formatName(selectedMember)}
                            </h3>
                            <p className="text-sm text-stone-500 flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                Level {selectedMember.level}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-2 bg-white rounded-full text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                        title="Clear Selection"
                    >
                        <X size={20} />
                    </button>
                </div>
            ) : (
                // Input State
                <div className="relative">
                    <div className="relative flex items-center">
                        <div className="absolute left-4 text-stone-400 pointer-events-none">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="নাম লিখে খুঁজুন..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => { if (searchResults.length > 0) setIsDropdownOpen(true) }}
                            className="w-full pl-12 pr-16 py-4 rounded-xl border-2 border-stone-200 focus:border-orange-500 focus:ring-0 outline-none transition-all text-stone-800 font-medium placeholder:font-normal bg-white shadow-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setIsMapModalOpen(true)}
                            className="absolute right-2 p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-orange-100 hover:text-orange-700 transition duration-200 flex items-center justify-center group"
                            title="ম্যাপের মাধ্যমে খুঁজুন"
                        >
                            <Map size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>

                    {/* Search Dropdown */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden z-[100] animate-slide-up">
                            {isSearching ? (
                                <div className="p-4 text-center text-sm text-stone-400 animate-pulse">খোঁজ করা হচ্ছে...</div>
                            ) : searchResults.length > 0 ? (
                                <div className="max-h-64 overflow-y-auto">
                                    {searchResults.map((result) => (
                                        <button
                                            type="button"
                                            key={result.id}
                                            onClick={() => handleSelect(result)}
                                            className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-stone-100 last:border-0 flex items-center gap-3 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden border border-stone-200">
                                                {result.profile_image_url ? (
                                                    <img src={result.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-serif font-bold text-stone-500 text-sm">{result.full_name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-stone-800 truncate">
                                                    {formatName(result)}
                                                </p>
                                                <p className="text-xs text-stone-500 truncate">{result.home_name}, {result.village}, {result.district}</p>
                                            </div>
                                            <div className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                                Lvl {result.level}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-sm text-stone-500">
                                    "{searchQuery}" এর সাথে মিলে এমন কোনো পরিবারের সদস্য পাওয়া যায়নি।
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Location Selection Modal */}
            <LocationSelectionModal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                onSelectMember={handleSelect}
            />
        </div>
    );
};

export default MemberSelector;
