'use client';

import { useState, useEffect, useRef } from 'react';
import QRCodeSVG from 'react-qr-code';

interface NequiCheckoutProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

/**
 * Componente para procesar pagos con Nequi
 * Genera un código QR que el usuario puede escanear con la app de Nequi
 */
export default function NequiCheckout({ amount, onSuccess, onError }: NequiCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'completed' | 'expired'>('pending');
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 minutos en segundos
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Crea un pago con Nequi y genera el código QR
   */
  const createPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/nequi/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_in_cents: Math.round(amount * 100),
          currency: 'COP',
          description: `Prana Market Order - COP ${amount.toLocaleString()}`,
          reference: `prana-nequi-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Nequi payment');
      }

      const data = await response.json();
      
      // El QR code puede venir como data URL o como string para generar
      // Si viene como string, lo usamos directamente; si no, generamos uno
      const qrData = data.qr_code || data.qr_data || `nequi://pay?amount=${Math.round(amount * 100)}&ref=${data.payment_id}`;
      
      setQrCodeData(qrData);
      setPaymentId(data.payment_id);
      setTimeRemaining(600); // Reset timer
      setStatus('pending');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifica el estado del pago periódicamente
   */
  useEffect(() => {
    if (!paymentId) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/nequi/payment-status/${paymentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check payment status');
        }

        const data = await response.json();

        if (data.status === 'completed') {
          setStatus('completed');
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          onSuccess();
        } else if (data.status === 'expired') {
          setStatus('expired');
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          onError('Payment expired. Please try again.');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    // Check immediately and then every 5 seconds
    checkStatus();
    intervalRef.current = setInterval(checkStatus, 5000);

    // Timer countdown
    const countdownInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup after 10 minutes (Nequi payments typically expire)
    timeoutRef.current = setTimeout(() => {
      setStatus('expired');
      setTimeRemaining(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(countdownInterval);
      onError('Payment session expired. Please try again.');
    }, 10 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      clearInterval(countdownInterval);
    };
  }, [paymentId, onSuccess, onError]);

  /**
   * Formatea el tiempo restante en minutos y segundos
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="nequi-checkout">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pago con Nequi</h3>
        <p className="text-sm text-gray-700">
          Nequi es la billetera digital más usada en Colombia con más de 10 millones de usuarios.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!qrCodeData && !loading && (
        <button
          onClick={createPayment}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold shadow-md transition-colors"
        >
          Generar Código QR de Pago
        </button>
      )}

      {loading && (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-700 font-medium">Generando código QR...</p>
          <p className="text-xs text-gray-500 mt-1">Por favor espera un momento</p>
        </div>
      )}

      {qrCodeData && (
        <div className="text-center">
          <div className="bg-white p-6 rounded-lg border-2 border-green-200 mb-4 shadow-sm">
            <div className="flex justify-center mb-3">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG
                  value={qrCodeData}
                  size={200}
                  level="M"
                />
              </div>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded mt-2 inline-block">
                🧪 Modo de desarrollo - QR simulado
              </p>
            )}
          </div>

          {status === 'pending' && timeRemaining > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">
                ⏳ Esperando confirmación de pago...
              </p>
              <p className="text-xs text-blue-600">
                Tiempo restante: <strong>{formatTime(timeRemaining)}</strong>
              </p>
            </div>
          )}

          {status === 'completed' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-semibold">
                ✅ ¡Pago confirmado exitosamente!
              </p>
            </div>
          )}

          {status === 'expired' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium mb-2">
                ⏰ El código QR ha expirado
              </p>
              <button
                onClick={createPayment}
                className="text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Generar nuevo código
              </button>
            </div>
          )}

          <div className="mb-4 bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-gray-900 mb-3">Instrucciones:</p>
            <ol className="text-sm text-gray-700 text-left list-decimal list-inside space-y-2">
              <li>Abre la app de Nequi en tu celular</li>
              <li>Escanea el código QR de arriba</li>
              <li>Confirma el pago de <strong className="text-gray-900">COP {amount.toLocaleString()}</strong></li>
              <li>El pago se procesará automáticamente</li>
            </ol>
          </div>

          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p className="font-semibold text-gray-900 mb-1">💡 ¿No tienes Nequi?</p>
            <p>Descarga la app gratuita en App Store o Google Play</p>
          </div>
        </div>
      )}
    </div>
  );
}