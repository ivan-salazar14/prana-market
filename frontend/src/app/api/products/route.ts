export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/products?populate[image][fields]=url,alternativeText`);
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