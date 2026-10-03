import CryptoJS from 'crypto-js';

// In a real app, this should match the backend's key
// Since this is a local setup, we use the same fallback or an env var
const SECRET_KEY = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_ENCRYPTION_KEY) || 'projenitor_fallback_secret_123';

const C = CryptoJS?.AES ? CryptoJS : (CryptoJS?.default || CryptoJS);

/**
 * Encrypt a string or object using AES
 */
export const encrypt = (data) => {
    try {
        if (!C?.AES) {
            console.error('CryptoJS AES is not available');
            return null;
        }
        const text = typeof data === 'string' ? data : JSON.stringify(data);
        return C.AES.encrypt(text, SECRET_KEY).toString();
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
};

/**
 * Decrypt an AES encrypted string
 */
export const decrypt = (ciphertext) => {
    try {
        if (!ciphertext) return null;
        if (!C?.AES || !C?.enc?.Utf8) {
            console.error('CryptoJS AES/enc is not available');
            return null;
        }
        const bytes = C.AES.decrypt(ciphertext, SECRET_KEY);
        const originalText = bytes.toString(C.enc.Utf8);

        if (!originalText) {
            console.warn('[Obfuscation] Decryption resulted in empty text');
            return null;
        }

        try {
            return JSON.parse(originalText);
        } catch {
            return originalText;
        }
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
};
