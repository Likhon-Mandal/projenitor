/**
 * Utility for transliterating Bengali names to English
 * Matches the frontend transliteration in LanguageContext.jsx
 */

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
  'চৌধুরী': 'Chowdhury'
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
  const clean = String(text).replace(/\s*\(\s*(root|মূল|root member|মূল সদস্য)\s*\)/gi, '').trim();

  // If text already contains parenthesis with English: "Bangla (English)"
  const m = clean.match(/^(.*?)\s*[\[(]([^\])]+)[\])]\s*$/);
  if (m) {
    const p1 = m[1].trim();
    const p2 = m[2].trim();
    if (/[a-zA-Z]/.test(p2)) return p2;
    if (/[a-zA-Z]/.test(p1)) return p1;
  }

  // If entirely English already, return as is
  if (!/[\u0980-\u09FF]/.test(clean) && /[a-zA-Z]/.test(clean)) {
    return clean;
  }

  return clean.split(/\s+/).map(transliterateBengaliWord).join(' ');
};

module.exports = {
  transliterateBengali,
  transliterateBengaliWord,
  COMMON_SURNAMES_MAP
};
