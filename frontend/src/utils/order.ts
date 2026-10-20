export type PaymentStatus = 'paid' | 'pending';

export interface DeliveryMethodLike {
  id?: string;
  name?: string;
  description?: string;
  cost?: number;
}

export interface OrderPayloadLike {
  items?: unknown;
  deliveryMethod?: unknown;
  shippingAddress?: unknown;
  subtotal?: number;
  deliveryCost?: number;
  total?: number;
  transactionId?: unknown;
  paymentMethod?: unknown;
  userId?: unknown;
}

export type OrderValidation =
  | { valid: true }
  | { valid: false; error: string };

const PENDING_PAYMENT_METHODS = ['efectivo', 'nequi_manual'];

export const PAYMENT_STATUS_PENDING = 'pending';
export const PAYMENT_STATUS_PAID = 'paid';

export const parseDeliveryMethod = (value: unknown): DeliveryMethodLike | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? (parsed as DeliveryMethodLike) : null;
    } catch {
      return null;
    }
  }
  return typeof value === 'object' ? (value as DeliveryMethodLike) : null;
};

export const validateOrderPayload = (payload: OrderPayloadLike): OrderValidation => {
  if (
    !payload.items ||
    payload.subtotal === undefined ||
    payload.subtotal === null ||
    Number.isNaN(Number(payload.subtotal)) ||
    payload.total === undefined ||
    payload.total === null ||
    Number.isNaN(Number(payload.total)) ||
    !payload.paymentMethod
  ) {
    return { valid: false, error: 'Missing required fields: items, subtotal, total, paymentMethod' };
  }

  const delivery = parseDeliveryMethod(payload.deliveryMethod);
  if (!delivery) {
    return { valid: false, error: 'Delivery method is required' };
  }

  if (delivery.id !== 'pickup' && !payload.shippingAddress) {
    return { valid: false, error: 'Shipping address is required for delivery methods' };
  }

  return { valid: true };
};

export const resolvePaymentStatus = (paymentMethod: unknown): PaymentStatus => {
  if (typeof paymentMethod === 'string' && PENDING_PAYMENT_METHODS.includes(paymentMethod)) {
    return PAYMENT_STATUS_PENDING;
  }
  return PAYMENT_STATUS_PAID;
};

export const normalizeTransactionId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export const resolveUserId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const parseStoredUser = (raw: string | null | undefined): number | null => {
  if (!raw) return null;
  try {
    return resolveUserId((JSON.parse(raw) as { id?: unknown })?.id);
  } catch {
    return null;
  }
};

export const readStoredUserId = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    return parseStoredUser(window.localStorage.getItem('user'));
  } catch {
    return null;
  }
};

export const buildTransactionId = (prefix: string): string => {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${suffix}`;
};

export interface OrderRecord {
  items: unknown;
  status: PaymentStatus;
  total: number;
  subtotal: number;
  deliveryCost: number;
  deliveryMethod: unknown;
  shippingAddress?: unknown;
  transactionId?: string;
  paymentMethod: string;
  user?: number;
}

export interface OrderPersistence {
  findByTransactionId(transactionId: string): Promise<unknown | null>;
  create(order: OrderRecord): Promise<unknown>;
}

export type ProcessOrderResult =
  | { ok: true; status: 200 | 201; order: unknown; idempotent: boolean }
  | { ok: false; status: 400; error: string };

export class OrderCreationError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'OrderCreationError';
    this.status = status;
    this.code = typeof details?.code === 'string' ? details.code : undefined;
    this.details = details;
  }
}

export interface CatalogueProductLike {
  id?: unknown;
  name?: unknown;
  price?: unknown;
  stock?: unknown;
}

export interface CartItemLike {
  id?: unknown;
  name?: unknown;
  price?: unknown;
  stock?: unknown;
  quantity?: unknown;
}

export interface StockAdjustment<T> {
  item: T;
  from: number;
  to: number;
}

export interface CartReconciliation<T> {
  /** Cart lines still sellable, with fresh catalogue price and stock. */
  items: T[];
  /** Lines whose product is gone or sold out; they must leave the cart. */
  removed: T[];
  /** Lines whose quantity was clamped to the units actually available. */
  adjusted: StockAdjustment<T>[];
  /** Lines whose stored price no longer matches the catalogue price. */
  repriced: T[];
  changed: boolean;
}

const normalizeProductId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim();
};

/**
 * Reconciles a persisted cart against the live catalogue.
 *
 * A cart survives in localStorage across deployments, so it can point at
 * products that were deleted, re-seeded with new ids or sold out. Sending those
 * lines to `POST /api/orders` used to fail the whole checkout with a
 * developer-facing error, leaving the customer stuck. Pruning and clamping here
 * keeps the cart and the order in agreement.
 *
 * An empty catalogue means "could not read the catalogue", never "everything is
 * gone", so an empty catalogue returns the cart untouched instead of emptying it.
 */
export const reconcileCartItems = <T extends CartItemLike>(
  cartItems: T[],
  catalogue: CatalogueProductLike[]
): CartReconciliation<T> => {
  const byId = new Map<string, CatalogueProductLike>();

  if (catalogue.length === 0) {
    return { items: cartItems, removed: [], adjusted: [], repriced: [], changed: false };
  }

  for (const product of catalogue) {
    const key = normalizeProductId(product?.id);
    if (key) byId.set(key, product);
  }

  const items: T[] = [];
  const removed: T[] = [];
  const adjusted: StockAdjustment<T>[] = [];
  const repriced: T[] = [];

  for (const item of cartItems) {
    const key = normalizeProductId(item?.id);
    const product = key ? byId.get(key) : undefined;
    const stock = product ? Number(product.stock) : Number.NaN;

    if (!product || !Number.isFinite(stock) || stock <= 0) {
      removed.push(item);
      continue;
    }

    const quantity = Number(item.quantity);
    const nextQuantity = Number.isFinite(quantity) && quantity > 0
      ? Math.min(Math.floor(quantity), stock)
      : Math.min(1, stock);

    const cataloguePrice = Number(product.price);
    const currentPrice = Number(item.price);
    const nextPrice = Number.isFinite(cataloguePrice) && cataloguePrice >= 0
      ? cataloguePrice
      : currentPrice;

    if (nextQuantity !== quantity) {
      adjusted.push({ item, from: quantity, to: nextQuantity });
    }

    if (Number.isFinite(nextPrice) && nextPrice !== currentPrice) {
      repriced.push(item);
    }

    items.push({ ...item, quantity: nextQuantity, price: nextPrice, stock });
  }

  return {
    items,
    removed,
    adjusted,
    repriced,
    changed: removed.length > 0 || adjusted.length > 0 || repriced.length > 0,
  };
};

export interface OrderApiErrorDetails {
  id?: number | string | null;
  name?: string;
  requested?: number;
  available?: number;
}

export interface OrderApiError {
  message: string;
  code?: string;
  unavailableProducts?: OrderApiErrorDetails[];
  insufficientStock?: OrderApiErrorDetails[];
  invalidItems?: OrderApiErrorDetails[];
}

export const DEFAULT_ORDER_ERROR =
  'No pudimos crear tu pedido. Inténtalo de nuevo en un momento.';

/** Rejections the customer fixes by editing the cart, not by retrying as-is. */
export const CART_ERROR_CODES = [
  'PRODUCT_UNAVAILABLE',
  'INSUFFICIENT_STOCK',
  'CART_INVALID',
  'CART_EMPTY',
] as const;

export const isCartErrorCode = (code: string | undefined | null): boolean =>
  typeof code === 'string' && (CART_ERROR_CODES as readonly string[]).includes(code);

/**
 * Reads the error envelope of both our own route (`{ error, code, details }`)
 * and Strapi's (`{ error: { message, details } }`) so the storefront can show
 * the actionable message and react to the reason.
 */
export const parseOrderError = (
  payload: unknown,
  fallback: string = DEFAULT_ORDER_ERROR
): OrderApiError => {
  const body = (payload ?? {}) as Record<string, any>;
  const rawError = body.error;
  const rawDetails = rawError && typeof rawError === 'object' ? rawError.details : undefined;
  const details = (body.details ?? rawDetails ?? {}) as Record<string, any>;

  const candidates = [
    typeof rawError === 'string' ? rawError : rawError?.message,
    body.message,
    details.message,
  ];

  const message = candidates.find(
    (candidate): candidate is string => typeof candidate === 'string' && candidate.trim() !== ''
  );

  const code = [body.code, details.code, rawError?.code].find(
    (candidate): candidate is string => typeof candidate === 'string' && candidate.trim() !== ''
  );

  const list = (value: unknown): OrderApiErrorDetails[] | undefined =>
    Array.isArray(value) ? (value as OrderApiErrorDetails[]) : undefined;

  return {
    message: message ?? fallback,
    code,
    unavailableProducts: list(details.unavailableProducts),
    insufficientStock: list(details.insufficientStock),
    invalidItems: list(details.invalidItems),
  };
};

/**
 * Single source of truth for order creation: validates the payload, honours
 * transaction idempotency, keeps cash payments pending and only links a user
 * relation when a real user id exists (guest checkout).
 */
export const processOrderRequest = async (
  payload: OrderPayloadLike,
  persistence: OrderPersistence
): Promise<ProcessOrderResult> => {
  const validation = validateOrderPayload(payload);
  if (!validation.valid) {
    return { ok: false, status: 400, error: validation.error };
  }

  const transactionId = normalizeTransactionId(payload.transactionId);
  if (transactionId) {
    const existing = await persistence.findByTransactionId(transactionId);
    if (existing) {
      return { ok: true, status: 200, order: existing, idempotent: true };
    }
  }

  const order: OrderRecord = {
    items: payload.items,
    status: resolvePaymentStatus(payload.paymentMethod),
    total: Number(payload.total),
    subtotal: Number(payload.subtotal),
    deliveryCost: Number(payload.deliveryCost ?? 0),
    deliveryMethod: payload.deliveryMethod ?? null,
    paymentMethod: String(payload.paymentMethod),
  };

  if (payload.shippingAddress) {
    order.shippingAddress = payload.shippingAddress;
  }
  if (transactionId) {
    order.transactionId = transactionId;
  }

  const userId = resolveUserId(payload.userId);
  if (userId !== null) {
    order.user = userId;
  }

  const created = await persistence.create(order);
  return { ok: true, status: 201, order: created, idempotent: false };
};
