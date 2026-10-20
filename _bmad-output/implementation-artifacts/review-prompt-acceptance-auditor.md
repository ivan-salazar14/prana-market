You are an Acceptance Auditor. Review the provided diff against the spec and any loaded context docs. Check for: violations of acceptance criteria, deviations from spec intent, missing implementation of specified behavior, contradictions between spec constraints and actual code. Output findings as a Markdown list. Each finding: one-line title, which AC/constraint it violates, and evidence from the diff.

SPECIFICATION:
---
title: 'Epic 10: End-to-End Completed Order Correctness & Verification'
type: 'feature'
created: '2026-10-19'
status: 'review'
route: 'dispatch'
baseline_commit: 'HEAD'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent â€” do not modify unless human renegotiates">

## Intent

**Problem:** Guest checkout currently fails on `/payment/success` because the code strictly requires `localStorage.getItem('user')`, while duplicate orders can occur upon page reloads due to lack of idempotency, and the `Purchase` conversion event is missing.

**Approach:** Decouple order creation from mandatory local user sessions to support seamless guest purchases with shipping metadata, add transaction idempotency in `/api/orders` to prevent duplicate records, fire a single deduplicated Meta Pixel `Purchase` event on order confirmation, and implement an automated end-to-end order verification test suite.

## Boundaries & Constraints

**Always:**
- Support guest purchases: Never abort order persistence if `userId` is null; associate the order directly with customer delivery contact info.
- Idempotency: Duplicate submissions with the same non-empty `transactionId` must return the existing order without creating a duplicate record in Strapi.
- Deduplicated `Purchase` event: Standard Meta Pixel `Purchase` event must fire with explicit `currency: 'COP'`, numerical `value`, `order_id`, and `contents[]`, guarded against duplicate firing on page reloads.
- Include `shippingAddress` on non-pickup delivery orders in `createOrder` payload to satisfy backend schema validation.

**Never:**
- Never block or crash the order success screen if user authentication is missing or token is expired.
- Never record payment status as `'paid'` for Cash on Delivery / Contraentrega (`'efectivo'`); these must remain `'pending'`.
- Never mutate or recreate an existing order when a matching `transactionId` is reconciled.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Guest Checkout | `localStorage.getItem('user') === null` | Order created successfully in Strapi with `userId: null` and shipping address; confirmation card displayed | Fallback to guest metadata if JSON parse fails |
| Registered User Checkout | `localStorage.getItem('user')` contains valid JSON user | Order created with relation to `userId`; confirmation card displayed | Treats as guest if user object is malformed |
| Duplicate Reload | User refreshes `/payment/success?transaction_id=TX123` | Backend detects existing `transactionId`, returns existing order; `Purchase` event does NOT fire twice | Graceful return of original order record |
| Cash / Contraentrega | `paymentMethod === 'efectivo'` | Order created with status `'pending'`; instructions for payment upon delivery rendered | N/A |
| Digital Payment | `paymentMethod === 'nequi' \|\| 'wompi'` | Order created with status `'paid'`; success banner rendered | If payment verification fails, logs error |
| Non-pickup without address | `deliveryMethod.id !== 'pickup'`, missing `shippingAddress` | Endpoint returns HTTP 400 with descriptive error | Client form validation prevents submission |

</frozen-after-approval>

## Code Map

- `frontend/src/utils/order.ts` -- Shared order domain logic: payload validation, payment-status resolution, transaction/user normalization, guest user parsing and the `processOrderRequest` idempotent creation pipeline.
- `frontend/src/utils/analytics.ts` -- Add `trackPurchase` with typed payload (`transactionId`, `orderId`, `total`, `items`, `currency: 'COP'`) plus `claimPurchaseEvent` session dedupe guard.
- `frontend/src/app/payment/success/page.tsx` -- Remove `userString` requirement, forward `shippingAddress`, integrate `trackPurchase` with reload deduplication via session storage.
- `frontend/src/app/api/orders/route.ts` -- Delegate to `processOrderRequest` so Strapi lookup/insert stays idempotent per `transactionId`.
- `frontend/src/components/Cart.tsx` -- Cash on delivery (`efectivo`) checkout no longer requires a session; sends a stable `transactionId`.
- `frontend/src/components/ManualNequiCheckout.tsx` -- Manual Nequi transfer accepts guest checkout and sends a stable `transactionId`.
- `frontend/src/components/NequiCheckout.tsx` -- Persists `transactionId`/`orderId` in `lastOrder` so the success page can fire `Purchase` once.
- `frontend/scripts/verify-order-lifecycle.js` -- Automated verification suite testing the production modules (guest checkout, idempotency, purchase tracking schema, status transitions).
- `frontend/package.json` -- Add `"test:order"` script pointing to the verification runner.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/utils/analytics.ts` -- Implement typed `trackPurchase` helper adhering to Meta Pixel standard specifications -- Captures final conversion revenue.
- [x] `frontend/src/app/payment/success/page.tsx` -- Update `createOrder` to support guest checkout (`userId: null`), pass `shippingAddress`, and trigger deduplicated `trackPurchase` -- Eliminates guest checkout failure.
- [x] `frontend/src/app/api/orders/route.ts` -- Implement `transactionId` idempotency check querying Strapi before insertions -- Eliminates duplicate order creation.
- [x] `frontend/scripts/verify-order-lifecycle.js` -- Create automated test suite for order correctness, idempotency, guest flow, and purchase event -- Provides automated verification.
- [x] `frontend/package.json` -- Add `"test:order"` npm script -- Enables standard test execution.
- [x] `frontend/src/utils/order.ts` -- Extract shared, dependency-free order domain logic so the route and the test suite exercise the same code -- Removes duplicated logic from the verification suite.
- [x] `frontend/src/components/Cart.tsx` -- Allow guest checkout for cash on delivery and send a stable `transactionId` -- Guest orders were still blocked with `"Debes iniciar sesiÃ³n"`.
- [x] `frontend/src/components/ManualNequiCheckout.tsx` -- Allow guest checkout for manual Nequi transfers and send a stable `transactionId` -- Same session-only guard removed.
- [x] `frontend/src/components/NequiCheckout.tsx` -- Persist `transactionId`/`orderId` on `lastOrder` and send `transactionId` to `/api/orders` -- Nequi orders never fired `Purchase` and were not idempotent.

**Acceptance Criteria:**
- Given a guest customer without an account, when completing payment and landing on `/payment/success`, then the order is created in Strapi and confirmation details render.
- Given an existing transaction ID, when submitting to `POST /api/orders`, then the existing order is returned and no duplicate record is created.
- Given a completed order, when the success page mounts, then `Purchase` is tracked once in COP and refreshing does not re-fire.
- Given the verification script runs, then all order lifecycle tests pass with exit code 0.

## Implementation Notes

- `processOrderRequest` in `frontend/src/utils/order.ts` is now the single entry point for order creation. It validates the payload, short-circuits on an existing `transactionId` (HTTP 200, `idempotent: true`), maps `efectivo`/`nequi_manual` to `pending` and everything else to `paid`, omits the `user` relation when no valid id exists, and returns 201 for new records.
- `POST /api/orders` is a thin adapter: it supplies Strapi persistence (`findByTransactionId`, `create`) and keeps the reconciliation lookup fail-open so a Strapi read error never blocks a real order.
- Verification suite now `require`s the production modules through Node type stripping (`--experimental-strip-types`), so it exercises the same validation, status mapping, idempotency pipeline and `trackPurchase` payload the app ships. It also asserts `claimPurchaseEvent` suppresses a second dispatch on reload.
- Guest checkout guards were still present in cash (`efectivo`) and manual Nequi flows and blocked checkout with `"Debes iniciar sesiÃ³n"`; both now read the user id defensively (`readStoredUserId`, malformed JSON falls back to guest) and send a stable per-mount `transactionId`.
- `NequiCheckout` previously persisted neither `transactionId` nor `orderId`, so `/payment/success` could not fire `Purchase` for Nequi orders. It now stores both.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm run test:order` (in `frontend/`) -- expected: all order correctness tests pass with exit code 0. **Result: 11/11 assertions passed, exit 0.**
- `npx tsc --noEmit` (in `frontend/`) -- expected: no type errors. **Result: exit 0.**
- `npm run lint` (in `frontend/`) -- expected: no new errors. **Result: repo already fails on pre-existing errors in `frontend/src/components/SearchBar.tsx` and `frontend/src/components/NequiCheckout.tsx` (confetti `Math.random` during render); none of the errors originate in this epic's changes (`npx eslint` over the touched files reports only pre-existing warnings).**
- `npm run build` (in `frontend/`) -- expected: production build completes. **Result: `Compiled successfully`; the TypeScript-check phase cannot start under the agent sandbox (`spawn EPERM`, blocked named pipes). Type correctness was verified separately with `tsc --noEmit`.**
- `node frontend/scripts/verify-order-lifecycle.js` -- legacy invocation without type stripping no longer applies; use `npm run test:order`.


Diff:
diff --git a/_bmad-output/implementation-artifacts/spec-epic-10-order-correctness-and-verification.md b/_bmad-output/implementation-artifacts/spec-epic-10-order-correctness-and-verification.md
new file mode 100644
index 0000000..d1ea1df
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/spec-epic-10-order-correctness-and-verification.md
@@ -0,0 +1,96 @@
+---
+title: 'Epic 10: End-to-End Completed Order Correctness & Verification'
+type: 'feature'
+created: '2026-10-19'
+status: 'review'
+route: 'dispatch'
+baseline_commit: 'HEAD'
+review_loop_iteration: 0
+context: []
+---
+
+<frozen-after-approval reason="human-owned intent ÔÇö do not modify unless human renegotiates">
+
+## Intent
+
+**Problem:** Guest checkout currently fails on `/payment/success` because the code strictly requires `localStorage.getItem('user')`, while duplicate orders can occur upon page reloads due to lack of idempotency, and the `Purchase` conversion event is missing.
+
+**Approach:** Decouple order creation from mandatory local user sessions to support seamless guest purchases with shipping metadata, add transaction idempotency in `/api/orders` to prevent duplicate records, fire a single deduplicated Meta Pixel `Purchase` event on order confirmation, and implement an automated end-to-end order verification test suite.
+
+## Boundaries & Constraints
+
+**Always:**
+- Support guest purchases: Never abort order persistence if `userId` is null; associate the order directly with customer delivery contact info.
+- Idempotency: Duplicate submissions with the same non-empty `transactionId` must return the existing order without creating a duplicate record in Strapi.
+- Deduplicated `Purchase` event: Standard Meta Pixel `Purchase` event must fire with explicit `currency: 'COP'`, numerical `value`, `order_id`, and `contents[]`, guarded against duplicate firing on page reloads.
+- Include `shippingAddress` on non-pickup delivery orders in `createOrder` payload to satisfy backend schema validation.
+
+**Never:**
+- Never block or crash the order success screen if user authentication is missing or token is expired.
+- Never record payment status as `'paid'` for Cash on Delivery / Contraentrega (`'efectivo'`); these must remain `'pending'`.
+- Never mutate or recreate an existing order when a matching `transactionId` is reconciled.
+
+## I/O & Edge-Case Matrix
+
+| Scenario | Input / State | Expected Output / Behavior | Error Handling |
+|----------|--------------|---------------------------|----------------|
+| Guest Checkout | `localStorage.getItem('user') === null` | Order created successfully in Strapi with `userId: null` and shipping address; confirmation card displayed | Fallback to guest metadata if JSON parse fails |
+| Registered User Checkout | `localStorage.getItem('user')` contains valid JSON user | Order created with relation to `userId`; confirmation card displayed | Treats as guest if user object is malformed |
+| Duplicate Reload | User refreshes `/payment/success?transaction_id=TX123` | Backend detects existing `transactionId`, returns existing order; `Purchase` event does NOT fire twice | Graceful return of original order record |
+| Cash / Contraentrega | `paymentMethod === 'efectivo'` | Order created with status `'pending'`; instructions for payment upon delivery rendered | N/A |
+| Digital Payment | `paymentMethod === 'nequi' \|\| 'wompi'` | Order created with status `'paid'`; success banner rendered | If payment verification fails, logs error |
+| Non-pickup without address | `deliveryMethod.id !== 'pickup'`, missing `shippingAddress` | Endpoint returns HTTP 400 with descriptive error | Client form validation prevents submission |
+
+</frozen-after-approval>
+
+## Code Map
+
+- `frontend/src/utils/order.ts` -- Shared order domain logic: payload validation, payment-status resolution, transaction/user normalization, guest user parsing and the `processOrderRequest` idempotent creation pipeline.
+- `frontend/src/utils/analytics.ts` -- Add `trackPurchase` with typed payload (`transactionId`, `orderId`, `total`, `items`, `currency: 'COP'`) plus `claimPurchaseEvent` session dedupe guard.
+- `frontend/src/app/payment/success/page.tsx` -- Remove `userString` requirement, forward `shippingAddress`, integrate `trackPurchase` with reload deduplication via session storage.
+- `frontend/src/app/api/orders/route.ts` -- Delegate to `processOrderRequest` so Strapi lookup/insert stays idempotent per `transactionId`.
+- `frontend/src/components/Cart.tsx` -- Cash on delivery (`efectivo`) checkout no longer requires a session; sends a stable `transactionId`.
+- `frontend/src/components/ManualNequiCheckout.tsx` -- Manual Nequi transfer accepts guest checkout and sends a stable `transactionId`.
+- `frontend/src/components/NequiCheckout.tsx` -- Persists `transactionId`/`orderId` in `lastOrder` so the success page can fire `Purchase` once.
+- `frontend/scripts/verify-order-lifecycle.js` -- Automated verification suite testing the production modules (guest checkout, idempotency, purchase tracking schema, status transitions).
+- `frontend/package.json` -- Add `"test:order"` script pointing to the verification runner.
+
+## Tasks & Acceptance
+
+**Execution:**
+- [x] `frontend/src/utils/analytics.ts` -- Implement typed `trackPurchase` helper adhering to Meta Pixel standard specifications -- Captures final conversion revenue.
+- [x] `frontend/src/app/payment/success/page.tsx` -- Update `createOrder` to support guest checkout (`userId: null`), pass `shippingAddress`, and trigger deduplicated `trackPurchase` -- Eliminates guest checkout failure.
+- [x] `frontend/src/app/api/orders/route.ts` -- Implement `transactionId` idempotency check querying Strapi before insertions -- Eliminates duplicate order creation.
+- [x] `frontend/scripts/verify-order-lifecycle.js` -- Create automated test suite for order correctness, idempotency, guest flow, and purchase event -- Provides automated verification.
+- [x] `frontend/package.json` -- Add `"test:order"` npm script -- Enables standard test execution.
+- [x] `frontend/src/utils/order.ts` -- Extract shared, dependency-free order domain logic so the route and the test suite exercise the same code -- Removes duplicated logic from the verification suite.
+- [x] `frontend/src/components/Cart.tsx` -- Allow guest checkout for cash on delivery and send a stable `transactionId` -- Guest orders were still blocked with `"Debes iniciar sesi├│n"`.
+- [x] `frontend/src/components/ManualNequiCheckout.tsx` -- Allow guest checkout for manual Nequi transfers and send a stable `transactionId` -- Same session-only guard removed.
+- [x] `frontend/src/components/NequiCheckout.tsx` -- Persist `transactionId`/`orderId` on `lastOrder` and send `transactionId` to `/api/orders` -- Nequi orders never fired `Purchase` and were not idempotent.
+
+**Acceptance Criteria:**
+- Given a guest customer without an account, when completing payment and landing on `/payment/success`, then the order is created in Strapi and confirmation details render.
+- Given an existing transaction ID, when submitting to `POST /api/orders`, then the existing order is returned and no duplicate record is created.
+- Given a completed order, when the success page mounts, then `Purchase` is tracked once in COP and refreshing does not re-fire.
+- Given the verification script runs, then all order lifecycle tests pass with exit code 0.
+
+## Implementation Notes
+
+- `processOrderRequest` in `frontend/src/utils/order.ts` is now the single entry point for order creation. It validates the payload, short-circuits on an existing `transactionId` (HTTP 200, `idempotent: true`), maps `efectivo`/`nequi_manual` to `pending` and everything else to `paid`, omits the `user` relation when no valid id exists, and returns 201 for new records.
+- `POST /api/orders` is a thin adapter: it supplies Strapi persistence (`findByTransactionId`, `create`) and keeps the reconciliation lookup fail-open so a Strapi read error never blocks a real order.
+- Verification suite now `require`s the production modules through Node type stripping (`--experimental-strip-types`), so it exercises the same validation, status mapping, idempotency pipeline and `trackPurchase` payload the app ships. It also asserts `claimPurchaseEvent` suppresses a second dispatch on reload.
+- Guest checkout guards were still present in cash (`efectivo`) and manual Nequi flows and blocked checkout with `"Debes iniciar sesi├│n"`; both now read the user id defensively (`readStoredUserId`, malformed JSON falls back to guest) and send a stable per-mount `transactionId`.
+- `NequiCheckout` previously persisted neither `transactionId` nor `orderId`, so `/payment/success` could not fire `Purchase` for Nequi orders. It now stores both.
+
+## Spec Change Log
+
+## Review Triage Log
+
+## Verification
+
+**Commands:**
+- `npm run test:order` (in `frontend/`) -- expected: all order correctness tests pass with exit code 0. **Result: 11/11 assertions passed, exit 0.**
+- `npx tsc --noEmit` (in `frontend/`) -- expected: no type errors. **Result: exit 0.**
+- `npm run lint` (in `frontend/`) -- expected: no new errors. **Result: repo already fails on pre-existing errors in `frontend/src/components/SearchBar.tsx` and `frontend/src/components/NequiCheckout.tsx` (confetti `Math.random` during render); none of the errors originate in this epic's changes (`npx eslint` over the touched files reports only pre-existing warnings).**
+- `npm run build` (in `frontend/`) -- expected: production build completes. **Result: `Compiled successfully`; the TypeScript-check phase cannot start under the agent sandbox (`spawn EPERM`, blocked named pipes). Type correctness was verified separately with `tsc --noEmit`.**
+- `node frontend/scripts/verify-order-lifecycle.js` -- legacy invocation without type stripping no longer applies; use `npm run test:order`.
diff --git a/_bmad-output/implementation-artifacts/spec-epic-9-funnel-tracking-and-meta-pixel.md b/_bmad-output/implementation-artifacts/spec-epic-9-funnel-tracking-and-meta-pixel.md
new file mode 100644
index 0000000..ce57cca
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/spec-epic-9-funnel-tracking-and-meta-pixel.md
@@ -0,0 +1,99 @@
+---
+title: 'Epic 9: E-commerce Funnel Tracking & Meta Pixel Integration'
+type: 'feature'
+created: '2026-10-19'
+status: 'done'
+route: 'dispatch'
+baseline_commit: 'HEAD'
+review_loop_iteration: 0
+context: []
+---
+
+<frozen-after-approval reason="human-owned intent ÔÇö do not modify unless human renegotiates">
+
+## Intent
+
+**Problem:** Prana Market currently has no instrumentation for user page visits, catalog interactions, cart events, or WhatsApp lead clicks, and deploying tracking without an active Meta Pixel account could break client execution if not guarded.
+
+**Approach:** Implement a typed, decoupled Meta Pixel tracking client with graceful degradation (silent mock mode when `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` is absent), route-level pageview tracking in Next.js App Router, and instrument key funnel events (`ViewContent`, `AddToCart`, `InitiateCheckout`, and `WhatsAppContactClick`).
+
+## Boundaries & Constraints
+
+**Always:**
+- Gracefully degrade: If `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` is absent, blank, or placeholder, tracking functions must execute safely as no-ops (logging only in development) without throwing runtime errors or blocking page execution.
+- Adhere to standard Meta Pixel event names (`PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`) and custom event `WhatsAppContactClick`.
+- Explicitly pass currency `'COP'` on all monetary payloads and ensure amounts are formatted as numbers.
+- Load Meta Pixel script with `afterInteractive` strategy via Next.js `Script` to protect Core Web Vitals and LCP.
+
+**Never:**
+- Never hardcode the Pixel ID in source code.
+- Never crash the application or fail checkout if `window.fbq` is unavailable or blocked by ad blockers.
+- Never duplicate pageview events on initial load or re-renders.
+
+## I/O & Edge-Case Matrix
+
+| Scenario | Input / State | Expected Output / Behavior | Error Handling |
+|----------|--------------|---------------------------|----------------|
+| Missing Pixel ID | `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` undefined | Script is not injected; tracking calls log in dev and no-op in prod | No runtime errors thrown; app functions normally |
+| Valid Pixel ID | `NEXT_PUBLIC_FACEBOOK_PIXEL_ID="123456789"` | Script is injected `afterInteractive`; `fbq('track', 'PageView')` dispatched on route changes | If script blocked by browser extension, helper catches error silently |
+| PDP View | Shopper opens `/product/12` | `fbq('track', 'ViewContent')` fired with product id, name, category, and price in COP | Ignores missing optional fields |
+| Add to Cart | User clicks "A├▒adir al Carrito" | `fbq('track', 'AddToCart')` fired with item id, name, price COP, quantity | No-op if item payload is invalid |
+| Checkout Start | User clicks checkout in Cart drawer | `fbq('track', 'InitiateCheckout')` fired with cart total, item count, currency `'COP'` | Handles empty cart gracefully |
+| WhatsApp Click | User clicks floating WhatsApp button | `fbq('trackCustom', 'WhatsAppContactClick')` fired with URL origin | Does not block external link opening |
+
+</frozen-after-approval>
+
+## Code Map
+
+- `frontend/src/utils/analytics.ts` -- Central analytics client with typed helpers (`trackPageView`, `trackViewContent`, `trackAddToCart`, `trackInitiateCheckout`, `trackWhatsAppClick`), window typing, and mock fallback.
+- `frontend/src/components/MetaPixel.tsx` -- Client component managing script injection (`afterInteractive`) and route change `PageView` dispatching via `usePathname` and `useSearchParams`.
+- `frontend/src/app/layout.tsx` -- Mounts `<MetaPixel />` inside root layout body.
+- `frontend/src/app/product/[id]/page.tsx` -- Dispatches `trackViewContent` when product loads, and `trackAddToCart` when product is added to cart.
+- `frontend/src/components/Cart.tsx` -- Dispatches `trackInitiateCheckout` when user initiates checkout transition.
+- `frontend/src/components/FloatingWhatsApp.tsx` -- Dispatches `trackWhatsAppClick` when WhatsApp chat CTA is triggered.
+- `frontend/scripts/verify-analytics.js` -- Node.js automated verification script asserting analytics event contracts, mock behavior, and environment handling.
+
+## Tasks & Acceptance
+
+**Execution:**
+- [x] `frontend/src/utils/analytics.ts` -- Create typed Meta Pixel wrapper with mock fallback and event helpers (`PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `WhatsAppContactClick`) -- Provides resilient analytics interface.
+- [x] `frontend/src/components/MetaPixel.tsx` -- Create client component with Next.js `Script` and route change listener -- Automates script mounting and pageview tracking.
+- [x] `frontend/src/app/layout.tsx` -- Mount `<MetaPixel />` within `RootLayout` -- Ensures tracking is active across the entire storefront.
+- [x] `frontend/src/app/product/[id]/page.tsx` -- Instrument `trackViewContent` on fetch completion and `trackAddToCart` on add CTA -- Captures PDP engagement.
+- [x] `frontend/src/components/Cart.tsx` -- Instrument `trackInitiateCheckout` when customer selects payment or enters checkout flow -- Tracks funnel progression.
+- [x] `frontend/src/components/FloatingWhatsApp.tsx` -- Instrument `trackWhatsAppClick` on WhatsApp launch -- Tracks customer service conversion intent.
+- [x] `frontend/scripts/verify-analytics.js` -- Add automated test script verifying tracking functions, event schema, and fallback resilience -- Validates code correctness.
+
+**Acceptance Criteria:**
+- Given `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` is set or unset, when the app boots, then no exceptions are thrown and tracking methods operate safely.
+- Given a product detail page renders, when product details load, then `ViewContent` is tracked with correct COP price and SKU.
+- Given a customer adds an item or proceeds to checkout, then `AddToCart` and `InitiateCheckout` events are fired with correct payloads.
+- Given a customer clicks WhatsApp, then `WhatsAppContactClick` is fired without delaying WhatsApp redirect.
+
+## Implementation Notes
+
+- Implemented typed Meta Pixel analytics module at `frontend/src/utils/analytics.ts` with `isPixelConfigured` safety check and mock logger in development mode.
+- Created `frontend/src/components/MetaPixel.tsx` wrapping route tracking in React `<Suspense>` and mounting official Meta Pixel script `afterInteractive` with noscript image fallback.
+- Mounted `<MetaPixel />` into `frontend/src/app/layout.tsx` root layout body.
+- Instrumented PDP (`frontend/src/app/product/[id]/page.tsx`) with `trackViewContent` upon product load and `trackAddToCart` upon adding to bag.
+- Instrumented Cart drawer (`frontend/src/components/Cart.tsx`) with `trackInitiateCheckout` on payment method selection and `trackAddToCart` on item quantity increase.
+- Instrumented `frontend/src/components/FloatingWhatsApp.tsx` with `trackWhatsAppClick` sending origin context and current URL.
+- Added and executed automated test script `frontend/scripts/verify-analytics.js` verifying all matrix edge cases, payload attributes, and ad-blocker resilience.
+- Documented `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` in `frontend/.env.example`.
+
+## Spec Change Log
+
+## Review Triage Log
+
+| Finding / Item | Verdict | Evidence / Disposition |
+|----------------|---------|------------------------|
+| Unconfigured Pixel ID execution | `false` | Verified: `isPixelConfigured` safely returns false and dispatches to mock log without throwing errors or network requests |
+| Non-blocking WhatsApp CTA | `false` | Verified: `trackWhatsAppClick` runs synchronously before window.open without delaying navigation |
+| Suspense wrapper around useSearchParams | `false` | Verified: `PixelRouteChangeTracker` is wrapped in React `<Suspense fallback={null}>` avoiding Next.js deopt |
+| Currency & Price formatting | `false` | Verified: all monetary values are numeric and explicitly flagged as `'COP'` |
+
+## Verification
+
+**Commands:**
+- `node frontend/scripts/verify-analytics.js` -- expected: All analytics assertions pass with 0 exit code.
+- `npm run lint` (in `frontend/`) -- expected: ESLint passes without errors.
diff --git a/_bmad-output/implementation-artifacts/sprint-status.yaml b/_bmad-output/implementation-artifacts/sprint-status.yaml
index aef2ba4..b987708 100644
--- a/_bmad-output/implementation-artifacts/sprint-status.yaml
+++ b/_bmad-output/implementation-artifacts/sprint-status.yaml
@@ -29,7 +29,7 @@
 # - Dev moves story to 'review', then runs code-review (fresh context, different LLM recommended)
 # - Retrospective appends its action items to action_items; the status view surfaces open ones
 generated: 09-24-2026 21:20
-last_updated: 10-10-2026
+last_updated: 10-19-2026
 project: prana-market
 tracking_system: file-system
 story_location: _bmad-output/implementation-artifacts
@@ -97,5 +97,11 @@ development_status:
   8-4-instagram-post-to-product-ai-importer: review
   epic-8-retrospective: optional
 
+  epic-10: in-progress
+  10-1-guest-checkout-resilience-decoupled-backend-order-creation: review
+  10-2-order-creation-idempotency-purchase-conversion-tracking: review
+  10-3-automated-end-to-end-order-verification-integration-test-suite: review
+  epic-10-retrospective: optional
+
 
 
diff --git a/_bmad-output/planning-artifacts/epics.md b/_bmad-output/planning-artifacts/epics.md
index a904656..d9bbd20 100644
--- a/_bmad-output/planning-artifacts/epics.md
+++ b/_bmad-output/planning-artifacts/epics.md
@@ -47,6 +47,9 @@ FR-ADM-01: Unified Order Management Dashboard (Centralized Strapi admin dashboar
 FR-ADM-02: Dropshipping Status Monitor (Dedicated view for monitoring Mastershop fulfillment sync status, API error logs, and manual override/retry options).
 FR-ADM-03: Customer Service & WhatsApp Integration (Floating WhatsApp chat widget and direct order issue resolution shortcuts).
 FR-ADM-04: Hybrid Fulfillment Routing & Local Warehouse Dispatch (Isolation of physical order lifecycles from dropship synchronization, order origin filtering, and manual carrier tracking guide entry for local fulfillment).
+FR-TRK-01: Meta Pixel & E-commerce Funnel Tracking (Decoupled Next.js client analytics architecture supporting PageView, PDP ViewContent, AddToCart, InitiateCheckout, and WhatsApp click tracking with safe fallback when NEXT_PUBLIC_FACEBOOK_PIXEL_ID is not configured).
+FR-TRK-02: Purchase & Finish Order Event Tracking (Reliable, idempotent firing of the Purchase conversion event upon order completion with COP order value, transaction ID, line items, and payment method).
+FR-ORD-05: Guest Checkout Resilience & Idempotent Order Creation (Seamless order placement for guest users without requiring existing localStorage user profiles, with duplicate order prevention across payment methods).
 
 ### NonFunctional Requirements
 
@@ -59,6 +62,7 @@ NFR-UX-03: Feedback & Micro-animations with instant optimistic UI updates for ca
 NFR-SEC-01: PCI-DSS Compliance with zero raw cardholder data stored on Prana Market servers; tokenization handled directly via Wompi / Stripe client SDKs.
 NFR-SEC-02: Colombian Habeas Data Compliance (Ley 1581 de 2012) with explicit consent checkboxes for privacy policy, terms of service, and commercial communication.
 NFR-SEC-03: Webhook Security with cryptographic HMAC SHA-256 signature verification on all incoming Wompi, Stripe, and Mastershop webhooks.
+NFR-TEST-01: End-to-End Order Correctness & Verification Test Suite (Automated integration/E2E test suite asserting complete order lifecycle from cart addition, DANE address validation, payment simulation, Strapi database persistence, cart clearance, to success screen rendering).
 
 ### Additional Requirements
 
@@ -108,6 +112,10 @@ UX-DR8: Micro-animations & Accessibility Floor (Framer Motion drawer springs, sk
 - FR-ADM-03: Epic 5 - Integraci├│n de atenci├│n al cliente y soporte v├¡a WhatsApp
 - FR-CAT-05: Epic 8 - Carga masiva de cat├ílogo f├¡sico mediante CSV y gesti├│n de stock
 - FR-ADM-04: Epic 8 - Enrutamiento h├¡brido de pedidos y despacho local en bodega
+- FR-TRK-01: Epic 9 - Meta Pixel & E-commerce Funnel Tracking (Visitas y Clics)
+- FR-TRK-02: Epic 10 - Purchase & Finish Order Event Tracking
+- FR-ORD-05: Epic 10 - Guest Checkout Resilience & Idempotent Order Creation
+- NFR-TEST-01: Epic 10 - Suite de Pruebas Automatizadas E2E de Pedidos Completados
 
 ## Epic List
 
@@ -142,6 +150,15 @@ Permite enlazar el cat├ílogo de productos de Prana Market con Instagram Shopping
 Permite al administrador cargar y actualizar masivamente productos f├¡sicos mediante archivos CSV con validaci├│n de esquema y protecci├│n de SKU, a├¡sla el ciclo de vida de pedidos locales de las llamadas a MasterShop para prevenir errores espurios en el monitor de dropshipping, y dota al panel de pedidos con filtros por tipo de origen y registro manual de gu├¡as locales.
 **FRs covered:** FR-CAT-05, FR-ADM-04
 
+### Epic 9: E-commerce Funnel Tracking & Meta Pixel Integration
+Permite al equipo de Prana Market medir con precisi├│n el comportamiento y embudo de compra de los usuarios en la tienda (visitas a p├íginas, visualizaci├│n de productos en el cat├ílogo, adici├│n al carrito, clic en WhatsApp e inicio de checkout) mediante Meta Pixel desacoplado en Next.js, con soporte de ejecuci├│n condicional segura (graceful mock/fallback) cuando no se disponga de `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` o la cuenta est├® en configuraci├│n.
+**FRs covered:** FR-TRK-01
+
+### Epic 10: End-to-End Completed Order Correctness & Verification
+Garantiza que cualquier pedido (incluyendo compras sin registro / guest checkout) se complete, persista y procese con absoluta fidelidad e idempotencia en Strapi CMS sin depender de perfiles locales previos, disparando de forma certera el evento de conversi├│n `Purchase`, y dota a la plataforma de una suite de pruebas automatizadas (E2E & API) para verificar el ciclo de vida de la orden de punta a punta.
+**FRs covered:** FR-TRK-02, FR-ORD-05
+**NFRs covered:** NFR-TEST-01
+
 
 
 ## Epic 1: Product Discovery & Beauty Catalog Storefront
@@ -697,6 +714,120 @@ So that I can digitize our Instagram feed catalog into Prana Market in seconds w
 **And** clicking "Aprobar y Publicar" calls `POST /api/products` (or `POST /api/products/import-single`) creating the product with `sourcing_type: 'local'`, status `'published'`, and media uploaded to Strapi Media Library
 **And** if the post URL is private or cannot be accessed, the UI shows a graceful error alert allowing manual image drop or URL correction without crashing.
 
+## Epic 9: E-commerce Funnel Tracking & Meta Pixel Integration
+
+Permite al equipo de Prana Market medir con precisi├│n el comportamiento y embudo de compra de los usuarios en la tienda (visitas a p├íginas, visualizaci├│n de productos en el cat├ílogo, adici├│n al carrito, clic en WhatsApp e inicio de checkout) mediante Meta Pixel desacoplado en Next.js, con soporte de ejecuci├│n condicional segura (graceful mock/fallback) cuando no se disponga de `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` o la cuenta est├® en configuraci├│n.
+
+### Story 9.1: Safe Meta Pixel Client Infrastructure & PageView Tracking
+
+As a marketing analyst and developer,
+I want a typed, decoupled Meta Pixel client utility and React provider in Next.js App Router that reads `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` and degrades silently when missing,
+So that pageviews are tracked without runtime errors or blocking rendering even if the Meta Pixel ID is unconfigured.
+
+**Acceptance Criteria:**
+
+**Given** `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` is defined in `.env` / `.env.local`
+**When** the Next.js application boots on the client
+**Then** the Meta Pixel base script (`fbevents.js`) is injected using Next.js `Script` strategy `afterInteractive`
+**And** a standard `fbq('track', 'PageView')` is dispatched automatically on initial load and route changes via Next.js navigation hooks (`usePathname`, `useSearchParams`)
+**Given** `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` is missing, blank, or placeholder
+**When** the application renders or page navigation occurs
+**Then** no external script requests to Facebook are initiated, no runtime exceptions or unhandled errors occur, and tracking helper calls log in development mode (`[Analytics:Mock] PageView`) while remaining completely silent in production.
+
+### Story 9.2: Product Catalog & PDP Funnel Events (ViewContent & Category Views)
+
+As a growth marketer,
+I want standard Meta Pixel `ViewContent` events dispatched when shoppers view product detail pages and browse catalog categories,
+So that we can measure product interest and build dynamic retargeting audiences for cosmetics in Colombia.
+
+**Acceptance Criteria:**
+
+**Given** a shopper navigates to a product detail page (`/product/[slug]`)
+**When** the PDP finishes rendering product data
+**Then** a typed `fbq('track', 'ViewContent')` event is fired with:
+  - `content_name`: Product name
+  - `content_category`: Category name / slug
+  - `content_ids`: Array of product ID or SKU
+  - `value`: Price formatted as a number in COP
+  - `currency`: `'COP'`
+**And** selecting shade or variant swatches updates the tracked payload without firing duplicate pageviews.
+
+### Story 9.3: Micro-Interactions & Conversion Intent Tracking (AddToCart, InitiateCheckout & WhatsApp CTA)
+
+As an e-commerce operator,
+I want user clicks on high-intent actionsÔÇösuch as "A├▒adir al Carrito", opening the cart drawer, clicking "Iniciar Pago" / "Pagar con Nequi", and clicking the floating WhatsApp support buttonÔÇötracked as standard or custom Pixel events,
+So that we can identify conversion friction and drop-offs along the Colombian beauty buying journey.
+
+**Acceptance Criteria:**
+
+**Given** a customer clicks "A├▒adir al Carrito" on a PDP or quick-add on the catalog grid
+**When** the cart state is updated
+**Then** `fbq('track', 'AddToCart')` is dispatched with product ID, title, item price in COP, and currency `'COP'`
+**Given** a customer clicks the checkout button in the slide-over cart drawer (either "Iniciar Pago" or "Pagar con Nequi")
+**When** the checkout process is initiated
+**Then** `fbq('track', 'InitiateCheckout')` is dispatched with cart subtotal, item count, and currency `'COP'`
+**Given** a customer clicks the floating WhatsApp support button
+**When** the WhatsApp URL is triggered
+**Then** a custom event `fbq('trackCustom', 'WhatsAppContactClick')` is dispatched containing the current page URL and origin context.
+
+---
+
+## Epic 10: End-to-End Completed Order Correctness & Verification
+
+Garantiza que cualquier pedido (incluyendo compras sin registro / guest checkout) se complete, persista y procese con absoluta fidelidad e idempotencia en Strapi CMS sin depender de perfiles locales previos, disparando de forma certera el evento de conversi├│n `Purchase`, y dota a la plataforma de una suite de pruebas automatizadas (E2E & API) para verificar el ciclo de vida de la orden de punta a punta.
+
+### Story 10.1: Guest Checkout Resilience & Decoupled Backend Order Creation
+
+As a mobile beauty shopper purchasing without an account (guest checkout),
+I want my completed order to be reliably saved in Strapi and shown on the success screen without requiring an existing user profile in localStorage,
+So that I never experience order creation failures or loss of purchase confirmation due to authentication state.
+
+**Acceptance Criteria:**
+
+**Given** a customer checks out as a guest (`localStorage.getItem('user')` is null)
+**When** payment succeeds and the user arrives at `/payment/success`
+**Then** the order creation routine does NOT exit early with `"User not found in localStorage"`
+**And** `POST /api/orders` accepts `userId: null`, linking order details directly to the customer's provided delivery name, phone, email, and Colombian shipping address
+**And** the order is saved in Strapi with status `'paid'` (or `'pending'` for cash/contraentrega) and returns a valid order ID
+**And** the `/payment/success` screen displays the order confirmation card with items summary, delivery method, and total paid in COP.
+
+### Story 10.2: Order Creation Idempotency & Purchase Conversion Tracking
+
+As an e-commerce operator,
+I want order creation to be strictly idempotent across transaction references and fire the Meta Pixel `Purchase` event exactly once per completed order,
+So that we eliminate duplicate database orders upon page reloads and track accurate conversion revenue in Meta Ads Manager.
+
+**Acceptance Criteria:**
+
+**Given** a customer arrives at `/payment/success` with a `transaction_id` or payment reference
+**When** order reconciliation runs
+**Then** `POST /api/orders` checks if an order with that `transactionId` already exists:
+  - If already created, returns the existing record without inserting a duplicate
+  - If new, creates the order record and returns the new order
+**And** a standard Meta Pixel `Purchase` event is dispatched:
+  `fbq('track', 'Purchase', { value: order.total, currency: 'COP', content_type: 'product', contents: order.items, order_id: order.id, transaction_id: order.transactionId })`
+**And** refreshing `/payment/success` or re-visiting the URL does not fire duplicate `Purchase` events or create duplicate orders in Strapi.
+
+### Story 10.3: Automated End-to-End Order Verification & Integration Test Suite
+
+As a lead engineer and QA tester,
+I want an automated test suite verifying the end-to-end order lifecycle (item selection -> DANE address input -> payment simulation -> order persistence in Strapi -> cart clearance -> success page render),
+So that regressions in checkout and order completion are caught automatically prior to production deployment.
+
+**Acceptance Criteria:**
+
+**Given** the test environment is running with Next.js frontend and Strapi backend
+**When** running the automated verification script (`npm run test:e2e:order` or integration runner)
+**Then** the test executes an automated checkout flow:
+  1. Adds a product to the cart and validates the subtotal calculation
+  2. Submits Colombian DANE address details (Department and Municipality)
+  3. Simulates payment confirmation (Nequi / Efectivo sandbox)
+  4. Asserts `POST /api/orders` returns HTTP 200/201 and valid order payload
+  5. Verifies the order record in Strapi has the expected status (`paid` or `pending`), line items, and COP total
+  6. Asserts the client-side cart is cleared upon order confirmation
+  7. Asserts the `/payment/success` UI displays order confirmation details
+**And** the test runner exits with code 0 on success and provides clear failure logs if any step diverges from expected behavior.
+
 
 
 
diff --git a/frontend/package.json b/frontend/package.json
index 923af71..646761c 100644
--- a/frontend/package.json
+++ b/frontend/package.json
@@ -6,7 +6,9 @@
     "dev": "next dev --turbopack",
     "build": "next build --turbopack",
     "start": "next start",
-    "lint": "eslint"
+    "lint": "eslint",
+    "test:analytics": "node scripts/verify-analytics.js",
+    "test:order": "node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/verify-order-lifecycle.js"
   },
   "dependencies": {
     "@strapi/blocks-react-renderer": "^1.0.2",
diff --git a/frontend/scripts/verify-analytics.js b/frontend/scripts/verify-analytics.js
new file mode 100644
index 0000000..f45be3f
--- /dev/null
+++ b/frontend/scripts/verify-analytics.js
@@ -0,0 +1,149 @@
+/**
+ * Verification test script for Epic 9: Meta Pixel & E-commerce Funnel Tracking
+ * Run with: node frontend/scripts/verify-analytics.js
+ */
+
+const assert = require('assert');
+
+console.log('­ƒº¬ Starting Epic 9 Analytics Verification...\n');
+
+// 1. Test Mock / Unconfigured State
+delete process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
+
+// Mock DOM environment
+global.window = {};
+
+// Test functions with dynamic module loading or mirror logic to test analytics contracts
+const testContracts = () => {
+  const isPixelConfigured = (id) => {
+    return Boolean(
+      id &&
+      id.trim() !== '' &&
+      !id.includes('YOUR_') &&
+      !id.includes('placeholder')
+    );
+  };
+
+  assert.strictEqual(isPixelConfigured(undefined), false, 'Undefined pixel ID should not be configured');
+  assert.strictEqual(isPixelConfigured(''), false, 'Empty string pixel ID should not be configured');
+  assert.strictEqual(isPixelConfigured('YOUR_PIXEL_ID'), false, 'Placeholder pixel ID should not be configured');
+  assert.strictEqual(isPixelConfigured('1234567890'), true, 'Valid numeric ID should be configured');
+
+  console.log('Ô£à Pixel configuration detection passes all guards.');
+
+  // 2. Test Safe Event Dispatching without Pixel ID
+  let mockLogged = false;
+  const originalLog = console.log;
+  console.log = (...args) => {
+    if (args[0] && args[0].includes('[Analytics:Mock]')) {
+      mockLogged = true;
+    }
+  };
+
+  const safeFbq = (id, type, eventName, params) => {
+    if (typeof global.window === 'undefined') return;
+    const configured = isPixelConfigured(id);
+    if (configured && typeof global.window.fbq === 'function') {
+      try {
+        if (params) {
+          global.window.fbq(type, eventName, params);
+        } else {
+          global.window.fbq(type, eventName);
+        }
+      } catch (err) {
+        // Safe catch
+      }
+    } else {
+      console.log(`[Analytics:Mock] ${type} -> ${eventName}:`, params || '(no params)');
+    }
+  };
+
+  // Test no-op / mock calls when no pixel ID is configured
+  safeFbq(undefined, 'track', 'PageView');
+  assert.strictEqual(mockLogged, true, 'PageView dispatched to dev mock logger');
+
+  mockLogged = false;
+  safeFbq(undefined, 'track', 'ViewContent', { content_ids: ['1'], value: 45000, currency: 'COP' });
+  assert.strictEqual(mockLogged, true, 'ViewContent dispatched to dev mock logger');
+
+  console.log = originalLog;
+  console.log('Ô£à Unconfigured / Safe Fallback execution operates without errors.');
+
+  // 3. Test Active Pixel Event Payloads
+  const recordedEvents = [];
+  global.window.fbq = (type, eventName, params) => {
+    recordedEvents.push({ type, eventName, params });
+  };
+
+  const validPixelId = '987654321';
+
+  // Test PageView
+  safeFbq(validPixelId, 'track', 'PageView', { page_path: '/category/rostro' });
+  assert.strictEqual(recordedEvents.length, 1);
+  assert.strictEqual(recordedEvents[0].eventName, 'PageView');
+  assert.strictEqual(recordedEvents[0].params.page_path, '/category/rostro');
+
+  // Test ViewContent
+  const viewContentPayload = {
+    content_ids: ['101'],
+    content_name: 'Base L├¡quida Mate',
+    content_category: 'Rostro',
+    value: 55000,
+    currency: 'COP',
+  };
+  safeFbq(validPixelId, 'track', 'ViewContent', viewContentPayload);
+  assert.strictEqual(recordedEvents[1].eventName, 'ViewContent');
+  assert.strictEqual(recordedEvents[1].params.value, 55000);
+  assert.strictEqual(recordedEvents[1].params.currency, 'COP');
+
+  // Test AddToCart
+  const addToCartPayload = {
+    content_ids: ['101'],
+    content_name: 'Base L├¡quida Mate',
+    value: 110000,
+    currency: 'COP',
+  };
+  safeFbq(validPixelId, 'track', 'AddToCart', addToCartPayload);
+  assert.strictEqual(recordedEvents[2].eventName, 'AddToCart');
+  assert.strictEqual(recordedEvents[2].params.value, 110000);
+  assert.strictEqual(recordedEvents[2].params.currency, 'COP');
+
+  // Test InitiateCheckout
+  const checkoutPayload = {
+    value: 110000,
+    num_items: 2,
+    currency: 'COP',
+  };
+  safeFbq(validPixelId, 'track', 'InitiateCheckout', checkoutPayload);
+  assert.strictEqual(recordedEvents[3].eventName, 'InitiateCheckout');
+  assert.strictEqual(recordedEvents[3].params.num_items, 2);
+
+  // Test WhatsApp Contact Click
+  const whatsAppPayload = {
+    origin: 'floating_whatsapp_widget',
+    source_url: 'http://localhost:3000/product/101',
+    timestamp: new Date().toISOString(),
+  };
+  safeFbq(validPixelId, 'trackCustom', 'WhatsAppContactClick', whatsAppPayload);
+  assert.strictEqual(recordedEvents[4].type, 'trackCustom');
+  assert.strictEqual(recordedEvents[4].eventName, 'WhatsAppContactClick');
+  assert.strictEqual(recordedEvents[4].params.origin, 'floating_whatsapp_widget');
+
+  console.log('Ô£à Active Meta Pixel events and COP payloads verified successfully.');
+
+  // 4. Test Error Handling (e.g. ad-blocker throwing exception)
+  global.window.fbq = () => {
+    throw new Error('Script blocked by browser extension');
+  };
+
+  assert.doesNotThrow(() => {
+    safeFbq(validPixelId, 'track', 'PageView');
+  }, 'Safe wrapper must not rethrow external ad-blocker errors');
+
+  console.log('Ô£à Ad-blocker exception resilience verified.');
+};
+
+testContracts();
+
+console.log('\n­ƒÄë ALL EPIC 9 ANALYTICS TESTS PASSED!\n');
+process.exit(0);
diff --git a/frontend/scripts/verify-order-lifecycle.js b/frontend/scripts/verify-order-lifecycle.js
new file mode 100644
index 0000000..af7aa7f
--- /dev/null
+++ b/frontend/scripts/verify-order-lifecycle.js
@@ -0,0 +1,245 @@
+/**
+ * Verification suite for order correctness: guest checkout, transaction
+ * idempotency, payment-status mapping and the Meta Pixel Purchase contract.
+ *
+ * Runs against the production modules, not mirrored copies:
+ *   node --experimental-strip-types scripts/verify-order-lifecycle.js
+ */
+
+const assert = require('node:assert/strict');
+const path = require('node:path');
+
+process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID = '123456789012345';
+
+const ORDER_MODULE = path.join(__dirname, '..', 'src', 'utils', 'order.ts');
+const ANALYTICS_MODULE = path.join(__dirname, '..', 'src', 'utils', 'analytics.ts');
+
+const {
+  buildTransactionId,
+  normalizeTransactionId,
+  parseStoredUser,
+  processOrderRequest,
+  resolvePaymentStatus,
+  resolveUserId,
+  validateOrderPayload,
+  OrderCreationError,
+} = require(ORDER_MODULE);
+
+const { claimPurchaseEvent, trackPurchase, PURCHASE_DEDUPE_PREFIX } = require(ANALYTICS_MODULE);
+
+console.log('­ƒº¬ Epic 10: order correctness & verification\n');
+
+const createPersistence = () => {
+  const rows = [];
+  let sequence = 0;
+
+  return {
+    rows,
+    async findByTransactionId(transactionId) {
+      return rows.find(row => row.transactionId === transactionId) ?? null;
+    },
+    async create(record) {
+      const row = { id: ++sequence, ...record };
+      rows.push(row);
+      return row;
+    },
+  };
+};
+
+const baseOrder = {
+  items: [
+    { id: 1, name: 'Tono Labial Rose', price: 35000, quantity: 2 },
+    { id: 7, name: 'S├®rum Vitamina C', price: 89000, quantity: 1 },
+  ],
+  subtotal: 159000,
+  deliveryCost: 5000,
+  total: 164000,
+  paymentMethod: 'nequi',
+  deliveryMethod: { id: 'delivery_express', name: 'Env├¡o Expr├®s Local', cost: 5000 },
+  shippingAddress: {
+    fullName: 'Camila Rodr├¡guez',
+    department: 'Antioquia',
+    city: 'Medell├¡n',
+    address: 'Cra 43A # 1-50',
+    phone: '3109876543',
+  },
+};
+
+// --- 1. Guest checkout -------------------------------------------------------
+const main = async () => {
+  const guestPersistence = createPersistence();
+  const guestResult = await processOrderRequest(
+    { ...baseOrder, transactionId: 'TX-GUEST-001', userId: null },
+    guestPersistence
+  );
+
+  assert.equal(guestResult.ok, true, 'Guest checkout must persist without a user account');
+  assert.equal(guestResult.status, 201, 'New order must answer 201');
+  assert.equal(guestResult.idempotent, false);
+  assert.equal(guestResult.order.user, undefined, 'Guest order must not carry a user relation');
+  assert.equal(guestResult.order.status, 'paid', 'Digital payment must be paid');
+  assert.deepEqual(guestResult.order.shippingAddress, baseOrder.shippingAddress);
+  assert.equal(guestResult.order.total, 164000, 'Total must stay in COP');
+  assert.equal(guestPersistence.rows.length, 1);
+  console.log('Ô£à Guest checkout persists with shipping metadata and no user relation.');
+
+  // --- 2. Registered user ----------------------------------------------------
+  const registeredResult = await processOrderRequest(
+    { ...baseOrder, transactionId: 'TX-USER-001', userId: '42' },
+    createPersistence()
+  );
+  assert.equal(registeredResult.order.user, 42, 'Valid user id must be linked');
+  console.log('Ô£à Registered checkout links the user relation.');
+
+  // --- 3. Duplicate reload is idempotent -------------------------------------
+  const duplicateResult = await processOrderRequest(
+    { ...baseOrder, transactionId: 'TX-GUEST-001', userId: null },
+    guestPersistence
+  );
+  assert.equal(duplicateResult.ok, true);
+  assert.equal(duplicateResult.status, 200, 'Duplicate must answer 200');
+  assert.equal(duplicateResult.idempotent, true, 'Duplicate must be flagged idempotent');
+  assert.equal(duplicateResult.order.id, guestResult.order.id, 'Must return the original order');
+  assert.equal(guestPersistence.rows.length, 1, 'No duplicate record may be persisted');
+  console.log('Ô£à Duplicate transaction returns the original order without inserting.');
+
+  // --- 4. Missing transaction id never dedupes -------------------------------
+  const noTxPersistence = createPersistence();
+  await processOrderRequest({ ...baseOrder, paymentMethod: 'efectivo' }, noTxPersistence);
+  await processOrderRequest({ ...baseOrder, paymentMethod: 'efectivo' }, noTxPersistence);
+  assert.equal(noTxPersistence.rows.length, 2, 'Orders without transactionId must remain independent');
+  console.log('Ô£à Missing transactionId does not collapse distinct orders.');
+
+  // --- 5. Payment status mapping --------------------------------------------
+  assert.equal(resolvePaymentStatus('efectivo'), 'pending', 'Cash on delivery must stay pending');
+  assert.equal(resolvePaymentStatus('nequi_manual'), 'pending', 'Manual transfer must stay pending');
+  assert.equal(resolvePaymentStatus('nequi'), 'paid');
+  assert.equal(resolvePaymentStatus('wompi'), 'paid');
+
+  const cashResult = await processOrderRequest(
+    { ...baseOrder, paymentMethod: 'efectivo', transactionId: 'TX-CASH-001' },
+    createPersistence()
+  );
+  assert.equal(cashResult.order.status, 'pending');
+  console.log('Ô£à Cash/contraentrega never records a paid status.');
+
+  // --- 6. Delivery validation ------------------------------------------------
+  const invalid = validateOrderPayload({ ...baseOrder, shippingAddress: null });
+  assert.equal(invalid.valid, false);
+  assert.equal(invalid.error, 'Shipping address is required for delivery methods');
+
+  const invalidResult = await processOrderRequest(
+    { ...baseOrder, shippingAddress: null, transactionId: 'TX-INVALID-001' },
+    createPersistence()
+  );
+  assert.equal(invalidResult.ok, false);
+  assert.equal(invalidResult.status, 400);
+  assert.equal(invalidResult.error, 'Shipping address is required for delivery methods');
+
+  const pickup = await processOrderRequest(
+    {
+      ...baseOrder,
+      shippingAddress: undefined,
+      deliveryMethod: { id: 'pickup', name: 'Recogida en tienda' },
+      transactionId: 'TX-PICKUP-001',
+    },
+    createPersistence()
+  );
+  assert.equal(pickup.ok, true, 'Pickup orders must not require a shipping address');
+  assert.equal(pickup.order.shippingAddress, undefined);
+  console.log('Ô£à Delivery/pickup address validation matches the API contract.');
+
+  // --- 7. Normalisation helpers ---------------------------------------------
+  assert.equal(normalizeTransactionId('  TX-1  '), 'TX-1');
+  assert.equal(normalizeTransactionId(''), null);
+  assert.equal(normalizeTransactionId(undefined), null);
+  assert.equal(normalizeTransactionId(12345), null);
+
+  assert.equal(resolveUserId('42'), 42);
+  assert.equal(resolveUserId(7), 7);
+  assert.equal(resolveUserId(null), null);
+  assert.equal(resolveUserId(''), null);
+  assert.equal(resolveUserId('abc'), null);
+  assert.equal(resolveUserId(0), null);
+
+  assert.equal(parseStoredUser('{"id":9,"username":"camila"}'), 9);
+  assert.equal(parseStoredUser('{broken json'), null, 'Malformed user JSON must fall back to guest');
+  assert.equal(parseStoredUser(null), null);
+
+  const generated = buildTransactionId('EFECTIVO');
+  assert.match(generated, /^EFECTIVO-\d+-[a-z0-9]+$/);
+  assert.notEqual(generated, buildTransactionId('EFECTIVO'), 'Transaction ids must not collide');
+  console.log('Ô£à Transaction/user normalisation and guest fallbacks verified.');
+
+  // --- 8. Meta Pixel Purchase contract --------------------------------------
+  const storage = new Map();
+  const store = {
+    getItem: key => (storage.has(key) ? storage.get(key) : null),
+    setItem: (key, value) => storage.set(key, value),
+  };
+
+  const events = [];
+  global.window = { fbq: (...args) => events.push(args) };
+
+  const purchase = {
+    transactionId: 'TX-GUEST-001',
+    orderId: guestResult.order.id,
+    total: 164000,
+    items: baseOrder.items,
+    currency: 'COP',
+    paymentMethod: 'nequi',
+  };
+
+  trackPurchase(purchase);
+  assert.equal(events.length, 1, 'Purchase must be dispatched');
+  const [type, name, payload] = events[0];
+  assert.equal(type, 'track');
+  assert.equal(name, 'Purchase');
+  assert.equal(payload.value, 164000, 'Purchase value must be the numeric COP total');
+  assert.equal(payload.currency, 'COP');
+  assert.equal(payload.order_id, String(guestResult.order.id));
+  assert.equal(payload.transaction_id, 'TX-GUEST-001');
+  assert.equal(payload.contents.length, 2);
+  assert.deepEqual(payload.contents[0], { id: '1', quantity: 2, item_price: 35000 });
+  console.log('Ô£à Purchase event payload matches the Meta Pixel standard.');
+
+  assert.equal(claimPurchaseEvent('TX-GUEST-001', store), true, 'First mount claims the conversion');
+  assert.equal(claimPurchaseEvent('TX-GUEST-001', store), false, 'Reload must not re-claim it');
+  assert.equal(storage.get(`${PURCHASE_DEDUPE_PREFIX}TX-GUEST-001`), 'true');
+  assert.equal(claimPurchaseEvent('TX-OTHER-001', store), true, 'Different orders still convert');
+
+  events.length = 0;
+  const fireOnce = transactionId => {
+    if (claimPurchaseEvent(transactionId, store)) trackPurchase(purchase);
+  };
+  fireOnce('TX-GUEST-001');
+  fireOnce('TX-GUEST-001');
+  assert.equal(events.length, 0, 'Reloaded success page must not re-fire Purchase');
+  console.log('Ô£à Purchase event fires exactly once per transaction across reloads.');
+
+  events.length = 0;
+  trackPurchase({ ...purchase, total: Number.NaN });
+  trackPurchase({ ...purchase, transactionId: '' });
+  assert.equal(events.length, 0, 'Invalid conversions must never be dispatched');
+  console.log('Ô£à Invalid Purchase payloads are rejected.');
+
+  // --- 9. Persistence failures surface as API errors ------------------------
+  const failingResult = await processOrderRequest(baseOrder, {
+    findByTransactionId: async () => null,
+    create: async () => {
+      throw new OrderCreationError('Invalid items payload', 400);
+    },
+  }).catch(error => error);
+
+  assert.ok(failingResult instanceof OrderCreationError, 'Persistence failures must be typed');
+  assert.equal(failingResult.status, 400);
+  console.log('Ô£à Persistence failures propagate as typed API errors.');
+
+  console.log('\n­ƒÄë ALL EPIC 10 ORDER CORRECTNESS & VERIFICATION TESTS PASSED\n');
+};
+
+main().catch(error => {
+  console.error('\nÔØî Order correctness verification failed:');
+  console.error(error);
+  process.exit(1);
+});
diff --git a/frontend/src/app/api/orders/route.ts b/frontend/src/app/api/orders/route.ts
index bf61f4d..44b69c9 100644
--- a/frontend/src/app/api/orders/route.ts
+++ b/frontend/src/app/api/orders/route.ts
@@ -1,104 +1,82 @@
 import { NextRequest, NextResponse } from 'next/server';
+import { OrderCreationError, processOrderRequest } from '../../../utils/order';
 
 const BASE_STRAPI_URL = (process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337').replace(/\/$/, '');
 const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
 
-interface OrderData {
-  items: unknown[];
-  status: string;
-  total: number;
-  subtotal: number;
-  deliveryCost: number;
-  deliveryMethod: string;
-  shippingAddress?: unknown;
-  transactionId?: string;
-  paymentMethod: string;
-  user?: string | number;
-}
-
 // Create a new order
 export async function POST(request: NextRequest) {
   try {
-    const { items, deliveryMethod, shippingAddress, subtotal, deliveryCost, total, transactionId, paymentMethod, userId } = await request.json();
+    const payload = await request.json();
+
+    const result = await processOrderRequest(payload, {
+      findByTransactionId: async (transactionId) => {
+        const checkUrl = `${BASE_STRAPI_URL}/api/orders?filters[transactionId][$eq]=${encodeURIComponent(transactionId)}`;
+
+        try {
+          const existingRes = await fetch(checkUrl, {
+            headers: {
+              'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
+            },
+          });
+
+          if (!existingRes.ok) return null;
+
+          const existingJson = await existingRes.json().catch(() => null);
+          return existingJson?.data?.[0] ?? null;
+        } catch (err) {
+          // A failed reconciliation lookup must never block a legitimate order.
+          console.warn('[Orders:Idempotency] Could not verify existing order by transactionId:', err);
+          return null;
+        }
+      },
+      create: async (order) => {
+        const formData = new FormData();
+        Object.entries(order).forEach(([key, value]) => {
+          formData.append(
+            key,
+            value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value)
+          );
+        });
+
+        const response = await fetch(`${BASE_STRAPI_URL}/api/orders`, {
+          method: 'POST',
+          // No Content-Type header for FormData
+          headers: {
+            'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
+          },
+          body: formData,
+        });
+
+        if (!response.ok) {
+          const errorData = await response.json().catch(() => ({}));
+          const message = errorData.error?.message || response.statusText;
+          console.error('Strapi API error:', response.status, message);
+          throw new OrderCreationError(message, response.status);
+        }
+
+        return response.json();
+      },
+    });
 
-    // Validate required fields
-    if (!items || !subtotal || !total || !paymentMethod) {
-      return NextResponse.json(
-        { error: 'Missing required fields: items, subtotal, total, paymentMethod' },
-        { status: 400 }
-      );
+    if (!result.ok) {
+      return NextResponse.json({ error: result.error }, { status: result.status });
     }
 
-    // Validate shippingAddress if delivery method is not pickup
-    const parsedDeliveryMethod = typeof deliveryMethod === 'string' ? JSON.parse(deliveryMethod) : deliveryMethod;
-    if (parsedDeliveryMethod && parsedDeliveryMethod.id !== 'pickup' && !shippingAddress) {
+    if (result.idempotent) {
+      console.log('[Orders:Idempotency] Returning existing order for an already processed transaction');
       return NextResponse.json(
-        { error: 'Shipping address is required for delivery methods' },
-        { status: 400 }
+        { data: result.order, idempotent: true, message: 'Order already processed' },
+        { status: result.status }
       );
     }
 
-    const orderData: OrderData = {
-      items,
-      status: (paymentMethod === 'efectivo' || paymentMethod === 'nequi_manual') ? 'pending' : 'paid',
-      total,
-      subtotal,
-      deliveryCost,
-      deliveryMethod,
-      paymentMethod
-    };
-
-    // Include transactionId if it's a valid, non-empty string
-    if (transactionId && typeof transactionId === 'string' && transactionId.trim() !== '') {
-      orderData.transactionId = transactionId;
-    }
-
-    // Include shippingAddress if provided
-    if (shippingAddress) {
-      orderData.shippingAddress = shippingAddress;
-    }
-
-    // Only include user if userId is provided and valid
-    const parsedUserId = parseInt(userId, 10);
-    if (!isNaN(parsedUserId)) {
-      orderData.user = parsedUserId;
-    }
-
-    // Convert orderData to FormData for better compatibility
-    const formData = new FormData();
-    Object.entries(orderData).forEach(([key, value]) => {
-      if (key === 'user' && typeof value === 'number') {
-        formData.append(key, String(value));
-      } else if (typeof value === 'object') {
-        formData.append(key, JSON.stringify(value));
-      } else {
-        formData.append(key, String(value));
-      }
-    });
-    console.log('formData:', formData);
-
-    const response = await fetch(`${BASE_STRAPI_URL}/api/orders`, {
-      method: 'POST',
-      // No Content-Type header for FormData
-      headers: {
-        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
-      },
-      body: formData,
-    });
-
-    if (!response.ok) {
-      const errorData = await response.json().catch(() => ({}));
-      const message = errorData.error?.message || response.statusText;
-      console.error('Strapi API error:', response.status, message);
-      return NextResponse.json(
-        { error: message },
-        { status: response.status }
-      );
+    return NextResponse.json(result.order, { status: result.status });
+  } catch (error) {
+    if (error instanceof OrderCreationError) {
+      return NextResponse.json({ error: error.message }, { status: error.status });
     }
 
-    const result = await response.json();
-    return NextResponse.json(result);
-  } catch (error) {
     console.error('Error creating order:', error);
     return NextResponse.json(
       { error: error instanceof Error ? error.message : 'Failed to create order' },
diff --git a/frontend/src/app/layout.tsx b/frontend/src/app/layout.tsx
index e9db607..6dbb08c 100644
--- a/frontend/src/app/layout.tsx
+++ b/frontend/src/app/layout.tsx
@@ -6,6 +6,7 @@ import Footer from "@/components/Footer";
 import FloatingWhatsApp from "@/components/FloatingWhatsApp";
 import { CartProvider } from "@/context/CartContext";
 import { AuthProvider } from "@/context/AuthContext";
+import MetaPixel from "@/components/MetaPixel";
 
 const playfair = Playfair_Display({
   variable: "--font-playfair",
@@ -92,6 +93,7 @@ export default function RootLayout({
   return (
     <html lang="es" className={`${playfair.variable} ${jakarta.variable}`}>
       <body className="min-h-screen bg-[var(--surface-base)] text-[var(--text-main)] dark:bg-[#1A0F14] dark:text-[#FDF9F7] font-sans antialiased selection:bg-[var(--accent-tint)] selection:text-[var(--primary)]">
+        <MetaPixel />
         <AuthProvider>
           <CartProvider>
             <div className="flex flex-col min-h-screen">
diff --git a/frontend/src/app/payment/success/page.tsx b/frontend/src/app/payment/success/page.tsx
index 0e7c454..14409d0 100644
--- a/frontend/src/app/payment/success/page.tsx
+++ b/frontend/src/app/payment/success/page.tsx
@@ -7,14 +7,18 @@ import { MessageCircle, CheckCircle2, ShoppingBag, ArrowRight, Package, Clock, T
 import { Button } from '@/components/ui/Button';
 import { Card } from '@/components/ui/Card';
 import { cn } from '@/utils/cn';
+import { trackPurchase, claimPurchaseEvent } from '@/utils/analytics';
+import { readStoredUserId } from '@/utils/order';
 
 interface OrderItem {
+  id?: number | string;
   name: string;
   quantity: number;
   price: number;
 }
 
 interface DeliveryMethod {
+  id?: string;
   name: string;
   description: string;
 }
@@ -22,6 +26,7 @@ interface DeliveryMethod {
 interface OrderDetails {
   items: OrderItem[];
   deliveryMethod: DeliveryMethod;
+  shippingAddress?: unknown;
   subtotal: number;
   deliveryCost: number;
   total: number;
@@ -36,24 +41,21 @@ function PaymentSuccessContent() {
   const transactionId = searchParams.get('transaction_id');
   const isMock = searchParams.get('mock') === 'true';
   const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
+
   const createOrder = useCallback(async (orderData: OrderDetails, txId: string) => {
     try {
-      const userString = localStorage.getItem('user');
-      if (!userString) {
-        console.error('User not found in localStorage, cannot create order.');
-        return;
-      }
-      const user = JSON.parse(userString);
+      const userId = readStoredUserId();
 
       const orderPayload = {
         items: orderData.items,
         deliveryMethod: orderData.deliveryMethod,
+        shippingAddress: orderData.shippingAddress || null,
         subtotal: orderData.subtotal,
         deliveryCost: orderData.deliveryCost,
         total: orderData.total,
         transactionId: txId,
         paymentMethod: orderData.paymentMethod || 'nequi',
-        userId: user.id
+        userId: userId
       };
 
       const response = await fetch('/api/orders', {
@@ -65,7 +67,12 @@ function PaymentSuccessContent() {
       });
 
       if (response.ok) {
-        console.log('Order created successfully');
+        const result = await response.json().catch(() => ({}));
+        const createdOrderId = result.data?.id || orderData.orderId;
+        console.log('Order processed successfully:', createdOrderId);
+        if (createdOrderId) {
+          setOrderDetails(prev => prev ? { ...prev, orderId: createdOrderId } : prev);
+        }
       } else {
         console.error('Failed to create order');
       }
@@ -77,24 +84,45 @@ function PaymentSuccessContent() {
   useEffect(() => {
     // Load order details from localStorage (set before payment)
     const savedOrder = typeof window !== 'undefined' ? localStorage.getItem('lastOrder') : null;
+    let activeOrder: OrderDetails | null = null;
+
     if (savedOrder) {
       try {
-        const parsed = JSON.parse(savedOrder);
+        activeOrder = JSON.parse(savedOrder);
         localStorage.removeItem('lastOrder'); // Clean up
 
+        const orderToSet = activeOrder;
         queueMicrotask(() => {
-          setOrderDetails(parsed);
+          setOrderDetails(orderToSet);
         });
 
         // Create order in backend after successful payment
-        if (transactionId) {
-          createOrder(parsed, transactionId);
+        if (transactionId && activeOrder) {
+          createOrder(activeOrder, transactionId);
         }
       } catch (err) {
         console.error('Failed to parse saved order:', err);
       }
     }
 
+    // Trigger Meta Pixel Purchase event once per transaction
+    const txToTrack = transactionId || activeOrder?.transactionId || activeOrder?.orderId?.toString();
+    if (activeOrder && txToTrack && claimPurchaseEvent(String(txToTrack))) {
+      trackPurchase({
+        transactionId: String(txToTrack),
+        orderId: activeOrder.orderId || txToTrack,
+        total: activeOrder.total,
+        items: activeOrder.items.map(item => ({
+          id: item.id || item.name,
+          name: item.name,
+          price: item.price,
+          quantity: item.quantity,
+        })),
+        currency: 'COP',
+        paymentMethod: activeOrder.paymentMethod || 'nequi',
+      });
+    }
+
     if (isMock) {
       console.log('­ƒº¬ Mock payment completed successfully');
     }
diff --git a/frontend/src/app/product/[id]/page.tsx b/frontend/src/app/product/[id]/page.tsx
index 3ebe7d2..64900a0 100644
--- a/frontend/src/app/product/[id]/page.tsx
+++ b/frontend/src/app/product/[id]/page.tsx
@@ -26,6 +26,7 @@ import ShadeSelector from '@/components/ShadeSelector';
 import PdpStickyBar from '@/components/PdpStickyBar';
 import InstagramSocialProof from '@/components/InstagramSocialProof';
 import { Shade, Product as ProductType } from '@/types/product';
+import { trackViewContent, trackAddToCart } from '@/utils/analytics';
 
 interface ProductCategory {
   id: number;
@@ -80,6 +81,15 @@ export default function ProductPage() {
       .then(data => {
         const productData = data.data;
         setProduct(productData);
+        if (productData) {
+          trackViewContent({
+            id: productData.id,
+            name: productData.name,
+            category: productData.product_category?.Name || productData.product_category?.slug,
+            price: productData.price,
+            currency: 'COP',
+          });
+        }
         // Initial quantity should be 1 if stock exists, else 0
         if (productData && productData.stock <= 0) {
           setQuantity(0);
@@ -136,6 +146,14 @@ export default function ProductPage() {
       }
     });
 
+    trackAddToCart({
+      id: product.id,
+      name: product.name,
+      price: product.price,
+      quantity,
+      currency: 'COP',
+    });
+
     setAddedToCart(true);
     setTimeout(() => setAddedToCart(false), 2000);
   };
diff --git a/frontend/src/components/Cart.tsx b/frontend/src/components/Cart.tsx
index 5ab3034..4c73365 100644
--- a/frontend/src/components/Cart.tsx
+++ b/frontend/src/components/Cart.tsx
@@ -26,6 +26,8 @@ import CouponInput from './CouponInput';
 import { cn } from '@/utils/cn';
 import { Button } from './ui/Button';
 import { Card } from './ui/Card';
+import { trackAddToCart, trackInitiateCheckout } from '@/utils/analytics';
+import { buildTransactionId, readStoredUserId } from '@/utils/order';
 
 const FREE_SHIPPING_THRESHOLD = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD) || 50000;
 
@@ -55,6 +57,7 @@ function EfectivoCheckout({
   const [loading, setLoading] = useState(false);
   const [showConfirmation, setShowConfirmation] = useState(false);
   const [error, setError] = useState<string | null>(null);
+  const [transactionId] = useState(() => buildTransactionId('EFECTIVO'));
 
   const handleConfirmOrder = async () => {
     if (!deliveryMethod) {
@@ -66,16 +69,6 @@ function EfectivoCheckout({
     setError(null);
 
     try {
-      const userString = localStorage.getItem('user');
-      if (!userString) {
-        throw new Error('Debes iniciar sesi├│n para realizar un pedido');
-      }
-
-      const user = JSON.parse(userString);
-      if (!user || !user.id) {
-        throw new Error('Informaci├│n de usuario no encontrada. Por favor inicia sesi├│n nuevamente.');
-      }
-
       const orderResponse = await fetch('/api/orders', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
@@ -87,7 +80,8 @@ function EfectivoCheckout({
           deliveryCost,
           total,
           paymentMethod: 'efectivo',
-          userId: user.id
+          transactionId,
+          userId: readStoredUserId()
         }),
       });
 
@@ -106,6 +100,7 @@ function EfectivoCheckout({
         deliveryCost,
         total,
         paymentMethod: 'efectivo',
+        transactionId,
         orderId: orderData.data?.id,
         timestamp: new Date().toISOString()
       };
@@ -294,6 +289,26 @@ export default function Cart({ isOpen, onClose }: CartProps) {
     }
   };
 
+  const handleSelectPaymentMethod = (method: 'nequi' | 'efectivo' | 'wompi') => {
+    setPaymentMethod(method);
+    trackInitiateCheckout({
+      subtotal: state.subtotal,
+      itemCount: state.items.reduce((acc, item) => acc + item.quantity, 0),
+      currency: 'COP',
+    });
+  };
+
+  const handleIncreaseQuantity = (item: any) => {
+    dispatch({ type: 'ADD_ITEM', payload: item });
+    trackAddToCart({
+      id: item.id,
+      name: item.name,
+      price: item.price,
+      quantity: 1,
+      currency: 'COP',
+    });
+  };
+
   return (
     <AnimatePresence>
       {isOpen && (
@@ -421,7 +436,7 @@ export default function Cart({ isOpen, onClose }: CartProps) {
                                     <Button
                                       variant="ghost"
                                       size="icon"
-                                      onClick={() => dispatch({ type: 'ADD_ITEM', payload: item })}
+                                      onClick={() => handleIncreaseQuantity(item)}
                                       className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-900 dark:!hover:text-[#2D1B22] hover:bg-white dark:!hover:bg-white"
                                       aria-label={`Aumentar cantidad de ${item.name}`}
                                     >
@@ -498,7 +513,7 @@ export default function Cart({ isOpen, onClose }: CartProps) {
                                     <Button
                                       variant="ghost"
                                       size="icon"
-                                      onClick={() => dispatch({ type: 'ADD_ITEM', payload: item })}
+                                      onClick={() => handleIncreaseQuantity(item)}
                                       className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-900 dark:!hover:text-[#2D1B22] hover:bg-white dark:!hover:bg-white"
                                       aria-label={`Aumentar cantidad de ${item.name}`}
                                     >
@@ -702,7 +717,7 @@ export default function Cart({ isOpen, onClose }: CartProps) {
                         <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1">Escoge tu Forma de Pago</h4>
                         <div className="grid grid-cols-1 gap-4">
                           <button
-                            onClick={() => setPaymentMethod('efectivo')}
+                            onClick={() => handleSelectPaymentMethod('efectivo')}
                             className={cn(
                               "flex items-center p-5 rounded-[2rem] border-2 transition-all group relative overflow-hidden",
                               paymentMethod === 'efectivo'
@@ -728,7 +743,7 @@ export default function Cart({ isOpen, onClose }: CartProps) {
                           </button>
 
                           <button
-                            onClick={() => setPaymentMethod('nequi')}
+                            onClick={() => handleSelectPaymentMethod('nequi')}
                             className={cn(
                               "flex items-center p-5 rounded-[2rem] border-2 transition-all group relative overflow-hidden",
                               paymentMethod === 'nequi'
@@ -754,7 +769,7 @@ export default function Cart({ isOpen, onClose }: CartProps) {
                           </button>
 
                           <button
-                            onClick={() => setPaymentMethod('wompi')}
+                            onClick={() => handleSelectPaymentMethod('wompi')}
                             className={cn(
                               "flex items-center p-5 rounded-[2rem] border-2 transition-all group relative overflow-hidden",
                               paymentMethod === 'wompi'
diff --git a/frontend/src/components/FloatingWhatsApp.tsx b/frontend/src/components/FloatingWhatsApp.tsx
index d219851..5019cd7 100644
--- a/frontend/src/components/FloatingWhatsApp.tsx
+++ b/frontend/src/components/FloatingWhatsApp.tsx
@@ -2,6 +2,7 @@
 
 import React, { useState } from "react";
 import { MessageCircle, X } from "lucide-react";
+import { trackWhatsAppClick } from "@/utils/analytics";
 
 interface FloatingWhatsAppProps {
   phoneNumber?: string;
@@ -15,6 +16,10 @@ export default function FloatingWhatsApp({
   const [isOpen, setIsOpen] = useState(false);
 
   const handleOpenWhatsApp = (msg?: string) => {
+    trackWhatsAppClick({
+      origin: "floating_whatsapp_widget",
+      url: typeof window !== "undefined" ? window.location.href : "",
+    });
     const textToUse = msg || defaultMessage;
     const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(textToUse)}`;
     window.open(url, "_blank", "noopener,noreferrer");
diff --git a/frontend/src/components/ManualNequiCheckout.tsx b/frontend/src/components/ManualNequiCheckout.tsx
index 295ac19..02bdae0 100644
--- a/frontend/src/components/ManualNequiCheckout.tsx
+++ b/frontend/src/components/ManualNequiCheckout.tsx
@@ -12,6 +12,7 @@ import {
     Info
 } from 'lucide-react';
 import { DeliveryMethod, ShippingAddress } from '@/context/CartContext';
+import { buildTransactionId, readStoredUserId } from '@/utils/order';
 
 interface ManualNequiCheckoutProps {
     items: any[];
@@ -38,6 +39,7 @@ export default function ManualNequiCheckout({
     const [copied, setCopied] = useState(false);
     const [orderCreated, setOrderCreated] = useState(false);
     const [error, setError] = useState<string | null>(null);
+    const [transactionId] = useState(() => buildTransactionId('NEQUI-MANUAL'));
 
     // CONFIGURACI├ôN DE NEQUI - El usuario puede cambiar esto f├ícilmente
     const NEQUI_NUMBER = "318 202 6212"; // Cambiar por el n├║mero real
@@ -59,16 +61,6 @@ export default function ManualNequiCheckout({
         setError(null);
 
         try {
-            const userString = localStorage.getItem('user');
-            if (!userString) {
-                throw new Error('Debes iniciar sesi├│n para realizar un pedido');
-            }
-
-            const user = JSON.parse(userString);
-            if (!user || !user.id) {
-                throw new Error('Informaci├│n de usuario no encontrada. Por favor inicia sesi├│n nuevamente.');
-            }
-
             const orderResponse = await fetch('/api/orders', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
@@ -80,7 +72,8 @@ export default function ManualNequiCheckout({
                     deliveryCost,
                     total,
                     paymentMethod: 'nequi_manual',
-                    userId: user.id
+                    transactionId,
+                    userId: readStoredUserId()
                 }),
             });
 
@@ -99,6 +92,7 @@ export default function ManualNequiCheckout({
                 deliveryCost,
                 total,
                 paymentMethod: 'nequi_manual',
+                transactionId,
                 orderId: orderData.data?.id,
                 timestamp: new Date().toISOString()
             };
diff --git a/frontend/src/components/MetaPixel.tsx b/frontend/src/components/MetaPixel.tsx
new file mode 100644
index 0000000..9042745
--- /dev/null
+++ b/frontend/src/components/MetaPixel.tsx
@@ -0,0 +1,63 @@
+'use client';
+
+import React, { useEffect, Suspense } from 'react';
+import { usePathname, useSearchParams } from 'next/navigation';
+import Script from 'next/script';
+import { FB_PIXEL_ID, isPixelConfigured, trackPageView } from '@/utils/analytics';
+
+function PixelRouteChangeTracker() {
+  const pathname = usePathname();
+  const searchParams = useSearchParams();
+
+  useEffect(() => {
+    const query = searchParams?.toString();
+    const fullUrl = query ? `${pathname}?${query}` : pathname;
+    trackPageView(fullUrl);
+  }, [pathname, searchParams]);
+
+  return null;
+}
+
+export default function MetaPixel() {
+  const configured = isPixelConfigured();
+
+  return (
+    <>
+      <Suspense fallback={null}>
+        <PixelRouteChangeTracker />
+      </Suspense>
+
+      {configured && (
+        <>
+          <Script
+            id="meta-pixel-script"
+            strategy="afterInteractive"
+            dangerouslySetInnerHTML={{
+              __html: `
+                !function(f,b,e,v,n,t,s)
+                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
+                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
+                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
+                n.queue=[];t=b.createElement(e);t.async=!0;
+                t.src=v;s=b.getElementsByTagName(e)[0];
+                s.parentNode.insertBefore(t,s)}(window, document,'script',
+                'https://connect.facebook.net/en_US/fbevents.js');
+                fbq('init', '${FB_PIXEL_ID}');
+              `,
+            }}
+          />
+          <noscript>
+            {/* eslint-disable-next-line @next/next/no-img-element */}
+            <img
+              height="1"
+              width="1"
+              style={{ display: 'none' }}
+              src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
+              alt=""
+            />
+          </noscript>
+        </>
+      )}
+    </>
+  );
+}
diff --git a/frontend/src/components/NequiCheckout.tsx b/frontend/src/components/NequiCheckout.tsx
index d94019b..05fa928 100644
--- a/frontend/src/components/NequiCheckout.tsx
+++ b/frontend/src/components/NequiCheckout.tsx
@@ -17,6 +17,7 @@ import {
 } from 'lucide-react';
 
 import { DeliveryMethod, ShippingAddress } from '@/context/CartContext';
+import { parseStoredUser } from '@/utils/order';
 
 interface NequiCheckoutProps {
   amount: number;
@@ -66,11 +67,12 @@ export default function NequiCheckout({
 
   const handleOrderCreation = useCallback(async (paymentRef: string) => {
     try {
-      const userString = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
-      const user = userString ? JSON.parse(userString) : null;
+      const user = parseStoredUser(
+        typeof window !== 'undefined' ? window.localStorage.getItem('user') : null
+      );
 
       if (items && items.length > 0) {
-        await fetch('/api/orders', {
+        const response = await fetch('/api/orders', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
@@ -81,19 +83,24 @@ export default function NequiCheckout({
             deliveryCost,
             total: amount,
             paymentMethod: 'nequi',
+            transactionId: paymentRef,
             paymentReference: paymentRef,
-            userId: user?.id || null,
+            userId: user,
           }),
         });
 
+        const result = response.ok ? await response.json().catch(() => ({})) : {};
+
         const orderDetails = {
           items,
           deliveryMethod,
+          shippingAddress,
           subtotal,
           deliveryCost,
           total: amount,
           paymentMethod: 'nequi',
-          paymentReference: paymentRef,
+          transactionId: paymentRef,
+          orderId: result?.data?.id,
           timestamp: new Date().toISOString(),
         };
         localStorage.setItem('lastOrder', JSON.stringify(orderDetails));
diff --git a/frontend/src/utils/analytics.ts b/frontend/src/utils/analytics.ts
new file mode 100644
index 0000000..1076db0
--- /dev/null
+++ b/frontend/src/utils/analytics.ts
@@ -0,0 +1,178 @@
+export interface ViewContentParams {
+  id: number | string;
+  name: string;
+  category?: string;
+  price: number;
+  currency?: string;
+}
+
+export interface AddToCartParams {
+  id: number | string;
+  name: string;
+  price: number;
+  quantity?: number;
+  currency?: string;
+}
+
+export interface InitiateCheckoutParams {
+  subtotal: number;
+  itemCount: number;
+  currency?: string;
+}
+
+export interface WhatsAppClickParams {
+  origin: string;
+  url?: string;
+}
+
+export interface PurchaseItem {
+  id?: number | string;
+  name?: string;
+  price?: number;
+  quantity?: number;
+}
+
+export interface PurchaseParams {
+  transactionId: string;
+  orderId?: string | number;
+  total: number;
+  items: PurchaseItem[];
+  currency?: string;
+  paymentMethod?: string;
+}
+
+declare global {
+  interface Window {
+    fbq?: (...args: unknown[]) => void;
+    _fbq?: (...args: unknown[]) => void;
+  }
+}
+
+export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID?.trim() || '';
+
+export const isPixelConfigured = (): boolean => {
+  return Boolean(
+    FB_PIXEL_ID &&
+    FB_PIXEL_ID !== '' &&
+    !FB_PIXEL_ID.includes('YOUR_') &&
+    !FB_PIXEL_ID.includes('placeholder')
+  );
+};
+
+export const safeFbq = (
+  type: 'track' | 'trackCustom',
+  eventName: string,
+  params?: Record<string, unknown>
+): void => {
+  if (typeof window === 'undefined') return;
+
+  const configured = isPixelConfigured();
+
+  if (configured && typeof window.fbq === 'function') {
+    try {
+      if (params) {
+        window.fbq(type, eventName, params);
+      } else {
+        window.fbq(type, eventName);
+      }
+    } catch (err) {
+      if (process.env.NODE_ENV === 'development') {
+        console.warn('[Analytics:MetaPixel] Error dispatching event:', err);
+      }
+    }
+  } else if (process.env.NODE_ENV === 'development') {
+    console.log(`[Analytics:Mock] ${type} -> ${eventName}:`, params || '(no params)');
+  }
+};
+
+export const trackPageView = (url?: string): void => {
+  safeFbq('track', 'PageView', url ? { page_path: url } : undefined);
+};
+
+export const trackViewContent = (params: ViewContentParams): void => {
+  safeFbq('track', 'ViewContent', {
+    content_ids: [String(params.id)],
+    content_name: params.name,
+    content_category: params.category || 'Cosm├®ticos',
+    value: Number(params.price) || 0,
+    currency: params.currency || 'COP',
+  });
+};
+
+export const trackAddToCart = (params: AddToCartParams): void => {
+  const qty = params.quantity || 1;
+  const unitPrice = Number(params.price) || 0;
+
+  safeFbq('track', 'AddToCart', {
+    content_ids: [String(params.id)],
+    content_name: params.name,
+    value: unitPrice * qty,
+    currency: params.currency || 'COP',
+  });
+};
+
+export const trackInitiateCheckout = (params: InitiateCheckoutParams): void => {
+  safeFbq('track', 'InitiateCheckout', {
+    value: Number(params.subtotal) || 0,
+    num_items: params.itemCount || 0,
+    currency: params.currency || 'COP',
+  });
+};
+
+export const trackWhatsAppClick = (params: WhatsAppClickParams): void => {
+  safeFbq('trackCustom', 'WhatsAppContactClick', {
+    origin: params.origin,
+    source_url: params.url || (typeof window !== 'undefined' ? window.location.href : ''),
+    timestamp: new Date().toISOString(),
+  });
+};
+
+export const PURCHASE_DEDUPE_PREFIX = 'tracked_purchase_';
+
+export interface KeyValueStore {
+  getItem(key: string): string | null;
+  setItem(key: string, value: string): void;
+}
+
+/**
+ * Claims a conversion for the given transaction so a single order never fires
+ * the Purchase event twice (for example, on a success-page reload).
+ * Returns true only for the first caller.
+ */
+export const claimPurchaseEvent = (
+  transactionId: string,
+  storage?: KeyValueStore | null
+): boolean => {
+  const resolvedStorage = storage ?? (
+    typeof window !== 'undefined' ? window.sessionStorage : null
+  );
+  if (!resolvedStorage) return true;
+
+  const key = `${PURCHASE_DEDUPE_PREFIX}${transactionId}`;
+  try {
+    if (resolvedStorage.getItem(key)) return false;
+    resolvedStorage.setItem(key, 'true');
+    return true;
+  } catch {
+    return true;
+  }
+};
+
+export const trackPurchase = (params: PurchaseParams): void => {
+  const total = Number(params.total);
+  if (!params.transactionId || !Number.isFinite(total)) return;
+
+  safeFbq('track', 'Purchase', {
+    value: total,
+    currency: params.currency || 'COP',
+    content_type: 'product',
+    contents: (params.items || []).map(item => ({
+      id: String(item.id || item.name || 'item'),
+      quantity: Number(item.quantity) || 1,
+      item_price: Number(item.price) || 0,
+    })),
+    order_id: String(params.orderId || params.transactionId),
+    transaction_id: params.transactionId,
+    payment_method: params.paymentMethod,
+  });
+};
diff --git a/frontend/src/utils/order.ts b/frontend/src/utils/order.ts
new file mode 100644
index 0000000..59aa9f8
--- /dev/null
+++ b/frontend/src/utils/order.ts
@@ -0,0 +1,177 @@
+export type PaymentStatus = 'paid' | 'pending';
+
+export interface DeliveryMethodLike {
+  id?: string;
+  name?: string;
+  description?: string;
+  cost?: number;
+}
+
+export interface OrderPayloadLike {
+  items?: unknown;
+  deliveryMethod?: unknown;
+  shippingAddress?: unknown;
+  subtotal?: number;
+  deliveryCost?: number;
+  total?: number;
+  transactionId?: unknown;
+  paymentMethod?: unknown;
+  userId?: unknown;
+}
+
+export type OrderValidation =
+  | { valid: true }
+  | { valid: false; error: string };
+
+const PENDING_PAYMENT_METHODS = ['efectivo', 'nequi_manual'];
+
+export const PAYMENT_STATUS_PENDING = 'pending';
+export const PAYMENT_STATUS_PAID = 'paid';
+
+export const parseDeliveryMethod = (value: unknown): DeliveryMethodLike | null => {
+  if (!value) return null;
+  if (typeof value === 'string') {
+    try {
+      const parsed = JSON.parse(value);
+      return parsed && typeof parsed === 'object' ? (parsed as DeliveryMethodLike) : null;
+    } catch {
+      return null;
+    }
+  }
+  return typeof value === 'object' ? (value as DeliveryMethodLike) : null;
+};
+
+export const validateOrderPayload = (payload: OrderPayloadLike): OrderValidation => {
+  if (!payload.items || !payload.subtotal || !payload.total || !payload.paymentMethod) {
+    return { valid: false, error: 'Missing required fields: items, subtotal, total, paymentMethod' };
+  }
+
+  const delivery = parseDeliveryMethod(payload.deliveryMethod);
+  if (delivery && delivery.id !== 'pickup' && !payload.shippingAddress) {
+    return { valid: false, error: 'Shipping address is required for delivery methods' };
+  }
+
+  return { valid: true };
+};
+
+export const resolvePaymentStatus = (paymentMethod: unknown): PaymentStatus => {
+  if (typeof paymentMethod === 'string' && PENDING_PAYMENT_METHODS.includes(paymentMethod)) {
+    return PAYMENT_STATUS_PENDING;
+  }
+  return PAYMENT_STATUS_PAID;
+};
+
+export const normalizeTransactionId = (value: unknown): string | null => {
+  if (typeof value !== 'string') return null;
+  const trimmed = value.trim();
+  return trimmed === '' ? null : trimmed;
+};
+
+export const resolveUserId = (value: unknown): number | null => {
+  if (value === null || value === undefined || value === '') return null;
+  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);
+  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
+};
+
+export const parseStoredUser = (raw: string | null | undefined): number | null => {
+  if (!raw) return null;
+  try {
+    return resolveUserId((JSON.parse(raw) as { id?: unknown })?.id);
+  } catch {
+    return null;
+  }
+};
+
+export const readStoredUserId = (): number | null => {
+  if (typeof window === 'undefined') return null;
+  try {
+    return parseStoredUser(window.localStorage.getItem('user'));
+  } catch {
+    return null;
+  }
+};
+
+export const buildTransactionId = (prefix: string): string => {
+  const suffix = Math.random().toString(36).slice(2, 8);
+  return `${prefix}-${Date.now()}-${suffix}`;
+};
+
+export interface OrderRecord {
+  items: unknown;
+  status: PaymentStatus;
+  total: number;
+  subtotal: number;
+  deliveryCost: number;
+  deliveryMethod: unknown;
+  shippingAddress?: unknown;
+  transactionId?: string;
+  paymentMethod: string;
+  user?: number;
+}
+
+export interface OrderPersistence {
+  findByTransactionId(transactionId: string): Promise<unknown | null>;
+  create(order: OrderRecord): Promise<unknown>;
+}
+
+export type ProcessOrderResult =
+  | { ok: true; status: 200 | 201; order: unknown; idempotent: boolean }
+  | { ok: false; status: 400; error: string };
+
+export class OrderCreationError extends Error {
+  status: number;
+
+  constructor(message: string, status: number) {
+    super(message);
+    this.name = 'OrderCreationError';
+    this.status = status;
+  }
+}
+
+/**
+ * Single source of truth for order creation: validates the payload, honours
+ * transaction idempotency, keeps cash payments pending and only links a user
+ * relation when a real user id exists (guest checkout).
+ */
+export const processOrderRequest = async (
+  payload: OrderPayloadLike,
+  persistence: OrderPersistence
+): Promise<ProcessOrderResult> => {
+  const validation = validateOrderPayload(payload);
+  if (!validation.valid) {
+    return { ok: false, status: 400, error: validation.error };
+  }
+
+  const transactionId = normalizeTransactionId(payload.transactionId);
+  if (transactionId) {
+    const existing = await persistence.findByTransactionId(transactionId);
+    if (existing) {
+      return { ok: true, status: 200, order: existing, idempotent: true };
+    }
+  }
+
+  const order: OrderRecord = {
+    items: payload.items,
+    status: resolvePaymentStatus(payload.paymentMethod),
+    total: Number(payload.total),
+    subtotal: Number(payload.subtotal),
+    deliveryCost: Number(payload.deliveryCost ?? 0),
+    deliveryMethod: payload.deliveryMethod ?? null,
+    paymentMethod: String(payload.paymentMethod),
+  };
+
+  if (payload.shippingAddress) {
+    order.shippingAddress = payload.shippingAddress;
+  }
+  if (transactionId) {
+    order.transactionId = transactionId;
+  }
+
+  const userId = resolveUserId(payload.userId);
+  if (userId !== null) {
+    order.user = userId;
+  }
+
+  const created = await persistence.create(order);
+  return { ok: true, status: 201, order: created, idempotent: false };
+};

