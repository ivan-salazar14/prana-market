'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Checkout from '@/components/Checkout';
import CategoryCard from '@/components/CategoryCard';

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
  const [cart, setCart] = useState<Product[]>([]);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Fetch products
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched products:', data.data);
        setProducts(data.data || []);
      })
      .catch(err => console.error('Error fetching products:', err));

    // Fetch categories
    fetch('/api/product-categories')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched categories:', data.data);
        setCategories(data.data || []);
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter(product => product.product_category?.id === selectedCategory)
    : products;

  useEffect(() => {
    console.log('Selected category:', selectedCategory);
    console.log('Filtered products:', filteredProducts);
  }, [selectedCategory, filteredProducts]);

  const addToCart = (product: Product) => {
    const newCart = [...cart, product];
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">

        {/* Categories Section */}
        {categories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {categories.map(category => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onViewProducts={() => setSelectedCategory(category.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Products Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Products</h2>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-green-600 hover:text-green-800 font-medium"
                >
                  Show All Products
                </button>
              )}
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    {product.images?.[0] && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={`${process.env.NEXT_PUBLIC_STRAPI_API_URL}${product.images[0].url}`}
                          alt={product.images[0].alternativeText || product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <Link href={`/product/${product.documentId}`}>
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-green-600 cursor-pointer">{product.name}</h3>
                        </Link>
                        {product.product_category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {product.product_category.Name}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-green-600">${product.price}</span>
                        <button
                          onClick={() => addToCart(product)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Shopping Cart</h2>

              {cart.length === 0 ? (
                <p className="text-gray-500">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cart.map((item, index) => (
                      <div key={index} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">${item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-lg font-bold text-green-600">${total}</span>
                    </div>

                    <Checkout amount={total} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
