# OasisSpace — Tech Stack

Single repo (`main` branch), two deployables under `client/` and `server/`.

| Layer | Technology | Version | Purpose |
|------:|------------|:-------:|---------|
| UI framework | React | 19.2 | SPA + concurrent rendering |
| Build tool | Vite | 7.2 | Dev server, bundling, code splitting |
| Language (client) | JavaScript (ESM) + JSX | — | — |
| Styling | Tailwind CSS 4 (`@tailwindcss/postcss`) | 4.1 | Utility-first CSS + CSS custom-property theme system |
| State (global) | Redux Toolkit | 2.11 | Auth user, currency/preferences (`redux/user`, `redux/currency`) |
| Persistence | redux-persist | 6.0 | Survive reload |
| Router | react-router-dom | 7.12 | Client routing, lazy routes |
| UI/UX | react-icons | 5.5 | Icons |
| Carousel | Swiper | 12.0 | Listing image gallery |
| Maps | Leaflet + react-leaflet | 1.9 / 5.0 | Property map |
| Charts | Recharts | 3.7 | Admin / seller dashboards |
| Auth (OAuth) | Firebase | 12.8 | Google sign-in |
| Image storage | Supabase JS | 2.90 | Listing image upload buckets |
| Image utils | browser-image-compression | 2.0 | Client-side image resize before upload |
| Forms | react-phone-input-2 | 2.15 | Mobile number input |
| PWA | vite-plugin-pwa | 1.2 | generateSW, web-push, offline shell |
| Proxy (dev) | Vite `server.proxy` | — | `/api` → `http://localhost:3000` |
| Proxy (prod) | `client/vercel.json` rewrites | — | `/api/*` → `https://oasis-space.onrender.com/api/*` |

## Backend

| Layer | Technology | Version | Purpose |
|------:|------------|:-------:|---------|
| Runtime | Node.js | ≥ 18 | — |
| Framework | Express | 4.19 | HTTP API |
| Database | MongoDB via Mongoose | 7.6 | ODM, schemas, indexes |
| Auth | jsonwebtoken + cookie-parser | 9.0 / 1.4 | httpOnly session JWT (`purpose: 'session'`) |
| Password | bcryptjs | 3.0 | Hashing |
| Payments | razorpay | 2.9 | Listing-fee orders, verify, fetch |
| Email / OTP | @getbrevo/brevo | 2.5 | Transactional email (OTP, approvals) |
| AI chat | groq-sdk | 0.37 | LLaMA chat assistant (`/api/chat/ask`) |
| AI description | @google/generative-ai | 0.24 | Generate listing descriptions |
| Push | web-push | 3.6 | VAPID web push |
| Rate limiting | express-rate-limit | 8.3 | Per-endpoint limiters |
| Ops | nodemon (dev) | 3.1 | Dev reload |

## Not used (README only, not installed)
Framer Motion, Google Fonts, React Helmet — do not add docs/steps referencing them.

## Tooling
- ESLint 9 (`npm run lint` in `client/`)
- Production build: `npm run build` (Vite) → `client/dist/` + PWA `sw.js`
- Backend syntax check: `node --check <file>`