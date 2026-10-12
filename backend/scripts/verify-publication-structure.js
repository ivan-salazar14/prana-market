const path = require('path');
const fs = require('fs');
const ts = require('typescript');

async function verifyPublicationStructure() {
  console.log('-------------------------------------------------------------------');
  console.log('🧪 TEST: MULTI-PRODUCT PUBLICATION STRUCTURE & PURPURE COPY IMPORTER');
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

  const serviceFile = path.join(__dirname, '..', 'src', 'api', 'product', 'services', 'instagram-extractor.ts');
  const serviceCode = fs.readFileSync(serviceFile, 'utf8');

  // Transpile TS using the installed TypeScript compiler
  const transpiled = ts.transpileModule(serviceCode, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;

  const moduleExports = {};
  const evalFn = new Function('exports', 'require', transpiled);
  
  evalFn(moduleExports, (mod) => {
    if (mod === '@strapi/strapi') {
      return { factories: { createCoreService: () => () => ({}) } };
    }
    return require(mod);
  });

  const {
    extractPriceCop,
    detectCategory,
    extractPublicationStructure,
    extractProductFromRawText,
  } = moduleExports;

  const sampleCopy = `Splash piña colada y mini mantequilla corporal de Purpure.
Huelen delicioso, tienen una duración increíble y la mantequilla tiene unos destellos hermosos.

Splash: 26.000
Mini mantequilla: 13.000`;

  console.log('\n1. Testing Price Parsing on Colons and Thousands Separators...');
  assertCheck(extractPriceCop('Splash: 26.000') === 26000, 'Parses "Splash: 26.000" -> 26000');
  assertCheck(extractPriceCop('Mini mantequilla: 13.000') === 13000, 'Parses "Mini mantequilla: 13.000" -> 13000');
  assertCheck(extractPriceCop('Combo especial: 39.000') === 39000, 'Parses "Combo especial: 39.000" -> 39000');
  assertCheck(extractPriceCop('Paleta $45.000 COP') === 45000, 'Maintains compatibility with "$45.000 COP"');
  assertCheck(extractPriceCop('Vestido 85k') === 85000, 'Maintains compatibility with "85k"');

  console.log('\n2. Testing Category Detection for Body Care & Cosmetics...');
  assertCheck(detectCategory('Splash piña colada') === 'skincare', 'Detects "Splash" as skincare/corporal');
  assertCheck(detectCategory('mini mantequilla corporal') === 'skincare', 'Detects "mantequilla corporal" as skincare');

  console.log('\n3. Testing Publication Structure Breakdown...');
  const structure = extractPublicationStructure(sampleCopy);
  assertCheck(structure.brand === 'Purpure', `Extracts brand "Purpure" (got: "${structure.brand}")`);
  assertCheck(structure.items.length === 2, `Extracts 2 distinct items with prices (got: ${structure.items.length})`);
  
  const item1 = structure.items[0];
  const item2 = structure.items[1];

  assertCheck(item1.raw_label === 'Splash', 'Item 1 raw label is "Splash"');
  assertCheck(item1.price === 26000, `Item 1 price is 26000 (got: ${item1.price})`);
  assertCheck(item1.name.includes('Splash') && item1.name.includes('Purpure'), `Item 1 name correlates brand and product ("${item1.name}")`);
  assertCheck(item1.suggested_category_slug === 'skincare', `Item 1 category is skincare (got: ${item1.suggested_category_slug})`);

  assertCheck(item2.raw_label === 'Mini mantequilla', 'Item 2 raw label is "Mini mantequilla"');
  assertCheck(item2.price === 13000, `Item 2 price is 13000 (got: ${item2.price})`);
  assertCheck(item2.name.includes('Mantequilla') && item2.name.includes('Purpure'), `Item 2 name correlates brand and product ("${item2.name}")`);
  assertCheck(item2.suggested_category_slug === 'skincare', `Item 2 category is skincare (got: ${item2.suggested_category_slug})`);

  console.log('\n4. Testing Full Draft Extraction from Raw Copy...');
  const draft = extractProductFromRawText(sampleCopy);
  assertCheck(draft.sourcing_type === 'local', 'Enforces sourcing_type: "local" on draft');
  assertCheck(draft.items && draft.items.length === 2, 'Draft includes 2 structured items for interactive UI selector');
  assertCheck(draft.brand === 'Purpure', 'Draft stores brand attribute');

  console.log('\n5. Testing Live / Real Post Metadata Extractor (Shortcode DaO8ZrQMLUm)...');
  const { decodeHtmlEntities, fetchInstagramPostMetadata } = moduleExports;
  assertCheck(decodeHtmlEntities('&quot;pi&#xf1;a&quot;') === '"piña"', 'Decodes HTML entities: &quot;pi&#xf1;a&quot; -> "piña"');

  try {
    const meta = await fetchInstagramPostMetadata('DaO8ZrQMLUm');
    assertCheck(meta.caption.includes('Splash') && meta.caption.includes('Purpure'), 'Extracts real caption from DaO8ZrQMLUm via bot User-Agent');
    assertCheck(meta.images.length > 0 && meta.images[0].startsWith('http'), 'Extracts real image URL from DaO8ZrQMLUm');
  } catch (err) {
    console.warn('Network notice: live fetch skipped if offline', err.message);
  }

  console.log('\n-------------------------------------------------------------------');
  console.log(`🎯 RESULT: ${passed}/${total} checks passed (${Math.round((passed / total) * 100)}%)`);
  console.log('-------------------------------------------------------------------');

  if (passed === total) {
    console.log('✨ All publication structure tests passed successfully!\n');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.\n');
    process.exit(1);
  }
}

verifyPublicationStructure().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
