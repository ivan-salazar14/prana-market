'use client';

import { motion } from 'framer-motion';
import { Truck, Gift } from 'lucide-react';

interface FreeShippingProgressProps {
  subtotal: number;
  threshold?: number;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export default function FreeShippingProgress({ subtotal, threshold = 100000 }: FreeShippingProgressProps) {
  const progress = Math.min((subtotal / threshold) * 100, 100);
  const remaining = Math.max(threshold - subtotal, 0);
  const isFreeShipping = subtotal >= threshold;

  return (
    <div className="p-5 bg-gradient-to-r from-[#FDF9F7] to-[#FCE7ED] rounded-[2rem] border border-[#C89D66]/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isFreeShipping ? (
            <Gift className="w-5 h-5 text-[#D45B7A]" />
          ) : (
            <Truck className="w-5 h-5 text-[#C89D66]" />
          )}
          <span className="text-sm font-bold text-[#2D1B22]">
            {isFreeShipping
              ? '🎉 ¡Felicidades! Tienes Envío Gratis a toda Colombia'
              : `¡Faltan ${formatPrice(remaining)} para tu Envío Gratis!`
          }
          </span>
        </div>
        <span className="text-xs font-semibold text-[#2D1B22]/60">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[#C89D66] to-[#D45B7A]"
          style={{
            background: isFreeShipping
              ? 'linear-gradient(90deg, #C89D66 0%, #D45B7A 100%)'
              : 'linear-gradient(90deg, #C89D66 0%, #D45B7A 100%)',
          }}
        />
      </div>

      {!isFreeShipping && (
        <p className="text-xs text-[#2D1B22]/60 mt-2 font-medium">
          Agrega más productos y disfruta de envío gratis a todo el país
        </p>
      )}
    </div>
  );
}
