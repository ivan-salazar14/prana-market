---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-prana-market-2026-09-24/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-prana-market-2026-09-24/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-prana-market-2026-09-24/EXPERIENCE.md
  - _bmad-output/planning-artifacts/addendum.md
---

# prana-market - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for prana-market, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-CAT-01: Multi-Brand & Category Taxonomy (Hierarchical category tree: Rostro, Ojos, Labios, Skincare, Accesorios, Sets with multi-brand filtering).
FR-CAT-02: Rich Product Detail Page (PDP) (High-resolution image galleries, shade/color variant swatches, ingredients list, usage guides, and customer reviews).
FR-CAT-03: Inventory Origin Badge (Explicit indicator if product ships via Express Local Delivery or National Dropshipping).
FR-CAT-04: Smart Search & Filters (Typeahead search, filters by brand, skin type, finish matte/glow, price range in COP, and in-stock availability).
FR-CART-01: Persistent Slide-Over Cart (High-speed drawer cart accessible across all pages with real-time state persistence in localStorage and React Context).
FR-CART-02: Dynamic Shipping Progress Bar (Visual threshold indicator with animated gradient progress toward free shipping threshold).
FR-CART-03: One-Click Quantity & Variant Adjustment (Instant quantity toggling, variant switching, and removal without page reload).
FR-CART-04: Coupon & Promo Code Engine (Support for percentage, fixed COP discounts, and promotional coupons).
FR-PAY-01: Nequi Direct Checkout Flow (Native Nequi payment integration via Wompi API allowing seamless phone-number push approval or dynamic QR code).
FR-PAY-02: Comprehensive Colombian Payment Gateway (Full integration with Wompi supporting PSE, Credit/Debit cards, Bancolombia transfer, and cash networks Efecty/Baloto).
FR-PAY-03: Stripe International Backup (Dual-gateway failover and international card acceptance in COP currency).
FR-PAY-04: Automated Webhook Reconciliation (Asynchronous webhook handler for payment settlement with HMAC signature verification, idempotency keys, and instant status updates).
FR-DROP-01: Catalog Import & Mapping (Automated synchronization of products, descriptions, variants, and media assets from Mastershop into Strapi CMS).
FR-DROP-02: Real-Time Stock & Price Sync (Scheduled background workers/cron syncing supplier stock levels and adjusting dynamic margins).
FR-DROP-03: Automated Order Dispatch (Automatic creation of dropshipping orders in Mastershop upon confirmed payment in Prana Market).
FR-DROP-04: Multi-Carrier Tracking Ingestion (Ingestion of tracking numbers and courier links like Servientrega, Coordinadora, Interrapidísimo pushing automated notifications).
FR-LOG-01: Colombian Address Matrix (Hierarchical Department -> Municipality/City -> Neighborhood selector matching DANE standards).
FR-LOG-02: Tiered Delivery Options (Store Pickup Free, Local Urban Express COP $5.000, Regional/National Standard COP $10.000 or calculated carrier rates).
FR-LOG-03: Order Tracking Portal (Public tracking page allowing customers to track order status by Order Number + Email/Phone).
FR-ADM-01: Unified Order Management Dashboard (Centralized Strapi admin dashboard displaying order lifecycle status: pending, paid, processing, shipped, delivered, cancelled).
FR-ADM-02: Dropshipping Status Monitor (Dedicated view for monitoring Mastershop fulfillment sync status, API error logs, and manual override/retry options).
FR-ADM-03: Customer Service & WhatsApp Integration (Floating WhatsApp chat widget and direct order issue resolution shortcuts).

### NonFunctional Requirements

NFR-PERF-01: Largest Contentful Paint (LCP) <= 2.0s on standard mobile 4G connections.
NFR-PERF-02: Cumulative Layout Shift (CLS) < 0.05 across all responsive breakpoints.
NFR-PERF-03: Image optimization pipeline utilizing Cloudinary and Next.js Image with WebP/AVIF formats and responsive sizing.
NFR-UX-01: Mobile-First Ergonomics with sticky bottom action bars on PDP and cart drawer optimized for one-handed thumb interactions.
NFR-UX-02: Modern Beauty Aesthetics with Rose & Champagne Luxury palette, Playfair Display headers, Plus Jakarta Sans UI, and WCAG AA contrast ratios.
NFR-UX-03: Feedback & Micro-animations with instant optimistic UI updates for cart modifications, smooth loading skeletons, and clear validation states.
NFR-SEC-01: PCI-DSS Compliance with zero raw cardholder data stored on Prana Market servers; tokenization handled directly via Wompi / Stripe client SDKs.
NFR-SEC-02: Colombian Habeas Data Compliance (Ley 1581 de 2012) with explicit consent checkboxes for privacy policy, terms of service, and commercial communication.
NFR-SEC-03: Webhook Security with cryptographic HMAC SHA-256 signature verification on all incoming Wompi, Stripe, and Mastershop webhooks.

### Additional Requirements

- AD-1 (Architecture): Single Source of Truth for Orders & Status Orchestration strictly executed within Strapi backend services (`pending` -> `paid` -> `processing` -> `shipped` / `delivered`).
- AD-2 (Architecture): Cryptographic Webhook Verification & Idempotent Payment Settlement using `WOMPI_INTEGRITY_SECRET` and `STRIPE_WEBHOOK_SECRET` with idempotent order transaction check.
- AD-3 (Architecture): Unified Cart with Hybrid Sourcing Partitioning (`sourcing_type`: `"local"` | `"mastershop_dropship"`) preserving `mastershop_id`, `supplier_sku`, and cost.
- AD-4 (Architecture): Asynchronous Mastershop Dispatch & Fault Isolation with error logging in `orders.mastershop_data.error` and retry flag `sync_mastershop: true`.
- AD-5 (Architecture): Client Cart Persistence (`localStorage` + React Context) & DANE Hierarchy Validation (Department -> Municipality -> Neighborhood).
- AD-6 (Architecture): Zero-Cardholder-Data Boundary strictly delegating card PAN/CVV and Nequi credentials to Wompi / Stripe SDKs.
- AD-7 (Architecture): Cloudinary Media Optimization & Next/Image Pipeline using `@strapi/provider-upload-cloudinary` and responsive sizing.
- Tech Stack Foundation: Next.js 16 (App Router, Turbopack, React 19, Tailwind CSS v4, Framer Motion, Lucide Icons) + Strapi v5 (Node.js, PostgreSQL, Node-cron, Nodemailer).

### UX Design Requirements

UX-DR1: Rose & Champagne Luxury Design System & Tokens (Colors: `#D45B7A` Primary, `#C89D66` Secondary Gold, `#2D1B22` Text, `#FDF9F7` Canvas; Typography: Playfair Display + Plus Jakarta Sans; 48px touch targets).
UX-DR2: Product Card Component (`product-card`) with 1:1 aspect ratio image, stock origin badge (`badge-local` / `badge-dropship`), shade swatch mini-strip, COP price hierarchy, and quick add button.
UX-DR3: Persistent Slide-Over Cart Drawer (`cart-drawer`) with spring animations, dynamic free shipping progress bar, optimistic counter updates, and split shipment grouping cards.
UX-DR4: Mobile Sticky Bottom PDP Bar (`pdp-sticky-bar`) with active shade preview and dual CTA cluster ("Añadir al Carrito" and signature purple "⚡ Pagar con Nequi").
UX-DR5: Cascading Colombian DANE Address Selector with department and municipality filtering.
UX-DR6: Nequi Push & Dynamic QR Payment Poller Modal with 60s countdown timer, animated pulse ring, and 2s status polling.
UX-DR7: Public Order Tracking Portal (`/rastreo`) with multi-carrier delivery status (Servientrega, Coordinadora, Interrapidísimo) and direct WhatsApp support CTA.
UX-DR8: Micro-animations & Accessibility Floor (Framer Motion drawer springs, skeleton loaders, WCAG AA compliance, and `aria-live` announcements).

### FR Coverage Map

- FR-CAT-01: Epic 1 - Taxonomía jerárquica de categorías y filtrado multimarca
- FR-CAT-02: Epic 1 - Página de detalle de producto (PDP) con swatches, galería y reseñas
- FR-CAT-03: Epic 1 - Distintivo de origen de inventario (Local Exprés vs. Dropshipping)
- FR-CAT-04: Epic 1 - Búsqueda con typeahead y filtros avanzados
- FR-CART-01: Epic 2 - Carrito slide-over persistente con localStorage y React Context
- FR-CART-02: Epic 2 - Barra dinámica de progreso hacia Envío Gratis
- FR-CART-03: Epic 2 - Ajuste instantáneo de variantes y cantidades en un clic
- FR-CART-04: Epic 2 - Motor de promociones y cupones de descuento
- FR-LOG-01: Epic 3 - Matriz jerárquica de direcciones colombianas bajo estándar DANE
- FR-LOG-02: Epic 3 - Opciones y cálculo de tarifas de entrega escalonadas
- FR-PAY-01: Epic 3 - Flujo de pago optimizado con Nequi Direct Push / QR dinámico
- FR-PAY-02: Epic 3 - Pasarela de pago completa Wompi (PSE, Tarjetas, Bancolombia, Efectivo)
- FR-PAY-03: Epic 3 - Pasarela de respaldo internacional con Stripe
- FR-PAY-04: Epic 3 - Reconciliación asíncrona de webhooks con firma HMAC e idempotencia
- FR-DROP-01: Epic 4 - Ingesta y mapeo automático del catálogo de Mastershop a Strapi
- FR-DROP-02: Epic 4 - Sincronización programada en segundo plano de stock y márgenes
- FR-DROP-03: Epic 4 - Despacho y creación automática de pedidos en Mastershop
- FR-DROP-04: Epic 4 - Ingesta de números de guía y rastreo multitransportadora
- FR-LOG-03: Epic 5 - Portal público de rastreo de pedidos por número y correo/teléfono
- FR-ADM-01: Epic 5 - Panel administrativo unificado de gestión de órdenes en Strapi
- FR-ADM-02: Epic 5 - Monitor de sincronización de dropshipping, errores y reintentos
- FR-ADM-03: Epic 5 - Integración de atención al cliente y soporte vía WhatsApp

## Epic List

### Epic 1: Product Discovery & Beauty Catalog Storefront
Permite a los usuarios descubrir y explorar el catálogo de cosméticos con una experiencia visual editorial *Rose & Champagne Luxury*, filtrar por atributos cosméticos (tono, acabado, tipo de piel, marca), consultar detalles enriquecidos (swatches, ingredientes) y conocer de forma transparente el origen del inventario (Local o Dropshipping).
**FRs covered:** FR-CAT-01, FR-CAT-02, FR-CAT-03, FR-CAT-04

### Epic 2: High-Converting Slide-Over Cart & Promotional Engine
Permite a los compradores interactuar con su bolsa de compras de forma instantánea y persistente (`localStorage`), visualizar su progreso hacia el envío gratis mediante una barra dinámica, aplicar cupones de descuento y visualizar con total transparencia la agrupación de paquetes para envíos híbridos.
**FRs covered:** FR-CART-01, FR-CART-02, FR-CART-03, FR-CART-04

### Epic 3: Frictionless Colombian Checkout & Multi-Gateway Payments
Permite a los clientes completar su compra en pocos pasos seleccionando su municipio DANE y pagando de forma nativa e instantánea con Nequi (Push/QR), Wompi (PSE, Tarjetas, Bancolombia, Efecty) o Stripe, respaldado por un backend seguro con validación HMAC e idempotencia.
**FRs covered:** FR-LOG-01, FR-LOG-02, FR-PAY-01, FR-PAY-02, FR-PAY-03, FR-PAY-04

### Epic 4: Automated Mastershop Dropshipping & Inventory Pipeline
Permite a la plataforma sincronizar de forma automatizada y periódica el catálogo, precios y existencias de Mastershop hacia Strapi CMS, así como enrutar y crear automáticamente las órdenes post-pago hacia el proveedor y recibir las guías de transporte nacional.
**FRs covered:** FR-DROP-01, FR-DROP-02, FR-DROP-03, FR-DROP-04

### Epic 5: Order Tracking, Customer Engagement & Operational Management
Permite a los compradores realizar seguimiento en tiempo real de sus pedidos multiguía e interactuar mediante WhatsApp, mientras dota a los administradores de Prana Market con un panel centralizado de gestión de pedidos y monitoreo de la sincronización de dropshipping en Strapi.
**FRs covered:** FR-LOG-03, FR-ADM-01, FR-ADM-02, FR-ADM-03

### Epic 6: High-Legibility UI & Dark Mode Contrast Standardization
Garantiza la máxima legibilidad y cumplimiento de contraste WCAG AA (≥ 4.5:1) en el Carrito de compras (`Cart.tsx`), páneles de administración (`/admin/dropship-monitor`) y vistas públicas, eliminando fondos oscuros no deseados o legibilidad deficiente por cascadas de modo oscuro.
**NFRs covered:** NFR-UX-02, NFR-UX-03


## Epic 1: Product Discovery & Beauty Catalog Storefront

Permite a los usuarios descubrir y explorar el catálogo de cosméticos con una experiencia visual editorial *Rose & Champagne Luxury*, filtrar por atributos cosméticos (tono, acabado, tipo de piel, marca), consultar detalles enriquecidos (swatches, ingredientes) y conocer de forma transparente el origen del inventario (Local o Dropshipping).

### Story 1.1: Design Tokens, Responsive Shell & Category Taxonomy

As a mobile beauty shopper,
I want to navigate through structured cosmetic categories (*Rostro, Ojos, Labios, Skincare, Accesorios, Sets*) and filter by brand within a luxury *Rose & Champagne* interface,
So that I can easily explore trending beauty collections.

**Acceptance Criteria:**

**Given** a user opens the storefront on mobile or desktop
**When** the page renders
**Then** the design system tokens are applied (Primary `#D45B7A`, Gold `#C89D66`, Canvas `#FDF9F7`, Playfair Display for headings and Plus Jakarta Sans for interface) and touch targets meet the $\ge 48\text{px}$ standard
**And** the category navigation taxonomy displays hierarchical links for all main cosmetic categories and multi-brand filters fetched from Strapi CMS (`api::product-category`)

### Story 1.2: Product Card & Catalog Grid with Origin Badging

As a beauty shopper,
I want to view product cards featuring high-res imagery, clear Colombian Peso pricing, shade swatches, and explicit stock origin indicators,
So that I know immediately whether an item ships locally with express delivery or via national dropshipping before clicking into details.

**Acceptance Criteria:**

**Given** a catalog or category listing page
**When** product cards render
**Then** each card displays a 1:1 aspect ratio Cloudinary-optimized image (WebP/AVIF format with explicit dimensions to avoid layout shift), COP price formatted as `$XX.XXX COP`, and a shade swatch preview strip
**And** products sourced locally display the badge `"📦 Envío Exprés Local"` (`#FCE7ED` / `#B33959`), while dropshipped items display `"🌿 Dropshipping Nacional"` (`#EAF2EC` / `#2C6E49`)
**And** clicking the quick-action `"Añadir +"` micro-button triggers an optimistic visual feedback state

### Story 1.3: Interactive Product Detail Page (PDP) with Swatches & Mobile Sticky Bar

As a mobile shopper,
I want to examine shade swatches, read ingredient and application guides, check reviews, and access a sticky bottom action bar while scrolling,
So that I can select my shade and initiate purchase effortlessly with one hand.

**Acceptance Criteria:**

**Given** a customer navigates to a product detail page (`/product/[slug]`)
**When** viewing the PDP
**Then** interactive shade swatches update the main image gallery, product title, stock availability, and `aria-label` screen reader announcements
**And** scrolling past the hero area reveals a fixed bottom bar (`pdp-sticky-bar`) on mobile displaying the selected shade thumbnail and dual CTA cluster: Primary `"Añadir al Carrito"` and brand purple `"⚡ Pagar con Nequi"` (`#20002C` / `#FF2A82`)

### Story 1.4: Typeahead Search & Multi-Attribute Cosmetic Filters

As a customer,
I want to search with real-time typeahead suggestions and filter by skin type, finish (*matte / glow / satin*), price range in COP, and in-stock status,
So that I can quickly find products matching my specific routine and budget.

**Acceptance Criteria:**

**Given** a user interacts with the search bar or catalog filter drawer
**When** typing a query or selecting filter facets (Brand, Skin Type, Finish, Price min/max, In Stock)
**Then** instant debounced typeahead suggestions appear with product thumbnails and prices
**And** the product grid dynamically updates to display matching items without full page reload

## Epic 2: High-Converting Slide-Over Cart & Promotional Engine

Permite a los compradores interactuar con su bolsa de compras de forma instantánea y persistente (`localStorage`), visualizar su progreso hacia el envío gratis mediante una barra dinámica, aplicar cupones de descuento y visualizar con total transparencia la agrupación de paquetes para envíos híbridos.

### Story 2.1: Persistent Slide-Over Cart Drawer with Hybrid Sourcing Grouping

As a beauty shopper,
I want a slide-over drawer cart that opens smoothly from any page, persists my items in `localStorage`, and groups products into clear fulfillment cards when mixing local and dropshipped items,
So that I understand exactly how my packages will arrive without surprises at checkout.

**Acceptance Criteria:**

**Given** a customer adds products or clicks the cart bag icon
**When** the drawer opens
**Then** Framer Motion spring animations transition the drawer smoothly, and cart state is synchronized with `localStorage` and React Context
**And** if the cart contains mixed sourcing types, items are cleanly partitioned into two visual delivery cards: `"📦 Envío Exprés Local (1-2 días)"` and `"🌿 Envío Nacional Dropshipping (3-5 días)"`

### Story 2.2: Dynamic Free Shipping Progress Bar

As a customer,
I want to see an interactive visual progress bar calculating how much money in COP I need to reach the free shipping threshold,
So that I am incentivized to add more products to unlock free nationwide delivery.

**Acceptance Criteria:**

**Given** items are in the cart drawer
**When** subtotal is below the configured threshold (e.g. COP $100.000)
**Then** the progress bar shows a smooth CSS gradient from Champagne Gold (`#C89D66`) to Primary Rose (`#D45B7A`) with dynamic copy: `"¡Faltan $XX.XXX COP para tu Envío Gratis!"`
**And** when subtotal meets or exceeds the threshold, the bar fills to 100% with celebration microcopy: `"🎉 ¡Felicidades! Tienes Envío Gratis a toda Colombia"`

### Story 2.3: One-Click Quantity & Variant Adjustment with Optimistic UI

As a shopper,
I want to increase/decrease item counts or adjust variant shades directly in the cart drawer with immediate subtotal recalculation,
So that I can adjust my basket effortlessly without lag or full-page spinners.

**Acceptance Criteria:**

**Given** items exist in the cart
**When** the user taps `+` or `-` buttons or removes an item
**Then** item count and cart subtotals update optimistically in zero milliseconds with animated transitions and `aria-live="polite"` announcements for assistive technologies
**And** if an item quantity hits zero, the item is removed with an undo toast option

### Story 2.4: Coupon & Promo Code Validation Engine

As a customer,
I want to enter promotional coupon codes (percentage discount, fixed COP amount, or free shipping voucher),
So that I can redeem discounts on my purchase.

**Acceptance Criteria:**

**Given** a user is in the cart drawer or checkout summary
**When** submitting a coupon code (e.g. `"BIENVENIDA10"`)
**Then** the system validates the code against backend rules, updates the discount line item, recalculates taxes and final total in COP, and displays clear success or invalid coupon feedback

## Epic 3: Frictionless Colombian Checkout & Multi-Gateway Payments

Permite a los clientes completar su compra en pocos pasos seleccionando su municipio DANE y pagando de forma nativa e instantánea con Nequi (Push/QR), Wompi (PSE, Tarjetas, Bancolombia, Efecty) o Stripe, respaldado por un backend seguro con validación HMAC e idempotencia.

### Story 3.1: DANE Colombian Address Hierarchy & Tiered Shipping Selection

As a Colombian shopper,
I want to select my Department and Municipality from a cascading DANE standard selector and choose my delivery method (Recogida en tienda, Envío Local $5.000 COP, o Nacional $10.000 COP),
So that my shipping costs are calculated accurately and my order arrives at the correct Colombian municipality.

**Acceptance Criteria:**

**Given** a customer is in the checkout address step
**When** selecting a Department
**Then** the Municipality dropdown auto-filters to valid DANE municipalities and shipping rates update accordingly
**And** the customer can select their delivery preference (Recogida Gratis, Local Exprés COP $5.000, o Nacional COP $10.000) with estimated delivery day windows displayed clearly

### Story 3.2: Native Nequi Direct Push & Dynamic QR Checkout

As a mobile beauty shopper,
I want to checkout by entering my Nequi phone number and approving a push notification on my Nequi app or scanning a dynamic QR code,
So that I can complete my purchase in under 45 seconds without entering card credentials.

**Acceptance Criteria:**

**Given** a customer selects Nequi as payment method and enters their Colombian phone number
**When** tapping `"Solicitar Aprobación en Nequi"`
**Then** Wompi initiates a direct push request, and a checkout modal displays a 60-second countdown with an animated pulse ring while polling payment status every 2 seconds
**And** on payment approval, the UI immediately transitions to a confetti celebration screen and receipt. If timed out or rejected, it provides an instant retry or PSE alternative without losing cart state

### Story 3.3: Comprehensive Wompi Gateway (PSE, Cards, Bancolombia & Cash Networks)

As a Colombian customer,
I want to pay using PSE (any Colombian bank), Credit/Debit cards, Bancolombia Transfer, or cash networks (Efecty, Baloto, SuRed),
So that I have full flexibility with local payment methods.

**Acceptance Criteria:**

**Given** a customer chooses Wompi gateway on checkout
**When** selecting PSE, Card, Bancolombia, or Cash voucher
**Then** Wompi SDK handles the tokenization / bank redirect securely (zero raw card data touches Prana servers, complying with PCI-DSS)
**And** for cash payments (Efecty/Baloto), a downloadable and printable payment reference PIN is generated with expiration instructions

### Story 3.4: International Card Checkout via Stripe Backup Gateway

As an international shopper or buyer with a non-Colombian card,
I want to pay using Stripe in Colombian Pesos (COP),
So that my transaction is processed smoothly without regional bank declines.

**Acceptance Criteria:**

**Given** a user selects International Card checkout
**When** submitting card details via Stripe Elements
**Then** the payment is processed securely in COP currency via Stripe API, handling 3D-Secure authentication when required by the issuing bank

### Story 3.5: Cryptographic Webhook Reconciliation & Idempotent Payment Settlement

As a platform operator and customer,
I want all payment webhooks to be verified with HMAC SHA-256 signatures and settled idempotently in Strapi CMS,
So that order status transitions to `'paid'`, duplicate charges are prevented, and confirmation emails are dispatched automatically.

**Acceptance Criteria:**

**Given** an incoming webhook from Wompi (`/api/payment/wompi-webhook`) or Stripe (`/api/payment/stripe-webhook`)
**When** the payload is received
**Then** the backend computes and verifies the cryptographic HMAC signature (`WOMPI_INTEGRITY_SECRET` / `STRIPE_WEBHOOK_SECRET`)
**And** the order state machine checks `orders.transactionId` and idempotently transitions the order status to `'paid'`, sends confirmation emails via Nodemailer, and schedules dropshipping dispatch. Duplicate webhook calls respond with HTTP 200 without duplicate execution

## Epic 4: Automated Mastershop Dropshipping & Inventory Pipeline

Permite a la plataforma sincronizar de forma automatizada y periódica el catálogo, precios y existencias de Mastershop hacia Strapi CMS, así como enrutar y crear automáticamente las órdenes post-pago hacia el proveedor y recibir las guías de transporte nacional.

### Story 4.1: Mastershop Catalog Ingestion & Schema Mapping Client

As a store administrator,
I want an integration client in Strapi that maps products, variant descriptions, images, and supplier costs from Mastershop API into Strapi with automated margin rules,
So that we can curate and expand our beauty catalog effortlessly without manual data entry.

**Acceptance Criteria:**

**Given** valid Mastershop API credentials (`MASTERSHOP_API_KEY`)
**When** the catalog import service runs
**Then** products and variant lines are ingested into Strapi (`api::product`), mapping `mastershop_id`, `supplier_sku`, and supplier base cost, with prices calculated using automated markup formulas in COP
**And** media assets are uploaded and optimized via Cloudinary CDN (`@strapi/provider-upload-cloudinary`)

### Story 4.2: Automated Background Stock & Dynamic Price Synchronization

As an operations manager,
I want a scheduled background worker (`node-cron`) in Strapi that polls Mastershop inventory levels and updates product availability,
So that customers never purchase out-of-stock dropshipped cosmetics.

**Acceptance Criteria:**

**Given** active dropshipped products in Strapi CMS
**When** the scheduled cron job triggers (e.g., every 30 minutes)
**Then** the service queries supplier stock levels from Mastershop, updates `strapi::product.dropship_stock`, and automatically marks products as inactive/out-of-stock if supplier stock reaches zero

### Story 4.3: Automated Post-Payment Dropship Order Forwarding & Fault Isolation

As a platform operator,
I want confirmed paid orders containing dropshipped products to automatically trigger fulfillment order creation in Mastershop API (`POST /api/orders/create`),
So that supplier fulfillment begins immediately after customer checkout without risking payment transaction state.

**Acceptance Criteria:**

**Given** an order transitions to `'paid'` in Strapi
**When** the order contains items with `sourcing_type == 'mastershop_dropship'`
**Then** Strapi asynchronously calls Mastershop API to generate the dropshipping order, storing `mastershop_order_id` in `orders.mastershop_data`
**And** if the supplier API returns a transient error or timeout, the payment status remains intact, error details are logged in `orders.mastershop_data.error`, and `sync_mastershop` is flagged as `true` for automatic retry or manual admin resolution

### Story 4.4: Carrier Guide Ingestion & Automated Customer Shipment Notifications

As a customer,
I want to receive automated notifications with my courier tracking guide (Servientrega, Coordinadora, Interrapidísimo, Envia) as soon as Mastershop dispatches my package,
So that I can track national transit progress in real-time.

**Acceptance Criteria:**

**Given** Mastershop assigns a carrier tracking guide to a dispatched order
**When** the tracking sync worker runs or receives the dispatch update
**Then** Strapi updates `orders.tracking_number`, `orders.tracking_url`, and sets `shipping_status` to `'shipped'`
**And** an automated shipment notification email and WhatsApp alert are dispatched to the customer with direct carrier tracking links

## Epic 5: Order Tracking, Customer Engagement & Operational Management

Permite a los compradores realizar seguimiento en tiempo real de sus pedidos multiguía e interactuar mediante WhatsApp, mientras dota a los administradores de Prana Market con un panel centralizado de gestión de pedidos y monitoreo de la sincronización de dropshipping en Strapi.

### Story 5.1: Public Customer Order Tracking Portal (`/rastreo`)

As a beauty buyer,
I want to track my order progress on a public tracking page using my Order Number and Email/Phone,
So that I can see live status milestones (*En Preparación, Despachado, En Camino, Entregado*) and national courier tracking links.

**Acceptance Criteria:**

**Given** a customer navigates to `/rastreo` or opens a link from their order email
**When** entering their Order ID and registered phone/email
**Then** the portal displays order status milestones, package breakdown (Local Express vs. Mastershop), and clickable carrier tracking links (Servientrega, Coordinadora, Interrapidísimo)

### Story 5.2: Centralized Strapi Order Lifecycle Dashboard

As a store administrator,
I want a unified admin dashboard in Strapi displaying all orders, status transitions (`pending` $\rightarrow$ `paid` $\rightarrow$ `processing` $\rightarrow$ `shipped` $\rightarrow$ `delivered`), shipping details, and transaction IDs,
So that I can orchestrate fulfillment, generate packing slips, and manage local express deliveries.

**Acceptance Criteria:**

**Given** an authenticated admin in Strapi (`/admin`)
**When** viewing the Orders collection (`api::order`)
**Then** orders display formatted totals in COP, payment statuses, delivery addresses, and actionable status update buttons

### Story 5.3: Mastershop Dropshipping Sync Monitor & Manual Override

As an operations manager,
I want a dedicated admin view in Strapi showing Mastershop synchronization logs, failed order dispatches, and manual retry buttons,
So that I can resolve API exceptions or supplier stock mismatches without database intervention.

**Acceptance Criteria:**

**Given** an order marked with `sync_mastershop == true` or containing an error in `orders.mastershop_data.error`
**When** the admin accesses the Dropshipping Status Monitor
**Then** the failure reason is highlighted and a `"Reintentar Despacho a Mastershop"` button allows immediate reprocessing

### Story 5.4: WhatsApp Customer Service Integration & Support Shortcuts

As a beauty customer,
I want a floating WhatsApp chat widget on the storefront and pre-filled WhatsApp support links on order confirmation and tracking screens,
So that I can get quick assistance with shade advice or order queries.

**Acceptance Criteria:**

**Given** a customer is browsing any page or viewing their order receipt
**When** clicking the WhatsApp support button
**Then** it opens WhatsApp with a pre-filled message including context (e.g. `"Hola Prana Market, tengo una consulta sobre mi pedido #PM-8921"`)

## Epic 6: High-Legibility UI & Dark Mode Contrast Standardization

Permite garantizar una experiencia visual accesible y legible (cumpliendo con estándares WCAG AA $\ge 4.5:1$ de contraste) tanto en el carrito de compras como en los páneles administrativos y vistas públicas, eliminando fondos oscuros/negros no deseados o textos blancos ilegibles causados por la cascada de modo oscuro.

### Story 6.1: Slide-Over Cart Drawer (`Cart.tsx`) High-Legibility & Theme Refactor

As a mobile beauty shopper,
I want the cart drawer to display clean, high-contrast text, clear delivery options, and consistent Rose & Champagne luxury backgrounds regardless of OS dark mode settings,
So that prices, instructions, and payment CTAs are easily legible.

**Acceptance Criteria:**

**Given** a customer opens the slide-over cart drawer (`Cart.tsx`)
**When** OS dark mode is active or system theme cascades
**Then** background elements maintain clean luxury backgrounds (`bg-brand-background` or high-contrast white `#FFFFFF` / warm nude `#FDF9F7`) without pitch-black `dark:bg-zinc-950` contrast drops
**And** all text labels, item titles, prices, step instructions, and payment buttons achieve a contrast ratio $\ge 4.5:1$ against their backdrops.

### Story 6.2: Admin & Dropship Monitoring Dashboard Legibility Clean-up

As a store administrator,
I want the admin dashboard and dropship status monitor (`/admin/dropship-monitor`, `/admin/orders`) to feature high-contrast data tables, badges, and card containers,
So that operational metrics, Mastershop sync logs, and order statuses are perfectly legible without dark backdrop clashing.

**Acceptance Criteria:**

**Given** an admin accesses `/admin/dropship-monitor` or `/admin/orders`
**When** viewing data tables, log drawers, and action cards
**Then** text, badges, and JSON log overlays render with explicit high-contrast foreground colors (`#1A0F14` or white on high-contrast badge background)
**And** background colors are harmonized to prevent illegible white-on-black or grey-on-dark text.

### Story 6.3: Global Theme Token Alignment & WCAG AA Accessibility Floor

As a platform user,
I want all interactive elements, modal overlays, tooltips, and badges across Prana Market to adhere strictly to WCAG AA contrast rules,
So that visual hierarchy is maintained across all screen sizes and device theme settings.

**Acceptance Criteria:**

**Given** any page or component across Prana Market (storefront, cart, checkout, admin)
**When** audited for visual legibility and color contrast
**Then** zero elements fail WCAG AA contrast standards ($\ge 4.5:1$ for body text, $\ge 3:1$ for large text/icons)
**And** dynamic dark mode utility classes (`dark:*`) are systematically sanitized or aligned with the official *Rose & Champagne Luxury* design system.







