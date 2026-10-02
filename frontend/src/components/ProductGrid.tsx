'use client';

import { Product } from '@/types/product';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-muted rounded-lg overflow-hidden animate-pulse"
          >
            <div className="aspect-square w-full bg-surface-muted" />
            <div className="p-4 space-y-3">
              <div className="h-3 bg-surface-muted rounded w-3/4" />
              <div className="h-4 bg-surface-muted rounded w-full" />
              <div className="h-4 bg-surface-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-lg">No se encontraron productos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
