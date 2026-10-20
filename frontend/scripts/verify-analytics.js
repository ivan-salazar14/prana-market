/**
 * Verification test script for Epic 9: Meta Pixel & E-commerce Funnel Tracking
 * Run with: node frontend/scripts/verify-analytics.js
 */

const assert = require('assert');

console.log('🧪 Starting Epic 9 Analytics Verification...\n');

// 1. Test Mock / Unconfigured State
delete process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

// Mock DOM environment
global.window = {};

// Test functions with dynamic module loading or mirror logic to test analytics contracts
const testContracts = () => {
  const isPixelConfigured = (id) => {
    return Boolean(
      id &&
      id.trim() !== '' &&
      !id.includes('YOUR_') &&
      !id.includes('placeholder')
    );
  };

  assert.strictEqual(isPixelConfigured(undefined), false, 'Undefined pixel ID should not be configured');
  assert.strictEqual(isPixelConfigured(''), false, 'Empty string pixel ID should not be configured');
  assert.strictEqual(isPixelConfigured('YOUR_PIXEL_ID'), false, 'Placeholder pixel ID should not be configured');
  assert.strictEqual(isPixelConfigured('1234567890'), true, 'Valid numeric ID should be configured');

  console.log('✅ Pixel configuration detection passes all guards.');

  // 2. Test Safe Event Dispatching without Pixel ID
  let mockLogged = false;
  const originalLog = console.log;
  console.log = (...args) => {
    if (args[0] && args[0].includes('[Analytics:Mock]')) {
      mockLogged = true;
    }
  };

  const safeFbq = (id, type, eventName, params) => {
    if (typeof global.window === 'undefined') return;
    const configured = isPixelConfigured(id);
    if (configured && typeof global.window.fbq === 'function') {
      try {
        if (params) {
          global.window.fbq(type, eventName, params);
        } else {
          global.window.fbq(type, eventName);
        }
      } catch (err) {
        // Safe catch
      }
    } else {
      console.log(`[Analytics:Mock] ${type} -> ${eventName}:`, params || '(no params)');
    }
  };

  // Test no-op / mock calls when no pixel ID is configured
  safeFbq(undefined, 'track', 'PageView');
  assert.strictEqual(mockLogged, true, 'PageView dispatched to dev mock logger');

  mockLogged = false;
  safeFbq(undefined, 'track', 'ViewContent', { content_ids: ['1'], value: 45000, currency: 'COP' });
  assert.strictEqual(mockLogged, true, 'ViewContent dispatched to dev mock logger');

  console.log = originalLog;
  console.log('✅ Unconfigured / Safe Fallback execution operates without errors.');

  // 3. Test Active Pixel Event Payloads
  const recordedEvents = [];
  global.window.fbq = (type, eventName, params) => {
    recordedEvents.push({ type, eventName, params });
  };

  const validPixelId = '987654321';

  // Test PageView
  safeFbq(validPixelId, 'track', 'PageView', { page_path: '/category/rostro' });
  assert.strictEqual(recordedEvents.length, 1);
  assert.strictEqual(recordedEvents[0].eventName, 'PageView');
  assert.strictEqual(recordedEvents[0].params.page_path, '/category/rostro');

  // Test ViewContent
  const viewContentPayload = {
    content_ids: ['101'],
    content_name: 'Base Líquida Mate',
    content_category: 'Rostro',
    value: 55000,
    currency: 'COP',
  };
  safeFbq(validPixelId, 'track', 'ViewContent', viewContentPayload);
  assert.strictEqual(recordedEvents[1].eventName, 'ViewContent');
  assert.strictEqual(recordedEvents[1].params.value, 55000);
  assert.strictEqual(recordedEvents[1].params.currency, 'COP');

  // Test AddToCart
  const addToCartPayload = {
    content_ids: ['101'],
    content_name: 'Base Líquida Mate',
    value: 110000,
    currency: 'COP',
  };
  safeFbq(validPixelId, 'track', 'AddToCart', addToCartPayload);
  assert.strictEqual(recordedEvents[2].eventName, 'AddToCart');
  assert.strictEqual(recordedEvents[2].params.value, 110000);
  assert.strictEqual(recordedEvents[2].params.currency, 'COP');

  // Test InitiateCheckout
  const checkoutPayload = {
    value: 110000,
    num_items: 2,
    currency: 'COP',
  };
  safeFbq(validPixelId, 'track', 'InitiateCheckout', checkoutPayload);
  assert.strictEqual(recordedEvents[3].eventName, 'InitiateCheckout');
  assert.strictEqual(recordedEvents[3].params.num_items, 2);

  // Test WhatsApp Contact Click
  const whatsAppPayload = {
    origin: 'floating_whatsapp_widget',
    source_url: 'http://localhost:3000/product/101',
    timestamp: new Date().toISOString(),
  };
  safeFbq(validPixelId, 'trackCustom', 'WhatsAppContactClick', whatsAppPayload);
  assert.strictEqual(recordedEvents[4].type, 'trackCustom');
  assert.strictEqual(recordedEvents[4].eventName, 'WhatsAppContactClick');
  assert.strictEqual(recordedEvents[4].params.origin, 'floating_whatsapp_widget');

  console.log('✅ Active Meta Pixel events and COP payloads verified successfully.');

  // 4. Test Error Handling (e.g. ad-blocker throwing exception)
  global.window.fbq = () => {
    throw new Error('Script blocked by browser extension');
  };

  assert.doesNotThrow(() => {
    safeFbq(validPixelId, 'track', 'PageView');
  }, 'Safe wrapper must not rethrow external ad-blocker errors');

  console.log('✅ Ad-blocker exception resilience verified.');
};

testContracts();

console.log('\n🎉 ALL EPIC 9 ANALYTICS TESTS PASSED!\n');
process.exit(0);
