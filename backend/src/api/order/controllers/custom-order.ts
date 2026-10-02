import { factories } from '@strapi/strapi';
import { sendOrderEmail } from '../services/order';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  /**
   * Public Order Tracking Endpoint
   * Allows customers to track order by Order ID and Phone/Email
   */
  async trackOrder(ctx) {
    const { orderId, contact } = ctx.request.body || ctx.query;

    if (!orderId || !contact) {
      return ctx.badRequest('Se requiere el número de pedido y correo o teléfono.');
    }

    const cleanOrderId = String(orderId).trim().replace(/^#?PM-?/i, '');
    const cleanContact = String(contact).trim().toLowerCase();

    try {
      // Find orders matching numeric ID, documentId, transactionId, or mastershop_id
      const orders = await strapi.documents('api::order.order').findMany({
        filters: {
          $or: [
            { id: isNaN(Number(cleanOrderId)) ? -1 : Number(cleanOrderId) },
            { documentId: orderId },
            { transactionId: orderId },
            { mastershop_id: orderId },
          ],
        },
        populate: ['user'],
        limit: 5,
      });

      if (!orders || orders.length === 0) {
        return ctx.notFound('No se encontró ningún pedido con el número proporcionado.');
      }

      // Validate contact matching (email or phone)
      const matchedOrder = orders.find((ord: any) => {
        const shipEmail = ord.shippingAddress?.email?.toLowerCase();
        const shipPhone = ord.shippingAddress?.phone?.replace(/\D/g, '');
        const userEmail = ord.user?.email?.toLowerCase();
        const userPhone = ord.user?.phone?.replace(/\D/g, '');
        const cleanContactDigits = cleanContact.replace(/\D/g, '');

        const emailMatch = (shipEmail && shipEmail === cleanContact) || (userEmail && userEmail === cleanContact);
        const phoneMatch = cleanContactDigits.length >= 7 && (
          (shipPhone && shipPhone.includes(cleanContactDigits)) ||
          (userPhone && userPhone.includes(cleanContactDigits))
        );

        return emailMatch || phoneMatch;
      });

      if (!matchedOrder) {
        return ctx.badRequest('El correo o teléfono ingresado no coincide con el pedido.');
      }

      // Build milestone status progression
      const statusMap: Record<string, number> = {
        pending: 1,
        paid: 2,
        processing: 2,
        shipped: 3,
        in_transit: 3,
        delivered: 4,
        cancelled: 0,
        refunded: 0,
      };

      const currentStep = statusMap[matchedOrder.status] || 1;

      // Group items into local express vs dropship packages
      const rawItems = Array.isArray(matchedOrder.items) ? matchedOrder.items : [];
      const localItems = rawItems.filter((i: any) => i.sourcing_type !== 'mastershop_dropship');
      const dropshipItems = rawItems.filter((i: any) => i.sourcing_type === 'mastershop_dropship');

      // Infer carrier if tracking_url or tracking_number exists
      let carrierName = matchedOrder.mastershop_data?.carrier || 'Transportadora Nacional';
      if (matchedOrder.tracking_url) {
        const url = matchedOrder.tracking_url.toLowerCase();
        if (url.includes('servientrega')) carrierName = 'Servientrega';
        else if (url.includes('coordinadora')) carrierName = 'Coordinadora';
        else if (url.includes('interrapidisimo')) carrierName = 'Interrapidísimo';
        else if (url.includes('envia')) carrierName = 'Envía';
      }

      return ctx.send({
        success: true,
        data: {
          orderNumber: `#PM-${matchedOrder.id}`,
          rawId: matchedOrder.id,
          documentId: matchedOrder.documentId,
          createdAt: matchedOrder.createdAt,
          status: matchedOrder.status,
          shippingStatus: matchedOrder.shipping_status || 'pending',
          currentStep,
          total: matchedOrder.total,
          subtotal: matchedOrder.subtotal,
          deliveryCost: matchedOrder.deliveryCost,
          paymentMethod: matchedOrder.paymentMethod,
          trackingNumber: matchedOrder.tracking_number || null,
          trackingUrl: matchedOrder.tracking_url || null,
          carrierName,
          shippingAddress: {
            fullName: matchedOrder.shippingAddress?.fullName || 'Cliente Prana',
            city: matchedOrder.shippingAddress?.city || 'Colombia',
            department: matchedOrder.shippingAddress?.department || '',
            address: matchedOrder.shippingAddress?.address ? `${matchedOrder.shippingAddress.address.substring(0, 10)}...` : '',
          },
          packages: {
            local: {
              count: localItems.length,
              items: localItems,
              badge: '📦 Envío Exprés Local',
            },
            dropship: {
              count: dropshipItems.length,
              items: dropshipItems,
              badge: '🌿 Dropshipping Nacional (Mastershop)',
              mastershopOrderId: matchedOrder.mastershop_id || null,
            },
          },
        },
      });
    } catch (error: any) {
      strapi.log.error('Error tracking order:', error);
      return ctx.internalServerError('Error al consultar la guía de rastreo.');
    }
  },

  /**
   * Returns operational dropship sync logs and retry status
   */
  async getDropshipSyncStatus(ctx) {
    try {
      const orders = await strapi.documents('api::order.order').findMany({
        populate: ['user'],
        limit: 100,
      });

      const dropshipOrders = orders.filter((ord: any) => {
        const hasDropshipItems = Array.isArray(ord.items) && ord.items.some((i: any) => i.sourcing_type === 'mastershop_dropship');
        return hasDropshipItems || ord.mastershop_id || ord.sync_mastershop || ord.mastershop_data;
      });

      const totalDropshipOrders = dropshipOrders.length;
      const syncedOrders = dropshipOrders.filter((ord: any) => ord.mastershop_id && !ord.sync_mastershop && !ord.mastershop_data?.error);
      const pendingFailedOrders = dropshipOrders.filter((ord: any) => ord.sync_mastershop || ord.mastershop_data?.error);

      const formattedFailedOrders = pendingFailedOrders.map((ord: any) => ({
        id: ord.id,
        documentId: ord.documentId,
        orderNumber: `#PM-${ord.id}`,
        createdAt: ord.createdAt,
        total: ord.total,
        status: ord.status,
        customerName: ord.shippingAddress?.fullName || ord.user?.username || 'Cliente',
        customerEmail: ord.shippingAddress?.email || ord.user?.email || 'N/A',
        syncMastershop: ord.sync_mastershop,
        mastershopOrderId: ord.mastershop_id || null,
        error: ord.mastershop_data?.error || 'Pendiente por despachar a Mastershop',
      }));

      return ctx.send({
        success: true,
        metrics: {
          totalDropshipOrders,
          syncedCount: syncedOrders.length,
          pendingRetryCount: pendingFailedOrders.length,
        },
        failedOrders: formattedFailedOrders,
        recentOrders: dropshipOrders.slice(0, 10).map((ord: any) => ({
          id: ord.id,
          orderNumber: `#PM-${ord.id}`,
          status: ord.status,
          mastershopId: ord.mastershop_id,
          syncMastershop: ord.sync_mastershop,
        })),
      });
    } catch (error: any) {
      strapi.log.error('Error fetching dropship sync status:', error);
      return ctx.internalServerError('Error al obtener monitor de dropshipping.');
    }
  },

  /**
   * Admin endpoint to update order status and tracking details
   */
  async updateOrderStatus(ctx) {
    const { id } = ctx.params;
    const { status, shipping_status, tracking_number, tracking_url } = ctx.request.body;

    try {
      const order = await strapi.documents('api::order.order').findOne({
        documentId: id,
      });

      let realOrder = order;
      if (!realOrder) {
        const list = await strapi.documents('api::order.order').findMany({
          filters: { id: id },
          limit: 1,
        });
        if (list.length > 0) realOrder = list[0];
      }

      if (!realOrder) {
        return ctx.notFound('Pedido no encontrado');
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (shipping_status) updateData.shipping_status = shipping_status;
      if (tracking_number) updateData.tracking_number = tracking_number;
      if (tracking_url) updateData.tracking_url = tracking_url;

      const updated = await strapi.documents('api::order.order').update({
        documentId: realOrder.documentId,
        data: updateData,
      });

      // Send update email if status changes to shipped or delivered
      if (status === 'shipped' || status === 'delivered') {
        try {
          await sendOrderEmail(strapi, updated);
        } catch (emailErr) {
          strapi.log.warn('Could not send status update email:', emailErr);
        }
      }

      return ctx.send({
        success: true,
        message: 'Estado de orden actualizado correctamente',
        data: updated,
      });
    } catch (error: any) {
      strapi.log.error('Error updating order status:', error);
      return ctx.internalServerError('Error al actualizar el estado del pedido.');
    }
  },

  /**
   * Manual dispatch trigger for Mastershop order forwarding
   */
  async syncToMasterShop(ctx) {
    const { id } = ctx.params;
    strapi.log.info(`Manual sync trigger for Order #${id}`);

    try {
      const order = await strapi.documents('api::order.order').findOne({
        documentId: id,
      });

      let realOrder = order;

      if (!order) {
        const orders = await strapi.documents('api::order.order').findMany({
          filters: { id: id },
          limit: 1,
        });
        if (orders.length > 0) realOrder = orders[0];
      }

      if (!realOrder) {
        return ctx.notFound('Order not found');
      }

      strapi.log.info(`Found order ${realOrder.id}, calling sendOrderToMasterShop...`);
      const result = await strapi.service('api::product.mastershop').sendOrderToMasterShop(realOrder);

      if (result && result.success) {
        // Clear retry flag on success
        await strapi.documents('api::order.order').update({
          documentId: realOrder.documentId,
          data: {
            sync_mastershop: false,
            mastershop_id: result.mastershopOrderId || realOrder.mastershop_id,
            mastershop_data: {
              ...(realOrder.mastershop_data || {}),
              error: null,
              syncedAt: new Date().toISOString(),
              response: result,
            },
          },
        });

        return ctx.send({ message: 'Order synced successfully', data: result });
      } else {
        const errorMsg = result ? result.error : 'Unknown error';
        await strapi.documents('api::order.order').update({
          documentId: realOrder.documentId,
          data: {
            sync_mastershop: true,
            mastershop_data: {
              ...(realOrder.mastershop_data || {}),
              error: errorMsg,
              failedAt: new Date().toISOString(),
            },
          },
        });

        return ctx.badRequest('Failed to sync to MasterShop', { error: errorMsg });
      }
    } catch (error: any) {
      strapi.log.error('Error in manual MasterShop sync:', error);
      return ctx.internalServerError('Internal server error during sync');
    }
  },
}));
