import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STANDARD_OCCUPATIONS, LEGACY_OCCUPATION_MAP } from '../constants/occupations';

const LanguageContext = createContext();

const STORAGE_KEY = 'projenitor_language';

const DICTIONARY = {
  // Navigation
  home: { bn: 'বাড়ি', en: 'Home' },
  explorer: { bn: 'বংশতালিকা অনুসন্ধান', en: 'Lineage Explorer' },
  directory: { bn: 'সদস্য অনুসন্ধান', en: 'Search Members' },
  spouses: { bn: 'সহধর্মিণী তালিকা', en: 'Spouses Directory' },
  relation: { bn: 'সম্পর্ক অনুসন্ধান', en: 'Find Relation' },
  board: { bn: 'বিজ্ঞপ্তি ও কার্যক্রম', en: 'Events & Notices' },
  committee: { bn: 'কমিটি বোর্ড', en: 'Committee Board' },
  eminent: { bn: 'বিশিষ্ট ব্যক্তিবর্গ', en: 'Eminent Figures' },
  help: { bn: 'সহায়তা কেন্দ্র', en: 'Help Desk' },
  recycleBin: { bn: 'রিসাইকেল বিন', en: 'Recycle Bin' },
  community: { bn: 'কমিউনিটি', en: 'Community' },
  dashboard: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  adminLogin: { bn: 'অ্যাডমিন লগইন', en: 'Admin Login' },
  logout: { bn: 'লগআউট', en: 'Logout' },
  changePassword: { bn: 'পাসওয়ার্ড পরিবর্তন', en: 'Change Password' },

  // Common Actions
  save: { bn: 'সংরক্ষণ করুন', en: 'Save' },
  cancel: { bn: 'বাতিল', en: 'Cancel' },
  delete: { bn: 'মুছে ফেলুন', en: 'Delete' },
  permanentDelete: { bn: 'স্থায়ীভাবে মুছুন', en: 'Permanently Delete' },
  restore: { bn: 'পুনরুদ্ধার করুন', en: 'Restore' },
  confirm: { bn: 'নিশ্চিত করুন', en: 'Confirm' },
  refresh: { bn: 'রিফ্রেশ', en: 'Refresh' },
  search: { bn: 'অনুসন্ধান', en: 'Search' },
  filter: { bn: 'ফিল্টার', en: 'Filter' },
  reset: { bn: 'রিসেট', en: 'Reset' },
  emptyBin: { bn: 'বিন খালি করুন', en: 'Empty Bin' },
  retry: { bn: 'পুনরায় চেষ্টা করুন', en: 'Retry' },
  viewAll: { bn: 'সব দেখুন', en: 'View All' },
  viewDetails: { bn: 'বিস্তারিত দেখুন', en: 'View Details' },

  // Entities & Labels
  members: { bn: 'সদস্যবৃন্দ', en: 'Members' },
  homes: { bn: 'বাড়ি', en: 'Homes' },
  villages: { bn: 'গ্রাম', en: 'Villages' },
  upazilas: { bn: 'উপজেলা', en: 'Upazilas' },
  districts: { bn: 'জেলা', en: 'Districts' },
  divisions: { bn: 'বিভাগ', en: 'Divisions' },
  countries: { bn: 'দেশ', en: 'Countries' },
  male: { bn: 'পুরুষ', en: 'Male' },
  female: { bn: 'সহধর্মিণী', en: 'Female' },
  spouse: { bn: 'সহধর্মিণী', en: 'Spouse' },
  generation: { bn: 'প্রজন্ম', en: 'Generation' },
  occupation: { bn: 'পেশা', en: 'Occupation' },
  workplace: { bn: 'কর্মক্ষেত্র', en: 'Workplace' },
  bloodGroup: { bn: 'রক্তের গ্রুপ', en: 'Blood Group' },
  phone: { bn: 'ফোন নম্বর', en: 'Phone' },
  parents: { bn: 'পিতা-মাতা', en: 'Parents' },
  father: { bn: 'পিতা', en: 'Father' },
  mother: { bn: 'মাতা', en: 'Mother' },
  items: { bn: 'টি আইটেম', en: 'items' },
  loading: { bn: 'লোড হচ্ছে...', en: 'Loading...' },
  noData: { bn: 'কোনো তথ্য নেই', en: 'No data found' },
  error: { bn: 'ত্রুটি', en: 'Error' },
};

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'en' ? 'en' : 'bn';
    } catch {
      return 'bn';
    }
  });

  const setLanguage = useCallback((langOrFn) => {
    setLanguageState(prev => {
      const next = typeof langOrFn === 'function' ? langOrFn(prev) : langOrFn;
      const valid = next === 'en' ? 'en' : 'bn';
      try {
        localStorage.setItem(STORAGE_KEY, valid);
      } catch (e) {
        console.warn('Could not persist language to localStorage', e);
      }
      return valid;
    });
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => (prev === 'bn' ? 'en' : 'bn'));
  }, [setLanguage]);

  const isBn = language === 'bn';
  const isEn = language === 'en';

  /**
   * Dual-mode translation helper:
   * 1. t('বাড়ি', 'Home') -> returns 'বাড়ি' or 'Home'
   * 2. t('home') -> returns DICTIONARY['home'][language]
   * 3. t('সহধর্মিণী / Female') -> splits on '/' and picks the correct language part
   */
  const t = useCallback((bnOrKey, enOptional) => {
    if (bnOrKey === null || bnOrKey === undefined) return '';

    // Direct dual parameter: t(bnText, enText)
    if (enOptional !== undefined) {
      return isBn ? bnOrKey : enOptional;
    }

    if (typeof bnOrKey !== 'string') return String(bnOrKey);

    // Dictionary key check
    if (DICTIONARY[bnOrKey]) {
      return DICTIONARY[bnOrKey][language] || DICTIONARY[bnOrKey].bn || bnOrKey;
    }

    // Auto-split slash bilingual text if present
    if (bnOrKey.includes(' / ')) {
      const parts = bnOrKey.split(' / ').map(p => p.trim());
      if (parts.length === 2) {
        return isBn ? parts[0] : parts[1];
      }
      if (parts.length > 2) {
        // e.g. "ছুতার / কাঠমিস্ত্রী / Carpenter" -> BN: "ছুতার / কাঠমিস্ত্রী", EN: "Carpenter"
        return isBn ? parts.slice(0, -1).join(' / ') : parts[parts.length - 1];
      }
    }

    return bnOrKey;
  }, [isBn, language]);

  /**
   * Format numbers to Bengali digits if current language is 'bn'
   */
  const formatNumber = useCallback((val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (!isBn) return str;
    return str.replace(/[0-9]/g, digit => BN_DIGITS[parseInt(digit, 10)]);
  }, [isBn]);

  /**
   * Format occupation string to clean single-language text without slash
   */
  const formatOccupation = useCallback((occ) => {
    if (!occ) return '';
    const trimmed = String(occ).trim();

    // Check if it has a slash
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/').map(p => p.trim());
      if (parts.length >= 2) {
        if (isBn) {
          // If first parts are Bengali
          return parts.slice(0, parts.length - 1).join(' / ');
        }
        return parts[parts.length - 1];
      }
    }

    // Check against standard occupations map
    const std = STANDARD_OCCUPATIONS.find(o => 
      o.label.toLowerCase() === trimmed.toLowerCase() ||
      o.bangla.toLowerCase() === trimmed.toLowerCase() ||
      o.english.toLowerCase() === trimmed.toLowerCase()
    );
    if (std) {
      return isBn ? std.bangla : std.english;
    }

    const legacy = LEGACY_OCCUPATION_MAP[trimmed.toLowerCase()];
    if (legacy && legacy.includes(' / ')) {
      const parts = legacy.split(' / ').map(p => p.trim());
      return isBn ? parts[0] : parts[1];
    }

    return trimmed;
  }, [isBn]);

const COMMON_SURNAMES_MAP = {
  'মন্ডল': 'Mandal',
  'মণ্ডল': 'Mandal',
  'হালদার': 'Haldar',
  'কর্মকার': 'Karmakar',
  'বিশ্বাস': 'Biswas',
  'শিকদার': 'Sikdar',
  'রায়': 'Roy',
  'দাস': 'Das',
  'ঘোষ': 'Ghosh',
  'মৃত': 'Late',
  'স্বর্গীয়': 'Late',
  'সরকার': 'Sarker',
  'অধিকারী': 'Adhikari',
  'চক্রবর্তী': 'Chakraborty',
  'ভট্টাচার্য': 'Bhattacharya',
  'ব্যানার্জী': 'Banerjee',
  'মুখার্জী': 'Mukherjee',
  'চ্যাটার্জী': 'Chatterjee',
  'মল্লিক': 'Mallick',
  'মজুমদার': 'Majumder',
  'চৌধুরী': 'Chowdhury',
  'খান': 'Khan',
  'শেখ': 'Sheikh',
  'আলী': 'Ali',
  'হোসেন': 'Hossain',
  'উদ্দিন': 'Uddin',
  'আহমেদ': 'Ahmed',
  'রহমান': 'Rahman'
};

const BN_TO_EN_CHARS = {
  'অ': 'A', 'আ': 'A', 'ই': 'I', 'ঈ': 'I', 'উ': 'U', 'ঊ': 'U', 'ঋ': 'Ri',
  'এ': 'E', 'ঐ': 'Oi', 'ও': 'O', 'ঔ': 'Ou',
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
  'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': '', 'ঁ': ''
};

const BN_KAR_MAP = {
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri',
  'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou', '্': ''
};

const transliterateBengaliWord = (w) => {
  if (!w) return '';
  if (COMMON_SURNAMES_MAP[w]) return COMMON_SURNAMES_MAP[w];
  let res = '';
  const chars = [...w];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const next = chars[i + 1];
    if (BN_TO_EN_CHARS[c]) {
      const en = BN_TO_EN_CHARS[c];
      const isConsonant = !'অআইঈউঊঋএঐওঔ'.includes(c);
      if (isConsonant) {
        if (next && BN_KAR_MAP[next] !== undefined) {
          res += en + BN_KAR_MAP[next];
          i++;
        } else if (next && next === '্') {
          res += en;
          i++;
        } else {
          if (i === chars.length - 1 && chars.length > 2) {
            res += en;
          } else {
            res += en + 'a';
          }
        }
      } else {
        res += en;
      }
    } else {
      res += c;
    }
  }
  return res ? res.charAt(0).toUpperCase() + res.slice(1).toLowerCase() : w;
};

const transliterateBengali = (text) => {
  if (!text) return '';
  return text.split(/\s+/).map(transliterateBengaliWord).join(' ');
};

  /**
   * Format any name (member object or raw string) to show ONLY one language:
   * - If Bengali is selected, show Bengali name.
   * - If English is selected, show English name.
   * - If the name is not in the selected language, show the present one (or transliterated).
   * - Strips dual "(English)" / "(Root)" repetitions like "noyontara (noyontara)".
   */
  const formatName = useCallback((input, overrideIsBn = null) => {
    if (!input) return '';
    const useBn = overrideIsBn !== null ? overrideIsBn : isBn;

    let raw = '';
    let nb = '';
    let ne = '';

    if (typeof input === 'object' && input !== null) {
      nb = input.name_bangla || input.member_name_bangla || input.applicant_name_bangla || input.applicant_member_name_bangla || input.name_bn || '';
      ne = input.name_english || input.member_name_english || input.applicant_name_english || input.applicant_member_name_english || input.name_en || '';
      raw = input.full_name || input.name || input.member_name || input.applicant_name || input.applicant_member_name || '';
    } else if (typeof input === 'string') {
      raw = input;
    }

    const cleanTag = (s) => (s || '').replace(/\s*\(\s*(root|মূল|root member|মূল সদস্য)\s*\)/gi, '').trim();
    nb = cleanTag(nb);
    ne = cleanTag(ne);
    raw = cleanTag(raw);

    // Helper to parse bilingual patterns: "Bangla (English)", "Bangla / English", "Bangla - English", etc.
    const parse = (text) => {
      if (!text) return { bn: '', en: '' };
      const s = cleanTag(text);

      const m = s.match(/^(.*?)\s*[\[(]([^\])]+)[\])]\s*$/);
      if (m) {
        const p1 = m[1].trim();
        const p2 = m[2].trim();

        // Redundant duplicates like "noyontara (noyontara)"
        if (p1.toLowerCase() === p2.toLowerCase()) {
          const hasBn = /[\u0980-\u09FF]/.test(p1);
          return hasBn ? { bn: p1, en: '' } : { bn: '', en: p1 };
        }

        const p1Bn = /[\u0980-\u09FF]/.test(p1);
        const p2Bn = /[\u0980-\u09FF]/.test(p2);
        const p1En = /[a-zA-Z]/.test(p1);
        const p2En = /[a-zA-Z]/.test(p2);

        if (p1Bn && p2En) return { bn: p1, en: p2 };
        if (p2Bn && p1En) return { bn: p2, en: p1 };
        if (p1Bn || p2Bn) return { bn: p1Bn ? p1 : p2, en: p2En ? p2 : '' };
        return { bn: '', en: p1 || p2 };
      }

      if (s.includes('/')) {
        const parts = s.split('/').map(p => p.trim());
        const bnPart = parts.find(p => /[\u0980-\u09FF]/.test(p));
        const enPart = parts.find(p => /[a-zA-Z]/.test(p));
        if (bnPart || enPart) {
          return { bn: bnPart || '', en: enPart || '' };
        }
      }

      if (s.includes(' - ') || s.includes(' – ') || s.includes(' — ')) {
        const parts = s.split(/\s+[-–—]\s+/).map(p => p.trim());
        const bnPart = parts.find(p => /[\u0980-\u09FF]/.test(p));
        const enPart = parts.find(p => /[a-zA-Z]/.test(p));
        if (bnPart || enPart) {
          return { bn: bnPart || '', en: enPart || '' };
        }
      }

      const hasBn = /[\u0980-\u09FF]/.test(s);
      const hasEn = /[a-zA-Z]/.test(s);

      // If both scripts exist, extract clean separate representations
      if (hasBn && hasEn) {
        const m1 = s.match(/^([\u0980-\u09FF\s.,'-]+?)\s+([a-zA-Z][a-zA-Z0-9\s.,'-]*)$/);
        if (m1) return { bn: m1[1].trim(), en: m1[2].trim() };
        const m2 = s.match(/^([a-zA-Z][a-zA-Z0-9\s.,'-]*?)\s+([\u0980-\u09FF][\u0980-\u09FF0-9\s.,'-]*)$/);
        if (m2) return { bn: m2[2].trim(), en: m2[1].trim() };

        // Fallback: strip the other language's characters and punctuation
        const bnOnly = s.replace(/[a-zA-Z][a-zA-Z0-9.,'-]*/g, '').replace(/[()\[\]\/\\–—\-]/g, ' ').replace(/\s+/g, ' ').trim();
        const enOnly = s.replace(/[\u0980-\u09FF][\u0980-\u09FF0-9.,'-]*/g, '').replace(/[()\[\]\/\\–—\-]/g, ' ').replace(/\s+/g, ' ').trim();
        return { bn: bnOnly, en: enOnly };
      }

      if (hasBn) return { bn: s, en: '' };
      return { bn: '', en: s };
    };

    const parsedNb = parse(nb);
    const parsedNe = parse(ne);
    const parsedRaw = parse(raw);

    // Candidate Bengali and English names
    const resolvedBn = parsedNb.bn || (!/[a-zA-Z]/.test(nb) && /[\u0980-\u09FF]/.test(nb) ? nb : '') || parsedRaw.bn || parsedNe.bn;
    const resolvedEn = parsedNe.en || (!/[\u0980-\u09FF]/.test(ne) && /[a-zA-Z]/.test(ne) ? ne : '') || parsedRaw.en || parsedNb.en;

    if (useBn) {
      // 1. Preferred: Bengali
      if (resolvedBn) return resolvedBn;
      // 2. Fallback to present one (English or clean raw)
      if (resolvedEn) return resolvedEn;
      return parsedRaw.bn || parsedRaw.en || raw;
    } else {
      // 1. Preferred: English
      if (resolvedEn) return resolvedEn;
      // 2. If Bengali name exists, transliterate it to clean English script
      const fallbackBn = resolvedBn || parsedRaw.bn || (raw && /[\u0980-\u09FF]/.test(raw) ? raw : '');
      if (fallbackBn) {
        const transliterated = transliterateBengali(fallbackBn);
        if (transliterated) return transliterated;
        return fallbackBn;
      }
      return parsedRaw.en || raw;
    }
  }, [isBn]);

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    isBn,
    isEn,
    t,
    formatNumber,
    formatOccupation,
    formatName
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
