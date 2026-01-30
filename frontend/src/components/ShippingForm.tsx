'use client';

import { useCart, ShippingAddress } from '@/context/CartContext';
import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, ChevronDown, MapPin } from 'lucide-react';

interface StrapiCity {
  id: number;
  name: string;
  department: string;
}

/**
 * Componente para capturar datos de envío
 */
export default function ShippingForm() {
  const { state, dispatch } = useCart();
  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: state.shippingAddress?.fullName || '',
    address: state.shippingAddress?.address || '',
    city: state.shippingAddress?.city || '',
    department: state.shippingAddress?.department || '',
    phone: state.shippingAddress?.phone || '',
    email: state.shippingAddress?.email || '',
  });

  const [allCities, setAllCities] = useState<StrapiCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  // Cargar ciudades desde Strapi
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/cities`;
        console.log('Fetching cities from:', url);
        const response = await fetch(url);
        const result = await response.json();
        console.log('API Response:', result);
        console.log('Total cities in response:', result.data?.length);

        if (result.data) {
          const cities = result.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            department: item.department
          }));
          console.log('Processed cities:', cities.length);
          console.log('Sample cities:', cities.slice(0, 5));
          setAllCities(cities);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  // Obtener departamentos únicos
  const departments = useMemo(() => {
    const deps = new Set(allCities.map(c => c.department));
    const deptArray = Array.from(deps).sort();
    console.log('Unique departments found:', deptArray.length);
    console.log('Departments:', deptArray);
    return deptArray;
  }, [allCities]);

  // Obtener ciudades filtradas por departamento
  const filteredCities = useMemo(() => {
    if (!formData.department) return [];
    const filtered = allCities
      .filter(c => c.department === formData.department)
      .map(c => c.name)
      .sort();
    console.log(`Cities for ${formData.department}:`, filtered.length);
    return filtered;
  }, [allCities, formData.department]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Requerido';
    if (!formData.address.trim()) newErrors.address = 'Requerido';
    if (!formData.city.trim()) newErrors.city = 'Requerido';
    if (!formData.department.trim()) newErrors.department = 'Requerido';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Requerido';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Formato inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof ShippingAddress, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Si cambia el departamento, resetear la ciudad
      if (field === 'department') {
        newData.city = '';
      }
      return newData;
    });

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
        {/* Nombre Completo */}
        <div>
          <label htmlFor="fullName" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
            Nombre Completo
          </label>
          <input
            type="text"
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className={`w-full bg-gray-50 dark:bg-zinc-800 px-4 py-3 rounded-xl border transition-all text-sm font-medium focus:ring-2 focus:ring-pink-500/20 outline-none ${errors.fullName ? 'border-red-500 bg-red-50/30' : 'border-gray-200 dark:border-white/10 focus:border-pink-500'
              }`}
            placeholder="Ej: Juan Pérez"
          />
          {errors.fullName && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.fullName}</p>}
        </div>

        {/* Ubicación: Departamento y Ciudad */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="department" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              Departamento
            </label>
            <div className="relative">
              <select
                id="department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className={`w-full appearance-none bg-gray-50 dark:bg-zinc-800 px-4 py-3 rounded-xl border transition-all text-sm font-medium focus:ring-2 focus:ring-pink-500/20 outline-none ${errors.department ? 'border-red-500 bg-red-50/30' : 'border-gray-200 dark:border-white/10 focus:border-pink-500'
                  }`}
              >
                <option value="">Seleccionar...</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.department && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.department}</p>}
          </div>

          <div>
            <label htmlFor="city" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              Ciudad
            </label>
            <div className="relative">
              <select
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                disabled={!formData.department || loading}
                className={`w-full appearance-none bg-gray-50 dark:bg-zinc-800 px-4 py-3 rounded-xl border transition-all text-sm font-medium focus:ring-2 focus:ring-pink-500/20 outline-none ${errors.city ? 'border-red-500 bg-red-50/30' : 'border-gray-200 dark:border-white/10 focus:border-pink-500'
                  } ${!formData.department ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="">{loading ? 'Cargando...' : 'Seleccionar...'}</option>
                {filteredCities.map((cityName) => (
                  <option key={cityName} value={cityName}>{cityName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.city && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.city}</p>}
          </div>
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="phone" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
            Teléfono
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={`w-full bg-gray-50 dark:bg-zinc-800 px-4 py-3 rounded-xl border transition-all text-sm font-medium focus:ring-2 focus:ring-pink-500/20 outline-none ${errors.phone ? 'border-red-500 bg-red-50/30' : 'border-gray-200 dark:border-white/10 focus:border-pink-500'
              }`}
            placeholder="300 123 4567"
          />
          {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.phone}</p>}
        </div>

        {/* Dirección */}
        <div>
          <label htmlFor="address" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
            Dirección de entrega
          </label>
          <div className="relative">
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={`w-full bg-gray-50 dark:bg-zinc-800 px-4 py-3 rounded-xl border transition-all text-sm font-medium focus:ring-2 focus:ring-pink-500/20 outline-none ${errors.address ? 'border-red-500 bg-red-50/30' : 'border-gray-200 dark:border-white/10 focus:border-pink-500'
                }`}
              placeholder="Ej: Calle 123 #45-67 apto 101"
            />
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {errors.address && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.address}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
            Email <span className="lowercase font-medium opacity-50">(opcional)</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full bg-gray-50 dark:bg-zinc-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
            placeholder="juan@ejemplo.com"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-pink-600 text-white py-4 px-6 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-pink-100 dark:shadow-none hover:bg-pink-700 mt-2"
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


