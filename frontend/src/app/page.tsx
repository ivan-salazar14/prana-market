'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import CategorySlider from '@/components/CategorySlider';
import { useCart } from '@/context/CartContext';
import { getStrapiMedia } from '@/utils/strapi';

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
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { dispatch } = useCart();

  useEffect(() => {

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
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter(product => product.product_category?.id === selectedCategory)
    : products;

  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-12 md:py-16">

        {/* Categories Slider Section */}
        {categories.length > 0 && (
          <CategorySlider
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}

        {/* Products Section */}
        <div className="space-y-10">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {selectedCategory
                    ? `Productos en ${categories.find(c => c.id === selectedCategory)?.Name}`
                    : "Descubre nuestra selección"
                  }
                </h2>
                <p className="text-gray-500 font-medium">Calidad y consciencia en cada detalle</p>
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
                    className="group bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500"
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
                          <div className="absolute top-4 left-4">
                            <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-emerald-700 border border-emerald-100 shadow-sm uppercase tracking-wider">
                              {product.product_category.Name}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-8">
                      <div className="flex flex-col mb-4">
                        <Link href={`/product/${product.documentId}`}>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-2 line-clamp-1">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed h-10">
                          {product.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <span className="text-2xl font-black text-emerald-600">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            maximumFractionDigits: 0,
                          }).format(product.price)}
                        </span>
                        <button
                          onClick={() => addToCart(product)}
                          className="p-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-90"
                          title="Añadir al carrito"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
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
  );
}
