'use client';

import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import Checkout from './Checkout';
import WompiCheckout from './WompiCheckout';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { state, dispatch } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'wompi'>('wompi'); // Default to Wompi for Colombia

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Cart</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          {state.items.length === 0 ? (
            <p className="text-gray-500">Your cart is empty</p>
          ) : (
            <>
              {state.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">COP {item.price}</p>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => dispatch({ type: 'UPDATE_QUANTITY', payload: { id: item.id, quantity: item.quantity - 1 } })}
                      className="px-2 py-1 bg-gray-200 rounded"
                    >
                      -
                    </button>
                    <span className="mx-2">{item.quantity}</span>
                    <button
                      onClick={() => dispatch({ type: 'ADD_ITEM', payload: item })}
                      className="px-2 py-1 bg-gray-200 rounded"
                    >
                      +
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: item.id })}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>COP {state.total.toFixed(2)}</span>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Método de pago:</h4>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setPaymentMethod('wompi')}
                      className={`px-4 py-2 rounded ${paymentMethod === 'wompi' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
                    >
                      Wompi (Colombia)
                    </button>
                    <button
                      onClick={() => setPaymentMethod('stripe')}
                      className={`px-4 py-2 rounded ${paymentMethod === 'stripe' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                      Stripe
                    </button>
                  </div>

                  {paymentMethod === 'wompi' ? (
                    <WompiCheckout
                      amount={state.total}
                      onSuccess={() => {
                        dispatch({ type: 'CLEAR_CART' });
                        onClose();
                        // Redirect to success page for mock payments
                        if (process.env.NODE_ENV === 'development') {
                          window.location.href = '/payment/success?mock=true';
                        }
                      }}
                      onError={(error) => alert(`Error en el pago: ${error}`)}
                    />
                  ) : (
                    <Checkout amount={state.total} />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}