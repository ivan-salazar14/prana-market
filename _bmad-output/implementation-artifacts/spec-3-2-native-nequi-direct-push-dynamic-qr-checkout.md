---
title: 'Story 3.2: Native Nequi Direct Push & Dynamic QR Checkout'
type: 'feature'
created: '2026-10-01'
status: 'done'
baseline_commit: 'c1a0aeccd9c48c37c3f53d7ba9f2d34b0a8b0ce5'
route: 'dispatch'
review_loop_iteration: 0
context:
  - _bmad-output/planning-artifacts/ux-designs/ux-prana-market-2026-09-24/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-prana-market-2026-09-24/EXPERIENCE.md
  - _bmad-output/planning-artifacts/architecture/architecture-prana-market-2026-09-24/ARCHITECTURE-SPINE.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Customers want a fast, friction-free payment flow using Nequi on mobile or desktop without typing credit card credentials.

**Approach:** Build a native Nequi direct push & dynamic QR checkout component with a 60-second countdown timer, animated pulse ring, 2-second status polling, confetti celebration on approval, and error recovery options (instant retry or manual transfer / PSE) without losing cart state.

## Boundaries & Constraints

**Always:**
- Accept Colombian phone numbers (10 digits starting with 3).
- Provide dual payment modes: Direct Push notification to Nequi app and Dynamic QR Code.
- Display a 60-second countdown timer with an animated pulse ring during pending status.
- Poll payment status every 2 seconds (`setInterval(checkStatus, 2000)`).
- Render a confetti celebration screen and receipt upon payment approval.
- Ensure touch targets meet $\ge 48\text{px}$ standard on mobile.
- Preserve cart state on rejection or timeout.

**Never:**
- Do not lose cart items if Nequi approval times out or is rejected.
- Do not store raw Nequi PINs or passwords.
- Do not block the user from switching to alternative payment options.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Phone Push Request | Enter "3001234567" & click "Solicitar Aprobación en Nequi" | Direct push sent, 60s countdown starts with animated pulse ring, polls status every 2s | N/A |
| Dynamic QR Request | Toggle to QR tab | Generates dynamic QR code for instant scanning with Nequi app | Fallback to text string if QR fails |
| Approved Payment | Status returns "completed" | Confetti celebration animation, payment receipt, cart cleared | N/A |
| Rejected / Expired | Status returns "expired" or 60s countdown reaches 0 | Error notice displayed, option to retry or switch to PSE / manual transfer | Cart state preserved |
| Invalid Phone | Enter <10 digits or non-numeric | Validation error message "Ingresa un número de celular Nequi válido (10 dígitos)" | Prevent submit |

</frozen-after-approval>

## Code Map

- `frontend/src/components/NequiCheckout.tsx` -- Enhanced Nequi checkout component supporting Direct Push, Dynamic QR, 60s countdown, pulse ring, status polling, and confetti celebration.
- `frontend/src/components/Cart.tsx` -- Integration of NequiCheckout component in cart drawer / checkout flow.
- `frontend/src/app/api/nequi/create-payment/route.ts` -- API handling push request and QR creation.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/components/NequiCheckout.tsx` -- Enhance NequiCheckout with Colombian phone input, Direct Push trigger, 60s countdown timer with pulse ring, 2s status polling, confetti celebration screen, and failure recovery options.
- [x] `frontend/src/components/Cart.tsx` -- Update Cart checkout flow to render NequiCheckout seamlessly with cart totals.

**Acceptance Criteria:**
- Given a customer selects Nequi as payment method and enters their Colombian phone number, when tapping `"Solicitar Aprobación en Nequi"`, then Wompi/Nequi initiates a direct push request, and a checkout modal displays a 60-second countdown with an animated pulse ring while polling payment status every 2 seconds.
- Given payment approval is received, then the UI immediately transitions to a confetti celebration screen and receipt. If timed out or rejected, it provides an instant retry or PSE alternative without losing cart state.

## Verification

**Commands:**
- `npm --prefix frontend run lint` -- expected: zero ESLint errors
- `npm --prefix frontend run build` -- expected: successful Next.js Turbopack build without TypeScript or CSS errors

### Review Findings

- [x] [Review][Decision] Cart.tsx renders ManualNequiCheckout instead of NequiCheckout — resolved: replaced with NequiCheckout component.
- [x] [Review][Patch] Missing Order Creation & Cart Clearing in NequiCheckout [`frontend/src/components/NequiCheckout.tsx:125`]
- [x] [Review][Patch] Potential Unmounted Component State Update in Confetti Timeout [`frontend/src/components/NequiCheckout.tsx:129`]
- [x] [Review][Patch] Missing Dynamic QR Text Fallback & Copy String [`frontend/src/components/NequiCheckout.tsx:360`]
- [x] [Review][Defer] Phone number auto-formatting with spaces during typing [`frontend/src/components/NequiCheckout.tsx:248`] — deferred: cosmetic formatting enhancement


