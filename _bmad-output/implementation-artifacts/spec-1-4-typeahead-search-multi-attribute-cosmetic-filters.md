---
title: 'Story 1.4: Typeahead Search & Multi-Attribute Cosmetic Filters'
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

**Problem:** Customers cannot quickly find products matching their specific beauty routine needs (skin type, finish, brand, price range) without browsing through entire categories. The search lacks real-time typeahead suggestions and multi-attribute filtering.

**Approach:** Implement a debounced typeahead search component with instant suggestions showing product thumbnails and prices. Build a filter drawer with cosmetic-specific facets (Brand, Skin Type, Finish, Price Range in COP, In Stock). Integrate search into Navbar and enable dynamic product grid updates without page reload.

## Boundaries & Constraints

**Always:**
- Use debounced input (300ms) to avoid excessive API calls during typing.
- Display product thumbnails and COP prices in typeahead suggestions.
- Support cosmetic-specific filters: Brand, Skin Type, Finish (matte/glow/satin), Price Range (min/max COP), In Stock.
- Update product grid dynamically without full page reload using client-side filtering.
- Ensure touch targets meet $\ge 48\text{px}$ standard on mobile.
- Use design tokens from globals.css (Primary `#D45B7A`, Gold `#C89D66`, Text `#2D1B22`, Canvas `#FDF9F7`).

**Never:**
- Do not hardcode filter options; fetch available brands, skin types, and finishes from Strapi CMS.
- Do not break existing cart context providers.
- Do not modify backend database migrations or Strapi schema models.
- Do not show filter drawer on desktop if not needed (responsive behavior).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Search Input | User types "labial" | After 300ms debounce, typeahead suggestions appear with matching products and thumbnails | If no results, show "No se encontraron productos" |
| Filter Selection | User selects "Finish: Matte" | Product grid filters to show only matte finish products | N/A |
| Price Range | User sets min $10.000 COP, max $50.000 COP | Grid shows products within price range | N/A |
| Multiple Filters | User selects Brand + Skin Type + Price | Grid shows products matching all filters (AND logic) | N/A |
| Clear Filters | User taps "Limpiar filtros" | All filters reset, grid shows all products | N/A |
| Empty Search | User clears search input | Grid shows all products or category-specific products | N/A |

</frozen-after-approval>

## Code Map

- `frontend/src/types/filter.ts` -- TypeScript definitions for filter state and cosmetic filter options.
- `frontend/src/components/SearchBar.tsx` -- Typeahead search component with debounced input and suggestions dropdown.
- `frontend/src/components/FilterDrawer.tsx` -- Slide-over filter drawer with cosmetic-specific facets (Brand, Skin Type, Finish, Price, Stock).
- `frontend/src/components/Navbar.tsx` -- Update Navbar to integrate SearchBar component.
- `frontend/src/app/page.tsx` -- Update homepage to support search and filter state with dynamic grid updates.

## Tasks & Acceptance

**Execution:**
- [ ] `frontend/src/types/filter.ts` -- Create filter types for FilterState, FilterOptions, and cosmetic-specific filter values.
- [ ] `frontend/src/components/SearchBar.tsx` -- Build typeahead search with debounced input, suggestions dropdown with thumbnails/prices, and keyboard navigation.
- [ ] `frontend/src/components/FilterDrawer.tsx` -- Implement filter drawer with Brand, Skin Type, Finish, Price Range (COP), and In Stock filters with Framer Motion animations.
- [ ] `frontend/src/components/Navbar.tsx` -- Integrate SearchBar into Navbar with responsive behavior.
- [ ] `frontend/src/app/page.tsx` -- Add filter state management and dynamic product grid filtering without page reload.

**Acceptance Criteria:**
- Given a user interacts with the search bar or catalog filter drawer, when typing a query or selecting filter facets (Brand, Skin Type, Finish, Price min/max, In Stock), then instant debounced typeahead suggestions appear with product thumbnails and prices.
- Given filters are applied, when the user selects filter options, then the product grid dynamically updates to display matching items without full page reload.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm --prefix frontend run lint` -- expected: zero ESLint errors
- `npm --prefix frontend run build` -- expected: successful Next.js Turbopack build without TypeScript or CSS errors

**Manual checks (if no CLI):**
- Test typeahead search by typing product names and verify suggestions appear after debounce.
- Verify filter drawer opens/closes smoothly on mobile with Framer Motion animations.
- Confirm product grid updates dynamically when filters are applied without page reload.
