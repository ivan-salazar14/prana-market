'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal } from 'lucide-react';
import { FilterState, SkinType, Finish, SKIN_TYPE_LABELS, FINISH_LABELS } from '@/types/filter';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableBrands: string[];
  availableSkinTypes: SkinType[];
  availableFinishes: Finish[];
}

export default function FilterDrawer({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableBrands,
  availableSkinTypes,
  availableFinishes,
}: FilterDrawerProps) {
  const toggleBrand = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    onFiltersChange({ ...filters, brands: newBrands });
  };

  const toggleSkinType = (skinType: SkinType) => {
    const newSkinTypes = filters.skinTypes.includes(skinType)
      ? filters.skinTypes.filter((s) => s !== skinType)
      : [...filters.skinTypes, skinType];
    onFiltersChange({ ...filters, skinTypes: newSkinTypes });
  };

  const toggleFinish = (finish: Finish) => {
    const newFinishes = filters.finishes.includes(finish)
      ? filters.finishes.filter((f) => f !== finish)
      : [...filters.finishes, finish];
    onFiltersChange({ ...filters, finishes: newFinishes });
  };

  const handlePriceChange = (field: 'min' | 'max', value: string) => {
    const numValue = parseInt(value.replace(/\D/g, '')) || 0;
    onFiltersChange({
      ...filters,
      priceRange: {
        ...filters.priceRange,
        [field]: numValue,
      },
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchQuery: filters.searchQuery,
      brands: [],
      skinTypes: [],
      finishes: [],
      priceRange: { min: 0, max: 500000 },
      inStockOnly: false,
    });
  };

  const activeFilterCount =
    filters.brands.length +
    filters.skinTypes.length +
    filters.finishes.length +
    (filters.priceRange.min > 0 ? 1 : 0) +
    (filters.priceRange.max < 500000 ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-surface-card z-50 shadow-2xl overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-text-main">Filtros</h2>
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="touch-target p-2 hover:bg-surface-muted rounded-full transition-colors"
                  aria-label="Cerrar filtros"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Clear All */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="w-full mb-6 py-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                >
                  Limpiar todos los filtros
                </button>
              )}

              {/* Brands */}
              {availableBrands.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-text-main mb-3">Marca</h3>
                  <div className="space-y-2">
                    {availableBrands.map((brand) => (
                      <label
                        key={brand}
                        className="flex items-center gap-3 cursor-pointer touch-target"
                      >
                        <input
                          type="checkbox"
                          checked={filters.brands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-text-main">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Skin Types */}
              {availableSkinTypes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-text-main mb-3">Tipo de Piel</h3>
                  <div className="space-y-2">
                    {availableSkinTypes.map((skinType) => (
                      <label
                        key={skinType}
                        className="flex items-center gap-3 cursor-pointer touch-target"
                      >
                        <input
                          type="checkbox"
                          checked={filters.skinTypes.includes(skinType)}
                          onChange={() => toggleSkinType(skinType)}
                          className="w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-text-main">
                          {SKIN_TYPE_LABELS[skinType]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Finishes */}
              {availableFinishes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-text-main mb-3">Acabado</h3>
                  <div className="space-y-2">
                    {availableFinishes.map((finish) => (
                      <label
                        key={finish}
                        className="flex items-center gap-3 cursor-pointer touch-target"
                      >
                        <input
                          type="checkbox"
                          checked={filters.finishes.includes(finish)}
                          onChange={() => toggleFinish(finish)}
                          className="w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-text-main">
                          {FINISH_LABELS[finish]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-text-main mb-3">Rango de Precio (COP)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Mínimo</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={filters.priceRange.min > 0 ? filters.priceRange.min.toLocaleString('es-CO') : ''}
                      onChange={(e) => handlePriceChange('min', e.target.value)}
                      placeholder="$0"
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Máximo</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={filters.priceRange.max < 500000 ? filters.priceRange.max.toLocaleString('es-CO') : ''}
                      onChange={(e) => handlePriceChange('max', e.target.value)}
                      placeholder="$500.000"
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* In Stock Only */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer touch-target">
                  <input
                    type="checkbox"
                    checked={filters.inStockOnly}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, inStockOnly: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-main">Solo productos en stock</span>
                </label>
              </div>

              {/* Apply Button */}
              <button
                onClick={onClose}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors touch-target"
              >
                Aplicar Filtros
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
