import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import InstallAppBanner from './InstallAppBanner';
import InstallAppModal from './InstallAppModal';

const Layout = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-stone">
      <Header />
      <main className={`flex-grow ${!isHome ? 'container mx-auto px-4 py-8' : ''}`}>
        {children}
      </main>
      <Footer />
      <InstallAppBanner />
      <InstallAppModal />
    </div>
  );
};

export default Layout;
