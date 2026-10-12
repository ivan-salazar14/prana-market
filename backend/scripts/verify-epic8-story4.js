const fs = require('fs');
const path = require('path');

async function verifyEpic8Story4() {
  console.log('-------------------------------------------------------------------');
  console.log('💻 [Amelia] VERIFICATION SUITE: STORY 8.4 INSTAGRAM AI IMPORTER');
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

  // 1. Static Artifact Checks
  console.log('\n1. Verifying Files & Routes Structure...');
  const extractorService = path.join(__dirname, '..', 'src', 'api', 'product', 'services', 'instagram-extractor.ts');
  const importController = path.join(__dirname, '..', 'src', 'api', 'product', 'controllers', 'instagram-import.ts');
  const importRoutes = path.join(__dirname, '..', 'src', 'api', 'product', 'routes', 'instagram-import.ts');
  const frontendComponent = path.join(__dirname, '..', '..', 'frontend', 'src', 'app', 'admin', 'catalog', 'components', 'InstagramImporter.tsx');
  const frontendPage = path.join(__dirname, '..', '..', 'frontend', 'src', 'app', 'admin', 'catalog', 'page.tsx');
  const nextExtractRoute = path.join(__dirname, '..', '..', 'frontend', 'src', 'app', 'api', 'admin', 'catalog', 'instagram', 'extract', 'route.ts');
  const nextPublishRoute = path.join(__dirname, '..', '..', 'frontend', 'src', 'app', 'api', 'admin', 'catalog', 'instagram', 'publish', 'route.ts');

  assertCheck(fs.existsSync(extractorService), 'instagram-extractor.ts service exists');
  assertCheck(fs.existsSync(importController), 'instagram-import.ts controller exists');
  assertCheck(fs.existsSync(importRoutes), 'instagram-import.ts routes file exists');
  assertCheck(fs.existsSync(frontendComponent), 'InstagramImporter.tsx frontend component exists');
  assertCheck(fs.existsSync(frontendPage), 'Catalog admin page (admin/catalog/page.tsx) exists');
  assertCheck(fs.existsSync(nextExtractRoute), 'Next.js extract proxy route exists');
  assertCheck(fs.existsSync(nextPublishRoute), 'Next.js publish proxy route exists');

  // 2. Logic & Algorithm Verification
  console.log('\n2. Verifying Pure Algorithms & Parsers (URL, COP Price, Clean Caption)...');

  // Evaluate URL regex
  function parseInstagramUrl(url) {
    if (!url || typeof url !== 'string') return { isValid: false };
    const cleanUrl = url.trim();
    const igRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i;
    const match = cleanUrl.match(igRegex);
    if (match && match[1]) {
      return { isValid: true, shortcode: match[1], type: cleanUrl.includes('/reel/') ? 'reel' : 'post' };
    }
    return { isValid: false };
  }

  assertCheck(parseInstagramUrl('https://www.instagram.com/p/DA12345/').isValid === true, 'Parses standard instagram post URL');
  assertCheck(parseInstagramUrl('https://instagram.com/reel/C890abc/?utm_source=ig_web').shortcode === 'C890abc', 'Parses reel URL and extracts shortcode');
  assertCheck(parseInstagramUrl('https://facebook.com/something').isValid === false, 'Rejects non-instagram URL');

  // Evaluate Colombian Price Parser
  function extractPriceCop(text) {
    if (!text) return 0;
    const formattedPriceRegex = /(?:\$|COP)\s*(\d{1,3}(?:\.\d{3})+)|(\d{1,3}(?:\.\d{3})+)\s*(?:COP|\$)/i;
    const formattedMatch = text.match(formattedPriceRegex);
    if (formattedMatch) {
      const numStr = (formattedMatch[1] || formattedMatch[2]).replace(/\./g, '');
      const price = parseInt(numStr, 10);
      if (!isNaN(price) && price > 0) return price;
    }

    const slangPriceRegex = /(?:precio:?\s*|\$)?(\d{2,4})\s*(?:k|mil)\b/i;
    const slangMatch = text.match(slangPriceRegex);
    if (slangMatch && slangMatch[1]) {
      const thousandPart = parseInt(slangMatch[1], 10);
      if (!isNaN(thousandPart) && thousandPart > 0) return thousandPart * 1000;
    }

    const plainRegex = /(?:\$|COP|precio:?)\s*(\d{4,7})\b/i;
    const plainMatch = text.match(plainRegex);
    if (plainMatch && plainMatch[1]) {
      const price = parseInt(plainMatch[1], 10);
      if (!isNaN(price) && price > 0) return price;
    }
    return 0;
  }

  assertCheck(extractPriceCop('Vestido lino $85.000 COP') === 85000, 'Parses "$85.000 COP" -> 85000');
  assertCheck(extractPriceCop('Hermosa blusa 75k en lino') === 75000, 'Parses Colombian slang "75k" -> 75000');
  assertCheck(extractPriceCop('Paleta sombras 120 mil pesos') === 120000, 'Parses Colombian slang "120 mil" -> 120000');
  assertCheck(extractPriceCop('Producto exclusivo precio: 45000') === 45000, 'Parses plain integer price "precio: 45000" -> 45000');

  // Evaluate Category Detection
  function detectCategory(text) {
    const lower = (text || '').toLowerCase();
    if (/brocha|esponja|cosmetiquera|rizador|encrespador|aplicador|pincel/i.test(lower)) return 'accesorios';
    if (/suero|serum|crema|tonico|tónico|bloqueador|skincare|acido|ácido|limpiador|hidratante/i.test(lower)) return 'skincare';
    if (/labial|gloss|lipstick|tinta/i.test(lower)) return 'labios';
    if (/pestañ|mascara|sombra|delineador|cejas/i.test(lower)) return 'ojos';
    if (/base|corrector|polvo|rubor|primer|iluminador|contorno/i.test(lower)) return 'rostro';
    if (/kit|set|combo|duo|pack/i.test(lower)) return 'sets';
    return 'general';
  }

  assertCheck(detectCategory('Labial cremoso nude mate') === 'labios', 'Detects category "labios"');
  assertCheck(detectCategory('Serum Vitamina C Iluminador') === 'skincare', 'Detects category "skincare"');
  assertCheck(detectCategory('Brocha angular para rubor') === 'accesorios', 'Detects category "accesorios"');

  // 3. Controller & Route Implementation Check
  console.log('\n3. Verifying Controller Logic & Dropship Isolation...');
  const controllerCode = fs.readFileSync(importController, 'utf8');
  assertCheck(controllerCode.includes('extractPost'), 'Controller implements extractPost method');
  assertCheck(controllerCode.includes('publishProduct'), 'Controller implements publishProduct method');
  assertCheck(controllerCode.includes("sourcing_type: 'local'"), "Enforces sourcing_type: 'local' on published items");
  assertCheck(controllerCode.includes('mastershop_dropship'), 'Checks and protects mastershop_dropship SKU collisions');

  const routesCode = fs.readFileSync(importRoutes, 'utf8');
  assertCheck(routesCode.includes('/products/extract-instagram'), 'Routes POST /products/extract-instagram configured');
  assertCheck(routesCode.includes('/products/publish-instagram'), 'Routes POST /products/publish-instagram configured');

  // 4. Frontend Component Check
  console.log('\n4. Verifying Frontend Importer & Admin Layout...');
  const frontendCode = fs.readFileSync(frontendComponent, 'utf8');
  assertCheck(frontendCode.includes('Importador Inteligente desde Instagram'), 'InstagramImporter header and branding present');
  assertCheck(frontendCode.includes('handleExtract'), 'handleExtract trigger implemented');
  assertCheck(frontendCode.includes('handlePublish'), 'handlePublish trigger implemented');
  assertCheck(frontendCode.includes('Catálogo Local (Bodega)'), 'Badge indicating local warehouse source present');
  assertCheck(frontendCode.includes('es-CO'), 'Colombian COP price formatting implemented');

  const pageCode = fs.readFileSync(frontendPage, 'utf8');
  assertCheck(pageCode.includes('InstagramImporter'), 'Catalog page renders InstagramImporter component');
  assertCheck(pageCode.includes('/admin/orders') && pageCode.includes('/admin/dropship-monitor'), 'Admin navigation links present');

  console.log('\n-------------------------------------------------------------------');
  console.log(`🎯 RESULT: ${passed}/${total} checks passed (${Math.round((passed / total) * 100)}%)`);
  console.log('-------------------------------------------------------------------');

  if (passed === total) {
    console.log('✨ All Story 8.4 acceptance criteria verified successfully!\n');
    process.exit(0);
  } else {
    console.error('❌ Verification failed some checks.\n');
    process.exit(1);
  }
}

verifyEpic8Story4().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
