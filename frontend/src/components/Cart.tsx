'use client';

import { useCart, DeliveryMethod, ShippingAddress } from '@/context/CartContext';
import { useState } from 'react';
import NequiCheckout from './NequiCheckout';
import ShippingForm from './ShippingForm';

/**
 * Componente para pago contraentrega (efectivo)
 */
function EfectivoCheckout({
  items,
  deliveryMethod,
  shippingAddress,
  subtotal,
  deliveryCost,
  total,
  onSuccess,
  onError
}: {
  items: unknown[];
  deliveryMethod: DeliveryMethod | null;
  shippingAddress: ShippingAddress | null;
  subtotal: number;
  deliveryCost: number;
  total: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleConfirmOrder = async () => {
    if (!deliveryMethod) {
      onError('Por favor selecciona un método de entrega');
      return;
    }

    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user || !user.id) {
        throw new Error('User ID not found in local storage');
      }
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          deliveryMethod,
          shippingAddress,
          subtotal,
          deliveryCost,
          total,
          paymentMethod: 'efectivo',
          userId: user.id
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Save order details before clearing cart
      const orderDetails = {
        items,
        deliveryMethod,
        subtotal,
        deliveryCost,
        total,
        paymentMethod: 'efectivo',
        orderId: orderData.data?.id,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

      onSuccess();
    } catch (error) {
      console.error('Error creating order:', error);
      onError(error instanceof Error ? error.message : 'Hubo un error al crear la orden. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="efectivo-checkout">
        <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-5 mb-4">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">Confirmar Pedido</h4>
          <div className="space-y-2 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Método de entrega:</strong> {deliveryMethod?.name}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Total a pagar:</strong> <span className="text-lg font-bold">COP {total.toFixed(2)}</span>
            </p>
            <p className="text-sm text-blue-700 mt-3">
              El pago se realizará al momento de la entrega o recogida.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmation(false)}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmOrder}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Procesando...
              </span>
            ) : (
              'Confirmar Pedido'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="efectivo-checkout">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Pago Contraentrega (Efectivo)</h3>
      
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
        <div className="flex items-start mb-3">
          <div className="text-2xl mr-3">💵</div>
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-semibold mb-2">
              Pago al momento de la entrega
            </p>
            <p className="text-xs text-blue-700">
              {deliveryMethod?.id === 'pickup' 
                ? 'Pagarás cuando recojas tu pedido en la tienda'
                : 'Pagarás cuando recibas tu pedido en el domicilio'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">Instrucciones:</p>
        <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
          <li>El pago se realizará al momento de la {deliveryMethod?.id === 'pickup' ? 'recogida' : 'entrega'}</li>
          <li>Por favor, ten el monto exacto o aproximado disponible</li>
          <li>El total a pagar es: <strong className="text-gray-900">COP {total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</strong></li>
          {deliveryMethod?.id !== 'pickup' && (
            <li>Nuestro repartidor te contactará para coordinar la entrega</li>
          )}
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-yellow-800">
          <strong>⚠️ Importante:</strong> Tu pedido será preparado una vez confirmado. 
          {deliveryMethod?.id === 'pickup' 
            ? ' Te notificaremos cuando esté listo para recoger.'
            : ' Te contactaremos para coordinar la entrega.'}
        </p>
      </div>

      <button
        onClick={() => setShowConfirmation(true)}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold shadow-md transition-colors"
      >
        Confirmar Pedido Contraentrega
      </button>
    </div>
  );
}

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
  const [paymentMethod, setPaymentMethod] = useState<'nequi' | 'efectivo'>('nequi');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Carrito</h2>
            <button onClick={onClose} className="text-gray-700 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          {state.items.length === 0 ? (
            <p className="text-gray-700 text-center py-8">Tu carrito está vacío</p>
          ) : (
            <>
              {state.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-700 font-semibold">COP {item.price.toLocaleString()}</p>
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
                      className="ml-2 text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {/* Delivery Method Selection */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-semibold mb-3 text-gray-900">Método de entrega:</h4>
                <div className="space-y-3 mb-4">
                  {DELIVERY_METHODS.map((method) => (
                    <label key={method.id} className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                      <input
                        type="radio"
                        name="delivery"
                        value={method.id}
                        checked={state.deliveryMethod?.id === method.id}
                        onChange={() => {
                          dispatch({ type: 'SET_DELIVERY_METHOD', payload: method });
                          // Limpiar dirección de envío si se cambia a pickup
                          if (method.id === 'pickup') {
                            dispatch({ type: 'SET_SHIPPING_ADDRESS', payload: null });
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900">{method.name}</span>
                          <span className="text-sm font-bold text-gray-900">
                            {method.cost === 0 ? 'Gratis' : `COP ${method.cost.toLocaleString()}`}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Shipping Form - Only show if delivery method is not pickup */}
              {state.deliveryMethod && state.deliveryMethod.id !== 'pickup' && (
                <ShippingForm />
              )}

              {/* Order Summary */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-semibold mb-3 text-gray-900">Resumen del pedido:</h4>
                <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between text-gray-800">
                    <span className="font-medium">Subtotal productos:</span>
                    <span className="font-semibold">COP {state.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-800">
                    <span className="font-medium">Envío:</span>
                    <span className="font-semibold">{state.deliveryCost === 0 ? 'Gratis' : `COP ${state.deliveryCost.toLocaleString()}`}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-3 mt-2 text-gray-900">
                    <span>Total:</span>
                    <span>COP {state.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Section - Only show if delivery method is selected and shipping data is complete (if not pickup) */}
                {state.deliveryMethod && (state.deliveryMethod.id === 'pickup' || state.shippingAddress) ? (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 text-gray-900">Método de pago:</h4>
                    <div className="grid grid-cols-1 gap-3 mb-4">
                      <button
                        onClick={() => setPaymentMethod('nequi')}
                        className={`px-4 py-3 rounded-lg text-left font-medium transition-all ${
                          paymentMethod === 'nequi' 
                            ? 'bg-green-600 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-2 border-gray-300'
                        }`}
                      >
                        📱 Nequi (Billetera Digital)
                      </button>
                      <button
                        onClick={() => setPaymentMethod('efectivo')}
                        className={`px-4 py-3 rounded-lg text-left font-medium transition-all ${
                          paymentMethod === 'efectivo' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-2 border-gray-300'
                        }`}
                      >
                        💵 Efectivo
                      </button>
                    </div>

                    {paymentMethod === 'nequi' ? (
                      <NequiCheckout
                        amount={state.total}
                        onSuccess={async () => {
                          try {
                            // Create order in backend
                            const transactionId = `nequi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                            const user = JSON.parse(localStorage.getItem('user') || '{}');
                            if (!user || !user.id) {
                              throw new Error('User ID not found in local storage');
                            }
                            const orderResponse = await fetch('/api/orders', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                items: state.items,
                                deliveryMethod: state.deliveryMethod,
                                shippingAddress: state.shippingAddress,
                                subtotal: state.subtotal,
                                deliveryCost: state.deliveryCost,
                                total: state.total,
                                transactionId,
                                paymentMethod: 'nequi',
                                userId: user.id
                              }),
                            });

                            if (!orderResponse.ok) {
                              throw new Error('Failed to create order');
                            }

                            // Save order details before clearing cart
                            const orderDetails = {
                              items: state.items,
                              deliveryMethod: state.deliveryMethod,
                              subtotal: state.subtotal,
                              deliveryCost: state.deliveryCost,
                              total: state.total,
                              paymentMethod: 'nequi',
                              transactionId,
                              timestamp: new Date().toISOString()
                            };
                            localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

                            dispatch({ type: 'CLEAR_CART' });
                            onClose();
                            // Redirect to success page for mock payments
                            if (process.env.NODE_ENV === 'development') {
                              window.location.href = '/payment/success?mock=true';
                            }
                          } catch (error) {
                            console.error('Error creating order:', error);
                            alert('Pago exitoso pero hubo un error al crear la orden. Contacta soporte.');
                          }
                        }}
                        onError={(error) => alert(`Error en el pago: ${error}`)}
                      />
                    ) : (
                      <EfectivoCheckout
                        items={state.items}
                        deliveryMethod={state.deliveryMethod}
                        shippingAddress={state.shippingAddress}
                        subtotal={state.subtotal}
                        deliveryCost={state.deliveryCost}
                        total={state.total}
                        onSuccess={() => {
                          dispatch({ type: 'CLEAR_CART' });
                          onClose();
                          window.location.href = '/payment/success';
                        }}
                        onError={(error) => {
                          alert(`Error: ${error}`);
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                    <p className="text-sm text-yellow-900 font-medium">
                      {!state.deliveryMethod 
                        ? '⚠️ Por favor selecciona un método de entrega para continuar con el pago.'
                        : '⚠️ Por favor completa los datos de envío para continuar con el pago.'}
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