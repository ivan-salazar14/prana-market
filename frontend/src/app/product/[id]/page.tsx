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
import { Button } from '@/components/ui/Button';
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

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

          {/* Left Column: Image Gallery */}
          <div className="space-y-8">
            <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-white dark:bg-zinc-900 group border border-stone-100 dark:border-white/10 shadow-2xl shadow-stone-200/50">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full h-full"
                >
                  <Image
                    fill
                    src={getStrapiMedia(product.images?.[selectedImage]?.url || null) || '/placeholder.png'}
                    alt={product.images?.[selectedImage]?.alternativeText || product.name}
                    className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Product Badges */}
              <div className="absolute top-6 left-6">
                {product.product_category && (
                  <span className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-2xl text-[10px] font-black text-brand-primary border border-brand-secondary/30 shadow-sm uppercase tracking-widest">
                    {product.product_category.Name}
                  </span>
                )}
              </div>

              {/* Discount Badge */}
              {product.discount_percentage && product.discount_percentage > 0 && (
                <div className="absolute top-6 right-6">
                  <span className="bg-brand-primary text-white px-5 py-2 rounded-2xl text-xs font-black shadow-xl shadow-brand-primary/20 animate-pulse">
                    -{product.discount_percentage}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex flex-wrap gap-4 overflow-x-auto pb-4 scrollbar-hide py-2 px-1">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "relative w-28 h-28 rounded-[1.5rem] overflow-hidden flex-shrink-0 border-2 transition-all duration-300",
                      selectedImage === index
                        ? "border-brand-primary shadow-lg shadow-brand-primary/10 scale-105"
                        : "border-stone-100 dark:border-white/10 hover:border-brand-secondary"
                    )}
                  >
                    <Image
                      fill
                      src={getStrapiMedia(image.url) || ''}
                      alt={image.alternativeText || `Imagen ${index + 1}`}
                      className="object-cover p-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Info */}
          <div className="flex flex-col py-4">
            <div className="flex items-center space-x-1.5 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-3 text-xs font-bold text-stone-400 uppercase tracking-widest">(4.8 / 5)</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-stone-900 dark:text-white leading-[1.1] mb-8">
              {product.name}
            </h1>

            <div className="flex flex-col mb-10 p-6 bg-stone-50 dark:bg-zinc-900 rounded-[2rem] border border-stone-100 dark:border-white/5">
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-black text-brand-primary">{formattedPrice}</span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-2xl text-stone-400 line-through font-medium">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0,
                    }).format(product.original_price)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-black">IVA Incluido</span>
                {product.original_price && product.original_price > product.price && (
                  <div className="inline-flex items-center text-[10px] font-black text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
                    Ahorras: {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0,
                    }).format(product.original_price - product.price)}
                  </div>
                )}
              </div>
            </div>

            <div className="prose prose-stone text-stone-600 dark:text-gray-300 mb-12">
              <p className="text-xl leading-[1.7] font-medium">
                {product.description}
              </p>
            </div>

            <div className="space-y-12 pt-10 border-t border-stone-100 dark:border-white/10">
              {/* Quantity Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-10">
                <div>
                  <label className="block text-xs font-black text-stone-900 dark:text-white uppercase tracking-[0.2em] mb-4">
                    Cantidad
                  </label>
                  <div className="inline-flex items-center bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-white/10 rounded-[1.25rem] p-1.5 shadow-inner">
                    <button
                      onClick={decrementQuantity}
                      disabled={product.stock <= 0}
                      className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm rounded-xl transition-all text-stone-500 active:scale-90 disabled:opacity-30"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-14 text-center text-xl font-black text-stone-900 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQuantity}
                      disabled={product.stock <= 0 || quantity >= product.stock}
                      className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm rounded-xl transition-all text-stone-500 active:scale-90 disabled:opacity-30"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      product.stock > 10 ? "bg-emerald-500" : product.stock > 0 ? "bg-amber-500" : "bg-red-500"
                    )} />
                    <span className={cn(
                      "text-xs font-black uppercase tracking-widest",
                      product.stock > 10 ? "text-emerald-700" : product.stock > 0 ? "text-amber-700" : "text-red-700"
                    )}>
                      {product.stock > 0 ? `${product.stock} unidades en stock` : 'Agotado'}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Disponibilidad en tiempo real</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-6">
                <Button
                  onClick={handleAddToCart}
                  disabled={addedToCart || product.stock <= 0}
                  className={cn(
                    "flex-1 h-20 rounded-[1.5rem] text-xl font-black shadow-2xl transition-all overflow-hidden",
                    addedToCart ? "bg-stone-900" : ""
                  )}
                  variant={product.stock <= 0 ? 'secondary' : 'primary'}
                >
                  <AnimatePresence mode="wait">
                    {product.stock <= 0 ? (
                      <motion.div
                        key="soldout"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center"
                      >
                        <AlertCircle className="h-6 w-6 mr-3" />
                        Producto Agotado
                      </motion.div>
                    ) : addedToCart ? (
                      <motion.div
                        key="added"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex items-center"
                      >
                        <CheckCircle2 className="h-6 w-6 mr-3 text-emerald-400" />
                        ¡Agregado con éxito!
                      </motion.div>
                    ) : (
                      <motion.div
                        key="add"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex items-center"
                      >
                        <ShoppingBag className="h-6 w-6 mr-3" />
                        Agregar al Carrito
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>

              {/* Product Benefits */}
              <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="flex items-center p-5 bg-stone-50 dark:bg-zinc-900 rounded-[2rem] border border-stone-100 dark:border-white/5 group hover:border-brand-secondary/30 transition-colors">
                  <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-stone-100 dark:border-white/10 mr-4 shadow-sm group-hover:scale-110 transition-transform">
                    <Truck className="h-6 w-6 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">Envío Rápido</p>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">Todo el país</p>
                  </div>
                </div>
                <div className="flex items-center p-5 bg-stone-50 dark:bg-zinc-900 rounded-[2rem] border border-stone-100 dark:border-white/5 group hover:border-brand-secondary/30 transition-colors">
                  <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-stone-100 dark:border-white/10 mr-4 shadow-sm group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-6 w-6 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">Pago Seguro</p>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">100% Protegido</p>
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
