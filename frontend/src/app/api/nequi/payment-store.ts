/**
 * Almacenamiento temporal de estados de pago (en memoria)
 * En producción, esto debería estar en una base de datos o cache como Redis
 */

export interface PaymentStatus {
  payment_id: string;
  status: 'pending' | 'completed' | 'expired';
  amount: number;
  currency: string;
  created_at: number;
  expires_at: number;
  completed_at?: number;
}

export const paymentStatusStore = new Map<string, PaymentStatus>();

/**
 * Limpia pagos expirados del almacenamiento
 */
export function cleanupExpiredPayments() {
  const now = Date.now();
  for (const payment of paymentStatusStore.values()) {
    if (payment.expires_at < now && payment.status === 'pending') {
      payment.status = 'expired';
    }
  }
}

