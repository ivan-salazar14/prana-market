---
title: 'Story 1.3: Interactive Product Detail Page (PDP) with Swatches & Mobile Sticky Bar'
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

**Problem:** The product detail page lacks interactive shade swatches that update the image gallery, and mobile users cannot easily access purchase actions while scrolling through product information.

**Approach:** Implement an interactive PDP with shade swatch selector that updates the main image gallery, product title, stock availability, and screen reader announcements. Add a mobile sticky bottom bar that appears when scrolling past the hero area, displaying the selected shade thumbnail and dual CTAs: "Añadir al Carrito" and "⚡ Pagar con Nequi".

## Boundaries & Constraints

**Always:**
- Use Nequi brand colors for the Nequi CTA: `#20002C` (brand) / `#FF2A82` (accent).
- Ensure shade swatch selection updates the main image gallery with the correct shade-specific image.
- Provide `aria-live` announcements for screen readers when shade selection changes.
- Maintain 48px touch targets on mobile for all interactive elements in the sticky bar.
- Use design tokens from globals.css (Primary `#D45B7A`, Gold `#C89D66`, Text `#2D1B22`, Canvas `#FDF9F7`).
- Display ingredients and usage guides if available from Strapi CMS.

**Never:**
- Do not hardcode product data; fetch from Strapi CMS `api::product` endpoint.
- Do not break existing cart context providers.
- Do not modify backend database migrations or Strapi schema models.
- Do not show the sticky bar on desktop viewports (only mobile).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| PDP Load | Product with shades | Image gallery displays default shade, swatch selector shows all available shades | N/A |
| Shade Selection | User taps a shade swatch | Main image updates to shade-specific image, title updates with shade name, stock status refreshes, aria-live announcement fires | If shade image missing, show fallback |
| Scroll Past Hero | User scrolls down on mobile | Sticky bottom bar appears with selected shade thumbnail and dual CTAs | Bar stays fixed at bottom |
| Scroll to Top | User scrolls back to top on mobile | Sticky bar remains visible for easy access | N/A |
| Out of Stock Shade | User selects shade with 0 stock | Swatch shows disabled state, add to cart button disabled, shows "Agotado" message | N/A |
| Desktop View | Viewport width $\ge 1024\text{px}$ | Sticky bar does not appear, CTAs remain in hero section | N/A |

</frozen-after-approval>

## Code Map

- `frontend/src/components/ShadeSelector.tsx` -- Interactive shade swatch selector with visual feedback and aria-live announcements.
- `frontend/src/components/ImageGallery.tsx` -- Image gallery component that updates based on selected shade.
- `frontend/src/components/PdpStickyBar.tsx` -- Mobile sticky bottom bar with shade thumbnail and dual CTAs.
- `frontend/src/app/product/[slug]/page.tsx` -- Product detail page integrating all components with Strapi CMS data fetch.

## Tasks & Acceptance

**Execution:**
- [ ] `frontend/src/components/ShadeSelector.tsx` -- Build shade swatch selector with selection state, visual feedback, and aria-live announcements.
- [ ] `frontend/src/components/ImageGallery.tsx` -- Implement image gallery that updates images based on selected shade.
- [ ] `frontend/src/components/PdpStickyBar.tsx` -- Create mobile sticky bottom bar with shade thumbnail, "Añadir al Carrito" CTA, and "⚡ Pagar con Nequi" CTA with Nequi brand colors.
- [ ] `frontend/src/app/product/[slug]/page.tsx` -- Update product detail page to integrate shade selector, image gallery, ingredients, usage guide, and sticky bar with scroll detection.

**Acceptance Criteria:**
- Given a customer navigates to a product detail page (`/product/[slug]`), when viewing the PDP, then interactive shade swatches update the main image gallery, product title, stock availability, and `aria-label` screen reader announcements.
- Given the user scrolls past the hero area on mobile, when scrolling, then a fixed bottom bar (`pdp-sticky-bar`) displays the selected shade thumbnail and dual CTA cluster: Primary `"Añadir al Carrito"` and brand purple `"⚡ Pagar con Nequi"` (`#20002C` / `#FF2A82`).

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm --prefix frontend run lint` -- expected: zero ESLint errors
- `npm --prefix frontend run build` -- expected: successful Next.js Turbopack build without TypeScript or CSS errors

**Manual checks (if no CLI):**
- Test shade selection on mobile viewport to confirm image gallery updates and aria-live announcements work.
- Verify sticky bar appears when scrolling past hero on mobile and hides on desktop.
- Confirm Nequi CTA uses correct brand colors (`#20002C` / `#FF2A82`).
