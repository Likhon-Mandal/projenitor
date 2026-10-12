import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Home as HomeIcon, Map, Search, Users, Calendar, UsersRound,
    Star, HelpCircle, Trash2, Shield, X, LogOut, Key, LayoutDashboard, Heart, BookOpen, Sparkles,
    Smartphone, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePWA } from '../context/PWAContext';

const Sidebar = ({ isOpen, onClose, adminPendingCount = 0 }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin, isSuperAdmin } = useAuth();
    const { language, setLanguage, toggleLanguage, isBn, t, formatName, formatNumber } = useLanguage();
    const { isInstalled, promptInstall } = usePWA();

    const navItems = [
        { to: '/', label: t('বাড়ি', 'Home'), icon: HomeIcon },
        { to: '/history', label: t('আমাদের ঐতিহ্য', 'Our Heritage'), icon: BookOpen },
        { to: '/sammelan', label: t('সম্মেলনের ইতিহাস', 'History of Sammelan'), icon: Sparkles },
        { to: '/explorer', label: t('বংশতালিকা', 'Lineage Explorer'), icon: Map },
        { to: '/directory', label: t('সদস্য অনুসন্ধান', 'Search Members'), icon: Search },
        { to: '/spouses', label: t('সহধর্মিণী তালিকা', 'Spouses Directory'), icon: Heart },
        { to: '/relation', label: t('সম্পর্ক অনুসন্ধান', 'Find Relation'), icon: Users },
        { to: '/board', label: t('বিজ্ঞপ্তি ও কার্যক্রম', 'Events & Notices'), icon: Calendar },
        { to: '/committee', label: t('কমিটি বোর্ড', 'Committee Board'), icon: UsersRound },
        { to: '/eminent', label: t('বিশিষ্ট ব্যক্তিবর্গ', 'Eminent Figures'), icon: Star },
        { to: '/help', label: t('সহায়তা কেন্দ্র', 'Help Desk'), icon: HelpCircle },
    ];

    const adminNavItems = [
        { to: '/recycle-bin', label: t('রিসাইকেল বিন', 'Recycle Bin'), icon: Trash2 },
    ];

    // Close sidebar on route change
    useEffect(() => { onClose(); }, [location.pathname]);

    // Prevent body scroll when sidebar open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleLogout = () => {
        logout();
        navigate('/login');
        onClose();
    };

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div
                className={`fixed top-0 left-0 h-full w-72 bg-orange-900 z-[70] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-orange-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl p-0.5 bg-orange-950/80 border border-yellow-400/40 shadow-sm shrink-0 flex items-center justify-center">
                            <img
                                src="/pwa-icon.svg"
                                alt="বাড়ৈ বংশ প্রতীক"
                                className="w-full h-full object-cover rounded-lg"
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="font-serif font-bold text-white text-base sm:text-lg truncate">
                                বাড়ৈ বংশের ইতিবৃত্ত
                            </p>
                            <p className="text-orange-300 text-xs truncate">
                                {t('পারিবারিক ইতিবৃত্ত', 'Ancestral Records')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Language Switcher Pill */}
                        <div className="flex items-center bg-orange-950/80 border border-orange-700/60 rounded-full p-0.5 text-xs font-bold transition-all shadow-inner">
                            <button
                                type="button"
                                onClick={() => setLanguage('bn')}
                                className={`px-2 py-0.5 rounded-full text-[11px] cursor-pointer transition-all active:scale-95 ${isBn ? 'bg-yellow-500 text-orange-950 font-black shadow-xs' : 'text-orange-200/80 hover:text-white'}`}
                                title="বাংলা"
                                aria-label="বাংলা"
                            >
                                বাং
                            </button>
                            <button
                                type="button"
                                onClick={() => setLanguage('en')}
                                className={`px-2 py-0.5 rounded-full text-[11px] cursor-pointer transition-all active:scale-95 ${!isBn ? 'bg-yellow-500 text-orange-950 font-black shadow-xs' : 'text-orange-200/80 hover:text-white'}`}
                                title="English"
                                aria-label="English"
                            >
                                EN
                            </button>
                        </div>
                        <button onClick={onClose} className="text-orange-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-orange-800">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* User Info (if logged in) */}
                {user && (
                    <div className="px-5 py-3 bg-orange-800/50 border-b border-orange-800">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-4 h-4 text-orange-900" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-white text-sm font-medium truncate">{formatName(user)}</p>
                                <p className="text-orange-300 text-xs capitalize">{user.role}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(to) ? 'bg-yellow-500 text-orange-900 font-bold' : 'text-orange-100 hover:bg-orange-800 hover:text-white'}`}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {label}
                        </Link>
                    ))}

                    {isAdmin && (
                        <>
                            <div className="pt-3 pb-1 px-3">
                                <p className="text-orange-400 text-xs font-semibold uppercase tracking-wider">
                                    {t('অ্যাডমিন প্যানেল', 'Admin')}
                                </p>
                            </div>
                            {/* Dashboard link */}
                            <Link
                                to={isSuperAdmin ? '/dashboard/superadmin' : '/dashboard/admin'}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard') ? 'bg-yellow-500 text-orange-900 font-bold' : 'text-orange-100 hover:bg-orange-800 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                                    <span>{isSuperAdmin ? t('সুপার এডমিন ড্যাশবোর্ড', 'SuperAdmin Dashboard') : t('ড্যাশবোর্ড', 'Dashboard')}</span>
                                </div>
                                {adminPendingCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
                                        {formatNumber(adminPendingCount)}
                                    </span>
                                )}
                            </Link>
                            {adminNavItems.map(({ to, label, icon: Icon }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(to) ? 'bg-yellow-500 text-orange-900 font-bold' : 'text-orange-100 hover:bg-orange-800 hover:text-white'}`}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    {label}
                                </Link>
                            ))}
                        </>
                    )}
                </nav>

                {/* PWA App Install Action */}
                <div className="px-3 py-2 border-t border-orange-800/80">
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            promptInstall();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-950 to-orange-900 border border-yellow-500/40 text-yellow-300 hover:text-yellow-200 transition-all active:scale-95 shadow-md group cursor-pointer text-left"
                    >
                        <div className="w-8 h-8 rounded-lg bg-orange-800 border border-yellow-400/30 flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform shrink-0">
                            <Smartphone className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between font-bold text-xs">
                                <span className="truncate">{t('ফোনে অ্যাপ ইনস্টল করুন', 'Install Phone App')}</span>
                                {isInstalled && (
                                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950 px-1 py-0.2 rounded border border-emerald-500/30">
                                        ✓ {t('যুক্ত আছে', 'Installed')}
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] text-orange-200/70 truncate">
                                {isInstalled
                                    ? t('হোম স্ক্রিনে অলরেডি আছে', 'Already on home screen')
                                    : t('হোম স্ক্রিন থেকে সহজে ব্যবহার', 'Fast home screen access')}
                            </div>
                        </div>
                        {!isInstalled && (
                            <Download className="w-3.5 h-3.5 text-yellow-400 opacity-80 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all shrink-0" />
                        )}
                    </button>
                </div>

                {/* Bottom Actions */}
                <div className="p-3 border-t border-orange-800 space-y-1">
                    {user ? (
                        <>
                            <Link to="/change-password" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-orange-100 hover:bg-orange-800 hover:text-white transition-all">
                                <Key className="w-4 h-4" /> {t('পাসওয়ার্ড পরিবর্তন', 'Change Password')}
                            </Link>
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-900/50 hover:text-red-200 transition-all">
                                <LogOut className="w-4 h-4" /> {t('লগআউট', 'Logout')}
                            </button>
                        </>
                    ) : (
                        <div className="space-y-1.5 pt-1">
                            <Link
                                to="/user-auth"
                                state={{ mode: 'login' }}
                                onClick={onClose}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold bg-orange-800 text-yellow-400 hover:bg-orange-700 transition-all border border-orange-700 shadow-sm"
                            >
                                <Shield className="w-4 h-4" /> {t('লগইন করুন', 'Sign In')}
                            </Link>
                            <Link
                                to="/user-auth"
                                state={{ mode: 'register' }}
                                onClick={onClose}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold bg-red-700 text-white hover:bg-red-600 transition-all shadow-md"
                            >
                                <Shield className="w-4 h-4 text-yellow-400" /> {t('অ্যাকাউন্ট চালু করুন', 'Active Account')}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
