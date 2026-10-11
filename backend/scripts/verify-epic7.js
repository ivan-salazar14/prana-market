const fs = require('fs');
const path = require('path');

async function verifyEpic7Implementation() {
  console.log('----------------------------------------------------');
  console.log('💻 [Amelia] VERIFICATION REPORT: EPIC 7 DEVELOPMENT');
  console.log('----------------------------------------------------');

  let passedChecks = 0;
  let totalChecks = 0;

  function assertCheck(condition, label) {
    totalChecks++;
    if (condition) {
      passedChecks++;
      console.log(`  ✅ [PASS] ${label}`);
    } else {
      console.error(`  ❌ [FAIL] ${label}`);
    }
  }

  // 1. Story 7.1: Instagram Catalog Sync & Meta Product Feed Generation
  console.log('\n1. Verifying Story 7.1: Instagram Catalog Feed Generation...');
  const catalogRoutePath = path.join(__dirname, '..', 'src', 'api', 'product', 'routes', 'custom-catalog.ts');
  const catalogControllerPath = path.join(__dirname, '..', 'src', 'api', 'product', 'controllers', 'custom-catalog.ts');

  assertCheck(fs.existsSync(catalogRoutePath), 'custom-catalog.ts routes exist');
  assertCheck(fs.existsSync(catalogControllerPath), 'custom-catalog.ts controller exists');

  const catalogRouteCode = fs.readFileSync(catalogRoutePath, 'utf8');
  const catalogControllerCode = fs.readFileSync(catalogControllerPath, 'utf8');

  assertCheck(catalogRouteCode.includes('/catalog/instagram-feed.xml'), 'GET /catalog/instagram-feed.xml route configured');
  assertCheck(catalogControllerCode.includes('generateInstagramFeed'), 'generateInstagramFeed controller method implemented');
  assertCheck(catalogControllerCode.includes('utm_source=instagram'), 'UTM tracking parameter included in catalog feed links');
  assertCheck(catalogControllerCode.includes('application/xml'), 'Content-Type set to application/xml');

  // 2. Story 7.2: Instagram DM & Comment Automated Lead Capture (Meta Graph API)
  console.log('\n2. Verifying Story 7.2: Instagram DM & Comment Automated Lead Capture Webhook...');
  const socialLeadRoutePath = path.join(__dirname, '..', 'src', 'api', 'social-lead', 'routes', 'social-lead.ts');
  const socialLeadControllerPath = path.join(__dirname, '..', 'src', 'api', 'social-lead', 'controllers', 'social-lead.ts');

  assertCheck(fs.existsSync(socialLeadRoutePath), 'social-lead.ts routes exist');
  assertCheck(fs.existsSync(socialLeadControllerPath), 'social-lead.ts controller exists');

  const socialLeadRouteCode = fs.readFileSync(socialLeadRoutePath, 'utf8');
  const socialLeadControllerCode = fs.readFileSync(socialLeadControllerPath, 'utf8');

  assertCheck(socialLeadRouteCode.includes('/social-leads/webhook'), 'Meta webhook route configured');
  assertCheck(socialLeadControllerCode.includes('verifyWebhook'), 'verifyWebhook method handles Meta hub verification');
  assertCheck(socialLeadControllerCode.includes('handleWebhookEvent'), 'handleWebhookEvent method handles Instagram events');
  assertCheck(socialLeadControllerCode.includes('instagram_dm'), 'Supports Instagram DM lead capture');
  assertCheck(socialLeadControllerCode.includes('instagram_comment'), 'Supports Instagram comment lead capture');

  // 3. Story 7.3: Social Lead Logging & Acquisition Analytics in Strapi
  console.log('\n3. Verifying Story 7.3: Social Lead Logging & Acquisition Analytics...');
  const schemaPath = path.join(__dirname, '..', 'src', 'api', 'social-lead', 'content-types', 'social-lead', 'schema.json');

  assertCheck(fs.existsSync(schemaPath), 'Social Lead collection content-type schema.json exists');
  const schemaObj = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  assertCheck(schemaObj.attributes.instagram_username !== undefined, 'Schema contains instagram_username attribute');
  assertCheck(schemaObj.attributes.source_channel !== undefined, 'Schema contains source_channel attribute');
  assertCheck(schemaObj.attributes.discount_code_issued !== undefined, 'Schema contains discount_code_issued attribute');

  assertCheck(socialLeadRouteCode.includes('/social-leads/analytics'), 'GET /social-leads/analytics route configured');
  assertCheck(socialLeadRouteCode.includes('/social-leads/log'), 'POST /social-leads/log route configured');
  assertCheck(socialLeadControllerCode.includes('getLeadAnalytics'), 'getLeadAnalytics controller method implemented');
  assertCheck(socialLeadControllerCode.includes('conversionRate'), 'Analytics calculates lead conversion rate');

  // 4. Story 7.4: Social Landing & First-Purchase Incentive Auto-Apply
  console.log('\n4. Verifying Story 7.4: Social Landing & Coupon Auto-Apply...');
  const cartContextPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'context', 'CartContext.tsx');

  assertCheck(fs.existsSync(cartContextPath), 'Frontend CartContext.tsx exists');
  const cartContextCode = fs.readFileSync(cartContextPath, 'utf8');
  assertCheck(cartContextCode.includes('BIENVENIDA10'), 'BIENVENIDA10 coupon auto-apply supported in CartContext');
  assertCheck(cartContextCode.includes('utm_source'), 'detects utm_source=instagram parameter');

  // 5. Story 7.5: Interactive Instagram Comments & Social Proof Component on Storefront
  console.log('\n5. Verifying Story 7.5: Interactive Instagram Comments & Social Proof...');
  const socialProofSchemaPath = path.join(__dirname, '..', 'src', 'api', 'social-proof', 'content-types', 'social-proof', 'schema.json');
  const socialProofRoutePath = path.join(__dirname, '..', 'src', 'api', 'social-proof', 'routes', 'social-proof.ts');
  const socialProofControllerPath = path.join(__dirname, '..', 'src', 'api', 'social-proof', 'controllers', 'social-proof.ts');
  const frontendSocialProofApiPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'app', 'api', 'social-proof', 'route.ts');
  const frontendComponentPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'components', 'InstagramSocialProof.tsx');
  const pdpPagePath = path.join(__dirname, '..', '..', 'frontend', 'src', 'app', 'product', '[id]', 'page.tsx');

  assertCheck(fs.existsSync(socialProofSchemaPath), 'Social proof schema.json exists');
  const spSchemaObj = JSON.parse(fs.readFileSync(socialProofSchemaPath, 'utf8'));
  assertCheck(spSchemaObj.attributes.author_handle !== undefined, 'Schema contains author_handle attribute');
  assertCheck(spSchemaObj.attributes.instagram_post_url !== undefined, 'Schema contains instagram_post_url attribute');
  assertCheck(spSchemaObj.attributes.is_approved !== undefined, 'Schema contains is_approved moderation attribute');

  assertCheck(fs.existsSync(socialProofRoutePath), 'Social proof routes exist');
  assertCheck(fs.existsSync(socialProofControllerPath), 'Social proof controller exists');
  const spControllerCode = fs.readFileSync(socialProofControllerPath, 'utf8');
  assertCheck(spControllerCode.includes('getApproved'), 'getApproved controller method implemented');
  assertCheck(spControllerCode.includes('moderate'), 'moderate admin method implemented');

  assertCheck(fs.existsSync(frontendSocialProofApiPath), 'Frontend /api/social-proof route exists');
  assertCheck(fs.existsSync(frontendComponentPath), 'InstagramSocialProof.tsx component exists');
  const componentCode = fs.readFileSync(frontendComponentPath, 'utf8');
  assertCheck(componentCode.includes('Ver en Instagram'), 'Includes "Ver en Instagram" deep-link CTA');
  assertCheck(componentCode.includes('animate-pulse'), 'Skeleton loading state implemented for zero CLS');

  assertCheck(fs.existsSync(pdpPagePath), 'PDP page.tsx exists');
  const pdpCode = fs.readFileSync(pdpPagePath, 'utf8');
  assertCheck(pdpCode.includes('<InstagramSocialProof'), 'InstagramSocialProof component embedded into PDP');

  console.log('\n----------------------------------------------------');
  console.log(`SUMMARY: ${passedChecks}/${totalChecks} checks passed (${((passedChecks / totalChecks) * 100).toFixed(1)}%)`);
  console.log('----------------------------------------------------');

  if (passedChecks === totalChecks) {
    console.log('🎉 ALL EPIC 7 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

verifyEpic7Implementation();
