# Epic 3 Context: Frictionless Colombian Checkout & Multi-Gateway Payments

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permite a los clientes de Prana Market completar su compra en pocos pasos seleccionando su municipio DANE y pagando de forma nativa e instantánea con Nequi (Push/QR), Wompi (PSE, Tarjetas, Bancolombia, Efecty) o Stripe, respaldado por un backend seguro con validación HMAC e idempotencia para evitar cobros dobles y garantizar trazabilidad en Colombia.

## Stories

- Story 3.1: DANE Colombian Address Hierarchy & Tiered Shipping Selection
- Story 3.2: Native Nequi Direct Push & Dynamic QR Checkout
- Story 3.3: Comprehensive Wompi Gateway (PSE, Cards, Bancolombia & Cash Networks)
- Story 3.4: International Card Checkout via Stripe Backup Gateway
- Story 3.5: Cryptographic Webhook Reconciliation & Idempotent Payment Settlement

## Requirements & Constraints

- Colombian checkout priorities: Wompi as primary multi-channel gateway (supporting PSE bank redirects, Credit/Debit cards tokenized via Wompi widget/SDK, Bancolombia transfer, and Cash network vouchers like Efecty/Baloto with printable PIN and expiration).
- Zero raw credit card storage: strictly PCI-DSS compliant via client-side tokenization / Wompi widget / hosted checkout.
- Currency handling strictly in COP (Colombian Pesos).
- Cart drawer integration (`Cart.tsx`) allowing users to pick payment method (Efectivo, Nequi, Wompi, etc.).
- Responsive mobile-first design with touch targets >= 48px and WCAG AA contrast.
- Idempotency and webhook verification using HMAC signatures (`WOMPI_INTEGRITY_SECRET`).

## Technical Decisions

- Wompi integration: Client component `WompiCheckout.tsx` embedded in `Cart.tsx` with tabs/selectors for PSE (bank list redirect), Cards (Wompi checkout widget), and Cash Vouchers (Efecty/Baloto reference PIN generator).
- Backend Next.js route: `/api/wompi/create-transaction` supporting real and mock/development modes.
- Strapi backend order management: transition to `'paid'` / `'pending_payment'` with transaction IDs and payment method logging.

## UX & Interaction Patterns

- Payment selector in `Cart.tsx` allowing one-tap switching between payment methods.
- Tabbed or structured interface in `WompiCheckout.tsx` for PSE, Tarjeta, and Efectivo/Efecty.
- Cash voucher display screen with printable reference PIN, barcode/convenio, expiration date, and instructions for payment at physical payment points.

## Cross-Story Dependencies

- Follows Story 3.1 (DANE addresses and shipping selection) and Story 3.2 (Nequi checkout).
- Precedes Story 3.4 (Stripe backup) and Story 3.5 (Webhook reconciliation).
