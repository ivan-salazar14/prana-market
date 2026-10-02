---
title: 'Story 2.2: Dynamic Free Shipping Progress Bar'
type: 'feature'
created: '2026-09-29'
status: 'in-progress'
baseline_commit: 'c1a0aeccd9c48c37c3f53d7ba9f2d34b0a8b0ce5'
route: 'dispatch'
review_loop_iteration: 0
context:
  - _bmad-output/planning-artifacts/ux-designs/ux-prana-market-2026-09-24/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-prana-market-2026-09-24/EXPERIENCE.md
  - _bmad-output/planning-artifacts/architecture/architecture-prana-market-2026-09-24/ARCHITECTure-SPINE.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Customers cannot easily see how close they are to qualifying for free shipping, reducing the incentive to add more items to their cart.

**Approach:** Implement an interactive visual progress bar in the cart drawer that calculates the remaining amount needed to reach the free shipping threshold in COP. Display dynamic copy: "¡Faltan $XX.XXX COP para tu Envío Gratis!" when below threshold, and "🎉 ¡Felicidades! Tienes Envío Gratis a toda Colombia" when threshold is met. Use a smooth CSS gradient from Champagne Gold (`#C89D66`) to Primary Rose (`#D45B7A`).

## Boundaries & Constraints

**Always:**
- Use the configured free shipping threshold from `NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD` (default: COP $100.000).
- Display progress bar with gradient from Gold (`#C89D66`) to Primary (`#D45B7A`).
- Show remaining amount in COP format with proper localization.
- Update progress bar dynamically as items are added/removed.
- Ensure touch targets meet $\ge 48\text{px}$ standard on mobile.
- Use design tokens from globals.css.

**Never:**
- Do not hardcode the free shipping threshold; use environment variable.
- Do not break existing cart context providers.
- Do not modify backend database migrations or Strapi schema models.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Below Threshold | Subtotal $50.000 COP, threshold $100.000 | Progress bar at 50%, copy: "¡Faltan $50.000 COP para tu Envío Gratis!" | N/A |
| At Threshold | Subtotal $100.000 COP, threshold $100.000 | Progress bar at 100%, copy: "🎉 ¡Felicidades! Tienes Envío Gratis a toda Colombia" | N/A |
| Above Threshold | Subtotal $150.000 COP, threshold $100.000 | Progress bar at 100%, copy: "🎉 ¡Felicidades! Tienes Envío Gratis a toda Colombia" | N/A |
| Empty Cart | Subtotal $0 COP | Progress bar at 0%, copy: "¡Faltan $100.000 COP para tu Envío Gratis!" | N/A |

</frozen-after-approval>

## Code Map

- `frontend/src/components/FreeShippingProgress.tsx` -- Progress bar component with gradient and dynamic copy.
- `frontend/src/components/Cart.tsx` -- Integrate progress bar into cart drawer.

## Tasks & Acceptance

**Execution:**
- [ ] `frontend/src/components/FreeShippingProgress.tsx` -- Build progress bar with gradient, dynamic copy, and threshold calculation.
- [ ] `frontend/src/components/Cart.tsx` -- Integrate progress bar above delivery selection section.

**Acceptance Criteria:**
- Given items are in the cart drawer, when subtotal is below the configured threshold (e.g. COP $100.000), then the progress bar shows a smooth CSS gradient from Champagne Gold (`#C89D66`) to Primary Rose (`#D45B7A`) with dynamic copy: `"¡Faltan $XX.XXX COP para tu Envío Gratis!"`.
- Given subtotal meets or exceeds the threshold, when the progress bar renders, then the bar fills to 100% with celebration microcopy: `"🎉 ¡Felicidades! Tienes Envío Gratis a toda Colombia"`.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm --prefix frontend run lint` -- expected: zero ESLint errors
- `npm --prefix frontend run build` -- expected: successful Next.js Turbopack build without TypeScript or CSS errors

**Manual checks (if no CLI):**
- Add items to cart and verify progress bar updates dynamically.
- Confirm gradient colors match Gold (`#C89D66`) to Primary (`#D45B7A`).
- Test threshold crossing behavior and celebration copy.
