'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Calendar, Clock, ChevronDown, CheckCircle2, AlertCircle, ShoppingBag, Truck, MapPin, Receipt } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getStrapiMedia } from '@/utils/strapi';
import { cn } from '@/utils/cn';

// Define order types
interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  images?: { url: string }[];
}

interface Order {
  id: number;
  documentId: string;
  subtotal: number;
  total: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled' | 'paid';
  createdAt: string;
  deliveryMethod: {
    id: string;
    name: string;
  };
  shippingAddress: {
    address: string;
    city: string;
    department: string;
  } | null;
  paymentMethod: 'nequi' | 'efectivo' | 'stripe';
  items: OrderItem[];
}

export default function OrdersPage() {
  const { state: { user, loading: authLoading } } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, router]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders?userId=${user?.id}`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar los pedidos');
      }
      const data = await response.json();
      setOrders(data.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusInfo = (status: Order['status']) => {
    const statusMap = {
      pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-600 border-amber-200', icon: Clock },
      paid: { label: 'Pagado', color: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
      confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-600 border-blue-200', icon: CheckCircle2 },
      delivered: { label: 'Entregado', color: 'bg-stone-100 text-stone-600 border-stone-200', icon: Truck },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-600 border-red-200', icon: AlertCircle }
    };
    return statusMap[status] || statusMap.pending;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-brand-background">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin shadow-xl shadow-brand-primary/20" />
          <p className="text-xs font-black text-brand-primary uppercase tracking-[0.2em] animate-pulse">Cargando tu historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 bg-brand-background dark:bg-zinc-950">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8"
          >
            <div className="space-y-4">
              <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] inline-block bg-brand-primary/10 px-4 py-1.5 rounded-full">
                Mi Perfil
              </span>
              <h1 className="text-5xl md:text-7xl font-black text-stone-900 dark:text-white tracking-tight">Mis Pedidos</h1>
            </div>
            <p className="text-stone-400 font-medium text-lg leading-relaxed max-w-xs">
              Gestiona y rastrea el estado de tus compras en tiempo real.
            </p>
          </motion.div>
        </div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-[3rem] p-16 text-center shadow-2xl shadow-stone-200/50 dark:shadow-none border border-stone-100 dark:border-white/5"
          >
            <div className="relative inline-block mb-10">
              <div className="absolute inset-0 bg-brand-primary/10 blur-3xl rounded-full" />
              <div className="relative bg-stone-50 dark:bg-zinc-800 p-10 rounded-[2.5rem] border border-stone-100 dark:border-white/5">
                <Package className="w-16 h-16 text-stone-400" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-stone-900 dark:text-white mb-4 uppercase tracking-tight">No tienes pedidos aún</h3>
            <p className="text-stone-400 mb-10 max-w-md mx-auto font-medium text-lg leading-relaxed">
              Tu historial está vacío. ¡Es un excelente momento para encontrar algo especial!
            </p>
            <Link href="/">
              <Button size="lg" className="rounded-2xl px-12 h-14 font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20">
                Empezar a Comprar
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {orders.map((order, index) => {
              const status = getStatusInfo(order.status);
              const isExpanded = expandedOrders.has(order.documentId);

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={order.documentId}
                >
                  <Card className="overflow-hidden border-none shadow-xl shadow-stone-100/50 hover:shadow-2xl hover:shadow-brand-primary/5 transition-all duration-500 rounded-[2.5rem] bg-white dark:bg-zinc-900">
                    <div
                      onClick={() => toggleOrder(order.documentId)}
                      className="p-8 md:p-10 cursor-pointer hover:bg-stone-50/50 dark:hover:bg-zinc-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-8"
                    >
                      <div className="flex items-center gap-8">
                        <div className="hidden md:flex bg-stone-50 dark:bg-zinc-800 p-5 rounded-[1.5rem] border border-stone-100 dark:border-white/5 shadow-sm">
                          <Package className="w-8 h-8 text-stone-400" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
                              Pedido #{order.id}
                            </h3>
                            <span className={cn(
                              "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                              status.color
                            )}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-6 text-stone-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-wider">{formatDate(order.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-wider">
                                {order.items.length} {order.items.length === 1 ? 'artículo' : 'artículos'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-10">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1">Total del Pedido</p>
                          <p className="text-3xl font-black text-brand-primary">{formatCurrency(order.total)}</p>
                        </div>
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-stone-50 dark:bg-zinc-800 border border-stone-100 dark:border-white/5",
                          isExpanded ? "bg-brand-primary text-white border-brand-primary" : "text-stone-400"
                        )}>
                          <ChevronDown className={cn("w-6 h-6 transition-transform duration-500", isExpanded ? "rotate-180" : "")} />
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-stone-100 dark:border-white/5"
                        >
                          <div className="p-8 md:p-12 space-y-12 bg-stone-50/30 dark:bg-zinc-900/40">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                              {/* Items List */}
                              <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Detalle de Productos</h4>
                                <div className="space-y-4">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-6 p-4 bg-white dark:bg-zinc-800/50 rounded-2xl border border-stone-100 dark:border-white/5 shadow-sm group">
                                      <div className="w-16 h-16 bg-stone-50 dark:bg-zinc-700 rounded-xl overflow-hidden border border-stone-100 dark:border-white/10 flex-shrink-0 relative">
                                        {item.images?.[0]?.url ? (
                                          <Image
                                            src={getStrapiMedia(item.images[0].url) || '/placeholder.png'}
                                            alt={item.name}
                                            fill
                                            className="object-contain p-2 group-hover:scale-110 transition-transform"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-stone-200">
                                            <ShoppingBag className="w-8 h-8" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h5 className="text-sm font-black text-stone-900 dark:text-white truncate uppercase tracking-tight">{item.name}</h5>
                                        <p className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-wider">
                                          Cantidad: {item.quantity} × {formatCurrency(item.price)}
                                        </p>
                                      </div>
                                      <p className="text-sm font-black text-stone-900 dark:text-white">
                                        {formatCurrency(item.price * item.quantity)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Information & Summary */}
                              <div className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                      <MapPin className="w-3.5 h-3.5" /> Entrega
                                    </h4>
                                    <div className="bg-white dark:bg-zinc-800/50 p-5 rounded-2xl border border-stone-100 dark:border-white/5">
                                      <p className="text-sm font-black text-stone-900 dark:text-white mb-1 uppercase tracking-tight">{order.deliveryMethod?.name}</p>
                                      {order.shippingAddress ? (
                                        <div className="text-xs text-stone-500 space-y-1 font-medium leading-relaxed">
                                          <p>{order.shippingAddress.address}</p>
                                          <p>{order.shippingAddress.city}, {order.shippingAddress.department}</p>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-stone-500 font-medium">Recogida física en tienda</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                      <Receipt className="w-3.5 h-3.5" /> Pago
                                    </h4>
                                    <div className="bg-white dark:bg-zinc-800/50 p-5 rounded-2xl border border-stone-100 dark:border-white/5">
                                      <p className="text-sm font-black text-stone-900 dark:text-white mb-1 uppercase tracking-tight">
                                        {order.paymentMethod === 'nequi' ? 'Transferencia' : order.paymentMethod === 'stripe' ? 'Tarjeta' : 'Contraentrega'}
                                      </p>
                                      <p className="text-xs text-stone-500 font-medium leading-relaxed font-bold uppercase tracking-widest text-brand-primary">
                                        {order.paymentMethod === 'nequi' ? 'Nequi / Bancolombia' : order.paymentMethod === 'stripe' ? 'Pago Online' : 'Efectivo'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-brand-primary/[0.03] dark:bg-brand-primary/[0.05] p-8 rounded-[2rem] border border-brand-primary/10 space-y-4 shadow-weight-sm">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Subtotal:</span>
                                    <span className="font-extrabold text-stone-900 dark:text-white">{formatCurrency(order.subtotal)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Costo de Envío:</span>
                                    <span className="font-extrabold text-emerald-500">
                                      {order.total - (order.subtotal || 0) === 0 ? 'GRATIS' : formatCurrency(order.total - order.subtotal)}
                                    </span>
                                  </div>
                                  <div className="pt-6 border-t border-brand-primary/10 flex justify-between items-center">
                                    <span className="text-xs font-black text-stone-900 dark:text-stone-300 uppercase tracking-[0.3em]">Total Final</span>
                                    <span className="text-4xl font-black text-brand-primary">
                                      {formatCurrency(order.total)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
