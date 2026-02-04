import { factories } from '@strapi/strapi';

export default ({ strapi }) => ({
    /**
     * Sync a single product with Dropi
     */
    async syncProduct(productId) {
        const apiToken = process.env.DROPI_API_TOKEN;
        const apiUrl = process.env.DROPI_API_URL || 'https://api.dropi.co/api/v2';

        if (!apiToken) {
            strapi.log.warn('Dropi API Token is missing. Skipping sync.');
            return null;
        }

        try {
            const product = await strapi.documents('api::product.product').findOne({
                documentId: productId,
                fields: ['name', 'dropi_id', 'price', 'original_price', 'discount_percentage', 'stock', 'cost_price'],
            });

            if (!product || !product.dropi_id) {
                strapi.log.debug(`Product ${productId} has no dropi_id, skipping sync`);
                return null;
            }

            // Fetch product data from Dropi
            const response = await fetch(`${apiUrl}/products/${product.dropi_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiToken}`
                }
            });

            if (!response.ok) {
                strapi.log.error(`Dropi API error for product ${product.dropi_id}: ${response.status}`);
                return null;
            }

            interface DropiProduct {
                stock?: number;
                available_quantity?: number;
                price?: number;
                cost?: number;
            }

            const dropiProduct = await response.json() as DropiProduct;

            // Update product with Dropi data
            const updated = await strapi.documents('api::product.product').update({
                documentId: productId,
                data: {
                    stock: dropiProduct.stock || dropiProduct.available_quantity || product.stock,
                    cost_price: dropiProduct.price || dropiProduct.cost || product.cost_price,
                    original_price: dropiProduct.price || dropiProduct.cost || product.cost_price,
                    price: Math.round((dropiProduct.price || dropiProduct.cost || product.cost_price) * 0.9),
                    discount_percentage: 10,
                    last_sync_date: new Date(),
                }
            });

            strapi.log.info(`✅ Synced product ${product.name} (Dropi ID: ${product.dropi_id})`);
            return updated;

        } catch (error) {
            strapi.log.error(`Failed to sync product ${productId}:`, (error as Error).message);
            return null;
        }
    },

    /**
     * Sync all products that have a dropi_id
     */
    async syncAllProducts() {
        const apiToken = process.env.DROPI_API_TOKEN;

        if (!apiToken) {
            strapi.log.warn('⚠️  Dropi API Token is missing. Skipping sync.');
            return { success: false, message: 'API token not configured' };
        }

        try {
            strapi.log.info('🔄 Starting Dropi product synchronization...');

            // Get all products with dropi_id
            const products = await strapi.documents('api::product.product').findMany({
                filters: {
                    dropi_id: {
                        $notNull: true,
                    }
                },
                fields: ['name', 'dropi_id'],
                limit: 1000,
            });

            strapi.log.info(`📦 Found ${products.length} products to sync`);

            let successCount = 0;
            let errorCount = 0;

            for (const product of products) {
                const result = await this.syncProduct(product.documentId);
                if (result) {
                    successCount++;
                } else {
                    errorCount++;
                }

                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const summary = {
                success: true,
                total: products.length,
                synced: successCount,
                errors: errorCount,
                timestamp: new Date().toISOString(),
            };

            strapi.log.info(`✅ Sync completed: ${successCount} synced, ${errorCount} errors`);
            return summary;

        } catch (error) {
            strapi.log.error('❌ Sync failed:', error);
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    },

    /**
     * Search products in Dropi catalog
     */
    async searchDropiProducts(query) {
        const apiToken = process.env.DROPI_API_TOKEN;
        const apiUrl = process.env.DROPI_API_URL || 'https://api.dropi.co/api/v2';

        if (!apiToken) {
            throw new Error('Dropi API Token is not configured');
        }

        try {
            const response = await fetch(`${apiUrl}/products/search?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Dropi API error: ${response.status}`);
            }

            const results = await response.json();
            return results;

        } catch (error) {
            strapi.log.error('Failed to search Dropi products:', error);
            throw error;
        }
    }
});
