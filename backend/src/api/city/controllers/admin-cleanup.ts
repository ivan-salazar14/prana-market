/**
 * admin-cleanup controller
 * Endpoint to remove duplicate cities
 */

export default {
    async cleanupDuplicates(ctx) {
        try {
            // Basic security
            const token = ctx.request.query.token;
            const expectedToken = process.env.ADMIN_SEED_TOKEN || 'change-me-in-production';

            if (token !== expectedToken) {
                return ctx.unauthorized('Invalid token');
            }

            strapi.log.info('🚀 Starting duplicate city cleanup via API...');

            // 1. Get all cities
            const allCities = await strapi.documents('api::city.city').findMany({
                fields: ['name', 'department'],
                limit: 100000,
            });

            strapi.log.info(`📊 Total cities found: ${allCities.length}`);

            // 2. Group by unique combination of name + department
            const uniqueCities = new Map();
            const duplicates: any[] = [];

            for (const city of allCities) {
                const key = `${city.name}|${city.department}`;

                if (!uniqueCities.has(key)) {
                    uniqueCities.set(key, city);
                } else {
                    duplicates.push(city);
                }
            }

            strapi.log.info(`✅ Unique cities: ${uniqueCities.size}`);
            strapi.log.info(`🗑️  Duplicates to remove: ${duplicates.length}`);

            // 3. Delete duplicates
            let deletedCount = 0;
            for (const duplicate of duplicates) {
                try {
                    await strapi.documents('api::city.city').delete({
                        documentId: duplicate.documentId,
                    });
                    deletedCount++;
                } catch (err) {
                    strapi.log.error(`Error deleting city ${duplicate.name}:`, err);
                }
            }

            strapi.log.info(`🏁 Cleanup completed! Removed ${deletedCount} duplicates`);

            return ctx.send({
                success: true,
                message: `Cleanup completed`,
                totalCities: allCities.length,
                uniqueCities: uniqueCities.size,
                duplicatesRemoved: deletedCount,
            });
        } catch (error) {
            strapi.log.error('Error in cleanup endpoint:', error);
            return ctx.badRequest('Cleanup failed', { error: (error as Error).message });
        }
    },
};
