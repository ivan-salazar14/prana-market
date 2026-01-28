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
    <div className="min-h-screen bg-[#fff5f7] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl shadow-pink-100 p-8 md:p-10 text-center border border-pink-50">
        <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle2 className="w-10 h-10 text-pink-600" />
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
          <div className="mb-6 p-4 bg-pink-50/50 rounded-2xl border border-pink-100">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Método de pago:</span>{' '}
              {(orderDetails.paymentMethod === 'nequi' || orderDetails.paymentMethod === 'nequi_manual') ? (
                <span className="text-pink-700 font-bold">📱 Nequi</span>
              ) : orderDetails.paymentMethod === 'efectivo' ? (
                <span className="text-gray-900 font-bold">💵 Efectivo (Contraentrega)</span>
              ) : (
                <span className="font-bold">{orderDetails.paymentMethod}</span>
              )}
            </p>
          </div>
        )}

        {/* Order Summary */}
        {orderDetails && (
          <div className="bg-gray-50/50 rounded-[2rem] p-6 mb-8 border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Resumen del pedido</h3>

            <div className="space-y-3 mb-6">
              {orderDetails.items.map((item: OrderItem, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">{item.name} <span className="text-gray-400 text-xs">x{item.quantity}</span></span>
                  <span className="font-bold text-gray-900">COP {(item.price * item.quantity).toLocaleString('es-CO')}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-6 border-t border-dashed border-gray-200 pt-4">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Subtotal:</span>
                <span className="text-gray-900 font-medium">COP {orderDetails.subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Envío ({orderDetails.deliveryMethod.name}):</span>
                <span className="text-pink-600 font-bold">{orderDetails.deliveryCost === 0 ? 'Gratis' : `COP ${orderDetails.deliveryCost.toLocaleString('es-CO')}`}</span>
              </div>
              <div className="flex justify-between text-lg font-black border-t border-gray-100 pt-3 mt-3">
                <span className="text-gray-900">Total:</span>
                <span className="text-pink-600">COP {orderDetails.total.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="text-[10px] text-gray-500 bg-white p-3 rounded-xl border border-gray-50">
              <p><strong>Entrega:</strong> {orderDetails.deliveryMethod.name}</p>
              <p className="mt-0.5">{orderDetails.deliveryMethod.description}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {orderDetails?.paymentMethod === 'nequi_manual' && (
            <button
              onClick={() => {
                const message = `¡Hola Prana Make up! Acabo de realizar una transferencia Nequi por mi pedido #${orderDetails.orderId || ''}. El total es COP ${orderDetails.total.toLocaleString('es-CO')}. Adjunto el comprobante.`;
                const whatsappUrl = `https://wa.me/573182026212?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="flex items-center justify-center w-full bg-[#25D366] text-white py-4 px-6 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-emerald-100/50 mb-6"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Enviar comprobante por WhatsApp
            </button>
          )}

          <Link
            href="/"
            className="flex items-center justify-center w-full bg-black text-white py-4 px-6 rounded-2xl font-black text-sm hover:bg-gray-900 transition-all shadow-xl shadow-pink-100/50"
          >
            Continuar comprando
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <Link
            href="/orders"
            className="block w-full bg-white text-gray-500 py-3 px-4 rounded-xl font-bold hover:text-gray-900 transition-all text-center text-xs"
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