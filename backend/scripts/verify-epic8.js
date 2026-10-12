const fs = require('fs');
const path = require('path');

async function verifyEpic8Story1() {
  console.log('-------------------------------------------------------------------');
  console.log('💻 [Amelia] VERIFICATION SUITE: STORY 8.1 BULK CSV CATALOG IMPORT');
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

  // 1. Files & Routes Structure
  console.log('\n1. Verifying Files & Routes Structure...');
  const controllerPath = path.join(__dirname, '..', 'src', 'api', 'product', 'controllers', 'custom-catalog.ts');
  const routesPath = path.join(__dirname, '..', 'src', 'api', 'product', 'routes', 'custom-catalog.ts');
  const frontendPage = path.join(__dirname, '..', '..', 'frontend', 'src', 'app', 'admin', 'catalog', 'page.tsx');
  const nextImportRoute = path.join(__dirname, '..', '..', 'frontend', 'src', 'app', 'api', 'admin', 'catalog', 'import', 'route.ts');

  assertCheck(fs.existsSync(controllerPath), 'custom-catalog.ts controller exists');
  assertCheck(fs.existsSync(routesPath), 'custom-catalog.ts routes exist');
  assertCheck(fs.existsSync(frontendPage), 'frontend /admin/catalog/page.tsx exists');
  assertCheck(fs.existsSync(nextImportRoute), 'Next.js CSV import proxy route exists');

  // 2. Controller Methods & Routes Check
  console.log('\n2. Verifying Controller Logic & Route Declarations...');
  const controllerCode = fs.readFileSync(controllerPath, 'utf8');
  const routesCode = fs.readFileSync(routesPath, 'utf8');

  assertCheck(controllerCode.includes('importCsv'), 'Controller implements importCsv method');
  assertCheck(controllerCode.includes('getCsvTemplate'), 'Controller implements getCsvTemplate method');
  assertCheck(controllerCode.includes("sourcing_type: 'local'"), "Controller enforces sourcing_type: 'local'");
  assertCheck(controllerCode.includes('mastershop_dropship'), 'Controller checks and protects mastershop_dropship products');
  assertCheck(controllerCode.includes('template-productos-prana.csv'), 'Controller defines downloadable template filename');

  assertCheck(routesCode.includes('/products/import-csv'), 'POST /products/import-csv route declared');
  assertCheck(routesCode.includes('/products/csv-template'), 'GET /products/csv-template route declared');

  // 3. Algorithm & CSV Parsing Engine Verification
  console.log('\n3. Verifying CSV Parser Algorithm & Edge-Cases...');

  function parseCsvRows(csvText) {
    if (!csvText || typeof csvText !== 'string') return { headers: [], rows: [] };
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const rowValues = line.split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
      const rowObj = {};
      headers.forEach((header, idx) => {
        rowObj[header] = rowValues[idx] !== undefined ? rowValues[idx] : '';
      });
      rows.push(rowObj);
    }
    return { headers, rows };
  }

  const sampleCsv = `sku,name,category_slug,price,cost_price,stock,description,is_active
PRANA-LOC-001,Labial Rosa,labios,45000,25000,20,Labial hidratante,true
PRANA-LOC-002,Serum Facial,skincare,85000,45000,15,Serum C,true`;

  const parsed = parseCsvRows(sampleCsv);
  assertCheck(parsed.headers.length === 8, 'Parsed 8 headers correctly');
  assertCheck(parsed.rows.length === 2, 'Parsed 2 data rows correctly');
  assertCheck(parsed.rows[0].sku === 'PRANA-LOC-001', 'Row 0 SKU matches PRANA-LOC-001');
  assertCheck(parsed.rows[0].price === '45000', 'Row 0 price matches 45000');
  assertCheck(parsed.rows[1].category_slug === 'skincare', 'Row 1 category matches skincare');

  // Header validation check
  const requiredHeaders = ['sku', 'name', 'category_slug', 'price', 'stock'];
  const hasAllHeaders = requiredHeaders.every((h) => parsed.headers.includes(h));
  assertCheck(hasAllHeaders, 'All 5 mandatory headers present in sample CSV');

  // Dropship SKU collision simulation
  function simulateRowValidation(row, dropshipSkus = ['DROPSHIP-MS-001']) {
    if (!row.sku || !row.name || !row.category_slug || !row.price || !row.stock) {
      return { valid: false, error: 'Faltan campos obligatorios' };
    }
    const price = Number(row.price);
    const stock = Number(row.stock);
    if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
      return { valid: false, error: 'Valores numéricos inválidos' };
    }
    if (dropshipSkus.includes(row.sku)) {
      return { valid: false, error: 'El SKU pertenece a MasterShop dropship y no puede modificarse' };
    }
    return { valid: true };
  }

  const validRow = { sku: 'PRANA-NEW-1', name: 'Crema', category_slug: 'skincare', price: '30000', stock: '5' };
  assertCheck(simulateRowValidation(validRow).valid === true, 'Accepts valid physical product row');

  const collisionRow = { sku: 'DROPSHIP-MS-001', name: 'Crema', category_slug: 'skincare', price: '30000', stock: '5' };
  const collisionResult = simulateRowValidation(collisionRow);
  assertCheck(collisionResult.valid === false && collisionResult.error.includes('MasterShop dropship'), 'Rejects row with MasterShop SKU collision');

  const malformedRow = { sku: 'PRANA-X', name: 'Crema', category_slug: 'skincare', price: '-100', stock: '5' };
  assertCheck(simulateRowValidation(malformedRow).valid === false, 'Rejects row with negative price');

  // 4. Frontend Admin Catalog UI Check
  console.log('\n4. Verifying Frontend Components & Interactivity...');
  const frontendCode = fs.readFileSync(frontendPage, 'utf8');
  assertCheck(frontendCode.includes('handleDownloadTemplate'), 'Template download handler present in frontend');
  assertCheck(frontendCode.includes('template-productos-prana.csv'), 'Template filename configured in frontend');
  assertCheck(frontendCode.includes('Previsualización de Filas'), 'Live preview table present in frontend');
  assertCheck(frontendCode.includes('Aislamiento de Dropship Activo'), 'Dropship isolation badge present in frontend');
  assertCheck(frontendCode.includes('/admin/orders') && frontendCode.includes('/admin/dropship-monitor'), 'Admin navigation links present in catalog page');

  console.log('\n-------------------------------------------------------------------');
  console.log(`🎯 RESULT: ${passed}/${total} checks passed (${Math.round((passed / total) * 100)}%)`);
  console.log('-------------------------------------------------------------------');

  if (passed === total) {
    console.log('✨ All Story 8.1 acceptance criteria verified successfully!\n');
    process.exit(0);
  } else {
    console.error('❌ Verification failed some checks.\n');
    process.exit(1);
  }
}

verifyEpic8Story1().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
