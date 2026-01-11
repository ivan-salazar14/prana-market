'use client';

import { useCart, ShippingAddress } from '@/context/CartContext';
import { useState } from 'react';

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

  /**
   * Valida los campos del formulario
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'El teléfono debe contener solo números y caracteres válidos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Maneja el cambio en los campos del formulario
   */
  const handleChange = (field: keyof ShippingAddress, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Guarda los datos de envío en el contexto
   */
  const handleSave = () => {
    if (validateForm()) {
      dispatch({ type: 'SET_SHIPPING_ADDRESS', payload: formData });
    }
  };

  return (
    <div className="shipping-form mt-6 pt-4 border-t border-gray-200">
      <h4 className="font-semibold mb-3 text-gray-900">Datos de envío:</h4>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Juan Pérez"
          />
          {errors.fullName && (
            <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Dirección <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Calle 123 #45-67"
          />
          {errors.address && (
            <p className="text-red-500 text-xs mt-1">{errors.address}</p>
          )}
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            Ciudad <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="city"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Bogotá"
          />
          {errors.city && (
            <p className="text-red-500 text-xs mt-1">{errors.city}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="3001234567"
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email (opcional)
          </label>
          <input
            type="email"
            id="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
        >
          Guardar datos de envío
        </button>

        {state.shippingAddress && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✓ Datos de envío guardados correctamente
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

