---
title: 'Epic 9: E-commerce Funnel Tracking & Meta Pixel Integration'
type: 'feature'
created: '2026-10-19'
status: 'done'
route: 'dispatch'
baseline_commit: 'HEAD'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Prana Market currently has no instrumentation for user page visits, catalog interactions, cart events, or WhatsApp lead clicks, and deploying tracking without an active Meta Pixel account could break client execution if not guarded.

**Approach:** Implement a typed, decoupled Meta Pixel tracking client with graceful degradation (silent mock mode when `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` is absent), route-level pageview tracking in Next.js App Router, and instrument key funnel events (`ViewContent`, `AddToCart`, `InitiateCheckout`, and `WhatsAppContactClick`).

## Boundaries & Constraints

**Always:**
- Gracefully degrade: If `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` is absent, blank, or placeholder, tracking functions must execute safely as no-ops (logging only in development) without throwing runtime errors or blocking page execution.
- Adhere to standard Meta Pixel event names (`PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`) and custom event `WhatsAppContactClick`.
- Explicitly pass currency `'COP'` on all monetary payloads and ensure amounts are formatted as numbers.
- Load Meta Pixel script with `afterInteractive` strategy via Next.js `Script` to protect Core Web Vitals and LCP.

**Never:**
- Never hardcode the Pixel ID in source code.
- Never crash the application or fail checkout if `window.fbq` is unavailable or blocked by ad blockers.
- Never duplicate pageview events on initial load or re-renders.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Missing Pixel ID | `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` undefined | Script is not injected; tracking calls log in dev and no-op in prod | No runtime errors thrown; app functions normally |
| Valid Pixel ID | `NEXT_PUBLIC_FACEBOOK_PIXEL_ID="123456789"` | Script is injected `afterInteractive`; `fbq('track', 'PageView')` dispatched on route changes | If script blocked by browser extension, helper catches error silently |
| PDP View | Shopper opens `/product/12` | `fbq('track', 'ViewContent')` fired with product id, name, category, and price in COP | Ignores missing optional fields |
| Add to Cart | User clicks "Añadir al Carrito" | `fbq('track', 'AddToCart')` fired with item id, name, price COP, quantity | No-op if item payload is invalid |
| Checkout Start | User clicks checkout in Cart drawer | `fbq('track', 'InitiateCheckout')` fired with cart total, item count, currency `'COP'` | Handles empty cart gracefully |
| WhatsApp Click | User clicks floating WhatsApp button | `fbq('trackCustom', 'WhatsAppContactClick')` fired with URL origin | Does not block external link opening |

</frozen-after-approval>

## Code Map

- `frontend/src/utils/analytics.ts` -- Central analytics client with typed helpers (`trackPageView`, `trackViewContent`, `trackAddToCart`, `trackInitiateCheckout`, `trackWhatsAppClick`), window typing, and mock fallback.
- `frontend/src/components/MetaPixel.tsx` -- Client component managing script injection (`afterInteractive`) and route change `PageView` dispatching via `usePathname` and `useSearchParams`.
- `frontend/src/app/layout.tsx` -- Mounts `<MetaPixel />` inside root layout body.
- `frontend/src/app/product/[id]/page.tsx` -- Dispatches `trackViewContent` when product loads, and `trackAddToCart` when product is added to cart.
- `frontend/src/components/Cart.tsx` -- Dispatches `trackInitiateCheckout` when user initiates checkout transition.
- `frontend/src/components/FloatingWhatsApp.tsx` -- Dispatches `trackWhatsAppClick` when WhatsApp chat CTA is triggered.
- `frontend/scripts/verify-analytics.js` -- Node.js automated verification script asserting analytics event contracts, mock behavior, and environment handling.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/utils/analytics.ts` -- Create typed Meta Pixel wrapper with mock fallback and event helpers (`PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `WhatsAppContactClick`) -- Provides resilient analytics interface.
- [x] `frontend/src/components/MetaPixel.tsx` -- Create client component with Next.js `Script` and route change listener -- Automates script mounting and pageview tracking.
- [x] `frontend/src/app/layout.tsx` -- Mount `<MetaPixel />` within `RootLayout` -- Ensures tracking is active across the entire storefront.
- [x] `frontend/src/app/product/[id]/page.tsx` -- Instrument `trackViewContent` on fetch completion and `trackAddToCart` on add CTA -- Captures PDP engagement.
- [x] `frontend/src/components/Cart.tsx` -- Instrument `trackInitiateCheckout` when customer selects payment or enters checkout flow -- Tracks funnel progression.
- [x] `frontend/src/components/FloatingWhatsApp.tsx` -- Instrument `trackWhatsAppClick` on WhatsApp launch -- Tracks customer service conversion intent.
- [x] `frontend/scripts/verify-analytics.js` -- Add automated test script verifying tracking functions, event schema, and fallback resilience -- Validates code correctness.

**Acceptance Criteria:**
- Given `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` is set or unset, when the app boots, then no exceptions are thrown and tracking methods operate safely.
- Given a product detail page renders, when product details load, then `ViewContent` is tracked with correct COP price and SKU.
- Given a customer adds an item or proceeds to checkout, then `AddToCart` and `InitiateCheckout` events are fired with correct payloads.
- Given a customer clicks WhatsApp, then `WhatsAppContactClick` is fired without delaying WhatsApp redirect.

## Implementation Notes

- Implemented typed Meta Pixel analytics module at `frontend/src/utils/analytics.ts` with `isPixelConfigured` safety check and mock logger in development mode.
- Created `frontend/src/components/MetaPixel.tsx` wrapping route tracking in React `<Suspense>` and mounting official Meta Pixel script `afterInteractive` with noscript image fallback.
- Mounted `<MetaPixel />` into `frontend/src/app/layout.tsx` root layout body.
- Instrumented PDP (`frontend/src/app/product/[id]/page.tsx`) with `trackViewContent` upon product load and `trackAddToCart` upon adding to bag.
- Instrumented Cart drawer (`frontend/src/components/Cart.tsx`) with `trackInitiateCheckout` on payment method selection and `trackAddToCart` on item quantity increase.
- Instrumented `frontend/src/components/FloatingWhatsApp.tsx` with `trackWhatsAppClick` sending origin context and current URL.
- Added and executed automated test script `frontend/scripts/verify-analytics.js` verifying all matrix edge cases, payload attributes, and ad-blocker resilience.
- Documented `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` in `frontend/.env.example`.

## Spec Change Log

## Review Triage Log

| Finding / Item | Verdict | Evidence / Disposition |
|----------------|---------|------------------------|
| Unconfigured Pixel ID execution | `false` | Verified: `isPixelConfigured` safely returns false and dispatches to mock log without throwing errors or network requests |
| Non-blocking WhatsApp CTA | `false` | Verified: `trackWhatsAppClick` runs synchronously before window.open without delaying navigation |
| Suspense wrapper around useSearchParams | `false` | Verified: `PixelRouteChangeTracker` is wrapped in React `<Suspense fallback={null}>` avoiding Next.js deopt |
| Currency & Price formatting | `false` | Verified: all monetary values are numeric and explicitly flagged as `'COP'` |

## Verification

**Commands:**
- `node frontend/scripts/verify-analytics.js` -- expected: All analytics assertions pass with 0 exit code.
- `npm run lint` (in `frontend/`) -- expected: ESLint passes without errors.
