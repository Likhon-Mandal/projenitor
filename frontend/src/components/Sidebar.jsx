import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Home as HomeIcon, Map, Search, Users, Calendar, UsersRound,
    Star, HelpCircle, Trash2, Shield, X, LogOut, Key, LayoutDashboard, Heart, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin, isSuperAdmin } = useAuth();
    const { language, setLanguage, toggleLanguage, isBn, t } = useLanguage();

    const navItems = [
        { to: '/', label: t('বাড়ি', 'Home'), icon: HomeIcon },
        { to: '/history', label: t('আমাদের ঐতিহ্য', 'Our Heritage'), icon: BookOpen },
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
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div
                className={`fixed top-0 left-0 h-full w-72 bg-orange-900 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-orange-800">
                    <div>
                        <p className="font-serif font-bold text-white text-lg sm:text-xl truncate">
                            বাড়ৈ বংশের ইতিবৃত্ত
                        </p>
                        <p className="text-orange-300 text-xs">
                            {t('পারিবারিক ইতিবৃত্ত', 'Ancestral Records')}
                        </p>
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
                                <p className="text-white text-sm font-medium truncate">{user.name}</p>
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
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard') ? 'bg-yellow-500 text-orange-900 font-bold' : 'text-orange-100 hover:bg-orange-800 hover:text-white'}`}
                            >
                                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                                {t('ড্যাশবোর্ড', 'Dashboard')}
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
                        <Link to="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-yellow-500 text-orange-900 hover:bg-yellow-400 transition-all">
                            <Shield className="w-4 h-4" /> {t('অ্যাডমিন লগইন', 'Admin Login')}
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
