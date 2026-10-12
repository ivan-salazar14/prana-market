---
title: 'Story 8.1: Physical Catalog Bulk CSV Upload & Stock Management'
type: 'feature'
created: '2026-10-11'
status: 'review'
baseline_commit: 'NO_VCS'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Store operators managing local warehouse inventory in Prana Market have no mechanism to upload or update physical products in bulk. Managing inventory via Strapi's standard single-record form is slow and error-prone, and risks accidentally corrupting MasterShop dropshipping products if SKUs collide.

**Approach:** Build a dedicated CSV catalog import portal in Next.js (`/admin/catalog`) and a robust batch import endpoint in Strapi (`POST /api/products/import-csv`). The system provides a downloadable CSV template, validates headers and rows with visual preview before commit, executes atomic upserts for physical items (`sourcing_type: 'local'`), and explicitly protects MasterShop dropship products from unauthorized overwrite.

## Boundaries & Constraints

**Always:**
- Enforce `sourcing_type: 'local'` on all newly created or updated items from CSV import.
- Validate required headers: `sku`, `name`, `category_slug`, `price`, `stock`.
- Validate value types: `price >= 0`, `stock >= 0` (integer).
- Resolve category relationship using `category_slug` matching `api::product-category.product-category`.
- Protect dropship inventory: If an incoming SKU matches an existing product where `sourcing_type === 'mastershop_dropship'`, flag as an error and reject modification of that row.
- Provide a downloadable sample CSV template (`template-productos-prana.csv`) from the frontend interface.
- Return a structured JSON execution summary: `{ success: true, summary: { total, created, updated, skipped, errors } }`.

**Never:**
- Never allow CSV imports to overwrite or delete MasterShop supplier IDs or dropship configuration.
- Never crash the entire batch if a single row has formatting errors; record row error and process valid rows.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| New physical products | CSV with valid new SKUs and category slugs | Products created in Strapi with `sourcing_type: 'local'`, published status, and calculated slugs | If category slug not found, create or leave category unassigned and log warning |
| Existing physical SKU | CSV row with existing local SKU and updated price/stock | Existing local product updated with new price and inventory count (*Upsert*) | Logs row as `updated` in execution summary |
| Dropship SKU collision | CSV row contains SKU that belongs to a MasterShop product | Row is rejected and skipped; existing dropship product remains completely untouched | Adds error: `"Fila X: El SKU '...' pertenece a MasterShop dropship y no puede modificarse por CSV local"` |
| Malformed row data | Missing required fields (`price`, `stock`, `name`) or negative numbers | Malformed row is rejected | Adds error to summary with exact line number and missing field details |
| Empty / invalid file | File uploaded is not `.csv` or empty | Frontend halts upload with toast error message | Backend rejects with HTTP 400 Bad Request |

</frozen-after-approval>

## Code Map

- `backend/src/api/product/controllers/custom-catalog.ts` -- Strapi controller implementing `importCsv` handler, row parsing, SKU collision checks, and upsert logic.
- `backend/src/api/product/routes/custom-catalog.ts` -- Custom Strapi routes exposing `POST /api/products/import-csv` and `GET /api/products/csv-template`.
- `frontend/src/app/admin/catalog/page.tsx` -- Admin page for CSV drag-and-drop upload, data preview, validation table, and execution summary.
- `frontend/src/app/api/admin/catalog/import/route.ts` -- Next.js proxy route handling multipart/JSON CSV forwarding to Strapi.
- `backend/scripts/verify-epic8.js` -- Automated verification script asserting CSV ingestion, upsert functionality, and dropship collision protection.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/api/product/controllers/custom-catalog.ts` -- Implement `importCsv` controller with row validation, dropship isolation, and upsert logic.
- [x] `backend/src/api/product/routes/custom-catalog.ts` -- Register route for `POST /api/products/import-csv`.
- [x] `frontend/src/app/admin/catalog/page.tsx` -- Build admin UI with drag & drop CSV file input, preview table, template download button, and execution metrics.
- [x] `frontend/src/app/admin/layout.tsx` or navigation -- Ensure `/admin/catalog` is linked in the admin navigation header alongside `/admin/orders` and `/admin/dropship-monitor`.
- [x] `backend/scripts/verify-epic8.js` -- Create automated test suite validating Story 8.1 acceptance criteria.

**Acceptance Criteria:**
- Given an administrator visits `/admin/catalog`, when clicking "Descargar Plantilla", then a valid sample `.csv` file is downloaded.
- Given a valid CSV with physical products, when uploaded and submitted, then products are created/updated in Strapi with `sourcing_type: 'local'`.
- Given a CSV row with a SKU belonging to a `mastershop_dropship` product, when processed, then the row is skipped and reported in the error list without altering the dropship record.
- Given execution completion, then a visual modal/banner displays total rows processed, created count, updated count, and errors.
