'use client';

import { useCart, DeliveryMethod, ShippingAddress } from '@/context/CartContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Wallet,
  Truck,
  Store,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import NequiCheckout from './NequiCheckout';
import ManualNequiCheckout from './ManualNequiCheckout';
import ShippingForm from './ShippingForm';
import { cn } from '@/utils/cn';

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
  items: any[]; // Changed from unknown[] for easier access if needed
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
        <div className="bg-pink-50 border-2 border-pink-100 rounded-2xl p-5 mb-4">
          <h4 className="text-lg font-bold text-pink-900 mb-3 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Confirmar Pedido
          </h4>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-pink-800">
              <span className="font-medium">Entrega:</span>
              <span className="font-bold">{deliveryMethod?.name}</span>
            </div>
            <div className="flex justify-between text-sm text-pink-800">
              <span className="font-medium">Total:</span>
              <span className="text-lg font-bold">COP {total.toLocaleString('es-CO')}</span>
            </div>
            <p className="text-xs text-pink-700 mt-3 pt-3 border-t border-pink-200/50">
              El pago se realizará al momento de la entrega o recogida.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmation(false)}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 font-bold transition-all active:scale-95"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmOrder}
            disabled={loading}
            className="flex-1 bg-black text-white py-3 px-4 rounded-xl hover:bg-gray-900 font-bold shadow-lg shadow-pink-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Procesando...
              </span>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="efectivo-checkout">
      <h3 className="text-lg font-bold mb-4 text-gray-900">Pago Contraentrega (Efectivo)</h3>

      <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 mb-4">
        <div className="flex items-start">
          <div className="bg-white p-2 rounded-xl border border-pink-100 mr-3">
            <Wallet className="h-5 w-5 text-pink-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-pink-900 font-bold mb-1">
              Pago al momento de la entrega
            </p>
            <p className="text-xs text-pink-700 leading-relaxed">
              {deliveryMethod?.id === 'pickup'
                ? 'Pagarás cuando recojas tu pedido en la tienda'
                : 'Pagarás cuando recibas tu pedido en el domicilio'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-4">
        <p className="text-sm font-bold text-gray-900 mb-3">Instrucciones:</p>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start">
            <span className="text-pink-500 mr-2">•</span>
            <span>El pago es al momento de la {deliveryMethod?.id === 'pickup' ? 'recogida' : 'entrega'}</span>
          </li>
          <li className="flex items-start">
            <span className="text-pink-500 mr-2">•</span>
            <span>Por favor, ten el monto exacto o aproximado</span>
          </li>
          <li className="flex items-start">
            <span className="text-pink-500 mr-2">•</span>
            <span>Total: <strong className="text-gray-900">COP {total.toLocaleString('es-CO')}</strong></span>
          </li>
        </ul>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 mb-6">
        <p className="text-[11px] text-amber-800 flex items-start">
          <AlertCircle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Importante:</strong> Tu pedido será preparado una vez confirmado.
            {deliveryMethod?.id === 'pickup'
              ? ' Te notificaremos cuando esté listo.'
              : ' Te contactaremos para coordinar.'}
          </span>
        </p>
      </div>

      <button
        onClick={() => setShowConfirmation(true)}
        className="w-full bg-black text-white py-4 px-6 rounded-2xl hover:bg-gray-900 font-bold shadow-xl shadow-pink-100 transition-all active:scale-[0.98]"
      >
        Confirmar Pedido
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
    description: 'Entrega en zona urbana - 1 día hábil'
  },
  {
    id: 'delivery_regional',
    name: 'Domicilio regional',
    cost: 10000,
    description: 'Entrega fuera de zona urbana - 2 días hábiles'
  }
];

export default function Cart({ isOpen, onClose }: CartProps) {
  const { state, dispatch } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'nequi' | 'efectivo'>('efectivo');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-[9998]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-zinc-950 shadow-2xl z-[9999] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="bg-pink-50 dark:bg-pink-900/30 p-2 rounded-xl">
                  <ShoppingBag className="w-6 h-6 text-pink-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tu Carrito</h2>
                {state.items.length > 0 && (
                  <span className="bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {state.items.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {state.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                  <div className="bg-gray-50 dark:bg-zinc-900 p-6 rounded-full">
                    <ShoppingBag className="w-12 h-12 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tu carrito está vacío</h3>
                    <p className="text-sm text-gray-500 max-w-[200px] mt-1">Explora nuestros productos y encuentra algo especial para ti.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-4 px-6 py-2 bg-pink-600 text-white rounded-full font-bold text-sm hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200 dark:shadow-none"
                  >
                    Ir a la tienda
                  </button>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Productos</h4>
                    <div className="space-y-3">
                      {state.items.map((item) => (
                        <motion.div
                          layout
                          key={item.id}
                          className="flex items-center p-3 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-white/5 group transition-all hover:shadow-sm"
                        >
                          {/* Image Placeholder or Image if available */}
                          <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 flex-shrink-0 relative">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ShoppingBag className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          <div className="ml-4 flex-1">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
                            <p className="text-sm font-bold text-pink-600 mt-0.5">
                              COP {item.price.toLocaleString('es-CO')}
                            </p>

                            <div className="flex items-center mt-2">
                              <div className="flex items-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg p-1">
                                <button
                                  onClick={() => dispatch({ type: 'UPDATE_QUANTITY', payload: { id: item.id, quantity: item.quantity - 1 } })}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-colors text-gray-500"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="mx-2.5 text-xs font-bold w-4 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => dispatch({ type: 'ADD_ITEM', payload: item })}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-colors text-gray-500"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button
                                onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: item.id })}
                                className="ml-4 text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Quitar
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Selection */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Método de entrega</h4>
                    <div className="space-y-3">
                      {DELIVERY_METHODS.map((method) => (
                        <label
                          key={method.id}
                          className={cn(
                            "flex items-start p-4 rounded-2xl border-2 transition-all cursor-pointer",
                            state.deliveryMethod?.id === method.id
                              ? "border-pink-600 bg-pink-50/50 dark:bg-pink-900/10"
                              : "border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900/30 hover:border-pink-200"
                          )}
                        >
                          <input
                            type="radio"
                            name="delivery"
                            value={method.id}
                            checked={state.deliveryMethod?.id === method.id}
                            onChange={() => {
                              dispatch({ type: 'SET_DELIVERY_METHOD', payload: method });
                              if (method.id === 'pickup') {
                                dispatch({ type: 'SET_SHIPPING_ADDRESS', payload: null });
                              }
                            }}
                            className="mt-1 sr-only"
                          />
                          <div className="bg-white dark:bg-zinc-800 p-2 rounded-xl border border-gray-100 dark:border-white/10 mr-4">
                            {method.id === 'pickup' ? <Store className="w-5 h-5 text-pink-600" /> : <Truck className="w-5 h-5 text-pink-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-bold text-sm text-gray-900 dark:text-white">{method.name}</span>
                              <span className="text-xs font-black text-pink-600">
                                {method.cost === 0 ? 'GRATIS' : `COP ${method.cost.toLocaleString('es-CO')}`}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{method.description}</p>
                          </div>
                          {state.deliveryMethod?.id === method.id && (
                            <div className="w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center ml-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Form Overlay for scroll context */}
                  {state.deliveryMethod && state.deliveryMethod.id !== 'pickup' && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-4">Datos de envío</h4>
                      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                        <ShippingForm />
                      </div>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="pt-4 border-t border-gray-100 dark:border-white/10 space-y-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Resumen</h4>
                    <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-5 space-y-3 border border-gray-100 dark:border-white/5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Subtotal</span>
                        <span className="text-gray-900 dark:text-white font-bold">COP {state.subtotal.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Envío</span>
                        <span className="text-pink-600 font-bold">
                          {state.deliveryCost === 0 ? 'Gratis' : `+ COP ${state.deliveryCost.toLocaleString('es-CO')}`}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                        <span className="text-base font-black text-gray-900 dark:text-white">Total</span>
                        <span className="text-xl font-black text-pink-600">
                          COP {state.total.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>

                    {/* Payment Section */}
                    {state.deliveryMethod && (state.deliveryMethod.id === 'pickup' || state.shippingAddress) ? (
                      <div className="space-y-6 pb-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Método de pago</h4>
                        <div className="grid grid-cols-1 gap-3 pb-8">
                          <button
                            onClick={() => setPaymentMethod('efectivo')}
                            className={cn(
                              "flex items-center p-4 rounded-2xl border-2 transition-all group",
                              paymentMethod === 'efectivo'
                                ? "border-pink-600 bg-pink-50/50 dark:bg-pink-900/10 shadow-lg shadow-pink-100/50 dark:shadow-none"
                                : "border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900/30 hover:border-pink-200"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-all",
                              paymentMethod === 'efectivo' ? "bg-pink-600 text-white" : "bg-gray-50 dark:bg-zinc-800 text-gray-400 group-hover:text-pink-500"
                            )}>
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <span className={cn("text-sm font-bold block", paymentMethod === 'efectivo' ? "text-pink-900 dark:text-pink-400" : "text-gray-500")}>Pago Contra Entrega / Efectivo</span>
                              <span className="text-[10px] text-gray-400 font-medium">Paga al recibir tu pedido</span>
                            </div>
                          </button>

                          <button
                            onClick={() => setPaymentMethod('nequi')}
                            className={cn(
                              "flex items-center p-4 rounded-2xl border-2 transition-all group",
                              paymentMethod === 'nequi'
                                ? "border-[#FF0082] bg-[#FF0082]/5 shadow-lg shadow-[#FF0082]/10"
                                : "border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900/30 hover:border-[#FF0082]/30"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-all",
                              paymentMethod === 'nequi' ? "bg-[#FF0082] text-white" : "bg-gray-50 dark:bg-zinc-800 text-gray-400 group-hover:text-[#FF0082]"
                            )}>
                              <Wallet className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <span className={cn("text-sm font-bold block", paymentMethod === 'nequi' ? "text-[#FF0082]" : "text-gray-500")}>Nequi (Transferencia)</span>
                              <span className="text-[10px] text-gray-400 font-medium">Transferencia directa inmediata</span>
                            </div>
                          </button>
                        </div>

                        {paymentMethod === 'efectivo' ? (
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
                            onError={(error: string) => alert(`Error: ${error}`)}
                          />
                        ) : (
                          <ManualNequiCheckout
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
                            onError={(error: string) => alert(`Error: ${error}`)}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 flex items-start mb-10">
                        <AlertCircle className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-400 leading-relaxed">
                          {!state.deliveryMethod
                            ? 'Selecciona un método de entrega para continuar con el pago.'
                            : 'Completa los datos de envío para continuar con el pago.'}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}