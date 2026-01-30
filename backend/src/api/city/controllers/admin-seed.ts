/**
 * admin-seed controller
 * Temporary endpoint to seed cities in production
 */

export default {
    async seedCities(ctx) {
        try {
            // Basic security: only allow in development or with a secret token
            const token = ctx.request.query.token;
            const expectedToken = process.env.ADMIN_SEED_TOKEN || 'change-me-in-production';

            if (token !== expectedToken) {
                return ctx.unauthorized('Invalid token');
            }

            strapi.log.info('🚀 Starting city seeding via API...');

            // Fetch departments
            const deptResponse = await fetch('https://api-colombia.com/api/v1/Department');
            const departments = await deptResponse.json();

            // Fetch cities
            const cityResponse = await fetch('https://api-colombia.com/api/v1/City');
            const cities = await cityResponse.json();

            const departmentMap = departments.reduce((acc, dept) => {
                acc[dept.id] = dept.name;
                return acc;
            }, {});

            let count = 0;
            const errors = [];

            for (const city of cities) {
                const departmentName = departmentMap[city.departmentId] || 'Unknown';

                try {
                    await strapi.documents('api::city.city').create({
                        data: {
                            name: city.name,
                            department: departmentName,
                        },
                    });
                    count++;
                } catch (err) {
                    errors.push({ city: city.name, error: err.message });
                }
            }

            // Fix permissions
            const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
                where: { type: 'public' },
            });

            if (publicRole) {
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
                    }
                }
            }

            strapi.log.info(`✅ Seeding completed. ${count} cities imported.`);

            return ctx.send({
                success: true,
                message: `Successfully imported ${count} cities`,
                errors: errors.length > 0 ? errors : undefined,
                total: cities.length,
            });
        } catch (error) {
            strapi.log.error('Error in seed endpoint:', error);
            return ctx.badRequest('Seeding failed', { error: error.message });
        }
    },
};
