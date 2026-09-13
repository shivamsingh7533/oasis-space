const SEARCH_ROUTE_KEY = 'data-seo-jsonld';

function find(id) {
  return document.querySelector(`script[${SEARCH_ROUTE_KEY}="${id}"]`);
}

function create(id, data) {
  const el = document.createElement('script');
  el.type = 'application/ld+json';
  el.setAttribute(SEARCH_ROUTE_KEY, id);
  el.textContent = JSON.stringify(data);
  el.dataset.seoJsonld = id;
  document.head.appendChild(el);
  return el;
}

export function upsertJsonLd(id, data) {
  if (!document || typeof document === 'undefined') return;
  const existing = find(id);
  if (existing) {
    existing.textContent = JSON.stringify(typeof data === 'function' ? data() : data);
    return;
  }
  create(id, typeof data === 'function' ? data() : data);
}

export function removeJsonLd(id) {
  if (!document || typeof document === 'undefined') return;
  find(id)?.remove();
}

export function resetJsonLd(prefix) {
  if (!document || typeof document === 'undefined') return;
  document.querySelectorAll(`script[${SEARCH_ROUTE_KEY}^="${prefix}"]`).forEach((el) => el.remove());
}