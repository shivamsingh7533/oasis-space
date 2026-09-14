# OasisSpace — Edge Cases & Guardrails

Documented behaviours when the happy path breaks. Each item maps to a code guard.

## Payments & listing fees
- **Fee bypass**: `updateListingStatus` blocks `pending → any non-pending status` unless a successful `{ type: 'listing_fee', status: 'success' }` order exists for that listing (owner or admin). Rent is free (`getListingFee('rent') === 0`) so the guard is skipped for rent listings. Only `order.verify` publishes (sale).
- **Amount spoofing**: `order.create` ignores client amounts — server computes `getListingFee(type)` from `server/utils/fees.js` (rent FREE / ₹5,100 sale). `order.verify` re-checks `rzpOrder.amount/100 === fee`.
- **Rent can't be paid**: `order.create` returns 400 `'Rent listings publish free — no payment required.'` when a rent draft reaches it — no ₹0 Razorpay order can be minted.
- **Double verify / duplicate payment**: `paymentId` and `orderId` are unique+sparse. If a payment was already verified, verify returns `"Payment already verified."` (idempotent) instead of double-publishing or duplicating.
- **Wrong/expired order**: `order.create` requires the listing to still be `pending`; stale/foreign listings → 400.
- **Invalid Razorpay signature**: verify rejects with 400; no order doc, listing stays draft.
- **Cancelled booking ≠ listing fee**: `cancelOrder` only allows `status==='success' && type==='booking'`. Listing-fee orders return 400 — no refund path exists yet (documented, not implemented).
- **History deletion**: `deleteOrder` removes the record from the payer's history only; it does not unpublish or refund.

## Listings
- **Draft rejection**: `status:'pending'` is now in the mongoose enum — without it, saving a draft threw a `ValidationError`.
- **Whitelist on create/update**: never trusts raw `req.body`. `create` sets `status` server-side (`rent → available`, `sale → pending`) and `userRef` from the session; sellers cannot self-set `featured`, `status`, `type`, `userRef`.
- **Validation**: `regularPrice ≥ 50` and `discountPrice < regularPrice` enforced client-side (Create/Update) and that discount must be a valid number on update.
- **Mandatory image**: `CreateListing` requires ≥ 1 photo before it lets you proceed to payment.
- **Status transitions**: `available → sold/rented` (owner/admin); `sold/rented` are excluded from public search; `featured` stays toggleable by admin only.
- **Public drafts**: `/listing/:id` is public and will render a pending draft if the URL is known — accepted (drafts are not discoverable through `/listing/get`).

## Auth & users
- **Google users have no password / mobile**: password optional in schema; `mobile` optional; `updateUser` never `$set`s password to an empty string (allowlist + truthy check).
- **Forgot password**: OTP-based (`/api/auth/reset-password`) with `otpExpires`; legacy `/api/auth/reset-password/:id/:token` route removed (dead).
- **JWT scope**: cookie tokens are `purpose: 'session'`; seller magic-link tokens (`purpose: 'seller'`) are rejected by `verifyToken` (403).
- **Unverified sign-in**: blocked until `isVerified`.
- **Secrets**: `password`, `otp`, `otpExpires` are `select:false`; admin user list uses `select('-otp -otpExpires')`.
- **Rate limits**: `authLimiter` on `/api/auth`, `chatLimiter` on `/api/chat`, `contactLimiter` on `/public contact*` — brute-force/OTP-spam and AI-cost spikes are bounded.

## AI chatbot
- **Tool-calling safety**: `chatTools.js` clamps/validates every tool arg; `search_listings` always filters `status: 'available'`, never fee drafts/sold/rented. The system prompt forbids inventing listings — the model only speaks from tool output.
- **Unknown tool / bad JSON**: `runTool` returns `{ error }` and unknown tools → the loop feeds it back to the model; no crash, no DB write.
- **No match**: search returns `[]` → model (by rule) gives the polite "maaf kijiye boss" no-listing reply in Hinglish.
- **Groq rate limit (429)**: responded with a friendly `200` Hinglish "thoda ruk kar poochhiye" message, not a 500 (free-tier ~30 rpm / ~1k day caps).
- **Model removed / no access (`model_not_found`)**: walks `CHAT_MODEL` → `CHAT_FALLBACK_MODELS` chain automatically (e.g. `qwen/qwen3.8-27b` → `qwen/qwen3.6-27b`). Keep both list-worthy on the Groq account.
- **History injection**: client history is sanitized to `user`/`assistant` roles and truncated; assistant's data rules can't be overridden by a user message.
- **Token/cost cap**: prompt capped at 1000 chars, history 6 msgs, `max_tokens: 350`, tool results `≤8` listings — per-message Groq cost stays tiny.

## Infra & integration
- **Mongo down**: `connectDB()` retries every 5 s (never silently serves without DB).
- **Missing VAPID keys**: `webpush.setVapidDetails` skipped with a warning; `/api/push/vapidPublicKey` errors; the browser prompt degrades gracefully (dismiss).
- **Missing Supabase key**: `supabase.js` warns and uploads fail with a clear message instead of a silent crash.

## Web security (hardening)
- **Login brute force**: 5 failed password attempts inside a 15-min window lock that account for 15 min (per-account in-memory guard); every failed attempt also sleeps ~1 s. Unknown emails return a generic `401 Invalid email or password` (no enumeration). Lock is 429 with remaining minutes; `authLimiter` still caps per-IP on top.
- **Security headers (Vercel SPA)**: `Content-Security-Policy` (script: self + Razorpay checkout; img/connect allowlists Supabase, wsrv.nl, Leaflet tiles, Firebase, Pixabay fallbacks, currency API; `frame-src` Razorpay + Firebase auth; no `unsafe-inline` scripts), `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Referrer-Policy`, HSTS, Permissions-Policy.
- **Server headers (helmet)**: `nosniff`, `Referrer-Policy`, `Cross-Origin-Opener-Policy: same-origin-allow-popups` (keeps the Google OAuth popup working), `Cross-Origin-Resource-Policy: same-origin`, HSTS in production. CSP deliberately lives on the Vercel frontend, not the API.
- **CSP pitfall**: no inline `<script>` in `index.html` (the PWA `beforeinstallprompt` hook lives in `Header.jsx`); JSON-LD stays inlined (`application/ld+json` is data, not blocked by CSP).
- **Unknown routes**: catch-all `*` → styled 404 page so arbitrary URLs never render a blank screen.
- **Stale bundle after deploy**: Vite asset hashes change per build; Vercel's SPA catch-all then answers missing `/assets/*.js` with `index.html` (MIME `text/html`), which is a fatal module-parse error. `main.jsx` listens for `vite:preloadError` and reloads once (anti-loop) to grab the fresh bundle. In the browser UI this shows a single brief blank flash.
- **Image proxy (wsrv.nl) host limits**: wsrv.nl cannot fetch Google/Twitter-owned CDNs (`gstatic.com`, `googleusercontent.com`, `ytimg.com`, `twimg.com`) — the browser reports `net::ERR_FAILED`. Those hosts are loaded **raw** (no proxy) and staged-chained: enhanced → raw original → generic fallback image. CSP `img-src` includes `*.gstatic.com`/`*.ytimg.com` for the raw fallback.
- **Image failure**: `ListingItem` & gallery fall back to a Pixabay CDN placeholder; proxy `wsrv.nl` used for optimization, skipped for `data:` URIs.
- **CORS**: configured origins + any `*.vercel.app`; `Cross-Origin-Opener-Policy` header set for Google auth popup; `trust proxy` on for cookies behind forwarders.
- **Currency conversion**: `formatPrice(price, target, rates)` degrades to INR formatting when `rates` are missing or the currency is INR (~ the app is INR-primary; WhatsApp share + EMI stay ₹).
- **Contact spam**: landlord/support contact are public but `contactLimiter`-bounded and never double-counted.

## SEO / crawlers
- `/api/seo/*` returns raw XML/text; `robots.txt` `Allow: /api/seo/` (longest-prefix wins) so LLM bots can still reach `llms-full.txt` despite `Disallow: /api/`.
- Private/account routes return `noindex` meta; `robots.txt` disallows them too.
- Non-home paths are client-rendered — crawlers that don't execute JS still see the static `sitemap.xml` URL set.