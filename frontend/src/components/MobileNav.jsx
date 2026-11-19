import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon, Map, Search, Calendar, LayoutGrid, BookOpen, Sparkles, Users,
  Heart, UsersRound, Star, HelpCircle, Trash2, Smartphone, Info, Phone, LogOut,
  LogIn, UserPlus, ChevronRight, LayoutDashboard, Shield, Key, User, Languages, X,
  Sun, Moon, MonitorSmartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { usePWA } from '../context/PWAContext';
import AboutUsModal from './AboutUsModal';
import ContactUsModal from './ContactUsModal';
import LogoutModal from './LogoutModal';

/**
 * App-style navigation for phones (< md):
 *  - a fixed bottom tab bar with the five most used destinations
 *  - a "More" bottom sheet holding every other page plus account & settings
 */
const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const { t, isBn, setLanguage, formatName } = useLanguage();
  const { isInstalled, promptInstall } = usePWA();
  const { theme, setTheme, isDark } = useTheme();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(null);

  // Close the sheet whenever the route changes
  useEffect(() => { setSheetOpen(false); }, [location.pathname]);

  // Lock page scroll while the sheet is open
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  const isActive = (to) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to));

  const tabs = [
    { to: '/', label: t('হোম', 'Home'), icon: HomeIcon },
    { to: '/explorer', label: t('বংশতালিকা', 'Lineage'), icon: Map },
    { to: '/directory', label: t('খুঁজুন', 'Search'), icon: Search, primary: true },
    { to: '/board', label: t('বিজ্ঞপ্তি', 'Notices'), icon: Calendar },
  ];

  const moreLinks = [
    { to: '/history', label: t('ঐতিহ্য', 'Heritage'), icon: BookOpen, tint: 'bg-amber-100 text-amber-800' },
    { to: '/sammelan', label: t('সম্মেলন', 'Sammelan'), icon: Sparkles, tint: 'bg-orange-100 text-orange-800' },
    { to: '/relation', label: t('সম্পর্ক নির্ণয়', 'Relation'), icon: Users, tint: 'bg-rose-100 text-rose-800' },
    { to: '/spouses', label: t('সহধর্মিণী', 'Spouses'), icon: Heart, tint: 'bg-pink-100 text-pink-800' },
    { to: '/committee', label: t('কমিটি', 'Committee'), icon: UsersRound, tint: 'bg-yellow-100 text-yellow-800' },
    { to: '/eminent', label: t('বিশিষ্টজন', 'Eminent'), icon: Star, tint: 'bg-amber-100 text-amber-800' },
    { to: '/help', label: t('সহায়তা', 'Help Desk'), icon: HelpCircle, tint: 'bg-red-100 text-red-800' },
    ...(isAdmin ? [{ to: '/recycle-bin', label: t('রিসাইকেল বিন', 'Recycle Bin'), icon: Trash2, tint: 'bg-stone-200 text-stone-700' }] : []),
  ];

  const moreActive = !tabs.some((tab) => isActive(tab.to));
  const userName = formatName(user) || '';

  // Swipe-down-to-close for the sheet
  const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchMove = (e) => {
    if (touchStartY.current === null) return;
    setDragY(Math.max(0, e.touches[0].clientY - touchStartY.current));
  };
  const onTouchEnd = () => {
    if (dragY > 90) setSheetOpen(false);
    setDragY(0);
    touchStartY.current = null;
  };

  const handleLogout = () => {
    logout();
    setLogoutOpen(false);
    setSheetOpen(false);
    if (location.pathname.startsWith('/dashboard')) navigate('/');
  };

  const Row = ({ icon: Icon, label, sub, onClick, to, state, danger }) => {
    const content = (
      <>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-800'}`}>
          <Icon className="w-[18px] h-[18px]" />
        </span>
        <span className="flex-1 min-w-0 text-left">
          <span className={`block text-sm font-semibold truncate ${danger ? 'text-red-700' : 'text-stone-800'}`}>{label}</span>
          {sub && <span className="block text-[11px] text-stone-400 truncate">{sub}</span>}
        </span>
        {!danger && <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />}
      </>
    );
    const cls = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl active:bg-orange-50 transition-colors';
    return to
      ? <Link to={to} state={state} className={cls}>{content}</Link>
      : <button type="button" onClick={onClick} className={cls}>{content}</button>;
  };

  return (
    <>
      {/* ── Bottom tab bar ── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-t border-orange-100 shadow-[0_-4px_24px_-8px_rgba(154,52,18,0.18)] pb-safe"
        aria-label={t('প্রধান নেভিগেশন', 'Main navigation')}
      >
        <div className="grid grid-cols-5 h-16 px-1">
          {tabs.map(({ to, label, icon: Icon, primary }) => {
            const active = isActive(to);
            if (primary) {
              return (
                <Link key={to} to={to} className="flex flex-col items-center justify-center select-none" aria-label={label}>
                  <span className={`-mt-6 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/25 ring-4 ring-white transition-transform active:scale-90 ${active ? 'bg-gradient-to-br from-orange-600 to-red-800' : 'bg-gradient-to-br from-orange-700 to-orange-900'}`}>
                    <Icon className="w-6 h-6 text-yellow-300" strokeWidth={2.4} />
                  </span>
                  <span className={`mt-0.5 text-[10.5px] font-bold ${active ? 'text-orange-800' : 'text-stone-500'}`}>{label}</span>
                </Link>
              );
            }
            return (
              <Link key={to} to={to} className="relative flex flex-col items-center justify-center gap-0.5 select-none active:scale-95 transition-transform" aria-current={active ? 'page' : undefined}>
                <span className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors duration-200 ${active ? 'bg-orange-100' : ''}`}>
                  <Icon className={`w-[21px] h-[21px] ${active ? 'text-orange-800' : 'text-stone-500'}`} strokeWidth={active ? 2.4 : 2} />
                </span>
                <span className={`text-[10.5px] leading-none ${active ? 'font-bold text-orange-800' : 'font-medium text-stone-500'}`}>{label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="relative flex flex-col items-center justify-center gap-0.5 select-none active:scale-95 transition-transform"
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
          >
            <span className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors duration-200 ${moreActive || sheetOpen ? 'bg-orange-100' : ''}`}>
              <LayoutGrid className={`w-[21px] h-[21px] ${moreActive || sheetOpen ? 'text-orange-800' : 'text-stone-500'}`} strokeWidth={moreActive ? 2.4 : 2} />
            </span>
            <span className={`text-[10.5px] leading-none ${moreActive || sheetOpen ? 'font-bold text-orange-800' : 'font-medium text-stone-500'}`}>{t('আরও', 'More')}</span>
          </button>
        </div>
      </nav>

      {/* ── "More" bottom sheet ── */}
      <div
        className={`lg:hidden fixed inset-0 z-[80] bg-stone-950/50 backdrop-blur-[2px] transition-opacity duration-300 ${sheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSheetOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('আরও', 'More')}
        className={`lg:hidden fixed inset-x-0 bottom-0 z-[90] bg-background rounded-t-[28px] shadow-2xl max-h-[88vh] flex flex-col ${dragY ? '' : 'transition-transform duration-300 ease-out'} ${sheetOpen ? '' : 'translate-y-full'}`}
        style={sheetOpen && dragY ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        <div className="pt-2.5 pb-1 flex flex-col items-center shrink-0" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <span className="w-10 h-1.5 rounded-full bg-stone-300" />
          <div className="w-full flex items-center justify-between px-5 pt-2">
            <h2 className="text-lg font-serif font-bold text-stone-900">{t('আরও', 'More')}</h2>
            <button type="button" onClick={() => setSheetOpen(false)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 active:scale-90" aria-label={t('বন্ধ করুন', 'Close')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto overscroll-contain px-4 pb-safe-6 space-y-4">
          {/* Account card */}
          {user ? (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-orange-800 to-red-900 text-white shadow-md">
              {user.profile_image_url ? (
                <img src={user.profile_image_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400 shrink-0" />
              ) : (
                <span className="w-12 h-12 rounded-full bg-yellow-400 text-orange-950 font-black text-lg flex items-center justify-center shrink-0">
                  {(userName || 'U').charAt(0).toUpperCase()}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-serif font-bold text-yellow-300 truncate">{userName || t('সদস্য', 'Member')}</p>
                <p className="text-[11px] text-orange-100/80 truncate">{user.email || user.mobile_number || ''}</p>
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider">
                  <Shield className="w-2.5 h-2.5" />{isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Member'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-800 to-red-900 text-white shadow-md">
              <p className="font-serif font-bold text-yellow-300">{t('স্বাগতম!', 'Welcome!')}</p>
              <p className="text-xs text-orange-100/80 mt-0.5">{t('লগইন করুন বা আপনার অ্যাকাউন্ট চালু করুন', 'Sign in or activate your account')}</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Link to="/user-auth" state={{ mode: 'login' }} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-yellow-400 text-orange-950 text-sm font-bold active:scale-95 transition-transform">
                  <LogIn className="w-4 h-4" />{t('লগইন', 'Login')}
                </Link>
                <Link to="/user-auth" state={{ mode: 'register' }} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/15 border border-white/25 text-sm font-bold active:scale-95 transition-transform">
                  <UserPlus className="w-4 h-4" />{t('অ্যাকাউন্ট চালু', 'Activate')}
                </Link>
              </div>
            </div>
          )}

          {/* Page grid */}
          <section>
            <h3 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 font-sans">{t('কমিউনিটি', 'Community')}</h3>
            <div className="grid grid-cols-4 gap-2">
              {moreLinks.map(({ to, label, icon: Icon, tint }) => (
                <Link key={to} to={to} className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border transition-colors active:scale-95 ${isActive(to) ? 'bg-orange-50 border-orange-200' : 'bg-white border-stone-100'}`}>
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] font-semibold text-stone-700 text-center leading-tight line-clamp-2">{label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Account actions */}
          {user && (
            <section className="bg-white rounded-2xl border border-stone-100 p-1">
              {isSuperAdmin && <Row to="/dashboard/superadmin" icon={LayoutDashboard} label={t('সুপার এডমিন ড্যাশবোর্ড', 'SuperAdmin Dashboard')} />}
              {isAdmin && !isSuperAdmin && <Row to="/dashboard/admin" icon={LayoutDashboard} label={t('এডমিন ড্যাশবোর্ড', 'Admin Dashboard')} />}
              {isAdmin && <Row to="/admin" icon={Shield} label={t('তথ্য ব্যবস্থাপনা প্যানেল', 'Data Management Panel')} />}
              {!isAdmin && <Row to="/dashboard/user" icon={LayoutDashboard} label={t('আমার ড্যাশবোর্ড', 'My Dashboard')} />}
              {user.member_id && <Row to={`/member/${user.member_id}`} icon={User} label={t('আমার বংশলতিকা প্রোফাইল', 'My Lineage Profile')} />}
              <Row to="/change-password" icon={Key} label={t('পাসওয়ার্ড পরিবর্তন', 'Change Password')} />
            </section>
          )}

          {/* Settings */}
          <section className="bg-white rounded-2xl border border-stone-100 p-1">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-50 text-orange-800 shrink-0">
                <Languages className="w-[18px] h-[18px]" />
              </span>
              <span className="flex-1 text-sm font-semibold text-stone-800">{t('ভাষা', 'Language')}</span>
              <div className="flex bg-stone-100 rounded-full p-0.5 text-xs font-bold">
                <button type="button" onClick={() => setLanguage('bn')} className={`px-3 py-1.5 rounded-full transition-colors ${isBn ? 'bg-orange-800 text-white shadow-sm' : 'text-stone-500'}`}>বাংলা</button>
                <button type="button" onClick={() => setLanguage('en')} className={`px-3 py-1.5 rounded-full transition-colors ${!isBn ? 'bg-orange-800 text-white shadow-sm' : 'text-stone-500'}`}>EN</button>
              </div>
            </div>
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-50 text-orange-800 shrink-0">
                  {isDark ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
                </span>
                <span className="flex-1 text-sm font-semibold text-stone-800">{t('থিম', 'Theme')}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-stone-100 rounded-2xl p-1 text-xs font-bold">
                {[
                  { id: 'light', label: t('দিন', 'Light'), icon: Sun },
                  { id: 'dark', label: t('রাত', 'Dark'), icon: Moon },
                  { id: 'system', label: t('ফোনের মতো', 'System'), icon: MonitorSmartphone },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTheme(id)}
                    aria-pressed={theme === id}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-colors ${theme === id ? 'bg-orange-800 text-white shadow-sm' : 'text-stone-500'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />{label}
                  </button>
                ))}
              </div>
            </div>
            {!isInstalled && (
              <Row icon={Smartphone} label={t('অ্যাপ ইনস্টল করুন', 'Install App')} sub={t('হোম স্ক্রিনে আইকন যুক্ত করুন', 'Add to your home screen')} onClick={() => { setSheetOpen(false); promptInstall(); }} />
            )}
            <Row icon={Info} label={t('আমাদের সম্পর্কে', 'About Us')} onClick={() => setAboutOpen(true)} />
            <Row icon={Phone} label={t('যোগাযোগ', 'Contact Us')} onClick={() => setContactOpen(true)} />
            {user && <Row icon={LogOut} label={t('লগআউট', 'Logout')} danger onClick={() => setLogoutOpen(true)} />}
          </section>

          <p className="text-center text-[11px] text-stone-400 pt-1">
            © {new Date().getFullYear()} {t('বাড়ৈ বংশের ইতিবৃত্ত', 'The Barai Lineage')}
          </p>
        </div>
      </div>

      <AboutUsModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ContactUsModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
      <LogoutModal isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} onConfirm={handleLogout} />
    </>
  );
};

export default MobileNav;
