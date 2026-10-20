/**
 * Verification suite for order correctness: guest checkout, transaction
 * idempotency, payment-status mapping and the Meta Pixel Purchase contract.
 *
 * Runs against the production modules, not mirrored copies:
 *   node --experimental-strip-types scripts/verify-order-lifecycle.js
 */

const assert = require('node:assert/strict');
const path = require('node:path');

process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID = '123456789012345';

const ORDER_MODULE = path.join(__dirname, '..', 'src', 'utils', 'order.ts');
const ANALYTICS_MODULE = path.join(__dirname, '..', 'src', 'utils', 'analytics.ts');

const {
  buildTransactionId,
  normalizeTransactionId,
  parseStoredUser,
  processOrderRequest,
  resolvePaymentStatus,
  resolveUserId,
  validateOrderPayload,
  OrderCreationError,
} = require(ORDER_MODULE);

const { claimPurchaseEvent, trackPurchase, PURCHASE_DEDUPE_PREFIX } = require(ANALYTICS_MODULE);

console.log('🧪 Epic 10: order correctness & verification\n');

const createPersistence = () => {
  const rows = [];
  let sequence = 0;

  return {
    rows,
    async findByTransactionId(transactionId) {
      return rows.find(row => row.transactionId === transactionId) ?? null;
    },
    async create(record) {
      const row = { id: ++sequence, ...record };
      rows.push(row);
      return row;
    },
  };
};

const baseOrder = {
  items: [
    { id: 1, name: 'Tono Labial Rose', price: 35000, quantity: 2 },
    { id: 7, name: 'Sérum Vitamina C', price: 89000, quantity: 1 },
  ],
  subtotal: 159000,
  deliveryCost: 5000,
  total: 164000,
  paymentMethod: 'nequi',
  deliveryMethod: { id: 'delivery_express', name: 'Envío Exprés Local', cost: 5000 },
  shippingAddress: {
    fullName: 'Camila Rodríguez',
    department: 'Antioquia',
    city: 'Medellín',
    address: 'Cra 43A # 1-50',
    phone: '3109876543',
  },
};

// --- 1. Guest checkout -------------------------------------------------------
const main = async () => {
  const guestPersistence = createPersistence();
  const guestResult = await processOrderRequest(
    { ...baseOrder, transactionId: 'TX-GUEST-001', userId: null },
    guestPersistence
  );

  assert.equal(guestResult.ok, true, 'Guest checkout must persist without a user account');
  assert.equal(guestResult.status, 201, 'New order must answer 201');
  assert.equal(guestResult.idempotent, false);
  assert.equal(guestResult.order.user, undefined, 'Guest order must not carry a user relation');
  assert.equal(guestResult.order.status, 'paid', 'Digital payment must be paid');
  assert.deepEqual(guestResult.order.shippingAddress, baseOrder.shippingAddress);
  assert.equal(guestResult.order.total, 164000, 'Total must stay in COP');
  assert.equal(guestPersistence.rows.length, 1);
  console.log('✅ Guest checkout persists with shipping metadata and no user relation.');

  // --- 2. Registered user ----------------------------------------------------
  const registeredResult = await processOrderRequest(
    { ...baseOrder, transactionId: 'TX-USER-001', userId: '42' },
    createPersistence()
  );
  assert.equal(registeredResult.order.user, 42, 'Valid user id must be linked');
  console.log('✅ Registered checkout links the user relation.');

  // --- 3. Duplicate reload is idempotent -------------------------------------
  const duplicateResult = await processOrderRequest(
    { ...baseOrder, transactionId: 'TX-GUEST-001', userId: null },
    guestPersistence
  );
  assert.equal(duplicateResult.ok, true);
  assert.equal(duplicateResult.status, 200, 'Duplicate must answer 200');
  assert.equal(duplicateResult.idempotent, true, 'Duplicate must be flagged idempotent');
  assert.equal(duplicateResult.order.id, guestResult.order.id, 'Must return the original order');
  assert.equal(guestPersistence.rows.length, 1, 'No duplicate record may be persisted');
  console.log('✅ Duplicate transaction returns the original order without inserting.');

  // --- 4. Missing transaction id never dedupes -------------------------------
  const noTxPersistence = createPersistence();
  await processOrderRequest({ ...baseOrder, paymentMethod: 'efectivo' }, noTxPersistence);
  await processOrderRequest({ ...baseOrder, paymentMethod: 'efectivo' }, noTxPersistence);
  assert.equal(noTxPersistence.rows.length, 2, 'Orders without transactionId must remain independent');
  console.log('✅ Missing transactionId does not collapse distinct orders.');

  // --- 5. Payment status mapping --------------------------------------------
  assert.equal(resolvePaymentStatus('efectivo'), 'pending', 'Cash on delivery must stay pending');
  assert.equal(resolvePaymentStatus('nequi_manual'), 'pending', 'Manual transfer must stay pending');
  assert.equal(resolvePaymentStatus('nequi'), 'paid');
  assert.equal(resolvePaymentStatus('wompi'), 'paid');

  const cashResult = await processOrderRequest(
    { ...baseOrder, paymentMethod: 'efectivo', transactionId: 'TX-CASH-001' },
    createPersistence()
  );
  assert.equal(cashResult.order.status, 'pending');
  console.log('✅ Cash/contraentrega never records a paid status.');

  // --- 6. Delivery validation ------------------------------------------------
  const invalid = validateOrderPayload({ ...baseOrder, shippingAddress: null });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.error, 'Shipping address is required for delivery methods');

  const invalidResult = await processOrderRequest(
    { ...baseOrder, shippingAddress: null, transactionId: 'TX-INVALID-001' },
    createPersistence()
  );
  assert.equal(invalidResult.ok, false);
  assert.equal(invalidResult.status, 400);
  assert.equal(invalidResult.error, 'Shipping address is required for delivery methods');

  const pickup = await processOrderRequest(
    {
      ...baseOrder,
      shippingAddress: undefined,
      deliveryMethod: { id: 'pickup', name: 'Recogida en tienda' },
      transactionId: 'TX-PICKUP-001',
    },
    createPersistence()
  );
  assert.equal(pickup.ok, true, 'Pickup orders must not require a shipping address');
  assert.equal(pickup.order.shippingAddress, undefined);
  console.log('✅ Delivery/pickup address validation matches the API contract.');

  // --- 7. Normalisation helpers ---------------------------------------------
  assert.equal(normalizeTransactionId('  TX-1  '), 'TX-1');
  assert.equal(normalizeTransactionId(''), null);
  assert.equal(normalizeTransactionId(undefined), null);
  assert.equal(normalizeTransactionId(12345), null);

  assert.equal(resolveUserId('42'), 42);
  assert.equal(resolveUserId(7), 7);
  assert.equal(resolveUserId(null), null);
  assert.equal(resolveUserId(''), null);
  assert.equal(resolveUserId('abc'), null);
  assert.equal(resolveUserId(0), null);

  assert.equal(parseStoredUser('{"id":9,"username":"camila"}'), 9);
  assert.equal(parseStoredUser('{broken json'), null, 'Malformed user JSON must fall back to guest');
  assert.equal(parseStoredUser(null), null);

  const generated = buildTransactionId('EFECTIVO');
  assert.match(generated, /^EFECTIVO-\d+-[a-z0-9]+$/);
  assert.notEqual(generated, buildTransactionId('EFECTIVO'), 'Transaction ids must not collide');
  console.log('✅ Transaction/user normalisation and guest fallbacks verified.');

  // --- 8. Meta Pixel Purchase contract --------------------------------------
  const storage = new Map();
  const store = {
    getItem: key => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, value),
  };

  const events = [];
  global.window = { fbq: (...args) => events.push(args) };

  const purchase = {
    transactionId: 'TX-GUEST-001',
    orderId: guestResult.order.id,
    total: 164000,
    items: baseOrder.items,
    currency: 'COP',
    paymentMethod: 'nequi',
  };

  trackPurchase(purchase);
  assert.equal(events.length, 1, 'Purchase must be dispatched');
  const [type, name, payload] = events[0];
  assert.equal(type, 'track');
  assert.equal(name, 'Purchase');
  assert.equal(payload.value, 164000, 'Purchase value must be the numeric COP total');
  assert.equal(payload.currency, 'COP');
  assert.equal(payload.order_id, String(guestResult.order.id));
  assert.equal(payload.transaction_id, 'TX-GUEST-001');
  assert.equal(payload.contents.length, 2);
  assert.deepEqual(payload.contents[0], { id: '1', quantity: 2, item_price: 35000 });
  console.log('✅ Purchase event payload matches the Meta Pixel standard.');

  assert.equal(claimPurchaseEvent('TX-GUEST-001', store), true, 'First mount claims the conversion');
  assert.equal(claimPurchaseEvent('TX-GUEST-001', store), false, 'Reload must not re-claim it');
  assert.equal(storage.get(`${PURCHASE_DEDUPE_PREFIX}TX-GUEST-001`), 'true');
  assert.equal(claimPurchaseEvent('TX-OTHER-001', store), true, 'Different orders still convert');

  events.length = 0;
  const fireOnce = transactionId => {
    if (claimPurchaseEvent(transactionId, store)) trackPurchase(purchase);
  };
  fireOnce('TX-GUEST-001');
  fireOnce('TX-GUEST-001');
  assert.equal(events.length, 0, 'Reloaded success page must not re-fire Purchase');
  console.log('✅ Purchase event fires exactly once per transaction across reloads.');

  events.length = 0;
  trackPurchase({ ...purchase, total: Number.NaN });
  trackPurchase({ ...purchase, transactionId: '' });
  assert.equal(events.length, 0, 'Invalid conversions must never be dispatched');
  console.log('✅ Invalid Purchase payloads are rejected.');

  // --- 9. Persistence failures surface as API errors ------------------------
  const failingResult = await processOrderRequest(baseOrder, {
    findByTransactionId: async () => null,
    create: async () => {
      throw new OrderCreationError('Invalid items payload', 400);
    },
  }).catch(error => error);

  assert.ok(failingResult instanceof OrderCreationError, 'Persistence failures must be typed');
  assert.equal(failingResult.status, 400);
  console.log('✅ Persistence failures propagate as typed API errors.');

  console.log('\n🎉 ALL EPIC 10 ORDER CORRECTNESS & VERIFICATION TESTS PASSED\n');
};

main().catch(error => {
  console.error('\n❌ Order correctness verification failed:');
  console.error(error);
  process.exit(1);
});
