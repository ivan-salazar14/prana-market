const fetch = require('node-fetch');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const WHITE_BRAND_ID = "df3e6b0bb66ceaadca4f84cbc371fd66e04d20fe51fc414da8d1b84d31d178de";
const API_URL = "https://api.dropi.co/api/login";

console.log("🔐 Generador de Token de Dropi");
console.log("-------------------------------");
console.log("Este script te ayudará a obtener el token correcto iniciando sesión en Dropi.");
console.log("Tus credenciales se envían directamente a Dropi y NO se guardan en ningún lado.\n");

rl.question('📧 Ingresa tu Email de Dropi: ', (email) => {
    rl.question('🔑 Ingresa tu Contraseña de Dropi: ', async (password) => {

        console.log(`\n🔄 Intentando iniciar sesión en ${API_URL}...`);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password.trim(),
                    white_brand_id: WHITE_BRAND_ID
                })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                console.log("\n✅ ¡LOGIN EXITOSO!");
                console.log("--------------------------------------------------");
                console.log("Copia este token y ponlo en tu archivo backend/.env:");
                console.log("\nDROPI_API_TOKEN=" + data.token);
                console.log("\n--------------------------------------------------");
            } else {
                console.error("\n❌ Error en el login:");
                console.error(data.message || JSON.stringify(data));
            }

        } catch (error) {
            console.error("\n❌ Error de red:", error.message);
        }

        rl.close();
    });
});
