/**
 * order controller
 */

import { factories } from '@strapi/strapi';
import { sendOrderEmail } from '../services/order';

type OrderValidationCode =
  | 'CART_EMPTY'
  | 'CART_INVALID'
  | 'PRODUCT_UNAVAILABLE'
  | 'INSUFFICIENT_STOCK';

interface UnavailableProduct {
  id: number | string | null;
  name?: string;
}

interface InsufficientStockProduct {
  id: number;
  name: string;
  requested: number;
  available: number;
}

/**
 * Validation failures that are the customer's to act on. The offending cart
 * entries travel in `details` so the storefront can show what to fix instead of
 * a generic 400.
 */
class OrderValidationError extends Error {
  code: OrderValidationCode;

  details: Record<string, unknown>;

  constructor(code: OrderValidationCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'OrderValidationError';
    this.code = code;
    this.details = details;
  }
}

const isPositiveInteger = (value: unknown): boolean => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
};

const describeItem = (item: UnavailableProduct): string => {
  const name = typeof item.name === 'string' && item.name.trim() !== '' ? item.name.trim() : null;
  const ref = item.id === null || item.id === undefined || item.id === '' ? null : `ref. ${item.id}`;

  if (name && ref) return `"${name}" (${ref})`;
  if (name) return `"${name}"`;
  if (ref) return `producto con ${ref}`;
  return 'un producto';
};

const buildCartError = (
  unavailable: UnavailableProduct[],
  insufficient: InsufficientStockProduct[]
): OrderValidationError => {
  const messages: string[] = [];
  const details: Record<string, unknown> = {};

  if (unavailable.length > 0) {
    messages.push(
      `Estos productos ya no están disponibles: ${unavailable
        .map(describeItem)
        .join(', ')}. Elimínalos de tu carrito para continuar.`
    );
    details.unavailableProducts = unavailable;
  }

  if (insufficient.length > 0) {
    messages.push(
      `No hay suficientes unidades de ${insufficient
        .map((item) => `"${item.name}" (pediste ${item.requested}, quedan ${item.available})`)
        .join(', ')}.`
    );
    details.insufficientStock = insufficient;
  }

  return new OrderValidationError(
    unavailable.length > 0 ? 'PRODUCT_UNAVAILABLE' : 'INSUFFICIENT_STOCK',
    messages.join(' '),
    details
  );
};

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async find(ctx) {
    try {
      let userId: number | null = null;

      // If user is authenticated via JWT, use their ID
      if (ctx.state.user) {
        userId = ctx.state.user.id;
      } else {
        // If using API token, extract userId from query filters
        const filters = ctx.query?.filters as any;
        console.log('Query filters:', JSON.stringify(filters, null, 2));

        if (!filters) {
          // No filters provided, return all orders (public access)
          const { results, pagination } = await strapi.service('api::order.order').find({
            ...ctx.query,
          });
          const sanitizedResults = await (this as any).sanitizeOutput(results, ctx);
          return (this as any).transformResponse(sanitizedResults, { pagination });
        }

        // Try different formats for the user filter
        let userIdFromQuery = filters?.user?.id?.$eq ||
          filters?.user?.id?.$in?.[0] ||
          filters?.user?.id;

        // Also check if it's a direct user ID (not nested)
        if (!userIdFromQuery && filters?.user) {
          userIdFromQuery = typeof filters.user === 'number' || typeof filters.user === 'string'
            ? filters.user
            : null;
        }

        if (userIdFromQuery) {
          userId = parseInt(userIdFromQuery);
        } else {
          // If no user filter and no authenticated user, return all orders
          const { results, pagination } = await strapi.service('api::order.order').find({
            ...ctx.query,
          });
          const sanitizedResults = await (this as any).sanitizeOutput(results, ctx);
          return (this as any).transformResponse(sanitizedResults, { pagination });
        }
      }

      // Use service directly to avoid validation issues with relation filters
      // For manyToOne relations in Strapi 5, use the ID directly
      const { results, pagination } = await strapi.service('api::order.order').find({
        filters: { user: userId },
        ...ctx.query,
      });

      const sanitizedResults = await (this as any).sanitizeOutput(results, ctx);

      return (this as any).transformResponse(sanitizedResults, { pagination });
    } catch (error) {
      console.error('Error in find controller:', error);
      return ctx.badRequest('Error fetching orders', { error: error.message });
    }
  },

  /**
   * Creates a new order.
   * @param ctx - Koa context object.
   * @returns The created order object.
   */
  async create(ctx) {
    try {
      // Allow public access to create orders - bypass auth completely
      ctx.state.auth = { strategy: { name: 'public' } };

      console.log('Request body:', ctx.request.body);

      // The body is already parsed by the body parser middleware
      let orderData = { ...ctx.request.body };

      // Handle the items field
      if (orderData.items && typeof orderData.items === 'string') {
        try {
          orderData.items = JSON.parse(orderData.items);
        } catch (e) {
          console.error('Failed to parse items:', e);
        }
      }

      // Handle the deliveryMethod field
      if (orderData.deliveryMethod && typeof orderData.deliveryMethod === 'string') {
        try {
          orderData.deliveryMethod = JSON.parse(orderData.deliveryMethod);
        } catch (e) {
          console.error('Failed to parse deliveryMethod:', e);
        }
      }

      // Handle the shippingAddress field
      if (orderData.shippingAddress && typeof orderData.shippingAddress === 'string') {
        try {
          orderData.shippingAddress = JSON.parse(orderData.shippingAddress);
        } catch (e) {
          console.error('Failed to parse shippingAddress:', e);
        }
      }

      if (orderData.total) orderData.total = parseFloat(orderData.total) || 0;
      if (orderData.subtotal) orderData.subtotal = parseFloat(orderData.subtotal) || 0;
      if (orderData.deliveryCost) orderData.deliveryCost = parseFloat(orderData.deliveryCost) || 0;

      // Ensure status is captured and default to 'pending' for new orders
      orderData.status = orderData.status || 'pending';

      // Convert user to number if it comes as string
      if (orderData.user && typeof orderData.user === 'string') {
        orderData.user = parseInt(orderData.user, 10);
      }

      // Normalize the cart lines before any stock is touched. A cart line the
      // database cannot resolve (deleted product, stale localStorage cart, wrong
      // id) used to abort the whole order with a developer-facing message.
      const rawItems: any[] = Array.isArray(orderData.items) ? orderData.items : [];

      if (rawItems.length === 0) {
        throw new OrderValidationError(
          'CART_EMPTY',
          'Tu carrito está vacío. Agrega productos antes de confirmar el pedido.'
        );
      }

      const invalidItems = rawItems.filter(
        (item) => !isPositiveInteger(item?.id) || !isPositiveInteger(item?.quantity)
      );

      if (invalidItems.length > 0) {
        throw new OrderValidationError(
          'CART_INVALID',
          'Algunos productos de tu carrito no se pudieron validar. Actualiza tu carrito e inténtalo de nuevo.',
          {
            invalidItems: invalidItems.map((item) => ({
              id: item?.id ?? null,
              name: typeof item?.name === 'string' ? item.name : undefined,
            })),
          }
        );
      }

      // Aggregate repeated lines so stock can never be validated twice against
      // the same starting balance.
      const requestedById = new Map<number, { quantity: number; name?: string }>();
      for (const item of rawItems) {
        const id = Number(item.id);
        const quantity = Number(item.quantity);
        const current = requestedById.get(id);
        requestedById.set(id, {
          quantity: (current?.quantity ?? 0) + quantity,
          name: current?.name ?? (typeof item.name === 'string' ? item.name : undefined),
        });
      }

      // START TRANSACTION FOR INVENTORY MANAGEMENT
      const result = await strapi.db.transaction(async () => {
        const productIds = Array.from(requestedById.keys());

        // 1. Verify availability and prepare updates
        const products = await strapi.query('api::product.product').findMany({
          where: { id: { $in: productIds } },
        });
        const productsById = new Map(products.map((product: any) => [product.id, product]));

        const stockUpdates: { id: number; newStock: number; name: string }[] = [];
        const unavailable: UnavailableProduct[] = [];
        const insufficient: InsufficientStockProduct[] = [];

        for (const productId of productIds) {
          const requested = requestedById.get(productId)!;
          const product: any = productsById.get(productId);

          if (!product) {
            unavailable.push({ id: productId, name: requested.name });
            continue;
          }

          const available = Number(product.stock ?? 0);

          if (available < requested.quantity) {
            insufficient.push({
              id: product.id,
              name: product.name,
              requested: requested.quantity,
              available,
            });
            continue;
          }

          stockUpdates.push({
            id: product.id,
            newStock: available - requested.quantity,
            name: product.name,
          });
        }

        if (unavailable.length > 0 || insufficient.length > 0) {
          console.error('Order stock validation failed:', { unavailable, insufficient });
          throw buildCartError(unavailable, insufficient);
        }

        // 2. Deduct stock
        for (const update of stockUpdates) {
          await strapi.query('api::product.product').update({
            where: { id: update.id },
            data: { stock: update.newStock }
          });
          console.log(`Stock updated for ${update.name}: ${update.newStock}`);
        }

        // 3. Create the order
        const createdOrder = await strapi.service('api::order.order').create({
          data: orderData
        });

        return createdOrder;
      });

      // Send email notifications (non-blocking) - outside transaction to avoid delaying it
      try {
        await sendOrderEmail(strapi, result);
      } catch (emailError) {
        console.error('Error sending order emails:', emailError);
      }

      ctx.send(result);
    } catch (error) {
      console.error('Order creation error:', error);

      if (error instanceof OrderValidationError) {
        return ctx.badRequest(error.message, { code: error.code, ...error.details });
      }

      return ctx.badRequest(error?.message || 'No pudimos crear tu pedido. Inténtalo de nuevo.', {
        code: 'ORDER_CREATION_FAILED',
      });
    }
  },
}));
