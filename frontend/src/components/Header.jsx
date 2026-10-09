import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  UserCircle, Search, Map, Home as HomeIcon, Menu,
  LogOut, LayoutDashboard, Trash2, Shield, Key, ChevronDown,
  Users, Calendar, UsersRound, Star, HelpCircle, Heart, BookOpen,
  User, Sparkles, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Sidebar from './Sidebar';
import LogoutModal from './LogoutModal';
import NotificationBell from './NotificationBell';
import api from '../api/api';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const { language, setLanguage, toggleLanguage, isBn, t, formatName, formatNumber } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const dropdownRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Fetch admin stats for pending notification badge on navbar
  useEffect(() => {
    if (user && isAdmin) {
      api.get('/admin/stats')
        .then(res => setAdminStats(res.data))
        .catch(err => console.error('Error fetching admin stats for navbar:', err));
    } else {
      setAdminStats(null);
    }
  }, [user, isAdmin, location.pathname]);

  const adminPendingCount = (adminStats?.totalPendingNotifications !== undefined && adminStats.totalPendingNotifications > 0)
    ? adminStats.totalPendingNotifications
    : ((adminStats?.pendingStudentRequests || 0) + (adminStats?.pendingUserAccounts || 0) + (adminStats?.pendingAdminRequests || 0));

  const isActive = (to, exact) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const handleLogout = () => {
    logout();
    setLogoutModalOpen(false);
    setProfileMenuOpen(false);
    if (location.pathname.startsWith('/dashboard')) {
      navigate('/');
    }
  };

  // Close menus on outside click or route change
  useEffect(() => {
    setDropdownOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary navigation items (desktop)
  const primaryNav = [
    { to: '/', label: t('বাড়ি', 'Home'), icon: HomeIcon, exact: true },
    { to: '/explorer', label: t('বংশতালিকা', 'Lineage Explorer'), icon: Map },
    { to: '/directory', label: t('সদস্য অনুসন্ধান', 'Search Members'), icon: Search },
  ];

  // Secondary items (grouped in dropdown on desktop)
  const secondaryNav = [
    { to: '/history', label: t('আমাদের ঐতিহ্য', 'Our Heritage'), icon: BookOpen },
    { to: '/sammelan', label: t('সম্মেলন কথা', 'Sammelan Katha'), icon: Sparkles },
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

  const userName = formatName(user) || '';

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} adminPendingCount={adminPendingCount} />

      <header className="bg-orange-800 text-white shadow-lg sticky top-0 z-40 border-b border-orange-700/50 font-sans">
        <div className="container mx-auto px-4 py-2.5 flex justify-between items-center gap-2">

          {/* Logo + Hamburger */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              id="sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-orange-700 transition-all active:scale-95 cursor-pointer"
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 hover:text-yellow-400 cursor-pointer ${isSecondaryActive || dropdownOpen ? 'text-yellow-400' : 'text-orange-100/80 hover:bg-orange-800/50'}`}
              >
                <span>{t('কমিউনিটি', 'Community')}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-orange-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 animate-slide-up max-h-[calc(100vh-80px)] overflow-y-auto custom-scroll z-50">
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

          {/* Right side: Language Switcher + Notification Bell + Admin Dashboard + Profile Icon */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
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

            {/* Notification Bell (for all users: counts new event, notice, help request) */}
            <NotificationBell inNavbar={true} />

            {/* Admin Dashboard Quick Link with Pending Requests Badge */}
            {user && isAdmin && (
              <Link
                to={isSuperAdmin ? '/dashboard/superadmin' : '/dashboard/admin'}
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-orange-950 text-xs sm:text-sm font-black transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 group border border-yellow-400 select-none cursor-pointer"
                title={isSuperAdmin ? t('সুপার এডমিন ড্যাশবোর্ড', 'SuperAdmin Dashboard') : t('এডমিন ড্যাশবোর্ড', 'Admin Dashboard')}
              >
                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-950 group-hover:scale-110 transition-transform shrink-0" />
                <span className="hidden md:inline font-bold">
                  {isSuperAdmin ? t('সুপার এডমিন ড্যাশবোর্ড', 'SuperAdmin Dashboard') : t('এডমিন ড্যাশবোর্ড', 'Admin Dashboard')}
                </span>
                <span className="md:hidden font-bold">
                  {t('ড্যাশবোর্ড', 'Dashboard')}
                </span>

                {/* Number representing sum of student requests + user accounts + admin management on top right corner */}
                {adminPendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse border-2 border-orange-800 pointer-events-none">
                    {adminPendingCount > 99 ? '99+' : formatNumber(adminPendingCount)}
                  </span>
                )}
              </Link>
            )}

            {/* Profile Icon & Dropdown Box */}
            <div className="relative" ref={profileMenuRef}>
              {user ? (
                /* Logged In: Avatar button */
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className={`relative p-0.5 rounded-full border-2 transition-all duration-200 active:scale-95 flex items-center justify-center cursor-pointer ${
                    profileMenuOpen
                      ? 'border-yellow-400 ring-2 ring-yellow-400/40 shadow-lg'
                      : isSuperAdmin
                      ? 'border-yellow-400 hover:ring-2 hover:ring-yellow-400/30'
                      : isAdmin
                      ? 'border-orange-400 hover:ring-2 hover:ring-orange-400/30'
                      : 'border-orange-600 hover:border-yellow-400'
                  }`}
                  aria-label="User Account Menu"
                  title={userName || 'My Profile'}
                >
                  {user?.profile_image_url ? (
                    <img
                      src={user.profile_image_url}
                      alt="Profile"
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-yellow-500 to-orange-700 flex items-center justify-center text-orange-950 font-black text-sm">
                      {(userName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Status / Role indicator dot */}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-orange-800 ${
                    isSuperAdmin ? 'bg-yellow-400' : isAdmin ? 'bg-orange-400' : 'bg-emerald-400'
                  }`} />
                </button>
              ) : (
                /* Logged Out: Profile Icon button */
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className={`flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border transition-all duration-200 active:scale-95 cursor-pointer shadow-sm group ${
                    profileMenuOpen
                      ? 'bg-orange-700 border-yellow-400 text-yellow-400 shadow-md ring-2 ring-yellow-400/20'
                      : 'bg-orange-900/60 hover:bg-orange-700/80 border-orange-700/60 hover:border-yellow-400/50 text-orange-100 hover:text-yellow-400'
                  }`}
                  aria-label="Account Login and Activation"
                  title={t('প্রোফাইল ও একাউন্ট', 'Profile & Account')}
                >
                  <UserCircle className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
                  <span className="hidden sm:inline text-xs font-bold">{t('প্রোফাইল', 'Profile')}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-orange-300 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              )}

              {/* ─── Profile Dropdown Popup Box ─── */}
              {profileMenuOpen && (
                <div className="absolute top-full right-0 mt-2.5 w-72 sm:w-80 bg-orange-950/95 backdrop-blur-xl border border-orange-700/60 rounded-2xl shadow-2xl overflow-hidden z-50 animate-slide-up divide-y divide-orange-800/60 text-white">
                  
                  {user ? (
                    /* ── Logged In Content ── */
                    <>
                      {/* Header Profile Summary */}
                      <div className="p-4 bg-gradient-to-br from-orange-900/90 to-orange-950 flex items-center gap-3">
                        {user?.profile_image_url ? (
                          <img
                            src={user.profile_image_url}
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400 shadow-md shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-orange-950 font-black text-lg shadow-md shrink-0">
                            {(userName || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-serif font-bold text-sm text-yellow-400 truncate">
                            {userName || t('সদস্য', 'Member')}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isSuperAdmin
                                ? 'bg-yellow-400 text-orange-950 shadow-sm'
                                : isAdmin
                                ? 'bg-orange-600 text-white shadow-sm'
                                : 'bg-orange-800/90 text-orange-200'
                            }`}>
                              <Shield className="w-2.5 h-2.5" />
                              {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Member'}
                            </span>
                          </div>
                          <p className="text-[11px] text-orange-200/70 truncate mt-1">
                            {user.email || user.mobile_number || ''}
                          </p>
                        </div>
                      </div>

                      {/* Navigation Links inside Box */}
                      <div className="py-2 px-1.5 space-y-0.5">
                        {isSuperAdmin && (
                          <Link
                            to="/dashboard/superadmin"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-orange-100 hover:text-yellow-400 hover:bg-orange-800/60 transition-colors group"
                          >
                            <LayoutDashboard className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="truncate">{t('সুপার এডমিন ড্যাশবোর্ড', 'SuperAdmin Dashboard')}</span>
                                {adminPendingCount > 0 && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
                                    {formatNumber(adminPendingCount)}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-orange-300/60 font-normal truncate">{t('ইউজার ম্যানেজমেন্ট ও সিস্টেম কনট্রোল', 'User Management & Controls')}</div>
                            </div>
                          </Link>
                        )}

                        {isAdmin && (
                          <>
                            {!isSuperAdmin && (
                              <Link
                                to="/dashboard/admin"
                                onClick={() => setProfileMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-orange-100 hover:text-yellow-400 hover:bg-orange-800/60 transition-colors group"
                              >
                                <LayoutDashboard className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="truncate">{t('এডমিন ড্যাশবোর্ড', 'Admin Dashboard')}</span>
                                    {adminPendingCount > 0 && (
                                      <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
                                        {formatNumber(adminPendingCount)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-orange-300/60 font-normal truncate">{t('ইউজার রিকোয়েস্ট ও স্ট্যাটাস', 'User Requests & Status')}</div>
                                </div>
                              </Link>
                            )}
                            <Link
                              to="/admin"
                              onClick={() => setProfileMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-orange-100 hover:text-yellow-400 hover:bg-orange-800/60 transition-colors group"
                            >
                              <Shield className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="truncate">{t('তথ্য ব্যবস্থাপনা প্যানেল', 'Data Management Panel')}</div>
                                <div className="text-[11px] text-orange-300/60 font-normal truncate">{t('বংশ ও পারিবারিক তথ্য এন্ট্রি', 'Lineage & Records Entry')}</div>
                              </div>
                            </Link>
                          </>
                        )}

                        {!isAdmin && (
                          <Link
                            to="/dashboard/user"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-orange-100 hover:text-yellow-400 hover:bg-orange-800/60 transition-colors group"
                          >
                            <LayoutDashboard className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{t('ইউজার ড্যাশবোর্ড', 'User Dashboard')}</div>
                              <div className="text-[11px] text-orange-300/60 font-normal truncate">{t('আমার আবেদন ও প্রোফাইল', 'My Requests & Profile')}</div>
                            </div>
                          </Link>
                        )}

                        {user?.member_id && (
                          <Link
                            to={`/member/${user.member_id}`}
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-orange-100 hover:text-yellow-400 hover:bg-orange-800/60 transition-colors group"
                          >
                            <User className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{t('বংশলতিকা প্রোফাইল', 'Lineage Profile')}</div>
                              <div className="text-[11px] text-orange-300/60 font-normal truncate">{t('বংশতালিকায় আমার পারিবারিক তথ্য', 'My family branch in tree')}</div>
                            </div>
                          </Link>
                        )}

                        <Link
                          to="/change-password"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-orange-100 hover:text-yellow-400 hover:bg-orange-800/60 transition-colors group"
                        >
                          <Key className="w-4 h-4 text-stone-400 group-hover:scale-110 transition-transform shrink-0" />
                          <span>{t('পাসওয়ার্ড পরিবর্তন', 'Change Password')}</span>
                        </Link>
                      </div>

                      {/* Logout Action */}
                      <div className="p-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setLogoutModalOpen(true);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-300 hover:text-red-100 hover:bg-red-900/40 transition-colors group cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                          <span>{t('লগআউট করুন', 'Sign Out / Logout')}</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    /* ── Logged Out Content ── */
                    <>
                      {/* Guest Banner */}
                      <div className="p-4 bg-gradient-to-br from-orange-900/90 to-orange-950 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-900 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0 shadow-inner">
                          <UserCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-serif font-bold text-sm text-yellow-400">
                            {t('অতিথি অ্যাকাউন্ট', 'Guest Account')}
                          </p>
                          <p className="text-[11px] text-orange-200/70">
                            {t('লগইন করুন বা নতুন অ্যাকাউন্ট চালু করুন', 'Sign in or activate account')}
                          </p>
                        </div>
                      </div>

                      {/* Options List */}
                      <div className="p-2 space-y-1.5">
                        {/* Login Button */}
                        <Link
                          to="/user-auth"
                          state={{ mode: 'login' }}
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-orange-900/40 hover:bg-orange-800/80 text-white font-bold text-sm transition-all duration-200 hover:text-yellow-400 border border-orange-800/60 hover:border-yellow-400/40 group active:scale-95 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-orange-800 flex items-center justify-center text-yellow-400 group-hover:bg-yellow-500 group-hover:text-orange-950 transition-colors shrink-0">
                            <UserCircle className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-sm">{t('লগইন করুন', 'Sign In / Login')}</div>
                            <div className="text-[11px] text-orange-300/70 font-normal">{t('ইমেইল বা মোবাইল দিয়ে প্রবেশ', 'Sign in with Mobile or Email')}</div>
                          </div>
                        </Link>

                        {/* Active Account Button */}
                        <Link
                          to="/user-auth"
                          state={{ mode: 'register' }}
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-gradient-to-r from-red-900/60 to-red-800/50 hover:from-red-800 hover:to-red-700 text-white font-bold text-sm transition-all duration-200 border border-red-700/60 hover:border-red-500 shadow-md group active:scale-95 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-700 flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0 shadow-sm">
                            <Shield className="w-4 h-4 text-yellow-300" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-sm text-yellow-300 group-hover:text-yellow-200">{t('অ্যাকাউন্ট চালু করুন', 'Active Account')}</div>
                            <div className="text-[11px] text-orange-200/80 font-normal">{t('বংশতালিকা থেকে আবেদন পাঠান', 'Claim profile & request access')}</div>
                          </div>
                        </Link>

                        {/* Check Status */}
                        <Link
                          to="/user-auth"
                          state={{ mode: 'check' }}
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-orange-800/40 text-orange-200/90 font-medium text-xs transition-colors hover:text-yellow-400"
                        >
                          <HelpCircle className="w-4 h-4 text-orange-400 shrink-0" />
                          <span>{t('আবেদনের অবস্থা ও পাসওয়ার্ড সেট', 'Check Status & Set Password')}</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
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
