import { factories } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v2 as cloudinary } from 'cloudinary';

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
                fields: ['name', 'mastershop_id', 'stock', 'price', 'original_price', 'discount_percentage', 'cost_price', 'description'],
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
            const remotePrice = productData.suggestedPrice || productData.price || product.price;

            // Apply 10% discount
            const discountPercentage = 10;
            const discountedPrice = Math.round(remotePrice * (1 - (discountPercentage / 100)));

            // 2. Image Sync logic (Using Cloudinary directly for reliable uploads)
            const remoteImageUrl = productData.urlImageProduct;
            let uploadedFileId = null;

            // Force reimport: always try to download image if remote URL exists
            if (remoteImageUrl) {
                try {
                    // Delete existing images first to avoid duplicates
                    if (product.images && product.images.length > 0) {
                        strapi.log.info(`🗑️ Deleting ${product.images.length} existing images...`);
                        for (const existingImage of product.images) {
                            if (existingImage.id) {
                                try {
                                    await strapi.plugins.upload.services.upload.delete(existingImage.id);
                                } catch (delErr) {
                                    strapi.log.warn(`⚠️ Could not delete image ${existingImage.id}: ${(delErr as Error).message}`);
                                }
                            }
                        }
                    }
                    
                    strapi.log.info(`🖼️ Downloading image from ${remoteImageUrl}...`);
                    const imgRes = await fetch(remoteImageUrl);

                    if (imgRes.ok) {
                        const buffer = await imgRes.arrayBuffer();
                        
                        // Get mime type from response headers
                        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
                        
                        // Determine file extension based on mime type
                        const mimeToExt: Record<string, string> = {
                            'image/jpeg': 'jpg',
                            'image/jpg': 'jpg',
                            'image/png': 'png',
                            'image/webp': 'webp',
                            'image/gif': 'gif',
                        };
                        const extension = mimeToExt[contentType] || 'jpg';
                        const fileName = `${product.mastershop_id}-${Date.now()}.${extension}`;
                        
                        // Write temp file for upload
                        const tempPath = path.join(os.tmpdir(), fileName);
                        fs.writeFileSync(tempPath, Buffer.from(buffer));
                        
                        // Configure Cloudinary
                        cloudinary.config({
                            cloud_name: process.env.CLOUDINARY_NAME,
                            api_key: process.env.CLOUDINARY_KEY,
                            api_secret: process.env.CLOUDINARY_SECRET,
                        });
                        
                        // Upload directly to Cloudinary
                        const uploadResult = await cloudinary.uploader.upload(tempPath, {
                            folder: 'prana-market',
                            public_id: `${product.mastershop_id}-${Date.now()}`,
                            resource_type: 'image',
                        });
                        
                        // Cleanup temp file
                        if (fs.existsSync(tempPath)) {
                            fs.unlinkSync(tempPath);
                        }
                        
                        strapi.log.info(`☁️ Cloudinary upload result: ${JSON.stringify(uploadResult)}`);
                        
                        if (uploadResult && uploadResult.secure_url) {
                            // Create file entry manually with Cloudinary URL
                            const fileEntryCreated = await strapi.plugins.upload.services.upload.create({
                                name: fileName,
                                alternativeText: product.name,
                                caption: product.name,
                                url: uploadResult.secure_url,
                                provider: 'cloudinary',
                                provider_metadata: {
                                    public_id: uploadResult.public_id,
                                    version: uploadResult.version,
                                    version_id: uploadResult.version_id,
                                },
                                size: buffer.byteLength,
                                mimeType: contentType,
                                ext: extension,
                            });
                            
                            if (fileEntryCreated && fileEntryCreated.id) {
                                uploadedFileId = fileEntryCreated.id;
                                strapi.log.info(`✅ Image created with Cloudinary URL (ID: ${fileEntryCreated.id}, URL: ${uploadResult.secure_url})`);
                            } else {
                                strapi.log.warn(`⚠️ Could not create file entry in Strapi, but image is in Cloudinary: ${uploadResult.secure_url}`);
                            }
                        }

                    } else {
                        strapi.log.warn(`⚠️ Could not fetch image from ${remoteImageUrl}: ${imgRes.status}`);
                    }
                } catch (imgErr) {
                    strapi.log.error(`❌ Image upload failed: ${(imgErr as Error).message}`);
                }
            }

            // 3. Update Product Data
            const updateData: any = {
                name: productData.name || product.name,
                description: productData.description || product.description,
                stock: newStock,
                cost_price: newCost,
                original_price: remotePrice,
                price: discountedPrice,
                discount_percentage: discountPercentage,
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
        if (!order || !order.id) {
            strapi.log.error('Invalid order object passed to MasterShop sync');
            return { success: false, error: 'Invalid order object' };
        }

        const apiKey = process.env.MASTERSHOP_API_KEY;
        const apiUrl = process.env.MASTERSHOP_API_URL || 'https://prod.api.mastershop.com/api';

        if (!apiKey) {
            strapi.log.warn('MasterShop API Key missing. Skipping order sync.');
            return { success: false, error: 'API Key missing' };
        }

        try {
            // 1. Filter items that are synced with MasterShop
            const items = order.items || [];
            if (!Array.isArray(items) || items.length === 0) {
                strapi.log.info(`Order ${order.id} has no items. Skipping.`);
                return { success: false, error: 'No items in order' };
            }

            const masterShopItems = [];

            for (const item of items) {
                strapi.log.info(`Checking item for MasterShop sync: ${JSON.stringify(item)}`);
                let product = null;

                // Lookup by ID/DocumentID
                const productId = item.product_document_id || item.id || item.documentId;
                if (productId) {
                    try {
                        // Try documents API first (Strapi 5)
                        product = await strapi.documents('api::product.product').findOne({
                            documentId: productId,
                            fields: ['mastershop_id', 'name', 'supplier_id', 'supplier_sku']
                        });
                    } catch (err) {
                        try {
                            // Fallback to db query
                            product = await strapi.db.query('api::product.product').findOne({
                                where: { $or: [{ documentId: productId }, { id: productId }] },
                                select: ['mastershop_id', 'name', 'supplier_id', 'supplier_sku']
                            });
                        } catch (dbErr) { /* ignore */ }
                    }
                }

                if (product && product.mastershop_id) {
                    masterShopItems.push({
                        id_product: parseInt(product.mastershop_id),
                        id_variant: parseInt(product.mastershop_id),
                        sku: product.supplier_sku || `SKU-${product.mastershop_id}`,
                        name: product.name,
                        quantity: Number(item.quantity) || 1,
                        price: Number(item.price) || 0,
                        weight: 1,
                        supplier_id: product.supplier_id || 'default'
                    });
                }
            }

            if (masterShopItems.length === 0) {
                strapi.log.info(`Order ${order.id} has no MasterShop products. Skipping.`);
                return { success: false, error: 'No MasterShop products in order' };
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
            const orderIdStr = order.id.toString();

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

                const subTotalItems = currentSupplierItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                let currentShippingCost = 0;
                if (i === 0) {
                    currentShippingCost = Number(order.deliveryCost) || 0;
                    if (currentShippingCost > 0 && cleanItems.length > 0) {
                        cleanItems[0].price = Number(cleanItems[0].price) + currentShippingCost;
                    }
                }

                const shipmentTotal = subTotalItems + (i === 0 ? currentShippingCost : 0);

                // 6. Construct Payload
                const payload: any = {
                    id_order: supplierIds.length > 1 ? `${orderIdStr}-${i + 1}` : orderIdStr,
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
                        transaction_id: order.transactionId || `TRX-${orderIdStr}-${i + 1}`,
                        status: 'APPROVED',
                        payment_method: masterShopPaymentMethod,
                        total: shipmentTotal,
                        currency: 'COP'
                    },
                    shipping: { carrier, cost: 0 },
                    notes: [
                        `Pedido Prana #${orderIdStr}${supplierIds.length > 1 ? ` (Envío ${i + 1}/${supplierIds.length})` : ''}`,
                        `Proveedor: ${sId}`,
                    ]
                };

                strapi.log.info(`[MasterShop] Payload for Shipment ${i + 1}: ${JSON.stringify(payload)}`);
                strapi.log.info(`🚀 Sending Order #${orderIdStr} (Shipment ${i + 1}/${supplierIds.length}) to MasterShop...`);

                const response = await fetch(`${apiUrl}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'ms-api-key': apiKey },
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    const responseData = await response.json();
                    strapi.log.info(`✅ Shipment ${i + 1} synced! Remote ID: ${(responseData as any).id || (responseData as any).data?.id || 'N/A'}`);
                    results.push({ success: true, data: responseData });
                } else {
                    const errorText = await response.text();
                    strapi.log.error(`❌ MasterShop Shipment ${i + 1} Error: ${response.status} - ${errorText}`);
                    results.push({ success: false, error: errorText });
                }
            }

            return { success: results.some(r => r.success), results };
        } catch (error: any) {
            strapi.log.error('Failed to sync order to MasterShop:', error.message);
            return { success: false, error: error.message };
        }
    }
});
