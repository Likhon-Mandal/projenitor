const { encrypt, decrypt } = require('../utils/crypto');

/**
 * Middleware to handle API data obfuscation
 */
const encryptionMiddleware = (req, res, next) => {
    // 1. Handle Incoming Encrypted Body
    // If the request has an 'x-encrypted' header and a body, decrypt it
    if (req.headers['x-api-obfuscated'] === 'true' && req.body && req.body.data) {
        console.log('[Obfuscation] Decrypting incoming request');
        const decryptedBody = decrypt(req.body.data);
        if (decryptedBody) {
            req.body = decryptedBody;
        }
    }

    // 2. Intercept outgoing response to encrypt it
    const originalJson = res.json;
    res.json = function (data) {
        // Only obfuscate if it's a successful JSON response
        // and not already obfuscated
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('[Obfuscation] Encrypting outgoing response');
            const encryptedData = encrypt(data);
            return originalJson.call(this, {
                data: encryptedData,
                obfuscated: true
            });
        }
        return originalJson.call(this, data);
    };

    next();
};

module.exports = encryptionMiddleware;
