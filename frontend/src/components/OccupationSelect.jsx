import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, ChevronDown, Check, Plus, X, Search, Sparkles } from 'lucide-react';
import api from '../api/api';
import { STANDARD_OCCUPATIONS, getStandardEquivalent } from '../constants/occupations';
import { useLanguage } from '../context/LanguageContext';

const OccupationSelect = ({
  value = '',
  onChange,
  placeholder,
  label,
  className = ''
}) => {
  const { t, isBn, formatOccupation } = useLanguage();
  const displayLabel = label !== undefined ? label : t('পেশা', 'Occupation');
  const displayPlaceholder = placeholder || t('পেশা নির্বাচন করুন বা খুঁজুন...', 'Select or search occupation...');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dbOccupations, setDbOccupations] = useState([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customBangla, setCustomBangla] = useState('');
  const [customEnglish, setCustomEnglish] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch unique occupations already stored in DB
  useEffect(() => {
    let isMounted = true;
    api.get('/members/meta/occupations')
      .then(res => {
        if (isMounted && Array.isArray(res.data)) {
          setDbOccupations(res.data);
        }
      })
      .catch(err => {
        console.warn('Could not load existing occupations list:', err);
      });
    return () => { isMounted = false; };
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Check if current value has an automatic standard equivalent
  const standardEquivalent = getStandardEquivalent(value);
  const showUpgradeSuggestion = standardEquivalent && standardEquivalent !== value;

  // Helper to determine if an item represents "Other" / "অন্যান্য"
  const isOtherItem = (item) => {
    const l = (item.label || '').toLowerCase();
    return l.includes('other') || l.includes('অন্যান্য');
  };

  // Merge standard occupations and existing DB occupations into ONE unified, deduplicated list
  const allOccupations = React.useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Standard predefined occupations
    STANDARD_OCCUPATIONS.forEach(item => {
      const key = item.label.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          label: item.label,
          bangla: item.bangla,
          english: item.english,
          aliases: item.aliases || []
        });
      }
    });

    // 2. Add any occupations from the database
    dbOccupations.forEach(item => {
      if (!item || !item.trim()) return;
      const trimmed = item.trim();
      const key = trimmed.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        const parts = trimmed.split('/').map(p => p.trim());
        list.push({
          label: trimmed,
          bangla: parts[0] || trimmed,
          english: parts[1] || trimmed,
          aliases: []
        });
      }
    });

    // Sort alphabetically, with "Other / অন্যান্য" strictly pinned at the very end
    return list.sort((a, b) => {
      const aIsOther = isOtherItem(a);
      const bIsOther = isOtherItem(b);
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      return a.label.localeCompare(b.label, 'bn');
    });
  }, [dbOccupations]);

  // Unified filter for all occupations (with "Other / অন্যান্য" pinned at the end)
  const filteredOccupations = React.useMemo(() => {
    const filtered = allOccupations.filter(item => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const inAliases = item.aliases && item.aliases.some(al => al.toLowerCase().includes(term));
      return (
        item.label.toLowerCase().includes(term) ||
        (item.bangla && item.bangla.toLowerCase().includes(term)) ||
        (item.english && item.english.toLowerCase().includes(term)) ||
        inAliases
      );
    });

    return filtered.sort((a, b) => {
      const aIsOther = isOtherItem(a);
      const bIsOther = isOtherItem(b);
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      return a.label.localeCompare(b.label, 'bn');
    });
  }, [allOccupations, searchTerm]);

  const handleSelect = (selectedValue) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCreateCustom = (e) => {
    e?.preventDefault();
    const b = customBangla.trim();
    const eng = customEnglish.trim();

    let combined = '';
    if (b && eng) {
      combined = `${b} / ${eng}`;
    } else if (b) {
      combined = b;
    } else if (eng) {
      combined = eng;
    }

    if (combined) {
      onChange(combined);
      setShowCustomModal(false);
      setCustomBangla('');
      setCustomEnglish('');
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {displayLabel && (
        <label className="block text-xs font-bold text-stone-500 uppercase mb-1 flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5 text-orange-700" />
          <span>{displayLabel}</span>
        </label>
      )}

      {/* Main Select Button / Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2.5 bg-white border-2 rounded-lg cursor-pointer flex items-center justify-between transition-all duration-200 ${
          isOpen
            ? 'border-orange-500 ring-2 ring-orange-100 shadow-sm'
            : 'border-stone-200 hover:border-stone-300'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden pr-2">
          {value ? (
            <span className="text-stone-900 font-medium text-sm truncate flex items-center gap-1.5">
              <span>{formatOccupation(value)}</span>
            </span>
          ) : (
            <span className="text-stone-400 text-sm truncate">{displayPlaceholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              title={t('মুছুন', 'Clear')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-orange-600' : ''}`} />
        </div>
      </div>

      {/* Helpful banner for upgrading existing legacy single-word occupations */}
      {showUpgradeSuggestion && !isOpen && (
        <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900 animate-fade-in">
          <div className="flex items-center gap-1.5 truncate mr-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
            <span className="truncate">
              {t('স্ট্যান্ডার্ড রূপান্তর:', 'Standard equivalent:')} <strong>{formatOccupation(standardEquivalent)}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange(standardEquivalent)}
            className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-medium transition-colors flex-shrink-0 shadow-xs cursor-pointer"
          >
            {t('আপগ্রেড', 'Upgrade')}
          </button>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden animate-slide-up max-h-80 flex flex-col">
          {/* Search Box */}
          <div className="p-2 border-b border-stone-100 bg-stone-50/70">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isBn ? "পেশা খুঁজুন... (যেমন: শিক্ষক)" : "Search occupation... (e.g. Teacher)"}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              <Search className="h-3.5 w-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Unified Options List (No Headlines) */}
          <div className="overflow-y-auto flex-1 p-1 space-y-0.5">
            {filteredOccupations.length > 0 ? (
              filteredOccupations.map((item) => {
                const isSelected = value === item.label;
                return (
                  <div
                    key={item.label}
                    onClick={() => handleSelect(item.label)}
                    className={`px-3 py-2 text-xs rounded-md cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-orange-500 text-white font-medium'
                        : 'text-stone-700 hover:bg-orange-50 hover:text-orange-900'
                    }`}
                  >
                    <span className="truncate">{formatOccupation(item.label)}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-white flex-shrink-0 ml-2" />}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-3 text-xs text-stone-400 italic text-center">{t('কোনো পেশা পাওয়া যায়নি', 'No occupation found')}</div>
            )}
          </div>

          {/* Add New Custom Occupation Action */}
          <div className="p-2 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setShowCustomModal(true);
                // Pre-fill with current search term if appropriate
                if (searchTerm.trim()) {
                  if (/[\u0980-\u09FF]/.test(searchTerm)) {
                    setCustomBangla(searchTerm.trim());
                  } else {
                    setCustomEnglish(searchTerm.trim());
                  }
                }
              }}
              className="w-full py-1.5 px-3 bg-white hover:bg-orange-50 border border-orange-200 text-orange-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 shadow-2xs hover:border-orange-300 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-orange-600" />
              <span>{t('নতুন পেশা যোগ করুন', 'Add Custom Occupation')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal / Inline Popover to Add Custom Occupation */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-orange-100 p-5 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-orange-700" />
                <h3 className="font-serif font-bold text-stone-900 text-lg">{t('নতুন পেশা যোগ করুন', 'Add Custom Occupation')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              {isBn ? 'বাংলা এবং ইংরেজি উভয় ভাষায় পেশা লিখুন।' : 'Enter occupation name in both Bangla and English.'}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('বাংলা নাম', 'Bangla Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customBangla}
                  onChange={(e) => setCustomBangla(e.target.value)}
                  placeholder={isBn ? "যেমন: স্থপতি, গবেষক, সমাজকর্মী..." : "e.g. স্থপতি..."}
                  className="w-full p-2 text-sm border-2 border-stone-200 rounded-lg focus:outline-none focus:border-orange-500 text-stone-800"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('ইংরেজি নাম', 'English Name')} <span className="text-stone-400 font-normal">({t('ঐচ্ছিক', 'Optional')})</span>
                </label>
                <input
                  type="text"
                  value={customEnglish}
                  onChange={(e) => setCustomEnglish(e.target.value)}
                  placeholder="e.g. Architect, Researcher..."
                  className="w-full p-2 text-sm border-2 border-stone-200 rounded-lg focus:outline-none focus:border-orange-500 text-stone-800"
                />
              </div>

              {/* Live Preview */}
              {(customBangla || customEnglish) && (
                <div className="p-2.5 bg-orange-50 rounded-lg border border-orange-200 text-xs">
                  <span className="text-stone-500 font-bold block mb-0.5">{t('প্রিভিউ:', 'Preview:')}</span>
                  <span className="font-semibold text-orange-900 text-sm">
                    {formatOccupation(
                      customBangla && customEnglish
                        ? `${customBangla} / ${customEnglish}`
                        : customBangla || customEnglish
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                {t('বাতিল', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleCreateCustom}
                disabled={!customBangla.trim() && !customEnglish.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-orange-800 hover:bg-orange-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {t('পেশা সংরক্ষণ ও নির্বাচন', 'Save & Select')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OccupationSelect;
