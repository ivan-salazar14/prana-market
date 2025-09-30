'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id');
  const isMock = searchParams.get('mock') === 'true';

  useEffect(() => {
    // Here you could verify the payment status with Wompi API
    // and update your order status accordingly

    if (isMock) {
      console.log('🧪 Mock payment completed successfully');
    }
  }, [transactionId, isMock]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">¡Pago Exitoso!</h1>
          {isMock && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              Modo de Prueba
            </span>
          )}
        </div>
        <p className="text-gray-600 mb-6">
          {isMock
            ? 'Tu pago de prueba ha sido procesado correctamente. En producción, esto sería un pago real con Wompi.'
            : 'Tu pago ha sido procesado correctamente. Recibirás un correo de confirmación pronto.'
          }
        </p>

        {transactionId && (
          <p className="text-sm text-gray-500 mb-6">
            ID de transacción: {transactionId}
          </p>
        )}

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Continuar comprando
          </Link>
          <Link
            href="/orders"
            className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
          >
            Ver mis pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}