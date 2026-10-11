# Epic 7 Context: Instagram Social Commerce & Lead Acquisition Engine

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permite enlazar el catálogo de productos de Prana Market con Instagram Shopping, automatizar la captación de usuarios desde comentarios y mensajes directos (DMs) de Instagram, otorgar incentivos de primer registro y llevar un registro/log centralizado de leads de redes sociales en Strapi CMS, así como desplegar pruebas sociales interactivas (UGC y comentarios de Instagram) en la tienda online para potenciar la confianza y conversión.

## Stories

- Story 7.1: Instagram Catalog Sync & Meta Product Feed Generation
- Story 7.2: Instagram DM & Comment Automated Lead Capture (Meta Graph API)
- Story 7.3: Social Lead Logging & Acquisition Analytics in Strapi (`api::social-lead`)
- Story 7.4: Social Landing & First-Purchase Incentive Auto-Apply
- Story 7.5: Interactive Instagram Comments & Social Proof Component on Storefront

## Requirements & Constraints

- Product feed must output XML compliant with Meta Commerce Manager specifications in COP with UTM tags (`utm_source=instagram`).
- Automated response system via Meta Graph API / webhooks capturing leads from DMs and comments.
- Centralized tracking in Strapi (`api::social-lead`) recording username, channel, discount issued, and conversion status.
- Front-end promotion auto-apply (`BIENVENIDA10`) when landing from Instagram campaigns.
- Social Proof UGC component displaying real moderated Instagram comments, author handles, timestamps, and media thumbnails on PDP / storefront.
- Responsive mobile deep-linking to Instagram app / web.
- Administrative moderation control in Strapi CMS for UGC visibility.
- Storefront UI must adhere to WCAG AA contrast standards, skeleton screen loading states, and CLS < 0.05.

## Technical Decisions

- Backend: Strapi CMS with custom routes, controllers, and services in `backend/src/api/` (such as `product` and `social-lead`).
- Frontend: Next.js 16 (App Router) in `frontend/src/` with React components, design tokens, and context-driven cart state (`CartContext.tsx`).
- Environment variables: `FRONTEND_URL`, `META_WEBHOOK_VERIFY_TOKEN`, `META_PAGE_ACCESS_TOKEN`.
- Public Strapi endpoint or custom API to provide moderated Instagram comments/social proof feed for storefront consumption.

## UX & Interaction Patterns

- Seamless transition from Instagram into storefront with discount auto-applied.
- Social proof section on Product Detail Page (PDP) and storefront with user cards, rating badges, timestamp, verified purchase/interaction tags, and "Ver en Instagram" button.
- Smooth skeleton loaders preventing layout shift (CLS < 0.05) while fetching social proof data.

## Cross-Story Dependencies

- Story 7.5 consumes data generated or managed via Strapi CMS (extending `api::social-lead` or providing Instagram social proof content type/endpoint) and integrates with the PDP in `frontend/src/app/product/[id]/page.tsx` or `frontend/src/components/`.
- Stories 7.1, 7.2, 7.3, and 7.4 provide the backend catalog, lead tracking, and cart promo foundations.
