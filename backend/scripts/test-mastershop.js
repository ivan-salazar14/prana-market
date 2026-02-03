require('dotenv').config();
const fetch = require('node-fetch');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const defaultBaseUrl = 'https://prod.api.mastershop.com/api'; // Updated based on user feedback

async function testMasterShop() {
    console.log("🚀 Testing MasterShop API Connection");
    console.log("------------------------------------");

    let apiKey = process.env.MASTERSHOP_API_KEY;
    let apiUrl = process.env.MASTERSHOP_API_URL || defaultBaseUrl;

    if (!apiKey) {
        console.log("⚠️  MASTERSHOP_API_KEY not found in .env");
        apiKey = await new Promise(resolve => {
            rl.question('🔑 Enter your MasterShop API Key: ', resolve);
        });
    }

    console.log(`\nTesting with URL: ${apiUrl}`);
    console.log(`Testing with Key: ${apiKey.substring(0, 5)}...`);

    // Tries to list products
    try {
        const response = await fetch(`${apiUrl}/products?limit=1`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'ms-api-key': apiKey.trim()
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log("\n✅ SUCCESS! Connection established.");
            console.log("-----------------------------------");
            console.log("Sample Response:");
            console.log(JSON.stringify(data, null, 2).substring(0, 500) + "...");

            if (!process.env.MASTERSHOP_API_KEY) {
                console.log("\n⬇️  Add this to your backend/.env file:");
                console.log(`MASTERSHOP_API_KEY=${apiKey.trim()}`);
                console.log(`MASTERSHOP_API_URL=${apiUrl}`);
            }
        } else {
            console.log(`\n❌ Request Failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log(`Response: ${text}`);

            if (response.status === 404) {
                console.log("\n💡 Hint: The API URL might be incorrect.");
            } else if (response.status === 401 || response.status === 403) {
                console.log("\n💡 Hint: The API Key might be incorrect.");
            }
        }

    } catch (err) {
        console.error("\n❌ Network Error:", err.message);
    }

    rl.close();
}

testMasterShop();
