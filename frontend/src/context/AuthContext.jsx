import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import api from '../api/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'projenitor_token';
const USER_KEY = 'projenitor_user';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem(USER_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState(() => {
        return Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
    });
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        Cookies.remove(TOKEN_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }, []);

    const refreshProfile = useCallback(async (tokenOverride) => {
        const activeToken = tokenOverride || Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
        if (!activeToken) {
            setLoading(false);
            return null;
        }
        try {
            const res = await api.get('/auth/me');
            if (res.data?.user) {
                const freshUser = res.data.user;
                setUser(prev => ({ ...(prev || {}), ...freshUser }));
                localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
                return freshUser;
            }
        } catch (err) {
            console.error('Failed to sync auth profile with server:', err);
            if (err.response?.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
        return null;
    }, [logout]);

    // Hydrate immediately on mount & refresh fresh role/details from server
    useEffect(() => {
        const savedToken = Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);
        if (savedToken) {
            setToken(savedToken);
            if (savedUser) {
                try {
                    setUser(JSON.parse(savedUser));
                } catch {
                    logout();
                }
            }
            // Asynchronously fetch fresh role from the database on every page load/refresh
            refreshProfile(savedToken);
        } else {
            setLoading(false);
        }
    }, [refreshProfile, logout]);

    // Automatically re-sync profile when user switches back to tab or focuses window
    useEffect(() => {
        const handleFocus = () => {
            const savedToken = Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
            if (savedToken && document.visibilityState === 'visible') {
                refreshProfile(savedToken);
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, [refreshProfile]);

    const login = (newToken, userData) => {
        // Defensive check in case caller inverts arguments
        if (typeof newToken === 'object' && typeof userData === 'string') {
            const temp = newToken;
            newToken = userData;
            userData = temp;
        }
        setToken(newToken);
        setUser(userData);
        // Store in both cookie and localStorage
        Cookies.set(TOKEN_KEY, newToken, { expires: 7, sameSite: 'Lax' });
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        // Immediately fetch full profile from DB
        refreshProfile(newToken);
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const isSuperAdmin = user?.role === 'superadmin';

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isSuperAdmin, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export default AuthContext;
