import { factories } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';
import os from 'os';

export default ({ strapi }) => ({
    /**
     * Search/List products from MasterShop
     */
    async searchProducts(params: any = {}) {
        const apiKey = process.env.MASTERSHOP_API_KEY;
        const apiUrl = process.env.MASTERSHOP_API_URL || 'https://prod.api.mastershop.com/api';

        if (!apiKey) {
            throw new Error('MASTERSHOP_API_KEY is not configured');
        }

        try {
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
            // Get local product
            const product = await strapi.documents('api::product.product').findOne({
                documentId: productId,
                fields: ['name', 'mastershop_id', 'stock', 'price', 'cost_price', 'description'],
                populate: ['images']
            });

            if (!product || !product.mastershop_id) {
                return null;
            }

            // Fetch from MasterShop
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
                stockTotal?: number;
                basePrice?: number;
                suggestedPrice?: number;
                urlImageProduct?: string;
                name?: string;
                description?: string;
            }

            const remoteProduct = await response.json() as MasterShopProduct;

            // CORRECT PARSING LOGIC
            let productData = (remoteProduct as any).data || (remoteProduct as any).results || remoteProduct;

            // If it's an array (from results), take the first item
            if (Array.isArray(productData)) {
                productData = productData[0];
            }

            if (!productData) {
                strapi.log.warn(`⚠️ Empty data for product ${product.mastershop_id}`);
                return null;
            }

            // DEBUG LOGS
            strapi.log.info(`🔍 Debug Sync for ${productId}:`);
            strapi.log.info(`   - Stock: ${productData.stockTotal}`);
            strapi.log.info(`   - Image: ${productData.urlImageProduct}`);

            // 1. Calculate Field Updates
            const newStock = productData.stockTotal || productData.stock || 0;
            const newCost = productData.basePrice || productData.cost_price || 0;
            const newPrice = productData.suggestedPrice || productData.price || product.price;

            // 2. Image Synchronization Logic
            const remoteImageUrl = productData.urlImageProduct;
            let imageUploaded = false;

            if (remoteImageUrl && (!product.images || product.images.length === 0)) {
                try {
                    strapi.log.info(`🖼️ Downloading image from ${remoteImageUrl}...`);
                    const imgRes = await fetch(remoteImageUrl);
                    if (imgRes.ok) {
                        const buffer = await imgRes.arrayBuffer();
                        const fileName = `${product.mastershop_id}-${Date.now()}.jpg`;
                        const tempFilePath = path.join(os.tmpdir(), fileName);

                        // Write temp file
                        fs.writeFileSync(tempFilePath, Buffer.from(buffer));

                        // Debug log temp path
                        strapi.log.info(`   - Temp file created at: ${tempFilePath}`);

                        try {
                            // Upload to Strapi using path, WRAPPED IN ARRAY
                            // Adding filepath alias to be safe
                            await strapi.plugin('upload').service('upload').upload({
                                data: {
                                    refId: product.documentId,
                                    ref: 'api::product.product',
                                    field: 'images',
                                },
                                files: [{
                                    name: fileName,
                                    type: imgRes.headers.get('content-type') || 'image/jpeg',
                                    size: fs.statSync(tempFilePath).size,
                                    path: tempFilePath,
                                    filepath: tempFilePath,
                                }],
                            });
                            imageUploaded = true;
                            strapi.log.info('✅ Image uploaded successfully');
                        } finally {
                            // Clean up temp file safely (Async and silent fail)
                            if (fs.existsSync(tempFilePath)) {
                                fs.unlink(tempFilePath, (err) => {
                                    if (err) strapi.log.debug(`Could not delete temp file: ${err.message}`);
                                });
                            }
                        }
                    } else {
                        strapi.log.warn(`⚠️ Failed to download image: ${imgRes.status}`);
                    }
                } catch (imgErr) {
                    strapi.log.error(`❌ Failed to upload image:`, imgErr);
                }
            } else {
                strapi.log.info('ℹ️  Skipping image sync (Local images exist or no remote URL)');
            }

            // 3. Update Product Data (PUBLISHED)
            const updated = await strapi.documents('api::product.product').update({
                documentId: productId,
                status: 'published', // Ensuring we target the published version if draft mode is on
                data: {
                    name: productData.name || product.name,
                    description: productData.description || product.description,
                    stock: newStock,
                    cost_price: newCost,
                    price: newPrice,
                    last_sync_date: new Date(),
                },
            });

            strapi.log.info(`✅ Synced MasterShop product: ${updated.name}`);
            return updated;
        } catch (error) {
            strapi.log.error(`Failed to sync product ${productId}:`, (error as Error).message);
            return null;
        }
    },

    /**
     * Sync all products
     */
    async syncAllProducts() {
        const apiKey = process.env.MASTERSHOP_API_KEY;

        if (!apiKey) {
            return { success: false, message: 'API Key not configured' };
        }

        try {
            strapi.log.info('🔄 Starting MasterShop product synchronization...');

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
                if (result) successCount++;
                else errorCount++;
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            return {
                success: true,
                total: products.length,
                synced: successCount,
                errors: errorCount,
                timestamp: new Date().toISOString(),
            };

        } catch (error) {
            strapi.log.error('❌ Sync failed:', error);
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    },

    /**
     * Send an order to MasterShop
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
