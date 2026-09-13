import Listing from '../models/listing.model.js';
import { getListingFee } from '../utils/fees.js';

const SITE_URL = (process.env.SITE_URL || process.env.CLIENT_URL || 'https://oasis-space.vercel.app')
  .split(',')[0]
  .trim()
  .replace(/\/+$/, '');

const PUBLIC_STATUS = ['available', 'sold', 'rented'];

const CORE_PAGES = [
  { path: '/', label: 'Home', changeFreq: 'daily', priority: '1.0' },
  { path: '/search', label: 'Search properties', changeFreq: 'daily', priority: '0.9' },
  { path: '/about', label: 'About', changeFreq: 'monthly', priority: '0.6' },
  { path: '/faq', label: 'FAQ', changeFreq: 'monthly', priority: '0.6' },
  { path: '/privacy', label: 'Privacy Policy', changeFreq: 'yearly', priority: '0.3' },
  { path: '/terms', label: 'Terms of Service', changeFreq: 'yearly', priority: '0.3' },
];

function xmlEscape(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const getSitemap = async (req, res, next) => {
  try {
    const listings = await Listing.find({ status: { $in: PUBLIC_STATUS } })
      .select('address createdAt imageUrls')
      .lean()
      .exec();

    const today = new Date().toISOString().slice(0, 10);

    const urls = CORE_PAGES.map((p) => {
      const image = p.path === '/' ? `    <image:image>\n      <image:loc>${SITE_URL}/logo.png</image:loc>\n    </image:image>\n` : '';
      return `  <url>\n    <loc>${SITE_URL}${p.path === '/' ? '/' : p.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changeFreq}</changefreq>\n    <priority>${p.priority}</priority>\n${image}  </url>`;
    });

    const listingUrls = listings.map((l) => {
      const img = l.imageUrls?.[0] ? `    <image:image>\n      <image:loc>${xmlEscape(l.imageUrls[0])}</image:loc>\n    </image:image>\n` : '';
      const lastmod = l.createdAt ? new Date(l.createdAt).toISOString().slice(0, 10) : today;
      return `  <url>\n    <loc>${SITE_URL}/listing/${l._id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n${img}  </url>`;
    });

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
      ...urls,
      ...listingUrls,
      '</urlset>',
    ].join('\n');

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(xml);
  } catch (err) {
    return next(err);
  }
};

export const getLlmsFull = async (req, res, next) => {
  try {
    const listings = await Listing.find({ status: { $in: PUBLIC_STATUS } })
      .select('name address type regularPrice discountPrice offer bedrooms bathrooms status createdAt')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
      .exec();

    const core = CORE_PAGES.map((p) => `- [${p.label}](${SITE_URL}${p.path === '/' ? '/' : p.path})`).join('\n');

    const lines = [];
    lines.push('# OasisSpace — Full Index');
    lines.push('');
    lines.push(`> Machine-readable index of every public property on ${SITE_URL}. Rows: ${listings.length}.`);
    lines.push('');
    lines.push('## Core pages');
    lines.push('');
    lines.push(core);
    lines.push('');
    lines.push('## Public listings');
    lines.push('');
    lines.push('| Name | Location | Type | Status | Price (INR) |');
    lines.push('| --- | --- | --- | --- | --- |');
    if (listings.length === 0) {
      lines.push('| _No public listings right now._ |');
    } else {
      for (const l of listings) {
        const price = l.offer ? l.discountPrice : l.regularPrice;
        const type = l.type === 'rent' ? 'Rent' : 'Sale';
        const status = l.status;
        lines.push(`| ${l.name ? l.name.replace(/\|/g, '\\|').slice(0, 60) : 'Property'} | ${l.address ? l.address.replace(/\|/g, '\\|').slice(0, 60) : '-'} | ${type} | ${status} | ₹${(price || 0).toLocaleString('en-IN')} |`);
      }
    }
    lines.push('');
    lines.push(`- Listing page URL pattern: ${SITE_URL}/listing/:id`);
    lines.push(`- Listing fee: FREE (rent) / ₹${getListingFee('sale').toLocaleString('en-IN')} (sale) — see ${SITE_URL}/faq`);

    const text = lines.join('\n');
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(text);
  } catch (err) {
    return next(err);
  }
};