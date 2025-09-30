'use client';

import { useState, useEffect } from 'react';

interface NequiCheckoutProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function NequiCheckout({ amount, onSuccess, onError }: NequiCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'completed' | 'expired'>('pending');

  const createPayment = async () => {
    setLoading(true);

    try {
      // Check if Nequi keys are configured
      if (!process.env.NEQUI_CLIENT_ID || !process.env.NEQUI_API_KEY) {
        throw new Error('Nequi payment gateway is not configured. Please contact support.');
      }

      const response = await fetch('/api/nequi/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_in_cents: Math.round(amount * 100),
          currency: 'COP',
          description: `Prana Market Order - COP ${amount}`,
          reference: `prana-nequi-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Nequi payment');
      }

      const data = await response.json();
      setQrCode(data.qr_code);
      setPaymentId(data.payment_id);

    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  // Check payment status periodically
  useEffect(() => {
    if (!paymentId) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/nequi/payment-status/${paymentId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          setStatus('completed');
          onSuccess();
        } else if (data.status === 'expired') {
          setStatus('expired');
          onError('Payment expired. Please try again.');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    // Check immediately and then every 5 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    // Cleanup after 10 minutes (Nequi payments typically expire)
    const timeout = setTimeout(() => {
      setStatus('expired');
      onError('Payment session expired. Please try again.');
      clearInterval(interval);
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [paymentId, onSuccess, onError]);

  // Mock implementation for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !process.env.NEQUI_CLIENT_ID) {
      // Simulate QR code generation
      setTimeout(() => {
        setQrCode('mock-qr-code-url');
        setPaymentId('mock-payment-id');
        console.log('🧪 Mock Nequi QR code generated');
      }, 1000);
    }
  }, []);

  return (
    <div className="nequi-checkout">
      <h3 className="text-lg font-semibold mb-4">Pago con Nequi</h3>
      <p className="text-sm text-gray-600 mb-4">
        Nequi es la billetera digital más usada en Colombia con más de 10 millones de usuarios.
      </p>

      {!qrCode && !loading && (
        <button
          onClick={createPayment}
          className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Generar Código QR de Pago
        </button>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Generando código QR...</p>
        </div>
      )}

      {qrCode && (
        <div className="text-center">
          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 mb-4">
            {process.env.NODE_ENV === 'development' && !process.env.NEQUI_CLIENT_ID ? (
              <div className="w-48 h-48 bg-gray-200 mx-auto flex items-center justify-center rounded">
                <div className="text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-sm text-gray-600">Mock QR Code</p>
                  <p className="text-xs text-gray-500 mt-1">Modo de desarrollo</p>
                </div>
              </div>
            ) : (
              <img
                src={qrCode}
                alt="Nequi QR Code"
                className="w-48 h-48 mx-auto"
              />
            )}
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Instrucciones:</p>
            <ol className="text-sm text-gray-600 text-left list-decimal list-inside space-y-1">
              <li>Abre la app de Nequi en tu celular</li>
              <li>Escanea el código QR arriba</li>
              <li>Confirma el pago de <strong>COP {amount}</strong></li>
              <li>El pago se procesará automáticamente</li>
            </ol>
          </div>

          <div className="text-sm">
            {status === 'pending' && (
              <p className="text-blue-600">
                ⏳ Esperando confirmación de pago...
              </p>
            )}
            {status === 'completed' && (
              <p className="text-green-600">
                ✅ ¡Pago confirmado exitosamente!
              </p>
            )}
            {status === 'expired' && (
              <p className="text-red-600">
                ⏰ El código QR ha expirado. Genera uno nuevo.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>¿No tienes Nequi?</strong></p>
        <p>Descarga la app gratuita en App Store o Google Play</p>
      </div>
    </div>
  );
}