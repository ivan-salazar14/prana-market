'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Image {
  id: number;
  url: string;
  documentId: string;
  alternativeText: string | null;
}

interface ProductCategory {
  id: number;
  Name: string;
  slug: string;
  documentId: string;
  Description: string;
}

interface OrderItem {
  id: number;
  name: string;
  slug: string | null;
  price: number;
  stock: number;
  images: Image[];
  isActive: boolean;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  documentId: string;
  description: string;
  publishedAt: string;
  product_category: ProductCategory;
}

interface DeliveryMethod {
  id: string;
  cost: number;
  name: string;
  description: string;
}

interface ShippingAddress {
  // Define properties for shipping address if available, otherwise keep as unknown
  [key: string]: unknown;
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
  updatedAt: string;
  publishedAt: string;
  shippingAddress: ShippingAddress | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        console.error('Failed to fetch orders:', response.status, response.statusText);
      }
    } catch (error) {
      setError('Ocurrió un error al cargar los pedidos. Por favor, revisa tu conexión.');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) {
      return 'Fecha no disponible';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return 'N/A';
    }
    return `COP ${amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDeliveryCost = (amount: number | undefined | null) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return 'N/A';
    }
    if (amount === 0) {
      return 'Gratis';
    }
    return formatCurrency(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar los pedidos</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchOrders();
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Pedidos</h1>
          <p className="mt-2 text-gray-600">Revisa el historial de tus compras</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes pedidos aún</h3>
            <p className="text-gray-600 mb-6">¡Empieza a comprar productos deliciosos!</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Pedido #{order.id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status ?? '')}`}>
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Productos:</h4>
                  <div className="space-y-2 mb-4">
                    {order.items?.map((item: OrderItem, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name || 'Producto sin nombre'} (x{item.quantity || 0})</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Envío:</span>
                      <span>{formatDeliveryCost(order.deliveryCost)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Total:</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p><strong>Método de entrega:</strong> {order.deliveryMethod?.name || 'No especificado'}</p>
                    <p><strong>ID de transacción:</strong> {order.transactionId && order.transactionId !== 'undefined' ? order.transactionId : 'N/A'}</p>
                    <p><strong>Método de pago:</strong> {order.paymentMethod || 'No especificado'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}