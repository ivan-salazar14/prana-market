import { notFound } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';
import { Product } from '@/types/product';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

async function getProductsByCategory(slug: string): Promise<Product[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
    const response = await fetch(`${baseUrl}/api/products?filters[category][slug][$eq]=${slug}&populate=*`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();
    
    // Transform Strapi data to our Product type
    return (data.data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      shortDescription: item.shortDescription,
      brand: item.brand || 'Prana Market',
      category: item.category?.Name || item.category?.slug || slug,
      subcategory: item.subcategory?.Name,
      sourcingType: item.sourcingType || 'local',
      images: item.images?.map((img: any) => img.url) || [],
      thumbnail: item.thumbnail?.url || item.images?.[0]?.url,
      variants: item.variants || [],
      defaultVariantId: item.defaultVariantId,
      priceCOP: item.price || item.priceCOP || 0,
      compareAtPriceCOP: item.original_price || item.compareAtPriceCOP,
      isFeatured: item.isFeatured || false,
      isNew: item.isNew || false,
      isOnSale: item.discount_percentage && item.discount_percentage > 0,
      tags: item.tags,
      ingredients: item.ingredients,
      usageGuide: item.usageGuide,
    }));
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

async function getCategoryInfo(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
    const response = await fetch(`${baseUrl}/api/product-categories?filters[slug][$eq]=${slug}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Error fetching category info:', error);
    return null;
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = params;
  const products = await getProductsByCategory(slug);
  const category = await getCategoryInfo(slug);

  if (!category && products.length === 0) {
    notFound();
  }

  const categoryName = category?.Name || category?.name || slug;
  const categoryDescription = category?.Description || category?.description;

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Category Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-text-main mb-4">
            {categoryName}
          </h1>
          {categoryDescription && (
            <p className="text-lg text-text-muted max-w-2xl">
              {categoryDescription}
            </p>
          )}
        </div>

        {/* Products Grid */}
        <ProductGrid products={products} />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = params;
  const category = await getCategoryInfo(slug);
  const categoryName = category?.Name || category?.name || slug;

  return {
    title: `${categoryName} | Prana Market`,
    description: category?.Description || category?.description || `Explora nuestra colección de ${categoryName}`,
  };
}
