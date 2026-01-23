'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  images?: Array<{
    url: string;
    alternativeText?: string;
  }>;
  product_category?: ProductCategory;
}

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { dispatch } = useCart();

  useEffect(() => {
    // Fetch product
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching product:', err);
        setLoading(false);
      });
  }, [id]);

  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Product not found</p>
          <Link href="/" className="text-green-600 hover:text-green-800 mt-4 inline-block">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="text-green-600 hover:text-green-800 mb-6 inline-block">
          ← Back to products
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:flex">
            {/* Images */}
            <div className="md:w-1/2">
              {product.images && product.images.length > 0 ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4">
                    {product.images.map((image, index) => (
                      <div key={index} className="relative w-full h-96">
                        <Image
                          fill
                          src={getStrapiMedia(image.url) || ''}
                          alt={image.alternativeText || product.name}
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-96 bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">No image available</p>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="md:w-1/2 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {product.product_category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4">
                  {product.product_category.Name}
                </span>
              )}

              <p className="text-gray-600 text-lg mb-6 leading-relaxed">{product.description}</p>

              <div className="flex items-center justify-between mb-6">
                <span className="text-4xl font-bold text-green-600">COP {product.price}</span>
              </div>

              <button
                onClick={() => addToCart(product)}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}