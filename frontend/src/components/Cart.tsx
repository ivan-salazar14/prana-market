'use client';

import { useCart, DeliveryMethod } from '@/context/CartContext';
import { useState } from 'react';
import Checkout from './Checkout';
import WompiCheckout from './WompiCheckout';
import NequiCheckout from './NequiCheckout';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

const DELIVERY_METHODS: DeliveryMethod[] = [
  {
    id: 'pickup',
    name: 'Recoger en tienda',
    cost: 0,
    description: 'Recoge tu pedido en nuestra tienda física'
  },
  {
    id: 'delivery_local',
    name: 'Domicilio local',
    cost: 5000,
    description: 'Entrega en zona urbana - 1-2 días hábiles'
  },
  {
    id: 'delivery_regional',
    name: 'Domicilio regional',
    cost: 10000,
    description: 'Entrega fuera de zona urbana - 2-3 días hábiles'
  }
];

export default function Cart({ isOpen, onClose }: CartProps) {
  const { state, dispatch } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'wompi' | 'nequi'>('wompi'); // Default to Wompi for Colombia

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
              {/* Delivery Method Selection */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-3">Método de entrega:</h4>
                <div className="space-y-2 mb-4">
                  {DELIVERY_METHODS.map((method) => (
                    <label key={method.id} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="delivery"
                        value={method.id}
                        checked={state.deliveryMethod?.id === method.id}
                        onChange={() => dispatch({ type: 'SET_DELIVERY_METHOD', payload: method })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{method.name}</span>
                          <span className="text-sm font-semibold">
                            {method.cost === 0 ? 'Gratis' : `COP ${method.cost}`}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-3">Resumen del pedido:</h4>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal productos:</span>
                    <span>COP {state.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span>{state.deliveryCost === 0 ? 'Gratis' : `COP ${state.deliveryCost}`}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>COP {state.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Section - Only show if delivery method is selected */}
                {state.deliveryMethod ? (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Método de pago:</h4>
                    <div className="grid grid-cols-1 gap-2 mb-4">
                      <button
                        onClick={() => setPaymentMethod('wompi')}
                        className={`px-4 py-2 rounded text-left ${paymentMethod === 'wompi' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
                      >
                        💳 Wompi (Colombia)
                      </button>
                      <button
                        onClick={() => setPaymentMethod('nequi')}
                        className={`px-4 py-2 rounded text-left ${paymentMethod === 'nequi' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                      >
                        📱 Nequi (Digital Wallet)
                      </button>
                      <button
                        onClick={() => setPaymentMethod('stripe')}
                        className={`px-4 py-2 rounded text-left ${paymentMethod === 'stripe' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                      >
                        🌐 Stripe (International)
                      </button>
                    </div>

                    {paymentMethod === 'wompi' ? (
                      <WompiCheckout
                        amount={state.total}
                        onSuccess={() => {
                          // Save order details before clearing cart
                          const orderDetails = {
                            items: state.items,
                            deliveryMethod: state.deliveryMethod,
                            subtotal: state.subtotal,
                            deliveryCost: state.deliveryCost,
                            total: state.total,
                            paymentMethod: 'wompi',
                            timestamp: new Date().toISOString()
                          };
                          localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

                          dispatch({ type: 'CLEAR_CART' });
                          onClose();
                          // Redirect to success page for mock payments
                          if (process.env.NODE_ENV === 'development') {
                            window.location.href = '/payment/success?mock=true';
                          }
                        }}
                        onError={(error) => alert(`Error en el pago: ${error}`)}
                      />
                    ) : paymentMethod === 'nequi' ? (
                      <NequiCheckout
                        amount={state.total}
                        onSuccess={() => {
                          // Save order details before clearing cart
                          const orderDetails = {
                            items: state.items,
                            deliveryMethod: state.deliveryMethod,
                            subtotal: state.subtotal,
                            deliveryCost: state.deliveryCost,
                            total: state.total,
                            paymentMethod: 'nequi',
                            timestamp: new Date().toISOString()
                          };
                          localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

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
                ) : (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      Por favor selecciona un método de entrega para continuar con el pago.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}