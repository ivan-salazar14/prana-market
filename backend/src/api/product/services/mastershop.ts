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
     * Send Order to MasterShop
     */
    async sendOrderToMasterShop(order: any) {
        const apiKey = process.env.MASTERSHOP_API_KEY;
        const apiUrl = process.env.MASTERSHOP_API_URL || 'https://prod.api.mastershop.com/api';

        if (!apiKey) {
            strapi.log.warn('MasterShop API Key missing. Skipping order sync.');
            return;
        }

        try {
            // 1. Filter items that are synced with MasterShop
            const items = order.items || [];
            const masterShopItems = [];

            for (const item of items) {
                strapi.log.info(`Checking item: ${JSON.stringify(item)}`);
                // We need to fetch the product to check mastershop_id
                let product = null;

                // 1. Try Lookup by Document ID if available
                if (item.product_document_id || (typeof item.id === 'string' && item.id.length > 10)) {
                    try {
                        product = await strapi.documents('api::product.product').findOne({
                            documentId: item.product_document_id || item.id,
                            fields: ['mastershop_id', 'name']
                        });
                    } catch (err) { /* ignore and try next method */ }
                }

                // 2. Fallback: Lookup by Numeric ID via Low-level DB Query
                if (!product && item.id) {
                    strapi.log.info(`Looking up product via DB Query by ID: ${item.id}`);
                    try {
                        product = await strapi.db.query('api::product.product').findOne({
                            where: { id: item.id },
                            select: ['mastershop_id', 'name']
                        });

                        if (product) {
                            strapi.log.info(`Found product via DB: ${product.name} (MS ID: ${product.mastershop_id})`);
                        } else {
                            strapi.log.warn(`Product not found via DB for ID: ${item.id}`);
                        }
                    } catch (dbErr) {
                        strapi.log.error(`DB Query failed: ${dbErr.message}`);
                    }
                }

                if (product && product.mastershop_id) {
                    masterShopItems.push({
                        id_product: parseInt(product.mastershop_id),
                        id_variant: parseInt(product.mastershop_id), // Treating as simple product
                        sku: product.supplier_sku || `SKU-${product.mastershop_id}`,
                        name: product.name,
                        quantity: item.quantity,
                        price: item.price,
                        weight: 1 // Default weight as we don't track it
                    });
                }
            }

            if (masterShopItems.length === 0) {
                strapi.log.info(`Order ${order.id} has no MasterShop products. Skipping.`);
                return;
            }

            // 2. Extract Customer Data
            const shipping = order.shippingAddress || {};
            const fullNameString = shipping.fullName || `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim() || 'Cliente General';

            // Split name best effort
            const nameParts = fullNameString.split(' ');
            const firstName = nameParts[0] || 'Cliente';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'General';

            const addressObj = {
                address1: shipping.address || 'Dirección Principal',
                address2: shipping.neighborhood || 'N/A', // Using neighborhood as address line 2 or default
                city: shipping.city || 'Desconocida',
                country: 'CO', // ISO 2 char code
                phone: shipping.phone || '0000000000',
                name: fullNameString,
                full_name: fullNameString,
                first_name: firstName,
                last_name: lastName,
                zip: '000000',
                state: shipping.department || 'Antioquia',
                company: 'Particular', // Must be non-empty
            };

            const customerObj = {
                email: shipping.email || order.user?.email || 'no-email@provided.com',
                first_name: firstName,
                last_name: lastName,
                full_name: fullNameString, // Restored
                documentType: 'CC',
                documentNumber: shipping.phone || '111111111',
                phone: shipping.phone || '0000000000'
            };

            // 3. Map Payment Method (cod / pia)
            const strapiPaymentMethod = order.paymentMethod || 'efectivo';
            let masterShopPaymentMethod = 'cod'; // Default

            if (strapiPaymentMethod === 'nequi' || strapiPaymentMethod === 'pago anticipado') {
                masterShopPaymentMethod = 'pia';
            } else if (strapiPaymentMethod === 'efectivo' || strapiPaymentMethod === 'cod') {
                masterShopPaymentMethod = 'cod';
            }

            // 4. Carrier
            const delivery = order.deliveryMethod || {};
            const carrier = delivery.carrier || delivery.name || 'Local';

            // DISTRIBUTE SHIPPING COST into the first item to satisfy "Total must match Sum of Items"
            // and avoid "Multiple Providers" error from dummy shipping items.
            if (masterShopItems.length > 0) {
                const deliveryCost = Number(order.deliveryCost) || 0;
                if (deliveryCost > 0) {
                    masterShopItems[0].price = Number(masterShopItems[0].price) + deliveryCost;
                    strapi.log.info(`Added shipping cost ${deliveryCost} to item ${masterShopItems[0].name}. New Price: ${masterShopItems[0].price}`);
                }
            }

            // 5. Construct Payload
            const payload = {
                id_order: order.id.toString(),
                customer: customerObj,
                shipping_address: addressObj,
                billing_address: addressObj,
                order_items: masterShopItems,
                payment: {
                    method: masterShopPaymentMethod,
                    total: order.total,
                    shipping_cost: 0 // Zeroed out as it is in item price
                },
                order_transaction: {
                    transaction_id: order.transactionId || `TRX-${order.id}`,
                    status: 'APPROVED',
                    payment_method: masterShopPaymentMethod,
                    total: order.total,
                    currency: 'COP'
                },
                shipping: {
                    carrier: carrier,
                    cost: 0
                },
                notes: [`Pedido desde Prana Market #${order.id}`, `Incluye envío: ${order.deliveryCost}`]
            };

            strapi.log.info(`🚀 Sending Order #${order.id} to MasterShop...`);
            // strapi.log.debug(JSON.stringify(payload, null, 2));

            const response = await fetch(`${apiUrl}/orders`, { // Correct endpoint is /orders
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ms-api-key': apiKey
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const responseData = await response.json();
                strapi.log.info(`✅ Order #${order.id} synced to MasterShop! Remote ID: ${(responseData as any).id || 'N/A'}`);
                return { success: true, data: responseData };
            } else {
                const errorText = await response.text();
                strapi.log.error(`❌ MasterShop Order Error: ${response.status} - ${errorText}`);
                return { success: false, error: errorText };
            }
        } catch (error) {
            strapi.log.error('Failed to sync order to MasterShop:', error);
            return { success: false, error: (error as Error).message };
        }
    }
});
