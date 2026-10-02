export type SourcingType = 'local' | 'mastershop_dropship';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Shade {
  id: string;
  name: string;
  hexCode: string;
  image?: string;
}

export interface Variant {
  id: string;
  sku: string;
  name: string;
  priceCOP: number;
  compareAtPriceCOP?: number;
  shades?: Shade[];
  stockStatus: StockStatus;
  stockQuantity?: number;
  mastershopId?: string;
  supplierSku?: string;
}

export interface Product {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  brand: string;
  category: string;
  subcategory?: string;
  sourcingType: SourcingType;
  images: string[];
  thumbnail?: string;
  variants: Variant[];
  defaultVariantId?: string;
  priceCOP: number;
  compareAtPriceCOP?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  tags?: string[];
  ingredients?: string;
  usageGuide?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCardProps {
  product: Product;
  onQuickAdd?: (productId: string | number, variantId: string) => void;
}

export interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}
