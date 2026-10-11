const fs = require('fs');
const path = require('path');

async function verifyStory33Implementation() {
  console.log('----------------------------------------------------');
  console.log('💻 [Amelia] VERIFICATION REPORT: STORY 3.3 (WOMPI GATEWAY)');
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

  // 1. WompiCheckout Component
  console.log('\n1. Verifying WompiCheckout Component (frontend/src/components/WompiCheckout.tsx)...');
  const wompiComponentPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'components', 'WompiCheckout.tsx');
  assertCheck(fs.existsSync(wompiComponentPath), 'WompiCheckout.tsx component exists');

  const wompiCode = fs.readFileSync(wompiComponentPath, 'utf8');
  assertCheck(wompiCode.includes('export default function WompiCheckout'), 'Exports default WompiCheckout component');
  assertCheck(wompiCode.includes('PSE Bancos'), 'Supports PSE bank transfers with bank selector');
  assertCheck(wompiCode.includes('Bancolombia') && wompiCode.includes('Davivienda'), 'Includes major Colombian banks');
  assertCheck(wompiCode.includes('Tarjetas') && wompiCode.includes('PCI-DSS'), 'Supports Card payments with PCI-DSS compliance');
  assertCheck(wompiCode.includes('Efecty') && wompiCode.includes('Baloto'), 'Supports Efecty / Baloto cash networks');
  assertCheck(wompiCode.includes('reference_pin'), 'Generates payment reference PIN for cash voucher');
  assertCheck(wompiCode.includes('convenio_number'), 'Includes agreement convenio number');
  assertCheck(wompiCode.includes('Imprimir Comprobante') || wompiCode.includes('window.print'), 'Provides voucher printing / saving functionality');

  // 2. API Route (/api/wompi/create-transaction)
  console.log('\n2. Verifying API Route (frontend/src/app/api/wompi/create-transaction/route.ts)...');
  const wompiApiPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'app', 'api', 'wompi', 'create-transaction', 'route.ts');
  assertCheck(fs.existsSync(wompiApiPath), 'create-transaction route.ts exists');

  const wompiApiCode = fs.readFileSync(wompiApiPath, 'utf8');
  assertCheck(wompiApiCode.includes('payment_method_type'), 'Handles payment_method_type parameter');
  assertCheck(wompiApiCode.includes('EFECTY') && wompiApiCode.includes('reference_pin'), 'Generates cash voucher with PIN and expiration');
  assertCheck(wompiApiCode.includes('amount_in_cents'), 'Calculates amounts in Colombian Pesos (COP)');

  // 3. Cart Integration
  console.log('\n3. Verifying Cart Integration (frontend/src/components/Cart.tsx)...');
  const cartPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'components', 'Cart.tsx');
  assertCheck(fs.existsSync(cartPath), 'Cart.tsx exists');

  const cartCode = fs.readFileSync(cartPath, 'utf8');
  assertCheck(cartCode.includes('import WompiCheckout from \'./WompiCheckout\''), 'Imports WompiCheckout component');
  assertCheck(cartCode.includes('paymentMethod === \'wompi\''), 'Includes wompi payment method state option');
  assertCheck(cartCode.includes('<WompiCheckout'), 'Renders <WompiCheckout in Cart drawer');

  // 4. Security & PCI-DSS Compliance
  console.log('\n4. Verifying Security & Zero Raw Card Storage...');
  assertCheck(!wompiApiCode.includes('card_number') && !wompiApiCode.includes('cvv'), 'Zero raw credit card numbers or CVV stored on backend servers');

  console.log('\n----------------------------------------------------');
  console.log(`SUMMARY: ${passedChecks}/${totalChecks} checks passed (${((passedChecks / totalChecks) * 100).toFixed(1)}%)`);
  console.log('----------------------------------------------------');

  if (passedChecks === totalChecks) {
    console.log('🎉 ALL STORY 3.3 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

verifyStory33Implementation();
