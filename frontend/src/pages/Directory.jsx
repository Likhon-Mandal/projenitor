import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, MapPin, Building2, Home, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import MemberCard from '../components/MemberCard';
import Profile from './Profile';
import api from '../api/api';
import { STANDARD_OCCUPATIONS } from '../constants/occupations';
import { useLanguage } from '../context/LanguageContext';

const Directory = () => {
  const { t, isBn, formatNumber } = useLanguage();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Real-time text input state (used for typing)
  const [textInputs, setTextInputs] = useState({
    name: '',
    workplace: '',
    district: '',
    upazila: '',
    village: '',
  });

  // Submitted filter state (used for API calls)
  const [filters, setFilters] = useState({
    name: '',
    workplace: '',
    district: '',
    upazila: '',
    village: '',
    blood_group: '',
  });

  // Location suggestions for datalists
  const [locationSuggestions, setLocationSuggestions] = useState({
    districts: [],
    upazilas: [],
    villages: [],
  });

  // Extract location suggestions from loaded members
  useEffect(() => {
    if (members.length > 0) {
      setLocationSuggestions(prev => {
        const dSet = new Set(prev.districts);
        const uSet = new Set(prev.upazilas);
        const vSet = new Set(prev.villages);
        members.forEach(m => {
          if (m.district) dSet.add(m.district);
          if (m.upazila) uSet.add(m.upazila);
          if (m.village) vSet.add(m.village);
        });
        return {
          districts: Array.from(dSet).sort(),
          upazilas: Array.from(uSet).sort(),
          villages: Array.from(vSet).sort(),
        };
      });
    }
  }, [members]);

  // Debounce effect for Text Inputs to prevent spamming the backend
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        name: textInputs.name,
        workplace: textInputs.workplace,
        district: textInputs.district,
        upazila: textInputs.upazila,
        village: textInputs.village,
      }));
    }, 400); // 400ms delay after typing stops
    return () => clearTimeout(timer);
  }, [textInputs]);

  // Main Fetch Effect triggered whenever `filters` change
  useEffect(() => {
    fetchMembers();
  }, [filters]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.name) params.name = filters.name;
      if (filters.workplace) params.workplace = filters.workplace;
      if (filters.district) params.district = filters.district;
      if (filters.upazila) params.upazila = filters.upazila;
      if (filters.village) params.village = filters.village;
      if (filters.blood_group) params.blood_group = filters.blood_group;

      const response = await api.get('/members', { params });
      setMembers(response.data);
    } catch (error) {
      console.error(error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Handler for text inputs
  const handleTextChange = (e) => {
    setTextInputs({ ...textInputs, [e.target.name]: e.target.value });
  };

  // Handler for select dropdowns
  const handleSelectChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const activeFilterCount = [
    textInputs.name,
    textInputs.workplace,
    textInputs.district,
    textInputs.upazila,
    textInputs.village,
    filters.blood_group,
  ].filter(Boolean).length;

  const hasActiveFilters = Boolean(activeFilterCount > 0);

  const handleResetFilters = () => {
    setTextInputs({
      name: '',
      workplace: '',
      district: '',
      upazila: '',
      village: '',
    });
    setFilters({
      name: '',
      workplace: '',
      district: '',
      upazila: '',
      village: '',
      blood_group: '',
    });
  };

  return (
    <>
      {selectedMemberId && <Profile memberId={selectedMemberId} onClose={() => setSelectedMemberId(null)} />}

      <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 animate-fade-in relative z-10 w-full h-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-12">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-80 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-xs lg:shadow-md border border-orange-100 h-fit lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="flex items-center text-left cursor-pointer lg:cursor-default select-none focus:outline-none"
            >
              <Filter className="h-5 w-5 mr-2.5 text-orange-600 shrink-0" />
              <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900">{t('অনুসন্ধান ফিল্টার', 'Search Filters')}</h2>
              {activeFilterCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                  {isBn ? `${formatNumber(activeFilterCount)}টি` : activeFilterCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-orange-700 hover:text-orange-900 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all font-medium cursor-pointer active:scale-95"
                  title={t('ফিল্টার রিসেট করুন', 'Reset filters')}
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{t('রিসেট', 'Reset')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="lg:hidden p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
                aria-label={isMobileFilterOpen ? 'Collapse filters' : 'Expand filters'}
              >
                {isMobileFilterOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>

          <div className={`${isMobileFilterOpen ? 'block' : 'hidden lg:block'} mt-4 pt-4 border-t border-orange-100/60 transition-all duration-300`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5 sm:gap-4">
              {/* Name Input */}
              <div className="relative">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">{t('নাম', 'Name')}</label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={textInputs.name}
                    onChange={handleTextChange}
                    className="w-full border-2 border-stone-200 rounded-lg pl-9 pr-3 py-1.5 sm:py-2 text-stone-800 focus:outline-none focus:border-orange-500 hover:border-stone-300 transition-colors text-xs sm:text-sm"
                    placeholder={t('নাম লিখুন...', 'Enter name...')}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-stone-400" />
                </div>
              </div>

              {/* Workplace Input */}
              <div className="relative">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">{t('পেশা ও কর্মক্ষেত্র', 'Occupation & Workplace')}</label>
                <input
                  type="text"
                  name="workplace"
                  list="workplace-list"
                  value={textInputs.workplace}
                  onChange={handleTextChange}
                  className="w-full border-2 border-stone-200 rounded-lg px-3 py-1.5 sm:py-2 text-stone-800 focus:outline-none focus:border-orange-500 hover:border-stone-300 transition-colors text-xs sm:text-sm"
                  placeholder={t('পেশা লিখুন (যেমন: শিক্ষক)...', 'Enter occupation (e.g. Teacher)...')}
                />
                <datalist id="workplace-list">
                  {STANDARD_OCCUPATIONS.map(occ => {
                    const val = isBn ? occ.bangla : occ.english;
                    return <option key={occ.label} value={val} />;
                  })}
                </datalist>
              </div>

              {/* District (Zilla) Input */}
              <div className="relative">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-orange-600" />
                  <span>{t('জেলা', 'District')}</span>
                </label>
                <input
                  type="text"
                  name="district"
                  list="district-list"
                  value={textInputs.district}
                  onChange={handleTextChange}
                  className="w-full border-2 border-stone-200 rounded-lg px-3 py-1.5 sm:py-2 text-stone-800 focus:outline-none focus:border-orange-500 hover:border-stone-300 transition-colors text-xs sm:text-sm"
                  placeholder={t('জেলা লিখুন বা বাছাই করুন...', 'Enter or select district...')}
                />
                <datalist id="district-list">
                  {locationSuggestions.districts.map(d => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              {/* Upazila Input */}
              <div className="relative">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-orange-600" />
                  <span>{t('উপজেলা', 'Upazila')}</span>
                </label>
                <input
                  type="text"
                  name="upazila"
                  list="upazila-list"
                  value={textInputs.upazila}
                  onChange={handleTextChange}
                  className="w-full border-2 border-stone-200 rounded-lg px-3 py-1.5 sm:py-2 text-stone-800 focus:outline-none focus:border-orange-500 hover:border-stone-300 transition-colors text-xs sm:text-sm"
                  placeholder={t('উপজেলা লিখুন বা বাছাই করুন...', 'Enter or select upazila...')}
                />
                <datalist id="upazila-list">
                  {locationSuggestions.upazilas.map(u => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>

              {/* Village (Gram) Input */}
              <div className="relative">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5 text-orange-600" />
                  <span>{t('গ্রাম', 'Village')}</span>
                </label>
                <input
                  type="text"
                  name="village"
                  list="village-list"
                  value={textInputs.village}
                  onChange={handleTextChange}
                  className="w-full border-2 border-stone-200 rounded-lg px-3 py-1.5 sm:py-2 text-stone-800 focus:outline-none focus:border-orange-500 hover:border-stone-300 transition-colors text-xs sm:text-sm"
                  placeholder={t('গ্রাম লিখুন বা বাছাই করুন...', 'Enter or select village...')}
                />
                <datalist id="village-list">
                  {locationSuggestions.villages.map(v => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>

              {/* Blood Group Select */}
              <div className="relative">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">{t('রক্তের গ্রুপ', 'Blood Group')}</label>
                <select
                  name="blood_group"
                  value={filters.blood_group}
                  onChange={handleSelectChange}
                  className="w-full border-2 border-stone-200 rounded-lg px-3 py-1.5 sm:py-2 text-stone-800 focus:outline-none focus:border-orange-500 hover:border-stone-300 transition-colors cursor-pointer text-xs sm:text-sm"
                >
                  <option value="">{t('সকল গ্রুপ', 'All Groups')}</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Results Section */}
        <div className="flex-1 min-h-[500px] flex flex-col">
          {/* Results Header */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-stone-100 mb-5 sm:mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mb-1">{t('পরিবার ডিরেক্টরি', 'Family Directory')}</h1>
              {loading ? (
                <p className="text-orange-500 text-xs sm:text-sm font-bold animate-pulse">{t('খোঁজ করা হচ্ছে...', 'Searching...')}</p>
              ) : (
                <p className="text-stone-500 text-xs sm:text-sm">
                  {isBn ? `${formatNumber(members.length)} জন সদস্য পাওয়া গেছে` : `${members.length} members found`}
                </p>
              )}
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 border border-orange-100 shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Dynamic Grid */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg border border-orange-100">
                  <span className="w-4 h-4 rounded-full bg-orange-500 animate-ping"></span>
                  <span className="font-bold text-stone-600 text-xs sm:text-sm">{t('খোঁজ করা হচ্ছে...', 'Searching...')}</span>
                </div>
              </div>
            ) : null}
            <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-5 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {members.length > 0 ? (
                members.map((member, index) => (
                  <div key={member.id} className="animate-slide-up" style={{ animationDelay: `${0.03 * index}s` }}>
                    <MemberCard
                      member={member}
                      onViewProfile={() => setSelectedMemberId(member.id)}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-stone-400 bg-white rounded-2xl shadow-xs border border-dashed border-stone-200">
                  <Search size={40} className="mb-3 text-stone-300 opacity-50 sm:w-12 sm:h-12" />
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-700 mb-1.5 text-center">{t('কোনো ফলাফল পাওয়া যায়নি', 'No results found')}</h3>
                  <p className="text-stone-500 max-w-md text-center text-xs sm:text-sm">{t('আপনার ফিল্টার মানদণ্ডের সাথে মিলে এমন কাউকে পাওয়া যায়নি। অনুগ্রহ করে ফিল্টারগুলো পরিবর্তন করে আবার অনুসন্ধান করুন।', 'No members matched your filter criteria. Please adjust your filters and try again.')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Directory;
