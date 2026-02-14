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
import { Button } from './ui/Button';
import { Card } from './ui/Card';

const FREE_SHIPPING_THRESHOLD = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD) || 50000;


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
  const [error, setError] = useState<string | null>(null);

  const handleConfirmOrder = async () => {
    if (!deliveryMethod) {
      setError('Por favor selecciona un método de entrega');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userString = localStorage.getItem('user');
      if (!userString) {
        throw new Error('Debes iniciar sesión para realizar un pedido');
      }

      const user = JSON.parse(userString);
      if (!user || !user.id) {
        throw new Error('Información de usuario no encontrada. Por favor inicia sesión nuevamente.');
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
        throw new Error(errorData.error || 'No se pudo crear el pedido');
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
    } catch (err) {
      console.error('Error creating order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Hubo un error al crear la orden. Por favor, intenta de nuevo.';
      setError(errorMessage);
      // onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="efectivo-checkout space-y-6">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              className="bg-red-50 border border-red-100 rounded-[1.5rem] p-4 flex items-start space-x-3 mb-2"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-0.5">Atención</p>
                <p className="text-xs text-red-700 leading-relaxed font-bold">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-brand-primary/5 border-2 border-brand-primary/10 rounded-[2rem] p-6 mb-0">
          <h4 className="text-lg font-black text-brand-primary mb-4 flex items-center uppercase tracking-widest">
            <CheckCircle2 className="w-5 h-5 mr-3" />
            Confirmar Pedido
          </h4>
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="font-bold text-stone-500 uppercase tracking-widest text-[10px]">Entrega:</span>
              <span className="font-extrabold text-stone-900">{deliveryMethod?.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-stone-500 uppercase tracking-widest text-[10px]">Total:</span>
              <span className="text-xl font-black text-brand-primary">COP {total.toLocaleString('es-CO')}</span>
            </div>
            <p className="text-[10px] text-brand-primary font-bold uppercase tracking-[0.1em] mt-6 pt-6 border-t border-brand-primary/10 leading-relaxed">
              El pago se realizará al momento de la entrega o recogida física de los productos.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleConfirmOrder}
            isLoading={loading}
            className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-brand-primary/20"
          >
            Confirmar Pedido
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowConfirmation(false)}
            className="w-full h-12 rounded-2xl text-stone-400 font-bold hover:text-stone-900"
            disabled={loading}
          >
            Regresar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="efectivo-checkout">
      <h3 className="text-xs font-black mb-6 text-stone-400 uppercase tracking-[0.2em] px-1">Pago Contraentrega (Efectivo)</h3>

      <div className="bg-stone-50 dark:bg-zinc-900 border border-stone-100 dark:border-white/5 rounded-[2rem] p-6 mb-6">
        <div className="flex items-start">
          <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-stone-100 dark:border-white/10 mr-4 shadow-sm">
            <Wallet className="h-6 w-6 text-brand-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-stone-900 dark:text-white font-black uppercase tracking-wider mb-1.5">
              Pago al momento de la entrega
            </p>
            <p className="text-xs text-stone-500 font-medium leading-relaxed">
              {deliveryMethod?.id === 'pickup'
                ? 'Deberás realizar el pago directamente en nuestro punto físico al retirar tu pedido.'
                : 'Pagarás el valor total del pedido al repartidor en el momento en que recibas tus productos.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-stone-50 dark:bg-zinc-900 border border-stone-100 dark:border-white/5 rounded-[2rem] p-6 mb-6">
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Instrucciones:</p>
        <ul className="text-sm text-stone-600 dark:text-stone-400 space-y-3 font-medium">
          <li className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mr-3" />
            <span>Pago al momento de la {deliveryMethod?.id === 'pickup' ? 'recogida' : 'entrega'}</span>
          </li>
          <li className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mr-3" />
            <span>Recomendamos tener el monto exacto</span>
          </li>
          <li className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mr-3" />
            <span>Total a pagar: <strong className="text-stone-900 dark:text-white ml-1">COP {total.toLocaleString('es-CO')}</strong></span>
          </li>
        </ul>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 mb-8 flex items-start">
        <AlertCircle className="w-4 h-4 mr-3 flex-shrink-0 mt-0.5 text-amber-600" />
        <p className="text-[10px] text-amber-800 dark:text-amber-400 font-bold leading-relaxed uppercase tracking-wider">
          <strong>Importante:</strong> Tu pedido será procesado de inmediato.
          {deliveryMethod?.id === 'pickup'
            ? ' Te notificaremos en cuanto esté listo para su entrega.'
            : ' Coordinaremos la entrega a la brevedad posible.'}
        </p>
      </div>

      <Button
        onClick={() => setShowConfirmation(true)}
        className="w-full h-16 rounded-[1.5rem] text-lg font-black shadow-xl shadow-brand-primary/20"
      >
        Continuar con el Pedido
      </Button>
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
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[9998]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-brand-background dark:bg-zinc-950 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[9999] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-stone-100 dark:border-white/10 flex justify-between items-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                <div className="bg-brand-primary p-2.5 rounded-2xl shadow-lg shadow-brand-primary/20">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">CARRITO</h2>
                  {state.items.length > 0 && (
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mt-0.5">
                      {state.items.length} {state.items.length === 1 ? 'Producto seleccionado' : 'Productos seleccionados'}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-stone-50"
              >
                <X className="w-6 h-6 text-stone-400" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
              {state.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-brand-primary/10 blur-3xl rounded-full" />
                    <div className="relative bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-stone-100 dark:border-white/5 shadow-xl">
                      <ShoppingBag className="w-20 h-20 text-stone-200" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">Tu carrito está vacío</h3>
                    <p className="text-sm text-stone-400 font-medium max-w-[240px] mx-auto leading-relaxed">
                      Parece que aún no has agregado tesoros a tu colección de belleza.
                    </p>
                  </div>
                  <Button
                    onClick={onClose}
                    className="h-14 px-10 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20"
                  >
                    Explorar la Tienda
                  </Button>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1">Productos en tu bolsa</h4>
                    <div className="space-y-4">
                      {state.items.map((item) => (
                        <motion.div
                          layout
                          key={item.id}
                          className="flex items-center p-4 bg-white dark:bg-zinc-900 rounded-[2rem] border border-stone-50 dark:border-white/5 group transition-all hover:shadow-xl hover:shadow-stone-200/40 dark:hover:shadow-none"
                        >
                          {/* Image */}
                          <div className="w-20 h-20 bg-stone-50 dark:bg-zinc-800 rounded-2xl overflow-hidden border border-stone-100 dark:border-white/5 flex-shrink-0 relative">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-200">
                                <ShoppingBag className="w-8 h-8" />
                              </div>
                            )}
                          </div>

                          <div className="ml-5 flex-1 pr-2">
                            <h3 className="text-sm font-black text-stone-900 dark:text-white line-clamp-1 truncate uppercase tracking-tight">{item.name}</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <p className="text-base font-black text-brand-primary">
                                COP {item.price.toLocaleString('es-CO')}
                              </p>
                              {item.original_price && item.original_price > item.price && (
                                <p className="text-[10px] text-stone-400 line-through font-bold">
                                  COP {item.original_price.toLocaleString('es-CO')}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center bg-stone-50 dark:bg-zinc-800 border border-stone-100 dark:border-white/10 rounded-xl p-1 gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => dispatch({ type: 'UPDATE_QUANTITY', payload: { id: item.id, quantity: item.quantity - 1 } })}
                                  className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-white"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="mx-1 text-xs font-black w-6 text-center text-stone-900 dark:text-white">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => dispatch({ type: 'ADD_ITEM', payload: item })}
                                  className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-white"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <button
                                onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: item.id })}
                                className="text-[10px] font-black text-red-400 hover:text-red-600 transition-all uppercase tracking-widest flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Quitar
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Selection */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1">Método de entrega</h4>
                    <div className="space-y-4">
                      {DELIVERY_METHODS.map((method) => {
                        const isFreeShipping = state.subtotal >= FREE_SHIPPING_THRESHOLD && method.id !== 'pickup';
                        const isSelected = state.deliveryMethod?.id === method.id;

                        return (
                          <label
                            key={method.id}
                            className={cn(
                              "flex items-start p-5 rounded-[2rem] border-2 transition-all cursor-pointer relative overflow-hidden group",
                              isSelected
                                ? "border-brand-primary bg-white shadow-xl shadow-brand-primary/5"
                                : "border-stone-100 dark:border-white/5 bg-white dark:bg-zinc-900/30 hover:border-brand-secondary/50"
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
                              className="sr-only"
                            />

                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center mr-5 transition-all shadow-sm",
                              isSelected ? "bg-brand-primary text-white" : "bg-stone-50 dark:bg-zinc-800 text-stone-400 group-hover:text-brand-primary"
                            )}>
                              {method.id === 'pickup' ? <Store className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                            </div>

                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className={cn("font-black text-sm uppercase tracking-tight", isSelected ? "text-stone-900" : "text-stone-500")}>{method.name}</span>
                                <div className="flex flex-col items-end">
                                  {isFreeShipping && method.cost > 0 && (
                                    <span className="text-[10px] text-stone-300 line-through font-bold">
                                      COP {method.cost.toLocaleString('es-CO')}
                                    </span>
                                  )}
                                  <span className={cn(
                                    "text-xs font-black uppercase tracking-widest",
                                    isFreeShipping || method.cost === 0 ? "text-emerald-500" : isSelected ? "text-brand-primary" : "text-stone-400"
                                  )}>
                                    {(method.cost === 0 || isFreeShipping) ? 'GRATIS' : `COP ${method.cost.toLocaleString('es-CO')}`}
                                  </span>
                                </div>
                              </div>
                              <p className="text-[10px] text-stone-400 font-medium leading-relaxed uppercase tracking-wider">{method.description}</p>
                            </div>

                            {isSelected && (
                              <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-brand-primary text-white rounded-bl-2xl">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Free Shipping Progress */}
                  {state.subtotal < FREE_SHIPPING_THRESHOLD ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-brand-primary/5 dark:bg-brand-primary/10 rounded-[2rem] p-6 border border-brand-primary/10 relative overflow-hidden"
                    >
                      <div className="relative z-10">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">
                            ¡Falta muy poco!
                          </span>
                          <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">
                            - COP {(FREE_SHIPPING_THRESHOLD - state.subtotal).toLocaleString('es-CO')}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-brand-primary/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(state.subtotal / FREE_SHIPPING_THRESHOLD) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-brand-primary shadow-[0_0_15px_rgba(219,39,119,0.5)]"
                          />
                        </div>
                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-4 text-center">
                          Agrega más productos para obtener <span className="text-brand-primary">Envío Gratis</span>
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] p-6 border border-emerald-100 dark:border-emerald-900/20 flex items-center animate-in zoom-in duration-500">
                      <div className="bg-emerald-500 p-2.5 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none mr-5">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-[0.2em] mb-1">
                          ¡Envío Gratis desbloqueado!
                        </p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-500 font-bold uppercase tracking-widest leading-relaxed">
                          Has alcanzado el monto de cortesía.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Shipping Form Overlay for scroll context */}
                  {state.deliveryMethod && state.deliveryMethod.id !== 'pickup' && (
                    <div className="pt-4 animate-in fade-in slide-in-from-top-6 duration-500">
                      <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1 mb-6">Datos de envío del pedido</h4>
                      <div className="bg-white dark:bg-zinc-900 border border-stone-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-stone-200/40 dark:shadow-none relative">
                        <div className="absolute top-0 right-10 w-4 h-4 bg-white dark:bg-zinc-900 border-l border-t border-stone-100 dark:border-white/5 -translate-y-2 rotate-45" />
                        <ShippingForm />
                      </div>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="pt-10 border-t border-stone-100 dark:border-white/10 space-y-8">
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1">Resumen de tu Orden</h4>
                    <div className="bg-stone-50 dark:bg-zinc-900/50 rounded-[2.5rem] p-8 space-y-5 border border-stone-100 dark:border-white/5">
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Subtotal:</span>
                        <span className="text-stone-900 dark:text-white font-black">COP {state.subtotal.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Envío:</span>
                        <span className={cn("font-black uppercase tracking-widest text-[10px]", state.deliveryCost === 0 ? "text-emerald-500" : "text-brand-primary")}>
                          {state.deliveryCost === 0 ? '¡Gratis!' : `+ COP ${state.deliveryCost.toLocaleString('es-CO')}`}
                        </span>
                      </div>
                      <div className="pt-6 border-t border-stone-200 dark:border-white/10 flex justify-between items-center">
                        <span className="text-xs font-black text-stone-400 uppercase tracking-[0.3em]">Total a Pagar</span>
                        <span className="text-3xl font-black text-brand-primary tracking-tight">
                          COP {state.total.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>

                    {/* Payment Section */}
                    {state.deliveryMethod && (state.deliveryMethod.id === 'pickup' || state.shippingAddress) ? (
                      <div className="space-y-8 pb-10">
                        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1">Escoge tu Forma de Pago</h4>
                        <div className="grid grid-cols-1 gap-4">
                          <button
                            onClick={() => setPaymentMethod('efectivo')}
                            className={cn(
                              "flex items-center p-5 rounded-[2rem] border-2 transition-all group relative overflow-hidden",
                              paymentMethod === 'efectivo'
                                ? "border-brand-primary bg-white shadow-2xl shadow-brand-primary/10"
                                : "border-stone-100 dark:border-white/5 bg-white dark:bg-zinc-900/30 hover:border-brand-secondary/30"
                            )}
                          >
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center mr-5 transition-all shadow-sm",
                              paymentMethod === 'efectivo' ? "bg-brand-primary text-white" : "bg-stone-50 dark:bg-zinc-800 text-stone-400 group-hover:text-brand-primary"
                            )}>
                              <CreditCard className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                              <span className={cn("text-sm font-black uppercase tracking-tight block mb-0.5", paymentMethod === 'efectivo' ? "text-stone-900" : "text-stone-500")}>Contra Entrega / Efectivo</span>
                              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Pagos seguros al recibir</span>
                            </div>
                            {paymentMethod === 'efectivo' && (
                              <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-brand-primary text-white rounded-bl-2xl">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </button>

                          <button
                            onClick={() => setPaymentMethod('nequi')}
                            className={cn(
                              "flex items-center p-5 rounded-[2rem] border-2 transition-all group relative overflow-hidden",
                              paymentMethod === 'nequi'
                                ? "border-[#FF0082] bg-white shadow-2xl shadow-[#FF0082]/10"
                                : "border-stone-100 dark:border-white/5 bg-white dark:bg-zinc-900/30 hover:border-[#FF0082]/30"
                            )}
                          >
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center mr-5 transition-all shadow-sm",
                              paymentMethod === 'nequi' ? "bg-[#FF0082] text-white" : "bg-gray-50 dark:bg-zinc-800 text-gray-400 group-hover:text-[#FF0082]"
                            )}>
                              <Wallet className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                              <span className={cn("text-sm font-black uppercase tracking-tight block mb-0.5", paymentMethod === 'nequi' ? "text-[#FF0082]" : "text-gray-500")}>Transferencia Anticipada</span>
                              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Nequi / Bancolombia instantáneo</span>
                            </div>
                            {paymentMethod === 'nequi' && (
                              <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-[#FF0082] text-white rounded-bl-2xl">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </button>
                        </div>

                        <div className="pt-6 animate-in slide-in-from-bottom-10 duration-500">
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
                              onError={(error: string) => console.error(`Order Error: ${error}`)}
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
                              onError={(error: string) => console.error(`Order Error: ${error}`)}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-[2rem] p-8 flex items-start mb-12 animate-pulse">
                        <AlertCircle className="w-6 h-6 text-amber-600 mr-4 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-xs font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest leading-relaxed">
                            Paso requerido para continuar:
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-500 font-bold mt-1">
                            {!state.deliveryMethod
                              ? 'Por favor selecciona tu método de entrega preferido.'
                              : 'Debes completar y guardar tu dirección de envío.'}
                          </p>
                        </div>
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