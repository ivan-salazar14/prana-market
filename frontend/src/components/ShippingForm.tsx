'use client';

import { useCart, ShippingAddress } from '@/context/CartContext';
import { useState } from 'react';

import { CheckCircle2 } from 'lucide-react';

/**
 * Componente para capturar datos de envío
 */
export default function ShippingForm() {
  const { state, dispatch } = useCart();
  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: state.shippingAddress?.fullName || '',
    address: state.shippingAddress?.address || '',
    city: state.shippingAddress?.city || '',
    phone: state.shippingAddress?.phone || '',
    email: state.shippingAddress?.email || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Requerido';
    if (!formData.address.trim()) newErrors.address = 'Requerido';
    if (!formData.city.trim()) newErrors.city = 'Requerido';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Requerido';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Formato inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof ShippingAddress, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = () => {
    if (validateForm()) {
      dispatch({ type: 'SET_SHIPPING_ADDRESS', payload: formData });
    }
  };

  return (
    <div className="shipping-form space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="fullName" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
            Nombre Completo
          </label>
          <input
            type="text"
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className={`w-full bg-gray-50 dark:bg-zinc-800 px-4 py-3 rounded-xl border transition-all text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none ${errors.fullName ? 'border-red-500 bg-red-50/30' : 'border-gray-200 dark:border-white/10 focus:border-emerald-500'
              }`}
            placeholder="Ej: Juan Pérez"
          />
          {errors.fullName && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.fullName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              Ciudad
            </label>
            <input
              type="text"
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className={`w-full bg-gray-50 dark:bg-zinc-800 px-4 py-3 rounded-xl border transition-all text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none ${errors.city ? 'border-red-500 bg-red-50/30' : 'border-gray-200 dark:border-white/10 focus:border-emerald-500'
                }`}
              placeholder="Ej: Bogotá"
            />
            {errors.city && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.city}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`w-full bg-gray-50 dark:bg-zinc-800 px-4 py-3 rounded-xl border transition-all text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none ${errors.phone ? 'border-red-500 bg-red-50/30' : 'border-gray-200 dark:border-white/10 focus:border-emerald-500'
                }`}
              placeholder="300 123 4567"
            />
            {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.phone}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
            Dirección de entrega
          </label>
          <input
            type="text"
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className={`w-full bg-gray-50 dark:bg-zinc-800 px-4 py-3 rounded-xl border transition-all text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none ${errors.address ? 'border-red-500 bg-red-50/30' : 'border-gray-200 dark:border-white/10 focus:border-emerald-500'
              }`}
            placeholder="Ej: Calle 123 #45-67 apto 101"
          />
          {errors.address && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.address}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
            Email <span className="lowercase font-medium opacity-50">(opcional)</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full bg-gray-50 dark:bg-zinc-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            placeholder="juan@ejemplo.com"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-emerald-600 text-white py-4 px-6 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-emerald-100 dark:shadow-none hover:bg-emerald-700"
      >
        Guardar Dirección
      </button>

      {state.shippingAddress && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3 flex items-center justify-center animate-in zoom-in duration-300">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            ¡Dirección guardada con éxito!
          </span>
        </div>
      )}
    </div>
  );
}

