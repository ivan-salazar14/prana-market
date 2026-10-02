'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Tag, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CouponInput() {
  const { state, dispatch } = useCart();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedCode) {
      setError('Por favor ingresa un código de cupón');
      return;
    }

    if (state.coupon && state.coupon.code.toUpperCase() === trimmedCode) {
      setError('Código ya aplicado');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmedCode }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || 'Código inválido');
        return;
      }

      dispatch({ type: 'APPLY_COUPON', payload: data.coupon });
      setSuccessMessage(`¡Cupón ${data.coupon.code} aplicado con éxito!`);
      setCode('');
    } catch (err) {
      console.error('Error validation coupon:', err);
      setError('Error al validar el cupón. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    dispatch({ type: 'REMOVE_COUPON' });
    setSuccessMessage(null);
    setError(null);
  };

  return (
    <div className="coupon-input-container space-y-3">
      <div className="flex items-center space-x-2 px-1">
        <Tag className="w-4 h-4 text-brand-primary" />
        <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
          ¿Tienes un cupón de descuento?
        </span>
      </div>

      {state.coupon ? (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-primary/5 border border-brand-primary/20 rounded-[1.5rem] p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-brand-primary/10 p-2 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">
                  {state.coupon.code}
                </span>
                <span className="text-[10px] font-extrabold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  {state.coupon.type === 'percentage'
                    ? `-${state.coupon.value}%`
                    : state.coupon.type === 'fixed'
                    ? `-COP ${state.coupon.value.toLocaleString('es-CO')}`
                    : 'Envío Gratis'}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 font-medium mt-0.5">
                {state.coupon.description}
              </p>
            </div>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-200/50 text-stone-400 hover:text-stone-700 transition-colors"
            title="Quitar cupón"
            aria-label="Quitar cupón"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleApplyCoupon} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ingresa tu código (ej. BIENVENIDA10)"
              disabled={loading}
              className="flex-1 h-12 px-4 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-white/10 rounded-2xl text-xs font-black text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 uppercase tracking-wider"
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="h-12 px-5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[90px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                'Aplicar'
              )}
            </button>
          </div>
        </form>
      )}

      {/* Error & Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {successMessage && !state.coupon && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs font-medium"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
