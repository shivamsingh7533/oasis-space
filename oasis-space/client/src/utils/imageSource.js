// Image enhancement & fallback helpers.
// wsrv.nl cannot fetch some hosts (Google-owned CDNs block hotlinking/proxying),
// so those are loaded raw and only fall back on error.

const PROXY_HOSTILE = ['gstatic.com', 'googleusercontent.com', 'ytimg.com', 'twimg.com'];

export const FALLBACK_IMAGE = 'https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_1280.jpg';

const hostOf = (url) => (url.match(/^https?:\/\/([^/]+)/) || [])[1] || '';

export const shouldProxy = (url) => {
  if (!url || !String(url).startsWith('http')) return false;
  const host = hostOf(String(url)).toLowerCase();
  return !PROXY_HOSTILE.some((h) => host === h || host.endsWith('.' + h));
};

export const enhanceImageUrl = (url, w = 600) => {
  const text = String(url || '');
  if (!text || text.startsWith('data:') || !shouldProxy(text)) return text || null;
  return `https://wsrv.nl/?url=${encodeURIComponent(text)}&output=webp&w=${w}&q=80`;
};

// Staged loading: 0 = enhanced (proxy/raw), 1 = original raw, 2 = generic fallback.
export const imageSourceFor = (url, stage = 0, w = 600) => {
  if (!url) return FALLBACK_IMAGE;
  if (stage === 0) return enhanceImageUrl(url, w) || FALLBACK_IMAGE;
  if (stage === 1) return shouldProxy(url) ? url : FALLBACK_IMAGE;
  return FALLBACK_IMAGE;
};