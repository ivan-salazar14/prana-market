export type SkinType = 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive';
export type Finish = 'matte' | 'glow' | 'satin' | 'natural' | 'shimmer';

export interface FilterState {
  searchQuery: string;
  brands: string[];
  skinTypes: SkinType[];
  finishes: Finish[];
  priceRange: {
    min: number;
    max: number;
  };
  inStockOnly: boolean;
}

export interface FilterOptions {
  brands: string[];
  skinTypes: SkinType[];
  finishes: Finish[];
  minPrice: number;
  maxPrice: number;
}

export const INITIAL_FILTER_STATE: FilterState = {
  searchQuery: '',
  brands: [],
  skinTypes: [],
  finishes: [],
  priceRange: {
    min: 0,
    max: 500000, // Default max price in COP
  },
  inStockOnly: false,
};

export const SKIN_TYPE_LABELS: Record<SkinType, string> = {
  normal: 'Normal',
  dry: 'Seca',
  oily: 'Grasa',
  combination: 'Mixta',
  sensitive: 'Sensible',
};

export const FINISH_LABELS: Record<Finish, string> = {
  matte: 'Mate',
  glow: 'Brillo',
  satin: 'Satinado',
  natural: 'Natural',
  shimmer: 'Destellado',
};
