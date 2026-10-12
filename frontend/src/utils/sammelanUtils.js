/**
 * Utility functions for Sammelan (Gathering) formatting and localization
 */

export const toBnDigits = (num) => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num ?? '').replace(/[0-9]/g, d => bnDigits[d]);
};

export const toEnDigits = (num) => {
    const bnDigits = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
    return String(num ?? '').replace(/[০-৯]/g, d => bnDigits[d]);
};

export const getOrdinal = (n) => {
    const num = parseInt(n, 10);
    if (isNaN(num)) return `${n}th`;
    const s = ["th", "st", "nd", "rd"];
    const v = num % 100;
    return num + (s[(v - 20) % 10] || s[v] || s[0]);
};

// Compute English year fallback from edition (Anchor: 45th in 1977, 95th in 2027)
export const getEnglishYear = (edition) => {
    const ed = parseInt(edition, 10);
    if (isNaN(ed)) return '';
    return 1977 + (ed - 45);
};

// Clean Date String: remove redundant parenthesized years, 'বঙ্গাব্দ', 'খ্রিঃ'
export const cleanDateString = (str) => {
    if (!str) return '';
    return str
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/\s*বঙ্গাব্দ\s*/g, ' ')
        .replace(/\s*(খ্রিঃ|খ্রিস্টাব্দ)\s*/g, ' ')
        .replace(/,\s*$/, '')
        .trim();
};

const BN_MONTHS_MAP = {
    'বৈশাখ': 'Boishakh',
    'জ্যৈষ্ঠ': 'Joishtho',
    'আষাঢ়': 'Asharh',
    'আষাঢ়': 'Asharh',
    'শ্রাবণ': 'Srabon',
    'ভাদ্র': 'Bhadro',
    'আশ্বিন': 'Ashwin',
    'কার্তিক': 'Kartik',
    'অগ্রহায়ণ': 'Agrahayan',
    'অগ্রহায়ণ': 'Agrahayan',
    'পৌষ': 'Poush',
    'মাঘ': 'Magh',
    'ফাল্গুন': 'Falgun',
    'চৈত্র': 'Choitro'
};

/**
 * Format a Bengali calendar date string for English or Bengali view
 * Example: "১০ ফাল্গুন, ১৪৩২" -> Bengali: "১০ ফাল্গুন, ১৪৩২", English: "10 Falgun, 1432 BS"
 */
export const formatBengaliCalendarDate = (bengaliDateStr, isBn) => {
    if (!bengaliDateStr) return '';
    const cleaned = cleanDateString(bengaliDateStr);
    if (!cleaned) return '';
    if (isBn) return cleaned;

    // In English mode, convert Bengali digits and month names
    let enFormatted = toEnDigits(cleaned);
    Object.entries(BN_MONTHS_MAP).forEach(([bnMonth, enMonth]) => {
        enFormatted = enFormatted.replace(new RegExp(bnMonth, 'g'), enMonth);
    });

    if (!enFormatted.toLowerCase().includes('bs') && /\d{4}/.test(enFormatted)) {
        enFormatted += ' BS';
    }
    return enFormatted;
};

/**
 * Format time string
 * Example: "সকাল ১০:০০ ঘটিকা" -> Bengali: "সকাল ১০:০০ ঘটিকা", English: "10:00 AM"
 */
export const formatSammelanTime = (timeStr, isBn) => {
    if (!timeStr) return '';
    if (isBn) return timeStr;

    let res = toEnDigits(timeStr).replace(/ঘটিকা|ঘটিক/g, '').trim();
    if (/সকাল|ভোর/i.test(res)) {
        res = res.replace(/সকাল|ভোর/gi, '').trim() + ' AM';
    } else if (/দুপুর|বিকাল|সন্ধ্যা|রাত/i.test(res)) {
        res = res.replace(/দুপুর|বিকাল|সন্ধ্যা|রাত/gi, '').trim() + ' PM';
    }
    return res;
};

/**
 * Formats the Sammelan title according to the current language (isBn)
 * Example:
 *  - item: { edition: 48, title: "৪৮তম বংশীয় সম্মেলন (১৯৮০)" }
 *    isBn = true  -> "৪৮তম বংশীয় সম্মেলন (১৯৮০)"
 *    isBn = false -> "48th Lineage Gathering (1980)"
 * 
 *  - item: { edition: 94, title: "৯৪তম ঐতিহাসিক বার্ষিক জ্ঞাতি সম্মেলন" }
 *    isBn = true  -> "৯৪তম ঐতিহাসিক বার্ষিক জ্ঞাতি সম্মেলন"
 *    isBn = false -> "94th Historic Annual Lineage Gathering"
 */
export const formatSammelanTitle = (item, isBn) => {
    if (!item) return '';

    // If Bengali mode, prefer the stored title or format default in Bengali
    if (isBn) {
        return item.title || `${toBnDigits(item.edition)}তম বংশীয় সম্মেলন`;
    }

    // English mode:
    // If an explicit english title field exists and is non-empty, use it
    if (item.title_en && item.title_en.trim()) {
        return item.title_en.trim();
    }

    // If item.title contains NO Bengali characters, it's already in English
    if (item.title && !/[\u0980-\u09FF]/.test(item.title)) {
        return item.title.trim();
    }

    const ord = getOrdinal(item.edition);
    const titleStr = item.title || '';

    // Extract year from parenthesized year in title e.g. (১৯৮০) or (2026)
    let year = '';
    const yearMatch = titleStr.match(/\(([০-৯0-9]{4})\)/);
    if (yearMatch) {
        year = toEnDigits(yearMatch[1]);
    } else if (item.date) {
        try {
            const d = new Date(item.date);
            if (!isNaN(d.getTime())) year = String(d.getFullYear());
        } catch { }
    }
    if (!year) {
        const fallbackYear = getEnglishYear(item.edition);
        if (fallbackYear) year = String(fallbackYear);
    }

    // Determine descriptors
    const isHistoric = titleStr.includes('ঐতিহাসিক');
    const isAnnual = titleStr.includes('বার্ষিক');

    let baseName = 'Lineage Gathering';
    if (isHistoric && isAnnual) {
        baseName = 'Historic Annual Lineage Gathering';
    } else if (isHistoric) {
        baseName = 'Historic Lineage Gathering';
    } else if (isAnnual) {
        baseName = 'Annual Lineage Gathering';
    }

    // Include year in parentheses if original title had parenthesized year or if not historic
    const formattedYear = (year && (titleStr.includes('(') || (!isHistoric && !isAnnual))) ? ` (${year})` : '';

    return `${ord} ${baseName}${formattedYear}`;
};
