'use client';

import { useEffect, useState } from 'react';
import Checkout from '@/components/Checkout';

interface Product {
  id: number;
  attributes: {
    name: string;
    price: number;
    // Add other fields as needed
  };
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data.data || []))
      .catch(err => console.error('Error fetching products:', err));
  }, []);

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  const total = cart.reduce((sum, item) => sum + item.attributes.price, 0);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prana Market</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <h2 className="text-xl mb-2">Products</h2>
          {products.map(product => (
            <div key={product.id} className="border p-4 mb-2 rounded">
              <h3 className="font-semibold">{product.attributes.name}</h3>
              <p>${product.attributes.price}</p>
              <button
                onClick={() => addToCart(product)}
                className="bg-green-500 text-white p-2 rounded mt-2"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
        <div>
          <h2 className="text-xl mb-2">Cart</h2>
          {cart.map((item, index) => (
            <div key={index} className="border p-2 mb-1 rounded">
              {item.attributes.name} - ${item.attributes.price}
            </div>
          ))}
          <p className="font-bold">Total: ${total}</p>
          {total > 0 && <Checkout amount={total} />}
        </div>
      </div>
    </div>
  );
}
