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

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

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
- [x] `frontend/src/components/Cart.tsx` -- Allow guest checkout for cash on delivery and send a stable `transactionId` -- Guest orders were still blocked with `"Debes iniciar sesión"`.
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
- Guest checkout guards were still present in cash (`efectivo`) and manual Nequi flows and blocked checkout with `"Debes iniciar sesión"`; both now read the user id defensively (`readStoredUserId`, malformed JSON falls back to guest) and send a stable per-mount `transactionId`.
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
