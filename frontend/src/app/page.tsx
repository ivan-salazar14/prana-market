'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import CategorySlider from '@/components/CategorySlider';
import PromoSlider from '@/components/PromoSlider';
import StructuredData from '@/components/StructuredData';
import { useCart } from '@/context/CartContext';
import { getStrapiMedia } from '@/utils/strapi';
import { cn } from '@/utils/cn';
import { generateOrganizationJsonLd, generateWebsiteJsonLd } from '@/utils/structured-data';


interface ProductCategory {
  id: number;
  documentId: string;
  Name: string;
  slug: string;
  Description: string;
  Image?: {
    url: string;
    alternativeText?: string;
  };
  category?: {
    id: number;
    documentId: string;
    Name: string;
    slug: string;
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
  documentId: string;
  images?: Array<{
    url: string;
    alternativeText?: string;
  }>;
  product_category?: ProductCategory;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [homeData, setHomeData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopCategory, setSelectedTopCategory] = useState<string | null>(null);
  const { dispatch, state } = useCart();

  useEffect(() => {
    fetch('/api/home')
      .then(res => res.json())
      .then(data => {
        setHomeData(data.data || null);
      })
      .catch(err => console.error('Error fetching home data:', err));

    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.data || []);
      })
      .catch(err => console.error('Error fetching products:', err));

    fetch('/api/product-categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data.data || []);
      })
      .catch(err => console.error('Error fetching categories:', err));

    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setTopCategories(data.data || []);
      })
      .catch(err => console.error('Error fetching top categories:', err));
  }, []);

  const selectedTopCategoryObj = topCategories.find(c => c.documentId === selectedTopCategory || c.id === (selectedTopCategory as any));
  const subcategoryIds = selectedTopCategoryObj?.product_categories?.map((sc: any) => sc.documentId) || [];

  const filteredCategories = selectedTopCategory
    ? selectedTopCategoryObj?.product_categories || []
    : categories;

  const filteredProducts = selectedCategory
    ? products.filter(product => product.product_category?.documentId === selectedCategory || product.product_category?.id === (selectedCategory as any))
    : selectedTopCategory
      ? products.filter(product => {
        const productSubcatId = product.product_category?.documentId;
        return subcategoryIds.includes(productSubcatId);
      })
      : products;

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Este producto está agotado.');
      return;
    }

    const existingInCart = state.items.find(item => item.id === product.id);
    const currentQty = existingInCart?.quantity || 0;

    if (currentQty + 1 > product.stock) {
      alert(`Solo quedan ${product.stock} unidades de este producto.`);
      return;
    }

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        ...product,
        image: product.images?.[0]?.url
      }
    });
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData
        data={[
          generateOrganizationJsonLd(),
          generateWebsiteJsonLd()
        ]}
      />

      <div className="min-h-screen bg-[#fff5f7] dark:bg-zinc-950">
        <div className="container mx-auto px-4 py-8 md:py-12">

          {/* Promotional Slider */}
          {homeData?.Slider && homeData.Slider.length > 0 && (
            <div className="mb-12">
              <PromoSlider items={homeData.Slider} />
            </div>
          )}

          {/* hierarchy Section: Top Level Categories Slider */}
          {topCategories.length > 0 ? (
            <div className="mb-8">
              <CategorySlider
                categories={topCategories}
                selectedCategory={selectedTopCategory}
                onSelectCategory={(id) => {
                  const category = topCategories.find(c => c.id === id || c.documentId === id);
                  setSelectedTopCategory(category?.documentId || null);
                  setSelectedCategory(null);
                }}
              />
            </div>
          ) : (
            /* Fallback: if no top-level categories yet, show product categories in the slider like before */
            <div className="mb-8">
              <CategorySlider
                categories={categories}
                selectedCategory={selectedCategory as any}
                onSelectCategory={(id) => setSelectedCategory(id as any)}
              />
            </div>
          )}

          {/* Sub-categories Section (Product Categories) - Only show if we have top categories to filter by */}
          {topCategories.length > 0 && filteredCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-zinc-800 to-transparent" />
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-4">
                  {selectedTopCategory ? 'Subcategorías' : 'Todas las Subcategorías'}
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-zinc-800 to-transparent" />
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 border-2",
                    !selectedCategory
                      ? "bg-black border-black text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/20"
                      : "bg-white dark:bg-zinc-900 border-gray-100 dark:border-white/5 text-gray-500 hover:border-pink-200 dark:hover:border-pink-900/30"
                  )}
                >
                  Todas
                </button>
                {filteredCategories.map((subcat: ProductCategory) => (
                  <button
                    key={subcat.id}
                    onClick={() => setSelectedCategory(subcat.documentId)}
                    className={cn(
                      "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 border-2",
                      selectedCategory === subcat.documentId || selectedCategory === subcat.id.toString()
                        ? "bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/20 text-pink-50"
                        : "bg-white dark:bg-zinc-900 border-gray-100 dark:border-white/5 text-gray-500 hover:border-pink-200 dark:hover:border-pink-900/30"
                    )}
                  >
                    {subcat.Name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Products Section */}
          <div className="space-y-10">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {selectedCategory
                      ? `Productos en ${categories.find(c => c.documentId === selectedCategory || c.id === (selectedCategory as any))?.Name}`
                      : selectedTopCategory
                        ? `Todo en ${topCategories.find(c => c.documentId === selectedTopCategory || c.id === (selectedTopCategory as any))?.Name}`
                        : "Explora Nuestra Colección"
                    }
                  </h2>
                  <p className="text-gray-500 font-medium">Belleza, salud y bienestar en cada detalle</p>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No products available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden hover:shadow-xl hover:shadow-pink-900/5 transition-all duration-500"
                    >
                      {product.images?.[0] && (
                        <div className="h-64 overflow-hidden relative">
                          <Link href={`/product/${product.documentId}`}>
                            <Image
                              fill
                              src={getStrapiMedia(product.images[0].url) || ''}
                              alt={product.images[0].alternativeText || product.name}
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          </Link>
                          {product.product_category && (
                            <div className="absolute top-4 left-4 flex flex-col gap-1">
                              {/* Top Category Badge */}
                              {(product.product_category as any).category && (
                                <span className="bg-black/90 backdrop-blur px-3 py-0.5 rounded-full text-[9px] font-black text-white shadow-sm uppercase tracking-widest w-fit">
                                  {(product.product_category as any).category.Name}
                                </span>
                              )}
                              {/* Subcategory Badge */}
                              <span className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-pink-700 dark:text-pink-400 border border-pink-100 dark:border-pink-900/50 shadow-sm uppercase tracking-wider w-fit">
                                {product.product_category?.Name}
                              </span>
                            </div>
                          )}

                          {/* Discount Badge */}
                          {product.discount_percentage && product.discount_percentage > 0 && (
                            <div className="absolute top-4 right-4">
                              <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg shadow-pink-200 animate-pulse">
                                -{product.discount_percentage}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-8">
                        <div className="flex flex-col mb-4">
                          <Link href={`/product/${product.documentId}`}>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-pink-600 transition-colors mb-2 line-clamp-1">
                              {product.name}
                            </h3>
                          </Link>
                          <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed h-10">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <div className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-pink-600">
                                {new Intl.NumberFormat('es-CO', {
                                  style: 'currency',
                                  currency: 'COP',
                                  maximumFractionDigits: 0,
                                }).format(product.price)}
                              </span>
                              {product.original_price && product.original_price > product.price && (
                                <span className="text-sm text-gray-400 line-through">
                                  {new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    maximumFractionDigits: 0,
                                  }).format(product.original_price)}
                                </span>
                              )}
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-tight mt-0.5",
                              product.stock > 10 ? "text-emerald-500" : product.stock > 0 ? "text-amber-500" : "text-red-500"
                            )}>
                              {product.stock > 0 ? `${product.stock} disponibles` : "Agotado"}
                            </span>
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock <= 0}
                            className={cn(
                              "p-3 rounded-2xl transition-all shadow-lg active:scale-95",
                              product.stock <= 0
                                ? "bg-gray-100 text-gray-300 shadow-none cursor-not-allowed"
                                : "bg-black text-white hover:bg-gray-900 shadow-pink-100"
                            )}
                            title={product.stock > 0 ? "Añadir al carrito" : "Producto agotado"}
                          >
                            {product.stock > 0 ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
