# Prana Market — Technical & Architectural Addendum

This document captures architectural specifications, integration schemas, and downstream implementation details for downstream BMad skills (`bmad-architecture`, `bmad-ux`, `bmad-create-epics-and-stories`).

---

## 1. Technical Stack Architecture

- **Frontend**: Next.js 16 (App Router, Turbopack, React 19, Tailwind CSS v4, Lucide Icons, Framer Motion).
- **Backend CMS & API**: Strapi v5 (TypeScript, PostgreSQL database, Cloudinary media provider, Users-Permissions plugin).
- **Payment Processing**:
  - **Primary**: Wompi API (Nequi Direct Push / QR, PSE, Bancolombia, Credit/Debit cards, Efecty/Baloto cash vouchers).
  - **Secondary**: Stripe API (International cards / Apple Pay in COP).
- **Dropshipping Engine**: Mastershop Integration Service (REST API & Webhooks).

---

## 2. Mastershop Dropshipping Integration Mechanism

### 2.1 Ingestion Pipeline
1. **Catalog Polling / Webhook**: Strapi cron job periodically syncs with Mastershop `/api/products` or listens to product catalogue update webhooks.
2. **Schema Mapping**:
   - Mastershop Product ID $\rightarrow$ `strapi::product.external_id`
   - Mastershop Inventory Level $\rightarrow$ `strapi::product.dropship_stock`
   - Mastershop Base Cost $\rightarrow$ Applied Margin Formula $\rightarrow$ `strapi::product.price`
3. **Media Synchronization**: Images uploaded and optimized to Cloudinary CDN with responsive breakpoints.

### 2.2 Order Forwarding & Fulfillment Flow
```
[Customer Payment Confirmed]
           │
           ▼
[Wompi Webhook: transaction.updated]
           │
           ▼
[Strapi Backend: Verify HMAC Signature]
           │
     ┌─────┴─────────────────────┐
     ▼                           ▼
[Local Inventory]        [Dropshipped Inventory]
     │                           │
  Prepare                     Trigger Mastershop
Store / Courier              POST /api/orders/create
  Dispatch                       │
                                 ▼
                     [Mastershop Dispatches Carrier]
                                 │
                                 ▼
                     [Ingest Carrier Tracking #]
                                 │
                                 ▼
                     [Notify Customer via Email / WhatsApp]
```

---

## 3. Colombian Payment Handling (Nequi & Wompi)

- **Signature Generation**: Backend generates SHA-256 integrity signature (`WOMPI_INTEGRITY_SECRET`) for each checkout session.
- **Nequi Direct Flow**: Customer submits phone number $\rightarrow$ Wompi sends immediate push notification to customer's Nequi app $\rightarrow$ Backend polls or waits for webhook confirmation $\rightarrow$ Success modal rendered on frontend.
- **Idempotency**: All webhook handling uses unique `transaction.id` to prevent double-crediting or duplicate dropship order dispatch.
