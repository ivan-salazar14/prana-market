'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ShoppingBag,
  Plus,
  Minus,
  Star,
  ShieldCheck,
  Truck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getStrapiMedia } from '@/utils/strapi';
import { cn } from '@/utils/cn';

interface ProductCategory {
  id: number;
  Name: string;
  slug: string;
  Description: string;
  Image?: {
    url: string;
    alternativeText?: string;
  };
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  stock: number;
  images?: Array<{
    url: string;
    alternativeText?: string;
  }>;
  product_category?: ProductCategory;
}


export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const { dispatch, state } = useCart();

  useEffect(() => {
    // Fetch product
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        const productData = data.data;
        setProduct(productData);
        // Initial quantity should be 1 if stock exists, else 0
        if (productData && productData.stock <= 0) {
          setQuantity(0);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching product:', err);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;

    // Optional: check if already in cart and cap total quantity
    const existingInCart = state.items.find(item => item.id === product.id);
    const currentQtyInCart = existingInCart?.quantity || 0;

    if (currentQtyInCart + quantity > product.stock) {
      alert(`No puedes añadir más de ${product.stock} unidades de este producto.`);
      return;
    }

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        original_price: product.original_price,
        discount_percentage: product.discount_percentage,
        image: product.images?.[0]?.url,
        stock: product.stock,
        quantity
      }
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const incrementQuantity = () => {
    if (!product) return;
    setQuantity(prev => (prev < product.stock ? prev + 1 : prev));
  };
  const decrementQuantity = () => setQuantity(prev => {
    if (product && product.stock <= 0) return 0;
    return prev > 1 ? prev - 1 : 1;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full"
          />
          <p className="mt-4 text-gray-500 font-medium">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h1>
          <p className="text-gray-600 mb-8">Lo sentimos, no pudimos encontrar el producto que estás buscando.</p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-20">
      {/* Breadcrumbs */}
      <div className="bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-white/10 px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center text-gray-600 font-medium"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Atrás
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Prana Market</span>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-600 truncate max-w-[150px] md:max-w-none">
              {product.name}
            </span>
          </div>
          <div className="w-10"></div> {/* Spacer for balance */}
        </div>
      </div>

      <main className="container mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* Left Column: Image Gallery */}
          <div className="space-y-6">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 dark:bg-zinc-900 group border border-gray-100 dark:border-white/10 shadow-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  <Image
                    fill
                    src={getStrapiMedia(product.images?.[selectedImage]?.url || null) || '/placeholder.png'}
                    alt={product.images?.[selectedImage]?.alternativeText || product.name}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Product Badges */}
              <div className="absolute top-4 left-4">
                {product.product_category && (
                  <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-emerald-700 border border-emerald-100 shadow-sm uppercase tracking-wider">
                    {product.product_category.Name}
                  </span>
                )}
              </div>

              {/* Discount Badge */}
              {product.discount_percentage && product.discount_percentage > 0 && (
                <div className="absolute top-4 right-4">
                  <span className="bg-pink-600 text-white px-4 py-1.5 rounded-full text-sm font-black shadow-xl shadow-pink-200 animate-pulse">
                    -{product.discount_percentage}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex flex-wrap gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all",
                      selectedImage === index
                        ? "border-emerald-600 ring-2 ring-emerald-100 ring-offset-2"
                        : "border-transparent hover:border-gray-300"
                    )}
                  >
                    <Image
                      fill
                      src={getStrapiMedia(image.url) || ''}
                      alt={image.alternativeText || `Imagen ${index + 1}`}
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Info */}
          <div className="flex flex-col">
            <div className="flex items-center space-x-1 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 text-sm text-gray-500">(4.8 / 5)</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
              {product.name}
            </h1>

            <div className="flex flex-col mb-8">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-emerald-600">{formattedPrice}</span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-xl text-gray-400 line-through font-medium">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0,
                    }).format(product.original_price)}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">IVA Incluido</span>

              {product.original_price && product.original_price > product.price && (
                <div className="mt-2 inline-flex items-center text-xs font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded-lg w-fit">
                  Ahorras: {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0,
                  }).format(product.original_price - product.price)}
                </div>
              )}
            </div>

            <div className="prose prose-sm text-gray-600 dark:text-gray-300 mb-10">
              <p className="text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="space-y-8 border-t border-gray-100 pt-8">
              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  Cantidad
                </label>
                <div className="flex items-center space-x-4">
                  <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-1 shadow-inner">
                    <button
                      onClick={decrementQuantity}
                      disabled={product.stock <= 0}
                      className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-500 active:scale-90 disabled:opacity-30"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-12 text-center text-lg font-bold text-gray-900">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQuantity}
                      disabled={product.stock <= 0 || quantity >= product.stock}
                      className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-500 active:scale-90 disabled:opacity-30"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      product.stock > 10 ? "text-emerald-600" : product.stock > 0 ? "text-amber-600" : "text-red-600"
                    )}>
                      {product.stock > 0 ? `En Stock: ${product.stock} unidades` : 'Agotado'}
                    </span>
                    <span className="text-[10px] text-gray-400 italic">Disponibilidad en tiempo real</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={addedToCart || product.stock <= 0}
                  className={cn(
                    "flex-1 relative flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl text-lg font-bold transition-all shadow-xl active:scale-95 disabled:opacity-50",
                    product.stock <= 0
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                      : addedToCart
                        ? "bg-gray-900 text-white shadow-gray-200"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {product.stock <= 0 ? (
                      <motion.div
                        key="soldout"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center"
                      >
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Producto Agotado
                      </motion.div>
                    ) : addedToCart ? (
                      <motion.div
                        key="added"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="flex items-center"
                      >
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        ¡Añadido!
                      </motion.div>
                    ) : (
                      <motion.div
                        key="add"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="flex items-center"
                      >
                        <ShoppingBag className="h-5 w-5 mr-2" />
                        Añadir al carrito
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>

              {/* Product Benefits */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="bg-white p-2 rounded-xl border border-gray-100 mr-3">
                    <Truck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Envío Rápido</p>
                    <p className="text-[10px] text-gray-500">Todo el país</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="bg-white p-2 rounded-xl border border-gray-100 mr-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Pago Seguro</p>
                    <p className="text-[10px] text-gray-500">100% Protegido</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Recommended Products or Footer can go here */}
    </div>
  );
}
