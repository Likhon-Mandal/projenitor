import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Heart, Search, Users, MapPin, Briefcase, Building, 
  Phone, Globe, Droplet, Home, ChevronDown, Sparkles, Filter, X, Eye, Check
} from 'lucide-react';
import api from '../api/api';

const BENGALI_GEN_LABELS = {
  1: '১ম প্রজন্ম (1st Gen)',
  2: '২য় প্রজন্ম (2nd Gen)',
  3: '৩য় প্রজন্ম (3rd Gen)',
  4: '৪র্থ প্রজন্ম (4th Gen)',
  5: '৫ম প্রজন্ম (5th Gen)',
  6: '৬ষ্ঠ প্রজন্ম (6th Gen)',
  7: '৭ম প্রজন্ম (7th Gen)',
  8: '৮ম প্রজন্ম (8th Gen)',
  9: '৯ম প্রজন্ম (9th Gen)',
  10: '১০ম প্রজন্ম (10th Gen)',
  11: '১১তম প্রজন্ম (11th Gen)',
  12: '১২তম প্রজন্ম (12th Gen)'
};

const getGenLabel = (level) => {
  return BENGALI_GEN_LABELS[level] || `প্রজন্ম ${level} (Gen ${level})`;
};

const SpousesDirectoryView = ({ 
  currentHome = null, 
  currentVillage = null, 
  onViewProfile,
  isModal = false 
}) => {
  const [spouses, setSpouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [scope, setScope] = useState(currentHome ? 'household' : 'all');
  const [selectedGens, setSelectedGens] = useState([]); // Array of selected generation numbers (empty means all)
  const [genDropdownOpen, setGenDropdownOpen] = useState(false);
  const genDropdownRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlood, setSelectedBlood] = useState('all');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (genDropdownRef.current && !genDropdownRef.current.contains(e.target)) {
        setGenDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update scope if currentHome changes
  useEffect(() => {
    if (currentHome) {
      setScope('household');
    }
  }, [currentHome]);

  // Fetch spouses from API
  useEffect(() => {
    const fetchSpouses = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {};
        if (scope === 'household' && currentHome) {
          params.home_name = currentHome;
          if (currentVillage) params.village = currentVillage;
        }

        const res = await api.get('/family/spouses', { params });
        const data = Array.isArray(res.data) ? res.data : [];
        setSpouses(data);
      } catch (err) {
        console.error('Failed to load spouses:', err);
        setError('সহধর্মিণীদের তথ্য লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      } finally {
        setLoading(false);
      }
    };

    fetchSpouses();
  }, [scope, currentHome, currentVillage]);

  // Extract available generations with counts
  const generationStats = useMemo(() => {
    const counts = {};
    spouses.forEach(s => {
      const g = s.generation_level || 1;
      counts[g] = (counts[g] || 0) + 1;
    });

    const list = Object.keys(counts)
      .map(k => parseInt(k, 10))
      .sort((a, b) => a - b)
      .map(level => ({
        level,
        count: counts[level],
        label: getGenLabel(level)
      }));

    return list;
  }, [spouses]);

  // Toggle generation in multi-select
  const toggleGen = (level) => {
    setSelectedGens(prev => {
      if (prev.includes(level)) {
        return prev.filter(g => g !== level);
      } else {
        return [...prev, level].sort((a, b) => a - b);
      }
    });
  };

  // Extract blood groups present
  const availableBloodGroups = useMemo(() => {
    const set = new Set();
    spouses.forEach(s => {
      if (s.blood_group) set.add(s.blood_group.trim());
    });
    return Array.from(set).sort();
  }, [spouses]);

  // Filtered spouses
  const filteredSpouses = useMemo(() => {
    return spouses.filter(s => {
      // Multi-select generation filter
      if (selectedGens.length > 0 && !selectedGens.includes(s.generation_level || 1)) {
        return false;
      }

      // Blood group filter
      if (selectedBlood !== 'all' && s.blood_group !== selectedBlood) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const nameBangla = (s.name_bangla || '').toLowerCase();
        const fullName = (s.full_name || '').toLowerCase();
        const nameEnglish = (s.name_english || '').toLowerCase();
        const occupation = (s.occupation || '').toLowerCase();
        const workplace = (s.workplace || '').toLowerCase();
        const village = (s.village || '').toLowerCase();
        const homeName = (s.home_name || '').toLowerCase();

        // Check partners
        const partnerMatch = (s.partners || []).some(p => 
          (p.full_name || '').toLowerCase().includes(q) || 
          (p.name_bangla || '').toLowerCase().includes(q)
        );

        const match = nameBangla.includes(q) ||
          fullName.includes(q) ||
          nameEnglish.includes(q) ||
          occupation.includes(q) ||
          workplace.includes(q) ||
          village.includes(q) ||
          homeName.includes(q) ||
          partnerMatch;

        if (!match) return false;
      }

      return true;
    });
  }, [spouses, selectedGens, selectedBlood, searchTerm]);

  // Group filtered spouses by generation
  const groupedByGen = useMemo(() => {
    const groups = {};
    filteredSpouses.forEach(s => {
      const g = s.generation_level || 1;
      if (!groups[g]) groups[g] = [];
      groups[g].push(s);
    });

    return Object.keys(groups)
      .map(k => parseInt(k, 10))
      .sort((a, b) => a - b)
      .map(gen => ({
        gen,
        label: getGenLabel(gen),
        items: groups[gen]
      }));
  }, [filteredSpouses]);

  return (
    <div className="space-y-6">
      {/* Scope Selector & Top Highlights */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-orange-200/80 shadow-xs">
        {/* Left: Scope Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {currentHome && (
            <button
              onClick={() => setScope('household')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                scope === 'household'
                  ? 'bg-orange-800 text-white shadow-sm shadow-orange-950/20'
                  : 'bg-orange-50 text-orange-900 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              <Home size={15} />
              <span>{currentHome} (বর্তমান বাড়ি)</span>
            </button>
          )}

          <button
            onClick={() => setScope('all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
              scope === 'all'
                ? 'bg-orange-800 text-white shadow-sm shadow-orange-950/20'
                : 'bg-orange-50 text-orange-900 hover:bg-orange-100 border border-orange-200'
            }`}
          >
            <Users size={15} />
            <span>সমগ্র বংশ / All Lineages</span>
          </button>
        </div>

        {/* Right: Quick Stats */}
        <div className="flex items-center gap-3 text-xs sm:text-sm text-stone-600">
          <div className="flex items-center gap-1.5 bg-orange-50 text-orange-900 font-bold px-3 py-1.5 rounded-xl border border-orange-200">
            <Heart size={15} className="fill-red-700 text-red-700" />
            <span>মোট সহধর্মিণী: {spouses.length} জন</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 bg-amber-50 text-amber-900 font-bold px-3 py-1.5 rounded-xl border border-amber-200">
            <Sparkles size={14} className="text-amber-600" />
            <span>{generationStats.length} টি প্রজন্ম</span>
          </div>
        </div>
      </div>

      {/* Generation Filter Dropdown (Multi-Select) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-orange-200/80 shadow-xs relative" ref={genDropdownRef}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
            <Filter size={14} className="text-orange-800" />
            <span>প্রজন্ম অনুসারে ফিল্টার (Filter by Generation):</span>
          </label>
          
          {selectedGens.length > 0 && (
            <button
              onClick={() => setSelectedGens([])}
              className="text-xs text-orange-800 hover:text-red-800 font-bold self-start sm:self-auto hover:underline cursor-pointer"
            >
              সব প্রজন্ম দেখান (Clear Filter)
            </button>
          )}
        </div>

        {/* Dropdown Trigger Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setGenDropdownOpen(!genDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-stone-50 hover:bg-stone-100/90 rounded-xl border border-stone-200 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              {selectedGens.length === 0 ? (
                <span className="font-medium text-stone-700">সকল প্রজন্ম (All Generations)</span>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-orange-900 font-bold text-xs bg-orange-100 px-2 py-0.5 rounded-lg border border-orange-200">
                    {selectedGens.length} টি প্রজন্ম নির্বাচিত
                  </span>
                  <span className="text-xs text-stone-600 truncate">
                    ({selectedGens.map(g => getGenLabel(g)).join(', ')})
                  </span>
                </div>
              )}
            </div>

            <ChevronDown 
              size={18} 
              className={`text-stone-400 transition-transform duration-200 shrink-0 ${genDropdownOpen ? 'rotate-180 text-orange-800' : ''}`} 
            />
          </button>

          {/* Floating Dropdown Menu */}
          {genDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-orange-200 shadow-2xl z-40 p-2 max-h-72 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
              {/* Option: Select All / Clear */}
              <div 
                onClick={() => setSelectedGens([])}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/70 cursor-pointer transition select-none"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={selectedGens.length === 0}
                    onChange={() => setSelectedGens([])}
                    className="w-4 h-4 rounded text-orange-800 focus:ring-amber-500 border-stone-300 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-stone-800">
                    সকল প্রজন্ম (All Generations)
                  </span>
                </div>
                <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                  {spouses.length} জন
                </span>
              </div>

              <div className="h-px bg-stone-100 my-1"></div>

              {/* Generation Checklist */}
              <div className="space-y-1">
                {generationStats.map(stat => {
                  const isChecked = selectedGens.includes(stat.level);
                  return (
                    <div
                      key={stat.level}
                      onClick={() => toggleGen(stat.level)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition select-none ${
                        isChecked ? 'bg-orange-50 text-orange-950 font-bold' : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div click
                          className="w-4 h-4 rounded text-orange-800 focus:ring-amber-500 border-stone-300 cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm">
                          {stat.label}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isChecked ? 'bg-orange-200 text-orange-900' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {stat.count} জন
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Generation Badges/Chips */}
        {selectedGens.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-stone-100">
            <span className="text-[11px] text-stone-400 font-medium">নির্বাচিত প্রজন্ম:</span>
            {selectedGens.map(gen => (
              <span
                key={gen}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 text-xs font-bold"
              >
                <span>{getGenLabel(gen)}</span>
                <button
                  type="button"
                  onClick={() => toggleGen(gen)}
                  className="p-0.5 hover:bg-orange-200 rounded-full transition text-orange-700 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Search and Secondary Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="সহধর্মিণী বা স্বামীর নাম, পেশা, গ্রাম দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 transition cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Blood Group Filter */}
        <div>
          <select
            value={selectedBlood}
            onChange={(e) => setSelectedBlood(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition cursor-pointer"
          >
            <option value="all">সব রক্তের গ্রুপ (All Blood)</option>
            {availableBloodGroups.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-800 animate-spin"></div>
          <p className="text-stone-500 font-medium text-sm animate-pulse">সহধর্মিণী প্রোফাইলসমূহ লোড হচ্ছে...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-center space-y-2">
          <p className="font-semibold">{error}</p>
        </div>
      ) : groupedByGen.length === 0 ? (
        <div className="py-16 px-4 bg-white rounded-2xl border border-dashed border-orange-200 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-400 mb-3">
            <Heart size={32} className="fill-orange-200 text-orange-400" />
          </div>
          <h3 className="font-serif font-bold text-lg text-stone-800 mb-1">কোনো সহধর্মিণীর তথ্য পাওয়া যায়নি</h3>
          <p className="text-sm text-stone-500 max-w-md">
            আপনার নির্বাচিত ফিল্টার বা অনুসন্ধানে কোনো সহধর্মিণীর প্রোফাইল মিলেনি। অনুগ্রহ করে ফিল্টার পরিবর্তন করে দেখুন।
          </p>
          {(searchTerm || selectedGens.length > 0 || selectedBlood !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGens([]);
                setSelectedBlood('all');
              }}
              className="mt-4 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-900 text-xs font-bold rounded-xl border border-orange-200 transition cursor-pointer"
            >
              ফিল্টার রিসেট করুন (Reset Filters)
            </button>
          )}
        </div>
      ) : (
        /* Generation Groups */
        <div className="space-y-8 animate-fade-in">
          {groupedByGen.map(group => (
            <div key={group.gen} className="space-y-4">
              {/* Generation Section Header */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-orange-800 via-rose-800 to-red-900 text-white px-4 py-1.5 rounded-xl shadow-xs">
                  <Heart size={15} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-serif font-bold text-sm tracking-wide">
                    {group.label}
                  </span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-orange-200 via-amber-100 to-transparent"></div>
                <span className="text-xs font-bold text-orange-950 bg-orange-100/90 px-2.5 py-1 rounded-full border border-orange-200">
                  {group.items.length} জন সহধর্মিণী
                </span>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {group.items.map(spouse => {
                  const partnerNames = (spouse.partners && spouse.partners.length > 0)
                    ? spouse.partners.map(p => p.name_bangla || p.full_name).join(', ')
                    : 'তথ্য নেই';

                  return (
                    <div
                      key={spouse.id}
                      onClick={() => onViewProfile && onViewProfile(spouse)}
                      className="group relative bg-white rounded-2xl border border-orange-100 hover:border-orange-300 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between cursor-pointer"
                    >
                      {/* Top Decorative Gradient Accent Bar */}
                      <div className="h-1.5 w-full bg-gradient-to-r from-orange-700 via-red-700 to-amber-500"></div>

                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                        {/* Top Row: Avatar + Generation Badge */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            {/* Avatar with Halo Ring */}
                            <div className="relative">
                              <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-orange-600 via-red-600 to-yellow-400 shadow-sm shadow-orange-500/20">
                                <div className="w-full h-full rounded-full overflow-hidden bg-orange-50 flex items-center justify-center">
                                  {spouse.profile_image_url ? (
                                    <img 
                                      src={spouse.profile_image_url} 
                                      alt={spouse.full_name} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-orange-100 to-amber-50 text-orange-600">
                                      <Heart size={24} className="fill-orange-300/40 text-orange-600" />
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Bottom-right Heart Badge */}
                              <div className="absolute -bottom-1 -right-1 bg-red-800 text-white p-1 rounded-full shadow-md border-2 border-white">
                                <Heart size={10} className="fill-current text-white" />
                              </div>
                            </div>

                            {/* Generation & Status Badges */}
                            <div className="flex flex-col items-end gap-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100/90 text-orange-900 border border-orange-200 text-[11px] font-bold tracking-wide">
                                Gen {spouse.generation_level || 1}
                              </span>

                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-900 border border-orange-200 text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-700 animate-pulse"></span>
                                সহধর্মিণী
                              </span>

                              {spouse.is_alive === false && (
                                <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full font-medium">
                                  স্বর্গীয়
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Names */}
                          <div className="mb-2">
                            <h4 className="font-serif font-bold text-lg text-stone-900 group-hover:text-orange-800 transition-colors line-clamp-1">
                              {spouse.name_bangla || spouse.full_name}
                            </h4>
                            {spouse.name_english && spouse.name_bangla && (
                              <p className="text-xs text-stone-500 font-medium line-clamp-1">
                                {spouse.name_english}
                              </p>
                            )}
                          </div>

                          {/* Husband Tag */}
                          <div className="mb-3.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50/80 border border-orange-100 text-xs text-orange-950">
                            <Heart size={13} className="text-red-700 fill-red-700 shrink-0" />
                            <span className="truncate">
                              স্বামী: <strong className="font-bold">{partnerNames}</strong>
                            </span>
                          </div>

                          {/* Info Items Mini-Grid */}
                          <div className="space-y-1.5 text-xs text-stone-600 mb-4 bg-stone-50/60 p-2.5 rounded-xl border border-stone-100">
                            {/* Occupation */}
                            {spouse.occupation && (
                              <div className="flex items-center gap-2">
                                <Briefcase size={12} className="text-orange-800 shrink-0" />
                                <span className="truncate font-medium">{spouse.occupation}</span>
                              </div>
                            )}

                            {/* Workplace */}
                            {spouse.workplace && (
                              <div className="flex items-center gap-2">
                                <Building size={12} className="text-orange-800 shrink-0" />
                                <span className="truncate">{spouse.workplace}</span>
                              </div>
                            )}

                            {/* Blood Group */}
                            {spouse.blood_group && (
                              <div className="flex items-center gap-2">
                                <Droplet size={12} className="text-red-600 shrink-0 fill-red-600" />
                                <span>রক্তের গ্রুপ: <strong className="text-red-800 font-extrabold">{spouse.blood_group}</strong></span>
                              </div>
                            )}

                            {/* Phone */}
                            {spouse.contact_number && (
                              <div className="flex items-center gap-2">
                                <Phone size={12} className="text-orange-800 shrink-0" />
                                <a 
                                  href={`tel:${spouse.contact_number}`} 
                                  className="text-orange-900 hover:underline font-semibold"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {spouse.contact_number}
                                </a>
                              </div>
                            )}

                            {/* Location */}
                            {(spouse.home_name || spouse.village) && (
                              <div className="flex items-center gap-2 text-stone-500">
                                <Home size={12} className="text-stone-400 shrink-0" />
                                <span className="truncate">
                                  {spouse.home_name ? `${spouse.home_name}, ` : ''}
                                  {spouse.village || ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* View Profile Action Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewProfile) onViewProfile(spouse);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-orange-50 hover:bg-orange-100 text-orange-900 hover:text-orange-950 border border-orange-200 rounded-xl text-xs font-bold transition-all active:scale-98 group/btn cursor-pointer"
                        >
                          <Eye size={14} className="text-orange-800 group-hover/btn:scale-110 transition-transform" />
                          <span>বিস্তারিত প্রোফাইল / View Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpousesDirectoryView;
