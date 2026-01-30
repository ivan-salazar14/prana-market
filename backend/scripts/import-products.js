const fs = require('fs');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

async function main() {
    // Inicializar Strapi
    const appContext = await compileStrapi();
    const app = await createStrapi(appContext).load();

    // 1. Leer el CSV (puedes usar 'csv-parser' pero aquí lo haré con split para no instalar más dependencias)
    const data = fs.readFileSync('productos.csv', 'utf8');
    const lines = data.split('\n').slice(1); // Omitir cabecera

    console.log(`🚀 Iniciando importación de ${lines.length} productos...`);

    for (const line of lines) {
        if (!line.trim()) continue;

        const [name, description, price, stock, isActive, category_name] = line.split(',');

        try {
            // 2. Buscar si la categoría existe
            const categories = await strapi.documents('api::product-category.product-category').findMany({
                filters: { Name: category_name.trim() }
            });

            const categoryId = categories.length > 0 ? categories[0].id : null;

            // 3. Crear el producto
            await strapi.documents('api::product.product').create({
                data: {
                    name: name.trim(),
                    description: description.trim(),
                    price: parseFloat(price),
                    stock: parseInt(stock),
                    isActive: isActive.trim() === 'true',
                    product_category: categoryId,
                    publishedAt: new Date(), // Importante para que sea visible
                },
            });

            console.log(`✅ Producto creado: ${name}`);
        } catch (error) {
            console.error(`❌ Error importando ${name}:`, error.message);
        }
    }

    console.log('🏁 Proceso finalizado.');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});