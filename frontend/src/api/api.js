import axios from 'axios';
import Cookies from 'js-cookie';
import { encrypt, decrypt } from '../utils/crypto';

const TOKEN_KEY = 'projenitor_token';

// In-Memory Client Cache Store
const clientCache = new Map();
const DEFAULT_CACHE_TTL = 45 * 1000; // 45 seconds

/**
 * Clear the entire client cache or entries matching a specific prefix
 * @param {string} [prefix]
 */
export const clearClientCache = (prefix) => {
    if (!prefix) {
        clientCache.clear();
        return;
    }
    for (const key of clientCache.keys()) {
        if (key.startsWith(prefix)) {
            clientCache.delete(key);
        }
    }
};

const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    if (import.meta.env.PROD) {
        return 'https://baraibangsho-backend.vercel.app/api';
    }
    return '/api';
};

const api = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
});

// Attach JWT token, Obfuscate outgoing data, and check In-Memory Cache
api.interceptors.request.use((config) => {
    const token = Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Always announce support for obfuscated payload
    config.headers['x-api-obfuscated'] = 'true';

    const method = (config.method || 'get').toLowerCase();

    // Check In-Memory Cache for GET requests (unless config.cache is explicitly false)
    if (method === 'get' && config.cache !== false) {
        const cacheKey = `${config.baseURL || ''}${config.url || ''}?${JSON.stringify(config.params || {})}`;
        const cached = clientCache.get(cacheKey);

        if (cached && Date.now() < cached.expiresAt) {
            config.adapter = () => Promise.resolve({
                data: JSON.parse(JSON.stringify(cached.data)),
                status: cached.status || 200,
                statusText: 'OK',
                headers: { ...cached.headers, 'x-client-cache': 'HIT' },
                config,
                request: {}
            });
            return config;
        }
    } else if (['post', 'put', 'delete', 'patch'].includes(method)) {
        // Invalidate in-memory cache upon any data mutation
        clearClientCache();
    }

    // Encrypt request body if present
    if (config.data && !(config.data instanceof FormData)) {
        config.data = {
            data: encrypt(config.data)
        };
    }

    return config;
});

// Handle 401, Decrypt incoming response, and populate In-Memory Cache
api.interceptors.response.use(
    (response) => {
        // Decrypt if response is obfuscated
        if (response.data && response.data.obfuscated && response.data.data) {
            const decryptedData = decrypt(response.data.data);
            if (decryptedData !== null && decryptedData !== undefined) {
                response.data = decryptedData;
            } else {
                console.error('[Obfuscation] Decryption failed for payload on endpoint:', response.config?.url);
            }
        }

        // Cache successful GET responses in memory
        const method = (response.config.method || 'get').toLowerCase();
        if (method === 'get' && response.config.cache !== false && response.status >= 200 && response.status < 300) {
            // Do not re-cache if served from client cache HIT adapter
            if (response.headers?.['x-client-cache'] !== 'HIT') {
                const cacheKey = `${response.config.baseURL || ''}${response.config.url || ''}?${JSON.stringify(response.config.params || {})}`;
                const ttl = response.config.cacheTTL || DEFAULT_CACHE_TTL;
                clientCache.set(cacheKey, {
                    data: response.data,
                    status: response.status,
                    headers: response.headers,
                    expiresAt: Date.now() + ttl
                });
            }
        }

        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            Cookies.remove(TOKEN_KEY);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem('projenitor_user');
            clearClientCache();
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
