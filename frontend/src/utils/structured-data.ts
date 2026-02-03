/**
 * Structured Data (JSON-LD) utilities for SEO
 * These help search engines understand your content better
 */

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    images?: Array<{
        url: string;
        alternativeText?: string;
    }>;
    product_category?: {
        Name: string;
    };
}

/**
 * Generate Product structured data for rich search results
 */
export function generateProductJsonLd(product: Product, productUrl: string) {
    const imageUrl = product.images?.[0]?.url
        ? (product.images[0].url.startsWith('http')
            ? product.images[0].url
            : `${process.env.NEXT_PUBLIC_BACKEND_URL}${product.images[0].url}`)
        : '';

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: imageUrl,
        brand: {
            '@type': 'Brand',
            name: 'Prana Make up',
        },
        offers: {
            '@type': 'Offer',
            url: productUrl,
            priceCurrency: 'COP',
            price: product.price,
            availability: product.stock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
        },
        category: product.product_category?.Name || 'Cosméticos',
    };
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationJsonLd() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Prana Make up',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'https://prana-market-production.up.railway.app',
        logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://prana-market-production.up.railway.app'}/logo.png`,
        description: 'Tienda de maquillaje y cosméticos de alta calidad en Colombia',
        address: {
            '@type': 'PostalAddress',
            addressCountry: 'CO',
        },
        sameAs: [
            // Add your social media profiles here
            // 'https://www.facebook.com/pranamakeup',
            // 'https://www.instagram.com/pranamakeup',
            // 'https://twitter.com/pranamakeup',
        ],
    };
}

/**
 * Generate WebSite structured data with search functionality
 */
export function generateWebsiteJsonLd() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prana-market-production.up.railway.app';

    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Prana Make up',
        url: siteUrl,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${siteUrl}/?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/**
 * Generate ItemList structured data for product listings
 */
export function generateProductListJsonLd(products: Product[], listUrl: string) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        url: listUrl,
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'Product',
                name: product.name,
                description: product.description,
                image: product.images?.[0]?.url || '',
                offers: {
                    '@type': 'Offer',
                    price: product.price,
                    priceCurrency: 'COP',
                    availability: product.stock > 0
                        ? 'https://schema.org/InStock'
                        : 'https://schema.org/OutOfStock',
                },
            },
        })),
    };
}
