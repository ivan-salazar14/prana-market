require('dotenv').config();
const fetch = require('node-fetch');

async function testConnection() {
    console.log("🕵️‍♂️ Testing Dropi Connection...");

    const apiToken = process.env.DROPI_API_TOKEN;
    if (!apiToken) {
        console.error("❌ DROPI_API_TOKEN is missing in .env");
        return;
    }

    // Clean token
    const cleanToken = apiToken.replace(/^Bearer\s+/i, '');
    const baseUrl = (process.env.DROPI_API_URL || 'https://api.dropi.co/api').replace(/\/v2\/?$/, '');

    // List of endpoints to try
    const attempts = [
        { method: 'GET', url: 'https://api.dropi.co/api/v1/products' },
        { method: 'GET', url: 'https://api.dropi.co/api/products' },
        { method: 'POST', url: 'https://api.dropi.co/api/products/index', body: { pageSize: 1 } },
        { method: 'GET', url: 'https://api.dropi.co/api/my-products' },
    ];

    for (const attempt of attempts) {
        console.log(`\nTesting: ${attempt.method} ${attempt.url}`);
        try {
            const options = {
                method: attempt.method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cleanToken}`,
                    'Accept': 'application/json'
                }
            };

            if (attempt.body) {
                options.body = JSON.stringify(attempt.body);
            }

            const res = await fetch(attempt.url, options);
            console.log(`Status: ${res.status} ${res.statusText}`);

            if (res.ok) {
                console.log("✅ SUCCESS! This endpoint works.");
                const data = await res.json();
                console.log("Response preview:", JSON.stringify(data).substring(0, 200) + "...");
                return; // Stop after first success
            } else {
                if (res.status === 401 || res.status === 403) {
                    console.log("❌ Auth Failed (Token invalid or insufficient permissions)");
                } else if (res.status === 404) {
                    console.log("❌ Endpoint not found");
                } else {
                    const text = await res.text();
                    console.log(`❌ Error: ${text.substring(0, 100)}`);
                }
            }
        } catch (e) {
            console.error("❌ Exception:", e.message);
        }
    }
}

testConnection();
