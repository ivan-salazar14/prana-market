import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pranamarket.store';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://prana-market-production.up.railway.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    try {
        // Fetch all products
        const productsRes = await fetch(`${BACKEND_URL}/api/products?populate=*`, {
            next: { revalidate: 3600 } // Revalidate every hour
        });
        const productsData = await productsRes.json();
        const products = productsData.data || [];

        // Fetch all categories
        const categoriesRes = await fetch(`${BACKEND_URL}/api/categories?populate=*`, {
            next: { revalidate: 3600 }
        });
        const categoriesData = await categoriesRes.json();
        const categories = categoriesData.data || [];

        // Static pages
        const staticPages: MetadataRoute.Sitemap = [
            {
                url: SITE_URL,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1,
            },
        ];

        // Product pages
        const productPages: MetadataRoute.Sitemap = products.map((product: any) => ({
            url: `${SITE_URL}/product/${product.documentId}`,
            lastModified: new Date(product.updatedAt || product.createdAt),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));

        // Category pages (if you have category-specific pages)
        const categoryPages: MetadataRoute.Sitemap = categories.map((category: any) => ({
            url: `${SITE_URL}/?category=${category.documentId}`,
            lastModified: new Date(category.updatedAt || category.createdAt),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }));

        return [...staticPages, ...productPages, ...categoryPages];
    } catch (error) {
        console.error('Error generating sitemap:', error);
        // Return at least the homepage if there's an error
        return [
            {
                url: SITE_URL,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1,
            },
        ];
    }
}
