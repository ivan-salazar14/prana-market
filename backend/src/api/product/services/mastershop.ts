import { factories } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';
import os from 'os';

export default ({ strapi }) => ({
    /**
     * Search products
     */
    async searchProducts(params: any = {}) {
        // ... (Keep existing search logic)
        const apiKey = process.env.MASTERSHOP_API_KEY;
        const apiUrl = process.env.MASTERSHOP_API_URL || 'https://prod.api.mastershop.com/api';
        if (!apiKey) throw new Error('MASTERSHOP_API_KEY is not configured');

        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.search) queryParams.append('search', params.search);
            const endpoint = `${apiUrl}/products?${queryParams.toString()}`;
            strapi.log.info(`Searching MasterShop products: ${endpoint}`);
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'ms-api-key': apiKey },
            });
            if (!response.ok) throw new Error(`MasterShop API error: ${response.status}`);
            const data = await response.json();
            return (data as any).results || data;
        } catch (error) {
            strapi.log.error('Failed to search:', error);
            throw error;
        }
    },

    /**
     * Sync single product
     */
    async syncProduct(productId: string) {
        const apiKey = process.env.MASTERSHOP_API_KEY;
        const apiUrl = process.env.MASTERSHOP_API_URL || 'https://prod.api.mastershop.com/api';

        if (!apiKey) return null;

        try {
            const product = await strapi.documents('api::product.product').findOne({
                documentId: productId,
                fields: ['name', 'mastershop_id', 'stock', 'price', 'cost_price', 'description'],
                populate: ['images']
            });

            if (!product || !product.mastershop_id) return null;

            // Fetch from MasterShop
            const response = await fetch(`${apiUrl}/products/${product.mastershop_id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'ms-api-key': apiKey },
            });

            if (!response.ok) {
                strapi.log.error(`MasterShop sync error for ${product.mastershop_id}: ${response.status}`);
                return null; // Skip this product on error (e.g. 403)
            }

            const remoteProduct = await response.json();
            let productData = (remoteProduct as any).data || (remoteProduct as any).results || remoteProduct;
            if (Array.isArray(productData)) productData = productData[0];

            if (!productData) {
                strapi.log.warn(`⚠️ Empty data for product ${product.mastershop_id}`);
                return null;
            }

            strapi.log.info(`🔍 Debug Sync for ${productId}: Stock=${productData.stockTotal}`);

            // 1. Calculate Field Updates
            const newStock = productData.stockTotal || productData.stock || 0;
            const newCost = productData.basePrice || productData.cost_price || 0;
            const newPrice = productData.suggestedPrice || productData.price || product.price;

            // 2. Image Synchro logic (Manual Bypass Strategy)
            const remoteImageUrl = productData.urlImageProduct;
            let uploadedFileId = null;

            if (remoteImageUrl && (!product.images || product.images.length === 0)) {
                try {
                    strapi.log.info(`🖼️ Downloading image from ${remoteImageUrl}...`);
                    const imgRes = await fetch(remoteImageUrl);

                    if (imgRes.ok) {
                        const buffer = await imgRes.arrayBuffer();
                        const fileName = `${product.mastershop_id}-${Date.now()}.jpg`;

                        // MANUAL UPLOAD BYPASS (Works for Local Provider)
                        // 1. Save to public/uploads
                        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

                        const targetPath = path.join(uploadDir, fileName);
                        fs.writeFileSync(targetPath, Buffer.from(buffer));

                        strapi.log.info(`   - Saved to disk: ${targetPath}`);

                        // 2. Create DB Entry directly
                        const fileEntry = await strapi.db.query('plugin::upload.file').create({
                            data: {
                                name: fileName,
                                alternativeText: product.name,
                                caption: product.name,
                                width: 0,
                                height: 0,
                                formats: null,
                                hash: path.basename(fileName, '.jpg'),
                                ext: '.jpg',
                                mime: 'image/jpeg',
                                size: buffer.byteLength / 1024, // KB
                                url: `/uploads/${fileName}`,
                                previewUrl: null,
                                provider: 'local',
                                provider_metadata: null,
                                folderPath: '/',
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }
                        });

                        if (fileEntry && fileEntry.id) {
                            uploadedFileId = fileEntry.id;
                            strapi.log.info(`✅ Image manually registered in DB (ID: ${fileEntry.id})`);
                        }

                    }
                } catch (imgErr) {
                    strapi.log.error(`❌ Manual upload failed: ${(imgErr as Error).message}`);
                }
            }

            // 3. Update Product Data
            const updateData: any = {
                name: productData.name || product.name,
                description: productData.description || product.description,
                stock: newStock,
                cost_price: newCost,
                price: newPrice,
                last_sync_date: new Date(),
            };

            // If we uploaded an image, link it
            if (uploadedFileId) {
                updateData.images = [uploadedFileId];
            }

            const updated = await strapi.documents('api::product.product').update({
                documentId: productId,
                status: 'published',
                data: updateData,
            });

            strapi.log.info(`✅ Synced: ${updated.name}`);
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
        // ... (Keep existing loop logic)
        const apiKey = process.env.MASTERSHOP_API_KEY;
        if (!apiKey) return { success: false, message: 'API Key not configured' };

        try {
            strapi.log.info('🔄 Starting MasterShop product synchronization...');
            const products = await strapi.documents('api::product.product').findMany({
                filters: { mastershop_id: { $notNull: true } },
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
            };

        } catch (error) {
            strapi.log.error('❌ Sync failed:', error);
            return { success: false, error: (error as Error).message };
        }
    },

    /**
     * Create Order
     */
    async createOrder(orderData: any) {
        // ... (Keep existing order logic)
        const apiKey = process.env.MASTERSHOP_API_KEY;
        const apiUrl = process.env.MASTERSHOP_API_URL || 'https://prod.api.mastershop.com/api';
        if (!apiKey) throw new Error('MASTERSHOP_API_KEY is missing');

        try {
            const response = await fetch(`${apiUrl}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ms-api-key': apiKey },
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
