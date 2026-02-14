'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, CheckCircle2, ShoppingBag, ArrowRight, Package, Clock, Truck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-brand-background dark:bg-zinc-950 flex items-center justify-center p-6 md:p-12">
      <Card className="max-w-2xl w-full p-8 md:p-16 text-center border-none shadow-2xl shadow-stone-200/50 dark:shadow-none rounded-[3.5rem] bg-white dark:bg-zinc-900 overflow-hidden relative">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-secondary/5 rounded-full -ml-32 -mb-32 blur-3xl" />

        <div className="relative mb-12 inline-block">
          <div className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full scale-150" />
          <div className="relative bg-brand-primary text-white w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-brand-primary/40 transform rotate-3">
            <CheckCircle2 className="w-12 h-12" />
          </div>
        </div>

        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-black text-stone-900 dark:text-white mb-6 tracking-tight">
            {orderDetails?.paymentMethod === 'efectivo' ? '¡Pedido Confirmado!' : '¡Pago Exitoso!'}
          </h1>

          {isMock && (
            <div className="inline-block bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 border border-amber-200">
              Modo de Prueba
            </div>
          )}

          <p className="text-stone-500 text-lg font-medium leading-relaxed mb-12 max-w-lg mx-auto">
            {isMock
              ? 'Tu pago de prueba ha sido procesado correctamente. En producción, esto sería un pago real.'
              : orderDetails?.paymentMethod === 'efectivo'
                ? 'Hemos recibido tu pedido correctamente. El pago se realizará al momento de la entrega o recogida.'
                : 'Tu transacción ha sido completada con éxito. Ya estamos preparando todo para enviar tus productos.'
            }
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-stone-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border border-stone-100 dark:border-white/5 flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-white dark:bg-zinc-700 rounded-xl flex items-center justify-center shadow-sm mb-4 border border-stone-100 dark:border-white/10">
                <Package className="w-5 h-5 text-brand-primary" />
              </div>
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Método de Pago</span>
              <span className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight">
                {orderDetails?.paymentMethod === 'nequi' || orderDetails?.paymentMethod === 'nequi_manual'
                  ? 'Nequi / Bancolombia'
                  : orderDetails?.paymentMethod === 'efectivo'
                    ? 'Efectivo (Contraentrega)'
                    : 'Tarjeta / Online'}
              </span>
            </div>
            <div className="bg-stone-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border border-stone-100 dark:border-white/5 flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-white dark:bg-zinc-700 rounded-xl flex items-center justify-center shadow-sm mb-4 border border-stone-100 dark:border-white/10">
                <Truck className="w-5 h-5 text-brand-secondary" />
              </div>
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Tipo de Entrega</span>
              <span className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight">
                {orderDetails?.deliveryMethod.name || 'Envío estándar'}
              </span>
            </div>
          </div>

          {/* Order Snapshot */}
          {orderDetails && (
            <div className="bg-brand-primary/[0.02] dark:bg-brand-primary/[0.05] rounded-[2.5rem] p-8 md:p-10 mb-12 border border-brand-primary/10 text-left">
              <h3 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-8">Resumen de tu Compra</h3>

              <div className="space-y-4 mb-8">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-tight line-clamp-1 max-w-[180px]">{item.name}</span>
                      <span className="text-[10px] font-black text-stone-400 bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">×{item.quantity}</span>
                    </div>
                    <span className="font-extrabold text-stone-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-brand-primary/10">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400 font-bold uppercase tracking-widest">Subtotal:</span>
                  <span className="text-stone-900 dark:text-white font-black">{formatCurrency(orderDetails.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400 font-bold uppercase tracking-widest">Envío:</span>
                  <span className="text-emerald-500 font-black">{orderDetails.deliveryCost === 0 ? 'GRATIS' : formatCurrency(orderDetails.deliveryCost)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 mt-2 border-t border-brand-primary/10">
                  <span className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-[0.2em]">Total</span>
                  <span className="text-3xl font-black text-brand-primary">{formatCurrency(orderDetails.total)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 max-w-sm mx-auto">
            {orderDetails?.paymentMethod === 'nequi_manual' && (
              <Button
                onClick={() => {
                  const message = `¡Hola Prana Make up! Acabo de realizar una transferencia Nequi por mi pedido. El total es ${formatCurrency(orderDetails.total)}. Adjunto el comprobante.`;
                  const whatsappUrl = `https://wa.me/573182026212?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-none py-7 rounded-2xl shadow-xl shadow-emerald-500/20"
              >
                <MessageCircle className="w-5 h-5 mr-3" />
                <span className="uppercase tracking-widest font-black text-xs">Enviar por WhatsApp</span>
              </Button>
            )}

            <Link href="/" className="block">
              <Button className="w-full py-7 rounded-2xl shadow-xl shadow-brand-primary/20">
                <span className="uppercase tracking-widest font-black text-xs">Aceptar y Salir</span>
              </Button>
            </Link>

            <Link href="/orders" className="block text-[10px] font-black text-stone-400 hover:text-brand-primary uppercase tracking-[0.3em] transition-colors py-4">
              Ir a mis pedidos
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-brand-background">
        <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}