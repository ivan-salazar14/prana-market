'use client';

import Image from 'next/image';
import { ShoppingBag, Zap } from 'lucide-react';
import { Shade } from '@/types/product';

interface PdpStickyBarProps {
  visible: boolean;
  selectedShade?: Shade | null;
  productImage?: string;
  productName?: string;
  priceCOP?: number;
  onAddToCart?: () => void;
  onNequiCheckout?: () => void;
  inStock?: boolean;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export default function PdpStickyBar({
  visible,
  selectedShade,
  productImage,
  productName,
  priceCOP = 0,
  onAddToCart,
  onNequiCheckout,
  inStock = true,
}: PdpStickyBarProps) {
  if (!visible) return null;

  const shadeImage = selectedShade?.image || productImage;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-border-subtle shadow-2xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Shade/Product Thumbnail */}
          {shadeImage && (
            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-border-subtle">
              <Image
                src={shadeImage}
                alt={selectedShade?.name || productName || 'Producto'}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          )}

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-main truncate">
              {selectedShade?.name ? selectedShade.name : productName}
            </p>
            <p className="text-lg font-bold text-primary">{formatPrice(priceCOP)}</p>
          </div>

          {/* Dual CTAs */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onAddToCart}
              disabled={!inStock}
              className="touch-target px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Añadir al carrito"
            >
              <ShoppingBag className="w-5 h-5" />
            </button>
            <button
              onClick={onNequiCheckout}
              disabled={!inStock}
              className="touch-target px-4 py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                backgroundColor: '#20002C',
                color: '#FF2A82',
              }}
              aria-label="Pagar con Nequi"
            >
              <Zap className="w-5 h-5" />
              <span className="hidden sm:inline">Nequi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
