require('dotenv').config();
const fetch = require('node-fetch');

async function debugProductStructure() {
    console.log("🕵️‍♂️ Debugging MasterShop Product Structure");

    const apiKey = process.env.MASTERSHOP_API_KEY;
    const apiUrl = process.env.MASTERSHOP_API_URL || 'https://prod.api.mastershop.com/api';

    if (!apiKey) {
        console.error("❌ API Key missing");
        return;
    }

    try {
        console.log(`Getting 1 product from: ${apiUrl}/products`);
        const response = await fetch(`${apiUrl}/products?limit=1`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'ms-api-key': apiKey
            }
        });

        if (!response.ok) {
            console.error(`❌ Error: ${response.status}`);
            return;
        }

        const data = await response.json();

        // Ensure we get the list
        const products = data.results || data.data || data;

        if (products.length > 0) {
            const product = products[0];
            console.log("\n⬇️  FULL PRODUCT JSON (Copy this for analysis):");
            console.log(JSON.stringify(product, null, 2));

            // Also try to fetch individual product if ID is available
            const id = product.idProduct || product.id;
            if (id) {
                console.log(`\n🕵️‍♂️ Fetching Single Product (ID: ${id})...`);
                const singleRes = await fetch(`${apiUrl}/products/${id}`, {
                    headers: { 'ms-api-key': apiKey }
                });
                if (singleRes.ok) {
                    const singleData = await singleRes.json();
                    console.log("⬇️  SINGLE ENDPOINT JSON:");
                    console.log(JSON.stringify(singleData, null, 2));
                } else {
                    console.log(`❌ Single fetch failed: ${singleRes.status}`);
                }
            }

        } else {
            console.log("⚠️ No products found.");
        }

    } catch (e) {
        console.error(e);
    }
}

debugProductStructure();
