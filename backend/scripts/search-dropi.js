const fetch = require('node-fetch'); // Strapi includes node-fetch globally usually, but for standalone script we might need it. 
// Actually in Strapi context scripts usually run with 'strapi' global or need setup.
// Let's make a standalone script using native fetch (Node 18+)

// Adjust path based on where we run the script from
// If running from backend root: require('dotenv').config()
// If running from scripts folder: require('dotenv').config({ path: '../.env' })
require('dotenv').config();

async function searchDropiProduct() {
    const apiToken = process.env.DROPI_API_TOKEN;
    const apiUrl = process.env.DROPI_API_URL || 'https://api.dropi.co/api/v2';

    if (!apiToken) {
        console.error('❌ Error: DROPI_API_TOKEN is missing in .env');
        return;
    }

    // Endpoint discovered by user inspection
    // /api/users/getDataProductsSuplier?type_user=SUPPLIER&result_number=30&start=0&textToSearch=&user_verified=null&orderby=random

    const baseUrl = (process.env.DROPI_API_URL || 'https://api.dropi.co/api').replace(/\/v2\/?$/, '');
    const endpoint = `${baseUrl}/users/getDataProductsSuplier?type_user=SUPPLIER&result_number=10&start=0&textToSearch=&user_verified=null&orderby=random`;

    console.log(`Endpoint: ${endpoint}`);

    // Clean token just in case
    const cleanToken = apiToken.replace(/^Bearer\s+/i, '');

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanToken}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://app.dropi.co/',
                'Origin': 'https://app.dropi.co'
            }
        });

        if (!response.ok) {
            console.error(`❌ API Error: ${response.status} ${response.statusText}`);
            return;
        }

        const results = await response.json();
        console.log('✅ API Response received.');

        // Inspect structure
        // Based on user snippet, results might be the array directly or inside 'objects'
        const products = results.objects || results.data || (Array.isArray(results) ? results : []);

        if (products.length === 0) {
            console.log('⚠️ No products found (empty array).');
            console.log('Raw Result:', JSON.stringify(results).substring(0, 200));
            return;
        }

        console.log(`\n✅ Found ${products.length} products. Showing first 3:\n`);

        products.slice(0, 3).forEach(p => {
            console.log(`🛒 Name:  ${p.name || p.product_name || 'No Name'}`);
            console.log(`🆔 ID:    ${p.id}`);
            console.log(`💰 Price: ${p.sale_price || p.price || p.cost_price}`);
            console.log(`📦 Stock: ${p.stock || p.quantity || p.inventory}`);
            console.log('-------------------');
        });

    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

// Ignore CLI args for now, just test the list
searchDropiProduct();
