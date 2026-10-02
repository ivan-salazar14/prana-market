---
title: 'Story 2.3: One-Click Quantity & Variant Adjustment with Optimistic UI'
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

**Problem:** Cart quantity adjustments feel sluggish due to lack of immediate visual feedback. Users cannot see subtotal updates instantly, and there's no way to undo accidental item removals.

**Approach:** Implement optimistic UI updates for quantity changes with zero-millisecond visual feedback. Add Framer Motion animated transitions for smooth quantity changes. Include `aria-live="polite"` announcements for assistive technologies. When item quantity hits zero, show an undo toast option to restore the item.

## Boundaries & Constraints

**Always:**
- Update item count and cart subtotals optimistically (immediate visual feedback).
- Use Framer Motion for animated transitions on quantity changes.
- Add `aria-live="polite"` announcements for screen readers.
- Show undo toast when item quantity reaches zero.
- Ensure touch targets meet $\ge 48\text{px}$ standard on mobile.
- Use design tokens from globals.css.

**Never:**
- Do not break existing cart context providers.
- Do not modify backend database migrations or Strapi schema models.
- Do not remove items permanently without undo option when quantity hits zero.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Increment Quantity | User taps `+` button | Quantity increases immediately with animation, subtotal updates optimistically | N/A |
| Decrement Quantity | User taps `-` button (qty > 1) | Quantity decreases immediately with animation, subtotal updates optimistically | N/A |
| Decrement to Zero | User taps `-` button (qty = 1) | Item removed with animation, undo toast appears with 5-second timeout | N/A |
| Undo Removal | User taps undo toast | Item restored to cart with original quantity | N/A |
| Undo Timeout | User does not tap undo | Toast disappears after 5 seconds, item remains removed | N/A |

</frozen-after-approval>

## Code Map

- `frontend/src/components/Cart.tsx` -- Add optimistic UI updates, Framer Motion animations, aria-live announcements, and undo toast functionality.

## Tasks & Acceptance

**Execution:**
- [ ] `frontend/src/components/Cart.tsx` -- Add optimistic UI updates with immediate visual feedback, Framer Motion animations, aria-live announcements, and undo toast for item removal.

**Acceptance Criteria:**
- Given items exist in the cart, when the user taps `+` or `-` buttons or removes an item, then item count and cart subtotals update optimistically in zero milliseconds with animated transitions and `aria-live="polite"` announcements for assistive technologies.
- Given an item quantity hits zero, when the removal occurs, then the item is removed with an undo toast option.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm --prefix frontend run lint` -- expected: zero ESLint errors
- `npm --prefix frontend run build` -- expected: successful Next.js Turbopack build without TypeScript or CSS errors

**Manual checks (if no CLI):**
- Test quantity increment/decrement with immediate visual feedback.
- Verify animated transitions on quantity changes.
- Confirm undo toast appears when quantity hits zero.
- Test undo functionality restores item correctly.
