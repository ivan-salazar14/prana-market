const { createStrapi, compileStrapi } = require('@strapi/strapi');

async function enablePermissions() {
    const appContext = await compileStrapi();
    const app = await createStrapi(appContext).load();

    try {
        const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
            where: { type: 'public' },
        });

        if (!publicRole) {
            console.error('Public role not found');
            return;
        }

        const permissions = [
            { action: 'api::city.city.find', role: publicRole.id },
            { action: 'api::city.city.findOne', role: publicRole.id },
        ];

        for (const permission of permissions) {
            const existing = await strapi.query('plugin::users-permissions.permission').findOne({
                where: { action: permission.action, role: permission.role },
            });

            if (!existing) {
                await strapi.query('plugin::users-permissions.permission').create({
                    data: permission,
                });
                console.log(`✅ Permission enabled: ${permission.action}`);
            } else {
                console.log(`ℹ️ Permission already exists: ${permission.action}`);
            }
        }
    } catch (error) {
        console.error('Error enabling permissions:', error);
    } finally {
        process.exit(0);
    }
}

enablePermissions();
