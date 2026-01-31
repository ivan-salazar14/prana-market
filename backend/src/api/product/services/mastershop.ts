import { factories } from '@strapi/strapi';

export default ({ strapi }) => ({
    /**
     * Search/List products from MasterShop
     * Useful for linking products in Admin
     */
    async searchProducts(params: any = {}) {
        const apiKey = process.env.MASTERSHOP_API_KEY;
        const apiUrl = process.env.MASTERSHOP_API_URL || 'https://prod.api.mastershop.com/api';

        if (!apiKey) {
            throw new Error('MASTERSHOP_API_KEY is not configured');
        }

        try {
            // Build query string
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.search) queryParams.append('search', params.search);

            const endpoint = `${apiUrl}/products?${queryParams.toString()}`;
            strapi.log.info(`Searching MasterShop products: ${endpoint}`);

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'ms-api-key': apiKey,
                },
            });

            if (!response.ok) {
                throw new Error(`MasterShop API error: ${response.status} ${response.statusText}`);
            }

            interface MasterShopListResponse {
                results: any[];
                [key: string]: any;
            }

            const data = await response.json() as MasterShopListResponse;
            // MasterShop returns { results: [...] }
            return data.results || data;
        } catch (error) {
            strapi.log.error('Failed to search MasterShop products:', error);
            throw error;
        }
    },

    /**
     * Sync a single product's stock and price from MasterShop
     */
    async syncProduct(productId: string) {
        const apiKey = process.env.MASTERSHOP_API_KEY;
        const apiUrl = process.env.MASTERSHOP_API_URL || 'https://prod.api.mastershop.com/api';

        if (!apiKey) return null;

        try {
            // Get local product with mastershop_id
            const product = await strapi.documents('api::product.product').findOne({
                documentId: productId,
                fields: ['name', 'mastershop_id', 'stock', 'price', 'cost_price'],
            });

            if (!product || !product.mastershop_id) {
                return null;
            }

            // Fetch from MasterShop
            // Assuming ID lookup endpoint exists, otherwise might need search
            // For now, let's assume /products/{id} works with idProduct
            const response = await fetch(`${apiUrl}/products/${product.mastershop_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'ms-api-key': apiKey,
                },
            });

            if (!response.ok) {
                strapi.log.error(`MasterShop sync error for ${product.mastershop_id}: ${response.status}`);
                return null;
            }

            interface MasterShopProduct {
                stock?: number;
                inventory?: number;
                cost?: number;
                wholesale_price?: number;
                price?: number;
                active?: boolean;
            }

            const remoteProduct = await response.json() as MasterShopProduct;

            // Adjust field names based on actual API response structure
            // We saw 'results', so if this returns a single object it might be direct, or wrapped in 'data'
            const productData = (remoteProduct as any).data || remoteProduct;

            // Calculate fields
            const newStock = productData.stock || productData.inventory || 0;
            const newCost = productData.cost || productData.wholesale_price || 0;
            // Use suggested retail price if available, otherwise fallback to cost * markup or keep existing
            const newPrice = productData.price || productData.suggested_price || product.price;

            // Update local product with FULL details
            const updated = await strapi.documents('api::product.product').update({
                documentId: productId,
                data: {
                    name: productData.name || product.name,
                    description: productData.description || product.description,
                    stock: newStock,
                    cost_price: newCost,
                    price: newPrice,
                    last_sync_date: new Date(),
                },
            });

            strapi.log.info(`✅ Synced MasterShop product (Full Data): ${updated.name}`);
            return updated;
        } catch (error) {
            strapi.log.error(`Failed to sync product ${productId}:`, (error as Error).message);
            return null;
        }
    },

    /**
     * Sync all products that have a mastershop_id
     */
    async syncAllProducts() {
        const apiKey = process.env.MASTERSHOP_API_KEY;

        if (!apiKey) {
            strapi.log.warn('⚠️  MasterShop API Key is missing. Skipping sync.');
            return { success: false, message: 'API Key not configured' };
        }

        try {
            strapi.log.info('🔄 Starting MasterShop product synchronization...');

            // Get all products with mastershop_id
            const products = await strapi.documents('api::product.product').findMany({
                filters: {
                    mastershop_id: {
                        $notNull: true,
                    }
                },
                fields: ['name', 'mastershop_id'],
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
                await new Promise(resolve => setTimeout(resolve, 800));
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
     * Send an order to MasterShop (Dropshipping)
     */
    async createOrder(orderData: any) {
        const apiKey = process.env.MASTERSHOP_API_KEY;
        const apiUrl = process.env.MASTERSHOP_API_URL || 'https://prod.api.mastershop.com/api';

        if (!apiKey) {
            throw new Error('MASTERSHOP_API_KEY is missing');
        }

        try {
            const response = await fetch(`${apiUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ms-api-key': apiKey,
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create order: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            strapi.log.error('MasterShop Create Order Error:', error);
            throw error;
        }
    }
});
