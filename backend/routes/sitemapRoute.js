const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { memoryCache } = require('../utils/cache');

router.get('/sitemap.xml', async (req, res) => {
  const cacheKey = 'seo:sitemap_xml';
  const cachedSitemap = memoryCache.get(cacheKey);

  if (cachedSitemap) {
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return res.send(cachedSitemap);
  }

  try {
    const membersRes = await pool.query(
      "SELECT id, updated_at FROM members WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 1000"
    );

    const baseUrl = 'https://baraibangsho.vercel.app';
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: '1.0' },
      { url: '/explorer', changefreq: 'weekly', priority: '0.9' },
      { url: '/relation', changefreq: 'monthly', priority: '0.85' },
      { url: '/history', changefreq: 'monthly', priority: '0.85' },
      { url: '/sammelan', changefreq: 'monthly', priority: '0.8' },
      { url: '/eminent', changefreq: 'monthly', priority: '0.8' },
      { url: '/committee', changefreq: 'monthly', priority: '0.75' },
      { url: '/board', changefreq: 'weekly', priority: '0.75' },
      { url: '/help', changefreq: 'weekly', priority: '0.7' },
      { url: '/directory', changefreq: 'weekly', priority: '0.7' },
      { url: '/spouses', changefreq: 'monthly', priority: '0.65' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic member profiles
    for (const member of membersRes.rows) {
      const lastModDate = member.updated_at
        ? new Date(member.updated_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/member/${member.id}</loc>\n`;
      xml += `    <lastmod>${lastModDate}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    // Cache the XML sitemap in memory for 1 hour (3600 seconds)
    memoryCache.set(cacheKey, xml, 3600);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.send(xml);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
