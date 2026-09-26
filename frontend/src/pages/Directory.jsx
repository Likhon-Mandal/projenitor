import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, MapPin, Building2, Home, RotateCcw } from 'lucide-react';
import MemberCard from '../components/MemberCard';
import Profile from './Profile';
import api from '../api/api';
import { STANDARD_OCCUPATIONS } from '../constants/occupations';

const Directory = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

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

  const hasActiveFilters = Boolean(
    textInputs.name ||
    textInputs.workplace ||
    textInputs.district ||
    textInputs.upazila ||
    textInputs.village ||
    filters.blood_group
  );

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

      <div className="flex flex-col md:flex-row gap-6 animate-fade-in relative z-10 w-full h-full max-w-7xl mx-auto pt-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-80 bg-white p-6 rounded-2xl shadow-md border border-orange-100 h-fit sticky top-24">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-orange-100/50">
            <div className="flex items-center">
              <Filter className="h-5 w-5 mr-3 text-orange-600" />
              <h2 className="text-xl font-serif font-bold text-stone-900">অনুসন্ধান ফিল্টার</h2>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-orange-700 hover:text-orange-900 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all font-medium"
                title="ফিল্টার রিসেট করুন"
              >
                <RotateCcw className="h-3 w-3" />
                <span>রিসেট</span>
              </button>
            )}
          </div>
          <div className="space-y-4">
            {/* Name Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">নাম</label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={textInputs.name}
                  onChange={handleTextChange}
                  className="w-full border-2 border-stone-200 rounded-lg pl-10 pr-3 py-2 text-stone-800 focus:outline-none focus:border-orange-500 hover:border-stone-300 transition-colors text-sm"
                  placeholder="নাম লিখুন..."
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              </div>
            </div>

            {/* Workplace Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">পেশা / কর্মক্ষেত্র</label>
              <input
                type="text"
                name="workplace"
                list="workplace-list"
                value={textInputs.workplace}
                onChange={handleTextChange}
                className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-orange-500 hover:border-stone-300 transition-colors text-sm"
                placeholder="পেশা লিখুন (e.g. শিক্ষক / Teacher)..."
              />
              <datalist id="workplace-list">
                {STANDARD_OCCUPATIONS.map(occ => (
                  <option key={occ.label} value={occ.label} />
                ))}
              </datalist>
            </div>

            {/* District (Zilla) Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-orange-600" />
                <span>জেলা</span>
              </label>
              <input
                type="text"
                name="district"
                list="district-list"
                value={textInputs.district}
                onChange={handleTextChange}
                className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-orange-500 hover:border-stone-300 transition-colors text-sm"
                placeholder="জেলা লিখুন বা বাছাই করুন..."
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
                <span>উপজেলা</span>
              </label>
              <input
                type="text"
                name="upazila"
                list="upazila-list"
                value={textInputs.upazila}
                onChange={handleTextChange}
                className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-orange-500 hover:border-stone-300 transition-colors text-sm"
                placeholder="উপজেলা লিখুন বা বাছাই করুন..."
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
                <span>গ্রাম</span>
              </label>
              <input
                type="text"
                name="village"
                list="village-list"
                value={textInputs.village}
                onChange={handleTextChange}
                className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-orange-500 hover:border-stone-300 transition-colors text-sm"
                placeholder="গ্রাম লিখুন বা বাছাই করুন..."
              />
              <datalist id="village-list">
                {locationSuggestions.villages.map(v => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>

            {/* Divider */}
            <div className="h-px bg-stone-100 w-full my-2"></div>

            {/* Blood Group Select */}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">রক্তের গ্রুপ</label>
              <select
                name="blood_group"
                value={filters.blood_group}
                onChange={handleSelectChange}
                className="w-full border-2 border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-orange-500 hover:border-stone-300 transition-colors cursor-pointer text-sm"
              >
                <option value="">সকল গ্রুপ</option>
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
        </aside>

        {/* Results Section */}
        <div className="flex-1 min-h-[500px] flex flex-col">
          {/* Results Header */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-900 mb-1">পরিবার ডিরেক্টরি</h1>
              {loading ? (
                <p className="text-orange-500 text-sm font-bold animate-pulse">খোঁজ করা হচ্ছে...</p>
              ) : (
                <p className="text-stone-500 text-sm">{members.length} জন সদস্য পাওয়া গেছে</p>
              )}
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 border border-orange-100">
              <Users size={24} />
            </div>
          </div>

          {/* Dynamic Grid */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg border border-orange-100">
                  <span className="w-4 h-4 rounded-full bg-orange-500 animate-ping"></span>
                  <span className="font-bold text-stone-600">খোঁজ করা হচ্ছে...</span>
                </div>
              </div>
            ) : null}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
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
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-stone-400 bg-white rounded-2xl shadow-sm border border-dashed border-stone-200">
                  <Search size={48} className="mb-4 text-stone-300 opacity-50" />
                  <h3 className="text-xl font-serif font-bold text-stone-700 mb-2">কোনো ফলাফল পাওয়া যায়নি</h3>
                  <p className="text-stone-500 max-w-md text-center">আপনার ফিল্টার মানদণ্ডের সাথে মিলে এমন কাউন্কে পাওয়া যায়নি। অনুগ্রহ করে ফিল্টারগুলো পরিবর্তন করে আবার অনুসন্ধান করুন।</p>
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
