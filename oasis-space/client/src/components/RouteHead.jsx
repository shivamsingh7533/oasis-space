import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE_NAME, SITE_URL, AUTHOR, DEFAULT_DESCRIPTION, fullTitle, absoluteUrl } from '../seo/site';
import { routeFor, canonicalPath } from '../seo/routes';
import { upsertJsonLd, resetJsonLd } from '../seo/jsonLd';
import { upsertMeta, ogProperty, setCanonical } from '../seo/head';

export default function RouteHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    const { config, noindex } = routeFor(pathname);
    const title = fullTitle(config.title);
    const description = config.description || DEFAULT_DESCRIPTION;
    const canonical = canonicalPath(pathname);
    const image = absoluteUrl('/logo.png');

    document.title = title;

    upsertMeta('description', description);
    upsertMeta('author', AUTHOR);
    upsertMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1');

    setCanonical(canonical);

    ogProperty('og:site_name', SITE_NAME);
    ogProperty('og:title', title);
    ogProperty('og:description', description);
    ogProperty('og:url', canonical);
    ogProperty('og:type', 'website');
    ogProperty('og:image', image);

    upsertMeta('twitter:card', 'summary_large_image');
    upsertMeta('twitter:title', title);
    upsertMeta('twitter:description', description);
    upsertMeta('twitter:image', image);

    // Structured data for this route (FAQPage etc.)
    resetJsonLd('route-');
    (config.jsonLd || []).forEach((item, i) => upsertJsonLd(`route-${i}`, item));

    return () => {
      resetJsonLd('route-');
    };
  }, [pathname]);

  return null;
}

export { SITE_URL, SITE_NAME };