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
  if (!payload.items || !payload.subtotal || !payload.total || !payload.paymentMethod) {
    return { valid: false, error: 'Missing required fields: items, subtotal, total, paymentMethod' };
  }

  const delivery = parseDeliveryMethod(payload.deliveryMethod);
  if (delivery && delivery.id !== 'pickup' && !payload.shippingAddress) {
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

  constructor(message: string, status: number) {
    super(message);
    this.name = 'OrderCreationError';
    this.status = status;
  }
}

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
