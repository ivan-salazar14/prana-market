'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ amount }: { amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret, error: apiError } = await response.json();

      if (apiError) {
        setError(apiError);
        return;
      }

      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
      } else {
        // Payment succeeded
        alert('Payment successful!');
        // Redirect or update order status
      }
    } catch (err) {
      setError('An error occurred during payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 border rounded">
      <div className="mb-4">
        <CardElement className="p-2 border rounded" />
      </div>
      <button
        disabled={!stripe || loading}
        type="submit"
        className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay COP ${amount}`}
      </button>
      {error && <div className="mt-2 text-red-500">{error}</div>}
    </form>
  );
}

export default function Checkout({ amount }: { amount: number }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm amount={amount} />
    </Elements>
  );
}