---
title: 'Story 1.2: Product Card & Catalog Grid with Origin Badging'
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

**Problem:** The storefront lacks product cards with clear inventory origin indicators, shade swatch previews, and Colombian Peso pricing hierarchy. Customers cannot distinguish between local express delivery and national dropshipping items at a glance in the catalog grid.

**Approach:** Implement a responsive ProductCard component with 1:1 aspect ratio Cloudinary-optimized images, explicit stock origin badges (Local Express vs. National Dropshipping), shade swatch preview strips, COP price formatting, and optimistic quick-add micro-buttons. Build a ProductGrid component for catalog layout with responsive breakpoints.

## Boundaries & Constraints

**Always:**
- Use exact badge colors from design tokens: Local Badge `#FCE7ED`/`#B33959`, Dropship Badge `#EAF2EC`/`#2C6E49`.
- Format all prices in Colombian Pesos (COP) as `$XX.XXX COP`.
- Use 1:1 aspect ratio for product images with explicit dimensions to prevent CLS.
- Apply Cloudinary optimization (WebP/AVIF) via Next.js Image component.
- Ensure touch targets meet $\ge 48\text{px}$ standard on mobile.
- Use design tokens from globals.css (Primary `#D45B7A`, Gold `#C89D66`, Text `#2D1B22`, Canvas `#FDF9F7`).

**Never:**
- Do not hardcode product data; fetch from Strapi CMS `api::product` endpoint.
- Do not use placeholder images without proper Cloudinary optimization.
- Do not break existing cart context providers.
- Do not modify backend database migrations or Strapi schema models.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Catalog Render | Viewport width $\ge 1024\text{px}$ | 4-column responsive grid with product cards | Graceful layout adjustment |
| Catalog Render Mobile | Viewport width $< 768\text{px}$ | 2-column grid with touch-friendly cards | Overflow prevention |
| Local Product Card | Product with `sourcing_type: 'local'` | Badge displays `"📦 Envío Exprés Local"` with pink colors | N/A |
| Dropship Product Card | Product with `sourcing_type: 'mastershop_dropship'` | Badge displays `"🌿 Dropshipping Nacional"` with green colors | N/A |
| Image Load Failure | Cloudinary image fails to load | Fallback placeholder or skeleton loader | Logs error, shows fallback |
| Quick Add Click | User taps `"Añadir +"` button | Optimistic visual feedback state, cart updates | Shows error toast if add fails |

</frozen-after-approval>

## Code Map

- `frontend/src/types/product.ts` -- TypeScript definitions for product, variant, shade, and sourcing types.
- `frontend/src/components/ProductCard.tsx` -- Product card component with image, origin badge, swatches, price, and quick-add button.
- `frontend/src/components/ProductGrid.tsx` -- Responsive grid layout component for catalog display.
- `frontend/src/app/category/[slug]/page.tsx` -- Category listing page fetching products from Strapi CMS and rendering ProductGrid.
- `frontend/src/app/page.tsx` -- Homepage featuring featured products grid.

## Tasks & Acceptance

**Execution:**
- [ ] `frontend/src/types/product.ts` -- Create product types including `sourcing_type`, `variants`, `shades`, `price_cop`, and `stock_status`.
- [ ] `frontend/src/components/ProductCard.tsx` -- Build product card with Cloudinary-optimized image, origin badge, shade swatch strip, COP price, and quick-add button with optimistic feedback.
- [ ] `frontend/src/components/ProductGrid.tsx` -- Implement responsive grid with breakpoints (2 cols mobile, 3 cols tablet, 4 cols desktop).
- [ ] `frontend/src/app/category/[slug]/page.tsx` -- Create category listing page fetching products by category slug from Strapi CMS.
- [ ] `frontend/src/app/page.tsx` -- Update homepage to display featured products using ProductGrid.

**Acceptance Criteria:**
- Given a catalog or category listing page, when product cards render, then each card displays a 1:1 aspect ratio Cloudinary-optimized image (WebP/AVIF format with explicit dimensions to avoid layout shift), COP price formatted as `$XX.XXX COP`, and a shade swatch preview strip.
- Given products with different sourcing types, when cards render, then products sourced locally display the badge `"📦 Envío Exprés Local"` (`#FCE7ED` / `#B33959`), while dropshipped items display `"🌿 Dropshipping Nacional"` (`#EAF2EC` / `#2C6E49`).
- Given a user taps the quick-action `"Añadir +"` micro-button, when clicked, then optimistic visual feedback state triggers immediately.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm --prefix frontend run lint` -- expected: zero ESLint errors
- `npm --prefix frontend run build` -- expected: successful Next.js Turbopack build without TypeScript or CSS errors

**Manual checks (if no CLI):**
- Inspect catalog grid on mobile ($375\text{px}$) to confirm 2-column layout and 48px touch targets on quick-add buttons.
- Verify origin badges display correct colors and text for local vs. dropship products.
- Confirm shade swatch preview strips render on product cards.
