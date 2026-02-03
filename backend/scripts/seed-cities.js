const { createStrapi, compileStrapi } = require('@strapi/strapi');

async function seedCities() {
    console.log('🚀 Starting city seeding...');

    const appContext = await compileStrapi();
    const app = await createStrapi(appContext).load();

    try {
        // 1. Fetch departments
        console.log('📡 Fetching departments from API Colombia...');
        const deptResponse = await fetch('https://api-colombia.com/api/v1/Department');
        const departments = await deptResponse.json();

        // 2. Fetch cities
        console.log('📡 Fetching cities from API Colombia...');
        const cityResponse = await fetch('https://api-colombia.com/api/v1/City');
        const cities = await cityResponse.json();

        console.log(`📦 Found ${cities.length} cities. Starting import...`);

        const departmentMap = departments.reduce((acc, dept) => {
            acc[dept.id] = dept.name;
            return acc;
        }, {});

        let count = 0;
        for (const city of cities) {
            const departmentName = departmentMap[city.departmentId] || 'Unknown';

            try {
                await strapi.documents('api::city.city').create({
                    data: {
                        name: city.name,
                        department: departmentName,
                        publishedAt: new Date(),
                    },
                });
                count++;
                if (count % 100 === 0) console.log(`✅ Progress: ${count}/${cities.length} cities imported.`);
            } catch (err) {
                console.error(`❌ Error importing city ${city.name}:`, err.message);
            }
        }

        console.log(`🏁 Finished. Total cities imported: ${count}`);
    } catch (error) {
        console.error('❌ Critical Error during seeding:', error);
    } finally {
        process.exit(0);
    }
}

seedCities();
