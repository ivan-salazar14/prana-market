# Epic 1 Context: Product Discovery & Beauty Catalog Storefront

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enable Colombian beauty shoppers to seamlessly explore, discover, and filter cosmetics through a luxury *Rose & Champagne* storefront featuring hierarchical taxonomy, rich product details, cosmetic attribute filtering, and transparent stock origin (local express delivery vs national dropshipping).

## Stories

- Story 1.1: Design Tokens, Responsive Shell & Category Taxonomy
- Story 1.2: Product Card & Catalog Grid with Origin Badging
- Story 1.3: Interactive Product Detail Page (PDP) with Swatches & Mobile Sticky Bar
- Story 1.4: Typeahead Search & Multi-Attribute Cosmetic Filters

## Requirements & Constraints

- Storefront built with Next.js 16 (App Router, Turbopack, React 19, Tailwind CSS v4, Framer Motion, Lucide Icons).
- Backend headless CMS with Strapi v5 managing `api::product-category` and `api::product` schemas.
- Luxury *Rose & Champagne* aesthetic: Primary (`#D45B7A`), Gold (`#C89D66`), Canvas (`#FDF9F7`), Playfair Display headings, Plus Jakarta Sans body/UI.
- Mobile-first ergonomics: touch targets $\ge 48\text{px}$, sticky bottom bars on PDP.
- Image assets support Cloudinary CDN optimization and Next.js Image with WebP/AVIF formats to prevent layout shift (CLS < 0.05, LCP $\le$ 2.0s).
- Currency and prices strictly formatted in Colombian Pesos (COP): `$XX.XXX COP`.
- Origin badges explicitly distinguish Local Express (`#FCE7ED` / `#B33959`) from National Dropshipping (`#EAF2EC` / `#2C6E49`).

## Technical Decisions

- Decoupled Headless Commerce architecture: Next.js frontend querying Strapi v5 REST API with typed fetch clients.
- Data Schema `api::product-category`: `name`, `slug`, `description`, `parent_category`, `image`, `display_order`, `is_featured`.
- Data Schema `api::product`: `title`, `slug`, `price_cop`, `compare_at_price_cop`, `sourcing_type` (`local` | `mastershop_dropship`), `stock_quantity`, `category`, `brand`, `skin_type`, `finish`, `shades` (JSON array with label, hex_color, image_url), `ingredients`, `usage_guide`, `images`.
- CSS tokens configured in `@theme` block and root CSS variables aligned with Tailwind CSS v4.

## UX & Interaction Patterns

- Editorial luxury aesthetic with warm neutral surfaces and high-contrast typography.
- Micro-interactions with optimistic visual feedback for quick-adds and instant debounced filter/search queries.
- Responsive mobile header with slide-out category taxonomy navigation drawer and persistent search bar.

## Cross-Story Dependencies

- Story 1.1 provides design tokens, responsive shell, and category taxonomy needed by Story 1.2 (catalog grid) and Story 1.3 (PDP).
- Story 1.2 product card components feed into catalog listing and search views in Story 1.4.
