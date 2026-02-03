const { createStrapi, compileStrapi } = require('@strapi/strapi');

async function removeDuplicateCities() {
    console.log('🚀 Starting duplicate city cleanup...');

    const appContext = await compileStrapi();
    const app = await createStrapi(appContext).load();

    try {
        // 1. Get all cities
        console.log('📦 Fetching all cities...');
        const allCities = await strapi.documents('api::city.city').findMany({
            fields: ['name', 'department'],
            limit: 100000,
        });

        console.log(`📊 Total cities found: ${allCities.length}`);

        // 2. Group by unique combination of name + department
        const uniqueCities = new Map();
        const duplicates = [];

        for (const city of allCities) {
            const key = `${city.name}|${city.department}`;

            if (!uniqueCities.has(key)) {
                // Keep the first occurrence
                uniqueCities.set(key, city);
            } else {
                // Mark as duplicate
                duplicates.push(city);
            }
        }

        console.log(`✅ Unique cities: ${uniqueCities.size}`);
        console.log(`🗑️  Duplicates to remove: ${duplicates.length}`);

        // 3. Delete duplicates
        let deletedCount = 0;
        for (const duplicate of duplicates) {
            try {
                await strapi.documents('api::city.city').delete({
                    documentId: duplicate.documentId,
                });
                deletedCount++;

                if (deletedCount % 100 === 0) {
                    console.log(`   Progress: ${deletedCount}/${duplicates.length} deleted`);
                }
            } catch (err) {
                console.error(`❌ Error deleting city ${duplicate.name}:`, err.message);
            }
        }

        console.log(`\n🏁 Cleanup completed!`);
        console.log(`   - Unique cities remaining: ${uniqueCities.size}`);
        console.log(`   - Duplicates removed: ${deletedCount}`);

    } catch (error) {
        console.error('❌ Critical Error during cleanup:', error);
    } finally {
        process.exit(0);
    }
}

removeDuplicateCities();
