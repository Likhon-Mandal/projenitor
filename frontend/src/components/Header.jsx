import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  UserCircle, Search, Map, Home as HomeIcon, Menu,
  LogOut, LayoutDashboard, Trash2, Shield, Key, ChevronDown,
  Users, Calendar, UsersRound, Star, HelpCircle, Heart, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Sidebar from './Sidebar';
import LogoutModal from './LogoutModal';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const { language, setLanguage, toggleLanguage, isBn, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (to, exact) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const handleLogout = () => {
    logout();
    setLogoutModalOpen(false);
    // Redirect logic: if on dashboard, go to home, else stay
    if (location.pathname.startsWith('/dashboard')) {
      navigate('/');
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary navigation items (always visible on desktop)
  const primaryNav = [
    { to: '/', label: t('বাড়ি', 'Home'), icon: HomeIcon, exact: true },
    { to: '/explorer', label: t('বংশতালিকা', 'Lineage Explorer'), icon: Map },
    { to: '/directory', label: t('সদস্য অনুসন্ধান', 'Search Members'), icon: Search },
  ];

  // Secondary items (grouped in dropdown on desktop)
  const secondaryNav = [
    { to: '/history', label: t('আমাদের ঐতিহ্য', 'Our Heritage'), icon: BookOpen },
    { to: '/relation', label: t('সম্পর্ক অনুসন্ধান', 'Find Relation'), icon: Users },
    { to: '/spouses', label: t('সহধর্মিণী তালিকা', 'Spouses Directory'), icon: Heart },
    { to: '/board', label: t('বিজ্ঞপ্তি ও কার্যক্রম', 'Events & Notices'), icon: Calendar },
    { to: '/committee', label: t('কমিটি বোর্ড', 'Committee Board'), icon: UsersRound },
    { to: '/eminent', label: t('বিশিষ্ট ব্যক্তিবর্গ', 'Eminent Figures'), icon: Star },
    { to: '/help', label: t('সহায়তা কেন্দ্র', 'Help Desk'), icon: HelpCircle },
    { to: '/recycle-bin', label: t('রিসাইকেল বিন', 'Recycle Bin'), icon: Trash2, adminOnly: true },
  ];

  const visibleSecondary = secondaryNav.filter(item => !item.adminOnly || isAdmin);
  const isSecondaryActive = visibleSecondary.some(item => isActive(item.to));

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <header className="bg-orange-800 text-white shadow-lg sticky top-0 z-30 border-b border-orange-700/50">
        <div className="container mx-auto px-4 py-2.5 flex justify-between items-center gap-2">

          {/* Logo + Hamburger */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              id="sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-orange-700 transition-all active:scale-95"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="group flex items-center gap-2">
              <span className="font-serif font-black text-xl sm:text-2xl text-yellow-500 group-hover:text-yellow-400 transition-colors tracking-tight">
                বাড়ৈ বংশের ইতিবৃত্ত
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center bg-orange-900/40 rounded-2xl p-1 border border-white/5">
            {primaryNav.map(({ to, label, icon: Icon, exact }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 hover:text-yellow-400 ${isActive(to, exact) ? 'bg-orange-700 text-yellow-400 shadow-md' : 'text-orange-100/80 hover:bg-orange-800/50'}`}
              >
                {Icon && <Icon className="w-4 h-4 shadow-sm" />}
                <span>{label}</span>
              </Link>
            ))}

            {/* Community Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 hover:text-yellow-400 ${isSecondaryActive || dropdownOpen ? 'text-yellow-400' : 'text-orange-100/80 hover:bg-orange-800/50'}`}
              >
                <span>{t('কমিউনিটি', 'Community')}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-orange-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 animate-slide-up overflow-hidden">
                  {visibleSecondary.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-orange-700/50 hover:text-yellow-400 ${isActive(to) ? 'text-yellow-400 bg-orange-700/30' : 'text-orange-100'}`}
                    >
                      <Icon className="w-4 h-4 opacity-70" />
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right side: Language Switcher + Auth Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Toggle Pill */}
            <div className="flex items-center bg-orange-950/70 border border-orange-700/70 rounded-full p-0.5 text-xs font-bold transition-all shadow-inner">
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`px-2.5 py-1 rounded-full transition-all duration-200 text-xs cursor-pointer select-none active:scale-95 ${isBn ? 'bg-yellow-500 text-orange-950 font-black shadow-sm' : 'text-orange-200/80 hover:text-white hover:bg-white/10'}`}
                title="বাংলা ভাষায় দেখুন"
                aria-label="Switch to Bengali"
              >
                বাং
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-full transition-all duration-200 text-xs cursor-pointer select-none active:scale-95 ${!isBn ? 'bg-yellow-500 text-orange-950 font-black shadow-sm' : 'text-orange-200/80 hover:text-white hover:bg-white/10'}`}
                title="View in English"
                aria-label="Switch to English"
              >
                EN
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-orange-900/40 p-1 rounded-2xl border border-white/5">
                <Link
                  to={isSuperAdmin ? '/dashboard/superadmin' : '/dashboard/admin'}
                  className="flex items-center gap-2 text-sm bg-yellow-500 hover:bg-yellow-400 text-orange-950 font-black px-3 sm:px-4 py-2 rounded-xl transition-all shadow-lg active:scale-95"
                >
                  {user?.profile_image_url ? (
                    <img src={user.profile_image_url} alt="Profile" className="w-5 h-5 rounded-full object-cover shadow-sm" />
                  ) : (
                    <LayoutDashboard className="w-4 h-4" />
                  )}
                  <span className="hidden lg:inline">{t('ড্যাশবোর্ড', 'Dashboard')}</span>
                </Link>

                <div className="flex items-center gap-1 pr-1">
                  <button
                    onClick={() => setLogoutModalOpen(true)}
                    className="flex items-center gap-2 text-sm bg-red-600/20 hover:bg-red-600/40 text-red-100 px-3 sm:px-4 py-2 rounded-xl transition-all font-bold border border-red-500/20"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span className="hidden sm:inline">{t('লগআউট', 'Logout')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-3 py-2 sm:px-5 sm:py-2.5 rounded-2xl transition-all text-xs sm:text-sm font-black shadow-lg shadow-red-900/20 active:scale-95 border border-red-500/50"
              >
                <UserCircle className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('অ্যাডমিন লগইন', 'ADMIN LOGIN')}</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
};

export default Header;
