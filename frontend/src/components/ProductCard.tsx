'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ShoppingBag, Plus } from 'lucide-react';
import { Product, SourcingType } from '@/types/product';

interface ProductCardProps {
  product: Product;
  onQuickAdd?: (productId: string | number, variantId: string) => void;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const getOriginBadge = (sourcingType: SourcingType) => {
  if (sourcingType === 'local') {
    return {
      text: '📦 Envío Exprés Local',
      bgColor: 'bg-badge-local-bg',
      textColor: 'text-badge-local-text',
    };
  }
  return {
    text: '🌿 Dropshipping Nacional',
    bgColor: 'bg-badge-dropship-bg',
    textColor: 'text-badge-dropship-text',
  };
};

export default function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const badge = getOriginBadge(product.sourcingType);
  const defaultVariant = product.variants.find(
    (v) => v.id === product.defaultVariantId
  ) || product.variants[0];
  const price = product.priceCOP || defaultVariant?.priceCOP || 0;
  const comparePrice = product.compareAtPriceCOP || defaultVariant?.compareAtPriceCOP;
  const image = product.thumbnail || product.images[0];

  const handleQuickAdd = () => {
    if (onQuickAdd && defaultVariant) {
      setIsAdding(true);
      onQuickAdd(product.id, defaultVariant.id);
      
      setTimeout(() => {
        setIsAdding(false);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }, 500);
    }
  };

  return (
    <div className="group relative bg-surface-card rounded-lg overflow-hidden border border-border-subtle hover:border-border-strong transition-colors duration-200">
      {/* Image Container - 1:1 Aspect Ratio */}
      <div className="relative aspect-square w-full overflow-hidden bg-surface-muted">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-subtle">
            <ShoppingBag className="w-12 h-12" />
          </div>
        )}

        {/* Origin Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${badge.bgColor} ${badge.textColor}`}
          >
            {badge.text}
          </span>
        </div>

        {/* Sale Badge */}
        {product.isOnSale && comparePrice && comparePrice > price && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-white">
              Oferta
&apos;
            </span>
          </div>
        )}

        {/* Quick Add Button - Touch Target >= 48px */}
        <button
          onClick={handleQuickAdd}
          disabled={isAdding || added}
          className="absolute bottom-3 right-3 touch-target bg-primary hover:bg-primary-hover text-white rounded-full shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Añadir ${product.name} al carrito`}
        >
          {added ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : isAdding ? (
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Brand */}
        <p className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-1">
          {product.brand}
        </p>

        {/* Product Name */}
        <h3 className="font-heading text-base font-semibold text-text-main mb-2 line-clamp-2 min-h-[3.5rem]">
          {product.name}
        </h3>

        {/* Shade Swatch Preview Strip */}
        {defaultVariant?.shades && defaultVariant.shades.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            {defaultVariant.shades.slice(0, 4).map((shade) => (
              <div
                key={shade.id}
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: shade.hexCode }}
                title={shade.name}
                aria-label={`Tono ${shade.name}`}
              />
            ))}
            {defaultVariant.shades.length > 4 && (
              <span className="text-xs text-text-subtle">
                +{defaultVariant.shades.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-text-main">
            {formatPrice(price)}
          </span>
          {comparePrice && comparePrice > price && (
            <span className="text-sm text-text-muted line-through">
              {formatPrice(comparePrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
