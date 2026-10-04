/**
 * Date formatting utilities for Projenitor
 */

/**
 * Formats a date string, timestamp, or Date object into DD/MM/YYYY format.
 * Examples:
 *   "2026-09-30" -> "30/09/2026"
 *   "9/30/2026" -> "30/09/2026"
 *   "2026-09-30T14:32:00.000Z" -> "30/09/2026"
 * 
 * @param {string|Date|number} dateInput 
 * @returns {string} Formatted DD/MM/YYYY string
 */
export const formatDateDDMMYYYY = (dateInput) => {
    if (!dateInput) return '';
    try {
        const str = String(dateInput).trim();
        
        // Exact YYYY-MM-DD or YYYY-M-D (with optional timestamp)
        if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
            const datePart = str.includes('T') ? str.split('T')[0] : str.split(' ')[0];
            const [y, m, d] = datePart.split('-');
            return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
        }
        
        // MM/DD/YYYY or M/D/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
            const [m, d, y] = str.split('/');
            return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
        }
        
        // Fallback for valid Date strings or timestamps
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) {
            const d = String(parsed.getDate()).padStart(2, '0');
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const y = parsed.getFullYear();
            return `${d}/${m}/${y}`;
        }
        return str;
    } catch {
        return String(dateInput);
    }
};
