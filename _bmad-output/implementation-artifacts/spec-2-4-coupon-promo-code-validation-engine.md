---
title: 'Story 2.4: Coupon & Promo Code Validation Engine'
type: 'feature'
created: '2026-09-29'
status: 'review'
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

**Problem:** Customers cannot redeem promotional discounts through coupon codes, missing opportunities for conversion and customer retention.

**Approach:** Implement a coupon code input field in the cart drawer that validates codes against backend rules (percentage discount, fixed COP amount, or free shipping). Update discount line items, recalculate totals in COP, and display clear success or invalid feedback.

## Boundaries & Constraints

**Always:**
- Validate coupon codes against backend API endpoint.
- Support three coupon types: percentage discount, fixed COP amount, free shipping.
- Recalculate totals in COP format with proper localization.
- Display clear success/error feedback messages.
- Ensure touch targets meet $\ge 48\text{px}$ standard on mobile.
- Use design tokens from globals.css.

**Never:**
- Do not hardcode coupon validation logic; use backend API.
- Do not break existing cart context providers.
- Do not modify backend database migrations or Strapi schema models.
- Do not apply invalid coupons without validation.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid Percentage Coupon | Code "BIENVENIDA10" (10% off) | Success message, 10% discount applied, total recalculated | N/A |
| Valid Fixed Amount Coupon | Code "FIJO5000" ($5.000 COP off) | Success message, $5.000 COP discount applied, total recalculated | N/A |
| Valid Free Shipping Coupon | Code "ENVIOGRATIS" | Success message, shipping cost set to 0 | N/A |
| Invalid Coupon | Code "INVALIDO" | Error message "Código inválido", no discount applied | N/A |
| Expired Coupon | Code "EXPIRADO" | Error message "Código expirado", no discount applied | N/A |
| Already Applied | Same code submitted twice | Error message "Código ya aplicado", no duplicate discount | N/A |

</frozen-after-approval>

## Code Map

- `frontend/src/components/CouponInput.tsx` -- Coupon code input field with validation and feedback.
- `frontend/src/context/CartContext.tsx` -- Add coupon state and discount calculation.
- `frontend/src/components/Cart.tsx` -- Integrate coupon input above order summary.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/components/CouponInput.tsx` -- Build coupon input with validation, loading states, and success/error feedback.
- [x] `frontend/src/context/CartContext.tsx` -- Add coupon state, discount calculation, and coupon actions.
- [x] `frontend/src/components/Cart.tsx` -- Integrate coupon input component above order summary.

**Acceptance Criteria:**
- Given a user is in the cart drawer or checkout summary, when submitting a coupon code (e.g. `"BIENVENIDA10"`), then the system validates the code against backend rules, updates the discount line item, recalculates taxes and final total in COP, and displays clear success or invalid coupon feedback.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm --prefix frontend run lint` -- expected: zero ESLint errors
- `npm --prefix frontend run build` -- expected: successful Next.js Turbopack build without TypeScript or CSS errors

**Manual checks (if no CLI):**
- Test valid coupon codes and verify discount application.
- Test invalid/expired codes and verify error messages.
- Confirm totals recalculate correctly in COP format.
