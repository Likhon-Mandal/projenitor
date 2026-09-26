import CryptoJS from 'crypto-js';

// In a real app, this should match the backend's key
// Since this is a local setup, we use the same fallback or an env var
const SECRET_KEY = import.meta.env.VITE_API_ENCRYPTION_KEY || 'projenitor_fallback_secret_123';

/**
 * Encrypt a string or object using AES
 */
export const encrypt = (data) => {
    try {
        const text = typeof data === 'string' ? data : JSON.stringify(data);
        return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
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
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);

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
