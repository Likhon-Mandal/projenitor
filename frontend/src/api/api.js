import axios from 'axios';
import Cookies from 'js-cookie';
import { encrypt, decrypt } from '../utils/crypto';

const TOKEN_KEY = 'projenitor_token';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

// Attach JWT token and Obfuscate outgoing data
api.interceptors.request.use((config) => {
    const token = Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Encrypt request body if present
    if (config.data && !(config.data instanceof FormData)) {
        console.log('[Obfuscation] Encrypting outgoing request');
        config.headers['x-api-obfuscated'] = 'true';
        config.data = {
            data: encrypt(config.data)
        };
    }

    return config;
});

// Handle 401 & Decrypt incoming response
api.interceptors.response.use(
    (response) => {
        // Decrypt if response is obfuscated
        if (response.data && response.data.obfuscated && response.data.data) {
            console.log('[Obfuscation] Decrypting incoming response');
            const decryptedData = decrypt(response.data.data);
            if (decryptedData !== null) {
                response.data = decryptedData;
            }
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            Cookies.remove(TOKEN_KEY);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem('projenitor_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
