import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import InstallAppBanner from './InstallAppBanner';
import InstallAppModal from './InstallAppModal';

const Layout = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  // App-like behaviour: start every screen at the top
  const section = location.pathname.split('/')[1] || 'home';
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [section]);

  return (
    <div className="flex flex-col min-h-screen min-h-dvh bg-background font-sans text-stone">
      <Header />
      <main
        key={location.pathname.split('/')[1] || 'home'}
        className={`flex-grow animate-screen-in pb-24 lg:pb-0 ${!isHome ? 'container mx-auto px-3 sm:px-4 py-4 sm:py-8' : ''}`}
      >
        {children}
      </main>
      {/* Website footer on laptop/desktop; phones and tablets use the bottom tab bar + "More" sheet */}
      <div className="hidden lg:block">
        <Footer />
      </div>
      <MobileNav />
      <InstallAppBanner />
      <InstallAppModal />
    </div>
  );
};

export default Layout;
