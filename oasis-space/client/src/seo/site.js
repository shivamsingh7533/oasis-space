export const SITE_URL = 'https://oasis-space.vercel.app';
export const SITE_NAME = 'OasisSpace';
export const SITE_TAGLINE = 'Buy, Rent & Sell Homes Online in India';

export const AUTHOR_NAME = 'Shivam Singh';
export const AUTHOR_JOB_TITLE = 'Founder & Full-Stack Developer';
export const AUTHOR = `${AUTHOR_NAME} — ${AUTHOR_JOB_TITLE}, ${SITE_NAME}`;

export const DEFAULT_DESCRIPTION =
  'OasisSpace is India\u2019s AI-powered real estate marketplace where you can buy, rent or sell homes, apartments and villas. Search with filters, chat with our AI assistant, compare EMI, and list your property \u2014 Rent is free, Sale pays a one-time \u20B95,100 via Razorpay.';

export const DEFAULT_TITLE = 'Buy, Rent & Sell Homes Online in India | OasisSpace';

export function fullTitle(title) {
  const clean = (title || '').trim();
  if (!clean) return DEFAULT_TITLE;
  if (clean.toLowerCase().includes('oasisspace')) return clean;
  return `${clean} | OasisSpace`;
}

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}