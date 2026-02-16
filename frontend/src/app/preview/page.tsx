import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getStrapiMedia } from '@/utils/strapi';

interface PreviewPageProps {
  searchParams: Promise<{
    documentId?: string;
    locale?: string;
    status?: string;
    token?: string;
  }>;
}

export default async function PreviewPage({ searchParams }: PreviewPageProps) {
  const awaitedSearchParams = await searchParams;
  const { documentId, locale = 'en', status = 'published', token } = awaitedSearchParams;

  if (!documentId) {
    return notFound();
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Fetch content from Strapi
    const homeResponse = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/home?locale=${locale}&status=${status}&populate=Cover`,
      {
        headers,
        cache: 'no-store',
      }
    );

    let homeData;
    if (homeResponse.ok) {
      homeData = await homeResponse.json();
    } else {
      // Use default data if home content doesn't exist
      homeData = {
        data: {
          Title: "Welcome to Prana Market",
          Description: "Discover fresh organic products from local farmers",
          Cover: null
        }
      };
    }

    // Fetch products
    const productsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/products?locale=${locale}&status=${status}&populate[category][populate]=Image&populate=image`,
      {
        headers,
        cache: 'no-store',
      }
    );

    const productsData = productsResponse.ok ? await productsResponse.json() : { data: [] };

    // Fetch categories
    const categoriesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/product-categories?locale=${locale}&status=${status}&populate=Image`,
      {
        headers,
        cache: 'no-store',
      }
    );

    const categoriesData = categoriesResponse.ok ? await categoriesResponse.json() : { data: [] };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Preview Banner */}
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Preview Mode</strong> - Viewing content with status: {status}
                </p>
              </div>
            </div>
          </div>

          {/* Home Content */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {homeData.data?.Title || 'Home Title'}
            </h1>
            <div className="prose max-w-none">
              {homeData.data?.Description?.map((block: { __component: string; body: string; title?: string }, index: number) => (
                <div key={index}>
                  {block.__component === 'shared.rich-text' && (
                    <div dangerouslySetInnerHTML={{ __html: block.body }} />
                  )}
                  {block.__component === 'shared.quote' && (
                    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
                      <p>{block.body}</p>
                      {block.title && <cite className="text-sm">— {block.title}</cite>}
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
            {homeData.data?.Cover && (
              <div className="mt-6 relative w-full h-64">
                <Image
                  fill
                  src={getStrapiMedia(homeData.data.Cover.url) || ''}
                  alt={homeData.data.Cover.alternativeText || 'Cover image'}
                  className="object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Categories */}
          {categoriesData.data?.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoriesData.data.map((category: { id: number; Image?: { url: string; alternativeText?: string }; Name: string; Description: string }) => (
                  <div key={category.id} className="border rounded-lg p-4">
                    {category.Image && (
                       <div className="relative w-full h-32 mb-4">
                         <Image
                           fill
                           src={getStrapiMedia(category.Image.url) || ''}
                           alt={category.Image.alternativeText || category.Name}
                           className="object-cover rounded"
                         />
                       </div>
                     )}
                    <h3 className="text-lg font-semibold text-gray-900">{category.Name}</h3>
                    <p className="text-gray-600 mt-2">{category.Description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Products</h2>
            {productsData.data?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsData.data.map((product: { id: number; image?: { url: string; alternativeText?: string }; name: string; description: string; price: number }) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    {product.image && (
                       <div className="relative w-full h-48 mb-4">
                         <Image
                           fill
                           src={getStrapiMedia(product.image.url) || ''}
                           alt={product.image.alternativeText || product.name}
                           className="object-cover rounded"
                         />
                       </div>
                     )}
                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-gray-600 mt-2">{product.description}</p>
                    <p className="text-lg font-bold text-green-600 mt-2">${product.price}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No products available.</p>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Preview error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Preview Error</h1>
          <p className="text-gray-600">Unable to load preview content.</p>
          <p className="text-sm text-gray-500 mt-2">Make sure Strapi is running on port 1337</p>
        </div>
      </div>
    );
  }
}