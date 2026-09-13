# OasisSpace — Architecture

Two deployables in one repo:

```
oasis-space/
├── client/                          # React SPA (deployed on Vercel)
│   ├── public/                      # static: sitemap.xml, robots.txt, llms.txt, manifest, PWA icons, GSC verification
│   ├── src/
│   │   ├── App.jsx                  # Routes, RouteHead, layout (Header/Footer/ChatWidget)
│   │   ├── components/              # Header, Footer, ListingItem, RazorpayBtn, RouteHead, ChatWidget, ...
│   │   ├── pages/                   # one file per route
│   │   ├── redux/                   # user + currency slices, persist
│   │   ├── seo/                     # site.js, routes.js, jsonLd.js, head.js
│   │   ├── supabase.js / firebase.js
│   │   └── utils/                   # fees.js, currencyFormatter.js, compressImage.js
│   └── vercel.json                  # /api/* → onrender backend, SPA fallback, headers
└── server/                          # Express API (deployed on Render/Railway)
    ├── index.js                     # bootstrap, middleware, route mount, error handler, graceful shutdown
    ├── routes/                      # thin routers, one per domain
    ├── controllers/                 # business logic (allowlists, fee flow, idempotency)
    ├── models/                      # Mongoose schemas (5 collections)
    └── utils/                       # fees.js, limiters.js, verifyUser.js, error.js, sendEmail.js
```

## Request flow (production)
```
Browser (SPA) ── /api/foo ──▶ Vercel ──rewrite──▶ Render API ──▶ MongoDB
                     ▲                                        (Razorpay, Brevo, Groq,
                     └──── response JSON/cookies ────────────   Gemii, web-push out)
```
- Dev: Vite `server.proxy` sends `/api` to `http://localhost:3000`.
- Cookies: `httpOnly` JWT `access_token`; CORS allows configured origins + any `*.vercel.app`; `trust proxy = 1`.

## Server boot sequence (`index.js`)
1. Import routes/models/utils, `dotenv.config()`.
2. `webpush.setVapidDetails(...)` if `VAPID_*` present (warns otherwise).
3. `connectDB()` auto-retries every 5 s on failure; runs `syncIndexes()`.
4. App middleware: CORS → `Cross-Origin-Opener-Policy` header → `trust proxy` → JSON body (2 MB) → cookies.
5. Route mount with per-router limiters:
   - `/api/auth` (authLimiter) · `/api/chat` (chatLimiter) · users/listings/orders/notifications/push/seo (globalLimiter).
6. `/ping`, `/`, central error middleware (generic 5xx to client).
7. `app.listen` + graceful shutdown on SIGTERM/SIGINT.

## Backend layering
- **Routes** — path + middleware only.
- **Controllers** — validation, allowlists, business rules, DB, external calls. Never trust `req.body` keys not allowlisted.
- **Models** — schema, enums, `select:false` for `password / otp / otpExpires`, sparse unique indexes.
- **Utils** — `errorHandler`, `verifyToken` (JWT `purpose: 'session'` guard), rate limiters, fee constants, email.

## Key flows
- **Listing fee** `create` → rent publishes instantly (`available`, free); sale starts as `pending` draft → `order.create` (fee from server util) → Razorpay → `order.verify` (signature + amount + idempotency) → listing `available`; a lost verification simply re-runs idempotently.
- **Status machine** `pending → available → sold/rented`; only `order.verify` may leave `pending` for paid (sale) listings — rent (free) is exempt, so legacy rent drafts publish via the status endpoint.
- **Auth** email+OTP signup → verified → sign-in; Google OAuth merge; password reset via OTP (no legacy magic reset URL).

## Frontend layering
- **RouteHead** (mounted once in `App.jsx`) rewrites `document.title`, meta description/robots/canonical/OG/Twitter, and injects route JSON-LD on every navigation.
- **Listing page** enriches head per-property + injects `RealEstateListing` JSON-LD after fetch.
- Lazy-loaded routes (`Suspense` + `Preloader`), vendor code splitting (`react/react-dom`, redux, swiper, recharts), CSS splitting; PWA `generateSW`.

## Production endpoints summary
| What | Where |
|------|-------|
| Website | `https://oasis-space.vercel.app` |
| API | `https://oasis-space.onrender.com` |
| API via site | `https://oasis-space.vercel.app/api/*` |