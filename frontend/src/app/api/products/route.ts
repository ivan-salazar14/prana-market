export async function GET() {
  const BASE_URL = (process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337').replace(/\/$/, '');
  try {
    const response = await fetch(`${BASE_URL}/api/products?populate[images][fields]=url,alternativeText&populate[product_category][fields]=Name,slug,Description`);
    if (!response.ok) {
      throw new Error('Failed to fetch from Strapi');
    }
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    return Response.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}