---
title: 'Story 3.1: DANE Colombian Address Hierarchy & Tiered Shipping Selection'
type: 'feature'
created: '2026-10-01'
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

**Problem:** Customers need a reliable, standard Colombian address input system with cascading department-to-municipality selectors (DANE standard) and clear tiered shipping options with localized delivery time estimates.

**Approach:** Implement a DANE Colombian cities API route with fallback dataset covering major departments and municipalities (Antioquia, Bogotá D.C., Valle del Cauca, Cundinamarca, Atlántico, Santander, etc.). Enhance the `ShippingForm` component with cascading department-municipality selectors, neighborhood validation, and clear shipping tier selection with delivery timeframes.

## Boundaries & Constraints

**Always:**
- Use DANE standard department and municipality hierarchy.
- Provide full fallback data in `/api/cities` if Strapi CMS is unreachable.
- Support 3 tiered delivery methods: Recogida en tienda (COP $0, 0 días), Domicilio local (COP $5.000, 1 día hábil), Domicilio regional/nacional (COP $10.000, 2 días hábiles).
- Recalculate shipping costs and totals in COP.
- Ensure touch targets meet $\ge 48\text{px}$ standard on mobile.
- Use design tokens from globals.css.

**Never:**
- Do not allow selecting a municipality before selecting a department.
- Do not hardcode raw inputs without department validation.
- Do not break existing cart state or checkout delivery selection.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Select Department | Choose "Antioquia" | City dropdown auto-filters to Antioquia municipalities (Medellín, Envigado, Itagüí, etc.) | N/A |
| Select Municipality | Choose "Medellín" | City saved, address valid for local/regional tier | N/A |
| Change Department | Change from Antioquia to Cundinamarca | City selection reset, filtered to Cundinamarca cities | N/A |
| API Failure | Strapi CMS offline | `/api/cities` uses built-in DANE dataset fallback | Transparent fallback |
| Form Validation | Missing required fields | Highlight missing fields with error messages | Prevent submit |

</frozen-after-approval>

## Code Map

- `frontend/src/app/api/cities/route.ts` -- API endpoint serving Colombian departments and municipalities (with Strapi proxy + DANE fallback).
- `frontend/src/components/ShippingForm.tsx` -- Cascading department & municipality selector with validation and address saving.
- `frontend/src/components/Cart.tsx` -- Tiered shipping selection with delivery estimates and DANE integration.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/app/api/cities/route.ts` -- Create DANE cities API route with robust offline dataset fallback.
- [x] `frontend/src/components/ShippingForm.tsx` -- Update ShippingForm with cascading dropdowns, field validation, and clean design tokens.
- [x] `frontend/src/components/Cart.tsx` -- Ensure tiered shipping options (Recoger en tienda, Domicilio local, Domicilio regional) display accurate costs and delivery timeframes.

**Acceptance Criteria:**
- Given a customer is in the checkout address step, when selecting a Department, then the Municipality dropdown auto-filters to valid DANE municipalities and shipping rates update accordingly.
- Given a customer selects a delivery preference (Recogida Gratis, Local Exprés COP $5.000, o Nacional COP $10.000), then delivery day windows are displayed clearly and cart totals reflect shipping costs accurately.

## Verification

**Commands:**
- `npm --prefix frontend run lint` -- expected: zero ESLint errors
- `npm --prefix frontend run build` -- expected: successful Next.js Turbopack build without TypeScript or CSS errors

