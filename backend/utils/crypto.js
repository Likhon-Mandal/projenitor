const CryptoJS = require('crypto-js');

// Use a secret key from environment or a default one
const SECRET_KEY = process.env.API_ENCRYPTION_KEY || 'projenitor_fallback_secret_123';

/**
 * Encrypt a string or object using AES
 */
const encrypt = (data) => {
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
const decrypt = (ciphertext) => {
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

module.exports = { encrypt, decrypt };
