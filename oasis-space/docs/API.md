# OasisSpace — API Reference

Base URL:
- Dev: `http://localhost:3000/api` (client proxies `/api` through Vite)
- Prod: `https://oasis-space.onrender.com/api` (reached via Vercel rewrite `/api/*`

→ same-origin `/api/...` works everywhere in the SPA).

## Conventions
- All requests/responses are JSON unless noted (`/api/seo/*` returns raw XML/text, `respond-seller` returns HTML).
- Auth: JWT in httpOnly cookie `access_token`, set on sign-in/signup/google. Middleware `verifyToken` requires `purpose: 'session'`.
- Errors: `{ "success": false, "statusCode": <n>, "message": "<safe message>" }`.
- Listings: **rent** is created `available` (free, publishes instantly); **sale** is created as a `pending` draft and a paid `listing_fee` order publishes it to `available`.
- Rate limits (per endpoint, applied once each): `authLimiter` (auth), `chatLimiter` (chat), `globalLimiter` (rest), `contactLimiter` (`/api/user/contact*`).

## Error codes
401 no/expired session · 403 invalid/job-scoped token or insufficient role · 400 validation/business rule · 500 server (generic message; details logged server-side).

## Auth — `/api/auth`
| Method | Path | Auth | Body / Notes |
|--------|------|:----:|--------------|
| POST | `/signup` | — | `{ username, email, password }` — creates unverified user, sends OTP email |
| POST | `/verify-email` | — | `{ email, otp }` → marks verified; sends welcome email |
| POST | `/signin` | — | `{ email, password }` — requires `isVerified` |
| POST | `/google` | — | Firebase Google credential; creates/merges user, random password if new |
| POST | `/forgot-password` | — | `{ email }` — sends OTP for reset |
| POST | `/reset-password` | — | `{ email, otp, password }` — resets when OTP valid/unexpired |
| GET | `/signout` | — | Clears `access_token` cookie |

## Listings — `/api/listing`
| Method | Path | Auth | Notes |
|--------|------|:----:|-------|
| POST | `/create` | ✅ | Allowlisted fields only; `status` set server-side (`rent → available`, `sale → pending`); never trusts `userRef/status/featured/type` from body |
| GET | `/get` | — | Public search. Query: `searchTerm, type, offer, sort, order, limit, startIndex, ...filters`. Returns `{ listings, total, hasMore }` and **excludes** `sold/rented/pending` |
| GET | `/get/:id` | — | Public; returns any listing incl. pending (drafts are not discoverable via search) |
| POST | `/update/:id` | ✅ | Owner or admin; seller allowlist excludes `featured/status/type/userRef` |
| DELETE | `/delete/:id` | ✅ | Owner or admin |
| POST | `/feature/:id` | ✅ | Admin only — toggle featured |
| POST | `/status/:id` | ✅ | Owner or admin; `{ status: available\|sold\|rented }`. `pending → any non-pending` requires a successful `listing_fee` order (skipped when listing type is rent/free) |
| GET | `/admin-listings` | ✅ | Admin: `{ listings, total }` incl. drafts |
| POST | `/generate-ai` | ✅ | `{ name, address, ... }` → Gemini description |

## Users — `/api/user`
| Method | Path | Auth | Notes |
|--------|------|:----:|-------|
| POST | `/update/:id` | ✅ | Allowlist: `username, email, avatar, mobile, password`; never `$set` empty password |
| DELETE | `/delete/:id` | ✅ | Removes user + associated data |
| GET | `/listings/:id` | ✅ | User's listings |
| POST | `/save/:id` | ✅ | Toggle wishlist |
| GET | `/saved` | ✅ | Saved listings, excludes `pending` — plain array |
| GET | `/dashboard/:id` | ✅ | Seller stats (see WORKFLOW) |
| GET | `/getusers` | ✅ | Admin: user array (password/otp excluded by `select`) |
| POST | `/request-seller/:id` | ✅ | `sellerStatus → pending` |
| POST | `/verify-seller/:id` | ✅ | Admin: `{ status: regular\|pending\|approved\|rejected }`; emails + push |
| GET | `/respond-seller/:token` | — | Magic-link (approve/reject) → HTML page |
| POST | `/contact` | 🚦 | Public, contact-limit; emails landlord |
| POST | `/contact-us` | 🚦 | Public, contact-limit; email to support |
| GET | `/:id` | — | Public profile (allowlisted fields) — keep last, after `/saved` |

## Orders — `/api/order`
| Method | Path | Auth | Notes |
|--------|------|:----:|-------|
| POST | `/create` | ✅ | `{ listingId }` — listing must be `pending` (never a rent/free listing); server computes fee (§ fee rule), creates Razorpay order; returns `{ orderId, amount, ... }` |
| POST | `/verify` | ✅ | `{ listing_id, orderId, paymentId, signature }`; validates signature + amount (`order.amount/100 === getListingFee`); **idempotent**; publishes listing; creates order doc |
| GET | `/history` | ✅ | `{ orders, total }` (reverse chronological) |
| GET | `/admin` | ✅ | Admin stats: `feesCollected, feesCount, bookingsValue, bookingsCount` (status `success` only) |
| POST | `/cancel/:id` | ✅ | Own booking, `status === 'success' && type === 'booking'`. `listing_fee` orders are **rejected (400)** — no online refund |
| DELETE | `/delete/:id` | ✅ | Remove from own history (server deletes the record) |

### Listing-fee rule (single source of truth: `server/utils/fees.js`)
| Type | Fee (INR) | Published |
|------|----------:|-----------|
| `rent` | **FREE (₹0)** | instantly on create (`status: 'available'`) |
| `sale` | ₹5,100 | after payment; starts as `pending` draft |

## Chat — `/api/chat`
| Method | Path | Auth | Notes |
|--------|------|:----:|-------|
| POST | `/ask` | 🚦 | `{ prompt, history }` → `{ reply }`. Queries live `status: 'available'` listings, uses Groq LLaMA. Spam-limited. |

## Notifications — `/api/notification`
| Method | Path | Auth | Notes |
|--------|------|:----:|-------|
| GET | `/` | ✅ | Own notifications |
| POST | `/read` | ✅ | Mark read |
| DELETE | `/clear` | ✅ | Clear all |

## Push — `/api/push`
| Method | Path | Auth | Notes |
|--------|------|:----:|-------|
| GET | `/vapidPublicKey` | — | `{ publicKey }`; needs `VAPID_*` else error |
| POST | `/subscribe` | ✅ | Body: `{ endpoint, keys:{p256dh,auth}, userRef }` |
| POST | `/unsubscribe` | ✅ | Remove by endpoint |

## SEO / LLMO — `/api/seo` (raw text/XML, crawlable: `Allow: /api/seo/` overrides `Disallow: /api/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/sitemap.xml` | Full sitemap: core pages + every public listing with image |
| GET | `/llms-full.txt` | Markdown index of public listings (name/location/type/status/price) |

## Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/ping` | `{ message: "pong" }` |
| GET | `/` | `{ message, status, env }` |