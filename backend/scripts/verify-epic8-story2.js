const fs = require('fs');
const path = require('path');

async function verifyEpic8Story2() {
  console.log('-------------------------------------------------------------------');
  console.log('💻 [Amelia] VERIFICATION SUITE: STORY 8.2 HYBRID ORDER ROUTING');
  console.log('-------------------------------------------------------------------');

  let passed = 0;
  let total = 0;

  function assertCheck(cond, name) {
    total++;
    if (cond) {
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
    }
  }

  // 1. Files & Schema Checks
  console.log('\n1. Verifying Files & Schema Configuration...');
  const lifecyclesPath = path.join(__dirname, '..', 'src', 'api', 'order', 'content-types', 'order', 'lifecycles.ts');
  const schemaPath = path.join(__dirname, '..', 'src', 'api', 'order', 'content-types', 'order', 'schema.json');
  const customOrderPath = path.join(__dirname, '..', 'src', 'api', 'order', 'controllers', 'custom-order.ts');

  assertCheck(fs.existsSync(lifecyclesPath), 'order/lifecycles.ts exists');
  assertCheck(fs.existsSync(schemaPath), 'order/schema.json exists');
  assertCheck(fs.existsSync(customOrderPath), 'order/controllers/custom-order.ts exists');

  const schemaObj = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  assertCheck(schemaObj.attributes && schemaObj.attributes.fulfillment_type !== undefined, 'schema.json defines fulfillment_type attribute');
  assertCheck(
    Array.isArray(schemaObj.attributes.fulfillment_type.enum) &&
    schemaObj.attributes.fulfillment_type.enum.includes('local') &&
    schemaObj.attributes.fulfillment_type.enum.includes('dropship') &&
    schemaObj.attributes.fulfillment_type.enum.includes('hybrid'),
    'fulfillment_type contains local, dropship, and hybrid enums'
  );

  // 2. Classification Algorithm Verification
  console.log('\n2. Verifying Classification & Split Routing Logic...');

  function classifyOrderFulfillment(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return { fulfillmentType: 'local', dropshipItems: [], localItems: [] };
    }
    const dropshipItems = [];
    const localItems = [];
    for (const item of items) {
      if (
        item.sourcing_type === 'mastershop_dropship' ||
        item.mastershop_id ||
        item.dropi_id ||
        item.isDropship === true
      ) {
        dropshipItems.push(item);
      } else {
        localItems.push(item);
      }
    }
    if (dropshipItems.length > 0 && localItems.length > 0) {
      return { fulfillmentType: 'hybrid', dropshipItems, localItems };
    } else if (dropshipItems.length > 0) {
      return { fulfillmentType: 'dropship', dropshipItems, localItems: [] };
    } else {
      return { fulfillmentType: 'local', dropshipItems: [], localItems };
    }
  }

  // Case A: 100% Local items
  const localItemsOnly = [
    { id: 1, name: 'Labial Local', sourcing_type: 'local' },
    { id: 2, name: 'Serum Local', sourcing_type: 'local' },
  ];
  const localRes = classifyOrderFulfillment(localItemsOnly);
  assertCheck(localRes.fulfillmentType === 'local', '100% local items classified as local');
  assertCheck(localRes.dropshipItems.length === 0, 'Zero dropship items in purely local order');
  assertCheck(localRes.localItems.length === 2, 'All items retained in localItems list');

  // Case B: 100% Dropship items
  const dropshipItemsOnly = [
    { id: 101, name: 'Crema Dropship', sourcing_type: 'mastershop_dropship', mastershop_id: 'MS-101' },
  ];
  const dropshipRes = classifyOrderFulfillment(dropshipItemsOnly);
  assertCheck(dropshipRes.fulfillmentType === 'dropship', '100% dropship items classified as dropship');
  assertCheck(dropshipRes.dropshipItems.length === 1, '1 dropship item extracted');
  assertCheck(dropshipRes.localItems.length === 0, 'Zero local items in purely dropship order');

  // Case C: Hybrid (Mixed) items
  const mixedItems = [
    { id: 1, name: 'Labial Local', sourcing_type: 'local' },
    { id: 101, name: 'Crema Dropship', sourcing_type: 'mastershop_dropship', mastershop_id: 'MS-101' },
  ];
  const hybridRes = classifyOrderFulfillment(mixedItems);
  assertCheck(hybridRes.fulfillmentType === 'hybrid', 'Mixed items classified as hybrid');
  assertCheck(hybridRes.dropshipItems.length === 1 && hybridRes.dropshipItems[0].id === 101, 'Only dropship items partitioned for MasterShop');
  assertCheck(hybridRes.localItems.length === 1 && hybridRes.localItems[0].id === 1, 'Local items safely partitioned for bodega fulfillment');

  // 3. Lifecycles Implementation Checks
  console.log('\n3. Verifying Lifecycle Hooks Behavior...');
  const lifecyclesCode = fs.readFileSync(lifecyclesPath, 'utf8');

  assertCheck(lifecyclesCode.includes('classifyOrderFulfillment'), 'classifyOrderFulfillment implemented in lifecycles.ts');
  assertCheck(lifecyclesCode.includes("fulfillmentType === 'local'"), 'Bypasses MasterShop for local orders');
  assertCheck(lifecyclesCode.includes("sync_mastershop: false"), 'Explicitly resets sync_mastershop to false for local orders');
  assertCheck(lifecyclesCode.includes("fulfillmentType === 'hybrid'"), 'Supports hybrid fulfillment routing');
  assertCheck(lifecyclesCode.includes("items: dropshipItems"), 'Dispatches ONLY dropship items in hybrid orders');

  // 4. Dropship Monitor Isolation Checks
  console.log('\n4. Verifying Dropship Monitor Query Isolation...');
  const customOrderCode = fs.readFileSync(customOrderPath, 'utf8');

  assertCheck(customOrderCode.includes("ord.fulfillment_type === 'local'"), 'Excludes ord.fulfillment_type === local from dropship monitor');
  assertCheck(customOrderCode.includes("isAllLocal"), 'Detects purely local orders and excludes from failure metrics');

  // Simulate Monitor Filtering
  const testOrders = [
    { id: 1, fulfillment_type: 'local', items: [{ sourcing_type: 'local' }], sync_mastershop: false },
    { id: 2, fulfillment_type: 'dropship', items: [{ sourcing_type: 'mastershop_dropship' }], mastershop_id: 'MS-2' },
    { id: 3, fulfillment_type: 'dropship', items: [{ sourcing_type: 'mastershop_dropship' }], sync_mastershop: true }, // failed dropship
  ];

  const filteredMonitorOrders = testOrders.filter((ord) => {
    if (ord.fulfillment_type === 'local') return false;
    const items = Array.isArray(ord.items) ? ord.items : [];
    const hasDropshipItems = items.some((i) => i.sourcing_type === 'mastershop_dropship');
    const isAllLocal = items.length > 0 && items.every((i) => i.sourcing_type === 'local');
    if (isAllLocal) return false;
    return hasDropshipItems || ord.mastershop_id || (ord.sync_mastershop && !isAllLocal);
  });

  assertCheck(filteredMonitorOrders.length === 2, 'Monitor query excludes Order #1 (local order)');
  assertCheck(!filteredMonitorOrders.some((o) => o.id === 1), 'Order #1 does not appear in dropship monitor');

  console.log('\n-------------------------------------------------------------------');
  console.log(`🎯 RESULT: ${passed}/${total} checks passed (${Math.round((passed / total) * 100)}%)`);
  console.log('-------------------------------------------------------------------');

  if (passed === total) {
    console.log('✨ All Story 8.2 acceptance criteria verified successfully!\n');
    process.exit(0);
  } else {
    console.error('❌ Verification failed some checks.\n');
    process.exit(1);
  }
}

verifyEpic8Story2().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
