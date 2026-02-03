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
                supplier_id: productData.productOwner?.idBusiness?.toString(),
                supplier_name: productData.productOwner?.publicName,
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
                strapi.log.info(`Checking item for MasterShop sync: ${JSON.stringify(item)}`);
                let product = null;

                // Lookup by ID/DocumentID
                if (item.product_document_id || (typeof item.id === 'string' && item.id.length > 10)) {
                    try {
                        product = await strapi.documents('api::product.product').findOne({
                            documentId: item.product_document_id || item.id,
                            fields: ['mastershop_id', 'name', 'supplier_id', 'supplier_sku']
                        });
                    } catch (err) { /* ignore */ }
                }

                if (!product && item.id) {
                    try {
                        product = await strapi.db.query('api::product.product').findOne({
                            where: { id: item.id },
                            select: ['mastershop_id', 'name', 'supplier_id', 'supplier_sku']
                        });
                    } catch (dbErr) { /* ignore */ }
                }

                if (product && product.mastershop_id) {
                    masterShopItems.push({
                        id_product: parseInt(product.mastershop_id),
                        id_variant: parseInt(product.mastershop_id),
                        sku: product.supplier_sku || `SKU-${product.mastershop_id}`,
                        name: product.name,
                        quantity: item.quantity,
                        price: item.price,
                        weight: 1,
                        supplier_id: product.supplier_id || 'default'
                    });
                }
            }

            if (masterShopItems.length === 0) {
                strapi.log.info(`Order ${order.id} has no MasterShop products. Skipping.`);
                return;
            }

            // 2. Group items by supplier_id
            const itemsBySupplier: { [key: string]: any[] } = {};
            masterShopItems.forEach(item => {
                const sId = item.supplier_id;
                if (!itemsBySupplier[sId]) itemsBySupplier[sId] = [];
                itemsBySupplier[sId].push(item);
            });

            const supplierIds = Object.keys(itemsBySupplier);
            strapi.log.info(`Order #${order.id} split into ${supplierIds.length} MasterShop shipments.`);

            const results = [];

            for (let i = 0; i < supplierIds.length; i++) {
                const sId = supplierIds[i];
                const currentSupplierItems = itemsBySupplier[sId];

                // Remove the temporary supplier_id from the payload items
                const cleanItems = currentSupplierItems.map(({ supplier_id, ...rest }) => rest);

                // 3. Extract Customer Data
                const shipping = order.shippingAddress || {};
                const fullNameString = shipping.fullName || `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim() || 'Cliente General';
                const nameParts = fullNameString.split(' ');
                const firstName = nameParts[0] || 'Cliente';
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'General';

                const addressObj = {
                    address1: shipping.address || 'Dirección Principal',
                    address2: shipping.neighborhood || 'N/A',
                    city: shipping.city || 'Desconocida',
                    country: 'CO',
                    phone: shipping.phone || '0000000000',
                    name: fullNameString,
                    full_name: fullNameString,
                    first_name: firstName,
                    last_name: lastName,
                    zip: '000000',
                    state: shipping.department || 'Antioquia',
                    company: 'Particular',
                };

                const customerObj = {
                    email: shipping.email || order.user?.email || 'no-email@provided.com',
                    first_name: firstName,
                    last_name: lastName,
                    full_name: fullNameString,
                    documentType: 'CC',
                    documentNumber: shipping.phone || '111111111',
                    phone: shipping.phone || '0000000000'
                };

                // 4. Payment Method
                const strapiPaymentMethod = order.paymentMethod || 'efectivo';
                let masterShopPaymentMethod = 'cod';
                if (strapiPaymentMethod === 'nequi' || strapiPaymentMethod === 'pago anticipado') {
                    masterShopPaymentMethod = 'pia';
                }

                // 5. Carrier
                const delivery = order.deliveryMethod || {};
                const carrier = delivery.carrier || delivery.name || 'Local';

                const subTotalItems = currentSupplierItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

                let currentShippingCost = 0;
                if (i === 0) {
                    currentShippingCost = Number(order.deliveryCost) || 0;
                    if (currentShippingCost > 0 && cleanItems.length > 0) {
                        cleanItems[0].price = Number(cleanItems[0].price) + currentShippingCost;
                    }
                }

                const shipmentTotal = subTotalItems + (i === 0 ? currentShippingCost : 0);

                // 6. Construct Payload
                const payload = {
                    id_order: supplierIds.length > 1 ? `${order.id}-${i + 1}` : order.id.toString(),
                    customer: customerObj,
                    shipping_address: addressObj,
                    billing_address: addressObj,
                    order_items: cleanItems,
                    payment: {
                        method: masterShopPaymentMethod,
                        total: shipmentTotal,
                        shipping_cost: 0
                    },
                    order_transaction: {
                        transaction_id: order.transactionId || `TRX-${order.id}-${i + 1}`,
                        status: 'APPROVED',
                        payment_method: masterShopPaymentMethod,
                        total: shipmentTotal,
                        currency: 'COP'
                    },
                    shipping: { carrier, cost: 0 },
                    notes: [
                        `Pedido Prana #${order.id}${supplierIds.length > 1 ? ` (Envío ${i + 1}/${supplierIds.length})` : ''}`,
                        `Proveedor: ${sId}`,
                    ]
                };

                strapi.log.info(`🚀 Sending Order #${order.id} (Shipment ${i + 1}/${supplierIds.length}) to MasterShop...`);

                const response = await fetch(`${apiUrl}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'ms-api-key': apiKey },
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    const responseData = await response.json();
                    strapi.log.info(`✅ Shipment ${i + 1} synced! Remote ID: ${(responseData as any).id || 'N/A'}`);
                    results.push({ success: true, data: responseData });
                } else {
                    const errorText = await response.text();
                    strapi.log.error(`❌ MasterShop Shipment ${i + 1} Error: ${response.status} - ${errorText}`);
                    results.push({ success: false, error: errorText });
                }
            }

            return { success: results.every(r => r.success), results };
        } catch (error) {
            strapi.log.error('Failed to sync order to MasterShop:', error);
            return { success: false, error: (error as Error).message };
        }
    }
});
