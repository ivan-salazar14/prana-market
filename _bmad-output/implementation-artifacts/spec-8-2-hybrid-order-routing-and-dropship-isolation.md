---
title: 'Story 8.2: Hybrid Order Routing & Dropship Lifecycle Isolation'
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

**Problem:** When customer orders are created or updated to `'paid'` / `'confirmed'`, Strapi lifecycle hooks blindly invoke `sendOrderToMasterShop` for all orders. When an order contains only physical/local warehouse products (`sourcing_type === 'local'`), MasterShop rejects it because local SKUs do not exist in the dropshipping supplier catalog. This records false errors, triggers unnecessary operational alerts, and pollutes the `/admin/dropship-monitor` failure queue with valid physical orders.

**Approach:** Upgrade Strapi order lifecycle hooks (`afterCreate` and `afterUpdate`) and order controllers to evaluate the sourcing origin of each line item in `order.items`. The system classifies orders into three fulfillment buckets: `local`, `dropship`, or `hybrid`. Orders with 100% local items bypass MasterShop synchronization completely, hybrid orders dispatch only their dropship items, and the `/api/orders/dropship-sync-status` monitor endpoint filters out purely local orders from failure metrics.

## Boundaries & Constraints

**Always:**
- Inspect `order.items` to determine `sourcing_type` (`local` vs `mastershop_dropship`).
- For 100% local orders: leave `sync_mastershop: false`, set `fulfillment_type: 'local'`, and bypass `sendOrderToMasterShop`.
- For hybrid orders: set `fulfillment_type: 'hybrid'`, dispatch only dropship items to MasterShop, and preserve local fulfillment flags.
- For 100% dropship orders: set `fulfillment_type: 'dropship'` and dispatch as usual.
- Ensure `GET /api/orders/dropship-sync-status` ignores purely local orders from failed order metrics and retry lists.

**Never:**
- Never call MasterShop APIs with items marked `sourcing_type: 'local'`.
- Never fail or halt order creation/payment if a dropship sync error occurs.
- Never show 100% local orders in the Dropship Monitor failure queue.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 100% Local Order | Order with only items `sourcing_type: 'local'` | Order status remains `'paid'` / `'processing'`, `sync_mastershop: false`, zero MasterShop API calls | Skipped gracefully; logged as local fulfillment |
| 100% Dropship Order | Order with only items `sourcing_type: 'mastershop_dropship'` | Dispatches to MasterShop via `sendOrderToMasterShop`, updates `mastershop_id` | If MasterShop API fails, queues for retry in dropship monitor |
| Hybrid Order (Mixed) | Order with both local and dropship items | System extracts dropship items, dispatches only dropship items to MasterShop, sets `fulfillment_type: 'hybrid'` | Local items remain in warehouse queue; dropship items synced |
| Order items without explicit sourcing_type | Older orders or items missing `sourcing_type` | Inspects `mastershop_id` or product database record to infer sourcing type; defaults safely | Fallback to safe check |
| Dropship Monitor Query | `GET /api/orders/dropship-sync-status` | Returns metrics and failed orders containing ONLY orders with dropship items | 100% local orders excluded from total and failed counts |

</frozen-after-approval>

## Code Map

- `backend/src/api/order/content-types/order/schema.json` -- Add `fulfillment_type` enumeration attribute (`local`, `dropship`, `hybrid`).
- `backend/src/api/order/content-types/order/lifecycles.ts` -- Inspect items sourcing type in `afterCreate` and `afterUpdate` hooks, route fulfillment accordingly, and bypass MasterShop for local items.
- `backend/src/api/order/controllers/custom-order.ts` -- Filter purely local orders out of `getDropshipSyncStatus` monitor endpoint.
- `backend/scripts/verify-epic8-story2.js` -- Automated test suite verifying order routing classification and monitor isolation.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/api/order/content-types/order/schema.json` -- Add `fulfillment_type` attribute.
- [x] `backend/src/api/order/content-types/order/lifecycles.ts` -- Implement hybrid routing and dropship isolation in `afterCreate` and `afterUpdate`.
- [x] `backend/src/api/order/controllers/custom-order.ts` -- Update `getDropshipSyncStatus` to ignore 100% local orders.
- [x] `backend/scripts/verify-epic8-story2.js` -- Create and execute automated test suite for Story 8.2.

**Acceptance Criteria:**
- Given a newly paid order with only physical/local items, when lifecycle hooks execute, then `sendOrderToMasterShop` is not invoked and `sync_mastershop` remains `false`.
- Given an order containing only dropship items, when lifecycle hooks execute, then MasterShop dispatch proceeds normally.
- Given a hybrid order with mixed items, when lifecycle hooks execute, then only dropship items are dispatched to MasterShop.
- Given an operator checks `/api/orders/dropship-sync-status`, then purely local orders are excluded from the failed orders list.
