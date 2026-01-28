'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface DeliveryMethod {
  name: string;
  description: string;
}

interface OrderDetails {
  items: OrderItem[];
  deliveryMethod: DeliveryMethod;
  subtotal: number;
  deliveryCost: number;
  total: number;
  paymentMethod?: string;
  transactionId?: string;
  orderId?: string | number;
  timestamp?: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id');
  const isMock = searchParams.get('mock') === 'true';
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    // Load order details from localStorage (set before payment)
    const savedOrder = localStorage.getItem('lastOrder');
    if (savedOrder) {
      setOrderDetails(JSON.parse(savedOrder));
      localStorage.removeItem('lastOrder'); // Clean up
    }

    // Create order in backend after successful payment
    if (savedOrder && transactionId) {
      createOrder(JSON.parse(savedOrder), transactionId);
    }

    if (isMock) {
      console.log('🧪 Mock payment completed successfully');
    }
  }, [transactionId, isMock]);

  const createOrder = async (orderData: OrderDetails, transactionId: string) => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) {
        console.error('User not found in localStorage, cannot create order.');
        return;
      }
      const user = JSON.parse(userString);

      const orderPayload = {
        items: orderData.items,
        deliveryMethod: orderData.deliveryMethod,
        subtotal: orderData.subtotal,
        deliveryCost: orderData.deliveryCost,
        total: orderData.total,
        transactionId,
        paymentMethod: orderData.paymentMethod || 'nequi',
        userId: user.id
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (response.ok) {
        console.log('Order created successfully');
      } else {
        console.error('Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

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
        <p className="text-gray-700 mb-6">
          {isMock
            ? 'Tu pago de prueba ha sido procesado correctamente. En producción, esto sería un pago real.'
            : orderDetails?.paymentMethod === 'efectivo'
              ? '✅ Tu pedido ha sido confirmado. El pago se realizará al momento de la entrega o recogida. Te contactaremos pronto para coordinar la entrega.'
              : (orderDetails?.paymentMethod === 'nequi' || orderDetails?.paymentMethod === 'nequi_manual')
                ? '✅ Tu pedido ha sido registrado. Si realizaste una transferencia, procesaremos tu pedido una vez verifiquemos el comprobante.'
                : '✅ Tu pago ha sido procesado correctamente. Recibirás un correo de confirmación pronto.'
          }
        </p>

        {(transactionId || orderDetails?.transactionId) && (
          <p className="text-sm text-gray-500 mb-6">
            ID de transacción: {transactionId || orderDetails?.transactionId}
          </p>
        )}

        {orderDetails?.paymentMethod && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Método de pago:</span>{' '}
              {(orderDetails.paymentMethod === 'nequi' || orderDetails.paymentMethod === 'nequi_manual') ? (
                <span className="text-green-700 font-medium">📱 Nequi</span>
              ) : orderDetails.paymentMethod === 'efectivo' ? (
                <span className="text-blue-700 font-medium">💵 Efectivo (Contraentrega)</span>
              ) : (
                <span>{orderDetails.paymentMethod}</span>
              )}
            </p>
          </div>
        )}

        {/* Order Summary */}
        {orderDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Resumen del pedido:</h3>

            <div className="space-y-2 mb-4">
              <h4 className="font-medium">Productos:</h4>
              {orderDetails.items.map((item: OrderItem, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>COP {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>COP {orderDetails.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Envío ({orderDetails.deliveryMethod.name}):</span>
                <span>{orderDetails.deliveryCost === 0 ? 'Gratis' : `COP ${orderDetails.deliveryCost}`}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-gray-300 pt-2 mt-2">
                <span className="text-gray-900">Total {(orderDetails.paymentMethod === 'efectivo' || orderDetails.paymentMethod === 'nequi_manual') ? 'a pagar' : 'pagado'}:</span>
                <span className="text-gray-900">COP {orderDetails.total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>Método de entrega:</strong> {orderDetails.deliveryMethod.name}</p>
              <p className="mt-1">{orderDetails.deliveryMethod.description}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {orderDetails?.paymentMethod === 'nequi_manual' && (
            <button
              onClick={() => {
                const message = `¡Hola Prana Market! Acabo de realizar una transferencia Nequi por mi pedido #${orderDetails.orderId || ''}. El total es COP ${orderDetails.total.toLocaleString('es-CO')}. Adjunto el comprobante.`;
                const whatsappUrl = `https://wa.me/573182026212?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="flex items-center justify-center w-full bg-[#25D366] text-white py-4 px-6 rounded-xl font-bold hover:bg-[#20ba5a] transition-all shadow-lg shadow-emerald-100 mb-4"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Enviar comprobante por WhatsApp
            </button>
          )}

          <Link
            href="/"
            className="block w-full bg-emerald-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-emerald-700 transition-all text-center"
          >
            Continuar comprando
          </Link>
          <Link
            href="/orders"
            className="block w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-xl font-bold hover:bg-gray-200 transition-all text-center"
          >
            Ver mis pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}