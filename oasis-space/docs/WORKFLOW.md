# OasisSpace — Workflows

End-to-end journeys and state machines.

## 1. Listing fee → publish (sale paid flow; rent free)
```
Seller: Register(email+OTP) -> Verify -> Request Seller (sellerStatus: pending)
Admin:  Approve (magic link / dashboard) -> sellerStatus: approved
Seller: /create-listing (form + ≥1 photo + validation)
        -> POST /api/listing/create
             rent : status = 'available'   (FREE, live instantly — no pay screen)
             sale : status = 'pending'
Sale only:
        -> Payment screen: fee = getListingFee('sale')  ₹5,100
        -> RazorpayBtn onSuccess              -> POST /api/order/verify
             -> signature + amount checked, idempotent
             -> Order { type: 'listing_fee', status: 'success' }
             -> Listing.status -> available
        -> Home/Search now show the property
Legacy rent drafts (created before rent became free): dashboard shows a
"Publish Free" button → POST /api/listing/status/:id {status:'available'}
(fee-guard is skipped for rent).
"Pay later" keeps a SALE listing as pending draft (never public) until paid.
```
State machine: `pending → available → sold / rented` (never directly `sold` from `pending` without a paid fee).

## 2. Buyer journey
```
Browse (Home carousels, Recent Offers, Search w/ filters+sort)
 → /search?searchTerm=&type=&offer=&sort=&order=&startIndex=...   (hasMore pagination)
 → /listing/:id  (gallery, map, EMI, price in chosen currency)
    Actions: Save to wishlist  · WhatsApp share  · Contact landlord (verified sellers only)
AI assistant: chat "2BHK in Mumbai under ₹20k" → live DB query via Groq.
```
Wishlist (`/api/user/save/:id`) toggles, persisted in Redux; `/saved-listings` shows saved (excluding pending).

## 3. Existing booking orders (legacy `booking` type)
Buyers with legacy `booking` successes can view them in `/order-history`, cancel (`status==='success' && type==='booking'`), or delete from history. A cancelled booking:
- sets the order `status: 'cancelled'`, notifies the landlord by email; the property is not auto-flipped (status updates are manual via `/status/:id`).

## 4. Order lifecycle
```
createOrder (pending) -> Razorpay checkout
   -> success  -> recording (success)   [listing published for listing_fee]
   -> failure  -> failed
   -> cancel route  -> cancelled  (success bookings only; fee orders rejected)
Any retry of /verify after success is idempotent.
```

## 5. Seller workflows
- My Properties (from `/api/user/listings/:id`): sale draft → "Pending fee" badge + "Pay ₹5,100 & Publish"; legacy rent draft → "Publish Free"; live → Edit / Mark Sold / Mark Rented (owner allowed via `/status/:id`).
- Publish from dashboard: same fee modal → RazorpayBtn → re-fetch dashboard.
- Featured: only admins; toggle on the property row/`/api/listing/feature/:id`.

## 6. Admin console (`/dashboard`, role `admin`)
- **CRM tab**: list users, `verify-seller` (approve/reject), delete.
- **Listings tab**: admin-listings incl. drafts, change status (fee-guarded), feature toggle.
- **Finance**: `/api/order/admin` real numbers — Listing Fees Collected, Bookings Value, Payments count/value. No fabricated estimates.

## 7. Notifications & push
- Server pushes into `notifications` on seller approval/rejection, booking status, etc.
- Client `NotificationPrompt` → `/api/push/subscribe` (VAPID) registers the device; PWA `custom-sw.js` listens for push events; header bell lists `/api/notification/`, mark read, clear.

## 8. Support contacts
- Landlord contact: public `/api/user/contact` (spam-limited) → email to owner (verified sellers).
- Contact us: `/api/user/contact-us` → support email; footer contact form.

## 9. Content / support pages
`/about`, `/faq`, `/terms`, `/privacy` are public, SEO-indexed (unique title/meta/FAQPage schema). No auth. Terms/FAQ publish the current fee pricing — update `server/utils/fees.js` AND the page copy together (single source of truth note).