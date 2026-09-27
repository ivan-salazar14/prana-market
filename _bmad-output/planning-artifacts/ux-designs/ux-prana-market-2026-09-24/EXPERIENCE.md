---
name: prana-market
description: Behavioral specifications, information architecture, microcopy, states, and user journeys for Prana Market.
status: final
sources:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/addendum.md
  - _bmad-output/planning-artifacts/ux-designs/ux-prana-market-2026-09-24/DESIGN.md
updated: 2026-09-24
---

# Prana Market — Experience Spine (EXPERIENCE.md)

## Foundation

Prana Market is a high-speed, mobile-first responsive web application built on **Next.js 16 (App Router)** with **Tailwind CSS v4**, **Lucide Icons**, and **Framer Motion**. Visual identity and design tokens are governed by [`DESIGN.md`](./DESIGN.md).

- **Core Promise**: Ultra-fast shopping and checkout with frictionless Colombian mobile payments (Nequi Direct, Wompi, PSE) and radical delivery transparency for hybrid physical + dropshipped catalog items.
- **Form Factor**: Primary focus on mobile viewport (`375px` - `430px`), scaling fluidly to tablet and desktop. One-handed thumb reach zone strictly respected for primary actions.

---

## Information Architecture

| Surface | Reached from | Purpose | Key Sub-components |
|---|---|---|---|
| **Storefront (Home)** | Root URL (`/`) | Brand discovery, trending TikTok beauty, flash promotions, category portals | Hero banner, Flash Deals slider, Category pills, Free shipping progress banner |
| **Catalog (PLP)** | Nav links, Category pills, Search | Product filtering, shade overview, inventory origin breakdown | Multi-attribute filter drawer (Brand, Skin Type, Finish, Origin), Product Grid, Sort menu |
| **Product Detail (PDP)** | Catalog card, Search result, Direct link | In-depth product exploration, shade swatch selection, delivery timeline estimator | Image gallery / video swatches, Shade picker, Stock origin badge, Delivery estimator, Sticky bottom bar |
| **Slide-over Cart** | Header bag icon, "Añadir al Carrito" | High-speed item review, quantity adjustments, upsell cross-sells, free shipping tracker | Free shipping progress bar, Split item delivery groups, Coupon code input, Express Checkout CTAs |
| **Frictionless Checkout** | Cart drawer "Ir a Pagar" / "Nequi Express" | Colombian address selection & instant payment execution | 3-step accordion: 1. Contact & DANE Address, 2. Delivery Method, 3. Payment Method (Nequi/PSE/Cards) |
| **Order Tracking Portal** | Order confirmation SMS/WhatsApp, `/rastreo` | Real-time multi-carrier guide tracking & delivery timeline | Status tracker (Servientrega, Coordinadora, Interrapidísimo), WhatsApp order updates button |
| **Admin Operations** | `/admin` (Strapi) | Inventory management, Mastershop sync monitor, Order status dispatch | Orders table, Dropship API monitor, Stock sync logs |

---

## Voice and Tone (Microcopy)

Prana Market speaks with warm Colombian warmth, chic expertise, and clear reassurance. Microcopy eliminates purchase anxiety around makeup authenticity and shipping timelines.

| Moment | Microcopy Style | Concrete Examples |
|---|---|---|
| **Free Shipping Progress** | Motivating & Gamified | `¡Faltan $25.000 COP para tener Envío Gratis!` $\rightarrow$ `🎉 ¡Felicidades! Tienes Envío Gratis a toda Colombia.` |
| **Hybrid Split Shipping** | Radical Transparency | `📦 Envío 1 (Local): Llega en 1-2 días hábiles` <br> `🌿 Envío 2 (Nacional Mastershop): Llega en 3-5 días hábiles` |
| **Nequi Push Checkout** | Clear Actionable Steps | `📲 Te enviamos una notificación a tu app Nequi. Tienes 45 segundos para aprobar el pago por $48.900 COP.` |
| **Stock Shortage / Low Stock** | Urgency without deception | `⚡ ¡Solo quedan 2 unidades disponibles en este tono!` |
| **Delivery Guarantee** | Reassurance | `🛡️ 100% Original Garantizado · Envíos asegurados a todo el país.` |

---

## Component Patterns (Behavioral)

### 1. Slide-Over Cart Drawer (`cart-drawer`)
- **Trigger**: Opening occurs automatically upon tapping "Añadir al Carrito" on PDP or clicking the header bag icon.
- **Backdrop & Dismissal**: Clicking outside the drawer, pressing `Escape`, or swiping right on mobile collapses the drawer with an animated spring transition.
- **Optimistic State**: Tapping `+` or `-` on item quantities immediately recalculates subtotal, taxes, and the dynamic free shipping progress bar without blocking UI spinners.
- **Split Shipment Breakdown**: If the basket contains mixed products (Local Express + Mastershop Dropship), the drawer groups products into two visual delivery cards:
  - Card 1: `📦 Envío Exprés Local (Bogotá/Medellín: 1-2 días)`
  - Card 2: `🌿 Envío Nacional Dropshipping (3-5 días hábiles)`

### 2. Mobile PDP Sticky Bottom Bar (`pdp-sticky-bar`)
- **Behavior**: Appears smoothly as the user scrolls past the top product title and hero image gallery.
- **Controls**:
  - Left: Mini shade thumbnail swatch & selected shade name (e.g. "Tono 35 Cheeky"). Tapping opens shade drawer.
  - Center/Right: Dual CTA button cluster:
    - Primary CTA: `{components.button-primary}` ("Añadir al Carrito")
    - Secondary CTA: `{components.button-nequi}` ("⚡ Pagar con Nequi")

### 3. Colombian DANE Address Selector
- **Behavior**: Cascading dropdowns:
  - Step 1: Departamento (e.g., Cundinamarca, Antioquia, Valle del Cauca).
  - Step 2: Ciudad / Municipio (auto-filtered by DANE code).
  - Step 3: Dirección & Barrio con autocompletado inteligente.

### 4. Nequi Push & Dynamic QR Poller
- **Behavior**: Upon entering Nequi phone number:
  1. System sends asynchronous authorization request to Wompi.
  2. UI displays countdown timer modal (60s) with animated pulse ring.
  3. Frontend polls transaction status every 2 seconds via Strapi `/api/orders/payment-status`.
  4. On approval: Instant transition to confetti celebration screen and receipt.
  5. On timeout/rejection: Gentle recovery screen offering QR retry or alternative payment method (PSE / Tarjeta).

---

## State Patterns

### Loading States
- Content loading utilizes subtle skeleton placeholders styled with `{colors.surface-muted}` rather than invasive full-page spinners.

### Error & Recovery States
- **Card Payment Failure**: Displays specific Colombian decline reason (e.g., "Fondos insuficientes", "Transacción rechazada por el banco emisor") with one-click retry via PSE or Nequi.
- **Stock Depletion**: If an item in the cart sells out before checkout completion, the cart highlights the affected item with `{colors.status-warning}` and suggests the nearest matching shade variant.

---

## Accessibility Floor

- **Touch Targets**: Strictly $\ge 48\times 48\text{px}$ for all touch elements on mobile.
- **Color Contrast**: All body text and price displays meet WCAG AA (minimum `4.5:1` contrast against `{colors.surface-base}` and `{colors.surface-card}`).
- **Screen Readers & ARIA**: Cart quantity modifications broadcast live updates using `aria-live="polite"`. Shade swatches announce color name and availability status (`aria-label="Tono 35 Cheeky, disponible"`).

---

## Key Flows (Journeys)

### Journey 1: Camila's 30-Second Mobile Nequi Purchase
- **Protagonist**: Camila (23, student in Medellín, saw a viral Maybelline Vinyl Ink lip gloss on TikTok).
- **Steps**:
  1. Camila opens the link from Instagram and lands on the PDP.
  2. She selects shade "35 Cheeky". The sticky bottom bar updates instantly.
  3. She taps the purple **"⚡ Pagar con Nequi"** button.
  4. A lightweight modal asks for her phone number (`312 456 7890`) and auto-fills her saved Medellín address.
  5. She taps "Solicitar Aprobación en Nequi".
  6. **Climax Beat**: A push notification pops up on her phone: *"Prana Market te solicita $48.900 COP"*. She taps "Aceptar" con huella en su app Nequi.
  7. In less than 3 seconds, the Prana Market screen flashes a green checkmark: *"¡Tu pedido #PM-8921 está confirmado! Te avisaremos por WhatsApp cuando salga del almacén."*

---

### Journey 2: Laura's Hybrid Cart with Transparent Delivery
- **Protagonist**: Laura (31, lawyer in Bogotá, purchasing a locally stocked mascara and a dropshipped Korean skincare serum).
- **Steps**:
  1. Laura adds the local mascara ($32.000 COP) and Korean serum ($65.000 COP) to her bag.
  2. The slide-over cart slides in: Subtotal is $97.000 COP. The free shipping bar glows gold: *"🎉 ¡Alcanzaste Envío Gratis!"*.
  3. The cart clearly segments the items into two shipment cards:
     - **Paquete 1 (Local Express)**: Llega mañana a Bogotá.
     - **Paquete 2 (Nacional Dropshipping)**: Llega en 3 días hábiles.
  4. Laura proceeds to Checkout, selects PSE (Bancolombia), and completes the transfer.
  5. **Climax Beat**: Laura receives a unified order confirmation with two tracking links (Servientrega para el paquete local y Coordinadora para el paquete dropshipped), completely understanding why two packages will arrive at her door.
