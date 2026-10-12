import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Dynamic SEO & Open Graph meta tag manager for React SPA pages
 */
const SEO = ({
  title,
  description,
  keywords,
  image = 'https://baraibangsho.vercel.app/pwa-512x512.png',
  canonicalPath
}) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Page Title
    const baseTitle = 'বাড়ৈ বংশের ইতিবৃত্ত | Barai Bangsho Heritage';
    document.title = title ? `${title} | ${baseTitle}` : baseTitle;

    // 2. Canonical URL
    const canonicalUrl = `https://baraibangsho.vercel.app${canonicalPath || location.pathname}`;
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', canonicalUrl);

    // 3. Helper to update or create meta tags
    const updateMetaTag = (selector, attribute, attrValue, content) => {
      if (!content) return;
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, attrValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Meta Description
    const metaDesc = description || '৮+ প্রজন্মের পারিবারিক ঐতিহ্য, রক্তের বন্ধন, বংশলতিকা এবং সম্মেলনের ইতিহাস সংরক্ষণ প্ল্যাটফর্ম।';
    updateMetaTag('meta[name="description"]', 'name', 'description', metaDesc);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', metaDesc);
    updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', metaDesc);

    // OG Title & Twitter Title
    const ogTitle = title ? `${title} | বাড়ৈ বংশের ইতিবৃত্ত` : baseTitle;
    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', ogTitle);
    updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', ogTitle);

    // OG URL
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    updateMetaTag('meta[name="twitter:url"]', 'name', 'twitter:url', canonicalUrl);

    // Image
    if (image) {
      updateMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
      updateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);
    }

    // Keywords
    if (keywords) {
      updateMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
    }

    // Scroll to top on route change for enhanced UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [title, description, keywords, image, canonicalPath, location.pathname]);

  return null;
};

export default SEO;
