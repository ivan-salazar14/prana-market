import { factories } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v2 as cloudinary } from 'cloudinary';

export default ({ strapi }) => ({
    /**
     * Search products in MasterShop API
     */
    async searchProducts(params: any = {}) {
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
            return (data as any).results || (data as any).data || data;
        } catch (error) {
            strapi.log.error('Failed to search MasterShop products:', error);
            throw error;
        }
    },

    /**
     * Story 4.1: MasterShop Catalog Ingestion & Schema Mapping Client
     * Ingests full catalog or specific page from MasterShop into Strapi api::product.product
     */
    async ingestMasterShopCatalog(params: { page?: number; limit?: number; search?: string; markupPercent?: number } = {}) {
        const apiKey = process.env.MASTERSHOP_API_KEY;
        const apiUrl = process.env.MASTERSHOP_API_URL || 'https://prod.api.mastershop.com/api';

        if (!apiKey) {
            return { success: false, message: 'MASTERSHOP_API_KEY is not configured' };
        }

        try {
            strapi.log.info('📥 Starting MasterShop catalog ingestion...');
            const remoteProducts = await this.searchProducts(params);
            const items = Array.isArray(remoteProducts) ? remoteProducts : remoteProducts.results || remoteProducts.data || [];

            strapi.log.info(`📦 Ingesting ${items.length} products from MasterShop...`);

            let createdCount = 0;
            let updatedCount = 0;
            let failedCount = 0;
            const errors: string[] = [];

            for (const item of items) {
                const mastershopId = item.id?.toString() || item.mastershop_id?.toString() || item.id_product?.toString();
                if (!mastershopId) continue;

                try {
                    // Check if product already exists in Strapi
                    const existingProducts = await strapi.documents('api::product.product').findMany({
                        filters: { mastershop_id: mastershopId },
                        limit: 1,
                    });

                    if (existingProducts.length > 0) {
                        const synced = await this.syncProduct(existingProducts[0].documentId);
                        if (synced) updatedCount++;
                        else failedCount++;
                    } else {
                        // Create new product mapping schema
                        const stock = item.stockTotal || item.stock || 0;
                        const baseCost = Number(item.basePrice || item.cost_price || item.cost || 0);
                        const suggestedPrice = Number(item.suggestedPrice || item.price || (baseCost * 1.3));
                        
                        // Default markup or discount logic
                        const markupPercent = params.markupPercent || 15;
                        const calculatedPrice = baseCost > 0 
                            ? Math.round(baseCost * (1 + (markupPercent / 100))) 
                            : Math.round(suggestedPrice);

                        const slugBase = (item.name || `mastershop-${mastershopId}`)
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)+/g, '');
                        const slug = `${slugBase}-${mastershopId}`;

                        const productData: any = {
                            name: item.name || `MasterShop Product ${mastershopId}`,
                            description: item.description || item.short_description || '',
                            price: calculatedPrice,
                            original_price: Math.round(suggestedPrice),
                            cost_price: baseCost,
                            discount_percentage: suggestedPrice > calculatedPrice ? Math.round(((suggestedPrice - calculatedPrice) / suggestedPrice) * 100) : 0,
                            stock: stock,
                            dropship_stock: stock,
                            sourcing_type: 'mastershop_dropship',
                            isActive: stock > 0,
                            mastershop_id: mastershopId,
                            supplier_sku: item.sku || `MS-${mastershopId}`,
                            supplier_id: item.productOwner?.idBusiness?.toString() || item.id_supplier?.toString() || 'default',
                            supplier_name: item.productOwner?.publicName || item.supplier_name || 'MasterShop Supplier',
                            slug: slug,
                            last_sync_date: new Date(),
                        };

                        const newProduct = await strapi.documents('api::product.product').create({
                            data: productData,
                            status: 'published',
                        });

                        // Image upload attempt
                        if (newProduct && newProduct.documentId) {
                            await this.syncProduct(newProduct.documentId);
                        }

                        createdCount++;
                    }
                } catch (err: any) {
                    failedCount++;
                    errors.push(`Product ${mastershopId}: ${err.message}`);
                    strapi.log.error(`❌ Error ingesting product ${mastershopId}:`, err);
                }

                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            return {
                success: true,
                totalIngested: items.length,
                created: createdCount,
                updated: updatedCount,
                failed: failedCount,
                errors,
            };
        } catch (error: any) {
            strapi.log.error('❌ Ingestion failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Story 4.2: Sync single product details, images, stock and availability
     */
    async syncProduct(productId: string) {
        const apiKey = process.env.MASTERSHOP_API_KEY;
        const apiUrl = process.env.MASTERSHOP_API_URL || 'https://prod.api.mastershop.com/api';

        if (!apiKey) return null;

        try {
            const product = await strapi.documents('api::product.product').findOne({
                documentId: productId,
                fields: ['name', 'mastershop_id', 'stock', 'dropship_stock', 'price', 'original_price', 'discount_percentage', 'cost_price', 'description', 'isActive', 'sourcing_type'],
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
                return null;
            }

            const remoteProduct = await response.json();
            let productData = (remoteProduct as any).data || (remoteProduct as any).results || remoteProduct;
            if (Array.isArray(productData)) productData = productData[0];

            if (!productData) {
                strapi.log.warn(`⚠️ Empty data for product ${product.mastershop_id}`);
                return null;
            }

            // 1. Calculate Stock & Price Updates
            const newStock = Number(productData.stockTotal ?? productData.stock ?? 0);
            const newCost = Number(productData.basePrice ?? productData.cost_price ?? product.cost_price ?? 0);
            const remotePrice = Number(productData.suggestedPrice ?? productData.price ?? product.price);

            // Calculate dynamic retail price (COP) with discount or margin
            const discountPercentage = product.discount_percentage || 10;
            const discountedPrice = Math.round(remotePrice * (1 - (discountPercentage / 100)));

            // Story 4.2: Automatically set product inactive/out-of-stock if supplier stock is 0
            const isActive = newStock > 0;

            // 2. Image Sync logic (Cloudinary CDN upload)
            const remoteImageUrl = productData.urlImageProduct || (productData.images && productData.images[0]);
            let uploadedFileId = null;

            if (remoteImageUrl && (!product.images || product.images.length === 0)) {
                try {
                    strapi.log.info(`🖼️ Downloading image from ${remoteImageUrl}...`);
                    const imgRes = await fetch(remoteImageUrl);

                    if (imgRes.ok) {
                        const buffer = await imgRes.arrayBuffer();
                        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
                        const extension = contentType.includes('png') ? 'png' : 'jpg';
                        const fileName = `${product.mastershop_id}-${Date.now()}.${extension}`;
                        
                        const tempPath = path.join(os.tmpdir(), fileName);
                        fs.writeFileSync(tempPath, Buffer.from(buffer));
                        
                        cloudinary.config({
                            cloud_name: process.env.CLOUDINARY_NAME,
                            api_key: process.env.CLOUDINARY_KEY,
                            api_secret: process.env.CLOUDINARY_SECRET,
                        });
                        
                        const uploadResult = await cloudinary.uploader.upload(tempPath, {
                            folder: 'prana-market',
                            public_id: `${product.mastershop_id}-${Date.now()}`,
                            resource_type: 'image',
                        });
                        
                        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                        
                        if (uploadResult && uploadResult.secure_url) {
                            try {
                                const fileRecord = await strapi.db.query('plugin::upload.file').create({
                                    data: {
                                        name: fileName,
                                        alternativeText: product.name,
                                        caption: product.name,
                                        url: uploadResult.secure_url,
                                        provider: 'cloudinary',
                                        provider_metadata: {
                                            public_id: uploadResult.public_id,
                                            version: uploadResult.version,
                                        },
                                        size: buffer.byteLength,
                                        mimeType: contentType,
                                        ext: extension,
                                    }
                                });
                                
                                if (fileRecord) uploadedFileId = fileRecord.id;
                            } catch (dbErr: any) {
                                strapi.log.warn(`⚠️ Could not save file record: ${dbErr.message}`);
                            }
                        }
                    }
                } catch (imgErr: any) {
                    strapi.log.error(`❌ Image upload failed for product ${product.mastershop_id}: ${imgErr.message}`);
                }
            }

            // 3. Update Product Data in Strapi
            const updateData: any = {
                name: productData.name || product.name,
                description: productData.description || product.description,
                stock: newStock,
                dropship_stock: newStock,
                cost_price: newCost,
                original_price: remotePrice,
                price: discountedPrice,
                discount_percentage: discountPercentage,
                supplier_id: productData.productOwner?.idBusiness?.toString() || product.supplier_id,
                supplier_name: productData.productOwner?.publicName || product.supplier_name,
                sourcing_type: 'mastershop_dropship',
                isActive: isActive,
                last_sync_date: new Date(),
            };

            if (uploadedFileId) {
                updateData.images = [uploadedFileId];
            }

            const updated = await strapi.documents('api::product.product').update({
                documentId: productId,
                status: 'published',
                data: updateData,
            });

            strapi.log.info(`✅ Synced product ${updated.name}: stock=${newStock}, active=${isActive}`);
            return updated;
        } catch (error: any) {
            strapi.log.error(`Failed to sync product ${productId}:`, error.message);
            return null;
        }
    },

    /**
     * Story 4.2: Automated Stock & Dynamic Price Synchronization
     * Background worker method to sync stock & pricing for all MasterShop products
     */
    async syncAllProducts() {
        const apiKey = process.env.MASTERSHOP_API_KEY;
        if (!apiKey) return { success: false, message: 'MASTERSHOP_API_KEY not configured' };

        try {
            strapi.log.info('🔄 [Cron/Worker] Synchronizing MasterShop stock and dynamic pricing...');
            const products = await strapi.documents('api::product.product').findMany({
                filters: { mastershop_id: { $notNull: true } },
                fields: ['name', 'mastershop_id', 'stock'],
                limit: 1000,
            });

            strapi.log.info(`📦 Found ${products.length} dropshipped products to sync`);
            let successCount = 0;
            let errorCount = 0;

            for (const product of products) {
                const result = await this.syncProduct(product.documentId);
                if (result) successCount++;
                else errorCount++;
                await new Promise(resolve => setTimeout(resolve, 600));
            }

            return {
                success: true,
                total: products.length,
                synced: successCount,
                failed: errorCount,
            };

        } catch (error: any) {
            strapi.log.error('❌ Stock & Price Sync failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Story 4.3: Automated Post-Payment Dropship Order Forwarding & Fault Isolation
     */
    async sendOrderToMasterShop(order: any) {
        if (!order || !order.id) {
            strapi.log.error('Invalid order object passed to MasterShop sync');
            return { success: false, error: 'Invalid order object' };
        }

        const apiKey = process.env.MASTERSHOP_API_KEY;
        const apiUrl = process.env.MASTERSHOP_API_URL || 'https://prod.api.mastershop.com/api';

        if (!apiKey) {
            strapi.log.warn('MasterShop API Key missing. Flagging order for retry.');
            return { success: false, error: 'API Key missing' };
        }

        try {
            const items = order.items || [];
            if (!Array.isArray(items) || items.length === 0) {
                strapi.log.info(`Order ${order.id} has no items. Skipping.`);
                return { success: false, error: 'No items in order' };
            }

            const masterShopItems = [];

            for (const item of items) {
                let product = null;
                const productId = item.product_document_id || item.id || item.documentId;
                if (productId) {
                    try {
                        product = await strapi.documents('api::product.product').findOne({
                            documentId: productId,
                            fields: ['mastershop_id', 'name', 'supplier_id', 'supplier_sku', 'sourcing_type']
                        });
                    } catch (err) {
                        try {
                            product = await strapi.db.query('api::product.product').findOne({
                                where: { $or: [{ documentId: productId }, { id: productId }] },
                                select: ['mastershop_id', 'name', 'supplier_id', 'supplier_sku', 'sourcing_type']
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
                strapi.log.info(`Order ${order.id} contains no dropshipped products. Skipping MasterShop dispatch.`);
                return { success: false, error: 'No MasterShop products in order' };
            }

            // Group items by supplier_id
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
                const cleanItems = currentSupplierItems.map(({ supplier_id, ...rest }) => rest);

                // Extract Customer Data
                const shipping = order.shippingAddress || {};
                const fullNameString = shipping.fullName || `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim() || 'Cliente Prana';
                const nameParts = fullNameString.split(' ');
                const firstName = nameParts[0] || 'Cliente';
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Prana';

                const addressObj = {
                    address1: shipping.address || 'Dirección Principal',
                    address2: shipping.neighborhood || 'N/A',
                    city: shipping.city || 'Bogotá',
                    country: 'CO',
                    phone: shipping.phone || '3000000000',
                    name: fullNameString,
                    full_name: fullNameString,
                    first_name: firstName,
                    last_name: lastName,
                    zip: '110111',
                    state: shipping.department || 'Cundinamarca',
                    company: 'Prana Market',
                };

                const customerObj = {
                    email: shipping.email || order.user?.email || 'cliente@pranamarket.co',
                    first_name: firstName,
                    last_name: lastName,
                    full_name: fullNameString,
                    documentType: 'CC',
                    documentNumber: shipping.phone || '111111111',
                    phone: shipping.phone || '3000000000'
                };

                const strapiPaymentMethod = order.paymentMethod || 'efectivo';
                let masterShopPaymentMethod = 'cod';
                if (strapiPaymentMethod === 'nequi' || strapiPaymentMethod === 'pago anticipado' || strapiPaymentMethod === 'stripe' || strapiPaymentMethod === 'wompi') {
                    masterShopPaymentMethod = 'pia';
                }

                const delivery = order.deliveryMethod || {};
                const carrier = delivery.carrier || delivery.name || 'Coordinadora';

                const subTotalItems = currentSupplierItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                let currentShippingCost = 0;
                if (i === 0) {
                    currentShippingCost = Number(order.deliveryCost) || 0;
                    if (currentShippingCost > 0 && cleanItems.length > 0) {
                        cleanItems[0].price = Number(cleanItems[0].price) + currentShippingCost;
                    }
                }
                const shipmentTotal = subTotalItems + (i === 0 ? currentShippingCost : 0);

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
                        `Pedido Prana Market #${orderIdStr}${supplierIds.length > 1 ? ` (Envío ${i + 1}/${supplierIds.length})` : ''}`,
                        `Proveedor: ${sId}`,
                    ]
                };

                strapi.log.info(`🚀 [MasterShop Order] Forwarding Order #${orderIdStr} (Shipment ${i + 1}/${supplierIds.length})...`);

                const response = await fetch(`${apiUrl}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'ms-api-key': apiKey },
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    const responseData = await response.json();
                    strapi.log.info(`✅ Shipment ${i + 1} synced! Remote ID: ${(responseData as any).id || (responseData as any).data?.id || 'OK'}`);
                    results.push({ success: true, data: responseData });
                } else {
                    const errorText = await response.text();
                    strapi.log.error(`❌ MasterShop Shipment ${i + 1} Error: ${response.status} - ${errorText}`);
                    results.push({ success: false, error: errorText, status: response.status });
                }
            }

            const isOverallSuccess = results.length > 0 && results.every(r => r.success);
            return {
                success: isOverallSuccess,
                results,
                error: isOverallSuccess ? undefined : results.find(r => !r.success)?.error || 'One or more shipments failed'
            };
        } catch (error: any) {
            strapi.log.error('Failed to sync order to MasterShop:', error.message);
            // Story 4.3: Fault isolation - return error details while preserving payment status
            return { success: false, error: error.message };
        }
    },

    /**
     * Story 4.4: Carrier Guide Ingestion & Customer Shipment Notifications
     * Polls MasterShop for shipped orders, updates tracking info, and triggers notifications
     */
    async syncCarrierGuides() {
        const apiKey = process.env.MASTERSHOP_API_KEY;
        const apiUrl = process.env.MASTERSHOP_API_URL || 'https://prod.api.mastershop.com/api';

        if (!apiKey) return { success: false, message: 'MASTERSHOP_API_KEY not configured' };

        try {
            strapi.log.info('🚚 [Carrier Sync] Checking MasterShop for order tracking guides...');

            // Find active orders waiting for tracking details
            const activeOrders = await strapi.documents('api::order.order').findMany({
                filters: {
                    mastershop_id: { $notNull: true },
                    shipping_status: { $in: ['pending', 'processing'] }
                },
                fields: ['id', 'mastershop_id', 'shipping_status', 'tracking_number', 'shippingAddress'],
                limit: 100,
            });

            strapi.log.info(`📦 Checking ${activeOrders.length} orders for tracking updates...`);
            let updatedCount = 0;

            for (const order of activeOrders) {
                try {
                    const mastershopId = order.mastershop_id;
                    const response = await fetch(`${apiUrl}/orders/${mastershopId}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json', 'ms-api-key': apiKey },
                    });

                    if (!response.ok) continue;

                    const remoteOrder: any = await response.json();
                    const orderData = remoteOrder.data || remoteOrder.results || remoteOrder;

                    // Extract tracking number & carrier details
                    const trackingNumber = orderData.tracking_number || orderData.shipping?.tracking_number || orderData.guide_number;
                    const carrier = orderData.carrier || orderData.shipping?.carrier || orderData.transportadora || 'Servientrega';

                    if (trackingNumber && trackingNumber !== order.tracking_number) {
                        const carrierUrls: Record<string, string> = {
                            'servientrega': `https://www.servientrega.com/wps/portal/rastreo-envio?guia=${trackingNumber}`,
                            'coordinadora': `https://coordinadora.com/rastreo/rastreo-de-guia.php?guia=${trackingNumber}`,
                            'interrapidisimo': `https://www.interrapidisimo.com/sigue-tu-envio/?guia=${trackingNumber}`,
                            'envia': `https://envia.co/guia/${trackingNumber}`,
                        };

                        const lowerCarrier = carrier.toLowerCase();
                        const matchingKey = Object.keys(carrierUrls).find(k => lowerCarrier.includes(k));
                        const trackingUrl = matchingKey ? carrierUrls[matchingKey] : `https://www.servientrega.com/wps/portal/rastreo-envio?guia=${trackingNumber}`;

                        // Update Order tracking information in Strapi
                        await strapi.documents('api::order.order').update({
                            documentId: order.documentId || order.id,
                            data: {
                                tracking_number: trackingNumber,
                                tracking_url: trackingUrl,
                                shipping_status: 'shipped',
                                status: 'shipped',
                            },
                        });

                        strapi.log.info(`✅ Updated Order #${order.id} with tracking guide ${trackingNumber} (${carrier})`);

                        // Dispatch Customer Notifications (Email & WhatsApp alert link)
                        await this.sendShipmentNotification(order, trackingNumber, carrier, trackingUrl);
                        updatedCount++;
                    }
                } catch (err: any) {
                    strapi.log.error(`Error syncing tracking for order ${order.id}:`, err.message);
                }
            }

            return { success: true, updated: updatedCount };
        } catch (error: any) {
            strapi.log.error('❌ Carrier guide sync failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Story 4.4: Dispatch Shipment Notification via Email & WhatsApp
     */
    async sendShipmentNotification(order: any, trackingNumber: string, carrier: string, trackingUrl: string) {
        try {
            const shipping = order.shippingAddress || {};
            const customerEmail = shipping.email || order.user?.email;
            const customerPhone = shipping.phone || '573000000000';
            const customerName = shipping.fullName || shipping.firstName || 'Cliente';

            strapi.log.info(`📩 Sending shipment notification for Order #${order.id} to ${customerEmail || customerPhone}...`);

            // 1. Email notification using Strapi Email plugin if configured
            if (customerEmail && strapi.plugins.email) {
                try {
                    await strapi.plugins.email.services.email.send({
                        to: customerEmail,
                        from: process.env.EMAIL_FROM || 'soporte@pranamarket.co',
                        subject: `🎉 Tu pedido #${order.id} de Prana Market ha sido despachado`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                                <h2>¡Tu pedido está en camino, ${customerName}!</h2>
                                <p>Tu paquete ha sido generado y despachado con la transportadora <strong>${carrier}</strong>.</p>
                                <p><strong>Número de Guía:</strong> ${trackingNumber}</p>
                                <p><a href="${trackingUrl}" target="_blank" style="background-color: #8b5cf6; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block;">Rastrear Paquete en Vivo</a></p>
                                <p>Gracias por comprar en Prana Market.</p>
                            </div>
                        `,
                    });
                    strapi.log.info(`✅ Shipment notification email sent to ${customerEmail}`);
                } catch (emailErr: any) {
                    strapi.log.warn(`⚠️ Could not send shipment email: ${emailErr.message}`);
                }
            }

            // 2. Format WhatsApp notification URL for customer support / automated dispatch
            const whatsappMsg = encodeURIComponent(
                `Hola ${customerName}, tu pedido #${order.id} de Prana Market fue despachado por ${carrier} con la guía #${trackingNumber}. Sigue tu envío aquí: ${trackingUrl}`
            );
            const whatsappUrl = `https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${whatsappMsg}`;

            strapi.log.info(`📲 WhatsApp notification alert link generated: ${whatsappUrl}`);

            return { success: true, trackingUrl, whatsappUrl };
        } catch (error: any) {
            strapi.log.error(`Failed to send shipment notification for order ${order.id}:`, error.message);
            return { success: false, error: error.message };
        }
    }
});

