'use client';

import { useState } from 'react';

interface WompiCheckoutProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function WompiCheckout({ amount, onSuccess, onError }: WompiCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Check if Wompi keys are configured
      if (!process.env.WOMPI_PUBLIC_KEY || !process.env.WOMPI_PRIVATE_KEY) {
        throw new Error('Wompi payment gateway is not configured. Please contact support.');
      }

      const response = await fetch('/api/wompi/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_in_cents: Math.round(amount * 100),
          currency: 'COP',
          customer_email: 'customer@example.com', // TODO: Get from user form
          reference: `prana-market-${Date.now()}`,
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Wompi transaction');
      }

      const data = await response.json();

      // Check if this is a mock transaction (development mode)
      const isMock = data.checkout_url.includes('mock=true');

      if (isMock) {
        // For mock transactions, simulate successful payment
        console.log('🧪 Mock payment successful');
        onSuccess();
      } else {
        // Redirect to Wompi checkout for real transactions
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wompi-checkout">
      <h3 className="text-lg font-semibold mb-4">Pago con Wompi (Colombia)</h3>
      <p className="text-sm text-gray-600 mb-4">
        Wompi es un procesador de pagos colombiano que soporta tarjetas de crédito,
        débito, PSE y otros métodos locales.
      </p>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? 'Procesando...' : `Pagar COP ${amount} con Wompi`}
      </button>
      <div className="mt-4 text-xs text-gray-500">
        <p>Métodos de pago soportados:</p>
        <ul className="list-disc list-inside mt-1">
          <li>Tarjetas de crédito y débito</li>
          <li>PSE (Transferencias bancarias)</li>
          <li>Efecty, Baloto y otros</li>
        </ul>
      </div>
    </div>
  );
}