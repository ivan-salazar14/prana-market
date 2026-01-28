'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  ChevronRight,
  Calendar,
  CreditCard,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ShoppingBag,
  Search,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getStrapiMedia } from '@/utils/strapi';
import { cn } from '@/utils/cn';

interface ProductImage {
  id: number;
  url: string;
  documentId: string;
  alternativeText: string | null;
}

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  images: ProductImage[];
}

interface DeliveryMethod {
  id: string;
  cost: number;
  name: string;
  description: string;
}

interface Order {
  id: number;
  documentId: string;
  items: OrderItem[];
  status: string;
  total: number;
  subtotal: number;
  deliveryCost: number;
  deliveryMethod: DeliveryMethod;
  transactionId: string | null;
  paymentMethod: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const { state: authState } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authState.user) {
      router.push('/login');
      return;
    }
    fetchOrders();
  }, [authState.user, router]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
        setError(null);
      } else {
        setError('No se pudieron cargar los pedidos. Por favor, inténtalo de nuevo más tarde.');
      }
    } catch (error) {
      setError('Ocurrió un error al cargar los pedidos. Por favor, revisa tu conexión.');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'pagado':
        return {
          label: 'Pagado',
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-4 h-4" />
        };
      case 'pending':
      case 'pendiente':
        return {
          label: 'Pendiente',
          color: 'bg-amber-100 text-amber-700 border-amber-200',
          icon: <Clock className="w-4 h-4" />
        };
      case 'processing':
      case 'procesando':
        return {
          label: 'En Proceso',
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: <TrendingUp className="w-4 h-4" />
        };
      case 'shipped':
      case 'enviado':
        return {
          label: 'En Camino',
          color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          icon: <Truck className="w-4 h-4" />
        };
      case 'delivered':
      case 'entregado':
        return {
          label: 'Entregado',
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          icon: <Package className="w-4 h-4" />
        };
      case 'cancelled':
      case 'cancelado':
        return {
          label: 'Cancelado',
          color: 'bg-rose-100 text-rose-700 border-rose-200',
          icon: <AlertCircle className="w-4 h-4" />
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: <Package className="w-4 h-4" />
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full"
          />
          <p className="mt-4 text-gray-500 font-medium">Cargando tus pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Ups! Algo salió mal</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchOrders(); }}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white bg-emerald-600 hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 pt-10 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              <Link href="/" className="hover:text-emerald-600 transition-colors">Inicio</Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white font-medium">Mis Pedidos</span>
            </nav>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center">
              <Package className="mr-4 h-10 w-10 text-emerald-600" />
              Mis Pedidos
            </h1>
          </div>
          <p className="text-gray-500 font-medium pb-1">
            Tienes <span className="text-emerald-600 font-bold">{orders.length}</span> {orders.length === 1 ? 'pedido realizado' : 'pedidos realizados'}
          </p>
        </div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-white/5 shadow-xl shadow-gray-200/50"
          >
            <div className="bg-emerald-50 dark:bg-emerald-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Aún no has realizado pedidos</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-md mx-auto">
              Explora nuestra selección de productos frescos y orgánicos para empezar tu primera compra.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl text-white bg-emerald-600 hover:bg-emerald-700 transition-all font-bold shadow-xl shadow-emerald-200 group"
            >
              Comenzar a comprar
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {orders.map((order, index) => {
                const status = getStatusInfo(order.status || 'pending');
                const isExpanded = expandedOrder === order.id;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "group bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 transition-all duration-300",
                      isExpanded ? "shadow-2xl ring-1 ring-emerald-100" : "shadow-sm hover:shadow-xl hover:translate-y-[-2px]"
                    )}
                  >
                    {/* Order Summary Card */}
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Order Status & ID */}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className={cn(
                              "px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2",
                              status.color
                            )}>
                              {status.icon}
                              {status.label.toUpperCase()}
                            </span>
                            <span className="text-gray-400 font-mono text-sm tracking-tight">
                              ID: #{order.id}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Fecha</span>
                                <span className="font-semibold">{formatDate(order.createdAt)}</span>
                              </div>
                            </div>
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <CreditCard className="w-5 h-5 mr-3 text-gray-400" />
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Pago</span>
                                <span className="font-semibold capitalize">{order.paymentMethod || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Total & Action */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-gray-100 dark:border-white/5 pt-6 md:pt-0 md:pl-10 min-w-[200px]">
                          <div className="text-left md:text-right">
                            <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600/60 mb-1">Total Pagado</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">
                              {formatCurrency(order.total)}
                            </p>
                          </div>
                          <button
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            className={cn(
                              "mt-0 md:mt-4 p-4 rounded-2xl transition-all flex items-center justify-center",
                              isExpanded
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                                : "bg-gray-50 dark:bg-zinc-800 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                            )}
                          >
                            <span className="sr-only">Ver detalles</span>
                            <ChevronDown className={cn("h-6 w-6 transition-transform duration-300", isExpanded && "rotate-180")} />
                          </button>
                        </div>
                      </div>

                      {/* Preview Items (when collapsed) */}
                      {!isExpanded && (
                        <div className="mt-8 flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                          {order.items.slice(0, 4).map((item, i) => (
                            <div key={i} className="relative w-16 h-16 flex-shrink-0">
                              <Image
                                fill
                                src={getStrapiMedia(item.images?.[0]?.url || null) || '/placeholder.png'}
                                alt={item.name}
                                className="object-cover rounded-xl border border-gray-100 dark:border-white/10"
                              />
                            </div>
                          ))}
                          {order.items.length > 4 && (
                            <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-500 font-bold text-sm">
                              +{order.items.length - 4}
                            </div>
                          )}
                          <p className="text-sm font-medium text-gray-400 ml-2">
                            {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden border-t border-gray-100 dark:border-white/5"
                        >
                          <div className="p-6 md:p-8 bg-gray-50/50 dark:bg-black/20">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                              {/* Left: Product List */}
                              <div className="lg:col-span-2 space-y-4">
                                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center">
                                  <ShoppingBag className="w-4 h-4 mr-2" />
                                  Detalle de Productos
                                </h4>
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex items-center gap-4 bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="relative w-20 h-20 flex-shrink-0">
                                      <Image
                                        fill
                                        src={getStrapiMedia(item.images?.[0]?.url || null) || '/placeholder.png'}
                                        alt={item.name}
                                        className="object-cover rounded-xl"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{item.name}</h5>
                                      <p className="text-sm text-gray-500">
                                        Cantidad: <span className="font-semibold text-gray-700 dark:text-gray-300">{item.quantity}</span>
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-black text-gray-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</p>
                                      <p className="text-xs text-gray-400">{formatCurrency(item.price)} c/u</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Right: Summary & Stats */}
                              <div className="space-y-6">
                                <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Resumen</h4>
                                  <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Subtotal</span>
                                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Envío ({order.deliveryMethod?.name})</span>
                                      <span className="font-semibold text-emerald-600">{order.deliveryCost === 0 ? 'Gratis' : formatCurrency(order.deliveryCost)}</span>
                                    </div>
                                    <div className="h-px bg-gray-100 dark:bg-white/5 my-2" />
                                    <div className="flex justify-between items-end">
                                      <span className="text-base font-bold text-gray-900 dark:text-white">Total</span>
                                      <span className="text-2xl font-black text-emerald-600">{formatCurrency(order.total)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center">
                                    <Truck className="w-4 h-4 mr-2" />
                                    Entrega
                                  </h4>
                                  <div className="space-y-4 text-sm">
                                    <div className="flex gap-3">
                                      <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-600">
                                        <Truck className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-gray-900 dark:text-white">Método</p>
                                        <p className="text-gray-500">{order.deliveryMethod?.name || 'Estándar'}</p>
                                      </div>
                                    </div>
                                    {order.transactionId && order.transactionId !== 'undefined' && (
                                      <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-600">
                                          <Search className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <p className="font-bold text-gray-900 dark:text-white">Transacción</p>
                                          <p className="text-gray-500 font-mono text-xs truncate max-w-[150px]">{order.transactionId}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
