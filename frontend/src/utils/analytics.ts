export interface ViewContentParams {
  id: number | string;
  name: string;
  category?: string;
  price: number;
  currency?: string;
}

export interface AddToCartParams {
  id: number | string;
  name: string;
  price: number;
  quantity?: number;
  currency?: string;
}

export interface InitiateCheckoutParams {
  subtotal: number;
  itemCount: number;
  currency?: string;
}

export interface WhatsAppClickParams {
  origin: string;
  url?: string;
}

export interface PurchaseItem {
  id?: number | string;
  name?: string;
  price?: number;
  quantity?: number;
}

export interface PurchaseParams {
  transactionId: string;
  orderId?: string | number;
  total: number;
  items: PurchaseItem[];
  currency?: string;
  paymentMethod?: string;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID?.trim() || '';

export const isPixelConfigured = (): boolean => {
  return Boolean(
    FB_PIXEL_ID &&
    FB_PIXEL_ID !== '' &&
    !FB_PIXEL_ID.includes('YOUR_') &&
    !FB_PIXEL_ID.includes('placeholder')
  );
};

export const safeFbq = (
  type: 'track' | 'trackCustom',
  eventName: string,
  params?: Record<string, unknown>
): void => {
  if (typeof window === 'undefined') return;

  const configured = isPixelConfigured();

  if (configured && typeof window.fbq === 'function') {
    try {
      if (params) {
        window.fbq(type, eventName, params);
      } else {
        window.fbq(type, eventName);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics:MetaPixel] Error dispatching event:', err);
      }
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics:Mock] ${type} -> ${eventName}:`, params || '(no params)');
  }
};

export const trackPageView = (url?: string): void => {
  safeFbq('track', 'PageView', url ? { page_path: url } : undefined);
};

export const trackViewContent = (params: ViewContentParams): void => {
  safeFbq('track', 'ViewContent', {
    content_ids: [String(params.id)],
    content_name: params.name,
    content_category: params.category || 'Cosméticos',
    value: Number(params.price) || 0,
    currency: params.currency || 'COP',
  });
};

export const trackAddToCart = (params: AddToCartParams): void => {
  const qty = params.quantity || 1;
  const unitPrice = Number(params.price) || 0;

  safeFbq('track', 'AddToCart', {
    content_ids: [String(params.id)],
    content_name: params.name,
    value: unitPrice * qty,
    currency: params.currency || 'COP',
  });
};

export const trackInitiateCheckout = (params: InitiateCheckoutParams): void => {
  safeFbq('track', 'InitiateCheckout', {
    value: Number(params.subtotal) || 0,
    num_items: params.itemCount || 0,
    currency: params.currency || 'COP',
  });
};

export const trackWhatsAppClick = (params: WhatsAppClickParams): void => {
  safeFbq('trackCustom', 'WhatsAppContactClick', {
    origin: params.origin,
    source_url: params.url || (typeof window !== 'undefined' ? window.location.href : ''),
    timestamp: new Date().toISOString(),
  });
};

export const PURCHASE_DEDUPE_PREFIX = 'tracked_purchase_';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Claims a conversion for the given transaction so a single order never fires
 * the Purchase event twice (for example, on a success-page reload).
 * Returns true only for the first caller.
 */
export const claimPurchaseEvent = (
  transactionId: string,
  storage?: KeyValueStore | null
): boolean => {
  const resolvedStorage = storage ?? (
    typeof window !== 'undefined' ? window.sessionStorage : null
  );
  if (!resolvedStorage) return true;

  const key = `${PURCHASE_DEDUPE_PREFIX}${transactionId}`;
  try {
    if (resolvedStorage.getItem(key)) return false;
    resolvedStorage.setItem(key, 'true');
    return true;
  } catch {
    return true;
  }
};

export const trackPurchase = (params: PurchaseParams): void => {
  const total = Number(params.total);
  if (!params.transactionId || !Number.isFinite(total)) return;

  safeFbq('track', 'Purchase', {
    value: total,
    currency: params.currency || 'COP',
    content_type: 'product',
    contents: (params.items || []).map(item => ({
      id: String(item.id || item.name || 'item'),
      quantity: Number(item.quantity) || 1,
      item_price: Number(item.price) || 0,
    })),
    order_id: String(params.orderId || params.transactionId),
    transaction_id: params.transactionId,
    payment_method: params.paymentMethod,
  });
};
