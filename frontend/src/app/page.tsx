'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus, X, Package, SlidersHorizontal } from 'lucide-react';
import CategorySlider from '@/components/CategorySlider';
import PromoSlider from '@/components/PromoSlider';
import StructuredData from '@/components/StructuredData';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import FilterDrawer from '@/components/FilterDrawer';
import SearchBar from '@/components/SearchBar';
import { useCart } from '@/context/CartContext';
import { getStrapiMedia } from '@/utils/strapi';
import { cn } from '@/utils/cn';
import { generateOrganizationJsonLd, generateWebsiteJsonLd } from '@/utils/structured-data';
import { FilterState, INITIAL_FILTER_STATE, SkinType, Finish } from '@/types/filter';


interface ProductCategory {
  id: number;
  documentId: string;
  Name: string;
  slug: string;
  Description: string;
  Image?: {
    url: string;
    alternativeText?: string;
  };
  category?: {
    id: number;
    documentId: string;
    Name: string;
    slug: string;
  };
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  priceCOP?: number;
  original_price?: number;
  discount_percentage?: number;
  stock: number;
  documentId: string;
  brand?: string;
  images?: Array<{
    url: string;
    alternativeText?: string;
  }>;
  product_category?: ProductCategory;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [homeData, setHomeData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopCategory, setSelectedTopCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { dispatch, state } = useCart();

  useEffect(() => {
    fetch('/api/home')
      .then(res => res.json())
      .then(data => {
        setHomeData(data.data || null);
      })
      .catch(err => console.error('Error fetching home data:', err));

    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.data || []);
      })
      .catch(err => console.error('Error fetching products:', err));

    fetch('/api/product-categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data.data || []);
      })
      .catch(err => console.error('Error fetching categories:', err));

    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setTopCategories(data.data || []);
      })
      .catch(err => console.error('Error fetching top categories:', err));
  }, []);

  const selectedTopCategoryObj = topCategories.find(c => c.documentId === selectedTopCategory || c.id === (selectedTopCategory as any));
  const subcategoryIds = selectedTopCategoryObj?.product_categories?.map((sc: any) => sc.documentId) || [];

  const filteredCategories = selectedTopCategory
    ? selectedTopCategoryObj?.product_categories || []
    : categories;

  // Extract available filter options from products
  const availableBrands: string[] = Array.from(new Set(products.map(p => p.brand).filter((b): b is string => Boolean(b))));
  const availableSkinTypes: SkinType[] = ['normal', 'dry', 'oily', 'combination', 'sensitive'];
  const availableFinishes: Finish[] = ['matte', 'glow', 'satin', 'natural', 'shimmer'];

  // Apply filters to products
  const filteredProducts = products.filter(product => {
    // Category filter
    if (selectedCategory) {
      const productSubcatId = product.product_category?.documentId;
      const productSubcatIdNum = product.product_category?.id;
      if (productSubcatId !== selectedCategory && productSubcatIdNum !== (selectedCategory as any)) {
        return false;
      }
    }

    // Top category filter
    if (selectedTopCategory && subcategoryIds.length > 0) {
      const productSubcatId = product.product_category?.documentId;
      if (!subcategoryIds.includes(productSubcatId)) {
        return false;
      }
    }

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const productName = product.name.toLowerCase();
      const productBrand = (product.brand || '').toLowerCase();
      if (!productName.includes(query) && !productBrand.includes(query)) {
        return false;
      }
    }

    // Brand filter
    if (filters.brands.length > 0) {
      if (!filters.brands.includes(product.brand || '')) {
        return false;
      }
    }

    // Price range filter
    const productPrice = product.price || product.priceCOP || 0;
    if (productPrice < filters.priceRange.min || productPrice > filters.priceRange.max) {
      return false;
    }

    // In stock filter
    if (filters.inStockOnly && product.stock <= 0) {
      return false;
    }

    return true;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Este producto está agotado.');
      return;
    }

    const existingInCart = state.items.find(item => item.id === product.id);
    const currentQty = existingInCart?.quantity || 0;

    if (currentQty + 1 > product.stock) {
      alert(`Solo quedan ${product.stock} unidades de este producto.`);
      return;
    }

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        ...product,
        image: product.images?.[0]?.url
      }
    });
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData
        data={[
          generateOrganizationJsonLd(),
          generateWebsiteJsonLd()
        ]}
      />

      <div className="min-h-screen bg-[var(--surface-base)]">
        <div className="container mx-auto px-4 py-8 md:py-16">

          {/* Promotional Slider */}
          {homeData?.Slider && homeData.Slider.length > 0 && (
            <div className="mb-16">
              <PromoSlider items={homeData.Slider} />
            </div>
          )}

          {/* hierarchy Section: Top Level Categories Slider */}
          {topCategories.length > 0 ? (
            <div className="mb-10">
              <CategorySlider
                categories={topCategories}
                selectedCategory={selectedTopCategory}
                onSelectCategory={(id: any) => {
                  const category = topCategories.find(c => c.id === id || c.documentId === id);
                  setSelectedTopCategory(category?.documentId || null);
                  setSelectedCategory(null);
                }}
              />
            </div>
          ) : (
            /* Fallback: if no top-level categories yet, show product categories in the slider like before */
            <div className="mb-10">
              <CategorySlider
                categories={categories}
                selectedCategory={selectedCategory as any}
                onSelectCategory={(id: any) => setSelectedCategory(id as any)}
              />
            </div>
          )}

          {/* Sub-categories Section (Product Categories) - Only show if we have top categories to filter by */}
          {topCategories.length > 0 && filteredCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
                <h3 className="text-xs font-black text-[var(--text-subtle)] uppercase tracking-[0.2em] px-4">
                  {selectedTopCategory ? 'Subcategorías' : 'Todas las Subcategorías'}
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  variant={!selectedCategory ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "rounded-2xl border-none shadow-none",
                    !selectedCategory ? "bg-[var(--text-main)] text-white" : "bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--primary)]"
                  )}
                >
                  Todas
                </Button>
                {filteredCategories.map((subcat: ProductCategory) => (
                  <Button
                    key={subcat.id}
                    variant={selectedCategory === subcat.documentId || selectedCategory === subcat.id.toString() ? 'primary' : 'outline'}
                    size="md"
                    onClick={() => setSelectedCategory(subcat.documentId)}
                    className={cn(
                      "rounded-2xl border-none shadow-none",
                      selectedCategory === subcat.documentId || selectedCategory === subcat.id.toString()
                        ? ""
                        : "bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--primary)]"
                    )}
                  >
                    {subcat.Name}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Products Section */}
          <div className="space-y-12">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                <div className="space-y-2">
                  <h2 className="text-4xl font-extrabold text-[var(--text-main)] tracking-tight">
                    {selectedCategory
                      ? `Productos en ${categories.find(c => c.documentId === selectedCategory || c.id === (selectedCategory as any))?.Name}`
                      : selectedTopCategory
                        ? `Todo en ${topCategories.find(c => c.documentId === selectedTopCategory || c.id === (selectedTopCategory as any))?.Name}`
                        : "Explora Nuestra Colección"
                    }
                  </h2>
                  <p className="text-[var(--text-muted)] font-medium text-lg">Belleza, salud y bienestar en cada detalle</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Mobile Search */}
                  <div className="md:hidden w-full">
                    <SearchBar onSearch={(query) => setFilters({ ...filters, searchQuery: query })} />
                  </div>
                  {/* Filter Trigger */}
                  <button
                    onClick={() => setIsFilterDrawerOpen(true)}
                    className="touch-target flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--primary)] transition-colors"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="text-sm font-medium">Filtros</span>
                  </button>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-20 bg-[var(--surface-card)] rounded-[2.5rem] border border-[var(--border-subtle)]">
                  <Package className="w-16 h-16 text-[var(--text-subtle)] mx-auto mb-4" />
                  <p className="text-[var(--text-muted)] text-xl font-medium">No hay productos disponibles por ahora</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="group h-full flex flex-col hover:shadow-2xl hover:shadow-brand-primary/10 hover:-translate-y-2 duration-500 border-none rounded-[2.5rem]">
                        {product.images?.[0] && (
                          <div className="h-72 overflow-hidden relative">
                            <Link href={`/product/${product.documentId}`}>
                              <Image
                                fill
                                src={getStrapiMedia(product.images[0].url) || ''}
                                alt={product.images[0].alternativeText || product.name}
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                            </Link>
                            <div className="absolute top-5 left-5 flex flex-col gap-2">
                              {/* Top Category Badge */}
                              {product.product_category?.category && (
                                <span className="bg-[var(--text-main)]/90 backdrop-blur px-3 py-1 rounded-xl text-[10px] font-black text-white shadow-sm uppercase tracking-widest w-fit">
                                  {product.product_category.category.Name}
                                </span>
                              )}
                              {/* Subcategory Badge */}
                              <span className="bg-[var(--surface-card)]/90 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-extrabold text-[var(--primary)] border border-[var(--secondary)]/30 shadow-sm uppercase tracking-wider w-fit">
                                {product.product_category?.Name}
                              </span>
                            </div>

                            {/* Discount Badge */}
                            {product.discount_percentage && product.discount_percentage > 0 && (
                              <div className="absolute top-5 right-5">
                                <span className="bg-[var(--primary)] text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-xl shadow-[var(--primary)]/20 animate-pulse">
                                  -{product.discount_percentage}%
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-8 flex-1 flex flex-col">
                          <div className="flex flex-col mb-6">
                            <Link href={`/product/${product.documentId}`}>
                              <h3 className="text-2xl font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors mb-3 line-clamp-1 leading-tight">
                                {product.name}
                              </h3>
                            </Link>
                            <p className="text-[var(--text-muted)] text-sm line-clamp-2 leading-relaxed h-10">
                              {product.description}
                            </p>
                          </div>

                          <div className="mt-auto pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between">
                            <div className="flex flex-col">
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-[var(--primary)]">
                                  {new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    maximumFractionDigits: 0,
                                  }).format(product.price)}
                                </span>
                                {product.original_price && product.original_price > product.price && (
                                  <span className="text-sm text-[var(--text-subtle)] line-through">
                                    {new Intl.NumberFormat('es-CO', {
                                      style: 'currency',
                                      currency: 'COP',
                                      maximumFractionDigits: 0,
                                    }).format(product.original_price)}
                                  </span>
                                )}
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-[0.1em] mt-1",
                                product.stock > 10 ? "text-emerald-500" : product.stock > 0 ? "text-amber-500" : "text-red-500"
                              )}>
                                {product.stock > 0 ? `${product.stock} disponibles` : "Agotado"}
                              </span>
                            </div>

                            <Button
                              variant={product.stock > 0 ? 'primary' : 'danger'}
                              size="icon"
                              onClick={() => addToCart(product)}
                              disabled={product.stock <= 0}
                              className="w-12 h-12 rounded-2xl shadow-brand-primary/20"
                              title={product.stock > 0 ? "Añadir al carrito" : "Producto agotado"}
                            >
                              {product.stock > 0 ? (
                                <Plus className="w-6 h-6" />
                              ) : (
                                <X className="w-6 h-6" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        availableBrands={availableBrands}
        availableSkinTypes={availableSkinTypes}
        availableFinishes={availableFinishes}
      />
    </>
  );
}
