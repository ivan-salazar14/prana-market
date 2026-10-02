---
title: 'Story 2.1: Persistent Slide-Over Cart Drawer with Hybrid Sourcing Grouping'
type: 'feature'
created: '2026-09-29'
status: 'in-progress'
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

**Problem:** The cart drawer lacks persistence across sessions and does not clearly communicate hybrid fulfillment when customers mix local express items with national dropshipping items. Customers cannot see how their packages will arrive before checkout.

**Approach:** Implement a persistent slide-over cart drawer with localStorage synchronization and React Context state management. Group cart items by sourcing type into visual delivery cards: "📦 Envío Exprés Local (1-2 días)" for local items and "🌿 Envío Nacional Dropshipping (3-5 días)" for dropshipped items. Use Framer Motion spring animations for smooth transitions.

## Boundaries & Constraints

**Always:**
- Persist cart state to localStorage on every add/remove/update operation.
- Use Framer Motion spring animations for drawer open/close transitions.
- Group items by `sourcing_type` (local vs. mastershop_dropship) with clear visual separation.
- Display delivery time estimates: Local (1-2 días), Dropshipping (3-5 días).
- Ensure touch targets meet $\ge 48\text{px}$ standard on mobile.
- Use design tokens from globals.css (Primary `#D45B7A`, Gold `#C89D66`, Text `#2D1B22`, Canvas `#FDF9F7`).

**Never:**
- Do not break existing cart context providers; enhance them with localStorage persistence.
- Do not modify backend database migrations or Strapi schema models.
- Do not lose cart data on page refresh or browser close.
- Do not show empty grouping cards if a sourcing type has no items.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Cart Open | User clicks cart icon | Drawer slides open with spring animation, items grouped by sourcing type | N/A |
| Add Local Item | User adds local product | Item added to local group, cart saved to localStorage | N/A |
| Add Dropship Item | User adds dropship product | Item added to dropship group, cart saved to localStorage | N/A |
| Mixed Cart | Cart has both sourcing types | Two delivery cards display: Local (1-2 días) and Dropship (3-5 días) | N/A |
| Page Refresh | Browser refresh | Cart restored from localStorage with all items and groupings | N/A |
| Empty Cart | Cart has no items | Empty state message displayed, no grouping cards | N/A |
| Remove Item | User removes item | Item removed from appropriate group, cart saved to localStorage | N/A |

</frozen-after-approval>

## Code Map

- `frontend/src/context/CartContext.tsx` -- Update cart context with localStorage persistence and sourcing type tracking.
- `frontend/src/components/Cart.tsx` -- Update cart drawer with hybrid sourcing grouping cards and Framer Motion animations.
- `frontend/src/types/cart.ts` -- Cart item types with sourcing type field.

## Tasks & Acceptance

**Execution:**
- [ ] `frontend/src/types/cart.ts` -- Create cart item types with `sourcing_type` field.
- [ ] `frontend/src/context/CartContext.tsx` -- Add localStorage persistence, sourcing type tracking, and hybrid grouping logic.
- [ ] `frontend/src/components/Cart.tsx` -- Update cart drawer to display items grouped by sourcing type with delivery time estimates and spring animations.

**Acceptance Criteria:**
- Given a customer adds products or clicks the cart bag icon, when the drawer opens, then Framer Motion spring animations transition the drawer smoothly, and cart state is synchronized with `localStorage` and React Context.
- Given the cart contains mixed sourcing types, when items are displayed, then items are cleanly partitioned into two visual delivery cards: `"📦 Envío Exprés Local (1-2 días)"` and `"🌿 Envío Nacional Dropshipping (3-5 días)"`.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm --prefix frontend run lint` -- expected: zero ESLint errors
- `npm --prefix frontend run build` -- expected: successful Next.js Turbopack build without TypeScript or CSS errors

**Manual checks (if no CLI):**
- Add local and dropship products to cart, verify grouping cards display correctly.
- Refresh browser, confirm cart items persist from localStorage.
- Test drawer spring animations on mobile and desktop.
