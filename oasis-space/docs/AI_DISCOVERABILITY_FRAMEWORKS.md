# OasisSpace — AI Discovery & SEO Frameworks

How the site is indexed by Google, Bing, ChatGPT, Perplexity, Gemini and other answer engines.

## Frameworks covered
| Framework | What it means | Where it lives in this repo |
|-----------|---------------|------------------------------|
| **SEO** | Classic indexability + rankings | `sitemap.xml`, `robots.txt`, unique title/description/canonical per route, `noindex` on private routes |
| **AEO** | Being the direct answer in featured snippets / AI answers | FAQPage JSON-LD, answer-style meta descriptions, natural language H1s, `max-snippet:-1`, `max-image-preview:large` |
| **GEO** | Being cited/attributed by generative search | Semantic HTML (`<main>`, real `<h1>`), clean OpenGraph, Organization + WebSite + SearchAction JSON-LD, `inLanguage: en-IN` |
| **LLMO** | Bare-markdown reading by LLM crawlers | `llms.txt` at root + live `llms-full.txt` index of every listing |
| **AISEO** | Content structured for AI search crawlers (GPTBot, PerplexityBot, …) | `Allow: /api/seo/` in robots (not blanket-blocked), JSON-LD on all public pages |
| **E-E-A-T** | Experience, Expertise, Authoritativeness, Trust | Consistent author identity, real about/contact, real fees, verified-seller model, one canonical domain |

## Files map
```
client/public/robots.txt                              # allow engine bots; disallow account routes
client/public/sitemap.xml                             # static core sitemap (6 pages)
client/public/llms.txt                                # llmstxt.org v1 summary + links
client/index.html                                     # base title/desc/OG + WebSite & Organization JSON-LD
client/src/seo/site.js                                # SITE_URL, author identity, title builder
client/src/seo/routes.js                              # per-route SEO config + FAQPage schema
client/src/seo/head.js                                # meta/OG/canonical helpers (SSR-free head writer)
client/src/seo/jsonLd.js                              # JSON-LD injection helpers
client/src/components/RouteHead.jsx                   # applies route SEO on navigation
client/src/pages/Listing.jsx                          # per-property title/meta/canonical + RealEstateListing
server/controllers/seo.controller.js                  # dynamic /api/seo/* (live DB data)
server/routes/seo.route.js
```

## JSON-LD schema inventory
1. **WebSite** (+ `SearchAction` → `/search?searchTerm={search_term_string}`) — index.html
2. **Organization** (name, url, logo, `founder` Person with name/jobTitle, `sameAs`) — index.html
3. **FAQPage** (`mainEntity` questions mirroring `/faq`) — route config, `/faq`
4. **RealEstateListing** (name, address, geo, number of rooms/baths, `Offer` with `priceCurrency: INR`, availability from `status`) — injected by `/listing/:id` after load

## Canonical & engines
- Domain: **`https://oasis-space.vercel.app`** (matches GSC property, README, cookies/CNAME).
- `robots.txt` `Allow: /api/seo/` (longest-prefix beats `Disallow: /api/`) so LLM bots reach `llms-full.txt` while JSON APIs stay un-crawled.
- Letter meta: `index, follow, max-image-preview:large, max-snippet:-1`.
- Private/account routes (`/profile`, `/dashboard`, `/settings`, `/order-history`, `/saved-listings`, `/seller-dashboard`, auth pages, `/create-listing`, `/update-listing/*`) → `noindex`.

## Verification & testing checklist
- [ ] `https://oasis-space.vercel.app/robots.txt` loads; sitemap line points to `/sitemap.xml`
- [ ] `https://oasis-space.vercel.app/sitemap.xml` shows 6 core URLs
- [ ] `https://oasis-space.vercel.app/llms.txt` renders markdown; `llms-full.txt` lists live listings
- [ ] Google: GSC → URL-prefix `https://oasis-space.vercel.app/` verified (HTML file + meta) → submit `sitemap.xml`
- [ ] Rich Results test: `/faq` → FAQ rich result; `/listing/:id` → RealEstateListing
- [ ] Bing: import from GSC; submit `sitemap.xml`
- [ ] Manual LLM check — Paste `llms.txt` and `/faq` content into ChatGPT/Perplexity and confirm it answers "what does OasisSpace charge to list a property?" with "rent listings are free, ₹5,100 for sale".
- [ ] Open Graph checker: share URL → correct title/description/logo card.

## Keeping in sync
- Fee pricing appears in 3 places — match them when you change it: `server/utils/fees.js` (compute) · `client/src/utils/fees.js` (display) · `/faq` + `/terms` copy (+ FAQ JSON-LD in `client/src/seo/routes.js`). Today: rent is FREE, sale ₹5,100. `server/controllers/seo.controller.js` derives its llms fee line from `getListingFee()` — don't hardcode it there.
- Route config in `client/src/seo/routes.js` mirrors `App.jsx` — add new public pages there too.
- GitHub Actions/cron can later ping `/api/seo/llms-full.txt` freshness; today it's generated per request (max-age 1 h cache headers).
- If the domain ever changes, update `SITE_URL` in `client/src/seo/site.js`, `index.html` canonical/OG, both `public/*.xml|txt` files, and `SITE_URL` env on the backend in one change.