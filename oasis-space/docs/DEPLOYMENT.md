# OasisSpace — Deployment

Production today: **Vercel** (frontend) + **Render** `oasis-space.onrender.com` (API) + MongoDB Atlas.

## 1. Prerequisites
- Node.js ≥ 18, npm.
- Accounts: MongoDB Atlas, Razorpay, Brevo (email), Firebase (Google auth), Supabase (image storage), Groq + Google AI (gen features).
- Optional: web-push VAPID pair.

## 2. Backend env — `server/.env` (never commit; copy `server/.env.example`)
```ini
MONGO=mongodb+srv://<user>:<pass>@<cluster>/oasis
JWT_SECRET=<long random string>
NODE_ENV=production
CLIENT_URL=https://oasis-space.vercel.app
SITE_URL=https://oasis-space.vercel.app   # canonical base for /api/seo/* URLs
SERVER_URL=https://oasis-space.onrender.com
PORT=3000
BREVO_API_KEY=...
SENDER_EMAIL=admin@oasisspace.example
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
GROQ_API_KEY=...
GEMINI_API_KEY=...
# CHAT_MODEL=qwen/qwen3.8-27b           # optional; tool-calling model for the assistant
# CHAT_FALLBACK_MODELS=qwen/qwen3.6-27b # optional; comma-separated fallbacks
# VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT  (optional; required for web push)
```
`SITE_URL` matters: sitemap/llms emit this base. In development fall back to
`CLIENT_URL` then the fixed prod URL.

## 3. Frontend env — `client/.env` (never commit; copy `client/.env.example`)
```ini
VITE_FIREBASE_API_KEY=...
VITE_AUTH_DOMAIN=...
VITE_PROJECT_ID=...
VITE_STORAGE_BUCKET=...
VITE_MESSAGING_SENDER_ID=...
VITE_APP_ID=...
VITE_SUPABASE_URL=https://<proj>.supabase.co
VITE_SUPABASE_KEY=<anon key>          # public by design
VITE_RAZORPAY_KEY_ID=<key id>         # public by design
```
The SPA calls relative `/api/*` — no `VITE_API_URL` used.

## 4. Vercel (frontend)
- Root: `client/`, build `npm run build`, output `dist`.
- `client/vercel.json` already configures:
  - `rewrites`: `/api/(.*)` → `https://oasis-space.onrender.com/api/$1`; `/(.*)` → `/index.html` (SPA fallback).
  - `headers`: `Cross-Origin-Opener-Policy: unsafe-none` (needed for Google auth popup), `Cross-Origin-Embedder-Policy: unsafe-none`, `Access-Control-Allow-Origin: *`.
- Static SEO payload ships automatically from `client/public`: `robots.txt`, `sitemap.xml`, `llms.txt`, `manifest.json`, `google-site-verification` HTML.

## 5. Render / Railway (API)
- Build: `npm install` · Start: `node index.js` (`npm start`).
- Node ≥ 18; port from `$PORT`.
- Set all `server/.env` values as environment variables.
- Health check: monitor `https://<api-host>/ping`.
- Render pause/cold-start: first request may be slow (~30–60 s).

## 6. Order + smoke test
1. Deploy backend first (env vars + health `/ping` OK).
2. Deploy frontend to Vercel.
3. Smoke test through the site origin:
   - `https://oasis-space.vercel.app/robots.txt`
   - `https://oasis-space.vercel.app/sitemap.xml`
   - `https://oasis-space.vercel.app/llms.txt`
   - `https://oasis-space.vercel.app/api/seo/sitemap.xml` (proxy → backend)
   - `https://oasis-space.vercel.app/api/ping`
4. Full fee-flow test: sign up → verify → request seller → approve → create listing (draft) → pay fee (test Razorpay keys) → listing appears on Home/Search.

## 7. Keep secrets clean
- `.gitignore` covers `server/.env`, `client/.env`, `*.env.*` but keeps `.env.example`.
- No hardcoded keys live in the repo (Supabase anon removed from `supabase.js`).
- Rotate keys if ever committed.

## 8. Updating
- Push to `main` → Vercel auto-deploys. Backend deploys on Render only when its repo/build updates or manually via the dashboard.
- SEO content lives in `client/public/*` + `/api/seo/*` (live data) — no rebuild needed to refresh listings URLs beyond normal deploys ((sitemap is generated per request).