import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const { t, formatNumber } = useLanguage();
  const year = formatNumber(new Date().getFullYear());

  return (
    <footer className="bg-footer text-orange-100 py-4 mt-auto">
      <div className="container mx-auto px-4 text-center opacity-60 text-xs">
        &copy; {year} বাড়ৈ বংশের ইতিবৃত্ত. {t('সর্বস্বত্ব সংরক্ষিত।', 'All rights reserved.')}
      </div>
    </footer>
  );
};

export default Footer;
