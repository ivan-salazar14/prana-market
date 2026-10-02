'use client';

import { Shade } from '@/types/product';

interface ShadeSelectorProps {
  shades: Shade[];
  selectedShade: Shade | null;
  onShadeSelect: (shade: Shade) => void;
  disabled?: boolean;
}

export default function ShadeSelector({
  shades,
  selectedShade,
  onShadeSelect,
  disabled = false,
}: ShadeSelectorProps) {
  if (!shades || shades.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-text-main">
        Tonos Disponibles
      </label>
      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Seleccionar tono">
        {shades.map((shade) => {
          const isSelected = selectedShade?.id === shade.id;
          return (
            <button
              key={shade.id}
              onClick={() => !disabled && onShadeSelect(shade)}
              disabled={disabled}
              className={`
                relative w-12 h-12 rounded-full border-2 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-gray-300 hover:border-gray-400'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{ backgroundColor: shade.hexCode }}
              title={shade.name}
              aria-label={`Tono ${shade.name}${isSelected ? ', seleccionado' : ''}`}
              aria-checked={isSelected}
            >
              {isSelected && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white drop-shadow-md"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
      {selectedShade && (
        <p className="text-sm text-text-muted" aria-live="polite">
          Tono seleccionado: <span className="font-medium text-text-main">{selectedShade.name}</span>
        </p>
      )}
    </div>
  );
}
