export async function GET() {
  const BASE_URL = (process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337').replace(/\/$/, '');
  try {
    const response = await fetch(`${BASE_URL}/api/product-categories?populate[Image][fields]=url,alternativeText&populate[category][fields]=id,Name,slug`);
    if (!response.ok) {
      throw new Error('Failed to fetch from Strapi');
    }
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Response.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}